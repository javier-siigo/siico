"use client";

import * as React from "react";
import { AlertTriangle, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { FlagIcon } from "@/lib/flags";
import { cn } from "@/lib/utils";

import {
  ROLE_META,
  absoluteTime,
  displayName,
  initials,
  isOrphan,
  relativeTime,
  type AdminUser,
  type Draft,
} from "./helpers";

export type Filter = "todos" | "atencion" | "admin" | "conciliaciones" | "ingresos";

export const FILTERS: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "atencion", label: "Requieren atención" },
  { id: "admin", label: "Admin" },
  { id: "conciliaciones", label: "Conciliaciones" },
  { id: "ingresos", label: "Ingresos" },
];

export function UserAvatar({ email, className }: { email: string; className?: string }) {
  const orphan = isOrphan({ email });
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold",
        orphan
          ? "border-dashed border-border bg-muted text-muted-foreground"
          : "border-primary/15 bg-primary/10 text-primary",
        className,
      )}
    >
      {initials(email)}
    </span>
  );
}

export function UserIdentity({ user, isSelf = false }: { user: AdminUser; isSelf?: boolean }) {
  const orphan = isOrphan(user);
  return (
    <span className="flex min-w-0 items-center gap-3">
      <UserAvatar email={user.email} />
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
          {displayName(user.email)}
          {isSelf && <span className="text-xs font-normal text-muted-foreground">(tú)</span>}
        </span>
        <span className={cn("truncate text-xs text-muted-foreground", orphan && "font-mono")}>
          {orphan ? user.id.slice(0, 8) + "…" : user.email}
        </span>
      </span>
    </span>
  );
}

export function RoleChips({ draft }: { draft: Draft }) {
  if (draft.roles.length === 0) {
    return <span className="text-xs text-muted-foreground">Sin roles</span>;
  }
  return (
    <span className="flex flex-wrap items-center gap-1">
      {draft.roles.map((r) => (
        <span
          key={r}
          className={cn(
            "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
            r === "admin"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-background text-foreground",
          )}
        >
          {ROLE_META[r]?.label ?? r}
        </span>
      ))}
    </span>
  );
}

export function FlagStrip({ paises }: { paises: string[] }) {
  if (paises.length === 0) return null;
  return (
    <span className="flex items-center gap-1">
      {paises.map((p) => (
        <FlagIcon key={p} code={p} title={p} className="h-3 w-[18px] rounded-[2px] ring-1 ring-black/10" />
      ))}
    </span>
  );
}

export function IssueBadge({ issues }: { issues: string[] }) {
  if (issues.length === 0) return null;
  return (
    <span
      title={issues.join(" · ")}
      className="inline-flex items-center gap-1 rounded-md border border-amber-200/70 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
    >
      <AlertTriangle className="size-3" />
      {issues[0]}
      {issues.length > 1 && ` +${issues.length - 1}`}
    </span>
  );
}

export function SearchBox({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por nombre o correo"
        className="h-8 pr-7 pl-7 text-sm"
        aria-label="Buscar usuarios"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

export function FilterChips({
  value,
  onChange,
  counts,
}: {
  value: Filter;
  onChange: (f: Filter) => void;
  counts: Record<Filter, number>;
}) {
  return (
    <div role="radiogroup" aria-label="Filtrar usuarios" className="flex flex-wrap gap-1.5">
      {FILTERS.map((f) => {
        const active = value === f.id;
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(f.id)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              active
                ? "border-foreground/80 bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
            <span
              className={cn(
                "font-mono text-[11px] tabular-nums",
                active ? "text-background/70" : "text-muted-foreground/80",
                f.id === "atencion" && counts.atencion > 0 && !active && "text-amber-700 dark:text-amber-400",
              )}
            >
              {counts[f.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function matches(user: AdminUser, d: Draft, q: string, f: Filter, issues: string[]) {
  const query = q.trim().toLowerCase();
  if (query && !user.email.toLowerCase().includes(query) && !displayName(user.email).toLowerCase().includes(query)) {
    return false;
  }
  if (f === "todos") return true;
  if (f === "atencion") return issues.length > 0;
  return d.roles.includes(f);
}

/**
 * Hora relativa con la fecha completa en el tooltip. Se pinta tras montar porque
 * depende del reloj y de la zona horaria del navegador (evita desajustes de hidratación).
 */
export function TimeAgo({ iso, prefix = "" }: { iso: string | null; prefix?: string }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <span className="invisible">{prefix}—</span>;
  return (
    <time dateTime={iso ?? undefined} title={absoluteTime(iso)}>
      {prefix}
      {relativeTime(iso)}
    </time>
  );
}
