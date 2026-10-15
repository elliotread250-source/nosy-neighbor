// Hinged doors on kinematic bodies: they swing smoothly when used, bang open
// when the neighbor shoves through, and can be locked (colored keys),
// boarded (crowbar), chained (basement). Screen doors slap shut on a spring.
import { Group, Mesh, Vector3, Quaternion, SphereGeometry, TorusGeometry, CylinderGeometry, MathUtils } from 'three';
import { RAPIER, GROUP, groups } from '../core/Physics.js';
import { Events } from '../core/Events.js';
import { makeMat } from '../art/Materials.js';
import { roundedBox, chamferCylinder } from '../art/Geo.js';
import * as Tex from '../art/CanvasTextures.js';
import { CONFIG } from '../config.js';

const DEG = Math.PI / 180;
const _p = new Vector3();
const _q = new Quaternion();

export const KEY_COLORS = {
  red: 'KEY_RED', blue: 'KEY_BLUE', green: 'KEY_GREEN', yellow: 'KEY_YELLOW', purple: 'KEY_PURPLE', basement: 'KEY_BASEMENT', attic: 'BRASS',
};

export class Door {
  /**
   * o: { id, hinge: Vector3 (bottom of hinge edge), rotY (closed: slab extends along local +x),
   *      w, h, color, lock, boarded, swing (+1 opens toward local -z... ), screen, saloon, front, room }
   */
  constructor(mgr, o) {
    this.mgr = mgr;
    this.id = o.id;
    this.o = o;
    this.w = o.w;
    this.h = o.h;
    this.lock = o.lock || null; // key color string, or null
    this.boards = 0;
    this.chains = o.chains || 0;
    this.angle = 0; // radians, 0 closed
    this.target = 0;
    this.speed = 3.2;
    this.openAngle = (o.openAngle ?? 100) * DEG;
    this.swing = o.swing ?? 1;
    this.screen = !!o.screen;
    this.pivot = new Group();
    this.pivot.position.copy(o.hinge);
    this.baseRotY = o.rotY;
    this.pivot.rotation.y = o.rotY;
    mgr.root.add(this.pivot);
    this._buildMesh(o);
    // kinematic collider
    const w = mgr.physics.world;
    this.body = w.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
    const thick = o.screen ? 0.05 : 0.09;
    this.collider = w.createCollider(
      RAPIER.ColliderDesc.cuboid(o.w / 2 - 0.02, o.h / 2 - 0.02, thick / 2 + 0.02)
        .setTranslation(o.w / 2, o.h / 2, 0)
        .setCollisionGroups(groups(GROUP.STATIC, GROUP.PLAYER | GROUP.PROP | GROUP.NEIGHBOR)),
      this.body,
    );
    mgr.physics.colliderData.set(this.collider.handle, { kind: 'door', door: this });
    this._syncBody(true);
    if (o.boarded) this.addBoards(3);
  }

