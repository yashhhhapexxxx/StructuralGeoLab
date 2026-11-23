import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Shuffle } from "lucide-react";
import { Readout, SimFrame, Slider, Toggle, Verdict } from "@/components/sim-ui";
import { BED_COLORS } from "@/geo/beds";
import { cn } from "@/lib/utils";

const W = 800;
const SEC_TOP = 40; // section frame
const BASE = 330; // bottom of the stack
const N = 6; // beds, 1 = oldest (bottom) … 6 = youngest (top)
const T = 34; // bed thickness
const AMP = 58;
const LAMBDA = 600;
const MAP_Y = 372; // map strip
const MAP_H = 70;

// Timeline: 0–25 deposit · 25–55 squeeze · 55–80 erode · 80–100 map
const STAGES = [
  { at: 0, name: "Deposit", text: "Layers settle one on top of another: the oldest (1) at the bottom, the youngest (6) on top — the law of superposition." },
  { at: 25, name: "Squeeze", text: "Sideways compression buckles the layers. Upward arches are anticlines, downward troughs are synclines." },
  { at: 55, name: "Erode", text: "Weathering and erosion plane off the top of the folds, cutting down into older layers." },
  { at: 80, name: "Read the map", text: "On the eroded surface the anticline shows its OLDEST rocks in the middle; the syncline shows its YOUNGEST rocks in the middle." },
];
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

