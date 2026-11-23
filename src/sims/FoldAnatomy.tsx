import { useEffect, useMemo, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { Checkbox, Readout, SimFrame, Slider, Toggle, Verdict } from "@/components/sim-ui";
import { foldName } from "@/geo/folds";
import { BED_COLORS } from "@/geo/beds";

const W = 800;
const H = 460;
const TOP = 70; // ground level before erosion (section top)
const BEDS = 6;
const BED_T = 44;
const MAP_Y = 22; // map strip position

type Shape = "antiform" | "synform";

/**
 * Sim 3.1/3.2/3.3 — Fold anatomy. Squeeze layers into an anticline/syncline, flip the
 * stratigraphy to meet antiforms/synforms, and erode to see the map pattern.
 */
export function FoldAnatomy() {
  const [shape, setShape] = useState<Shape>("antiform");
  const [overturned, setOverturned] = useState(false);
  const [amp, setAmp] = useState(70);
  const [lambda, setLambda] = useState(520);
  const [erosion, setErosion] = useState(0);
  const [labels, setLabels] = useState(true);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  // "Squeeze" animation: grow the amplitude from flat to the chosen value.
  const [target, setTarget] = useState(70);
  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 1800);
      const ease = 1 - Math.pow(1 - p, 3);
      setAmp(target * ease);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, target]);

  const sign = shape === "antiform" ? -1 : 1; // screen y: up is negative
  const x0 = W / 2;
  const surfaceY = (k: number, x: number) => TOP + 40 + k * BED_T + sign * amp * Math.cos((2 * Math.PI * (x - x0)) / lambda);

  // Bed k = 0 is the top surface of the stack. Ages: normal ⇒ top is youngest.
  const ageOf = (band: number) => (overturned ? band + 1 : BEDS - band); // 1 = oldest
  // No erosion ⇒ nothing clipped (the crest can rise above the original surface line).
  const erosionY = erosion === 0 ? -1000 : TOP - 40 + erosion * 1.3;

  const bands = useMemo(() => {
    const out: { d: string; color: string; age: number; band: number }[] = [];
    for (let b = 0; b < BEDS; b++) {
      let d = "";
      for (let x = -10; x <= W + 10; x += 8) d += `${d ? "L" : "M"}${x} ${surfaceY(b, x).toFixed(1)} `;
      for (let x = W + 10; x >= -10; x -= 8) d += `L${x} ${surfaceY(b + 1, x).toFixed(1)} `;
      const age = ageOf(b);
      out.push({ d: d + "Z", color: BED_COLORS[(age - 1) % BED_COLORS.length], age, band: b });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amp, lambda, shape, overturned]);

  // Map pattern = which bed sits at the erosion level at each x.
  const mapCells = useMemo(() => {
    const cells: { x: number; color: string; age: number }[] = [];
    for (let x = 0; x < W; x += 8) {
      let found = null as null | { color: string; age: number };
      for (let b = 0; b < BEDS; b++) {
        if (erosionY >= surfaceY(b, x) && erosionY < surfaceY(b + 1, x)) {
          const age = ageOf(b);
          found = { color: BED_COLORS[(age - 1) % BED_COLORS.length], age };
        }
      }
      cells.push({ x, color: found?.color ?? "#1a221c", age: found?.age ?? 0 });
    }
    return cells;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amp, lambda, shape, overturned, erosionY]);

  const name = amp < 4 ? "Flat-lying beds" : foldName(shape, overturned);
  const coreAge = shape === "antiform" ? ageOf(BEDS - 1) : ageOf(0);
  const coreText = coreAge === 1 ? "oldest" : coreAge === BEDS ? "youngest" : `bed ${coreAge}`;
  const hingeY = surfaceY(0, x0);
  const crestX = shape === "antiform" ? x0 : x0 - lambda / 2;

  return (
    <SimFrame
      title="Fold anatomy"
      subtitle="Shape tells you antiform or synform — ages tell you anticline or syncline"
      controls={
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTarget(Math.max(amp, 70));
                setAmp(0);
                setPlaying(true);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night"
            >
              <Play size={15} /> Squeeze
            </button>
            <button type="button" onClick={() => setAmp(0)} className="rounded-full border border-line px-3 py-2 text-sm" aria-label="Flatten">
              <RotateCcw size={15} />
            </button>
          </div>
          <Toggle label="Fold shape" value={shape} onChange={setShape} options={[{ value: "antiform", label: "Arch (antiform)" }, { value: "synform", label: "Trough (synform)" }]} />
          <Toggle
            label="Stratigraphy"
            value={overturned ? "over" : "normal"}
            onChange={(v) => setOverturned(v === "over")}
            options={[
              { value: "normal", label: "Youngest on top" },
              { value: "over", label: "Overturned" },
            ]}
          />
          <Slider label="Amplitude" value={Math.round(amp)} min={0} max={130} onChange={setAmp} />
          <Slider label="Wavelength" value={lambda} min={300} max={800} step={10} onChange={setLambda} />
          <Slider label="Erosion depth" value={erosion} min={0} max={260} onChange={setErosion} hint="Cut down through the fold to see the map pattern (top strip)" />
          <Checkbox label="Show labels" checked={labels} onChange={setLabels} />
        </>
      }
      readouts={
        <>
          <Readout label="Name" value={name} accent />
          <Readout label="Shape" value={shape} />
          <Readout label="Rocks in the core" value={amp < 4 ? "—" : coreText} />
          <Readout label="Map pattern" value={erosion < 20 ? "erode to see" : shape === "antiform" !== overturned ? "older in the middle" : "younger in the middle"} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" role="img" aria-label={`${name} cross-section`}>
        <defs>
          <clipPath id="fa-below">
            <rect x="0" y={erosionY} width={W} height={H} />
          </clipPath>
        </defs>
        {/* Eroded (removed) rock, ghosted */}
        <g opacity={erosion > 0 ? 0.12 : 0}>
          {bands.map((b) => (
            <path key={`g${b.band}`} d={b.d} fill={b.color} />
          ))}
        </g>
        <g clipPath="url(#fa-below)">
          {bands.map((b) => (
            <path key={b.band} d={b.d} fill={b.color} stroke="#0b0f0c" strokeOpacity="0.35" strokeWidth="1" />
          ))}
          {/* age numbers where the beds are flat (next trough / crest) */}
          {bands.map((b) => {
            const ax = x0 + lambda / 2;
            const y = (surfaceY(b.band, ax) + surfaceY(b.band + 1, ax)) / 2;
            return (
              <text key={`a${b.band}`} x={ax} y={y + 5} textAnchor="middle" fontSize="14" fill="#0b0f0c" fontWeight="700">
                {b.age === 1 ? "1 · oldest" : b.age === BEDS ? `${b.age} · youngest` : b.age}
              </text>
            );
          })}
        </g>
        {erosion > 0 && <line x1="0" x2={W} y1={erosionY} y2={erosionY} stroke="#fff" strokeOpacity="0.7" strokeDasharray="6 6" />}

        {/* Map strip */}
        <g>
          <rect x="0" y={MAP_Y - 12} width={W} height="24" fill="#1a221c" />
          {erosion >= 20 && mapCells.map((c) => <rect key={c.x} x={c.x} y={MAP_Y - 12} width="8.5" height="24" fill={c.color} />)}
          <text x="10" y={MAP_Y + 4} fontSize="12" fill="#eef1ea" opacity="0.8">
            MAP VIEW at erosion level
          </text>
        </g>

        {labels && amp >= 8 && (
          <g fontSize="15" fill="#eef1ea">
            {/* axial surface */}
            <line x1={crestX} x2={crestX} y1={TOP} y2={H - 10} stroke="#b5d98a" strokeWidth="2" strokeDasharray="10 7" />
            <text x={crestX + 8} y={H - 18} fill="#b5d98a">
              axial surface
            </text>
            {/* hinge */}
            <circle cx={crestX} cy={surfaceY(0, crestX)} r="6" fill="#fff" />
            <text x={crestX + 10} y={surfaceY(0, crestX) + (shape === "antiform" ? -10 : 22)}>{shape === "antiform" ? "hinge · crest" : "hinge · trough"}</text>
            {/* limbs */}
            <text x={crestX - lambda / 4 - 40} y={(surfaceY(0, crestX - lambda / 4) + hingeY) / 2 - 8 + (shape === "antiform" ? 30 : -30)}>limb</text>
            <text x={crestX + lambda / 4 + 4} y={(surfaceY(0, crestX + lambda / 4) + hingeY) / 2 - 8 + (shape === "antiform" ? 30 : -30)}>limb</text>
            {/* inflection points */}
            {[crestX - lambda / 4, crestX + lambda / 4].map((x) => (
              <circle key={x} cx={x} cy={surfaceY(0, x)} r="4.5" fill="none" stroke="#e8dcc4" strokeWidth="2" />
            ))}
            <text x={crestX - lambda / 4 - 12} y={surfaceY(0, crestX - lambda / 4) + (shape === "antiform" ? -12 : 24)} textAnchor="end" fontSize="13" fill="#e8dcc4">
              inflection point
            </text>
          </g>
        )}
      </svg>
      <Verdict tone={overturned ? "clay" : "moss"}>{name}</Verdict>
    </SimFrame>
  );
}

export default FoldAnatomy;
