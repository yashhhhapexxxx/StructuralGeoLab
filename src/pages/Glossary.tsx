import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { LEVELS } from "@/content/levels";

const EXTRA: { term: string; def: string; slug: string }[] = [
  { term: "Anticline", def: "Fold with the oldest rocks in its core (usually arch-shaped).", slug: "fold-anatomy" },
  { term: "Syncline", def: "Fold with the youngest rocks in its core (usually trough-shaped).", slug: "fold-anatomy" },
  { term: "Antiform", def: "Arch-shaped fold, named by shape only — ages unknown or overturned.", slug: "fold-anatomy" },
  { term: "Synform", def: "Trough-shaped fold, named by shape only.", slug: "fold-anatomy" },
  { term: "Vergence", def: "The direction an asymmetric fold leans toward (toward its short limb).", slug: "fold-symmetry" },
  { term: "Interlimb angle", def: "Angle between the two limbs of a fold: gentle, open, close, tight, isoclinal.", slug: "fold-symmetry" },
  { term: "Parasitic fold", def: "Small second-order fold on a larger fold; S, Z or M shaped by position.", slug: "fold-symmetry" },
  { term: "Competence", def: "Relative stiffness (viscosity) of a layer compared with its neighbours.", slug: "how-folds-form" },
  { term: "Buckling", def: "Active folding of a competent layer under layer-parallel shortening.", slug: "how-folds-form" },
  { term: "Monocline", def: "Step-like bend in otherwise flat layers, often above a buried fault (forced fold).", slug: "how-folds-form" },
  { term: "Kink band", def: "Angular fold with straight limbs in strongly foliated rock.", slug: "how-folds-form" },
  { term: "Horst", def: "Up-thrown block between two oppositely dipping normal faults.", slug: "faults" },
  { term: "Graben", def: "Down-dropped block between two oppositely dipping normal faults.", slug: "faults" },
  { term: "Half-graben", def: "Asymmetric basin tilted against a single main normal fault.", slug: "faults" },
  { term: "Synthetic / antithetic fault", def: "Dipping the same / opposite way as the main fault.", slug: "faults" },
  { term: "Relay ramp", def: "Tilted zone transferring displacement between two overlapping synthetic faults.", slug: "faults-in-depth" },
  { term: "Repeated / missing section", def: "Strata seen twice / not at all in a well that crosses a fault.", slug: "faults-in-depth" },
  { term: "Deformation band", def: "Thin tabular zone of grain reorganisation or crushing in porous rock.", slug: "faults-in-depth" },
  { term: "Brittle–ductile transition", def: "Depth (~10–15 km in continental crust) below which rocks flow rather than fracture.", slug: "stress-and-strain" },
];

export default function Glossary() {
  const [q, setQ] = useState("");
  const all = useMemo(() => {
    const fromLevels = LEVELS.flatMap((l) =>
      l.blocks.flatMap((b) => (b.type === "terms" ? b.items.map(([term, def]) => ({ term, def, slug: l.slug })) : [])),
    );
    const merged = [...fromLevels, ...EXTRA];
    const seen = new Set<string>();
    return merged
      .filter((t) => (seen.has(t.term.toLowerCase()) ? false : (seen.add(t.term.toLowerCase()), true)))
      .sort((a, b) => a.term.localeCompare(b.term));
  }, []);
  const shown = all.filter((t) => (t.term + " " + t.def).toLowerCase().includes(q.toLowerCase()));
  const levelN = (slug: string) => LEVELS.find((l) => l.slug === slug)?.n;

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-28 md:px-8">
      <p className="font-display text-sm uppercase tracking-[0.3em] text-lichen">Glossary</p>
      <h1 className="text-shine mt-2 font-display text-5xl uppercase leading-none md:text-7xl">{all.length} terms</h1>
      <label className="mt-8 flex items-center gap-3 rounded-full border border-line bg-white/[0.03] px-5 py-3">
        <Search size={18} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms — e.g. hinge, throw, cleavage" className="w-full bg-transparent text-lg outline-none placeholder:text-muted" aria-label="Search the glossary" />
      </label>
      <dl className="mt-8 divide-y divide-line">
        {shown.map((t) => (
          <div key={t.term} className="grid gap-1 py-4 md:grid-cols-[240px_1fr_auto] md:gap-6">
            <dt className="font-display text-xl uppercase tracking-wide text-ink">{t.term}</dt>
            <dd className="text-[16px] leading-relaxed text-ink/85">{t.def}</dd>
            <dd>
              <Link to={`/learn/${t.slug}`} className="whitespace-nowrap text-sm text-lichen hover:underline">L{levelN(t.slug)} →</Link>
            </dd>
          </div>
        ))}
        {!shown.length && <p className="py-8 text-muted">No terms match “{q}”.</p>}
      </dl>
    </div>
  );
}
