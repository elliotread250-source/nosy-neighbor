// What fills an opening (spec 6, 37, 39): closed door leaves, glass, boards
// over windows, the Dutch gate's pickets, the broken entry window, and the
// sealed basement door with its boards, six bolts and keycard panel. Plus
// stair banisters. Everything is placed from the planned opening (its run,
// its span and its height), so it moves when the data moves.
import { Group, Mesh, Vector3, Quaternion, InstancedMesh, BoxGeometry, CylinderGeometry, Matrix4, Euler } from 'three';
import { val } from './Spec.js';
import { look } from './Look.js';
import { partsMesh } from './Props.js';

const box = (w, h, d, x, y, z, c, o = {}) => ({ s: 'box', w, h, d, x, y, z, c, ...o });

export class OpeningsView {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.root = new Group();
    this.root.name = 'act3-openings';
    scene.add(this.root);
    this.colliders = [];
    this.byId = new Map();
    this.solids = [];
  }

  build(spec, plan) {
    const rooms = new Map(spec.floors.flatMap((f) => f.rooms.map((r) => [r.id, r])));
    for (const f of plan.floors) for (const o of f.walls.openings) {
      const room = rooms.get(o.room);
      const xs = room.polygon.map((p) => p[0]), zs = room.polygon.map((p) => p[1]);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
      // +1 when the declaring room is on the +normal side of the wall
      const side = o.orient === 'x' ? Math.sign(cz - o.c) : Math.sign(cx - o.c);
      const e = { ...o, side, mid: (o.p0 + o.p1) / 2, w: o.p1 - o.p0, h: o.y1 - o.y0 };
      this.byId.set(o.id, e);
      try { this._fill(e); } catch (err) { console.warn(`opening ${o.id}: ${err.message}`); }
    }
    for (const s of plan.stairs) this._banister(s, spec.stairs.find((x) => x.id === s.id));
    return this;
  }

  // local frame of an opening: u along the wall, n across it (toward the
  // declaring room), y up. Returns a group placed at the opening's center
  // bottom, rotated so local x = along, local z = normal.
  _frame(e) {
    const g = new Group();
    if (e.orient === 'x') { g.position.set(e.mid, e.y0, e.c); g.rotation.y = e.side < 0 ? Math.PI : 0; }
    else { g.position.set(e.c, e.y0, e.mid); g.rotation.y = e.side > 0 ? Math.PI / 2 : -Math.PI / 2; }
    this.root.add(g);
    return g;
  }

  _solid(e, w, h, d, lx = 0, ly = 0, lz = 0, data = {}) {
    // a collider in the opening's local frame
    const g = e.frameGroup;
    g.updateMatrixWorld(true);
    const c = new Vector3(lx, ly + h / 2, lz).applyMatrix4(g.matrixWorld);
    const q = g.getWorldQuaternion(new Quaternion());
    const col = this.physics.addStaticBox(c, new Vector3(w / 2, h / 2, d / 2), q, { kind: 'opening', opening: e.id, ...data });
    this.colliders.push(col);
    const yaw = new Euler().setFromQuaternion(q).y;
    const cs = Math.abs(Math.cos(yaw)), sn = Math.abs(Math.sin(yaw));
    this.solids.push({ id: e.id, x0: c.x - (w / 2) * cs - (d / 2) * sn, x1: c.x + (w / 2) * cs + (d / 2) * sn, y0: c.y - h / 2, y1: c.y + h / 2, z0: c.z - (w / 2) * sn - (d / 2) * cs, z1: c.z + (w / 2) * sn + (d / 2) * cs, kind: data.kind ?? 'opening' });
    return col;
  }

  _fill(e) {
    const op = e.op;
    const state = op.state ?? (e.type === 'window' ? 'intact' : 'open');
    e.frameGroup = this._frame(e);
    const g = e.frameGroup;
    const t = e.t;
    if (e.type === 'door' && ['bolted', 'locked', 'sealed'].includes(state)) {
      const leaf = partsMesh([box(e.w - 0.01, e.h - 0.01, 0.06, 0, 0, 0, op.leaf ?? 'NH_PLANKS'), box(0.05, 0.05, 0.05, e.w / 2 - 0.12, 1.0, 0.05, 'BRASS'), box(0.05, 0.05, 0.05, e.w / 2 - 0.12, 1.0, -0.05, 'BRASS')]);
      g.add(leaf);
      e.leaf = leaf;
      e.leafCollider = this._solid(e, e.w, e.h, 0.08, 0, 0, 0, { kind: 'door', state });
      if (state === 'sealed') this._sealed(e);
      return;
    }
    if (e.type === 'window') {
      if (state === 'intact' || state === 'cracked' || state === 'boarded') {
        const pane = partsMesh([box(e.w, e.h, 0.012, 0, 0, 0, 'GLASS', { opacity: 0.32 })]);
        g.add(pane);
        if (state === 'cracked') g.add(partsMesh([box(e.w * 0.8, 0.008, 0.016, 0, e.h * 0.55, 0, 'WHITE'), box(0.008, e.h * 0.6, 0.016, e.w * 0.15, e.h * 0.2, 0, 'WHITE')]));
        this._solid(e, e.w, e.h, 0.05, 0, 0, 0, { kind: 'glass' });
      }
      if (state === 'boarded') {
        // three horizontal boards on the outside face (1x6, 19 x 140 mm)
        const n = op.boards ?? 3;
        const parts = [];
        for (let i = 0; i < n; i++) parts.push(box(e.w + 0.2, 0.14, 0.019, 0, (e.h * (i + 0.5)) / n - 0.07, -(t / 2 + 0.012), 'NH_PLANKS_OLD'));
        g.add(partsMesh(parts));
      }
      if (state === 'broken') {
        // jagged triangles left in the corners, and the sill shards (props)
        const parts = [];
        for (const [x, y, s] of [[-1, 1, 0.22], [1, 1, 0.16], [-1, 0, 0.14], [1, 0, 0.2]]) parts.push(box(s, s * 0.7, 0.01, x * (e.w / 2 - s / 2), y ? e.h - s * 0.7 : 0, 0, 'GLASS', { opacity: 0.5 }));
        g.add(partsMesh(parts));
        e.broken = true;
      }
      // a sill board inside
      g.add(partsMesh([box(e.w + 0.1, 0.03, t / 2 + 0.06, 0, -0.03, t / 4, 'NH_TRIM')]));
      return;
    }
    if (e.type === 'gate') {
      // Dutch gate: steel pickets fill the lower part, the upper part is open
      const bh = val(op.barrier?.height, 1.6), rail = val(op.barrier?.rail, 0.04), sp = val(op.barrier?.pickets, 0.1);
      const parts = [box(e.w, rail, rail, 0, bh - rail, 0, 'METAL_DARK'), box(e.w, rail, rail, 0, 0.08, 0, 'METAL_DARK')];
      for (let x = -e.w / 2 + sp / 2; x < e.w / 2; x += sp) parts.push(box(0.02, bh - 0.02, 0.02, x, 0, 0, 'METAL_DARK'));
      parts.push(box(0.08, 0.12, 0.06, e.w / 2 - 0.15, bh - 0.5, -0.06, 'BRASS')); // latch, far side
      g.add(partsMesh(parts));
      e.barrierTop = e.y0 + bh;
      this._solid(e, e.w, bh, 0.06, 0, 0, 0, { kind: 'gate' });
    }
  }

  // the sealed basement door (section 37.7): boards across it on bolts into
  // the frame, and a keycard panel on the north jamb
  _sealed(e) {
    const g = e.frameGroup, op = e.op, b = op.boards || {};
    const heights = (b.heights || []).map((h) => val(h));
    const L = val(b.length, 1.15), sec = val(b.section, 0.14), th = val(b.thickness, 0.038);
    const head = val(b.boltHead, 0.024), washer = val(b.washer, 0.04);
    const face = e.t / 2 + 0.005;
    e.boards = [];
    e.bolts = [];
    heights.forEach((hy, i) => {
      const board = partsMesh([box(L, sec, th, 0, 0, 0, 'NH_PLANKS')]);
      board.position.set(0, hy - sec / 2, face + th / 2);
      g.add(board);
      const boltsOfBoard = [];
      for (const sx of [-1, 1]) {
        const bolt = new Group();
        const w = new Mesh(new CylinderGeometry(washer / 2, washer / 2, 0.004, 14).rotateX(Math.PI / 2));
        look(w, 'METAL');
        const hd = new Mesh(new CylinderGeometry(head / 2, head / 2, 0.014, 6).rotateX(Math.PI / 2).translate(0, 0, 0.009));
        look(hd, 'METAL_DARK');
        bolt.add(w, hd);
        bolt.position.set(sx * (L / 2 - 0.06), hy, face + th + 0.002);
        g.add(bolt);
        const id = `basement_bolt_${e.bolts.length + 1}`;
        const rec = { id, mesh: bolt, board: i, removed: false };
        e.bolts.push(rec);
        boltsOfBoard.push(rec);
      }
      e.boards.push({ mesh: board, bolts: boltsOfBoard, collider: this._solid(e, L, sec, th, 0, hy - sec / 2, face + th / 2, { kind: 'board' }) });
    });
    const lk = op.lock || {};
    const ph = val(lk.height, 1.25), pw = val(lk.panelW, 0.12), pv = val(lk.panelH, 0.18);
    // north jamb: the +z side of the opening; in the local frame that is -x
    // when the declaring room is east of the wall
    const jx = (e.w / 2 + 0.08) * (e.side > 0 ? -1 : 1);
    const panel = partsMesh([box(pw, pv, 0.03, 0, 0, 0, 'METAL_DARK'), box(0.08, 0.05, 0.005, 0, pv * 0.25, 0.017, '#203040')]);
    panel.position.set(jx, ph - pv / 2, face + 0.015);
    g.add(panel);
    const led = new Mesh(new BoxGeometry(0.02, 0.02, 0.01));
    look(led, '#ff2020', { emissive: '#ff2020', keep: true });
    led.position.set(jx, ph + pv / 2 - 0.03, face + 0.035);
    g.add(led);
    e.panel = panel;
    e.led = led;
  }

  // banister along the open side of a flight (section 17.4): a handrail
  // 0.9 m above the nosing line, balusters every gap, collider panels
  _banister(s, def) {
    const bn = def?.banister;
    if (!bn) return;
    const H = val(bn.height, 0.9), gap = val(bn.gap, 0.1), a0 = val(bn.startAlong, 0);
    const want = { east: [1, 0], west: [-1, 0], north: [0, 1], south: [0, -1] }[bn.side] ?? [1, 0];
    const [dx, dz] = s.dir;
    const px = -dz, pz = dx;
    const sign = Math.sign(px * want[0] + pz * want[1]) || 1;
    const across = sign * (s.width / 2 - 0.03);
    const pts = [];
    for (let a = a0; a <= s.run + 1e-6; a += gap + 0.03) pts.push(a);
    const im = new InstancedMesh(new BoxGeometry(0.035, 1, 0.035).translate(0, 0.5, 0), null, pts.length);
    look(im, 'WOOD_MID');
    const m = new Matrix4();
    pts.forEach((a, i) => {
      const k = Math.min(s.n - 1, Math.max(1, Math.ceil(a / s.tread + 1e-9)));
      const base = s.y0 + k * s.riser;
      const top = s.nosingY(a) + H;
      const [x, z] = s.at(a, across);
      m.makeScale(1, top - base, 1).setPosition(x, base, z);
      im.setMatrixAt(i, m);
    });
    im.castShadow = true;
    this.root.add(im);
    // the rail itself: a sloped box from a0 to the top
    const [x0, z0] = s.at(a0, across), [x1, z1] = s.at(s.run, across);
    const y0 = s.nosingY(a0) + H, y1 = s.nosingY(s.run) + H;
    const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
    const rail = new Mesh(new BoxGeometry(0.07, 0.06, len));
    look(rail, 'WOOD_DARK');
    rail.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    rail.lookAt(x1, y1, z1);
    rail.castShadow = true;
    this.root.add(rail);
    // one thin collider per tread so nobody falls off the open side
    for (let k = 1; k <= s.n - 1; k++) {
      const a = (k - 0.5) * s.tread;
      if (a < a0) continue;
      const [x, z] = s.at(a, sign * (s.width / 2 - 0.03));
      const base = s.y0 + k * s.riser;
      const hx = Math.abs(dx) > 0 ? s.tread / 2 : 0.03, hz = Math.abs(dz) > 0 ? s.tread / 2 : 0.03;
      this.colliders.push(this.physics.addStaticBox(new Vector3(x, base + H / 2, z), new Vector3(hx, H / 2, hz), null, { kind: 'banister', stair: s.id }));
    }
  }
}
