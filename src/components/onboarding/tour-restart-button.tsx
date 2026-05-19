"use client";

import { HelpCircle } from "lucide-react";
import { useOnboardingOptional } from "./onboarding-provider";

export function TourRestartButton() {
  const onboarding = useOnboardingOptional();
  if (!onboarding) return null;

  return (
    <button
      type="button"
      onClick={onboarding.startTour}
      className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-stone-400 transition hover:bg-white/5 hover:text-amber-200"
    >
      <HelpCircle className="h-3.5 w-3.5 shrink-0" />
      Replay onboarding tour
    </button>
  );
}
