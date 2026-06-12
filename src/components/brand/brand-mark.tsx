import { cn } from "@/lib/utils";

export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl bg-brand-coral font-script text-xl leading-none text-white shadow-sm",
          className
        )}
      >
        D
      </span>
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      <p className="flex items-baseline gap-1 leading-none">
        <span className="font-script text-2xl text-brand-coral">Do</span>
        <span className="font-display text-xl uppercase tracking-wide text-ink">Kind Group</span>
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-teal">
        LC/TC Command
      </p>
    </div>
  );
}
