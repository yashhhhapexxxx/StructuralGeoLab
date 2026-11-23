import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Gauge, Thermometer } from "lucide-react";

const MAX_KM = 30;
const GEOTHERM = 25; // °C per km (typical continental crust)
const SURFACE_T = 15;
const MPA_PER_KM = 27; // lithostatic ≈ ρ g z with ρ ≈ 2.7 g/cm³

/* ------------------------------------------------------------- illustrations */

function Joints() {
  return (
    <svg viewBox="0 0 400 220" className="w-full" aria-hidden>
      <rect width="400" height="220" fill="#e3c78a" />
      {[60, 130, 205, 275, 340].map((x, i) => (
        <path key={x} d={`M ${x} 0 L ${x + (i % 2 ? 8 : -6)} 220`} stroke="#3b2e20" strokeWidth="3" className="anim-crack" style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
      {[70, 150].map((y) => (
        <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="#3b2e20" strokeOpacity="0.35" />
      ))}
    </svg>
  );
}

function BrittleFault() {
  return (
    <svg viewBox="0 0 400 220" className="w-full" aria-hidden>
      <defs>
        <clipPath id="d-fw"><path d="M0 0 L170 0 L250 220 L0 220 Z" /></clipPath>
        <clipPath id="d-hw"><path d="M170 0 L400 0 L400 220 L250 220 Z" /></clipPath>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} clipPath="url(#d-fw)" x="0" y={i * 44} width="400" height="44" fill={["#e3c78a", "#6e7b6a", "#c9cfc4", "#b9855a", "#a7b48f"][i]} />
      ))}
      <g clipPath="url(#d-hw)">
        <g className="anim-slip">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x="0" y={i * 44 - 44} width="400" height="44" fill={["#a7b48f", "#e3c78a", "#6e7b6a", "#c9cfc4", "#b9855a", "#a7b48f"][i]} />
          ))}
        </g>
      </g>
      <line x1="170" y1="0" x2="250" y2="220" stroke="#fff" strokeWidth="4" />
      <circle cx="210" cy="110" r="6" fill="#c8703f" className="anim-quake" />
    </svg>
  );
}

function Transition() {
  return (
    <svg viewBox="0 0 400 220" className="w-full" aria-hidden>
      <rect width="400" height="220" fill="#6e7b6a" />
      <path d="M150 0 L185 80" stroke="#fff" strokeWidth="4" />
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M ${185 + i * 4 - 18} 80 C ${200 + i * 4} 140, ${170 + i * 6} 180, ${220 + i * 5} 220`} stroke="#e3c78a" strokeOpacity={0.4 + (i % 3) * 0.2} strokeWidth="2.5" fill="none" className="anim-flow" style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
      <text x="12" y="24" fill="#fff" fontSize="14">fault above…</text>
      <text x="12" y="206" fill="#fff" fontSize="14">…shear zone below</text>
    </svg>
  );
}

function DuctileFolds() {
  return (
    <svg viewBox="0 0 400 220" className="w-full" aria-hidden>
      <rect width="400" height="220" fill="#3a4337" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M -20 ${40 + i * 28} q 40 -45 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0`} fill="none" stroke={["#e3c78a", "#c9cfc4", "#b9855a", "#e3c78a", "#a7b48f", "#c9cfc4"][i]} strokeWidth="10" className="anim-fold" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </svg>
  );
}

function Mylonite() {
  return (
    <svg viewBox="0 0 400 220" className="w-full" aria-hidden>
      <rect width="400" height="220" fill="#2f3a2c" />
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={i} d={`M -20 ${i * 14 + 6} C 120 ${i * 14 - 6}, 260 ${i * 14 + 16}, 420 ${i * 14 + 4}`} stroke={i % 3 ? "#c9cfc4" : "#e3c78a"} strokeOpacity="0.7" strokeWidth={i % 4 ? 2 : 4} fill="none" className="anim-shear" />
      ))}
      {[80, 210, 320].map((x, i) => (
        <ellipse key={x} cx={x} cy={70 + i * 45} rx="26" ry="10" fill="#e8dcc4" transform={`rotate(-14 ${x} ${70 + i * 45})`} />
      ))}
    </svg>
  );
}

/* ---------------------------------------------------------------------- zones */

const ZONES: { from: number; to: number; title: string; text: string; bullets: string[]; art: ReactNode; tone: string }[] = [
  {
    from: 0, to: 1, title: "The surface", tone: "from-sand/20",
    text: "Cold, unconfined rock breaks easily. Weathering opens fractures and sediments record their primary structures.",
    bullets: ["Joints and joint sets", "Mud cracks, ripples, cross-beds (primary)", "Landslides and open fissures"],
    art: <Joints />,
  },
  {
    from: 1, to: 8, title: "Upper crust — brittle", tone: "from-clay/20",
    text: "Rocks fail by fracturing. Faults with cores of gouge and breccia, damage zones of fractures and deformation bands.",
    bullets: ["Normal, reverse and strike-slip faults", "Fault breccia and gouge", "Fluid flow along fault damage zones"],
    art: <BrittleFault />,
  },
  {
    from: 8, to: 12, title: "Seismogenic zone", tone: "from-clay/25",
    text: "Most continental earthquakes nucleate here: stress builds on locked faults and is released in sudden slip.",
    bullets: ["Earthquake ruptures and aftershocks", "Fault segments interacting", "Pseudotachylyte (friction melt) in places"],
    art: <BrittleFault />,
  },
  {
    from: 12, to: 16, title: "Brittle–ductile transition", tone: "from-moss/20",
    text: "Around 10–15 km temperature reaches ~300–400 °C; quartz starts to flow. Faults root downward into ductile shear zones.",
    bullets: ["Mixed brittle and ductile behaviour", "Faults pass downward into shear zones", "Base of most crustal earthquakes"],
    art: <Transition />,
  },
  {
    from: 16, to: 24, title: "Middle crust — ductile", tone: "from-moss/25",
    text: "Rocks fold and flow instead of breaking. Folds tighten, cleavage and schistosity develop, minerals grow aligned.",
    bullets: ["Tight to isoclinal folds", "Cleavage and schistosity", "Boudinage of stiff layers"],
    art: <DuctileFolds />,
  },
  {
    from: 24, to: 30, title: "Lower crust", tone: "from-lichen/20",
    text: "High temperature and pressure: gneisses, migmatites and wide mylonitic shear zones accommodate deformation.",
    bullets: ["Mylonites in ductile shear zones", "Gneissic banding", "Passive (similar) folding"],
    art: <Mylonite />,
  },
];

