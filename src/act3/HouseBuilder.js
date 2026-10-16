// Plan -> meshes and colliders (spec 5.3, 16). Everything is built from the
// same numbers the tests read: one box collider per wall piece, slab piece
// and stair step, plus a ramp along each flight's nosing line.
// Survey mode: flat normals, no bevels, neutral grey, 1 m checks on floors.
import {
  Group, Mesh, BufferGeometry, Float32BufferAttribute, MeshLambertMaterial, Shape, Path, ExtrudeGeometry,
  CanvasTexture, RepeatWrapping, SRGBColorSpace, Vector3, Quaternion, Matrix4, ShapeUtils, Color, DoubleSide, MeshBasicMaterial,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { pointInPolygon } from './Slabs.js';

// A box with world-space positions and UVs (1 UV unit = 1 m), flat normals.
export function boxGeometry(x0, x1, y0, y1, z0, z1) {
  const P = [], N = [], U = [];
  const quad = (a, b, c, d, n, uv) => {
    for (const v of [a, b, c, a, c, d]) { P.push(...v); N.push(...n); U.push(...uv(v)); }
  };
  const xy = (v) => [v[0], v[1]], zy = (v) => [v[2], v[1]], xz = (v) => [v[0], v[2]];
  quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], (v) => [-v[2], v[1]]);
  quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], zy);
  quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], xz);
  quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], xz);
  quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], xy);
  quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], (v) => [-v[0], v[1]]);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new Float32BufferAttribute(U, 2));
  return g;
}

// ------------------------------------------------------------ survey textures
const texCache = new Map();
function canvasTex(key, draw, px = 512) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = px;
  draw(c.getContext('2d'), px);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

// 1 m checks: the texture covers 2 m, so repeat 0.5 per world meter
export function checkerTexture() {
  const t = canvasTex('checker', (x, s) => {
    x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, s, s);
    x.fillStyle = '#8c8c8c'; x.fillRect(0, 0, s / 2, s / 2); x.fillRect(s / 2, s / 2, s / 2, s / 2);
    x.strokeStyle = 'rgba(0,0,0,0.12)'; x.lineWidth = 2; x.strokeRect(0, 0, s, s);
  });
  t.repeat.set(0.5, 0.5);
  return t;
}

// 1 m grid lines with 10 cm minor lines, for the grid overlay
export function gridTexture(base = '#d8d8d4') {
  const t = canvasTex(`grid-${base}`, (x, s) => {
    x.fillStyle = base; x.fillRect(0, 0, s, s);
    x.strokeStyle = 'rgba(30,60,90,0.22)'; x.lineWidth = 1;
    for (let i = 1; i < 10; i++) { x.beginPath(); x.moveTo((i * s) / 10, 0); x.lineTo((i * s) / 10, s); x.moveTo(0, (i * s) / 10); x.lineTo(s, (i * s) / 10); x.stroke(); }
    x.strokeStyle = 'rgba(20,50,90,0.75)'; x.lineWidth = 4; x.strokeRect(0, 0, s, s);
  });
  return t;
}

export const SURVEY_COLORS = { wall: '#d8d8d4', exterior: '#cfcfca', opening: '#9fb2c4', floor: '#9a9a9a', ceiling: '#e6e6e2', step: '#b4b4ae' };

function surveyMaterials() {
  return {
    wall: new MeshLambertMaterial({ color: SURVEY_COLORS.wall }),
    exterior: new MeshLambertMaterial({ color: SURVEY_COLORS.exterior }),
    opening: new MeshLambertMaterial({ color: SURVEY_COLORS.opening }),
    floor: new MeshLambertMaterial({ map: checkerTexture() }),
    ceiling: new MeshLambertMaterial({ color: SURVEY_COLORS.ceiling, side: DoubleSide }),
    step: new MeshLambertMaterial({ color: SURVEY_COLORS.step }),
    gridWall: new MeshLambertMaterial({ map: gridTexture(SURVEY_COLORS.wall) }),
    gridFloor: new MeshLambertMaterial({ map: gridTexture('#9a9a9a') }),
    ground: new MeshLambertMaterial({ color: '#a7b19a' }),
  };
}

