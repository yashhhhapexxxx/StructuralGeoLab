import { useMemo, useState } from "react";
import { Readout, SimFrame, Slider, Toggle, Verdict } from "@/components/sim-ui";
import { rng } from "@/lib/random";

const W = 800;
const H = 460;
const CX = 400;
const SEC_TOP = 30;
const SEC_BOT = 300;
const GRAPH_Y0 = 430;

/**
 * Sim — Fault zone architecture (Fossen "Faults" e-module §Fault architecture).
 * A fault core (slip surfaces, gouge, breccia, lenses) inside a damage zone whose fracture /
 * deformation-band frequency falls off away from the core. Throw widens both; structural
 * complexity (a branch point or relay) widens the damage zone further.
 */
export function FaultZone() {
  const [throwM, setThrow] = useState(150);
  const [rock, setRock] = useState<"tight" | "porous">("tight");
  const [complex, setComplex] = useState<"isolated" | "branch">("isolated");

  const core = Math.max(4, Math.sqrt(throwM) * 1.3); // half-width in px
  const dz = (Math.sqrt(throwM) * 9) * (complex === "branch" ? 1.8 : 1); // damage-zone decay length (px)
  const density = (x: number) => 30 * Math.exp(-Math.abs(x - CX) / dz) + 1.5; // per "metre"

  const marks = useMemo(() => {
    const r = rng(rock === "tight" ? 5 : 9);
    const out: { x: number; y: number; len: number; ang: number }[] = [];
    for (let i = 0; i < 2600; i++) {
      const x = r() * W;
      const y = SEC_TOP + r() * (SEC_BOT - SEC_TOP);
      if (Math.abs(x - CX) < core) continue;
      if (r() * 32 > density(x)) continue;
      const conj = r() < 0.5 ? 1 : -1;
      out.push({ x, y, len: 6 + r() * 14, ang: (rock === "tight" ? 70 + r() * 25 : 60 + r() * 10) * conj });
    }
    return out;
  }, [rock, core, dz]); // eslint-disable-line react-hooks/exhaustive-deps

  const lenses = useMemo(() => {
    const r = rng(21);
    return Array.from({ length: Math.round(core / 3) + 2 }, () => ({ y: SEC_TOP + r() * (SEC_BOT - SEC_TOP), h: 14 + r() * 26, dx: (r() - 0.5) * core }));
  }, [core]);

  let graph = "";
  for (let x = 20; x <= W - 20; x += 4) graph += `${graph ? "L" : "M"}${x} ${(GRAPH_Y0 - density(x) * 3.2).toFixed(1)} `;
  const dzWidthM = Math.round(dz * 3 * 0.25 * 2); // ±3 decay lengths, 0.25 m/px

  return (
    <SimFrame
      title="Inside a fault zone"
      subtitle="Fault core · damage zone · fracture frequency"
      controls={
        <>
          <Slider label="Fault throw" value={throwM} min={10} max={500} step={10} onChange={setThrow} format={(v) => `${v} m`} />
          <Toggle label="Host rock" value={rock} onChange={setRock} options={[{ value: "tight", label: "Non-porous (fractures)" }, { value: "porous", label: "Porous (def. bands)" }]} />
          <Toggle label="Along the fault" value={complex} onChange={setComplex} options={[{ value: "isolated", label: "Isolated section" }, { value: "branch", label: "Near a branch point" }]} />
          <p className="text-sm text-muted">The core takes up most of the slip. Around it the damage zone records the fault's growth: fractures (or deformation bands in porous sandstone) become rarer away from the core. Asperities, jogs and branch points widen it.</p>
        </>
      }
      readouts={
        <>
          <Readout label="Fault core width" value={`${(core * 2 * 0.25).toFixed(1)} m`} accent />
          <Readout label="Damage zone width" value={`~${dzWidthM} m`} />
          <Readout label="Peak frequency" value={`${Math.round(density(CX + core))} / m`} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label="Cross-section of a fault zone with core and damage zone">
        <rect width={W} height={H} fill="#0d130f" />
        <rect x="0" y={SEC_TOP} width={W} height={SEC_BOT - SEC_TOP} fill={rock === "tight" ? "#8c8f7f" : "#d7c08a"} />
        {/* damage zone tint */}
        <rect x={CX - dz * 3} y={SEC_TOP} width={dz * 6} height={SEC_BOT - SEC_TOP} fill="#c8703f" opacity="0.1" />
        {marks.map((m, i) => {
          const a = (m.ang * Math.PI) / 180;
          return <line key={i} x1={m.x - Math.cos(a) * m.len / 2} y1={m.y - Math.sin(a) * m.len / 2} x2={m.x + Math.cos(a) * m.len / 2} y2={m.y + Math.sin(a) * m.len / 2} stroke={rock === "tight" ? "#2b2b2b" : "#7a6440"} strokeWidth={rock === "tight" ? 1.2 : 2.2} />;
        })}
        {/* fault core */}
        <rect x={CX - core} y={SEC_TOP} width={core * 2} height={SEC_BOT - SEC_TOP} fill="#3d3530" />
        {lenses.map((l, i) => (
          <ellipse key={i} cx={CX + l.dx * 0.6} cy={l.y} rx={Math.max(2, core * 0.55)} ry={l.h / 2} fill="#9b927f" stroke="#1d1a17" />
        ))}
        <line x1={CX - core * 0.3} x2={CX - core * 0.3} y1={SEC_TOP} y2={SEC_BOT} stroke="#e8dcc4" strokeWidth="1.5" />
        <line x1={CX + core * 0.5} x2={CX + core * 0.5} y1={SEC_TOP} y2={SEC_BOT} stroke="#e8dcc4" strokeWidth="1" opacity="0.7" />
        {/* labels */}
        <g className="font-display" fontSize="16" fill="#fff">
          <text x={CX} y={SEC_TOP - 8} textAnchor="middle">FAULT CORE</text>
          <text x={Math.max(60, CX - dz * 2)} y={SEC_TOP - 8} textAnchor="middle" fill="#f0b48c">DAMAGE ZONE</text>
          <text x={Math.min(W - 60, CX + dz * 2)} y={SEC_TOP - 8} textAnchor="middle" fill="#f0b48c">DAMAGE ZONE</text>
          <text x="60" y={SEC_BOT - 10} fill="#e8dcc4" fontSize="13">host rock</text>
        </g>
        {/* frequency graph */}
        <text x="20" y={SEC_BOT + 30} className="font-display" fontSize="14" fill="#eef1ea">{rock === "tight" ? "FRACTURES" : "DEFORMATION BANDS"} PER METRE</text>
        <line x1="20" x2={W - 20} y1={GRAPH_Y0} y2={GRAPH_Y0} stroke="#ffffff33" />
        <path d={`${graph} L ${W - 20} ${GRAPH_Y0} L 20 ${GRAPH_Y0} Z`} fill="#c8703f" fillOpacity="0.25" stroke="#f0a57c" strokeWidth="2" />
      </svg>
      <Verdict>{`${throwM} m throw`}</Verdict>
    </SimFrame>
  );
}

export default FaultZone;
