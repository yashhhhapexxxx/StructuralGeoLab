import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Geological time to scale (International Chronostratigraphic Chart, ICS colours).
 * Eon/era boundaries in Ma: 4600 · 4000 · 2500 · 538.8 · 251.9 · 66 · 0.
 */
const AGE = 4600;
const UNITS = [
  { name: "Hadean", from: 4600, to: 4000, color: "#AE027E", note: "Molten young Earth; the Moon forms; first oceans condense." },
  { name: "Archean", from: 4000, to: 2500, color: "#F0047F", note: "First continents and the earliest life — microbial mats and stromatolites." },
  { name: "Proterozoic", from: 2500, to: 538.8, color: "#F73563", note: "Oxygen builds up in the air; supercontinents assemble and break apart." },
  { name: "Paleozoic", from: 538.8, to: 251.9, color: "#99C08D", note: "Cambrian explosion of animal life; forests, fish, amphibians; Pangaea forms." },
  { name: "Mesozoic", from: 251.9, to: 66, color: "#67C5CA", note: "Age of dinosaurs; Pangaea rifts apart and the Atlantic opens." },
  { name: "Cenozoic", from: 66, to: 0, color: "#F2F91D", note: "Mammals spread; India collides with Asia and the Himalaya rise." },
];

const EVENTS = [
  { at: 3700, label: "Oldest signs of life" },
  { at: 2400, label: "Great Oxidation Event" },
  { at: 538.8, label: "Cambrian explosion" },
  { at: 66, label: "Dinosaurs extinct" },
  { at: 50, label: "India hits Asia → Himalaya" },
];

const pos = (ma: number) => ((AGE - ma) / AGE) * 100;

export function GeoTimeStrip() {
  const [active, setActive] = useState(5);
  const u = UNITS[active];

  return (
    <div>
      <div className="relative">
        {/* the strip */}
        <motion.div
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          whileInView={{ clipPath: "inset(0 0% 0 0)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-20 overflow-hidden rounded-2xl md:h-24"
        >
          {UNITS.map((x, i) => (
            <button
              key={x.name}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={`${x.name}, ${x.from} to ${x.to} million years ago`}
              style={{ width: `${((x.from - x.to) / AGE) * 100}%`, background: x.color }}
              className={cn("relative min-w-[6px] transition-[filter] duration-300", active === i ? "brightness-110" : "brightness-75 hover:brightness-100")}
            >
              {(x.from - x.to) / AGE > 0.1 && (
                <span className="absolute inset-0 grid place-items-center font-display text-lg uppercase tracking-wide text-black/70 md:text-2xl">{x.name}</span>
              )}
            </button>
          ))}
        </motion.div>
        {/* event pins */}
        <div className="pointer-events-none relative h-24">
          {EVENTS.map((e, i) => (
            <div key={e.label} className="absolute top-0 flex flex-col items-center" style={{ left: `${pos(e.at)}%`, transform: `translateX(${pos(e.at) > 85 ? "-100%" : "-50%"})` }}>
              <span className="h-4 w-px bg-white/50" style={{ height: 12 + (i % 2) * 34 }} />
              <span className="whitespace-nowrap rounded-full border border-line bg-night/80 px-2.5 py-1 text-xs text-ink/90 md:text-sm">
                {e.label} · {e.at >= 1000 ? `${(e.at / 1000).toFixed(1)} Ga` : `${e.at} Ma`}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-display text-3xl uppercase" style={{ color: u.color }}>{u.name}</span>
        <span className="text-muted">{u.from >= 1000 ? `${(u.from / 1000).toFixed(1)} Ga` : `${u.from} Ma`} → {u.to === 0 ? "today" : u.to >= 1000 ? `${(u.to / 1000).toFixed(1)} Ga` : `${u.to} Ma`}</span>
        <span className="w-full text-lg text-ink/85 md:w-auto">{u.note}</span>
      </div>
      <p className="mt-3 text-sm text-muted">Hover or tap a block. The whole of human history fits in the last hair’s width of the yellow Cenozoic.</p>
    </div>
  );
}

export default GeoTimeStrip;
