// Everything the player does with their hands: look at something within
// reach, see a soft white outline and a prompt, press E (or click) to act.
// Small props go into the four slots and can be thrown (hold to charge,
// with an arc preview); big ones (crates, chairs, large boxes) are carried
// in front of you. Tools: crowbar pries boards, wrench turns valves, the
// magnet gun pulls metal from 12 m, the flashlight lights the way.
import {
  Vector3, Quaternion, Box3, Ray, Group, Mesh, ShaderMaterial, BackSide, Points, BufferGeometry,
  Float32BufferAttribute, PointsMaterial, SpotLight, CanvasTexture, Object3D, MathUtils, SphereGeometry, MeshBasicMaterial,
} from 'three';
import { RAPIER, GROUP, groups } from '../core/Physics.js';
import { Events } from '../core/Events.js';
import { CONFIG } from '../config.js';
import { Inventory } from './Inventory.js';
import { Hiding } from './Hiding.js';
import { KEY_NAMES } from './Items.js';

const REACH = 2.2;
const _o = new Vector3();
const _d = new Vector3();
const _v = new Vector3();
const _w = new Vector3();
const _q = new Quaternion();
const _ray = new Ray();
const UP = new Vector3(0, 1, 0);

const HIDE_LABELS = {
  wardrobe: 'Hide in the wardrobe', underBed: 'Hide under the bed', underTable: 'Hide under the table', behind: 'Hide behind it',
  hamper: 'Climb into the hamper', box: 'Climb into the box', trunk: 'Climb into the trunk', curtain: 'Hide behind the curtain',
};

// --------------------------------------------------------------- outline highlight
class Highlighter {
  constructor(scene) {
    this.group = new Group();
    this.group.name = 'highlight';
    scene.add(this.group);
    this.mat = new ShaderMaterial({
      uniforms: { uOpacity: { value: 0.5 }, uWidth: { value: 0.012 } },
      vertexShader: 'uniform float uWidth; void main(){ vec3 p = position + normalize(normal) * uWidth; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
      fragmentShader: 'uniform float uOpacity; void main(){ gl_FragColor = vec4(1.0, 0.99, 0.93, uOpacity); }',
      side: BackSide, transparent: true, depthWrite: false,
    });
    this.cache = new WeakMap();
    this.pairs = [];
    this.obj = null;
  }

  set(obj) {
    if (obj === this.obj) return;
    this.obj = obj;
    this.group.clear();
    this.pairs = [];
    if (!obj) return;
    let pairs = this.cache.get(obj);
    if (!pairs) {
      pairs = [];
      obj.traverse((m) => {
        if (!m.isMesh || m.userData.outline || m.material?.userData?.isOutline || !m.geometry?.attributes?.normal) return;
        if (pairs.length > 40) return;
        const h = new Mesh(m.geometry, this.mat);
        h.matrixAutoUpdate = false;
        h.matrixWorldAutoUpdate = false;
        h.renderOrder = 5;
        h.frustumCulled = false;
        pairs.push([m, h]);
      });
      this.cache.set(obj, pairs);
    }
    this.pairs = pairs;
    for (const [, h] of pairs) this.group.add(h);
  }

  update(t) {
    this.mat.uniforms.uOpacity.value = 0.32 + 0.22 * Math.sin(t * 5.5);
    for (const [m, h] of this.pairs) {
      h.matrixWorld.copy(m.matrixWorld);
      h.visible = m.visible && isShown(m);
    }
  }
}

function isShown(o) {
  while (o) {
    if (!o.visible) return false;
    o = o.parent;
  }
  return true;
}

// --------------------------------------------------------------- the system
export class Interaction {
  constructor(game) {
    this.game = game;
    this.player = game.player;
    this.input = game.input;
    this.physics = game.physics;
    this.inv = new Inventory(game);
    this.hiding = new Hiding(game);
    game.hiding = this.hiding;
    this.targets = [];
    this.current = null; // { label, act, obj, hold, dist }
    this.highlight = new Highlighter(game.engine.scene);
    this.charging = false;
    this.charge = 0;
    this.carry = null;
    this.holdT = 0;
    this.holdTarget = null;
    this.thrown = [];
    this.handPush = 0; // hand animation: >0 reach forward, <0 pull back
    this.time = 0;
    this.doorTargets = new WeakMap();
    this._buildArc();
    this._buildFlashlight();
    this.sparkles = [];
  }

