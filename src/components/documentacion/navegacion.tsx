import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import type { DocumentoMeta } from "@/lib/documentacion/registry";
import { cn } from "@/lib/utils";

function Tarjeta({ doc, direccion }: { doc: DocumentoMeta; direccion: "anterior" | "siguiente" }) {
  const siguiente = direccion === "siguiente";
  return (
    <Link
      href={`/documentacion/${doc.slug}`}
      className={cn(
        "group flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        siguiente && "flex-row-reverse text-right",
      )}
    >
      {siguiente ? (
        <ArrowRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      ) : (
        <ArrowLeft
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{siguiente ? "Siguiente" : "Anterior"}</span>
        <span className="truncate text-sm font-medium text-foreground">{doc.titulo}</span>
      </div>
    </Link>
  );
}

/** Anterior/Siguiente entre los documentos que el usuario puede leer. */
export function NavegacionDocumentos({
  anterior,
  siguiente,
}: {
  anterior?: DocumentoMeta;
  siguiente?: DocumentoMeta;
}) {
  if (!anterior && !siguiente) return null;
  return (
    <nav aria-label="Otros documentos" className="flex flex-col gap-3 sm:flex-row">
      {anterior ? <Tarjeta doc={anterior} direccion="anterior" /> : <div className="hidden flex-1 sm:block" />}
      {siguiente ? <Tarjeta doc={siguiente} direccion="siguiente" /> : <div className="hidden flex-1 sm:block" />}
    </nav>
  );
}
