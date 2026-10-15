// Toon material factory. One shared shader program for nearly everything:
// banded gradient-map lighting, shadows tinted toward a zone color instead
// of black, a warm Fresnel rim, an optional stepped "plastic toy" specular
// blob, and an ambient floor so nothing gets murky.
import {
  MeshToonMaterial, DataTexture, RedFormat, NearestFilter, Color, Uniform, FrontSide, SRGBColorSpace,
} from 'three';
import { CONFIG } from '../config.js';
import { Palette } from './Palette.js';

const T = CONFIG.toon;

let gradientMap = null;
export function getGradientMap() {
  if (gradientMap) return gradientMap;
  // 3-4 clear tones, but with a short soft ramp between them (soft banding,
  // not hard 2-tone cel). 64 texels, still Nearest-filtered.
  const steps = T.gradientSteps;
  const N = 64;
  const data = new Uint8Array(N);
  const soft = T.gradientSoftness;
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N; // 0..1 along dotNL*0.5+0.5
    let v = steps[0];
    for (let s = 1; s < steps.length; s++) {
      const edge = s / steps.length;
      const t = Math.min(1, Math.max(0, (x - edge + soft / 2) / soft));
      const k = t * t * (3 - 2 * t);
      v += (steps[s] - steps[s - 1]) * k;
    }
    data[i] = Math.round(v * 255);
  }
  gradientMap = new DataTexture(data, N, 1, RedFormat);
  gradientMap.minFilter = NearestFilter;
  gradientMap.magFilter = NearestFilter;
  gradientMap.generateMipmaps = false;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

// Shared uniforms: changing these retints every toon material at once
// (outdoor blue-violet shadows vs indoor warm brown).
export const ToonShared = {
  uShadowTint: new Uniform(Palette[T.shadowTintOutdoor].clone()),
  uShadowTintStrength: new Uniform(T.shadowTintOutdoorStrength),
  uSunRef: new Uniform(CONFIG.lighting.sunIntensity / Math.PI),
  uRimColor: new Uniform(Palette[T.rimColor].clone()),
  uMinBright: new Uniform(T.minBrightness),
};

// indoorAmount: 0 = fully outdoors, 1 = fully indoors. Crossfade-friendly.
export function setShadowZone(indoorAmount) {
  const k = Math.min(1, Math.max(0, indoorAmount));
  ToonShared.uShadowTint.value.copy(Palette[T.shadowTintOutdoor]).lerp(Palette[T.shadowTintIndoor], k);
  ToonShared.uShadowTintStrength.value =
    T.shadowTintOutdoorStrength + (T.shadowTintIndoorStrength - T.shadowTintOutdoorStrength) * k;
}

const FRAG_PARS = /* glsl */ `
uniform vec3 uShadowTint;
uniform float uShadowTintStrength;
uniform float uSunRef;
uniform vec3 uRimColor;
uniform float uMinBright;
uniform float uRim;
uniform float uRimPower;
uniform float uSpec;
uniform float uSpecThreshold;
uniform vec3 uSkinTint;
uniform float uSkinTintMix;
float nnLum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
`;

const FRAG_OUT = /* glsl */ `
{
  vec3 albedo = diffuseColor.rgb;
  vec3 lit = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
  float baseL = max(nnLum(albedo), 1e-3);
  // how much sun reaches this pixel, 0 (shadow/back face) .. 1 (full lit band)
  float direct = clamp(nnLum(reflectedLight.directDiffuse) / (baseL * max(uSunRef, 1e-3)), 0.0, 1.0);
  float shadowAmt = 1.0 - smoothstep(0.3, 0.95, direct);
  vec3 tint = mix(uShadowTint, uSkinTint, uSkinTintMix);
  // hue-shift toward the tint at the same brightness, never toward black
  vec3 tinted = lit * (tint / max(nnLum(tint), 1e-3));
  lit = mix(lit, tinted, shadowAmt * uShadowTintStrength);
  // ambient lift floor
  lit = max(lit, albedo * uMinBright);

  vec3 nView = normalize(vViewPosition);
  float fres = pow(1.0 - clamp(dot(normal, nView), 0.0, 1.0), uRimPower);
  lit += uRimColor * fres * uRim * (0.55 + 0.45 * direct);

  #if NUM_DIR_LIGHTS > 0
  if (uSpec > 0.0) {
    vec3 L = directionalLights[0].direction;
    vec3 H = normalize(L + nView);
    float sp = pow(max(dot(normal, H), 0.0), 48.0);
    float blob = smoothstep(uSpecThreshold, uSpecThreshold + 0.03, sp);
    lit += vec3(1.0) * blob * uSpec * (0.25 + 0.75 * direct);
  }
  #endif

  outgoingLight = lit + totalEmissiveRadiance;
}
#include <opaque_fragment>
`;