  _buildMesh(o) {
    const g = new Group();
    const col = o.color ?? 'WOOD_MID';
    if (o.screen) {
      const frameMat = makeMat('WHITE');
      for (const [w, h, x, y] of [[0.08, o.h, 0.04, o.h / 2], [0.08, o.h, o.w - 0.04, o.h / 2], [o.w, 0.08, o.w / 2, o.h - 0.04], [o.w, 0.1, o.w / 2, 0.05], [o.w, 0.08, o.w / 2, o.h * 0.45]]) {
        const m = new Mesh(roundedBox(w, h, 0.06, 0.02, 2), frameMat);
        m.position.set(x, y, 0);
        g.add(m);
      }
      const mesh = new Mesh(roundedBox(o.w - 0.1, o.h - 0.12, 0.01, 0.004, 1), makeMat('METAL_DARK', { transparent: true, opacity: 0.35, depthWrite: false }));
      mesh.position.set(o.w / 2, o.h / 2, 0);
      g.add(mesh);
    } else if (o.saloon) {
      const m = new Mesh(roundedBox(o.w - 0.02, 1.1, 0.06, 0.03, 2), makeMat(col));
      m.position.set(o.w / 2, 1.35, 0);
      g.add(m);
    } else {
      const slab = new Mesh(roundedBox(o.w - 0.02, o.h - 0.02, 0.09, 0.03, 3, { midStep: 0.5 }), makeMat(col, { spec: o.front ? 0.25 : 0.08 }));
      slab.position.set(o.w / 2, o.h / 2, 0);
      g.add(slab);
      // raised panels
      const pm = makeMat(col);
      for (const [py, ph] of [[o.h * 0.68, o.h * 0.38], [o.h * 0.24, o.h * 0.3]]) {
        const p = new Mesh(roundedBox(o.w - 0.32, ph, 0.03, 0.02, 2), pm);
        for (const s of [-1, 1]) {
          const c = p.clone();
          c.position.set(o.w / 2, py, s * 0.055);
          g.add(c);
        }
      }
      const kmat = makeMat('BRASS', { spec: 0.6, rim: 0.3 });
      for (const s of [-1, 1]) {
        const knob = new Mesh(new SphereGeometry(0.055, 14, 10), kmat);
        knob.position.set(o.w - 0.12, 1.05, s * 0.09);
        g.add(knob);
      }
      if (o.front) {
        // half-moon window, knocker, mail slot
        const hm = new Mesh(new CylinderGeometry(0.28, 0.28, 0.1, 20, 1, false, -Math.PI / 2, Math.PI), makeMat('WHITE', { map: Tex.glassGlare(), transparent: true }));
        hm.rotation.x = Math.PI / 2;
        hm.position.set(o.w / 2, o.h - 0.32, 0);
        g.add(hm);
        const knock = new Mesh(new TorusGeometry(0.08, 0.02, 8, 16), kmat);
        knock.position.set(o.w / 2, 1.75, 0.08);
        g.add(knock);
        const slot = new Mesh(roundedBox(0.32, 0.06, 0.12, 0.02, 2), kmat);
        slot.position.set(o.w / 2, 1.2, 0);
        g.add(slot);
        // padlock hasp
        const hasp = new Mesh(roundedBox(0.06, 0.2, 0.05, 0.015, 1), makeMat('METAL_DARK'));
        hasp.position.set(o.w - 0.06, 1.45, 0.08);
        const pad = new Mesh(roundedBox(0.12, 0.13, 0.05, 0.03, 2), makeMat('BRASS', { spec: 0.6 }));
        pad.position.set(o.w - 0.06, 1.32, 0.11);
        g.add(hasp, pad);
        this.padlock = pad;
      }
      if (o.lock && o.lock !== 'yellow') {
        // colored lock plate tells you which key
        const lp = new Mesh(roundedBox(0.12, 0.2, 0.04, 0.03, 2), makeMat(KEY_COLORS[o.lock], { emissive: KEY_COLORS[o.lock], emissiveIntensity: 0.25 }));
        for (const s of [-1, 1]) {
          const c = lp.clone();
          c.position.set(o.w - 0.12, 1.25, s * 0.07);
          g.add(c);
        }
      }
    }
    g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    this.slab = g;
    this.pivot.add(g);
  }

