import { cn } from "@/lib/utils";

export function LoginHero({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "relative flex flex-col justify-center overflow-hidden bg-surface px-8 py-12 lg:px-14 xl:px-20",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-brand-hero/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-[360px] w-[360px] rounded-full bg-brand-pink/30 blur-3xl"
      />

      <div className="relative z-10 max-w-lg">
        <span className="inline-flex items-center gap-2 font-sans text-sm font-semibold uppercase tracking-widest text-brand-teal">
          <span className="h-px w-6 bg-brand-teal" />
          Keller Williams Southwest
        </span>

        <h1 className="font-display mt-6 text-4xl uppercase leading-none tracking-tight text-ink sm:text-5xl xl:text-6xl">
          Coordination
          <br />
          Done{" "}
          <span className="font-script text-5xl normal-case leading-none text-brand-coral sm:text-6xl xl:text-7xl">
            Kind
          </span>
        </h1>

        <p className="mt-6 max-w-md text-base leading-relaxed text-ink-muted sm:text-lg">
          Run every listing and transaction from one warm, clear workspace — built for the
          kindest little coordination team in Texas.
        </p>

        <ul className="mt-8 space-y-3 text-sm text-ink-muted">
          <li className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-brand-coral" />
            Listing and contract intake in minutes
          </li>
          <li className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-brand-hero" />
            Review queue before anything sends
          </li>
          <li className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-brand-teal" />
            AI assistant with human approval always
          </li>
        </ul>
      </div>
    </section>
  );
}
