# StructuralGeoLab — Website Plan & Proposal

An interactive website that **teaches structural geology through simulations**: folds, faults,
anticlines and synclines, primary vs secondary structures, fold symmetry, and a "descent" through
the crust. Students learn by *moving* things (tilting, squeezing, slipping, drilling) instead of only
reading definitions.

> Sister project of **Campus GeoQuest** (`../CampusGeoQuest`). It reuses the same earthy visual
> language (forest/moss/sand palette, Impact display type, silver title treatment) so the two feel
> like one family — GeoQuest gets students walking the campus, StructuralGeoLab explains what they
> are looking at.

---

## 1. Goals

| Goal | What "done" looks like |
|---|---|
| Teach the core of an undergraduate structural geology unit | Every topic in §5 has a lesson + at least one simulation + a 3–5 question check |
| Learning by doing | Each concept is introduced with a control the student drags *before* the definition appears |
| Work on campus phones | Lighthouse mobile ≥ 85, every simulation usable with one thumb, works offline after first visit |
| Accurate | Terminology and classifications follow Fossen, *Structural Geology* (Cambridge UP); every page lists its references |
| Beautiful | A landing page people want to share; consistent motion and colour system |

**Audience:** 1st–3rd year geology / earth-science / civil & mining engineering students (e.g. IIT
Roorkee Earth Sciences), plus curious visitors. Assumes no prior structural knowledge.

**Non-goals (v1):** user accounts, grading/LMS integration, full stereonet analysis tool, numerical
(finite-element) mechanics. These can come later (§10).

---

## 2. Sources reviewed & how we may use them

| Source | What it is | What we take | Reuse rights |
|---|---|---|---|
| `Unit-4 Faults.pdf` (45 pp.) — *Faults*, Chapter 8 e-module by **Haakon Fossen** (Univ. of Bergen), producers T. Johansen & H. Fossen, updated 21 Feb 2014 | Companion e-module to Fossen's textbook *Structural Geology* | Topic structure and scope for the **Faults** module (basics → architecture → growth → segmentation), terminology, the list of concepts each simulation must show | Module says: *"Free use for educational purposes. Other use of the content must be in agreement with Haakon Fossen."* → We **write our own text and draw our own graphics**, and credit Fossen + the textbook on every fault page. No copying of figures. |
| USGS GGGSC — *Structural Geology* science topic (`usgs.gov/centers/geology,-geophysics,-and-geochemistry-science-center/science/science-topics/structural`) | US Geological Survey research topic page | Real-world framing (why structure matters: hazards, resources, mapping) for the landing page and "Why it matters" panels | USGS-authored material is generally public domain, but **the page could not be read during planning** (usgs.gov blocks automated access). **TODO:** paste the page text into `docs/sources/usgs-structural.md`, then pull 3–5 real-world examples and check each image's credit line before using it (third-party photos on USGS pages are *not* always public domain). |
| structuralgeology.com (Dr Jun Cowan) | Commercial site for applied, deposit-scale structural geology workshops and consulting (creator behind Leapfrog). No public lessons, tools or diagrams. | **Pedagogy idea only:** "each level covering a fundamental concept and prerequisite to pass to the next level", "learn through immersion and there are no exams". We adopt *levels that unlock* and *checks, not exams*. | "All Rights Reserved" — **no content reused.** |

Additional open references we'll cite (no copying, concepts only): Fossen *Structural Geology* 2nd ed.
(fold classification, fault terminology); Fleuty (1964) interlimb-angle & orientation classes; Ramsay
(1967) dip-isogon fold classes; Erslev (1991) trishear; Allmendinger (1998) trishear kinematics.

---

## 3. Site map

