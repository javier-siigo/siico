/**
 * Lector en streaming del "Informe Diferido" (.xlsx).
 *
 * El archivo mensual pesa ~170 MB comprimido (~800 MB de XML y 700k+ filas),
 * demasiado para cargarlo completo con la librería `xlsx`. Aquí se recorre el
 * zip con `DecompressionStream` y se procesan las filas por bloques.
 *
 * Reglas (validadas contra "Reconocimiento gasto de comisiones 2026"):
 * - Una línea es base para comisión si su DOC ORIGEN es F93 o F94. Así entran
 *   las facturas, sus notas crédito y los asientos de ajuste sobre ellas.
 * - La cohorte es el mes de FECHAFACTURA.
 * - El ingreso reconocido en el mes es la suma de CUOTA.
 *
 * No depende del DOM: corre en un Web Worker y también en Node (scripts).
 */

import {
  PREFIJOS_COMISION,
  type DocumentoDiferido,
  type IngresoCohorte,
  type LineaDiferida,
  type LineasExcluidas,
  type PrefijoComision,
  type ResultadoArchivo,
  type TipoDocumento,
} from "./types";

export type FaseLectura = "abriendo" | "textos" | "filas" | "agrupando";

export interface ProgresoLectura {
  fase: FaseLectura;
  /** 0..1 dentro de la fase. */
  fraccion: number;
  lineas: number;
}

// ---------------------------------------------------------------------------
// Zip

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

async function view(file: Blob, start: number, end: number): Promise<DataView> {
  return new DataView(await file.slice(start, end).arrayBuffer());
}

async function listZipEntries(file: Blob): Promise<Map<string, ZipEntry>> {
  const tailLen = Math.min(file.size, 65_557 + 20);
  const tailStart = file.size - tailLen;
  const tail = await view(file, tailStart, file.size);

  let eocd = -1;
  for (let i = tail.byteLength - 22; i >= 0; i -= 1) {
    if (tail.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error("El archivo no es un Excel (.xlsx) válido.");
  }

  let count = tail.getUint16(eocd + 10, true);
  let cdSize = tail.getUint32(eocd + 12, true);
  let cdOffset = tail.getUint32(eocd + 16, true);

  const locator = eocd - 20;
  if (
    (cdOffset === 0xffffffff || cdSize === 0xffffffff || count === 0xffff) &&
    locator >= 0 &&
    tail.getUint32(locator, true) === 0x07064b50
  ) {
    const z64Offset = Number(tail.getBigUint64(locator + 8, true));
    const z64 = await view(file, z64Offset, z64Offset + 56);
    count = Number(z64.getBigUint64(32, true));
    cdSize = Number(z64.getBigUint64(40, true));
    cdOffset = Number(z64.getBigUint64(48, true));
  }

  const cd = await view(file, cdOffset, cdOffset + cdSize);
  const decoder = new TextDecoder();
  const entries = new Map<string, ZipEntry>();
  let p = 0;
  for (let n = 0; n < count && p + 46 <= cd.byteLength; n += 1) {
    if (cd.getUint32(p, true) !== 0x02014b50) break;
    const method = cd.getUint16(p + 10, true);
    let compressedSize = cd.getUint32(p + 20, true);
    let uncompressedSize = cd.getUint32(p + 24, true);
    const nameLen = cd.getUint16(p + 28, true);
    const extraLen = cd.getUint16(p + 30, true);
    const commentLen = cd.getUint16(p + 32, true);
    let localHeaderOffset = cd.getUint32(p + 42, true);
    const name = decoder.decode(
      new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen),
    );

    // Campo extra ZIP64 (0x0001): trae los valores que no caben en 32 bits.
    let e = p + 46 + nameLen;
    const extraEnd = e + extraLen;
    while (e + 4 <= extraEnd) {
      const id = cd.getUint16(e, true);
      const size = cd.getUint16(e + 2, true);
      if (id === 0x0001) {
        let q = e + 4;
        if (uncompressedSize === 0xffffffff) {
          uncompressedSize = Number(cd.getBigUint64(q, true));
          q += 8;
        }
        if (compressedSize === 0xffffffff) {
          compressedSize = Number(cd.getBigUint64(q, true));
          q += 8;
        }
        if (localHeaderOffset === 0xffffffff) {
          localHeaderOffset = Number(cd.getBigUint64(q, true));
        }
      }
      e += 4 + size;
    }

    entries.set(name, {
      name,
      method,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function entryTextStream(
  file: Blob,
  entry: ZipEntry,
  onBytes?: (read: number) => void,
): Promise<ReadableStream<string>> {
  const lh = await view(
    file,
    entry.localHeaderOffset,
    entry.localHeaderOffset + 30,
  );
  if (lh.getUint32(0, true) !== 0x04034b50) {
    throw new Error(`No se pudo leer ${entry.name} dentro del Excel.`);
  }
  const start =
    entry.localHeaderOffset + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);

  let read = 0;
  const counter = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      read += chunk.byteLength;
      onBytes?.(read);
      controller.enqueue(chunk);
    },
  });

  const raw = file
    .slice(start, start + entry.compressedSize)
    .stream()
    .pipeThrough(counter);

  let bytes: ReadableStream<Uint8Array>;
  if (entry.method === 8) {
    bytes = raw.pipeThrough(
      new DecompressionStream("deflate-raw") as unknown as TransformStream<
        Uint8Array,
        Uint8Array
      >,
    );
  } else if (entry.method === 0) {
    bytes = raw;
  } else {
    throw new Error(
      `Compresión no soportada (${entry.method}) en ${entry.name}.`,
    );
  }
  return bytes.pipeThrough(
    new TextDecoderStream() as unknown as TransformStream<Uint8Array, string>,
  );
}

