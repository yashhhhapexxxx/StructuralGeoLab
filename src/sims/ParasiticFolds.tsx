import { useMemo, useState } from "react";
import { Readout, SimFrame, Slider, Toggle, Verdict } from "@/components/sim-ui";

const W = 800;
const H = 460;
const CX = 400;
const HALF = 330; // half-width of the large fold
const AMP = 190;
const BASE_Y = 330;
const SMALL_AMP = 11;
const SMALL_K = (2 * Math.PI) / 34; // parasitic wavelength ≈ 34 px
const SHEAR = 1.15; // max asymmetry of the parasitic folds

type Shape = "antiform" | "synform";

/** Large fold centre line y(x) and its slope. */
function big(x: number, shape: Shape) {
  const u = (Math.PI * (x - CX)) / HALF;
  const h = (AMP * (1 + Math.cos(u))) / 2;
  const dh = (-AMP * Math.PI * Math.sin(u)) / (2 * HALF);
  return shape === "antiform" ? { y: BASE_Y - h, dy: -dh } : { y: BASE_Y - AMP + h, dy: dh };
}

/**
 * Layer with superimposed parasitic folds. Asymmetry comes from layer-parallel shear whose
 * sense flips across the hinge (flexural slip toward the hinge of an antiform), producing
 * Z folds on one limb, M folds at the hinge and S folds on the other (viewed down plunge).
 */
