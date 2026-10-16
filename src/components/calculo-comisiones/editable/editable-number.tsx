"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";

import { formatCurrencyInput, formatPesos, parseCurrencyInput } from "../format";

interface EditableNumberProps {
  value: number;
  onCommit: (next: number) => void;
  min?: number;
  placeholder?: string;
  /** Nombre accesible del campo, p. ej. "Valor de Comisiones". */
  ariaLabel?: string;
}

/**
 * Valor en pesos que se edita en el sitio: clic para editar, Enter guarda,
 * Esc cancela. Acepta centavos y valores pegados desde Excel o NetSuite.
 */
export function EditableNumber({
  value,
  onCommit,
  min,
  placeholder,
  ariaLabel = "Valor",
}: EditableNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const display = formatCurrencyInput(value);

  const beginEdit = () => {
    setDraft(display);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const commit = () => {
    const next = parseCurrencyInput(draft);
    if (next === null) {
      setError("Escribe un valor en pesos, p. ej. 7.331.649,80");
      return;
    }
    if (typeof min === "number" && next < min) {
      setError(`Mínimo ${min}`);
      return;
    }
    if (next !== value) onCommit(next);
    setEditing(false);
    setError(null);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <Input
          ref={inputRef}
          inputMode="decimal"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          className="h-8 px-2 text-sm"
          aria-label={ariaLabel}
          aria-invalid={error ? "true" : "false"}
        />
        {error && (
          <span role="alert" className="text-[11px] text-destructive">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={beginEdit}
      className="group inline-flex h-8 w-full items-center justify-end gap-1.5 rounded-md border border-input bg-background px-2 text-right font-mono tabular-nums text-foreground transition-colors hover:border-ring/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      aria-label={`${ariaLabel}: ${display}. Editar`}
    >
      <span className={cn("truncate", value === 0 && "text-muted-foreground")}>
        {formatPesos(value)}
      </span>
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
