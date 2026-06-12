"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { BrandMark } from "@/components/brand/brand-mark";
import { LoginHero } from "@/components/brand/login-hero";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <LoginHero className="hidden lg:flex lg:min-h-screen lg:w-1/2 lg:border-r lg:border-border" />

      <div className="relative flex flex-1 items-center justify-center bg-surface px-4 py-10 lg:py-12">
        <div
          className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-brand-hero/15 blur-3xl lg:hidden"
          aria-hidden
        />

        <div className="relative w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <LoginHero className="rounded-2xl border border-border bg-surface-card p-6 shadow-[var(--shadow-card)]" />
          </div>

          <div className="rounded-2xl border border-border bg-surface-card p-8 shadow-[var(--shadow-pop)]">
            <BrandMark />
            <p className="mt-4 text-sm text-ink-muted">Sign in to your coordination workspace</p>
            {next.startsWith("/intake") && (
              <p className="mt-3 rounded-xl bg-brand-peach/20 px-3 py-2 text-sm text-ink">
                Sign in to access listing and contract intake.
              </p>
            )}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-ink shadow-sm transition focus:border-brand-hero focus:outline-none focus:ring-2 focus:ring-brand-hero/20"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-ink shadow-sm transition focus:border-brand-hero focus:outline-none focus:ring-2 focus:ring-brand-hero/20"
                />
              </div>
              {error && <p className="text-sm text-urgent">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-coral py-2.5 font-medium text-white shadow-sm transition hover:bg-[#e04f50] disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
