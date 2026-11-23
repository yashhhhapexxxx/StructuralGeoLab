import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Clock, Mountain } from "lucide-react";
import { LEVELS } from "@/content/levels";
import { SIM_TITLES } from "@/sims/registry";
import { resetProgress, useProgress } from "@/lib/progress";
import SpotlightCard from "@/components/rb/SpotlightCard";
import { cn } from "@/lib/utils";

const UNITS = [
  { name: "Foundations", levels: [1, 2] },
  { name: "Maps & measurement", levels: [3] },
  { name: "Folds", levels: [4, 5, 6] },
  { name: "Faults", levels: [7, 8] },
  { name: "Putting it together", levels: [9] },
];

export default function Learn() {
  const progress = useProgress();
  const pct = Math.round((progress.done.length / LEVELS.length) * 100);
  const nextLevel = LEVELS.find((l) => !progress.done.includes(l.n)) ?? LEVELS[0];

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-lichen">Course map</p>
          <h1 className="text-shine mt-2 font-display text-5xl uppercase leading-none md:text-7xl">Nine levels down</h1>
          <p className="mt-3 max-w-xl text-lg text-muted">Each level opens with a simulation, names what you saw, and ends with a three-question check — no exams.</p>
        </div>
        <div className="w-full max-w-xs rounded-2xl border border-line p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Your progress</span>
            <span className="font-semibold text-lichen">{progress.done.length}/{LEVELS.length} levels</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-moss to-lichen transition-[width] duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link to={`/learn/${nextLevel.slug}`} className="flex items-center gap-1.5 text-sm font-semibold text-lichen">
              {progress.done.length ? "Continue" : "Start"}: L{nextLevel.n} <ArrowRight size={14} />
            </Link>
            {progress.done.length > 0 && (
              <button type="button" onClick={resetProgress} className="text-xs text-muted hover:text-ink">Reset</button>
            )}
          </div>
        </div>
      </header>

      <div className="mt-14 space-y-14">
        {UNITS.map((u) => (
          <section key={u.name}>
            <h2 className="font-display text-2xl uppercase tracking-[0.15em] text-muted">{u.name}</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {u.levels.map((n, i) => {
                const l = LEVELS.find((x) => x.n === n)!;
                const done = progress.done.includes(n);
                const sims = l.blocks.filter((b) => b.type === "sim").map((b) => (b.type === "sim" ? SIM_TITLES[b.sim] : ""));
                return (
                  <motion.div key={n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: i * 0.06, duration: 0.5 }}>
                    <Link to={`/learn/${l.slug}`} className="block h-full">
                      <SpotlightCard className={cn("h-full rounded-3xl border bg-white/[0.02] p-6 transition-colors", done ? "border-lichen/40" : "border-line hover:border-white/25")} spotlightColor="rgba(181, 217, 138, 0.18)">
                        <div className="flex items-start justify-between">
                          <span className="font-display text-6xl leading-none text-white/15">{String(n).padStart(2, "0")}</span>
                          {done ? <CheckCircle2 className="text-lichen" /> : <Mountain className="text-white/25" />}
                        </div>
                        <h3 className="mt-4 font-display text-2xl uppercase tracking-wide">{l.title}</h3>
                        <p className="mt-1 text-[15px] text-muted">{l.tagline}</p>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {sims.map((s) => (
                            <span key={s} className="rounded-full bg-moss/15 px-2.5 py-1 text-xs text-lichen">▶ {s}</span>
                          ))}
                        </div>
                        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted"><Clock size={12} /> {l.minutes} min</p>
                      </SpotlightCard>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))}
        <Link to="/descent" className="block rounded-3xl border border-sand/30 bg-gradient-to-r from-clay/20 via-transparent to-moss/15 p-8 transition-colors hover:border-sand/60">
          <p className="font-display text-sm uppercase tracking-[0.3em] text-sand">Finale</p>
          <p className="mt-2 font-display text-4xl uppercase md:text-5xl">Into the Crust →</p>
          <p className="mt-2 max-w-xl text-muted">Scroll from the surface to 30 km and watch brittle faults give way to ductile folds and shear zones.</p>
        </Link>
      </div>
    </div>
  );
}
