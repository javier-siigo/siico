"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { BankCombobox } from "./bank-combobox";
import { DualUploadCard } from "./dual-upload-card";
import { Button } from "@/components/ui/button";
import type {
  BancoConciliacion,
  ConciliacionRun,
  ConciliacionRunStatus,
  Pais,
} from "./types";

type ErrorCode =
  | "unauthorized"
  | "bad_request"
  | "missing_file"
  | "invalid_type"
  | "file_too_large"
  | "upload_failed"
  | "upload_unauthorized"
  | "storage_unauthorized"
  | "storage_not_found"
  | "upstream_config"
  | "upstream_timeout"
  | "upstream_network"
  | "upstream_status"
  | "upstream_empty"
  | "internal";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  unauthorized: "Tu sesión expiró. Vuelve a iniciar sesión.",
  bad_request: "Solicitud inválida al servidor.",
  missing_file: "Falta el archivo principal a conciliar.",
  invalid_type: "Tipo de archivo no soportado. Usa .xlsx, .xls o .csv.",
  file_too_large: "El archivo supera el límite de 10 MB.",
  upload_failed: "No se pudo subir el archivo. Intenta de nuevo.",
  upload_unauthorized:
    "No tienes permiso para subir el archivo. Vuelve a iniciar sesión.",
  storage_unauthorized: "No tienes acceso a este archivo.",
  storage_not_found: "El archivo subido ya no está disponible. Súbelo de nuevo.",
  upstream_config: "Falta configurar la URL del flujo de conciliación.",
  upstream_timeout: "La conciliación tardó más de 5 minutos.",
  upstream_network: "No se pudo contactar el servicio de conciliación.",
  upstream_status: "El servicio de conciliación devolvió un error.",
  upstream_empty: "El servicio devolvió un archivo vacío.",
  internal: "Error inesperado al conciliar.",
};

function asErrorCode(value: string | undefined): ErrorCode {
  return value && value in ERROR_MESSAGES ? (value as ErrorCode) : "internal";
}

function createRunId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface UploadResult {
  path: string;
}

interface UploadArgs {
  file: File;
  kind: "principal" | "previo";
}

interface ConciliacionesPageClientProps {
  pais: Pais;
  bancos: BancoConciliacion[];
}

const PAIS_LABEL: Record<Pais, string> = {
  CO: "Colombia",
  MX: "México",
  UY: "Uruguay",
  CL: "Chile",
  EC: "Ecuador",
};

