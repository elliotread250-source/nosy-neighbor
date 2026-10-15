// Inside Mr. Grimsby's house: wallpaper/paint linings on every wall face
// (found by sampling which room lies on each side), room floors, stairs,
// banisters, the U-turn back stair, the basement descent, the secret tunnel
// under the washing machine, ladders, hatches, god rays. Furniture lives in
// rooms/*.js and is baked per floor.
import { Group, Mesh, Vector3, Box3, Quaternion, Euler, SphereGeometry, PointLight } from 'three';
import { Builder } from './Architecture.js';
import { NH, WALLS, ROOMS, HOLES, FLOOR_Y, FLOOR_H, CHUNK_SHEAR } from './NeighborPlan.js';
import { makeMat } from '../art/Materials.js';
import * as Tex from '../art/CanvasTextures.js';
import { roundedBox, chamferCylinder, smoothNormals } from '../art/Geo.js';
import { twist, rng } from '../art/Warp.js';
import { Palette } from '../art/Palette.js';
import { GodRays } from '../art/GodRays.js';
import { sunDirection } from '../art/Sky.js';
import { bakeStatic } from '../art/Bake.js';
import { buildLadder } from './NeighborYard.js';
import { furnishGroundFloor } from './rooms/GroundFloor.js';
import { furnishUpperFloor } from './rooms/UpperFloor.js';
import { furnishTopFloors } from './rooms/TopFloors.js';
import { RAPIER } from '../core/Physics.js';
import { Events } from '../core/Events.js';
import { CONFIG } from '../config.js';

const DEG = Math.PI / 180;

function roomAt(floor, x, z) {
  for (const r of ROOMS) if (r.floor === floor && x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) return r;
  return null;
}

function floorMaterial(kind) {
  switch (kind) {
    case 'wood': return makeMat('WHITE', { map: Tex.woodPlanks('FLOOR_WOOD', 5) });
    case 'dark': return makeMat('WHITE', { map: Tex.woodPlanks('FLOOR_WOOD_DARK', 5) });
    case 'checker': return makeMat('WHITE', { map: Tex.checker('FLOOR_TILE_A', 'FLOOR_TILE_B') });
    case 'pinkTile': return makeMat('WHITE', { map: Tex.checker('WALLPAPER_PINK', 'FLOOR_TILE_A') });
    case 'yellowTile': return makeMat('WHITE', { map: Tex.checker('YELLOW_TOY', 'FLOOR_TILE_A') });
    case 'carpetGreen': return makeMat('CARPET_GREEN');
    case 'carpetRed': return makeMat('CARPET_RED');
    case 'basement': return makeMat('BASEMENT_FLOOR');
    default: return makeMat('WHITE', { map: Tex.woodPlanks('NH_PLANKS_OLD', 5) });
  }
}

function wallMaterial(room) {
  if (room.paint) return makeMat(room.paint);
  const [kind, a, b] = room.paper;
  return makeMat('WHITE', { map: Tex.wallpaper(kind, a, b) });
}

/**
 * Small horizontal hatch (trapdoor / attic hatch / washer cover).
 */
export class Hatch {
  constructor(root, physics, o) {
    this.o = o;
    this.id = o.id;
    this.lock = o.lock ?? null;
    this.isOpen = false;
    this.pivot = new Group();
    this.pivot.userData.noBake = true;
    this.pivot.position.set(o.x0, o.y, (o.z0 + o.z1) / 2);
    const w = o.x1 - o.x0, d = o.z1 - o.z0;
    const slab = new Mesh(roundedBox(w, 0.07, d, 0.02, 2), makeMat(o.color ?? 'NH_PLANKS'));
    slab.position.set(w / 2, 0.035, 0);
    slab.castShadow = slab.receiveShadow = true;
    this.pivot.add(slab);
    const ring = new Mesh(chamferCylinder(0.05, 0.05, 0.02, 10, 0.008), makeMat(o.lock ? 'BRASS' : 'METAL_DARK'));
    ring.position.set(w * 0.75, 0.08, 0);
    this.pivot.add(ring);
    if (o.lock) {
      const plate = new Mesh(roundedBox(0.14, 0.03, 0.18, 0.01, 1), makeMat(o.lockColor ?? 'BRASS', { emissive: o.lockColor ?? 'BRASS', emissiveIntensity: 0.25 }));
      plate.position.set(w * 0.75, 0.08, 0.15);
      this.pivot.add(plate);
    }
    root.add(this.pivot);
    this.physics = physics;
    this.collider = physics.addStaticBox(new Vector3((o.x0 + o.x1) / 2, o.y + 0.035, (o.z0 + o.z1) / 2), new Vector3(w / 2, 0.05, d / 2), null, { kind: 'hatch', hatch: this });
    this.target = 0;
    this.angle = 0;
  }

