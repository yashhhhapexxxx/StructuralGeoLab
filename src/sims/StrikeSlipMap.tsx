import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Readout, SimFrame, Slider, Verdict } from "@/components/sim-ui";
import { strikeSlipSense } from "@/geo/faults";

const W = 800;
const H = 420;
const FX = 400;

/**
 * Sim 6.3 — Strike-slip faults in map view. A river, a road and a fence cross the fault;
 * slide the far block to see dextral (right-lateral) vs sinistral (left-lateral) offset.
 * Rule: stand on one block facing the fault — if the other block moved to your right, it's dextral.
 */
export function StrikeSlipMap() {
  const [offset, setOffset] = useState(70);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      setOffset(Math.round(Math.sin((now - t0) / 1300) * 110));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const sense = strikeSlipSense(offset);
  // Fault runs N–S. Standing on the west block facing east, your right hand points SOUTH.
  // So the east block moving south (screen down) = to the observer's right = dextral.
  // Positive offset ⇒ east block shifts south ⇒ right-lateral.
  const eastShift = offset;

  const river = (shift: number, side: "w" | "e") => {
    const xs = side === "w" ? [0, FX] : [FX, W];
    let d = "";
    for (let x = xs[0]; x <= xs[1]; x += 10) {
      const y = 210 + 26 * Math.sin(x / 70) + (side === "e" ? shift : 0);
      d += `${d ? "L" : "M"}${x} ${y.toFixed(1)} `;
    }
    return d;
  };

  return (
    <SimFrame
      title="Strike-slip in map view"
      subtitle="Dextral or sinistral? Look across the fault"
      controls={
        <>
          <button type="button" onClick={() => setPlaying((p) => !p)} className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night">
            {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Animate"}
          </button>
          <Slider
            label="Offset of the east block"
            value={offset}
            min={-130}
            max={130}
            onChange={(v) => {
              setPlaying(false);
              setOffset(v);
            }}
            format={(v) => (v === 0 ? "0" : `${Math.abs(v) * 5} m ${v > 0 ? "south" : "north"}`)}
          />
          <p className="text-sm text-muted">
            Stand on either side and look across the fault. If the features on the other side moved to your <b className="text-ink">right</b>, the fault is dextral (right-lateral); to your left, sinistral.
          </p>
        </>
      }
      readouts={
        <>
          <Readout label="Sense of slip" value={sense === "none" ? "—" : sense} accent />
          <Readout label="Also called" value={sense === "dextral" ? "right-lateral" : sense === "sinistral" ? "left-lateral" : "—"} />
          <Readout label="Strike separation" value={`${Math.abs(offset) * 5} m`} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`Map view of a ${sense} strike-slip fault`}>
        <rect width={W} height={H} fill="#24321f" />
        {/* fields texture */}
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={0} x2={W} y1={i * 32} y2={i * 32} stroke="#2e3e27" strokeWidth="14" />
        ))}
        <g transform={`translate(0 ${eastShift})`}>
          <rect x={FX} y={-200} width={W - FX} height={H + 400} fill="#2a3a23" opacity="0.6" />
        </g>
        {/* road */}
        <line x1="0" x2={FX} y1="110" y2="110" stroke="#d9d2bf" strokeWidth="14" />
        <line x1={FX} x2={W} y1={110 + eastShift} y2={110 + eastShift} stroke="#d9d2bf" strokeWidth="14" />
        <line x1="0" x2={FX} y1="110" y2="110" stroke="#8b8571" strokeWidth="2" strokeDasharray="14 10" />
        <line x1={FX} x2={W} y1={110 + eastShift} y2={110 + eastShift} stroke="#8b8571" strokeWidth="2" strokeDasharray="14 10" />
        {/* river */}
        <path d={river(0, "w")} fill="none" stroke="#5aa7c7" strokeWidth="12" strokeLinecap="round" />
        <path d={river(eastShift, "e")} fill="none" stroke="#5aa7c7" strokeWidth="12" strokeLinecap="round" />
        {/* fence */}
        <line x1="0" x2={FX} y1="320" y2="320" stroke="#c8703f" strokeWidth="4" strokeDasharray="2 8" />
        <line x1={FX} x2={W} y1={320 + eastShift} y2={320 + eastShift} stroke="#c8703f" strokeWidth="4" strokeDasharray="2 8" />
        {/* fault */}
        <line x1={FX} x2={FX} y1="0" y2={H} stroke="#fff" strokeWidth="4" />
        {sense !== "none" && (
          <g fill="#fff">
            {/* half-arrows */}
            <path d={`M ${FX - 22} ${H / 2 + 50 * (offset > 0 ? 1 : -1)} l 0 ${-100 * (offset > 0 ? 1 : -1)} l -10 ${14 * (offset > 0 ? 1 : -1)} Z`} />
            <path d={`M ${FX + 22} ${H / 2 - 50 * (offset > 0 ? 1 : -1)} l 0 ${100 * (offset > 0 ? 1 : -1)} l 10 ${-14 * (offset > 0 ? 1 : -1)} Z`} />
          </g>
        )}
        <text x={W - 24} y={34} textAnchor="end" className="font-display" fontSize="22" fill="#fff">
          N ↑
        </text>
      </svg>
      <Verdict tone={sense === "dextral" ? "moss" : sense === "sinistral" ? "clay" : "sand"}>{sense === "none" ? "No offset" : `${sense} strike-slip`}</Verdict>
    </SimFrame>
  );
}

export default StrikeSlipMap;
