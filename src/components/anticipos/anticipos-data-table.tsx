"use client";

import * as React from "react";
import {
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import {
  Columns3,
  Filter,
  FilterX,
  Inbox,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ANTICIPOS_FALTA_LABELS,
  ANTICIPOS_OBSERVACION_1_LABELS,
  type AnticipoFalta,
  type AnticipoObservacion1,
  type AnticipoRow,
} from "@/lib/anticipos/schema";

import { columns } from "./columns";
import { features } from "./data-table-features";

interface AnticiposDataTableProps {
  rows: AnticipoRow[];
}

const PAGE_SIZE = 10;
const ALL = "__all__";

function buildPageItems(currentPage: number, totalPages: number): Array<
  | { kind: "page"; page: number }
  | { kind: "ellipsis"; key: string }
> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => ({
      kind: "page" as const,
      page: i,
    }));
  }

  const items: Array<
    { kind: "page"; page: number } | { kind: "ellipsis"; key: string }
  > = [];
  const push = (page: number) => items.push({ kind: "page", page });
  const ellipsis = (key: string) => items.push({ kind: "ellipsis", key });

  push(0);
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages - 2, currentPage + 1);

  if (start > 1) ellipsis("start");
  for (let i = start; i <= end; i++) push(i);
  if (end < totalPages - 2) ellipsis("end");
  push(totalPages - 1);

  return items;
}

function matchesEnum<T extends string>(
  value: T | null | undefined,
  filter: string,
): boolean {
  if (!filter || filter === ALL) return true;
  return value === filter;
}

