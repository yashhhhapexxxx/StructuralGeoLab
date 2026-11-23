import { useState } from "react";
import { Checkbox, Readout, SimFrame, Slider, Verdict } from "@/components/sim-ui";
import { trueThickness } from "@/geo/attitude";

const W = 800;
const H = 500;
const MAP_Y0 = 30;
const MAP_H = 120;
const GROUND = 220; // section ground line
const SCALE = 1.6; // px per metre

/**
 * Sim — True vs apparent thickness. On flat ground, a bed dipping δ crops out over a width w
 * (measured ⟂ strike) — its apparent thickness. True thickness t = w · sin δ.
 */
export function TrueThickness() {
  const [dip, setDip] = useState(25);
  const [t, setT] = useState(60);
  const [triangle, setTriangle] = useState(true);
  const r = (dip * Math.PI) / 180;
  const w = t / Math.sin(r); // apparent width on flat ground
  const x0 = 200; // upper contact outcrop
  const x1 = x0 + w * SCALE; // lower contact outcrop
  const len = 900;
  // contacts dip to the right (east) in the section
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  // foot of the perpendicular from (x1, GROUND) onto the upper contact
  const fx = x0 + ((x1 - x0) * dx) * dx;
  const fy = GROUND + ((x1 - x0) * dx) * dy;

  const bedPoly = `M ${x0} ${GROUND} L ${x0 + len * dx} ${GROUND + len * dy} L ${x1 + len * dx} ${GROUND + len * dy} L ${x1} ${GROUND} Z`;
  const showW = Math.min(w * SCALE, W - x0 - 40);

  return (
    <SimFrame
      title="True vs apparent thickness"
      subtitle="Tilted beds look wider on maps than they really are"
      controls={
        <>
          <Slider label="Dip angle δ" value={dip} min={5} max={90} onChange={setDip} format={(v) => `${v}°`} />
          <Slider label="True thickness t" value={t} min={20} max={120} step={5} onChange={setT} format={(v) => `${v} m`} />
          <Checkbox label="Show the right-angle triangle" checked={triangle} onChange={setTriangle} />
          <div className="rounded-2xl border border-line bg-black/20 p-4 text-[15px]">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-lichen">The rule</p>
            <p className="mt-1">sin δ = true thickness ÷ apparent thickness</p>
            <p className="mt-1 font-semibold text-sand">t = w × sin δ</p>
            <p className="mt-2 text-sm text-muted">Measure w perpendicular to strike, on flat ground.</p>
          </div>
        </>
      }
      readouts={
        <>
          <Readout label="Apparent (map) width w" value={`${w.toFixed(0)} m`} accent />
          <Readout label="True thickness t" value={`${trueThickness(w, dip).toFixed(0)} m`} />
          <Readout label="w ÷ t" value={`${(w / t).toFixed(2)}×`} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`Bed dipping ${dip} degrees: apparent width ${w.toFixed(0)} m, true thickness ${t} m`}>
        <rect width={W} height={H} fill="#0d130f" />
        <defs>
          <clipPath id="tt-sec"><rect x="0" y={GROUND} width={W} height={H - GROUND} /></clipPath>
          <clipPath id="tt-map"><rect x="20" y={MAP_Y0} width={W - 40} height={MAP_H} /></clipPath>
        </defs>

        {/* MAP VIEW */}
        <text x="20" y={MAP_Y0 - 10} className="font-display" fontSize="16" fill="#eef1ea">MAP VIEW</text>
        <g clipPath="url(#tt-map)">
          <rect x="20" y={MAP_Y0} width={x0 - 20} height={MAP_H} fill="#c9cfc4" />
          <rect x={x0} y={MAP_Y0} width={x1 - x0} height={MAP_H} fill="#8c6a4f" />
          <rect x={x1} y={MAP_Y0} width={W} height={MAP_H} fill="#e3c78a" />
          <text x={(20 + x0) / 2} y={MAP_Y0 + 22} textAnchor="middle" fontSize="13" fill="#0b0f0c" fontWeight="700">Bed P</text>
          <text x={(x0 + Math.min(x1, W - 20)) / 2} y={MAP_Y0 + 22} textAnchor="middle" fontSize="13" fill="#fff" fontWeight="700">Bed Q</text>
          {/* strike & dip symbol */}
          <g transform={`translate(${Math.min(x1 + 50, W - 60)} ${MAP_Y0 + 60})`}>
            <line y1="-22" y2="22" stroke="#0b0f0c" strokeWidth="3" />
            <line x2="12" stroke="#0b0f0c" strokeWidth="3" />
            <text x="16" y="5" fontSize="13" fill="#0b0f0c">{dip}°</text>
          </g>
        </g>
        <line x1="20" x2={W - 20} y1={MAP_Y0 + MAP_H / 2 + 30} y2={MAP_Y0 + MAP_H / 2 + 30} stroke="#ff5a4e" strokeWidth="1.5" />
        <text x="26" y={MAP_Y0 + MAP_H / 2 + 26} fontSize="12" fill="#ff8b80">A</text>
        <text x={W - 34} y={MAP_Y0 + MAP_H / 2 + 26} fontSize="12" fill="#ff8b80">B</text>
        {/* apparent width arrow */}
        <g stroke="#fff" strokeWidth="2">
          <line x1={x0} x2={x0 + showW} y1={MAP_Y0 + 48} y2={MAP_Y0 + 48} />
          <line x1={x0} x2={x0} y1={MAP_Y0 + 40} y2={MAP_Y0 + 56} />
          <line x1={x0 + showW} x2={x0 + showW} y1={MAP_Y0 + 40} y2={MAP_Y0 + 56} />
        </g>
        <text x={x0 + showW / 2} y={MAP_Y0 + 75} textAnchor="middle" fontSize="13" fill="#fff">apparent thickness w = {w.toFixed(0)} m</text>
        {/* projection lines down to the section */}
        <line x1={x0} x2={x0} y1={MAP_Y0 + MAP_H} y2={GROUND} stroke="#fff" strokeOpacity="0.25" strokeDasharray="4 5" />
        <line x1={x1} x2={x1} y1={MAP_Y0 + MAP_H} y2={GROUND} stroke="#fff" strokeOpacity="0.25" strokeDasharray="4 5" />

        {/* SECTION */}
        <text x="20" y={GROUND - 14} className="font-display" fontSize="16" fill="#eef1ea">CROSS-SECTION A–B</text>
        <g clipPath="url(#tt-sec)">
          <rect x="0" y={GROUND} width={W} height={H} fill="#c9cfc4" />
          <path d={`M ${x1} ${GROUND} L ${x1 + len * dx} ${GROUND + len * dy} L ${W + 900} ${GROUND + 900} L ${W + 900} ${GROUND} Z`} fill="#e3c78a" />
          <path d={bedPoly} fill="#8c6a4f" />
          {triangle && (
            <g>
              <line x1={x1} y1={GROUND} x2={fx} y2={fy} stroke="#fff" strokeWidth="3" />
              <path d={`M ${fx + (x1 - fx) * 0.12} ${fy + (GROUND - fy) * 0.12} l ${dx * 12} ${dy * 12}`} stroke="#fff" fill="none" />
              <text x={(x1 + fx) / 2 + 10} y={(GROUND + fy) / 2 + 6} fontSize="14" fill="#fff" fontWeight="700">t = {t} m</text>
              <line x1={x0} y1={GROUND + 1} x2={x1} y2={GROUND + 1} stroke="#ffd27a" strokeWidth="3" />
              <path d={`M ${x0 + 40} ${GROUND} A 40 40 0 0 1 ${x0 + 40 * dx} ${GROUND + 40 * dy}`} stroke="#ff5a4e" strokeWidth="2.5" fill="none" />
              <text x={x0 + 46} y={GROUND + 22} fontSize="14" fill="#ff8b80" fontWeight="700">{dip}°</text>
            </g>
          )}
        </g>
        <line x1="0" x2={W} y1={GROUND} y2={GROUND} stroke="#e8dcc4" strokeWidth="2" />
        <text x={x0 + 4} y={GROUND - 4} fontSize="11" fill="#e8dcc4">upper contact</text>
        <text x={x1 + 4} y={GROUND - 4} fontSize="11" fill="#e8dcc4">lower contact</text>
      </svg>
      <Verdict>{`t = ${w.toFixed(0)} × sin ${dip}° = ${t} m`}</Verdict>
    </SimFrame>
  );
}

export default TrueThickness;
