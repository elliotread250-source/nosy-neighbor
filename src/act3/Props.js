// Features from house.json -> meshes and colliders (spec sections 20, 44).
// Every prop is built from simple primitives at its tagged size. Sizes are
// architecture-true here; the cartoon scale constant only applies to the
// handheld items (keycard), never to furniture or to the climbable rail and
// lamp, whose colliders match the visible geometry within 1 cm (section 18.4).
import {
  Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, Vector3, Quaternion, Euler, InstancedMesh, Matrix4, Object3D, PointLight, ConeGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { val } from './Spec.js';
import { look } from './Look.js';

const DEG = Math.PI / 180;
const box = (w, h, d, x, y, z, c, o = {}) => ({ s: 'box', w, h, d, x, y, z, c, ...o });
const cyl = (r, h, x, y, z, c, o = {}) => ({ s: 'cyl', r, h, x, y, z, c, ...o });
const ball = (r, x, y, z, c, o = {}) => ({ s: 'ball', r, x, y, z, c, ...o });

// kind -> (w, d, h, feature) => { parts (y = bottom of the part), collide, mass }
// collide: 'full' (one static box), 'parts' (a static box per box part),
// 'dynamic' (a physics body), 'none'
const KINDS = {
  cardboard: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'CARDBOARD'), box(w * 1.002, 0.004, 0.06, 0, h, 0, 'CARDBOARD_TAPE')], collide: 'dynamic', mass: 3 }),
  cardboard_small: (w, d, h) => KINDS.cardboard(w, d, h),
  crate: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'WOOD_MID')], collide: 'dynamic', mass: 9 }),
  newspapers: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, '#d8d4c8')], collide: 'dynamic', mass: 4 }),
  frames: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'WOOD_DARK')], collide: 'dynamic', mass: 3 }),
  bucket: (w, d, h) => ({ parts: [cyl(w / 2, h, 0, 0, 0, 'METAL')], collide: 'dynamic', mass: 1.5, shape: 'cylinder' }),
  paint_can: (w, d, h) => ({ parts: [cyl(w / 2, h, 0, 0, 0, 'TOMATO')], collide: 'dynamic', mass: 1.2, shape: 'cylinder' }),
  carpet_roll: (w, d, h) => ({ parts: [cyl(w / 2, h, 0, 0, 0, 'CARPET_RED')], collide: 'dynamic', mass: 8, shape: 'cylinder' }),
  bicycle: (w, d, h) => ({ parts: [box(w, 0.05, 0.05, 0, h * 0.7, 0, 'RED_TOY'), box(0.05, h * 0.7, 0.05, -w * 0.3, 0, 0, 'RED_TOY'), box(0.05, h * 0.75, 0.05, w * 0.35, 0, 0, 'RED_TOY'), box(0.3, 0.06, 0.12, -w * 0.3, h * 0.72, 0, 'BLACK_SOFT')], collide: 'dynamic', mass: 9, half: [w / 2, h / 2, d / 2] }),
  stepladder: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'NH_SCAFFOLD')], collide: 'dynamic', mass: 5 }),
  umbrella_stand: (w, d, h) => ({ parts: [cyl(w / 2, h, 0, 0, 0, 'BRASS'), cyl(0.015, 0.4, 0.05, h, 0, 'BLUE_TOY')], collide: 'dynamic', mass: 3, shape: 'cylinder', half: [w / 2, h / 2, w / 2] }),
  stool: (w, d, h) => ({ parts: [cyl(w / 2, 0.05, 0, h - 0.05, 0, 'RED_TOY'), cyl(0.03, h - 0.05, 0, 0, 0, 'METAL')], collide: 'dynamic', mass: 3, half: [w / 2, h / 2, d / 2] }),
  chair: (w, d, h) => ({ parts: [box(w, 0.05, d, 0, 0.45, 0, 'WOOD_MID'), box(w, h - 0.5, 0.05, 0, 0.5, -d / 2 + 0.025, 'WOOD_MID'), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => box(0.04, 0.45, 0.04, a * (w / 2 - 0.03), 0, b * (d / 2 - 0.03), 'WOOD_DARK'))], collide: 'dynamic', mass: 5, half: [w / 2, h / 2, d / 2] }),
  chair_child: (w, d, h) => ({ parts: [box(w, 0.04, d, 0, 0.27, 0, 'YELLOW_TOY'), box(w, h - 0.3, 0.04, 0, 0.3, -d / 2 + 0.02, 'YELLOW_TOY'), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => box(0.03, 0.27, 0.03, a * (w / 2 - 0.02), 0, b * (d / 2 - 0.02), 'BLUE_TOY'))], collide: 'dynamic', mass: 2, half: [w / 2, h / 2, d / 2] }),
  table: (w, d, h) => ({ parts: [box(w, 0.05, d, 0, h - 0.05, 0, 'WOOD_MID'), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => box(0.06, h - 0.05, 0.06, a * (w / 2 - 0.05), 0, b * (d / 2 - 0.05), 'WOOD_DARK'))], collide: 'full' }),
  desk: (w, d, h, f) => ({ parts: [box(w, 0.05, d, 0, h - 0.05, 0, 'WOOD_DARK'), box(w * 0.4, h - 0.05, d, -w * 0.3, 0, 0, 'WOOD_MID'), box(0.04, h - 0.05, d, w / 2 - 0.02, 0, 0, 'WOOD_MID'), ...(f.items?.includes('typewriter') ? [box(0.4, 0.15, 0.3, 0, h, 0.2, 'METAL_DARK'), box(0.3, 0.25, 0.25, 0, h, -0.4, 'TV_BODY'), box(0.02, 0.02, 0.01, 0.1, h + 0.2, -0.27, '#ff2020', { emissive: '#ff2020' })] : [])], collide: 'full' }),
  sofa: (w, d, h, f) => ({ parts: [box(w, 0.42, d, 0, 0, 0, f.color ?? 'RETRO_ORANGE'), box(w, h - 0.42, 0.2, 0, 0.42, -d / 2 + 0.1, f.color ?? 'RETRO_ORANGE'), box(0.18, 0.25, d, -w / 2 + 0.09, 0.42, 0, f.color ?? 'RETRO_ORANGE'), box(0.18, 0.25, d, w / 2 - 0.09, 0.42, 0, f.color ?? 'RETRO_ORANGE')], collide: 'full' }),
  armchair: (w, d, h, f) => KINDS.sofa(w, d, h, f),
  bookcase: (w, d, h, f) => ({ parts: [box(w, h, 0.03, 0, 0, -d / 2 + 0.015, 'WOOD_DARK'), box(0.03, h, d, -w / 2 + 0.015, 0, 0, 'WOOD_DARK'), box(0.03, h, d, w / 2 - 0.015, 0, 0, 'WOOD_DARK'), ...[0, 0.55, 1.1, 1.65, h - 0.03].map((y) => box(w, 0.03, d, 0, y, 0, 'WOOD_DARK'))], collide: 'full', lean: val(f.lean, 0) }),
  shelf: (w, d, h, f) => KINDS.bookcase(w, d, h, f),
  tv: (w, d, h, f) => ({ parts: [box(w + 0.1, val(f.stand, 0.45), d, 0, 0, 0, 'WOOD_DARK'), box(w, h, d, 0, val(f.stand, 0.45), 0, 'TV_BODY'), box(w * 0.8, h * 0.7, 0.01, 0, val(f.stand, 0.45) + h * 0.15, d / 2, 'TV_SCREEN_ON', { emissive: '#8890a0' })], collide: 'full', heightTotal: h + val(f.stand, 0.45) }),
  fridge: (w, d, h, f) => ({ parts: [box(w, h, d, 0, 0, 0, f.color ?? 'FRIDGE'), box(0.04, 0.4, 0.04, w / 2 - 0.1, 1.0, d / 2 + 0.02, 'FRIDGE_HANDLE')], collide: 'full' }),
  stove: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'WHITE'), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => cyl(0.09, 0.01, a * w / 4, h, b * d / 4, 'BLACK_SOFT')), cyl(0.1, 0.18, w / 4, h, d / 4, 'TOMATO')], collide: 'full' }),
  counter: (w, d, h, f) => ({ parts: [box(w, h - 0.04, d, 0, 0, 0, 'RETRO_MINT'), box(w, 0.04, d, 0, h - 0.04, 0, '#e8e2d4'), ...(f.sink ? [box(0.6, 0.02, 0.4, 0, h, 0, 'METAL')] : [])], collide: 'full' }),
  cabinet: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'WOOD_MID'), box(w * 0.46, h * 0.9, 0.02, -w * 0.25, h * 0.05, d / 2 + 0.01, 'WOOD_LIGHT')], collide: 'full' }),
  sideboard: (w, d, h) => KINDS.cabinet(w, d, h),
  wardrobe: (w, d, h) => KINDS.cabinet(w, d, h),
  dresser: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'WOOD_LIGHT'), box(w * 0.7, 0.7, 0.03, 0, h, -d / 2 + 0.05, '#cfd8dc')], collide: 'full' }),
  nightstand: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'WOOD_LIGHT'), box(0.12, 0.08, 0.06, 0, h, 0, 'TOMATO')], collide: 'full' }),
  bed: (w, d, h) => ({ parts: [box(w, 0.3, d, 0, 0, 0, 'WOOD_MID'), box(w, h - 0.3, d, 0, 0.3, 0, 'BLUE_TOY'), box(0.08, 0.9, d, -w / 2 + 0.04, 0, 0, 'WOOD_DARK')], collide: 'full' }),
  closet: (w, d, h) => ({ parts: [box(w, h, 0.04, 0, 0, -d / 2 + 0.02, 'WOOD_DARK'), box(0.04, h, d, -w / 2 + 0.02, 0, 0, 'WOOD_DARK'), box(0.04, h, d, w / 2 - 0.02, 0, 0, 'WOOD_DARK'), box(w, 0.04, d, 0, h - 0.04, 0, 'WOOD_DARK'), box(0.04, h * 0.95, w * 0.5, w / 2 + w * 0.25 - 0.02, 0, d / 2 + w * 0.25 - 0.04, 'WOOD_LIGHT', { ry: 0 })], collide: 'parts' }),
  workbench: (w, d, h) => ({ parts: [box(w, 0.06, d, 0, h - 0.06, 0, 'WOOD_LIGHT'), box(w, 0.6, d - 0.1, 0, 0.1, 0, 'WOOD_MID'), box(0.5, 0.1, 0.2, -0.5, h, 0, 'METAL_DARK'), box(0.3, 0.05, 0.05, 0.4, h, 0.1, 'TOMATO')], collide: 'full' }),
  boiler: (w, d, h) => ({ parts: [cyl(w / 2, h, 0, 0, 0, 'METAL'), box(0.2, 0.2, 0.05, 0, 1.0, w / 2, '#ff8a30', { emissive: '#ff6020' })], collide: 'full' }),
  tub: (w, d, h) => ({ parts: [box(w, h, d, 0, 0.1, 0, 'WHITE'), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => box(0.08, 0.1, 0.08, a * (w / 2 - 0.1), 0, b * (d / 2 - 0.1), 'BRASS'))], collide: 'full', heightTotal: h + 0.1 }),
  toilet: (w, d, h) => ({ parts: [box(w, 0.42, d * 0.7, 0, 0, d * 0.1, 'WHITE'), box(w, h - 0.42, 0.2, 0, 0.42, -d / 2 + 0.1, 'WHITE')], collide: 'full' }),
  sink: (w, d, h) => ({ parts: [cyl(0.06, h - 0.15, 0, 0, 0, 'WHITE'), box(w, 0.15, d, 0, h - 0.15, 0, 'WHITE')], collide: 'full' }),
  plant: (w, d, h) => ({ parts: [cyl(w * 0.35, 0.4, 0, 0, 0, 'TANGERINE'), ball(w / 2, 0, h - w / 2, 0, 'GRASS_DARK')], collide: 'full' }),
  coat_stand: (w, d, h) => ({ parts: [cyl(0.03, h, 0, 0, 0, 'WOOD_DARK'), cyl(0.2, 0.03, 0, 0, 0, 'WOOD_DARK'), box(0.35, 0.6, 0.15, 0.12, h - 0.75, 0, 'WOOD_MID')], collide: 'full', half: [0.2, h / 2, 0.2] }),
  picture: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'BRASS'), box(w - 0.06, h - 0.06, 0.01, 0, 0.03, d / 2, 'SKY_TOY')], collide: 'none' }),
  runner: (w, d, h, f) => ({ parts: [box(w, h, d, 0, 0, 0, f.color ?? 'CARPET_RED')], collide: 'none' }),
  rug: (w, d, h, f) => ({ parts: [box(w, h, d, 0, 0, 0, f.color ?? 'CARPET_RED')], collide: 'none' }),
  chalk_outline: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, '#d8dcd8', { opacity: 0.35 })], collide: 'none' }),
  drain: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'METAL_DARK')], collide: 'none' }),
  panel: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'METAL'), box(0.01, 0.06, 0.06, -w / 2, h - 0.12, 0, '#ff3030', { emissive: '#ff2020' })], collide: 'none' }),
  corkboard: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'WOOD_LIGHT'), box(0.15, 0.12, 0.01, -0.2, 0.3, d / 2, 'WHITE'), box(0.12, 0.1, 0.01, 0.15, 0.2, d / 2, 'YELLOW_TOY')], collide: 'none' }),
  map: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, '#e8dfc8')], collide: 'none' }),
  banner: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'BUBBLEGUM')], collide: 'none' }),
  tally_wall: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, '#e8e8e0', { opacity: 0.5 })], collide: 'none' }),
  pipe: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'METAL_DARK')], collide: 'none' }),
  tube_light: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'BASEMENT_LIGHT', { emissive: '#A6F0D0' })], collide: 'none' }),
  chandelier: (w, d, h) => ({ parts: [cyl(0.008, 3.4 - 2.4 - h, 0, h, 0, 'METAL_DARK'), cyl(w / 2, 0.06, 0, h * 0.4, 0, 'BRASS'), ...[0, 1, 2, 3, 4, 5].map((i) => ball(0.05, Math.cos(i) * w * 0.45, h * 0.5, Math.sin(i) * w * 0.45, 'LAMPSHADE_GLOW', { emissive: '#ffd890' }))], collide: 'none' }),
  lamp_pendant: () => ({ parts: [cyl(0.006, 0.4, 0, 0, 0, 'BLACK_SOFT'), ball(0.06, 0, -0.03, 0, 'LAMPSHADE_GLOW', { emissive: '#ffd890' })], collide: 'none' }),
  lamp_table: (w, d, h) => ({ parts: [cyl(0.08, 0.04, 0, 0, 0, 'BRASS'), cyl(0.015, h * 0.6, 0, 0.04, 0, 'BRASS'), cyl(w / 2, h * 0.36, 0, h * 0.64, 0, 'LAMPSHADE', { rTop: w * 0.35 })], collide: 'none' }),
  // the climbable lamp (section 39): the drum shade is the standing surface;
  // its collider is the drum exactly, the pole is a thin box
  lamp_climbable: (w, d, h) => ({ parts: [cyl(0.2, 0.05, 0, 0, 0, 'METAL_DARK'), cyl(0.03, h - 0.3, 0, 0.05, 0, 'METAL_DARK'), cyl(w / 2, 0.3, 0, h - 0.3, 0, 'LAMPSHADE')], collide: 'custom', colliders: [{ x: 0, y: h - 0.15, z: 0, hx: w / 2, hy: 0.15, hz: w / 2 }, { x: 0, y: (h - 0.3) / 2, z: 0, hx: 0.04, hy: (h - 0.3) / 2, hz: 0.04 }] }),
  // the climbable rail (section 39): a built-in half-wall with a broad cap
  climbable_rail: (w, d, h) => ({ parts: [box(w * 0.7, h - 0.06, d, 0, 0, 0, 'WOOD_MID'), box(w, 0.06, d, 0, h - 0.06, 0, 'WOOD_DARK')], collide: 'custom', colliders: [{ x: 0, y: h / 2, z: 0, hx: w / 2, hy: h / 2, hz: d / 2 }] }),
  glass_shards: () => ({ parts: [], collide: 'none', shards: true }),
  dust_sheet: (w, d, h) => ({ parts: [box(w, h * 0.9, d, 0, 0, 0, '#e8e4dc'), ball(w * 0.35, 0, h * 0.9, 0, '#e8e4dc')], collide: 'full' }),
  cake: (w, d, h) => ({ parts: [cyl(w / 2, h, 0, 0, 0, 'BUBBLEGUM'), cyl(0.008, 0.06, 0, h, 0, 'YELLOW_TOY')], collide: 'none' }),
  disco_ball: (w) => ({ parts: [cyl(0.005, 3.4 - 2.9 - w, 0, w, 0, 'METAL'), ball(w / 2, 0, w / 2, 0, 'METAL')], collide: 'none' }),
  string_lights: () => ({ parts: [], collide: 'none' }),
  balloons: () => ({ parts: [], collide: 'none', balloons: true }),
  guard_rail: (w, d, h) => ({ parts: [], collide: 'none', guard: [w, d, h] }),
  switch_bank: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'METAL_DARK'), ...Array.from({ length: 8 }, (_, i) => box(0.02, 0.06, 0.04, w / 2, 0.6 + (i % 2) * 0.3, -d / 2 + 0.2 + Math.floor(i / 2) * 0.45, i % 3 ? 'LIME' : 'TOMATO', { emissive: i % 3 ? '#80ff80' : '#ff4040' }))], collide: 'full' }),
  button_post: (w, d, h) => ({ parts: [box(0.12, h - 0.1, 0.12, 0, 0, 0, 'METAL'), box(w, 0.1, d, 0, h - 0.1, 0, 'METAL_DARK'), cyl(0.07, 0.05, 0, h, 0, 'TOMATO', { name: 'cap' })], collide: 'full', heightTotal: h }),
  lever_box: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, 'METAL_DARK')], collide: 'full', lever: true }),
  fault_light: (w, d, h) => ({ parts: [box(w, h, d, 0, 0, 0, '#ff3030', { emissive: '#ff2020', name: 'lamp' })], collide: 'none' }),
  ladder: () => ({ parts: [], collide: 'none', ladder: true }),
  railing: () => ({ parts: [], collide: 'none', railing: true }),
};

