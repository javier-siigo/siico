import "server-only";

import { randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ExcelJS from "exceljs";

import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

import { JOINS_TERCERO, expresionCampo, usaTercero, type CampoCatalogo, type TipoCampo } from "./campos";
import {
  NetSuiteError,
  PAGE_SIZE,
  SUITEQL_MAX_RESULTS,
  getAccessToken,
  netsuiteConfig,
  suiteQLPageAt,
} from "./client";
import { describirFiltro, type Filtro } from "./filtros";
import { SIN_DIARIOS, SOLO_BANCOS, eligeTipoCuenta, whereFiltros } from "./filtros-sql";
import { diasDelRango } from "./rango-fechas";

/**
 * Exporta líneas contables de NetSuite a un único .xlsx con los campos
 * elegidos del catálogo: por defecto de cuentas bancarias, o de los tipos de
 * cuenta que pida un filtro (auditoría contable).
 *
 * Una query SuiteQL por día; si un día supera el límite de 100k filas por
 * query (p. ej. el cierre de ingresos de fin de mes) se parte con
 * `MOD(t.id, k)`. Las páginas de 1000 filas se piden en paralelo y se
 * escriben en streaming a /tmp en orden de fecha; si se pasa del máximo de
 * filas de Excel se sigue en otra hoja. El archivo se sube a Supabase Storage
 * porque supera el límite de respuesta de Vercel.
 */

export class ExportStorageError extends Error {
  readonly code = "storage";
  constructor(message: string) {
    super(message);
    this.name = "ExportStorageError";
  }
}

export interface ExportBancosResult {
  url: string;
  fileName: string;
  filas: number;
  duracionMs: number;
}

/**
 * Páginas en paralelo contra NetSuite. Medido: cada página tarda ~3 s y la
 * cuenta acepta 20 simultáneas sin 429; 15 deja margen a otras integraciones
 * (~5.000 filas/s, un mes de ingresos de SIIGO S.A.S en ~2,5 min).
 */
const CONCURRENCIA = 15;
/** Filas objetivo por parte cuando un día supera el límite de SuiteQL. */
const FILAS_POR_PARTE = 80_000;
/** Filas de datos por hoja (Excel admite 1.048.576 contando el encabezado). */
const FILAS_POR_HOJA = 1_048_575;
const SIGNED_URL_TTL_SECONDS = 60 * 60;
/**
 * Tiempo máximo para la fase de NetSuite. Deja margen dentro de los 300 s de
 * la función para cerrar el libro y subirlo, y así devolver un error claro
 * en lugar del 504 de Vercel.
 */
const NETSUITE_DEADLINE_MS = 240_000;

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

function checkFecha(fecha: string) {
  if (!FECHA_RE.test(fecha)) throw new Error(`Fecha inválida: ${fecha}`);
}

const JOINS = `FROM transactionaccountingline tal
JOIN transaction t ON t.id = tal.transaction
JOIN transactionline tl ON tl.transaction = tal.transaction AND tl.id = tal.transactionline
JOIN account a ON a.id = tal.account`;

/** Líneas contables contabilizadas, de cualquier cuenta y fecha. */
export const FROM_BANCOS = `${JOINS}
WHERE tal.posting = 'T'`;

/**
 * Líneas contables contabilizadas de un día. `extra` son condiciones
 * `AND …` ya armadas (ver `whereFiltros`); por defecto, solo bancos sin
 * diarios. `joins` agrega tablas (p. ej. las del tercero).
 */
export function fromBancos(fecha: string, extra = SOLO_BANCOS + SIN_DIARIOS, joins = ""): string {
  checkFecha(fecha);
  return `${JOINS}${joins}
WHERE tal.posting = 'T'
  AND t.trandate = TO_DATE('${fecha}','YYYY-MM-DD')${extra}`;
}

// Columnas auxiliares para ordenar; no van al Excel.
const ORDEN_KEYS = ["k_tranid", "k_tid", "k_tlid", "k_aid"] as const;

/**
 * Se pagina ordenando solo por claves numéricas: con `ORDER BY t.tranid`
 * primero, NetSuite ignora el `offset` y repite la primera página. El orden
 * por número de documento se aplica después, en memoria (`ordenarDia`).
 */
function queryDelDia(
  fecha: string,
  campos: CampoCatalogo[],
  extra: string,
  joins: string,
  parte?: { k: number; r: number },
): string {
  const particion = parte ? `\n  AND MOD(t.id, ${parte.k}) = ${parte.r}` : "";
  const select = [
    ...campos.map((c, i) => `${expresionCampo(c)} AS c${i}`),
    "t.tranid AS k_tranid",
    "t.id AS k_tid",
    "tl.id AS k_tlid",
    "a.id AS k_aid",
  ].join(", ");
  return `SELECT ${select}
${fromBancos(fecha, extra + particion, joins)}
ORDER BY t.id, tl.id, a.id`;
}

type Fila = Record<string, unknown>;

function compararNum(a: unknown, b: unknown): number {
  return Number(a) - Number(b);
}

/** Orden final del día: tranid, id, línea, cuenta. */
function ordenarDia(filas: Fila[]): Fila[] {
  return filas.sort((x, y) => {
    const ta = String(x.k_tranid ?? "");
    const tb = String(y.k_tranid ?? "");
    if (ta !== tb) return ta < tb ? -1 : 1;
    return (
      compararNum(x.k_tid, y.k_tid) ||
      compararNum(x.k_tlid, y.k_tlid) ||
      compararNum(x.k_aid, y.k_aid)
    );
  });
}

const NUM_FMT: Record<TipoCampo, string | undefined> = {
  text: undefined,
  boolean: undefined,
  number: "#,##0.00",
  date: "yyyy-mm-dd",
  datetime: "yyyy-mm-dd hh:mm:ss",
};

function anchoColumna(c: CampoCatalogo): number {
  if (c.tipo === "number") return 16;
  if (c.tipo === "date") return 12;
  if (c.tipo === "datetime") return 20;
  return Math.min(40, Math.max(10, c.etiqueta.length + 4));
}

const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/;

/**
 * Fecha como `Date` en UTC con la hora "de pared" de NetSuite: exceljs
 * convierte a número de serie desde UTC, así que no hay corrimiento por la
 * zona horaria del servidor.
 */
function toDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const m = DATETIME_RE.exec(value);
  if (!m) return null;
  return new Date(
    Date.UTC(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4] ?? 0),
      Number(m[5] ?? 0),
      Number(m[6] ?? 0),
    ),
  );
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toCell(tipo: TipoCampo, value: unknown): ExcelJS.CellValue {
  if (value === null || value === undefined) return null;
  switch (tipo) {
    case "number":
      return toNumber(value) ?? String(value);
    case "date":
    case "datetime":
      return toDate(value) ?? String(value);
    case "boolean":
      return value === "T" || value === true ? "Sí" : value === "F" || value === false ? "No" : String(value);
    default:
      return typeof value === "number" ? value : String(value);
  }
}

