import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Readout, SimFrame, Slider, Verdict } from "@/components/sim-ui";
import { BED_COLORS } from "@/geo/beds";
import { cn } from "@/lib/utils";

/* Map: X east 0–800 m, Y = distance south of the top edge 0–1200 m. North is up. */
const MW = 800;
const MH = 1200;
const CELL = 20;
const TOPO_INT = 100;

/** Ground elevation (m): a ridge in the north falling south, with a valley and spurs. */
const topo = (X: number, Y: number) =>
  610 - 0.4 * Y - 95 * Math.exp(-((X - 470) ** 2) / 9000) * (0.4 + Y / 1500) + 45 * Math.sin(X / 120 + Y / 300) + 35 * Math.cos(Y / 160);

/** Contact elevations at the SOUTH edge (Y = MH); contacts dip north, into the hillside. */
const CONTACTS = [
  { name: "A/B", c: 650 },
  { name: "B/C", c: 500 },
  { name: "C/D", c: 350 },
  { name: "D/E", c: 200 },
];
const UNITS = ["A", "B", "C", "D", "E"];
const unitColor = (i: number) => BED_COLORS[(i + 1) % BED_COLORS.length];

/** Marching squares: segments of level `lev` on a sampled grid. */
function contourSegments(f: (x: number, y: number) => number, lev: number, step: number) {
  const segs: [number, number, number, number][] = [];
  for (let x = 0; x < MW; x += step)
    for (let y = 0; y < MH; y += step) {
      const v = [f(x, y), f(x + step, y), f(x + step, y + step), f(x, y + step)];
      const P = [[x, y], [x + step, y], [x + step, y + step], [x, y + step]];
      const pts: [number, number][] = [];
      for (let e = 0; e < 4; e++) {
        const a = v[e] - lev;
        const b = v[(e + 1) % 4] - lev;
        if ((a < 0) !== (b < 0)) {
          const t = a / (a - b);
          const p0 = P[e];
          const p1 = P[(e + 1) % 4];
          pts.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]);
        }
      }
      if (pts.length >= 2) segs.push([pts[0][0], pts[0][1], pts[1][0], pts[1][1]]);
      if (pts.length === 4) segs.push([pts[2][0], pts[2][1], pts[3][0], pts[3][1]]);
    }
  return segs;
}

const STEPS = [
  "Draw the section line PQ on the map.",
  "Mark where PQ crosses each topographic contour and transfer the points to the profile.",
  "Join the points: that is the topographic profile.",
  "Mark where PQ crosses each structure contour and plot it at that contour’s elevation.",
  "Join each contact’s points (dotted where eroded above ground) and colour the units.",
];

/**
 * Sim — Building a cross-section from structure contours (strike lines), step by step.
 */
