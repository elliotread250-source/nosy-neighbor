// The street: a 120 x 70 m diorama. East-west road, the player's house on
// the south side, the neighbor's lot directly across on the north side,
// two cute flanking houses on each side, all boxed in by hedges and fog.
import {
  Group, Mesh, PlaneGeometry, Vector3, InstancedMesh, Object3D, Quaternion, Euler,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Builder } from './Architecture.js';
import { makeMat } from '../art/Materials.js';
import * as Tex from '../art/CanvasTextures.js';
import { roundedBox, smoothNormals } from '../art/Geo.js';
import { sag, rng, seedFrom, wobble } from '../art/Warp.js';
import { CONFIG, gfx } from '../config.js';
import { suburbanHouse } from './Houses.js';
import { buildPlayerHouse, PLAYER_HOUSE } from './PlayerHouse.js';
import * as N from './props/Nature.js';
import * as S from './props/Street.js';

const DEG = Math.PI / 180;

export const STREET = {
  halfLength: 60, halfWidth: 35,
  roadHalf: 3.5, sidewalkOuter: 5.7, sidewalkY: 0.15,
  // lot boundaries along x
  lotEdges: [-40, -17, 17, 40],
  neighborLot: { x0: -17, x1: 17, z0: -34, z1: -5.7 },
};

