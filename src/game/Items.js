// Key items and tools: chunky, readable from across a room. Keys are 25 cm,
// one solid bright color with a slow 1 Hz glow. Tools are toy-proportioned.
import { Group, Mesh, TorusGeometry, SphereGeometry, ConeGeometry, Shape, ShapeGeometry, DoubleSide } from 'three';
import { Events } from '../core/Events.js';
import { Settings } from '../ui/Settings.js';
import { makeMat } from '../art/Materials.js';
import { roundedBox, chamferCylinder } from '../art/Geo.js';
import { KEY_COLORS } from '../world/Doors.js';

function mesh(geo, mat) {
  const m = new Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Everything the player can own. Keys live on the keyring, the rest take a slot.
export const ITEM_DEFS = {
  key: { label: 'Key', keyring: true },
  crowbar: { label: 'Crowbar', tool: true, icon: ['RED_TOY', 'crowbar'], hold: { pos: [0.02, -0.02, -0.12], rot: [0.2, 0.3, -0.4] } },
  wrench: { label: 'Wrench', tool: true, icon: ['BLUE_TOY', 'wrench'], hold: { pos: [0.02, 0.0, -0.1], rot: [0.3, 0.2, -0.3] } },
  magnet: { label: 'Magnet gun', tool: true, icon: ['RED_TOY', 'magnet'], hold: { pos: [0.0, 0.02, -0.12], rot: [0, 0, 0] } },
  flashlight: { label: 'Flashlight', tool: true, icon: ['YELLOW_TOY', 'flashlight'], hold: { pos: [0.0, 0.02, -0.1], rot: [0, 0, 0] } },
};

export const KEY_NAMES = {
  red: 'red key', blue: 'blue key', green: 'green key', yellow: 'yellow key', purple: 'purple key', basement: 'basement key', attic: 'attic key',
};

// Colorblind-friendly bow shapes: color is never the only cue.
const KEY_SHAPES = { red: 'circle', blue: 'triangle', green: 'square', attic: 'star', basement: 'heart', yellow: 'diamond', purple: 'hexagon' };

// Calls emit(x, y, i) around a unit-sized outline of the key's shape.
export function keyShapePath(color, emit) {
  const kind = KEY_SHAPES[color] ?? 'circle';
  const pts = [];
  const poly = (n, r = 1, rot = Math.PI / 2) => { for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } };
  if (kind === 'circle') poly(20, 0.9);
  else if (kind === 'triangle') poly(3, 1.05);
  else if (kind === 'square') poly(4, 1.0, Math.PI / 4);
  else if (kind === 'diamond') poly(4, 1.0);
  else if (kind === 'hexagon') poly(6, 0.95);
  else if (kind === 'star') for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 0.45 : 1.05; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  else if (kind === 'heart') for (let i = 0; i < 24; i++) { const t = (i / 24) * Math.PI * 2; pts.push([(16 * Math.sin(t) ** 3) / 17, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.15]); }
  pts.forEach((p, i) => emit(p[0], p[1], i));
}

export function buildKey(color) {
  const g = new Group();
  // a unique material per key so its glow can pulse on its own
  const mat = makeMat(KEY_COLORS[color] ?? 'BRASS', { spec: 0.6, rim: 0.6, emissive: KEY_COLORS[color] ?? 'BRASS', emissiveIntensity: 0.25, unique: true });
  const bow = mesh(new TorusGeometry(0.045, 0.018, 10, 20), mat);
  bow.position.x = -0.08;
  const shaft = mesh(chamferCylinder(0.014, 0.014, 0.15, 10, 0.005), mat);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = 0.03;
  const bit1 = mesh(roundedBox(0.025, 0.045, 0.02, 0.006, 1), mat);
  bit1.position.set(0.085, -0.03, 0);
  const bit2 = mesh(roundedBox(0.02, 0.03, 0.02, 0.006, 1), mat);
  bit2.position.set(0.055, -0.025, 0);
  g.add(bow, shaft, bit1, bit2);
  // the shape plate inside the bow ring, shown with the accessibility option
  const sh = new Shape();
  keyShapePath(color, (x, y, i) => (i ? sh.lineTo(x * 0.026, y * 0.026) : sh.moveTo(x * 0.026, y * 0.026)));
  const plate = new Mesh(new ShapeGeometry(sh), makeMat('BLACK_SOFT', { side: DoubleSide }));
  plate.position.set(-0.08, 0, 0);
  plate.visible = !!Settings.values.colorblindKeys;
  g.add(plate);
  Events.on('settings:changed', (e) => { plate.visible = !!e.values.colorblindKeys; });
  g.userData.glowMat = mat;
  g.userData.item = { kind: 'key', color, label: KEY_NAMES[color] ?? 'key' };
  return g;
}