export function CrossSectionBuilder() {
  const [dip, setDip] = useState(22);
  const [x0, setX0] = useState(300);
  const [step, setStep] = useState(4);
  const [playing, setPlaying] = useState(false);
  const tan = Math.tan((dip * Math.PI) / 180);
  const zc = (k: number, Y: number) => CONTACTS[k].c + (Y - MH) * tan; // contacts dip north

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setStep((s) => (s >= 4 ? (setPlaying(false), 4) : s + 1)), 1400);
    return () => window.clearInterval(id);
  }, [playing]);

  const unitAt = (X: number, Y: number) => {
    const t = topo(X, Y);
    return CONTACTS.filter((_, k) => zc(k, Y) > t).length;
  };

  const map = useMemo(() => {
    const cells: { x: number; y: number; u: number }[] = [];
    for (let x = 0; x < MW; x += CELL) for (let y = 0; y < MH; y += CELL) cells.push({ x, y, u: unitAt(x + CELL / 2, y + CELL / 2) });
    const topoLines: { lev: number; segs: [number, number, number, number][] }[] = [];
    for (let lev = 100; lev <= 600; lev += TOPO_INT) topoLines.push({ lev, segs: contourSegments(topo, lev, 25) });
    return { cells, topoLines };
  }, [dip]); // eslint-disable-line react-hooks/exhaustive-deps

  // Structure contours: E–W lines where contact k is at elevation e.
  const structureLines = CONTACTS.flatMap((ct, k) => {
    const out: { k: number; e: number; Y: number }[] = [];
    for (let e = 0; e <= 700; e += 100) {
      const Y = MH + (e - ct.c) / tan;
      if (Y >= 0 && Y <= MH) out.push({ k, e, Y });
    }
    return out;
  });

  // Profile along PQ (X = x0, Y 0 → 1200)
  const prof: [number, number][] = [];
  for (let Y = 0; Y <= MH; Y += 10) prof.push([Y, topo(x0, Y)]);
  const topoPts: [number, number][] = [];
  for (let i = 1; i < prof.length; i++) {
    const [y0, h0] = prof[i - 1];
    const [y1, h1] = prof[i];
    for (let lev = 100; lev <= 600; lev += TOPO_INT)
      if ((h0 - lev) * (h1 - lev) < 0) topoPts.push([y0 + ((lev - h0) / (h1 - h0)) * (y1 - y0), lev]);
  }

  // Map → screen
  const MS = 0.36;
  const mx = (X: number) => 20 + X * MS;
  const my = (Y: number) => 40 + Y * MS;
  // Profile → screen
  const PX0 = 372;
  const PW = 510;
  const PY0 = 70;
  const PH = 330;
  const px = (Y: number) => PX0 + (Y / MH) * PW;
  const py = (e: number) => PY0 + PH - (e / 700) * PH;
  const profPath = prof.map(([Y, h], i) => `${i ? "L" : "M"}${px(Y).toFixed(1)} ${py(h).toFixed(1)}`).join(" ");

  // Units on the profile as polygons between contacts, clipped below topography.
  const unitPolys = UNITS.map((_, u) => {
    const top = (Y: number) => (u === 0 ? 700 : zc(u - 1, Y));
    const bot = (Y: number) => (u === CONTACTS.length ? 0 : zc(u, Y));
    let d = "";
    for (let Y = 0; Y <= MH; Y += 20) d += `${d ? "L" : "M"}${px(Y)} ${py(Math.max(0, Math.min(700, top(Y))))} `;
    for (let Y = MH; Y >= 0; Y -= 20) d += `L${px(Y)} ${py(Math.max(0, Math.min(700, bot(Y))))} `;
    return d + "Z";
  });

  const apparent = dip; // section ⟂ strike → true dip

  return (
    <SimFrame
      title="Build the cross-section"
      subtitle="From structure contours to a section along PQ"
      controls={
        <>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className="rounded-full border border-line p-2" aria-label="Previous step"><ChevronLeft size={16} /></button>
            <button type="button" onClick={() => { setStep(0); setPlaying(true); }} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-moss px-3 py-2 text-sm font-semibold text-night">
              {playing ? <Pause size={15} /> : <Play size={15} />} Construct
            </button>
            <button type="button" onClick={() => setStep((s) => Math.min(4, s + 1))} className="rounded-full border border-line p-2" aria-label="Next step"><ChevronRight size={16} /></button>
          </div>
          <ol className="space-y-1.5 text-sm">
            {STEPS.map((t, i) => (
              <li key={t} className={cn("rounded-lg px-2 py-1", i === step ? "bg-moss/25 text-ink" : i < step ? "text-ink/70" : "text-muted/60")}>
                <b>{i + 1}.</b> {t}
              </li>
            ))}
          </ol>
          <Slider label="Dip of the contacts" value={dip} min={8} max={45} onChange={setDip} format={(v) => `${v}° N`} />
          <Slider label="Section line position" value={x0} min={40} max={760} step={10} onChange={setX0} format={(v) => `${v} m E`} />
        </>
      }
      readouts={
        <>
          <Readout label="Structure-contour spacing" value={`${(100 / tan).toFixed(0)} m`} accent />
          <Readout label="Dip from section" value={`${apparent}° N`} />
          <Readout label="Units cut" value={UNITS.filter((_, u) => prof.some(([Y, h]) => unitAt(x0, Y) === u && h > 0)).join(", ")} />
        </>
      }
    >
      <svg viewBox="0 0 900 520" className="block h-full w-full" role="img" aria-label="Geological map with structure contours and the constructed cross-section along PQ">
        <rect width="900" height="520" fill="#0d130f" />
        {/* MAP */}
        <text x="20" y="28" className="font-display" fontSize="16" fill="#eef1ea">MAP</text>
        <text x={mx(MW) - 4} y="28" textAnchor="end" fontSize="12" fill="#e8dcc4">N ↑</text>
        {map.cells.map((c) => (
          <rect key={`${c.x}-${c.y}`} x={mx(c.x)} y={my(c.y)} width={CELL * MS + 0.4} height={CELL * MS + 0.4} fill={unitColor(c.u)} opacity="0.85" />
        ))}
        {map.topoLines.map((t) =>
          t.segs.map((s, i) => <line key={`${t.lev}-${i}`} x1={mx(s[0])} y1={my(s[1])} x2={mx(s[2])} y2={my(s[3])} stroke="#0b0f0c" strokeWidth={t.lev % 500 === 0 ? 1.6 : 0.9} />),
        )}
        {structureLines.map((l) => (
          <g key={`${l.k}-${l.e}`}>
            <line x1={mx(0)} x2={mx(MW)} y1={my(l.Y)} y2={my(l.Y)} stroke="#2f6bd8" strokeWidth="1" strokeDasharray="4 3" opacity="0.8" />
            {l.e % 200 === 0 && (
              <text x={mx(MW) + 3} y={my(l.Y) + 3} fontSize="8" fill="#8fb4ff">{CONTACTS[l.k].name} {l.e}</text>
            )}
          </g>
        ))}
        {/* section line */}
        <line x1={mx(x0)} x2={mx(x0)} y1={my(0)} y2={my(MH)} stroke="#fff" strokeWidth="2.5" />
        <text x={mx(x0)} y={my(0) - 6} textAnchor="middle" className="font-display" fontSize="14" fill="#fff">P</text>
        <text x={mx(x0)} y={my(MH) + 16} textAnchor="middle" className="font-display" fontSize="14" fill="#fff">Q</text>
        {step >= 1 && topoPts.map(([Y], i) => <circle key={i} cx={mx(x0)} cy={my(Y)} r="2.6" fill="#ffd27a" />)}
        {step >= 3 && structureLines.map((l) => <circle key={`s${l.k}${l.e}`} cx={mx(x0)} cy={my(l.Y)} r="2.6" fill="#8fb4ff" />)}

        {/* PROFILE */}
        <text x={PX0} y="40" className="font-display" fontSize="16" fill="#eef1ea">SECTION ALONG PQ</text>
        <rect x={PX0} y={PY0} width={PW} height={PH} fill="#121a14" stroke="#ffffff22" />
        {[0, 100, 200, 300, 400, 500, 600, 700].map((e) => (
          <g key={e}>
            <line x1={PX0} x2={PX0 + PW} y1={py(e)} y2={py(e)} stroke="#ffffff10" />
            <text x={PX0 - 6} y={py(e) + 4} textAnchor="end" fontSize="10" fill="#9aa69c">{e}</text>
          </g>
        ))}
        <text x={PX0 - 30} y={PY0 - 8} fontSize="10" fill="#9aa69c">m</text>
        <text x={PX0} y={PY0 + PH + 18} fontSize="12" fill="#fff">P (N)</text>
        <text x={PX0 + PW} y={PY0 + PH + 18} textAnchor="end" fontSize="12" fill="#fff">Q (S)</text>
        <defs>
          <clipPath id="csb-ground"><path d={`${profPath} L ${px(MH)} ${py(0)} L ${px(0)} ${py(0)} Z`} /></clipPath>
          <clipPath id="csb-frame"><rect x={PX0} y={PY0} width={PW} height={PH} /></clipPath>
        </defs>
        {step >= 4 && (
          <g clipPath="url(#csb-ground)">
            {unitPolys.map((d, u) => <path key={u} d={d} fill={unitColor(u)} opacity="0.9" />)}
          </g>
        )}
        {step >= 4 &&
          CONTACTS.map((_, k) => (
            <g key={k} clipPath="url(#csb-frame)">
              <line x1={px(0)} y1={py(zc(k, 0))} x2={px(MH)} y2={py(zc(k, MH))} stroke="#fff" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.6" />
            </g>
          ))}
        {step >= 4 &&
          UNITS.map((u, i) => {
            // put the label where this unit is thickest below the ground surface
            let best = { Y: 0, top: 0, bot: 0, h: 0 };
            for (let Y = 30; Y <= MH - 30; Y += 15) {
              const g = topo(x0, Y);
              const top = Math.min(g, i === 0 ? 700 : zc(i - 1, Y));
              const bot = Math.max(0, i === CONTACTS.length ? 0 : zc(i, Y));
              if (top - bot > best.h) best = { Y, top, bot, h: top - bot };
            }
            return best.h > 25 ? (
              <text key={u} x={px(best.Y)} y={py((best.top + best.bot) / 2) + 6} textAnchor="middle" className="font-display" fontSize="18" fill="#0b0f0c">{u}</text>
            ) : null;
          })}
        {step >= 2 && <path d={profPath} fill="none" stroke="#ffd27a" strokeWidth="2.5" />}
        {step >= 1 && topoPts.map(([Y, e], i) => <circle key={i} cx={px(Y)} cy={py(e)} r="3.5" fill="#ffd27a" />)}
        {step >= 3 &&
          structureLines.map((l) => (
            <g key={`p${l.k}${l.e}`}>
              <circle cx={px(l.Y)} cy={py(l.e)} r="3.5" fill="#8fb4ff" />
              {step === 3 && <text x={px(l.Y) + 5} y={py(l.e) - 4} fontSize="9" fill="#8fb4ff">{CONTACTS[l.k].name} {l.e}</text>}
            </g>
          ))}
        <text x="20" y={my(MH) + 40} fontSize="11" fill="#9aa69c">— topographic contours (100 m)   - - structure contours of each contact</text>
      </svg>
      <Verdict>{`Step ${step + 1} / 5`}</Verdict>
    </SimFrame>
  );
}

export default CrossSectionBuilder;
