import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FlagIcon } from "@/lib/flags";
import type { Area, Proceso } from "@/lib/navigation";
import { procesoHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export interface CifraProceso {
  /** Valor principal; texto corto o número. */
  valor: string;
  /** Unidad pequeña junto al valor ("pendientes"). */
  unidad?: string;
  detalle: string;
  /** Tarjeta atenuada (p. ej. país sin bancos configurados). */
  apagado?: boolean;
  /** Progreso del cierre de comisiones. */
  pasos?: boolean[];
}

function Marca({ proceso }: { proceso: Proceso }) {
  if (proceso.flagCode) {
    return <FlagIcon code={proceso.flagCode} title={proceso.label} className="h-3.5 w-5 rounded-[2px]" />;
  }
  return (
    <span
      className="flex size-8 items-center justify-center rounded-md border border-primary/15 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15"
      aria-hidden
    >
      <proceso.icon className="size-4" />
    </span>
  );
}

function Tarjeta({
  area,
  proceso,
  cifra,
  indice,
}: {
  area: Area;
  proceso: Proceso;
  cifra: CifraProceso;
  indice: number;
}) {
  return (
    <Link
      href={procesoHref(area.slug, proceso.slug)}
      transitionTypes={["nav-forward"]}
      style={{ animationDelay: `${120 + indice * 30}ms` }}
      className={cn(
        "kpi-tile-stagger group flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors",
        "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        cifra.apagado ? "border-dashed border-border bg-transparent shadow-none" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Marca proceso={proceso} />
        <ArrowRight
          className="size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span
          title={proceso.label}
          className={cn("truncate text-sm font-semibold", cifra.apagado ? "text-muted-foreground" : "text-foreground")}
        >
          {proceso.label}
        </span>
        <span className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-semibold",
              // Mono solo para cifras (regla Mono-Number); el texto va en sans.
              /^\d/.test(cifra.valor) ? "font-mono text-xl tabular-nums" : "text-sm",
              cifra.apagado ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {cifra.valor}
          </span>
          {cifra.unidad && <span className="text-xs text-muted-foreground">{cifra.unidad}</span>}
        </span>
        {cifra.pasos && (
          <span className="flex gap-1 pt-0.5" aria-hidden>
            {cifra.pasos.map((h, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  h ? "bg-emerald-500" : i === cifra.pasos!.indexOf(false) ? "bg-amber-400" : "bg-muted",
                )}
              />
            ))}
          </span>
        )}
        <span className="truncate text-xs text-muted-foreground" title={cifra.detalle}>
          {cifra.detalle}
        </span>
      </div>
    </Link>
  );
}

/** Procesos del usuario agrupados por área, cada uno con su cifra en vivo. */
export function ProcesosPorArea({
  areas,
  cifraDe,
}: {
  areas: Area[];
  cifraDe: (area: Area, proceso: Proceso) => CifraProceso;
}) {
  // Índice global para escalonar la entrada de todas las tarjetas.
  const inicios = areas.map((_, i) =>
    areas.slice(0, i).reduce((n, a) => n + a.procesos.length, 0),
  );
  return (
    <div className="flex flex-col gap-6">
      {areas.map((area, a) => (
        <section key={area.slug} aria-labelledby={`area-${area.slug}-title`} className="flex flex-col gap-3">
          <h2
            id={`area-${area.slug}-title`}
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
          >
            <area.icon className="size-3.5" aria-hidden />
            {area.label}
          </h2>
          <div
            className={cn(
              "grid grid-cols-2 gap-3",
              area.procesos.length >= 5 ? "lg:grid-cols-3 xl:grid-cols-5" : "lg:grid-cols-4",
            )}
          >
            {area.procesos.map((proceso, p) => (
              <Tarjeta
                key={proceso.slug}
                area={area}
                proceso={proceso}
                cifra={cifraDe(area, proceso)}
                indice={inicios[a]! + p}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
