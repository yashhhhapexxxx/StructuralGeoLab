import { useMemo, useState } from "react";
import { Checkbox, Readout, SimFrame, Slider, Verdict } from "@/components/sim-ui";
import {
  axialOrientation,
  foldTrain,
  interlimbClass,
  maxAxialTilt,
  roundedPath,
  symmetryState,
} from "@/geo/folds";
import { BED_COLORS } from "@/geo/beds";
import { deg } from "@/lib/utils";

const W = 800;
const H = 460;
const LAYERS = 5;
const SPACING = 26;

/**
 * Sim 4.1 — Symmetry lab. Drag the interlimb angle and the axial-surface tilt; the fold
 * train morphs between symmetric and asymmetric, with live Fleuty classification.
 */
export function FoldSymmetryLab() {
  const [interlimb, setInterlimb] = useState(90);
  const [tilt, setTilt] = useState(18);
  const [showAxial, setShowAxial] = useState(true);
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [showAngle, setShowAngle] = useState(true);

  const tMax = maxAxialTilt(interlimb);
  const safeTilt = Math.max(-tMax, Math.min(tMax, tilt));
  const s = useMemo(() => symmetryState(interlimb, safeTilt), [interlimb, safeTilt]);

  const geo = useMemo(() => {
    const rad = Math.PI / 180;
    const runPerAmp = 1 / Math.tan(Math.max(s.leftDip, 0.5) * rad) + 1 / Math.tan(Math.max(s.rightDip, 0.5) * rad);
    const amplitude = Math.min(150, 330 / runPerAmp);
    const midY = 175;
    const startX = -260;
    const { pts, hinges } = foldTrain(s, { width: W + 520, amplitude, startX, midY });
    const radius = Math.min(26, amplitude * 0.22);
    // Similar folds stacked along the axial direction (top leans right ⇒ deeper layers shift left).
    const shiftX = -Math.tan(safeTilt * rad) * SPACING;
    const layers = Array.from({ length: LAYERS }, (_, k) => ({
      d: roundedPath(pts.map(([x, y]) => [x + shiftX * k, y + SPACING * k] as [number, number]), radius),
      color: BED_COLORS[k % BED_COLORS.length],
    }));
    // centre antiform for annotations
    const anti = hinges.filter((h) => h.kind === "antiform");
    const centre = anti.reduce((best, h) => (Math.abs(h.x - W / 2) < Math.abs(best.x - W / 2) ? h : best), anti[0]);
    return { amplitude, midY, hinges, layers, centre, radius, shiftX };
  }, [s, safeTilt]);

  const rad = Math.PI / 180;
  const axisDir = { x: Math.sin(safeTilt * rad), y: -Math.cos(safeTilt * rad) }; // pointing up the axial surface
  const ilc = interlimbClass(interlimb);
  const ori = axialOrientation(s.axialDip);

  const c = geo.centre;
  const armL = { x: -Math.cos(s.leftDip * rad), y: Math.sin(s.leftDip * rad) };
  const armR = { x: Math.cos(s.rightDip * rad), y: Math.sin(s.rightDip * rad) };
  const arcR = 46;

  return (
    <SimFrame
      title="Symmetry lab"
      subtitle="Tilt the axial surface — watch the fold turn asymmetric"
      controls={
        <>
          <Slider label="Interlimb angle" value={interlimb} min={10} max={170} onChange={setInterlimb} format={(v) => deg(v)} hint="Angle between the two limbs" />
          <Slider
            label="Axial-surface tilt"
            value={Math.round(safeTilt)}
            min={-Math.floor(tMax)}
            max={Math.floor(tMax)}
            onChange={setTilt}
            format={(v) => (v === 0 ? "0° (vertical)" : `${Math.abs(v)}° ${v > 0 ? "→" : "←"}`)}
            hint="Lean the fold left or right"
          />
          <button
            type="button"
            onClick={() => setTilt(0)}
            className="rounded-full border border-lichen/40 px-4 py-2 text-sm text-lichen transition-colors hover:bg-moss/15"
          >
            Snap to symmetric
          </button>
          <div className="flex flex-col gap-2">
            <Checkbox label="Axial surfaces" checked={showAxial} onChange={setShowAxial} />
            <Checkbox label="Enveloping surfaces" checked={showEnvelope} onChange={setShowEnvelope} />
            <Checkbox label="Interlimb angle" checked={showAngle} onChange={setShowAngle} />
          </div>
        </>
      }
      readouts={
        <>
          <Readout label="Symmetry" value={s.symmetric ? "Symmetric" : "Asymmetric"} accent />
          <Readout label="Interlimb" value={`${deg(interlimb)} · ${ilc}`} />
          <Readout label="Orientation" value={ori} />
          <Readout label="Axial-surface dip" value={deg(s.axialDip)} />
          <Readout label="Left / right limb dip" value={`${deg(s.leftDip)} / ${deg(s.rightDip)}`} />
          <Readout label="Long : short limb" value={`${s.limbRatio.toFixed(2)} : 1`} />
          <Readout label="Vergence" value={s.vergence === "none" ? "—" : `to the ${s.vergence}`} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`${s.symmetric ? "Symmetric" : "Asymmetric"} ${ilc} fold train`}>
        <defs>
          <clipPath id="fsl-clip">
            <rect x="0" y="0" width={W} height={H} />
          </clipPath>
        </defs>
        <g clipPath="url(#fsl-clip)">
          {showEnvelope && (
            <g stroke="#e8dcc4" strokeOpacity="0.35" strokeDasharray="6 8" strokeWidth="1.5">
              <line x1="0" x2={W} y1={geo.midY - geo.amplitude / 2} y2={geo.midY - geo.amplitude / 2} />
              <line x1="0" x2={W} y1={geo.midY + geo.amplitude / 2} y2={geo.midY + geo.amplitude / 2} />
            </g>
          )}

          {geo.layers.map((l, k) => (
            <path key={k} d={l.d} fill="none" stroke={l.color} strokeWidth={SPACING - 6} strokeLinejoin="round" strokeLinecap="round" opacity={0.95} />
          ))}

          {showAxial &&
            geo.hinges.map((h, i) => (
              <line
                key={i}
                x1={h.x + axisDir.x * 70}
                y1={h.y + axisDir.y * 70}
                x2={h.x - axisDir.x * 420}
                y2={h.y - axisDir.y * 420}
                stroke={s.symmetric ? "#b5d98a" : "#c8703f"}
                strokeWidth={s.symmetric ? 2.5 : 2}
                strokeDasharray="10 7"
                opacity={h.kind === "antiform" ? 0.9 : 0.55}
              />
            ))}

          {showAngle && c && (
            <g>
              <path
                d={`M ${c.x + armL.x * arcR} ${c.y + armL.y * arcR} A ${arcR} ${arcR} 0 0 0 ${c.x + armR.x * arcR} ${c.y + armR.y * arcR}`}
                fill="#b5d98a"
                fillOpacity="0.12"
                stroke="#b5d98a"
                strokeWidth="2"
              />
              <line x1={c.x} y1={c.y} x2={c.x + armL.x * 90} y2={c.y + armL.y * 90} stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" />
              <line x1={c.x} y1={c.y} x2={c.x + armR.x * 90} y2={c.y + armR.y * 90} stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" />
              <text x={c.x} y={c.y + arcR + 22} textAnchor="middle" className="font-display" fontSize="20" fill="#eef1ea">
                {deg(interlimb)}
              </text>
              <circle cx={c.x} cy={c.y} r="5" fill="#fff" />
              <text x={c.x + 10} y={c.y - 12} fontSize="14" fill="#eef1ea" opacity="0.8">
                hinge
              </text>
            </g>
          )}
        </g>
      </svg>
      <Verdict tone={s.symmetric ? "moss" : "clay"}>{s.symmetric ? "Symmetric" : `Asymmetric · verges ${s.vergence}`}</Verdict>
    </SimFrame>
  );
}

export default FoldSymmetryLab;
