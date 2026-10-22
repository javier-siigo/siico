import { NextResponse, after } from "next/server";

import { tiposFiltro } from "@/lib/netsuite/filtros";
import {
  camposHabilitados,
  esUuid,
  jsonError,
  leerSesion,
  respuestaDeError,
} from "@/lib/netsuite/peticion-bancos";
import { leerValoresGuardados, refrescarValores, vencido } from "@/lib/netsuite/valores-campo";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Valores posibles de un campo para el filtro de lista, desde la caché
 * (`netsuite_campo_valores`). Si no hay caché se consulta NetSuite; si está
 * vencida se responde con ella y se refresca después de responder.
 * `actualizar: true` fuerza la consulta.
 */
export async function POST(request: Request) {
  const sesion = await leerSesion(request);
  if (!sesion.ok) return sesion.response;
  const { supabase, body } = sesion.data;

  if (!esUuid(body.campoId)) return jsonError("Falta el campo.", "invalid_fields", 400);
  const campos = await camposHabilitados(supabase, [body.campoId]);
  if (!campos.ok) return campos.response;
  const campo = campos.data.get(body.campoId);
  if (!campo) return jsonError("El campo no está habilitado en el catálogo.", "invalid_fields", 400);
  if (!tiposFiltro(campo.tipo).includes("lista")) {
    return jsonError(`“${campo.etiqueta}” no admite filtro por lista.`, "invalid_filters", 400);
  }

  try {
    const guardados = body.actualizar === true ? null : await leerValoresGuardados(campo.id);
    if (guardados) {
      const refrescando = vencido(guardados);
      if (refrescando) {
        after(() =>
          refrescarValores(campo).catch((err) => console.error("[export-bancos/opciones] refresco", err)),
        );
      }
      return NextResponse.json({ ...guardados, refrescando }, { headers: { "Cache-Control": "no-store" } });
    }
    // Sin la señal de la petición: si el usuario cierra el filtro, el
    // resultado igual queda guardado para la próxima vez.
    const valores = await refrescarValores(campo);
    return NextResponse.json({ ...valores, refrescando: false }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return (
      respuestaDeError(err, "export-bancos/opciones") ??
      jsonError("Error inesperado al leer los valores del campo.", "internal", 500)
    );
  }
}
