import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Readout, SimFrame, Slider, Toggle, Verdict } from "@/components/sim-ui";
import { BED_COLORS } from "@/geo/beds";

const W = 800;
const H = 420;
const TOP = 90; // original ground surface
const BED_T = 38;
const RES = 2; // render resolution (px per sample)

type Scene = "synthetic" | "antithetic" | "graben" | "half" | "horst";

interface Fault {
  x0: number; // where it reaches the original surface
  dir: 1 | -1; // +1 dips to the right, −1 dips to the left
  role: "main" | "synthetic" | "antithetic" | "boundary";
  /** depth (screen y) where the fault ends against another fault */
  end?: number;
}

const TEXT: Record<Scene, { name: string; lines: string[] }> = {
  synthetic: {
    name: "Synthetic faults",
    lines: [
      "Synthetic faults dip in the SAME direction as the main fault.",
      "Each one drops its hanging wall a little further, so the beds step down like a staircase.",
    ],
  },
  antithetic: {
    name: "Antithetic faults",
    lines: [
      "Antithetic faults dip OPPOSITE to the main fault.",
      "They grow in the main fault’s hanging wall and end against it at depth, cutting out small wedge-shaped blocks.",
    ],
  },
  graben: {
    name: "Symmetric graben",
    lines: [
      "Two equal faults dip toward each other; the block between them drops down.",
      "Symmetric grabens like this are rarely seen in nature; asymmetric half-grabens are much more common.",
    ],
  },
  half: {
    name: "Half-graben",
    lines: [
      "One master fault controls the basin: the hanging wall tilts toward it.",
      "Sediment fills a wedge that is thickest against the fault. This is the most common rift basin.",
    ],
  },
  horst: {
    name: "Horst",
    lines: [
      "Two faults dip away from each other; the blocks outside drop and the middle block stands high.",
      "Horsts and grabens alternate across rifts such as the Rhine Graben and the East African Rift.",
    ],
  },
};