async function readEntryText(file: Blob, entry: ZipEntry): Promise<string> {
  const stream = await entryTextStream(file, entry);
  let out = "";
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += value;
  }
  return out;
}

/**
 * Recorre el stream entregando bloques que terminan siempre en `closeTag`,
 * para que ningún elemento quede partido entre dos bloques.
 */
async function forEachBlock(
  stream: ReadableStream<string>,
  closeTag: string,
  onBlock: (block: string) => boolean | void,
): Promise<void> {
  const reader = stream.getReader();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += value;
    const idx = buf.lastIndexOf(closeTag);
    if (idx < 0) continue;
    const cut = idx + closeTag.length;
    const stop = onBlock(buf.slice(0, cut));
    buf = buf.slice(cut);
    if (stop === false) {
      await reader.cancel();
      return;
    }
  }
  if (buf) onBlock(buf);
}

// ---------------------------------------------------------------------------
// XML helpers

const ENTITY_RE = /&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g;

function decodeXml(s: string): string {
  if (s.indexOf("&") < 0) return s;
  return s.replace(ENTITY_RE, (_, e: string) => {
    switch (e) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return '"';
      case "apos":
        return "'";
      default:
        return String.fromCodePoint(
          e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10),
        );
    }
  });
}

const SI_RE = /<si>([\s\S]*?)<\/si>|<si\/>/g;
const T_RE = /<t(?:\s[^>]*)?>([^<]*)<\/t>/g;
const RPH_RE = /<rPh\b[\s\S]*?<\/rPh>/g;

function parseSharedStrings(block: string, out: string[]): void {
  SI_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SI_RE.exec(block)) !== null) {
    let inner = m[1];
    if (inner === undefined) {
      out.push("");
      continue;
    }
    if (inner.indexOf("<rPh") >= 0) inner = inner.replace(RPH_RE, "");
    T_RE.lastIndex = 0;
    let text = "";
    let t: RegExpExecArray | null;
    while ((t = T_RE.exec(inner)) !== null) text += t[1];
    out.push(decodeXml(text));
  }
}

const ROW_RE = /<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g;
const CELL_RE = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
const V_RE = /<v>([^<]*)<\/v>/;