/** Una consulta de un día (entera o una parte `MOD(t.id, k)`), paginada. */
interface Parte {
  dia: number;
  query: string;
  /** Filas que reporta NetSuite; null hasta leer la primera página. */
  total: number | null;
  paginas: (Fila[] | undefined)[];
  recibidas: number;
}

/** Página pendiente. `parte === -1`: primera página del día sin partir. */
interface Tarea {
  dia: number;
  parte: number;
  pagina: number;
}

function antes(a: Tarea, b: Tarea): boolean {
  return a.dia !== b.dia ? a.dia < b.dia : a.parte !== b.parte ? a.parte < b.parte : a.pagina < b.pagina;
}

function paginasDe(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export async function exportarBancos(params: {
  fechaInicio: string;
  fechaFin: string;
  campos: CampoCatalogo[];
  filtros: Filtro[];
  /** Campos del catálogo usados por los filtros (pueden no ser columnas). */
  camposFiltro: Map<string, CampoCatalogo>;
  userId: string;
  signal?: AbortSignal;
}): Promise<ExportBancosResult> {
  const startedAt = Date.now();
  const { fechaInicio, fechaFin, campos, filtros, camposFiltro, userId } = params;
  if (campos.length === 0) throw new Error("No hay campos para exportar.");
  const extra = whereFiltros(filtros, camposFiltro);
  const joins = usaTercero([...campos, ...camposFiltro.values()]) ? JOINS_TERCERO : "";
  const soloBancos = !eligeTipoCuenta(filtros, camposFiltro);
  const dias = diasDelRango(fechaInicio, fechaFin);
  const fileName = `${soloBancos ? "bancos" : "contable"}_${fechaInicio}_${fechaFin}.xlsx`;
  const tmpPath = join(tmpdir(), `${randomUUID()}_${fileName}`);
  const columnas = [...campos.map((_, i) => `c${i}`), ...ORDEN_KEYS];

  const config = netsuiteConfig();
  const env = serverEnv();

  // Se aborta por tiempo, si el cliente se desconecta o si falla una página.
  const failCtrl = new AbortController();
  const signal = AbortSignal.any(
    [AbortSignal.timeout(NETSUITE_DEADLINE_MS), failCtrl.signal, params.signal].filter(
      (s): s is AbortSignal => s !== undefined,
    ),
  );

  try {
    const token = await getAccessToken(config, signal);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: tmpPath,
      useStyles: true,
      useSharedStrings: false,
    });
    const nombreHoja = soloBancos ? "Bancos" : "Movimientos";
    let hojas = 0;
    const nuevaHoja = () => {
      hojas++;
      const hoja = workbook.addWorksheet(hojas === 1 ? nombreHoja : `${nombreHoja} ${hojas}`, {
        views: [{ state: "frozen", ySplit: 1 }],
      });
      hoja.columns = campos.map((c, i) => ({
        key: `c${i}`,
        header: c.etiqueta,
        width: anchoColumna(c),
        style: NUM_FMT[c.tipo] ? { numFmt: NUM_FMT[c.tipo] } : {},
      }));
      const headerRow = hoja.getRow(1);
      headerRow.font = { bold: true };
      headerRow.commit();
      return hoja;
    };
    let sheet = nuevaHoja();
    let filasEnHoja = 0;

    const filaACeldas = (fila: Fila): ExcelJS.CellValue[] =>
      campos.map((c, i) => toCell(c.tipo, fila[`c${i}`]));

    // Plan de cada día: sus partes, conocidas tras leer su primera página.
    const planes: (Parte[] | undefined)[] = dias.map(() => undefined);
    const pendientes: Tarea[] = dias.map((_, dia) => ({ dia, parte: -1, pagina: 0 }));
    let filas = 0;
    let escritoDia = 0;
    let escritaParte = 0;
    let primerError: unknown = null;

    const normalizar = (items: Record<string, unknown>[]): Fila[] =>
      items.map((item) => {
        const fila: Fila = {};
        for (const col of columnas) fila[col] = item[col] ?? null;
        return fila;
      });

    // Escribe en orden (día, parte) todo lo que ya esté completo.
    const escribirListos = () => {
      for (;;) {
        const plan = planes[escritoDia];
        if (!plan) return;
        const parte = plan[escritaParte];
        if (!parte || parte.total === null || parte.recibidas < parte.paginas.length) return;
        const delaParte = parte.paginas.flatMap((p) => p ?? []);
        if (delaParte.length !== parte.total) {
          throw new NetSuiteError(
            `${dias[escritoDia]}: NetSuite reportó ${parte.total} filas pero se recibieron ${delaParte.length}. Intenta de nuevo.`,
            "netsuite_query",
          );
        }
        parte.paginas = [];
        for (const fila of ordenarDia(delaParte)) {
          if (filasEnHoja === FILAS_POR_HOJA) {
            sheet.commit();
            sheet = nuevaHoja();
            filasEnHoja = 0;
          }
          sheet.addRow(filaACeldas(fila)).commit();
          filasEnHoja++;
        }
        filas += delaParte.length;
        escritaParte++;
        if (escritaParte >= plan.length) {
          escritoDia++;
          escritaParte = 0;
        }
      }
    };

    const recibirPrimera = (parte: Parte, t: Tarea, total: number, items: Record<string, unknown>[]) => {
      if (total > SUITEQL_MAX_RESULTS) {
        throw new NetSuiteError(
          `${dias[t.dia]}: una parte devuelve ${total} filas y NetSuite solo permite ${SUITEQL_MAX_RESULTS} por consulta.`,
          "netsuite_limit",
        );
      }
      parte.total = total;
      parte.paginas = new Array<Fila[] | undefined>(paginasDe(total)).fill(undefined);
      parte.paginas[0] = normalizar(items);
      parte.recibidas = 1;
      for (let pagina = 1; pagina < parte.paginas.length; pagina++) {
        pendientes.push({ dia: t.dia, parte: t.parte, pagina });
      }
    };

    const ejecutar = async (t: Tarea) => {
      const fecha = dias[t.dia]!;
      if (t.parte === -1) {
        // Primera página del día entero: su total decide si hay que partirlo.
        const query = queryDelDia(fecha, campos, extra, joins);
        const res = await suiteQLPageAt(config, token, query, 0, signal);
        const total = res.total ?? res.items.length;
        if (total <= SUITEQL_MAX_RESULTS) {
          const parte: Parte = { dia: t.dia, query, total: null, paginas: [], recibidas: 0 };
          planes[t.dia] = [parte];
          recibirPrimera(parte, { ...t, parte: 0 }, total, res.items);
        } else {
          const k = Math.ceil(total / FILAS_POR_PARTE);
          planes[t.dia] = Array.from({ length: k }, (_, r) => ({
            dia: t.dia,
            query: queryDelDia(fecha, campos, extra, joins, { k, r }),
            total: null,
            paginas: [],
            recibidas: 0,
          }));
          for (let r = 0; r < k; r++) pendientes.push({ dia: t.dia, parte: r, pagina: 0 });
        }
        return;
      }
      const parte = planes[t.dia]![t.parte]!;
      const res = await suiteQLPageAt(config, token, parte.query, t.pagina * PAGE_SIZE, signal);
      if (t.pagina === 0) {
        recibirPrimera(parte, t, res.total ?? res.items.length, res.items);
      } else {
        parte.paginas[t.pagina] = normalizar(res.items);
        parte.recibidas++;
      }
    };

    // Cada worker toma la tarea pendiente más temprana: así lo que queda en
    // memoria esperando a escribirse se limita a unas pocas partes.
    const siguiente = (): Tarea | undefined => {
      if (pendientes.length === 0) return undefined;
      let min = 0;
      for (let i = 1; i < pendientes.length; i++) if (antes(pendientes[i]!, pendientes[min]!)) min = i;
      return pendientes.splice(min, 1)[0];
    };

    let activos = 0;
    await new Promise<void>((resolve) => {
      const lanzar = () => {
        while (primerError === null && activos < CONCURRENCIA) {
          const t = siguiente();
          if (!t) break;
          activos++;
          ejecutar(t)
            .then(escribirListos)
            .catch((err: unknown) => {
              if (primerError === null) {
                primerError =
                  err instanceof NetSuiteError && err.code !== "timeout" && !err.message.startsWith(dias[t.dia]!)
                    ? new NetSuiteError(`${dias[t.dia]}: ${err.message}`, err.code)
                    : err;
                failCtrl.abort();
              }
            })
            .finally(() => {
              activos--;
              lanzar();
            });
        }
        if (activos === 0) resolve();
      };
      lanzar();
    });
    if (primerError !== null) throw primerError;
    if (escritoDia !== dias.length) {
      throw new Error("No se escribieron todos los días del rango.");
    }

    sheet.commit();
    escribirParametros(workbook, { fechaInicio, fechaFin, filtros, camposFiltro, filas, soloBancos });
    await workbook.commit();

    const storagePath = `bancos/${userId}/${randomUUID()}/${fileName}`;
    const admin = createAdminClient();
    const buffer = await readFile(tmpPath);
    const bucket = admin.storage.from(env.EXPORTS_BUCKET);

    const upload = await bucket.upload(storagePath, buffer, {
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: false,
    });
    if (upload.error) {
      const mb = (buffer.length / 1_048_576).toFixed(0);
      throw new ExportStorageError(
        /exceeded the maximum allowed size/i.test(upload.error.message)
          ? `El Excel pesa ${mb} MB (${filas.toLocaleString("es-CO")} filas) y supera el tamaño máximo de archivo de Supabase Storage. Exporta un rango más corto (p. ej. una quincena) o sube el límite en Supabase → Storage → Settings.`
          : `No se pudo subir el Excel a Storage (bucket "${env.EXPORTS_BUCKET}"): ${upload.error.message}`,
      );
    }

    const signed = await bucket.createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS, {
      download: fileName,
    });
    if (signed.error || !signed.data) {
      throw new ExportStorageError(
        `No se pudo generar el enlace de descarga: ${signed.error?.message ?? "sin datos"}`,
      );
    }

    return {
      url: signed.data.signedUrl,
      fileName,
      filas,
      duracionMs: Date.now() - startedAt,
    };
  } finally {
    await rm(tmpPath, { force: true }).catch(() => {});
  }
}

