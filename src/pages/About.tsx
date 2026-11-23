export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-28 md:px-8">
      <p className="font-display text-sm uppercase tracking-[0.3em] text-lichen">About</p>
      <h1 className="text-shine mt-2 font-display text-5xl uppercase leading-none md:text-7xl">Sources & credits</h1>
      <div className="mt-10 space-y-8 text-lg leading-relaxed text-ink/90">
        <section>
          <h2 className="font-display text-2xl uppercase tracking-wide text-lichen">What this is</h2>
          <p className="mt-2">
            StructuralGeoLab teaches structural geology through simulations: you move the rocks first, then name what you saw. It is a sister project of Campus GeoQuest, the IIT Roorkee campus trail.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl uppercase tracking-wide text-lichen">Teaching sources</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>H. Fossen, <i>Structural Geology</i>, Cambridge University Press — terminology and classifications throughout.</li>
            <li>H. Fossen & T. Johansen, <i>Faults</i>, Chapter 8 e-module (2014) — structure of the fault levels. “Free use for educational purposes.”</li>
            <li>H. Fossen, <i>Folding</i> e-module — fold mechanisms: buckling, bending, passive folding, flexural slip/flow, orthogonal flexure.</li>
            <li>M. A. Biot (1961) — dominant buckling wavelength; M. J. Fleuty (1964) — fold classification; J. G. Ramsay (1967) — dip-isogon classes.</li>
          </ul>
          <p className="mt-3 text-[16px] text-muted">All text and graphics on this site are original; no figures were copied from these works.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl uppercase tracking-wide text-lichen">Also consulted</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>USGS Geology, Geophysics & Geochemistry Science Center — structural geology research topics (real-world framing).</li>
            <li>StructuralGeology.com (Dr Jun Cowan) — inspiration for level-based learning “through immersion and no exams”. No content reused.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl uppercase tracking-wide text-lichen">Built with</h2>
          <p className="mt-2">React, TypeScript, Tailwind CSS, Motion, and components adapted from React Bits (Topography, FoldText, BlurText, CountUp, SpotlightCard, ClickSpark). Every simulation’s geometry is checked by automated tests.</p>
        </section>
      </div>
    </div>
  );
}
