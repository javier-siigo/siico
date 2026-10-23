export const ACCEPTED_EXTENSIONS = ["xlsx", "xls", "csv"] as const;
export const ACCEPTED_EXTENSIONS_WITH_DOTS = [".xlsx", ".xls", ".csv"] as const;
export const ACCEPTED_EXTENSIONS_LABEL = ".xlsx, .xls, .csv";

export const ACCEPTED_MIME_PREFIXES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "application/octet-stream",
] as const;

// La conciliación anterior es el Excel que entregan los contadores; n8n solo lee .xlsx.
export const PREVIO_ACCEPTED_EXTENSION = ".xlsx";
export const PREVIO_INVALID_TYPE_MESSAGE =
  "La conciliación anterior debe ser un archivo .xlsx.";

export function isXlsxFilename(filename: string): boolean {
  return filename.toLowerCase().endsWith(PREVIO_ACCEPTED_EXTENSION);
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = "10 MB";

export type FileSlotState =
  | "idle"
  | "uploading"
  | "processing"
  | "error"
  | "done";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
