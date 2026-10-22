import { NextResponse } from "next/server";

import { ExportStorageError, exportarBancos } from "@/lib/netsuite/export-bancos";
import {
  camposHabilitados,
  esUuid,
  jsonError,
  leerFiltros,
  leerPeticion,
  respuestaDeError,
} from "@/lib/netsuite/peticion-bancos";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const peticion = await leerPeticion(request);
  if (!peticion.ok) return peticion.response;
  const { supabase, userId, body, fechaInicio, fechaFin } = peticion.data;

  const { campos: campoIds } = body;
  if (
    !Array.isArray(campoIds) ||
    campoIds.length === 0 ||
    campoIds.length > 500 ||
    !campoIds.every(esUuid)
  ) {
    return jsonError("Selecciona al menos un campo.", "invalid_fields", 400);
  }

  const columnas = await camposHabilitados(supabase, campoIds);
  if (!columnas.ok) return columnas.response;
  // En el orden pedido (el de la plantilla), no en el del catálogo.
  const campos = [...new Set(campoIds)].flatMap((id) => columnas.data.get(id) ?? []);
  if (campos.length === 0) {
    return jsonError(
      "Ninguno de los campos seleccionados está habilitado en el catálogo.",
      "invalid_fields",
      400,
    );
  }

  const filtros = await leerFiltros(supabase, body.filtros);
  if (!filtros.ok) return filtros.response;

  try {
    const result = await exportarBancos({
      fechaInicio,
      fechaFin,
      campos,
      filtros: filtros.data.filtros,
      camposFiltro: filtros.data.campos,
      userId,
      signal: request.signal,
    });
    console.info(
      `[export-bancos] ${result.fileName}: ${result.filas} filas en ${result.duracionMs} ms` +
        ` (${filtros.data.filtros.length} filtros)`,
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof ExportStorageError) {
      console.error("[export-bancos]", err);
      return jsonError(err.message, err.code, 502);
    }
    return (
      respuestaDeError(err, "export-bancos") ??
      jsonError("Error inesperado al generar el Excel.", "internal", 500)
    );
  }
}
