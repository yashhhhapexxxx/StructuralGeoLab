import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { LEVELS, levelBySlug, type Block } from "@/content/levels";
import { Sim } from "@/sims/registry";
import { Quiz } from "@/components/Quiz";
import { useProgress } from "@/lib/progress";
import BlurText from "@/components/rb/BlurText";
import NotFound from "./NotFound";

function RenderBlock({ b }: { b: Block }) {
  switch (b.type) {
    case "p":
      return <p className="max-w-3xl text-lg leading-relaxed text-ink/90">{b.text}</p>;
    case "h":
      return <h2 className="pt-4 font-display text-3xl uppercase tracking-wide text-ink md:text-4xl">{b.text}</h2>;
    case "list":
      return (
        <ul className="max-w-3xl space-y-2.5 text-lg leading-relaxed text-ink/90">
          {b.items.map((i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2.5 size-2 shrink-0 rounded-full bg-moss" />
              <span>{i}</span>
            </li>
          ))}
        </ul>
      );
    case "terms":
      return (
        <dl className="grid max-w-4xl gap-3 sm:grid-cols-2">
          {b.items.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-line bg-white/[0.02] p-4">
              <dt className="font-display text-lg uppercase tracking-wide text-lichen">{t}</dt>
              <dd className="mt-1 text-[16px] leading-relaxed text-ink/85">{d}</dd>
            </div>
          ))}
        </dl>
      );
    case "table":
      return (
        <div className="max-w-4xl overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-left text-[16px]">
            <thead className="bg-white/[0.04]">
              <tr>
                {b.head.map((h) => (
                  <th key={h} className="px-4 py-3 font-display text-sm uppercase tracking-[0.15em] text-lichen">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r) => (
                <tr key={r.join()} className="border-t border-line">
                  {r.map((c, i) => (
                    <td key={i} className={i === 0 ? "px-4 py-3 font-semibold" : "px-4 py-3 text-ink/85"}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout":
      return (
        <aside className="max-w-4xl rounded-2xl border border-lichen/30 bg-gradient-to-br from-moss/15 to-transparent p-5">
          <p className="font-display text-lg uppercase tracking-wide text-lichen">{b.title}</p>
          <p className="mt-1 text-[17px] leading-relaxed text-ink/90">{b.text}</p>
        </aside>
      );
    case "sim":
      return (
        <div className="space-y-3">
          {b.prompt && (
            <p className="flex items-start gap-2 text-[16px] text-sand">
              <span className="mt-0.5 rounded-full bg-sand/15 px-2 py-0.5 font-display text-xs uppercase tracking-widest text-sand">Play</span>
              {b.prompt}
            </p>
          )}
          <Sim name={b.sim} />
        </div>
      );
  }
}

export default function Lesson() {
  const { slug = "" } = useParams();
  const level = levelBySlug(slug);
  const progress = useProgress();
  if (!level) return <NotFound />;
  const prev = LEVELS.find((l) => l.n === level.n - 1);
  const next = LEVELS.find((l) => l.n === level.n + 1);
  const done = progress.done.includes(level.n);

  return (
    <article className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8">
      <Link to="/learn" className="inline-flex items-center gap-2 text-[15px] text-muted hover:text-ink">
        <ArrowLeft size={16} /> Course map
      </Link>
      <header className="mt-6 border-b border-line pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-lichen/40 px-3 py-1 font-display text-sm uppercase tracking-[0.2em] text-lichen">Level {level.n}</span>
          <span className="flex items-center gap-1.5 text-sm text-muted"><Clock size={14} /> {level.minutes} min</span>
          {done && <span className="flex items-center gap-1.5 text-sm text-lichen"><CheckCircle2 size={15} /> Completed</span>}
        </div>
        <BlurText text={level.title} className="text-shine mt-4 font-display text-5xl uppercase leading-[0.95] tracking-wide md:text-7xl" animateBy="words" delay={90} />
        <p className="mt-3 max-w-2xl text-xl text-muted">{level.tagline}</p>
      </header>

      <div className="mt-10 space-y-8">
        {level.blocks.map((b, i) => (
          <RenderBlock key={i} b={b} />
        ))}
      </div>

      <div className="mt-14">
        <Quiz key={level.slug} level={level.n} questions={level.quiz} />
      </div>

      <section className="mt-10 rounded-2xl border border-line p-5">
        <p className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.2em] text-muted"><BookOpen size={15} /> Sources for this level</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-muted">
          {level.sources.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <nav className="mt-10 flex flex-wrap justify-between gap-4" aria-label="Level navigation">
        {prev ? (
          <Link to={`/learn/${prev.slug}`} className="flex items-center gap-2 rounded-full border border-line px-5 py-3 hover:border-lichen/50">
            <ArrowLeft size={16} /> L{prev.n} · {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/learn/${next.slug}`} className="flex items-center gap-2 rounded-full bg-moss px-5 py-3 font-semibold text-night hover:bg-lichen">
            L{next.n} · {next.title} <ArrowRight size={16} />
          </Link>
        ) : (
          <Link to="/descent" className="flex items-center gap-2 rounded-full bg-moss px-5 py-3 font-semibold text-night hover:bg-lichen">
            Finale: Into the Crust <ArrowRight size={16} />
          </Link>
        )}
      </nav>
    </article>
  );
}
