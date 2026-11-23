import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Readout, SimFrame, Slider, Verdict } from "@/components/sim-ui";

const W = 800;
const H = 460;
const MAP_Y = 150; // y of the fault traces in map view
const GRAPH_Y0 = 410; // baseline of the displacement graph
const GAMMA = 0.06; // Dmax / L for an ideal isolated fault

/**
 * Sim — Fault growth, overlap and linkage (Fossen "Faults" e-module §Fault segmentation).
 * Two synthetic segments grow (displacement ∝ length, max at the centre, zero at the tips),
 * overlap in a relay zone (soft-linked), the relay ramp is breached (hard-linked), and the
 * displacement profile evolves toward that of one larger fault.
 */
export function FaultGrowth() {
  const [time, setTime] = useState(55); // 0–100
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      setTime(Math.min(100, ((now - t0) / 9000) * 100));
      if ((now - t0) / 9000 < 1) raf.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  // Segment geometry: centres fixed, half-lengths grow, offset across strike by `sep`.
  const t = time / 100;
  const c1 = 280;
  const c2 = 520;
  const sep = 34;
  const half = 40 + 190 * Math.min(1, t / 0.75);
  const overlap = Math.max(0, c1 + half - (c2 - half));
  const stage = t < 0.36 ? "isolated" : t < 0.62 ? "soft" : t < 0.8 ? "breaching" : "hard";
  const link = stage === "breaching" ? (t - 0.62) / 0.18 : stage === "hard" ? 1 : 0;

  // Displacement profiles (px on the graph; elliptical: D = Dmax √(1 − (x/L)²)).
  const prof = (c: number, L: number, x: number) => {
    const u = (x - c) / L;
    return Math.abs(u) >= 1 ? 0 : GAMMA * 2 * L * Math.sqrt(1 - u * u);
  };
  const combinedL = (c2 + half - (c1 - half)) / 2;
  const combinedC = (c1 + c2) / 2;
  const total = (x: number) => {
    const sum = prof(c1, half, x) + prof(c2, half, x);
    if (link === 0) return sum;
    // after linkage the relay "deficit" is made up: blend toward one fault's profile
    const one = prof(combinedC, combinedL, x) * 0.85;
    return sum + link * Math.max(0, one - sum);
  };
  const graph = (f: (x: number) => number) => {
    let d = "";
    for (let x = 40; x <= W - 40; x += 4) d += `${d ? "L" : "M"}${x} ${(GRAPH_Y0 - f(x) * 3.2).toFixed(1)} `;
    return d;
  };

  // map traces with hanging-wall ticks
  const trace = (c: number, y: number) => ({ x1: c - half, x2: c + half, y });
  const s1 = trace(c1, MAP_Y - sep / 2);
  const s2 = trace(c2, MAP_Y + sep / 2);
  const ticks = (s: { x1: number; x2: number; y: number }) =>
    Array.from({ length: Math.floor((s.x2 - s.x1) / 26) }, (_, i) => s.x1 + 13 + i * 26).map((x) => <line key={x} x1={x} x2={x} y1={s.y} y2={s.y + 9} stroke="#fff" strokeWidth="2" />);

  const LABEL = {
    isolated: "Isolated faults",
    soft: "Overlap · relay ramp (soft-linked)",
    breaching: "Relay ramp breaching",
    hard: "Hard-linked · one segmented fault",
  }[stage];

  return (
    <SimFrame
      title="Fault growth & linkage"
      subtitle="Grow, overlap, breach — watch the displacement profile"
      controls={
        <>
          <button type="button" onClick={() => { setTime(0); setPlaying(true); }} className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night">
            {playing ? <Pause size={15} /> : <Play size={15} />} Play the fault's life
          </button>
          <Slider label="Time" value={Math.round(time)} min={0} max={100} onChange={(v) => { setPlaying(false); setTime(v); }} format={(v) => `${v}%`} />
          <ol className="space-y-1 text-sm">
            {(["isolated", "soft", "breaching", "hard"] as const).map((s, i) => (
              <li key={s} className={stage === s ? "rounded-lg bg-moss/25 px-2 py-1 text-ink" : "px-2 py-1 text-muted"}>
                <b>{i + 1}.</b> {{ isolated: "Isolated: displacement max at the centre, zero at the tips.", soft: "Tips overlap: a relay ramp transfers displacement — soft linkage.", breaching: "Stress interaction: a breaching fault cuts the ramp.", hard: "Hard-linked: one longer fault; the profile catches up." }[s]}
              </li>
            ))}
          </ol>
        </>
      }
      readouts={
        <>
          <Readout label="Stage" value={LABEL} accent />
          <Readout label="Segment length" value={`${Math.round(2 * half * 10)} m`} />
          <Readout label="Overlap" value={overlap > 0 ? `${Math.round(overlap * 10)} m` : "—"} />
          <Readout label="Max displacement" value={`${Math.round(Math.max(...Array.from({ length: 180 }, (_, i) => total(40 + i * 4))) * 10)} m`} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`Two fault segments: ${LABEL}`}>
        <rect width={W} height={H} fill="#0d130f" />
        <text x="20" y="30" className="font-display" fontSize="16" fill="#eef1ea">MAP VIEW</text>
        <rect x="20" y="45" width={W - 40} height="210" rx="10" fill="#1c271f" />
        {/* relay ramp shading */}
        {overlap > 0 && (
          <path
            d={`M ${c2 - half} ${s1.y} L ${c1 + half} ${s1.y} L ${c1 + half} ${s2.y} L ${c2 - half} ${s2.y} Z`}
            fill={stage === "hard" ? "#c8703f" : "#e3c78a"}
            fillOpacity={0.35}
          />
        )}
        {overlap > 0 && (
          <text x={(c1 + c2) / 2} y={s1.y - 14} textAnchor="middle" fontSize="13" fill="#e3c78a">relay ramp</text>
        )}
        <line x1={s1.x1} x2={s1.x2} y1={s1.y} y2={s1.y} stroke="#fff" strokeWidth="3.5" />
        <line x1={s2.x1} x2={s2.x2} y1={s2.y} y2={s2.y} stroke="#fff" strokeWidth="3.5" />
        {ticks(s1)}
        {ticks(s2)}
        {link > 0 && (
          <line
            x1={(c1 + c2) / 2 - 8}
            y1={s1.y}
            x2={(c1 + c2) / 2 - 8 + 16 * link}
            y2={s1.y + sep * link}
            stroke="#ff3b30"
            strokeWidth="3.5"
          />
        )}
        <text x="34" y="240" fontSize="12" fill="#9aa69c">ticks on the hanging-wall (down-thrown) side · both faults dip the same way (synthetic)</text>

        <text x="20" y="290" className="font-display" fontSize="16" fill="#eef1ea">DISPLACEMENT ALONG STRIKE</text>
        <line x1="40" x2={W - 40} y1={GRAPH_Y0} y2={GRAPH_Y0} stroke="#ffffff33" />
        <path d={graph((x) => prof(c1, half, x))} fill="none" stroke="#9aa69c" strokeDasharray="5 5" />
        <path d={graph((x) => prof(c2, half, x))} fill="none" stroke="#9aa69c" strokeDasharray="5 5" />
        <path d={`${graph(total)} L ${W - 40} ${GRAPH_Y0} L 40 ${GRAPH_Y0} Z`} fill="#b5d98a" fillOpacity="0.18" stroke="#b5d98a" strokeWidth="2.5" />
        <text x={W - 44} y={GRAPH_Y0 + 18} textAnchor="end" fontSize="12" fill="#9aa69c">grey dashed: each segment · green: total displacement</text>
      </svg>
      <Verdict tone={stage === "hard" ? "clay" : stage === "isolated" ? "sand" : "moss"}>{LABEL}</Verdict>
    </SimFrame>
  );
}

export default FaultGrowth;
