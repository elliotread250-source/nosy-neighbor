// Roof volumes, the terrace, the train track and the windmill (spec 19, 36,
// 41, 42). planRoof() and trackCurve() are pure (the tests use them); the
// RoofView builds meshes, colliders and climb volumes from them.
import { Group, Mesh, BoxGeometry, CylinderGeometry, Vector3, Quaternion, Euler, InstancedMesh, Matrix4, CatmullRomCurve3, BufferGeometry, Float32BufferAttribute } from 'three';
import { val } from './Spec.js';
import { look } from './Look.js';
import { partsMesh } from './Props.js';

const DEG = Math.PI / 180;
const box = (w, h, d, x, y, z, c, o = {}) => ({ s: 'box', w, h, d, x, y, z, c, ...o });

// outer faces of a floor's footprint (centerline rectangles grown by the
// exterior half-thickness)
function outer(floor, grow = 0.15) {
  const xs = floor.rooms.flatMap((r) => r.polygon.map((p) => p[0])), zs = floor.rooms.flatMap((r) => r.polygon.map((p) => p[1]));
  return { x0: Math.min(...xs) - grow, x1: Math.max(...xs) + grow, z0: Math.min(...zs) - grow, z1: Math.max(...zs) + grow };
}

export function planRoof(spec, plan) {
  const r = spec.roof || {};
  const f1 = spec.floors.find((f) => f.id === (r.terrace?.floor ?? 'F1'));
  const f2 = spec.floors.find((f) => f.id === (r.box?.floor ?? 'F2'));
  const deck = val(r.terrace?.deck, val(f1.elevation) + val(f1.ceiling) + val(f1.slab, 0.3));
  const O = outer(f1);
  const ph = val(r.parapet?.height, 0.55), pt = val(r.parapet?.thickness, 0.25);
  const boxes = [
    { id: 'parapet_front', x0: O.x0, x1: O.x1, z0: O.z0, z1: O.z0 + pt },
    { id: 'parapet_back', x0: O.x0, x1: O.x1, z0: O.z1 - pt, z1: O.z1 },
    { id: 'parapet_west', x0: O.x0, x1: O.x0 + pt, z0: O.z0 + pt, z1: O.z1 - pt },
    { id: 'parapet_east', x0: O.x1 - pt, x1: O.x1, z0: O.z0 + pt, z1: O.z1 - pt },
  ].map((b) => ({ ...b, y0: deck, y1: deck + ph, kind: 'parapet' }));
  if (r.chimney) {
    const c = r.chimney, [w, d, h] = c.size.map((v) => val(v));
    boxes.push({ id: 'chimney', kind: 'chimney', x0: c.at.x - w / 2, x1: c.at.x + w / 2, z0: c.at.z - d / 2, z1: c.at.z + d / 2, y0: deck, y1: deck + h });
  }
  // the box roof: a gable over the F2 box, ridge along x at the box's middle
  const B = outer(f2);
  const top = val(f2.elevation) + val(f2.ceiling) + val(f2.slab, 0.3);
  const pitch = val(r.box?.pitch, 12) * DEG, eave = val(r.box?.eaves, 0.15);
  const zr = (B.z0 + B.z1) / 2, half = (B.z1 - B.z0) / 2 + eave;
  const rise = ((B.z1 - B.z0) / 2) * Math.tan(pitch);
  const ridgeY = top + rise;
  const slopes = [-1, 1].map((sgn) => ({ id: sgn < 0 ? 'roof_front' : 'roof_back', x0: B.x0 - eave, x1: B.x1 + eave, zEave: zr + sgn * half, zRidge: zr, yEave: top - eave * Math.tan(pitch), yRidge: ridgeY, thickness: 0.12 }));
  const roofY = (z) => ridgeY - Math.abs(z - zr) * Math.tan(pitch);
  let perch = null;
  if (r.perch) {
    const [w, d, h] = r.perch.size.map((v) => val(v));
    perch = { id: 'perch', kind: 'perch', x0: r.perch.at.x - w / 2, x1: r.perch.at.x + w / 2, z0: r.perch.at.z - d / 2, z1: r.perch.at.z + d / 2, y0: roofY(r.perch.at.z + d / 2) - 0.05, y1: ridgeY + 0.02 + h };
    perch.x1 = Math.min(perch.x1, B.x1);
    boxes.push(perch);
  }
  return { deck, outer: O, box: B, top, ridgeY, zr, pitch, slopes, roofY, boxes, perch, parapetH: ph, parapetT: pt };
}

