"use client";

import { useMemo } from "react";
import {
  Download,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";

import type { NotasCreditoRun } from "./types";

interface ResultCardProps {
  run: NotasCreditoRun | null;
  onDownload: (run: NotasCreditoRun) => void;
  onRetry: () => void;
}

export function ResultCard({ run, onDownload, onRetry }: ResultCardProps) {
  const state = run?.status ?? "idle";
  const title = useMemo(() => {
    if (!run || run.status === "idle") return "Sin resultado aún";
    if (run.status === "uploading") return "Subiendo archivo…";
    if (run.status === "processing") return "Conciliando con NetSuite…";
    if (run.status === "done") return run.resultFilename ?? "Listo para descargar";
    return "No se pudo conciliar";
  }, [run]);

  const description = useMemo(() => {
    if (!run || run.status === "idle")
      return (
        <>
          Sube un archivo en el panel izquierdo para iniciar la conciliación.
        </>
      );
    if (run.status === "uploading")
      return (
        <>
          {run.sourceFilename}
          {" · "}
          <span className="font-mono text-sm tabular-nums">
            {formatBytes(run.sourceSize)}
          </span>
        </>
      );
    if (run.status === "processing")
      return (
        <>
          Esto puede tardar unos segundos dependiendo del tamaño del archivo.
        </>
      );
    if (run.status === "done")
      return run.resultSize != null ? (
        <>
          Listo
          {" · "}
          <span className="font-mono text-sm tabular-nums">
            {formatBytes(run.resultSize)}
          </span>
        </>
      ) : (
        <>Listo para descargar</>
      );
    return <>{run.error ?? "Vuelve a intentarlo o cambia el archivo."}</>;
  }, [run]);

  return (
    <section
      aria-labelledby="result-title"
      aria-live="polite"
      className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-sm"
    >
      <header className="flex flex-col gap-1.5">
        <h2
          id="result-title"
          className="text-base font-semibold tracking-tight text-foreground"
        >
          Resultado
        </h2>
        <p className="text-sm text-muted-foreground">
          Conciliación procesada por el flujo de n8n.
        </p>
      </header>

      <Attachment
        state={state}
        orientation="horizontal"
        className="w-full min-w-0"
      >
        <AttachmentMedia>
          <FileSpreadsheet className="size-4" aria-hidden />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>{title}</AttachmentTitle>
          <AttachmentDescription>{description}</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          {run?.status === "done" && (
            <>
              <AttachmentAction
                variant="ghost"
                size="icon-xs"
                aria-label="Descargar resultado"
                title="Descargar resultado"
                onClick={() => onDownload(run)}
              >
                <Download className="size-4" aria-hidden />
              </AttachmentAction>
              <Button
                size="sm"
                variant="default"
                onClick={() => onDownload(run)}
              >
                Descargar
              </Button>
            </>
          )}
          {run?.status === "error" && (
            <Button size="sm" variant="default" onClick={onRetry}>
              <RefreshCw className="size-4" aria-hidden />
              Reintentar
            </Button>
          )}
        </AttachmentActions>
      </Attachment>
    </section>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
