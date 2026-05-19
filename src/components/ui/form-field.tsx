import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink shadow-sm transition placeholder:text-stone-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function FormField({
  label,
  name,
  type = "text",
  required,
  hint,
  placeholder,
  className,
  textarea,
  step,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  className?: string;
  textarea?: boolean;
  step?: string;
  defaultValue?: string | number;
  options?: { value: string; label: string }[];
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline gap-1 text-sm font-medium text-ink">
        {label}
        {required && <span className="text-urgent">*</span>}
      </span>
      {hint && <span className="mb-2 block text-xs text-ink-muted">{hint}</span>}
      {options ? (
        <select name={name} required={required} className={inputClass} defaultValue={defaultValue as string}>
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          name={name}
          required={required}
          rows={4}
          placeholder={placeholder}
          className={inputClass}
          defaultValue={defaultValue}
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          step={step}
          className={inputClass}
          defaultValue={defaultValue}
        />
      )}
    </label>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}
