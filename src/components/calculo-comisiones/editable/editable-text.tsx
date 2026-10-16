"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onCommit: (next: string) => void;
  maxLength?: number;
  /** Texto cuando el valor está vacío. */
  placeholder?: string;
  /** Códigos (cuentas contables) en fuente mono. */
  mono?: boolean;
  /** Nombre accesible del campo, p. ej. "Renombrar Comisiones". */
  ariaLabel?: string;
}

/** Texto que se edita en el sitio: clic para editar, Enter guarda, Esc cancela. */
export function EditableText({
  value,
  onCommit,
  maxLength,
  placeholder = "—",
  mono,
  ariaLabel,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    if (draft !== value) onCommit(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        maxLength={maxLength}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setEditing(false);
          }
        }}
        className={cn("h-8 px-2 text-sm", mono && "font-mono tabular-nums")}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      aria-label={ariaLabel}
      className={cn(
        "group inline-flex w-full items-center justify-start gap-1.5 rounded-md px-1.5 py-1 text-left text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        mono && "font-mono tabular-nums",
      )}
    >
      <span className={cn("truncate", value ? "text-foreground" : "text-muted-foreground")}>
        {value || placeholder}
      </span>
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
