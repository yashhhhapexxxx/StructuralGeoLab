import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Checkbox, Readout, SimFrame, Slider, Verdict } from "@/components/sim-ui";
import { BED_COLORS } from "@/geo/beds";

const W = 800;
const H = 430;
const TOP = 90; // original ground surface
const BASE = 330; // detachment: faults sole out here; ductile crust below
const BED_T = 40;

/**
 * Sim — Horsts, grabens and rift basins. Four normal faults; grabens (hanging walls of two
 * faults dipping toward each other) drop while the crust stretches sideways.
 * Kinematics keep every block in contact with its neighbours along the faults.
 */
export function RiftBuilder() {
  const [ext, setExt] = useState(40); // throw on each fault (px; 1 px = 10 m)
  const [dip, setDip] = useState(62);
  const [fill, setFill] = useState(true);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = ((now - t0) / 5000) % 1;
      setExt(Math.round(80 * (p < 0.85 ? p / 0.85 : 1)));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const t = Math.tan((dip * Math.PI) / 180);
  const d = ext; // throw
  const h = d / t; // heave per fault
  // Fault tops at the original surface; signs: +1 dips right, −1 dips left
  const F = [
    { x: 120, s: 1 },
    { x: 390, s: -1 },
    { x: 470, s: 1 },
    { x: 740, s: -1 },
  ];
  const fx = (i: number, y: number) => F[i].x + F[i].s * (y - TOP) / t;
  // Block i lies between fault i-1 and fault i; translations keep contacts
  const shift = [
    { dx: 0, dy: 0 },
    { dx: h, dy: d },
    { dx: 2 * h, dy: 0 },
    { dx: 3 * h, dy: d },
    { dx: 4 * h, dy: 0 },
  ];
  const centre = -2 * h; // keep the picture centred
  const poly = (i: number) => {
    const L = i === 0 ? [-400, -400] : [fx(i - 1, TOP), fx(i - 1, BASE)];
    const R = i === 4 ? [W + 600, W + 600] : [fx(i, TOP), fx(i, BASE)];
    return `M ${L[0]} ${TOP} L ${R[0]} ${TOP} L ${R[1]} ${BASE} L ${L[1]} ${BASE} Z`;
  };
  const beds = Array.from({ length: Math.ceil((BASE - TOP) / BED_T) }, (_, k) => k);

  const fillPoly = (left: number, right: number, sl: number, sr: number) => {
    // basin above graben between block `left` (its right fault) and block `right` (its left fault)
    const a = (y: number) => fx(left, y) + shift[sl].dx;
    const b = (y: number) => fx(right - 1, y) + shift[sr].dx;
    return `M ${a(TOP)} ${TOP} L ${b(TOP)} ${TOP} L ${b(TOP + d)} ${TOP + d} L ${a(TOP + d)} ${TOP + d} Z`;
  };

  const extensionM = Math.round(4 * h * 10);
  const width = F[3].x - F[0].x;
  return (
    <SimFrame
      title="Rift builder"
      subtitle="Stretch the crust: horsts stand, grabens drop"
      controls={
        <>
          <button type="button" onClick={() => setPlaying((p) => !p)} className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night">
            {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Animate rifting"}
          </button>
          <Slider label="Throw on each fault" value={ext} min={0} max={90} onChange={(v) => { setPlaying(false); setExt(v); }} format={(v) => `${v * 10} m`} />
          <Slider label="Fault dip" value={dip} min={45} max={75} onChange={setDip} format={(v) => `${v}°`} />
          <Checkbox label="Fill basins with syn-rift sediment" checked={fill} onChange={setFill} />
          <p className="text-sm text-muted">The two faults bounding each graben dip toward each other (antithetic pair). The horst is the footwall of both.</p>
        </>
      }
      readouts={
        <>
          <Readout label="Total extension" value={`${extensionM} m`} accent />
          <Readout label="Stretching" value={`${((4 * h) / width * 100).toFixed(1)}%`} />
          <Readout label="Heave per fault" value={`${Math.round(h * 10)} m`} />
          <Readout label="Graben depth" value={`${d * 10} m`} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label="Cross-section of a rift with horsts and grabens">
        <rect width={W} height={H} fill="#0d130f" />
        <g transform={`translate(${centre} 0)`}>
          {/* ductile lower crust */}
          <rect x={-400} y={BASE} width={W + 1400} height={H} fill="#5b3f37" />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${shift[i].dx} ${shift[i].dy})`}>
              <clipPath id={`rb-${i}`}>
                <path d={poly(i)} />
              </clipPath>
              <g clipPath={`url(#rb-${i})`}>
                {beds.map((k) => (
                  <rect key={k} x={-400} y={TOP + k * BED_T} width={W + 1400} height={BED_T} fill={BED_COLORS[k % BED_COLORS.length]} stroke="#0b0f0c" strokeOpacity="0.35" />
                ))}
              </g>
              <path d={poly(i)} fill="none" stroke="#fff" strokeWidth="2" strokeOpacity="0.9" />
            </g>
          ))}
          {fill && d > 2 && (
            <g fill="#e9d9a6" stroke="#b9a46a" strokeWidth="1">
              <path d={fillPoly(0, 2, 0, 2)} />
              <path d={fillPoly(2, 4, 2, 4)} />
            </g>
          )}
          {d > 6 && (
            <g className="font-display" fontSize="18" fill="#fff" textAnchor="middle">
              <text x={(F[0].x + F[1].x) / 2 + h} y={TOP + d - 8}>Graben</text>
              <text x={(F[1].x + F[2].x) / 2 + 2 * h} y={TOP - 12}>Horst</text>
              <text x={(F[2].x + F[3].x) / 2 + 3 * h} y={TOP + d - 8}>Graben</text>
            </g>
          )}
        </g>
        <text x="14" y={H - 14} fontSize="13" fill="#e8dcc4" opacity="0.8">ductile lower crust — faults sole out at the detachment</text>
        <g fill="#c8703f">
          <path d={`M 14 ${TOP + 120} l 34 -14 l 0 28 Z`} transform={`scale(-1 1) translate(${-62} 0)`} />
          <path d={`M ${W - 14} ${TOP + 120} l -34 -14 l 0 28 Z`} transform={`scale(-1 1) translate(${-2 * W + 62} 0)`} />
        </g>
      </svg>
      <Verdict>{d < 3 ? "Unstretched crust" : `${extensionM} m of extension`}</Verdict>
    </SimFrame>
  );
}

export default RiftBuilder;
