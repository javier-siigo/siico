"use client";

import * as React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import type { Column, RowData } from "@tanstack/table-core";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ANTICIPOS_FALTA_LABELS,
  ANTICIPOS_OBSERVACION_1_LABELS,
  daysSinceIsoDate,
  type AnticipoFalta,
  type AnticipoObservacion1,
  type AnticipoRow,
} from "@/lib/anticipos/schema";

import type { DataTableFeatures } from "./data-table-features";

const columnHelper = createColumnHelper<DataTableFeatures, AnticipoRow>();

const dateFmt = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return dateFmt.format(new Date(Date.UTC(y, m - 1, d)));
}

function faltaToneClass(value: AnticipoFalta): string {
  if (value === "legalizado") {
    return "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (value === "devolucion") {
    return "border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (value === "revisar_con_harold" || value === "revisar_soportes" || value === "revisar_descuento_nomina") {
    return "border-sky-200/60 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-300";
  }
  return "border-border bg-secondary text-secondary-foreground";
}

function observacionToneClass(value: AnticipoObservacion1): string {
  if (value === "legalizado") {
    return "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (value === "correo_al_lider") {
    return "border-sky-200/60 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-300";
  }
  if (value === "escrito_3_veces") {
    return "border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300";
  }
  return "border-border bg-secondary text-secondary-foreground";
}

function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
}: {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
}) {
  const sorted = column.getIsSorted();
  const canSort = column.getCanSort();
  return (
    <div className="flex items-center justify-between gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      {canSort && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Ordenar por ${title}`}
          className="-mr-2 size-6 text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => column.toggleSorting(sorted === "asc")}
        >
          {sorted === "asc" ? (
            <ArrowUp className="size-3.5" />
          ) : sorted === "desc" ? (
            <ArrowDown className="size-3.5" />
          ) : (
            <ArrowUpDown className="size-3.5 opacity-60" />
          )}
        </Button>
      )}
    </div>
  );
}

export const columns = columnHelper.columns([
  columnHelper.display({
    id: "rowNumber",
    header: () => (
      <div className="flex items-center justify-center">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          #
        </span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {String(row.index + 1).padStart(2, "0")}
        </span>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 48,
  }),
  columnHelper.accessor("nombre", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Colaborador" />
    ),
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground">
          {row.getValue("nombre")}
        </span>
      </div>
    ),
    size: 200,
  }),
  columnHelper.accessor("requerimiento", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Requerimiento" />
    ),
    cell: ({ row }) => (
      <span className="block max-w-[16rem] truncate font-mono text-xs text-muted-foreground">
        {row.getValue("requerimiento")}
      </span>
    ),
    size: 180,
  }),
  columnHelper.accessor("falta", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Falta" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("falta") as AnticipoFalta;
      return (
        <Badge
          variant="outline"
          className={cn("font-medium", faltaToneClass(value))}
        >
          <span
            aria-hidden
            className={cn(
              "mr-1.5 size-1.5 shrink-0 rounded-full",
              value === "legalizado" && "bg-emerald-500",
              value === "devolucion" && "bg-amber-500",
              (value === "revisar_con_harold" ||
                value === "revisar_soportes" ||
                value === "revisar_descuento_nomina") &&
                "bg-sky-500",
              !["legalizado", "devolucion", "revisar_con_harold", "revisar_soportes", "revisar_descuento_nomina"].includes(value) &&
                "bg-muted-foreground",
            )}
          />
          {ANTICIPOS_FALTA_LABELS[value]}
        </Badge>
      );
    },
    enableColumnFilter: false,
    size: 200,
  }),
  columnHelper.accessor("observacion_1", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Observación 1" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("observacion_1") as AnticipoObservacion1;
      return (
        <Badge
          variant="outline"
          className={cn("font-medium", observacionToneClass(value))}
        >
          <span
            aria-hidden
            className={cn(
              "mr-1.5 size-1.5 shrink-0 rounded-full",
              value === "legalizado" && "bg-emerald-500",
              value === "correo_al_lider" && "bg-sky-500",
              value === "escrito_3_veces" && "bg-amber-500",
              !["legalizado", "correo_al_lider", "escrito_3_veces"].includes(value) &&
                "bg-muted-foreground",
            )}
          />
          {ANTICIPOS_OBSERVACION_1_LABELS[value]}
        </Badge>
      );
    },
    enableColumnFilter: false,
    size: 200,
  }),
  columnHelper.accessor("observacion_2", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Observación 2" />
    ),
    cell: ({ row }) => {
      const v = row.getValue<string | null>("observacion_2");
      if (!v) {
        return <span className="text-muted-foreground/60">—</span>;
      }
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block max-w-[20rem] truncate text-sm text-muted-foreground">
              {v}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-sm whitespace-pre-wrap break-words"
          >
            {v}
          </TooltipContent>
        </Tooltip>
      );
    },
    size: 240,
  }),
  columnHelper.accessor("fecha_rq", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha RQ" />
    ),
    cell: function FechaRqCell({ row }) {
      const value = row.getValue("fecha_rq") as string;
      const r = row.original;
      const isResolved =
        r.falta === "legalizado" ||
        r.observacion_1 === "legalizado" ||
        r.fecha_gestion !== null;
      const [mounted, setMounted] = React.useState(false);
      React.useEffect(() => setMounted(true), []);

      const daysOverdue = mounted ? daysSinceIsoDate(value) : -1;
      const isOverdue = !isResolved && daysOverdue >= 10;

      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 font-mono text-xs whitespace-nowrap tabular-nums",
            isOverdue ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {formatDate(value)}
          {isOverdue && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle
                  className="size-3 shrink-0"
                  aria-label={`Atrasado hace ${daysOverdue} días`}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                Atrasado hace {daysOverdue} días
              </TooltipContent>
            </Tooltip>
          )}
        </span>
      );
    },
    size: 110,
  }),
  columnHelper.accessor("fecha_gestion", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha gestión" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs whitespace-nowrap tabular-nums text-muted-foreground">
        {formatDate(row.getValue("fecha_gestion"))}
      </span>
    ),
    size: 130,
  }),
]);