export default function Descent() {
  const ref = useRef<HTMLDivElement>(null);
  const [km, setKm] = useState(0);

  useEffect(() => {
    const on = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
      setKm(p * MAX_KM);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  const temp = SURFACE_T + GEOTHERM * km;
  const pressure = (MPA_PER_KM * km) / 1000; // GPa
  const mode = km < 12 ? "Brittle" : km < 16 ? "Transitional" : "Ductile";

  return (
    <div className="pt-24">
      <header className="mx-auto max-w-5xl px-5 pb-12 text-center md:px-8">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-lichen">Finale</p>
        <h1 className="text-shine mt-2 font-display text-6xl uppercase leading-none md:text-8xl">Into the Crust</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">Scroll down through 30 km of continental crust. Watch the gauges — and watch rocks stop breaking and start flowing.</p>
      </header>
      <div ref={ref} className="relative mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[300px_1fr] md:px-8">
        {/* Sticky gauges */}
        <aside className="sticky top-20 z-10 h-fit rounded-3xl border border-line bg-night/85 p-5 backdrop-blur md:top-24">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-muted">Depth</p>
          <p className="font-display text-6xl leading-none tabular-nums text-ink">
            {km.toFixed(1)}<span className="text-2xl text-muted"> km</span>
          </p>
          <div className="mt-4 h-40 w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#e3c78a] via-[#7a5a3c] to-[#c8703f] md:h-64">
            <div className="relative h-full">
              <div className="absolute inset-x-0 border-t border-dashed border-white/60" style={{ top: `${(12 / MAX_KM) * 100}%` }} />
              <div className="absolute left-2 text-[11px] text-white/90" style={{ top: `${(12 / MAX_KM) * 100}%` }}>brittle–ductile</div>
              <div className="absolute inset-x-0 h-1 bg-white shadow-[0_0_14px_#fff]" style={{ top: `calc(${(km / MAX_KM) * 100}% - 2px)` }} />
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[15px]">
            <dt className="flex items-center gap-1.5 text-muted"><Thermometer size={15} /> Temperature</dt>
            <dd className="text-right font-semibold tabular-nums">{temp.toFixed(0)} °C</dd>
            <dt className="flex items-center gap-1.5 text-muted"><Gauge size={15} /> Pressure</dt>
            <dd className="text-right font-semibold tabular-nums">{pressure.toFixed(2)} GPa</dd>
            <dt className="text-muted">Behaviour</dt>
            <dd className={`text-right font-display text-lg uppercase ${mode === "Brittle" ? "text-[#f0a57c]" : mode === "Ductile" ? "text-lichen" : "text-sand"}`}>{mode}</dd>
          </dl>
          <p className="mt-3 text-xs text-muted">Typical continental geotherm ~{GEOTHERM} °C/km; lithostatic pressure ~{MPA_PER_KM} MPa/km.</p>
        </aside>

        <div className="space-y-[30vh] pb-[40vh]">
          {ZONES.map((z) => (
            <motion.section
              key={z.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: "-25% 0px -25% 0px" }}
              transition={{ duration: 0.6 }}
              className={`overflow-hidden rounded-3xl border border-line bg-gradient-to-br ${z.tone} to-transparent`}
            >
              <div className="overflow-hidden border-b border-line">{z.art}</div>
              <div className="p-6 md:p-8">
                <p className="font-display text-sm uppercase tracking-[0.25em] text-muted">{z.from}–{z.to} km</p>
                <h2 className="mt-1 font-display text-4xl uppercase tracking-wide md:text-5xl">{z.title}</h2>
                <p className="mt-3 max-w-2xl text-lg text-ink/90">{z.text}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {z.bullets.map((b) => (
                    <li key={b} className="rounded-full border border-line bg-black/20 px-3 py-1.5 text-sm">{b}</li>
                  ))}
                </ul>
              </div>
            </motion.section>
          ))}
          <div className="rounded-3xl border border-lichen/40 bg-moss/15 p-8 text-center">
            <p className="font-display text-4xl uppercase md:text-5xl">You reached 30 km</p>
            <p className="mx-auto mt-2 max-w-lg text-muted">From joints to mylonites — the same rock, broken near the surface and flowing at depth.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/lab" className="rounded-full bg-moss px-6 py-3 font-semibold text-night">Open the simulation lab</Link>
              <Link to="/learn" className="rounded-full border border-line px-6 py-3">Back to the course</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
