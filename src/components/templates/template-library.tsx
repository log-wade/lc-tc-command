"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, X, ShieldCheck } from "lucide-react";
import { EMAIL_TEMPLATES, type EmailTemplate } from "@/lib/templates/catalog";
import { cn } from "@/lib/utils";

export function TemplateLibrary() {
  const [selected, setSelected] = useState<EmailTemplate | null>(null);

  const close = useCallback(() => setSelected(null), []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, close]);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {EMAIL_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelected(t)}
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
                Requires review before send — nothing goes out automatically from this template.
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-teal">
                  Subject
                </p>
                <p className="mt-1 rounded-xl bg-brand-bg px-3 py-2 font-mono text-sm text-ink">
                  {selected.subject}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-teal">
                  Body
                </p>
                <pre className="mt-1 whitespace-pre-wrap rounded-xl bg-brand-bg px-3 py-3 font-sans text-sm leading-relaxed text-ink">
                  {selected.body}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
