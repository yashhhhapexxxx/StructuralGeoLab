/**
 * Planar attitude (strike & dip) and map-construction maths.
 * Conventions: azimuths in degrees clockwise from north; right-hand rule (RHR):
 * dip direction = strike + 90°. 3D frame used by the scenes: x = east, y = up, z = south.
 */

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
export const norm360 = (a: number) => ((a % 360) + 360) % 360;

export const dipDirection = (strike: number) => norm360(strike + 90);

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export const compass8 = (az: number) => COMPASS[Math.round(norm360(az) / 45) % 8];

/** Quadrant notation, e.g. strike 30, dip 40 → "N30°E / 40° SE". */
export function quadrantNotation(strike: number, dip: number) {
  const s = norm360(strike) % 180; // strike is a line: use the N-pointing end
  const q = s <= 90 ? `N${Math.round(s)}°E` : `N${Math.round(180 - s)}°W`;
  return `${q} / ${Math.round(dip)}° ${compass8(dipDirection(strike))}`;
}

/** Azimuth (RHR) notation, e.g. "030/40". */
export const azimuthNotation = (strike: number, dip: number) =>
  `${String(Math.round(norm360(strike))).padStart(3, "0")}/${String(Math.round(dip)).padStart(2, "0")}`;

/** Unit vectors in scene space (x east, y up, z south). */
export function attitudeVectors(strike: number, dip: number) {
  const s = rad(strike);
  const dd = rad(dipDirection(strike));
  const d = rad(dip);
  const strikeVec = [Math.sin(s), 0, -Math.cos(s)] as const;
  const dipDirVec = [Math.sin(dd), 0, -Math.cos(dd)] as const; // horizontal, down-dip
  const downDip = [Math.cos(d) * dipDirVec[0], -Math.sin(d), Math.cos(d) * dipDirVec[2]] as const;
  const normal = [Math.sin(d) * dipDirVec[0], Math.cos(d), Math.sin(d) * dipDirVec[2]] as const; // upward
  return { strikeVec, dipDirVec, downDip, normal };
}

/** Apparent dip in a vertical section of azimuth `section`: tan α = tan δ · |sin β|. */
export function apparentDip(strike: number, dip: number, section: number) {
  if (dip >= 89.999) return 90;
  const beta = rad(section - strike);
  return deg(Math.atan(Math.tan(rad(dip)) * Math.abs(Math.sin(beta))));
}

/** Map spacing between structure contours (strike lines) of interval Δh. */
export const contourSpacing = (interval: number, dip: number) => (dip <= 0 ? Infinity : interval / Math.tan(rad(dip)));

/** True thickness from outcrop (apparent) width measured perpendicular to strike, flat ground. */
export const trueThickness = (width: number, dip: number) => width * Math.sin(rad(dip));

export type VRule =
  | "upstream-parallel"
  | "upstream-blunter"
  | "upstream-sharper"
  | "downstream"
  | "straight";

/**
 * Rule of Vs for a valley whose floor rises upstream with gradient g (rise/run).
 * dipUpstream: true if beds dip toward the source of the stream.
 */
export function ruleOfV(dip: number, dipUpstream: boolean, valleyGradient: number): VRule {
  if (dip >= 89.5) return "straight";
  if (dip < 0.5) return "upstream-parallel";
  if (dipUpstream) return "upstream-blunter";
  return Math.tan(rad(dip)) < valleyGradient ? "upstream-sharper" : "downstream";
}

export const V_TEXT: Record<VRule, string> = {
  "upstream-parallel": "V points upstream, parallel to the topographic contours",
  "upstream-blunter": "V points upstream, blunter (more open) than the contours",
  "upstream-sharper": "V points upstream, sharper than the contours",
  downstream: "V points downstream",
  straight: "No V — the outcrop crosses the valley in a straight line",
};
