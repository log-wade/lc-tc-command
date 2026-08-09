import Link from "next/link";
import { getReviewQueue } from "@/lib/data";
import { getTemplateById, resolveTemplateId } from "@/lib/templates/catalog";
import { fillTemplate } from "@/lib/templates/signature";
import { buildEmailContext } from "@/lib/templates/build-context";
import { PageHeader } from "@/components/ui/page-header";
import { ReviewActions } from "@/components/reviews/review-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await getReviewQueue();

  const enriched = await Promise.all(
    reviews.map(async (r: Record<string, unknown>) => {
      const payload = (r.payload as Record<string, unknown>) ?? {};
      const templateId = payload.template_id
        ? resolveTemplateId(String(payload.template_id))
        : undefined;
      const template = templateId ? getTemplateById(templateId) : undefined;
      const fileType = r.file_type as string | undefined;
      const fileId = r.file_id != null ? String(r.file_id) : undefined;

      let draftSubject =
        typeof payload.draft_subject === "string" ? payload.draft_subject : undefined;
      let draftBody = typeof payload.draft === "string" ? payload.draft : undefined;

      if (template && (!draftSubject || !draftBody)) {
        const ctx = await buildEmailContext(fileType, fileId);
        draftSubject = draftSubject ?? fillTemplate(template.subject, ctx);
        draftBody = draftBody ?? fillTemplate(template.body, ctx);
      }

      return {
        id: String(r.id),
        title: String(r.title ?? "Review item"),
        priority: String(r.priority ?? "P2"),
        file_type: fileType,
        file_id: fileId,
        template,
        draftSubject,
        draftBody,
        skippable: payload.skippable === true || templateId === "tpl-6",
      };
    })
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Human-in-loop"
        title="Review queue"
        description="Approve, edit, or skip before anything sends. AI drafts and system emails land here first."
      />

      {enriched.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Queue is clear"
          description="When you submit an intake or the system drafts a Tuesday update, it will show up here for your approval."
        />
      ) : (
        <ul className="space-y-3">
          {enriched.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-border bg-surface-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${
                      r.priority === "P0"
                        ? "bg-urgent-soft text-urgent"
                        : "bg-warning-soft text-warning"
                    }`}
                  >
                    {r.priority}
                  </span>
                  <h3 className="mt-2 font-medium text-ink">{r.title}</h3>
                  {r.template && (
                    <p className="mt-1 text-xs text-ink-muted">
                      {r.template.id} · {r.template.name}
                    </p>
                  )}
                  {r.file_id != null && (
                    <p className="mt-1 text-xs text-ink-muted">
                      <Link
                        href={
                          r.file_type === "listing"
                            ? `/listings/${r.file_id}`
                            : `/transactions/${r.file_id}`
                        }
                        className="text-brand-coral hover:underline"
                      >
                        Open {r.file_type} file
                      </Link>
                    </p>
                  )}
                </div>
                <ReviewActions
                  reviewId={r.id}
                  skippable={r.skippable}
                  draftSubject={r.draftSubject}
                  draftBody={r.draftBody}
                />
              </div>

              {(r.draftSubject || r.draftBody) && (
                <div className="mt-4 rounded-xl border border-border bg-brand-bg/40 p-4">
                  {r.draftSubject && (
                    <p className="text-sm font-medium text-ink">
                      <span className="text-ink-muted">Subject: </span>
                      {r.draftSubject}
                    </p>
                  )}
                  {r.draftBody && (
                    <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-ink">
                      {r.draftBody.replace(/<[^>]+>/g, " ").replace(/[ \t]+\n/g, "\n")}
                    </pre>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
