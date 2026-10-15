"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface EditableSelectOption<T extends string> {
  value: T;
  label: string;
}

interface EditableSelectProps<T extends string> {
  value: T;
  onCommit: (next: T) => void;
  options: ReadonlyArray<EditableSelectOption<T>>;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function EditableSelect<T extends string>({
  value,
  onCommit,
  options,
  disabled,
  className,
  ariaLabel,
}: EditableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  if (open) {
    return (
      <Select
        value={value}
        open
        onOpenChange={(next) => {
          if (!next) setOpen(false);
        }}
        onValueChange={(v) => {
          onCommit(v as T);
          setOpen(false);
        }}
      >
        <SelectTrigger
          aria-label={ariaLabel}
          className={cn("h-8 w-full px-2 text-sm", className)}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && setOpen(true)}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "group inline-flex w-full items-center justify-between gap-1.5 rounded-md border border-transparent px-1.5 py-1 text-sm transition-colors hover:border-border hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <span className="truncate text-foreground">{current?.label ?? value}</span>
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
