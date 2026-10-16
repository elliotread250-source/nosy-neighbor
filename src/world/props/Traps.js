// Grimsby's counter-measures: chunky bear traps, boxy security cameras with
// a pale red view cone and a blinking LED, sticky green glue puddles, and
// the things he's seen carrying home (a bundle of planks, a camera box).
import { Group, Mesh, ConeGeometry, TorusGeometry, SphereGeometry, CircleGeometry, MeshBasicMaterial, FrontSide } from 'three';
import { makeMat } from '../../art/Materials.js';
import { roundedBox, chamferCylinder } from '../../art/Geo.js';
import { bulge, rng } from '../../art/Warp.js';

function mesh(geo, mat, cast = true) {
  const m = new Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

// Bear trap: round plate, a yellow trigger pad, two big toothy jaws lying
// open. userData.jaws = [left, right] pivots; rotate them up to snap shut.
export function bearTrap() {
  const g = new Group();
  const metal = makeMat('METAL', { spec: 0.7, rim: 0.5 });
  const plate = mesh(chamferCylinder(0.3, 0.32, 0.04, 22, 0.012, { bottom: true }), makeMat('METAL_DARK', { spec: 0.5 }));
  const pad = mesh(chamferCylinder(0.11, 0.11, 0.025, 16, 0.008), makeMat('YELLOW_TOY', { spec: 0.4 }));
  pad.position.y = 0.045;
  g.add(plate, pad);
  const jaws = [];
  for (const s of [-1, 1]) {
    const pivot = new Group();
    pivot.position.set(0, 0.05, 0);
    const arc = mesh(new TorusGeometry(0.27, 0.025, 6, 18, Math.PI), metal);
    arc.rotation.x = -Math.PI / 2;
    arc.rotation.z = s > 0 ? 0 : Math.PI;
    pivot.add(arc);
    for (let i = 1; i < 8; i++) {
      const a = (i / 8) * Math.PI;
      const tooth = mesh(new ConeGeometry(0.022, 0.07, 5), metal, false);
      const x = Math.cos(a) * 0.27, z = -Math.sin(a) * 0.27 * s;
      tooth.position.set(x, 0.0, z);
      // teeth point inward when the jaw is open flat
      // point up, so shut jaws interlock like a cartoon mouth
      tooth.position.y = 0.035;
      pivot.add(tooth);
    }
    // open = lying flat on the plate; shut = rotation.x = side * 1.5
    pivot.rotation.x = 0;
    pivot.userData.side = s;
    jaws.push(pivot);
    g.add(pivot);
  }
  // spring coils at the hinges
  for (const x of [-0.3, 0.3]) {
    const coil = mesh(new TorusGeometry(0.035, 0.012, 6, 10), metal);
    coil.position.set(x, 0.05, 0);
    coil.rotation.y = Math.PI / 2;
    g.add(coil);
  }
  g.userData.jaws = jaws;
  return g;
}

// Security camera on a wall arm. userData.head is the pivot to aim,
// userData.led blinks, userData.cone is the pale red field-of-view cone.
export function securityCamera(range = 6.5, fovDeg = 52) {
  const g = new Group();
  const grey = makeMat('METAL', { spec: 0.4 });
  const mount = mesh(roundedBox(0.16, 0.2, 0.05, 0.02, 2), makeMat('METAL_DARK'));
  mount.position.z = 0.025;
  const arm = mesh(chamferCylinder(0.025, 0.025, 0.22, 8, 0.008), grey);
  arm.rotation.x = Math.PI / 2;
  arm.position.set(0, 0, 0.14);
  g.add(mount, arm);
  const head = new Group();
  head.position.set(0, 0, 0.25);
  const bodyG = roundedBox(0.16, 0.14, 0.32, 0.04, 2);
  bulge(bodyG, 0.04);
  const body = mesh(bodyG, makeMat('FRIDGE', { spec: 0.4 }));
  body.position.z = 0.12;
  const hood = mesh(roundedBox(0.2, 0.03, 0.36, 0.012, 1), grey);
  hood.position.set(0, 0.085, 0.14);
  const lens = mesh(chamferCylinder(0.05, 0.05, 0.04, 14, 0.01), makeMat('BLACK_SOFT', { spec: 0.9 }));
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.29;
  const glass = mesh(new SphereGeometry(0.035, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), makeMat('SKY_TOY', { spec: 1, emissive: 'SKY_TOY', emissiveIntensity: 0.2 }), false);
  glass.rotation.x = Math.PI / 2;
  glass.position.z = 0.31;
  const led = mesh(new SphereGeometry(0.016, 8, 6), makeMat('KEY_RED', { emissive: 'KEY_RED', emissiveIntensity: 2.5, unique: true }), false);
  led.position.set(0.05, 0.05, 0.27);
  head.add(body, hood, lens, glass, led);
  // view cone: apex at the lens, opening along +z
  const radius = Math.tan((fovDeg / 2) * Math.PI / 180) * range;
  const coneG = new ConeGeometry(radius, range, 28, 1, true);
  coneG.translate(0, -range / 2, 0);
  coneG.rotateX(-Math.PI / 2);
  const cone = new Mesh(coneG, new MeshBasicMaterial({ color: 0xff8a80, transparent: true, opacity: 0.07, side: FrontSide, depthWrite: false, fog: true }));
  cone.position.z = 0.3;
  cone.renderOrder = 3;
  head.add(cone);
  g.add(head);
  g.userData = { head, led, cone, range, fov: fovDeg };
  return g;
}

// Glue puddle: a lumpy, glossy green blob flat on the floor.
export function gluePuddle(name = 'glue') {
  const g = new Group();
  const r = rng(name);
  const mat = makeMat('KEY_GREEN', { spec: 0.9, emissive: 'KEY_GREEN', emissiveIntensity: 0.12, transparent: true, opacity: 0.88 });
  const base = new CircleGeometry(0.62, 24);
  const p = base.attributes.position;
  for (let i = 1; i < p.count; i++) {
    const a = Math.atan2(p.getY(i), p.getX(i));
    const k = 1 + Math.sin(a * 3 + r.range(0, 6)) * 0.12 + Math.sin(a * 5 + r.range(0, 6)) * 0.07;
    p.setXY(i, p.getX(i) * k, p.getY(i) * k);
  }
  base.rotateX(-Math.PI / 2);
  const puddle = mesh(base, mat, false);
  puddle.position.y = 0.012;
  g.add(puddle);
  for (let i = 0; i < 5; i++) {
    const b = mesh(new SphereGeometry(r.range(0.06, 0.12), 10, 6), mat, false);
    b.scale.y = 0.25;
    const a = r.range(0, 6.28), d = r.range(0, 0.4);
    b.position.set(Math.cos(a) * d, 0.015, Math.sin(a) * d);
    g.add(b);
  }
  g.userData.radius = 0.62;
  return g;
}

// A glue jar (Hard: he lobs these during chases).
export function glueJar() {
  const g = new Group();
  g.add(mesh(chamferCylinder(0.06, 0.06, 0.13, 12, 0.015), makeMat('KEY_GREEN', { transparent: true, opacity: 0.85, spec: 0.8 })));
  const lid = mesh(chamferCylinder(0.065, 0.065, 0.03, 12, 0.008), makeMat('RED_TOY'));
  lid.position.y = 0.075;
  g.add(lid);
  return g;
}

// Carried props for the "he learned something" shot.
export function plankBundle() {
  const g = new Group();
  const mat = makeMat('NH_PLANKS', { spec: 0.1 });
  for (let i = 0; i < 4; i++) {
    const p = mesh(roundedBox(1.4, 0.05, 0.18, 0.015, 1), mat);
    p.position.set((i % 2) * 0.08 - 0.04, i * 0.055, (i - 1.5) * 0.02);
    p.rotation.y = (i - 1.5) * 0.05;
    g.add(p);
  }
  return g;
}

export function cameraBox() {
  const g = new Group();
  const box = mesh(roundedBox(0.42, 0.3, 0.32, 0.03, 2), makeMat('CARDBOARD'));
  g.add(box);
  const cam = securityCamera(0.01, 10);
  cam.userData.cone.visible = false;
  cam.scale.setScalar(0.9);
  cam.position.set(0, 0.2, -0.05);
  cam.rotation.x = -Math.PI / 2;
  g.add(cam);
  return g;
}

export function trapCarry() {
  const t = bearTrap();
  for (const j of t.userData.jaws) j.rotation.x = j.userData.side * 1.5;
  t.rotation.x = Math.PI / 2;
  return t;
}
