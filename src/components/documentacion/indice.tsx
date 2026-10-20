"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Search, SearchX, X } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Input } from "@/components/ui/input";

export interface ItemIndice {
  slug: string;
  titulo: string;
  descripcion: string;
}

/** Quita tildes y mayúsculas para que "comision" encuentre "Comisiones". */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function IndiceDocumentacion({ items }: { items: ItemIndice[] }) {
  const [busqueda, setBusqueda] = useState("");
  const q = normalizar(busqueda.trim());
  const visibles = useMemo(
    () =>
      q
        ? items.filter((i) => normalizar(`${i.titulo} ${i.descripcion}`).includes(q))
        : items,
    [items, q],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full sm:w-80">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar documento…"
          aria-label="Buscar documento por título"
          className="pl-8 pr-8"
        />
        {busqueda && (
          <button
            type="button"
            onClick={() => setBusqueda("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-6" aria-hidden />}
          title={`Ningún documento coincide con “${busqueda.trim()}”`}
          description="Prueba con otra palabra del título, por ejemplo “anticipos” o “roles”."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {visibles.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/documentacion/${item.slug}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">{item.titulo}</span>
                  <span className="text-sm text-muted-foreground">{item.descripcion}</span>
                </div>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