function layerPath(shape: Shape, offset: number, withSmall: boolean) {
  let d = "";
  for (let x = CX - HALF; x <= CX + HALF; x += 2) {
    const { y, dy } = big(x, shape);
    const len = Math.hypot(1, dy);
    const T = { x: 1 / len, y: dy / len };
    const N = { x: dy / len, y: -1 / len }; // points "up" out of the layer
    const limb = Math.max(-1, Math.min(1, dy * 2.2)); // −1…1 across the fold; 0 at hinge
    // Flexural slip: layers on the outer arc move toward the hinge relative to inner layers,
    // so the crests of the small folds lean toward the hinge (Z left / S right on an antiform).
    const gamma = (shape === "antiform" ? -1 : 1) * SHEAR * limb;
    const s = withSmall ? SMALL_AMP * Math.sin(SMALL_K * x) : 0;
    const px = x + N.x * (offset + s) + T.x * gamma * s;
    const py = y + N.y * (offset + s) + T.y * gamma * s;
    d += `${d ? " L" : "M"} ${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  return d;
}

function letterAt(x: number, shape: Shape): "S" | "Z" | "M" {
  const rel = (x - CX) / HALF;
  if (Math.abs(rel) < 0.18) return "M";
  const leftLimb = rel < 0;
  if (shape === "antiform") return leftLimb ? "Z" : "S";
  return leftLimb ? "S" : "Z";
}

export function ParasiticFolds() {
  const [shape, setShape] = useState<Shape>("antiform");
  const [lensPos, setLensPos] = useState(-0.55); // −1…1 along the fold
  const [challenge, setChallenge] = useState<null | { pos: number; shape: Shape; answered?: "left" | "right" | "here" }>(null);

  const activeShape = challenge?.shape ?? shape;
  const activePos = challenge?.pos ?? lensPos;
  const lx = CX + activePos * HALF;
  const ly = big(lx, activeShape).y;
  const letter = letterAt(lx, activeShape);

  const paths = useMemo(
    () => ({
      thick: layerPath(activeShape, 0, false),
      thinA: layerPath(activeShape, 26, true),
      thinB: layerPath(activeShape, -26, true),
    }),
    [activeShape],
  );

  const hingeSide: "left" | "right" | "here" = letter === "M" ? "here" : activeShape === "antiform" ? (letter === "Z" ? "right" : "left") : letter === "S" ? "right" : "left";

  const newChallenge = () => {
    const pos = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.45);
    setChallenge({ pos: Math.random() < 0.15 ? 0 : pos, shape: Math.random() < 0.5 ? "antiform" : "synform" });
  };

  const zoom = 1.9;
  const lensR = 64;
  const insetCx = W - 110;
  const insetCy = 110;

  const scene = (
    <g>
      <path d={paths.thick} fill="none" stroke="#8c6a4f" strokeWidth="30" strokeLinecap="round" />
      <path d={paths.thinA} fill="none" stroke="#e3c78a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d={paths.thinB} fill="none" stroke="#c9cfc4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );

  return (
    <SimFrame
      title="Parasitic folds: S, Z & M"
      subtitle="Small folds point to the big fold's hinge"
      controls={
        challenge ? (
          <div className="flex flex-col gap-3">
            <p className="text-[15px] text-ink">
              You see only this outcrop through the lens, on a <b>{challenge.shape}</b>. Where is its hinge?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["left", "here", "right"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setChallenge({ ...challenge, answered: a })}
                  className="rounded-xl border border-line px-2 py-2 text-sm capitalize hover:border-lichen/50"
                >
                  {a === "here" ? "Right here" : `To the ${a}`}
                </button>
              ))}
            </div>
            {challenge.answered && (
              <p className={challenge.answered === hingeSide ? "text-lichen" : "text-[#f0a57c]"}>
                {challenge.answered === hingeSide ? "Correct! " : "Not quite. "}
                {letter === "M"
                  ? "Symmetric M folds sit at the hinge."
                  : `${letter} folds on a ${challenge.shape} mean the hinge is to the ${hingeSide}.`}
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={newChallenge} className="flex-1 rounded-full bg-moss px-4 py-2 text-sm text-night">
                Next outcrop
              </button>
              <button type="button" onClick={() => setChallenge(null)} className="rounded-full border border-line px-4 py-2 text-sm">
                Exit
              </button>
            </div>
          </div>
        ) : (
          <>
            <Toggle
              label="Large fold"
              value={shape}
              onChange={setShape}
              options={[
                { value: "antiform", label: "Antiform" },
                { value: "synform", label: "Synform" },
              ]}
            />
            <Slider label="Hand lens position" value={lensPos} min={-0.95} max={0.95} step={0.01} onChange={setLensPos} format={(v) => (Math.abs(v) < 0.18 ? "hinge" : v < 0 ? "left limb" : "right limb")} />
            <button type="button" onClick={newChallenge} className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night">
              Field challenge: find the hinge
            </button>
          </>
        )
      }
      readouts={
        <>
          <Readout label="Small-fold shape" value={`${letter} fold`} accent />
          <Readout label="Position" value={letter === "M" ? "Hinge zone" : activePos < 0 ? "Left limb" : "Right limb"} />
          {!challenge && <Readout label="Big-fold hinge" value={hingeSide === "here" ? "Here" : `to the ${hingeSide}`} />}
          <Readout label="Viewed" value="down plunge" />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label="Large fold with S, Z and M parasitic folds">
        <defs>
          <clipPath id="pf-lens">
            <circle cx={insetCx} cy={insetCy} r={92} />
          </clipPath>
        </defs>
        {/* Main view (hidden during the challenge so students must read the small folds) */}
        <g opacity={challenge ? 0.07 : 1}>{scene}</g>
        {!challenge &&
          [-0.6, 0, 0.6].map((p) => {
            const x = CX + p * HALF;
            const y = big(x, shape).y;
            return (
              <text key={p} x={x} y={shape === "antiform" ? y - 48 : y + 66} textAnchor="middle" className="font-display" fontSize="30" fill="#b5d98a" opacity="0.75">
                {letterAt(x, shape)}
              </text>
            );
          })}
        {/* Lens on the fold */}
        <circle cx={lx} cy={ly} r={lensR / zoom + 10} fill="none" stroke="#fff" strokeWidth="2.5" />
        <line x1={lx} y1={ly} x2={insetCx} y2={insetCy} stroke="#fff" strokeOpacity="0.25" strokeDasharray="4 6" />
        {/* Magnified inset */}
        <circle cx={insetCx} cy={insetCy} r={94} fill="#0d130f" stroke="#b5d98a" strokeWidth="3" />
        <g clipPath="url(#pf-lens)">
          <g transform={`translate(${insetCx} ${insetCy}) scale(${zoom}) translate(${-lx} ${-ly})`}>{scene}</g>
        </g>
        <text x={insetCx} y={insetCy + 120} textAnchor="middle" className="font-display" fontSize="26" fill="#eef1ea">
          {challenge?.answered || !challenge ? `${letter} fold` : "?"}
        </text>
      </svg>
      {!challenge && <Verdict>{shape}</Verdict>}
    </SimFrame>
  );
}

export default ParasiticFolds;
