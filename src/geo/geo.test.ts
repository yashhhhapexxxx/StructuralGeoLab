import { describe, expect, it } from "vitest";
import { axialOrientation, biotWavelength, foldName, interlimbClass, maxAxialTilt, symmetryState } from "./folds";
import { analyseWell, dipSlipType, drillWell, heaveThrow, strikeSlipSense, type Bed } from "./faults";
import { deformation, strainEllipse } from "./strain";

describe("folds", () => {
  it("Fleuty interlimb classes", () => {
    expect(interlimbClass(150)).toBe("gentle");
    expect(interlimbClass(100)).toBe("open");
    expect(interlimbClass(50)).toBe("close");
    expect(interlimbClass(15)).toBe("tight");
    expect(interlimbClass(2)).toBe("isoclinal");
  });

  it("orientation from axial-surface dip", () => {
    expect(axialOrientation(88)).toBe("upright");
    expect(axialOrientation(45)).toBe("moderately inclined");
    expect(axialOrientation(5)).toBe("recumbent");
  });

  it("zero tilt is symmetric with equal limbs", () => {
    const s = symmetryState(90, 0);
    expect(s.symmetric).toBe(true);
    expect(s.leftDip).toBeCloseTo(45);
    expect(s.limbRatio).toBeCloseTo(1);
  });

  it("tilt makes the fold asymmetric with unequal limbs", () => {
    const s = symmetryState(90, 20);
    expect(s.symmetric).toBe(false);
    expect(s.leftDip).toBeCloseTo(25);
    expect(s.rightDip).toBeCloseTo(65);
    expect(s.limbRatio).toBeGreaterThan(1.5);
    expect(s.vergence).toBe("right");
  });

  it("max tilt keeps limbs within 1–89°", () => {
    const t = maxAxialTilt(90);
    const s = symmetryState(90, t);
    expect(s.leftDip).toBeLessThanOrEqual(89.0001);
    expect(s.rightDip).toBeGreaterThanOrEqual(0.9999);
  });

  it("Biot wavelength: Ld/h = 2π(μL/6μM)^(1/3)", () => {
    expect(biotWavelength(1, 6)).toBeCloseTo(2 * Math.PI);
    expect(biotWavelength(2, 48) / 2).toBeCloseTo(2 * Math.PI * 2);
  });

  it("age vs shape naming", () => {
    expect(foldName("antiform", false)).toBe("Anticline");
    expect(foldName("synform", false)).toBe("Syncline");
    expect(foldName("antiform", true)).toBe("Antiformal syncline");
    expect(foldName("synform", true)).toBe("Synformal anticline");
  });
});

describe("faults", () => {
  it("dip-slip types", () => {
    expect(dipSlipType(60, 10)).toBe("normal");
    expect(dipSlipType(60, -10)).toBe("reverse");
    expect(dipSlipType(20, -10)).toBe("thrust");
  });

  it("heave and throw", () => {
    const h = heaveThrow(30, 10);
    expect(h.heave).toBeCloseTo(8.66, 2);
    expect(h.throw).toBeCloseTo(5, 5);
  });

  it("strike-slip sense", () => {
    expect(strikeSlipSense(5)).toBe("dextral");
    expect(strikeSlipSense(-5)).toBe("sinistral");
  });

  // Horizontal beds 40 px thick. Fault dips right through (300, 0).
  const beds: Bed[] = ["A", "B", "C", "D", "E", "F", "G"].map((id, i) => ({
    id,
    name: id,
    color: "#000",
    top: i * 40,
    base: (i + 1) * 40,
  }));

  // The four cases from the Fossen e-module (stratigraphic separation in wells).
  it("normal fault + vertical well (well steeper than fault) → missing section", () => {
    const fault = { x0: 300, y0: 0, dip: 60 };
    const r = drillWell(beds, fault, 60, { x: 360, y: 0, incl: 0, length: 270 });
    const a = analyseWell(beds, r);
    expect(a.kind).toBe("missing");
    expect(a.thickness).toBeCloseTo(60 * Math.sin(Math.PI / 3), 0); // = throw
  });

  it("reverse fault + vertical well (well steeper than fault) → repeated section", () => {
    const fault = { x0: 300, y0: 0, dip: 40 };
    const r = drillWell(beds, fault, -70, { x: 400, y: 0, incl: 0, length: 270 });
    expect(analyseWell(beds, r).kind).toBe("repeated");
  });

  it("normal fault + low-angle well (fault steeper than well) → repeated section", () => {
    const fault = { x0: 300, y0: 0, dip: 70 };
    const r = drillWell(beds, fault, 60, { x: 200, y: 0, incl: 75, length: 700 });
    expect(analyseWell(beds, r).kind).toBe("repeated");
  });

  it("reverse fault + low-angle well (well shallower than fault) → missing section", () => {
    const fault = { x0: 300, y0: 0, dip: 45 };
    const r = drillWell(beds, fault, -60, { x: 150, y: 0, incl: 75, length: 900 });
    expect(analyseWell(beds, r).kind).toBe("missing");
  });
});

describe("strain", () => {
  it("undeformed circle stays a circle", () => {
    const e = strainEllipse(deformation(1, 0));
    expect(e.R).toBeCloseTo(1);
  });
  it("pure shear k=2 gives R=4 along x", () => {
    const e = strainEllipse(deformation(2, 0));
    expect(e.R).toBeCloseTo(4);
    expect(Math.abs(e.angle)).toBeCloseTo(0);
  });
  it("simple shear γ=1 gives R≈2.62 with X at ~31.7°", () => {
    const e = strainEllipse(deformation(1, 1));
    expect(e.R).toBeCloseTo(2.618, 2);
    expect(e.angle).toBeCloseTo(31.72, 1);
  });
});
