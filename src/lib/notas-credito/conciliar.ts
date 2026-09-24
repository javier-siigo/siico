import { serverEnv } from "@/lib/env";

const N8N_WEBHOOK_PATH_DEFAULT = "webhook/conciliacion-netsuite";
const REQUEST_TIMEOUT_MS = 60_000;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = ["xlsx", "xls", "csv"] as const;
export const ACCEPTED_MIME_PREFIXES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "application/octet-stream",
] as const;
const FALLBACK_FILENAME = "resultado_netsuite.xlsx";
const FALLBACK_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type ConciliarErrorCode =
  | "missing_file"
  | "invalid_type"
  | "file_too_large"
  | "storage_unauthorized"
  | "storage_not_found"
  | "upstream_config"
  | "upstream_timeout"
  | "upstream_network"
  | "upstream_status"
  | "upstream_empty";

export class ConciliarError extends Error {
  code: ConciliarErrorCode;
  status: number;

  constructor(message: string, code: ConciliarErrorCode, status: number) {
    super(message);
    this.name = "ConciliarError";
    this.code = code;
    this.status = status;
  }
}

export interface ConciliarResult {
  blob: Blob;
  filename: string;
  contentType: string;
}

function ensureTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

function extractFilename(contentDisposition: string | null): string {
  if (!contentDisposition) return FALLBACK_FILENAME;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)?.[1];
  if (utf8) {
    try {
      return decodeURIComponent(utf8);
    } catch {
      return FALLBACK_FILENAME;
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(contentDisposition)?.[1];
  return plain?.trim() || FALLBACK_FILENAME;
}

export async function conciliarNotasCredito(
  file: File,
): Promise<ConciliarResult> {
  const env = serverEnv();
  if (!env.N8N_BASE_URL) {
    throw new ConciliarError(
      "Falta configurar N8N_BASE_URL",
      "upstream_config",
      500,
    );
  }

  const path =
    env.N8N_NOTAS_CREDITO_PATH?.replace(/^\/+/, "").replace(/\/+$/, "") ||
    N8N_WEBHOOK_PATH_DEFAULT;
  const url = new URL(path, ensureTrailingSlash(env.N8N_BASE_URL));

  const headers: Record<string, string> = {};
  if (env.N8N_WEBHOOK_SECRET) {
    headers["x-webhook-secret"] = env.N8N_WEBHOOK_SECRET;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: file,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new ConciliarError(
        `n8n respondió ${response.status}`,
        "upstream_status",
        response.status,
      );
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new ConciliarError(
        "n8n devolvió una respuesta vacía",
        "upstream_empty",
        502,
      );
    }

    return {
      blob,
      filename: extractFilename(response.headers.get("content-disposition")),
      contentType:
        response.headers.get("content-type")?.split(";")[0]?.trim() ||
        FALLBACK_CONTENT_TYPE,
    };
  } catch (err) {
    if (err instanceof ConciliarError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new ConciliarError(
        "Tiempo de espera agotado al llamar a n8n",
        "upstream_timeout",
        504,
      );
    }
    throw new ConciliarError(
      `No se pudo contactar a n8n: ${(err as Error).message}`,
      "upstream_network",
      502,
    );
  } finally {
    clearTimeout(timer);
  }
}
