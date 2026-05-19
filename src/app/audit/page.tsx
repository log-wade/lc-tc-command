import { getAuditLogs } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const logs = await getAuditLogs(100);

  return (
    <div className="p-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Layer 8 — Audit & Observability
        </p>
        <h1 className="font-serif text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-stone-600">
          Every system action with timestamp, actor, inputs, and outcome — broker-exportable.
        </p>
      </header>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Recent Events</h2>
        </CardHeader>
        <CardContent className="max-h-[70vh] overflow-auto p-0">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Actor</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: Record<string, unknown>) => (
                <tr key={String(log.id)} className="border-t border-stone-100">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {formatDate(String(log.created_at))}
                  </td>
                  <td className="px-4 py-2">{String(log.actor_type)}</td>
                  <td className="px-4 py-2 font-mono">{String(log.action_type)}</td>
                  <td className="px-4 py-2">{String(log.outcome ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
