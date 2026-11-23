import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Readout, SimFrame, Slider, Toggle, Verdict } from "@/components/sim-ui";
import { BED_COLORS } from "@/geo/beds";

const W = 800;
const H = 420;
const TOP = 70;
const BED_T = 42;
const N = 7;
const FX0 = 360; // fault at the surface
const DIP = 60;

type Mode = "none" | "normal" | "reverse";

/**
 * Sim — Fault drag (Fossen "Faults" e-module). Marker beds bend near a normal fault:
 * normal drag (beds curve against the slip direction — up in the hanging wall, down in the
 * footwall) or reverse drag (hanging-wall beds roll over toward the fault: a rollover anticline).
 */
export function FaultDrag() {
  const [mode, setMode] = useState<Mode>("normal");
  const [throwPx, setThrow] = useState(70);
  const [width, setWidth] = useState(110);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      setThrow(Math.round(90 * (0.5 - 0.5 * Math.cos((now - t0) / 1100))));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const t = Math.tan((DIP * Math.PI) / 180);
  const fx = (y: number) => FX0 + (y - TOP) / t;
  const k = mode === "none" ? 0 : 0.42;

  // vertical offset of a bed at horizontal distance `dist` from the fault
  const hwDy = (dist: number) => {
    const e = Math.exp(-dist / width);
    if (mode === "normal") return throwPx * (1 - k * e);
    if (mode === "reverse") return throwPx * (1 + k * e);
    return throwPx;
  };
  const fwDy = (dist: number) => (mode === "normal" ? throwPx * k * 0.6 * Math.exp(-dist / width) : 0);

  const beds = useMemo(() => {
    const out: { fw: string; hw: string; color: string }[] = [];
    for (let b = 0; b < N; b++) {
      const y0 = TOP + b * BED_T;
      const y1 = y0 + BED_T;
      let fwTop = "";
      let fwBot = "";
      let hwTop = "";
      let hwBot = "";
      for (let x = -20; x <= W + 20; x += 6) {
        const dist = (yy: number) => Math.abs(x - fx(yy));
        fwTop += `${fwTop ? "L" : "M"}${x} ${(y0 + fwDy(dist(y0))).toFixed(1)} `;
        fwBot = `L${x} ${(y1 + fwDy(dist(y1))).toFixed(1)} ` + fwBot;
        hwTop += `${hwTop ? "L" : "M"}${x} ${(y0 + hwDy(dist(y0 + throwPx))).toFixed(1)} `;
        hwBot = `L${x} ${(y1 + hwDy(dist(y1 + throwPx))).toFixed(1)} ` + hwBot;
      }
      out.push({ fw: fwTop + fwBot + "Z", hw: hwTop + hwBot + "Z", color: BED_COLORS[b % BED_COLORS.length] });
    }
    return out;
  }, [mode, throwPx, width]); // eslint-disable-line react-hooks/exhaustive-deps

  const fwClip = `M -50 -50 L ${fx(-50)} -50 L ${fx(H + 50)} ${H + 50} L -50 ${H + 50} Z`;
  const hwClip = `M ${fx(-50)} -50 L ${W + 50} -50 L ${W + 50} ${H + 50} L ${fx(H + 50)} ${H + 50} Z`;
  const label = mode === "none" ? "No drag" : mode === "normal" ? "Normal drag" : "Reverse drag · rollover";

  return (
    <SimFrame
      title="Fault drag"
      subtitle="Beds bend as the fault slips"
      controls={
        <>
          <Toggle label="Drag type" value={mode} onChange={setMode} options={[{ value: "none", label: "None" }, { value: "normal", label: "Normal drag" }, { value: "reverse", label: "Reverse drag" }]} />
          <button type="button" onClick={() => setPlaying((p) => !p)} className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night">
            {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Animate slip"}
          </button>
          <Slider label="Throw" value={throwPx} min={0} max={100} onChange={(v) => { setPlaying(false); setThrow(v); }} format={(v) => `${v * 2} m`} />
          <Slider label="Drag-zone width" value={width} min={40} max={220} onChange={setWidth} format={(v) => `${v * 2} m`} />
          <p className="text-sm text-muted">
            {mode === "reverse"
              ? "Reverse drag: hanging-wall beds bend down toward the fault, typical above listric normal faults — the fold is a rollover anticline."
              : "Normal drag: beds curve against the slip — up in the hanging wall, down in the footwall. Usually formed by fault-propagation folding before the fault cut through."}
          </p>
        </>
      }
      readouts={
        <>
          <Readout label="Drag" value={label} accent />
          <Readout label="Far-field throw" value={`${throwPx * 2} m`} />
          <Readout label="Throw at the fault" value={`${Math.round((hwDy(0) - fwDy(0)) * 2)} m`} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`Normal fault with ${label}`}>
        <rect width={W} height={H} fill="#0d130f" />
        <defs>
          <clipPath id="fd-fw"><path d={fwClip} /></clipPath>
          <clipPath id="fd-hw"><path d={hwClip} /></clipPath>
        </defs>
        <g clipPath="url(#fd-fw)">{beds.map((b, i) => <path key={i} d={b.fw} fill={b.color} stroke="#0b0f0c" strokeOpacity="0.4" />)}</g>
        <g clipPath="url(#fd-hw)">{beds.map((b, i) => <path key={i} d={b.hw} fill={b.color} stroke="#0b0f0c" strokeOpacity="0.4" />)}</g>
        <line x1={fx(0)} y1={0} x2={fx(H)} y2={H} stroke="#fff" strokeWidth="3" />
        <g className="font-display" fontSize="18" fill="#fff" opacity="0.85">
          <text x="40" y="40">FOOTWALL</text>
          <text x={W - 40} y="40" textAnchor="end">HANGING WALL</text>
        </g>
      </svg>
      <Verdict tone={mode === "reverse" ? "clay" : "moss"}>{label}</Verdict>
    </SimFrame>
  );
}

export default FaultDrag;
