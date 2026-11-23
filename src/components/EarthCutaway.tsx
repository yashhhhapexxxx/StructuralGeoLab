import { useId } from "react";

/**
 * Cut-away Earth: a slowly turning globe with a wedge removed to show the layered interior.
 * Depths: crust 5–70 km · mantle to ~2,890 km · liquid outer core to ~5,150 km ·
 * solid inner core to 6,371 km. Pure SVG + CSS animation (transform-only, GPU friendly).
 */
export function EarthCutaway({ className = "", labels = true }: { className?: string; labels?: boolean }) {
  const id = useId().replace(/:/g, "");
  const R = 200;
  const C = 260;
  // Radii scaled to the real Earth (6,371 km): mantle base 3,480 km, inner core 1,220 km.
  const rMantle = R * (3480 / 6371) / 1; // outer-core top
  const rInner = R * (1220 / 6371);
  const rCrust = R - 7; // crust exaggerated for visibility
  // Wedge: from 300° to 30° (clockwise from 12 o'clock) — top-right quarter-ish.
  const a0 = (-60 * Math.PI) / 180;
  const a1 = (30 * Math.PI) / 180;
  const pt = (r: number, a: number) => `${C + r * Math.sin(a)} ${C - r * Math.cos(a)}`;
  const wedge = (r: number) => `M ${C} ${C} L ${pt(r, a0)} A ${r} ${r} 0 0 1 ${pt(r, a1)} Z`;

  // Continents as soft blobs on a strip that scrolls behind the globe mask (fake rotation).
  const continents = [
    "M30 120 q40 -50 90 -20 q30 30 10 70 q-30 40 -70 20 q-40 -20 -30 -70z",
    "M190 60 q50 -20 70 30 q10 50 -30 80 q-40 10 -50 -40 q-10 -40 10 -70z",
    "M300 170 q40 -30 80 0 q20 40 -10 80 q-50 20 -70 -20 q-20 -40 0 -60z",
    "M90 260 q40 -10 60 30 q-10 40 -50 40 q-40 -20 -10 -70z",
    "M240 300 q60 -20 90 20 q0 50 -60 50 q-50 -10 -30 -70z",
  ];

  return (
    <svg viewBox={labels ? "0 0 780 520" : "0 0 520 520"} className={className} role="img" aria-label="Cut-away diagram of Earth's interior: crust, mantle, outer core and inner core">
      <defs>
        <radialGradient id={`${id}-ocean`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#3f8fa6" />
          <stop offset="55%" stopColor="#1d4d5e" />
          <stop offset="100%" stopColor="#0b2028" />
        </radialGradient>
        <radialGradient id={`${id}-mantle`} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="#e0662b" />
          <stop offset="100%" stopColor="#8a2e17" />
        </radialGradient>
        <radialGradient id={`${id}-outer`}>
          <stop offset="40%" stopColor="#ffb347" />
          <stop offset="100%" stopColor="#e07a1f" />
        </radialGradient>
        <radialGradient id={`${id}-inner`}>
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="60%" stopColor="#ffe08a" />
          <stop offset="100%" stopColor="#f5b942" />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="60%" stopColor="#7fa35b" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7fa35b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-shade`} cx="30%" cy="25%" r="85%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.6" />
        </radialGradient>
        <clipPath id={`${id}-globe`}>
          <circle cx={C} cy={C} r={R} />
        </clipPath>
        <clipPath id={`${id}-wedge`}>
          <path d={wedge(R + 1)} />
        </clipPath>
        <mask id={`${id}-nowedge`}>
          <rect width="780" height="520" fill="#fff" />
          <path d={wedge(R + 2)} fill="#000" />
        </mask>
      </defs>

      {/* atmosphere glow */}
      <circle cx={C} cy={C} r={R + 60} fill={`url(#${id}-glow)`} />

      {/* surface with drifting continents, minus the wedge */}
      <g mask={`url(#${id}-nowedge)`}>
        <circle cx={C} cy={C} r={R} fill={`url(#${id}-ocean)`} />
        <g clipPath={`url(#${id}-globe)`}>
          <g className="earth-spin" fill="#7fa35b" opacity="0.9">
            {[0, 420].map((off) => (
              <g key={off} transform={`translate(${60 + off} 60)`}>
                {continents.map((d, i) => (
                  <path key={i} d={d} fill={i % 2 ? "#a7b48f" : "#7fa35b"} />
                ))}
              </g>
            ))}
          </g>
          {/* cloud bands */}
          <g className="cloud-drift" fill="#fff" opacity="0.18">
            <ellipse cx="160" cy="150" rx="90" ry="10" />
            <ellipse cx="380" cy="330" rx="110" ry="12" />
            <ellipse cx="240" cy="420" rx="70" ry="8" />
          </g>
        </g>
        <circle cx={C} cy={C} r={R} fill={`url(#${id}-shade)`} />
      </g>

      {/* the cut-away interior */}
      <g clipPath={`url(#${id}-wedge)`}>
        <circle cx={C} cy={C} r={R} fill="#6b4a32" />
        <circle cx={C} cy={C} r={rCrust} fill={`url(#${id}-mantle)`} />
        {/* mantle convection cells */}
        <g className="mantle-churn" stroke="#ffd0a0" strokeOpacity="0.45" strokeWidth="2" fill="none" style={{ transformOrigin: `${C}px ${C}px` }}>
          {[0, 1, 2].map((i) => {
            const r = (rMantle + rCrust) / 2;
            const a = a0 + ((a1 - a0) * (i + 0.5)) / 3;
            return <ellipse key={i} cx={C + r * Math.sin(a)} cy={C - r * Math.cos(a)} rx="26" ry="16" transform={`rotate(${(a * 180) / Math.PI} ${C + r * Math.sin(a)} ${C - r * Math.cos(a)})`} strokeDasharray="10 8" />;
          })}
        </g>
        <circle cx={C} cy={C} r={rMantle} fill={`url(#${id}-outer)`} />
        <circle cx={C} cy={C} r={rInner} fill={`url(#${id}-inner)`} className="core-pulse" style={{ transformOrigin: `${C}px ${C}px` }} />
      </g>
      {/* wedge edges */}
      <path d={wedge(R)} fill="none" stroke="#0b0f0c" strokeOpacity="0.5" strokeWidth="2" />

      {labels && (
        <g fontSize="17" fill="#eef1ea" fontFamily="Calibri, Carlito, sans-serif">
          {[
            { r: R - 3, t: "Crust · 5–70 km", dy: -10 },
            { r: (rCrust + rMantle) / 2, t: "Mantle · to 2,890 km", dy: 0 },
            { r: (rMantle + rInner) / 2, t: "Outer core · liquid iron", dy: 10 },
            { r: rInner * 0.5, t: "Inner core · solid, ~5,200 °C", dy: 22 },
          ].map((l, i) => {
            const a = a1 + 0.02;
            const x = C + l.r * Math.sin(a);
            const y = C - l.r * Math.cos(a) + l.dy;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="3.5" fill="#fff" />
                <line x1={x} y1={y} x2={548} y2={y} stroke="#fff" strokeOpacity="0.4" />
                <text x={556} y={y + 5}>{l.t}</text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}

export default EarthCutaway;
