import { useEffect, useMemo, useRef, useState } from "react";
import { BoxGeometry, Plane, Vector3 } from "three";
import { Html, Line } from "@react-three/drei";
import { Pause, Play } from "lucide-react";
import { Readout, SimFrame, Slider, Verdict } from "@/components/sim-ui";
import { attitudeVectors, azimuthNotation } from "@/geo/attitude";
import { makeStrataMaterial } from "./strataMaterial";
import { Viewport } from "./Viewport";

const B = 3;
type V3 = [number, number, number];

/** Fault classification from rake (−180…180, measured in the fault plane from the strike direction). */
export function faultFromRake(rake: number) {
  const r = ((rake + 540) % 360) - 180;
  const a = Math.abs(r);
  const ss = a < 20 || a > 160;
  const ds = a > 70 && a < 110;
  const sense = a < 90 ? "sinistral" : "dextral"; // HW moving along +strike is left as seen from the footwall
  const vert = r > 0 ? "normal" : "reverse";
  if (ss) return { kind: `${sense} strike-slip`, tone: "sand" as const };
  if (ds) return { kind: `${vert} (dip-slip)`, tone: vert === "normal" ? ("moss" as const) : ("clay" as const) };
  return { kind: `oblique: ${vert} + ${sense}`, tone: "sand" as const };
}

function Tag({ p, children, c = "#fff" }: { p: V3; children: React.ReactNode; c?: string }) {
  return (
    <Html position={p} center zIndexRange={[10, 0]}>
      <span className="pointer-events-none whitespace-nowrap rounded-full bg-black/65 px-2.5 py-0.5 font-display text-sm uppercase tracking-wide" style={{ color: c }}>
        {children}
      </span>
    </Html>
  );
}

function Scene({ strike, dip, rake, slip }: { strike: number; dip: number; rake: number; slip: number }) {
  const v = attitudeVectors(strike, dip);
  const n = new Vector3(...v.normal);
  const s = new Vector3(...v.strikeVec);
  const down = new Vector3(...v.downDip);
  const r = (rake * Math.PI) / 180;
  const slipVec = s.clone().multiplyScalar(Math.cos(r)).addScaledVector(down, Math.sin(r)).multiplyScalar(slip);

  // Beds strike E–W and dip 22° S, so both dip-slip and strike-slip offsets are visible.
  const bedNormal: V3 = [0, Math.cos(0.384), Math.sin(0.384)];
  const fwPlane = useMemo(() => new Plane(), []);
  const hwPlane = useMemo(() => new Plane(), []);
  const fwMat = useMemo(() => makeStrataMaterial({ normal: bedNormal, thickness: 0.5 }, [fwPlane]), [fwPlane]); // eslint-disable-line react-hooks/exhaustive-deps
  const hwMat = useMemo(() => makeStrataMaterial({ normal: bedNormal, thickness: 0.5 }, [hwPlane]), [hwPlane]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Footwall keeps n·p ≤ 0 (below the fault through the origin); hanging wall keeps n·p ≥ 0, then moves.
    fwPlane.set(n.clone().negate(), 0);
    hwPlane.set(n.clone(), 0).translate(slipVec);
    // The moved hanging wall must still show its ORIGINAL beds: shift the pattern with it.
    hwMat.uniforms.uOffset.value = -(bedNormal[0] * slipVec.x + bedNormal[1] * slipVec.y + bedNormal[2] * slipVec.z);
  });

  const box = useMemo(() => new BoxGeometry(2 * B, 2 * B, 2 * B), []);
  const mid = slipVec.clone().multiplyScalar(0.5);
  const arrowStart = new Vector3(0, 0.6, 0).addScaledVector(n, 0.08);
  return (
    <group>
      <mesh geometry={box} material={fwMat} />
      <mesh geometry={box} material={hwMat} position={slipVec} />
      {/* fault plane */}
      <mesh
        quaternion={undefined}
        onUpdate={(m) => {
          m.lookAt(n.clone());
        }}
        key={`${strike}-${dip}`}
      >
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} side={2} depthWrite={false} clippingPlanes={[new Plane(new Vector3(0, -1, 0), B), new Plane(new Vector3(0, 1, 0), B)]} />
      </mesh>
      {Math.abs(slip) > 0.05 && (
        <Line points={[arrowStart.toArray() as V3, arrowStart.clone().add(slipVec).toArray() as V3]} color="#ff3b30" lineWidth={6} />
      )}
      <Tag p={[mid.x + n.x * 2.2, B + 0.6, mid.z + n.z * 2.2]} c="#ffd9a0">Hanging wall</Tag>
      <Tag p={[-n.x * 2.4, B + 0.6, -n.z * 2.4]} c="#d6efc0">Footwall</Tag>
      <Tag p={[0, B + 1.1, -B - 0.6]} c="#e8dcc4">N</Tag>
    </group>
  );
}

/**
 * Sim — Faults in 3D. Choose the fault plane (strike, dip) and the slip direction (rake);
 * the hanging wall slides along it, offsetting dipping marker beds.
 */
export function Fault3D() {
  const [strike, setStrike] = useState(0);
  const [dip, setDip] = useState(60);
  const [rake, setRake] = useState(90);
  const [slip, setSlip] = useState(1.2);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      setSlip(1.4 * (0.5 - 0.5 * Math.cos((now - t0) / 900)));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);
  const f = faultFromRake(rake);
  const r = (rake * Math.PI) / 180;

  return (
    <SimFrame
      title="Faults in 3D"
      subtitle="Fault plane + rake = the full fault"
      controls={
        <>
          <button type="button" onClick={() => setPlaying((p) => !p)} className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night">
            {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Animate slip"}
          </button>
          <Slider label="Fault strike" value={strike} min={0} max={359} onChange={setStrike} format={(v) => `${String(v).padStart(3, "0")}°`} />
          <Slider label="Fault dip" value={dip} min={15} max={90} onChange={setDip} format={(v) => `${v}°`} />
          <Slider label="Rake of slip" value={rake} min={-180} max={180} step={5} onChange={setRake} format={(v) => `${v}°`} hint="90 = normal · −90 = reverse · 0 / ±180 = strike-slip" />
          <Slider label="Slip" value={Math.round(slip * 100)} min={0} max={160} onChange={(v) => { setPlaying(false); setSlip(v / 100); }} format={(v) => `${v * 2} m`} />
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              ["Normal", 90, 60],
              ["Reverse", -90, 45],
              ["Thrust", -90, 25],
              ["Dextral", 180, 90],
              ["Sinistral", 0, 90],
              ["Oblique", 135, 60],
            ].map(([l, rk, dp]) => (
              <button key={l as string} type="button" onClick={() => { setRake(rk as number); setDip(dp as number); }} className="rounded-lg border border-line px-2 py-1.5 hover:border-lichen/60">
                {l}
              </button>
            ))}
          </div>
        </>
      }
      readouts={
        <>
          <Readout label="Fault type" value={f.kind} accent />
          <Readout label="Fault plane" value={azimuthNotation(strike, dip)} />
          <Readout label="Dip-slip component" value={`${Math.abs(slip * Math.sin(r) * 200).toFixed(0)} m`} />
          <Readout label="Strike-slip component" value={`${Math.abs(slip * Math.cos(r) * 200).toFixed(0)} m`} />
        </>
      }
    >
      <Viewport camera={[9, 7, 10]}>
        <Scene strike={strike} dip={dip} rake={rake} slip={slip} />
      </Viewport>
      <Verdict tone={f.tone}>{f.kind}</Verdict>
    </SimFrame>
  );
}

export default Fault3D;
