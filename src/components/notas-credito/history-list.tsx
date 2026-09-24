"use client";

import { Download } from "lucide-react";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";

import type { NotasCreditoRun } from "./types";

interface HistoryListProps {
  runs: NotasCreditoRun[];
  onDownload: (run: NotasCreditoRun) => void;
}

export function HistoryList({ runs, onDownload }: HistoryListProps) {
  if (runs.length === 0) return null;

  return (
    <section
      aria-labelledby="history-title"
      className="flex min-w-0 flex-col gap-3"
    >
      <header className="flex items-baseline justify-between gap-3">
        <h2
          id="history-title"
          className="text-base font-semibold tracking-tight text-foreground"
        >
          Historial de esta sesión
        </h2>
        <span className="text-xs tabular-nums text-muted-foreground">
          <span className="font-mono">{runs.length}</span>
          {" "}
          {runs.length === 1 ? "corrida" : "corridas"}
        </span>
      </header>

      <div className="flex flex-col gap-2">
        {runs.map((run) => (
          <HistoryItem key={run.id} run={run} onDownload={onDownload} />
        ))}
      </div>
    </section>
  );
}

function HistoryItem({
  run,
  onDownload,
}: {
  run: NotasCreditoRun;
  onDownload: (run: NotasCreditoRun) => void;
}) {
  const title = run.resultFilename ?? run.sourceFilename;
  const size = formatBytes(run.sourceSize);
  const time = formatTime(run.finishedAt ?? run.startedAt);
  const showSource = run.status === "done" && run.sourceFilename !== run.resultFilename;

  return (
    <Attachment
      state={run.status}
      orientation="horizontal"
      size="sm"
      className="w-full min-w-0"
    >
      <AttachmentMedia />
      <AttachmentContent>
        <AttachmentTitle>{title}</AttachmentTitle>
        <div className="mt-0.5 flex min-w-0 flex-col gap-1">
          <span className="block min-w-0 truncate text-xs text-muted-foreground">
            <span className="font-mono text-sm tabular-nums">{size}</span>
            <span aria-hidden> · </span>
            <span className="font-mono text-sm tabular-nums">{time}</span>
            {showSource && (
              <>
                <span aria-hidden> · </span>
                <span>{run.sourceFilename}</span>
              </>
            )}
          </span>
          {run.status === "error" && run.error && (
            <span className="block min-w-0 truncate text-xs text-destructive/80">
              {run.error}
            </span>
          )}
        </div>
      </AttachmentContent>
      {run.status === "done" && (
        <AttachmentActions>
          <AttachmentAction
            variant="ghost"
            size="icon-xs"
            aria-label="Descargar de nuevo"
            title="Descargar de nuevo"
            onClick={() => onDownload(run)}
          >
            <Download className="size-4" aria-hidden />
          </AttachmentAction>
        </AttachmentActions>
      )}
    </Attachment>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatTime(epoch: number): string {
  const d = new Date(epoch);
  return d.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
