import Link from "next/link";
import { getReviewQueue } from "@/lib/data";
import { resolveTemplateId } from "@/lib/templates/catalog";
import { loadRuntimeTemplate } from "@/lib/templates/runtime";
import { parseEmailAttachments } from "@/lib/templates/attachments";
import { fillTemplate } from "@/lib/templates/signature";
import { buildEmailContext } from "@/lib/templates/build-context";
import { parseDraftBlocks } from "@/lib/templates/html-draft";
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
      const template = templateId ? await loadRuntimeTemplate(templateId) : undefined;
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
        templateAttachments: template?.attachments ?? [],
        reviewAttachments: parseEmailAttachments(payload.attachments),
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
                  {(r.templateAttachments.length > 0 || r.reviewAttachments.length > 0) && (
                    <p className="mt-1 text-xs text-ink-muted">
                      Attachments:{" "}
                      {[...r.templateAttachments, ...r.reviewAttachments]
                        .map((file) => file.filename)
                        .join(", ")}
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
                  templateAttachments={r.templateAttachments}
                  reviewAttachments={r.reviewAttachments}
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
                    <div className="mt-3 max-h-64 space-y-3 overflow-auto text-xs leading-relaxed text-ink">
                      {parseDraftBlocks(r.draftBody).map((block, index) =>
                        block.kind === "text" ? (
                          <p key={index} className="whitespace-pre-wrap">
                            {block.text}
                          </p>
                        ) : (
                          <div key={index} className="overflow-x-auto">
                            <table className="w-full min-w-[34rem] border-collapse text-left">
                              {block.header.length > 0 && (
                                <thead>
                                  <tr>
                                    {block.header.map((heading, cellIndex) => (
                                      <th
                                        key={cellIndex}
                                        className="border border-border bg-brand-bg px-2 py-1 font-semibold"
                                      >
                                        {heading}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                              )}
                              <tbody>
                                {block.rows.map((row, rowIndex) => (
                                  <tr key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                      <td
                                        key={cellIndex}
                                        className="border border-border bg-white px-2 py-1 align-top"
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}
                    </div>
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
