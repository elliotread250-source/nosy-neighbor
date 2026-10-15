// Merge a group's static meshes into as few meshes as possible (world space).
// Untextured toon parts are folded into a shared vertex-colored material per
// shading class (rim/spec/skin/side/shadow), so a room full of differently
// colored furniture becomes a handful of draw calls. Textured, emissive and
// transparent parts merge per material. Skips anything flagged
// userData.noBake (animated or interactive parts) and keeps lights alive.
import { Group, Mesh, Matrix4, Vector3, BufferAttribute } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { makeMat } from './Materials.js';

const _s = new Vector3();

function shadingClass(mat) {
  const t = mat.userData.toon;
  if (!mat.isMeshToonMaterial || !t) return null;
  if (mat.map || mat.transparent || mat.vertexColors) return null;
  if (mat.emissive && (mat.emissive.r + mat.emissive.g + mat.emissive.b) > 0.001 && mat.emissiveIntensity > 0) return null;
  return {
    key: `vc|${t.uRim.value.toFixed(2)}|${t.uSpec.value.toFixed(2)}|${t.uSkinTintMix.value > 0 ? 1 : 0}|${mat.side}|${mat.fog ? 1 : 0}`,
    rim: t.uRim.value, spec: t.uSpec.value, skin: t.uSkinTintMix.value > 0, side: mat.side, fog: mat.fog,
  };
}

export function bakeStatic(group, name = 'baked') {
  group.updateMatrixWorld(true);
  const buckets = new Map();
  const remove = [];
  const keepRoots = new Set();
  group.traverse((o) => {
    if (o === group) return;
    let p = o, skip = false;
    while (p && p !== group) { if (p.userData.noBake) { skip = true; keepRoots.add(p); break; } p = p.parent; }
    if (skip) return;
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.userData.isOutline) return;
    if (o.material.transparent || Array.isArray(o.material)) return;
    if (!o.geometry.attributes.uv || !o.geometry.attributes.normal) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const ws = o.getWorldScale(_s);
    // small clutter does not cast shadows
    const cast = o.castShadow && o.geometry.boundingSphere.radius * Math.max(ws.x, ws.y, ws.z) > 0.22;
    const sc = shadingClass(o.material);
    const key = sc ? `${sc.key}|${cast ? 1 : 0}` : `${o.material.uuid}|${cast ? 1 : 0}`;
    let e = buckets.get(key);
    if (!e) { e = { mat: o.material, sc, cast, geos: [] }; buckets.set(key, e); }
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
    if (sc) {
      const c = o.material.color;
      const n = g.attributes.position.count;
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute('color', new BufferAttribute(col, 3));
    }
    g.applyMatrix4(o.matrixWorld);
    e.geos.push(g);
    remove.push(o);
  });
  const removed = new Set(remove);
  for (const o of remove) o.visible = false;
  const out = new Group();
  out.name = name;
  for (const e of buckets.values()) {
    const g = mergeGeometries(e.geos, false);
    if (!g) continue;
    const mat = e.sc
      ? makeMat('WHITE', { vertexColors: true, rim: e.sc.rim, spec: e.sc.spec, skin: e.sc.skin, side: e.sc.side, fog: e.sc.fog })
      : e.mat;
    const m = new Mesh(g, mat);
    m.castShadow = e.cast;
    m.receiveShadow = true;
    out.add(m);
  }
  // detach hidden originals that have nothing kept underneath them
  for (const o of remove) {
    let keep = false;
    o.traverse((c) => { if (c !== o && (c.isLight || keepRoots.has(c) || ((c.isMesh || c.isPoints) && !removed.has(c)))) keep = true; });
    if (!keep && o.parent) o.parent.remove(o);
  }
  const inv = new Matrix4().copy(group.matrixWorld).invert();
  out.applyMatrix4(inv);
  group.add(out);
  return out;
}

// Bake an object locally, then recurse into each animated (noBake) part so
// even a wardrobe door or a tub curtain becomes one or two meshes.
export function bakeDeep(obj, name = 'deep') {
  const flag = obj.userData.noBake;
  obj.userData.noBake = false;
  const parts = [];
  obj.traverse((o) => { if (o !== obj && o.userData.noBake && !parts.some((p) => isAncestor(p, o))) parts.push(o); });
  bakeStatic(obj, name);
  for (const p of parts) {
    let n = 0;
    p.traverse((o) => { if (o.isMesh) n++; });
    if (n > 1) bakeDeep(p, `${name}-part`);
    p.userData.noBake = true;
  }
  obj.userData.noBake = flag;
}

function isAncestor(a, o) {
  let p = o.parent;
  while (p) { if (p === a) return true; p = p.parent; }
  return false;
}
