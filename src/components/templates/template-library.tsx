"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, X, ShieldCheck } from "lucide-react";
import type { EmailTemplate } from "@/lib/templates/catalog";
import type { EmailAttachment } from "@/lib/templates/attachments";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AttachmentList, AttachmentPicker } from "@/components/templates/attachment-list";

type LibraryTemplate = EmailTemplate & { attachments: EmailAttachment[] };

export function TemplateLibrary() {
  const [templates, setTemplates] = useState<LibraryTemplate[]>([]);
  const [selected, setSelected] = useState<LibraryTemplate | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/templates", { credentials: "include" });
    const data = (await res.json()) as { templates?: LibraryTemplate[] };
    setTemplates(data.templates ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const close = useCallback(() => {
    setSelected(null);
    setError(null);
    setSaved(false);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, close]);

  function open(template: LibraryTemplate) {
    setSelected(template);
    setName(template.name);
    setSubject(template.subject);
    setBody(template.body);
    setError(null);
    setSaved(false);
  }

  async function saveRevision() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/templates/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, subject, body }),
    });
    const data = (await res.json()) as { error?: string; template?: LibraryTemplate };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save revision");
      return;
    }
    if (data.template) {
      setSelected(data.template);
      setTemplates((current) =>
        current.map((item) => (item.id === data.template?.id ? data.template : item))
      );
    }
    setSaved(true);
  }

  async function uploadFile(file: File) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/templates/${selected.id}/attachments`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = (await res.json()) as { error?: string; template?: LibraryTemplate };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not attach file");
      return;
    }
    if (data.template) {
      setSelected(data.template);
      setTemplates((current) =>
        current.map((item) => (item.id === data.template?.id ? data.template : item))
      );
    }
  }

  async function removeFile(attachmentId: string) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const res = await fetch(
      `/api/templates/${selected.id}/attachments?attachmentId=${encodeURIComponent(attachmentId)}`,
      { method: "DELETE", credentials: "include" }
    );
    const data = (await res.json()) as { error?: string; template?: LibraryTemplate };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not remove file");
      return;
    }
    if (data.template) {
      setSelected(data.template);
      setTemplates((current) =>
        current.map((item) => (item.id === data.template?.id ? data.template : item))
      );
    }
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => open(t)}
            className={cn(
              "w-full rounded-2xl border border-border bg-surface-card p-5 text-left shadow-[var(--shadow-card)] transition",
              "hover:border-brand-hero/40 hover:shadow-[var(--shadow-pop)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-hero/30"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-brand-coral">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="font-mono text-[11px] text-brand-hero">{t.id}</p>
                <h3 className="font-display mt-0.5 font-bold text-ink">{t.name}</h3>
                <p className="mt-2 text-xs text-ink-muted">{t.when}</p>
                {t.attachments.length > 0 && (
                  <p className="mt-2 text-[11px] text-brand-hero">
                    {t.attachments.length} attached file{t.attachments.length === 1 ? "" : "s"}
                  </p>
                )}
                <span className="mt-2 inline-block rounded-md bg-brand-bg px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                  {t.category}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="template-preview-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-brand-text/50 backdrop-blur-[1px]"
            aria-label="Close preview"
            onClick={close}
          />
          <div className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface-card shadow-[var(--shadow-pop)]">
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div>
                <p className="font-mono text-[11px] text-brand-hero">{selected.id}</p>
                <h2 id="template-preview-title" className="font-display text-xl font-bold text-ink">
                  {selected.name}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">{selected.when}</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 text-ink-muted hover:bg-brand-bg"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2 rounded-xl bg-brand-peach/20 px-3 py-2 text-xs text-ink ring-1 ring-brand-peach/40">
                <ShieldCheck className="h-4 w-4 shrink-0 text-brand-coral" />
                Save a revision here to update future drafts. Queued emails keep any copy already saved on that review item.
              </div>
              <label className="block text-xs font-medium text-ink-muted">
                Name
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-brand-bg px-3 py-2 text-sm text-ink"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="block text-xs font-medium text-ink-muted">
                Subject
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-brand-bg px-3 py-2 font-mono text-sm text-ink"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </label>
              <label className="block text-xs font-medium text-ink-muted">
                Body
                <textarea
                  className="mt-1 min-h-[220px] w-full rounded-xl border border-border bg-brand-bg px-3 py-3 font-sans text-sm leading-relaxed text-ink"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </label>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-teal">
                  Attachments
                </p>
                <p className="mt-1 mb-2 text-xs text-ink-muted">
                  These files go out with every send of this template. PDF, Word, Excel, images, and zip up to 8 MB.
                </p>
                <AttachmentList
                  attachments={selected.attachments}
                  disabled={saving}
                  onRemove={(attachmentId) => void removeFile(attachmentId)}
                />
                {selected.attachments.length === 0 && (
                  <p className="text-xs text-ink-muted">No files attached.</p>
                )}
                <div className="mt-3">
                  <AttachmentPicker disabled={saving} onFile={(file) => void uploadFile(file)} />
                </div>
              </div>
              {error && <p className="text-sm text-urgent">{error}</p>}
              {saved && <p className="text-sm text-success">Revision saved.</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
              <Button variant="secondary" onClick={close}>
                Close
              </Button>
              <Button disabled={saving} onClick={() => void saveRevision()}>
                {saving ? "Saving…" : "Save revision"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
