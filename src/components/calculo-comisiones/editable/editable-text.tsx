"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onCommit: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  align?: "left" | "right" | "center";
  maxLength?: number;
}

export function EditableText({
  value,
  onCommit,
  placeholder = "—",
  disabled,
  className,
  inputClassName,
  align = "left",
  maxLength,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const beginEdit = () => {
    if (disabled) return;
    setDraft(value);
    setEditing(true);
  };

  const cancel = () => setEditing(false);

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
        className={cn("h-8 px-2 text-sm", inputClassName)}
      />
    );
  }

  const empty = !value?.trim();

  return (
    <button
      type="button"
      onClick={beginEdit}
      disabled={disabled}
      className={cn(
        "group inline-flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
        align === "right" && "justify-end text-right",
        align === "center" && "justify-center text-center",
        align === "left" && "justify-start text-left",
        className,
      )}
    >
      <span
        className={cn(
          "truncate",
          empty ? "text-muted-foreground italic" : "text-foreground",
        )}
      >
        {empty ? placeholder : value}
      </span>
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
