import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Readout, SimFrame, Slider, Toggle, Verdict } from "@/components/sim-ui";
import { apply, deformation, strainEllipse } from "@/geo/strain";

const W = 800;
const H = 420;
const CX = 400;
const CY = 210;
const R0 = 90;

/**
 * Sim 2.1 — Strain ellipse. Apply pure shear and/or simple shear to a circle of fossils
 * (and a square grid) and watch the circle become the strain ellipse.
 */
export function StrainEllipse() {
  const [k, setK] = useState(1);
  const [gamma, setGamma] = useState(0.8);
  const [mode, setMode] = useState<"both" | "pure" | "simple">("both");
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      if (mode !== "pure") setGamma(Math.round(Math.sin(t * 0.9) * 150) / 100);
      if (mode !== "simple") setK(Math.round((1 + 0.6 * Math.sin(t * 0.7)) * 100) / 100);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, mode]);

  const kk = mode === "simple" ? 1 : k;
  const gg = mode === "pure" ? 0 : gamma;
  const F = deformation(kk, gg);
  const e = strainEllipse(F);

  const grid = useMemo(() => {
    const lines: string[] = [];
    for (let i = -4; i <= 4; i++) {
      const a = apply(F, i * 40, -160);
      const b = apply(F, i * 40, 160);
      const c = apply(F, -160, i * 40);
      const d = apply(F, 160, i * 40);
      lines.push(`M${CX + a[0]} ${CY + a[1]} L${CX + b[0]} ${CY + b[1]}`);
      lines.push(`M${CX + c[0]} ${CY + c[1]} L${CX + d[0]} ${CY + d[1]}`);
    }
    return lines;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kk, gg]);

  const circle = useMemo(() => {
    let d = "";
    for (let t = 0; t <= 360; t += 4) {
      const [x, y] = apply(F, R0 * Math.cos((t * Math.PI) / 180), R0 * Math.sin((t * Math.PI) / 180));
      d += `${d ? "L" : "M"}${(CX + x).toFixed(1)} ${(CY + y).toFixed(1)} `;
    }
    return d + "Z";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kk, gg]);

  const ax = Math.cos((e.angle * Math.PI) / 180);
  const ay = Math.sin((e.angle * Math.PI) / 180);

  return (
    <SimFrame
      title="Strain ellipse"
      subtitle="A circle of fossils records the strain"
      controls={
        <>
          <button type="button" onClick={() => setPlaying((p) => !p)} className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night">
            {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Animate"}
          </button>
          <Toggle label="Deformation" value={mode} onChange={setMode} options={[{ value: "pure", label: "Pure shear" }, { value: "simple", label: "Simple shear" }, { value: "both", label: "Both" }]} />
          {mode !== "simple" && <Slider label="Stretch k (pure shear)" value={k} min={0.5} max={2.2} step={0.01} onChange={(v) => { setPlaying(false); setK(v); }} format={(v) => v.toFixed(2)} />}
          {mode !== "pure" && <Slider label="Shear strain γ (simple shear)" value={gamma} min={-2} max={2} step={0.01} onChange={(v) => { setPlaying(false); setGamma(v); }} format={(v) => v.toFixed(2)} />}
        </>
      }
      readouts={
        <>
          <Readout label="Ellipticity R = X/Y" value={e.R.toFixed(2)} accent />
          <Readout label="X (long axis)" value={e.X.toFixed(2)} />
          <Readout label="Y (short axis)" value={e.Y.toFixed(2)} />
          <Readout label="X orientation" value={`${(-e.angle).toFixed(0)}°`} />
          <Readout label="Area change" value="none (X·Y = 1)" />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`Strain ellipse with ratio ${e.R.toFixed(2)}`}>
        <rect width={W} height={H} fill="#0d130f" />
        <circle cx={CX} cy={CY} r={R0} fill="none" stroke="#fff" strokeOpacity="0.2" strokeDasharray="4 6" />
        {grid.map((d, i) => (
          <path key={i} d={d} stroke="#a7b48f" strokeOpacity="0.35" strokeWidth="1.5" fill="none" />
        ))}
        <path d={circle} fill="#b5d98a" fillOpacity="0.18" stroke="#b5d98a" strokeWidth="3" />
        <line x1={CX - ax * R0 * e.X} y1={CY - ay * R0 * e.X} x2={CX + ax * R0 * e.X} y2={CY + ay * R0 * e.X} stroke="#e8dcc4" strokeWidth="2.5" />
        <line x1={CX + ay * R0 * e.Y} y1={CY - ax * R0 * e.Y} x2={CX - ay * R0 * e.Y} y2={CY + ax * R0 * e.Y} stroke="#c8703f" strokeWidth="2.5" />
        <text x={CX + ax * R0 * e.X + 8} y={CY + ay * R0 * e.X} fontSize="16" fill="#e8dcc4">
          X
        </text>
        <text x={CX - ay * R0 * e.Y + 8} y={CY + ax * R0 * e.Y + 4} fontSize="16" fill="#f0a57c">
          Y
        </text>
        {mode !== "pure" && Math.abs(gg) > 0.01 && (
          <g fill="#fff" opacity="0.7">
            <path d={`M ${CX - 120} 30 l 240 0 l -14 -8 m 14 8 l -14 8`} stroke="#fff" strokeWidth="2" fill="none" transform={gg < 0 ? `rotate(180 ${CX} 30)` : undefined} />
            <path d={`M ${CX + 120} ${H - 30} l -240 0 l 14 -8 m -14 8 l 14 8`} stroke="#fff" strokeWidth="2" fill="none" transform={gg < 0 ? `rotate(180 ${CX} ${H - 30})` : undefined} />
          </g>
        )}
      </svg>
      <Verdict>{`R = ${e.R.toFixed(2)}`}</Verdict>
    </SimFrame>
  );
}

export default StrainEllipse;
