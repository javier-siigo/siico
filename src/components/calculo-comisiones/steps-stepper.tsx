import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import type { StepNuevoCalculo } from "./types";

interface StepDefinition {
  id: StepNuevoCalculo;
  label: string;
  hint?: string;
}

export const STEPS: StepDefinition[] = [
  { id: "informacion", label: "Información" },
  { id: "archivo", label: "Archivo" },
  { id: "procesamiento", label: "Procesamiento" },
  { id: "resultado", label: "Resultado" },
];

interface StepsStepperProps {
  current: StepNuevoCalculo;
  reachable: StepNuevoCalculo[];
  onSelect?: (step: StepNuevoCalculo) => void;
  className?: string;
}

export function StepsStepper({
  current,
  reachable,
  onSelect,
  className,
}: StepsStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <ol
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-stretch sm:gap-0",
        className,
      )}
    >
      {STEPS.map((step, idx) => {
        const state =
          idx < currentIndex
            ? "completed"
            : idx === currentIndex
              ? "current"
              : "upcoming";
        const canSelect =
          reachable.includes(step.id) && state !== "current" && Boolean(onSelect);
        const isLast = idx === STEPS.length - 1;

        return (
          <li
            key={step.id}
            className={cn(
              "relative flex flex-1 items-start gap-3",
              !isLast && "sm:pr-4",
            )}
          >
            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                aria-current={state === "current" ? "step" : undefined}
                aria-disabled={!canSelect}
                onClick={canSelect ? () => onSelect?.(step.id) : undefined}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-md text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                  canSelect ? "cursor-pointer" : "cursor-default",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors",
                    state === "completed" &&
                      "border-primary/40 bg-primary/10 text-primary",
                    state === "current" &&
                      "border-primary bg-primary text-primary-foreground shadow-sm",
                    state === "upcoming" &&
                      "border-border bg-background text-muted-foreground",
                  )}
                >
                  {state === "completed" ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : (
                    idx + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    state === "upcoming"
                      ? "text-muted-foreground"
                      : "text-foreground",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {step.hint && (
                <span className="ml-9 text-xs text-muted-foreground">
                  {step.hint}
                </span>
              )}
            </div>

            {!isLast && (
              <div
                aria-hidden
                className={cn(
                  "hidden h-px flex-1 self-center sm:block",
                  idx < currentIndex ? "bg-primary/40" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}