// The neighbor's yard: tall plank fences with gates, the big climbable tree
// whose branch reaches the second-floor side window, and the back yard full
// of junk: a shed, a red sedan parked ON a crushed fence, a scummy kiddie
// pool, a clothesline with a spare sweater vest, a grill, crates, a ladder.
import {
  Group, Mesh, Vector3, Quaternion, Euler, TorusGeometry, SphereGeometry, CylinderGeometry, CatmullRomCurve3,
  TubeGeometry, DoubleSide,
} from 'three';
import { Builder } from './Architecture.js';
import { makeMat } from '../art/Materials.js';
import * as Tex from '../art/CanvasTextures.js';
import { roundedBox, chamferCylinder, smoothNormals } from '../art/Geo.js';
import { lean, bulge, sag, rng } from '../art/Warp.js';
import * as N from './props/Nature.js';
import * as S from './props/Street.js';
import * as F from './props/Furniture.js';
import { picketFences } from './Neighborhood.js';
import { NH } from './NeighborPlan.js';

const DEG = Math.PI / 180;

export function buildNeighborYard(scene, physics, { doors }) {
  const root = new Group();
  root.name = 'neighborYard';
  scene.add(root);
  const b = new Builder(root, physics, 'nh-yard');
  const R = rng('yard');
  const updaters = [];
  const loose = []; // physics props to register: { obj, opts }
  const plankMat = makeMat('WHITE', { map: Tex.woodPlanks('NH_PLANKS', 6) });

  // ---------------------------------------------------- tall plank fences + gates
  const fenceA = makeMat('NH_PLANKS');
  const fenceB = makeMat('NH_PLANKS_OLD');
  const woodFence = (x0, z0, x1, z1, gaps = [], h = 2.2) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ang = Math.atan2(z1 - z0, x1 - x0);
    const dx = (x1 - x0) / len, dz = (z1 - z0) / len;
    let t = 0;
    const w = 0.22;
    while (t < len - 0.05) {
      const mid = t + w / 2;
      if (!gaps.some(([a, c]) => mid > a && mid < c)) {
        const hh = h + R.range(-0.12, 0.12);
        const px = x0 + dx * mid, pz = z0 + dz * mid;
        b.box(w - 0.02, hh, 0.05, R.next() < 0.3 ? fenceB : fenceA, px, 0, pz, { rotY: -ang, rotZ: R.range(-2, 2) * DEG, radius: 0.02, collide: false, worldUV: false });
      }
      t += w;
    }
    // rails + colliders per solid run
    let cur = 0;
    const runs = [];
    for (const [a, c] of [...gaps].sort((p, q) => p[0] - q[0])) { if (a > cur) runs.push([cur, a]); cur = c; }
    if (cur < len) runs.push([cur, len]);
    for (const [a, c] of runs) {
      const m = (a + c) / 2;
      const q = new Quaternion().setFromEuler(new Euler(0, -ang, 0));
      for (const y of [0.45, h - 0.45]) {
        b.box(c - a, 0.1, 0.07, makeMat('NH_PLANKS_OLD'), x0 + dx * m - dz * 0.06, y, z0 + dz * m + dx * 0.06, { rotY: -ang, collide: false, radius: 0.02 });
      }
      physics.addStaticBox(new Vector3(x0 + dx * m, h / 2, z0 + dz * m), new Vector3((c - a) / 2, h / 2, 0.08), q);
    }
  };
  // front of the side yards, with gates
  woodFence(8.2, -14.2, 17, -14.2, [[1.6, 2.8]]);
  woodFence(-8.2, -14.2, -17, -14.2, [[1.6, 2.8]]);
  // back fence just inside the hedge
  woodFence(-17, -33.6, 17, -33.6, [], 2.0);
  const eastGate = doors.add({ id: 'g-east', hinge: new Vector3(9.8, 0.02, -14.2), rotY: 0, w: 1.15, h: 2.0, color: 'NH_PLANKS' });
  const westGate = doors.add({ id: 'g-west', hinge: new Vector3(-9.8, 0.02, -14.2), rotY: Math.PI, w: 1.15, h: 2.0, color: 'NH_PLANKS' });
  // NO TRESPASSING + I MEAN IT
  const sign1 = S.sign('NO\nTRESPASSING', { bg: 'WHITE', fg: 'TOMATO', w: 0.95, h: 0.6, post: 0, tilt: -6, border: 'TOMATO' });
  sign1.position.set(12.5, 1.1, -14.12);
  root.add(sign1);
  const sign2 = S.sign('I MEAN IT', { bg: 'CARDBOARD', fg: 'BLACK_SOFT', w: 0.6, h: 0.22, post: 0, tilt: 9 });
  sign2.position.set(12.6, 0.68, -14.1);
  root.add(sign2);

  // ---------------------------------------------------- the big tree (climbable)
  const big = N.tree('nh-bigtree', { height: 5.6, trunkRadius: 0.62, crown: 2.6, big: true, branch: { dir: [-1, 0.02], length: 3.9, y: 5.05, rise: 4 } });
  big.group.position.set(12.4, 0, -16.1);
  root.add(big.group);
  physics.addStaticBox(new Vector3(12.4, 2.8, -16.1), new Vector3(0.48, 2.8, 0.48));
  // knots and a nailed-on plank step spiral up the trunk
  const steps = [[0.75, 0], [1.45, 70], [2.15, 150], [2.85, 220], [3.55, 290], [4.25, 350], [4.95, 20]];
  const tc = new Vector3(12.4, 0, -16.1);
  steps.forEach(([y, a], i) => {
    const dir = new Vector3(Math.cos(a * DEG), 0, Math.sin(a * DEG));
    const p = tc.clone().addScaledVector(dir, 0.62);
    const isPlank = i === 3 || i === 5;
    const geo = isPlank ? roundedBox(0.55, 0.08, 0.32, 0.02, 2) : (() => { const g = new SphereGeometry(0.26, 12, 8); g.scale(1, 0.5, 1); return g; })();
    const m = new Mesh(geo, isPlank ? plankMat : makeMat('WOOD_DARK'));
    m.position.set(p.x, y, p.z);
    m.rotation.y = -a * DEG;
    m.castShadow = true;
    root.add(m);
    physics.addStaticBox(new Vector3(p.x, y - 0.05, p.z), new Vector3(0.28, 0.07, 0.28));
  });
  // the walkable branch: a fat, gently rising box collider along it
  {
    const len = 3.9;
    const c = new Vector3(12.4 - len / 2, 5.18, -16.08);
    physics.addStaticBox(c, new Vector3(len / 2 + 0.2, 0.12, 0.2), new Quaternion().setFromEuler(new Euler(0, 0, -2 * DEG)));
  }

  // ---------------------------------------------------- crates by the porch (roof route)
  for (const [x, z, y] of [[9.3, -12.0, 0.5], [10.4, -11.6, 0.5], [9.5, -10.6, 0.5], [9.4, -12.0, 1.5]]) {
    const c = F.crate(`porchCrate${x}${z}${y}`, 1);
    c.position.set(x, y, z);
    c.rotation.y = R.range(-10, 10) * DEG;
    c.castShadow = c.receiveShadow = true;
    root.add(c);
    loose.push({ obj: c, opts: { mass: 10, friction: 0.9, data: { item: 'crate', noise: 0.6, climbable: true } } });
  }
  const barrel = new Mesh(chamferCylinder(0.38, 0.38, 1.05, 18, 0.06, { bottom: true }), makeMat('BLUE_TOY', { spec: 0.3 }));
  barrel.position.set(8.6, 0, -11.2);
  barrel.castShadow = true;
  root.add(barrel);
  physics.addStaticBox(new Vector3(8.6, 0.525, -11.2), new Vector3(0.36, 0.525, 0.36));

  // ---------------------------------------------------- front yard details
  const gnome = S.gnome();
  gnome.scale.setScalar(1.25);
  gnome.position.set(-1.9, 0, -9.5); // on the open lawn by the steps, where you'll notice it turning
  gnome.userData.noBake = true;
  root.add(gnome);
  const mat = S.doormat('GO AWAY');
  mat.position.set(0, NH.porch.y + 0.01, -13.45);
  root.add(mat);
  const hose = S.hose();
  hose.position.set(4.8, 0, -9.2);
  root.add(hose);
  for (let i = 0; i < 6; i++) {
    const bush = N.gumdrop(`nh-bush${i}`, 0.55 + (i % 3) * 0.08);
    bush.position.set([-7.2, -5.6, -4.1, 4.1, 5.6, 7.2][i], 0, -10.4);
    root.add(bush);
  }

  // ---------------------------------------------------- back porch (screen door)
  b.box(3.2, NH.F0.y, 1.8, plankMat, -2, 0, NH.z0 - 0.9, { radius: 0.04 });
  b.box(1.4, 0.3, 0.5, makeMat('SIDEWALK'), -2, 0, NH.z0 - 2.05, { radius: 0.03 });

  // ---------------------------------------------------- shed
  {
    const sx = -12.5, sz = -29.5;
    const shedMat = makeMat('WHITE', { map: Tex.siding('SOFA_GREEN') });
    b.box(3.2, 2.5, 2.6, shedMat, sx, 0, sz, { radius: 0.08, lean: [2.5, 'x'] });
    b.gableRoof({ x: sx + 0.1, z: sz, w: 3.2, d: 2.6, y: 2.5, pitch: 30, overhang: 0.3, t: 0.16, mat: makeMat('WHITE', { map: Tex.shingles('NH_ROOF') }), axis: 'x', sag: 0.06 });
    const door = new Mesh(roundedBox(1.0, 1.9, 0.08, 0.03, 2), makeMat('PH_TRIM'));
    door.position.set(sx + 0.1, 0.98, sz + 1.33);
    root.add(door);
    const lock = new Mesh(roundedBox(0.1, 0.12, 0.05, 0.03, 2), makeMat('BRASS', { spec: 0.6 }));
    lock.position.set(sx + 0.45, 1.0, sz + 1.4);
    root.add(lock);
  }

  // ---------------------------------------------------- red sedan parked on a crushed fence
  {
    // the crushed picket section underneath
    picketFences(root, physics, [[[-10, -27.8], [-3, -27.8]]], 'crushedFence', { height: 0.9 });
    const car = buildSedan();
    car.position.set(-6.4, 0.3, -28.6);
    car.rotation.set(-12 * DEG, 8 * DEG, 3 * DEG, 'YXZ');
    root.add(car);
    car.updateMatrixWorld(true);
    physics.addStaticBox(new Vector3(-6.4, 0.8, -28.7), new Vector3(1.0, 0.75, 2.2), new Quaternion().setFromEuler(car.rotation));
  }

  // ---------------------------------------------------- kiddie pool with scummy water + drain valve
  const pool = new Group();
  {
    const rim = new Mesh(new TorusGeometry(1.25, 0.18, 12, 32), makeMat('BUBBLEGUM', { spec: 0.4 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.2;
    const floor = new Mesh(chamferCylinder(1.3, 1.3, 0.06, 32, 0.02, { bottom: true }), makeMat('SKY_TOY'));
    const water = new Mesh(new CylinderGeometry(1.15, 1.15, 0.04, 32), makeMat('KEY_GREEN', { transparent: true, opacity: 0.85, spec: 0.5, unique: true }));
    water.position.y = 0.3;
    // little green scum blobs floating
    for (let i = 0; i < 9; i++) {
      const blob = new Mesh(new SphereGeometry(0.1, 8, 6), makeMat('GRASS_DARK'));
      blob.scale.y = 0.3;
      const a = R.range(0, 6.28), r = R.range(0, 1.0);
      blob.position.set(Math.cos(a) * r, 0.02, Math.sin(a) * r);
      water.add(blob);
    }
    pool.add(rim, floor, water);
    pool.userData.noBake = true;
    pool.position.set(5, 0, -29.5);
    pool.traverse((m) => { if (m.isMesh) m.receiveShadow = true; });
    root.add(pool);
    // a floor you can step down onto and a ring of rim colliders (it's a real pool, not a plinth)
    physics.addStaticBox(new Vector3(5, 0.03, -29.5), new Vector3(1.25, 0.03, 1.25));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      physics.addStaticBox(new Vector3(5 + Math.cos(a) * 1.25, 0.19, -29.5 + Math.sin(a) * 1.25), new Vector3(0.18, 0.19, 0.42), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -a));
    }
    pool.userData.water = water;
    // drain valve on a pipe
    const pipe = new Mesh(chamferCylinder(0.06, 0.06, 1.1, 10, 0.02), makeMat('METAL'));
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(3.25, 0.15, -29.5);
    root.add(pipe);
    const valve = new Group();
    const wheel = new Mesh(new TorusGeometry(0.14, 0.035, 8, 16), makeMat('RED_TOY', { spec: 0.4 }));
    const hub = new Mesh(new SphereGeometry(0.05, 8, 6), makeMat('METAL'));
    valve.add(wheel, hub);
    valve.userData.noBake = true;
    valve.position.set(2.8, 0.45, -29.5);
    valve.rotation.y = Math.PI / 2;
    const stem = new Mesh(chamferCylinder(0.04, 0.04, 0.3, 8, 0.01, { bottom: true }), makeMat('METAL'));
    stem.position.set(2.8, 0.15, -29.5);
    root.add(valve, stem);
    pool.userData.valve = valve;
  }

  // ---------------------------------------------------- clothesline with the spare vest and trousers
  {
    const posts = [[9, -28], [15, -30.5]];
    for (const [x, z] of posts) {
      const p = new Mesh(roundedBox(0.12, 2.2, 0.12, 0.03, 2, { bottom: true }), makeMat('NH_PLANKS_OLD'));
      p.position.set(x, 0, z);
      p.rotation.z = R.range(-4, 4) * DEG;
      p.castShadow = true;
      root.add(p);
      physics.addStaticBox(new Vector3(x, 1.1, z), new Vector3(0.08, 1.1, 0.08));
    }
    const a = new Vector3(9, 2.05, -28), c = new Vector3(15, 2.05, -30.5);
    root.add(S.wire(a, c, 0.25, 0.012));
    const vestTex = Tex.argyle();
    const vest = new Mesh(roundedBox(0.6, 0.7, 0.04, 0.06, 2), makeMat('WHITE', { map: vestTex, side: DoubleSide }));
    const trousers = new Group();
    for (const s of [-1, 1]) {
      const leg = new Mesh(roundedBox(0.24, 0.95, 0.04, 0.05, 2), makeMat('NB_PANTS', { side: DoubleSide }));
      leg.position.x = s * 0.14;
      trousers.add(leg);
    }
    const ang = Math.atan2(c.z - a.z, c.x - a.x);
    const place = (obj, t, dy) => {
      obj.position.copy(a).lerp(c, t);
      obj.position.y -= 0.25 * 4 * t * (1 - t) + dy;
      obj.rotation.y = -ang;
      obj.castShadow = true;
      obj.traverse((m) => { if (m.isMesh) m.castShadow = true; });
      obj.userData.noBake = true;
      root.add(obj);
    };
    place(vest, 0.35, 0.38);
    place(trousers, 0.68, 0.5);
    updaters.push((dt, t) => {
      vest.rotation.x = Math.sin(t * 1.7) * 0.12;
      trousers.rotation.x = Math.sin(t * 1.5 + 1) * 0.1;
    });
  }

  // ---------------------------------------------------- grill
  {
    const grill = new Group();
    const bowl = new Mesh(new SphereGeometry(0.38, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), makeMat('BLACK_SOFT', { spec: 0.4, side: DoubleSide }));
    bowl.position.y = 0.85;
    const lid = new Mesh(new SphereGeometry(0.38, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), makeMat('BLACK_SOFT', { spec: 0.4 }));
    lid.position.set(0, 0.88, -0.05);
    lid.rotation.x = -0.5;
    grill.add(bowl, lid);
    for (let i = 0; i < 3; i++) {
      const leg = new Mesh(chamferCylinder(0.025, 0.025, 0.85, 6, 0.01, { bottom: true }), makeMat('METAL_DARK'));
      const a = (i / 3) * Math.PI * 2;
      leg.position.set(Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22);
      leg.rotation.set(Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15);
      grill.add(leg);
    }
    grill.position.set(2, 0, -28.3);
    grill.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    root.add(grill);
    physics.addStaticBox(new Vector3(2, 0.6, -28.3), new Vector3(0.35, 0.6, 0.35));
  }

  // ---------------------------------------------------- crate pile, the ladder, chimney rubble
  for (const [x, z, y, s] of [[13.5, -25.5, 0.45, 0.9], [14.5, -25.8, 0.45, 0.9], [13.9, -25.6, 1.35, 0.9], [15.4, -24.6, 0.35, 0.7]]) {
    const c = F.crate(`yardCrate${x}`, s);
    c.position.set(x, y, z);
    c.rotation.y = R.range(-20, 20) * DEG;
    c.castShadow = c.receiveShadow = true;
    root.add(c);
    loose.push({ obj: c, opts: { mass: 9, friction: 0.9, data: { item: 'crate', noise: 0.6, climbable: true } } });
  }
  const ladder = buildLadder(3.5);
  ladder.position.set(9.5, 0.1, -32.2);
  ladder.rotation.set(0, 0.2, Math.PI / 2);
  root.add(ladder);
  loose.push({ obj: ladder, opts: { mass: 8, friction: 0.8, half: { x: 0.25, y: 1.75, z: 0.05 }, data: { item: 'ladder', noise: 0.7, carry: true } } });
  for (let i = 0; i < 9; i++) {
    const br = new Mesh(roundedBox(0.3, 0.12, 0.15, 0.02, 2), makeMat('WHITE', { map: Tex.brick('NH_ROOF', 'SIDEWALK') }));
    br.position.set(-10 + R.range(-0.7, 0.7), 0.1 + (i % 3) * 0.13, -27.2 + R.range(-0.5, 0.5));
    br.rotation.set(R.range(-0.3, 0.3), R.range(0, 3), R.range(-0.3, 0.3));
    br.castShadow = true;
    root.add(br);
    loose.push({ obj: br, opts: { mass: 2.2, data: { item: 'brick', noise: 0.8, throwable: true, breaksGlass: true } } });
  }

  b.finalize();
  return { root, updaters, loose, pool, gnome, gates: [eastGate, westGate], bigTree: big };
}