  // A thing in the world you can act on, found by its bounding box.
  addTarget(t) {
    if (!t.box) t.box = new Box3().setFromObject(t.obj).expandByScalar(t.pad ?? 0.05);
    this.targets.push(t);
    return t;
  }

  removeTarget(t) {
    const i = this.targets.indexOf(t);
    if (i >= 0) this.targets.splice(i, 1);
    if (this.current === t) this.current = null;
  }

  // ------------------------------------------------------------ per frame
  update(dt) {
    this.time += dt;
    const g = this.game;
    const p = this.player;
    const inp = this.input;
    this._updateThrown();
    this._updateSparkles(dt);
    this.highlight.update(this.time);
    if (!p.enabled || g.state !== 'play' || p.noclip) {
      this._setCurrent(null);
      this.arc.visible = false;
      this.charging = false;
      return;
    }
    // slots
    for (let i = 0; i < 4; i++) if (inp.pressed(`slot${i + 1}`)) this.inv.select(i);
    const wheel = inp.consumeWheel();
    if (wheel && !this.charging) this.inv.cycle(wheel > 0 ? 1 : -1);
    this._updateFlashlight();

    if (this.hiding.active) {
      this._setCurrent({ label: 'Leave the hiding spot', act: () => this.hiding.exit(), obj: null });
      if (inp.pressed('interact') || inp.pressed('jump')) this.hiding.exit();
      return;
    }
    if (this.carry) this._updateCarry(dt);

    const target = this.carry ? null : this._findTarget();
    this._setCurrent(target);

    // timed actions (prying boards, unlocking): hold E on the same target
    if (this.holdTarget) {
      if (inp.down('interact') && this.current && this.current.obj === this.holdTarget.obj && this.current.label === this.holdTarget.label) {
        this.holdT += dt;
        this.handPush = 0.6 + Math.sin(this.time * 30) * 0.2;
        if (this.holdT >= this.holdTarget.hold) {
          const t = this.holdTarget;
          this.holdTarget = null;
          this.holdT = 0;
          t.act(this);
        }
      } else {
        this.holdTarget = null;
        this.holdT = 0;
      }
    }

    const held = this.inv.held;
    if (inp.pressed('interact') && !this.holdTarget) {
      if (this.carry) this.dropCarry(2.5);
      else if (target) {
        this.handPush = 1;
        if (target.hold) { this.holdTarget = target; this.holdT = 0; Events.emit('sfx', { name: target.holdSfx ?? 'pry' }); } else target.act(this);
      } else if (held) {
        if (held.kind === 'flashlight') this.toggleFlashlight();
        else if (held.kind === 'magnet') { /* pulls while held, below */ } else if (held.data.throwable !== false) {
          this.charging = true;
          this.charge = 0;
        }
      }
    }
    if (this.charging) {
      if (!this.inv.held) this.charging = false;
      else if (inp.down('interact')) {
        this.charge = Math.min(1, this.charge + dt / CONFIG.interact.chargeTime);
        this.handPush = -this.charge;
      } else {
        this.throwHeld(this.charge);
        this.charging = false;
      }
    }
    if (held?.kind === 'magnet' && inp.down('interact') && !this.holdTarget) this._magnet(dt);
    else this.magnetLock = null;
    if (inp.pressed('drop')) {
      if (this.carry) this.dropCarry(0.5);
      else if (this.charging) this.charging = false;
      else if (held) this.dropHeld();
    }
    if (inp.pressed('useItem') && held) this.useHeld(held);
    this._updateArc();
    this._animateHands(dt);
  }

  _setCurrent(t) {
    this.current = t;
    this.highlight.set(t?.obj ?? null);
  }

