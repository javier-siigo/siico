import XlsxPopulate from "xlsx-populate";

import type { XlsxSheet } from "@/types/xlsx-populate-types";

const HEADER_ROW = 1;
const DIFERENCIA_HEADER_NORMALIZED = "diferencia";
const NEGATIVE_FILL_RGB = "FEE2E2";
const NEGATIVE_FONT_RGB = "B91C1C";

function normalizeHeader(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim().toLowerCase();
  if (typeof value === "object") {
    const candidate = value as { text?: unknown; toString?: () => string };
    if (typeof candidate.text === "string") {
      return candidate.text.trim().toLowerCase();
    }
    if (typeof candidate.toString === "function") {
      return candidate.toString().trim().toLowerCase();
    }
  }
  return "";
}

function coerceNumericValue(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof value === "object") {
    const candidate = value as { result?: unknown; value?: unknown };
    if ("result" in candidate) return coerceNumericValue(candidate.result);
    if ("value" in candidate) return coerceNumericValue(candidate.value);
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  return null;
}

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
}

function toArrayBuffer(input: ArrayBuffer | Buffer): ArrayBuffer {
  return Buffer.isBuffer(input) ? bufferToArrayBuffer(input) : input;
}

function findDiferenciaColumn(sheet: XlsxSheet): number {
  const headerRow = sheet.row(HEADER_ROW);
  const min = headerRow.minUsedColumnNumber();
  const max = headerRow.maxUsedColumnNumber();
  if (min === 0 || max === 0) return 0;
  for (let c = min; c <= max; c += 1) {
    const cell = sheet.cell(HEADER_ROW, c);
    if (normalizeHeader(cell.value()) === DIFERENCIA_HEADER_NORMALIZED) {
      return c;
    }
  }
  return 0;
}

function applyNegativeStyle(
  sheet: XlsxSheet,
  rowNumber: number,
  lastCol: number,
): void {
  const range = sheet.range(rowNumber, 1, rowNumber, lastCol);
  range.style({
    fill: { type: "solid", color: { rgb: NEGATIVE_FILL_RGB } },
    fontColor: { rgb: NEGATIVE_FONT_RGB },
  });
}

export interface HighlightSummary {
  highlightedRows: number;
  sheetsProcessed: number;
}

export interface HighlightResult {
  buffer: ArrayBuffer;
  summary: HighlightSummary;
}

export async function highlightNegativeDifferences(
  input: ArrayBuffer | Buffer,
): Promise<HighlightResult> {
  const original = toArrayBuffer(input);

  const workbook = await XlsxPopulate.fromDataAsync(
    Buffer.isBuffer(input) ? input : Buffer.from(input),
  );

  const summary: HighlightSummary = {
    highlightedRows: 0,
    sheetsProcessed: 0,
  };

  for (const sheet of workbook.sheets()) {
    summary.sheetsProcessed += 1;

    const diferenciaCol = findDiferenciaColumn(sheet);
    if (diferenciaCol === 0) continue;

    const usedRange = sheet.usedRange();
    const endCell = usedRange?.endCell();
    const lastRow = endCell?.rowNumber() ?? 0;
    const usedLastCol = endCell?.columnNumber() ?? 0;
    if (lastRow <= HEADER_ROW || usedLastCol === 0) continue;

    let lastCol = usedLastCol;
    for (let r = HEADER_ROW + 1; r <= lastRow; r += 1) {
      const rowMax = sheet.row(r).maxUsedColumnNumber();
      if (rowMax > lastCol) lastCol = rowMax;
    }
    if (lastCol === 0) continue;

    for (let r = HEADER_ROW + 1; r <= lastRow; r += 1) {
      const cell = sheet.cell(r, diferenciaCol);
      const numeric = coerceNumericValue(cell.value());
      if (numeric == null || numeric >= 0) continue;

      applyNegativeStyle(sheet, r, lastCol);
      summary.highlightedRows += 1;
    }
  }

  if (summary.highlightedRows === 0) {
    return { buffer: original, summary };
  }

  const output = await workbook.outputAsync({ type: "arraybuffer" });
  const outputBuffer = Buffer.from(output as ArrayBuffer);

  try {
    await XlsxPopulate.fromDataAsync(outputBuffer);
  } catch (validationErr) {
    console.error(
      "[notas-credito] El workbook reescrito por xlsx-populate no pasó la validación; se devuelve el archivo original.",
      validationErr,
    );
    return {
      buffer: original,
      summary: { ...summary, highlightedRows: 0 },
    };
  }

  return {
    buffer: outputBuffer.buffer.slice(
      outputBuffer.byteOffset,
      outputBuffer.byteOffset + outputBuffer.byteLength,
    ) as ArrayBuffer,
    summary,
  };
}