function colIndex(attrs: string): number {
  const i = attrs.indexOf(' r="');
  if (i < 0) return -1;
  let n = 0;
  for (let k = i + 4; k < attrs.length; k += 1) {
    const c = attrs.charCodeAt(k);
    if (c < 65 || c > 90) break;
    n = n * 26 + (c - 64);
  }
  return n - 1;
}

function cellType(attrs: string): string {
  const i = attrs.indexOf(' t="');
  if (i < 0) return "n";
  return attrs.slice(i + 4, attrs.indexOf('"', i + 4));
}

function parseRow(
  inner: string,
  strings: string[],
  maxCol: number,
): (string | undefined)[] {
  const vals: (string | undefined)[] = [];
  CELL_RE.lastIndex = 0;
  let pos = 0;
  let m: RegExpExecArray | null;
  while ((m = CELL_RE.exec(inner)) !== null) {
    const attrs = m[1] ?? "";
    const ci = colIndex(attrs);
    const col = ci >= 0 ? ci : pos;
    pos = col + 1;
    if (col > maxCol) break;
    const content = m[2];
    if (!content) continue;
    const t = cellType(attrs);
    if (t === "inlineStr") {
      T_RE.lastIndex = 0;
      let text = "";
      let tm: RegExpExecArray | null;
      while ((tm = T_RE.exec(content)) !== null) text += tm[1];
      vals[col] = decodeXml(text);
      continue;
    }
    const v = V_RE.exec(content)?.[1];
    if (v === undefined) continue;
    vals[col] = t === "s" ? strings[Number(v)] : t === "str" ? decodeXml(v) : v;
  }
  return vals;
}

// ---------------------------------------------------------------------------
// Columnas

function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9%]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const COLUMNAS = {
  numero: ["NO_COMPROBANTE"],
  origen: ["DOC_ORIGEN"],
  tipo: ["TIPO_COMPROBANTE"],
  total: ["TOTAL"],
  cuota: ["CUOTA"],
  reconocido: ["RECONOCIDO"],
  pendiente: ["PENDIENTE_POR_DIFERIR"],
  veces: ["VECES"],
  producto: ["PRODUCTO"],
  cuenta: ["CTA_INGRESO"],
  cantidad: ["CANTIDAD"],
  nit: ["NIT"],
  fechaFactura: ["FECHAFACTURA", "FECHA_FACTURA"],
  inicio: ["FECHA_DE_INICIO_DE_RECONOCIMIENTO_DE_INGRESOS"],
  fin: ["FECHA_DE_FINALIZACION_DE_RECONOCIMIENTO_DE_INGRESOS"],
  fechaDiferido: ["FECHA_DIFERIDO"],
} as const;

type Campo = keyof typeof COLUMNAS;
const REQUERIDAS: Campo[] = [
  "numero",
  "total",
  "cuota",
  "reconocido",
  "pendiente",
  "veces",
  "fechaFactura",
];

const NOMBRE_VISIBLE: Record<Campo, string> = {
  numero: "NO COMPROBANTE",
  origen: "DOC ORIGEN",
  tipo: "TIPO COMPROBANTE",
  total: "TOTAL",
  cuota: "CUOTA",
  reconocido: "RECONOCIDO_",
  pendiente: "PENDIENTE_POR_DIFERIR",
  veces: "VECES",
  producto: "PRODUCTO",
  cuenta: "CTA_INGRESO",
  cantidad: "CANTIDAD",
  nit: "NIT",
  fechaFactura: "FECHAFACTURA",
  inicio: "FECHA_DE_INICIO_DE_RECONOCIMIENTO_DE_INGRESOS",
  fin: "FECHA_DE_FINALIZACIÓN_DE_RECONOCIMIENTO_DE_INGRESOS",
  fechaDiferido: "FECHA_DIFERIDO",
};

function mapHeader(row: (string | undefined)[]): Partial<Record<Campo, number>> {
  const byName = new Map<string, number>();
  row.forEach((v, i) => {
    if (v) byName.set(normalizeHeader(v), i);
  });
  const map: Partial<Record<Campo, number>> = {};
  for (const campo of Object.keys(COLUMNAS) as Campo[]) {
    for (const alias of COLUMNAS[campo]) {
      const idx = byName.get(alias);
      if (idx !== undefined) {
        map[campo] = idx;
        break;
      }
    }
  }
  return map;
}