  // ------------------------------------------------------------ targeting
  _findTarget() {
    const cam = this.player.camera;
    cam.getWorldPosition(_o);
    cam.getWorldDirection(_d);
    const hit = this.physics.raycast(_o, _d, REACH, this.player.collider, groups(GROUP.PLAYER, GROUP.STATIC | GROUP.PROP));
    const limit = hit ? hit.toi + 0.12 : REACH;
    let best = null, bestD = Infinity;
    _ray.set(_o, _d);
    for (const t of this.targets) {
      if (t.enabled && !t.enabled()) continue;
      if (t.dynamicBox) t.dynamicBox(t.box);
      const pt = _ray.intersectBox(t.box, _v);
      if (!pt) continue;
      const dist = pt.distanceTo(_o);
      if (dist > limit || dist > REACH) continue;
      // smaller boxes win close ties (a key on a table beats the table)
      const score = dist + t.box.getSize(_w).length() * 0.02;
      if (score < bestD) { bestD = score; best = t; }
    }
    let colT = null;
    if (hit && hit.data) colT = this._colliderTarget(hit.data);
    let chosen = best;
    if (colT && (!best || hit.toi < bestD - 0.05)) chosen = colT;
    if (!chosen) return null;
    const label = typeof chosen.label === 'function' ? chosen.label(this) : chosen.label;
    if (!label) return null;
    return { ...chosen, label, base: chosen };
  }

  _colliderTarget(d) {
    switch (d.kind) {
      case 'prop': return this._propTarget(d.entry);
      case 'door': return this._doorTarget(d.door);
      case 'glass': case 'boards': return this._windowTarget(d.window);
      case 'hatch': return this._hatchTarget(d.hatch);
      default: return null;
    }
  }

  isBig(entry) {
    const d = entry.data || {};
    return !!(d.heavy || d.climbable || entry.body.mass() > 3.2);
  }

  _propTarget(entry) {
    if (!entry || entry.held || entry === this.carry) return null;
    const d = entry.data || {};
    const name = d.label ?? d.item ?? 'thing';
    if (this.isBig(entry)) return { obj: entry.mesh, label: `Pick up the ${name.toLowerCase()}`, act: () => this.startCarry(entry) };
    if (this.inv.full) return { obj: entry.mesh, label: `Swap for the ${name.toLowerCase()}`, act: () => { this.dropHeld(); this.inv.addProp(entry); } };
    return { obj: entry.mesh, label: d.tool ? `Take the ${name.toLowerCase()}` : `Pick up the ${name.toLowerCase()}`, act: () => this.inv.addProp(entry) };
  }

  _doorTarget(door) {
    const inv = this.inv;
    const special = this.game.story?.doorTarget?.(door);
    if (special !== undefined) return special;
    if (door.boards > 0) {
      if (!inv.has('crowbar')) return { obj: door.boardGroup ?? door.slab, label: 'Boarded up (needs a crowbar)', act: () => Events.emit('sfx', { name: 'rattle', position: door.worldCenter() }) };
      return { obj: door.boardGroup ?? door.slab, label: 'Pry off a board', hold: CONFIG.interact.pryTime, holdSfx: 'pryStart', act: () => { door.removeBoard(); this.handPush = 1.2; Events.emit('sfx', { name: 'pryPop', position: door.worldCenter() }); } };
    }
    if (door.chains > 0) return { obj: door.slab, label: 'Chained shut', act: () => Events.emit('sfx', { name: 'rattle', position: door.worldCenter() }) };
    if (door.lock && door.o.front && this.player.curFeet.z < door.pivot.position.z - 0.1) {
      return { obj: door.slab, label: 'Turn the deadbolt', act: () => { door.unlock(door.lock); door.open(this.player.curFeet); Events.emit('door:unlocked', { id: door.id, color: 'inside' }); } };
    }
    if (door.lock) {
      const name = KEY_NAMES[door.lock] ?? `${door.lock} key`;
      if (inv.hasKey(door.lock)) {
        return { obj: door.slab, label: `Unlock with the ${name}`, act: () => { door.unlock(door.lock); door.open(this.player.curFeet); Events.emit('door:unlocked', { id: door.id, color: door.lock }); } };
      }
      return {
        obj: door.slab, label: `Locked (needs the ${name})`,
        act: () => { Events.emit('sfx', { name: 'rattle', position: door.worldCenter() }); Events.emit('noise', { position: door.worldCenter(), loudness: 0.35, kind: 'rattle' }); },
      };
    }
    return { obj: door.slab, label: door.isOpen ? 'Close' : 'Open', act: () => door.toggle(this.player.curFeet) };
  }

