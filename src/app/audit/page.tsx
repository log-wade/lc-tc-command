import { getAuditLogs } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const logs = await getAuditLogs(100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Compliance"
        title="Audit log"
        description="Every system action — broker-exportable for TREC and E&O review."
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-surface-card shadow-sm">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Result</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-ink-muted">
                    No events yet — activity will appear as you use the system.
                  </td>
                </tr>
              ) : (
                logs.map((log: Record<string, unknown>) => (
                  <tr key={String(log.id)} className="border-t border-stone-100 hover:bg-stone-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                      {formatDate(String(log.created_at))}
                    </td>
                    <td className="px-4 py-3 capitalize">{String(log.actor_type)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{String(log.action_type)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          log.outcome === "success"
                            ? "bg-success-soft text-success"
                            : log.outcome === "escalated"
                              ? "bg-urgent-soft text-urgent"
                              : "bg-stone-100 text-ink-muted"
                        }`}
                      >
                        {String(log.outcome ?? "—")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
