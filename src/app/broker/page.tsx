import { getSessionProfile } from "@/lib/supabase/server-auth";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { integrationStatus } from "@/lib/integrations/registry";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

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
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader
        eyebrow="Oversight"
        title="Broker dashboard"
        description="Compliance oversight, AI activity, and integration health for your market center."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending reviews", value: stats.pendingReviews },
          { label: "AI actions (24h)", value: stats.agentActions24h },
          { label: "Workflow runs (24h)", value: stats.workflowRuns24h },
          { label: "Open escalations", value: stats.escalationsOpen },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent>
              <p className="text-sm text-ink-muted">{card.label}</p>
              <p className="mt-2 font-display text-3xl font-bold text-brand-hero">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent>
          <h2 className="font-display text-lg font-bold text-ink">Integrations</h2>
          <ul className="mt-4 space-y-2">
            {integrations.map((i) => (
              <li key={i.provider} className="flex justify-between text-sm text-ink">
                <span className="capitalize">{i.provider}</span>
                <span className={i.mode === "live" ? "font-medium text-success" : "text-ink-muted"}>
                  {i.mode}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-4 text-sm">
        <Link href="/audit" className="font-medium text-brand-hero hover:text-brand-coral">
          Full audit log →
        </Link>
        <Link href="/assistant" className="font-medium text-brand-hero hover:text-brand-coral">
          AI assistant →
        </Link>
      </div>
    </div>
  );
}