  _windowTarget(win) {
    if (!win) return null;
    const wm = this.game.world.windows;
    if (win.boards.length) {
      if (!this.inv.has('crowbar')) return { obj: win.boards[win.boards.length - 1], label: 'Boarded up (needs a crowbar)', act: () => {} };
      return { obj: win.boards[win.boards.length - 1], label: 'Pry off a board', hold: CONFIG.interact.pryTime, holdSfx: 'pryStart', act: () => { wm.removeBoard(win.id); Events.emit('sfx', { name: 'pryPop', position: win.center.clone() }); } };
    }
    if (win.broken || win.open) return null;
    if (win.openable && !win.locked) return { obj: win.glass, label: 'Slide the window open', act: () => wm.openWindow(win.id) };
    return { obj: win.glass, label: 'Shut tight (break it?)', act: () => Events.emit('sfx', { name: 'glassTap', position: win.center.clone() }) };
  }

  _hatchTarget(h) {
    if (h.isOpen) return null;
    if (h.lock === 'puzzle') return { obj: h.pivot, label: 'Won\'t budge', act: () => Events.emit('sfx', { name: 'rattle', position: h.pivot.position.clone() }) };
    if (h.lock) {
      const name = KEY_NAMES[h.lock] ?? `${h.lock} key`;
      if (this.inv.hasKey(h.lock)) return { obj: h.pivot, label: `Unlock with the ${name}`, act: () => { h.unlock(h.lock); h.open(); Events.emit('hatch:unlocked', { id: h.id }); } };
      return { obj: h.pivot, label: `Locked hatch (needs the ${name})`, act: () => Events.emit('sfx', { name: 'rattle', position: h.pivot.position.clone() }) };
    }
    return { obj: h.pivot, label: 'Open the hatch', act: () => h.open() };
  }

  // Hide spots become targets (called once the world exists).
  addHideSpots(spots) {
    for (const spot of spots) {
      this.addTarget({
        obj: spot.obj, pad: 0.02,
        label: () => (this.carry ? null : HIDE_LABELS[spot.kind] ?? 'Hide'),
        act: () => this.hiding.enter(spot),
        hideSpot: spot,
      });
    }
  }

  // ------------------------------------------------------------ carrying big things
  startCarry(entry) {
    if (this.carry) this.dropCarry(0);
    this.carry = entry;
    entry.carried = true;
    entry.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    entry.collider.setCollisionGroups(groups(GROUP.PROP, GROUP.STATIC | GROUP.PROP | GROUP.NEIGHBOR));
    this.player.carrying = true;
    this.carryYaw = entry.mesh.rotation.y - this.player.yaw;
    Events.emit('sfx', { name: 'liftHeavy' });
    Events.emit('item:carry', { item: entry.data?.item });
  }

