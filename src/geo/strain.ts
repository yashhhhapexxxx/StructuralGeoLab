/** 2D homogeneous strain: deformation gradient F and the strain ellipse. */

export type Mat2 = [number, number, number, number]; // [a, b, c, d] = [[a, b], [c, d]]

/** Pure shear (stretch k along x, 1/k along y — area preserving) then simple shear γ along x. */
export function deformation(k: number, gamma: number): Mat2 {
  // simple shear S = [[1, γ], [0, 1]], pure shear P = [[k, 0], [0, 1/k]] → F = S · P
  return [k, gamma / k, 0, 1 / k];
}

export function apply(F: Mat2, x: number, y: number): [number, number] {
  return [F[0] * x + F[1] * y, F[2] * x + F[3] * y];
}

/** Strain ellipse from B = F·Fᵀ: semi-axes (X ≥ Y) and orientation of X (degrees from x-axis). */
export function strainEllipse(F: Mat2) {
  const [a, b, c, d] = F;
  const b11 = a * a + b * b;
  const b12 = a * c + b * d;
  const b22 = c * c + d * d;
  const tr = b11 + b22;
  const det = b11 * b22 - b12 * b12;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  const X = Math.sqrt(l1);
  const Y = Math.sqrt(Math.max(l2, 1e-9));
  const angle = (0.5 * Math.atan2(2 * b12, b11 - b22) * 180) / Math.PI;
  return { X, Y, R: X / Y, angle };
}
