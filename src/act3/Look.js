// Two looks for every mesh (spec section 7, 21): survey (flat, neutral,
// evenly lit, so scale reads by eye) and style (the main game's toon
// materials and palette). Meshes carry userData.look = a palette name or a
// hex color; setLook() swaps every material in a subtree.
import { MeshLambertMaterial, Color, DoubleSide } from 'three';
import { Palette } from '../art/Palette.js';
import { makeMat } from '../art/Materials.js';

export function colorOf(name) {
  if (!name) return new Color('#b0b0aa');
  if (name instanceof Color) return name.clone();
  if (name.startsWith?.('#')) return new Color(name);
  return Palette[name]?.clone() ?? new Color('#b0b0aa');
}

const survey = new Map(), style = new Map();
const NEUTRAL = new Color('#b9b9b3');

// survey: the color pulled most of the way to neutral grey, so objects still
// read apart without the palette carrying meaning
export function surveyMat(name, o = {}) {
  const k = `${name}|${o.side ?? 0}|${o.emissive ?? ''}|${o.opacity ?? 1}`;
  if (!survey.has(k)) {
    const c = colorOf(name).lerp(NEUTRAL, o.keep ? 0 : 0.6);
    const m = new MeshLambertMaterial({ color: c, side: o.side ?? 0, transparent: (o.opacity ?? 1) < 1, opacity: o.opacity ?? 1, depthWrite: (o.opacity ?? 1) >= 1 });
    if (o.emissive) { m.emissive = colorOf(o.emissive); m.emissiveIntensity = 0.8; }
    survey.set(k, m);
  }
  return survey.get(k);
}

export function styleMat(name, o = {}) {
  const k = `${name}|${o.side ?? 0}|${o.emissive ?? ''}|${o.opacity ?? 1}|${o.map?.uuid ?? ''}`;
  if (!style.has(k)) {
    const c = colorOf(name);
    const m = makeMat(c, { unique: true, side: o.side ?? 0, transparent: (o.opacity ?? 1) < 1, opacity: o.opacity ?? 1, depthWrite: (o.opacity ?? 1) >= 1, map: o.map ?? null, ...(o.emissive ? { emissive: colorOf(o.emissive), emissiveIntensity: 1 } : {}) });
    style.set(k, m);
  }
  return style.get(k);
}

let mode = 'survey';
export const lookMode = () => mode;

export function lookMat(name, o = {}) {
  return mode === 'style' ? styleMat(name, o) : surveyMat(name, o);
}

// Tag a mesh with its look and give it the current material.
export function look(mesh, name, o = {}) {
  mesh.userData.look = name;
  mesh.userData.lookOpts = o;
  mesh.material = lookMat(name, o);
  return mesh;
}

export function setLook(root, m) {
  mode = m;
  root.traverse((o) => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    if (o.userData.look) o.material = lookMat(o.userData.look, o.userData.lookOpts);
    if (o.userData.surveyOnly) o.visible = m === 'survey';
    if (o.userData.styleOnly) o.visible = m === 'style';
  });
}

export { DoubleSide };
