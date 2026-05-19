"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  FileText,
  Inbox,
  ClipboardCheck,
  Shield,
  FormInput,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/listings", label: "Listings", icon: Home },
  { href: "/transactions", label: "Transactions", icon: FileText },
  { href: "/reviews", label: "Review Queue", icon: ClipboardCheck },
  { href: "/intake/listing", label: "New Listing", icon: FormInput },
  { href: "/intake/transaction", label: "New Contract", icon: FormInput },
  { href: "/inbox", label: "Inbox Triage", icon: Inbox },
  { href: "/audit", label: "Audit Log", icon: Shield },
  { href: "/templates", label: "Templates", icon: Mail },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-stone-200 bg-[#1a2332] text-stone-100">
      <div className="border-b border-stone-700/50 px-5 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">
          KW ANW
        </p>
        <h1 className="mt-1 font-serif text-lg font-semibold leading-tight text-white">
          LC/TC Command
        </h1>
        <p className="mt-1 text-xs text-stone-400">
          Automated Coordination System
        </p>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-amber-500/15 text-amber-200"
                  : "text-stone-300 hover:bg-stone-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-stone-700/50 p-4 text-xs text-stone-500">
        <p className="font-medium text-stone-400">Carly Bryant</p>
        <p>TREC #723235-SA</p>
        <p className="mt-2 text-stone-600">Phase 1 • v1.0</p>
      </div>
    </aside>
  );
}
