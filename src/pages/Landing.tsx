import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Droplets, Gem, Hammer, Waves } from "lucide-react";
import FoldText from "@/components/rb/FoldText";
import BlurText from "@/components/rb/BlurText";
import CountUp from "@/components/rb/CountUp";
import SpotlightCard from "@/components/rb/SpotlightCard";
import ClickSpark from "@/components/rb/ClickSpark";
import { HeroStrata } from "@/components/HeroStrata";
import { EarthCutaway } from "@/components/EarthCutaway";
import { GeoTimeStrip } from "@/components/GeoTimeStrip";
import { LEVELS } from "@/content/levels";
import { Sim } from "@/sims/registry";

const Topography = lazy(() => import("@/components/rb/Topography"));

/** Mount heavy WebGL only once the page has settled (keeps first paint fast). */
function useAfterLoad(ms = 900) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOk(true), ms);
    return () => window.clearTimeout(t);
  }, [ms]);
  return ok;
}

const OUTCOMES = [
  { k: "01", t: "Read a fold", d: "Tell an anticline from a synform, a gentle fold from an isoclinal one — and say which way it verges." },
  { k: "02", t: "Name a fault", d: "Normal, reverse, thrust or strike-slip, from how the hanging wall moved — plus heave and throw." },
  { k: "03", t: "Find the top", d: "Use graded beds, cross-beds and mud cracks to decide if rocks are upside down." },
  { k: "04", t: "Predict the well", d: "Will a well through a fault repeat the section or miss part of it? Work it out before you drill." },
];

const WHY = [
  { icon: Waves, t: "Earthquakes", d: "Faults store and release the strain that shakes cities. Mapping them is hazard planning." },
  { icon: Droplets, t: "Water & energy", d: "Folds trap oil, gas and groundwater; faults can seal them in or let them leak." },
  { icon: Gem, t: "Minerals", d: "Ore bodies follow fold hinges and fault zones where fluids once flowed." },
  { icon: Hammer, t: "Engineering", d: "Tunnels, dams and slopes in Himalayan terrain live or die by joints and faults." },
];

