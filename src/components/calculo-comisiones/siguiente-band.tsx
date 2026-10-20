"use client";

import { cn } from "@/lib/utils";

export interface SenalSiguiente {
  /** "siguiente": falta algo; "listo": el mes está cerrado o registrado. */
  tipo: "siguiente" | "listo" | "trabajando";
  mensaje: string;
  detalle: string;
  accion?: React.ReactNode;
}

interface SiguienteBandProps {
  senal: SenalSiguiente;
  /** Paso actual (1..n); null cuando no queda nada por hacer. */
  pasoActual: number | null;
  /** Estado de cada paso, en orden. */
  pasos: { titulo: string; hecho: boolean; actual: boolean }[];
}

const ETIQUETA: Record<SenalSiguiente["tipo"], string> = {
  siguiente: "Siguiente",
  listo: "Listo",
  trabajando: "Procesando",
};

/**
 * La señal del cierre: siempre dice la única acción que sigue y cuánto falta.
 * Se queda fija bajo la barra superior mientras se recorre la página.
 */
export function SiguienteBand({
  senal,
  pasos,
  pasoActual,
}: SiguienteBandProps) {
  const hechos = pasos.filter((p) => p.hecho).length;
  const faltan = pasos.length - hechos;
  return (
    <div className="z-20 -mx-1 bg-background px-1 pb-3 pt-3 sm:sticky sm:top-14">
      <div
        role="status"
        aria-live="polite"
        data-tour="siguiente"
        className="flex flex-col gap-3 rounded-lg bg-[#1F2733] px-5 py-3.5 text-white shadow-md ring-1 ring-white/10 sm:flex-row sm:items-center sm:gap-5"
      >
        <span
          className={cn(
            "self-start rounded-md px-2 py-1 text-xs font-semibold sm:self-center",
            senal.tipo === "listo"
              ? "bg-emerald-400 text-emerald-950"
              : "bg-amber-400 text-amber-950",
          )}
        >
          {ETIQUETA[senal.tipo]}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-base font-semibold leading-snug">
            {senal.mensaje}
          </span>
          <span className="text-sm text-white/70">{senal.detalle}</span>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              {pasoActual !== null ? (
                <>
                  <span className="whitespace-nowrap font-mono text-base font-semibold tabular-nums">
                    Paso {pasoActual} de {pasos.length}
                  </span>
                  <span className="whitespace-nowrap text-xs text-white/70">
                    · {faltan === 1 ? "falta 1 paso" : `faltan ${faltan} pasos`}
                  </span>
                </>
              ) : (
                <span className="whitespace-nowrap font-mono text-base font-semibold tabular-nums">
                  {hechos} de {pasos.length} completos
                </span>
              )}
            </div>
            <ol aria-hidden className="flex gap-1">
              {pasos.map((p) => (
                <li
                  key={p.titulo}
                  title={p.titulo}
                  className={cn(
                    "h-1.5 w-10 rounded-full",
                    p.hecho
                      ? "bg-emerald-400"
                      : p.actual
                        ? "bg-amber-400"
                        : "bg-white/25",
                  )}
                />
              ))}
            </ol>
          </div>
          {senal.accion}
        </div>
      </div>
    </div>
  );
}
