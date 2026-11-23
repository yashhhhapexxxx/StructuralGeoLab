import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Checkbox, Readout, SimFrame, Slider, Verdict } from "@/components/sim-ui";
import { dipClass, dipSlipType, faultX, hangingWallShift, heaveThrow, type FaultLine } from "@/geo/faults";
import { BED_COLORS } from "@/geo/beds";

const W = 800;
const H = 460;
const SURFACE = 70;
const BED_T = 52;
const BEDS = 8;
const M_PER_PX = 2; // label scale: 1 px = 2 m

/**
 * Sim 6.1/6.2 — Fault block in cross-section. The hanging wall (above the fault) slides
 * along a right-dipping fault. Classifies normal / reverse / thrust and measures heave,
 * throw and dip separation on a marker bed.
 */
export function FaultSection() {
  const [dip, setDip] = useState(60);
  const [slip, setSlip] = useState(60);
  const [dims, setDims] = useState(true);
  const [walls, setWalls] = useState(true);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      setSlip(Math.round(Math.sin((now - t0) / 1400) * 80));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const fault: FaultLine = { x0: 400, y0: 250, dip };
  const fx = (y: number) => faultX(fault, y);
  const { dx, dy } = hangingWallShift(dip, slip);
  const type = dipSlipType(dip, slip);
  const ht = heaveThrow(dip, slip);

  // Clip regions in unshifted coordinates (translation along the fault keeps them valid).
  const yTop = -400;
  const yBot = H + 400;
  const footwallClip = `M -10 ${yTop} L ${fx(yTop)} ${yTop} L ${fx(yBot)} ${yBot} L -10 ${yBot} Z`;
  const hangingClip = `M ${fx(yTop)} ${yTop} L ${W + 10} ${yTop} L ${W + 10} ${yBot} L ${fx(yBot)} ${yBot} Z`;

  const beds = Array.from({ length: BEDS }, (_, i) => ({
    y: SURFACE + i * BED_T,
    color: BED_COLORS[i % BED_COLORS.length],
  }));
  const stack = (
    <g>
      {beds.map((b, i) => (
        <rect key={i} x={-300} y={b.y} width={W + 600} height={BED_T} fill={b.color} stroke="#0b0f0c" strokeOpacity="0.4" />
      ))}
    </g>
  );

  // Marker bed: top of bed 3 (index 3). Cut-offs against the fault.
  const markY = SURFACE + 3 * BED_T;
  const fw = { x: fx(markY), y: markY };
  const hw = { x: fw.x + dx, y: fw.y + dy };

  const label = type === "none" ? "No slip" : `${type} fault`;
  const tone = type === "normal" ? "moss" : type === "none" ? "sand" : "clay";

  return (
    <SimFrame
      title="Fault block"
      subtitle="Slide the hanging wall — name the fault"
      controls={
        <>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night"
          >
            {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Animate slip"}
          </button>
          <Slider label="Fault dip" value={dip} min={10} max={89} onChange={setDip} format={(v) => `${v}°`} />
          <Slider
            label="Dip slip"
            value={slip}
            min={-100}
            max={100}
            onChange={(v) => {
              setPlaying(false);
              setSlip(v);
            }}
            format={(v) => (v === 0 ? "0" : v > 0 ? `${v * M_PER_PX} m down` : `${-v * M_PER_PX} m up`)}
            hint="Right = hanging wall moves down · left = up"
          />
          <Checkbox label="Heave / throw / separation" checked={dims} onChange={setDims} />
          <Checkbox label="Hanging wall & footwall labels" checked={walls} onChange={setWalls} />
        </>
      }
      readouts={
        <>
          <Readout label="Fault type" value={type === "none" ? "—" : type} accent />
          <Readout label="Dip class" value={dipClass(dip)} />
          <Readout label="Dip separation" value={`${(ht.dipSeparation * M_PER_PX).toFixed(0)} m`} />
          <Readout label="Heave (horizontal)" value={`${(ht.heave * M_PER_PX).toFixed(0)} m`} />
          <Readout label="Throw (vertical)" value={`${(ht.throw * M_PER_PX).toFixed(0)} m`} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`${label} dipping ${dip} degrees`}>
        <defs>
          <clipPath id="fs-fw">
            <path d={footwallClip} />
          </clipPath>
          <clipPath id="fs-hw">
            <path d={hangingClip} />
          </clipPath>
          <clipPath id="fs-box">
            <rect x="0" y="0" width={W} height={H} />
          </clipPath>
          <marker id="fs-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 Z" fill="#fff" />
          </marker>
        </defs>
        <rect width={W} height={H} fill="#0d130f" />
        <g clipPath="url(#fs-box)">
          <g clipPath="url(#fs-fw)">{stack}</g>
          <g clipPath="url(#fs-hw)">
            <g transform={`translate(${dx} ${dy})`}>{stack}</g>
          </g>
          {/* fault plane */}
          <line x1={fx(-50)} y1={-50} x2={fx(H + 50)} y2={H + 50} stroke="#fff" strokeWidth="3" />
          {/* slip arrows (half-arrows) */}
          {type !== "none" && (
            <g stroke="#fff" strokeWidth="2.5" fill="none" markerEnd="url(#fs-arrow)">
              {(() => {
                const r = (dip * Math.PI) / 180;
                const ux = Math.cos(r);
                const uy = Math.sin(r);
                const s = Math.sign(slip);
                const cy = 330;
                const cx = fx(cy);
                const nx = -uy;
                const ny = ux; // left-hand normal (towards footwall … flipped below)
                return (
                  <>
                    <line x1={cx + 14 * -nx - ux * 26 * s} y1={cy + 14 * -ny - uy * 26 * s} x2={cx + 14 * -nx + ux * 26 * s} y2={cy + 14 * -ny + uy * 26 * s} />
                    <line x1={cx + 14 * nx + ux * 26 * s} y1={cy + 14 * ny + uy * 26 * s} x2={cx + 14 * nx - ux * 26 * s} y2={cy + 14 * ny - uy * 26 * s} />
                  </>
                );
              })()}
            </g>
          )}
          {dims && type !== "none" && (
            <g fontSize="14" fill="#fff">
              <circle cx={fw.x} cy={fw.y} r="5" fill="#fff" />
              <circle cx={hw.x} cy={hw.y} r="5" fill="#fff" />
              {/* dip separation along the fault */}
              <line x1={fw.x} y1={fw.y} x2={hw.x} y2={hw.y} stroke="#b5d98a" strokeWidth="4" />
              {/* heave (horizontal) and throw (vertical) */}
              <line x1={fw.x} y1={hw.y} x2={hw.x} y2={hw.y} stroke="#e8dcc4" strokeWidth="2.5" strokeDasharray="6 4" />
              <line x1={fw.x} y1={fw.y} x2={fw.x} y2={hw.y} stroke="#c8703f" strokeWidth="2.5" strokeDasharray="6 4" />
              <text x={(fw.x + hw.x) / 2} y={hw.y + (slip > 0 ? 20 : -10)} textAnchor="middle" fill="#e8dcc4">
                heave
              </text>
              <text x={fw.x - 8} y={(fw.y + hw.y) / 2} textAnchor="end" fill="#f0a57c">
                throw
              </text>
            </g>
          )}
          {walls && (
            <g className="font-display" fontSize="22" fill="#fff" opacity="0.85">
              <text x={fx(SURFACE + 40) - 30} y={SURFACE + 40 + 120} textAnchor="end">
                FOOTWALL
              </text>
              <text x={fx(SURFACE + 40) + dx + 30} y={SURFACE + 40 + dy + 60}>HANGING WALL</text>
            </g>
          )}
        </g>
        <line x1="0" x2={W} y1={SURFACE} y2={SURFACE} stroke="#b5d98a" strokeOpacity="0.35" strokeDasharray="3 6" />
      </svg>
      <Verdict tone={tone}>{label}</Verdict>
    </SimFrame>
  );
}

export default FaultSection;