function num(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Valor del Excel a centavos enteros, para sumar sin error de redondeo. */
function centavos(v: string | undefined): number {
  return Math.round(num(v) * 100);
}

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

function toIsoDate(v: string | undefined): string | null {
  if (!v) return null;
  const n = Number(v);
  if (Number.isFinite(n) && n > 0) {
    return new Date(EXCEL_EPOCH + Math.round(n) * 86_400_000)
      .toISOString()
      .slice(0, 10);
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function prefijoDe(numero: string): string {
  const m = /^[A-Za-z]+\d{0,2}/.exec(numero);
  return (m ? m[0] : numero.slice(0, 3)).toUpperCase() || "(vacío)";
}

function tipoDe(tipo: string | undefined, numero: string, origen: string): TipoDocumento {
  const t = (tipo ?? "").toUpperCase();
  if (t.includes("NOTA")) return "nota-credito";
  if (t.includes("ASIENTO")) return "ajuste";
  if (t.includes("FACTURA")) return "factura";
  if (numero === origen) return "factura";
  return /^\d+$/.test(numero) ? "ajuste" : "nota-credito";
}

// ---------------------------------------------------------------------------
// Hoja

async function findDataSheet(
  file: Blob,
  entries: Map<string, ZipEntry>,
): Promise<ZipEntry> {
  const sheets = [...entries.values()].filter((e) =>
    /^xl\/worksheets\/[^/]+\.xml$/.test(e.name),
  );
  if (sheets.length === 0) {
    throw new Error("El Excel no tiene hojas.");
  }

  const wb = entries.get("xl/workbook.xml");
  const rels = entries.get("xl/_rels/workbook.xml.rels");
  if (wb && rels) {
    const [wbXml, relsXml] = await Promise.all([
      readEntryText(file, wb),
      readEntryText(file, rels),
    ]);
    const targets = new Map<string, string>();
    for (const m of relsXml.matchAll(/<Relationship\b[^>]*>/g)) {
      const id = /\bId="([^"]+)"/.exec(m[0])?.[1];
      const target = /\bTarget="([^"]+)"/.exec(m[0])?.[1];
      if (id && target) targets.set(id, target.replace(/^\/?xl\//, ""));
    }
    for (const m of wbXml.matchAll(/<sheet\b[^>]*>/g)) {
      const name = decodeXml(/\bname="([^"]+)"/.exec(m[0])?.[1] ?? "");
      const rid = /\br:id="([^"]+)"/.exec(m[0])?.[1];
      if (normalizeHeader(name) !== "BASE_ACTUAL" || !rid) continue;
      const entry = entries.get(`xl/${targets.get(rid)}`);
      if (entry) return entry;
    }
  }

  // Sin hoja "Base Actual": la hoja de datos es la más grande.
  return sheets.reduce((a, b) =>
    b.uncompressedSize > a.uncompressedSize ? b : a,
  );
}

// ---------------------------------------------------------------------------

interface DocumentoAcc extends DocumentoDiferido {
  vecesSet: Set<number>;
}

interface IngresoAcc {
  cohorte: string;
  prefijo: PrefijoComision;
  ingreso: number;
  pendiente: number;
  lineas: number;
  factura: number;
  "nota-credito": number;
  ajuste: number;
}