export function AnticiposDataTable({ rows }: AnticiposDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [faltaFilter, setFaltaFilter] = React.useState<string>("");
  const [observacion1Filter, setObservacion1Filter] = React.useState<string>("");
  const [pageIndex, setPageIndex] = React.useState(0);

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      if (!matchesEnum<AnticipoFalta>(row.falta, faltaFilter)) return false;
      if (!matchesEnum<AnticipoObservacion1>(row.observacion_1, observacion1Filter))
        return false;
      if (globalFilter) {
        const q = globalFilter.toLowerCase();
        const haystack =
          `${row.nombre} ${row.requerimiento} ${row.observacion_2 ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, faltaFilter, observacion1Filter, globalFilter]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [faltaFilter, observacion1Filter, globalFilter]);

  const table = useTable({
    features,
    data: filteredRows,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination: { pageIndex, pageSize: PAGE_SIZE },
    },
    onPaginationChange: (updater) => {
      setPageIndex((prev) => {
        const next =
          typeof updater === "function"
            ? updater({ pageIndex: prev, pageSize: PAGE_SIZE })
            : updater;
        return next.pageIndex;
      });
    },
    getRowId: (row) => row.id,
  });

  const totalRows = rows.length;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const visibleRows = table.getRowModel().rows;
  const totalPages = Math.max(1, table.getPageCount());
  const pageItems = buildPageItems(pageIndex, totalPages);

  const hasFilters =
    faltaFilter !== "" ||
    observacion1Filter !== "" ||
    globalFilter.trim().length > 0;

  const resetFilters = () => {
    setFaltaFilter("");
    setObservacion1Filter("");
    setGlobalFilter("");
  };

  const faltaActive = faltaFilter !== "";
  const observacionActive = observacion1Filter !== "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar colaborador o requerimiento"
            aria-label="Buscar en la tabla"
            className="h-9 w-80 pl-7 pr-7 text-sm"
          />
          {globalFilter && (
            <button
              type="button"
              onClick={() => setGlobalFilter("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        <EnumFilterSelect
          label="Falta"
          ariaLabel="Filtrar por falta"
          value={faltaFilter}
          onChange={setFaltaFilter}
          isActive={faltaActive}
          options={Object.entries(ANTICIPOS_FALTA_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />

        <EnumFilterSelect
          label="Observación 1"
          ariaLabel="Filtrar por observación"
          value={observacion1Filter}
          onChange={setObservacion1Filter}
          isActive={observacionActive}
          options={Object.entries(ANTICIPOS_OBSERVACION_1_LABELS).map(
            ([value, label]) => ({ value, label }),
          )}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs"
            >
              <Columns3 className="size-3.5" />
              Columnas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                const headerLabel =
                  typeof column.columnDef.header === "string"
                    ? column.columnDef.header
                    : (column.id ?? "");
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(Boolean(value))
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    {headerLabel || column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasFilters && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground tabular-nums">
              {totalFiltered} de {totalRows}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 gap-1.5 text-xs"
            >
              <FilterX className="size-3.5" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {visibleRows.length ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() || undefined }}
                        className="h-11 align-bottom"
                      >
                        {header.isPlaceholder ? null : (
                          <table.FlexRender header={header} />
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRow key={row.id} className="group">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5">
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : hasFilters ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Empty className="border-0 bg-transparent py-14">
              <EmptyHeader className="sm:max-w-lg">
                <EmptyMedia variant="icon">
                  <FilterX />
                </EmptyMedia>
                <EmptyTitle>
                  Sin coincidencias con los filtros activos
                </EmptyTitle>
                <EmptyDescription>
                  Ningún registro coincide con la búsqueda o los filtros
                  aplicados. Ajusta los criterios para ver más resultados.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-2"
              >
                <FilterX className="size-3.5" />
                Limpiar filtros
              </Button>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Empty className="border-0 bg-transparent py-14">
              <EmptyHeader className="sm:max-w-lg">
                <EmptyMedia variant="icon">
                  <Inbox />
                </EmptyMedia>
                <EmptyTitle>Aún no hay registros</EmptyTitle>
                <EmptyDescription>
                  Cuando registres un anticipo aparecerá aquí. Usa el botón
                  «Nuevo registro» para comenzar.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}

      {(totalPages > 1 || totalFiltered > 0) && (
        <div className="flex flex-col-reverse items-stretch justify-between gap-3 px-1 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground tabular-nums">
            {totalRows === 0
              ? "Sin registros."
              : totalFiltered === 0
                ? "Ningún registro coincide con los filtros."
                : `Mostrando ${pageIndex * PAGE_SIZE + 1}–${Math.min(
                    (pageIndex + 1) * PAGE_SIZE,
                    totalFiltered,
                  )} de ${totalFiltered} registros${
                    totalFiltered !== totalRows
                      ? ` (filtrados de ${totalRows})`
                      : ""
                  }.`}
          </p>
          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      table.previousPage();
                    }}
                    aria-disabled={!table.getCanPreviousPage()}
                    className={
                      !table.getCanPreviousPage()
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>

                {pageItems.map((item, idx) => {
                  if (item.kind === "ellipsis") {
                    return (
                      <PaginationItem key={`${item.key}-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  const page = item.page;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === pageIndex}
                        onClick={(e) => {
                          e.preventDefault();
                          table.setPageIndex(page);
                        }}
                      >
                        {page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      table.nextPage();
                    }}
                    aria-disabled={!table.getCanNextPage()}
                    className={
                      !table.getCanNextPage()
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}

function EnumFilterSelect({
  label,
  ariaLabel,
  value,
  onChange,
  isActive,
  options,
}: {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (v: string) => void;
  isActive: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "h-9 w-44 gap-1.5 overflow-hidden text-xs font-normal shadow-none",
          isActive &&
            "border-primary/40 bg-primary/5 text-foreground ring-1 ring-primary/20",
        )}
      >
        <Filter
          className={cn(
            "size-3 shrink-0",
            isActive ? "text-primary" : "text-muted-foreground",
          )}
        />
        <span className="flex min-w-0 flex-1 items-center gap-1 truncate text-left">
          <span className="shrink-0 text-muted-foreground">{label}:</span>
          <SelectValue placeholder="Todas" />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Todas</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
