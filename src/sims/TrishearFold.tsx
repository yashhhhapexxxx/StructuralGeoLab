import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Readout, SimFrame, Slider, Verdict } from "@/components/sim-ui";
import { BED_COLORS } from "@/geo/beds";

const W = 800;
const H = 430;
const TIP0 = { x: 250, y: 380 }; // initial fault tip (screen)
const BED_T = 34;
const N_BEDS = 8;
const STEPS = 70;

/**
 * Sim — Trishear fault-propagation fold (Erslev 1991; Zehnder & Allmendinger 2000), as in the
 * Fossen "Faults" e-module (FaultFold). A reverse fault propagates upward; ahead of its tip a
 * triangular zone of distributed shear folds the layers before the fault cuts them.
 *
 * Fault-parallel frame (ξ along the fault, η perpendicular, tip at the origin), m = tan(φ/2):
 *   hanging wall (η ≥ m ξ):  v = (v0, 0)
 *   footwall    (η ≤ −m ξ): v = 0
 *   inside the triangle:      vξ = v0/2 (η/(mξ) + 1),   vη = v0 m/4 ((η/(mξ))² − 1)
 */
export function TrishearFold() {
  const [slip, setSlip] = useState(90);
  const [ramp, setRamp] = useState(30);
  const [apex, setApex] = useState(60);
  const [ps, setPs] = useState(1.5);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = ((now - t0) / 4500) % 1.15;
      setSlip(Math.round(Math.min(1, p) * 150));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const sim = useMemo(() => {
    const th = (ramp * Math.PI) / 180;
    // fault direction: up-dip toward the right (screen y is down)
    const ux = Math.cos(th);
    const uy = -Math.sin(th);
    const nx = -uy; // perpendicular, pointing to the hanging-wall side (up-left of the fault)
    const ny = ux;
    const m = Math.tan(((apex / 2) * Math.PI) / 180);
    const ds = slip / STEPS;
    const lines: [number, number][][] = [];
    for (let b = 0; b <= N_BEDS; b++) {
      const y = 110 + b * BED_T;
      const row: [number, number][] = [];
      for (let x = -40; x <= W + 40; x += 6) row.push([x, y]);
      lines.push(row);
    }
    let tip = { x: TIP0.x, y: TIP0.y };
    for (let s = 0; s < STEPS; s++) {
      for (const row of lines)
        for (const p of row) {
          const rx = p[0] - tip.x;
          const ry = p[1] - tip.y;
          const xi = rx * ux + ry * uy;
          const eta = -(rx * nx + ry * ny); // positive = hanging-wall side (above the fault)
          let vxi = 0;
          let veta = 0;
          if (xi <= 0) {
            if (eta > 0) vxi = ds;
          } else if (eta >= m * xi) vxi = ds;
          else if (eta > -m * xi) {
            const r = eta / (m * xi);
            vxi = (ds / 2) * (r + 1);
            veta = ((ds * m) / 4) * (r * r - 1);
          }
          p[0] += vxi * ux - veta * nx;
          p[1] += vxi * uy - veta * ny;
        }
      tip = { x: tip.x + ps * ds * ux, y: tip.y + ps * ds * uy };
    }
    return { lines, tip, ux, uy, m, nx, ny };
  }, [slip, ramp, apex, ps]);

  const pathOf = (row: [number, number][]) => row.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const bands = sim.lines.slice(0, -1).map((top, i) => {
    const bot = sim.lines[i + 1];
    return `${pathOf(top)} ${[...bot].reverse().map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")} Z`;
  });
  // fault trace from far behind to the current tip
  const back = { x: TIP0.x - 400 * sim.ux, y: TIP0.y - 400 * sim.uy };
  // trishear triangle (drawn ahead of the tip)
  const L = 260;
  const a = Math.atan(sim.m);
  const dirA = { x: sim.ux * Math.cos(a) - sim.uy * Math.sin(a), y: sim.ux * Math.sin(a) + sim.uy * Math.cos(a) };
  const dirB = { x: sim.ux * Math.cos(-a) - sim.uy * Math.sin(-a), y: sim.ux * Math.sin(-a) + sim.uy * Math.cos(-a) };
  const propagated = Math.hypot(sim.tip.x - TIP0.x, sim.tip.y - TIP0.y);

  return (
    <SimFrame
      title="Trishear fault-propagation fold"
      subtitle="The fold grows ahead of the fault tip"
      controls={
        <>
          <button type="button" onClick={() => setPlaying((p) => !p)} className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night">
            {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Animate"}
          </button>
          <Slider label="Slip" value={slip} min={0} max={150} onChange={(v) => { setPlaying(false); setSlip(v); }} format={(v) => `${v * 5} m`} />
          <Slider label="Ramp angle (fault dip)" value={ramp} min={15} max={60} onChange={setRamp} format={(v) => `${v}°`} />
          <Slider label="Trishear apex angle" value={apex} min={20} max={100} onChange={setApex} format={(v) => `${v}°`} />
          <Slider label="Propagation / slip (P/S)" value={ps} min={0} max={3} step={0.1} onChange={setPs} format={(v) => v.toFixed(1)} />
          <p className="text-sm text-muted">Small P/S: the tip lingers and a tight fold builds up. Large P/S: the fault races ahead and the fold stays gentle. Note how drag appears before the beds are cut.</p>
        </>
      }
      readouts={
        <>
          <Readout label="Fault tip advanced" value={`${Math.round(propagated * 5)} m`} accent />
          <Readout label="Ramp / apex" value={`${ramp}° / ${apex}°`} />
          <Readout label="P/S" value={ps.toFixed(1)} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label="Trishear fault-propagation fold">
        <rect width={W} height={H} fill="#0d130f" />
        {bands.map((d, i) => <path key={i} d={d} fill={BED_COLORS[i % BED_COLORS.length]} stroke="#0b0f0c" strokeOpacity="0.4" />)}
        <path d={`M ${sim.tip.x} ${sim.tip.y} L ${sim.tip.x + dirA.x * L} ${sim.tip.y + dirA.y * L} L ${sim.tip.x + dirB.x * L} ${sim.tip.y + dirB.y * L} Z`} fill="#ffffff" fillOpacity="0.07" stroke="#fff" strokeOpacity="0.45" strokeDasharray="6 6" />
        <line x1={back.x} y1={back.y} x2={sim.tip.x} y2={sim.tip.y} stroke="#fff" strokeWidth="3" />
        <circle cx={sim.tip.x} cy={sim.tip.y} r="6" fill="#ff3b30" />
        <text x={sim.tip.x + 10} y={sim.tip.y + 22} fontSize="13" fill="#ffb3ad">fault tip</text>
        <text x={sim.tip.x + dirA.x * L * 0.7} y={sim.tip.y + dirA.y * L * 0.7 - 10} fontSize="13" fill="#fff" opacity="0.7">trishear zone</text>
      </svg>
      <Verdict tone="clay">{slip < 5 ? "Before faulting" : "Fault-propagation fold"}</Verdict>
    </SimFrame>
  );
}

export default TrishearFold;