  addBoards(n = 3) {
    if (!this.boardGroup) {
      this.boardGroup = new Group();
      this.mgr.root.add(this.boardGroup);
    }
    const mat = makeMat('NH_PLANKS');
    const pos = new Vector3(), q = new Quaternion();
    for (let i = 0; i < n; i++) {
      const b = new Mesh(roundedBox(this.w + 0.5, 0.2, 0.05, 0.02, 2), mat);
      b.position.set(this.w / 2, 0.8 + i * 0.7 + (i % 2) * 0.1, 0.16);
      b.rotation.z = (i % 2 ? -1 : 1) * (8 + i * 4) * DEG;
      this.pivot.updateMatrixWorld(true);
      b.position.applyMatrix4(this.pivot.matrixWorld);
      this.pivot.getWorldQuaternion(q);
      b.quaternion.copy(q).multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), b.rotation.z));
      b.castShadow = true;
      this.boardGroup.add(b);
      // nail heads
      for (const sx of [-1, 1]) {
        const nail = new Mesh(new SphereGeometry(0.02, 6, 4), makeMat('METAL_DARK'));
        nail.position.set(sx * (this.w / 2 + 0.1), 0, 0.03);
        b.add(nail);
      }
    }
    this.boards += n;
    pos.set(0, 0, 0);
  }

  removeBoard() {
    if (!this.boards) return false;
    const b = this.boardGroup.children[this.boardGroup.children.length - 1];
    this.boardGroup.remove(b);
    this.boards--;
    Events.emit('noise', { position: this.worldCenter(), loudness: 0.7, kind: 'pry' });
    return true;
  }

  get locked() {
    return !!this.lock || this.boards > 0 || this.chains > 0;
  }

  get isOpen() {
    return Math.abs(this.target) > 0.01;
  }

  worldCenter(out = new Vector3()) {
    out.set(this.w / 2, this.h / 2, 0);
    return this.pivot.localToWorld(out);
  }

  // Which side of the door is p on? +1 front (local +z), -1 back.
  sideOf(p) {
    const local = this.pivot.worldToLocal(p.clone());
    return local.z >= 0 ? 1 : -1;
  }

  // Open away from whoever is pushing.
  open(from, bang = false) {
    if (this.locked) return false;
    const side = from ? this.sideOf(from) : this.swing;
    this.target = -side * this.openAngle;
    if (this.o.saloon || this.o.both === false) this.target = this.swing * this.openAngle;
    this.speed = bang ? 12 : 3.2;
    if (bang) {
      this.bangVel = 1;
      Events.emit('noise', { position: this.worldCenter(), loudness: 0.85, kind: 'doorBang' });
      Events.emit('sfx', { name: 'doorBang', position: this.worldCenter() });
    } else Events.emit('sfx', { name: this.screen ? 'screenOpen' : 'doorCreak', position: this.worldCenter() });
    if (this.screen) this.autoClose = 1.4;
    return true;
  }

  close() {
    this.target = 0;
    this.speed = 3.2;
    Events.emit('sfx', { name: 'doorClose', position: this.worldCenter() });
  }

  toggle(from) {
    if (this.isOpen) { this.close(); return true; }
    return this.open(from);
  }

  unlock(color) {
    if (this.lock && this.lock === color) {
      this.lock = null;
      if (this.padlock) this.padlock.visible = false;
      Events.emit('sfx', { name: 'unlock', position: this.worldCenter() });
      return true;
    }
    return false;
  }

  update(dt) {
    if (this.autoClose > 0) {
      this.autoClose -= dt;
      if (this.autoClose <= 0) {
        this.target = 0;
        this.speed = 9;
        this.slapPending = true;
      }
    }
    const before = this.angle;
    const d = this.target - this.angle;
    const step = Math.sign(d) * Math.min(Math.abs(d), this.speed * dt);
    this.angle += step;
    if (this.slapPending && Math.abs(this.angle) < 0.01) {
      this.slapPending = false;
      Events.emit('sfx', { name: 'screenSlap', position: this.worldCenter() });
      Events.emit('noise', { position: this.worldCenter(), loudness: 0.5, kind: 'door' });
    }
    if (before !== this.angle) {
      this.pivot.rotation.y = this.baseRotY + this.angle;
      this._syncBody(false);
    }
  }

  _syncBody(teleport) {
    this.pivot.updateMatrixWorld(true);
    this.pivot.getWorldPosition(_p);
    this.pivot.getWorldQuaternion(_q);
    if (teleport) {
      this.body.setTranslation(_p, true);
      this.body.setRotation(_q, true);
    }
    this.body.setNextKinematicTranslation(_p);
    this.body.setNextKinematicRotation(_q);
  }
}

export class DoorManager {
  constructor(scene, physics) {
    this.root = new Group();
    this.root.name = 'doors';
    scene.add(this.root);
    this.physics = physics;
    this.doors = new Map();
  }

  add(o) {
    const d = new Door(this, o);
    this.doors.set(o.id, d);
    return d;
  }

  get(id) {
    return this.doors.get(id);
  }

  update(dt) {
    for (const d of this.doors.values()) d.update(dt);
  }

  // Doors near a point (neighbor shoves them open as he walks).
  near(p, r = 1.4) {
    const out = [];
    for (const d of this.doors.values()) if (d.worldCenter(_p).distanceTo(p) < r) out.push(d);
    return out;
  }
}

export { chamferCylinder, MathUtils, CONFIG };