function partGeometry(p) {
  let g;
  if (p.s === 'box') { g = new BoxGeometry(p.w, p.h, p.d); g.translate(0, p.h / 2, 0); }
  else if (p.s === 'cyl') { g = new CylinderGeometry(p.rTop ?? p.r, p.r, p.h, 16); g.translate(0, p.h / 2, 0); }
  else { g = new SphereGeometry(p.r, 14, 10); g.translate(0, p.r, 0); }
  g.translate(p.x, p.y, p.z);
  return g.index ? g.toNonIndexed() : g;
}

// Group parts by color into one mesh per color.
export function partsMesh(parts) {
  const group = new Group();
  const by = new Map();
  for (const p of parts) {
    const k = `${p.c}|${p.emissive ?? ''}|${p.opacity ?? 1}|${p.name ?? ''}`;
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(p);
  }
  for (const list of by.values()) {
    const p0 = list[0];
    const m = new Mesh(mergeGeometries(list.map(partGeometry)));
    look(m, p0.c, { emissive: p0.emissive, opacity: p0.opacity });
    m.castShadow = (p0.opacity ?? 1) >= 1;
    m.receiveShadow = true;
    if (p0.name) m.name = p0.name;
    group.add(m);
  }
  return group;
}

const _q = new Quaternion(), _e = new Euler(), _v = new Vector3();

