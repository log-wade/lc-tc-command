"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function WizardSteps({
  steps,
  current,
}: {
  steps: { id: string; label: string }[];
  current: number;
}) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center gap-2 sm:gap-0">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition",
                    done && "bg-success text-white",
                    active && "bg-brand text-white ring-4 ring-brand/10",
                    !done && !active && "bg-stone-200 text-stone-500"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-center text-xs font-medium sm:block sm:text-left",
                    active ? "text-ink" : "text-ink-muted"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1 hidden h-0.5 flex-1 sm:block",
                    done ? "bg-success" : "bg-stone-200"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function WizardPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("animate-fade-up rounded-2xl border border-border bg-surface-card p-6 shadow-sm sm:p-8", className)}>
      {children}
    </div>
  );
}
