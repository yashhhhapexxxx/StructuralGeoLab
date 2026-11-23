import { Color, DoubleSide, ShaderMaterial, Vector3, type Plane } from "three";
import { BED_COLORS } from "@/geo/beds";

/**
 * Paints planar beds (any attitude) onto whatever surface uses it — block faces, terrain —
 * by evaluating the bedding coordinate per pixel. Optional topographic contour lines.
 *
 *   s = dot(worldPos, bedNormal) + offset ;  bed = floor(s / thickness)
 */
export interface StrataUniforms {
  normal: [number, number, number];
  thickness: number;
  offset?: number;
  contourInterval?: number; // 0 = off (world units, vertical)
  highlight?: number; // bed index to highlight, -999 = none
  muted?: boolean; // grey everything except the highlighted bed
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
  uniform vec3 uNormal;
  uniform float uThick;
  uniform float uOffset;
  uniform float uContour;
  uniform float uHighlight;
  uniform float uMuted;
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
    float s = (dot(vWorld, uNormal) + uOffset) / uThick;
    float bed = floor(s);
    vec3 col = pick(bed + 700.0);
    if (uMuted > 0.5) {
      float lum = dot(col, vec3(0.3, 0.59, 0.11));
      col = mix(vec3(lum) * 0.55 + vec3(0.12, 0.15, 0.12), col, 0.15);
    }
    if (abs(bed - uHighlight) < 0.5) col = vec3(0.96, 0.62, 0.30);

    // bedding-plane lines
    float f = fract(s);
    float w = fwidth(s) * 1.2;
    float edge = 1.0 - smoothstep(0.0, w, min(f, 1.0 - f));
    col = mix(col, col * 0.35, edge * 0.85);

    // topographic contours (horizontal), index every 5th
    if (uContour > 0.0) {
      float h = vWorld.y / uContour;
      float fh = fract(h);
      float wh = fwidth(h) * 0.8;
      float line = 1.0 - smoothstep(0.0, wh, min(fh, 1.0 - fh));
      float idx = 1.0 - step(0.5, abs(mod(floor(h + 0.5), 5.0)));
      col = mix(col, vec3(1.0), line * (0.18 + 0.3 * idx));
    }

    // simple lighting
    vec3 L = normalize(vec3(-0.5, 0.85, 0.35));
    float diff = max(dot(normalize(vNormalW), L), 0.0);
    col *= 0.45 + 0.65 * diff;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function makeStrataMaterial(u: StrataUniforms, clippingPlanes: Plane[] = []) {
  const m = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    side: DoubleSide,
    clipping: clippingPlanes.length > 0,
    clippingPlanes,
    uniforms: {
      uNormal: { value: new Vector3(...u.normal) },
      uThick: { value: u.thickness },
      uOffset: { value: u.offset ?? 0 },
      uContour: { value: u.contourInterval ?? 0 },
      uHighlight: { value: u.highlight ?? -999 },
      uMuted: { value: u.muted ? 1 : 0 },
      uColors: { value: BED_COLORS.map((c) => new Color(c)) },
    },
  });
  return m;
}

export function updateStrata(m: ShaderMaterial, u: Partial<StrataUniforms>) {
  if (u.normal) (m.uniforms.uNormal.value as Vector3).set(...u.normal);
  if (u.thickness !== undefined) m.uniforms.uThick.value = u.thickness;
  if (u.offset !== undefined) m.uniforms.uOffset.value = u.offset;
  if (u.contourInterval !== undefined) m.uniforms.uContour.value = u.contourInterval;
  if (u.highlight !== undefined) m.uniforms.uHighlight.value = u.highlight;
  if (u.muted !== undefined) m.uniforms.uMuted.value = u.muted ? 1 : 0;
}
