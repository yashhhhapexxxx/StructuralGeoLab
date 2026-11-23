import { useEffect, useMemo, useRef, useState } from "react";
import { BoxGeometry, BufferGeometry, Plane, Vector3 } from "three";
import { Html, Line } from "@react-three/drei";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Checkbox, Readout, SimFrame, Slider, Toggle, Verdict } from "@/components/sim-ui";
import { axialOrientation, foldName, interlimbClass } from "@/geo/folds";
import { BED_COLORS } from "@/geo/beds";
import { makeFoldMaterial, updateFold, type FoldUniforms } from "./foldMaterial";
import { Viewport } from "./Viewport";

const HX = 4.5; // half-width (x, across the fold)
const HZ = 3; // half-depth (z, along the hinge)
const BOTTOM = -3;
const FULL_TOP = 4.2;
const T = 0.62; // bed thickness
const BEDS = 9;
const KEY = 4; // bed whose top surface carries the labels
const rad = (d: number) => (d * Math.PI) / 180;

type Shape = "antiform" | "synform";
type V3 = [number, number, number];

/** HTML labels stay mounted and are hidden with CSS — unmounting drei <Html> mid-update crashes React 19. */
function Tag({ p, children, c = "#fff", show = true }: { p: V3; children: React.ReactNode; c?: string; show?: boolean }) {
  return (
    <Html position={p} center zIndexRange={[10, 0]} style={{ display: show ? "block" : "none" }}>
      <span className="pointer-events-none whitespace-nowrap rounded-full bg-black/65 px-2.5 py-0.5 font-display text-sm uppercase tracking-wide" style={{ color: c }}>
        {children}
      </span>
    </Html>
  );
}

function Scene({ u, top, labels, squeeze }: { u: FoldUniforms; top: number; labels: boolean; squeeze: number }) {
  // Clip everything to the (eroded) block.
  const planes = useMemo(
    () => [
      new Plane(new Vector3(1, 0, 0), HX),
      new Plane(new Vector3(-1, 0, 0), HX),
      new Plane(new Vector3(0, 0, 1), HZ),
      new Plane(new Vector3(0, 0, -1), HZ),
      new Plane(new Vector3(0, 1, 0), -BOTTOM),
      new Plane(new Vector3(0, -1, 0), FULL_TOP),
    ],
    [],
  );
  useEffect(() => {
    planes[5].constant = top;
  }, [planes, top]);

  const mat = useMemo(() => makeFoldMaterial(u), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => updateFold(mat, u), [mat, u]);

  const h = top - BOTTOM;
  const edges = useMemo(() => new BoxGeometry(2 * HX, h, 2 * HZ), [h]);

  // Key bed top surface: y = base + (KEY+1)·T + f(x′, z)
  const keyY = u.base + (KEY + 1) * T;
  const crestX = 0; // central hinge (crest of the arch, or bottom of the trough)
  const hingeLine: V3[] = [];
  for (let z = -HZ; z <= HZ + 0.001; z += 0.25) {
    const y = keyY + u.sign * u.amp - z * u.tanPlunge;
    hingeLine.push([crestX + y * u.tanTilt, y + 0.03, z]);
  }
  // Axial surface: x = x0 + y·tan(tilt)
  const axial: V3[] = [
    [crestX + BOTTOM * u.tanTilt, BOTTOM, -HZ],
    [crestX + FULL_TOP * u.tanTilt, FULL_TOP, -HZ],
    [crestX + FULL_TOP * u.tanTilt, FULL_TOP, HZ],
    [crestX + BOTTOM * u.tanTilt, BOTTOM, HZ],
  ];
  const limbX = [crestX - u.lambda / 4, crestX + u.lambda / 4];
  const pt = (x: number, z: number): V3 => {
    const y = keyY + u.sign * u.amp * Math.cos((2 * Math.PI * x) / u.lambda) - z * u.tanPlunge;
    return [x + y * u.tanTilt, y + 0.35, z];
  };

  return (
    <group>
      {/* rock block, eroded down to `top` */}
      <mesh position={[0, (top + BOTTOM) / 2, 0]} material={mat}>
        <boxGeometry args={[2 * HX, h, 2 * HZ]} />
      </mesh>
      <lineSegments position={[0, (top + BOTTOM) / 2, 0]}>
        <edgesGeometry args={[edges]} />
        <lineBasicMaterial color="#0b0f0c" />
      </lineSegments>
      {/* outline of the eroded rock */}
      {top < FULL_TOP - 0.05 && (
        <lineSegments position={[0, (FULL_TOP + top) / 2, 0]}>
          <edgesGeometry args={[new BoxGeometry(2 * HX, FULL_TOP - top, 2 * HZ)]} />
          <lineBasicMaterial color="#e8dcc4" transparent opacity={0.3} />
        </lineSegments>
      )}

      {/* squeeze arrows */}
      {squeeze > 0 && squeeze < 1 && (
        <group>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (HX + 0.9), 0.5, 0]} rotation={[0, 0, (s * Math.PI) / 2]}>
              <coneGeometry args={[0.35, 0.9, 20]} />
              <meshBasicMaterial color="#c8703f" />
            </mesh>
          ))}
        </group>
      )}

      {labels && u.amp > 0.15 && (
        <group>
          <mesh geometry={new BufferGeometry().setFromPoints([0, 1, 2, 0, 2, 3].map((i) => new Vector3(...axial[i])))}>
            <meshBasicMaterial color="#b5d98a" transparent opacity={0.22} side={2} depthWrite={false} clippingPlanes={planes} />
          </mesh>
          <Line points={hingeLine} color="#ffffff" lineWidth={5} clippingPlanes={planes} />
        </group>
      )}
      <Tag show={labels && u.amp > 0.15} p={[hingeLine[0][0], hingeLine[0][1] + 0.5, -HZ]} c="#ffffff">
        Hinge line
      </Tag>
      <Tag show={labels && u.amp > 0.15} p={[crestX + 0.6 * u.tanTilt, 0.6, HZ + 0.05]} c="#b5d98a">
        Axial plane
      </Tag>
      {limbX.map((x, i) => (
        <Tag key={i} show={labels && u.amp > 0.15} p={pt(x, HZ - 0.3)} c="#e8dcc4">
          Limb
        </Tag>
      ))}
    </group>
  );
}

