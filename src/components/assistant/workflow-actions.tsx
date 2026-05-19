"use client";

import { useState } from "react";
import { Play, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkflowId } from "@/lib/ai/workflows";

const WORKFLOWS: { id: WorkflowId; label: string; description: string }[] = [
  {
    id: "morning_briefing",
    label: "Morning briefing",
    description: "Overdue deadlines, due today, and review queue priorities.",
  },
  {
    id: "tuesday_prep",
    label: "Tuesday prep",
    description: "Active files needing weekly client updates by 3 PM CT.",
  },
  {
    id: "intake_triage",
    label: "Intake triage",
    description: "Verify intro emails and third-party intros are queued.",
  },
];

export function WorkflowActions() {
  const [running, setRunning] = useState<WorkflowId | null>(null);
  const [result, setResult] = useState<{
    workflow_id: string;
    summary: string;
    recommended_actions: string[];
  } | null>(null);

  async function run(workflowId: WorkflowId) {
    setRunning(workflowId);
    setResult(null);
    try {
      const res = await fetch("/api/agent/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow_id: workflowId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Workflow failed");
      setResult(data);
    } catch (e) {
      setResult({
        workflow_id: workflowId,
        summary: e instanceof Error ? e.message : "Workflow failed",
        recommended_actions: [],
      });
    } finally {
      setRunning(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface-card p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">Autonomous workflows</h2>
      <p className="mt-1 text-sm text-ink-muted">
        One-click agent runs that scan your workspace and return prioritized actions.
      </p>

      <ul className="mt-4 space-y-2">
        {WORKFLOWS.map((w) => (
          <li
            key={w.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-border bg-stone-50/80 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-ink">{w.label}</p>
              <p className="text-xs text-ink-muted">{w.description}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={running !== null}
              onClick={() => void run(w.id)}
            >
              {running === w.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run
            </Button>
          </li>
        ))}
      </ul>

      {result && (
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent-soft/50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">{result.summary}</p>
              {result.recommended_actions.length > 0 && (
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-ink-muted">
                  {result.recommended_actions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