  get locked() { return !!this.lock; }

  open() {
    if (this.lock || this.isOpen) return false;
    this.isOpen = true;
    this.target = -105 * DEG;
    this.physics.colliderData.delete(this.collider.handle);
    this.physics.world.removeCollider(this.collider, true);
    Events.emit('sfx', { name: 'hatch', position: this.pivot.position.clone() });
    Events.emit('noise', { position: this.pivot.position.clone(), loudness: 0.4, kind: 'hatch' });
    return true;
  }

  unlock(key) {
    if (this.lock === key) { this.lock = null; return true; }
    return false;
  }

  update(dt) {
    if (this.angle !== this.target) {
      const d = this.target - this.angle;
      this.angle += Math.sign(d) * Math.min(Math.abs(d), dt * 4);
      this.pivot.rotation.z = -this.angle;
    }
  }
}

export function buildNeighborInterior(scene, physics, { doors, windows, lights, zones, house }) {
  const root = new Group();
  root.name = 'nhInterior';
  scene.add(root);
  const floors = {};
  const B = {};
  for (const k of ['F0', 'F1', 'F2', 'TR', 'TW', 'UG']) {
    floors[k] = new Group();
    floors[k].name = `interior-${k}`;
    root.add(floors[k]);
    B[k] = new Builder(floors[k], physics, `nhi-${k}`);
    const sh = CHUNK_SHEAR[k];
    if (sh) B[k].setShear(sh[0], sh[1], sh[2]);
  }
  const updaters = [];
  const hideSpots = [];
  const interactables = [];
  const hatches = [];
  const ladderVolumes = [];

  // ------------------------------------------------------------ linings
  const SAMPLE = 0.2;
  for (const w of WALLS) {
    const t = w.kind === 'ext' ? NH.extT : NH.intT;
    const y = FLOOR_Y[w.floor], h = FLOOR_H[w.floor];
    const len = Math.abs(w.to - w.from);
    const dir = Math.sign(w.to - w.from) || 1;
    for (const s of [-1, 1]) {
      // walk the wall, grouping samples by the room on this side
      const segs = [];
      for (let d = SAMPLE / 2; d < len; d += SAMPLE) {
        const along = w.from + dir * d;
        const px = w.axis === 'x' ? along : w.at + s * 0.35;
        const pz = w.axis === 'x' ? w.at + s * 0.35 : along;
        const r = roomAt(w.floor, px, pz);
        const last = segs[segs.length - 1];
        if (r && last && last.room.id === r.id && Math.abs(last.b - (d - SAMPLE / 2)) < 1e-6) last.b = d + SAMPLE / 2;
        else if (r) segs.push({ room: r, a: d - SAMPLE / 2, b: d + SAMPLE / 2 });
      }
      for (const seg of segs) {
        const a = Math.max(0, seg.a), b = Math.min(len, seg.b);
        const openings = (w.openings || [])
          .filter((o) => o.at > a && o.at < b)
          .filter((o) => !(o.fake && seg.room.id !== 'hall1')) // fake door: plain wall on the far side
          .map((o) => ({ ...o, at: o.at - a }));
        const at = w.at + s * (t / 2 + 0.013);
        const from = w.from + dir * a, to = w.from + dir * b;
        const bld = B[w.floor];
        bld.wall({ axis: w.axis, from, to, at, y, h, t: 0.026, mat: wallMaterial(seg.room), openings, collide: false, cast: false, wobble: 0 });
        if (seg.room.wainscot) {
          bld.wall({ axis: w.axis, from, to, at: w.at + s * (t / 2 + 0.03), y, h: 1.05, t: 0.05, mat: makeMat('WAINSCOT'), openings, collide: false, cast: false, wobble: 0 });
          bld.wall({ axis: w.axis, from, to, at: w.at + s * (t / 2 + 0.05), y: y + 1.05, h: 0.07, t: 0.07, mat: makeMat('WOOD_MID'), openings: openings.map((o) => ({ ...o, bottom: Math.min(o.bottom, 0) })), collide: false, cast: false, wobble: 0 });
        }
        // skirting board
        bld.wall({ axis: w.axis, from, to, at: w.at + s * (t / 2 + 0.04), y, h: 0.14, t: 0.06, mat: makeMat('WOOD_DARK'), openings: openings.filter((o) => o.bottom < 0.14), collide: false, cast: false, wobble: 0 });
      }
    }
  }

  // ------------------------------------------------------------ room floors
  for (const r of ROOMS) {
    const y = FLOOR_Y[r.floor];
    const holes = HOLES[r.floor] || [];
    B[r.floor].floorWithHoles(r.x0, r.x1, r.z0, r.z1, y + 0.02, 0.025, floorMaterial(r.floorMat), holes, { collide: false, cast: false });
  }

  // ------------------------------------------------------------ main stairs (hall -> F1)
  const stairMat = makeMat('WHITE', { map: Tex.woodPlanks('FLOOR_WOOD_DARK', 4) });
  const rise1 = (FLOOR_Y.F1 - FLOOR_Y.F0) / 18;
  B.F0.stairs(-0.85, -17.2, FLOOR_Y.F0, '-z', 18, rise1, 0.26, 1.1, stairMat, { nosing: makeMat('WOOD_DARK') });
  // stair runner carpet
  for (let i = 0; i < 18; i++) {
    B.F0.box(0.7, 0.012, 0.24, makeMat('CARPET_RED'), -0.85, FLOOR_Y.F0 + (i + 1) * rise1, -17.2 - (i + 0.5) * 0.26, { collide: false, cast: false, radius: 0.004, wobble: 0 });
  }
  // fat, slightly twisting banister on the open side
  {
    const post = (x, y, z, h) => {
      const g = chamferCylinder(0.05, 0.06, h, 10, 0.02, { bottom: true });
      twist(g, 20);
      smoothNormals(g);
      const m = new Mesh(g, makeMat('WOOD_DARK'));
      m.position.set(x, y, z);
      m.castShadow = true;
      floors.F0.add(m);
    };
    for (let i = 0; i <= 18; i += 2) post(-0.33, FLOOR_Y.F0 + i * rise1, -17.25 - i * 0.26, 0.95);
    const railLen = Math.hypot(18 * 0.26, 18 * rise1);
    const rail = new Mesh(chamferCylinder(0.06, 0.06, railLen, 10, 0.02), makeMat('WOOD_MID', { spec: 0.3 }));
    rail.position.set(-0.33, FLOOR_Y.F0 + 0.95 + 9 * rise1, -17.25 - 9 * 0.26);
    rail.rotation.x = Math.PI / 2 - Math.atan2(18 * rise1, 18 * 0.26);
    rail.rotation.x = -(Math.PI / 2 - Math.atan2(18 * rise1, 18 * 0.26));
    rail.castShadow = true;
    floors.F0.add(rail);
    const newel = new Mesh(chamferCylinder(0.1, 0.12, 1.15, 12, 0.03, { bottom: true }), makeMat('WOOD_DARK'));
    newel.position.set(-0.33, FLOOR_Y.F0, -17.05);
    floors.F0.add(newel);
    const ball = new Mesh(new SphereGeometry(0.11, 12, 10), makeMat('WOOD_MID', { spec: 0.4 }));
    ball.position.set(-0.33, FLOOR_Y.F0 + 1.22, -17.05);
    floors.F0.add(ball);
    physics.addStaticBox(new Vector3(-0.27, FLOOR_Y.F0 + 2.4, -19.55), new Vector3(0.04, 2.4, 2.35));
  }
  // F1 railing around the stair hole
  const railRun = (bld, x0, z0, x1, z1, y) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ang = Math.atan2(z1 - z0, x1 - x0);
    bld.box(len, 0.1, 0.1, makeMat('WOOD_MID'), (x0 + x1) / 2, y + 0.95, (z0 + z1) / 2, { rotY: -ang, radius: 0.03, collide: false });
    for (let d = 0; d <= len; d += 0.32) {
      const t = d / len;
      bld.box(0.06, 0.95, 0.06, makeMat('WOOD_DARK'), x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t, { radius: 0.02, collide: false });
    }
    physics.addStaticBox(new Vector3((x0 + x1) / 2, y + 0.55, (z0 + z1) / 2), new Vector3(len / 2, 0.55, 0.05), new Quaternion().setFromEuler(new Euler(0, -ang, 0)));
  };
  railRun(B.F1, -1.45, -17.12, -0.25, -17.12, FLOOR_Y.F1);
  railRun(B.F1, -1.45, -17.12, -1.45, -21.5, FLOOR_Y.F1);
  railRun(B.F1, -0.25, -17.12, -0.25, -21.5, FLOOR_Y.F1);

  // ------------------------------------------------------------ back stairs (F1 -> F2), a steep U-turn
  {
    const r2 = (FLOOR_Y.F2 - FLOOR_Y.F1) / 16;
    const end1 = B.F1.stairs(-2.7, -24.18, FLOOR_Y.F1, '-x', 8, r2, 0.26, 1.15, stairMat, { nosing: makeMat('WOOD_DARK') });
    // landing
    B.F1.box(-4.78 - -6.95, end1.y - FLOOR_Y.F1, 2.4, stairMat, (-4.78 - 6.95) / 2, FLOOR_Y.F1, -24.75, { radius: 0.03 });
    B.F1.stairs(-4.78, -25.38, end1.y, '+x', 8, r2, 0.26, 1.15, stairMat, { nosing: makeMat('WOOD_DARK'), solid: false });
    // posts under the floating flight
    for (const x of [-4.4, -3.4]) B.F1.box(0.12, (end1.y - FLOOR_Y.F1) + (x + 4.78) / 0.26 * r2, 0.12, makeMat('WOOD_DARK'), x, FLOOR_Y.F1, -25.38, { radius: 0.03 });
    // railing at F2 around the hole, except the arrival
    railRun(B.F2, -6.95, -23.52, -2.7, -23.52, FLOOR_Y.F2);
    railRun(B.F2, -2.67, -23.52, -2.67, -24.75, FLOOR_Y.F2);
    // divider between the two flights
    B.F1.box(2.2, 1.0, 0.06, makeMat('WOOD_MID'), -3.8, end1.y - 0.2, -24.78, { radius: 0.02, collide: false });
  }

  // ------------------------------------------------------------ underground: basement descent + secret tunnel
  const ug = B.UG;
  const ugWall = makeMat('BASEMENT_WALL');
  const ugFloor = makeMat('BASEMENT_FLOOR');
  {
    // basement stairwell behind the hallway's basement door: x 0..1.5, z -22..-26
    const bottomY = FLOOR_Y.F0 - 13 * 0.22;
    for (let i = 0; i < 13; i++) {
      const top = FLOOR_Y.F0 - (i + 1) * 0.22;
      ug.box(1.3, 0.22 + 0.4, 0.27, stairMat, 0.75, top - 0.4, -22.35 - (i + 0.5) * 0.26, { radius: 0.02 });
    }
    ug.box(1.5, 0.3, 0.6, ugFloor, 0.75, bottomY - 0.3, -25.75, { radius: 0.02 });
    ug.box(0.12, 3.6, 4.2, ugWall, 0.04, bottomY - 0.3, -24, { radius: 0.02 });
    ug.box(0.12, 3.6, 4.2, ugWall, 1.46, bottomY - 0.3, -24, { radius: 0.02 });
    ug.box(1.5, 3.6, 0.12, ugWall, 0.75, bottomY - 0.3, -26.0, { radius: 0.02 });
    // a sour cyan-green bulb at the bottom
    const bulb = new Group();
    const b = new Mesh(new SphereGeometry(0.07, 10, 8), makeMat('BASEMENT_LIGHT', { emissive: 'BASEMENT_LIGHT', emissiveIntensity: 1.8 }));
    bulb.add(b);
    const pl = new PointLight(Palette.BASEMENT_LIGHT, 0, 6, 1.2);
    pl.userData.baseIntensity = 1.4;
    bulb.add(pl);
    bulb.position.set(0.75, FLOOR_Y.F0 - 0.4, -25.4);
    floors.UG.add(bulb);
    // green light leaking under the basement door
    const leak = new Mesh(roundedBox(0.9, 0.01, 0.4, 0.004, 1), makeMat('BASEMENT_LIGHT', { emissive: 'BASEMENT_LIGHT', emissiveIntensity: 1.3, transparent: true, opacity: 0.55, depthWrite: false }));
    leak.position.set(0.7, FLOOR_Y.F0 + 0.035, -21.75);
    floors.F0.add(leak);
    house.basementLeak = leak;
    house.basementBottom = new Vector3(0.75, bottomY, -25.4);
  }
  {
    // secret tunnel: from under the washer (mudroom) east to a dead end where the
    // orange basement key hangs behind a cage
    const ty = -2.4;
    ug.box(4.5, 0.3, 1.5, ugFloor, -2.15, ty - 0.3, -25.3, { radius: 0.02 });
    ug.box(4.5, 2.6, 0.12, ugWall, -2.15, ty - 0.3, -26.0, { radius: 0.02 });
    ug.box(3.3, 2.6, 0.12, ugWall, -1.55, ty - 0.3, -24.6, { radius: 0.02 });
    ug.box(0.12, 2.6, 1.5, ugWall, -4.45, ty - 0.3, -25.3, { radius: 0.02 });
    ug.box(0.12, 2.6, 1.5, ugWall, -0.06, ty - 0.3, -25.3, { radius: 0.02 });
    ug.box(1.2, 2.6, 0.12, ugWall, -3.85, ty - 0.3, -24.6, { radius: 0.02, collide: true });
    ug.box(4.5, 0.2, 1.5, ugWall, -2.15, ty + 2.3, -25.3, { radius: 0.02, collide: false });
    // wooden props holding up the ceiling
    for (const x of [-3.2, -1.9, -0.8]) ug.box(0.14, 2.5, 0.14, makeMat('NH_PLANKS_OLD'), x, ty, -24.75, { radius: 0.03, collide: false });
    const tl = new Group();
    const tb = new Mesh(new SphereGeometry(0.06, 10, 8), makeMat('BASEMENT_LIGHT', { emissive: 'BASEMENT_LIGHT', emissiveIntensity: 1.6 }));
    tl.add(tb);
    tl.position.set(-2.0, ty + 2.1, -25.3);
    floors.UG.add(tl);
    house.tunnelEnd = new Vector3(-0.5, ty, -25.3);
    house.tunnelLight = tl;
    // washer-hole ladder
    const lad = buildLadder(3.4);
    lad.position.set(-3.8, ty + 1.6, -25.85);
    floors.UG.add(lad);
    ladderVolumes.push(new Box3(new Vector3(-4.35, ty - 0.2, -25.95), new Vector3(-3.25, FLOOR_Y.F0 + 0.6, -24.9)));
  }

  // ------------------------------------------------------------ ladder shaft (purple room -> mudroom)
  {
    const x0 = -0.8, x1 = -0.1, z0 = -23.4, z1 = -22.7;
    const lad = buildLadder(7.8);
    lad.position.set(-0.45, FLOOR_Y.F0 + 3.9, z0 + 0.06);
    floors.F0.add(lad);
    ladderVolumes.push(new Box3(new Vector3(x0, FLOOR_Y.F0 - 0.1, z0), new Vector3(x1, FLOOR_Y.F2 + 0.8, z1)));
    // boxed column through the upstairs hall
    const colMat = makeMat('WAINSCOT');
    B.F1.box(0.08, FLOOR_H.F1, z1 - z0 + 0.16, colMat, x0 - 0.04, FLOOR_Y.F1, (z0 + z1) / 2, { radius: 0.02 });
    B.F1.box(0.08, FLOOR_H.F1, z1 - z0 + 0.16, colMat, x1 + 0.04, FLOOR_Y.F1, (z0 + z1) / 2, { radius: 0.02 });
    B.F1.box(x1 - x0, FLOOR_H.F1, 0.08, colMat, (x0 + x1) / 2, FLOOR_Y.F1, z0 - 0.04, { radius: 0.02 });
    B.F1.box(x1 - x0, FLOOR_H.F1, 0.08, colMat, (x0 + x1) / 2, FLOOR_Y.F1, z1 + 0.04, { radius: 0.02 });
    const trap = new Hatch(floors.F2, physics, { id: 'h-purple', x0: x0 - 0.02, x1: x1 + 0.02, z0: z0 - 0.02, z1: z1 + 0.02, y: FLOOR_Y.F2 + 0.02, color: 'NH_PLANKS_OLD' });
    hatches.push(trap);
  }
  // attic hatch (attic key) + ladder from the landing
  {
    const sh = B.F2.shearAt(FLOOR_Y.TW).x;
    const h = HOLES.TW[0];
    const lad = buildLadder(4.2);
    lad.position.set(-3.6 + sh * 0.5, FLOOR_Y.F2 + 2.0, h[2] + 0.06);
    lad.rotation.z = Math.atan2(sh, 3.8) * -1;
    floors.F2.add(lad);
    ladderVolumes.push(new Box3(new Vector3(-4.3, FLOOR_Y.F2 - 0.1, -22.1), new Vector3(-2.9, FLOOR_Y.TW + 0.9, -21.1)));
    const hatch = new Hatch(floors.TW, physics, { id: 'h-attic', x0: h[0] + sh - 0.02, x1: h[1] + sh + 0.02, z0: h[2] - 0.02, z1: h[3] + 0.02, y: FLOOR_Y.TW, lock: 'attic', lockColor: 'BRASS', color: 'NH_PLANKS' });
    hatches.push(hatch);
  }
  // washer cover over the secret hole (opened by the washing machine puzzle)
  {
    const h = HOLES.F0[0];
    const cover = new Hatch(floors.F0, physics, { id: 'h-washer', x0: h[0] - 0.02, x1: h[1] + 0.02, z0: h[2] - 0.02, z1: h[3] + 0.02, y: FLOOR_Y.F0, lock: 'puzzle', color: 'FLOOR_WOOD_DARK' });
    hatches.push(cover);
  }
  updaters.push((dt) => { for (const h of hatches) h.update(dt); });

  // ------------------------------------------------------------ furniture, decor, clutter
  const ctx = {
    physics, lights, doors, windows, zones, floors, hideSpots, interactables, updaters, house,
    loose: [],
  };
  furnishGroundFloor(ctx);
  furnishUpperFloor(ctx);
  furnishTopFloors(ctx);

  for (const b of Object.values(B)) b.finalize();

  // lights before baking (markers stay alive), then bake each floor's statics
  lights.addFrom(root);
  for (const k of Object.keys(floors)) bakeStatic(floors[k], `baked-${k}`);

  // ------------------------------------------------------------ god rays from sunlit windows
  const rays = new GodRays(scene);
  const lightDir = sunDirection().negate();
  for (const w of WALLS) {
    if (w.kind !== 'ext' || !['F0', 'F1', 'F2'].includes(w.floor)) continue;
    const normal = w.axis === 'x' ? new Vector3(0, 0, w.out) : new Vector3(w.out, 0, 0);
    for (const o of w.openings) {
      if (!o.window || o.round) continue;
      const along = w.from + Math.sign(w.to - w.from) * o.at;
      const c = new Vector3(w.axis === 'x' ? along : w.at, FLOOR_Y[w.floor] + (o.bottom + o.top) / 2, w.axis === 'x' ? w.at : along);
      rays.addWindow({ center: c, w: o.w * 0.9, h: o.top - o.bottom, normal, floorY: FLOOR_Y[w.floor] }, lightDir);
    }
  }
  rays.finalize();
  updaters.push((dt, t) => rays.update(dt, t));

  return { root, floors, updaters, hideSpots, interactables, hatches, ladderVolumes, rays, loose: ctx.loose };
}

export { RAPIER, CONFIG, rng };
