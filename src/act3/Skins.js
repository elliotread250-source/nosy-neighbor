// Surfaces and the exterior shell (spec 21, 36, M7).
//
// Style skins sit 3 mm off every wall face, floor and ceiling and carry each
// room's wallpaper, wainscot and floor from palette.json; the exterior faces
// carry the siding color of their floor. They only show in style mode, so
// survey mode stays the flat neutral study. They are built from the wall
// pieces, so openings are already cut, and they wobble gently (2 cm) in
// style mode.
//
// The exterior shell (visible in both modes): the foundation plinth, the
// porch with its roof and columns, the hanging shutter at the broken window,
// downspouts, the cellar vents and the back-yard fence.
import { Group, Mesh, BufferGeometry, Float32BufferAttribute, Vector3, RepeatWrapping, SRGBColorSpace } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { val } from './Spec.js';
import { look, styleMat } from './Look.js';
import { partsMesh } from './Props.js';
import { roomAtPoint } from './Nav.js';
import { wobble } from './StyleWarp.js';
import { wallpaper, woodPlanks, checker, siding } from '../art/CanvasTextures.js';

const box = (w, h, d, x, y, z, c, o = {}) => ({ s: 'box', w, h, d, x, y, z, c, ...o });

// a subdivided quad: origin o, axis u (length lu), axis v (length lv), normal n
function quad(o, u, v, lu, lv, n, uvOf, cell = 0.5, warp = true) {
  const nu = Math.max(1, Math.ceil(lu / cell)), nv = Math.max(1, Math.ceil(lv / cell));
  const P = [], N = [], U = [];
  const pt = (i, j) => {
    const a = (i / nu) * lu, b = (j / nv) * lv;
    const x = o[0] + u[0] * a + v[0] * b, y = o[1] + u[1] * a + v[1] * b, z = o[2] + u[2] * a + v[2] * b;
    // outward only (0 to 2 cm), so a skin never sinks into its wall; edges stay put
    const w = warp && i > 0 && i < nu && j > 0 && j < nv ? (wobble(x, y, z) + 0.02) / 2 : 0;
    return [x + n[0] * w, y + n[1] * w, z + n[2] * w];
  };
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
    // wind so the face points along n
    const cr = [(b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]), (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]), (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0])];
    const flip = cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0;
    const tri = flip ? [a, d, c, a, c, b] : [a, b, c, a, c, d];
    for (const p of tri) { P.push(...p); N.push(...n); U.push(...uvOf(p)); }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new Float32BufferAttribute(U, 2));
  return g;
}

const texCache = new Map();
function tex(key, make, metersPerTile = 1) {
  if (!texCache.has(key)) {
    const t = make().clone();
    t.wrapS = t.wrapT = RepeatWrapping;
    t.colorSpace = SRGBColorSpace;
    t.repeat.set(1 / metersPerTile, 1 / metersPerTile);
    t.needsUpdate = true;
    texCache.set(key, t);
  }
  return texCache.get(key);
}

const PATTERNS = { stripes: 1, pinstripes: 1, dots: 1, diamonds: 1 };

