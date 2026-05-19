"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { TourStep } from "@/lib/onboarding/steps";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Rect = { top: number; left: number; width: number; height: number };

export function OnboardingTour({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);

  const isCenter = !step.target || step.placement === "center";

  const measureTarget = useCallback(() => {
    if (!step.target) {
      setRect(null);
      return;
    }
    const matches = document.querySelectorAll(`[data-tour="${step.target}"]`);
    const el =
      Array.from(matches).find((node) => node.getBoundingClientRect().width > 0) ??
      matches[0];
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const update = () => {
      const r = el.getBoundingClientRect();
      const pad = 8;
      setRect({
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step.target]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const cleanup = measureTarget();
    const retry = window.setTimeout(measureTarget, 400);
    return () => {
      cleanup?.();
      clearTimeout(retry);
    };
  }, [measureTarget, stepIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft" && stepIndex > 0) onPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext, onPrev, onSkip, stepIndex]);

  if (!mounted) return null;

  const progress = ((stepIndex + 1) / totalSteps) * 100;

  const tooltipStyle: React.CSSProperties = isCenter
    ? {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10002,
        width: "min(420px, calc(100vw - 2rem))",
      }
    : rect
      ? getTooltipPosition(
          rect,
          step.placement && step.placement !== "center" ? step.placement : "bottom"
        )
      : {
          position: "fixed",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10002,
          width: "min(380px, calc(100vw - 2rem))",
        };

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[10000]"
      role="dialog"
      aria-modal
      aria-labelledby="tour-title"
    >
      {/* Visual backdrop only — clicks pass through to the app */}
      <div className="pointer-events-none absolute inset-0 bg-stone-900/70 backdrop-blur-[2px]" />

      {/* Spotlight cutout */}
      {rect && !isCenter && (
        <div
          className="pointer-events-none absolute rounded-xl ring-4 ring-amber-400/80 transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgba(15, 28, 46, 0.72)",
            zIndex: 10001,
          }}
        />
      )}

      {/* Tooltip card */}
      <div style={tooltipStyle} className="pointer-events-auto animate-fade-up">
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
          <div className="h-1 bg-stone-100">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="p-5 sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                Step {stepIndex + 1} of {totalSteps}
              </p>
              <button
                type="button"
                onClick={onSkip}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                aria-label="Skip tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2 id="tour-title" className="font-display text-xl font-semibold text-ink">
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onSkip}
                className="text-sm text-ink-muted hover:text-ink"
              >
                Skip tour
              </button>
              <div className="flex gap-2">
                {stepIndex > 0 && (
                  <Button variant="secondary" size="sm" onClick={onPrev}>
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
                <Button size="sm" onClick={onNext}>
                  {stepIndex >= totalSteps - 1 ? "Get started" : "Next"}
                  {stepIndex < totalSteps - 1 && <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function getTooltipPosition(
  rect: Rect,
  placement: "top" | "bottom" | "left" | "right"
): React.CSSProperties {
  const gap = 16;
  const width = 380;
  const base: React.CSSProperties = {
    position: "fixed",
    zIndex: 10002,
    width: `min(${width}px, calc(100vw - 2rem))`,
  };

  switch (placement) {
    case "top":
      return {
        ...base,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)),
        top: Math.max(16, rect.top - gap),
        transform: "translateY(-100%)",
      };
    case "left":
      return {
        ...base,
        left: Math.max(16, rect.left - gap),
        top: rect.top + rect.height / 2,
        transform: "translate(-100%, -50%)",
      };
    case "right":
      return {
        ...base,
        left: rect.left + rect.width + gap,
        top: Math.max(16, Math.min(rect.top, window.innerHeight - 200)),
      };
    case "bottom":
    default:
      return {
        ...base,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)),
        top: rect.top + rect.height + gap,
      };
  }
}
