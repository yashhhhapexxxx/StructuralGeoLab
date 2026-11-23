import { useEffect, useMemo, useState } from "react";
import { BoxGeometry, BufferGeometry, Plane, Vector3, type ShaderMaterial } from "three";
import { Html, Line } from "@react-three/drei";
import { Checkbox, Readout, SimFrame, Slider, Verdict } from "@/components/sim-ui";
import {
  apparentDip,
  attitudeVectors,
  azimuthNotation,
  compass8,
  dipDirection,
  quadrantNotation,
} from "@/geo/attitude";
import { makeStrataMaterial, updateStrata } from "./strataMaterial";
import { Viewport } from "./Viewport";

const B = 3; // half-size of the rock block (scene units)
const WATER = 1.2; // height of the horizontal "water level" plane

const boxPlanes = () => [
  new Plane(new Vector3(1, 0, 0), B),
  new Plane(new Vector3(-1, 0, 0), B),
  new Plane(new Vector3(0, 1, 0), B),
  new Plane(new Vector3(0, -1, 0), B),
  new Plane(new Vector3(0, 0, 1), B),
  new Plane(new Vector3(0, 0, -1), B),
];

function Label({ p, children, tone = "#fff", show = true }: { p: [number, number, number]; children: React.ReactNode; tone?: string; show?: boolean }) {
  return (
    <Html position={p} center zIndexRange={[10, 0]} style={{ display: show ? "block" : "none" }}>
      <span className="pointer-events-none whitespace-nowrap rounded-full bg-black/60 px-2 py-0.5 font-display text-sm uppercase tracking-wide" style={{ color: tone }}>
        {children}
      </span>
    </Html>
  );
}

/** Points of a line through `c` with direction `d`, long enough to be clipped by the block. */
const lineThrough = (c: Vector3, d: Vector3, L = 9): [number, number, number][] => [
  c.clone().addScaledVector(d, -L).toArray() as [number, number, number],
  c.clone().addScaledVector(d, L).toArray() as [number, number, number],
];

function Scene({ strike, dip, section, showSection }: { strike: number; dip: number; section: number; showSection: boolean }) {
  const v = attitudeVectors(strike, dip);
  const n = new Vector3(...v.normal);
  const s = new Vector3(...v.strikeVec);
  const dd = new Vector3(...v.dipDirVec);
  const down = new Vector3(...v.downDip);
  const planes = useMemo(boxPlanes, []);
  // Cut-away: the rock ABOVE the key bedding surface is removed, exposing the bed's top.
  const cut = useMemo(() => new Plane(new Vector3(0, -1, 0), WATER), []);
  const material = useMemo(() => makeStrataMaterial({ normal: v.normal as [number, number, number], thickness: 0.55, offset: 0 }, [cut]), [cut]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    updateStrata(material, { normal: v.normal as [number, number, number], offset: -v.normal[1] * WATER + 0.001 });
    // keep points with n·p ≤ n·K (below the key bed surface through K = (0, WATER, 0))
    cut.normal.set(-v.normal[0], -v.normal[1], -v.normal[2]);
    cut.constant = v.normal[1] * WATER;
  }, [material, cut, v.normal]);

  // Key bedding surface passes through point K on the water plane.
  const K = new Vector3(0, WATER, 0);
  const lift = n.clone().multiplyScalar(0.035); // draw annotations just above the exposed surface
  const KL = K.clone().add(lift);
  // Bedding plane as a big quad (clipped to block)
  const quad = useMemo(() => {
    const g = new BufferGeometry();
    const a = 8;
    const pts = [
      K.clone().addScaledVector(s, -a).addScaledVector(down, -a),
      K.clone().addScaledVector(s, a).addScaledVector(down, -a),
      K.clone().addScaledVector(s, a).addScaledVector(down, a),
      K.clone().addScaledVector(s, -a).addScaledVector(down, a),
    ];
    g.setFromPoints([pts[0], pts[1], pts[2], pts[0], pts[2], pts[3]]);
    g.computeVertexNormals();
    return g;
  }, [strike, dip]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dip arrow: from K, 1.8 units down-dip; its horizontal projection on the water plane
  const dipEnd = KL.clone().addScaledVector(down, 1.9);
  const dipProj = K.clone().addScaledVector(dd, 1.9 * Math.cos((dip * Math.PI) / 180));

  // Apparent-dip section: vertical plane through K along azimuth `section`
  const secDir = new Vector3(Math.sin((section * Math.PI) / 180), 0, -Math.cos((section * Math.PI) / 180));
  const secNormal = new Vector3(secDir.z * -1, 0, secDir.x); // horizontal ⟂ section
  const traceDir = new Vector3().crossVectors(n, secNormal).normalize();
  if (traceDir.y > 0) traceDir.negate();

  return (
    <group>
      {/* rock block with dipping beds painted on its faces */}
      <mesh material={material as ShaderMaterial}>
        <boxGeometry args={[2 * B, 2 * B, 2 * B]} />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new BoxGeometry(2 * B, 2 * B, 2 * B)]} />
        <lineBasicMaterial color="#0b0f0c" />
      </lineSegments>

      {/* water level (horizontal reference plane) */}
      <mesh position={[0, WATER, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2 * B + 0.02, 2 * B + 0.02]} />
        <meshBasicMaterial color="#3f9fd0" transparent opacity={0.42} depthWrite={false} />
      </mesh>

      {/* bedding plane */}
      <mesh geometry={quad}>
        <meshStandardMaterial color="#d98a4f" roughness={0.9} side={2} clippingPlanes={planes} polygonOffset polygonOffsetFactor={-1} />
      </mesh>

      {/* strike line = bedding ∩ horizontal */}
      <Line points={lineThrough(KL, s)} color="#7fd4ff" lineWidth={6} clippingPlanes={planes} />
      <Label p={K.clone().addScaledVector(s, 2.4).add(new Vector3(0, 0.35, 0)).toArray() as [number, number, number]} tone="#8fd3ee">
        Strike
      </Label>

      {/* dip arrow + horizontal projection + angle */}
      <Line points={[KL.toArray() as [number, number, number], dipEnd.toArray() as [number, number, number]]} color="#ff3b30" lineWidth={7} />
      <mesh position={dipEnd}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color="#ff5a4e" />
      </mesh>
      <Line points={[K.toArray() as [number, number, number], dipProj.toArray() as [number, number, number]]} color="#ffffff" lineWidth={2} dashed dashSize={0.12} gapSize={0.08} />
      <Line points={[dipProj.toArray() as [number, number, number], dipEnd.toArray() as [number, number, number]]} color="#ffffff" lineWidth={1.5} dashed dashSize={0.08} gapSize={0.08} />
      <Label p={K.clone().addScaledVector(dd, 0.9).addScaledVector(down, 0.3).add(new Vector3(0, 0.25, 0)).toArray() as [number, number, number]} tone="#ff8b80">
        Dip {Math.round(dip)}°
      </Label>

      {/* compass on top of the block */}
      <group position={[0, B + 0.01, 0]}>
        <Label p={[0, 0.2, -B - 0.5]} tone="#e8dcc4">N</Label>
        <Label p={[B + 0.5, 0.2, 0]} tone="#e8dcc4">E</Label>
        <Label p={[0, 0.2, B + 0.5]} tone="#e8dcc4">S</Label>
        <Label p={[-B - 0.5, 0.2, 0]} tone="#e8dcc4">W</Label>
      </group>

      <Label show={showSection} p={K.clone().addScaledVector(traceDir, 2).add(new Vector3(0, -0.35, 0)).toArray() as [number, number, number]} tone="#e8dcc4">
        Apparent dip {apparentDip(strike, dip, section).toFixed(0)}°
      </Label>
      {showSection && (
        <group>
          <mesh rotation={[0, Math.PI / 2 - (section * Math.PI) / 180, 0]}>
            <planeGeometry args={[14, 14]} />
            <meshBasicMaterial color="#e8dcc4" transparent opacity={0.16} side={2} depthWrite={false} clippingPlanes={planes} />
          </mesh>
          <Line points={lineThrough(K, traceDir)} color="#e8dcc4" lineWidth={4} clippingPlanes={planes} />
        </group>
      )}
    </group>
  );
}