export function buildNeighborhood(scene, physics, lights, zones) {
  const root = new Group();
  root.name = 'neighborhood';
  scene.add(root);
  const updaters = [];
  const b = new Builder(root, physics, 'street');
  const R = rng('street');
  const T = STREET;

  // ---- ground ----
  const ground = new Mesh(new PlaneGeometry(420, 420), makeMat('WHITE', { map: Tex.grass(), rim: 0 }));
  ground.rotation.x = -Math.PI / 2;
  const guv = ground.geometry.attributes.uv;
  for (let i = 0; i < guv.count; i++) guv.setXY(i, guv.getX(i) * 420, guv.getY(i) * 420);
  ground.receiveShadow = true;
  root.add(ground);
  // ground collider with a hole under the neighbor's house (tunnels live down there)
  {
    const hx0 = -8.2, hx1 = 8.2, hz0 = -26.2, hz1 = -13.8, E = 210;
    const slab = (x0, x1, z0, z1) => physics.addStaticBox(new Vector3((x0 + x1) / 2, -0.5, (z0 + z1) / 2), new Vector3((x1 - x0) / 2, 0.5, (z1 - z0) / 2));
    slab(-E, E, hz1, E);
    slab(-E, E, -E, hz0);
    slab(-E, hx0, hz0, hz1);
    slab(hx1, E, hz0, hz1);
  }

  // ---- road, center line, sidewalks, curbs ----
  const L = T.halfLength * 2 + 30;
  b.box(L, 0.04, T.roadHalf * 2, makeMat('ASPHALT'), 0, -0.02, 0, { radius: 0.01, wobble: 0, midStep: 8, collide: false, cast: false });
  const dashGeo = roundedBox(2.2, 0.02, 0.16, 0.008, 1);
  const dashes = new InstancedMesh(dashGeo, makeMat('ROAD_LINE'), Math.ceil(L / 4.5));
  const o3 = new Object3D();
  for (let i = 0; i < dashes.count; i++) {
    o3.position.set(-L / 2 + i * 4.5, 0.025, 0);
    o3.rotation.y = R.range(-0.6, 0.6) * DEG;
    o3.updateMatrix();
    dashes.setMatrixAt(i, o3.matrix);
  }
  dashes.receiveShadow = true;
  root.add(dashes);
  for (const s of [-1, 1]) {
    const zc = s * (T.roadHalf + T.sidewalkOuter) / 2;
    b.box(L, T.sidewalkY, T.sidewalkOuter - T.roadHalf, makeMat('SIDEWALK'), 0, 0, zc, { radius: 0.03, wobble: 0, midStep: 8, cast: false });
    b.box(L, T.sidewalkY + 0.03, 0.22, makeMat('CURB'), 0, 0, s * (T.roadHalf + 0.11), { radius: 0.05, wobble: 0, midStep: 8, cast: false, collide: false });
    // sidewalk joints
    for (let x = -L / 2; x < L / 2; x += 2.4) {
      b.box(0.04, 0.005, T.sidewalkOuter - T.roadHalf - 0.1, makeMat('CURB'), x, T.sidewalkY, zc, { radius: 0.002, wobble: 0, collide: false, cast: false, receive: true });
    }
  }

  // ---- driveways and front walks ----
  const drive = (x, z0, z1, w = 3) => b.box(w, 0.06, Math.abs(z1 - z0), makeMat('CURB'), x, 0, (z0 + z1) / 2, { radius: 0.02, wobble: 0, cast: false, collide: false, midStep: 4 });
  drive(8.5, 5.7, 20);
  drive(-21.5, 5.7, 18); drive(34, 5.7, 18);
  drive(-21.5, -5.7, -18); drive(34, -5.7, -18);
  const paverWalk = (x, z0, z1, name) => {
    const n = Math.round(Math.abs(z1 - z0) / 1.2);
    const r = rng(name);
    for (let i = 0; i < n; i++) {
      const z = z0 + (z1 - z0) * ((i + 0.5) / n);
      b.box(1.3, 0.08, 0.95, makeMat('SIDEWALK'), x + r.range(-0.08, 0.08), 0, z, { radius: 0.03, collide: false, cast: false, rotY: r.range(-4, 4) * DEG });
    }
  };
  paverWalk(-1.2, 5.9, 11.0, 'walkP');
  paverWalk(0, -5.9, -11.0, 'walkN');
  paverWalk(-28, 5.9, 11.2, 'walkS1'); paverWalk(28, 5.9, 11.2, 'walkS2');
  paverWalk(-28, -5.9, -11.2, 'walkN1'); paverWalk(28, -5.9, -11.2, 'walkN2');

  // ---- flanking houses ----
  const houses = [
    { name: 'house-pink', x: -28, z: -12, facing: 1, siding: 'HOUSE_PINK', roof: 'NH_ROOF_ALT', door: 'TEAL', curtain: 'WALLPAPER_YELLOW' },
    { name: 'house-green', x: 28, z: -12, facing: 1, siding: 'HOUSE_GREEN', roof: 'NH_ROOF', door: 'TOMATO', curtain: 'WALLPAPER_PINK' },
    { name: 'house-lavender', x: -28, z: 12, facing: -1, siding: 'HOUSE_LAVENDER', roof: 'PH_ROOF', door: 'YELLOW_TOY', curtain: 'WALLPAPER_PINK' },
    { name: 'house-peach', x: 28, z: 12, facing: -1, siding: 'HOUSE_PEACH', roof: 'NH_ROOF_ALT', door: 'BLUE_TOY', curtain: 'WALLPAPER_BLUE' },
  ];
  for (const h of houses) {
    suburbanHouse(root, physics, { ...h, door: h.door === 'TEAL' ? 'NH_SHUTTERS' : h.door, w: 9, d: 8, stories: 2, storyH: 2.9 });
    // gumdrop bushes along the front
    for (let i = 0; i < 5; i++) {
      const bush = N.gumdrop(`${h.name}-bush${i}`, 0.5 + (i % 2) * 0.12);
      const x = h.x - 4 + i * 2 + (i >= 2 ? 0.8 : 0);
      if (Math.abs(x - h.x) < 1.2) continue;
      bush.position.set(x, 0, h.z + h.facing * 0.9);
      root.add(bush);
    }
    const mb = S.mailbox(`${h.name}-mb`);
    mb.position.set(h.x + (h.x < 0 ? 4.6 : -4.6), T.sidewalkY, h.facing * -(T.sidewalkOuter + 0.4));
    mb.rotation.y = h.facing > 0 ? Math.PI : 0;
    root.add(mb);
  }
  // their little dramas
  const bk = S.bike();
  bk.position.set(-31, 0, 8.6);
  bk.rotation.y = 30 * DEG;
  root.add(bk);
  const spr = S.sprinkler();
  spr.userData.noBake = true;
  spr.position.set(25, 0, 8.5);
  spr.rotation.y = Math.PI;
  root.add(spr);
  updaters.push(spr.userData.update);
  const sale = S.sign('FOR\nSALE', { bg: 'WHITE', fg: 'TOMATO', w: 0.9, h: 0.65, post: 0.8, tilt: 14, border: 'TOMATO' });
  sale.position.set(31.5, 0, 7.6);
  sale.rotation.y = Math.PI + 0.3;
  root.add(sale);

  // ---- the player's house ----
  const ph = buildPlayerHouse(root, physics, lights);
  zones.add('playerHouse', ph.zone.min, ph.zone.max, { indoor: true });
  for (let i = 0; i < 4; i++) {
    const bush = N.gumdrop(`ph-bush${i}`, 0.55);
    bush.position.set([-4.4, -3.0, 1.6, 3.6][i], 0, 13.2);
    root.add(bush);
  }
  const phMail = S.mailbox('ph-mb');
  phMail.position.set(7, T.sidewalkY, T.sidewalkOuter + 0.4);
  root.add(phMail);

  // ---- neighbor's curb: mailbox with the flag raised ----
  const nbMail = S.mailbox('nb-mb', true);
  nbMail.position.set(-3, T.sidewalkY, -(T.sidewalkOuter + 0.4));
  nbMail.rotation.y = Math.PI;
  root.add(nbMail);

  // ---- street furniture ----
  const hyd = S.hydrant();
  hyd.position.set(10.5, T.sidewalkY, 4.4);
  root.add(hyd);
  physics.addStaticBox(new Vector3(10.5, 0.5, 4.4), new Vector3(0.25, 0.4, 0.25));
  for (const [x, z, rot] of [[-12, 4.3, Math.PI / 2], [14, -4.3, -Math.PI / 2]]) {
    const lp = S.lampPost(`lamp${x}`);
    lp.position.set(x, T.sidewalkY, z);
    lp.rotation.y = rot;
    root.add(lp);
    physics.addStaticBox(new Vector3(x, 1.5, z), new Vector3(0.22, 1.5, 0.22));
  }
  // power poles and sagging wires
  const poles = [];
  for (const x of [-48, -22, 22, 48])
    for (const s of [-1, 1]) {
      const p = S.powerPole(`pole${x}${s}`, 8);
      p.position.set(x, 0, s * 6.4);
      root.add(p);
      physics.addStaticBox(new Vector3(x, 4, s * 6.4), new Vector3(0.18, 4, 0.18));
      poles.push({ x, s, obj: p });
    }
  const anchor = (p, i) => p.obj.userData.anchors[i].clone().add(p.obj.position);
  for (const p of poles) {
    if (p.s < 0) {
      const q = poles.find((o) => o.x === p.x && o.s > 0);
      for (let i = 0; i < 3; i += 2) root.add(S.wire(anchor(p, i), anchor(q, i), 0.7));
    }
    const nxt = poles.find((o) => o.s === p.s && o.x > p.x && poles.every((k) => k.s !== p.s || k.x <= p.x || k.x >= o.x));
    if (nxt) for (let i = 0; i < 3; i++) root.add(S.wire(anchor(p, i), anchor(nxt, i), 1.1 + i * 0.1));
  }

  // ---- fences between lots (instanced pickets) ----
  const fenceLines = [];
  for (const x of T.lotEdges) {
    fenceLines.push([[x, 7.2], [x, 33.5]]);
    fenceLines.push([[x, -33.5], [x, -7.2]]);
  }
  const fenceInfo = picketFences(root, physics, fenceLines, 'fences');

  // ---- hedges that close the diorama ----
  const hedges = [
    [0, -35, 124, 0], [0, 35, 124, 0],
    [-61, -20, 30, 90], [-61, 20, 30, 90], [61, -20, 30, 90], [61, 20, 30, 90],
    [-63, 0, 12, 90], [63, 0, 12, 90],
  ];
  for (const [x, z, len, rot] of hedges) {
    const hg = N.hedge(`hedge${x}${z}`, len, 2.6, 1.6);
    hg.position.set(x, 0, z);
    hg.rotation.y = rot * DEG;
    root.add(hg);
    const half = rot ? new Vector3(0.9, 3, len / 2) : new Vector3(len / 2, 3, 0.9);
    physics.addStaticBox(new Vector3(x, 3, z), half);
  }
  // invisible walls across the road ends, dressed with ROAD CLOSED barriers
  for (const s of [-1, 1]) {
    for (const z of [-2, 2]) {
      const sh = S.sawhorse();
      sh.position.set(s * 56.5, 0, z);
      sh.rotation.y = Math.PI / 2 + R.range(-8, 8) * DEG;
      root.add(sh);
    }
    physics.addStaticBox(new Vector3(s * 57, 2, 0), new Vector3(0.3, 2, 6));
  }
  // and an invisible ceiling-high wall all round, just inside the hedges
  for (const [cx, cz, hx, hz] of [[0, -34, 62, 0.3], [0, 34, 62, 0.3], [-60, 0, 0.3, 35], [60, 0, 0.3, 35]]) {
    physics.addStaticBox(new Vector3(cx, 10, cz), new Vector3(hx, 10, hz));
  }

  // ---- trees ----
  const trees = [];
  const addTree = (name, x, z, opts) => {
    const t = N.tree(name, opts);
    t.group.position.set(x, 0, z);
    root.add(t.group);
    physics.addStaticBox(new Vector3(x, t.height / 2, z), new Vector3(t.radius * 0.8, t.height / 2, t.radius * 0.8));
    trees.push(t);
    return t;
  };
  addTree('ph-tree1', -10.5, 15.5);
  addTree('ph-tree2', 12, 26, { height: 3.8 });
  addTree('pink-tree', -35, -26);
  addTree('green-tree', 22, -28);
  addTree('lav-tree', -21, 27);
  addTree('peach-tree', 36, 26);
  addTree('corner-tree', -52, -14, { height: 4.5 });
  addTree('corner-tree2', 52, 14, { height: 4.2 });

  // ---- grass tufts and flowers ----
  const tuftPts = [];
  const rr = rng('tufts');
  const budget = gfx().grassCount;
  const along = (x0, z0, x1, z1, n, spread = 0.25) => {
    for (let i = 0; i < n; i++) {
      const t = rr.next();
      tuftPts.push([x0 + (x1 - x0) * t + rr.range(-spread, spread), z0 + (z1 - z0) * t + rr.range(-spread, spread)]);
    }
  };
  const perLine = Math.floor(budget * 0.5 / (fenceLines.length + 4));
  for (const [[x0, z0], [x1, z1]] of fenceLines) along(x0, z0, x1, z1, perLine);
  for (const s of [-1, 1]) along(-58, s * (T.sidewalkOuter + 0.15), 58, s * (T.sidewalkOuter + 0.15), perLine * 2, 0.15);
  along(-58, -33.8, 58, -33.8, perLine, 0.4);
  along(-58, 33.8, 58, 33.8, perLine, 0.4);
  // house foundations
  for (const h of houses) along(h.x - 4.6, h.z, h.x + 4.6, h.z, perLine / 3, 0.2);
  along(-5.2, 13.8, 5.2, 13.8, perLine / 3, 0.15);
  // scattered lawn tufts for the rest of the budget
  while (tuftPts.length < budget) {
    const x = rr.range(-58, 58), z = rr.range(6.5, 33) * (rr.next() < 0.5 ? -1 : 1);
    tuftPts.push([x, z]);
  }
  const tufts = N.grassTufts(tuftPts.filter((p) => !onSomething(p)));
  root.add(tufts);
  const flowerPts = [];
  for (let i = 0; i < 240; i++) {
    const x = rr.range(-56, 56), z = rr.range(7, 32) * (rr.next() < 0.5 ? -1 : 1);
    if (!onSomething([x, z])) flowerPts.push([x, z]);
  }
  root.add(N.flowers(flowerPts));

  b.finalize();
  return {
    root, updaters, playerHouse: ph, trees, fences: fenceInfo,
    spawn: PLAYER_HOUSE.porchSpawn.clone(), spawnYaw: 0,
  };
}

