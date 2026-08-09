"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ReviewActions({
  reviewId,
  skippable,
  draftSubject,
  draftBody,
}: {
  reviewId: string;
  skippable?: boolean;
  draftSubject?: string;
  draftBody?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(draftSubject ?? "");
  const [body, setBody] = useState(draftBody ?? "");

  async function resolve(approved: boolean, notes?: string) {
    setLoading(true);
    await fetch(`/api/reviews/${reviewId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approved,
        notes,
        subject: approved && (subject || draftSubject) ? subject || draftSubject : undefined,
        body: approved && (body || draftBody) ? body || draftBody : undefined,
      }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {(draftSubject || draftBody) && (
          <Button
            size="sm"
            variant="ghost"
            disabled={loading}
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? "Hide edit" : "Edit draft"}
          </Button>
        )}
        <Button
          size="sm"
          variant="success"
          disabled={loading}
          onClick={() => void resolve(true)}
        >
          Approve
        </Button>
        {skippable && (
          <Button
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={() => void resolve(false, "agent_already_sent")}
          >
            Skip — agent already sent
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          disabled={loading}
          onClick={() => void resolve(false)}
        >
          Reject
        </Button>
      </div>
      {editing && (
        <div className="mt-2 w-full max-w-xl space-y-2 text-left">
          <label className="block text-xs font-medium text-ink-muted">
            Subject
            <input
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label className="block text-xs font-medium text-ink-muted">
            Body
            <textarea
              className="mt-1 min-h-[180px] w-full rounded-lg border border-border bg-white px-3 py-2 font-mono text-xs text-ink"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  );
}
