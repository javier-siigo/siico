import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TonoAtencion = "rojo" | "ambar" | "azul";

export interface ItemAtencion {
  id: string;
  tono: TonoAtencion;
  /** Cifra en mono a la izquierda, o el progreso del cierre. */
  cifra: { tipo: "numero"; valor: number } | { tipo: "pasos"; hechos: boolean[] };
  titulo: string;
  detalle: string;
  accion: { label: string; href: string };
}

const BARRA: Record<TonoAtencion, string> = {
  rojo: "bg-destructive",
  ambar: "bg-amber-400",
  azul: "bg-primary",
};

const CIFRA: Record<TonoAtencion, string> = {
  rojo: "text-destructive",
  ambar: "text-amber-700 dark:text-amber-300",
  azul: "text-primary",
};

function Pasos({ hechos }: { hechos: boolean[] }) {
  const actual = hechos.indexOf(false);
  return (
    <span className="flex gap-0.5" aria-hidden>
      {hechos.map((h, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-3 rounded-full",
            h ? "bg-emerald-500" : i === actual ? "bg-amber-400" : "bg-muted-foreground/25",
          )}
        />
      ))}
    </span>
  );
}

/** Bandeja "Necesita atención": una fila por pendiente, ordenada por urgencia. */
export function BandejaAtencion({ items }: { items: ItemAtencion[] }) {
  if (items.length === 0) {
    return (
      <section
        aria-labelledby="atencion-title"
        className="kpi-tile-stagger flex items-center gap-3 rounded-lg border border-emerald-200/70 bg-card px-5 py-4 shadow-sm dark:border-emerald-900/50"
      >
        <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <div className="flex flex-col gap-0.5">
          <h2 id="atencion-title" className="text-sm font-semibold text-foreground">
            Todo al día
          </h2>
          <p className="text-sm text-muted-foreground">
            No hay anticipos atrasados ni cierres pendientes en tus procesos.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="atencion-title"
      className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
    >
      <header className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
        <h2 id="atencion-title" className="text-base font-semibold tracking-tight text-foreground">
          Necesita atención
        </h2>
        <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs tabular-nums text-muted-foreground">
          {items.length}
        </span>
      </header>
      <ul role="list" className="flex flex-col divide-y divide-border">
        {items.map((item, i) => (
          <li
            key={item.id}
            className="kpi-tile-stagger flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className={cn("w-[3px] self-stretch rounded-full", BARRA[item.tono])} aria-hidden />
              <span
                className={cn(
                  "flex w-12 shrink-0 justify-end font-mono text-lg font-semibold tabular-nums",
                  CIFRA[item.tono],
                )}
              >
                {item.cifra.tipo === "numero" ? item.cifra.valor : <Pasos hechos={item.cifra.hechos} />}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">{item.titulo}</span>
                <span className="text-sm text-muted-foreground">{item.detalle}</span>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant={i === 0 ? "default" : "outline"}
              className="self-start sm:self-center"
            >
              <Link href={item.accion.href} transitionTypes={["nav-forward"]}>
                {item.accion.label}
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
