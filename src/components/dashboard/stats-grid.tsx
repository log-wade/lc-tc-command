import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/types";
import { AlertTriangle, Calendar, ClipboardList, Home, FileText } from "lucide-react";

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      label: "Active Listings",
      value: stats.activeListings,
      icon: Home,
      accent: "text-emerald-600",
    },
    {
      label: "Active Transactions",
      value: stats.activeTransactions,
      icon: FileText,
      accent: "text-blue-600",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingReviews,
      icon: ClipboardList,
      accent: "text-amber-600",
    },
    {
      label: "Due Today",
      value: stats.dueToday,
      icon: Calendar,
      accent: "text-violet-600",
    },
    {
      label: "Overdue Deadlines",
      value: stats.overdueDeadlines,
      icon: AlertTriangle,
      accent: stats.overdueDeadlines > 0 ? "text-red-600" : "text-stone-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(({ label, value, icon: Icon, accent }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`rounded-lg bg-stone-50 p-2.5 ${accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-stone-900">
                {value}
              </p>
              <p className="text-xs text-stone-500">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