/**
 * Sim — Fold anatomy in 3D. Squeeze flat-lying beds into a fold, label its parts, tilt and
 * plunge it, then erode the block to see the map pattern on the top surface.
 */
export function FoldBlock3D() {
  const [shape, setShape] = useState<Shape>("antiform");
  const [overturned, setOverturned] = useState(false);
  const [ampTarget, setAmpTarget] = useState(1.5);
  const [lambda, setLambda] = useState(6.5);
  const [tilt, setTilt] = useState(0);
  const [plunge, setPlunge] = useState(0);
  const [erosion, setErosion] = useState(0);
  const [labels, setLabels] = useState(true);
  const [view, setView] = useState<"3d" | "map">("3d");
  const [squeeze, setSqueeze] = useState(1); // 0 = flat, 1 = fully folded
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 2600);
      setSqueeze(1 - Math.pow(1 - p, 3));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const amp = ampTarget * squeeze;
  const lam = lambda * (1.35 - 0.35 * squeeze); // shortening squeezes the wavelength too
  const u: FoldUniforms = useMemo(
    () => ({
      amp,
      lambda: lam,
      sign: shape === "antiform" ? 1 : -1,
      tanTilt: Math.tan(rad(tilt)),
      tanPlunge: Math.tan(rad(plunge)),
      thick: T,
      base: BOTTOM - 1.2,
    }),
    [amp, lam, shape, tilt, plunge],
  );
  const top = FULL_TOP - erosion;

  const name = amp < 0.1 ? "Flat-lying beds" : foldName(shape, overturned);
  const maxLimbDip = (Math.atan((amp * 2 * Math.PI) / lam) * 180) / Math.PI;
  const interlimb = 180 - 2 * maxLimbDip;
  const coreOldest = (shape === "antiform") !== overturned;
  const ages = Array.from({ length: BEDS }, (_, k) => (overturned ? BEDS - k : k + 1)); // bed k → age rank (1 = oldest)

  let mapText = "erode to see it";
  if (erosion > 0.3 && amp > 0.1) {
    const centre = coreOldest ? "older" : "younger";
    mapText = plunge > 2 ? `V / nose pattern, ${centre} beds in the core, closing toward the ${shape === "antiform" ? "plunge" : "opposite"} direction` : `parallel bands, symmetric about the axial trace, ${centre} in the middle`;
  }

  return (
    <SimFrame
      title="Fold anatomy in 3D"
      subtitle="Squeeze the layers · read the parts · erode to see the map"
      controls={
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSqueeze(0);
                setPlaying(true);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night"
            >
              {playing ? <Pause size={15} /> : <Play size={15} />} Squeeze the layers
            </button>
            <button type="button" onClick={() => { setPlaying(false); setSqueeze(0); }} className="rounded-full border border-line px-3 py-2" aria-label="Flatten">
              <RotateCcw size={15} />
            </button>
          </div>
          <Toggle label="View" value={view} onChange={setView} options={[{ value: "3d", label: "3D block" }, { value: "map", label: "Map (top)" }]} />
          <Toggle label="Fold shape" value={shape} onChange={setShape} options={[{ value: "antiform", label: "Arch" }, { value: "synform", label: "Trough" }]} />
          <Toggle label="Stratigraphy" value={overturned ? "o" : "n"} onChange={(v) => setOverturned(v === "o")} options={[{ value: "n", label: "Youngest on top" }, { value: "o", label: "Overturned" }]} />
          <Slider label="Amplitude" value={ampTarget} min={0.3} max={2.6} step={0.05} onChange={setAmpTarget} format={(v) => v.toFixed(1)} />
          <Slider label="Wavelength" value={lambda} min={4} max={10} step={0.1} onChange={setLambda} format={(v) => v.toFixed(1)} />
          <Slider label="Axial-plane tilt" value={tilt} min={-40} max={40} onChange={setTilt} format={(v) => (v === 0 ? "upright" : `${Math.abs(v)}°`)} />
          <Slider label="Plunge of the hinge" value={plunge} min={0} max={25} onChange={setPlunge} format={(v) => (v === 0 ? "horizontal" : `${v}°`)} />
          <Slider label="Erosion" value={erosion} min={0} max={4.5} step={0.05} onChange={setErosion} format={(v) => `${Math.round(v * 100)} m`} hint="Cut the block down — the top face is the geological map" />
          <Checkbox label="Labels (hinge line, axial plane, limbs)" checked={labels} onChange={setLabels} />
          <div className="rounded-2xl border border-line p-3">
            <p className="mb-2 font-display text-xs uppercase tracking-[0.2em] text-lichen">Bed ages</p>
            <div className="flex flex-col-reverse gap-1">
              {ages.map((a, k) => (
                <div key={k} className="flex items-center gap-2 text-sm">
                  <span className="h-3.5 w-8 rounded" style={{ background: BED_COLORS[k % BED_COLORS.length] }} />
                  <span className="text-ink/85">{a === 1 ? "1 · oldest" : a === BEDS ? `${a} · youngest` : a}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      }
      readouts={
        <>
          <Readout label="Name" value={name} accent />
          <Readout label="Core rocks" value={amp < 0.1 ? "—" : coreOldest ? "oldest" : "youngest"} />
          <Readout label="Interlimb angle" value={amp < 0.1 ? "—" : `${interlimb.toFixed(0)}° · ${interlimbClass(interlimb)}`} />
          <Readout label="Orientation" value={amp < 0.1 ? "—" : `${axialOrientation(90 - Math.abs(tilt))}${plunge > 0 ? `, plunging ${plunge}°` : ""}`} />
          <Readout label="Map pattern" value={mapText} />
        </>
      }
    >
      <Viewport camera={[9, 7.5, 11]} topView={view === "map"} height="min(78vh, 640px)">
        <Scene u={u} top={top} labels={labels && view === "3d"} squeeze={playing ? squeeze : 1} />
      </Viewport>
      <Verdict tone={overturned ? "clay" : "moss"}>{name}</Verdict>
    </SimFrame>
  );
}

export default FoldBlock3D;
