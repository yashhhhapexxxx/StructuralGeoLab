import { useMemo, useState } from "react";
import { BoxGeometry, BufferGeometry, Plane, Vector3 } from "three";
import { Html, Line } from "@react-three/drei";
import { Checkbox, Readout, SimFrame, Slider, Verdict } from "@/components/sim-ui";
import { attitudeVectors, azimuthNotation, contourSpacing } from "@/geo/attitude";
import { Viewport } from "./Viewport";

const B = 3; // half-size; box spans 0–600 m vertically (100 m per unit)
const M = 100; // metres per scene unit

const planesFor = () => [
  new Plane(new Vector3(1, 0, 0), B),
  new Plane(new Vector3(-1, 0, 0), B),
  new Plane(new Vector3(0, 1, 0), B + 0.001),
  new Plane(new Vector3(0, -1, 0), B + 0.001),
  new Plane(new Vector3(0, 0, 1), B),
  new Plane(new Vector3(0, 0, -1), B),
];
type V3 = [number, number, number];

function Tag({ p, children, c = "#fff" }: { p: V3; children: React.ReactNode; c?: string }) {
  return (
    <Html position={p} center zIndexRange={[10, 0]}>
      <span className="pointer-events-none whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-xs font-semibold" style={{ color: c }}>
        {children}
      </span>
    </Html>
  );
}

function Scene({ strike, dip, interval, slices }: { strike: number; dip: number; interval: number; slices: boolean }) {
  const planes = useMemo(planesFor, []);
  const v = attitudeVectors(strike, dip);
  const s = new Vector3(...v.strikeVec);
  const dd = new Vector3(...v.dipDirVec);
  const down = new Vector3(...v.downDip);
  const tan = Math.tan((Math.max(dip, 0.5) * Math.PI) / 180);

  const quad = useMemo(() => {
    const a = 12;
    const c = new Vector3(0, 0, 0);
    const p = [
      c.clone().addScaledVector(s, -a).addScaledVector(down, -a),
      c.clone().addScaledVector(s, a).addScaledVector(down, -a),
      c.clone().addScaledVector(s, a).addScaledVector(down, a),
      c.clone().addScaledVector(s, -a).addScaledVector(down, a),
    ];
    const g = new BufferGeometry().setFromPoints([p[0], p[1], p[2], p[0], p[2], p[3]]);
    g.computeVertexNormals();
    return g;
  }, [strike, dip]); // eslint-disable-line react-hooks/exhaustive-deps

  const levels: number[] = [];
  for (let h = interval; h < 2 * B * M; h += interval) levels.push(h);

  return (
    <group>
      <lineSegments>
        <edgesGeometry args={[new BoxGeometry(2 * B, 2 * B, 2 * B)]} />
        <lineBasicMaterial color="#e8dcc4" transparent opacity={0.55} />
      </lineSegments>
      {/* ground surface (map) */}
      <mesh position={[0, B, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2 * B, 2 * B]} />
        <meshBasicMaterial color="#e3c78a" transparent opacity={0.22} side={2} depthWrite={false} />
      </mesh>
      {/* the inclined plane */}
      <mesh geometry={quad}>
        <meshBasicMaterial color="#ff8a8a" transparent opacity={0.42} side={2} depthWrite={false} clippingPlanes={planes} />
      </mesh>

      {levels.map((h) => {
        const y = h / M - B;
        const u = -y / tan; // horizontal distance down-dip from the origin
        const p = dd.clone().multiplyScalar(u).setY(y);
        const pts: V3[] = [p.clone().addScaledVector(s, -12).toArray() as V3, p.clone().addScaledVector(s, 12).toArray() as V3];
        const top: V3[] = pts.map((q) => [q[0], B + 0.01, q[2]] as V3);
        const inside = Math.abs(p.x) < B + 2 && Math.abs(p.z) < B + 2;
        return (
          <group key={h}>
            {slices && (
              <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2 * B, 2 * B]} />
                <meshBasicMaterial color="#5aa7c7" transparent opacity={0.07} side={2} depthWrite={false} />
              </mesh>
            )}
            {/* strike line = stratum contour on the plane */}
            <Line points={pts} color="#ff4d4d" lineWidth={3.5} clippingPlanes={planes} />
            {/* projected onto the map */}
            <Line points={top} color="#ff4d4d" lineWidth={2} dashed dashSize={0.15} gapSize={0.1} clippingPlanes={planes} />
            {inside && <Tag p={[p.x + s.x * 0, y + 0.18, p.z]} c="#ffb3b3">{h} m</Tag>}
          </group>
        );
      })}
      <Tag p={[0, B + 0.45, -B - 0.4]} c="#e8dcc4">N ↑ (map surface)</Tag>
    </group>
  );
}

