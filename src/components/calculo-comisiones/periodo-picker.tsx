"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { periodoLabel, shiftPeriodo } from "@/lib/comisiones/calculo";

interface PeriodoPickerProps {
  value: string;
  onChange: (periodo: string) => void;
  /** Periodo más reciente seleccionable. */
  max: string;
  /** Periodos que tienen un cálculo guardado (se marcan en la lista). */
  guardados: Set<string>;
}

const MESES_ATRAS = 24;

export function PeriodoPicker({ value, onChange, max, guardados }: PeriodoPickerProps) {
  const opciones = Array.from({ length: MESES_ATRAS }, (_, i) => shiftPeriodo(max, -i));
  if (!opciones.includes(value)) opciones.push(value);
  const min = opciones[opciones.length - 1]!;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="size-9"
        aria-label="Periodo anterior"
        disabled={value <= min}
        onClick={() => onChange(shiftPeriodo(value, -1))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-48" aria-label="Periodo">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((p) => (
            <SelectItem key={p} value={p}>
              <span className="flex w-full items-center justify-between gap-3">
                {periodoLabel(p)}
                {guardados.has(p) && (
                  <span
                    aria-label="Con cálculo guardado"
                    className="size-1.5 rounded-full bg-emerald-500"
                  />
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        className="size-9"
        aria-label="Periodo siguiente"
        disabled={value >= max}
        onClick={() => onChange(shiftPeriodo(value, 1))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
