import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import type { SimKey } from "@/content/levels";
import { LEVELS } from "@/content/levels";
import { Sim, SIM_TITLES } from "@/sims/registry";
import { cn } from "@/lib/utils";

/** All simulations, grouped by level, in a sidebar timeline — handy for projecting in class. */
export default function Lab() {
  const groups = LEVELS.map((l) => ({
    level: l,
    sims: l.blocks.filter((b) => b.type === "sim").map((b) => (b as { sim: SimKey }).sim),
  })).filter((g) => g.sims.length);
  const all = groups.flatMap((g) => g.sims.map((sim) => ({ sim, level: g.level })));

  const [params, setParams] = useSearchParams();
  const fromUrl = params.get("sim") as SimKey | null;
  const [active, setActive] = useState<SimKey>(fromUrl && SIM_TITLES[fromUrl] ? fromUrl : all[0].sim);
  const [open, setOpen] = useState(false); // mobile list
  const current = all.find((a) => a.sim === active)!;
  const index = all.findIndex((a) => a.sim === active);

  useEffect(() => {
    setParams({ sim: active }, { replace: true });
  }, [active, setParams]);

  const choose = (s: SimKey) => {
    setActive(s);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nav = (
    <nav aria-label="Simulations" className="relative">
      {/* the drawn line */}
      <span aria-hidden className="absolute bottom-3 left-[7px] top-3 w-px bg-gradient-to-b from-lichen/70 via-white/20 to-clay/60" />
      <ol className="space-y-5">
        {groups.map((g) => (
          <li key={g.level.slug}>
            <p className="relative flex items-center gap-3 pl-6 font-display text-sm uppercase tracking-[0.18em] text-muted">
              <span aria-hidden className="absolute left-[3px] size-[9px] rotate-45 border border-lichen/60 bg-night" />
              L{g.level.n} · {g.level.title}
            </p>
            <ul className="mt-2 space-y-0.5">
              {g.sims.map((s) => {
                const on = s === active;
                return (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => choose(s)}
                      aria-current={on ? "true" : undefined}
                      className={cn(
                        "group relative flex w-full items-center rounded-lg py-1.5 pl-6 pr-2 text-left text-[15px] transition-colors",
                        on ? "text-ink" : "text-muted hover:text-ink",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-[3px] size-[9px] rounded-full border transition-all",
                          on ? "scale-125 border-lichen bg-lichen shadow-[0_0_12px_#b5d98a]" : "border-white/35 bg-night group-hover:border-lichen/70",
                        )}
                      />
                      <span className={cn("transition-transform", on && "translate-x-1 font-semibold")}>{SIM_TITLES[s]}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </nav>
  );

  return (
    <div className="mx-auto max-w-[1500px] px-5 pb-24 pt-28 md:px-8">
      <header className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-lichen">Simulation lab</p>
        <h1 className="text-shine mt-2 font-display text-5xl uppercase leading-none md:text-7xl">{all.length} simulations</h1>
        <p className="mt-3 max-w-xl text-lg text-muted">Pick any simulation from the trail on the left — ideal for projecting in class.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[290px_1fr]">
        {/* Desktop: sticky sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 [scrollbar-width:thin]">{nav}</div>
        </aside>

        {/* Mobile: collapsible list */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex w-full items-center justify-between rounded-2xl border border-line bg-white/[0.03] px-4 py-3 text-left"
          >
            <span>
              <span className="block text-xs uppercase tracking-[0.2em] text-muted">Simulation {index + 1} of {all.length}</span>
              <span className="font-display text-lg uppercase">{SIM_TITLES[active]}</span>
            </span>
            <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
          </button>
          {open && <div className="mt-3 rounded-2xl border border-line p-4">{nav}</div>}
        </div>

        <div className="min-w-0">
          <Sim key={active} name={active} />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[15px]">
            <p className="text-muted">
              Part of <Link to={`/learn/${current.level.slug}`} className="text-lichen hover:underline">Level {current.level.n} · {current.level.title}</Link>
            </p>
            <div className="flex gap-2">
              <button type="button" disabled={index === 0} onClick={() => choose(all[index - 1].sim)} className="rounded-full border border-line px-4 py-2 disabled:opacity-40">← Previous</button>
              <button type="button" disabled={index === all.length - 1} onClick={() => choose(all[index + 1].sim)} className="rounded-full bg-moss px-4 py-2 font-semibold text-night disabled:opacity-40">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
