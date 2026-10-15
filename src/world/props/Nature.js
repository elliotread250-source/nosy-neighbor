// Trees, gumdrop bushes, hedges, grass tufts and lawn flowers.
import {
  Group, Mesh, IcosahedronGeometry, InstancedMesh, Object3D, ConeGeometry, Matrix4, CylinderGeometry, SphereGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { makeMat } from '../../art/Materials.js';
import { chamferCylinder, roundedBox, smoothNormals } from '../../art/Geo.js';
import { twist, bend, wobble, rng, seedFrom } from '../../art/Warp.js';
import { CONFIG } from '../../config.js';

const DEG = Math.PI / 180;
const W = CONFIG.warpBudgets;

function blob(r, s, parts, name) {
  const geos = [];
  for (let i = 0; i < parts; i++) {
    const g = new IcosahedronGeometry(1, 3);
    const k = r.range(s * 0.55, s * 0.85);
    g.scale(k, k * 0.82, k);
    g.translate(r.range(-s * 0.7, s * 0.7), r.range(-s * 0.2, s * 0.45), r.range(-s * 0.7, s * 0.7));
    geos.push(g);
  }
  const geo = mergeGeometries(geos);
  wobble(geo, 0.02, 1.5, seedFrom(name));
  return smoothNormals(geo);
}

/**
 * Chunky twisted cartoon tree. Returns { group, trunkHeight, collider info }.
 * opts: { height, crown, big, branch: {dir:[x,z], length, y} }
 */
export function tree(name, opts = {}) {
  const r = rng(name);
  const g = new Group();
  g.name = name;
  const h = opts.height ?? r.range(3.2, 4.2);
  const rb = opts.trunkRadius ?? r.range(0.32, 0.45);
  const tg = chamferCylinder(rb * 0.55, rb, h, 14, 0.06, { bottom: true, heightSegs: 12 });
  twist(tg, r.range(W.treeTwist[0], W.treeTwist[1]) * (opts.big ? 1.4 : 1));
  const leanDeg = r.range(W.treeLean[0], W.treeLean[1]) * r.sign();
  const leanAx = r.next() < 0.5 ? 'x' : 'z';
  bend(tg, leanDeg, leanAx);
  wobble(tg, 0.03, 2, seedFrom(`${name}trunk`));
  smoothNormals(tg);
  const trunk = new Mesh(tg, makeMat('WOOD_MID'));
  trunk.castShadow = trunk.receiveShadow = true;
  g.add(trunk);
  // where the bent trunk tip ends up
  const tipOff = Math.sin(leanDeg * DEG) * h * 0.5;
  const tip = { x: leanAx === 'x' ? tipOff : 0, y: h, z: leanAx === 'z' ? tipOff : 0 };
  const cs = opts.crown ?? r.range(1.4, 1.9);
  const nParts = r.int(4, 7);
  const half = Math.ceil(nParts / 2);
  const crownA = new Mesh(blob(r, cs, half, `${name}cA`), makeMat('GRASS_DARK', { rim: 0.22, wind: 0.004 }));
  const crownB = new Mesh(blob(r, cs * 0.92, nParts - half, `${name}cB`), makeMat('GRASS', { rim: 0.22, wind: 0.004 }));
  for (const c of [crownA, crownB]) {
    c.position.set(tip.x, h + cs * 0.55, tip.z);
    c.castShadow = true;
    c.receiveShadow = true;
    g.add(c);
  }
  crownB.position.y += cs * 0.25;
  crownB.position.x += cs * 0.2;
  let branch = null;
  if (opts.branch) {
    const b = opts.branch;
    const len = b.length;
    const bg = chamferCylinder(0.13, 0.24, len, 12, 0.05, { bottom: true, heightSegs: 10 });
    bend(bg, 14, 'z');
    twist(bg, 30);
    smoothNormals(bg);
    const bm = new Mesh(bg, makeMat('WOOD_MID'));
    const ang = Math.atan2(b.dir[0], b.dir[1]);
    bm.position.set(0, b.y, 0);
    bm.rotation.order = 'YXZ';
    bm.rotation.y = ang;
    bm.rotation.x = Math.PI / 2 - (b.rise ?? 8) * DEG;
    bm.castShadow = bm.receiveShadow = true;
    g.add(bm);
    // leaf puff at the end
    const puff = new Mesh(blob(r, 0.9, 3, `${name}puff`), makeMat('GRASS', { rim: 0.2, wind: 0.004 }));
    puff.position.set(b.dir[0] * len * 0.45, b.y + 1.4, b.dir[1] * len * 0.45);
    puff.castShadow = true;
    g.add(puff);
    branch = { mesh: bm, length: len, angle: ang };
  }
  return { group: g, height: h, radius: rb, tip, branch };
}

export function gumdrop(name, size = 0.6, color) {
  const r = rng(name);
  const g = new IcosahedronGeometry(size, 3);
  g.scale(1, r.range(0.75, 0.9), 1);
  g.translate(0, size * 0.62, 0);
  wobble(g, 0.03, 1.4, seedFrom(name));
  smoothNormals(g);
  const m = new Mesh(g, makeMat(color ?? (r.next() < 0.5 ? 'GRASS_DARK' : 'GRASS'), { rim: 0.22, wind: 0.01 }));
  m.castShadow = m.receiveShadow = true;
  return m;
}

// A long, fat, rounded hedge wall (also used to hide the world edge).
export function hedge(name, len, h = 2.4, d = 1.4) {
  const r = rng(name);
  const g = new Group();
  const body = roundedBox(len, h, d, Math.min(0.45, d * 0.35), 3, { bottom: true, midStep: 1.2, skipNormals: true });
  wobble(body, 0.015, 3, seedFrom(name));
  smoothNormals(body);
  const m = new Mesh(body, makeMat('GRASS_DARK', { rim: 0.18 }));
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  // bumpy top
  const n = Math.max(2, Math.round(len / 1.3));
  const bumps = [];
  for (let i = 0; i < n; i++) {
    const s = r.range(0.55, 0.85) * d * 0.6;
    const b = new IcosahedronGeometry(s, 2);
    b.scale(1.3, 0.75, 1);
    b.translate(-len / 2 + (i + 0.5) * (len / n), h - s * 0.15, r.range(-0.1, 0.1));
    bumps.push(b);
  }
  const top = new Mesh(smoothNormals(mergeGeometries(bumps)), makeMat('GRASS', { rim: 0.18 }));
  top.castShadow = true;
  g.add(top);
  return g;
}

// Instanced grass tufts: little clusters of fat cones that sway.
export function grassTufts(points, name = 'tufts') {
  const r = rng(name);
  const blades = [];
  for (let i = 0; i < 4; i++) {
    const c = new ConeGeometry(0.035, r.range(0.16, 0.28), 4, 1);
    c.translate(0, 0.1, 0);
    c.rotateZ(r.range(-0.35, 0.35));
    c.rotateX(r.range(-0.35, 0.35));
    c.translate(r.range(-0.06, 0.06), 0, r.range(-0.06, 0.06));
    blades.push(c);
  }
  const geo = mergeGeometries(blades.map((b) => b.toNonIndexed()));
  geo.computeVertexNormals();
  const im = new InstancedMesh(geo, makeMat('GRASS_LIGHT', { rim: 0.1, wind: 1.2 }), points.length);
  const o = new Object3D();
  points.forEach((p, i) => {
    o.position.set(p[0], 0, p[1]);
    o.rotation.y = r.range(0, Math.PI * 2);
    const s = r.range(0.7, 1.4);
    o.scale.set(s, s * r.range(0.8, 1.3), s);
    o.updateMatrix();
    im.setMatrixAt(i, o.matrix);
  });
  im.instanceMatrix.needsUpdate = true;
  im.castShadow = false;
  im.receiveShadow = true;
  im.frustumCulled = false;
  return im;
}

// Daisies and dandelions: a stem plus a fat flower head, instanced per color.
export function flowers(points, name = 'flowers') {
  const r = rng(name);
  const g = new Group();
  const colors = ['WHITE', 'YELLOW_TOY', 'BUBBLEGUM'];
  const head = new SphereGeometry(0.045, 8, 6);
  head.scale(1, 0.55, 1);
  head.translate(0, 0.17, 0);
  const stem = new CylinderGeometry(0.008, 0.01, 0.17, 4);
  stem.translate(0, 0.085, 0);
  for (const col of colors) {
    const pts = points.filter((_, i) => colors[i % colors.length] === col);
    const hm = new InstancedMesh(head, makeMat(col, { rim: 0.2, wind: 1.5 }), pts.length);
    const sm = new InstancedMesh(stem, makeMat('GRASS_DARK', { wind: 1.5 }), pts.length);
    const o = new Object3D();
    pts.forEach((p, i) => {
      o.position.set(p[0], 0, p[1]);
      const s = r.range(0.8, 1.3);
      o.scale.set(s, s, s);
      o.updateMatrix();
      hm.setMatrixAt(i, o.matrix);
      sm.setMatrixAt(i, o.matrix);
    });
    hm.frustumCulled = sm.frustumCulled = false;
    g.add(hm, sm);
  }
  return g;
}

export { Matrix4 };
