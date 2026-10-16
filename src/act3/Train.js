// The roof train (spec 19.3, 41): an engine and two carriages on kinematic
// bodies following the route spline at a constant speed, each car oriented
// to the tangent at its own distance behind the engine. A player standing on
// a carriage rides it (platform carry). Starts when the button and lever are
// used in order; runs `laps` laps and stops at the station.
import { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, Vector3, Quaternion, Matrix4 } from 'three';
import { RAPIER } from '../core/Physics.js';
import { val } from './Spec.js';
import { look } from './Look.js';
import { trackCurve } from './Roof.js';

const UP = new Vector3(0, 1, 0);

export class Train {
  constructor(scene, physics, train) {
    this.scene = scene;
    this.physics = physics;
    this.data = train;
    this.curve = trackCurve(train.route.controlPoints, true);
    this.L = this.curve.getLength();
    this.speed = val(train.speed, 1.0);
    this.laps = train.laps ?? 3;
    this.gap = val(train.carGap, 0.1);
    // the station: nearest point of the route to P1
    const st = train.route.controlPoints.find((p) => /P1/.test(p.note ?? '')) ?? train.route.controlPoints[0];
    this.stationS = this._nearestS(new Vector3(st.x, st.y, st.z));
    this.s = this.stationS;
    this.v = 0;
    this.running = false;
    this.travelled = 0;
    this.cars = [];
    const defs = [{ ...train.engine, engine: true }, ...train.carriages];
    let back = 0;
    for (const [i, d] of defs.entries()) {
      const [l, w, h] = d.size.map((x) => val(x));
      const g = new Group();
      const body = new Mesh(new BoxGeometry(w, h * 0.8, l).translate(0, h * 0.4 + 0.1, 0));
      look(body, d.color);
      body.castShadow = true;
      g.add(body);
      const stripe = new Mesh(new BoxGeometry(w + 0.01, 0.06, l + 0.01).translate(0, h * 0.5, 0));
      look(stripe, 'YELLOW_TOY');
      g.add(stripe);
      for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
        const wh = new Mesh(new CylinderGeometry(0.09, 0.09, 0.05, 12).rotateZ(Math.PI / 2).translate(sx * (w / 2 - 0.02), 0.1, sz * (l / 2 - 0.15)));
        look(wh, 'BLACK_SOFT');
        g.add(wh);
      }
      if (d.engine) {
        const ch = new Mesh(new CylinderGeometry(0.07, 0.09, 0.25, 12).translate(0, h + 0.05, l * 0.3));
        look(ch, d.chimney ?? 'YELLOW_TOY');
        g.add(ch);
        const cab = new Mesh(new BoxGeometry(w * 0.9, 0.25, l * 0.35).translate(0, h * 0.8 + 0.1 + 0.12, -l * 0.25));
        look(cab, d.color);
        g.add(cab);
      }
      scene.add(g);
      const rb = physics.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
      const top = h * 0.8 + 0.1;
      physics.world.createCollider(RAPIER.ColliderDesc.cuboid(w / 2, top / 2, l / 2).setTranslation(0, top / 2, 0).setFriction(1.0), rb);
      this.cars.push({ group: g, rb, l, w, h, top, offset: back, pos: new Vector3(), yaw: 0, prev: new Vector3(), prevYaw: 0, engine: !!d.engine, carries: d.carries });
      back += l + this.gap;
    }
    this.puffs = [];
    this._place(true);
  }

  _nearestS(p) {
    let best = 0, bd = Infinity;
    for (let i = 0; i <= 600; i++) {
      const q = this.curve.getPointAt(i / 600);
      const d = q.distanceToSquared(p);
      if (d < bd) { bd = d; best = (i / 600) * this.L; }
    }
    return best;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.travelled = 0;
  }

  // positions and yaw of each car at the current s
  _place(snap = false) {
    for (const c of this.cars) {
      const s = (((this.s - c.offset - c.l / 2) % this.L) + this.L) % this.L;
      const u = s / this.L;
      const p = this.curve.getPointAt(u);
      const t = this.curve.getTangentAt(u);
      c.prev.copy(c.pos);
      c.prevYaw = c.yaw;
      c.pos.copy(p);
      c.yaw = Math.atan2(t.x, t.z);
      c.pitch = Math.asin(Math.max(-1, Math.min(1, t.y)));
      if (snap) { c.prev.copy(c.pos); c.prevYaw = c.yaw; }
      const q = new Quaternion().setFromAxisAngle(UP, c.yaw);
      c.rb.setNextKinematicTranslation({ x: p.x, y: p.y, z: p.z });
      c.rb.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
      if (snap) { c.rb.setTranslation({ x: p.x, y: p.y, z: p.z }, true); c.rb.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true); }
    }
  }

  // fixed step: advance, and work out whether the player is riding a car
  fixed(dt, player) {
    const target = this.running ? this.speed : 0;
    // stop smoothly at the station on the last lap
    if (this.running && this.travelled > this.laps * this.L - 2.0) {
      const left = this.laps * this.L - this.travelled;
      if (left <= 0.01) { this.running = false; this.v = 0; this.done = true; }
      else this.v = Math.min(this.speed, Math.max(0.15, left * 0.6));
    } else this.v += (target - this.v) * Math.min(1, dt * 1.5);
    const ds = this.v * dt;
    this.s = (this.s + ds) % this.L;
    if (this.running) this.travelled += ds;
    this._place();
    // platform carry
    if (player && !player.noclip) {
      const f = player.curFeet;
      for (const c of this.cars) {
        const local = f.clone().sub(c.prev).applyAxisAngle(UP, -c.prevYaw);
        if (Math.abs(local.x) < c.w / 2 + 0.05 && Math.abs(local.z) < c.l / 2 + 0.05 && Math.abs(f.y - (c.prev.y + c.top)) < 0.2) {
          const now = local.clone().applyAxisAngle(UP, c.yaw).add(c.pos);
          const d = now.sub(f);
          player.platformDelta = { x: d.x, y: Math.max(0, d.y), z: d.z };
          player.yaw += c.yaw - c.prevYaw;
          this.riding = c;
          return;
        }
      }
      this.riding = null;
    }
  }

  // render step: interpolate meshes, puff steam
  update(dt, alpha = 1) {
    for (const c of this.cars) {
      const p = c.prev.clone().lerp(c.pos, alpha);
      c.group.position.copy(p);
      c.group.rotation.set(0, c.prevYaw + (c.yaw - c.prevYaw) * alpha, 0);
    }
    if (this.v > 0.2) {
      this._puffT = (this._puffT ?? 0) - dt;
      if (this._puffT <= 0) {
        this._puffT = 0.6 / this.v;
        const e = this.cars[0];
        const m = new Mesh(new SphereGeometry(0.08, 8, 6));
        look(m, 'WHITE', { opacity: 0.6 });
        m.position.copy(e.group.position).add(new Vector3(Math.sin(e.yaw) * e.l * 0.3, e.h + 0.2, Math.cos(e.yaw) * e.l * 0.3));
        this.scene.add(m);
        this.puffs.push({ m, t: 0 });
      }
    }
    for (const p of this.puffs) { p.t += dt; p.m.position.y += dt * 0.4; p.m.scale.setScalar(1 + p.t * 1.5); }
    while (this.puffs.length && this.puffs[0].t > 2) { const p = this.puffs.shift(); this.scene.remove(p.m); }
  }

  carGroup(i) { return this.cars[i]?.group; }
  lastCar() { return this.cars[this.cars.length - 1]; }
}

export { Matrix4 };
