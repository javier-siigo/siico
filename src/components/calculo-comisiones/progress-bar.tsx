import { cn } from "@/lib/utils";

import { formatPercent } from "./format";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  trailingLabel?: string;
  showValue?: boolean;
  tone?: "default" | "muted";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  trailingLabel,
  showValue = true,
  tone = "default",
  className,
}: ProgressBarProps) {
  const safeMax = max <= 0 ? 1 : max;
  const ratio = Math.max(0, Math.min(value / safeMax, 1));
  const percentage = Math.round(ratio * 100);
  const fillTone =
    tone === "muted"
      ? "bg-muted-foreground/70"
      : "bg-primary";

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-2 text-xs">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {showValue && (
            <span className="font-mono tabular-nums text-foreground">
              {trailingLabel ?? formatPercent(percentage)}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={value}
        aria-label={label}
        className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width]", fillTone)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}