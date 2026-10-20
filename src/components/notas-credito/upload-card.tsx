"use client";

import { useCallback, useRef, useState } from "react";

import {
  ACCEPTED_EXTENSIONS_WITH_DOTS,
  FileDropZone,
  SelectedFileChip,
  formatBytes,
  type FileSlotState,
} from "@/components/common/file-upload";

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
      data-tour="subir"
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
        accept={ACCEPTED_EXTENSIONS_WITH_DOTS.join(",")}
        className="sr-only"
        onChange={onChange}
        disabled={disabled}
      />

      {!file ? (
        <FileDropZone
          dragOver={dragOver}
          disabled={disabled}
          ariaLabel="Seleccionar archivo de notas crédito"
          onClick={openPicker}
          onKeyDown={onKeyDown}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />
      ) : (
        <SelectedFileChip
          file={file}
          state={status}
          busy={disabled}
          onRemove={onRemove}
          onSubmit={onSubmit}
          onRetry={onRetry}
          showSubmit={status === "idle"}
          showRetry={status === "error"}
        />
      )}
    </section>
  );
}

export { formatBytes };
export type { FileSlotState };
