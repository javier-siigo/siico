import { serverEnv } from "@/lib/env";

export type N8nRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean>;
  body?: unknown;
  timeoutMs?: number;
};

export class N8nError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "N8nError";
    this.status = status;
    this.payload = payload;
  }
}

export async function n8nRequest<T = unknown>(
  path: string,
  options: N8nRequestOptions = {},
): Promise<T> {
  const env = serverEnv();
  if (!env.N8N_BASE_URL) {
    throw new N8nError("N8N_BASE_URL no está configurada", 500, null);
  }

  const url = new URL(path.replace(/^\/+/, ""), ensureTrailingSlash(env.N8N_BASE_URL));
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (env.N8N_WEBHOOK_SECRET) {
    headers["x-webhook-secret"] = env.N8N_WEBHOOK_SECRET;
  }
  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timeout = options.timeoutMs ?? 15_000;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: options.method ?? (body ? "POST" : "GET"),
      headers,
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await response.text();
    const payload = text ? safeJson(text) : null;
    if (!response.ok) {
      throw new N8nError(
        `n8n respondió ${response.status}`,
        response.status,
        payload,
      );
    }
    return payload as T;
  } catch (err) {
    if (err instanceof N8nError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new N8nError("Tiempo de espera agotado al llamar a n8n", 504, null);
    }
    throw new N8nError(
      `No se pudo contactar a n8n: ${(err as Error).message}`,
      502,
      null,
    );
  } finally {
    clearTimeout(timer);
  }
}

function ensureTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