function buildSedan() {
  const g = new Group();
  const red = makeMat('RED_TOY', { spec: 0.6, rim: 0.3 });
  const body = new Mesh(roundedBox(1.9, 0.6, 4.2, 0.22, 3, { midStep: 0.4 }), red);
  body.position.y = 0.45;
  const cabG = roundedBox(1.6, 0.6, 2.2, 0.25, 3, { midStep: 0.4 });
  const cab = new Mesh(cabG, red);
  cab.position.set(0, 1.0, -0.2);
  const glass = makeMat('WHITE', { map: Tex.glassGlare(), transparent: true });
  const wind = new Mesh(roundedBox(1.4, 0.45, 0.05, 0.04, 2), glass);
  wind.position.set(0, 1.02, 0.92);
  wind.rotation.x = -0.4;
  const back = wind.clone();
  back.position.z = -1.32;
  back.rotation.x = 0.4;
  g.add(body, cab, wind, back);
  for (const sx of [-1, 1]) {
    const side = new Mesh(roundedBox(0.04, 0.4, 1.8, 0.03, 1), glass);
    side.position.set(sx * 0.81, 1.02, -0.2);
    g.add(side);
    for (const sz of [-1.35, 1.35]) {
      const tire = new Mesh(chamferCylinder(0.38, 0.38, 0.3, 18, 0.08), makeMat('BLACK_SOFT'));
      tire.rotation.z = Math.PI / 2;
      tire.position.set(sx * 0.9, 0.28, sz);
      const hub = new Mesh(chamferCylinder(0.16, 0.16, 0.32, 12, 0.04), makeMat('METAL', { spec: 0.6 }));
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(tire.position);
      g.add(tire, hub);
    }
  }
  for (const sx of [-0.6, 0.6]) {
    const hl = new Mesh(new SphereGeometry(0.12, 10, 8), makeMat('LAMPSHADE', { spec: 0.6 }));
    hl.position.set(sx, 0.55, 2.1);
    hl.scale.z = 0.5;
    g.add(hl);
  }
  const bumper = new Mesh(roundedBox(1.95, 0.16, 0.18, 0.06, 2), makeMat('METAL', { spec: 0.6 }));
  bumper.position.set(0, 0.3, 2.12);
  g.add(bumper);
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
}

export function buildLadder(len) {
  const g = new Group();
  const wood = makeMat('WOOD_LIGHT');
  for (const s of [-1, 1]) {
    const rail = new Mesh(roundedBox(0.07, len, 0.07, 0.02, 2), wood);
    rail.position.x = s * 0.22;
    g.add(rail);
  }
  for (let y = -len / 2 + 0.25; y < len / 2; y += 0.32) {
    const rung = new Mesh(chamferCylinder(0.03, 0.03, 0.44, 8, 0.01), wood);
    rung.rotation.z = Math.PI / 2;
    rung.position.y = y;
    g.add(rung);
  }
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  return g;
}

export { CatmullRomCurve3, TubeGeometry, bulge, sag, lean, smoothNormals };
