import { cn } from "@/lib/utils";
import Link from "next/link";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const buttonClassName = (
  variant: Variant,
  size: Size,
  className?: string
) =>
  cn(
    "inline-flex items-center justify-center rounded-xl font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-hero/40 focus-visible:ring-offset-2",
    variants[variant],
    sizes[size],
    className
  );

const variants: Record<Variant, string> = {
  primary:
    "rounded-full bg-brand-coral font-semibold text-white shadow-pop hover:bg-brand-coral/90 hover:shadow-pop active:scale-[0.98]",
  secondary:
    "border border-border bg-white text-ink shadow-sm hover:border-brand-hero/40 hover:text-brand-hero",
  ghost: "text-ink-muted hover:bg-brand-bg hover:text-ink",
  danger: "bg-urgent text-white hover:bg-red-700",
  success: "bg-success text-white hover:bg-emerald-700",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  href?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", children, href, ...props },
  ref
) {
  const classes = buttonClassName(variant, size, className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
});
