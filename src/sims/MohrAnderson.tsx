import { useState } from "react";
import { Readout, SimFrame, Slider, Toggle, Verdict } from "@/components/sim-ui";

const W = 800;
const H = 440;

type Regime = "normal" | "thrust" | "strike";

/**
 * Sim — Why rocks break: the Mohr circle with a Coulomb failure envelope, plus Anderson's
 * theory of faulting. Effective stress = total stress − pore pressure.
 *   Coulomb: τ = C + σn·tan φ       failure plane at θ = 45° − φ/2 to σ1
 *   Tensile cut-off: σ3′ ≤ −T  → extension fractures (joints) ⟂ σ3
 */
export function MohrAnderson() {
  const [s1, setS1] = useState(120);
  const [s3, setS3] = useState(40);
  const [pf, setPf] = useState(0);
  const [phi, setPhi] = useState(30);
  const [C, setC] = useState(20);
  const [regime, setRegime] = useState<Regime>("normal");

  const T = C / 2; // tensile strength
  const e1 = s1 - pf;
  const e3 = s3 - pf;
  const c = (e1 + e3) / 2;
  const r = (e1 - e3) / 2;
  const tp = Math.tan((phi * Math.PI) / 180);
  const tensile = e3 <= -T;
  const shear = r >= C * Math.cos((phi * Math.PI) / 180) + c * Math.sin((phi * Math.PI) / 180);
  const fails = tensile || shear;
  const theta = 45 - phi / 2;
  const kind = tensile ? (r < 4 * T ? "Extension fractures (joints)" : "Hybrid fractures") : shear ? "Shear fractures → faults" : "Stable — no failure";

  // plot: σn axis from −40 to 220 MPa, τ 0..130
  const ox = 120;
  const oy = 380;
  const k = 2.6;
  const X = (sn: number) => ox + sn * k;
  const Y = (tau: number) => oy - tau * k;

  // failure point on the circle (2θ measured from σ1 side)
  const twoTh = (2 * theta * Math.PI) / 180;
  // the plane at θ to σ1 plots at 180° − 2θ from σ1′, i.e. where the circle touches the envelope
  const fp = { x: c - r * Math.cos(twoTh), y: r * Math.sin(twoTh) };

  // Anderson sample orientation: σ1 vertical (normal), horizontal (thrust/strike-slip)
  const sx = 690;
  const sy = 200;
  const vertS1 = regime === "normal";
  const dipDeg = vertS1 ? 90 - theta : theta; // fault dip in the section
  const faults = [1, -1].map((s) => {
    const a = (dipDeg * Math.PI) / 180;
    const dx = Math.cos(a) * 80 * s;
    const dy = Math.sin(a) * 80;
    return { x1: sx - dx, y1: sy - dy, x2: sx + dx, y2: sy + dy };
  });

  return (
    <SimFrame
      title="Mohr circle & Anderson's faults"
      subtitle="Will the rock break — and at what angle?"
      controls={
        <>
          <Slider label="σ1 (max. stress)" value={s1} min={20} max={200} onChange={(v) => setS1(Math.max(v, s3 + 1))} format={(v) => `${v} MPa`} />
          <Slider label="σ3 (min. stress)" value={s3} min={0} max={150} onChange={(v) => setS3(Math.min(v, s1 - 1))} format={(v) => `${v} MPa`} />
          <Slider label="Pore-fluid pressure" value={pf} min={0} max={120} onChange={setPf} format={(v) => `${v} MPa`} hint="Fluids push the circle left — toward failure" />
          <Slider label="Friction angle φ" value={phi} min={15} max={45} onChange={setPhi} format={(v) => `${v}°`} />
          <Slider label="Cohesion C" value={C} min={0} max={50} onChange={setC} format={(v) => `${v} MPa`} />
          <Toggle label="Anderson regime (which stress is vertical)" value={regime} onChange={setRegime} options={[{ value: "normal", label: "σ1 vertical" }, { value: "thrust", label: "σ3 vertical" }, { value: "strike", label: "σ2 vertical" }]} />
        </>
      }
      readouts={
        <>
          <Readout label="Result" value={kind} accent />
          <Readout label="Fault angle to σ1" value={`${theta.toFixed(0)}°`} />
          <Readout label="Fault type (Anderson)" value={regime === "normal" ? `normal, dip ≈ ${(90 - theta).toFixed(0)}°` : regime === "thrust" ? `thrust, dip ≈ ${theta.toFixed(0)}°` : "strike-slip, vertical"} />
          <Readout label="Effective σ1′ / σ3′" value={`${e1} / ${e3} MPa`} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`Mohr circle: ${kind}`}>
        <rect width={W} height={H} fill="#0d130f" />
        {/* axes */}
        <line x1="20" x2="575" y1={oy} y2={oy} stroke="#ffffff55" />
        <line x1={ox} x2={ox} y1={oy + 20} y2="30" stroke="#ffffff55" />
        <text x="520" y={oy + 38} fontSize="14" fill="#9aa69c">σn (MPa)</text>
        <text x={ox + 8} y="40" fontSize="14" fill="#9aa69c">τ</text>
        {/* failure envelope (Coulomb) with tensile cut-off */}
        <path d={`M ${X(-T)} ${Y(0)} Q ${X(-T)} ${Y(C * 0.9)} ${X(0)} ${Y(C)} L ${X(165)} ${Y(C + 165 * tp)}`} fill="none" stroke="#c8703f" strokeWidth="3" />
        <text x={X(165)} y={Y(C + 165 * tp) - 14} textAnchor="end" fontSize="13" fill="#f0a57c">failure envelope τ = C + σn tan φ</text>
        {/* original (total-stress) circle when pore pressure acts */}
        {pf > 0 && <circle cx={X((s1 + s3) / 2)} cy={oy} r={((s1 - s3) / 2) * k} fill="none" stroke="#ffffff44" strokeDasharray="5 5" />}
        <path d={`M ${X(c - r)} ${oy} A ${r * k} ${r * k} 0 0 1 ${X(c + r)} ${oy}`} fill={fails ? "#c8703f" : "#b5d98a"} fillOpacity="0.15" stroke={fails ? "#ff7a5c" : "#b5d98a"} strokeWidth="3" />
        <circle cx={X(e3)} cy={oy} r="5" fill="#fff" />
        <circle cx={X(e1)} cy={oy} r="5" fill="#fff" />
        <text x={X(e3)} y={oy + 22} textAnchor="middle" fontSize="13" fill="#fff">σ3′</text>
        <text x={X(e1)} y={oy + 22} textAnchor="middle" fontSize="13" fill="#fff">σ1′</text>
        {shear && !tensile && (
          <g>
            <line x1={X(c)} y1={oy} x2={X(fp.x)} y2={Y(fp.y)} stroke="#fff" strokeDasharray="4 4" />
            <circle cx={X(fp.x)} cy={Y(fp.y)} r="6" fill="#ff3b30" />
            <text x={X(fp.x) + 10} y={Y(fp.y) - 10} fontSize="12" fill="#fff">failure plane</text>
          </g>
        )}

        {/* rock sample with stress arrows and fractures */}
        <g>
          <rect x={sx - 80} y={sy - 80} width="160" height="160" fill="#8c8f7f" stroke="#0b0f0c" />
          {regime === "strike" && <text x={sx} y={sy - 92} textAnchor="middle" fontSize="12" fill="#9aa69c">map view</text>}
          {regime !== "strike" && <text x={sx} y={sy - 92} textAnchor="middle" fontSize="12" fill="#9aa69c">cross-section</text>}
          {/* σ1 arrows */}
          <g fill="#ff3b30">
            {vertS1 ? (
              <>
                <path d={`M ${sx - 14} ${sy - 122} L ${sx + 14} ${sy - 122} L ${sx} ${sy - 86} Z`} />
                <path d={`M ${sx - 14} ${sy + 122} L ${sx + 14} ${sy + 122} L ${sx} ${sy + 86} Z`} />
              </>
            ) : (
              <>
                <path d={`M ${sx - 122} ${sy - 14} L ${sx - 122} ${sy + 14} L ${sx - 86} ${sy} Z`} />
                <path d={`M ${sx + 122} ${sy - 14} L ${sx + 122} ${sy + 14} L ${sx + 86} ${sy} Z`} />
              </>
            )}
          </g>
          <text x={vertS1 ? sx + 20 : sx + 100} y={vertS1 ? sy - 100 : sy - 22} fontSize="14" fill="#ff8b80" fontWeight="700">σ1</text>
          {fails && !tensile &&
            faults.map((f, i) => (
              <line key={i} x1={vertS1 ? f.x1 : f.x1} y1={f.y1} x2={f.x2} y2={f.y2} stroke="#111" strokeWidth="3"
                transform={vertS1 ? undefined : `rotate(0)`} />
            ))}
          {fails && tensile &&
            [-50, -20, 10, 40].map((o) =>
              vertS1 ? (
                <line key={o} x1={sx + o} x2={sx + o + 3} y1={sy - 70} y2={sy + 70} stroke="#111" strokeWidth="2.5" />
              ) : (
                <line key={o} y1={sy + o} y2={sy + o + 3} x1={sx - 70} x2={sx + 70} stroke="#111" strokeWidth="2.5" />
              ),
            )}
        </g>
        <text x={sx} y={sy + 110} textAnchor="middle" fontSize="13" fill="#e8dcc4">
          {fails ? (tensile ? "joints open ⟂ σ3" : `conjugate faults at ${theta.toFixed(0)}° to σ1`) : "no fractures yet"}
        </text>
      </svg>
      <Verdict tone={fails ? "clay" : "moss"}>{fails ? "Failure!" : "Stable"}</Verdict>
    </SimFrame>
  );
}

export default MohrAnderson;
