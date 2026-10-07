"use client";

import { Banknote, FilePlus2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { FileSlot } from "./file-slot";
import type { ConciliacionRunStatus } from "./types";

interface DualUploadCardProps {
  principalFile: File | null;
  principalStatus: ConciliacionRunStatus;
  previoFile: File | null;
  previoStatus: ConciliacionRunStatus;
  onSelectPrincipal: (file: File) => void;
  onRemovePrincipal: () => void;
  onSelectPrevio: (file: File) => void;
  onRemovePrevio: () => void;
  disabled?: boolean;
}

export function DualUploadCard({
  principalFile,
  principalStatus,
  previoFile,
  previoStatus,
  onSelectPrincipal,
  onRemovePrincipal,
  onSelectPrevio,
  onRemovePrevio,
  disabled,
}: DualUploadCardProps) {
  return (
    <section
      aria-labelledby="conciliacion-upload-title"
      className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm"
    >
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <FilePlus2 className="size-4 text-muted-foreground" aria-hidden />
          <h2
            id="conciliacion-upload-title"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            Archivos a conciliar
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Sube el extracto bancario del período y, si cuentas con él, el
          reporte previo. El reporte previo es opcional.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SlotShell
          title="Extracto bancario"
          required
          subtitle="Obligatorio"
          icon={<Banknote className="size-4" aria-hidden />}
        >
          <FileSlot
            file={principalFile}
            status={principalStatus}
            ariaLabel="Seleccionar extracto bancario"
            hint="o haz clic para seleccionarlo · .xlsx, .xls, .csv (máx. 10 MB)"
            onSelect={onSelectPrincipal}
            onRemove={onRemovePrincipal}
            disabled={disabled}
          />
        </SlotShell>
        <SlotShell
          title="Reporte previo"
          subtitle="Opcional"
          icon={<FilePlus2 className="size-4" aria-hidden />}
        >
          <FileSlot
            file={previoFile}
            status={previoStatus}
            ariaLabel="Seleccionar reporte previo"
            hint="o haz clic para seleccionarlo · .xlsx, .xls, .csv (máx. 10 MB)"
            onSelect={onSelectPrevio}
            onRemove={onRemovePrevio}
            disabled={disabled}
          />
        </SlotShell>
      </div>
    </section>
  );
}

function SlotShell({
  title,
  subtitle,
  required,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  required?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center text-muted-foreground">
            {icon}
          </span>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
            required
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-border bg-background text-muted-foreground",
          )}
        >
          {subtitle}
        </span>
      </div>
      {children}
    </div>
  );
}