export function ConciliacionesPageClient({
  pais,
  bancos,
}: ConciliacionesPageClientProps) {
  const [banco, setBanco] = React.useState<BancoConciliacion | null>(null);
  const [principalFile, setPrincipalFile] = React.useState<File | null>(null);
  const [previoFile, setPrevioFile] = React.useState<File | null>(null);
  const [currentRun, setCurrentRun] = React.useState<ConciliacionRun | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);
  const blobUrlsRef = React.useRef<Map<string, string>>(new Map());

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
      for (const url of blobUrlsRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      blobUrlsRef.current.clear();
    };
  }, []);

  const handleSelectPrincipal = React.useCallback((file: File) => {
    setPrincipalFile(file);
    setCurrentRun((prev) =>
      prev && (prev.status === "done" || prev.status === "error") ? null : prev,
    );
  }, []);

  const handleSelectPrevio = React.useCallback((file: File) => {
    setPrevioFile(file);
  }, []);

  const handleRemovePrincipal = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPrincipalFile(null);
    setCurrentRun(null);
  }, []);

  const handleRemovePrevio = React.useCallback(() => {
    setPrevioFile(null);
  }, []);

  const handleClearBanco = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBanco(null);
    setCurrentRun(null);
  }, []);

  async function uploadOne(
    args: UploadArgs,
    signal: AbortSignal,
  ): Promise<UploadResult> {
    const presignRes = await fetch("/api/conciliaciones/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pais,
        kind: args.kind,
        filename: args.file.name,
        contentType: args.file.type || "application/octet-stream",
        size: args.file.size,
      }),
      signal,
    });

    if (!presignRes.ok) {
      const payload = (await presignRes.json().catch(() => null)) as
        | { error?: string; code?: string }
        | null;
      const code = asErrorCode(payload?.code);
      throw new Error(payload?.error ?? ERROR_MESSAGES[code]);
    }

    const { url, path } = (await presignRes.json()) as { url: string; path: string };

    const uploadRes = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": args.file.type || "application/octet-stream",
      },
      body: args.file,
      signal,
    });

    if (!uploadRes.ok) {
      const code: ErrorCode =
        uploadRes.status === 401 || uploadRes.status === 403
          ? "upload_unauthorized"
          : "upload_failed";
      throw new Error(ERROR_MESSAGES[code]);
    }

    return { path };
  }

  const runConciliacion = React.useCallback(
    async (bancoSel: BancoConciliacion, principal: File, previo: File | null) => {
      const id = createRunId();
      const baseRun: ConciliacionRun = {
        id,
        status: "uploading",
        banco: bancoSel.slug,
        bancoNombre: bancoSel.nombre,
        principalFilename: principal.name,
        principalSize: principal.size,
        previoFilename: previo?.name,
        previoSize: previo?.size,
        startedAt: Date.now(),
      };
      setCurrentRun(baseRun);

      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;
      const { signal } = controller;

      const fail = (message: string) => {
        const failed: ConciliacionRun = {
          ...baseRun,
          status: "error",
          error: message,
          finishedAt: Date.now(),
        };
        setCurrentRun(failed);
        toast.error(message);
      };

      try {
        const principalUpload = await uploadOne(
          { file: principal, kind: "principal" },
          signal,
        );
        let previoUpload: UploadResult | null = null;
        if (previo) {
          previoUpload = await uploadOne({ file: previo, kind: "previo" }, signal);
        }

        setCurrentRun({ ...baseRun, status: "processing" });

        const conciliarRes = await fetch("/api/conciliaciones/conciliar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pais,
            banco: bancoSel.slug,
            bancoNombre: bancoSel.nombre,
            storagePathPrincipal: principalUpload.path,
            originalNamePrincipal: principal.name,
            storagePathPrevio: previoUpload?.path,
            originalNamePrevio: previo?.name,
          }),
          signal,
        });

        if (!conciliarRes.ok) {
          const payload = (await conciliarRes.json().catch(() => null)) as
            | { error?: string; code?: string }
            | null;
          // Sin JSON y con 504 es Vercel cortando la función por tiempo.
          const code =
            !payload && conciliarRes.status === 504
              ? "upstream_timeout"
              : asErrorCode(payload?.code);
          const message = payload?.error ?? ERROR_MESSAGES[code] ?? "Error al conciliar";
          fail(message);
          return;
        }

        const blob = await conciliarRes.blob();
        const contentType =
          conciliarRes.headers.get("content-type")?.split(";")[0]?.trim() ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        const cd = conciliarRes.headers.get("content-disposition") ?? "";
        const filename =
          /filename\*=UTF-8''([^;]+)/i.exec(cd)?.[1] ??
          /filename="?([^";]+)"?/i.exec(cd)?.[1] ??
          `resultado_${bancoSel.slug}.xlsx`;

        const decodedFilename = (() => {
          try {
            return decodeURIComponent(filename);
          } catch {
            return filename;
          }
        })();

        const blobUrl = URL.createObjectURL(blob);
        blobUrlsRef.current.set(id, blobUrl);

        const done: ConciliacionRun = {
          ...baseRun,
          status: "done",
          resultBlob: blob,
          resultContentType: contentType,
          resultFilename: decodedFilename,
          resultSize: blob.size,
          finishedAt: Date.now(),
        };
        setCurrentRun(done);
        toast.success("Conciliación lista para descargar");
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setCurrentRun(null);
          return;
        }
        fail((err as Error).message || "No se pudo contactar el servicio.");
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [pais],
  );

  const handleSubmit = React.useCallback(() => {
    if (!banco || !principalFile) return;
    void runConciliacion(banco, principalFile, previoFile);
  }, [banco, principalFile, previoFile, runConciliacion]);

  const triggerDownload = React.useCallback((run: ConciliacionRun) => {
    const blob = run.resultBlob;
    if (!blob) return;
    const url =
      blobUrlsRef.current.get(run.id) ?? URL.createObjectURL(blob);
    if (!blobUrlsRef.current.has(run.id)) {
      blobUrlsRef.current.set(run.id, url);
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = run.resultFilename ?? `resultado_${run.banco}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  const isBusy =
    currentRun?.status === "uploading" || currentRun?.status === "processing";
  const canSubmit = !!banco && !!principalFile && !isBusy;

  const idleFileStatus: ConciliacionRunStatus = "idle";
  const principalStatus: ConciliacionRunStatus =
    currentRun?.status === "done" || currentRun?.status === "error"
      ? idleFileStatus
      : (currentRun?.status ?? idleFileStatus);

  const previoStatus: ConciliacionRunStatus =
    currentRun?.status === "done" || currentRun?.status === "error"
      ? idleFileStatus
      : (currentRun?.status ?? idleFileStatus);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          Conciliación {PAIS_LABEL[pais]}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Conciliación contable para operaciones en {PAIS_LABEL[pais]}. Selecciona el
          banco, carga el extracto bancario del período y, si cuentas con uno,
          el reporte previo.
        </p>
      </header>

      <section
        aria-labelledby="banco-title"
        className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm"
      >
        <header className="flex flex-col gap-1.5">
          <h2
            id="banco-title"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            Banco a conciliar
          </h2>
          <p className="text-sm text-muted-foreground">
            El banco determina el flujo de n8n que se ejecuta.
          </p>
        </header>
        <div className="flex flex-col gap-2">
          <BankCombobox
            bancos={bancos}
            value={banco}
            onChange={(b) => {
              handleClearBanco();
              setBanco(b);
            }}
            disabled={isBusy}
          />
          {banco?.descripcion && (
            <p className="text-xs text-muted-foreground">{banco.descripcion}</p>
          )}
        </div>
      </section>

      <DualUploadCard
        principalFile={principalFile}
        principalStatus={principalStatus}
        previoFile={previoFile}
        previoStatus={previoStatus}
        onSelectPrincipal={handleSelectPrincipal}
        onRemovePrincipal={handleRemovePrincipal}
        onSelectPrevio={handleSelectPrevio}
        onRemovePrevio={handleRemovePrevio}
        disabled={isBusy}
      />

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isBusy ? "Procesando…" : "Procesar conciliación"}
        </Button>
        {currentRun?.status === "done" && (
          <Button
            type="button"
            onClick={() => triggerDownload(currentRun)}
          >
            <Download className="size-4" aria-hidden />
            Descargar
          </Button>
        )}
      </div>
    </div>
  );
}
