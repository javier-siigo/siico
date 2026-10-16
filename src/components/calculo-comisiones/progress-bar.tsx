interface ProgressBarProps {
  /** Avance entre 0 y 1. */
  value: number;
  label: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const percentage = Math.round(Math.max(0, Math.min(value, 1)) * 100);

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="font-mono text-xs tabular-nums text-foreground">{percentage}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-label={label}
        className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