export function buildCrowbar() {
  const g = new Group();
  const red = makeMat('RED_TOY', { spec: 0.45, rim: 0.4 });
  const bar = mesh(chamferCylinder(0.016, 0.016, 0.62, 8, 0.006), red);
  const hook = mesh(new TorusGeometry(0.05, 0.016, 8, 12, Math.PI * 1.1), red);
  hook.position.set(0.05, 0.31, 0);
  const claw = mesh(roundedBox(0.03, 0.07, 0.025, 0.008, 1), makeMat('METAL', { spec: 0.6 }));
  claw.position.set(0.02, -0.33, 0);
  claw.rotation.z = 0.5;
  g.add(bar, hook, claw);
  g.userData.item = { kind: 'crowbar', label: 'Crowbar' };
  return g;
}

export function buildWrench() {
  const g = new Group();
  const blue = makeMat('BLUE_TOY', { spec: 0.5, rim: 0.4 });
  const handle = mesh(roundedBox(0.045, 0.3, 0.022, 0.012, 2), blue);
  const head = mesh(new TorusGeometry(0.045, 0.02, 8, 14, Math.PI * 1.45), makeMat('METAL', { spec: 0.6 }));
  head.position.y = 0.18;
  head.rotation.z = -Math.PI * 0.22;
  g.add(handle, head);
  g.userData.item = { kind: 'wrench', label: 'Wrench' };
  return g;
}

export function buildMagnetGun() {
  const g = new Group();
  const red = makeMat('RED_TOY', { spec: 0.4, rim: 0.4 });
  const grip = mesh(roundedBox(0.04, 0.12, 0.05, 0.015, 2), makeMat('BLACK_SOFT'));
  grip.position.set(0, -0.06, 0.04);
  grip.rotation.x = -0.3;
  const body = mesh(roundedBox(0.07, 0.07, 0.18, 0.02, 2), makeMat('METAL_DARK', { spec: 0.3 }));
  const battery = mesh(chamferCylinder(0.03, 0.03, 0.09, 10, 0.008), makeMat('YELLOW_TOY'));
  battery.rotation.x = Math.PI / 2;
  battery.position.set(0, 0.055, 0.03);
  const magnet = mesh(new TorusGeometry(0.055, 0.022, 8, 16, Math.PI), red);
  magnet.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  magnet.position.z = -0.1;
  for (const s of [-1, 1]) {
    const tip = mesh(chamferCylinder(0.023, 0.023, 0.03, 8, 0.006), makeMat('METAL', { spec: 0.6 }));
    tip.rotation.x = Math.PI / 2;
    tip.position.set(s * 0.055, 0, -0.11);
    g.add(tip);
  }
  g.add(grip, body, battery, magnet);
  g.userData.item = { kind: 'magnet', label: 'Magnet gun' };
  return g;
}

export function buildFlashlight() {
  const g = new Group();
  const y = makeMat('YELLOW_TOY', { spec: 0.4, rim: 0.4 });
  const body = mesh(chamferCylinder(0.026, 0.026, 0.17, 12, 0.008), y);
  body.rotation.x = Math.PI / 2;
  const head = mesh(chamferCylinder(0.045, 0.03, 0.06, 14, 0.01), y);
  head.rotation.x = -Math.PI / 2;
  head.position.z = -0.11;
  const lens = mesh(chamferCylinder(0.038, 0.038, 0.01, 14, 0.003), makeMat('FRIDGE', { emissive: 'FRIDGE', emissiveIntensity: 0.4 }));
  lens.rotation.x = Math.PI / 2;
  lens.position.z = -0.142;
  const btn = mesh(new SphereGeometry(0.012, 6, 4), makeMat('RED_TOY'));
  btn.position.set(0, 0.026, 0);
  g.add(body, head, lens, btn);
  g.userData.item = { kind: 'flashlight', label: 'Flashlight' };
  g.userData.lens = lens;
  return g;
}

export const TOOL_BUILDERS = { crowbar: buildCrowbar, wrench: buildWrench, magnet: buildMagnetGun, flashlight: buildFlashlight };

export { ConeGeometry };
