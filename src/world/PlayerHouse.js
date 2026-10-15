// The player's house: small, baby blue, nearly straight, safe. Living room
// with a couch and TV, a little kitchen corner, and the bedroom whose window
// stares straight across the street at the neighbor's house. Respawn point.
import { Group, Mesh, Vector3, SphereGeometry } from 'three';
import { Builder } from './Architecture.js';
import { makeMat } from '../art/Materials.js';
import * as Tex from '../art/CanvasTextures.js';
import { roundedBox } from '../art/Geo.js';
import * as F from './props/Furniture.js';

const DEG = Math.PI / 180;

export const PLAYER_HOUSE = {
  x0: -5, x1: 5, z0: 14, z1: 22, floorY: 0.3, wallH: 2.7, t: 0.22,
  // where the player wakes up after being caught: beside the bed, facing the window
  bedSpawn: new Vector3(2.4, 0.3, 17.6),
  bedSpawnYaw: 0.35,
  porchSpawn: new Vector3(-1.2, 0.3, 12.9),
};

export function buildPlayerHouse(parent, physics, lights) {
  const H = PLAYER_HOUSE;
  const b = new Builder(parent, physics, 'playerHouse');
  const siding = makeMat('WHITE', { map: Tex.siding('PH_SIDING') });
  const trim = makeMat('PH_TRIM');
  const paper = makeMat('WHITE', { map: Tex.wallpaper('flowers', 'WALLPAPER_YELLOW', 'WALLPAPER_PINK_DOT') });
  const paperBed = makeMat('WHITE', { map: Tex.wallpaper('clouds', 'WALLPAPER_BLUE', 'WHITE') });
  const y0 = H.floorY, h = H.wallH, t = H.t;
  const L = 0.3; // almost straight: max 0.3 degrees of lean

  // foundation + floor
  b.box(H.x1 - H.x0 + 0.4, y0, H.z1 - H.z0 + 0.4, makeMat('NH_FOUNDATION'), 0, 0, (H.z0 + H.z1) / 2, { radius: 0.05, wobble: 0 });
  b.floor(H.x0, H.x1, H.z0, H.z1, y0 + 0.02, 0.03, makeMat('WHITE', { map: Tex.woodPlanks('FLOOR_WOOD', 6) }), { collide: false, cast: false });

  const front = [
    { at: 1.5, w: 1.0, bottom: 0.9, top: 2.2 }, // living room window
    { at: 3.8, w: 0.95, bottom: 0, top: 2.2 }, // front door
    { at: 7.8, w: 1.0, bottom: 0.9, top: 2.3 }, // bedroom window: faces the neighbor
  ];
  const back = [
    { at: 2.5, w: 1.0, bottom: 1.1, top: 2.2 },
    { at: 8.0, w: 0.9, bottom: 0.9, top: 2.2 },
  ];
  const side = [{ at: 4, w: 0.9, bottom: 0.9, top: 2.2 }];
  const walls = [
    { axis: 'x', from: H.x0, to: H.x1, at: H.z0, openings: front, lean: -L, inner: 1 },
    { axis: 'x', from: H.x0, to: H.x1, at: H.z1, openings: back, lean: 0.2, inner: -1 },
    { axis: 'z', from: H.z0, to: H.z1, at: H.x0, openings: side, lean: 0, inner: 1 },
    { axis: 'z', from: H.z0, to: H.z1, at: H.x1, openings: side, lean: L, inner: -1 },
  ];
  const ops = [];
  for (const w of walls) {
    const res = b.wall({ ...w, y: y0, h, t, mat: siding });
    ops.push(...res.map((o, i) => ({ ...o, wall: w, spec: w.openings[i] })));
    // interior lining in wallpaper (visual only)
    const mat = (w.axis === 'x' ? w.at === H.z0 : false) || (w.axis === 'z' && w.at === H.x1) ? paperBed : paper;
    b.wall({ ...w, at: w.at + w.inner * (t / 2 + 0.012), t: 0.024, y: y0, h, mat: w.axis === 'z' && w.at === H.x0 ? paper : mat, collide: false, cast: false, lean: 0, wobble: 0 });
  }
  // partition between living room and bedroom, doorway near the back
  b.wall({ axis: 'z', from: H.z0, to: H.z1, at: 0.6, y: y0, h, t: 0.14, mat: paper, openings: [{ at: 6, w: 0.95, bottom: 0, top: 2.2 }] });

  // windows + front door frame
  for (const o of ops) {
    const isDoor = o.spec.bottom === 0;
    const facing = o.wall.inner * -1; // outward normal sign
    if (isDoor) continue;
    b.window({
      x: o.x, y: o.y, z: o.z, w: o.w - 0.1, h: o.h - 0.1, axis: o.axis, t, facing,
      frameMat: trim, shutters: o.wall.at === H.z0, shutterMat: makeMat('PH_ROOF'),
      flowerBox: o.wall.at === H.z0 ? makeMat('PH_TRIM') : null,
    });
  }
  // front door: yellow, swung open into the hall
  const doorPos = ops.find((o) => o.spec.bottom === 0);
  const df = new Mesh(roundedBox(1.25, 2.45, t + 0.12, 0.04, 2), trim);
  // frame as three pieces so the doorway stays open
  b.box(0.15, 2.35, t + 0.1, trim, doorPos.x - 0.55, y0, H.z0, { collide: false, radius: 0.03 });
  b.box(0.15, 2.35, t + 0.1, trim, doorPos.x + 0.55, y0, H.z0, { collide: false, radius: 0.03 });
  b.box(1.25, 0.15, t + 0.1, trim, doorPos.x, y0 + 2.2, H.z0, { collide: false, radius: 0.03 });
  df.geometry.dispose();
  const door = new Group();
  const slab = new Mesh(roundedBox(0.9, 2.18, 0.08, 0.03, 2), makeMat('PH_DOOR', { spec: 0.25 }));
  slab.position.set(0.45, 1.09, 0);
  const kn = new Mesh(new SphereGeometry(0.05, 12, 8), makeMat('BRASS', { spec: 0.6 }));
  kn.position.set(0.78, 1.0, 0.07);
  door.add(slab, kn);
  door.position.set(doorPos.x - 0.45, y0, H.z0 + 0.12);
  door.rotation.y = -100 * DEG; // swung inward against the wall
  door.traverse((m) => { if (m.isMesh) m.castShadow = m.receiveShadow = true; });
  b.root.add(door);

  // ceiling + roof
  b.box(H.x1 - H.x0, 0.14, H.z1 - H.z0, makeMat('CEILING'), 0, y0 + h, (H.z0 + H.z1) / 2, { radius: 0.03, wobble: 0, midStep: 3 });
  b.gableRoof({
    x: 0, z: (H.z0 + H.z1) / 2, w: H.x1 - H.x0, d: H.z1 - H.z0, y: y0 + h + 0.14, pitch: 32, overhang: 0.6, t: 0.26,
    mat: makeMat('WHITE', { map: Tex.shingles('PH_ROOF') }), gableMat: siding, fasciaMat: trim, axis: 'x', sag: 0.03,
  });
  // chimney
  b.box(0.8, 3.4, 0.8, makeMat('WHITE', { map: Tex.brick('CARPET_RED') }), 3.4, y0 + h, 20.2, { radius: 0.06 });

  // porch + steps
  b.box(4.2, y0, 1.6, makeMat('SIDEWALK'), -1.2, 0, H.z0 - 0.8, { radius: 0.05, wobble: 0 });
  b.box(1.6, 0.15, 0.35, makeMat('SIDEWALK'), -1.2, 0, H.z0 - 1.78, { radius: 0.03, wobble: 0 });
  for (const x of [-3.1, 0.7]) {
    b.box(0.22, h + 0.1, 0.22, trim, x, y0, H.z0 - 1.4, { radius: 0.06 });
  }
  b.box(4.6, 0.18, 1.9, makeMat('PH_ROOF'), -1.2, y0 + h - 0.02, H.z0 - 0.8, { radius: 0.05, rotX: -6 * DEG, collide: false });

  // ---- interior: living room ----
  const place = (obj, x, z, rotY = 0, collide = true, y = y0) => {
    obj.position.set(x, y, z);
    obj.rotation.y = rotY;
    b.root.add(obj);
    if (collide) F.placeStatic(physics, obj);
    return obj;
  };
  place(F.rug('ph-rug', { w: 2.6, d: 2.0, color: 'CARPET_GREEN', pattern: 'circles' }), -2.6, 17.6, 0, false, y0 + 0.02);
  place(F.sofa('ph-sofa', 'BLUE_TOY', 2), -1.4, 17.6, -Math.PI / 2);
  const tvSet = place(F.tv('ph-tv'), -4.35, 17.6, Math.PI / 2);
  const lampL = place(F.lamp('ph-lamp', { h: 1.9 }), -4.4, 15.0, 0, false);
  lights?.addFrom(lampL);
  place(F.bookshelf('ph-shelf', { w: 1.0, h: 1.8, leanDeg: 0.5, rows: 3 }), -0.3, 15.0, Math.PI);
  // kitchen corner
  place(F.counter('ph-counter', { w: 2.4, sink: true }), -3.4, 21.5, Math.PI);
  place(F.fridge('ph-fridge', 'FRIDGE'), -1.4, 21.45, Math.PI);
  place(F.table('ph-table', { w: 1.1, d: 0.8, turnedLegs: false }), -2.7, 19.9, 0);
  place(F.chair('ph-chair1', 'WOOD_LIGHT', 'BLUE_TOY'), -3.4, 19.9, Math.PI / 2, false);
  place(F.chair('ph-chair2', 'WOOD_LIGHT', 'BLUE_TOY'), -2.0, 19.9, -Math.PI / 2, false);

  // ---- bedroom ----
  place(F.rug('ph-rug2', { w: 1.8, d: 1.4, color: 'CARPET_RED' }), 2.6, 17.6, 0, false, y0 + 0.02);
  const bedObj = place(F.bed('ph-bed', { quilt: 'CARPET_GREEN', w: 1.3, l: 2.0, headH: 1.3 }), 3.95, 18.4, -Math.PI / 2);
  place(F.nightstand('ph-night'), 4.6, 16.75, -Math.PI / 2);
  const lampB = place(F.lamp('ph-lampB', { kind: 'table', base: 'SKY_TOY' }), 4.6, 16.75, 0, false, y0 + 0.55);
  lights?.addFrom(lampB);
  const radio = place(F.radio('ph-radio'), 1.3, 21.55, Math.PI, false, y0 + 0.86);
  place(F.dresser('ph-dresser'), 1.6, 21.55, Math.PI);
  place(F.wardrobe('ph-wardrobe', 'WOOD_LIGHT'), 3.6, 21.4, Math.PI);
  const posterA = F.frame('ph-poster', { w: 0.7, h: 0.9, color: 'RED_TOY', pic: 'SKY_TOY' });
  place(posterA, 4.86, 19.8, -Math.PI / 2, false, y0 + 1.3);

  b.finalize();
  return {
    root: b.root,
    zone: { min: new Vector3(H.x0, -1, H.z0), max: new Vector3(H.x1, y0 + h, H.z1) },
    radio, tv: tvSet, bed: bedObj,
    // loose physics props live in the house: returned so the world can register them
    looseProps: [
      { obj: F.cardboardBox('ph-box', 0.65), pos: new Vector3(1.6, y0 + 0.3, 15.3), mass: 3, half: { x: 0.325, y: 0.26, z: 0.325 } },
    ],
  };
}
