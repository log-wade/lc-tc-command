"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AttachmentList, AttachmentPicker } from "@/components/templates/attachment-list";
import type { EmailAttachment } from "@/lib/templates/attachments";

export function ReviewActions({
  reviewId,
  skippable,
  draftSubject,
  draftBody,
  templateAttachments = [],
  reviewAttachments = [],
}: {
  reviewId: string;
  skippable?: boolean;
  draftSubject?: string;
  draftBody?: string;
  templateAttachments?: EmailAttachment[];
  reviewAttachments?: EmailAttachment[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(draftSubject ?? "");
  const [body, setBody] = useState(draftBody ?? "");
  const [extras, setExtras] = useState(reviewAttachments);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function resolve(approved: boolean, notes?: string) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        approved,
        notes,
        subject: approved && (subject || draftSubject) ? subject || draftSubject : undefined,
        body: approved && (body || draftBody) ? body || draftBody : undefined,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not update review");
      return;
    }
    router.refresh();
  }

  async function saveRevision() {
    setLoading(true);
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/reviews/${reviewId}/revision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ subject, body }),
    });
    const data = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save revision");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function uploadFile(file: File) {
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/reviews/${reviewId}/attachments`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = (await res.json()) as { error?: string; attachment?: EmailAttachment };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not attach file");
      return;
    }
    if (data.attachment) setExtras((current) => [...current, data.attachment!]);
    setEditing(true);
    router.refresh();
  }

  async function removeFile(attachmentId: string) {
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/reviews/${reviewId}/attachments?attachmentId=${encodeURIComponent(attachmentId)}`,
      { method: "DELETE", credentials: "include" }
    );
    const data = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not remove file");
      return;
    }
    setExtras((current) => current.filter((item) => item.id !== attachmentId));
    router.refresh();
  }

  const hasDraft = Boolean(draftSubject || draftBody);

  return (
    <div className="flex w-full flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {hasDraft && (
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
        <div className="mt-2 w-full max-w-xl space-y-3 text-left">
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
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-teal">
              Attachments
            </p>
            {templateAttachments.length > 0 && (
              <div className="mt-2">
                <AttachmentList
                  attachments={templateAttachments}
                  locked
                  lockedHint="from template"
                />
              </div>
            )}
            <div className="mt-2">
              <AttachmentList
                attachments={extras}
                disabled={loading}
                onRemove={(attachmentId) => void removeFile(attachmentId)}
              />
            </div>
            <div className="mt-3">
              <AttachmentPicker disabled={loading} onFile={(file) => void uploadFile(file)} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={loading}
              onClick={() => void saveRevision()}
            >
              Save revision
            </Button>
          </div>
          {saved && <p className="text-xs text-success">Revision saved. Approve when you are ready to send.</p>}
          {error && <p className="text-xs text-urgent">{error}</p>}
        </div>
      )}
      {!editing && error && <p className="text-xs text-urgent">{error}</p>}
    </div>
  );
}
