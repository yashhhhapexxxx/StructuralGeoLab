import { Color, DoubleSide, ShaderMaterial, type Plane } from "three";
import { BED_COLORS } from "@/geo/beds";

/**
 * Paints a folded stack of beds onto any surface. Bed boundaries are the surfaces
 *   y = k·T + y0 + sign·A·cos(2π x′/λ) − z·tan(plunge),   x′ = x − y·tan(tilt)
 * (a "similar" fold whose axial surface leans by `tilt` and whose hinge plunges toward +z).
 */
export interface FoldUniforms {
  amp: number;
  lambda: number;
  sign: 1 | -1; // +1 antiform (arch), −1 synform (trough)
  tanTilt: number;
  tanPlunge: number;
  thick: number;
  base: number; // y of the bottom of bed 0
}

const VERT = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormalW;
  #include <clipping_planes_pars_vertex>
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }
`;

const FRAG = /* glsl */ `
  uniform float uAmp, uLambda, uSign, uTanTilt, uTanPlunge, uThick, uBase;
  uniform vec3 uColors[7];
  varying vec3 vWorld;
  varying vec3 vNormalW;
  #include <clipping_planes_pars_fragment>
  vec3 pick(float i) {
    int k = int(mod(i, 7.0));
    vec3 c = uColors[0];
    for (int j = 0; j < 7; j++) if (j == k) c = uColors[j];
    return c;
  }
  void main() {
    #include <clipping_planes_fragment>
    float xp = vWorld.x - vWorld.y * uTanTilt;
    float f = uSign * uAmp * cos(6.2831853 * xp / uLambda) - vWorld.z * uTanPlunge;
    float s = (vWorld.y - uBase - f) / uThick;
    float bed = floor(s);
    vec3 col = pick(bed + 700.0);
    if (bed < 0.0) col = vec3(0.22, 0.2, 0.19);
    float fr = fract(s);
    float w = fwidth(s) * 1.2;
    float edge = 1.0 - smoothstep(0.0, w, min(fr, 1.0 - fr));
    col = mix(col, col * 0.3, edge * 0.9);
    vec3 L = normalize(vec3(-0.45, 0.85, 0.4));
    float diff = max(dot(normalize(vNormalW), L), 0.0);
    col *= 0.5 + 0.6 * diff;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function makeFoldMaterial(u: FoldUniforms, clippingPlanes: Plane[] = []) {
  return new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    side: DoubleSide,
    clipping: clippingPlanes.length > 0,
    clippingPlanes,
    uniforms: {
      uAmp: { value: u.amp },
      uLambda: { value: u.lambda },
      uSign: { value: u.sign },
      uTanTilt: { value: u.tanTilt },
      uTanPlunge: { value: u.tanPlunge },
      uThick: { value: u.thick },
      uBase: { value: u.base },
      uColors: { value: BED_COLORS.map((c) => new Color(c)) },
    },
  });
}

export function updateFold(m: ShaderMaterial, u: FoldUniforms) {
  m.uniforms.uAmp.value = u.amp;
  m.uniforms.uLambda.value = u.lambda;
  m.uniforms.uSign.value = u.sign;
  m.uniforms.uTanTilt.value = u.tanTilt;
  m.uniforms.uTanPlunge.value = u.tanPlunge;
  m.uniforms.uThick.value = u.thick;
  m.uniforms.uBase.value = u.base;
}
