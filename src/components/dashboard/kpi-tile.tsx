import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

interface KpiTileProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { value: string; direction: "up" | "down" | "flat"; helper?: string };
  context?: string;
}

export function KpiTile({ label, value, unit, delta, context }: KpiTileProps) {
  const deltaIcon =
    delta?.direction === "up" ? (
      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
    ) : delta?.direction === "down" ? (
      <ArrowDownRight className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
    ) : (
      <Minus className="h-3.5 w-3.5 text-muted-foreground" />
    );

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-muted-foreground">{unit}</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        {delta ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            {deltaIcon}
            <span className="font-medium text-foreground">{delta.value}</span>
            {delta.helper && <span className="text-muted-foreground">{delta.helper}</span>}
          </span>
        ) : (
          <span />
        )}
        {context && <span className="text-muted-foreground">{context}</span>}
      </div>
    </div>
  );
}

interface KpiGridProps {
  className?: string;
  children: React.ReactNode;
}

export function KpiGrid({ className, children }: KpiGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