export async function leerInformeDiferido(
  file: Blob & { name?: string },
  onProgress?: (p: ProgresoLectura) => void,
): Promise<ResultadoArchivo> {
  const t0 = Date.now();
  onProgress?.({ fase: "abriendo", fraccion: 0, lineas: 0 });

  const entries = await listZipEntries(file);
  const sheet = await findDataSheet(file, entries);

  // 1. Textos compartidos
  const strings: string[] = [];
  const sst = entries.get("xl/sharedStrings.xml");
  if (sst) {
    const stream = await entryTextStream(file, sst, (read) =>
      onProgress?.({
        fase: "textos",
        fraccion: read / Math.max(1, sst.compressedSize),
        lineas: 0,
      }),
    );
    await forEachBlock(stream, "</si>", (block) => {
      parseSharedStrings(block, strings);
    });
  }

  // 2. Filas
  let header: Partial<Record<Campo, number>> | null = null;
  let usaDocOrigen = false;
  let maxCol = Number.MAX_SAFE_INTEGER;
  let rowsSeen = 0;
  let lineas = 0;
  const periodosDiferido = new Set<string>();
  let descuadresSaldo = 0;
  const sinFecha = { lineas: 0, cuota: 0 };
  const documentos = new Map<string, DocumentoAcc>();
  const ingresos = new Map<string, IngresoAcc>();
  const excluidas = new Map<string, LineasExcluidas>();
  let lastReport = 0;
  let bytesRead = 0;

  const stream = await entryTextStream(file, sheet, (read) => {
    bytesRead = read;
  });

  await forEachBlock(stream, "</row>", (block) => {
    ROW_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = ROW_RE.exec(block)) !== null) {
      rowsSeen += 1;
      const inner = m[1];
      if (!inner) continue;
      const vals = parseRow(inner, strings, maxCol);

      if (!header) {
        const mapped = mapHeader(vals);
        if (mapped.numero !== undefined) {
          const faltantes = REQUERIDAS.filter((c) => mapped[c] === undefined);
          if (faltantes.length > 0) {
            throw new Error(
              `Faltan columnas en el archivo: ${faltantes.map((c) => NOMBRE_VISIBLE[c]).join(", ")}.`,
            );
          }
          header = mapped;
          usaDocOrigen = mapped.origen !== undefined;
          maxCol = Math.max(
            ...Object.values(mapped).filter((v): v is number => v !== undefined),
          );
        } else if (rowsSeen > 20) {
          throw new Error(
            "No se encontró la fila de encabezados (columna NO COMPROBANTE) en las primeras 20 filas.",
          );
        }
        continue;
      }

      const h = header;
      const numero = (vals[h.numero!] ?? "").trim();
      const origen =
        (h.origen !== undefined ? (vals[h.origen] ?? "").trim() : "") || numero;
      if (!origen) continue;
      const cuotaCent = centavos(vals[h.cuota!]);

      const origenUp = origen.toUpperCase();
      const prefijo = PREFIJOS_COMISION.find((p) => origenUp.startsWith(p));
      if (!prefijo) {
        const pre = prefijoDe(origen);
        const ex = excluidas.get(pre) ?? { prefijo: pre, lineas: 0, cuota: 0 };
        ex.lineas += 1;
        ex.cuota += cuotaCent;
        excluidas.set(pre, ex);
        continue;
      }

      if (h.fechaDiferido !== undefined) {
        const fd = toIsoDate(vals[h.fechaDiferido])?.slice(0, 7);
        if (fd) periodosDiferido.add(fd);
      }

      const fechaFactura = toIsoDate(vals[h.fechaFactura!]);
      if (!fechaFactura) {
        sinFecha.lineas += 1;
        sinFecha.cuota += cuotaCent;
        continue;
      }
      const cohorte = fechaFactura.slice(0, 7);

      lineas += 1;
      const total = num(vals[h.total!]);
      const cuota = cuotaCent / 100;
      const reconocido = num(vals[h.reconocido!]);
      const pendiente = num(vals[h.pendiente!]);
      const veces = num(vals[h.veces!]);
      if (Math.abs(reconocido + pendiente - total) > 1) descuadresSaldo += 1;

      const tipo = tipoDe(
        h.tipo !== undefined ? vals[h.tipo] : undefined,
        numero,
        origen,
      );

      const ik = `${cohorte}|${prefijo}`;
      const ing = ingresos.get(ik) ?? {
        cohorte,
        prefijo,
        ingreso: 0,
        pendiente: 0,
        lineas: 0,
        factura: 0,
        "nota-credito": 0,
        ajuste: 0,
      };
      ing.ingreso += cuotaCent;
      ing.pendiente += Math.round(pendiente * 100);
      ing.lineas += 1;
      ing[tipo] += cuotaCent;
      ingresos.set(ik, ing);

      const linea: LineaDiferida = {
        producto: h.producto !== undefined ? (vals[h.producto] ?? "") : "",
        cuenta: h.cuenta !== undefined ? (vals[h.cuenta] ?? "") : "",
        cantidad: h.cantidad !== undefined ? num(vals[h.cantidad]) : 0,
        total,
        cuota,
        veces,
        reconocido,
        pendiente,
      };

      const dk = `${numero}|${origen}`;
      let d = documentos.get(dk);
      if (!d) {
        d = {
          numero: numero || origen,
          origen,
          tipo,
          prefijo,
          cohorte,
          nit: h.nit !== undefined ? (vals[h.nit] ?? "") : "",
          fechaFactura,
          inicio: h.inicio !== undefined ? toIsoDate(vals[h.inicio]) : null,
          fin: h.fin !== undefined ? toIsoDate(vals[h.fin]) : null,
          veces: 0,
          plazoMixto: false,
          total: 0,
          cuota: 0,
          reconocido: 0,
          pendiente: 0,
          lineas: [],
          vecesSet: new Set(),
        };
        documentos.set(dk, d);
      } else if (h.fin !== undefined) {
        const fin = toIsoDate(vals[h.fin]);
        if (fin && (!d.fin || fin > d.fin)) d.fin = fin;
      }
      d.total += total;
      d.cuota += cuota;
      d.reconocido += reconocido;
      d.pendiente += pendiente;
      d.vecesSet.add(veces);
      d.lineas.push(linea);
    }

    const now = Date.now();
    if (now - lastReport > 150) {
      lastReport = now;
      onProgress?.({
        fase: "filas",
        fraccion: bytesRead / Math.max(1, sheet.compressedSize),
        lineas,
      });
    }
  });

  if (!header) {
    throw new Error(
      "No se encontró la fila de encabezados (columna NO COMPROBANTE).",
    );
  }

  onProgress?.({ fase: "agrupando", fraccion: 1, lineas });

  const lista: DocumentoDiferido[] = [];
  for (const acc of documentos.values()) {
    const { vecesSet, ...d } = acc;
    d.veces = Math.max(...vecesSet);
    d.plazoMixto = vecesSet.size > 1;
    // Sumas de CUOTA redondeadas al centavo para que cuadren con el ingreso.
    d.cuota = Math.round(d.cuota * 100) / 100;
    lista.push(d);
  }

  const listaIngresos: IngresoCohorte[] = [...ingresos.values()]
    .map((i) => ({
      cohorte: i.cohorte,
      prefijo: i.prefijo,
      ingreso: i.ingreso / 100,
      pendiente: i.pendiente / 100,
      lineas: i.lineas,
      facturas: i.factura / 100,
      notasCredito: i["nota-credito"] / 100,
      ajustes: i.ajuste / 100,
    }))
    .sort((a, b) => a.cohorte.localeCompare(b.cohorte) || a.prefijo.localeCompare(b.prefijo));

  const periodos = [...periodosDiferido].sort();
  return {
    archivoNombre: file.name ?? "archivo.xlsx",
    archivoTamano: file.size,
    periodoDetectado: periodos[periodos.length - 1] ?? null,
    periodosMezclados: periodos.length > 1,
    lineasLeidas: rowsSeen,
    usaDocOrigen,
    ingresos: listaIngresos,
    documentos: lista,
    excluidas: [...excluidas.values()]
      .map((e) => ({ ...e, cuota: e.cuota / 100 }))
      .sort((a, b) => b.lineas - a.lineas),
    sinFecha: { lineas: sinFecha.lineas, cuota: sinFecha.cuota / 100 },
    descuadresSaldo,
    duracionMs: Date.now() - t0,
  };
}
