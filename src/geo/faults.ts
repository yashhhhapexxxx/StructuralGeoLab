/**
 * Fault kinematics in a vertical cross-section perpendicular to strike.
 * Terminology after Fossen, "Faults" e-module (ch. 8): hanging wall/footwall, dip slip,
 * heave (horizontal component of dip separation), throw (vertical component).
 * Screen coordinates: x → right, y → down. The fault dips to the RIGHT.
 */

export type DipSlipType = "normal" | "reverse" | "thrust" | "none";

/** Dip-slip classification. slip > 0 = hanging wall down (normal), < 0 = up (reverse). */
export function dipSlipType(dip: number, slip: number): DipSlipType {
  if (Math.abs(slip) < 1e-6) return "none";
  if (slip > 0) return "normal";
  return dip < 30 ? "thrust" : "reverse"; // low-angle reverse faults are thrusts
}

export function dipClass(dip: number): "low-angle" | "intermediate" | "high-angle" {
  if (dip < 30) return "low-angle";
  if (dip > 60) return "high-angle";
  return "intermediate";
}

/** Heave & throw from dip-slip magnitude along a fault of given dip. */
export function heaveThrow(dip: number, slip: number) {
  const r = (dip * Math.PI) / 180;
  const s = Math.abs(slip);
  return { heave: s * Math.cos(r), throw: s * Math.sin(r), dipSeparation: s };
}

/** Hanging-wall displacement vector (screen coords) for signed dip slip. */
export function hangingWallShift(dip: number, slip: number) {
  const r = (dip * Math.PI) / 180;
  // normal (slip>0): down-dip = right & down for a right-dipping fault
  return { dx: slip * Math.cos(r), dy: slip * Math.sin(r) };
}

export interface FaultLine {
  /** a point on the fault (screen coords) */
  x0: number;
  y0: number;
  /** dip in degrees (fault dips to the right) */
  dip: number;
}

/** x-coordinate of the fault trace at depth y. */
export function faultX(f: FaultLine, y: number) {
  return f.x0 + (y - f.y0) / Math.tan((f.dip * Math.PI) / 180);
}

/** Is (x, y) in the hanging wall (above/right of a right-dipping fault)? */
export function inHangingWall(f: FaultLine, x: number, y: number) {
  return x > faultX(f, y);
}

export interface Bed {
  id: string;
  name: string;
  color: string;
  top: number; // y of top surface (pre-faulting)
  base: number;
}

/** Which bed is at original depth y (before faulting)? */
export function bedAt(beds: Bed[], y: number): Bed | null {
  return beds.find((b) => y >= b.top && y < b.base) ?? null;
}

export interface WellLogEntry {
  bed: Bed;
  from: number; // measured depth along the well
  to: number;
}

export interface WellResult {
  log: WellLogEntry[];
  /** Stratigraphic jumps where the well crosses the fault (original, pre-fault depths). */
  jumps: { md: number; fromY: number; toY: number }[];
}

/**
 * Drill a straight well from (x, y) in direction `incl` degrees from vertical
 * (+ = deviating right). Each sample is mapped back to its original (pre-fault)
 * stratigraphic depth, so we can measure missing / repeated section exactly.
 */
export function drillWell(
  beds: Bed[],
  fault: FaultLine,
  slip: number,
  well: { x: number; y: number; incl: number; length: number },
  step = 1,
): WellResult {
  const r = (well.incl * Math.PI) / 180;
  const ux = Math.sin(r);
  const uy = Math.cos(r);
  const { dy } = hangingWallShift(fault.dip, slip);
  const log: WellLogEntry[] = [];
  const jumps: WellResult["jumps"] = [];
  let prevSide: boolean | null = null;
  let prevOrig = 0;
  for (let md = 0; md <= well.length; md += step) {
    const x = well.x + ux * md;
    const y = well.y + uy * md;
    const hw = inHangingWall(fault, x, y);
    const oy = hw ? y - dy : y; // undo the hanging-wall displacement
    const bed = bedAt(beds, oy);
    if (bed && prevSide !== null && hw !== prevSide) {
      // Compare with where the previous sample would have continued (one step on).
      jumps.push({ md, fromY: prevOrig + uy * step, toY: oy });
    }
    if (bed) {
      prevSide = hw;
      prevOrig = oy;
      const last = log[log.length - 1];
      if (last && last.bed.id === bed.id && md - last.to <= step * 1.5) last.to = md;
      else log.push({ bed, from: md, to: md });
    }
  }
  return { log: log.filter((e) => e.to - e.from >= step), jumps };
}

/** Back-compat helper used by older callers/tests. */
export function wellLog(
  beds: Bed[],
  fault: FaultLine,
  slip: number,
  well: { x: number; y: number; incl: number; length: number },
  step = 1,
) {
  return drillWell(beds, fault, slip, well, step).log;
}

export interface SectionAnalysis {
  kind: "missing" | "repeated" | "none";
  /** stratigraphic thickness missing or repeated (same units as bed depths) */
  thickness: number;
  /** beds (fully or partly) affected */
  beds: string[];
}

/**
 * Missing section = the well jumps DOWN the stratigraphy at the fault;
 * repeated section = it jumps back UP (Fossen e-module, ch. 8).
 */
export function analyseWell(beds: Bed[], result: WellResult, minThickness = 2): SectionAnalysis {
  if (!result.jumps.length) return { kind: "none", thickness: 0, beds: [] };
  const j = result.jumps[0];
  const d = j.toY - j.fromY;
  if (Math.abs(d) < minThickness) return { kind: "none", thickness: 0, beds: [] };
  const lo = Math.min(j.fromY, j.toY);
  const hi = Math.max(j.fromY, j.toY);
  const affected = beds.filter((b) => b.base > lo && b.top < hi).map((b) => b.id);
  return { kind: d > 0 ? "missing" : "repeated", thickness: Math.abs(d), beds: affected };
}

export type StrikeSlipSense = "dextral" | "sinistral" | "none";

/** Map view: far block moves right as seen from the near block ⇒ dextral (right-lateral). */
export function strikeSlipSense(offset: number): StrikeSlipSense {
  if (Math.abs(offset) < 1e-6) return "none";
  return offset > 0 ? "dextral" : "sinistral";
}
