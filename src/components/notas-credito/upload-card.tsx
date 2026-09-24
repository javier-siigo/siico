"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload, X } from "lucide-react";

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

interface UploadCardProps {
  status: NotasCreditoRun["status"];
  file: File | null;
  onSelect: (file: File) => void;
  onSubmit: () => void;
  onRemove: () => void;
  onRetry: () => void;
}

export function UploadCard({
  status,
  file,
  onSelect,
  onSubmit,
  onRemove,
  onRetry,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFile = useCallback(
    (next: File | null) => {
      if (!next) return;
      onSelect(next);
      if (inputRef.current) inputRef.current.value = "";
    },
    [onSelect],
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFile(e.target.files?.[0] ?? null);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const onDragLeave = useCallback(() => setDragOver(false), []);
  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      handleFile(e.dataTransfer.files?.[0] ?? null);
    },
    [handleFile],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPicker();
      }
    },
    [openPicker],
  );

  const disabled = status === "uploading" || status === "processing";

  return (
    <section
      aria-labelledby="upload-title"
      className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-sm"
    >
      <header className="flex flex-col gap-1.5">
        <h2
          id="upload-title"
          className="text-base font-semibold tracking-tight text-foreground"
        >
          Subir archivo
        </h2>
        <p className="text-sm text-muted-foreground">
          Arrastra o selecciona el archivo Excel con las notas crédito a
          conciliar contra NetSuite.
        </p>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="sr-only"
        onChange={onChange}
        disabled={disabled}
      />

      {!file ? (
        <DropZone
          dragOver={dragOver}
          disabled={disabled}
          onClick={openPicker}
          onKeyDown={onKeyDown}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />
      ) : (
        <SelectedFilePanel
          file={file}
          status={status}
          onSubmit={onSubmit}
          onRemove={onRemove}
          onRetry={onRetry}
        />
      )}
    </section>
  );
}

function DropZone({
  dragOver,
  disabled,
  onClick,
  onKeyDown,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  dragOver: boolean;
  disabled: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Seleccionar archivo de notas crédito"
      onClick={disabled ? undefined : onClick}
      onKeyDown={onKeyDown}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={
        "flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
        (dragOver
          ? "border-primary bg-primary/5"
          : "border-border hover:border-foreground/30 hover:bg-muted/40")
      }
    >
      <div
        aria-hidden
        className="flex size-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground"
      >
        <Upload className="size-4" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">
          Arrastra tu archivo aquí
        </span>
        <span className="text-xs text-muted-foreground">
          o haz clic para seleccionarlo · .xlsx, .xls, .csv (máx. 10 MB)
        </span>
      </div>
    </div>
  );
}

function SelectedFilePanel({
  file,
  status,
  onSubmit,
  onRemove,
  onRetry,
}: {
  file: File;
  status: NotasCreditoRun["status"];
  onSubmit: () => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const attachmentState = status;
  const canSubmit = status === "idle";
  const canRetry = status === "error";
  const isBusy = status === "uploading" || status === "processing";

  const titleText = file.name;
  const sizeLabel = useMemo(() => formatBytes(file.size), [file.size]);
  const verbLabel = useMemo(() => {
    if (status === "uploading") return "subiendo…";
    if (status === "processing") return "procesando…";
    if (status === "done") return "enviado";
    if (status === "error") return "falló";
    return null;
  }, [status]);

  return (
    <Attachment
      state={attachmentState}
      orientation="horizontal"
      className="w-full min-w-0"
    >
      <AttachmentMedia>
        {isBusy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <FileSpreadsheet className="size-4" aria-hidden />
        )}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{titleText}</AttachmentTitle>
        <AttachmentDescription>
          <span className="font-mono text-sm tabular-nums">{sizeLabel}</span>
          {verbLabel && (
            <>
              {" · "}
              <span className="font-medium uppercase tracking-wide">
                {verbLabel}
              </span>
            </>
          )}
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction
          variant="ghost"
          size="icon-xs"
          aria-label="Quitar archivo"
          title="Quitar archivo"
          onClick={onRemove}
          disabled={isBusy}
        >
          <X className="size-4" aria-hidden />
        </AttachmentAction>
        {canSubmit && (
          <Button size="sm" variant="default" onClick={onSubmit}>
            Procesar
          </Button>
        )}
        {canRetry && (
          <Button size="sm" variant="default" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </AttachmentActions>
    </Attachment>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
