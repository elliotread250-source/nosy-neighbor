// Inverted-hull outlines for characters, keys and interactables. The hull is
// pushed out along normals by a thickness that scales with camera distance
// (roughly constant on screen, clamped), drawn back-faces-only in a darkened,
// purple-brown-shifted version of the part's own color.
import { ShaderMaterial, BackSide, Mesh, Color, UniformsLib, UniformsUtils, Uniform } from 'three';
import { CONFIG, gfx } from '../config.js';
import { Palette } from './Palette.js';

const O = CONFIG.outline;

const VERT = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
#include <skinning_pars_vertex>
uniform float uThickness;
uniform float uRefDist;
uniform float uMinScale;
uniform float uMaxScale;
void main() {
  #include <beginnormal_vertex>
  #include <begin_vertex>
  vec4 wp = modelMatrix * vec4(transformed, 1.0);
  float dist = length(wp.xyz - cameraPosition);
  float s = clamp(dist / uRefDist, uMinScale, uMaxScale);
  vec3 n = normalize(objectNormal);
  // compensate for non-uniform object scale so the hull stays even
  vec3 sc = vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
  transformed += n * (uThickness * s) / max(sc, vec3(1e-4));
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const FRAG = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
uniform vec3 uColor;
uniform float uOpacity;
void main() {
  gl_FragColor = vec4(uColor, uOpacity);
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

const cache = new Map();

export function outlineColorFor(base) {
  return base.clone().multiplyScalar(O.colorMul).lerp(Palette[O.toward], O.towardAmount);
}

export function makeOutlineMaterial(baseColor, thickness = O.thickness, opts = {}) {
  const key = `${baseColor.getHexString()}-${thickness}-${opts.unique ? Math.random() : ''}`;
  if (!opts.unique && cache.has(key)) return cache.get(key);
  const mat = new ShaderMaterial({
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      {
        uColor: { value: opts.color ? opts.color.clone() : outlineColorFor(baseColor) },
        uOpacity: { value: 1 },
        uThickness: { value: thickness * gfx().outlineScale },
        uRefDist: { value: O.refDistance },
        uMinScale: { value: O.minScale },
        uMaxScale: { value: O.maxScale },
      },
    ]),
    vertexShader: VERT,
    fragmentShader: FRAG,
    side: BackSide,
    fog: true,
  });
  mat.userData.baseThickness = thickness;
  if (!opts.unique) cache.set(key, mat);
  return mat;
}

/**
 * Add an inverted-hull outline to every mesh under obj.
 * opts: { thickness, color (Color, overrides derived), unique (own material for animating) }
 * Returns the outline meshes so callers can animate thickness/visibility.
 */
export function addOutline(obj, opts = {}) {
  const out = [];
  const targets = [];
  obj.traverse((m) => {
    if (m.isMesh && !m.userData.isOutline && !m.userData.noOutline) targets.push(m);
  });
  for (const m of targets) {
    const base = m.material?.color ? m.material.color : new Color(0.5, 0.5, 0.5);
    const mat = makeOutlineMaterial(base, opts.thickness ?? O.thickness, opts);
    const hull = new Mesh(m.geometry, mat);
    hull.userData.isOutline = true;
    hull.castShadow = false;
    hull.receiveShadow = false;
    hull.raycast = () => {};
    hull.renderOrder = m.renderOrder;
    m.add(hull);
    out.push(hull);
  }
  return out;
}

// Scale outline thickness on a set of hulls (presence effect, highlight pulse).
export function setOutlineScale(hulls, k) {
  for (const h of hulls) {
    const m = h.material;
    m.uniforms.uThickness.value = m.userData.baseThickness * gfx().outlineScale * k;
  }
}

export { Uniform };
