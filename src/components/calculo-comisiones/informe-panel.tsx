"use client";

import { useRef, useState } from "react";
import { AlertCircle, FileSpreadsheet, Loader2, RefreshCw, X } from "lucide-react";

import { FileDropZone, formatBytes } from "@/components/common/file-upload";
import { Button } from "@/components/ui/button";
import type { CierreGuardado } from "@/lib/comisiones/types";

import { formatNumber, formatShortDateTime } from "./format";
import { ProgressBar } from "./progress-bar";
import type { EstadoLectura } from "./use-informe-diferido";

interface InformeCardProps {
  lectura: EstadoLectura;
  guardado: CierreGuardado | null;
  onArchivo: (file: File) => void;
  onQuitar: () => void;
}

const FASES: Record<string, { label: string; desde: number; hasta: number }> = {
  abriendo: { label: "Abriendo archivo…", desde: 0, hasta: 0.02 },
  textos: { label: "Leyendo textos del Excel…", desde: 0.02, hasta: 0.2 },
  filas: { label: "Leyendo filas y agrupando facturas…", desde: 0.2, hasta: 0.98 },
  agrupando: { label: "Calculando totales…", desde: 0.98, hasta: 1 },
};

export function InformePanel({
  lectura,
  guardado,
  onArchivo,
  onQuitar,
}: InformeCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [invalido, setInvalido] = useState(false);

  const pick = () => inputRef.current?.click();
  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setInvalido(true);
      return;
    }
    onArchivo(file);
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept=".xlsx"
      className="hidden"
      onChange={(e) => {
        setInvalido(false);
        accept(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  return (
    <div className="flex flex-col gap-3">
        {input}

        {lectura.estado === "vacio" && (
          <>
            {guardado && (
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Cierre guardado con{" "}
                <span className="font-medium text-foreground">
                  {guardado.archivoNombre}
                </span>{" "}
                ({formatShortDateTime(guardado.createdAt)}). Cárgalo de nuevo para
                ver el detalle por comprobante o recalcular.
              </div>
            )}
            <FileDropZone
              dragOver={dragOver}
              disabled={false}
              ariaLabel="Seleccionar informe diferido"
              hint="o haz clic para seleccionarlo · .xlsx de cualquier tamaño"
              onClick={pick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  pick();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                setInvalido(false);
                accept(e.dataTransfer.files?.[0]);
              }}
            />
            {invalido && (
              <p role="alert" className="text-xs text-destructive">
                El informe debe ser un archivo .xlsx.
              </p>
            )}
          </>
        )}

        {lectura.estado === "leyendo" && (
          <Leyendo lectura={lectura} onCancelar={onQuitar} />
        )}

        {lectura.estado === "listo" && (
          <ArchivoChip
            nombre={lectura.resultado.archivoNombre}
            detalle={`${formatBytes(lectura.resultado.archivoTamano)} · ${formatNumber(lectura.resultado.documentos.length)} comprobantes F93/F94 · leído en ${(lectura.resultado.duracionMs / 1000).toFixed(1)} s`}
            onCambiar={pick}
            onQuitar={onQuitar}
          />
        )}

        {lectura.estado === "error" && (
          <div className="flex flex-col gap-3">
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive dark:bg-destructive/10"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium">
                  No se pudo leer {lectura.archivo.name}
                </span>
                <span className="text-xs opacity-90">{lectura.mensaje}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onArchivo(lectura.archivo)}>
                <RefreshCw className="size-3.5" />
                Reintentar
              </Button>
              <Button size="sm" variant="ghost" onClick={pick}>
                Elegir otro archivo
              </Button>
            </div>
          </div>
        )}
      </div>
  );
}

function Leyendo({
  lectura,
  onCancelar,
}: {
  lectura: Extract<EstadoLectura, { estado: "leyendo" }>;
  onCancelar: () => void;
}) {
  const fase = FASES[lectura.progreso.fase] ?? FASES.abriendo!;
  const total =
    fase.desde + (fase.hasta - fase.desde) * Math.min(1, lectura.progreso.fraccion);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{lectura.archivo.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatBytes(lectura.archivo.size)}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
      <ProgressBar value={total} label={fase.label} />
      {lectura.progreso.lineas > 0 && (
        <span className="text-xs text-muted-foreground">
          {formatNumber(lectura.progreso.lineas)} líneas F93/F94 encontradas
        </span>
      )}
    </div>
  );
}

function ArchivoChip({
  nombre,
  detalle,
  onCambiar,
  onQuitar,
}: {
  nombre: string;
  detalle: string;
  onCambiar: () => void;
  onQuitar: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
        <FileSpreadsheet className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{nombre}</span>
        <span className="text-xs text-muted-foreground">{detalle}</span>
      </div>
      <Button size="sm" variant="ghost" onClick={onCambiar}>
        Cambiar
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-8"
        aria-label="Quitar archivo"
        onClick={onQuitar}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