/** Hoja "Parámetros": deja en el archivo con qué rango y filtros se generó. */
function escribirParametros(
  workbook: ExcelJS.stream.xlsx.WorkbookWriter,
  p: {
    fechaInicio: string;
    fechaFin: string;
    filtros: Filtro[];
    camposFiltro: Map<string, CampoCatalogo>;
    filas: number;
    soloBancos: boolean;
  },
) {
  const hoja = workbook.addWorksheet("Parámetros");
  hoja.columns = [
    { key: "a", width: 28 },
    { key: "b", width: 70 },
  ];
  const fila = (a: string, b: string | number, bold = false) => {
    const row = hoja.addRow([a, b]);
    if (bold) row.font = { bold: true };
    row.commit();
  };
  fila("Desde", p.fechaInicio);
  fila("Hasta", p.fechaFin);
  fila(
    "Cuentas",
    p.soloBancos ? "Solo cuentas bancarias (sin diarios, salvo que se filtren)" : "Las del filtro Tipo Cuenta, diarios incluidos",
  );
  fila("Filas", p.filas);
  fila("Generado (UTC)", new Date().toISOString().slice(0, 19).replace("T", " "));
  fila("", "");
  fila("Filtros", p.filtros.length === 0 ? "Sin filtros" : `${p.filtros.length}`, true);
  for (const f of p.filtros) {
    const c = p.camposFiltro.get(f.campoId);
    if (c) fila(c.etiqueta, describirFiltro(f, c));
  }
  hoja.commit();
}