  _updateCarry(dt) {
    const e = this.carry;
    const cam = this.player.camera;
    cam.getWorldPosition(_o);
    _d.set(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
    const size = e.collider.halfExtents?.() ?? { x: 0.3, y: 0.3, z: 0.3 };
    const reach = Math.max(size.x, size.z) + 1.0;
    const hit = this.physics.raycast(_o, _d, reach + 0.4, this.player.collider, groups(GROUP.PLAYER, GROUP.STATIC));
    const dist = hit ? Math.max(0.45, hit.toi - Math.max(size.x, size.z) - 0.05) : reach;
    const pitchLift = MathUtils.clamp(-this.player.pitch, -0.6, 0.8) * 0.5;
    const target = _v.copy(_o).addScaledVector(_d, dist);
    target.y = _o.y - 0.85 - (size.y ?? 0.3) * 0.4 + pitchLift;
    // keep it off the floor
    const floor = this.physics.raycast(target.clone().setY(target.y + 0.5), new Vector3(0, -1, 0), 3, this.player.collider, groups(GROUP.PLAYER, GROUP.STATIC));
    if (floor) target.y = Math.max(target.y, floor.point.y + 0.02);
    const t = e.body.translation();
    const k = 1 - Math.exp(-18 * dt);
    const nx = t.x + (target.x - t.x) * k, ny = t.y + (target.y - t.y) * k, nz = t.z + (target.z - t.z) * k;
    e.body.setNextKinematicTranslation({ x: nx, y: ny, z: nz });
    _q.setFromAxisAngle(UP, this.player.yaw + this.carryYaw);
    e.body.setNextKinematicRotation(_q);
    this.carryVel = new Vector3((nx - t.x) / dt, (ny - t.y) / dt, (nz - t.z) / dt);
    if (Math.hypot(t.x - _o.x, t.z - _o.z) > 3) this.dropCarry(0);
  }

  dropCarry(push = 0) {
    const e = this.carry;
    if (!e) return;
    this.carry = null;
    e.carried = false;
    this.player.carrying = false;
    e.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    e.collider.setCollisionGroups(groups(GROUP.PROP));
    _d.set(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
    const v = this.carryVel ?? new Vector3();
    e.body.setLinvel({ x: v.x * 0.5 + _d.x * push, y: Math.min(v.y * 0.5, 2) + push * 0.3, z: v.z * 0.5 + _d.z * push }, true);
    e.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    if (push > 2) this._markThrown(e);
    Events.emit('sfx', { name: 'dropHeavy' });
  }

  // ------------------------------------------------------------ throwing
  _throwVelocity(item, charge, out = new Vector3()) {
    const cam = this.player.camera;
    cam.getWorldDirection(_d);
    const mass = item.entry.body.mass() || 0.5;
    const I = CONFIG.interact;
    const speed = MathUtils.lerp(I.throwMin, I.throwMax, charge) * MathUtils.clamp(Math.sqrt(0.5 / mass), 0.45, 1.15);
    out.copy(_d).multiplyScalar(speed);
    out.y += I.throwUp * (0.5 + charge);
    out.x += this.player.vel.x * 0.4;
    out.z += this.player.vel.z * 0.4;
    return out;
  }

  _safeReleasePos(pos) {
    // never release inside a wall: pull it back along the line from the eye
    const cam = this.player.camera;
    cam.getWorldPosition(_o);
    _w.copy(pos).sub(_o);
    const len = _w.length();
    _w.divideScalar(len);
    const hit = this.physics.raycast(_o, _w, len + 0.12, this.player.collider, groups(GROUP.PLAYER, GROUP.STATIC));
    if (hit) pos.copy(_o).addScaledVector(_w, Math.max(0.05, hit.toi - 0.15));
    return pos;
  }

  throwHeld(charge) {
    const item = this.inv.held;
    if (!item) return;
    const [pos, quat] = this.inv.heldPose(item);
    const p = this._safeReleasePos(pos.clone());
    const vel = this._throwVelocity(item, charge);
    const spin = { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8, z: (Math.random() - 0.5) * 8 };
    this.inv.release(item, p, quat.clone(), vel, spin);
    this._markThrown(item.entry);
    this.handPush = 1.4;
    Events.emit('player:throw', { item: item.kind, charge });
    Events.emit('sfx', { name: charge > 0.6 ? 'throwHard' : 'throw' });
    if (item.data.squeak) Events.emit('sfx', { name: 'squeak', position: p.clone() });
  }

  dropHeld() {
    const item = this.inv.held;
    if (!item) return;
    const [pos, quat] = this.inv.heldPose(item);
    const p = this._safeReleasePos(pos.clone());
    this.inv.release(item, p, quat.clone(), { x: this.player.vel.x * 0.5, y: 0.5, z: this.player.vel.z * 0.5 });
    Events.emit('sfx', { name: 'drop' });
  }

  _markThrown(entry) {
    entry.thrownRecently = true;
    entry.thrownAt = this.time;
    entry.thrower = 'player';
    if (!this.thrown.includes(entry)) this.thrown.push(entry);
  }

  _updateThrown() {
    for (let i = this.thrown.length - 1; i >= 0; i--) {
      const e = this.thrown[i];
      if (this.time - e.thrownAt > CONFIG.interact.thrownWindow || e.held) {
        e.thrownRecently = false;
        this.thrown.splice(i, 1);
      }
    }
  }

  // ------------------------------------------------------------ using held items
  useHeld(item) {
    const d = item.data;
    if (d.lure === 'alarm') {
      this.game.devices?.armAlarm(item.entry);
      Events.emit('sfx', { name: 'alarmWind' });
    } else if (d.lure === 'tvRemote') {
      this.game.devices?.remote();
    } else if (item.kind === 'flashlight') this.toggleFlashlight();
  }

  // ------------------------------------------------------------ magnet gun
  _magnet(dt) {
    const cam = this.player.camera;
    cam.getWorldPosition(_o);
    cam.getWorldDirection(_d);
    const R = CONFIG.interact.magnetRange;
    let best = this.magnetLock, bestScore = Infinity;
    if (!best) {
      const consider = (kind, ref, pos) => {
        _w.copy(pos).sub(_o);
        const dist = _w.length();
        if (dist > R || dist < 0.3) return;
        const ang = _w.angleTo(_d);
        if (ang > CONFIG.interact.magnetCone) return;
        const score = ang * 4 + dist * 0.05;
        if (score >= bestScore) return;
        // line of sight
        const hit = this.physics.raycast(_o, _w.clone().divideScalar(dist), dist - 0.15, this.player.collider, groups(GROUP.PLAYER, GROUP.STATIC));
        if (hit) return;
        bestScore = score;
        best = { kind, ref };
      };
      for (const e of this.physics.dynamics) if (e.data?.metal && !e.held && e !== this.carry) consider('prop', e, e.mesh.position);
      for (const t of this.targets) if (t.magnetic && (!t.enabled || t.enabled())) consider('pickup', t, t.obj.getWorldPosition(new Vector3()));
    }
    if (!best) {
      if (this.time - (this.lastWhirr ?? -9) > 0.6) { this.lastWhirr = this.time; Events.emit('sfx', { name: 'magnetHum' }); }
      return;
    }
    this.magnetLock = best;
    if (this.time - (this.lastWhirr ?? -9) > 0.5) { this.lastWhirr = this.time; Events.emit('sfx', { name: 'magnetWhirr' }); }
    const hand = this.inv.anchor.getWorldPosition(new Vector3());
    if (best.kind === 'prop') {
      const e = best.ref;
      const t = e.body.translation();
      _w.set(hand.x - t.x, hand.y - t.y, hand.z - t.z);
      const dist = _w.length();
      if (dist < 1.0) {
        this.magnetLock = null;
        if (!this.inv.full) { this.inv.addProp(e); Events.emit('sfx', { name: 'magnetClunk' }); }
        return;
      }
      _w.divideScalar(dist);
      const v = e.body.linvel();
      const want = Math.min(9, 3 + dist);
      const k = Math.min(1, dt * 6);
      e.body.setLinvel({ x: v.x + (_w.x * want - v.x) * k, y: v.y + (_w.y * want - v.y) * k + 9.8 * dt, z: v.z + (_w.z * want - v.z) * k }, true);
    } else {
      const t = best.ref;
      const pos = t.obj.getWorldPosition(new Vector3());
      _w.copy(hand).sub(pos);
      const dist = _w.length();
      if (dist < 0.7) {
        this.magnetLock = null;
        (t.collect ?? t.act)(this);
        Events.emit('sfx', { name: 'magnetClunk' });
        return;
      }
      t.pulled = true;
      const step = Math.min(dist, dt * 7);
      _w.divideScalar(dist).multiplyScalar(step);
      t.obj.parent.worldToLocal(pos.add(_w));
      t.obj.position.copy(pos);
    }
  }

  // ------------------------------------------------------------ flashlight
  _buildFlashlight() {
    const cam = this.player.camera;
    const light = new SpotLight(0xfff1c9, 0, 22, 0.42, 0.55, 1.4);
    light.position.set(0.18, -0.12, 0);
    const tgt = new Object3D();
    tgt.position.set(0.05, -0.1, -5);
    cam.add(light, tgt);
    light.target = tgt;
    light.castShadow = false;
    this.flashlight = light;
    this.flashOn = false;
  }

  toggleFlashlight() {
    this.flashOn = !this.flashOn;
    Events.emit('sfx', { name: 'click' });
  }

  _updateFlashlight() {
    const held = this.inv.held;
    const on = this.flashOn && held?.kind === 'flashlight';
    this.flashlight.intensity = on ? CONFIG.interact.flashlightIntensity : 0;
    const lens = held?.kind === 'flashlight' ? held.obj.userData.lens : null;
    if (lens) lens.material.emissiveIntensity = on ? 2.2 : 0.4;
  }

  // ------------------------------------------------------------ throw arc preview
  _buildArc() {
    const n = 26;
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(n * 3), 3));
    const dot = document.createElement('canvas');
    dot.width = dot.height = 32;
    const x = dot.getContext('2d');
    x.fillStyle = '#2a1e3a';
    x.beginPath(); x.arc(16, 16, 15, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fffbe8';
    x.beginPath(); x.arc(16, 16, 10, 0, Math.PI * 2); x.fill();
    this.arc = new Points(g, new PointsMaterial({ map: new CanvasTexture(dot), size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false, alphaTest: 0.1 }));
    this.arc.frustumCulled = false;
    this.arc.visible = false;
    this.arc.renderOrder = 6;
    this.game.engine.scene.add(this.arc);
  }

  _updateArc() {
    const item = this.inv.held;
    const show = this.charging && item && this.charge > 0.08;
    this.arc.visible = !!show;
    if (!show) return;
    const [pos] = this.inv.heldPose(item, new Vector3(), new Quaternion());
    const vel = this._throwVelocity(item, this.charge, new Vector3());
    const a = this.arc.geometry.attributes.position;
    const gY = CONFIG.physics.gravity;
    let drawn = a.count;
    for (let i = 0; i < a.count; i++) {
      const t = 0.1 + i * 0.05;
      const x = pos.x + vel.x * t, y = pos.y + vel.y * t + 0.5 * gY * t * t, z = pos.z + vel.z * t;
      a.setXYZ(i, x, y, z);
      if (y < pos.y - 4) { drawn = i; break; }
    }
    this.arc.geometry.setDrawRange(0, drawn);
    a.needsUpdate = true;
    this.arc.material.opacity = 0.35 + this.charge * 0.55;
  }

  // ------------------------------------------------------------ little pops of sparkles
  sparkle(pos, color = 0xfff3a0) {
    const geo = this._sparkGeo ?? (this._sparkGeo = new SphereGeometry(0.018, 6, 4));
    for (let i = 0; i < 10; i++) {
      const m = new Mesh(geo, new MeshBasicMaterial({ color, transparent: true }));
      m.position.copy(pos);
      const v = new Vector3(Math.random() - 0.5, Math.random() * 0.8 + 0.2, Math.random() - 0.5).normalize().multiplyScalar(1.2 + Math.random());
      this.game.engine.scene.add(m);
      this.sparkles.push({ m, v, life: 0.6 });
    }
  }

  _updateSparkles(dt) {
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.life -= dt;
      s.v.y -= 3 * dt;
      s.m.position.addScaledVector(s.v, dt);
      s.m.material.opacity = Math.max(0, s.life / 0.6);
      if (s.life <= 0) {
        s.m.parent.remove(s.m);
        s.m.material.dispose();
        this.sparkles.splice(i, 1);
      }
    }
  }

  // ------------------------------------------------------------ hands
  _animateHands(dt) {
    const p = this.player;
    this.handPush = MathUtils.damp(this.handPush, 0, 7, dt);
    const push = this.charging ? -this.charge : this.handPush;
    p.handOffset = p.handOffset ?? new Vector3();
    p.handOffset.set(0, push < 0 ? push * 0.05 : push * 0.02, push < 0 ? -push * 0.12 : -push * 0.12);
    // carrying: both hands come up and out
    p.handCarry = MathUtils.damp(p.handCarry ?? 0, this.carry ? 1 : 0, 10, dt);
    this.inv.anchor.visible = !this.carry;
  }

  // Caught: everything in your hands stays where you were caught.
  onCaught(pos) {
    if (this.carry) this.dropCarry(0);
    this.charging = false;
    this.flashOn = false;
    this.inv.dropAll(pos);
  }
}

export { KEY_NAMES };
