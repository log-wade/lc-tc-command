"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ONBOARDING_STORAGE_KEY,
  SIDEBAR_TOUR_TARGETS,
  TOUR_STEPS,
} from "@/lib/onboarding/steps";
import { OnboardingTour } from "./onboarding-tour";

type OnboardingContextValue = {
  isActive: boolean;
  stepIndex: number;
  totalSteps: number;
  startTour: () => void;
  skipTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}

export function useOnboardingOptional() {
  return useContext(OnboardingContext);
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const complete = useCallback(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsActive(false);
    setStepIndex(0);
  }, []);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
    router.push("/");
  }, [router]);

  const skipTour = useCallback(() => {
    complete();
  }, [complete]);

  const nextStep = useCallback(() => {
    if (stepIndex >= TOUR_STEPS.length - 1) {
      complete();
      return;
    }
    setStepIndex((i) => i + 1);
  }, [stepIndex, complete]);

  const prevStep = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!done) {
      const t = window.setTimeout(() => setIsActive(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const currentStep = TOUR_STEPS[stepIndex];

  useEffect(() => {
    if (!isActive || !currentStep?.route) return;
    if (pathname !== currentStep.route) {
      router.push(currentStep.route);
    }
  }, [isActive, currentStep, pathname, router]);

  useEffect(() => {
    if (!isActive || !currentStep?.target) return;
    if (SIDEBAR_TOUR_TARGETS.has(currentStep.target) && window.innerWidth < 1024) {
      window.dispatchEvent(new Event("tour-open-sidebar"));
    }
  }, [isActive, currentStep]);

  const value = useMemo(
    () => ({
      isActive,
      stepIndex,
      totalSteps: TOUR_STEPS.length,
      startTour,
      skipTour,
      nextStep,
      prevStep,
    }),
    [isActive, stepIndex, startTour, skipTour, nextStep, prevStep]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {isActive && (
        <OnboardingTour
          step={currentStep}
          stepIndex={stepIndex}
          totalSteps={TOUR_STEPS.length}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
        />
      )}
    </OnboardingContext.Provider>
  );
}
