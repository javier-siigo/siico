"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { formatCurrencyInput, parseCurrencyInput } from "../format";

export type EditableNumberFormat = "currency" | "percent" | "integer";

interface EditableNumberProps {
  value: number;
  onCommit: (next: number) => void;
  format?: EditableNumberFormat;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  displayClassName?: string;
  emptyText?: string;
}

export function EditableNumber({
  value,
  onCommit,
  format = "currency",
  min,
  max,
  placeholder,
  disabled,
  className,
  displayClassName,
  emptyText = "—",
}: EditableNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const beginEdit = () => {
    if (disabled) return;
    setDraft(formatDisplay(value, format));
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const commit = () => {
    const next = parseDraft(draft, format);
    if (next === null) {
      setError("Valor inválido");
      return;
    }
    if (typeof min === "number" && next < min) {
      setError(`Mínimo ${min}`);
      return;
    }
    if (typeof max === "number" && next > max) {
      setError(`Máximo ${max}`);
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
          inputMode={format === "integer" ? "numeric" : "decimal"}
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
          className={cn("h-8 px-2 text-sm", className)}
          aria-invalid={error ? "true" : "false"}
        />
        {error && (
          <span className="text-[11px] text-rose-600 dark:text-rose-400">
            {error}
          </span>
        )}
      </div>
    );
  }

  const hasValue = Number.isFinite(value);
  return (
    <button
      type="button"
      onClick={beginEdit}
      disabled={disabled}
      className={cn(
        "group inline-flex w-full items-center justify-end gap-1.5 rounded-md px-1.5 py-1 text-right font-mono tabular-nums text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
        displayClassName,
      )}
      aria-label={`Editar valor (${formatDisplay(value, format)})`}
    >
      <span className="truncate">
        {hasValue ? formatDisplay(value, format) : emptyText}
      </span>
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function parseDraft(
  raw: string,
  format: EditableNumberFormat,
): number | null {
  if (!raw.trim()) return 0;
  const value =
    format === "currency" ? parseCurrencyInput(raw) : Number(raw.replace(",", "."));
  if (!Number.isFinite(value)) return null;
  return value;
}

function formatDisplay(value: number, format: EditableNumberFormat): string {
  if (!Number.isFinite(value)) return "—";
  if (format === "currency") return value === 0 ? "0" : formatCurrencyInput(value);
  return String(value);
}