const cache = new Map();

/**
 * Cached toon material per color + options.
 * @param {string} colorName  Palette key (or a Color instance for one-offs)
 * @param {object} o  { map, rim, spec, emissive, emissiveIntensity, transparent, opacity,
 *                      side, vertexColors, fog, skin, depthWrite, name }
 */
export function makeMat(colorName, o = {}) {
  const key = JSON.stringify([
    typeof colorName === 'string' ? colorName : colorName.getHexString(),
    o.map ? o.map.uuid : 0,
    o.rim ?? T.rimStrengthProp,
    o.spec ?? 0,
    o.emissive ?? 0,
    o.emissiveIntensity ?? 1,
    o.transparent ?? false,
    o.opacity ?? 1,
    o.side ?? FrontSide,
    o.vertexColors ?? false,
    o.fog ?? true,
    o.skin ?? false,
    o.depthWrite ?? true,
    o.alphaTest ?? 0,
  ]);
  if (!o.unique && cache.has(key)) return cache.get(key);

  const color = typeof colorName === 'string' ? Palette[colorName] : colorName;
  if (!color) throw new Error(`makeMat: unknown palette color "${colorName}"`);

  const mat = new MeshToonMaterial({
    color: color.clone(),
    gradientMap: getGradientMap(),
    map: o.map || null,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
    side: o.side ?? FrontSide,
    vertexColors: o.vertexColors ?? false,
    fog: o.fog ?? true,
    depthWrite: o.depthWrite ?? true,
    alphaTest: o.alphaTest ?? 0,
  });
  if (o.emissive) {
    mat.emissive = (typeof o.emissive === 'string' ? Palette[o.emissive] : o.emissive).clone();
    mat.emissiveIntensity = o.emissiveIntensity ?? 1;
  }
  mat.name = o.name || (typeof colorName === 'string' ? colorName : 'custom');
  applyToon(mat, o);
  if (!o.unique) cache.set(key, mat);
  return mat;
}

// Patch any MeshToonMaterial with the Nosy Neighbor shading model.
export function applyToon(mat, o = {}) {
  const local = {
    uRim: new Uniform(o.rim ?? T.rimStrengthProp),
    uRimPower: new Uniform(T.rimPower),
    uSpec: new Uniform(o.spec ?? 0),
    uSpecThreshold: new Uniform(T.specThreshold),
    uSkinTint: new Uniform(Palette.NB_SKIN_SSS.clone()),
    uSkinTintMix: new Uniform(o.skin ? 0.7 : 0),
  };
  mat.userData.toon = local;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, ToonShared, local);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAG_PARS}`)
      .replace('#include <opaque_fragment>', FRAG_OUT);
  };
  mat.customProgramCacheKey = () => 'nn-toon-v1';
  return mat;
}

// Prepare a CanvasTexture for world-meter UVs.
export function tile(tex, metersPerTile, metersPerTileY = metersPerTile) {
  const t = tex.clone();
  t.repeat.set(1 / metersPerTile, 1 / metersPerTileY);
  t.colorSpace = SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

export function colorOf(name) {
  return Palette[name].clone();
}

export { Color };
