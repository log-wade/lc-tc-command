import { getSessionProfile } from "@/lib/supabase/server-auth";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { integrationStatus } from "@/lib/integrations/registry";
import Link from "next/link";

export default async function BrokerDashboardPage() {
  const profile = await getSessionProfile();
  if (profile && !["broker", "mca", "admin"].includes(profile.role)) {
    redirect("/");
  }

  const supabase = createServiceClient();
  let stats = {
    pendingReviews: 0,
    agentActions24h: 0,
    workflowRuns24h: 0,
    escalationsOpen: 0,
  };

  if (supabase) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [reviews, agentAudit, workflows, escalations] = await Promise.all([
      supabase.from("review_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("agent_audit_logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since),
      supabase
        .from("workflow_runs")
        .select("id", { count: "exact", head: true })
        .gte("started_at", since),
      supabase.from("escalations").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);
    stats = {
      pendingReviews: reviews.count ?? 0,
      agentActions24h: agentAudit.count ?? 0,
      workflowRuns24h: workflows.count ?? 0,
      escalationsOpen: escalations.count ?? 0,
    };
  }

  const integrations = integrationStatus();

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="font-display text-3xl text-stone-100">Broker dashboard</h1>
        <p className="mt-1 text-stone-400">
          Compliance oversight, AI activity, and integration health for your market center.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending reviews", value: stats.pendingReviews },
          { label: "AI actions (24h)", value: stats.agentActions24h },
          { label: "Workflow runs (24h)", value: stats.workflowRuns24h },
          { label: "Open escalations", value: stats.escalationsOpen },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <p className="text-sm text-stone-400">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-amber-300">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium text-stone-100">Integrations</h2>
        <ul className="mt-4 space-y-2">
          {integrations.map((i) => (
            <li key={i.provider} className="flex justify-between text-sm text-stone-300">
              <span className="capitalize">{i.provider}</span>
              <span className={i.mode === "live" ? "text-emerald-400" : "text-stone-500"}>
                {i.mode}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-4 text-sm">
        <Link href="/audit" className="text-amber-400 hover:underline">
          Full audit log →
        </Link>
        <Link href="/assistant" className="text-amber-400 hover:underline">
          AI assistant →
        </Link>
      </div>
    </div>
  );
}
