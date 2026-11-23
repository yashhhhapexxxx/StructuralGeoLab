/**
 * Fold geometry & classification helpers.
 * Terminology follows Fossen, Structural Geology (Fleuty 1964 classes; Biot 1961 buckling).
 * Angles are in degrees unless stated.
 */

export type InterlimbClass = "gentle" | "open" | "close" | "tight" | "isoclinal";

/** Fleuty (1964) interlimb-angle classes. */
export function interlimbClass(angle: number): InterlimbClass {
  if (angle >= 120) return "gentle";
  if (angle >= 70) return "open";
  if (angle >= 30) return "close";
  if (angle > 5) return "tight"; // isoclinal is ~0°; treat ≤ 5° as isoclinal in the sims
  return "isoclinal";
}

export type AxialOrientation =
  | "upright"
  | "steeply inclined"
  | "moderately inclined"
  | "gently inclined"
  | "recumbent";

/** Fold orientation from axial-surface dip (hinge assumed sub-horizontal). */
export function axialOrientation(axialDip: number): AxialOrientation {
  const d = Math.abs(axialDip);
  if (d >= 80) return "upright";
  if (d >= 60) return "steeply inclined";
  if (d >= 30) return "moderately inclined";
  if (d >= 10) return "gently inclined";
  return "recumbent";
}

export interface SymmetryState {
  /** dip of the left limb of the antiform (degrees, 0–90) */
  leftDip: number;
  /** dip of the right limb of the antiform (degrees, 0–90) */
  rightDip: number;
  interlimb: number;
  /** tilt of the axial surface from vertical; + = top leans right (fold verges right) */
  axialTilt: number;
  /** axial-surface dip (90 = vertical) */
  axialDip: number;
  /** long-limb : short-limb length ratio (1 = equal limbs) */
  limbRatio: number;
  symmetric: boolean;
  /** direction the fold leans / verges, from the axial-surface tilt */
  vergence: "none" | "left" | "right";
}

/**
 * Fold train with a horizontal enveloping surface. Given the interlimb angle and the
 * axial-surface tilt, derive limb dips, limb-length ratio and symmetry.
 * Symmetric ⇔ the axial surface bisects the interlimb angle AND is perpendicular to the
 * enveloping surface, i.e. tilt = 0 and both limbs dip equally.
 */
export function symmetryState(interlimb: number, axialTilt: number): SymmetryState {
  const half = (180 - interlimb) / 2;
  // Tilting the top of the axial surface to the right steepens (and shortens) the right
  // limb, so the fold leans — verges — to the right.
  const leftDip = half - axialTilt;
  const rightDip = half + axialTilt;
  const rad = Math.PI / 180;
  // Equal fold amplitude ⇒ limb length ∝ 1 / sin(dip)
  const lenL = 1 / Math.sin(Math.max(leftDip, 0.5) * rad);
  const lenR = 1 / Math.sin(Math.max(rightDip, 0.5) * rad);
  const limbRatio = Math.max(lenL, lenR) / Math.min(lenL, lenR);
  const symmetric = Math.abs(axialTilt) < 1.5;
  return {
    leftDip,
    rightDip,
    interlimb,
    axialTilt,
    axialDip: 90 - Math.abs(axialTilt),
    limbRatio,
    symmetric,
    vergence: symmetric ? "none" : axialTilt > 0 ? "right" : "left",
  };
}

/** Largest axial tilt that keeps both limbs dipping 1°–89° (no overturned limbs in this sim). */
export function maxAxialTilt(interlimb: number): number {
  const half = (180 - interlimb) / 2;
  return Math.max(0, Math.min(89 - half, half - 1));
}

/**
 * Points of an asymmetric fold train (antiform–synform alternation) in a box.
 * Returns hinge points too, so callers can draw axial traces.
 */
export function foldTrain(
  s: SymmetryState,
  opts: { width: number; amplitude: number; startX: number; midY: number },
) {
  const { width, amplitude, startX, midY } = opts;
  const rad = Math.PI / 180;
  const dxL = amplitude / Math.tan(Math.max(s.leftDip, 0.5) * rad); // run of a left limb (rising)
  const dxR = amplitude / Math.tan(Math.max(s.rightDip, 0.5) * rad); // run of a right limb (falling)
  const pts: [number, number][] = [];
  const hinges: { x: number; y: number; kind: "antiform" | "synform" }[] = [];
  let x = startX;
  let y = midY + amplitude / 2; // start in a synform trough
  pts.push([x, y]);
  hinges.push({ x, y, kind: "synform" });
  while (x < startX + width) {
    x += dxL;
    y = midY - amplitude / 2;
    pts.push([x, y]);
    hinges.push({ x, y, kind: "antiform" });
    x += dxR;
    y = midY + amplitude / 2;
    pts.push([x, y]);
    hinges.push({ x, y, kind: "synform" });
  }
  return { pts, hinges };
}

/** Smooth a zig-zag polyline into an SVG path with rounded hinges (quadratic corners). */
export function roundedPath(pts: [number, number][], radius: number): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const l1 = Math.hypot(x1 - x0, y1 - y0);
    const l2 = Math.hypot(x2 - x1, y2 - y1);
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const ax = x1 + ((x0 - x1) / l1) * r;
    const ay = y1 + ((y0 - y1) / l1) * r;
    const bx = x1 + ((x2 - x1) / l2) * r;
    const by = y1 + ((y2 - y1) / l2) * r;
    d += ` L ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${x1.toFixed(1)} ${y1.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
  return d;
}

/**
 * Biot (1961) dominant wavelength of a single competent layer buckling in a
 * weaker matrix:  Ld / h = 2π (μL / 6μM)^(1/3)
 */
export function biotWavelength(thickness: number, viscosityRatio: number): number {
  return 2 * Math.PI * thickness * Math.cbrt(viscosityRatio / 6);
}

/** Fold-and-age naming: shape (antiform/synform) × stratigraphy (normal/overturned). */
export function foldName(shape: "antiform" | "synform", overturned: boolean): string {
  if (shape === "antiform") return overturned ? "Antiformal syncline" : "Anticline";
  return overturned ? "Synformal anticline" : "Syncline";
}
