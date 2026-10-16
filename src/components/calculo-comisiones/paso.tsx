"use client";

import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { TONO_GRUPO, type TonoGrupo } from "./grupo";

export type EstadoPaso = "hecho" | "actual" | "pendiente";

interface PasoProps {
  n: number;
  titulo: string;
  /** Ingreso o gasto: lo marca con su color en toda la página. */
  tipo?: TonoGrupo;
  estado: EstadoPaso;
  descripcion: string;
  /** Cifra o dato que resume el paso; se ve aun cerrado. */
  resumen?: React.ReactNode;
  abierto: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const TIPO_LABEL: Record<TonoGrupo, string> = { gasto: "Gasto", ingreso: "Ingreso" };

/**
 * Un paso del cierre. Cerrado muestra solo su estado y su cifra; el paso
 * actual se señaliza en ámbar, el mismo color de la banda "Siguiente".
 */
export function Paso({
  n,
  titulo,
  tipo,
  estado,
  descripcion,
  resumen,
  abierto,
  onToggle,
  children,
}: PasoProps) {
  const cuerpoId = `paso-${n}-cuerpo`;
  return (
    <section
      id={`paso-${n}`}
      aria-labelledby={`paso-${n}-titulo`}
      className={cn(
        "scroll-mt-44 rounded-lg border bg-card shadow-sm transition-colors",
        estado === "actual" ? "border-amber-400 dark:border-amber-500/70" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierto}
        aria-controls={cuerpoId}
        className="flex w-full items-center gap-4 rounded-lg px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      >
        <NumeroPaso n={n} estado={estado} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
            <span id={`paso-${n}-titulo`} className="text-sm font-semibold">
              {titulo}
            </span>
            {tipo && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <span aria-hidden className={cn("size-1.5 rounded-full", TONO_GRUPO[tipo].dot)} />
                {TIPO_LABEL[tipo]}
              </span>
            )}
          </span>
          <span className="truncate text-xs text-muted-foreground">{descripcion}</span>
          {resumen && <span className="pt-1 sm:hidden [&>span]:items-start">{resumen}</span>}
        </div>
        {resumen ? (
          <span className="hidden shrink-0 text-right sm:block">{resumen}</span>
        ) : (
          estado === "pendiente" && (
            <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
              {n === 4 ? "Se habilita al completar los datos del mes" : "Pendiente"}
            </span>
          )
        )}
        {!abierto && estado === "hecho" && (
          <span className="shrink-0 text-xs font-medium text-primary">Editar</span>
        )}
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            abierto && "rotate-180",
          )}
        />
      </button>
      {abierto && (
        <div id={cuerpoId} className="border-t border-border px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </section>
  );
}

function NumeroPaso({ n, estado }: { n: number; estado: EstadoPaso }) {
  return (
    <span
      aria-label={estado === "hecho" ? "Completo" : estado === "actual" ? "Paso actual" : "Pendiente"}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold",
        estado === "hecho" && "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950",
        estado === "actual" && "bg-amber-400 text-amber-950",
        estado === "pendiente" && "bg-muted text-muted-foreground",
      )}
    >
      {estado === "hecho" ? <Check className="size-3.5" strokeWidth={3} /> : n}
    </span>
  );
}

/** Cifra del resumen de un paso: mono, tabular, con una línea opcional debajo. */
export function ResumenPaso({
  valor,
  detalle,
  texto,
}: {
  valor: string;
  detalle?: string;
  /** El valor es texto (un nombre de archivo, un estado), no una cifra. */
  texto?: boolean;
}) {
  return (
    <span className="flex max-w-72 flex-col items-end">
      <span
        className={cn(
          "max-w-full truncate text-sm font-medium",
          !texto && "font-mono tabular-nums",
        )}
      >
        {valor}
      </span>
      {detalle && <span className="text-xs text-muted-foreground">{detalle}</span>}
    </span>
  );
}
