import { ChevronDown } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PERIODOS_SELECCIONABLES } from "./mock-data";
import type { Periodo } from "./types";

interface PeriodSelectorProps {
  value: string;
  onChange: (periodoId: string) => void;
  periodos?: Periodo[];
  ariaLabel?: string;
  triggerId?: string;
  disabled?: boolean;
  className?: string;
}

export function PeriodSelector({
  value,
  onChange,
  periodos = PERIODOS_SELECCIONABLES,
  ariaLabel = "Seleccionar periodo",
  triggerId,
  disabled,
  className,
}: PeriodSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        id={triggerId}
        aria-label={ariaLabel}
        className={className}
      >
        <SelectValue placeholder="Seleccionar periodo" />
      </SelectTrigger>
      <SelectContent>
        {periodos.map((periodo) => (
          <SelectItem key={periodo.id} value={periodo.id}>
            {periodo.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { ChevronDown };