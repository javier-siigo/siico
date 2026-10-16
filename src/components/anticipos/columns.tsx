"use client";

import * as React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import type { Column, RowData } from "@tanstack/table-core";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, CircleAlert, UserMinus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TruncatedText } from "@/components/anticipos/truncated-text";
import {
  ANTICIPOS_FALTA_LABELS,
  ANTICIPOS_OBSERVACION_1_LABELS,
  daysSinceIsoDate,
  type AnticipoFalta,
  type AnticipoObservacion1,
  type AnticipoRow,
} from "@/lib/anticipos/schema";
import {
  formatAnticipoCedula,
  formatAnticipoCurrency,
} from "@/lib/anticipos/format";

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

type MatchLevel = NonNullable<AnticipoRow["retiro_info"]>["nivel"];

const MATCH_LABELS: Record<MatchLevel, string> = {
  exacto: "Coinc. exacta",
  exacto_inverso: "Coinc. exacta (orden invertido)",
  parcial: "Coinc. parcial",
};

function ExcolaboradorChip({ parcial }: { parcial: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5",
        "border-slate-300 bg-slate-50 text-slate-700",
        "dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
      )}
    >
      {parcial ? (
        <CircleAlert
          className="size-3 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
      ) : null}
      <UserMinus className="size-3" aria-hidden />
      <span className="text-[10px] font-semibold uppercase tracking-wider">
        Excolaborador
      </span>
    </span>
  );
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
    enableResizing: false,
    size: 40,
    minSize: 36,
  }),
  columnHelper.accessor("nombre", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Colaborador" />
    ),
    cell: ({ row }) => {
      const r = row.original;
      const esRetirado = r.es_retirado;
      const retiro = r.retiro_info;
      const valorFmt = formatAnticipoCurrency(retiro?.valor);
      const cedulaFmt = retiro ? formatAnticipoCedula(retiro.cedula) : null;
      const isParcial =
        retiro?.nivel === "parcial" && retiro.tokensExtra.length > 0;
      const matchLabel = retiro ? MATCH_LABELS[retiro.nivel] : null;

      return (
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <TruncatedText
              text={r.nombre}
              className={cn(
                "font-medium",
                esRetirado ? "text-muted-foreground" : "text-foreground",
              )}
            />
            {esRetirado ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ExcolaboradorChip parcial={isParcial} />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-sm whitespace-pre-wrap break-words"
                >
                  {retiro ? (
                    <div className="flex flex-col gap-1">
                      {retiro.observacion ? (
                        <span className="text-muted-foreground">
                          Obs. Contabilidad: {retiro.observacion}
                        </span>
                      ) : null}
                      <span className="text-muted-foreground">
                        Reportado: {formatDate(retiro.fecha_reporte)}
                      </span>
                      {retiro.tokensComunes.length > 0 ? (
                        <span className="text-muted-foreground">
                          Comunes: {retiro.tokensComunes.join(" ")}
                        </span>
                      ) : null}
                      {retiro.tokensExtra.length > 0 ? (
                        <span className="text-muted-foreground">
                          Extras: {retiro.tokensExtra.join(" ")}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          {esRetirado && retiro ? (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
              {cedulaFmt ? (
                <span className="whitespace-nowrap">Céd. {cedulaFmt}</span>
              ) : null}
              {valorFmt ? (
                <>
                  <span className="text-muted-foreground/40" aria-hidden>
                    ·
                  </span>
                  <span className="whitespace-nowrap">Ant. {valorFmt}</span>
                </>
              ) : null}
              {matchLabel ? (
                <>
                  <span className="text-muted-foreground/40" aria-hidden>
                    ·
                  </span>
                  <span className="whitespace-nowrap">{matchLabel}</span>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    },
    size: 240,
    minSize: 140,
  }),
  columnHelper.accessor("requerimiento", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Requerimiento" />
    ),
    cell: ({ row }) => (
      <TruncatedText
        text={String(row.getValue("requerimiento") ?? "")}
        className="block max-w-[14rem] font-mono text-[11px] tabular-nums text-muted-foreground"
      />
    ),
    size: 120,
    minSize: 120,
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
          data-falta-badge="true"
          className={cn(
            "max-w-full truncate font-medium",
            faltaToneClass(value),
          )}
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
          <TruncatedText text={ANTICIPOS_FALTA_LABELS[value]} />
        </Badge>
      );
    },
    enableColumnFilter: false,
    size: 130,
    minSize: 130,
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
          className={cn(
            "max-w-full truncate font-medium",
            observacionToneClass(value),
          )}
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
          <TruncatedText text={ANTICIPOS_OBSERVACION_1_LABELS[value]} />
        </Badge>
      );
    },
    enableColumnFilter: false,
    size: 130,
    minSize: 130,
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
        <TruncatedText
          text={v}
          className="block max-w-[20rem] text-sm text-muted-foreground"
        />
      );
    },
    size: 130,
    minSize: 120,
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
    size: 80,
    minSize: 88,
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
    size: 80,
    minSize: 96,
  }),
]);