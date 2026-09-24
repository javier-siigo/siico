import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_PREFIXES,
  ConciliarError,
  MAX_FILE_SIZE_BYTES,
  conciliarNotasCredito,
} from "@/lib/notas-credito/conciliar";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return NextResponse.json(
      { error: "Sesión requerida", code: "unauthorized" },
      { status: 401 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo inválido: se esperaba multipart/form-data", code: "bad_request" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Falta el archivo a conciliar", code: "missing_file" },
      { status: 400 },
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeOk = ACCEPTED_MIME_PREFIXES.some((p) => file.type.startsWith(p));
  const extOk = (ACCEPTED_EXTENSIONS as readonly string[]).includes(extension);
  if (!mimeOk && !extOk) {
    return NextResponse.json(
      {
        error: "Tipo de archivo no soportado. Usa .xlsx, .xls o .csv.",
        code: "invalid_type",
      },
      { status: 415 },
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: "El archivo supera el límite de 10 MB.",
        code: "file_too_large",
      },
      { status: 413 },
    );
  }

  try {
    const result = await conciliarNotasCredito(file);
    const arrayBuffer = await result.blob.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof ConciliarError) {
      const message =
        err.code === "upstream_status" && err.status >= 500
          ? "El servicio de conciliación no está disponible. Intenta de nuevo."
          : err.code === "upstream_timeout"
            ? "La conciliación tardó demasiado. Intenta con un archivo más pequeño."
            : err.code === "upstream_empty"
              ? "El servicio devolvió un archivo vacío."
              : err.message;
      return NextResponse.json(
        { error: message, code: err.code },
        { status: err.status },
      );
    }
    return NextResponse.json(
      {
        error: "Error inesperado al conciliar",
        code: "internal",
      },
      { status: 500 },
    );
  }
}