```
/                      Landing page (welcome + journey + module grid)
/learn                 Course map — levels & progress
/learn/primary         L1  Primary structures (how rocks are born)
/learn/stress-strain   L2  Stress, strain & the brittle–ductile divide
/learn/folds           L3  Fold anatomy, anticline vs syncline, antiform vs synform
/learn/fold-symmetry   L4  Fold symmetry & classification  (2 simulations)
/learn/faults          L5  Faults: basics & kinematics
/learn/fault-anatomy   L6  Fault architecture, growth & drag
/learn/fault-systems   L7  Fault segmentation, relay ramps, linkage
/learn/secondary       L8  Secondary structures (joints, cleavage, foliation, lineation, boudins, shear zones)
/descent               Capstone: "Into the Crust" — dive 0 → 30 km and watch structures change
/sandbox               Free play: stack layers, fold them, fault them, drill a well
/glossary              ~120 terms, each linked to the simulation that shows it
/about                 Credits, references, how to cite, contact
```

Each `/learn/*` page uses the same template (§6).

---

## 4. Landing page (`/`)

Goal: in 10 seconds a visitor knows *what this is* and wants to press **Start**.

1. **Hero — "Read the rocks."**
   Full-screen 3D block diagram of layered strata (sandstone/shale/limestone colours) slowly being
   *folded* as you scroll, then *cut by a fault* that slips. Silver Impact title **STRUCTURAL GEOLOGY**
   embedded between layers (same trick as GeoQuest's hero). Subtitle: *"Folds, faults and the forces
   that bend a planet — learn them by moving them."* CTA: **Start the journey** → `/learn`.
2. **"What you'll be able to do"** — 4 outcome cards: identify a fold from a map pattern · tell a
   normal from a reverse fault from offset layers · read way-up from primary structures · predict
   what a well will hit across a fault.
3. **The journey** — horizontal level path L1 → L8 → Descent, each node a mini looping animation
   (layers settling, a fold forming, a fault slipping…). Locked/unlocked state from progress.
4. **Live mini-sim teaser** — one inline slider ("squeeze") that folds a strip of layers right on the
   landing page. Hook moment.
5. **Why it matters** — earthquakes & hazard, groundwater and oil/gas migrating along faults,
   mineral deposits, tunnels/dams/slopes. (Pull real examples from USGS — see §2 TODO.)
6. **For teachers** — "use any simulation in class", deep-linkable states, printable worksheets.
7. **Footer** — credits (Fossen, sources), link to Campus GeoQuest, license.

Loading screen: layered-strata wipe with the title (reuse GeoQuest preloader pattern + preload gate
so the hero appears all at once).

---

## 5. Curriculum & simulations

Legend: **Sim** = interactive simulation, 🎛 = controls, 👁 = what the student sees,
🎯 = learning goal, ⚙ = implementation notes.

### L1 — Primary structures (formed *with* the rock)
Content: bedding & stratification; cross-bedding; graded bedding; ripple marks (symmetric wave vs
asymmetric current); mud cracks; sole marks / load casts; vesicles & flow banding in lavas;
pillow lavas. Law of superposition, original horizontality. **Way-up (younging) criteria.**

- **Sim 1.1 "Deposit it"** — 🎛 choose sediment supply/energy over time → 👁 a column builds up
  layer by layer with graded beds, cross-beds or ripples forming accordingly. 🎯 primary structures
  record *how* the rock formed. ⚙ 2D canvas, procedural layer generator.
- **Sim 1.2 "Which way is up?"** — 👁 an outcrop photo-like panel rotated randomly (incl. upside-down);
  🎛 student taps the younging direction using graded bedding / cross-bed truncations / mud-crack
  shape. 🎯 way-up matters before interpreting folds (sets up anticline vs antiform in L3).

### L2 — Stress, strain & depth
Content: stress vs strain; principal stresses σ1 ≥ σ2 ≥ σ3; compression/extension/shear; strain
ellipse; brittle vs ductile; the brittle–ductile transition (~10–15 km in continental crust — the
fault e-module notes faults "commonly form in the upper 10–15 km").

- **Sim 2.1 "Strain ellipse"** — 🎛 drag to apply pure shear / simple shear → 👁 a circle of marker
  points becomes an ellipse; principal axes drawn; stretch values shown. ⚙ 2×2 deformation matrix
  on SVG points.
- **Sim 2.2 "Bend or break?"** — 🎛 depth (temperature + confining pressure) and strain rate → 👁 the
  same rock slab either fractures (brittle) or flows/folds (ductile). 🎯 why faults dominate near the
  surface and folds/shear zones at depth.

### L3 — Folds: anatomy, anticlines & synclines
Content: hinge (point/line), limbs, axial surface/plane, crest & trough, inflection point,
interlimb angle, wavelength & amplitude; **anticline** (oldest rocks in the core) vs **syncline**
(youngest in the core); **antiform/synform** (shape only, age unknown or inverted); plunging folds and
their V-shaped / nose map patterns; domes and basins.

- **Sim 3.1 "Squeeze the layers"** (flagship 3D) — 🎛 shortening %, wavelength, amplitude → 👁 3D
  block of coloured strata folds in real time; labels for hinge, limbs, axial plane can be toggled.
  🎯 fold anatomy. ⚙ R3F; layered mesh displaced by `z = A·sin(2πx/λ)`, shortening maps to A/λ.
- **Sim 3.2 "Anticline or antiform?"** — 👁 same fold shape with layer *ages* shown; 🎛 flip the
  stratigraphy (overturned sequence) → label flips anticline ↔ synformal anticline. 🎯 age vs shape.
- **Sim 3.3 "Erode & map"** — 🎛 plunge angle + erosion level (horizontal slice) → 👁 the map pattern
  on the top face: parallel bands → V-shaped nose; dome/basin bullseyes. 🎯 read folds from geological
  maps. ⚙ map = intersection of fold surfaces with plane z = erosion level (marching squares on a
  height field).

### L4 — Fold symmetry & classification  *(the "2 fold symmetry simulations")*
Content: **symmetric vs asymmetric folds** (axial surface bisects interlimb angle or not; limbs of
equal or unequal length); vergence; parasitic **S, Z and M folds** and how they point toward the hinge
of the larger fold. **Fleuty classifications:** interlimb angle (gentle 180–120°, open 120–70°,
close 70–30°, tight 30–0°, isoclinal ≈0°, elastica <0°) and orientation (upright, inclined,
overturned, recumbent, plunging, reclined, vertical). **Ramsay dip-isogon classes** 1A, 1B, 1C, 2
(similar), 3; parallel vs similar folds.

- **Sim 4.1 "Symmetry lab"** — 🎛 drag the axial surface tilt and limb-length ratio → 👁 the fold morphs
  continuously between symmetric and asymmetric; live readouts: interlimb angle, axial-surface dip,
  Fleuty class names, vergence arrow. A mirror line appears and "snaps" green when the fold is
  symmetric. 🎯 what symmetry means and how it's measured. ⚙ 2D SVG; fold built from two limbs +
  rounded hinge (Bezier), parameterised by interlimb angle, axial tilt, limb ratio.
- **Sim 4.2 "Parasitic folds: S, Z, M"** — 👁 a large fold with small parasitic folds on its limbs and
  hinge; 🎛 move a "hand lens" along the fold → zoom shows S on one limb, M at the hinge, Z on the other
  (as seen looking down plunge); quiz: "which way is the hinge?" 🎯 use small-fold symmetry to locate
  large-fold hinges in the field.
- **Sim 4.3 "Dip isogons"** — 🎛 choose layer thicknessing → 👁 isogons drawn automatically, class
  1A–3 detected. ⚙ compute isogons by matching equal tangent dips on outer/inner arcs.
- **Sim 4.4 "Orientation cube"** — 🎛 hinge plunge & axial-plane dip → 👁 3D fold rotates; Fleuty
  orientation name updates (upright → recumbent etc.).

### L5 — Faults: basics & kinematics  *(from Fossen e-module §"The basics")*
Content: definition (fractures/zones of localized deformation accommodating movement parallel to the
surface, usually ≥ 1 m; smaller ones = shear fractures); hanging wall vs footwall; **normal, reverse,
strike-slip (sinistral/dextral), oblique-slip**; low-angle (<30°) vs high-angle (>60°); strike, dip,
dip direction, **pitch (rake)**; synthetic vs antithetic faults; **horsts, grabens, half-grabens**;
displacement (net slip) vector with dip-slip & strike-slip components; **separation** (strike & dip),
**heave** and **throw**; stratigraphic separation; **repeat and missing sections in wells**.

- **Sim 5.1 "Fault block"** (flagship 3D) — 🎛 fault dip, strike, rake, slip amount → 👁 3D block
  splits along the plane and the hanging wall slides; layers offset; name updates live (normal /
  reverse / thrust / strike-slip dextral-sinistral / oblique). Toggle the displacement-vector
  decomposition (dip-slip vs strike-slip components). 🎯 classify faults from motion. ⚙ R3F; two
  meshes clipped by the fault plane (clipping planes / CSG), hanging wall translated along slip vector.
- **Sim 5.2 "Heave & throw"** — 2D cross-section; 🎛 dip + dip-slip → 👁 dimension lines for heave,
  throw, dip separation update; challenge mode: measure them yourself.
- **Sim 5.3 "Drill the well"** — 🎛 place a well and set its inclination; fault type & dip → 👁 the well
  log beside the section shows **repeated** or **missing** section. Reproduces the four e-module cases
  (reverse fault + well steeper than fault → repeat; normal fault + fault steeper than well → repeat;
  reverse + well shallower than fault → missing; normal + well steeper than fault → missing). 🎯 the
  practical, exam-favourite idea.
- **Sim 5.4 "Rift builder"** — 🎛 add synthetic/antithetic faults → horst, symmetric graben,
  half-graben form; extension % readout.

### L6 — Fault architecture, growth & drag  *(Fossen §"Fault architecture" & "Fault growth")*
Content: **fault core** (slip surfaces, gouge, breccia, lenses/"horses") and **damage zone**
(deformation bands, minor slip surfaces, shear fractures, joints); fault growth in **non-porous rocks**
(Griffith micro-cracks → wing cracks → linkage → process zone → gouge → slip surface) vs **porous rocks**
(deformation bands, cataclastic vs disaggregation bands, strain hardening → band zones); **displacement
profile** (max at centre, zero at tip line); **process zone**; damage widening at **asperities, jogs,
branch points**; **fault drag** — normal vs reverse drag, rollover anticline, drag by fault-parallel
shear vs **trishear** fault-propagation folding (drag fold precedes the fault).

- **Sim 6.1 "Zoom into a fault"** — scroll-zoom from map scale → outcrop → hand sample → microscope;
  👁 core, damage zone, deformation bands, gouge labelled at each scale.
- **Sim 6.2 "Grow a crack"** — 👁 micro-cracks under shear sprout wing cracks that curve toward σ1 and
  link into a through-going shear fracture. 🎛 σ1 orientation, crack density. ⚙ 2D particle/segment
  growth with simple linkage rule.
- **Sim 6.3 "Displacement profile"** — 🎛 grow a fault → 👁 elliptical slip patch on the fault plane +
  displacement–length graph (max at centre, zero at tips).
- **Sim 6.4 "Trishear fold"** — 🎛 ramp angle, trishear apex angle, P/S ratio, slip → 👁 layers fold in
  a triangular zone ahead of a propagating reverse fault; strain ellipses intensify toward the fault.
  (Same parameters the e-module lists from FaultFold: ramp 30°, apex 45°, P/S 1.5.) ⚙ implement the
  Zehnder & Allmendinger (2000) linear trishear velocity field; integrate points over slip increments.

### L7 — Fault systems & segmentation  *(Fossen §"Fault segmentation")*
Content: faults form in **populations**; segments; interaction via **local stress interference**;
four interaction types (intersection/overprinting, mutual, single-tip, double-tip); **overlap zones**
= relay / transfer / accommodation zones; antithetic overlaps (high- vs low-relief accommodation
zones); **unlinked, soft-linked, hard-linked**; **relay ramps** between synthetic faults and their
**breaching** → fault bends/jogs, eye structures, transfer faults; **branch lines & points**; vertical
interaction; growth in **layered sand–shale** (nucleates in stiff sandstone, arrests at shale, then
breaks through).

- **Sim 7.1 "Relay ramp"** (3D) — 🎛 overlap distance, spacing, throw → 👁 two synthetic faults with a
  tilted ramp between them; "breach" button links them → fault bend. 🎯 soft vs hard linkage.
- **Sim 7.2 "Population growth"** — 👁 many small faults nucleate, grow, interact and coalesce into a
  few large segmented faults over time (play/pause/scrub). ⚙ 2D agent sim; segment length/displacement
  ratio kept roughly constant.
- **Sim 7.3 "Layered growth"** — 🎛 sandstone/shale stack → 👁 fault grows radially, stalls at shale,
  propagates laterally, then breaks through; D–L plot updates.

### L8 — Secondary structures (formed *after* the rock)
Content: joints & joint sets; veins; folds & faults recap; cleavage & foliation (slaty, schistosity,
gneissic banding); lineations; boudinage; shear zones & mylonites; overprinting / relative age
(cross-cutting relationships).

- **Sim 8.1 "Primary or secondary?"** — sorting game with outcrop cards; explanation after each.
- **Sim 8.2 "Cross-cutting history"** — 👁 an outcrop with several structures; 🎛 drag them into the
  order they happened; checker replays the history as an animation.

### Capstone — `/descent` "Into the Crust"
A vertical scroll-driven journey from the surface to ~30 km. At each depth band the scene, temperature
& pressure gauges and the dominant structures change: surface (joints, mud cracks, landslides) → upper
crust 0–10 km (faults, fault breccia, earthquakes) → brittle–ductile transition ~10–15 km (mixed
behaviour) → middle/lower crust (folds, cleavage, mylonitic shear zones, gneiss). Ends with a summary
and a "you've completed StructuralGeoLab" card linking back to Campus GeoQuest.

### `/sandbox`
Stack your own layers → fold them (L3 engine) → fault them (L5 engine) → erode (L3.3) → drill (L5.3).
Shareable via URL-encoded state.

---

## 6. Lesson page template

```
┌───────────────────────────────────────────────┐
│ Level badge · title · 1-line "you'll learn"   │
├───────────────────────────────────────────────┤
│ 1. PLAY      — simulation first, no jargon    │
│ 2. NOTICE    — guided prompts ("What happens  │
│                to the layers' age in the core?")│
│ 3. NAME IT   — concise definitions, glossary  │
│                links, labelled diagram        │
│ 4. REAL ROCK — field photo / real example     │
│ 5. CHECK     — 3–5 questions, instant feedback│
│                (unlocks next level, no "exam")│
│ 6. SOURCES   — references for this page       │
└───────────────────────────────────────────────┘
```

Progress (levels unlocked, checks passed) saved in `localStorage` — no accounts in v1.

---

## 7. Design system (shared with Campus GeoQuest)

- **Palette:** night `#08080A`, forest `#0C1410`, moss `#7FA35B`, lichen `#B5D98A`, sand `#E8DCC4`,
  clay `#C8703F`. Rock-layer palette for simulations (colour-blind-safe, tested): sandstone `#E3C78A`,
  shale `#6E7B6A`, limestone `#C9CFC4`, coal `#2B2B2B`, conglomerate `#B9855A`.
- **Type:** Impact/Anton for display, Geist for UI, Instrument Serif for editorial pull-quotes.
- **Motion:** slow, physical, geological; respect `prefers-reduced-motion` everywhere.
- **Components to port from GeoQuest:** silver `.text-shine`, preloader with preload gate,
  `useDeferredMount` (heavy WebGL only after load + near viewport), SeismicTap, topographic
  background, StationOrbit (becomes the course-map ring on `/learn`).

---

## 8. Technical architecture

| Concern | Choice |
|---|---|
| App | Vite + React 19 + TypeScript + Tailwind 4 (same stack as GeoQuest) |
| Routing | React Router; each level is a **lazy-loaded route chunk** |
| 3D sims | three.js + @react-three/fiber + drei; one shared `<SimCanvas>` with adaptive DPR, `frameloop="demand"` when idle |
| 2D sims | SVG for diagrams that need crisp labels; Canvas 2D for particle/growth sims |
| Geology math | Pure TS modules in `src/geo/` with unit tests (Vitest): fold profiles, fault-block transforms, separation/heave/throw, well intersections, trishear field, dip isogons, Fleuty classifiers |
| State | Simulation params in URL query (shareable, teacher deep-links) + Zustand for UI |
| Content | MDX per lesson (`src/content/levels/*.mdx`) so text is editable without touching sim code |
| Offline | Workbox service worker (vite-plugin-pwa) — campus Wi-Fi is patchy |
| Hosting | Vercel (with SPA rewrite + cache headers, as in GeoQuest's `vercel.json`) |
| Quality gates | `tsc -b`, ESLint, Vitest for `src/geo`, Playwright smoke test per route, Lighthouse CI on landing + one sim page |

Proposed tree:
```
StructuralGeoLab/
  PLAN.md
  docs/sources/            # notes from Fossen module, USGS text (to paste), reference list
  public/                  # textures, field photos (licensed only), fonts
  src/
    app/                   # routes, layout, providers
    components/            # UI + ported GeoQuest pieces
    sims/                  # one folder per simulation (Sim3_1_Squeeze/, Sim5_3_Well/ …)
    geo/                   # pure geology math + tests
    content/levels/        # MDX lessons, glossary.json, quizzes.json
    styles/
```

---

## 9. Milestones

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Setup** (½ day) | Scaffold, design tokens, ported components, CI, Vercel preview | Deployed empty shell with landing hero placeholder |
| **1. Landing + course map** (2 days) | §4 landing page, `/learn` map, progress storage, glossary skeleton | Landing Lighthouse ≥ 85 mobile; levels lock/unlock |
| **2. Folds core** (3–4 days) | L3 + **L4 (both fold-symmetry sims 4.1 & 4.2)**, fold math + tests | Sims 3.1, 3.2, 3.3, 4.1, 4.2 playable on phone |
| **3. Faults core** (3–4 days) | L5 (5.1–5.4), heave/throw/well math + tests | Well sim reproduces all 4 repeat/missing cases from the e-module |
| **4. Fault depth** (3 days) | L6, L7 incl. trishear | Trishear matches reference geometry for ramp 30° / apex 45° / P/S 1.5 |
| **5. Primary, stress, secondary** (3 days) | L1, L2, L8 | All checks written |
| **6. Descent + sandbox** (3 days) | Capstone and sandbox | End-to-end journey completable |
| **7. Polish** (2 days) | Offline/PWA, accessibility audit, content review by a faculty member, credits page | Sign-off from reviewer |

Suggested first build order inside Phase 2: **Sim 4.1 Symmetry lab** (small, high-impact, proves the
2D SVG pipeline) → **Sim 3.1 Squeeze the layers** (proves the 3D pipeline) → the rest.

---

## 10. Later ideas
Stereonet trainer (plot planes/lines, find fold axis from π-diagram) · AR mode (point phone at an
outcrop/QR on campus — link with Campus GeoQuest stations) · teacher dashboard · Hindi language toggle
· real campus/field photo library with IIT Roorkee Earth Sciences.

---

## 11. Open questions for the owner
1. Final name: **StructuralGeoLab** (working title) or something else?
2. Which syllabus to align to exactly (your course outline would let us mirror unit numbers — the PDF
   is "Unit-4 Faults"; what are Units 1–3 and 5+)?
3. Can a faculty member review content before launch?
4. Paste the USGS page text (blocked from automated reading) so we can source real-world examples.
5. Do you have field photos (or permission to use department photos) for the "Real rock" panels?
