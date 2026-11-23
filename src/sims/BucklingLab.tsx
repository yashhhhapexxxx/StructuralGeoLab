import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Readout, SimFrame, Slider, Verdict } from "@/components/sim-ui";
import { biotWavelength } from "@/geo/folds";

const W = 800;
const H = 420;
const MID = 210;
const PX = 3; // screen pixels per model unit of thickness

/**
 * Sim 5.1 — Buckling lab (Fossen "Folding" e-module). A competent layer in a weaker
 * matrix is shortened. Its dominant wavelength follows Biot (1961):
 *   Ld / h = 2π (μL / 6μM)^(1/3)
 * With little competence contrast the layer thickens instead of buckling.
 */
export function BucklingLab() {
  const [h, setH] = useState(6); // layer thickness (model units)
  const [logR, setLogR] = useState(2); // log10 viscosity ratio μL/μM
  const [short, setShort] = useState(30); // % shortening
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let dir = 1;
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setShort((s) => {
        let n = s + dir * dt * 18;
        if (n >= 55) { n = 55; dir = -1; }
        if (n <= 0) { n = 0; dir = 1; }
        return n;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const R = Math.pow(10, logR);
  const e = short / 100;
  const sim = useMemo(() => {
    const Ld = biotWavelength(h, R); // model units
    // Share of shortening taken up by buckling vs layer-parallel thickening.
    const f = Math.min(1, Math.max(0, (logR - 0.6) / 0.9)); // ~R<4 thickens, R>30 buckles
    const eThick = e * (1 - f);
    const eBuck = e * f;
    const thick = (h * PX) / (1 - eThick); // area conservation
    const lam0 = Ld * PX * (1 / (1 - eThick)) ** 0; // initial dominant wavelength on screen
    const lam = Math.max(12, lam0 * (1 - eBuck));
    // Arc length conserved: λ0 ≈ λ(1 + (πa/λ)²)  ⇒  a = (λ/π)·sqrt(λ0/λ − 1)
    const a = eBuck > 0 ? (lam / Math.PI) * Math.sqrt(Math.max(0, lam0 / lam - 1)) : 0;
    return { Ld, f, thick, lam, a };
  }, [h, R, logR, e]);

  // Matrix length shrinks with shortening; layer drawn across the shortened box.
  const boxW = W * (1 - e * 0.55);
  const x0 = (W - boxW) / 2;
  const centre = (x: number) => MID - sim.a * Math.sin((2 * Math.PI * (x - x0)) / sim.lam);
  const path = useMemo(() => {
    let top = "";
    let bot = "";
    for (let x = x0; x <= x0 + boxW; x += 3) {
      const y = centre(x);
      const dy = (-sim.a * 2 * Math.PI * Math.cos((2 * Math.PI * (x - x0)) / sim.lam)) / sim.lam;
      const n = Math.hypot(1, dy);
      const nx = dy / n;
      const ny = -1 / n;
      top += `${top ? "L" : "M"}${(x + (nx * sim.thick) / 2).toFixed(1)} ${(y + (ny * sim.thick) / 2).toFixed(1)} `;
      bot = `L${(x - (nx * sim.thick) / 2).toFixed(1)} ${(y - (ny * sim.thick) / 2).toFixed(1)} ` + bot;
    }
    return top + bot + "Z";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, x0, boxW]);

  // Matrix marker lines: folding dies out away from the layer (contact strain zone).
  const markers = useMemo(() => {
    const out: string[] = [];
    for (const off of [-150, -110, -75, 75, 110, 150]) {
      const decay = Math.exp(-Math.abs(off) / (sim.lam * 0.45));
      let d = "";
      for (let x = x0; x <= x0 + boxW; x += 6) {
        const y = MID + off - sim.a * decay * Math.sin((2 * Math.PI * (x - x0)) / sim.lam);
        d += `${d ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      out.push(d);
    }
    return out;
  }, [sim, x0, boxW]);

  const regime = sim.f < 0.15 ? "Thickening (no buckling)" : sim.f < 0.85 ? "Thickening, then buckling" : "Buckling";

  return (
    <SimFrame
      title="Buckling lab"
      subtitle="Biot: Ld / h = 2π (μL / 6μM)^⅓"
      controls={
        <>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night"
          >
            {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Animate shortening"}
          </button>
          <Slider label="Shortening" value={Math.round(short)} min={0} max={55} onChange={(v) => { setPlaying(false); setShort(v); }} format={(v) => `${v}%`} />
          <Slider label="Layer thickness h" value={h} min={3} max={14} step={0.5} onChange={setH} />
          <Slider
            label="Competence contrast μL/μM"
            value={logR}
            min={0}
            max={3}
            step={0.05}
            onChange={setLogR}
            format={(v) => `${Math.round(Math.pow(10, v))}×`}
            hint="How much stiffer (more viscous) the layer is than its matrix"
          />
        </>
      }
      readouts={
        <>
          <Readout label="Behaviour" value={regime} accent />
          <Readout label="Dominant wavelength Ld" value={`${sim.Ld.toFixed(0)} units`} />
          <Readout label="Ld / h" value={(sim.Ld / h).toFixed(1)} />
          <Readout label="Thickening share" value={`${Math.round((1 - sim.f) * 100)}%`} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`Layer under ${short.toFixed(0)}% shortening: ${regime}`}>
        <rect x={x0} y="40" width={boxW} height={H - 80} fill="#3a4337" rx="6" />
        {markers.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#a7b48f" strokeOpacity="0.35" strokeWidth="1.5" />
        ))}
        <path d={path} fill="#5b3a26" stroke="#2a190f" strokeWidth="1.5" />
        {/* shortening arrows */}
        <g fill="#c8703f">
          <path d={`M ${x0 - 46} ${MID - 14} L ${x0 - 12} ${MID} L ${x0 - 46} ${MID + 14} Z`} />
          <path d={`M ${x0 + boxW + 46} ${MID - 14} L ${x0 + boxW + 12} ${MID} L ${x0 + boxW + 46} ${MID + 14} Z`} />
        </g>
        <text x={W / 2} y={H - 14} textAnchor="middle" fontSize="15" fill="#eef1ea" opacity="0.8">
          competent layer (brown) in a weaker matrix (grey) · {Math.round(short)}% layer-parallel shortening
        </text>
      </svg>
      <Verdict tone={sim.f < 0.15 ? "sand" : "moss"}>{regime}</Verdict>
    </SimFrame>
  );
}

export default BucklingLab;