// A closed (or open) Catmull-Rom curve through tagged control points.
export function trackCurve(points, closed = true) {
  return new CatmullRomCurve3(points.map((p) => new Vector3(p.x, p.y, p.z)), closed, 'centripetal');
}

// Minimum plan-view turn radius (spec 19.2), measured over a chord of
// `span` meters on each side of every sample: the scale a 0.9 m car feels.
// (Sampling much finer than that only measures the millimeter rounding of
// the control points.)
export function minRadius(curve, { step = 0.05, span = 0.25 } = {}) {
  const L = curve.getLength();
  const n = Math.ceil(L / step);
  const pts = curve.getSpacedPoints(n);
  const k = Math.max(1, Math.round(span / step));
  let min = Infinity, at = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[(i - k + n) % n], b = pts[i], c = pts[(i + k) % n];
    const ab = Math.hypot(b.x - a.x, b.z - a.z), bc = Math.hypot(c.x - b.x, c.z - b.z), ca = Math.hypot(a.x - c.x, a.z - c.z);
    const cross = Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x));
    if (cross < 1e-12) continue;
    const R = (ab * bc * ca) / (2 * cross);
    if (R < min) { min = R; at = (i / n) * L; }
  }
  return { min, at, length: L };
}

export class RoofView {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.root = new Group();
    this.root.name = 'act3-roof';
    scene.add(this.root);
    this.colliders = [];
    this.ladders = [];
    this.t = 0;
  }

  build(spec, plan, train) {
    const R = (this.R = planRoof(spec, plan));
    const pal = spec.roof || {};
    // parapet and chimney
    for (const b of R.boxes) {
      const color = b.kind === 'chimney' ? 'NH_ROOF' : b.kind === 'perch' ? 'METAL' : '#cfc6b4';
      const m = partsMesh([box(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0, (b.x0 + b.x1) / 2, b.y0, (b.z0 + b.z1) / 2, color)]);
      this.root.add(m);
      this._static(b);
      if (b.kind === 'parapet') {
        const cap = partsMesh([box(b.x1 - b.x0 + 0.04, 0.06, b.z1 - b.z0 + 0.04, (b.x0 + b.x1) / 2, b.y1, (b.z0 + b.z1) / 2, pal.parapet?.coping ?? 'NH_ROOF')]);
        cap.userData.styleOnly = true;
        this.root.add(cap);
      }
    }
    // gable slopes over the box (walkable at 12 degrees)
    for (const s of R.slopes) {
      const dz = s.zEave - s.zRidge, dy = s.yEave - s.yRidge;
      const len = Math.hypot(dz, dy);
      const geo = new BoxGeometry(s.x1 - s.x0, s.thickness, len);
      const m = new Mesh(geo);
      look(m, pal.box?.color ?? 'NH_ROOF_ALT');
      m.position.set((s.x0 + s.x1) / 2, (s.yEave + s.yRidge) / 2, (s.zEave + s.zRidge) / 2);
      m.rotation.x = Math.atan2(-dy, dz); // local z runs ridge -> eave
      m.castShadow = m.receiveShadow = true;
      this.root.add(m);
      const q = new Quaternion().setFromEuler(new Euler(m.rotation.x, 0, 0));
      this.colliders.push(this.physics.addStaticBox(m.position.clone(), new Vector3((s.x1 - s.x0) / 2, s.thickness / 2, len / 2), q, { kind: 'roof' }));
    }
    // gable end triangles
    for (const x of [R.box.x0, R.box.x1]) {
      const g = new BufferGeometry();
      const y0 = R.top, y1 = R.ridgeY, z0 = R.box.z0, z1 = R.box.z1, zr = R.zr;
      g.setAttribute('position', new Float32BufferAttribute([x, y0, z0, x, y0, z1, x, y1, zr, x, y0, z1, x, y0, z0, x, y1, zr], 3));
      g.computeVertexNormals();
      const m = new Mesh(g);
      look(m, 'NH_SIDING_ALT');
      this.root.add(m);
    }
    // ladder up the east wall of the box to the perch
    if (pal.boxLadder && R.perch) {
      const L = pal.boxLadder;
      this._ladderMesh(L.at.x, L.at.y, L.at.z, R.perch.y1 - L.at.y, val(L.width, 0.8), val(L.rungSpacing, 0.28), 'x', true);
      this.ladders.push({ id: 'box_ladder', min: new Vector3(L.at.x - 0.02, L.at.y - 0.1, L.at.z - val(L.width, 0.8) / 2), max: new Vector3(L.at.x + 0.55, R.perch.y1 + 1.0, L.at.z + val(L.width, 0.8) / 2), top: R.perch.y1 });
    }
    if (spec.windmill) this._windmill(spec.windmill, R);
    if (train) this._track(train, plan);
    return this;
  }

  _static(b) {
    this.colliders.push(this.physics.addStaticBox(new Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2), new Vector3((b.x1 - b.x0) / 2, (b.y1 - b.y0) / 2, (b.z1 - b.z0) / 2), null, { kind: b.kind ?? 'roof' }));
  }

  // rails along local z (axis 'z') or x, rungs across
  _ladderMesh(x, y, z, h, w, sp, axis, cage = false) {
    const n = Math.max(1, Math.round(h / sp));
    const parts = [];
    const across = axis === 'x' ? (a) => [0, a] : (a) => [a, 0];
    for (const s of [-1, 1]) { const [ax, az] = across((s * w) / 2); parts.push(box(0.05, h + 0.9, 0.05, ax, 0, az, 'METAL')); }
    for (let i = 1; i <= n; i++) parts.push(axis === 'x' ? box(0.025, 0.025, w, 0, (i * h) / n, 0, 'METAL_DARK') : box(w, 0.025, 0.025, 0, (i * h) / n, 0, 'METAL_DARK'));
    if (cage) for (let i = 2; i * 0.6 < h; i++) parts.push(axis === 'x' ? box(0.7, 0.03, 0.03, 0.35, i * 0.6, -w / 2, 'METAL') : box(0.03, 0.03, 0.7, -w / 2, i * 0.6, 0.35, 'METAL'), axis === 'x' ? box(0.7, 0.03, 0.03, 0.35, i * 0.6, w / 2, 'METAL') : box(0.03, 0.03, 0.7, w / 2, i * 0.6, 0.35, 'METAL'));
    const g = partsMesh(parts);
    g.position.set(x, y, z);
    this.root.add(g);
    return { group: g, rungs: n, spacing: h / n };
  }

  _windmill(wm, R) {
    const g = new Group();
    const x = wm.at.x, z = wm.at.z, base = R.roofY(z);
    const H = val(wm.tower.height, 3), rb = val(wm.tower.base, 1.2) / 2, rt = val(wm.tower.top, 0.8) / 2;
    const tower = new Mesh(new CylinderGeometry(rt, rb, H, wm.tower.sides ?? 8).translate(0, H / 2, 0));
    look(tower, 'NH_TRIM');
    tower.castShadow = true;
    g.add(tower);
    const band = new Mesh(new CylinderGeometry(rb * 0.86, rb * 0.9, 0.25, wm.tower.sides ?? 8).translate(0, H * 0.35, 0));
    look(band, 'RETRO_MINT');
    g.add(band);
    const plat = val(wm.platform, 0.8);
    const deck = new Mesh(new BoxGeometry(plat + 0.3, 0.08, plat + 0.3).translate(0, H + 0.04, 0));
    look(deck, 'WOOD_MID');
    g.add(deck);
    // hub and blades on the street side (-z), in a vertical plane
    const hubY = H + 0.35, hubZ = -(rt + 0.25);
    const hub = new Group();
    hub.position.set(0, hubY, hubZ);
    const hubM = new Mesh(new CylinderGeometry(val(wm.hub, 0.3) / 2, val(wm.hub, 0.3) / 2, 0.2, 12).rotateX(Math.PI / 2));
    look(hubM, 'NH_ROOF');
    hub.add(hubM);
    const L = val(wm.blades.length, 1.8), W = val(wm.blades.width, 0.35);
    for (let i = 0; i < (wm.blades.count ?? 4); i++) {
      const arm = new Group();
      arm.rotation.z = (i * Math.PI * 2) / (wm.blades.count ?? 4);
      const blade = new Mesh(new BoxGeometry(W, L, 0.03).translate(0, val(wm.hub, 0.3) / 2 + L / 2, 0));
      blade.rotation.y = val(wm.blades.twist, 8) * DEG;
      look(blade, i % 2 ? 'NH_SCAFFOLD' : 'WHITE');
      blade.castShadow = true;
      arm.add(blade);
      hub.add(arm);
    }
    g.add(hub);
    g.position.set(x, base, z);
    this.root.add(g);
    this.windmill = { group: g, hub, rps: val(wm.blades.rps, 0.3), rpsClimbing: val(wm.blades.rpsClimbing, 0.1), hubWorld: new Vector3(x, base + hubY, z + hubZ), topY: base + H, base };
    // collider: the tower as a box, the platform on top
    this.colliders.push(this.physics.addStaticBox(new Vector3(x, base + H / 2, z), new Vector3(rt * 0.95, H / 2, rt * 0.95), null, { kind: 'windmill' }));
    this.colliders.push(this.physics.addStaticBox(new Vector3(x, base + H + 0.04, z), new Vector3((plat + 0.3) / 2, 0.04, (plat + 0.3) / 2), null, { kind: 'windmill' }));
    // fixed ladder on the east side
    const sp = val(wm.rungSpacing, 0.28);
    const lx = x + rb + 0.05;
    this._ladderMesh(lx, base, z, H, 0.45, sp, 'x');
    this.ladders.push({ id: 'windmill_ladder', min: new Vector3(lx - 0.15, base - 0.2, z - 0.3), max: new Vector3(lx + 0.5, base + H + 1.0, z + 0.3), top: base + H, windmill: true });
  }

  // rails (two strips at the gauge) and instanced sleepers along the ring and
  // the train route; route samples that coincide with the ring are skipped
  _track(train, plan) {
    const gauge = val(train.gauge, 0.45), sp = val(train.sleeperSpacing, 0.3);
    const ring = trackCurve(train.ring.controlPoints, true);
    const route = trackCurve(train.route.controlPoints, true);
    this.ringCurve = ring;
    this.routeCurve = route;
    const ringPts = ring.getSpacedPoints(800);
    const segs = [], sleepers = [];
    const addCurve = (curve, skipNearRing) => {
      const L = curve.getLength();
      const n = Math.ceil(L / 0.1);
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n;
        const a = curve.getPointAt(u0), b = curve.getPointAt(u1);
        if (skipNearRing && ringPts.some((p) => Math.hypot(p.x - a.x, p.z - a.z) < 0.08 && Math.abs(p.y - a.y) < 0.05)) continue;
        segs.push([a, b]);
        if (i % Math.round(sp / 0.1) === 0) sleepers.push([a, b]);
      }
    };
    addCurve(ring, false);
    addCurve(route, true);
    const m = new Matrix4(), q = new Quaternion(), s = new Vector3(), up = new Vector3(0, 1, 0);
    const rails = new InstancedMesh(new BoxGeometry(0.04, 0.04, 1), null, segs.length * 2);
    look(rails, 'METAL');
    let k = 0;
    for (const [a, b] of segs) {
      const dir = b.clone().sub(a), len = dir.length();
      const side = new Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(gauge / 2);
      q.setFromUnitVectors(new Vector3(0, 0, 1), dir.clone().normalize());
      for (const sg of [-1, 1]) {
        const c = a.clone().add(b).multiplyScalar(0.5).addScaledVector(side, sg).add(new Vector3(0, -0.02, 0));
        m.compose(c, q, s.set(1, 1, len + 0.005));
        rails.setMatrixAt(k++, m);
      }
    }
    rails.count = k;
    this.root.add(rails);
    const sl = new InstancedMesh(new BoxGeometry(gauge + 0.2, 0.03, 0.08), null, sleepers.length);
    look(sl, 'WOOD_DARK');
    sleepers.forEach(([a, b], i) => {
      const dir = b.clone().sub(a).normalize();
      q.setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(dir.x, 0, dir.z).normalize());
      m.compose(a.clone().add(new Vector3(0, -0.055, 0)), q, s.set(1, 1, 1));
      sl.setMatrixAt(i, m);
    });
    this.root.add(sl);
    // supports where the route climbs into the box
    void up; void plan;
  }

  update(dt, playerOnWindmillLadder) {
    this.t += dt;
    if (this.windmill) {
      const rps = playerOnWindmillLadder ? this.windmill.rpsClimbing : this.windmill.rps;
      this.windmill.hub.rotation.z -= rps * Math.PI * 2 * dt;
    }
  }
}
