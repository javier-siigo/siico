import "server-only";

import { constants, createPrivateKey, sign, type KeyObject } from "node:crypto";

import { serverEnv } from "@/lib/env";

/**
 * Cliente mínimo de NetSuite: token OAuth 2.0 (client credentials con JWT
 * PS256) y SuiteQL paginado con reintentos.
 */

export type NetSuiteErrorCode =
  | "netsuite_config"
  | "netsuite_auth"
  | "netsuite_query"
  | "netsuite_limit"
  | "timeout";

export class NetSuiteError extends Error {
  constructor(
    message: string,
    public readonly code: NetSuiteErrorCode,
  ) {
    super(message);
    this.name = "NetSuiteError";
  }
}

export interface NetSuiteConfig {
  accountId: string;
  consumerKey: string;
  certId: string;
  privateKey: KeyObject;
  baseUrl: string;
  tokenUrl: string;
}

export const PAGE_SIZE = 1000;
/** Límite de resultados por query del endpoint REST de SuiteQL. */
export const SUITEQL_MAX_RESULTS = 100_000;
const MAX_ATTEMPTS = 5;

/**
 * La clave puede venir en una sola línea (Vercel, .env) con o sin `\n`
 * literales: se reconstruye el PEM con el cuerpo en bloques de 64.
 */
export function normalizePem(raw: string): string {
  const text = raw.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
  const match = /-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/.exec(text);
  if (!match) {
    throw new NetSuiteError(
      "NETSUITE_PRIVATE_KEY no es un PEM válido.",
      "netsuite_config",
    );
  }
  const label = match[1]!;
  const body = match[2]!.replace(/\s+/g, "");
  const lines = body.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----\n`;
}

/** Dominio de SuiteTalk: minúsculas y `_` → `-` (p. ej. `123_SB1` → `123-sb1`). */
function accountHost(accountId: string): string {
  return accountId.toLowerCase().replace(/_/g, "-");
}

let cachedConfig: NetSuiteConfig | null = null;

export function netsuiteConfig(): NetSuiteConfig {
  if (cachedConfig) return cachedConfig;
  const env = serverEnv();
  const missing = (
    [
      "NETSUITE_ACCOUNT_ID",
      "NETSUITE_CONSUMER_KEY",
      "NETSUITE_CERT_ID",
      "NETSUITE_PRIVATE_KEY",
    ] as const
  ).filter((k) => !env[k]);
  if (missing.length > 0) {
    throw new NetSuiteError(
      `Falta configurar en el servidor: ${missing.join(", ")}.`,
      "netsuite_config",
    );
  }

  let privateKey: KeyObject;
  try {
    privateKey = createPrivateKey(normalizePem(env.NETSUITE_PRIVATE_KEY!));
  } catch (err) {
    if (err instanceof NetSuiteError) throw err;
    throw new NetSuiteError(
      "No se pudo leer NETSUITE_PRIVATE_KEY (se espera PKCS#8).",
      "netsuite_config",
    );
  }

  const baseUrl = `https://${accountHost(env.NETSUITE_ACCOUNT_ID!)}.suitetalk.api.netsuite.com/services/rest`;
  cachedConfig = {
    accountId: env.NETSUITE_ACCOUNT_ID!,
    consumerKey: env.NETSUITE_CONSUMER_KEY!,
    certId: env.NETSUITE_CERT_ID!,
    privateKey,
    baseUrl,
    tokenUrl: `${baseUrl}/auth/oauth2/v1/token`,
  };
  return cachedConfig;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function buildClientAssertion(config: NetSuiteConfig): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "PS256", typ: "JWT", kid: config.certId };
  const payload = {
    iss: config.consumerKey,
    scope: ["restlets", "rest_webservices"],
    aud: config.tokenUrl,
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = sign("sha256", Buffer.from(signingInput), {
    key: config.privateKey,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
  });
  return `${signingInput}.${base64url(signature)}`;
}

function isAbort(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "AbortError" || err.name === "TimeoutError")
  );
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(signal!.reason);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function backoffMs(attempt: number, retryAfter: string | null): number {
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1000, 30_000);
  return Math.min(1000 * 2 ** attempt, 16_000) + Math.random() * 500;
}

/** Extrae el detalle del error de NetSuite (`o:errorDetails`) si existe. */
async function upstreamDetail(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const json = JSON.parse(text) as {
      "o:errorDetails"?: { detail?: string }[];
      error_description?: string;
      error?: string;
    };
    return (
      json["o:errorDetails"]?.[0]?.detail ??
      json.error_description ??
      json.error ??
      text.slice(0, 300)
    );
  } catch {
    return text.slice(0, 300);
  }
}