export function SyntheticAntithetic() {
  const [scene, setScene] = useState<Scene>("antithetic");
  const [throwPx, setThrow] = useState(55);
  const [dip, setDip] = useState(60);
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      setThrow(Math.round(75 * (0.5 - 0.5 * Math.cos((now - t0) / 1300))));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const t = Math.tan((dip * Math.PI) / 180);
  const fx = (f: Fault, y: number) => f.x0 + (f.dir * (y - TOP)) / t;
  const hw = (f: Fault, x: number, y: number) => f.dir * (x - fx(f, y)) > 0 && (f.end === undefined || y < f.end);
  // depth where two opposite faults meet
  const meet = (a: Fault, b: Fault) => TOP + (Math.abs(b.x0 - a.x0) * t) / 2;

  // Scene geometry + vertical displacement field D(x, y)
  let faults: Fault[] = [];
  let D: (x: number, y: number) => number = () => 0;
  const T = throwPx;
  if (scene === "synthetic") {
    const m: Fault = { x0: 300, dir: 1, role: "main" };
    const s1: Fault = { x0: 460, dir: 1, role: "synthetic" };
    const s2: Fault = { x0: 610, dir: 1, role: "synthetic" };
    faults = [m, s1, s2];
    D = (x, y) => (hw(m, x, y) ? T : 0) + (hw(s1, x, y) ? T * 0.5 : 0) + (hw(s2, x, y) ? T * 0.45 : 0);
  } else if (scene === "antithetic") {
    const m: Fault = { x0: 300, dir: 1, role: "main" };
    const a1: Fault = { x0: 540, dir: -1, role: "antithetic" };
    const a2: Fault = { x0: 680, dir: -1, role: "antithetic" };
    a1.end = meet(m, a1);
    a2.end = meet(m, a2);
    faults = [m, a1, a2];
    D = (x, y) => (hw(m, x, y) ? T : 0) + (hw(m, x, y) && hw(a1, x, y) ? T * 0.45 : 0) + (hw(m, x, y) && hw(a2, x, y) ? T * 0.35 : 0);
  } else if (scene === "graben") {
    const f1: Fault = { x0: 200, dir: 1, role: "boundary" };
    const f2: Fault = { x0: 600, dir: -1, role: "boundary" };
    f1.end = f2.end = meet(f1, f2);
    faults = [f1, f2];
    D = (x, y) => (hw(f1, x, y) && hw(f2, x, y) ? T * 1.4 : 0);
  } else if (scene === "half") {
    const m: Fault = { x0: 300, dir: 1, role: "main" };
    faults = [m];
    D = (x, y) => {
      if (!hw(m, x, y)) return 0;
      const dist = x - fx(m, y);
      return T * 1.5 * Math.max(0, 1 - dist / 420);
    };
  } else {
    const f1: Fault = { x0: 300, dir: -1, role: "boundary" };
    const f2: Fault = { x0: 500, dir: 1, role: "boundary" };
    faults = [f1, f2];
    D = (x, y) => (hw(f1, x, y) || hw(f2, x, y) ? T * 1.2 : 0);
  }

  // Raster render: colour each sample by its ORIGINAL depth (y − D)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const cols = W / RES;
    const rows = H / RES;
    const img = ctx.createImageData(cols, rows);
    const rgb = BED_COLORS.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
    for (let j = 0; j < rows; j++) {
      const y = j * RES + RES / 2;
      for (let i = 0; i < cols; i++) {
        const x = i * RES + RES / 2;
        const oy = y - D(x, y);
        const k = (j * cols + i) * 4;
        let r = 13, g = 19, b = 15; // background
        if (oy >= TOP) {
          const bed = Math.floor((oy - TOP) / BED_T);
          const frac = ((oy - TOP) / BED_T) % 1;
          [r, g, b] = rgb[bed % rgb.length];
          if (frac < 0.05) { r *= 0.45; g *= 0.45; b *= 0.45; }
        } else if (y >= TOP) {
          // space opened below the old ground surface → syn-rift sediment
          const band = Math.floor((y - TOP) / 9) % 2;
          [r, g, b] = band ? [233, 217, 166] : [222, 204, 150];
        }
        img.data[k] = r;
        img.data[k + 1] = g;
        img.data[k + 2] = b;
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });

  const roleColor = { main: "#ffffff", synthetic: "#7fd4ff", antithetic: "#ff8b6b", boundary: "#ffffff" } as const;
  const roleLabel = { main: "MAIN FAULT", synthetic: "SYNTHETIC", antithetic: "ANTITHETIC", boundary: "" } as const;
  const info = TEXT[scene];

  return (
    <SimFrame
      title="Synthetic, antithetic & grabens"
      subtitle="Which way does each fault dip compared with the main one?"
      controls={
        <>
          <Toggle
            label="Scene"
            value={scene}
            onChange={setScene}
            options={[
              { value: "synthetic", label: "Synthetic" },
              { value: "antithetic", label: "Antithetic" },
              { value: "graben", label: "Sym. graben" },
              { value: "half", label: "Half-graben" },
              { value: "horst", label: "Horst" },
            ]}
          />
          <button type="button" onClick={() => setPlaying((p) => !p)} className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night">
            {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Animate faulting"}
          </button>
          <Slider label="Throw" value={throwPx} min={0} max={80} onChange={(v) => { setPlaying(false); setThrow(v); }} format={(v) => `${v * 5} m`} />
          <Slider label="Fault dip" value={dip} min={45} max={75} onChange={setDip} format={(v) => `${v}°`} />
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {info.lines.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </>
      }
      readouts={
        <>
          <Readout label="Structure" value={info.name} accent />
          <Readout label="Synthetic faults" value={faults.filter((f) => f.role === "synthetic").length} />
          <Readout label="Antithetic faults" value={faults.filter((f) => f.role === "antithetic").length} />
          <Readout label="Max. drop" value={`${Math.round((scene === "graben" ? 1.4 : scene === "half" ? 1.5 : scene === "horst" ? 1.2 : 1.8) * throwPx * 5)} m`} />
        </>
      }
    >
      <div className="relative">
        <canvas ref={canvasRef} width={W / RES} height={H / RES} className="block h-auto w-full [image-rendering:auto]" style={{ aspectRatio: `${W} / ${H}` }} />
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label={`${info.name}: cross-section`}>
          {faults.map((f, i) => {
            const yEnd = f.end ?? H;
            return (
              <g key={i}>
                <line x1={fx(f, TOP - 30)} y1={TOP - 30} x2={fx(f, yEnd)} y2={yEnd} stroke={roleColor[f.role]} strokeWidth={f.role === "main" ? 4 : 3} />
                {roleLabel[f.role] && (
                  <text x={fx(f, TOP - 30)} y={TOP - 40} textAnchor="middle" className="font-display" fontSize="15" fill={roleColor[f.role]}>
                    {roleLabel[f.role]}
                  </text>
                )}
                {/* half-arrows showing hanging-wall motion */}
                {throwPx > 4 && (
                  <g stroke={roleColor[f.role]} strokeWidth="2" fill="none">
                    {(() => {
                      const y = Math.min(yEnd - 40, TOP + 140);
                      const x = fx(f, y);
                      const ux = f.dir / Math.hypot(1, t);
                      const uy = t / Math.hypot(1, t);
                      const off = 10;
                      // hanging wall side (direction f.dir) moves down-dip
                      const hx = x + f.dir * off;
                      const fxx = x - f.dir * off;
                      return (
                        <>
                          <path d={`M ${hx - ux * 16} ${y - uy * 16} L ${hx + ux * 16} ${y + uy * 16} l ${-f.dir * 5} -4`} />
                          <path d={`M ${fxx + ux * 16} ${y + uy * 16} L ${fxx - ux * 16} ${y - uy * 16} l ${f.dir * 5} 4`} />
                        </>
                      );
                    })()}
                  </g>
                )}
              </g>
            );
          })}
          {(scene === "graben" || scene === "horst") && throwPx > 6 && (
            <g className="font-display" fontSize="18" fill="#fff" textAnchor="middle">
              {scene === "graben" ? (
                <>
                  <text x="400" y={TOP + 24}>GRABEN</text>
                  <text x="90" y={TOP + 24}>HORST</text>
                  <text x="720" y={TOP + 24}>HORST</text>
                </>
              ) : (
                <>
                  <text x="400" y={TOP - 12}>HORST</text>
                  <text x="110" y={TOP + 24}>GRABEN</text>
                  <text x="690" y={TOP + 24}>GRABEN</text>
                </>
              )}
            </g>
          )}
          <line x1="0" x2={W} y1={TOP} y2={TOP} stroke="#e8dcc4" strokeOpacity="0.35" strokeDasharray="4 6" />
          <text x="10" y={TOP - 6} fontSize="11" fill="#e8dcc4" opacity="0.7">original ground surface</text>
          {throwPx > 6 && scene !== "horst" && scene !== "graben" && (
            <text x={W - 12} y={H - 12} textAnchor="end" fontSize="12" fill="#e9d9a6">pale bands = sediment filling the basin</text>
          )}
        </svg>
      </div>
      <Verdict tone={scene === "antithetic" ? "clay" : "moss"}>{info.name}</Verdict>
    </SimFrame>
  );
}

export default SyntheticAntithetic;
