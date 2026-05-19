"use client";

import { useState } from "react";

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
    setResult(await res.json());
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
        <label className="block">
          <span className="text-xs font-medium text-stone-600">From</span>
          <input name="from" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-stone-600">Subject</span>
          <input name="subject" required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-stone-600">Body</span>
          <textarea name="body" required rows={6} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#1a2332] px-4 py-2 text-sm font-medium text-white"
        >
          {loading ? "Classifying..." : "Classify with AI Agent"}
        </button>
      </form>

      {result && (
        <div
          className={`rounded-xl border p-6 ${
            result.wire_fraud_signal
              ? "border-red-300 bg-red-50"
              : "border-stone-200 bg-white"
          }`}
        >
          <p className="text-xs font-semibold uppercase text-stone-500">Classification</p>
          <p className="mt-2 text-2xl font-bold">{String(result.priority)}</p>
          <p className="mt-2 text-sm">{String(result.suggested_action)}</p>
          {Boolean(result.wire_fraud_signal) && (
            <p className="mt-4 font-semibold text-red-800">
              WIRE FRAUD PROTOCOL — Do not action. Verify by phone only.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
