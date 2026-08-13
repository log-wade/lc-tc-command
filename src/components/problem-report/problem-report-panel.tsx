"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  ExternalLink,
  Loader2,
  Mic,
  Send,
  Square,
  User,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ProblemReport,
  ProblemReportPlan,
  ProblemReportStatus,
} from "@/lib/problem-reports/types";
import type { AudioRecorderController } from "./use-audio-recorder";

type ProblemReportPanelProps = {
  open: boolean;
  audioRecorder: AudioRecorderController;
};

const activeStatuses: ProblemReportStatus[] = ["approved", "implementing", "pr_open"];

function statusText(status: ProblemReportStatus): string {
  switch (status) {
    case "open":
      return "Ready for details";
    case "analyzing":
      return "Analyzing the issue";
    case "plan_ready":
      return "Fix plan ready";
    case "approved":
      return "Fix approved and queued";
    case "implementing":
      return "Implementing in an isolated workspace";
    case "pr_open":
      return "Pull request ready; merging";
    case "merged":
      return "Merged; production deployment is in progress";
    case "deployed":
      return "Live in production";
    case "failed":
      return "Implementation needs attention";
    case "rejected":
      return "Fix plan rejected";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

function PlanView({
  plan,
  report,
  busy,
  onApprove,
  onReject,
}: {
  plan: ProblemReportPlan;
  report: ProblemReport;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const actionable = report.status === "plan_ready";
  const riskStyles: Record<ProblemReportPlan["riskLevel"], string> = {
    low: "bg-success-soft text-success",
    medium: "bg-warning-soft text-warning",
    high: "bg-urgent-soft text-urgent",
  };

  return (
    <section className="border-y border-border bg-brand-bg/70 px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-teal">
            Proposed fix · version {report.planVersion}
          </p>
          <h3 className="mt-1 text-base text-ink">{plan.title}</h3>
        </div>
        <span
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
            riskStyles[plan.riskLevel]
          )}
        >
          {plan.riskLevel} risk
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{plan.summary}</p>
      <ol className="mt-3 space-y-1.5 text-sm text-ink">
        {plan.steps.map((step, index) => (
          <li key={`${index}-${step}`} className="flex gap-2">
            <span className="mt-0.5 text-xs font-semibold text-brand-coral">{index + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {plan.filesLikely.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            Likely files or areas
          </p>
          <p className="mt-1 font-mono text-xs leading-relaxed text-ink">
            {plan.filesLikely.join(", ")}
          </p>
        </div>
      )}
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
          Agent implementation guidance
        </p>
        <p className="mt-1 max-h-28 overflow-y-auto whitespace-pre-wrap border-l-2 border-brand-teal/40 pl-3 text-xs leading-relaxed text-ink-muted">
          {plan.implementationPrompt}
        </p>
      </div>
      {plan.riskNotes && (
        <p className="mt-3 flex gap-2 text-xs leading-relaxed text-ink-muted">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          {plan.riskNotes}
        </p>
      )}
      {actionable && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={onApprove} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Approve fix
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onReject}
            disabled={busy}
          >
            Reject
          </Button>
        </div>
      )}
    </section>
  );
}

export function ProblemReportPanel({ open, audioRecorder }: ProblemReportPanelProps) {
  const pathname = usePathname();
  const [input, setInput] = useState("");
  const [report, setReport] = useState<ProblemReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { acquiring, recording, startRecording, stopRecording, recorderError } = audioRecorder;

  const messages = report?.messages ?? [];
  const workflowActive = report ? activeStatuses.includes(report.status) : false;
  const workflowComplete = report
    ? report.status === "merged" || report.status === "deployed"
    : false;

  useEffect(() => {
    if (!open || !report || !workflowActive) return;

    const timer = window.setInterval(() => {
      void fetch(`/api/problem-reports/${report.id}/status`, { cache: "no-store" })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? "Could not refresh status.");
          setReport(data.report);
        })
        .catch((statusError: unknown) => {
          setError(statusError instanceof Error ? statusError.message : "Could not refresh status.");
        });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [open, report, workflowActive]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy, transcribing]);

  async function sendMessage(content: string) {
    const text = content.trim();
    if (!text || busy || workflowActive || workflowComplete) return;

    setBusy(true);
    setError(null);
    setInput("");
    try {
      const response = await fetch("/api/problem-reports/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report?.id,
          message: text,
          pageUrl: pathname,
          metadata: {
            userAgent: window.navigator.userAgent,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not analyze the issue.");
      setReport(data.report);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not analyze the issue.");
      setInput(text);
    } finally {
      setBusy(false);
    }
  }

  async function toggleRecording() {
    setError(null);
    if (!recording) {
      await startRecording();
      return;
    }

    try {
      const audio = await stopRecording();
      setTranscribing(true);
      const formData = new FormData();
      formData.append("audio", audio, `problem-report.${audio.type.includes("ogg") ? "ogg" : "webm"}`);
      const response = await fetch("/api/problem-reports/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not transcribe recording.");
      await sendMessage(data.transcript);
    } catch (recordingError) {
      setError(
        recordingError instanceof Error
          ? recordingError.message
          : "Could not transcribe recording."
      );
    } finally {
      setTranscribing(false);
    }
  }

  async function resolvePlan(action: "approve" | "reject") {
    if (!report || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/problem-reports/${report.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planVersion: report.planVersion }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? `Could not ${action} the fix.`);
      setReport(data.report);
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : `Could not ${action} the fix.`);
    } finally {
      setBusy(false);
    }
  }

  function startNewReport() {
    setReport(null);
    setInput("");
    setError(null);
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[9997] bg-brand-text/25 backdrop-blur-[2px]" />
      <Dialog.Content
        className="fixed inset-x-0 bottom-0 z-[9998] flex h-[min(88vh,760px)] flex-col rounded-t-2xl border border-border bg-surface-card shadow-pop outline-none sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-[min(520px,94vw)] sm:rounded-none sm:border-y-0 sm:border-r-0"
      >
        <header className="flex items-start gap-3 border-b border-border px-4 py-4 sm:px-5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-brand-coral">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <Dialog.Title className="font-display text-lg text-ink">Report a problem</Dialog.Title>
            <Dialog.Description className="mt-0.5 text-xs text-ink-muted">
              Describe what happened. I’ll analyze it and propose a fix for your approval.
            </Dialog.Description>
          </div>
          <Dialog.Close
            className="rounded-lg p-2 text-ink-muted transition hover:bg-brand-bg hover:text-ink"
            aria-label="Close problem reporter"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        </header>

        {report && (
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-xs sm:px-5">
            <span className="flex items-center gap-2 text-ink-muted">
              {workflowActive && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-teal" />}
              {statusText(report.status)}
            </span>
            <span className="flex items-center gap-3">
              {report.prUrl && (
                <a
                  href={report.prUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-brand-hero hover:text-brand-coral"
                >
                  View PR <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {workflowComplete && (
                <button
                  type="button"
                  onClick={startNewReport}
                  className="font-medium text-brand-hero hover:text-brand-coral"
                >
                  New report
                </button>
              )}
            </span>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4 px-4 py-5 sm:px-5">
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info-soft text-brand-teal">
                <Bot className="h-4 w-4" />
              </span>
              <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-brand-bg px-4 py-2.5 text-sm leading-relaxed text-ink ring-1 ring-border">
                Tell me what went wrong, what you expected, and anything you tried. You can type or
                tap the microphone to start and stop a recording.
              </p>
            </div>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    message.role === "user"
                      ? "bg-brand-coral text-white"
                      : "bg-info-soft text-brand-teal"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </span>
                <p
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "rounded-tr-sm bg-brand-coral text-white"
                      : "rounded-tl-sm bg-brand-bg text-ink ring-1 ring-border"
                  )}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {(busy || transcribing) && (
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin text-brand-teal" />
                {transcribing ? "Transcribing…" : "Analyzing…"}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {report?.plan && (
            <PlanView
              plan={report.plan}
              report={report}
              busy={busy}
              onApprove={() => void resolvePlan("approve")}
              onReject={() => void resolvePlan("reject")}
            />
          )}
        </div>

        {(error || recorderError || report?.error) && (
          <p className="border-t border-urgent/20 bg-urgent-soft px-4 py-2 text-xs text-urgent sm:px-5">
            {error ?? recorderError ?? report?.error}
          </p>
        )}

        <form
          className="border-t border-border bg-white p-3 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Describe the bug, error, or unexpected behavior…"
            rows={2}
            disabled={busy || transcribing || workflowActive || workflowComplete}
            className="w-full resize-none rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-brand-hero focus:ring-2 focus:ring-brand-hero/20 disabled:bg-brand-bg disabled:opacity-70"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage(input);
              }
            }}
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => void toggleRecording()}
              disabled={
                acquiring || busy || transcribing || workflowActive || workflowComplete
              }
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition disabled:pointer-events-none disabled:opacity-50",
                recording
                  ? "border-urgent bg-urgent-soft text-urgent"
                  : "border-border bg-white text-ink-muted hover:border-brand-hero/50 hover:text-brand-hero"
              )}
              aria-label={
                acquiring
                  ? "Starting microphone"
                  : recording
                    ? "Stop recording"
                    : "Start recording"
              }
            >
              {acquiring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : recording ? (
                <Square className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
              {acquiring ? "Starting…" : recording ? "Stop recording" : "Record"}
            </button>
            <Button
              type="submit"
              size="sm"
              disabled={
                !input.trim() || busy || transcribing || workflowActive || workflowComplete
              }
              aria-label="Send problem report message"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