// Build every feature. Returns { root, dynamics, statics, lights, ladders,
// byId } for the app, the interaction system and the tests.
export class PropsView {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.root = new Group();
    this.root.name = 'act3-props';
    scene.add(this.root);
    this.byId = new Map();
    this.colliders = [];
    this.dynamics = [];
    this.lights = [];
    this.ladders = []; // { box: {min, max}, feature }
    this.solids = []; // world-space boxes of static props, for tests and the floor plan
  }

  build(spec, plan) {
    const elev = Object.fromEntries(plan.floors.map((f) => [f.id, f.floorSlab.y1]));
    for (const f of spec.features || []) {
      try { this._feature(f, elev[f.floor] ?? 0); } catch (e) { console.warn(`feature ${f.id}: ${e.message}`); }
    }
    return this;
  }

  _feature(f, y0) {
    const kind = KINDS[f.kind];
    if (!kind) throw new Error(`unknown kind ${f.kind}`);
    const [w, d, h] = (f.size || [0.3, 0.3, 0.3]).map((v) => val(v));
    const spec = kind(w, d ?? w, h ?? w, f);
    const rot = val(f.rot, 0) * DEG;
    const pos = new Vector3(val(f.at.x ?? f.at), y0 + (f.at.y ?? 0), f.at.z);
    const entry = { id: f.id, feature: f, kind: f.kind, pos, rot, size: [w, d, h] };
    this.byId.set(f.id, entry);

    if (spec.ladder) return this._ladder(f, entry, y0);
    if (spec.railing) return this._railing(f, entry, y0);
    if (spec.shards) return this._shards(f, entry);
    if (spec.balloons) return this._balloons(f, entry);
    if (spec.guard) return this._guard(f, entry, spec.guard);

    const g = partsMesh(spec.parts);
    g.position.copy(pos);
    g.rotation.y = rot;
    if (spec.lean) g.rotation.z = spec.lean * DEG;
    if (f.tilt) g.rotation.z = val(f.tilt) * DEG;
    if (f.knocked) { g.rotation.x = Math.PI / 2; g.position.y += (d ?? w) / 2; }
    g.name = f.id;
    g.userData.feature = f.id;
    this.root.add(g);
    entry.group = g;

    if (f.light) {
      const l = new PointLight(f.light.color, val(f.light.intensity, 0.5) * 3, val(f.light.range, 5), 1.6);
      l.position.copy(pos).add(new Vector3(0, f.kind === 'lamp_table' ? h * 0.8 : -0.1, 0));
      l.castShadow = false;
      l.visible = false; // survey mode is evenly lit; style mode turns the nearest 8 on
      l.userData.flicker = !!f.light.flicker;
      l.userData.blink = !!f.light.blink;
      this.scene.add(l);
      this.lights.push(l);
      entry.light = l;
    }

    const H = spec.heightTotal ?? h;
    _q.setFromEuler(_e.set(0, rot, 0));
    if (spec.collide === 'full') {
      const half = spec.half ?? [w / 2, H / 2, (d ?? w) / 2];
      this._static(pos.clone().add(new Vector3(0, half[1], 0)), half, _q.clone(), f);
    } else if (spec.collide === 'parts') {
      for (const p of spec.parts.filter((p) => p.s === 'box')) {
        const c = new Vector3(p.x, p.y + p.h / 2, p.z).applyQuaternion(_q).add(pos);
        this._static(c, [p.w / 2, p.h / 2, p.d / 2], _q.clone(), f);
      }
    } else if (spec.collide === 'custom') {
      for (const c of spec.colliders) this._static(new Vector3(c.x, c.y, c.z).applyQuaternion(_q).add(pos), [c.hx, c.hy, c.hz], _q.clone(), f);
    } else if (spec.collide === 'dynamic' && f.physics === false) {
      // a prop the route depends on: fixed in place
      const half = spec.half ?? [w / 2, H / 2, (d ?? w) / 2];
      this._static(pos.clone().add(new Vector3(0, half[1], 0)), half, _q.clone(), f);
    } else if (spec.collide === 'dynamic' && !f.knocked) {
      const half = spec.half ?? [w / 2, H / 2, (d ?? w) / 2];
      const e = this.physics.addDynamic(g, { half: { x: half[0], y: half[1], z: half[2] }, mass: spec.mass ?? 3, shape: spec.shape === 'cylinder' ? 'cylinder' : 'box' });
      e.feature = f.id;
      entry.dynamic = e;
      this.dynamics.push(e);
    } else if (spec.collide === 'dynamic' && f.knocked) {
      const e = this.physics.addDynamic(g, { half: { x: w / 2, y: (d ?? w) / 2, z: H / 2 }, mass: spec.mass ?? 3 });
      entry.dynamic = e;
      this.dynamics.push(e);
    }
  }

  _static(center, half, quat, f) {
    const col = this.physics.addStaticBox(center, new Vector3(...half), quat, { kind: 'prop', feature: f.id });
    this.colliders.push(col);
    const yaw = new Euler().setFromQuaternion(quat).y;
    const c = Math.abs(Math.cos(yaw)), s = Math.abs(Math.sin(yaw));
    const hx = half[0] * c + half[2] * s, hz = half[0] * s + half[2] * c;
    this.solids.push({ id: f.id, kind: f.kind, x0: center.x - hx, x1: center.x + hx, y0: center.y - half[1], y1: center.y + half[1], z0: center.z - hz, z1: center.z + hz });
    return col;
  }

  // a free-standing steel ladder: two rails, rungs every rungSpacing, and a
  // climb volume the player controller reads
  _ladder(f, entry, y0) {
    const [w, d, h] = entry.size;
    const gap = val(f.railGap, 0.45), sp = val(f.rungSpacing, 0.28), rd = val(f.rungDia, 0.025);
    const n = Math.max(1, Math.round(h / sp));
    const parts = [box(0.05, h + 0.9, 0.05, -gap / 2, 0, 0, 'METAL'), box(0.05, h + 0.9, 0.05, gap / 2, 0, 0, 'METAL')];
    for (let i = 1; i <= n; i++) parts.push(cyl(rd / 2, gap, 0, (i * h) / n - rd / 2, 0, 'METAL_DARK', { rz: true }));
    const g = partsMesh(parts.map((p) => (p.rz ? { ...p, s: 'box', w: gap, h: rd, d: rd } : p)));
    g.position.copy(entry.pos);
    g.rotation.y = entry.rot;
    this.root.add(g);
    entry.group = g;
    entry.rungs = n;
    entry.rungSpacing = h / n;
    // climb volume: in front of the rungs, from the floor to the top plus a step off
    const facing = f.facing === '-z' ? -1 : 1;
    const p = entry.pos;
    this.ladders.push({ id: f.id, min: new Vector3(p.x - gap / 2 - 0.1, y0 - 0.1, p.z + (facing < 0 ? 0 : -0.5)), max: new Vector3(p.x + gap / 2 + 0.1, y0 + h + 1.0, p.z + (facing < 0 ? 0.5 : 0)), top: y0 + h });
  }

  // a handrail along a polyline with balusters (instanced) and collider panels
  _railing(f, entry, y0) {
    const pts = f.path.map((p) => new Vector3(p.x, y0 + p.y, p.z));
    const H = val(f.height, 0.9), gap = val(f.gap, 0.1);
    const bal = [];
    const parts = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = a.distanceTo(b), mid = a.clone().add(b).multiplyScalar(0.5);
      const alongX = Math.abs(b.x - a.x) > Math.abs(b.z - a.z);
      parts.push(box(alongX ? len + 0.06 : 0.06, 0.05, alongX ? 0.06 : len + 0.06, mid.x, y0 + H - 0.05, mid.z, 'WOOD_DARK'));
      const nb = Math.floor(len / (gap + 0.03));
      for (let k = 0; k <= nb; k++) bal.push(a.clone().lerp(b, k / nb));
      this._static(new Vector3(mid.x, y0 + H / 2, mid.z), [alongX ? len / 2 + 0.03 : 0.03, H / 2, alongX ? 0.03 : len / 2 + 0.03], new Quaternion(), f);
    }
    const g = partsMesh(parts);
    this.root.add(g);
    const im = new InstancedMesh(new BoxGeometry(0.03, H - 0.05, 0.03).translate(0, (H - 0.05) / 2, 0), null, bal.length);
    look(im, 'WOOD_MID');
    const m = new Matrix4();
    bal.forEach((p, i) => im.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));
    im.castShadow = true;
    this.root.add(im);
    entry.group = g;
  }

  _guard(f, entry, [w, d, h]) {
    // a steel guard rail around the hatch, open on one side
    const p = entry.pos, y0 = p.y;
    // open on the -z side, where you step off the top of the ladder
    const path = [[p.x - w / 2, p.z - d / 2], [p.x - w / 2, p.z + d / 2], [p.x + w / 2, p.z + d / 2], [p.x + w / 2, p.z - d / 2]];
    this._railing({ ...f, path: path.map(([x, z]) => ({ x, y: 0, z })), height: h, gap: 0.3 }, entry, y0);
  }

  _shards(f, entry) {
    const [w, d] = entry.size;
    let s = 99;
    const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const parts = [];
    for (let i = 0; i < (f.count ?? 10); i++) parts.push(box(0.03 + r() * 0.07, 0.004, 0.03 + r() * 0.06, (r() - 0.5) * w, 0.002, (r() - 0.5) * d, 'GLASS', { opacity: 0.6 }));
    const g = partsMesh(parts);
    g.position.copy(entry.pos);
    this.root.add(g);
    for (let i = 0; i < (f.physicsShards ?? 0); i++) {
      const m = partsMesh([box(0.06, 0.006, 0.05, 0, 0, 0, 'GLASS', { opacity: 0.7 })]);
      m.position.copy(entry.pos).add(new Vector3((r() - 0.5) * w, 0.01, (r() - 0.5) * d));
      this.root.add(m);
      this.dynamics.push(this.physics.addDynamic(m, { half: { x: 0.03, y: 0.003, z: 0.025 }, mass: 0.05 }));
    }
  }

  _balloons(f, entry) {
    const n = f.count ?? 12, r = val(f.size?.[0], 0.25) / 2;
    const cols = ['RED_TOY', 'YELLOW_TOY', 'BLUE_TOY', 'BUBBLEGUM'];
    const g = new Group();
    let s = 5;
    const rr = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < n; i++) {
      const m = partsMesh([ball(r, 0, 0, 0, cols[i % 4]), cyl(0.003, 0.5, 0, -0.5, 0, 'WHITE')]);
      m.position.set(entry.pos.x + (rr() - 0.5) * 5.5, entry.pos.y + rr() * 0.6, entry.pos.z + (rr() - 0.5) * 3.8);
      m.userData.bob = rr() * 6;
      g.add(m);
    }
    this.root.add(g);
    entry.group = g;
    this.balloons = g;
  }

  update(t) {
    if (this.balloons) for (const b of this.balloons.children) b.position.y += Math.sin(t * 1.3 + b.userData.bob) * 0.0006;
  }
}

export { KINDS, Object3D, ConeGeometry };