/** 2D map view of the same contours (top face of the block). */
function MapPanel({ strike, dip, interval }: { strike: number; dip: number; interval: number }) {
  const v = attitudeVectors(strike, dip);
  const S = 26; // px per scene unit
  const tan = Math.tan((Math.max(dip, 0.5) * Math.PI) / 180);
  const lv: number[] = [];
  for (let h = interval; h < 2 * B * M; h += interval) lv.push(h);
  return (
    <svg viewBox={`${-B * S - 6} ${-B * S - 6} ${2 * B * S + 12} ${2 * B * S + 12}`} className="w-full" aria-label="Map view of the structure contours">
      <defs>
        <clipPath id="sc-map"><rect x={-B * S} y={-B * S} width={2 * B * S} height={2 * B * S} /></clipPath>
      </defs>
      <rect x={-B * S} y={-B * S} width={2 * B * S} height={2 * B * S} fill="#1a221c" stroke="#e8dcc4" strokeOpacity="0.4" />
      <g clipPath="url(#sc-map)">
        {lv.map((h) => {
          const y = h / M - B;
          const u = -y / tan;
          const px = v.dipDirVec[0] * u * S;
          const pz = v.dipDirVec[2] * u * S;
          const sx = v.strikeVec[0] * 300;
          const sz = v.strikeVec[2] * 300;
          return (
            <g key={h}>
              <line x1={px - sx} y1={pz - sz} x2={px + sx} y2={pz + sz} stroke="#ff4d4d" strokeWidth="2" />
              <text x={px + v.dipDirVec[0] * 3 + 4} y={pz + v.dipDirVec[2] * 3 - 3} fontSize="9" fill="#ffb3b3">{h}</text>
            </g>
          );
        })}
      </g>
      <text x={-B * S + 4} y={-B * S + 12} fontSize="10" fill="#e8dcc4">N ↑</text>
    </svg>
  );
}

/**
 * Sim — Structure contours & strike lines. Slice an inclined plane with horizontal planes
 * every Δh: each intersection is a strike line (stratum contour). On the map their spacing is
 * Δh / tan δ — steep planes crowd them together, gentle planes spread them out.
 */
export function StructureContours3D() {
  const [strike, setStrike] = useState(90);
  const [dip, setDip] = useState(30);
  const [interval, setInterval] = useState(100);
  const [slices, setSlices] = useState(true);
  const spacing = contourSpacing(interval, dip);

  return (
    <SimFrame
      title="Structure contours"
      subtitle="Slice a dipping plane every 100 m — read the map"
      controls={
        <>
          <Slider label="Dip" value={dip} min={5} max={85} onChange={setDip} format={(v) => `${v}°`} />
          <Slider label="Strike" value={strike} min={0} max={179} onChange={setStrike} format={(v) => `${String(v).padStart(3, "0")}°`} />
          <Slider label="Contour interval Δh" value={interval} min={50} max={200} step={50} onChange={setInterval} format={(v) => `${v} m`} />
          <Checkbox label="Show horizontal slices" checked={slices} onChange={setSlices} />
          <div className="rounded-2xl border border-line p-3">
            <p className="mb-1 font-display text-xs uppercase tracking-[0.2em] text-lichen">Map view</p>
            <MapPanel strike={strike} dip={dip} interval={interval} />
          </div>
        </>
      }
      readouts={
        <>
          <Readout label="Map spacing" value={`${spacing.toFixed(0)} m`} accent />
          <Readout label="Formula" value="Δh / tan δ" />
          <Readout label="Attitude" value={azimuthNotation(strike, dip)} />
        </>
      }
    >
      <Viewport camera={[9, 6, 8]}>
        <Scene strike={strike} dip={dip} interval={interval} slices={slices} />
      </Viewport>
      <Verdict>{`Spacing ${spacing.toFixed(0)} m`}</Verdict>
    </SimFrame>
  );
}

export default StructureContours3D;