// Keep tufts and flowers off houses, drives and walks.
function onSomething([x, z]) {
  if (Math.abs(z) < 6) return true;
  const rects = [
    [-5.4, 5.4, 12.4, 22.4], [7, 10, 5.7, 20], [-2, -0.4, 5.7, 11.2],
    [-33, -23, 3, 21], [23, 33, 3, 21], [-33, -23, -21, -3], [23, 33, -21, -3],
    [-17, 17, -34, -6], // neighbor's lot is dressed separately
  ];
  return rects.some(([x0, x1, z0, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1);
}

// White picket fences: each section leans its own way, each picket wobbles.
// All pickets in one InstancedMesh.
export function picketFences(root, physics, lines, name, opts = {}) {
  const r = rng(name);
  const W = CONFIG.warpBudgets;
  const height = opts.height ?? 1.0;
  const pg = roundedBox(0.12, height, 0.05, 0.02, 2, { bottom: true, skipNormals: true });
  const pos = pg.attributes.position;
  for (let v = 0; v < pos.count; v++) if (pos.getY(v) > height - 0.08) pos.setY(v, pos.getY(v) + (0.06 - Math.abs(pos.getX(v))) * 1.4);
  smoothNormals(pg);
  const spacing = 0.24;
  let total = 0;
  const sections = [];
  for (const [[x0, z0], [x1, z1]] of lines) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const nSec = Math.max(1, Math.round(len / 2.4));
    for (let s = 0; s < nSec; s++) {
      const t0 = s / nSec, t1 = (s + 1) / nSec;
      sections.push({ a: [x0 + (x1 - x0) * t0, z0 + (z1 - z0) * t0], b: [x0 + (x1 - x0) * t1, z0 + (z1 - z0) * t1] });
    }
  }
  for (const sec of sections) {
    sec.len = Math.hypot(sec.b[0] - sec.a[0], sec.b[1] - sec.a[1]);
    sec.n = Math.max(2, Math.floor(sec.len / spacing));
    total += sec.n;
  }
  const mat = makeMat(opts.color ?? 'PH_TRIM');
  const im = new InstancedMesh(pg, mat, total);
  im.castShadow = true;
  im.receiveShadow = true;
  const railGeos = [];
  const o = new Object3D();
  const secObj = new Object3D();
  let k = 0;
  for (const sec of sections) {
    const ang = Math.atan2(sec.b[1] - sec.a[1], sec.b[0] - sec.a[0]);
    secObj.position.set(sec.a[0], 0, sec.a[1]);
    secObj.rotation.set(0, -ang, r.range(-W.fenceSectionRot, W.fenceSectionRot) * DEG, 'YXZ');
    secObj.rotation.x = r.range(-W.fenceSectionRot, W.fenceSectionRot) * DEG;
    secObj.updateMatrix();
    for (let i = 0; i < sec.n; i++) {
      o.position.set((i + 0.5) * (sec.len / sec.n), 0, 0);
      o.rotation.set(r.range(-1, 1) * DEG, 0, r.range(-W.fencePicketRot, W.fencePicketRot) * DEG);
      o.updateMatrix();
      o.matrix.premultiply(secObj.matrix);
      im.setMatrixAt(k++, o.matrix);
    }
    for (const y of [height * 0.25, height * 0.68]) {
      const rg = roundedBox(sec.len, 0.09, 0.05, 0.02, 2, { skipNormals: true });
      sag(rg, 0.015, 'x');
      smoothNormals(rg);
      rg.translate(sec.len / 2, y, -0.05);
      rg.applyMatrix4(secObj.matrix);
      railGeos.push(rg.toNonIndexed());
    }
    const c = new Vector3((sec.a[0] + sec.b[0]) / 2, height / 2, (sec.a[1] + sec.b[1]) / 2);
    const q = new Quaternion().setFromEuler(new Euler(0, -ang, 0));
    physics.addStaticBox(c, new Vector3(sec.len / 2, height / 2 + 0.1, 0.07), q);
  }
  im.instanceMatrix.needsUpdate = true;
  root.add(im);
  const rails = new Mesh(mergeGeometries(railGeos), mat);
  rails.castShadow = rails.receiveShadow = true;
  root.add(rails);
  return { pickets: im, rails, sections };
}

export { wobble, seedFrom };