// ------------------------------------------------------------ slabs
function slabGeometry(slab) {
  const loops = slab.loops;
  const outers = loops.filter((l) => !ShapeUtils.isClockWise(l.map(([x, z]) => ({ x, y: z }))));
  const holes = loops.filter((l) => ShapeUtils.isClockWise(l.map(([x, z]) => ({ x, y: z }))));
  const geos = [];
  for (const o of outers) {
    const shape = new Shape(o.map(([x, z]) => ({ x, y: z })));
    for (const h of holes) if (pointInPolygon(h[0][0] + 1e-4, h[0][1] + 1e-4, o) || pointInPolygon(h[0][0] - 1e-4, h[0][1] - 1e-4, o)) shape.holes.push(new Path(h.map(([x, z]) => ({ x, y: z }))));
    const g = new ExtrudeGeometry(shape, { depth: slab.y1 - slab.y0, bevelEnabled: false });
    g.rotateX(Math.PI / 2); // shape y (= world z) -> world z, depth -> -y
    g.translate(0, slab.y1, 0);
    geos.push(g.toNonIndexed());
  }
  return geos;
}

// ------------------------------------------------------------ build
export class HouseView {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.root = new Group();
    this.root.name = 'act3-house';
    scene.add(this.root);
    this.mats = surveyMaterials();
    this.colliders = [];
    this.byFloor = {};
    this.meshes = [];
    this.gridOn = false;
  }

  clear() {
    for (const c of this.colliders) this.physics.world.removeCollider(c, true);
    this.colliders = [];
    this.root.clear();
    this.meshes = [];
    this.byFloor = {};
  }

  build(plan) {
    this.clear();
    this.plan = plan;
    for (const f of plan.floors) {
      const g = new Group();
      g.name = `floor-${f.id}`;
      this.root.add(g);
      this.byFloor[f.id] = g;
      const buckets = { wall: [], exterior: [], opening: [] };
      for (const p of f.walls.pieces) {
        const b = p.kind === 'wall' ? (p.exterior ? 'exterior' : 'wall') : 'opening';
        buckets[b].push(boxGeometry(p.x0, p.x1, p.y0, p.y1, p.z0, p.z1));
        this._collider(p, { kind: 'wall', piece: p });
      }
      for (const [k, list] of Object.entries(buckets)) if (list.length) this._mesh(g, mergeGeometries(list), k, { surface: k, floor: f.id });
      const fl = slabGeometry(f.floorSlab);
      if (fl.length) this._mesh(g, mergeGeometries(fl), 'floor', { surface: 'floor', floor: f.id });
      for (const b of f.floorSlab.boxes) this._collider({ ...b, y0: f.floorSlab.y0, y1: f.floorSlab.y1 }, { kind: 'slab', floor: f.id });
      const cl = slabGeometry(f.ceilingSlab);
      if (cl.length) this._mesh(g, mergeGeometries(cl), 'ceiling', { surface: 'ceiling', floor: f.id });
      for (const b of f.ceilingSlab.boxes) this._collider({ ...b, y0: f.ceilingSlab.y0, y1: f.ceilingSlab.y1 }, { kind: 'roof', floor: f.id });
    }
    this._ground(plan);
    for (const s of plan.stairs) {
      const geos = s.steps.map((st) => boxGeometry(st.x0, st.x1, st.y0, st.y1, st.z0, st.z1));
      const g = this.byFloor[s.from] ?? this.root;
      if (geos.length) this._mesh(g, mergeGeometries(geos), 'step', { surface: 'step', stair: s.id });
      for (const st of s.steps) this._collider(st, { kind: 'step', stair: s.id });
      this._ramp(s);
    }
    return this;
  }

  // Flat survey ground around the house, top just under y = 0 so it never
  // fights the floor finish. It is a frame around the ground-floor slab, so
  // holes in that slab (the basement stair) stay open. Not part of the audit.
  _ground(plan) {
    const f0 = plan.floors.find((f) => Math.abs(f.floorSlab.y1) < 1e-6) ?? plan.floors[0];
    const bx = f0.floorSlab.boxes;
    const x0 = Math.min(...bx.map((b) => b.x0)), x1 = Math.max(...bx.map((b) => b.x1));
    const z0 = Math.min(...bx.map((b) => b.z0)), z1 = Math.max(...bx.map((b) => b.z1));
    const X0 = x0 - 25, X1 = x1 + 25, Z0 = z0 - 25, Z1 = z1 + 25, y0 = -0.31, y1 = -0.012;
    const parts = [
      { x0: X0, x1: X1, z0: Z0, z1: z0 }, { x0: X0, x1: X1, z0: z1, z1: Z1 },
      { x0: X0, x1: x0, z0, z1 }, { x0: x1, x1: X1, z0, z1 },
    ];
    const m = new Mesh(mergeGeometries(parts.map((p) => boxGeometry(p.x0, p.x1, y0, y1, p.z0, p.z1))), this.mats.ground);
    m.userData = { surface: 'ground', baseMat: 'ground' };
    m.receiveShadow = true;
    this.root.add(m);
    this.meshes.push(m);
    for (const p of parts) this._collider({ ...p, y0, y1: -0.002 }, { kind: 'ground' });
  }

  _mesh(parent, geo, mat, data) {
    const m = new Mesh(geo, this.mats[mat]);
    m.userData = { ...data, baseMat: mat };
    m.castShadow = mat !== 'ceiling';
    m.receiveShadow = true;
    parent.add(m);
    this.meshes.push(m);
    return m;
  }

  _collider(b, data) {
    const c = new Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2);
    const h = new Vector3((b.x1 - b.x0) / 2, (b.y1 - b.y0) / 2, (b.z1 - b.z0) / 2);
    if (h.x < 1e-4 || h.y < 1e-4 || h.z < 1e-4) return null;
    const col = this.physics.addStaticBox(c, h, null, data);
    this.colliders.push(col);
    return col;
  }

  // A thin ramp along the nosing line so walking up is smooth (spec 16.6, 17.5).
  _ramp(s) {
    const [dx, dz] = s.dir;
    const len = Math.hypot(s.run, s.H - s.riser);
    const angle = Math.atan2(s.H - s.riser, s.run);
    const midAlong = s.run / 2;
    const [mx, mz] = s.at(midAlong, 0);
    const my = s.nosingY(midAlong) - 0.03;
    // basis: z runs up the slope, x across the stair, y is the ramp's normal
    const zA = new Vector3(dx * Math.cos(angle), Math.sin(angle), dz * Math.cos(angle));
    const xA = new Vector3(dz, 0, -dx);
    const yA = new Vector3().crossVectors(zA, xA);
    const rot = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(xA, yA, zA));
    const half = new Vector3(s.width / 2, 0.03, len / 2);
    const col = this.physics.addStaticBox(new Vector3(mx, my, mz), half, rot, { kind: 'ramp', stair: s.id });
    this.colliders.push(col);
  }

  setGrid(on) {
    this.gridOn = on;
    for (const m of this.meshes) {
      const b = m.userData.baseMat;
      if (b === 'wall' || b === 'exterior') m.material = on ? this.mats.gridWall : this.mats[b];
      if (b === 'floor') m.material = on ? this.mats.gridFloor : this.mats.floor;
    }
  }

  stats() {
    return { meshes: this.meshes.length, colliders: this.colliders.length };
  }
}

export { Color, MeshBasicMaterial };
