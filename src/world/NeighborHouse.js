// Mr. Grimsby's house: a respectable mustard two-story base with a stacked,
// leaning, bolted-together tower of secrets on top. Built chunk by chunk
// from NeighborPlan.js, each chunk warped its own way.
import {
  Group, Mesh, Vector3, ConeGeometry, SphereGeometry, CylinderGeometry, TorusGeometry, Quaternion, Euler,
  CatmullRomCurve3, TubeGeometry, MathUtils,
} from 'three';
import { Builder, worldUV } from './Architecture.js';
import { NH, WALLS, ROOMS, HOLES, FLOOR_Y, FLOOR_H, CHUNK_SHEAR } from './NeighborPlan.js';
import { makeMat } from '../art/Materials.js';
import * as Tex from '../art/CanvasTextures.js';
import { roundedBox, chamferCylinder, smoothNormals } from '../art/Geo.js';
import { taper, twist, lean, wobble, bend, rng, seedFrom } from '../art/Warp.js';
import { Palette } from '../art/Palette.js';
import { CONFIG } from '../config.js';

const DEG = Math.PI / 180;

export function buildNeighborHouse(scene, physics, { doors, windows, lights, zones }) {
  const root = new Group();
  root.name = 'neighborHouse';
  scene.add(root);
  const updaters = [];
  const R = rng('nh');
  const B = {}; // builders per chunk
  for (const k of ['F0', 'F1', 'F2', 'TR', 'TW', 'EXT']) {
    B[k] = new Builder(root, physics, `nh-${k}`);
    const sh = CHUNK_SHEAR[k];
    if (sh) B[k].setShear(sh[0], sh[1], sh[2]);
  }
  const mats = {
    sidingMain: makeMat('WHITE', { map: Tex.siding('NH_SIDING_MAIN') }),
    trim: makeMat('NH_TRIM'),
    foundation: makeMat('WHITE', { map: Tex.brick('NH_FOUNDATION', 'CURB') }),
    roof: makeMat('WHITE', { map: Tex.shingles('NH_ROOF') }),
    roofAlt: makeMat('WHITE', { map: Tex.shingles('NH_ROOF_ALT') }),
    planks: makeMat('WHITE', { map: Tex.woodPlanks('NH_PLANKS', 4) }),
    planksOld: makeMat('WHITE', { map: Tex.woodPlanks('NH_PLANKS_OLD', 5) }),
    metal: makeMat('NH_METAL_SHEET', { spec: 0.3 }),
    scaffold: makeMat('NH_SCAFFOLD'),
    ceiling: makeMat('CEILING'),
    intWall: makeMat('WAINSCOT'),
    chimney: makeMat('WHITE', { map: Tex.brick('NH_ROOF', 'SIDEWALK') }),
    deck: makeMat('WHITE', { map: Tex.woodPlanks('NH_PLANKS_OLD', 5) }),
  };
  const sidingFor = (name) => (name ? makeMat('WHITE', { map: Tex.siding(name) }) : mats.sidingMain);

  // ------------------------------------------------------------ foundation + slabs
  const F0 = B.F0;
  const fy = NH.F0.y;
  // brick foundation ring
  F0.box(16.4, fy, 0.4, mats.foundation, 0, 0, NH.z1 - 0.2, { radius: 0.04, wobble: 0 });
  F0.box(16.4, fy, 0.4, mats.foundation, 0, 0, NH.z0 + 0.2, { radius: 0.04, wobble: 0 });
  F0.box(0.4, fy, 12, mats.foundation, NH.x0 + 0.2, 0, -20, { radius: 0.04, wobble: 0 });
  F0.box(0.4, fy, 12, mats.foundation, NH.x1 - 0.2, 0, -20, { radius: 0.04, wobble: 0 });
  F0.floorWithHoles(NH.x0, NH.x1, NH.z0, NH.z1, fy, 0.15, mats.ceiling, HOLES.F0, { cast: false });
  // F1 slab (F0 ceiling): covers the base plus the east overhang of the right block
  const s1 = FLOOR_Y.F1;
  B.F1.floorWithHoles(NH.x0, 8.6, NH.z0, NH.z1, s1, NH.slab, mats.ceiling, HOLES.F1);
  B.F1.floorWithHoles(2, 8.6, NH.z1, -13.2, s1, NH.slab, mats.ceiling, []);
  // F2 slab: roof deck over F1, floor of the mint wing
  const s2 = FLOOR_Y.F2;
  B.EXT.floorWithHoles(-7, 8.6, NH.z0, -13.2, s2, NH.slab, mats.deck, HOLES.F2.concat([[-7, 2, -26, -18]]));
  B.F2.floorWithHoles(-7, 2, NH.z0, -18, s2, NH.slab, mats.ceiling, HOLES.F2);
  // mint wing ceiling = tower floor
  B.F2.floorWithHoles(-7, 2, NH.z0, -18, FLOOR_Y.F2 + NH.F2.h + 0.2, 0.2, mats.ceiling, HOLES.TW);
  // tomato room floor (on scaffolding)
  const T = NH.TOMATO;
  B.TR.floor(T.x0, T.x1, T.z0, T.z1, T.y, 0.2, mats.planksOld);
  B.TR.box(T.x1 - T.x0, 0.15, T.z1 - T.z0, mats.planks, (T.x0 + T.x1) / 2, T.y + T.h, (T.z0 + T.z1) / 2, { radius: 0.03 });

  // ------------------------------------------------------------ walls
  const openings = []; // every door/window opening with world placement
  for (const w of WALLS) {
    const b = w.floor === 'F0' ? B.F0 : w.floor === 'F1' ? B.F1 : B[w.floor];
    const y = FLOOR_Y[w.floor];
    const h = FLOOR_H[w.floor];
    const t = w.kind === 'ext' ? NH.extT : NH.intT;
    let mat = w.kind === 'ext' ? sidingFor(w.siding) : mats.intWall;
    if (w.floor === 'TR') mat = sidingFor('NH_SIDING_ADDON');
    const res = b.wall({
      axis: w.axis, from: w.from, to: w.to, at: w.at, y, h, t, mat,
      openings: w.openings, lean: w.kind === 'ext' ? w.lean : 0, wobble: w.kind === 'ext' ? 0.004 : 0.002,
    });
    res.forEach((r) => openings.push({ ...r, wall: w, floor: w.floor, builder: b }));
    // corner trim boards on exterior walls
    if (w.kind === 'ext' && w.floor !== 'TW') {
      for (const end of [w.from, w.to]) {
        const cx = w.axis === 'x' ? end : w.at;
        const cz = w.axis === 'x' ? w.at : end;
        b.box(0.42, h + 0.05, 0.42, mats.trim, cx, y - 0.02, cz, { radius: 0.06, collide: false, lean: w.lean ? [w.lean, w.axis === 'x' ? 'z' : 'x', 0] : undefined });
      }
    }
  }
  // trim band / skirt boards between floors
  B.F0.box(16.6, 0.3, 12.6, mats.trim, 0, FLOOR_Y.F1 - 0.32, -20, { radius: 0.08, collide: false });

  // tomato room cladding: raw planks and a corrugated metal patch nailed over it
  B.TR.box(0.06, 1.4, 2.0, mats.planks, T.x1 + 0.17, T.y + 0.6, -20.4, { collide: false, radius: 0.02 });
  B.TR.box(0.05, 1.2, 1.4, mats.metal, T.x1 + 0.2, T.y + 1.2, -22.1, { collide: false, radius: 0.02 });
  B.TR.box(2.2, 0.9, 0.05, mats.planks, 7.3, T.y + 1.5, T.z0 - 0.18, { collide: false, radius: 0.02 });

  // ------------------------------------------------------------ windows + exterior door frames
  const winRecords = [];
  for (const o of openings) {
    const sp = o.spec;
    if (sp.door) continue;
    const ext = o.wall.kind === 'ext';
    if (!ext) continue;
    if (sp.open) continue; // plain opening (tomato room plank entrance)
    if (sp.round) {
      const port = buildPorthole(o, mats.trim);
      root.add(port.group);
      winRecords.push({ id: sp.id, group: port.group, glass: port.glass, w: 0.8, h: 0.8, floor: o.floor });
      continue;
    }
    const win = o.builder.window({
      x: o.x, y: o.y, z: o.z, w: o.w - 0.12, h: o.h - 0.12, axis: o.axis, t: o.t, facing: o.wall.out,
      frameMat: mats.trim, shutters: !!sp.shutters, crookedShutter: sp.crooked, flowerBox: sp.box ? makeMat('NH_PLANKS') : null,
      deadFlowers: sp.dead, curtain: sp.curtain ? 'NH_SIDING_ADDON' : null, lean: o.lean,
    });
    winRecords.push({ id: sp.id, group: win.group, glass: win.glass, w: o.w - 0.12, h: o.h - 0.12, floor: o.floor, tree: sp.tree, plank: sp.plank, bulb: sp.bulb });
  }
  for (const r of winRecords) windows.add(r);

  // ------------------------------------------------------------ doors (exterior + all interior)
  const doorRecords = [];
  for (const o of openings) {
    const sp = o.spec;
    if (!sp.door) continue;
    const ext = o.wall.kind === 'ext';
    const b = o.builder;
    // chunky frame both sides, slightly parallelogram (skewTop)
    const skew = R.range(0.02, 0.05) * R.sign();
    const ft = o.t + 0.12;
    const fw = 0.14;
    const hgt = sp.top;
    const along = o.axis === 'x' ? 'x' : 'z';
    const put = (dx, w, h, y) => {
      const px = o.x + (along === 'x' ? dx : 0), pz = o.z + (along === 'z' ? dx : 0);
      b.box(along === 'x' ? w : ft, h, along === 'z' ? w : ft, mats.trim, px, y, pz, { collide: false, radius: 0.03, skewTop: along === 'x' ? [skew, 0] : [0, skew], noShear: false });
    };
    const by = o.bottom;
    put(-o.w / 2 - fw / 2, fw, hgt + fw, by);
    put(o.w / 2 + fw / 2, fw, hgt + fw, by);
    put(0, o.w + fw * 2, fw, by + hgt);
    if (sp.fake) {
      // opens onto a brick wall
      const back = o.wall.at < -2 ? -0.16 : 0.16; // brick sits just behind the door leaf
      b.box(along === 'x' ? o.w : 0.1, hgt, along === 'z' ? o.w : 0.1, mats.chimney, o.x + (along === 'z' ? back : 0), by, o.z + (along === 'x' ? back : 0), { radius: 0.02 });
    }
    if (sp.noDoor) continue;
    const hinge = new Vector3(
      o.axis === 'x' ? o.x - o.w / 2 : o.x,
      by,
      o.axis === 'z' ? o.z - o.w / 2 : o.z,
    );
    const rotY = o.axis === 'x' ? 0 : -Math.PI / 2;
    const color = sp.front ? 'NH_DOOR_FRONT' : sp.basement ? 'GRASS_DARK' : sp.screen ? 'WHITE' : ext ? 'NH_SHUTTERS' : 'WOOD_MID';
    const rec = {
      id: sp.id, hinge, rotY, w: o.w, h: hgt, color, lock: sp.lock ?? null, boarded: !!sp.boarded,
      screen: !!sp.screen, saloon: !!sp.saloon, front: !!sp.front, fake: !!sp.fake, basement: !!sp.basement,
      floor: o.floor, axis: o.axis, center: new Vector3(o.x, by, o.z), wallId: o.wall.id,
    };
    if (sp.basement) rec.chains = 3;
    doorRecords.push(rec);
    doors.add(rec);
  }

  // ------------------------------------------------------------ porch
  const P = NH.porch;
  B.EXT.box(16.6, P.y, P.z1 - P.z0, makeMat('WHITE', { map: Tex.woodPlanks('WOOD_LIGHT', 6) }), 0, 0, (P.z0 + P.z1) / 2, { radius: 0.05, wobble: 0 });
  B.EXT.box(5, 0.4, 0.62, makeMat('SIDEWALK'), 0, 0, P.z1 + 0.31, { radius: 0.04 });
  B.EXT.box(5, 0.2, 0.62, makeMat('SIDEWALK'), 0, 0, P.z1 + 0.93, { radius: 0.04 });
  const colXs = [-7.6, -4.6, -1.7, 1.7, 4.6, 7.6];
  for (const cx of colXs) {
    const ch = P.roofFront - P.y + 0.1;
    const g = chamferCylinder(0.2, 0.15, ch, 16, 0.04, { bottom: true, heightSegs: 6 });
    lean(g, R.range(1, 3) * R.sign(), R.next() < 0.5 ? 'x' : 'z');
    smoothNormals(g);
    const col = new Mesh(g, mats.trim);
    col.position.set(cx, P.y, P.z1 - 0.3);
    col.castShadow = col.receiveShadow = true;
    root.add(col);
    physics.addStaticBox(new Vector3(cx, P.y + ch / 2, P.z1 - 0.3), new Vector3(0.18, ch / 2, 0.18));
    B.EXT.box(0.46, 0.18, 0.46, mats.trim, cx, P.y + ch - 0.42, P.z1 - 0.3, { collide: false, radius: 0.05 });
  }
  // porch railing (skips the steps)
  for (const [x0, x1] of [[-8, -2.4], [2.4, 8]]) {
    B.EXT.box(x1 - x0, 0.1, 0.1, mats.trim, (x0 + x1) / 2, P.y + 0.85, P.z1 - 0.3, { radius: 0.03, sag: [0.04, 'x'] });
    for (let x = x0 + 0.3; x < x1 - 0.1; x += 0.32) B.EXT.box(0.07, 0.85, 0.07, mats.trim, x, P.y, P.z1 - 0.3, { radius: 0.02, collide: false });
    physics.addStaticBox(new Vector3((x0 + x1) / 2, P.y + 0.45, P.z1 - 0.3), new Vector3((x1 - x0) / 2, 0.45, 0.06));
  }
  // shallow shed roof: walkable all the way to the balcony
  const roofRun = P.z1 - P.z0 + 0.6;
  const drop = P.roofBack - P.roofFront;
  const pitch = Math.atan2(drop, roofRun);
  B.EXT.box(16.9, 0.22, roofRun / Math.cos(pitch), mats.roof, 0, (P.roofBack + P.roofFront) / 2 - 0.11, (P.z0 + P.z1 + 0.6) / 2, { rotX: pitch, radius: 0.05, worldUV: false });
  B.EXT.box(16.9, 0.3, 0.12, mats.trim, 0, P.roofFront - 0.35, P.z1 + 0.32, { collide: false, radius: 0.03, sag: [0.06, 'x'] });

  // balcony on the porch roof, chunky white railing sagging in the middle
  const bal = { x0: 3.6, x1: 7.8, z0: -13.2, z1: -11.8, y: FLOOR_Y.F1 };
  B.EXT.box(bal.x1 - bal.x0, 0.22, bal.z1 - bal.z0, mats.deck, (bal.x0 + bal.x1) / 2, bal.y - 0.22, (bal.z0 + bal.z1) / 2, { radius: 0.04 });
  B.EXT.box(bal.x1 - bal.x0, 0.12, 0.12, mats.trim, (bal.x0 + bal.x1) / 2, bal.y + 0.95, bal.z1, { radius: 0.04, sag: [0.12, 'x'] });
  for (const x of [bal.x0, bal.x1]) B.EXT.box(0.12, 0.12, bal.z1 - bal.z0, mats.trim, x, bal.y + 0.95, (bal.z0 + bal.z1) / 2, { radius: 0.04 });
  for (let x = bal.x0; x <= bal.x1 + 0.01; x += 0.35) {
    const sagY = 0.12 * Math.sin(Math.PI * (x - bal.x0) / (bal.x1 - bal.x0));
    B.EXT.box(0.08, 0.95 - sagY, 0.08, mats.trim, x, bal.y, bal.z1, { radius: 0.02, collide: false });
  }
  physics.addStaticBox(new Vector3((bal.x0 + bal.x1) / 2, bal.y + 0.5, bal.z1), new Vector3((bal.x1 - bal.x0) / 2, 0.5, 0.08));
  physics.addStaticBox(new Vector3(bal.x1, bal.y + 0.5, (bal.z0 + bal.z1) / 2), new Vector3(0.08, 0.5, 0.7));
  // binoculars on the railing, aimed at the player's bedroom window
  const bino = new Group();
  for (const s of [-1, 1]) {
    const tube = new Mesh(chamferCylinder(0.045, 0.055, 0.2, 12, 0.015), makeMat('BLACK_SOFT', { spec: 0.4 }));
    tube.rotation.x = Math.PI / 2;
    tube.position.x = s * 0.06;
    bino.add(tube);
  }
  bino.position.set(5.2, bal.y + 1.1, bal.z1);
  bino.lookAt(2.8, 2, 14);
  root.add(bino);

  // diagonal braces under the east overhang of the right block
  for (const z of [-15.5, -24]) {
    const g = roundedBox(0.16, 1.5, 0.16, 0.04, 2);
    const brace = new Mesh(g, mats.planksOld);
    brace.position.set(8.3, FLOOR_Y.F1 - 0.9, z);
    brace.rotation.z = -32 * DEG;
    brace.castShadow = true;
    root.add(brace);
  }

  // ------------------------------------------------------------ roofs
  // little shed roof over the 1 m strip west of the second floor
  B.EXT.box(1.6, 0.2, 12.6, mats.roof, -7.7, FLOOR_Y.F1 - 0.05, -20, { rotZ: 18 * DEG, radius: 0.04, worldUV: false });
  // shingle skirts around the F1 roof deck
  const skirt = (x, z, len, axis, out) => {
    const p = 28 * DEG;
    const opts = axis === 'x' ? { rotX: out * p } : { rotZ: -out * p };
    B.EXT.box(axis === 'x' ? len : 1.3, 0.2, axis === 'x' ? 1.3 : len, mats.roof, x, FLOOR_Y.F2 - 0.25, z, { ...opts, radius: 0.05, worldUV: false, sag: [0.05, axis] });
    B.EXT.box(axis === 'x' ? len : 0.12, 0.32, axis === 'x' ? 0.12 : len, mats.trim,
      x + (axis === 'z' ? out * 0.6 : 0), FLOOR_Y.F2 - 0.75, z + (axis === 'x' ? out * 0.6 : 0), { collide: false, radius: 0.03 });
  };
  skirt(-2.5, -13.85, 9.8, 'x', 1);
  skirt(5.3, -13.05, 7.0, 'x', 1);
  skirt(9.05, -19.6, 13.4, 'z', 1);
  skirt(5.3, -26.15, 7.0, 'x', -1);
  skirt(-7.5, -16, 4.2, 'z', -1);
  // mint wing: slate-blue gable roof (leans with the wing)
  const mintTop = FLOOR_Y.F2 + NH.F2.h + 0.2;
  B.F2.gableRoof({
    x: -2.5, z: -22, w: 9, d: 8, y: mintTop, pitch: 25, overhang: 0.6, t: 0.28,
    mat: mats.roofAlt, gableMat: sidingFor('NH_SIDING_ALT'), fasciaMat: mats.trim, axis: 'x', sag: 0.12,
  });
  // tomato room: shed roof tipping out over the yard
  B.TR.box(4.8, 0.2, 4.8, mats.roof, (T.x0 + T.x1) / 2, T.y + T.h + 0.15, (T.z0 + T.z1) / 2, { rotZ: -12 * DEG, radius: 0.05, worldUV: false });

  // ------------------------------------------------------------ attic tower
  const TW = NH.TOWER;
  const twTop = TW.y + TW.h;
  const twOff = B.TW.shearAt(twTop);
  const coneH = 1.9 * Math.tan(66 * DEG);
  const cone = new Mesh(new ConeGeometry(2.55, coneH, 4, 3), mats.roof);
  cone.rotation.y = Math.PI / 4;
  cone.position.set((TW.x0 + TW.x1) / 2 + twOff.x, twTop + coneH / 2 - 0.1, (TW.z0 + TW.z1) / 2);
  cone.castShadow = cone.receiveShadow = true;
  root.add(cone);
  // eave trim
  B.TW.box(3.6, 0.25, 3.6, mats.trim, (TW.x0 + TW.x1) / 2, twTop - 0.15, (TW.z0 + TW.z1) / 2, { radius: 0.06, collide: false });
  // crooked weathervane rooster at the tip
  const vane = buildWeathervane();
  vane.position.set(cone.position.x + 0.05, twTop + coneH - 0.15, cone.position.z);
  vane.rotation.z = 7 * DEG;
  root.add(vane);
  let vaneT = 0, vaneTarget = 0;
  updaters.push((dt, t) => {
    vaneT -= dt;
    if (vaneT <= 0) {
      vaneT = R.range(3, 9);
      vaneTarget += R.next() < 0.3 ? R.range(2, 3.5) * R.sign() : R.range(0.2, 0.6);
    }
    const spin = vane.userData.spin;
    spin.rotation.y += (vaneTarget - spin.rotation.y) * Math.min(1, dt * (Math.abs(vaneTarget - spin.rotation.y) > 1.5 ? 9 : 0.8));
  });
  // single bare bulb glowing in the attic window
  const bulb = new Mesh(new SphereGeometry(0.09, 12, 8), makeMat('LAMPSHADE', { emissive: 'LAMPSHADE_GLOW', emissiveIntensity: 1.6 }));
  bulb.position.set(-3.5 + B.TW.shearAt(TW.y + 2.3).x, TW.y + 2.3, -20.6);
  root.add(bulb);

  // ------------------------------------------------------------ chimneys
  // fat brick chimney, west side, twisted and tapering, all the way past the 2nd floor
  {
    const ch = roundedBox(1.4, 13.4, 1.2, 0.1, 3, { bottom: true, midStep: 0.5, skipNormals: true });
    taper(ch, 0.7, 1);
    twist(ch, 12);
    lean(ch, -1.2, 'x');
    wobble(ch, 0.006, 1.5, seedFrom('chimney'));
    smoothNormals(ch);
    worldUV(ch);
    const m = new Mesh(ch, mats.chimney);
    m.position.set(-8.75, 0, -17);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    physics.addStaticBox(new Vector3(-8.75, 6.7, -17), new Vector3(0.65, 6.7, 0.55));
    const cap = new Mesh(roundedBox(1.25, 0.25, 1.1, 0.06, 2), makeMat('METAL_DARK'));
    cap.position.set(-8.75 - Math.tan(1.2 * DEG) * 13.4, 13.5, -17);
    cap.rotation.y = 12 * DEG;
    root.add(cap);
  }
  // skinny crooked stovepipe on the mint wing roof, with a little conical hat and cartoon smoke
  {
    const sx = -5.8 + B.F2.shearAt(13).x, sz = -24.4;
    const pipeG = chamferCylinder(0.13, 0.15, 2.6, 12, 0.03, { bottom: true, heightSegs: 8 });
    bend(pipeG, 16, 'x');
    smoothNormals(pipeG);
    const pipe = new Mesh(pipeG, makeMat('METAL', { spec: 0.4 }));
    pipe.position.set(sx, 12.6, sz);
    pipe.castShadow = true;
    root.add(pipe);
    const tipX = sx + Math.sin(16 * DEG) * 1.3;
    const hat = new Mesh(new ConeGeometry(0.3, 0.3, 14), makeMat('METAL_DARK'));
    hat.position.set(tipX, 15.4, sz);
    hat.rotation.z = -10 * DEG;
    root.add(hat);
    const smoke = buildSmoke(new Vector3(tipX, 15.5, sz));
    root.add(smoke.group);
    updaters.push(smoke.update);
  }

  // ------------------------------------------------------------ tomato room scaffolding
  {
    const sc = mats.scaffold;
    const xs = [T.x0 + 0.2, T.x1 - 0.2], zs = [T.z0 + 0.2, T.z1 - 0.2];
    for (const x of xs)
      for (const z of zs) {
        const bottom = x > 8.6 ? 0 : FLOOR_Y.F2;
        const h = T.y - bottom;
        const pole = new Mesh(chamferCylinder(0.07, 0.07, h, 8, 0.02, { bottom: true }), sc);
        pole.position.set(x, bottom, z);
        pole.castShadow = true;
        root.add(pole);
        if (bottom === 0) physics.addStaticBox(new Vector3(x, h / 2, z), new Vector3(0.08, h / 2, 0.08));
      }
    // long diagonal planks bracing it back against the house
    for (const z of [T.z0 + 0.3, T.z1 - 0.3]) {
      const p = new Mesh(roundedBox(0.12, 4.2, 0.08, 0.02, 2), mats.planksOld);
      p.position.set(T.x1 - 0.4, T.y - 1.9, z);
      p.rotation.z = 38 * DEG;
      p.castShadow = true;
      root.add(p);
    }
    for (let y = 1.5; y < T.y; y += 2.2) {
      const bar = new Mesh(chamferCylinder(0.05, 0.05, T.z1 - T.z0, 8, 0.015), sc);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(T.x1 - 0.2, y, (T.z0 + T.z1) / 2);
      root.add(bar);
    }
  }
  // corridor of planks from the purple room to the bolted-on room (behind the green door)
  {
    const y = FLOOR_Y.F2;
    const shx = B.F2.shearAt(y).x;
    const len = T.x0 - 2;
    B.EXT.box(len + 0.3, 0.15, 1.3, mats.planksOld, 2 + len / 2 + shx, y - 0.15 + 0.2, -20, { radius: 0.03 });
    B.EXT.box(len + 0.3, 0.12, 1.5, mats.planks, 2 + len / 2, y + 2.6, -20, { radius: 0.03, collide: false });
    for (const s of [-1, 1]) {
      B.EXT.box(len, 2.4, 0.08, mats.planks, 2 + len / 2, y + 0.2, -20 + s * 0.7, { radius: 0.02 });
    }
    // the open plank: from the purple room's window, across thin air, into the bolted-on room
    const plank = new Mesh(roundedBox(T.x0 - 2 + 0.6, 0.08, 0.36, 0.02, 2), mats.planks);
    plank.position.set(2 + (T.x0 - 2) / 2, y + 0.55, -22.6);
    plank.rotation.z = -Math.atan2(T.y + 0.25 - (y + 0.5), T.x0 - 2) * -1;
    plank.castShadow = true;
    root.add(plank);
    physics.addStaticFromMesh(plank);
  }

  // ------------------------------------------------------------ roof dressing
  // satellite dish on the roof deck, aimed at the player's house
  {
    const dish = new Group();
    const bowl = new Mesh(new SphereGeometry(0.6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3.2), makeMat('FRIDGE', { spec: 0.3, side: 2 }));
    bowl.rotation.x = Math.PI / 2;
    dish.add(bowl);
    const arm = new Mesh(chamferCylinder(0.03, 0.03, 0.7, 6, 0.01), makeMat('METAL'));
    arm.rotation.x = Math.PI / 2;
    arm.position.z = 0.35;
    dish.add(arm);
    const post = new Mesh(chamferCylinder(0.06, 0.08, 0.9, 8, 0.02, { bottom: true }), makeMat('METAL_DARK'));
    post.position.set(6.5, FLOOR_Y.F2, -16);
    root.add(post);
    dish.position.set(6.5, FLOOR_Y.F2 + 1.1, -16);
    dish.lookAt(0, 3, 18);
    root.add(dish);
  }

  // floodlight above the back door (switched on by the brain later)
  const flood = new Group();
  const fl = new Mesh(roundedBox(0.35, 0.22, 0.25, 0.05, 2), makeMat('METAL_DARK'));
  const lens = new Mesh(roundedBox(0.28, 0.16, 0.03, 0.03, 2), makeMat('LAMPSHADE', { unique: true }));
  lens.position.z = 0.13;
  flood.add(fl, lens);
  flood.position.set(-2, FLOOR_Y.F0 + 3.2, NH.z0 - 0.35);
  flood.rotation.set(0.5, Math.PI, 0);
  root.add(flood);

  // west side: slanted cellar doors with a heavy chain and a big orange padlock
  {
    const cg = new Group();
    for (const s of [-1, 1]) {
      const leaf = new Mesh(roundedBox(1.0, 0.08, 1.6, 0.03, 2), makeMat('GRASS_DARK'));
      leaf.position.set(-0.5 * -s * -1, 0, 0);
      leaf.position.x = s * 0.52;
      leaf.rotation.z = -s * 0 + 0;
      cg.add(leaf);
    }
    const frame = new Mesh(roundedBox(2.3, 0.5, 1.9, 0.06, 2, { bottom: true }), mats.foundation);
    frame.position.y = -0.48;
    cg.add(frame);
    const chain = new Mesh(new TubeGeometry(new CatmullRomCurve3([
      new Vector3(-0.6, 0.06, 0), new Vector3(-0.2, 0.12, 0.1), new Vector3(0.2, 0.12, -0.1), new Vector3(0.6, 0.06, 0)]), 20, 0.03, 6), makeMat('METAL_DARK'));
    cg.add(chain);
    const lock = new Mesh(roundedBox(0.22, 0.26, 0.1, 0.05, 2), makeMat('KEY_BASEMENT', { emissive: 'KEY_BASEMENT', emissiveIntensity: 0.25, spec: 0.5 }));
    lock.position.set(0, 0.12, 0.25);
    cg.add(lock);
    cg.position.set(-9.6, 0.55, -22.5);
    cg.rotation.z = 22 * DEG;
    cg.rotation.y = Math.PI / 2;
    cg.traverse((m) => { if (m.isMesh) m.castShadow = m.receiveShadow = true; });
    root.add(cg);
    physics.addStaticBox(new Vector3(-9.6, 0.4, -22.5), new Vector3(1.0, 0.4, 1.1));
  }

  for (const b of Object.values(B)) b.finalize();

  // zones for every room (indoor lighting, culling, the brain's room tracking)
  for (const r of ROOMS) {
    const y0 = FLOOR_Y[r.floor] - 0.2;
    zones.add(r.id, new Vector3(r.x0, y0, r.z0), new Vector3(r.x1, y0 + FLOOR_H[r.floor] + 0.2, r.z1), { indoor: true, room: r, house: 'neighbor' });
  }

  return {
    root, updaters, openings, doorRecords, winRecords, floodlight: { group: flood, lens },
    bulb, balcony: bal,
  };
}

