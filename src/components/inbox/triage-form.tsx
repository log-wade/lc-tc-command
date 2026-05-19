"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { AlertTriangle, Inbox } from "lucide-react";

export function InboxTriageForm() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/ai/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fd.get("from"),
        subject: fd.get("subject"),
        body: fd.get("body"),
      }),
    });
    const json = await res.json();
    setResult(json);
    setLoading(false);
    if (json.wire_fraud_signal) {
      toast.error("Wire fraud signal — follow phone verification protocol");
    } else {
      toast.success(`Classified as ${json.priority}`);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-border bg-surface-card p-6 shadow-sm"
      >
        <FormField label="From" name="from" placeholder="sender@example.com" />
        <FormField label="Subject" name="subject" required placeholder="RE: 413 Pecan Hollow — wire instructions" />
        <FormField
          label="Message body"
          name="body"
          textarea
          required
          placeholder="Paste the full email here…"
        />
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          <Inbox className="h-4 w-4" />
          {loading ? "Classifying…" : "Classify email"}
        </Button>
      </form>

      {result && (
        <div
          className={`animate-fade-up rounded-2xl border p-6 ${
            result.wire_fraud_signal
              ? "border-urgent/50 bg-urgent-soft"
              : "border-border bg-surface-card"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Classification
          </p>
          <p className="mt-2 font-display text-4xl font-semibold text-ink">
            {String(result.priority)}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {String(result.suggested_action)}
          </p>
          {Boolean(result.wire_fraud_signal) && (
            <div className="mt-4 flex gap-3 rounded-xl bg-white/80 p-4 text-sm text-urgent">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>
                <strong>Wire fraud protocol:</strong> Do not action. Call the title closer using
                the verified number on file. Loop broker immediately.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
