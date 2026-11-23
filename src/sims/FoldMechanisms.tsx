import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Readout, SimFrame, Slider, Toggle, Verdict } from "@/components/sim-ui";
import { strainEllipse, type Mat2 } from "@/geo/strain";

const W = 800;
const H = 440;
const CX = 400;
const CY = 470; // centre of curvature (below the view)
const R1 = 150; // inner arc
const R2 = 380; // outer arc
const RN = (R1 + R2) / 2; // neutral surface (orthogonal flexure)
const SPAN = 62; // degrees either side of the hinge

type Model = "orthogonal" | "flow" | "slip" | "collapse";

const MODELS: Record<Model, { name: string; summary: string[] }> = {
  orthogonal: {
    name: "Orthogonal flexure",
    summary: [
      "Lines perpendicular to layering stay perpendicular.",
      "Outer arc stretches, inner arc shortens; a neutral surface separates them.",
      "Produces parallel (Class 1B) folds — extension veins outside, cleavage inside.",
    ],
  },
  flow: {
    name: "Flexural flow",
    summary: [
      "Distributed layer-parallel shear, like bending a stack of paper.",
      "Zero strain at the hinge, increasing down the limbs.",
      "Constant layer thickness (Class 1B); perpendicular lines do not stay perpendicular.",
    ],
  },
  slip: {
    name: "Flexural slip",
    summary: [
      "Slip on discrete bedding surfaces — like bending a paperback book.",
      "Layers keep their thickness; slip increases away from the hinge.",
      "Leaves slickenlines and bedding-parallel shear on bedding planes.",
    ],
  },
  collapse: {
    name: "Inner-arc collapse",
    summary: [
      "Volume is lost in the inner arc (e.g. by dissolution); the outer arc keeps its length.",
      "No neutral surface — everything is shortened, most strongly in the core.",
      "Look for dissolution seams / cleavage in the core and no veins on the outer arc.",
    ],
  },
};

/**
 * Sim 5.2 — Strain in folded layers (Fossen "Folding" e-module: flexural slip, flexural flow,
 * orthogonal flexure, inner-arc collapse). Circular markers record each model's strain pattern.
 */
export function FoldMechanisms() {
  const [model, setModel] = useState<Model>("orthogonal");
  const [amount, setAmount] = useState(1);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      setAmount((1 - Math.cos((now - t0) / 900)) / 2);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const toXY = (r: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
  };

  const markers = useMemo(() => {
    const out: { x: number; y: number; rx: number; ry: number; rot: number }[] = [];
    const radii = [0, 1, 2, 3, 4].map((i) => R1 + ((i + 0.5) * (R2 - R1)) / 5);
    for (const r of radii) {
      const step = 180 / (Math.PI * r) * 62; // keep spacing roughly even along the arc
      for (let th = -SPAN + step / 2; th <= SPAN - step / 2; th += step) {
        const p = toXY(r, th);
        const m = 13;
        // Local frame: t = tangent (along layer), n = normal (radial)
        let F: Mat2 = [1, 0, 0, 1];
        if (model === "orthogonal") {
          const lt = 1 + amount * (r / RN - 1);
          F = [lt, 0, 0, 1 / lt];
        } else if (model === "collapse") {
          const lt = 1 + amount * (r / R2 - 1);
          F = [lt, 0, 0, 1];
        } else if (model === "flow") {
          const g = amount * ((th * Math.PI) / 180) * 1.6; // zero at hinge, grows down-limb
          F = [1, -g, 0, 1];
        }
        const e = strainEllipse(F);
        // e.angle is in the (t, n) frame; rotate by the local tangent direction.
        out.push({ x: p.x, y: p.y, rx: m * e.X, ry: m * e.Y, rot: th + e.angle });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, amount]);

  const arc = (r: number) => {
    const a = toXY(r, -SPAN - 6);
    const b = toXY(r, SPAN + 6);
    return `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;
  };

  // Lines that started perpendicular to layering
  const perpLines = [-45, -22, 0, 22, 45].map((th) => {
    let d = "";
    for (let r = R1; r <= R2; r += 10) {
      let t = th;
      if (model === "flow") t = th + amount * ((th * Math.PI) / 180) * 1.6 * ((r - RN) / (R2 - R1)) * (180 / Math.PI) * 0.35;
      if (model === "slip") {
        const layer = Math.floor(((r - R1) / (R2 - R1)) * 5);
        t = th + amount * (th / 60) * (layer - 2) * 3.2;
      }
      const p = toXY(r, t);
      d += `${d ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
    }
    return d;
  });

  const info = MODELS[model];

  return (
    <SimFrame
      title="Strain in folded layers"
      subtitle="Four ways to fold a layer — four strain patterns"
      controls={
        <>
          <Toggle
            label="Folding model"
            value={model}
            onChange={setModel}
            options={[
              { value: "orthogonal", label: "Orth. flexure" },
              { value: "flow", label: "Flex. flow" },
              { value: "slip", label: "Flex. slip" },
              { value: "collapse", label: "Inner-arc" },
            ]}
          />
          <button type="button" onClick={() => setPlaying((p) => !p)} className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night">
            {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Animate"}
          </button>
          <Slider label="Amount of folding strain" value={Math.round(amount * 100)} min={0} max={100} onChange={(v) => { setPlaying(false); setAmount(v / 100); }} format={(v) => `${v}%`} />
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {info.summary.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </>
      }
      readouts={
        <>
          <Readout label="Model" value={info.name} accent />
          <Readout label="Neutral surface" value={model === "orthogonal" ? "yes" : model === "collapse" ? "none" : "—"} />
          <Readout label="Hinge strain" value={model === "flow" || model === "slip" ? "zero" : "maximum"} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`${info.name}: strain markers in a folded layer`}>
        <rect width={W} height={H} fill="#0d130f" />
        <path d={`${arc(R2)} L ${toXY(R1, SPAN + 6).x} ${toXY(R1, SPAN + 6).y} A ${R1} ${R1} 0 0 0 ${toXY(R1, -SPAN - 6).x} ${toXY(R1, -SPAN - 6).y} Z`} fill="#c9b98f" stroke="#5b4630" strokeWidth="2" />
        {model === "slip" &&
          [1, 2, 3, 4].map((i) => <path key={i} d={arc(R1 + ((R2 - R1) * i) / 5)} fill="none" stroke="#5b4630" strokeWidth="2" />)}
        {model === "orthogonal" && <path d={arc(RN)} fill="none" stroke="#fff" strokeDasharray="6 6" strokeOpacity="0.7" />}
        {perpLines.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#c8703f" strokeWidth="2" strokeOpacity="0.8" />
        ))}
        {markers.map((m, i) => (
          <ellipse key={i} cx={m.x} cy={m.y} rx={m.rx} ry={m.ry} transform={`rotate(${m.rot} ${m.x} ${m.y})`} fill="#3b4a33" />
        ))}
        {model === "orthogonal" && (
          <text x={toXY(RN, SPAN + 8).x + 6} y={toXY(RN, SPAN + 8).y + 4} fontSize="14" fill="#fff">
            neutral surface
          </text>
        )}
        <text x="16" y={H - 16} fontSize="14" fill="#eef1ea" opacity="0.7">
          ● strain markers · orange lines started perpendicular to layering
        </text>
      </svg>
      <Verdict>{info.name}</Verdict>
    </SimFrame>
  );
}

export default FoldMechanisms;
