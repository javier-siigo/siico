"use client";

import { Check, Lock, Scale, ShieldCheck, TrendingUp } from "lucide-react";

import { FlagIcon } from "@/lib/flags";
import { ALL_ROLES, KNOWN_PAISES, ROLE_ADMIN, ROLE_CONCILIACIONES } from "@/lib/auth/roles-shared";
import { cn } from "@/lib/utils";

import {
  PAIS_LABEL,
  ROLE_META,
  accessFor,
  togglePaisIn,
  toggleRoleIn,
  type Draft,
} from "./helpers";

const ROLE_ICON = {
  admin: ShieldCheck,
  conciliaciones: Scale,
  ingresos: TrendingUp,
} as const;

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background";

export function RoleEditor({
  draft,
  onChange,
  isSelf = false,
  disabled = false,
}: {
  draft: Draft;
  onChange: (next: Draft) => void;
  /** El admin editándose a sí mismo no puede quitarse el rol Admin. */
  isSelf?: boolean;
  disabled?: boolean;
}) {
  const conc = draft.roles.includes(ROLE_CONCILIACIONES);

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2" disabled={disabled}>
        <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Roles
        </legend>
        {ALL_ROLES.map((role) => {
          const checked = draft.roles.includes(role);
          const locked = isSelf && role === ROLE_ADMIN && checked;
          const Icon = ROLE_ICON[role];
          return (
            <button
              key={role}
              type="button"
              role="checkbox"
              aria-checked={checked}
              aria-disabled={locked || undefined}
              onClick={() => !locked && onChange(toggleRoleIn(draft, role))}
              className={cn(
                "flex items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                FOCUS,
                checked ? "border-primary/50 bg-primary/5" : "border-border bg-background hover:border-ring/50",
                locked && "cursor-default",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                  checked
                    ? "border-primary/20 bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center justify-between gap-2 text-sm font-medium text-foreground">
                  {ROLE_META[role]?.label ?? role}
                  {locked ? (
                    <Lock className="size-3.5 text-muted-foreground" aria-hidden />
                  ) : (
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-4 items-center justify-center rounded-sm border transition-colors",
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card",
                      )}
                    >
                      {checked && <Check className="size-3" strokeWidth={3} />}
                    </span>
                  )}
                </span>
                <span className="text-xs leading-snug text-muted-foreground">
                  {locked
                    ? "No puedes quitarte tu propio rol Admin."
                    : ROLE_META[role]?.description}
                </span>
              </span>
            </button>
          );
        })}
      </fieldset>

      <fieldset className="flex flex-col gap-2" disabled={disabled}>
        <legend className="mb-2 flex w-full items-baseline justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Países de conciliación
          </span>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {draft.paises.length}/{KNOWN_PAISES.length}
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {KNOWN_PAISES.map((code) => {
            const checked = draft.paises.includes(code);
            return (
              <button
                key={code}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onChange(togglePaisIn(draft, code))}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  FOCUS,
                  checked
                    ? "border-primary/50 bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-ring/50 hover:text-foreground",
                )}
              >
                <FlagIcon
                  code={code}
                  className={cn(
                    "h-3 w-[18px] rounded-[2px] ring-1 ring-black/10 transition-[filter,opacity]",
                    !checked && "opacity-60 grayscale",
                  )}
                />
                {PAIS_LABEL[code] ?? code}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {conc
            ? draft.paises.length === 0
              ? "Sin países, el rol Conciliaciones no abre ningún proceso."
              : "Solo verá la conciliación de los países marcados."
            : "Marcar un país activa el rol Conciliaciones."}
        </p>
      </fieldset>

      <AccessPreview draft={draft} />
    </div>
  );
}

function AccessPreview({ draft }: { draft: Draft }) {
  const areas = accessFor(draft);
  return (
    <section
      aria-live="polite"
      className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-muted/40 p-3"
    >
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Lo que verá en el portal
      </h3>
      {areas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Solo Inicio y Documentación. Asigna un rol para darle acceso a procesos.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {areas.map((area) => (
            <li key={area.slug} className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <area.icon className="size-3.5 text-muted-foreground" aria-hidden />
                {area.label}
              </span>
              <span className="flex flex-wrap gap-1 pl-5">
                {area.procesos.map((p) => (
                  <span
                    key={p.slug}
                    className="inline-flex items-center gap-1 rounded-sm bg-card px-1.5 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border"
                  >
                    {p.flagCode && <FlagIcon code={p.flagCode} className="h-2.5 w-[15px] rounded-[1px]" />}
                    {p.label}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