/**
 * `fetch` con reintento y backoff ante 429, 5xx y errores de red. Las demás
 * respuestas se devuelven tal cual para que el llamador decida.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  signal: AbortSignal | undefined,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal });
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt === MAX_ATTEMPTS - 1) return res;
      await res.body?.cancel().catch(() => {});
      await sleep(backoffMs(attempt, res.headers.get("retry-after")), signal);
    } catch (err) {
      if (isAbort(err) || signal?.aborted) {
        throw new NetSuiteError(
          "La consulta a NetSuite superó el tiempo máximo.",
          "timeout",
        );
      }
      lastError = err;
      if (attempt === MAX_ATTEMPTS - 1) break;
      await sleep(backoffMs(attempt, null), signal).catch(() => {
        throw new NetSuiteError(
          "La consulta a NetSuite superó el tiempo máximo.",
          "timeout",
        );
      });
    }
  }
  throw new NetSuiteError(
    `No se pudo contactar NetSuite: ${(lastError as Error)?.message ?? "error de red"}.`,
    "netsuite_query",
  );
}

export async function getAccessToken(
  config: NetSuiteConfig,
  signal?: AbortSignal,
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: buildClientAssertion(config),
  });
  const res = await fetchWithRetry(
    config.tokenUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    signal,
  );
  if (!res.ok) {
    const detail = await upstreamDetail(res);
    throw new NetSuiteError(
      `NetSuite rechazó la autenticación (${res.status}): ${detail}`,
      "netsuite_auth",
    );
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new NetSuiteError(
      "NetSuite no devolvió un access token.",
      "netsuite_auth",
    );
  }
  return json.access_token;
}

interface SuiteQLPage {
  items?: Record<string, unknown>[];
  hasMore?: boolean;
  totalResults?: number;
}

async function fetchSuiteQLPage(
  config: NetSuiteConfig,
  token: string,
  query: string,
  limit: number,
  offset: number,
  signal: AbortSignal | undefined,
): Promise<SuiteQLPage> {
  const res = await fetchWithRetry(
    `${config.baseUrl}/query/v1/suiteql?limit=${limit}&offset=${offset}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Prefer: "transient",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query }),
    },
    signal,
  );
  if (res.status === 401 || res.status === 403) {
    const detail = await upstreamDetail(res);
    throw new NetSuiteError(
      `NetSuite denegó el acceso a SuiteQL (${res.status}): ${detail}`,
      "netsuite_auth",
    );
  }
  if (!res.ok) {
    const detail = await upstreamDetail(res);
    throw new NetSuiteError(
      `Error de SuiteQL (${res.status}): ${detail}`,
      "netsuite_query",
    );
  }
  return (await res.json()) as SuiteQLPage;
}

/** Una sola página, sin completar nulos (para muestras). */
export async function suiteQLPage(
  config: NetSuiteConfig,
  token: string,
  query: string,
  limit: number,
  signal?: AbortSignal,
): Promise<Record<string, unknown>[]> {
  const page = await fetchSuiteQLPage(config, token, query, limit, 0, signal);
  return page.items ?? [];
}

/** Primera página con el total de resultados que reporta NetSuite. */
export async function suiteQLPageInfo(
  config: NetSuiteConfig,
  token: string,
  query: string,
  limit: number,
  signal?: AbortSignal,
): Promise<{ items: Record<string, unknown>[]; total: number | undefined }> {
  const page = await fetchSuiteQLPage(config, token, query, limit, 0, signal);
  return { items: page.items ?? [], total: page.totalResults };
}

/** Una página en `offset` con el total de la consulta (para paginar en paralelo). */
export async function suiteQLPageAt(
  config: NetSuiteConfig,
  token: string,
  query: string,
  offset: number,
  signal?: AbortSignal,
): Promise<{ items: Record<string, unknown>[]; total: number | undefined }> {
  const page = await fetchSuiteQLPage(config, token, query, PAGE_SIZE, offset, signal);
  return { items: page.items ?? [], total: page.totalResults };
}

/**
 * Ejecuta una query SuiteQL completa (todas las páginas). SuiteQL omite los
 * campos nulos, así que cada fila se completa con `columns` en `null`.
 * Verifica que el total recibido coincida con `totalResults`.
 *
 * La query debe ordenar por claves numéricas únicas (p. ej. `ORDER BY id`):
 * sin orden, o con un texto primero, NetSuite puede ignorar el `offset` y
 * repetir páginas.
 */
export async function runSuiteQL<C extends string>(
  config: NetSuiteConfig,
  token: string,
  query: string,
  columns: readonly C[],
  signal?: AbortSignal,
): Promise<Record<C, unknown>[]> {
  const rows: Record<C, unknown>[] = [];
  let offset = 0;
  let total: number | undefined;

  for (;;) {
    const page = await fetchSuiteQLPage(config, token, query, PAGE_SIZE, offset, signal);
    if (total === undefined) {
      total = page.totalResults;
      if (total !== undefined && total > SUITEQL_MAX_RESULTS) {
        throw new NetSuiteError(
          `La consulta devuelve ${total} filas y NetSuite solo permite ${SUITEQL_MAX_RESULTS} por consulta.`,
          "netsuite_limit",
        );
      }
    }

    for (const item of page.items ?? []) {
      const row = {} as Record<C, unknown>;
      for (const col of columns) row[col] = item[col] ?? null;
      rows.push(row);
    }

    if (!page.hasMore) break;
    offset += PAGE_SIZE;
    if (offset >= SUITEQL_MAX_RESULTS) {
      throw new NetSuiteError(
        `La consulta superó el límite de ${SUITEQL_MAX_RESULTS} filas de NetSuite.`,
        "netsuite_limit",
      );
    }
  }

  if (total !== undefined && rows.length !== total) {
    throw new NetSuiteError(
      `NetSuite reportó ${total} filas pero se recibieron ${rows.length}. Intenta de nuevo.`,
      "netsuite_query",
    );
  }
  return rows;
}

/**
 * Nombres de los tipos de registro de la cuenta (REST metadata-catalog).
 * Incluye los tipos de transacción personalizados aunque no tengan
 * transacciones, cosa que SuiteQL no expone.
 */
export async function tiposDeRegistro(
  config: NetSuiteConfig,
  token: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const res = await fetchWithRetry(
    `${config.baseUrl}/record/v1/metadata-catalog`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    signal,
  );
  if (!res.ok) {
    const detail = await upstreamDetail(res);
    throw new NetSuiteError(`Error del catálogo de registros (${res.status}): ${detail}`, "netsuite_query");
  }
  const json = (await res.json()) as { items?: { name?: string }[] };
  return (json.items ?? []).map((i) => i.name).filter((n): n is string => typeof n === "string");
}