export default function Landing() {
  const ready = useAfterLoad();
  const heroRef = useRef<HTMLElement>(null);

  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <section ref={heroRef} className="relative isolate flex min-h-[100svh] items-center overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_30%,#16251b_0%,#0b0f0c_70%)]" />
        {ready && (
          <Suspense fallback={null}>
            <div aria-hidden className="absolute inset-0 -z-10 opacity-90">
              <Topography color="#a7c47f" lineCount={26} lineWidth={1.4} glow={0.8} fog={0.35} brightness={1.35} speed={0.14} tilt={40} mouseInteraction={false} clickEffect="none" dpr={1} />
            </div>
          </Suspense>
        )}
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-[22%] md:h-[26%]">
          <HeroStrata className="h-full w-full" />
        </div>

        {/* Cut-away Earth: labelled on desktop (right column), faded backdrop on phones */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="pointer-events-none absolute right-0 top-1/2 -z-10 hidden w-[48vw] max-w-[820px] -translate-y-[55%] md:block"
        >
          <EarthCutaway className="h-auto w-full" />
        </motion.div>
        <div aria-hidden className="pointer-events-none absolute -right-28 top-20 -z-10 w-[110vw] opacity-25 md:hidden">
          <EarthCutaway labels={false} className="h-auto w-full" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-5 pb-48 pt-28 md:px-8 md:pb-56">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="font-display text-sm uppercase tracking-[0.35em] text-lichen">
            An interactive field guide to deformed rocks
          </motion.p>
          <h1 className="mt-5 font-display uppercase leading-[0.86] text-ink">
            <span className="block"><FoldText text="Structural" fontSize="clamp(3.4rem, 9vw, 8.5rem)" fontWeight={400} className="font-display block" foldStyle="paper" stagger={0.05} /></span>
            <span className="block"><FoldText text="Geology" fontSize="clamp(3.4rem, 9vw, 8.5rem)" fontWeight={400} className="font-display block text-lichen" foldStyle="paper" stagger={0.05} color="#b5d98a" /></span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7 }} className="mt-6 max-w-xl text-xl leading-relaxed text-ink/85">
            Folds, faults and the forces that bend a planet. Don’t memorise them — <b className="text-sand">squeeze, slip and drill</b> them yourself, then name what you saw.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-9 flex flex-wrap gap-3">
            <ClickSpark sparkColor={["#b5d98a", "#e8dcc4"]} sparkCount={10} style={{ width: "auto", display: "inline-block" }}>
              <Link to="/learn/primary-structures" className="flex items-center gap-2 rounded-full bg-moss px-7 py-4 text-lg font-semibold text-night transition-colors hover:bg-lichen">
                Start the journey <ArrowRight size={18} />
              </Link>
            </ClickSpark>
            <Link to="/lab" className="flex items-center gap-2 rounded-full border border-white/25 px-7 py-4 text-lg backdrop-blur-sm transition-colors hover:border-white/60">
              Jump into the lab
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------ NUMBERS */}
      <section className="border-y border-line bg-forest/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-10 md:grid-cols-4 md:px-8">
          {[
            { n: LEVELS.length, l: "levels" },
            { n: 25, l: "simulations" },
            { n: 70, l: "glossary terms", s: "+" },
            { n: 30, l: "km descent", s: " km" },
          ].map((x) => (
            <div key={x.l}>
              <p className="font-display text-5xl text-ink md:text-6xl">
                <CountUp to={x.n} duration={1.6} />
                <span className="text-lichen">{x.s ?? ""}</span>
              </p>
              <p className="text-muted">{x.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- DEEP TIME */}
      <section className="relative overflow-hidden py-24">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_0%,rgba(200,112,63,0.14),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="font-display text-sm uppercase tracking-[0.3em] text-sand">Deep time</p>
          <BlurText text="4.6 billion years in one strip" className="mt-1 font-display text-4xl uppercase tracking-wide md:text-6xl" delay={70} />
          <p className="mt-3 max-w-2xl text-lg text-muted">Every fold and fault you’ll meet took millions of years to form. Here is Earth’s whole history, to scale.</p>
          <div className="mt-10">
            <GeoTimeStrip />
          </div>
          <div className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { n: 4.6, d: 1, s: " billion", l: "years old" },
              { n: 6371, d: 0, s: " km", l: "mean radius" },
              { n: 15, d: 0, s: "", l: "major & minor tectonic plates" },
              { n: 5200, d: 0, s: " °C", l: "inner-core temperature (approx.)" },
            ].map((f) => (
              <div key={f.l} className="rounded-3xl border border-line bg-white/[0.02] p-5">
                <p className="font-display text-4xl text-ink md:text-5xl">
                  <CountUp to={f.n} duration={2} separator="," decimals={f.d} />
                  <span className="text-2xl text-sand">{f.s}</span>
                </p>
                <p className="mt-1 text-muted">{f.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- OUTCOMES */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8">
        <BlurText text="What you'll be able to do" className="font-display text-4xl uppercase tracking-wide md:text-6xl" delay={80} />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {OUTCOMES.map((o, i) => (
            <motion.div key={o.k} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <SpotlightCard className="h-full rounded-3xl border border-line bg-white/[0.02] p-6" spotlightColor="rgba(232, 220, 196, 0.14)">
                <span className="font-display text-5xl text-white/15">{o.k}</span>
                <h3 className="mt-3 font-display text-2xl uppercase tracking-wide text-lichen">{o.t}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-ink/80">{o.d}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ TEASER */}
      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.3em] text-sand">Try it now</p>
            <h2 className="mt-1 font-display text-4xl uppercase md:text-6xl">Squeeze some rock</h2>
          </div>
          <Link to="/learn/fold-anatomy" className="flex items-center gap-1.5 text-lichen hover:underline">
            Full lesson <ArrowRight size={16} />
          </Link>
        </div>
        <Sim name="FoldAnatomy" />
      </section>

      {/* ----------------------------------------------------------- JOURNEY */}
      <section className="border-y border-line bg-forest/40 py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <BlurText text="The journey: nine levels down" className="font-display text-4xl uppercase tracking-wide md:text-6xl" delay={80} />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEVELS.map((l, i) => (
              <motion.li key={l.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.07 }}>
                <Link to={`/learn/${l.slug}`} className="group block h-full rounded-3xl border border-line bg-night/60 p-5 transition-colors hover:border-lichen/50">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-4xl text-white/20 transition-colors group-hover:text-lichen">{String(l.n).padStart(2, "0")}</span>
                    <ArrowRight size={18} className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-lichen" />
                  </div>
                  <h3 className="mt-3 font-display text-xl uppercase tracking-wide">{l.title}</h3>
                  <p className="mt-1 text-sm text-muted">{l.tagline}</p>
                </Link>
              </motion.li>
            ))}
            <li className="sm:col-span-2 lg:col-span-4">
              <Link to="/descent" className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-sand/30 bg-gradient-to-r from-clay/25 to-moss/15 p-6 hover:border-sand/60">
                <span className="font-display text-3xl uppercase">Finale · Into the Crust — dive 30 km</span>
                <ArrowRight />
              </Link>
            </li>
          </ol>
        </div>
      </section>

      {/* ----------------------------------------------------------- WHY */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8">
        <BlurText text="Why it matters" className="font-display text-4xl uppercase tracking-wide md:text-6xl" delay={80} />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w) => (
            <div key={w.t} className="rounded-3xl border border-line p-6">
              <w.icon className="text-lichen" size={28} />
              <h3 className="mt-4 font-display text-2xl uppercase tracking-wide">{w.t}</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-ink/80">{w.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden border-t border-line">
        <div className="mx-auto max-w-5xl px-5 py-28 text-center md:px-8">
          <h2 className="text-shine font-display text-5xl uppercase leading-none md:text-8xl">Read the rocks.</h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted">Start with Level 1 — it takes about twelve minutes.</p>
          <ClickSpark sparkColor={["#b5d98a", "#e8dcc4"]} sparkCount={12} style={{ width: "auto", display: "inline-block" }}>
            <Link to="/learn/primary-structures" className="mt-8 inline-flex items-center gap-2 rounded-full bg-moss px-8 py-4 text-lg font-semibold text-night hover:bg-lichen">
              Begin Level 1 <ArrowRight size={18} />
            </Link>
          </ClickSpark>
        </div>
      </section>
    </>
  );
}
