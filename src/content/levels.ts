/**
 * Course content. Text is original, written for this site; concepts and terminology follow
 * H. Fossen, "Structural Geology" (Cambridge UP) and its e-modules "Faults" (ch. 8) and
 * "Folding" — free for educational use, credited on every page that draws on them.
 */

export type SimKey =
  | "WayUp"
  | "StrainEllipse"
  | "FoldAnatomy"
  | "FoldSymmetryLab"
  | "ParasiticFolds"
  | "BucklingLab"
  | "FoldMechanisms"
  | "FaultSection"
  | "StrikeSlipMap"
  | "WellLab"
  | "SortStructures"
  | "StrikeDip3D"
  | "StructureContours3D"
  | "RuleOfV3D"
  | "CrossSectionBuilder"
  | "TrueThickness"
  | "Fault3D"
  | "RiftBuilder"
  | "FaultDrag"
  | "TrishearFold"
  | "FaultGrowth"
  | "WingCracks"
  | "FaultZone"
  | "MohrAnderson";

export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "terms"; items: [string, string][] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "callout"; title: string; text: string }
  | { type: "sim"; sim: SimKey; prompt?: string };

export interface Question {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Level {
  n: number;
  slug: string;
  title: string;
  tagline: string;
  minutes: number;
  blocks: Block[];
  quiz: Question[];
  sources: string[];
}

const FOSSEN_BOOK = "H. Fossen — Structural Geology, Cambridge University Press.";
const FOSSEN_FAULTS = "H. Fossen & T. Johansen — Faults, Chapter 8 e-module (2014). Free use for educational purposes.";
const FOSSEN_FOLDS = "H. Fossen — Folding (fold mechanisms) e-module, companion to Structural Geology.";

export const LEVELS: Level[] = [
  {
    n: 1,
    slug: "primary-structures",
    title: "Primary structures",
    tagline: "How rocks are born — and how to tell which way is up",
    minutes: 12,
    blocks: [
      { type: "sim", sim: "WayUp", prompt: "Before any definitions: try to decide whether each outcrop is the right way up." },
      {
        type: "p",
        text: "A primary structure forms while the rock itself is forming — as sediment settles, dries or is reworked by currents, or as lava flows and cools. Secondary structures (folds, faults, joints, cleavage) are added later, when the solid rock is deformed. Structural geology is mostly about secondary structures, but primary ones are the reference frame we measure them against.",
      },
      { type: "h", text: "Two founding rules" },
      {
        type: "terms",
        items: [
          ["Original horizontality", "Sediment is deposited in (near-)horizontal layers. Tilted or folded beds have been deformed."],
          ["Superposition", "In an undisturbed sequence, younger layers lie on older ones. Folding can turn a sequence upside down — so we need way-up indicators."],
        ],
      },
      { type: "h", text: "Way-up (younging) indicators" },
      {
        type: "table",
        head: ["Structure", "What it looks like", "Points to the top"],
        rows: [
          ["Graded bedding", "Grains fine upward within each bed", "The fine-grained side"],
          ["Cross-bedding", "Inclined foresets, tangential at the base, cut off at the top", "The truncated side"],
          ["Mud cracks", "V-shaped cracks filled from above", "The wide end of the V"],
          ["Wave ripples", "Sharp crests, rounded troughs", "The sharp crests"],
          ["Load casts / flame structures", "Bulges of sand sinking into soft mud", "Away from the bulges"],
          ["Pillow lavas", "Rounded tops, a tail pointing down between pillows", "The rounded tops"],
        ],
      },
      {
        type: "callout",
        title: "Why it matters",
        text: "An arch-shaped fold is only an anticline if its oldest rocks are in the core. If the beds are overturned, the same shape is a synformal anticline or an antiformal syncline. You can only tell by reading way-up — you'll use this in Level 3.",
      },
    ],
    quiz: [
      { q: "Which is a primary structure?", options: ["A fault", "Cross-bedding", "Slaty cleavage", "A kink band"], answer: 1, why: "Cross-bedding forms during deposition; the others form when solid rock deforms." },
      { q: "In graded bedding the top of each bed is…", options: ["Coarse-grained", "Fine-grained", "Always red", "Cut by a fault"], answer: 1, why: "Coarse grains settle first, fine grains last — so grains fine upward." },
      { q: "Mud cracks are widest at…", options: ["Their base", "Their top", "Their middle", "Both ends equally"], answer: 1, why: "They open at the drying surface and taper downward, then are filled from above." },
    ],
    sources: [FOSSEN_BOOK],
  },
  {
    n: 2,
    slug: "stress-and-strain",
    title: "Stress, strain & depth",
    tagline: "Forces in, shapes out — and why rocks bend or break",
    minutes: 15,
    blocks: [
      { type: "sim", sim: "StrainEllipse", prompt: "Squeeze the circle of fossils. What shape does a circle always become?" },
      {
        type: "p",
        text: "Stress is force per unit area acting inside a rock. At any point it can be described by three perpendicular principal stresses, σ1 ≥ σ2 ≥ σ3. Strain is the change in shape (and possibly size) that results. Structural geologists usually see only the strain — the deformed rock — and work backwards to the stresses and the history.",
      },
      {
        type: "terms",
        items: [
          ["Strain ellipse", "Any circle in a homogeneously deformed rock becomes an ellipse. Its long axis X is the direction of maximum stretching, its short axis Y the maximum shortening."],
          ["Ellipticity R = X/Y", "A single number for how strongly the rock is strained (R = 1 means undeformed)."],
          ["Pure shear (coaxial)", "Shortening in one direction and stretching at right angles; the strain axes do not rotate."],
          ["Simple shear (non-coaxial)", "Like sliding a deck of cards: the strain axes rotate as strain builds — typical of shear zones."],
        ],
      },
      { type: "h", text: "When does rock break?" },
      { type: "sim", sim: "MohrAnderson", prompt: "Raise the pore pressure until the circle touches the envelope. Then switch which stress is vertical." },
      {
        type: "p",
        text: "On a Mohr diagram every plane through a point plots on a circle whose ends are σ1 and σ3. Rock fails when the circle touches the failure envelope (Coulomb: τ = C + σn tan φ). The touching point fixes the fracture angle: about 30° to σ1 for typical rocks (θ = 45° − φ/2). Fluid pressure lowers the effective stresses, sliding the circle toward failure — one reason injected fluids can trigger earthquakes. When σ3′ becomes tensile, extension fractures (joints) open perpendicular to σ3 instead. Anderson’s theory follows: σ1 vertical → normal faults dipping ~60°; σ3 vertical → thrusts dipping ~30°; σ2 vertical → vertical strike-slip faults.",
      },
      { type: "h", text: "Brittle or ductile?" },
      {
        type: "p",
        text: "Near the surface rocks are cold and under little confining pressure, so they break: joints and faults dominate. Faults commonly form in the upper ~10–15 km of the continental crust. Deeper, higher temperature and pressure let rocks flow, so folds, cleavage and ductile shear zones take over. The change happens across the brittle–ductile transition — explore it in the Into the Crust journey.",
      },
    ],
    quiz: [
      { q: "A circle deformed homogeneously becomes…", options: ["A square", "An ellipse", "A triangle", "It stays a circle"], answer: 1, why: "Homogeneous strain always maps circles to ellipses: the strain ellipse." },
      { q: "R = X/Y = 1 means…", options: ["Very high strain", "No shape change", "Pure shear only", "Rotation only"], answer: 1, why: "Equal axes: the circle is still a circle." },
      { q: "In which deformation do the strain axes rotate?", options: ["Pure shear", "Simple shear", "Neither", "Both equally"], answer: 1, why: "Simple shear is non-coaxial — the ellipse rotates as shear increases." },
    ],
    sources: [FOSSEN_BOOK],
  },
  {
    n: 3,
    slug: "strike-dip-maps",
    title: "Strike, dip & geological maps",
    tagline: "Measure a tilted bed in 3D — then read it off a map",
    minutes: 30,
    blocks: [
      { type: "sim", sim: "StrikeDip3D", prompt: "Turn the strike dial and tilt the bed. Watch where the blue water plane cuts it." },
      {
        type: "p",
        text: "Every planar surface in rock — a bed, a fault, a joint — is described by two numbers. Imagine flooding the land: the shoreline drawn on a tilted bed is perfectly horizontal. That line is the strike. Roll a marble down the bed and it follows the steepest path, always at right angles to strike: its angle below the horizontal is the dip.",
      },
      {
        type: "terms",
        items: [
          ["Strike", "Azimuth (compass direction) of a horizontal line on the plane — where it meets a horizontal surface."],
          ["Dip", "The angle between the plane and the horizontal, measured perpendicular to strike (0°–90°)."],
          ["Dip direction", "The compass direction the plane slopes down toward; with the right-hand rule it is strike + 90°."],
          ["Apparent dip", "A shallower dip seen in any vertical section not perpendicular to strike: tan α = tan δ · sin β, where β is the angle between strike and the section."],
          ["Quadrant notation", "N30°E / 40° SE — strike measured from N toward E or W, then dip and its general direction."],
          ["Azimuth (RHR) notation", "030/40 — strike as a three-digit azimuth with the plane dipping to the right of it."],
        ],
      },
      {
        type: "callout",
        title: "On the map",
        text: "Strike and dip are shown with a T-shaped symbol: the long bar along strike, the short tick pointing down-dip, and the dip angle written beside it.",
      },
      { type: "h", text: "Structure contours (strike lines)" },
      { type: "sim", sim: "StructureContours3D", prompt: "Steepen the plane. Do the red lines on the map get closer or further apart?" },
      {
        type: "p",
        text: "Slice a dipping surface with horizontal planes at fixed heights — 100 m, 200 m, 300 m… Each slice meets the surface along a strike line, and when we label those lines with their elevation they become structure contours (stratum contours): lines joining points of equal elevation on the surface. On a map they are straight and parallel for a planar surface, and their spacing tells you the dip.",
      },
      {
        type: "table",
        head: ["What you see on the map", "What it means"],
        rows: [
          ["Straight, parallel, evenly spaced structure contours", "A planar surface with constant strike and dip"],
          ["Closely spaced contours", "Steep dip — spacing = Δh / tan δ"],
          ["Widely spaced contours", "Gentle dip"],
          ["Contour values decrease toward…", "…the dip direction"],
          ["Curved structure contours", "A folded or irregular surface"],
        ],
      },
      { type: "h", text: "Outcrop patterns: the Rule of Vs" },
      { type: "sim", sim: "RuleOfV3D", prompt: "Try every preset, then switch to Map view. Which way does the V point each time?" },
      {
        type: "p",
        text: "Where a contact between beds crosses a valley, its outcrop trace bends into a V. Horizontal beds follow the topographic contours, so their V points upstream exactly like the contours. Beds dipping upstream make a blunter upstream V. Beds dipping downstream more gently than the valley floor make a sharper upstream V; dipping more steeply than the floor, the V flips and points downstream. Vertical beds cross the valley in a straight line.",
      },
      {
        type: "table",
        head: ["Beds dip…", "Outcrop V"],
        rows: [
          ["Horizontal", "Points upstream, parallel to contours"],
          ["Upstream", "Points upstream, blunter than contours"],
          ["Downstream, gentler than the valley floor", "Points upstream, sharper than contours"],
          ["Downstream, steeper than the valley floor", "Points downstream"],
          ["Vertical", "Straight — no V"],
        ],
      },
      { type: "h", text: "Building a cross-section" },
      { type: "sim", sim: "CrossSectionBuilder", prompt: "Press Construct and follow each step. Then move the section line and build it again." },
      {
        type: "list",
        items: [
          "Draw the section line (here PQ, perpendicular to strike so the section shows the true dip).",
          "Where the line crosses each topographic contour, drop the point onto the profile at that elevation and join the points: the topographic profile.",
          "Where the line crosses each structure contour of a contact, plot a point at that contour’s elevation.",
          "Join each contact’s points. Where the line runs above the ground it has been eroded (draw it dotted); below the ground it is the contact in the section.",
          "Colour and label the units between the contacts. A section oblique to strike shows the apparent dip instead.",
        ],
      },
      { type: "h", text: "True vs apparent thickness" },
      { type: "sim", sim: "TrueThickness", prompt: "Lower the dip. What happens to the width of Bed Q on the map?" },
      {
        type: "p",
        text: "A tilted bed crops out over a wider strip than its real thickness. On flat ground, measured perpendicular to strike, the outcrop width w and the true thickness t are two sides of a right-angled triangle with the dip δ between the ground and the bed: t = w · sin δ. Only vertical beds show their true thickness on a map.",
      },
    ],
    quiz: [
      { q: "A bed strikes 040° and dips 30° (right-hand rule). Its dip direction is…", options: ["040°", "130°", "220°", "310°"], answer: 1, why: "RHR: dip direction = strike + 90° = 130° (SE)." },
      { q: "On a map, structure contours of a planar bed get closer together. The bed is…", options: ["Steeper", "Gentler", "Horizontal", "Overturned"], answer: 0, why: "Spacing = Δh / tan δ — larger dip, smaller spacing." },
      { q: "A contact crosses a valley and its V points downstream. The beds dip…", options: ["Upstream", "Downstream, more gently than the valley floor", "Downstream, more steeply than the valley floor", "Horizontally"], answer: 2, why: "Only beds dipping downstream more steeply than the stream gradient make a downstream-pointing V." },
      { q: "A bed dipping 30° crops out 100 m wide on flat ground (⟂ strike). Its true thickness is…", options: ["30 m", "50 m", "87 m", "200 m"], answer: 1, why: "t = w · sin δ = 100 × sin 30° = 50 m." },
    ],
    sources: [FOSSEN_BOOK, "Standard geological-map construction methods (structure contours, rule of Vs, true thickness)."],
  },
  {
    n: 4,
    slug: "fold-anatomy",
    title: "Folds: anticlines & synclines",
    tagline: "Hinges, limbs, axial surfaces — and why age beats shape",
    minutes: 15,
    blocks: [
      { type: "sim", sim: "FoldAnatomy", prompt: "Press “Squeeze the layers” and orbit the block. Then flip the stratigraphy, add plunge and erode it — what happens on the map?" },
      {
        type: "terms",
        items: [
          ["Hinge", "The zone of maximum curvature; the hinge line runs along it."],
          ["Limbs", "The flatter parts either side of the hinge."],
          ["Axial surface", "The surface containing the hinge lines of successive layers."],
          ["Inflection point", "Where curvature changes sign between an antiform and a synform."],
          ["Wavelength & amplitude", "Distance between equivalent hinges; half the height from trough to crest."],
          ["Crest & trough", "Highest and lowest points of a fold (not always the hinge in inclined folds)."],
        ],
      },
      { type: "h", text: "Shape vs age" },
      {
        type: "table",
        head: ["", "Youngest on top (normal)", "Overturned sequence"],
        rows: [
          ["Arch shape (antiform)", "Anticline — oldest rocks in the core", "Antiformal syncline"],
          ["Trough shape (synform)", "Syncline — youngest rocks in the core", "Synformal anticline"],
        ],
      },
      {
        type: "callout",
        title: "Reading a geological map",
        text: "Erode an anticline and the oldest beds appear in the middle of the outcrop pattern, flanked symmetrically by younger ones; a syncline shows the youngest in the middle. Plunging folds make V-shaped ('nosing') patterns; domes and basins make bullseyes.",
      },
    ],
    quiz: [
      { q: "An anticline has … rocks in its core.", options: ["The youngest", "The oldest", "Igneous", "No"], answer: 1, why: "Anticline is defined by age: the oldest beds are in the core." },
      { q: "An arch-shaped fold in an overturned sequence is a…", options: ["Anticline", "Syncline", "Antiformal syncline", "Monocline"], answer: 2, why: "Shape = antiform; ages = syncline (youngest in the core)." },
      { q: "On a map of an eroded syncline the middle of the pattern shows…", options: ["Oldest beds", "Youngest beds", "A fault", "Nothing"], answer: 1, why: "The youngest beds sit in the core of a syncline." },
    ],
    sources: [FOSSEN_BOOK],
  },
  {
    n: 5,
    slug: "fold-symmetry",
    title: "Fold symmetry & classification",
    tagline: "Symmetric or asymmetric, gentle to isoclinal, S, Z and M",
    minutes: 20,
    blocks: [
      { type: "sim", sim: "FoldSymmetryLab", prompt: "Tilt the axial surface. When exactly does the fold stop being symmetric?" },
      {
        type: "p",
        text: "A fold is symmetric when its axial surface bisects the interlimb angle and is perpendicular to the enveloping surface (the surface touching successive hinges); its limbs are then equally long. Tilt the axial surface and the fold becomes asymmetric: one limb becomes short and steep, the other long and gentle, and the fold leans — verges — toward the short limb.",
      },
      { type: "h", text: "Interlimb angle (Fleuty, 1964)" },
      {
        type: "table",
        head: ["Class", "Interlimb angle"],
        rows: [
          ["Gentle", "180°–120°"],
          ["Open", "120°–70°"],
          ["Close", "70°–30°"],
          ["Tight", "30°–0°"],
          ["Isoclinal", "≈ 0° (parallel limbs)"],
          ["Elastica", "< 0° (limbs bulge past parallel)"],
        ],
      },
      { type: "h", text: "Orientation" },
      {
        type: "p",
        text: "With a near-horizontal hinge, folds are named from the dip of the axial surface: upright (steep, ~80–90°), inclined (10–80°), recumbent (near flat, < 10°). An overturned fold has one limb rotated past vertical. Plunging folds have inclined hinges; when the hinge plunges down the dip of the axial surface the fold is reclined.",
      },
      { type: "sim", sim: "ParasiticFolds", prompt: "Move the hand lens along the big fold. Then try the field challenge." },
      {
        type: "p",
        text: "Small (second-order or parasitic) folds on the limbs of a large fold are asymmetric because of shear on the limbs. Viewed down plunge on an antiform they are Z-shaped on the left limb, M-shaped (symmetric) in the hinge zone and S-shaped on the right limb — so their asymmetry points toward the hinge of the larger fold. Geologists use this in the field to find hinges they cannot see.",
      },
      {
        type: "callout",
        title: "Dip isogons (Ramsay)",
        text: "Join points of equal dip on the outer and inner surface of a folded layer. Converging isogons = Class 1 (1A, 1B parallel, 1C); parallel isogons = Class 2 (similar folds, constant thickness along the axial surface); diverging = Class 3. Parallel (1B) folds are typical of buckling; similar (Class 2) folds of passive folding.",
      },
    ],
    quiz: [
      { q: "A fold whose axial surface bisects the limbs and is perpendicular to the enveloping surface is…", options: ["Asymmetric", "Symmetric", "Recumbent", "Isoclinal"], answer: 1, why: "That is the definition of a symmetric fold." },
      { q: "An interlimb angle of 50° is…", options: ["Gentle", "Open", "Close", "Tight"], answer: 2, why: "Close folds have interlimb angles between 70° and 30°." },
      { q: "You find Z-shaped small folds on an antiform (viewed down plunge). The hinge is…", options: ["To the left", "To the right", "Directly below", "Impossible to tell"], answer: 1, why: "Z folds sit on the left limb of an antiform, so the hinge lies to the right." },
    ],
    sources: [FOSSEN_BOOK],
  },
  {
    n: 6,
    slug: "how-folds-form",
    title: "How folds form",
    tagline: "Buckling, bending and passive folding",
    minutes: 20,
    blocks: [
      { type: "sim", sim: "BucklingLab", prompt: "Lower the competence contrast to 1×. Why does the layer stop folding?" },
      {
        type: "p",
        text: "There are three fundamental folding mechanisms. In buckling (active folding) a stiffer — more competent, more viscous — layer is shortened parallel to its length and an instability grows into folds. In bending (forced folding) forces act across the layering. In passive folding there is no competence contrast at all: layers are just markers carried along by flow.",
      },
      { type: "h", text: "Buckling" },
      {
        type: "list",
        items: [
          "Needs a layer stiffer than its surroundings, layer-parallel shortening, and plastic (ductile) deformation.",
          "With no competence contrast the layer simply shortens by thickening; in the brittle regime it may fail instead.",
          "Biot (1961): the dominant wavelength grows with layer thickness and with the viscosity contrast, Ld / h = 2π (μL / 6μM)^(1/3).",
          "High contrast → long wavelength, large amplitude. Low contrast → a long phase of thickening before folds appear.",
          "In multilayers thin layers fold first; the thick layer folds them again, giving first- and second-order (parasitic) folds.",
        ],
      },
      { type: "sim", sim: "FoldMechanisms", prompt: "Compare the four models. Where is strain zero? Where is it largest?" },
      {
        type: "terms",
        items: [
          ["Flexural slip", "Layers slip on bedding planes like bending a paperback book; thickness is kept and slip grows away from the hinge. Look for slickenlines on bedding."],
          ["Flexural flow", "The same, but the slip is distributed (ductile shear inside the layers). Zero strain at the hinge, increasing down the limbs."],
          ["Orthogonal flexure", "Lines perpendicular to layering stay perpendicular. The outer arc stretches, the inner arc shortens, separated by a neutral surface; gives parallel (Class 1B) folds."],
          ["Inner-arc collapse", "Volume loss in the inner arc (e.g. dissolution) while the outer arc keeps its length — no neutral surface."],
        ],
      },
      { type: "h", text: "Passive folding & bending" },
      {
        type: "list",
        items: [
          "Passive folds form by flow without competence contrast — think of a deck of cards sheared on each side of the axial trace. They are similar (Class 2) folds, with constant thickness parallel to the axial surface; common in shear zones and hot, deep crust.",
          "Bending (forced folding) gives monoclines above reactivated basement faults, fault-bend and fault-propagation folds at ramps, and folds over rising salt diapirs and laccoliths. It needs no layer-parallel shortening and has no regular wavelength.",
          "Kink folds — angular hinges and straight limbs — form in strongly foliated rocks such as schist and phyllite.",
        ],
      },
    ],
    quiz: [
      { q: "Buckling requires…", options: ["No competence contrast", "A competent layer shortened parallel to its length", "Forces acting across the layering", "Brittle failure"], answer: 1, why: "Buckling is an instability of a stiffer layer under layer-parallel shortening." },
      { q: "Doubling the viscosity contrast makes the buckle wavelength…", options: ["Halve", "Stay the same", "Grow (by the cube root)", "Grow eightfold"], answer: 2, why: "Ld ∝ (μL/μM)^(1/3) — it grows, but only by 2^(1/3) ≈ 1.26." },
      { q: "In orthogonal flexure the outer arc is…", options: ["Shortened", "Stretched", "Unchanged", "Faulted"], answer: 1, why: "Outer arc extension, inner arc contraction, separated by a neutral surface." },
    ],
    sources: [FOSSEN_FOLDS, FOSSEN_BOOK, "M. A. Biot (1961), Theory of folding of stratified viscoelastic media."],
  },
  {
    n: 7,
    slug: "faults",
    title: "Faults: the basics",
    tagline: "Hanging walls, footwalls and which way things moved",
    minutes: 20,
    blocks: [
      { type: "sim", sim: "FaultSection", prompt: "Drag the slip both ways. What decides whether it's normal or reverse?" },
      {
        type: "p",
        text: "Faults are fractures or zones of localized deformation that accommodate movement parallel to the fracture surface — usually a metre or more. Smaller fault-like structures are called shear fractures. Most natural faults are composite zones rather than a single clean surface. They form mostly in the upper 10–15 km of the crust and control earthquakes and the flow of fluids such as groundwater, oil and gas.",
      },
      {
        type: "terms",
        items: [
          ["Hanging wall / footwall", "For a non-vertical fault, the block above the fault is the hanging wall; the block below is the footwall."],
          ["Normal fault", "Hanging wall moves down the dip — the crust is extended."],
          ["Reverse fault", "Hanging wall moves up the dip — the crust is shortened. Low-angle (< 30°) reverse faults are thrusts."],
          ["Strike-slip fault", "Movement parallel to strike: dextral (right-lateral) or sinistral (left-lateral)."],
          ["Oblique-slip fault", "Dip-slip and strike-slip combined."],
          ["Dip, strike & pitch (rake)", "Dip is measured perpendicular to strike; pitch is the angle between the strike and the slip direction within the fault plane."],
        ],
      },
      { type: "sim", sim: "StrikeSlipMap", prompt: "Stand on one side, look across: did the far side move to your right or left?" },
      { type: "sim", sim: "Fault3D", prompt: "Use the presets, then dial the rake slowly from 90° to 0°. When does a normal fault become oblique — and then strike-slip?" },
      {
        type: "p",
        text: "A fault is fully described by its plane (strike and dip) and the slip direction within it. The rake (pitch) is the angle in the fault plane from the strike to the slip vector: 90° is pure dip-slip, 0° or 180° pure strike-slip, anything between is oblique-slip. The slip vector splits into a dip-slip and a strike-slip component.",
      },
      { type: "h", text: "Measuring the offset" },
      {
        type: "terms",
        items: [
          ["Displacement (net slip)", "Distance between two originally touching points, split into dip-slip and strike-slip components."],
          ["Separation", "Apparent offset seen in a particular section; it equals displacement only if the section contains the slip vector."],
          ["Heave", "Horizontal component of dip separation."],
          ["Throw", "Vertical component of dip separation."],
        ],
      },
      {
        type: "list",
        items: [
          "Synthetic faults dip the same way as the main fault; antithetic faults dip the opposite way.",
          "Oppositely dipping faults make horsts (up-blocks) and grabens (down-blocks). Asymmetric half-grabens are more common than symmetric grabens.",
          "Low-angle faults dip < 30°, high-angle > 60°; wrench (strike-slip) faults are often sub-vertical.",
        ],
      },
      { type: "sim", sim: "RiftBuilder", prompt: "Animate rifting. Which blocks are hanging walls, and which is the footwall of two faults at once?" },
    ],
    quiz: [
      { q: "The hanging wall moved down the dip. The fault is…", options: ["Reverse", "Normal", "Thrust", "Dextral"], answer: 1, why: "Hanging wall down = normal fault (extension)." },
      { q: "A reverse fault dipping 20° is called a…", options: ["Wrench fault", "Thrust", "Graben", "Growth fault"], answer: 1, why: "Low-angle (< 30°) reverse faults are thrusts." },
      { q: "Throw is the … component of dip separation.", options: ["Horizontal", "Vertical", "Strike-parallel", "Total"], answer: 1, why: "Throw is vertical; heave is horizontal." },
    ],
    sources: [FOSSEN_FAULTS, FOSSEN_BOOK],
  },
  {
    n: 8,
    slug: "faults-in-depth",
    title: "Faults in depth",
    tagline: "Wells, fault cores, damage zones and growing faults",
    minutes: 25,
    blocks: [
      { type: "sim", sim: "WellLab", prompt: "Make a repeated section, then a missing one. Which two settings decide it?" },
      {
        type: "p",
        text: "Wells drilled through faults in layered rocks reveal the stratigraphic separation. The well log either repeats part of the section or misses part of it, depending on the fault type and on whether the well is steeper or shallower than the fault. The thickness repeated or missing equals the stratigraphic separation across the fault.",
      },
      {
        type: "table",
        head: ["Fault", "Well steeper than fault", "Well shallower than fault"],
        rows: [
          ["Normal", "Missing section", "Repeated section"],
          ["Reverse", "Repeated section", "Missing section"],
        ],
      },
      { type: "h", text: "Fault architecture" },
      { type: "sim", sim: "FaultZone", prompt: "Increase the throw, then move next to a branch point. What happens to the damage zone?" },
      {
        type: "terms",
        items: [
          ["Fault core", "Takes up most of the displacement: slip surfaces, gouge, breccia and lenses ('horses') of wall rock. From a single surface to several metres wide."],
          ["Damage zone", "Envelope of deformation bands, minor slip surfaces, shear fractures and joints; wider in some lithologies and around complexities."],
          ["Drag", "Layers bent near the fault. Usually formed ahead of the propagating fault (fault-propagation folding, e.g. trishear) rather than by friction."],
        ],
      },
      { type: "h", text: "How faults grow" },
      { type: "sim", sim: "WingCracks", prompt: "Load each rock type. How does a fault begin in tight rock compared with porous sandstone?" },
      { type: "sim", sim: "FaultGrowth", prompt: "Play the fault’s life. Watch the green profile before and after the relay ramp is breached." },
      {
        type: "list",
        items: [
          "Non-porous rocks: micro-cracks (Griffith cracks) under shear grow curved wing cracks toward σ1, link up, and a process zone ahead of the tip turns into gouge and finally a through-going slip surface.",
          "Porous rocks (sandstones): shear makes deformation bands; strain hardening shifts slip to new bands until a band zone forms, then slip surfaces develop.",
          "An ideal isolated fault has maximum displacement at its centre, decreasing to zero at the tip line.",
          "Faults grow in populations: segments interact through their stress fields, overlap in relay (transfer, accommodation) zones, and soft-linked faults become hard-linked when relay ramps are breached.",
          "In sandstone–shale stacks faults nucleate in the stiffer sandstone, stall at shale, spread sideways, then break through.",
        ],
      },
      { type: "h", text: "Fault drag & fault-propagation folds" },
      { type: "sim", sim: "FaultDrag", prompt: "Compare normal and reverse drag. In which does the hanging wall roll over toward the fault?" },
      { type: "sim", sim: "TrishearFold", prompt: "Animate, then try P/S = 0.5 and P/S = 3. Why does a slow tip make a tighter fold?" },
      {
        type: "p",
        text: "Layers are often bent next to faults. Most drag forms ahead of a propagating fault tip — the fold comes first and the fault then cuts it (trishear fault-propagation folding). Normal drag curves the layers against the slip direction; reverse drag, typical in the hanging wall of listric normal faults, makes a rollover anticline.",
      },
    ],
    quiz: [
      { q: "A vertical well cuts a normal fault dipping 60°. The log shows…", options: ["Repeated section", "Missing section", "No change", "Doubled thickness everywhere"], answer: 1, why: "Normal fault + well steeper than fault → missing section." },
      { q: "Most of a fault's displacement is taken up in the…", options: ["Damage zone", "Fault core", "Footwall", "Process zone"], answer: 1, why: "The fault core absorbs most deformation; the damage zone surrounds it." },
      { q: "Displacement on an ideal isolated fault is largest…", options: ["At the tips", "At the centre", "Everywhere equal", "At the surface"], answer: 1, why: "Maximum at the centre, decreasing to zero at the tip line." },
    ],
    sources: [FOSSEN_FAULTS, FOSSEN_BOOK],
  },
  {
    n: 9,
    slug: "secondary-structures",
    title: "Secondary structures",
    tagline: "Everything deformation adds — and in what order",
    minutes: 12,
    blocks: [
      { type: "sim", sim: "SortStructures", prompt: "Sort each structure: did it form with the rock, or after?" },
      {
        type: "terms",
        items: [
          ["Joints", "Fractures with no visible shear offset, often in parallel sets."],
          ["Veins", "Fractures filled with minerals precipitated from fluids (quartz, calcite)."],
          ["Folds & faults", "Ductile bending and brittle offset of layering (Levels 3–7)."],
          ["Cleavage & foliation", "Planar fabrics from aligned minerals: slaty cleavage, schistosity, gneissic banding."],
          ["Lineation", "Linear fabrics: stretched grains, mineral alignment, fold-hinge lines, slickenlines."],
          ["Boudinage", "A stiff layer stretched into sausage-shaped pieces inside a softer matrix."],
          ["Shear zones & mylonites", "Ductile zones of intense simple shear, the deep equivalents of faults."],
        ],
      },
      {
        type: "callout",
        title: "Relative ages",
        text: "A structure that cuts or deforms another must be younger. A dike cutting folded layers is younger than the folding; an unfolded vein crossing a folded layer tells you the shortening direction was at a high angle to the vein.",
      },
    ],
    quiz: [
      { q: "Which is a secondary structure?", options: ["Ripple marks", "Graded bedding", "Boudinage", "Mud cracks"], answer: 2, why: "Boudinage forms by stretching solid rock; the rest form during deposition." },
      { q: "A fracture with no shear offset is a…", options: ["Fault", "Joint", "Thrust", "Mylonite"], answer: 1, why: "Joints are fractures without visible shear displacement." },
      { q: "A dike cuts across folded layers. The dike is…", options: ["Older than the folds", "Younger than the folds", "The same age", "Impossible to tell"], answer: 1, why: "Cross-cutting structures are younger than what they cut." },
    ],
    sources: [FOSSEN_BOOK],
  },
];

export const levelBySlug = (slug: string) => LEVELS.find((l) => l.slug === slug);
