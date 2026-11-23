import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Readout, SimFrame } from "@/components/sim-ui";
import { cn } from "@/lib/utils";

const ITEMS: { name: string; kind: "primary" | "secondary"; why: string }[] = [
  { name: "Cross-bedding", kind: "primary", why: "Built by migrating ripples or dunes as sand is deposited." },
  { name: "Slaty cleavage", kind: "secondary", why: "Aligned platy minerals grown during deformation and low-grade metamorphism." },
  { name: "Graded bedding", kind: "primary", why: "Grains settle by size as a current wanes." },
  { name: "Normal fault", kind: "secondary", why: "Brittle offset of already-solid rock." },
  { name: "Mud cracks", kind: "primary", why: "Shrinkage of wet mud as it dries at the surface." },
  { name: "Boudinage", kind: "secondary", why: "Stretching of a stiff layer inside softer rock." },
  { name: "Pillow lava", kind: "primary", why: "Lava erupting underwater and quenching into pillows." },
  { name: "Kink bands", kind: "secondary", why: "Angular folds in foliated rock such as phyllite." },
  { name: "Ripple marks", kind: "primary", why: "Formed by currents or waves on the sediment surface." },
  { name: "Mylonite", kind: "secondary", why: "Grain-size reduction in a ductile shear zone." },
  { name: "Joints", kind: "secondary", why: "Fractures that open in solid rock without shear offset." },
  { name: "Flow banding", kind: "primary", why: "Layering in a lava formed as it flows before cooling." },
];

/** Sim 8.1 — Primary or secondary? A quick sorting game with instant feedback. */
export function SortStructures() {
  const [answers, setAnswers] = useState<Record<string, "primary" | "secondary">>({});
  const score = ITEMS.filter((i) => answers[i.name] === i.kind).length;
  const done = Object.keys(answers).length;

  return (
    <SimFrame
      title="Primary or secondary?"
      subtitle="Formed with the rock — or added later by deformation?"
      readouts={
        <>
          <Readout label="Sorted" value={`${done} / ${ITEMS.length}`} />
          <Readout label="Correct" value={`${score}`} accent />
          <dd className="col-span-2 mt-2">
            <button type="button" onClick={() => setAnswers({})} className="flex items-center gap-2 text-sm text-lichen">
              <RotateCcw size={14} /> Start again
            </button>
          </dd>
        </>
      }
    >
      <div className="grid gap-3 p-5 sm:grid-cols-2 md:p-7">
        {ITEMS.map((it) => {
          const a = answers[it.name];
          const right = a === it.kind;
          return (
            <div key={it.name} className={cn("rounded-2xl border p-4 transition-colors", !a ? "border-line bg-white/[0.02]" : right ? "border-lichen/50 bg-moss/15" : "border-clay/60 bg-clay/10")}>
              <p className="font-display text-xl uppercase tracking-wide">{it.name}</p>
              {!a ? (
                <div className="mt-3 flex gap-2">
                  {(["primary", "secondary"] as const).map((k) => (
                    <button key={k} type="button" onClick={() => setAnswers((s) => ({ ...s, [it.name]: k }))} className="flex-1 rounded-full border border-line px-3 py-1.5 text-sm capitalize hover:border-lichen/60">
                      {k}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-ink/85">
                  <b className={right ? "text-lichen" : "text-[#f0a57c]"}>{right ? "Yes — " : "No — "}
                    {it.kind}.</b>{" "}
                  {it.why}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </SimFrame>
  );
}

export default SortStructures;
