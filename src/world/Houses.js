// Cute, harmless, slightly leaning flanking houses. Not enterable: a solid
// sided volume per story, a gable roof, chunky windows with drawn curtains,
// a locked front door, porch steps.
import { Group, Mesh, Vector3, SphereGeometry } from 'three';
import { Builder } from './Architecture.js';
import { makeMat } from '../art/Materials.js';
import * as Tex from '../art/CanvasTextures.js';
import { roundedBox } from '../art/Geo.js';
import { rng } from '../art/Warp.js';
import { CONFIG } from '../config.js';

const DEG = Math.PI / 180;

/**
 * o: { name, x, z (front wall center), facing (+1 front faces +z, -1 faces -z), w, d, stories,
 *      siding (palette name), roof, door, curtain, storyH }
 */
export function suburbanHouse(parent, physics, o) {
  const r = rng(o.name);
  const b = new Builder(parent, physics, o.name);
  const f = o.facing;
  const storyH = o.storyH ?? 3.0;
  const H = storyH * o.stories;
  const cz = o.z - f * (o.d / 2); // center of footprint
  const sidingMat = makeMat('WHITE', { map: Tex.siding(o.siding) });
  const trimMat = makeMat('PH_TRIM');
  const leanDeg = r.signed(CONFIG.warpBudgets.otherHouseLean);
  const leanAxis = r.next() < 0.5 ? 'x' : 'z';
  // foundation
  b.box(o.w + 0.3, 0.45, o.d + 0.3, makeMat('NH_FOUNDATION'), o.x, 0, cz, { radius: 0.06 });
  for (let s = 0; s < o.stories; s++) {
    b.box(o.w, storyH, o.d, sidingMat, o.x, 0.45 + s * storyH, cz, {
      radius: 0.1, lean: [leanDeg, leanAxis, -s * storyH], wobble: 0.004, midStep: 1.5,
    });
    // trim band between stories
    b.box(o.w + 0.16, 0.16, o.d + 0.16, trimMat, o.x, 0.45 + (s + 1) * storyH - 0.08, cz, {
      collide: false, lean: [leanDeg, leanAxis, -(s + 1) * storyH + 0.08], radius: 0.05,
    });
  }
  const kTop = Math.tan(leanDeg * DEG) * H;
  const roofX = o.x + (leanAxis === 'x' ? kTop : 0);
  const roofZ = cz + (leanAxis === 'z' ? kTop : 0);
  b.gableRoof({
    x: roofX, z: roofZ, w: o.w, d: o.d, y: 0.45 + H, pitch: r.range(30, 40), overhang: 0.55, t: 0.26,
    mat: makeMat('WHITE', { map: Tex.shingles(o.roof) }), gableMat: sidingMat, fasciaMat: trimMat, axis: 'x', sag: 0.08,
  });
  // windows on the front: 2 per story, plus a door on the ground floor
  const frontZ = o.z + f * 0.05;
  const shear = (y) => Math.tan(leanDeg * DEG) * (y - 0.45);
  const winY = (s) => 0.45 + s * storyH + storyH * 0.52;
  for (let s = 0; s < o.stories; s++) {
    const xs = s === 0 ? [-o.w * 0.3, o.w * 0.3] : [-o.w * 0.28, 0, o.w * 0.28];
    for (const dx of xs) {
      const y = winY(s);
      b.window({
        x: o.x + dx + (leanAxis === 'x' ? shear(y) : 0), y, z: frontZ + (leanAxis === 'z' ? shear(y) : 0),
        w: 0.85, h: 1.35, axis: 'x', t: 0.1, facing: f, curtain: o.curtain, frameMat: trimMat,
        shutters: s === 0, shutterMat: makeMat(o.shutter ?? 'PH_TRIM'), lean: leanAxis === 'z' ? leanDeg : 0,
      });
    }
  }
  // locked front door, tall-ish with a little round window
  const door = new Group();
  const slab = new Mesh(roundedBox(0.95, 2.2, 0.1, 0.04, 2), makeMat(o.door, { spec: 0.25 }));
  slab.position.y = 1.1;
  const frame = new Mesh(roundedBox(1.25, 2.45, 0.08, 0.04, 2), trimMat);
  frame.position.set(0, 1.2, -0.03);
  const knob = new Mesh(new SphereGeometry(0.055, 12, 8), makeMat('BRASS', { spec: 0.6 }));
  knob.position.set(0.32, 1.05, 0.07);
  const port = new Mesh(roundedBox(0.3, 0.3, 0.03, 0.14, 3), makeMat('WHITE', { map: Tex.glassGlare(), transparent: true }));
  port.position.set(0, 1.75, 0.06);
  door.add(frame, slab, knob, port);
  door.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  door.position.set(o.x + (leanAxis === 'x' ? shear(1.5) : 0), 0.45, frontZ);
  door.rotation.y = f > 0 ? 0 : Math.PI;
  b.root.add(door);
  // porch steps
  for (let i = 0; i < 2; i++) {
    b.box(1.8, 0.45 - i * 0.22, 0.4, makeMat('SIDEWALK'), o.x, 0, o.z + f * (0.2 + i * 0.4), { radius: 0.04 });
  }
  b.finalize();
  return { root: b.root, front: new Vector3(o.x, 0, o.z), door };
}
