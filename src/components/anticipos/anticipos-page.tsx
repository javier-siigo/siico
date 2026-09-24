"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  HandCoins,
  Plus,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnticiposDataTable } from "@/components/anticipos/anticipos-data-table";
import { AnticiposDeleteDialog } from "@/components/anticipos/anticipos-delete-dialog";
import { AnticiposEditSheet } from "@/components/anticipos/anticipos-edit-sheet";
import { AnticiposFormSheet } from "@/components/anticipos/anticipos-form";
import type { AnticipoRow } from "@/lib/anticipos/schema";

function isPendienteFalta(value: AnticipoRow["falta"]): boolean {
  return value !== "legalizado";
}

function isDevolucionFalta(value: AnticipoRow["falta"]): boolean {
  return value === "devolucion";
}

function isLegalizadoFalta(value: AnticipoRow["falta"]): boolean {
  return value === "legalizado";
}

export function AnticiposPageClient({ rows }: { rows: AnticipoRow[] }) {
  const [open, setOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AnticipoRow | null>(null);
  const [deletingRow, setDeletingRow] = useState<AnticipoRow | null>(null);

  const stats = useMemo(() => {
    const total = rows.length;
    const pendientes = rows.filter((r) => isPendienteFalta(r.falta)).length;
    const devoluciones = rows.filter((r) => isDevolucionFalta(r.falta)).length;
    const legalizados = rows.filter((r) => isLegalizadoFalta(r.falta)).length;
    const tasaLegalizacion = total === 0 ? 0 : Math.round((legalizados / total) * 100);
    return { total, pendientes, devoluciones, legalizados, tasaLegalizacion };
  }, [rows]);

  const closeEdit = useCallback(() => setEditingRow(null), []);
  const closeDelete = useCallback(() => setDeletingRow(null), []);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          icon={<HandCoins className="size-4" />}
          label="Total registros"
          value={stats.total}
          tone="default"
        />
        <KpiTile
          icon={<Wallet className="size-4" />}
          label="Pendientes"
          value={stats.pendientes}
          tone="warning"
        />
        <KpiTile
          icon={<ArrowUpRight className="size-4" />}
          label="Devoluciones"
          value={stats.devoluciones}
          tone="destructive"
        />
        <KpiTile
          icon={<CheckCircle2 className="size-4" />}
          label="Legalizados"
          value={stats.legalizados}
          tone="success"
          suffix={
            stats.total > 0 ? (
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                {stats.tasaLegalizacion}% del total
              </span>
            ) : null
          }
        />
      </div>

      {rows.length > 0 && (
        <p className="-mt-2 text-sm text-muted-foreground">
          Edita, legaliza o elimina cualquier registro desde el menú de acciones
          de cada fila.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Nuevo registro
        </Button>
      </div>

      <AnticiposDataTable
        rows={rows}
        onEdit={setEditingRow}
        onDelete={setDeletingRow}
      />

      <AnticiposFormSheet open={open} onOpenChange={setOpen} />
      <AnticiposEditSheet
        row={editingRow}
        open={Boolean(editingRow)}
        onOpenChange={closeEdit}
      />
      <AnticiposDeleteDialog
        row={deletingRow}
        open={Boolean(deletingRow)}
        onOpenChange={closeDelete}
      />
    </div>
  );
}

type KpiTone = "default" | "success" | "warning" | "destructive" | "muted";

interface KpiTileProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: KpiTone;
  suffix?: React.ReactNode;
}

const TONE_CLASSES: Record<KpiTone, string> = {
  default:
    "bg-primary/10 text-primary border-primary/15 dark:bg-primary/15 dark:text-primary-foreground/90 dark:border-primary/30",
  success:
    "bg-emerald-100 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40",
  warning:
    "bg-amber-100 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40",
  destructive:
    "bg-rose-100 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40",
  muted:
    "bg-muted text-muted-foreground border-border",
};

function KpiTile({ icon, label, value, tone = "default", suffix }: KpiTileProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-md border ${TONE_CLASSES[tone]}`}
        aria-hidden
      >
        {icon}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xl font-semibold tabular-nums text-foreground">
            {value}
          </span>
          {suffix}
        </div>
      </div>
    </div>
  );
}