export function AnticlineSyncline() {
  const [time, setTime] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const [flip, setFlip] = useState(false); // quiz: mirror so the anticline may be on either side
  const [pick, setPick] = useState<null | "left" | "right">(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now() - (time >= 100 ? 0 : time * 90);
    const tick = (now: number) => {
      const v = Math.min(100, (now - t0) / 90); // ~9 s for the whole story
      setTime(v);
      if (v < 100) raf.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const deposit = clamp(time / 25); // fraction of beds laid down
  const fold = ease((time - 25) / 30); // 0 → 1
  const erodeY = SEC_TOP + 20 + ease((time - 55) / 25) * 135; // erosion surface (screen y)
  const eroding = time > 55;
  const showMap = time >= 80;
  const stage = [...STAGES].reverse().find((s) => time >= s.at) ?? STAGES[0];

  const sign = flip ? -1 : 1; // +1: anticline on the left
  const anticlineX = flip ? 550 : 250;
  const synclineX = flip ? 250 : 550;
  const amp = AMP * fold;
  // Upper surface of bed k (k = 0 … N, 0 = base of bed 1)
  const surf = (k: number, x: number) => BASE - k * T - sign * amp * Math.cos((2 * Math.PI * (x - 250)) / LAMBDA);

  const beds = useMemo(() => {
    const out: { d: string; color: string; age: number; visible: number }[] = [];
    for (let k = 0; k < N; k++) {
      let d = "";
      for (let x = -10; x <= W + 10; x += 8) d += `${d ? "L" : "M"}${x} ${surf(k + 1, x).toFixed(1)} `;
      for (let x = W + 10; x >= -10; x -= 8) d += `L${x} ${surf(k, x).toFixed(1)} `;
      // each bed fades/drops in during deposition
      const vis = clamp(deposit * N - k);
      out.push({ d: d + "Z", color: BED_COLORS[k % BED_COLORS.length], age: k + 1, visible: vis });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amp, sign, deposit]);

  // Age of the bed at the erosion surface for each x (map pattern)
  const mapCells = useMemo(() => {
    const cells: { x: number; age: number }[] = [];
    for (let x = 0; x < W; x += 5) {
      let age = 0;
      for (let k = 0; k < N; k++) if (erodeY <= surf(k, x) && erodeY > surf(k + 1, x)) age = k + 1;
      if (erodeY <= surf(N, x)) age = 7; // above the youngest bed: nothing eroded into it yet
      cells.push({ x, age });
    }
    return cells;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erodeY, amp, sign]);
  const ageAt = (x: number) => mapCells[Math.min(mapCells.length - 1, Math.max(0, Math.round(x / 5)))]?.age ?? 0;

  const labelsOn = !quiz || pick !== null;
  const answer: "left" | "right" = flip ? "right" : "left";

  const newQuiz = () => {
    setFlip(Math.random() < 0.5);
    setPick(null);
    setTime(100);
  };

  return (
    <SimFrame
      title="Anticline vs syncline"
      subtitle="Same shape family — told apart by the AGE of the rocks in the core"
      controls={
        <>
          <Toggle
            label="Mode"
            value={quiz ? "quiz" : "learn"}
            onChange={(v) => {
              setQuiz(v === "quiz");
              if (v === "quiz") newQuiz();
              else {
                setFlip(false);
                setPick(null);
              }
            }}
            options={[
              { value: "learn", label: "Watch & learn" },
              { value: "quiz", label: "Test yourself" },
            ]}
          />
          {!quiz ? (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (time >= 100) setTime(0);
                    setPlaying((p) => !p);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night"
                >
                  {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : time >= 100 ? "Play the story" : "Resume"}
                </button>
                <button type="button" aria-label="Restart" onClick={() => { setPlaying(false); setTime(0); }} className="rounded-full border border-line px-3 py-2">
                  <RotateCcw size={15} />
                </button>
              </div>
              <Slider label="Time" value={Math.round(time)} min={0} max={100} onChange={(v) => { setPlaying(false); setTime(v); }} format={() => stage.name} />
              <ol className="space-y-1.5 text-sm">
                {STAGES.map((s, i) => (
                  <li key={s.name}>
                    <button
                      type="button"
                      onClick={() => { setPlaying(false); setTime(i === 3 ? 100 : STAGES[i + 1].at - 0.01); }}
                      className={cn("w-full rounded-lg px-2 py-1.5 text-left", stage.name === s.name ? "bg-moss/25 text-ink" : "text-muted hover:text-ink")}
                    >
                      <b>{i + 1}. {s.name}</b>
                      {stage.name === s.name && <span className="mt-0.5 block text-[13px] leading-snug text-ink/85">{s.text}</span>}
                    </button>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[15px]">Look at the <b>map strip</b> and the numbered ages. Which fold is the <b className="text-lichen">anticline</b>?</p>
              <div className="grid grid-cols-2 gap-2">
                {(["left", "right"] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    disabled={pick !== null}
                    onClick={() => {
                      setPick(side);
                      setScore((s) => ({ ok: s.ok + (side === answer ? 1 : 0), n: s.n + 1 }));
                    }}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm capitalize",
                      pick === side ? (side === answer ? "border-lichen bg-moss/25" : "border-clay bg-clay/20") : "border-line hover:border-lichen/50",
                    )}
                  >
                    The {side} fold
                  </button>
                ))}
              </div>
              {pick && (
                <p className={pick === answer ? "text-lichen" : "text-[#f0a57c]"}>
                  {pick === answer ? "Correct! " : "Not quite. "}The anticline has the oldest rock (1) in its core; the syncline has the youngest in its core.
                </p>
              )}
              <button type="button" onClick={newQuiz} className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night">
                <Shuffle size={15} /> Next one
              </button>
            </div>
          )}
        </>
      }
      readouts={
        <>
          <Readout label="Stage" value={quiz ? "Quiz" : stage.name} accent />
          <Readout label="Anticline core" value={showMap && labelsOn ? `bed ${ageAt(anticlineX)} (oldest exposed)` : "—"} />
          <Readout label="Syncline core" value={showMap && labelsOn ? `bed ${ageAt(synclineX)} (youngest exposed)` : "—"} />
          {quiz && <Readout label="Score" value={`${score.ok} / ${score.n}`} />}
        </>
      }
    >
      <svg viewBox={`0 0 ${W} 460`} className="block h-full w-full" role="img" aria-label="Cross-section of an anticline and a syncline with the map pattern below">
        <defs>
          <clipPath id="as-sec">
            <rect x="0" y={SEC_TOP} width={W} height={BASE - SEC_TOP + 4} />
          </clipPath>
          <clipPath id="as-eroded">
            <rect x="0" y={eroding ? erodeY : -1000} width={W} height={2000} />
          </clipPath>
          <marker id="as-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 Z" fill="#fff" />
          </marker>
        </defs>
        <rect width={W} height="460" fill="#0d130f" />
        <text x="14" y="26" className="font-display" fontSize="15" fill="#eef1ea">CROSS-SECTION</text>

        <g clipPath="url(#as-sec)">
          {/* ghost of eroded rock */}
          {eroding && (
            <g opacity="0.13">
              {beds.map((b) => <path key={`g${b.age}`} d={b.d} fill={b.color} />)}
            </g>
          )}
          <g clipPath="url(#as-eroded)">
            {/* basement rock under the oldest bed, so folding never opens gaps */}
            <path d={`${beds.length ? "M -10 " + (BASE + 120) : ""} ${Array.from({ length: Math.ceil((W + 20) / 8) + 1 }, (_, i) => -10 + i * 8).map((x) => `L ${x} ${surf(0, x).toFixed(1)}`).join(" ")} L ${W + 10} ${BASE + 120} Z`} fill="#3a2f29" />
            {beds.map((b) => (
              <path
                key={b.age}
                d={b.d}
                fill={b.color}
                stroke="#0b0f0c"
                strokeOpacity="0.4"
                opacity={b.visible}
                transform={`translate(0 ${(1 - b.visible) * -60})`}
              />
            ))}
            {/* age numbers on the right edge, where beds are flat-ish */}
            {beds.map((b) =>
              b.visible > 0.6 ? (
                <text key={`n${b.age}`} x={W - 22} y={(surf(b.age - 1, W - 22) + surf(b.age, W - 22)) / 2 + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#0b0f0c">
                  {b.age}
                </text>
              ) : null,
            )}
          </g>
        </g>
        {eroding && <line x1="0" x2={W} y1={erodeY} y2={erodeY} stroke="#fff" strokeOpacity="0.75" strokeDasharray="6 6" />}
        {eroding && <text x="14" y={erodeY - 6} fontSize="12" fill="#e8dcc4">erosion surface (today’s ground)</text>}

        {/* compression arrows while folding */}
        {fold > 0.02 && fold < 0.98 && (
          <g fill="#c8703f">
            <path d={`M 4 ${BASE - 90} l 34 -14 l 0 28 Z`} />
            <path d={`M ${W - 4} ${BASE - 90} l -34 -14 l 0 28 Z`} />
          </g>
        )}

        {/* fold names + axial traces */}
        {fold > 0.3 && labelsOn && (
          <g>
            {[
              { x: anticlineX, name: "ANTICLINE", up: true },
              { x: synclineX, name: "SYNCLINE", up: false },
            ].map((f) => (
              <g key={f.name}>
                <line x1={f.x} x2={f.x} y1={SEC_TOP + 4} y2={BASE} stroke={f.up ? "#b5d98a" : "#f0a57c"} strokeWidth="2" strokeDasharray="8 6" />
                <text x={f.x} y={SEC_TOP + 2} dy="-6" textAnchor="middle" className="font-display" fontSize="18" fill={f.up ? "#b5d98a" : "#f0a57c"}>
                  {f.name}
                </text>
              </g>
            ))}
          </g>
        )}
        {quiz && pick === null && (
          <g className="font-display" fontSize="18" fill="#fff" textAnchor="middle">
            <text x="250" y={SEC_TOP - 6 + 2}>LEFT FOLD</text>
            <text x="550" y={SEC_TOP - 6 + 2}>RIGHT FOLD</text>
          </g>
        )}

        {/* MAP STRIP */}
        <text x="14" y={MAP_Y - 10} className="font-display" fontSize="15" fill="#eef1ea">MAP VIEW (looking down on the eroded surface)</text>
        <rect x="0" y={MAP_Y} width={W} height={MAP_H} fill="#1a221c" />
        {showMap &&
          mapCells
            .map((c, i, a) => ({ ...c, end: (a.findIndex((d, j) => j > i && d.age !== c.age) + 1 || a.length + 1) - 1 }))
            .filter((c, i, a) => i === 0 || a[i - 1].age !== c.age)
            .map((c) =>
              c.age >= 1 && c.age <= N ? (
                <rect key={c.x} x={c.x} y={MAP_Y} width={(c.end < mapCells.length ? mapCells[c.end].x : W) - c.x} height={MAP_H} fill={BED_COLORS[(c.age - 1) % BED_COLORS.length]} />
              ) : null,
            )}
        {showMap &&
          mapCells
            .filter((c, i, a) => c.age >= 1 && c.age <= N && (i === 0 || a[i - 1].age !== c.age))
            .map((c, i, a) => {
              const next = a[i + 1]?.x ?? W;
              const mid = (c.x + next) / 2;
              return next - c.x > 22 ? (
                <text key={c.x} x={mid} y={MAP_Y + MAP_H - 10} textAnchor="middle" fontSize="13" fontWeight="800" fill="#0b0f0c">
                  {c.age}
                </text>
              ) : null;
            })}
        {showMap && labelsOn && (
          <g>
            {/* anticline symbol: axial trace with arrows pointing away */}
            <g stroke="#fff" strokeWidth="2.4">
              <line x1={anticlineX} x2={anticlineX} y1={MAP_Y + 6} y2={MAP_Y + MAP_H - 26} />
              <line x1={anticlineX} x2={anticlineX - 18} y1={MAP_Y + 20} y2={MAP_Y + 20} markerEnd="url(#as-arr)" />
              <line x1={anticlineX} x2={anticlineX + 18} y1={MAP_Y + 20} y2={MAP_Y + 20} markerEnd="url(#as-arr)" />
              {/* syncline symbol: arrows pointing inward */}
              <line x1={synclineX} x2={synclineX} y1={MAP_Y + 6} y2={MAP_Y + MAP_H - 26} />
              <line x1={synclineX - 20} x2={synclineX - 3} y1={MAP_Y + 20} y2={MAP_Y + 20} markerEnd="url(#as-arr)" />
              <line x1={synclineX + 20} x2={synclineX + 3} y1={MAP_Y + 20} y2={MAP_Y + 20} markerEnd="url(#as-arr)" />
            </g>
          </g>
        )}
        {!showMap && (
          <text x={W / 2} y={MAP_Y + MAP_H / 2 + 5} textAnchor="middle" fontSize="13" fill="#9aa69c">
            the map appears once the folds are eroded
          </text>
        )}
      </svg>
      <Verdict tone="moss">{quiz ? (pick ? (pick === answer ? "Correct!" : "Try the next one") : "Which is the anticline?") : stage.name}</Verdict>
    </SimFrame>
  );
}

export default AnticlineSyncline;
