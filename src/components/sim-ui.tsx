import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Card that frames every simulation: title, canvas area, and a controls panel. */
export function SimFrame({
  title,
  subtitle,
  children,
  controls,
  readouts,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  controls?: ReactNode;
  readouts?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-white/[0.04] to-white/[0.01] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4 md:px-7">
        <h3 className="font-display text-2xl uppercase tracking-wide text-ink md:text-3xl">{title}</h3>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </header>
      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        <div className="relative min-h-[280px] bg-[#0d130f]">{children}</div>
        {(controls || readouts) && (
          <aside className="flex flex-col gap-5 border-t border-line p-5 md:p-6 lg:border-l lg:border-t-0">
            {controls && <div className="flex flex-col gap-4">{controls}</div>}
            {readouts && (
              <div className="rounded-2xl border border-line bg-black/20 p-4">
                <p className="mb-2 font-display text-sm uppercase tracking-[0.2em] text-lichen">Readout</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px]">{readouts}</dl>
              </div>
            )}
          </aside>
        )}
      </div>
    </section>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v: number) => String(v),
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-[15px]">
        <span className="text-ink">{label}</span>
        <span className="font-mono text-sm tabular-nums text-lichen">{format(value)}</span>
      </span>
      <input
        className="sim-range mt-1"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[15px] text-ink">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5 rounded-full border border-line bg-black/20 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-sm transition-colors",
              value === o.value ? "bg-moss text-night" : "text-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[15px] text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--color-moss)]"
      />
      {label}
    </label>
  );
}

export function Readout({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className={cn("text-right font-semibold tabular-nums", accent ? "text-lichen" : "text-ink")}>{value}</dd>
    </>
  );
}

/** Big verdict banner shown inside a sim, e.g. "NORMAL FAULT". */
export function Verdict({ children, tone = "moss" }: { children: ReactNode; tone?: "moss" | "clay" | "sand" }) {
  const toneClass = {
    moss: "border-lichen/40 bg-moss/15 text-lichen",
    clay: "border-clay/50 bg-clay/15 text-[#f0a57c]",
    sand: "border-sand/40 bg-sand/10 text-sand",
  }[tone];
  return (
    <div className={cn("pointer-events-none absolute left-4 top-4 rounded-full border px-4 py-1.5 font-display text-lg uppercase tracking-wider backdrop-blur-sm md:text-xl", toneClass)}>
      {children}
    </div>
  );
}
