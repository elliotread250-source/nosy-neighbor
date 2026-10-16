// The learning system. Simple counters, readable adaptations:
//   entry used 2x -> bear trap just inside, 3x -> security camera on it,
//   4x+ -> boarded shut. Hide spot used 3x -> he checks it first.
//   Rooms you linger in -> he patrols them more. Lures wear out on the
//   third use. Three broken windows -> glue puddles under windows.
// He only installs things when you're out of the house or far away, and
// the next time you wake up you see him carrying planks or a camera home.
import { Vector3, Quaternion, MathUtils } from 'three';
import { Events } from '../core/Events.js';
import { CONFIG } from '../config.js';
import { GROUP, groups } from '../core/Physics.js';
import { WALLS, FLOOR_Y, FLOOR_H } from '../world/NeighborPlan.js';
import { ACTIVITIES } from '../actors/NeighborAI.js';
import { bearTrap, securityCamera, gluePuddle, glueJar, plankBundle, cameraBox, trapCarry } from '../world/props/Traps.js';

const B = () => CONFIG.brain;
const _v = new Vector3();
const _w = new Vector3();
const DOWN = new Vector3(0, -1, 0);

export class NeighborBrain {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.entryCounts = {};
    this.roomVisits = {}; // seconds
    this.hideSpotUses = {};
    this.throwCount = 0;
    this.windowBreaks = 0;
    this.lureUses = {};
    this.spotted = 0;
    this.queue = [];
    this.done = new Set(); // `${type}:${entryId}`
    this.traps = [];
    this.cameras = [];
    this.glue = [];
    this.boards = 0;
    this.projectiles = [];
    this.shot = null;
    this.pendingShot = null;
    this.wasInside = false;
    this.lastOutside = new Vector3();
    this._buildEntries();
    this._mapActivities();
    Events.on('hide:enter', (e) => { this.hideSpotUses[e.spot.id] = (this.hideSpotUses[e.spot.id] || 0) + 1; });
    Events.on('player:throw', () => { this.throwCount++; });
    Events.on('window:broken', (e) => { this.windowBreaks++; this.lastBroken = e.id; this._consider(); });
    Events.on('lure:start', (e) => { this.lureUses[e.kind] = (this.lureUses[e.kind] || 0) + 1; });
    Events.on('catch:end', () => { if (this.pendingShot && !this.game.dream?.wants()) this.startShot(this.pendingShot); });
  }

  get adapt() {
    const ai = this.game.ai;
    return ai?.diff?.adapt ?? 1;
  }

  threshold(base) {
    return Math.max(1, Math.round(base * this.adapt));
  }

  // ------------------------------------------------------------ entry points
  _buildEntries() {
    const { doors, windows } = this.game.world;
    this.entries = [];
    for (const w of WALLS) {
      if (w.kind !== 'ext') continue;
      for (const o of w.openings || []) {
        if (!o.id || o.fake) continue;
        const door = o.door ? doors.get(o.id) : null;
        const win = o.window ? windows.get(o.id) : null;
        if (!door && !win) continue;
        const center = door ? door.worldCenter(new Vector3()) : win.center.clone();
        const inward = w.axis === 'x' ? new Vector3(0, 0, -w.out) : new Vector3(-w.out, 0, 0);
        const along = w.axis === 'x' ? new Vector3(1, 0, 0) : new Vector3(0, 0, 1);
        this.entries.push({
          id: o.id, kind: door ? 'door' : 'window', door, win, center, inward, along,
          floor: w.floor, floorY: FLOOR_Y[w.floor], floorH: FLOOR_H[w.floor], w: o.w ?? 1,
        });
      }
    }
  }

  entryNear(p) {
    let best = null, bestD = 3.5;
    for (const e of this.entries) {
      const d = _v.copy(e.center).setY(Math.max(e.floorY, Math.min(e.center.y, p.y + 0.9))).distanceTo(_w.copy(p).setY(p.y + 0.9));
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  onEntered(entry) {
    const n = (this.entryCounts[entry.id] = (this.entryCounts[entry.id] || 0) + 1);
    Events.emit('brain:entry', { id: entry.id, count: n });
    this._consider();
  }

  // ------------------------------------------------------------ deciding what to build
  _consider() {
    const C = B();
    for (const e of this.entries) {
      const n = this.entryCounts[e.id] || 0;
      if (n >= this.threshold(C.trapAt)) this._queue('trap', e);
      if (n >= this.threshold(C.cameraAt)) this._queue('camera', e);
      if (n >= this.threshold(C.boardAt)) this._queue('board', e);
    }
    if (this.windowBreaks >= this.threshold(C.glueAt)) {
      // glue under the windows he's had to sweep glass from, ground floor first
      const wins = this.entries.filter((e) => e.kind === 'window' && (e.win.broken || e.id === this.lastBroken)).sort((a, b) => a.floorY - b.floorY);
      for (const e of wins) this._queue('glue', e);
    }
  }

  _queue(type, entry) {
    const key = `${type}:${entry.id}`;
    if (this.done.has(key) || this.queue.some((j) => j.key === key)) return;
    const C = B();
    const count = (t) => this.queue.filter((j) => j.type === t).length;
    if (type === 'trap' && this.traps.filter((t) => t.armed).length + count('trap') >= C.maxTraps) return;
    if (type === 'camera' && this.cameras.length + count('camera') >= C.maxCameras) return;
    if (type === 'board' && this.boards + count('board') >= C.maxBoards) return;
    if (type === 'glue' && this.glue.filter((g) => !g.ttl).length + count('glue') >= C.maxGlue) return;
    if (type === 'board' && ((entry.door && entry.door.boards > 0) || (entry.win && entry.win.boards.length))) return;
    const job = this._makeJob(type, entry);
    if (!job) return;
    this.queue.push(job);
    if (!this.pendingShot && type !== 'glue') this.pendingShot = job;
    Events.emit('brain:queued', { type, entry: entry.id });
  }

  _floorAt(p, floorY) {
    const hit = this.game.physics.raycast(_v.set(p.x, floorY + 1.2, p.z), DOWN, 2.0, null, groups(GROUP.PLAYER, GROUP.STATIC));
    if (!hit) return null;
    return hit.point.y;
  }

  _makeJob(type, e) {
    const base = new Vector3(e.center.x, e.floorY, e.center.z);
    let install = null;
    let stand;
    if (type === 'trap' || type === 'glue') {
      // find clear floor just inside
      for (const [k, s] of [[0.9, 0], [1.3, 0], [0.9, 0.6], [0.9, -0.6], [1.7, 0], [1.3, 0.9], [1.3, -0.9]]) {
        const p = base.clone().addScaledVector(e.inward, k).addScaledVector(e.along, s);
        const y = this._floorAt(p, e.floorY);
        if (y !== null && Math.abs(y - e.floorY) < 0.12) { install = p.setY(y); break; }
      }
      if (!install) return null;
      stand = install.clone().addScaledVector(e.inward, 0.8);
    } else if (type === 'camera') {
      const side = this.cameras.length % 2 ? -1 : 1;
      install = e.center.clone().setY(e.floorY + Math.min(2.35, e.floorH - 0.35)).addScaledVector(e.inward, 0.12).addScaledVector(e.along, side * (e.w / 2 + 0.38));
      stand = base.clone().addScaledVector(e.inward, 1.1).addScaledVector(e.along, side * 0.4);
    } else {
      install = e.center.clone();
      stand = base.clone().addScaledVector(e.inward, 0.85);
    }
    const anim = type === 'board' ? 'hammer' : type === 'camera' ? 'setCamera' : 'setTrap';
    return {
      key: `${type}:${e.id}`, type, entry: e, install,
      id: `job-${type}-${e.id}`, pos: stand.toArray(), face: install.toArray(), anim, dur: type === 'board' ? 4.5 : 3.5,
      expr: 'angry', carry: type === 'board' ? 'planks' : type === 'camera' ? 'camera' : type === 'trap' ? 'trap' : 'glue',
    };
  }

  // ------------------------------------------------------------ AI hooks
  playerAway() {
    const g = this.game;
    const inside = this._inHouse(g.player.curFeet);
    const d = g.ai ? g.ai.curFeet.distanceTo(g.player.curFeet) : 99;
    return !inside || d > B().installDistance;
  }

  nextJob() {
    if (!this.queue.length || !this.playerAway()) return null;
    const job = this.queue[0];
    this._carry(job.carry);
    return job;
  }

  startJob(a) {
    Events.emit('sfx', { name: a.type === 'board' ? 'hammering' : 'rummage', position: new Vector3(...a.pos) });
  }

  finishJob(a) {
    const job = this.queue.find((j) => j.id === a.id);
    this._carry(null);
    if (!job) return;
    this.queue.splice(this.queue.indexOf(job), 1);
    this.done.add(job.key);
    this.install(job);
  }

  patrolBias() {
    const out = { ...(this.storyBias || {}) };
    for (const [actId, room] of Object.entries(this.activityRooms)) {
      const t = this.roomVisits[room] || 0;
      if (t > 0) out[actId] = (out[actId] ?? 1) * (1 + Math.min(3, t / B().roomBiasSeconds));
    }
    return out;
  }

  favoredHideSpots() {
    const s = new Set();
    for (const [id, n] of Object.entries(this.hideSpotUses)) if (n >= this.threshold(B().hideAt)) s.add(id);
    return s;
  }

  lureLimit() {
    return B().lureIgnoreAt;
  }

  onSpotted() {
    this.spotted++;
  }

  _mapActivities() {
    this.activityRooms = {};
    for (const a of ACTIVITIES) {
      const z = this.game.zones.at(new Vector3(a.pos[0], a.pos[1] + 0.9, a.pos[2]));
      if (z?.room) this.activityRooms[a.id] = z.room.id;
    }
  }

  _inHouse(p) {
    const z = this.game.zones.at(_w.set(p.x, p.y + 0.9, p.z));
    return z?.house === 'neighbor' ? z : null;
  }

  // ------------------------------------------------------------ installing
  install(job) {
    const scene = this.game.engine.scene;
    const floorGroup = this.game.world.interior?.floors?.[job.entry.floor] ?? scene;
    if (job.type === 'trap') {
      const obj = bearTrap();
      obj.scale.setScalar(1.2);
      obj.position.copy(job.install);
      obj.rotation.y = Math.atan2(job.entry.inward.x, job.entry.inward.z);
      floorGroup.add(obj);
      this.traps.push({ obj, pos: job.install.clone(), armed: true, t: 0, entry: job.entry.id });
    } else if (job.type === 'camera') {
      const obj = securityCamera(B().cameraRange, B().cameraFov);
      obj.position.copy(job.install);
      obj.rotation.y = Math.atan2(job.entry.inward.x, job.entry.inward.z);
      floorGroup.add(obj);
      obj.updateMatrixWorld(true);
      const look = new Vector3(job.entry.center.x, job.entry.floorY + 0.7, job.entry.center.z).addScaledVector(job.entry.inward, 2.2);
      obj.userData.head.lookAt(look);
      obj.updateMatrixWorld(true);
      this.cameras.push({ obj, cool: 0, blink: Math.random(), entry: job.entry.id });
    } else if (job.type === 'board') {
      const e = job.entry;
      if (e.door) { e.door.close(); e.door.addBoards(3); } else this.game.world.windows.boardUp(e.id, 3);
      this.boards++;
    } else if (job.type === 'glue') {
      const obj = gluePuddle(job.id);
      obj.position.copy(job.install);
      floorGroup.add(obj);
      this.glue.push({ obj, pos: job.install.clone(), r: obj.userData.radius });
    }
    Events.emit('brain:adapted', { type: job.type, entry: job.entry.id });
  }

  // What he's carrying to the job (visible in his arms).
  _carry(kind) {
    const n = this.game.neighbor;
    if (this.carrying?.kind === kind) return;
    if (this.carrying) { this.carrying.obj.parent?.remove(this.carrying.obj); this.carrying = null; }
    if (!kind || !n) return;
    const obj = kind === 'planks' ? plankBundle() : kind === 'camera' ? cameraBox() : kind === 'trap' ? trapCarry() : glueJar();
    obj.position.set(0, kind === 'planks' ? 1.0 : 1.05, 0.36);
    // planks go under the arm, running front to back
    if (kind === 'planks') { obj.position.set(-0.36, 0.95, 0.1); obj.rotation.set(0.12, Math.PI / 2, 0); }
    n.root.add(obj);
    this.carrying = { kind, obj };
  }

  // ------------------------------------------------------------ per frame
  update(dt) {
    this.time += dt;
    const g = this.game;
    const p = g.player;
    const ai = g.ai;
    if (!ai) return;
    // entering the house
    const zone = this._inHouse(p.curFeet);
    if (zone && !this.wasInside && !p.hiding && g.state === 'play') {
      const entry = this.entryNear(p.curFeet) ?? this.entryNear(this.lastOutside);
      if (entry) this.onEntered(entry);
    }
    if (!zone) this.lastOutside.copy(p.curFeet);
    this.wasInside = !!zone;
    if (zone?.room) this.roomVisits[zone.room.id] = (this.roomVisits[zone.room.id] || 0) + dt;
    // drop the carry prop if he got distracted
    if (this.carrying && !this.shot && !(ai.activity?.job)) this._carry(null);

    this._updateTraps(dt);
    this._updateCameras(dt);
    this._updateGlue(dt);
    this._updateProjectiles(dt);
    if (this.shot) this._updateShot(dt);
  }

  _updateTraps(dt) {
    const p = this.game.player;
    for (const t of this.traps) {
      if (t.snapT !== undefined && t.snapT < 1) {
        t.snapT = Math.min(1, t.snapT + dt / 0.07);
        for (const j of t.obj.userData.jaws) j.rotation.x = j.userData.side * 1.5 * t.snapT;
      }
      if (!t.armed || p.hiding || p.noclip) continue;
      const d = Math.hypot(p.curFeet.x - t.pos.x, p.curFeet.z - t.pos.z);
      if (d < B().trapRadius && Math.abs(p.curFeet.y - t.pos.y) < 0.4) this.springTrap(t);
    }
    // stuck in a trap: mash to pull free
    const tr = p.trapped;
    if (tr) {
      const inp = this.game.input;
      if (inp.pressed('jump') || inp.pressed('interact')) {
        tr.t -= B().trapMash;
        Events.emit('sfx', { name: 'trapRattle' });
      }
      tr.t -= dt;
      if (tr.t <= 0) {
        p.trapped = null;
        Events.emit('hint', { text: 'Free!', seconds: 1.2 });
        Events.emit('trap:free', {});
      }
    }
  }

  springTrap(t) {
    const g = this.game;
    t.armed = false;
    t.snapT = 0;
    g.player.trapped = { t: B().trapHold, trap: t };
    g.player.vel.set(0, 0, 0);
    g.player.spawn(new Vector3(t.pos.x, t.pos.y + 0.02, t.pos.z), g.player.yaw);
    Events.emit('sfx', { name: 'trapSnap', position: t.pos.clone() });
    Events.emit('noise', { position: t.pos.clone(), loudness: 2.0, kind: 'trap', global: true });
    Events.emit('hint', { text: 'SNAP! Mash SPACE to pull free!', seconds: 2.5 });
    Events.emit('trap:sprung', { entry: t.entry });
    if (g.postfx) g.postfx.flash = 0.5;
    g.ai?.alert?.(t.pos);
  }

  _updateCameras(dt) {
    const g = this.game;
    const p = g.player;
    for (const c of this.cameras) {
      c.blink += dt;
      c.cool = Math.max(0, c.cool - dt);
      const led = c.obj.userData.led;
      const rate = c.cool > 0 ? 6 : 1;
      led.material.emissiveIntensity = (Math.sin(c.blink * Math.PI * 2 * rate) > 0.3) ? 3 : 0.2;
      c.obj.userData.cone.material.opacity = c.cool > 0 ? 0.13 + 0.05 * Math.sin(c.blink * 30) : 0.07;
      if (c.cool > 0 || p.hiding || p.noclip || g.state !== 'play') continue;
      c.checkT = (c.checkT ?? Math.random() * 0.2) - dt;
      if (c.checkT > 0) continue;
      c.checkT = 0.2;
      const head = c.obj.userData.head;
      const lens = head.localToWorld(_v.set(0, 0, 0.32));
      const dir = head.getWorldDirection(new Vector3());
      const chest = _w.copy(p.curFeet).setY(p.curFeet.y + (p.crouching ? 0.6 : 1.1));
      const to = chest.clone().sub(lens);
      const dist = to.length();
      if (dist > B().cameraRange) continue;
      if (to.angleTo(dir) > (B().cameraFov / 2) * Math.PI / 180) continue;
      const hit = g.physics.raycast(lens.clone(), to.clone().divideScalar(dist), dist - 0.3, null, groups(GROUP.NEIGHBOR, GROUP.STATIC));
      if (hit) continue;
      c.cool = B().cameraCooldown;
      Events.emit('sfx', { name: 'cameraAlarm', position: lens.clone() });
      Events.emit('camera:spotted', { entry: c.entry });
      Events.emit('hint', { text: 'A camera saw you!', seconds: 2 });
      g.ai?.alert?.(p.curFeet.clone());
    }
  }

  _updateGlue(dt) {
    const p = this.game.player;
    let inGlue = false;
    for (let i = this.glue.length - 1; i >= 0; i--) {
      const gl = this.glue[i];
      if (gl.ttl !== undefined) {
        gl.ttl -= dt;
        if (gl.ttl < 1) gl.obj.scale.setScalar(Math.max(0.01, gl.ttl));
        if (gl.ttl <= 0) { gl.obj.parent?.remove(gl.obj); this.glue.splice(i, 1); continue; }
      }
      if (Math.hypot(p.curFeet.x - gl.pos.x, p.curFeet.z - gl.pos.z) < gl.r && Math.abs(p.curFeet.y - gl.pos.y) < 0.35) inGlue = true;
    }
    if (inGlue && !p.inGlue) Events.emit('sfx', { name: 'squelch' });
    p.inGlue = inGlue;
    p.speedMul = inGlue ? B().glueSlow : 1;
  }

  // Hard: he lobs a glue jar ahead of you during a chase.
  throwGlue(from, target) {
    const obj = glueJar();
    obj.position.copy(from);
    this.game.engine.scene.add(obj);
    const T = 0.9;
    const g = CONFIG.physics.gravity;
    const vel = new Vector3((target.x - from.x) / T, (target.y - from.y - 0.5 * g * T * T) / T, (target.z - from.z) / T);
    this.projectiles.push({ obj, vel, t: 0, T, target: target.clone() });
    Events.emit('sfx', { name: 'whoosh', position: from.clone() });
  }

  _updateProjectiles(dt) {
    const g = CONFIG.physics.gravity;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.t += dt;
      pr.vel.y += g * dt;
      pr.obj.position.addScaledVector(pr.vel, dt);
      pr.obj.rotation.x += dt * 8;
      if (pr.t >= pr.T) {
        pr.obj.parent?.remove(pr.obj);
        this.projectiles.splice(i, 1);
        const puddle = gluePuddle(`jar${this.time}`);
        puddle.position.copy(pr.target);
        this.game.engine.scene.add(puddle);
        this.glue.push({ obj: puddle, pos: pr.target.clone(), r: puddle.userData.radius, ttl: B().glueJarLife });
        Events.emit('sfx', { name: 'splat', position: pr.target.clone() });
      }
    }
  }

  // ------------------------------------------------------------ "he learned something"
  startShot(job) {
    const g = this.game;
    if (!g.ai || this.shot) return;
    this.pendingShot = null;
    const p = g.player;
    p.enabled = false;
    p.externalCamera = true;
    const cam = p.camera;
    // from just outside the bedroom window pane, a long lens across the street
    cam.position.set(2.8, 1.95, 13.8);
    cam.lookAt(-2.8, 1.3, -8.8);
    cam.fov = 30;
    cam.updateProjectionMatrix();
    g.ai.frozen = true;
    const from = new Vector3(-6.2, 0.02, -8.4), to = new Vector3(-1.4, 0.02, -9.2);
    g.ai.teleport(from, Math.atan2(to.x - from.x, to.z - from.z));
    g.neighborAnim.play('walk', 0);
    g.neighbor.setExpression('suspicious');
    this._carry(job.carry);
    this.shot = { t: 0, from, to, job };
    Events.emit('brain:shot', { type: job.type });
    Events.emit('cinematic', { on: true });
  }

  _updateShot(dt) {
    const g = this.game;
    const s = this.shot;
    s.t += dt;
    const k = Math.min(1, s.t / B().shotLength);
    const pos = s.from.clone().lerp(s.to, k);
    const ai = g.ai;
    ai.curFeet.copy(pos);
    ai.prevFeet.copy(pos);
    ai.syncModel(1);
    g.neighborAnim.speed = 1.3;
    const skip = s.t > 0.4 && g.input.pressedThisFrame.size > 0;
    if (k >= 1 || skip) {
      this.shot = null;
      const p = g.player;
      p.externalCamera = false;
      p.enabled = true;
      p.camera.fov = p.fov;
      p.camera.updateProjectionMatrix();
      ai.teleport(pos, ai.yaw);
      ai.frozen = false;
      ai.activity = null;
      ai.setState('patrol');
      Events.emit('cinematic', { on: false });
    }
  }

  // ------------------------------------------------------------ saving
  toJSON() {
    return {
      entryCounts: this.entryCounts, roomVisits: this.roomVisits, hideSpotUses: this.hideSpotUses,
      throwCount: this.throwCount, windowBreaks: this.windowBreaks, lureUses: this.lureUses, spotted: this.spotted,
    };
  }

  static lerp(a, b, t) { return MathUtils.lerp(a, b, t); }
}

export { Quaternion };