/**
 * Sim — Strike & dip in 3D. A block of dipping beds; the horizontal water plane cuts the bedding
 * along the strike line; the steepest line down the bed (⟂ strike) gives the dip.
 */
export function StrikeDip3D() {
  const [strike, setStrike] = useState(30);
  const [dip, setDip] = useState(35);
  const [section, setSection] = useState(90);
  const [showSection, setShowSection] = useState(false);
  const dd = dipDirection(strike);

  return (
    <SimFrame
      title="Strike & dip in 3D"
      subtitle="Strike = where the bed meets a horizontal plane · dip = steepest slope down it"
      controls={
        <>
          <Slider label="Strike (azimuth)" value={strike} min={0} max={359} onChange={setStrike} format={(v) => `${String(v).padStart(3, "0")}°`} />
          <Slider label="Dip" value={dip} min={0} max={90} onChange={setDip} format={(v) => `${v}°`} />
          <Checkbox label="Vertical section (apparent dip)" checked={showSection} onChange={setShowSection} />
          {showSection && <Slider label="Section azimuth" value={section} min={0} max={179} onChange={setSection} format={(v) => `${String(v).padStart(3, "0")}°`} />}
          {/* Map symbol */}
          <div className="flex items-center gap-4 rounded-2xl border border-line p-3">
            <svg viewBox="-40 -40 80 80" className="size-20 shrink-0" aria-label="Map symbol for strike and dip">
              <circle r="38" fill="none" stroke="#ffffff22" />
              <text y="-27" textAnchor="middle" fontSize="11" fill="#e8dcc4">N</text>
              <g transform={`rotate(${strike})`}>
                <line y1="22" y2="-22" stroke="#fff" strokeWidth="3" />
                <line x1="0" x2="10" y1="0" y2="0" stroke="#fff" strokeWidth="3" />
              </g>
              <text x={Math.sin((dd * Math.PI) / 180) * 26} y={-Math.cos((dd * Math.PI) / 180) * 26 + 4} textAnchor="middle" fontSize="12" fill="#ff8b80">
                {dip}
              </text>
            </svg>
            <p className="text-sm text-muted">Map symbol: long bar along <b className="text-ink">strike</b>, short tick toward the <b className="text-ink">dip direction</b>, number = dip.</p>
          </div>
        </>
      }
      readouts={
        <>
          <Readout label="Quadrant" value={quadrantNotation(strike, dip)} accent />
          <Readout label="Azimuth (RHR)" value={azimuthNotation(strike, dip)} />
          <Readout label="Dip direction" value={`${String(Math.round(dd)).padStart(3, "0")}° (${compass8(dd)})`} />
          {showSection && <Readout label="Apparent dip" value={`${apparentDip(strike, dip, section).toFixed(1)}°`} />}
        </>
      }
    >
      <Viewport camera={[8, 6.5, 9]}>
        <Scene strike={strike} dip={dip} section={section} showSection={showSection} />
      </Viewport>
      <Verdict>{azimuthNotation(strike, dip)}</Verdict>
    </SimFrame>
  );
}

export default StrikeDip3D;
