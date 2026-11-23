import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Readout, SimFrame, Slider, Toggle, Verdict } from "@/components/sim-ui";
import { rng } from "@/lib/random";

const W = 800;
const H = 440;
const ZONE_ANGLE = 30; // future fault makes ~30° with σ1 (vertical)

/**
 * Sim — How a fault is born (Fossen "Faults" e-module §Fault growth).
 * Non-porous rock: Griffith micro-cracks under shear grow curved wing cracks that turn parallel
 * to σ1, interact and link into a through-going shear fracture, then gouge and a slip surface.
 * Porous rock: shear produces deformation bands; strain hardening shifts slip to new bands until
 * a band zone forms and a slip surface develops within it.
 */
export function WingCracks() {
  const [load, setLoad] = useState(45);
  const [rock, setRock] = useState<"tight" | "porous">("tight");
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 7000);
      setLoad(Math.round(p * 100));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  // Zone of the future fault: line through the centre at ZONE_ANGLE from vertical.
  const za = (ZONE_ANGLE * Math.PI) / 180;
  const zdir = { x: Math.sin(za), y: Math.cos(za) };
  const cracks = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: 42 }, (_, i) => {
      const near = i < 22; // most cracks cluster along the future fault zone
      const along = (r() - 0.5) * 520;
      const across = near ? (r() - 0.5) * 34 : (r() - 0.5) * 340;
      const cx = W / 2 + zdir.x * along + zdir.y * across;
      const cy = H / 2 + zdir.y * along - zdir.x * across;
      const ang = ((15 + r() * 40) * Math.PI) / 180 * (r() < 0.5 ? 1 : -1);
      return { cx, cy, a: 9 + r() * 9, ang, near };
    });
  }, [zdir.x, zdir.y]);
  const bands = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: 9 }, (_, i) => ({ off: (i - 4) * 9 + (r() - 0.5) * 6, len: 0.55 + r() * 0.45 }));
  }, []);

  const L = load / 100;
  const wing = Math.max(0, (L - 0.15) / 0.55) * 34; // wing-crack length
  const linked = L > 0.72;
  const slip = L > 0.88;
  const stage = rock === "tight"
    ? L < 0.15 ? "Micro-cracks" : !linked ? "Wing cracks growing toward σ1" : !slip ? "Cracks link: shear fracture" : "Gouge & slip surface"
    : L < 0.25 ? "First deformation band" : L < 0.75 ? "Strain hardening → more bands" : "Slip surface in band zone";

  const zoneLine = (len: number) => ({
    x1: W / 2 - zdir.x * len,
    y1: H / 2 - zdir.y * len,
    x2: W / 2 + zdir.x * len,
    y2: H / 2 + zdir.y * len,
  });
  const z = zoneLine(320);

  return (
    <SimFrame
      title="Grow a fault"
      subtitle="From micro-cracks (or deformation bands) to a slip surface"
      controls={
        <>
          <Toggle label="Rock type" value={rock} onChange={setRock} options={[{ value: "tight", label: "Non-porous" }, { value: "porous", label: "Porous sandstone" }]} />
          <button type="button" onClick={() => { setLoad(0); setPlaying(true); }} className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night">
            {playing ? <Pause size={15} /> : <Play size={15} />} Load the rock
          </button>
          <Slider label="Differential stress" value={load} min={0} max={100} onChange={(v) => { setPlaying(false); setLoad(v); }} format={(v) => `${v}%`} />
          <p className="text-sm text-muted">
            {rock === "tight"
              ? "Pre-existing micro-cracks cannot grow in their own plane under shear. Curved wing cracks sprout from their tips, turn parallel to σ1 and link with neighbours."
              : "In porous rock the pores collapse under shear: a deformation band forms, hardens, and slip jumps to a new band beside it — until a band zone hosts a slip surface."}
          </p>
        </>
      }
      readouts={
        <>
          <Readout label="Stage" value={stage} accent />
          <Readout label="σ1 direction" value="vertical" />
          <Readout label="Fault angle to σ1" value={`~${ZONE_ANGLE}°`} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`Rock under load: ${stage}`}>
        <rect width={W} height={H} fill={rock === "tight" ? "#6e7b6a" : "#d7c08a"} />
        {/* grains texture */}
        {rock === "porous" &&
          Array.from({ length: 260 }).map((_, i) => {
            const r = rng(i + 3);
            return <circle key={i} cx={r() * W} cy={r() * H} r={2 + r() * 2.5} fill="#c4a96a" opacity="0.7" />;
          })}
        {/* σ1 arrows */}
        <g fill="#ff3b30">
          {[260, 400, 540].map((x) => (
            <g key={x}>
              <path d={`M ${x - 14} 6 L ${x + 14} 6 L ${x} 30 Z`} />
              <path d={`M ${x - 14} ${H - 6} L ${x + 14} ${H - 6} L ${x} ${H - 30} Z`} />
            </g>
          ))}
        </g>
        <text x="282" y="26" fontSize="15" fill="#fff" fontWeight="700">σ1</text>

        {rock === "tight" &&
          cracks.map((c, i) => {
            const dx = Math.sin(c.ang) * c.a;
            const dy = Math.cos(c.ang) * c.a;
            const tipA = { x: c.cx + dx, y: c.cy + dy };
            const tipB = { x: c.cx - dx, y: c.cy - dy };
            const w = c.near ? wing : wing * 0.55;
            // wings leave each tip sideways, then curve to vertical (parallel to σ1)
            const side = c.ang > 0 ? 1 : -1;
            const wingA = `M ${tipA.x} ${tipA.y} q ${side * w * 0.5} ${w * 0.2} ${side * w * 0.45} ${w}`;
            const wingB = `M ${tipB.x} ${tipB.y} q ${-side * w * 0.5} ${-w * 0.2} ${-side * w * 0.45} ${-w}`;
            return (
              <g key={i}>
                <line x1={tipA.x} y1={tipA.y} x2={tipB.x} y2={tipB.y} stroke="#111" strokeWidth="2.5" />
                {w > 1 && <path d={wingA} stroke="#111" strokeWidth="1.8" fill="none" />}
                {w > 1 && <path d={wingB} stroke="#111" strokeWidth="1.8" fill="none" />}
              </g>
            );
          })}
        {rock === "tight" && linked && (
          <g>
            <line {...z} stroke="#1a1a1a" strokeWidth={slip ? 16 : 5} opacity={slip ? 0.85 : 1} />
            {slip && <line {...z} stroke="#e8dcc4" strokeWidth="2.5" />}
          </g>
        )}

        {rock === "porous" &&
          bands.map((b, i) => {
            const show = L > 0.12 + i * 0.08;
            if (!show) return null;
            const len = 320 * b.len;
            return (
              <line
                key={i}
                x1={W / 2 - zdir.x * len + zdir.y * b.off}
                y1={H / 2 - zdir.y * len - zdir.x * b.off}
                x2={W / 2 + zdir.x * len + zdir.y * b.off}
                y2={H / 2 + zdir.y * len - zdir.x * b.off}
                stroke="#6b5a3a"
                strokeWidth="3"
                opacity="0.9"
              />
            );
          })}
        {rock === "porous" && L > 0.8 && <line {...z} stroke="#2b2b2b" strokeWidth="4" />}
        {(linked || (rock === "porous" && L > 0.8)) && (
          <g fill="#fff">
            <path d={`M ${z.x1 + 40} ${z.y1 + 40} l 30 50 l -12 -4 Z`} />
          </g>
        )}
      </svg>
      <Verdict tone={slip || (rock === "porous" && L > 0.8) ? "clay" : "moss"}>{stage}</Verdict>
    </SimFrame>
  );
}

export default WingCracks;
