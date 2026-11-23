import { useMemo, useState, type ReactElement } from "react";
import { ArrowDown, ArrowUp, Shuffle } from "lucide-react";
import { Readout, SimFrame, Verdict } from "@/components/sim-ui";
import { cn } from "@/lib/utils";

type Kind = "graded" | "crossbed" | "mudcrack" | "ripple";

const INFO: Record<Kind, { name: string; rule: string }> = {
  graded: { name: "Graded bedding", rule: "Grains fine upward: coarse at the base of each bed, fine at the top." },
  crossbed: { name: "Cross-bedding", rule: "Foresets curve to meet the base tangentially and are cut off (truncated) at the top." },
  mudcrack: { name: "Mud cracks", rule: "Cracks are V-shaped: widest at the top surface, narrowing downward, filled from above." },
  ripple: { name: "Wave ripples", rule: "Symmetric wave ripples have sharp crests pointing up and rounded troughs." },
};

/** Structures drawn right-way-up in a 400×260 box. */
function Drawing({ kind }: { kind: Kind }) {
  const rng = useMemo(() => {
    let s = 7;
    return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  }, []);
  if (kind === "graded") {
    const dots: ReactElement[] = [];
    for (let bed = 0; bed < 2; bed++) {
      const top = 20 + bed * 115;
      for (let i = 0; i < 260; i++) {
        const t = rng(); // 0 top → 1 base
        const r = 1 + t * t * 7;
        dots.push(<circle key={`${bed}-${i}`} cx={10 + rng() * 380} cy={top + t * 105} r={r} fill={bed ? "#c9cfc4" : "#e3c78a"} opacity="0.9" />);
      }
    }
    return <g>{dots}<line x1="0" x2="400" y1="130" y2="130" stroke="#0b0f0c" strokeWidth="3" /></g>;
  }
  if (kind === "crossbed") {
    const set = (y0: number, h: number) => {
      const lines: ReactElement[] = [];
      for (let i = -2; i < 14; i++) {
        const x = i * 34;
        lines.push(<path key={`${y0}-${i}`} d={`M ${x} ${y0} C ${x + 25} ${y0 + h * 0.55}, ${x + 50} ${y0 + h}, ${x + 110} ${y0 + h}`} fill="none" stroke="#5b4630" strokeWidth="2.5" />);
      }
      return lines;
    };
    return (
      <g>
        <rect width="400" height="260" fill="#e3c78a" />
        {set(25, 95)}
        {set(140, 100)}
        <line x1="0" x2="400" y1="25" y2="25" stroke="#3b2e20" strokeWidth="3" />
        <line x1="0" x2="400" y1="140" y2="140" stroke="#3b2e20" strokeWidth="3" />
      </g>
    );
  }
  if (kind === "mudcrack") {
    return (
      <g>
        <rect width="400" height="260" fill="#8c6a4f" />
        <rect y="0" width="400" height="60" fill="#e3c78a" />
        {[40, 130, 220, 310].map((x) => (
          <path key={x} d={`M ${x - 16} 60 L ${x} 190 L ${x + 16} 60 Z`} fill="#e3c78a" />
        ))}
      </g>
    );
  }
  // ripple
  let d = "M 0 150";
  for (let x = 0; x <= 400; x += 50) d += ` Q ${x + 12} 150 ${x + 25} 108 Q ${x + 38} 150 ${x + 50} 150`;
  return (
    <g>
      <rect width="400" height="260" fill="#c9cfc4" />
      <path d={`${d} L 400 260 L 0 260 Z`} fill="#e3c78a" />
      <path d={d} fill="none" stroke="#5b4630" strokeWidth="3" />
    </g>
  );
}

const KINDS: Kind[] = ["graded", "crossbed", "mudcrack", "ripple"];

/** Sim 1.2 — Which way is up? Read the younging direction from primary structures. */
export function WayUp() {
  const [kind, setKind] = useState<Kind>("graded");
  const [flipped, setFlipped] = useState(true);
  const [answer, setAnswer] = useState<null | "up" | "down">(null);
  const [score, setScore] = useState({ right: 0, total: 0 });

  const correct: "up" | "down" = flipped ? "down" : "up";
  const next = () => {
    setKind(KINDS[Math.floor(Math.random() * KINDS.length)]);
    setFlipped(Math.random() < 0.5);
    setAnswer(null);
  };
  const choose = (a: "up" | "down") => {
    if (answer) return;
    setAnswer(a);
    setScore((s) => ({ right: s.right + (a === correct ? 1 : 0), total: s.total + 1 }));
  };

  return (
    <SimFrame
      title="Which way is up?"
      subtitle="Primary structures tell you the younging direction"
      controls={
        <>
          <p className="text-[15px] text-ink">This outcrop may be the right way up — or overturned by folding. Which way were the layers deposited?</p>
          <div className="grid grid-cols-2 gap-2">
            {(["up", "down"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => choose(a)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm transition-colors",
                  answer === a ? (a === correct ? "border-lichen bg-moss/25" : "border-clay bg-clay/20") : "border-line hover:border-lichen/50",
                )}
              >
                {a === "up" ? <ArrowUp size={16} /> : <ArrowDown size={16} />} Young {a === "up" ? "upward" : "downward"}
              </button>
            ))}
          </div>
          {answer && (
            <p className={answer === correct ? "text-lichen" : "text-[#f0a57c]"}>
              {answer === correct ? "Correct. " : "Not this time. "}
              {INFO[kind].rule} {flipped ? "Here the beds are overturned." : "Here the beds are the right way up."}
            </p>
          )}
          <button type="button" onClick={next} className="flex items-center justify-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-night">
            <Shuffle size={15} /> Next outcrop
          </button>
        </>
      }
      readouts={
        <>
          <Readout label="Structure" value={answer ? INFO[kind].name : "?"} accent />
          <Readout label="Score" value={`${score.right} / ${score.total}`} />
        </>
      }
    >
      <svg viewBox="0 0 400 260" className="block h-full w-full" role="img" aria-label="Outcrop showing a primary structure">
        <g transform={flipped ? "rotate(180 200 130)" : undefined}>
          <Drawing kind={kind} />
        </g>
      </svg>
      {answer && <Verdict tone={answer === correct ? "moss" : "clay"}>{INFO[kind].name}</Verdict>}
    </SimFrame>
  );
}

export default WayUp;
