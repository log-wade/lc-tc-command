import Link from "next/link";
import { AlertTriangle, ClipboardCheck, CalendarClock, Sparkles } from "lucide-react";
import type { DashboardStats } from "@/lib/types";
import { Button } from "@/components/ui/button";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function TodayHero({ stats }: { stats: DashboardStats }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dayName = dayNames[now.getDay()];
  const isTuesday = now.getDay() === 2;

  const needsAttention =
    stats.overdueDeadlines + stats.pendingReviews + stats.dueToday;

  return (
    <section className="animate-fade-up overflow-hidden rounded-2xl bg-brand text-white shadow-xl shadow-brand/20">
      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm text-amber-200/90">
              <Sparkles className="h-4 w-4" />
              {dayName} · {now.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
              {greeting}, Carly
            </h1>
            <p className="mt-2 max-w-lg text-base text-stone-300">
              {needsAttention === 0
                ? "You're caught up. Use the quick actions below when a new file comes in."
                : `${needsAttention} item${needsAttention === 1 ? "" : "s"} need your attention today.`}
            </p>
            {isTuesday && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-amber-100">
                <CalendarClock className="h-4 w-4" />
                Tuesday updates due by 3:00 PM CT
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/intake/listing" size="lg" className="bg-white text-brand hover:bg-stone-100">
              New listing
            </Button>
            <Button
              href="/intake/transaction"
              size="lg"
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              New contract
            </Button>
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
          <StatPill
            icon={AlertTriangle}
            label="Overdue"
            value={stats.overdueDeadlines}
            href="/"
            urgent={stats.overdueDeadlines > 0}
          />
          <StatPill
            icon={CalendarClock}
            label="Due today"
            value={stats.dueToday}
            href="/"
            warn={stats.dueToday > 0}
          />
          <StatPill
            icon={ClipboardCheck}
            label="Awaiting review"
            value={stats.pendingReviews}
            href="/reviews"
          />
        </div>
      </div>
    </section>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  href,
  urgent,
  warn,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  href: string;
  urgent?: boolean;
  warn?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 ring-1 transition hover:bg-white/10 ${
        urgent
          ? "bg-urgent/20 ring-urgent/40"
          : warn
            ? "bg-warning/20 ring-amber-500/30"
            : "bg-white/5 ring-white/10"
      }`}
    >
      <Icon className={`h-5 w-5 ${urgent ? "text-red-200" : "text-amber-200/80"}`} />
      <div>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-stone-400">{label}</p>
      </div>
    </Link>
  );
}
