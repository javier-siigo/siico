import { cn } from "@/lib/utils";

import type {
  EstadoCalculo,
  EstadoControl,
  EstadoProceso,
} from "./types";

interface StatusBadgeProps {
  variant: EstadoCalculo | EstadoControl | EstadoProceso;
  label: string;
  withDot?: boolean;
  className?: string;
}

const TONE_CLASSES: Record<
  EstadoCalculo | EstadoControl | EstadoProceso,
  { wrapper: string; dot: string }
> = {
  correcto: {
    wrapper:
      "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  success: {
    wrapper:
      "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  completado: {
    wrapper:
      "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  revision: {
    wrapper:
      "border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  warning: {
    wrapper:
      "border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  procesando: {
    wrapper:
      "border-sky-200/60 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  info: {
    wrapper:
      "border-sky-200/60 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  pendiente: {
    wrapper:
      "border-border bg-secondary text-secondary-foreground",
    dot: "bg-muted-foreground",
  },
  error: {
    wrapper:
      "border-rose-200/60 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

export function StatusBadge({
  variant,
  label,
  withDot = true,
  className,
}: StatusBadgeProps) {
  const tone = TONE_CLASSES[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        tone.wrapper,
        className,
      )}
    >
      {withDot && (
        <span
          aria-hidden
          className={cn(
            "mr-1.5 size-1.5 shrink-0 rounded-full",
            tone.dot,
          )}
        />
      )}
      {label}
    </span>
  );
}