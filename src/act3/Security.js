// Cameras and lasers (spec 6, 22, 43). A camera sweeps; if it sees the
// player (in range, inside the cone, with a clear line of sight) for 2 s it
// fires an `alarm` event with the player's position and a loudness of 90.
// A laser fires the same event at loudness 100 the moment the player touches
// the beam. Events go through the shared bus, so the neighbor AI can
// subscribe later. A camera dies when a thrown object hits its power switch.
import { Group, Mesh, BoxGeometry, ConeGeometry, CylinderGeometry, Vector3, Raycaster, MeshBasicMaterial, AdditiveBlending, DoubleSide, Quaternion, Float32BufferAttribute } from 'three';
import { Events } from '../core/Events.js';
import { val } from './Spec.js';
import { look } from './Look.js';
import { partsMesh } from './Props.js';

const DEG = Math.PI / 180;
const _v = new Vector3(), _d = new Vector3();

// additive red cone, 25 percent at the lens fading to zero at the far end
function coneMaterial() {
  return new MeshBasicMaterial({ color: '#ffffff', vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide });
}

// unit cone: tip at the origin, opening along -z to length 1
function coneGeometry(halfAngle) {
  const g = new ConeGeometry(Math.tan(halfAngle), 1, 28, 6, true).translate(0, -0.5, 0).rotateX(Math.PI / 2);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(1, Math.max(0, -pos.getZ(i)));
    col.set([1, 0.16, 0.16, 0.25 * (1 - t) ** 1.4], i * 4);
  }
  g.setAttribute('color', new Float32BufferAttribute(col, 4));
  return g;
}

export class Security {
  constructor(scene, data, plan, occluders) {
    this.scene = scene;
    this.data = data;
    this.occluders = occluders; // meshes that block sight
    this.root = new Group();
    this.root.name = 'act3-security';
    scene.add(this.root);
    this.statics = new Group();
    scene.add(this.statics);
    const elev = Object.fromEntries(plan.floors.map((f) => [f.id, f.floorSlab.y1]));
    this.cameras = [];
    this.lasers = [];
    this.ray = new Raycaster();
    this.alarmCool = 0;
    this.t = 0;
    this.frameN = 0;
    for (const c of data.cameras || []) {
      const y0 = elev[c.floor] ?? 0;
      const g = new Group();
      g.position.set(c.at.x, y0 + c.at.y, c.at.z);
      const [bw, bh, bd] = (c.body || []).map((v) => val(v));
      const arm = partsMesh([{ s: 'box', w: 0.03, h: 0.03, d: val(c.arm, 0.25), x: 0, y: -0.015, z: val(c.arm, 0.25) / 2, c: 'METAL_DARK' }], { single: true });
      arm.position.copy(g.position);
      this.statics.add(arm);
      const head = new Group();
      // body and lens in one mesh
      const bodyM = partsMesh([{ s: 'box', w: bw || 0.1, h: bh || 0.1, d: bd || 0.2, x: 0, y: -(bh || 0.1) / 2, z: -(bd || 0.2) / 2, c: 'WHITE' }, { s: 'box', w: 0.06, h: 0.06, d: 0.03, x: 0, y: -0.03, z: -(bd || 0.2) - 0.015, c: 'BLACK_SOFT' }], { single: true });
      bodyM.traverse((o) => { if (o.isMesh) o.castShadow = false; });
      head.add(bodyM);
      const led = bodyM;
      // the cone: tip at the lens, opening along -z
      const range = val(c.range, 10), fov = val(c.fov, 70) * DEG;
      const cone = new Mesh(coneGeometry(fov / 2), coneMaterial());
      cone.position.z = -(bd || 0.2);
      cone.renderOrder = 5;
      head.add(cone);
      g.add(head);
      this.root.add(g);
      const cam = { id: c.id, def: c, group: g, head, cone, led, range, fov, yaw0: val(c.yaw, 0) * DEG, pitch: val(c.pitch, -30) * DEG, sweep: val(c.sweep, 90) * DEG, period: val(c.period, 8), see: 0, active: true, seeing: false };
      if (c.switchAt) {
        const sw = new Mesh(new BoxGeometry(0.12, 0.16, 0.06));
        look(sw, '#c0392b', { keep: true });
        sw.position.set(c.switchAt.x, y0 + c.switchAt.y, c.switchAt.z);
        this.statics.add(sw);
        cam.switch = sw;
      }
      this.cameras.push(cam);
    }
    const beam = new MeshBasicMaterial({ color: '#ff3040', transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false });
    for (const l of data.lasers || []) {
      const y0 = elev[l.floor] ?? 0;
      const a = new Vector3(l.a.x, y0 + l.a.y, l.a.z), b = new Vector3(l.b.x, y0 + l.b.y, l.b.z);
      const len = a.distanceTo(b);
      const m = new Mesh(new CylinderGeometry(val(data.beam, 0.01) / 2, val(data.beam, 0.01) / 2, len, 6), beam);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
      this.root.add(m);
      for (const p of [a, b]) {
        const e = new Mesh(new BoxGeometry(val(data.emitter, 0.06), val(data.emitter, 0.06), val(data.emitter, 0.06)));
        look(e, 'METAL_DARK');
        e.position.copy(p);
        this.statics.add(e);
      }
      this.lasers.push({ id: l.id, a, b, mesh: m, active: true, cool: 0 });
    }
  }

