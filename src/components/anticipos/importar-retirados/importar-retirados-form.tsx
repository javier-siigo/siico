"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  importarRetiradosAction,
  type ImportarRetiradosState,
} from "@/lib/retirados/actions";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPT = ".xlsx,.xls";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ImportarRetiradosForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState<
    ImportarRetiradosState | undefined,
    FormData
  >(importarRetiradosAction, undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) return;
    if (state.error) {
      toast.error(state.error);
    } else if (state.ok) {
      const desc =
        state.errors && state.errors > 0
          ? `Errores: ${state.errors}`
          : "Sin errores";
      toast.success(
        `Importación completa — Filas: ${state.total}, Procesadas: ${state.upserted}. ${desc}`,
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (formRef.current) formRef.current.reset();
    }
  }, [state]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalError(null);
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setLocalError("Solo se aceptan archivos .xlsx o .xls.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setLocalError("El archivo supera 5 MB.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="retirados-file">Archivo de Excel</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label
            htmlFor="retirados-file"
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
              pending && "pointer-events-none opacity-60",
            )}
          >
            <FileSpreadsheet className="size-4" />
            <span>Seleccionar archivo</span>
          </label>
          <Input
            ref={fileInputRef}
            id="retirados-file"
            name="file"
            type="file"
            accept={ACCEPT}
            onChange={handleFileChange}
            disabled={pending}
            className="sr-only"
          />
          <span
            className={cn(
              "min-w-0 truncate text-sm",
              selectedFile ? "text-foreground" : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {selectedFile
              ? `${selectedFile.name} (${formatBytes(selectedFile.size)})`
              : "Sin archivo seleccionado"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          .xlsx o .xls, máximo 5 MB.
        </p>
        {localError ? (
          <p className="text-xs text-destructive" role="alert">
            {localError}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button
          type="submit"
          disabled={pending || !selectedFile}
          className="min-w-[10rem]"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Importando…
            </>
          ) : (
            <>
              <Upload className="size-4" />
              Importar
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