export class SkinsView {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.root = new Group();
    this.root.name = 'act3-skins';
    this.shell = new Group();
    this.shell.name = 'act3-shell';
    scene.add(this.root, this.shell);
    this.colliders = [];
  }

  // a style material for a surface description
  _mat(kind, s, floorId, palette) {
    if (kind === 'exterior') {
      const c = palette.exterior?.[floorId] ?? 'NH_SIDING_MAIN';
      // palette names get their own siding; a hex repaint tints a pale siding
      if (c.startsWith('#')) return { key: `ext-${c}`, mat: () => styleMat(c, { map: tex('siding-trim', () => siding('NH_TRIM'), 1.8) }) };
      return { key: `ext-${c}`, mat: () => styleMat('#ffffff', { map: tex(`siding-${c}`, () => siding(c), 1.8) }) };
    }
    if (kind === 'floor') {
      const f = s.floor ?? 'FLOOR_WOOD';
      if (f === 'checker') return { key: 'floor-checker', mat: () => styleMat('#ffffff', { map: tex('checker', () => checker(), 0.6) }) };
      if (f.startsWith('FLOOR_WOOD')) return { key: `floor-${f}`, mat: () => styleMat('#ffffff', { map: tex(`planks-${f}`, () => woodPlanks(f), 1.5) }) };
      return { key: `floor-${f}`, mat: () => styleMat(f) };
    }
    if (kind === 'ceiling') return { key: `ceil-${s.ceiling ?? 'CEILING'}`, mat: () => styleMat(s.ceiling ?? 'CEILING') };
    if (kind === 'wainscot') return { key: 'wainscot', mat: () => styleMat(typeof s.wainscotColor === 'string' ? s.wainscotColor : 'WAINSCOT') };
    const w = s.wall ?? 'CEILING';
    if (s.pattern && PATTERNS[s.pattern] && s.ink) return { key: `wp-${s.pattern}-${w}`, mat: () => styleMat('#ffffff', { map: tex(`wp-${s.pattern}-${w}-${s.ink}`, () => wallpaper(s.pattern, w, s.ink), 1) }) };
    return { key: `paint-${w}`, mat: () => styleMat(w) };
  }

  build(spec, plan, palette) {
    const buckets = new Map();
    const add = (m, g) => { if (!buckets.has(m.key)) buckets.set(m.key, { m, geos: [] }); buckets.get(m.key).geos.push(g); };
    const E = 0.003;
    for (const f of plan.floors) {
      const y0f = f.floorSlab.y1;
      for (const p of f.walls.pieces) {
        const faces = p.orient === 'x'
          ? [{ n: [0, 0, -1], at: p.z0, u: [1, 0, 0], lu: p.x1 - p.x0, o: (y) => [p.x0, y, p.z0 - E] }, { n: [0, 0, 1], at: p.z1, u: [1, 0, 0], lu: p.x1 - p.x0, o: (y) => [p.x0, y, p.z1 + E] }]
          : [{ n: [-1, 0, 0], at: p.x0, u: [0, 0, 1], lu: p.z1 - p.z0, o: (y) => [p.x0 - E, y, p.z0] }, { n: [1, 0, 0], at: p.x1, u: [0, 0, 1], lu: p.z1 - p.z0, o: (y) => [p.x1 + E, y, p.z0] }];
        for (const fc of faces) {
          const c = p.orient === 'x' ? [(p.x0 + p.x1) / 2, fc.at + fc.n[2] * 0.2] : [fc.at + fc.n[0] * 0.2, (p.z0 + p.z1) / 2];
          const room = roomAtPoint(spec, f.id, c[0], c[1]);
          const uvOf = p.orient === 'x' ? (q) => [q[0], q[1]] : (q) => [q[2], q[1]];
          if (!room) {
            if (f.id === 'B1') continue; // underground
            add(this._mat('exterior', null, f.id, palette), quad(fc.o(p.y0), fc.u, [0, 1, 0], fc.lu, p.y1 - p.y0, fc.n, uvOf));
            continue;
          }
          const s = palette.rooms?.[room.id] ?? room.surfaces ?? {};
          const wsc = val(s.wainscot, 0);
          const split = y0f + wsc;
          if (wsc > 0 && p.y0 < split) {
            const top = Math.min(split, p.y1);
            add(this._mat('wainscot', s), quad(fc.o(p.y0), fc.u, [0, 1, 0], fc.lu, top - p.y0, fc.n, uvOf));
            if (p.y1 > split) add(this._mat('wall', s), quad(fc.o(split), fc.u, [0, 1, 0], fc.lu, p.y1 - split, fc.n, uvOf));
          } else add(this._mat('wall', s), quad(fc.o(p.y0), fc.u, [0, 1, 0], fc.lu, p.y1 - p.y0, fc.n, uvOf));
        }
      }
      // floors: the slab cells under each room (holes already cut)
      for (const c of f.floorSlab.cells) {
        const room = roomAtPoint(spec, f.id, (c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2);
        if (!room) continue;
        const s = palette.rooms?.[room.id] ?? room.surfaces ?? {};
        add(this._mat('floor', s), quad([c.x0, y0f + E, c.z0], [1, 0, 0], [0, 0, 1], c.x1 - c.x0, c.z1 - c.z0, [0, 1, 0], (q) => [q[0], q[2]], 2, false));
      }
      // ceilings: under the next floor's slab and under this floor's own roof slab
      const top = y0f + val(f.floor.ceiling);
      const upper = plan.floors.find((u) => Math.abs(u.floorSlab.y0 - top) < 0.01);
      for (const c of [...(upper?.floorSlab.cells ?? []), ...f.ceilingSlab.cells]) {
        const room = roomAtPoint(spec, f.id, (c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2);
        if (!room) continue;
        const s = palette.rooms?.[room.id] ?? room.surfaces ?? {};
        add(this._mat('ceiling', s), quad([c.x0, top - E, c.z0], [1, 0, 0], [0, 0, 1], c.x1 - c.x0, c.z1 - c.z0, [0, -1, 0], (q) => [q[0], q[2]], 2, false));
      }
    }
    for (const { m, geos } of buckets.values()) {
      const mesh = new Mesh(mergeGeometries(geos));
      mesh.material = m.mat();
      mesh.userData.styleOnly = true;
      mesh.visible = false;
      mesh.receiveShadow = true;
      this.root.add(mesh);
    }
    this._shell(spec, plan, palette);
    return this;
  }

  _shell(spec, plan, palette) {
    const r = spec.roof || {};
    const f0 = plan.floors.find((f) => f.id === 'F0');
    const xs = f0.floor.rooms.flatMap((rm) => rm.polygon.map((p) => p[0])), zs = f0.floor.rooms.flatMap((rm) => rm.polygon.map((p) => p[1]));
    const X0 = Math.min(...xs) - 0.15, X1 = Math.max(...xs) + 0.15, Z0 = Math.min(...zs) - 0.15, Z1 = Math.max(...zs) + 0.15;
    const ph = val(r.foundation?.height, 0.45), out = 0.03;
    const fc = palette.exterior?.foundation ?? 'NH_FOUNDATION';
    // plinth band, standing 3 cm proud of the walls
    const parts = [
      box(X1 - X0 + 2 * out, ph, out, (X0 + X1) / 2, 0, Z0 - out / 2, fc), box(X1 - X0 + 2 * out, ph, out, (X0 + X1) / 2, 0, Z1 + out / 2, fc),
      box(out, ph, Z1 - Z0, X0 - out / 2, 0, (Z0 + Z1) / 2, fc), box(out, ph, Z1 - Z0, X1 + out / 2, 0, (Z0 + Z1) / 2, fc),
    ];
    // three barred cellar vents on the east side, 1.2 m apart
    for (let i = 0; i < (r.foundation?.vents ?? 3); i++) {
      const z = 3.0 + i * 1.2;
      parts.push(box(0.02, 0.2, 0.4, X1 + out + 0.01, 0.12, z, 'BLACK_SOFT'));
      for (let k = 0; k < 4; k++) parts.push(box(0.02, 0.2, 0.015, X1 + out + 0.02, 0.12, z - 0.15 + k * 0.1, 'METAL_DARK'));
    }
    // downspouts on three corners, from the parapet down
    const deck = val(r.terrace?.deck, 7.4);
    for (const [x, z] of [[X0 + 0.08, Z0 - 0.06], [X1 - 0.08, Z1 + 0.06], [X0 + 0.08, Z1 + 0.06]]) parts.push({ s: 'cyl', r: 0.05, h: deck + 0.4, x, y: 0, z, c: palette.exterior?.downspout ?? 'NH_METAL_SHEET' });
    // slab-edge trim bands between the floors and under the parapet
    for (const f of plan.floors.filter((x) => x.id !== 'B1')) {
      const fx = f.floor.rooms.flatMap((rm) => rm.polygon.map((p) => p[0])), fz = f.floor.rooms.flatMap((rm) => rm.polygon.map((p) => p[1]));
      const a0 = Math.min(...fx) - 0.15, a1 = Math.max(...fx) + 0.15, b0 = Math.min(...fz) - 0.15, b1 = Math.max(...fz) + 0.15;
      const y = f.ceilingSlab.y0, h = f.ceilingSlab.y1 - f.ceilingSlab.y0;
      const t = palette.exterior?.trim ?? 'NH_TRIM';
      parts.push(box(a1 - a0 + 0.02, h, 0.01, (a0 + a1) / 2, y, b0 - 0.006, t, { style: 1 }), box(a1 - a0 + 0.02, h, 0.01, (a0 + a1) / 2, y, b1 + 0.006, t, { style: 1 }), box(0.01, h, b1 - b0, a0 - 0.006, y, (b0 + b1) / 2, t, { style: 1 }), box(0.01, h, b1 - b0, a1 + 0.006, y, (b0 + b1) / 2, t, { style: 1 }));
      // corner trim boards, 0.14 m
      for (const [x, z] of [[a0, b0], [a1, b0], [a0, b1], [a1, b1]]) parts.push(box(0.16, y - f.floorSlab.y1, 0.16, x, f.floorSlab.y1, z, t, { style: 1 }));
    }
    const styled = partsMesh(parts.filter((p) => p.style));
    styled.traverse((o) => { if (o.isMesh) o.userData.styleOnly = true; });
    styled.visible = true;
    this.shell.add(partsMesh(parts.filter((p) => !p.style)), styled);
    this.styledShell = styled;
    // the porch: deck one step up, two fat columns, a roof with 0.45 m eaves
    const P = r.porch;
    if (P) {
      const w = val(P.width, 5), d = val(P.depth, 1.6), col = val(P.columns, 0.28), ev = val(P.eaves, 0.45);
      const door = plan.floors[0] && plan.floors.flatMap((f) => f.walls.openings).find((o) => o.id === 'front_door');
      const cx = door ? (door.p0 + door.p1) / 2 : (X0 + X1) / 2;
      const rise = val(P.steps?.rise, 0.18);
      const deckParts = [box(w, rise, d, cx, -0.012, Z0 - d / 2, 'NH_PLANKS'), box(col, 2.9, col, cx - w / 2 + col, rise, Z0 - d + col, 'NH_TRIM'), box(col, 2.9, col, cx + w / 2 - col, rise, Z0 - d + col, 'NH_TRIM'), box(w + 2 * ev, 0.12, d + ev, cx, 3.0, Z0 - (d + ev) / 2, palette.exterior?.roof ?? 'NH_ROOF')];
      this.shell.add(partsMesh(deckParts));
      this._static(cx, rise / 2 - 0.006, Z0 - d / 2, w / 2, rise / 2, d / 2);
      for (const sx of [-1, 1]) this._static(cx + sx * (w / 2 - col), rise + 1.45, Z0 - d + col, col / 2, 1.45, col / 2);
      this._static(cx, 3.06, Z0 - (d + ev) / 2, w / 2 + ev, 0.06, (d + ev) / 2);
    }
    // the hanging shutter at the broken window: one hinge, 25 degrees
    const bw = plan.floors.flatMap((f) => f.walls.openings).find((o) => o.op.state === 'broken');
    if (bw) {
      const sh = partsMesh([box(0.45, bw.y1 - bw.y0, 0.03, 0.225, 0, 0, 'NH_SHUTTERS')]);
      sh.position.set(bw.p0 - 0.47, bw.y0 + 0.05, bw.c - bw.t / 2 - 0.06);
      sh.rotation.z = (-25 * Math.PI) / 180;
      this.shell.add(sh);
    }
    // the back yard: a fenced rectangle the width of the house
    const depth = val(r.yard?.depth, 8), fh = val(r.yard?.fence, 1.2);
    const fence = [];
    const run = (x0, z0, x1, z1) => {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 2);
      for (let i = 0; i <= n; i++) { const t = i / n; fence.push(box(0.1, fh, 0.1, x0 + (x1 - x0) * t, 0, z0 + (z1 - z0) * t, 'WOOD_LIGHT')); }
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, ax = Math.abs(x1 - x0) > 0.01;
      for (const y of [0.3, fh - 0.25]) fence.push(box(ax ? L : 0.05, 0.1, ax ? 0.05 : L, mx, y, mz, 'WOOD_LIGHT'));
      this._static(mx, fh / 2, mz, ax ? L / 2 : 0.05, fh / 2, ax ? 0.05 : L / 2);
    };
    run(X0, Z1, X0, Z1 + depth); run(X0, Z1 + depth, X1, Z1 + depth); run(X1, Z1 + depth, X1, Z1);
    this.shell.add(partsMesh(fence));
  }

  _static(x, y, z, hx, hy, hz) {
    this.colliders.push(this.physics.addStaticBox(new Vector3(x, y, z), new Vector3(hx, hy, hz), null, { kind: 'shell' }));
  }
}

export { look };
