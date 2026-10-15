import { cn } from "@/lib/utils";

type KpiTone =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "muted"
  | "sky";

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  secondaryValue?: string;
  tone?: KpiTone;
  icon?: React.ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<KpiTone, string> = {
  default:
    "bg-primary/10 text-primary border-primary/15 dark:bg-primary/15 dark:text-primary-foreground/90 dark:border-primary/30",
  success:
    "bg-emerald-100 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40",
  warning:
    "bg-amber-100 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40",
  destructive:
    "bg-rose-100 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40",
  muted:
    "bg-muted text-muted-foreground border-border",
  sky:
    "bg-sky-100 text-sky-700 border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/40",
};

export function KpiCard({
  label,
  value,
  hint,
  secondaryValue,
  tone = "default",
  icon,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "kpi-tile-stagger flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm",
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md border",
            TONE_CLASSES[tone],
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xl font-semibold tabular-nums text-foreground">
            {value}
          </span>
          {secondaryValue && (
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {secondaryValue}
            </span>
          )}
        </div>
        {hint && (
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </div>
    </div>
  );
}