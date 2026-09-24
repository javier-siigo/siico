"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { HistoryList } from "./history-list";
import { ResultCard } from "./result-card";
import { UploadCard } from "./upload-card";
import type { NotasCreditoRun, NotasCreditoRunStatus } from "./types";

function createRunId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Tu sesión expiró. Vuelve a iniciar sesión.",
  bad_request: "Solicitud inválida al servidor.",
  missing_file: "Falta el archivo a conciliar.",
  invalid_type: "Tipo de archivo no soportado. Usa .xlsx, .xls o .csv.",
  file_too_large: "El archivo supera el límite de 10 MB.",
  upstream_config: "Falta configurar la URL del flujo de conciliación.",
  upstream_timeout: "La conciliación tardó demasiado.",
  upstream_network: "No se pudo contactar el servicio de conciliación.",
  upstream_status: "El servicio de conciliación devolvió un error.",
  upstream_empty: "El servicio devolvió un archivo vacío.",
  internal: "Error inesperado al conciliar.",
};

export function NotasCreditoPageClient() {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [currentRun, setCurrentRun] = useState<NotasCreditoRun | null>(null);
  const [history, setHistory] = useState<NotasCreditoRun[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const blobUrlsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      for (const url of blobUrlsRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      blobUrlsRef.current.clear();
    };
  }, []);

  const handleSelect = useCallback(
    (file: File) => {
      setPendingFile(file);
      setCurrentRun((prev) =>
        prev && (prev.status === "done" || prev.status === "error")
          ? null
          : prev,
      );
    },
    [],
  );

  const handleRemove = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPendingFile(null);
    setCurrentRun(null);
  }, []);

  const finalizeRun = useCallback(
    (run: NotasCreditoRun) => {
      setHistory((prev) => [run, ...prev].slice(0, 10));
      setCurrentRun(run);
    },
    [],
  );

  const runConciliacion = useCallback(
    async (file: File) => {
      const id = createRunId();
      const baseRun: NotasCreditoRun = {
        id,
        status: "uploading",
        sourceFilename: file.name,
        sourceSize: file.size,
        startedAt: Date.now(),
      };
      setCurrentRun(baseRun);

      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      try {
        const fd = new FormData();
        fd.append("file", file);

        const response = await fetch("/api/notas-credito/conciliar", {
          method: "POST",
          body: fd,
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string; code?: string }
            | null;
          const code = payload?.code ?? "internal";
          const message = payload?.error ?? ERROR_MESSAGES[code] ?? "Error al conciliar";
          const failed: NotasCreditoRun = {
            ...baseRun,
            status: "error",
            error: message,
            finishedAt: Date.now(),
          };
          finalizeRun(failed);
          toast.error(message);
          return;
        }

        setCurrentRun({ ...baseRun, status: "processing" });

        const blob = await response.blob();
        const contentType =
          response.headers.get("content-type")?.split(";")[0]?.trim() ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        const cd = response.headers.get("content-disposition") ?? "";
        const filename =
          /filename\*=UTF-8''([^;]+)/i.exec(cd)?.[1] ??
          /filename="?([^";]+)"?/i.exec(cd)?.[1] ??
          "resultado_netsuite.xlsx";

        const decodedFilename = (() => {
          try {
            return decodeURIComponent(filename);
          } catch {
            return filename;
          }
        })();

        const url = URL.createObjectURL(blob);
        blobUrlsRef.current.set(id, url);

        const done: NotasCreditoRun = {
          ...baseRun,
          status: "done",
          resultBlob: blob,
          resultContentType: contentType,
          resultFilename: decodedFilename,
          resultSize: blob.size,
          finishedAt: Date.now(),
        };
        finalizeRun(done);
        toast.success("Conciliación lista para descargar");
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setCurrentRun(null);
          return;
        }
        const message =
          (err as Error).message || "No se pudo contactar el servicio.";
        const failed: NotasCreditoRun = {
          ...baseRun,
          status: "error",
          error: message,
          finishedAt: Date.now(),
        };
        finalizeRun(failed);
        toast.error(message);
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [finalizeRun],
  );

  const handleSubmit = useCallback(() => {
    if (!pendingFile) return;
    void runConciliacion(pendingFile);
  }, [pendingFile, runConciliacion]);

  const handleRetry = useCallback(() => {
    if (!currentRun) return;
    if (!pendingFile) {
      setCurrentRun(null);
      return;
    }
    void runConciliacion(pendingFile);
  }, [currentRun, pendingFile, runConciliacion]);

  const triggerDownload = useCallback((run: NotasCreditoRun) => {
    const blob = run.resultBlob;
    if (!blob) return;
    const url =
      blobUrlsRef.current.get(run.id) ?? URL.createObjectURL(blob);
    if (!blobUrlsRef.current.has(run.id)) {
      blobUrlsRef.current.set(run.id, url);
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = run.resultFilename ?? "resultado_netsuite.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  const status: NotasCreditoRunStatus = currentRun?.status ?? "idle";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          Notas crédito
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Conciliación de notas crédito contra NetSuite.
        </p>
        <p className="max-w-2xl text-xs text-muted-foreground">
          Sube el archivo{" "}
          <span className="font-mono">INFORME</span>
          , ejecuta el flujo y descarga el resultado con las columnas de
          duplicados resueltas.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <UploadCard
          status={status === "idle" && pendingFile ? "idle" : status}
          file={pendingFile}
          onSelect={handleSelect}
          onSubmit={handleSubmit}
          onRemove={handleRemove}
          onRetry={handleRetry}
        />
        <ResultCard
          run={currentRun}
          onDownload={triggerDownload}
          onRetry={handleRetry}
        />
      </div>

      <HistoryList runs={history} onDownload={triggerDownload} />
    </div>
  );
}
