import { describe, expect, it } from "vitest";
import { apparentDip, attitudeVectors, azimuthNotation, contourSpacing, dipDirection, quadrantNotation, ruleOfV, trueThickness } from "./attitude";

describe("attitude", () => {
  it("RHR dip direction", () => {
    expect(dipDirection(30)).toBe(120);
    expect(dipDirection(300)).toBe(30);
  });
  it("notations", () => {
    expect(quadrantNotation(30, 40)).toBe("N30°E / 40° SE");
    expect(quadrantNotation(300, 20)).toBe("N60°W / 20° NE");
    expect(azimuthNotation(30, 40)).toBe("030/40");
  });
  it("normal is perpendicular to strike and down-dip", () => {
    const v = attitudeVectors(57, 33);
    const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    expect(dot(v.normal, v.strikeVec)).toBeCloseTo(0);
    expect(dot(v.normal, v.downDip)).toBeCloseTo(0);
    expect(v.downDip[1]).toBeLessThan(0);
  });
  it("N-striking plane dips east in scene coords (x east)", () => {
    expect(attitudeVectors(0, 45).dipDirVec[0]).toBeCloseTo(1);
  });
  it("apparent dip", () => {
    expect(apparentDip(0, 40, 90)).toBeCloseTo(40); // section ⟂ strike = true dip
    expect(apparentDip(0, 40, 0)).toBeCloseTo(0); // along strike
    expect(apparentDip(0, 45, 30)).toBeCloseTo(26.57, 1); // tan α = 1 × 0.5
  });
  it("contour spacing and true thickness", () => {
    expect(contourSpacing(100, 45)).toBeCloseTo(100);
    expect(trueThickness(100, 30)).toBeCloseTo(50);
  });
  it("rule of V", () => {
    expect(ruleOfV(0, true, 0.15)).toBe("upstream-parallel");
    expect(ruleOfV(30, true, 0.15)).toBe("upstream-blunter");
    expect(ruleOfV(5, false, 0.15)).toBe("upstream-sharper");
    expect(ruleOfV(40, false, 0.15)).toBe("downstream");
    expect(ruleOfV(90, false, 0.15)).toBe("straight");
  });
});
