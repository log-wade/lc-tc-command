"use client";

import { useState } from "react";
import { MessageSquareWarning } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { ProblemReportPanel } from "./problem-report-panel";
import { useAudioRecorder } from "./use-audio-recorder";

export function ProblemReportWidget() {
  const [open, setOpen] = useState(false);
  const audioRecorder = useAudioRecorder();

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) audioRecorder.cancelRecording();
    setOpen(nextOpen);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="fixed bottom-4 right-4 z-[9996] inline-flex h-11 items-center gap-2 rounded-xl bg-brand-text px-3.5 text-sm font-semibold text-white shadow-pop transition duration-200 hover:-translate-y-0.5 hover:bg-ink focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
          aria-label="Report a problem"
        >
          <MessageSquareWarning className="h-4 w-4" />
          <span className="hidden sm:inline">Report a problem</span>
        </button>
      </Dialog.Trigger>
      <ProblemReportPanel open={open} audioRecorder={audioRecorder} />
    </Dialog.Root>
  );
}
