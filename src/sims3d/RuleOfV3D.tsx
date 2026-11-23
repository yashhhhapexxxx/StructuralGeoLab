import { useEffect, useMemo, useState } from "react";
import { PlaneGeometry } from "three";
import { Html, Line } from "@react-three/drei";
import { Checkbox, Readout, SimFrame, Slider, Toggle, Verdict } from "@/components/sim-ui";
import { ruleOfV, V_TEXT } from "@/geo/attitude";
import { makeStrataMaterial, updateStrata } from "./strataMaterial";
import { Viewport } from "./Viewport";

const HALF = 5;
const G = 0.15; // valley-floor gradient (rises toward the north = upstream)
const THICK = 0.32;

/** Terrain: a V-shaped valley draining south, floor rising north, with gentle ridges. */
const height = (x: number, z: number) =>
  0.6 + G * -z + 0.5 * Math.sqrt(x * x + 0.25) + 0.12 * Math.sin(x * 0.9 + z * 0.4) + 0.08 * Math.cos(z * 1.3);

function Terrain({ normal, highlight, mute }: { normal: [number, number, number]; highlight: boolean; mute: boolean }) {
  const geo = useMemo(() => {
    const g = new PlaneGeometry(2 * HALF, 2 * HALF, 180, 180);
    g.rotateX(-Math.PI / 2); // now in xz, y up; plane local y → -z
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    return g;
  }, []);
  const mat = useMemo(() => makeStrataMaterial({ normal, thickness: THICK, contourInterval: 0.2 }), []); // eslint-disable-line react-hooks/exhaustive-deps
  // key bed = the one outcropping on the valley floor at the centre of the map
  const key = Math.floor((normal[1] * height(0, 0)) / THICK);
  useEffect(() => updateStrata(mat, { normal, highlight: highlight ? key : -999, muted: mute && highlight }), [mat, normal, highlight, mute, key]);
  return <mesh geometry={geo} material={mat} />;
}

function Stream() {
  const pts = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let z = -HALF; z <= HALF; z += 0.25) out.push([0, height(0, z) + 0.03, z]);
    return out;
  }, []);
  return (
    <>
      <Line points={pts} color="#4fb3ff" lineWidth={4} />
      <Html position={[0.5, height(0, HALF - 0.6) + 0.4, HALF - 0.6]} center>
        <span className="pointer-events-none whitespace-nowrap rounded bg-black/60 px-2 py-0.5 text-xs text-[#8fd3ff]">stream flows ↓ south</span>
      </Html>
      <Html position={[0, height(0, -HALF) + 0.9, -HALF]} center>
        <span className="pointer-events-none whitespace-nowrap rounded bg-black/60 px-2 py-0.5 text-xs text-[#e8dcc4]">N · upstream</span>
      </Html>
    </>
  );
}

/**
 * Sim — The Rule of Vs. Dipping beds crossing a valley make V-shaped outcrop patterns.
 * Which way the V points (and how sharp it is) reveals the dip direction.
 */
export function RuleOfV3D() {
  const [dir, setDir] = useState<"up" | "down">("down");
  const [dip, setDip] = useState(30);
  const [view, setView] = useState<"3d" | "map">("3d");
  const [highlight, setHighlight] = useState(true);
  const [mute, setMute] = useState(false);

  const d = (dip * Math.PI) / 180;
  // dip direction north (upstream, −z) or south (downstream, +z); normal leans toward dip direction
  const normal: [number, number, number] = [0, Math.cos(d), (dir === "up" ? -1 : 1) * Math.sin(d)];
  const rule = ruleOfV(dip, dir === "up", G);
  const gradDeg = (Math.atan(G) * 180) / Math.PI;

  return (
    <SimFrame
      title="The Rule of Vs"
      subtitle="Beds crossing a valley point the way they dip"
      controls={
        <>
          <Toggle label="View" value={view} onChange={setView} options={[{ value: "3d", label: "3D landscape" }, { value: "map", label: "Map view" }]} />
          <Toggle label="Beds dip toward" value={dir} onChange={setDir} options={[{ value: "up", label: "Upstream (N)" }, { value: "down", label: "Downstream (S)" }]} />
          <Slider label="Dip" value={dip} min={0} max={90} onChange={setDip} format={(v) => `${v}°`} hint={`Valley floor slopes ${gradDeg.toFixed(1)}° — compare!`} />
          <div className="flex flex-col gap-2">
            <Checkbox label="Highlight one bed" checked={highlight} onChange={setHighlight} />
            {highlight && <Checkbox label="Grey out the others" checked={mute} onChange={setMute} />}
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {[
              { l: "Horizontal", f: () => { setDip(0); } },
              { l: "Dip upstream", f: () => { setDir("up"); setDip(35); } },
              { l: "Gentle down", f: () => { setDir("down"); setDip(5); } },
              { l: "Steep down", f: () => { setDir("down"); setDip(45); } },
              { l: "Vertical", f: () => { setDip(90); } },
            ].map((b) => (
              <button key={b.l} type="button" onClick={b.f} className="rounded-lg border border-line px-2 py-1.5 hover:border-lichen/60">
                {b.l}
              </button>
            ))}
          </div>
        </>
      }
      readouts={
        <>
          <Readout label="Outcrop" value={V_TEXT[rule]} accent />
          <Readout label="Beds dip" value={dip === 0 ? "horizontal" : `${dip}° ${dir === "up" ? "N (upstream)" : "S (downstream)"}`} />
          <Readout label="Valley gradient" value={`${gradDeg.toFixed(1)}°`} />
        </>
      }
    >
      <Viewport camera={[0.5, 8.5, 11]} topView={view === "map"}>
        <Terrain normal={normal} highlight={highlight} mute={mute} />
        <Stream />
      </Viewport>
      <Verdict tone={rule === "downstream" ? "clay" : rule === "straight" ? "sand" : "moss"}>
        {rule === "downstream" ? "V points downstream" : rule === "straight" ? "No V" : "V points upstream"}
      </Verdict>
    </SimFrame>
  );
}

export default RuleOfV3D;