function buildPorthole(o, trimMat) {
  const g = new Group();
  const ring = new Mesh(new TorusGeometry(0.46, 0.11, 12, 28), trimMat);
  ring.castShadow = true;
  const glass = new Mesh(new CylinderGeometry(0.4, 0.4, 0.03, 28), makeMat('WHITE', { map: Tex.glassGlare(), transparent: true, depthWrite: false, spec: 0.6 }));
  glass.rotation.x = Math.PI / 2;
  glass.renderOrder = 2;
  for (let i = 0; i < 6; i++) {
    const bolt = new Mesh(new SphereGeometry(0.035, 8, 6), makeMat('BRASS', { spec: 0.6 }));
    const a = (i / 6) * Math.PI * 2;
    bolt.position.set(Math.cos(a) * 0.46, Math.sin(a) * 0.46, 0.1);
    g.add(bolt);
  }
  g.add(ring, glass);
  g.position.set(o.x, o.y, o.z);
  g.rotation.x = (o.lean || 0) * DEG;
  return { group: g, glass };
}

function buildWeathervane() {
  const g = new Group();
  const rod = new Mesh(chamferCylinder(0.025, 0.025, 1.1, 6, 0.008, { bottom: true }), makeMat('METAL_DARK'));
  g.add(rod);
  const spin = new Group();
  spin.position.y = 0.95;
  const m = makeMat('BLACK_SOFT', { spec: 0.3 });
  const body = new Mesh(new SphereGeometry(0.16, 14, 10), m);
  body.scale.set(1.5, 1, 0.3);
  const head = new Mesh(new SphereGeometry(0.08, 10, 8), m);
  head.position.set(0.22, 0.16, 0);
  head.scale.z = 0.5;
  const comb = new Mesh(roundedBox(0.1, 0.07, 0.02, 0.02, 1), makeMat('RED_TOY'));
  comb.position.set(0.22, 0.25, 0);
  const tail = new Mesh(new ConeGeometry(0.14, 0.32, 4), m);
  tail.position.set(-0.26, 0.12, 0);
  tail.rotation.z = 0.9;
  tail.scale.z = 0.3;
  const arrow = new Mesh(roundedBox(0.9, 0.04, 0.04, 0.015, 1), m);
  arrow.position.y = -0.2;
  spin.add(body, head, comb, tail, arrow);
  for (const [x, z] of [[0.35, 0], [-0.35, 0], [0, 0.35], [0, -0.35]]) {
    const arm = new Mesh(roundedBox(Math.abs(x) * 2 || 0.03, 0.03, Math.abs(z) * 2 || 0.03, 0.01, 1), m);
    arm.position.y = 0.55;
    g.add(arm);
  }
  g.add(spin);
  g.userData.spin = spin;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function buildSmoke(origin) {
  const g = new Group();
  const mat = makeMat('CLOUD_TOP', { transparent: true, opacity: 0.85, rim: 0.2, unique: true });
  const puffs = [];
  for (let i = 0; i < 8; i++) {
    const p = new Mesh(new SphereGeometry(0.2, 12, 8), mat);
    p.userData.t = i / 8;
    g.add(p);
    puffs.push(p);
  }
  return {
    group: g,
    update: (dt) => {
      for (const p of puffs) {
        p.userData.t = (p.userData.t + dt * 0.18) % 1;
        const t = p.userData.t;
        p.position.set(origin.x + Math.sin(t * 5 + p.id) * 0.25 + t * 1.6, origin.y + t * 3.2, origin.z + t * 0.6);
        const s = 0.6 + t * 2.4;
        p.scale.setScalar(s * (t < 0.1 ? t * 10 : t > 0.8 ? (1 - t) * 5 : 1));
      }
    },
  };
}

export { Euler, Quaternion, MathUtils, Palette, CONFIG, CylinderGeometry };
