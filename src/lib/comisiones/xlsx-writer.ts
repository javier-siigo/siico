/**
 * Escritor mínimo de .xlsx en streaming.
 *
 * La librería `xlsx` arma todo el libro en memoria y se queda sin heap con
 * cientos de miles de filas. Aquí cada hoja se genera fila a fila, se
 * comprime con `CompressionStream` y se empaqueta en un zip.
 */

export type CeldaXlsx =
  | string
  | number
  | null
  | undefined
  | { v: number; fmt: "pct" | "money" };

export interface HojaXlsx {
  nombre: string;
  /** La primera fila se trata como encabezado (negrita, fija al desplazar). */
  filas: Iterable<CeldaXlsx[]>;
  anchos?: number[];
}

// Índices de estilo en styles.xml (cellXfs).
const S_HEADER = 1;
const S_MONEY = 2;
const S_PCT = 3;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;$&quot;\\ #,##0.00"/><numFmt numFmtId="165" formatCode="0.0000%"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
</styleSheet>`;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Caracteres de control no válidos en XML 1.0.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
}

function colName(i: number): string {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function cellXml(ref: string, c: CeldaXlsx, header: boolean): string {
  if (c === null || c === undefined || c === "") return "";
  if (typeof c === "string") {
    const s = header ? ` s="${S_HEADER}"` : "";
    return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${esc(c)}</t></is></c>`;
  }
  if (typeof c === "number") {
    return Number.isFinite(c) ? `<c r="${ref}"><v>${c}</v></c>` : "";
  }
  if (!Number.isFinite(c.v)) return "";
  return `<c r="${ref}" s="${c.fmt === "pct" ? S_PCT : S_MONEY}"><v>${c.v}</v></c>`;
}

function* sheetXml(hoja: HojaXlsx): Generator<string> {
  yield '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
  yield '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
  if (hoja.anchos?.length) {
    yield `<cols>${hoja.anchos
      .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
      .join("")}</cols>`;
  }
  yield "<sheetData>";
  let r = 0;
  let batch = "";
  for (const fila of hoja.filas) {
    r += 1;
    let row = `<row r="${r}">`;
    for (let i = 0; i < fila.length; i += 1) {
      row += cellXml(`${colName(i)}${r}`, fila[i], r === 1);
    }
    batch += `${row}</row>`;
    if (batch.length > 1 << 20) {
      yield batch;
      batch = "";
    }
  }
  if (batch) yield batch;
  yield "</sheetData></worksheet>";
}

// --- zip -------------------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(crc: number, data: Uint8Array): number {
  let c = crc ^ 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

interface ZipItem {
  name: Uint8Array;
  crc: number;
  size: number;
  compressed: Uint8Array[];
  compressedSize: number;
  offset: number;
}

async function deflate(parts: Iterable<string>): Promise<Omit<ZipItem, "name" | "offset">> {
  const enc = new TextEncoder();
  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  const compressed: Uint8Array[] = [];
  let compressedSize = 0;
  const reading = (async () => {
    const reader = cs.readable.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      compressed.push(value);
      compressedSize += value.byteLength;
    }
  })();
  let crc = 0;
  let size = 0;
  for (const part of parts) {
    const bytes = enc.encode(part);
    crc = crc32(crc, bytes);
    size += bytes.byteLength;
    await writer.write(bytes);
  }
  await writer.close();
  await reading;
  return { crc, size, compressed, compressedSize };
}

function zip(items: ZipItem[]): Uint8Array {
  let offset = 0;
  const chunks: Uint8Array[] = [];
  for (const it of items) {
    it.offset = offset;
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true);
    h.setUint16(4, 20, true);
    h.setUint16(6, 0x0800, true); // nombres en UTF-8
    h.setUint16(8, 8, true);
    h.setUint32(14, it.crc, true);
    h.setUint32(18, it.compressedSize, true);
    h.setUint32(22, it.size, true);
    h.setUint16(26, it.name.length, true);
    chunks.push(new Uint8Array(h.buffer), it.name, ...it.compressed);
    offset += 30 + it.name.length + it.compressedSize;
  }
  const cdStart = offset;
  for (const it of items) {
    const h = new DataView(new ArrayBuffer(46));
    h.setUint32(0, 0x02014b50, true);
    h.setUint16(4, 20, true);
    h.setUint16(6, 20, true);
    h.setUint16(8, 0x0800, true);
    h.setUint16(10, 8, true);
    h.setUint32(16, it.crc, true);
    h.setUint32(20, it.compressedSize, true);
    h.setUint32(24, it.size, true);
    h.setUint16(28, it.name.length, true);
    h.setUint32(42, it.offset, true);
    chunks.push(new Uint8Array(h.buffer), it.name);
    offset += 46 + it.name.length;
  }
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, items.length, true);
  end.setUint16(10, items.length, true);
  end.setUint32(12, offset - cdStart, true);
  end.setUint32(16, cdStart, true);
  chunks.push(new Uint8Array(end.buffer));

  const out = new Uint8Array(offset + 22);
  let p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.byteLength;
  }
  return out;
}

export async function escribirXlsx(hojas: HojaXlsx[]): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const files: [string, Iterable<string>][] = [
    [
      "[Content_Types].xml",
      [
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${hojas
          .map(
            (_, i) =>
              `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
          )
          .join("")}</Types>`,
      ],
    ],
    [
      "_rels/.rels",
      [
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ],
    ],
    [
      "xl/workbook.xml",
      [
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${hojas
          .map(
            (h, i) =>
              `<sheet name="${esc(h.nombre.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
          )
          .join("")}</sheets></workbook>`,
      ],
    ],
    [
      "xl/_rels/workbook.xml.rels",
      [
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${hojas
          .map(
            (_, i) =>
              `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
          )
          .join("")}<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      ],
    ],
    ["xl/styles.xml", [STYLES]],
    ...hojas.map(
      (h, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(h)] as [string, Iterable<string>],
    ),
  ];

  const items: ZipItem[] = [];
  for (const [name, parts] of files) {
    items.push({ name: enc.encode(name), offset: 0, ...(await deflate(parts)) });
  }
  return zip(items).buffer as ArrayBuffer;
}
