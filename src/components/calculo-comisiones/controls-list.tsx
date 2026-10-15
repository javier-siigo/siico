import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ControlResultado, EstadoControl } from "./types";

const CONTROL_ICONS: Record<EstadoControl, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const CONTROL_TONE_CLASSES: Record<
  EstadoControl,
  { wrapper: string; icon: string }
> = {
  success: {
    wrapper:
      "border-emerald-200/60 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/40",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    wrapper:
      "border-amber-200/60 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/40",
    icon: "text-amber-600 dark:text-amber-400",
  },
  error: {
    wrapper:
      "border-rose-200/60 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/40",
    icon: "text-rose-600 dark:text-rose-400",
  },
  info: {
    wrapper:
      "border-sky-200/60 bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/40",
    icon: "text-sky-600 dark:text-sky-400",
  },
};

interface ControlsListProps {
  controles: ControlResultado[];
  className?: string;
}

export function ControlsList({ controles, className }: ControlsListProps) {
  if (controles.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        Sin controles registrados para este periodo.
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "flex flex-col gap-2",
        className,
      )}
    >
      {controles.map((control) => (
        <ControlItem key={control.id} control={control} />
      ))}
    </ul>
  );
}

function ControlItem({ control }: { control: ControlResultado }) {
  const Icon = CONTROL_ICONS[control.estado];
  const tone = CONTROL_TONE_CLASSES[control.estado];
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-md border px-3 py-2.5",
        tone.wrapper,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center",
          tone.icon,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold text-foreground">
          {control.titulo}
        </span>
        <span className="text-xs text-muted-foreground">
          {control.descripcion}
        </span>
      </div>
    </li>
  );
}