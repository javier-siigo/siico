import { NextResponse } from "next/server";

import { getUserRoles, hasIngresosOrAdmin } from "@/lib/auth/roles";
import type { CampoCatalogo } from "@/lib/netsuite/campos";
import { NetSuiteError } from "@/lib/netsuite/client";
import { ExportStorageError, exportarBancos } from "@/lib/netsuite/export-bancos";
import { validarRango } from "@/lib/netsuite/rango-fechas";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

function jsonError(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const NETSUITE_STATUS: Record<NetSuiteError["code"], number> = {
  netsuite_config: 500,
  netsuite_auth: 502,
  netsuite_query: 502,
  netsuite_limit: 422,
  timeout: 504,
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return jsonError("Tu sesión expiró. Vuelve a iniciar sesión.", "unauthorized", 401);
  }
  const userId = data.claims.sub;
  const roles = await getUserRoles(userId);
  if (!hasIngresosOrAdmin(roles)) {
    return jsonError("No tienes permisos para esta exportación.", "forbidden", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo inválido: se esperaba JSON", "bad_request", 400);
  }
  if (!isPlainObject(body)) {
    return jsonError("Cuerpo inválido: se esperaba un objeto", "bad_request", 400);
  }

  const { fechaInicio, fechaFin, campos: campoIds } = body;
  if (typeof fechaInicio !== "string" || typeof fechaFin !== "string") {
    return jsonError("Faltan fechaInicio y fechaFin (YYYY-MM-DD).", "bad_request", 400);
  }
  const rangoError = validarRango(fechaInicio, fechaFin);
  if (rangoError) {
    return jsonError(rangoError, "invalid_range", 400);
  }
  if (
    !Array.isArray(campoIds) ||
    campoIds.length === 0 ||
    campoIds.length > 500 ||
    !campoIds.every((id) => typeof id === "string" && UUID_RE.test(id))
  ) {
    return jsonError("Selecciona al menos un campo.", "invalid_fields", 400);
  }

  // Solo campos habilitados del catálogo: el SELECT se arma con estas filas,
  // nunca con texto enviado por el cliente.
  const { data: rows, error: camposError } = await supabase
    .from("netsuite_campos")
    .select("id, tabla, campo, modo, etiqueta, tipo, habilitado, orden")
    .in("id", campoIds as string[])
    .eq("habilitado", true)
    .order("orden");
  if (camposError) {
    return jsonError("No se pudo leer el catálogo de campos.", "internal", 500);
  }
  const campos = (rows ?? []) as CampoCatalogo[];
  if (campos.length === 0) {
    return jsonError(
      "Ninguno de los campos seleccionados está habilitado en el catálogo.",
      "invalid_fields",
      400,
    );
  }

  try {
    const result = await exportarBancos({
      fechaInicio,
      fechaFin,
      campos,
      userId,
      signal: request.signal,
    });
    console.info(
      `[export-bancos] ${result.fileName}: ${result.filas} filas en ${result.duracionMs} ms`,
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[export-bancos]", err);
    if (err instanceof NetSuiteError) {
      return jsonError(err.message, err.code, NETSUITE_STATUS[err.code]);
    }
    if (err instanceof ExportStorageError) {
      return jsonError(err.message, err.code, 502);
    }
    return jsonError("Error inesperado al generar el Excel.", "internal", 500);
  }
}
