"use client";

import { Fragment, useDeferredValue, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { mesDelPlazo, periodoCorto } from "@/lib/comisiones/calculo";
import type { DocumentoDiferido, TipoDocumento } from "@/lib/comisiones/types";
import { cn } from "@/lib/utils";

import { formatFraction, formatIsoDate, formatNumber, formatPesos } from "./format";

interface DocumentosTableProps {
  documentos: DocumentoDiferido[];
  periodo: string;
}

type SortKey = "numero" | "cohorte" | "total" | "cuota" | "reconocido" | "pendiente";

const PAGE_SIZES = [25, 50, 100];

const TIPO: Record<TipoDocumento, string> = {
  factura: "Factura",
  "nota-credito": "Nota crédito",
  ajuste: "Ajuste",
};

export function DocumentosTable({ documentos, periodo }: DocumentosTableProps) {
  const [query, setQuery] = useState("");
  const [prefijo, setPrefijo] = useState<"todas" | "F93" | "F94">("todas");
  const [cohorte, setCohorte] = useState<string>("todas");
  const [tipo, setTipo] = useState<"todos" | TipoDocumento>("todos");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "cuota",
    dir: "desc",
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const q = useDeferredValue(query.trim().toUpperCase());

  const cohortes = useMemo(
    () => [...new Set(documentos.map((d) => d.cohorte))].sort().reverse(),
    [documentos],
  );

  const filtrados = useMemo(() => {
    const out = documentos.filter((d) => {
      if (prefijo !== "todas" && d.prefijo !== prefijo) return false;
      if (cohorte !== "todas" && d.cohorte !== cohorte) return false;
      if (tipo !== "todos" && d.tipo !== tipo) return false;
      if (
        q &&
        !d.numero.toUpperCase().includes(q) &&
        !d.origen.toUpperCase().includes(q) &&
        !d.nit.includes(q)
      )
        return false;
      return true;
    });
    const { key, dir } = sort;
    const sign = dir === "asc" ? 1 : -1;
    out.sort((a, b) =>
      key === "numero" || key === "cohorte"
        ? sign * a[key].localeCompare(b[key])
        : sign * (a[key] - b[key]),
    );
    return out;
  }, [documentos, prefijo, cohorte, tipo, q, sort]);

  const cuotaFiltrada = useMemo(
    () => Math.round(filtrados.reduce((a, d) => a + d.cuota * 100, 0)) / 100,
    [filtrados],
  );

  const hayFiltros =
    query.trim() !== "" || prefijo !== "todas" || cohorte !== "todas" || tipo !== "todos";
  const limpiarFiltros = () => {
    setQuery("");
    setPrefijo("todas");
    setCohorte("todas");
    setTipo("todos");
    setPage(0);
  };

  const pages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visibles = filtrados.slice(current * pageSize, (current + 1) * pageSize);

  const toggleSort = (key: SortKey) => {
    setPage(0);
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "numero" ? "asc" : "desc" },
    );
  };

  const toggleExpanded = (k: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-xl text-xs text-muted-foreground">
          Facturas, notas crédito y ajustes con DOC ORIGEN F93/F94. Filtra por cohorte
          para auditar el ingreso de cada fila del cálculo.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Comprobante o NIT"
              aria-label="Buscar comprobante, documento origen o NIT"
              className="h-8 w-44 pl-8"
            />
          </div>
          <Select
            value={cohorte}
            onValueChange={(v) => {
              setCohorte(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-36" aria-label="Cohorte">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las cohortes</SelectItem>
              {cohortes.map((c) => (
                <SelectItem key={c} value={c}>
                  {periodoCorto(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={prefijo}
            onValueChange={(v) => {
              setPrefijo(v as typeof prefijo);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-28" aria-label="Prefijo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">F93 + F94</SelectItem>
              <SelectItem value="F93">Solo F93</SelectItem>
              <SelectItem value="F94">Solo F94</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={tipo}
            onValueChange={(v) => {
              setTipo(v as typeof tipo);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-36" aria-label="Tipo de comprobante">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="factura">Facturas</SelectItem>
              <SelectItem value="nota-credito">Notas crédito</SelectItem>
              <SelectItem value="ajuste">Ajustes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <SortTh label="Comprobante" k="numero" sort={sort} onSort={toggleSort} align="left" />
                <SortTh label="Cohorte" k="cohorte" sort={sort} onSort={toggleSort} align="left" />
                <th className="px-3 py-2 text-left font-semibold">Plazo</th>
                <SortTh label="Total" k="total" sort={sort} onSort={toggleSort} />
                <SortTh label="Cuota del mes" k="cuota" sort={sort} onSort={toggleSort} />
                <SortTh label="Reconocido" k="reconocido" sort={sort} onSort={toggleSort} />
                <SortTh label="Pendiente" k="pendiente" sort={sort} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      No hay comprobantes con esos filtros.
                      {hayFiltros && (
                        <Button size="sm" variant="outline" onClick={limpiarFiltros}>
                          Limpiar filtros
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {visibles.map((d) => {
                const k = `${d.numero}|${d.origen}`;
                const multi = d.lineas.length > 1;
                const open = multi && expanded.has(k);
                return (
                  <Fragment key={k}>
                    <tr
                      className={cn(
                        "align-top transition-colors hover:bg-muted/40",
                        multi && "cursor-pointer",
                        open && "bg-muted/30",
                      )}
                      onClick={multi ? () => toggleExpanded(k) : undefined}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-start gap-1.5">
                          {multi ? (
                            <button
                              type="button"
                              aria-expanded={open}
                              aria-label={`${open ? "Ocultar" : "Ver"} productos de ${d.numero}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(k);
                              }}
                              className="-m-0.5 mt-0 shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <ChevronRight
                                aria-hidden
                                className={cn("size-3.5 transition-transform", open && "rotate-90")}
                              />
                            </button>
                          ) : (
                            <span aria-hidden className="size-3.5 shrink-0" />
                          )}
                          <div className="flex flex-col">
                            <span className="font-mono text-sm font-medium">{d.numero}</span>
                            <span className="text-xs text-muted-foreground">
                              {TIPO[d.tipo]}
                              {d.origen !== d.numero && (
                                <>
                                  {" de "}
                                  <span className="font-mono">{d.origen}</span>
                                </>
                              )}
                              {" · NIT "}
                              {d.nit || "—"}
                              {multi && ` · ${d.lineas.length} productos`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs tabular-nums">
                        {periodoCorto(d.cohorte)}
                      </td>
                      <td className="px-3 py-2">
                        <Plazo documento={d} periodo={periodo} />
                      </td>
                      <Num value={formatPesos(d.total)} />
                      <Num value={formatPesos(d.cuota)} strong={d.cuota !== 0} muted={d.cuota === 0} />
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        <div className="flex flex-col items-end">
                          <span>{formatPesos(d.reconocido)}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatFraction(d.total ? d.reconocido / d.total : 0, 1)}
                          </span>
                        </div>
                      </td>
                      <Num value={formatPesos(d.pendiente)} muted={Math.abs(d.pendiente) < 1} />
                    </tr>
                    {open && (
                      <tr className="bg-muted/20">
                        <td colSpan={7} className="px-3 pb-3 pt-0">
                          <LineasTable documento={d} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            {filtrados.length === 0
              ? "0 comprobantes"
              : `${formatNumber(current * pageSize + 1)}–${formatNumber(
                  Math.min((current + 1) * pageSize, filtrados.length),
                )} de ${formatNumber(filtrados.length)} comprobantes`}
            {hayFiltros && filtrados.length > 0 && (
              <>
                {" · cuota "}
                <span className="font-mono tabular-nums text-foreground">
                  {formatPesos(cuotaFiltrada)}
                </span>
              </>
            )}
          </span>
          <div className="flex items-center gap-2">
            <span>Filas</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(0);
              }}
            >
              <SelectTrigger className="h-8 w-20" aria-label="Filas por página">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="tabular-nums">
              Pág. {formatNumber(current + 1)} de {formatNumber(pages)}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="Página anterior"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="Página siguiente"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
    </div>
  );
}

function SortTh({
  label,
  k,
  sort,
  onSort,
  align = "right",
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className={cn("px-3 py-2 font-semibold", align === "right" ? "text-right" : "text-left")}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm uppercase tracking-wide hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          active && "text-foreground",
        )}
      >
        {label}
        <Icon className="size-3" />
      </button>
    </th>
  );
}

function Num({ value, strong, muted }: { value: string; strong?: boolean; muted?: boolean }) {
  return (
    <td
      className={cn(
        "px-3 py-2 text-right font-mono tabular-nums",
        strong && "font-medium",
        muted && "text-muted-foreground",
      )}
    >
      {value}
    </td>
  );
}

function Plazo({ documento: d, periodo }: { documento: DocumentoDiferido; periodo: string }) {
  const mes = mesDelPlazo(d.inicio, periodo);
  const avance = d.total ? Math.min(1, Math.max(0, d.reconocido / d.total)) : 0;
  const finalizada = Math.abs(d.pendiente) < 1;
  const label =
    d.tipo !== "factura"
      ? `${d.veces} ${d.veces === 1 ? "mes" : "meses"}`
      : finalizada
        ? d.cuota !== 0
          ? `Último mes · ${d.veces} meses`
          : `Finalizada · ${d.veces} meses`
        : mes !== null
          ? `Mes ${Math.min(Math.max(mes, 1), d.veces)} de ${d.veces}`
          : `${d.veces} meses`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex w-32 cursor-help flex-col gap-1">
          <span className="text-xs">
            {label}
            {d.plazoMixto && <span className="text-muted-foreground"> · mixto</span>}
          </span>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", finalizada ? "bg-emerald-500" : "bg-sky-500")}
              style={{ width: `${avance * 100}%` }}
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        Fecha {formatIsoDate(d.fechaFactura)} · reconoce del {formatIsoDate(d.inicio)} al{" "}
        {formatIsoDate(d.fin)}
      </TooltipContent>
    </Tooltip>
  );
}

function LineasTable({ documento }: { documento: DocumentoDiferido }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <table className="w-full text-xs">
        <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr className="border-b border-border">
            <th className="px-3 py-1.5 text-left font-semibold">Producto</th>
            <th className="px-3 py-1.5 text-left font-semibold">Cuenta</th>
            <th className="px-3 py-1.5 text-right font-semibold">Cant.</th>
            <th className="px-3 py-1.5 text-right font-semibold">Plazo</th>
            <th className="px-3 py-1.5 text-right font-semibold">Total</th>
            <th className="px-3 py-1.5 text-right font-semibold">Cuota mes</th>
            <th className="px-3 py-1.5 text-right font-semibold">Reconocido</th>
            <th className="px-3 py-1.5 text-right font-semibold">Pendiente</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border font-mono tabular-nums">
          {documento.lineas.map((l, i) => (
            <tr key={i}>
              <td className="max-w-80 truncate px-3 py-1.5 font-sans" title={l.producto}>
                {l.producto || "—"}
              </td>
              <td className="px-3 py-1.5">{l.cuenta || "—"}</td>
              <td className="px-3 py-1.5 text-right">{formatNumber(l.cantidad)}</td>
              <td className="px-3 py-1.5 text-right">{l.veces} m</td>
              <td className="px-3 py-1.5 text-right">{formatPesos(l.total)}</td>
              <td className="px-3 py-1.5 text-right">{formatPesos(l.cuota)}</td>
              <td className="px-3 py-1.5 text-right">{formatPesos(l.reconocido)}</td>
              <td className="px-3 py-1.5 text-right">{formatPesos(l.pendiente)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