  // aim of a camera at time t: a slow sinusoidal sweep about its base yaw
  aim(cam, t) {
    const yaw = cam.yaw0 + Math.sin((t / cam.period) * Math.PI * 2) * (cam.sweep / 2);
    return { yaw, pitch: cam.pitch };
  }

  canSee(cam, p) {
    if (!cam.active) return false;
    const origin = cam.head.getWorldPosition(_v);
    _d.copy(p).sub(origin);
    const dist = _d.length();
    if (dist > cam.range || dist < 0.05) return false;
    const fwd = new Vector3(0, 0, -1).applyQuaternion(cam.head.getWorldQuaternion(new Quaternion()));
    if (fwd.dot(_d.clone().normalize()) < Math.cos(cam.fov / 2)) return false;
    this.ray.set(origin, _d.clone().normalize());
    this.ray.far = dist - 0.3;
    this.ray.near = 0.25;
    return this.ray.intersectObjects(this.occluders, false).length === 0;
  }

  update(dt, player, thrown = []) {
    this.t += dt;
    this.alarmCool = Math.max(0, this.alarmCool - dt);
    const eye = player.camera.position;
    const chest = player.curFeet.clone().add(new Vector3(0, 0.7, 0));
    let tracking = false;
    for (const c of this.cameras) {
      const a = this.aim(c, this.t);
      c.head.rotation.set(c.dead ? -1.1 : a.pitch, c.dead ? c.head.rotation.y : a.yaw, 0, 'YXZ');
      c.cone.visible = c.active;
      if (!c.active) continue;
      // the cone stops at the first wall it meets
      if (this.frameN++ % 3 === 0 || !c.coneLen) {
        const o = c.head.getWorldPosition(new Vector3());
        const f = new Vector3(0, 0, -1).applyQuaternion(c.head.getWorldQuaternion(new Quaternion()));
        this.ray.set(o, f); this.ray.near = 0.3; this.ray.far = c.range;
        const hit = this.ray.intersectObjects(this.occluders, false)[0];
        c.coneLen = hit ? hit.distance : c.range;
      }
      c.cone.scale.setScalar(Math.max(0.2, c.coneLen));
      const sees = this.canSee(c, chest) || this.canSee(c, eye);
      c.seeing = sees;
      c.see = sees ? c.see + dt : Math.max(0, c.see - dt * 2);
      c.cone.material.color.setScalar(sees ? 2.2 : 1);
      if (sees) tracking = true;
      if (c.see >= val(this.data.alarm?.beep, 2) && this.alarmCool <= 0) {
        this._alarm(c.id, chest, val(this.data.alarm?.loudCamera, 90));
        c.see = 0;
      }
      // thrown objects that hit the power switch kill the camera
      if (c.switch) for (const o of thrown) if (o.position.distanceTo(c.switch.position) < 0.22) this.disable(c.id);
    }
    this.tracking = tracking;
    for (const l of this.lasers) {
      l.cool = Math.max(0, l.cool - dt);
      if (!l.active) continue;
      l.mesh.material.opacity = 0.65 + Math.sin(this.t * 40) * 0.2;
      // capsule (feet to head, radius 0.22) vs segment, sampled
      const r = player.radius ?? 0.22;
      let hit = false;
      for (let k = 0; k <= 10 && !hit; k++) {
        const q = l.a.clone().lerp(l.b, k / 10);
        const f = player.curFeet;
        const top = f.y + (player.crouching ? 0.8 : 1.2);
        if (q.y >= f.y - 0.02 && q.y <= top && Math.hypot(q.x - f.x, q.z - f.z) < r) hit = true;
      }
      if (hit && l.cool <= 0 && this.alarmCool <= 0) { this._alarm(l.id, player.curFeet.clone(), val(this.data.alarm?.loudLaser, 100)); l.cool = 3; }
    }
  }

  _alarm(source, position, loudness) {
    this.alarmCool = 4;
    this.lastAlarm = { source, position: position.clone(), loudness, t: this.t };
    Events.emit('alarm', { source, position: position.clone(), loudness });
  }

  disable(id) {
    const c = this.cameras.find((x) => x.id === id);
    if (!c || !c.active) return;
    c.active = false;
    c.dead = true; // the head droops
    Events.emit('camera:disabled', { id });
  }

  state() { return { disabled: this.cameras.filter((c) => !c.active).map((c) => c.id) }; }
  restore(s) { for (const id of s?.disabled ?? []) this.disable(id); }
}
