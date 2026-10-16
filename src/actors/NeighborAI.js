// The neighbor's brain: movement on a kinematic character controller,
// senses (sight with a detection meter, hearing through walls), memory, and
// a readable state machine. Never omniscient: every catch should be
// explainable after the fact.
import { Vector3, MathUtils } from 'three';
import { RAPIER, GROUP, groups } from '../core/Physics.js';
import { Events } from '../core/Events.js';
import { CONFIG } from '../config.js';
import { NH } from '../world/NeighborPlan.js';

const A = CONFIG.ai;
const DEG = Math.PI / 180;
const _v = new Vector3();
const _w = new Vector3();
const _d = new Vector3();

export const S = {
  PATROL: 'patrol', ACTIVITY: 'activity', INVESTIGATE: 'investigate', SUSPICIOUS: 'suspicious', SPOT: 'spot',
  CHASE: 'chase', SEARCH: 'search', CATCH: 'catch', STUNNED: 'stunned', STARE: 'stare', ADAPT: 'adapt', HEAR: 'hear', LOST: 'lost',
  DISABLED: 'disabled',
};

// Things he does when nobody's around. pos = where he stands, face = where he looks.
const ACTIVITIES = [
  { id: 'milk', pos: [6.4, NH.F0.y, -22.4], face: [7.5, 1.5, -20.6], anim: 'drink', dur: 3.5, expr: 'satisfied', w: 2 },
  { id: 'tv', pos: [-2.6, NH.F0.y, -17.6], face: [-4.75, 1, -14.6], anim: 'sit', dur: [14, 26], expr: 'suspicious', w: 2, sit: [-3.05, -18.35, 0.45] },
  { id: 'windowLiving', pos: [-3.5, NH.F0.y, -14.8], face: [-3.5, 2, 10], anim: 'idle', dur: [5, 8], expr: 'suspicious', w: 2, lookAtPlayerHouse: true },
  { id: 'windowBedroom', pos: [-5.5, NH.F1.y, -14.8], face: [-5.5, 6, 10], anim: 'idle', dur: [5, 8], expr: 'suspicious', w: 1.5, lookAtPlayerHouse: true },
  { id: 'study', pos: [2.4, NH.F1.y, -18.1], face: [2.4, 5.2, -19.4], anim: 'idle', dur: [6, 10], expr: 'curious', w: 1.5 },
  { id: 'basementDoor', pos: [0.7, NH.F0.y, -20.9], face: [0.7, 1.5, -22.5], anim: 'idle', dur: [4, 6], expr: 'sad', w: 1 },
  { id: 'plants', pos: [-4.8, NH.porch.y, -13.0], face: [-4.8, 1.2, -14.2], anim: 'idle', dur: [4, 7], expr: 'satisfied', w: 1 },
  { id: 'backYard', pos: [3.0, 0, -29.0], face: [5, 0.3, -29.5], anim: 'idle', dur: [4, 7], expr: 'suspicious', w: 1 },
  { id: 'sideYard', pos: [12.5, 0, -21.0], face: [12.5, 1, -14], anim: 'idle', dur: [3, 6], expr: 'suspicious', w: 1 },
  { id: 'kitchen', pos: [4.4, NH.F0.y, -24.6], face: [4.6, 1.2, -26], anim: 'idle', dur: [3, 5], expr: 'curious', w: 1 },
];

export class NeighborAI {
  constructor(game) {
    this.game = game;
    this.n = game.neighbor;
    this.anim = game.neighborAnim;
    this.physics = game.physics;
    this.nav = game.nav;
    this.player = game.player;
    this.diff = A.difficulties[A.difficulty] || A.difficulties.normal;

    this.state = S.PATROL;
    this.stateTime = 0;
    this.meter = 0;
    this.lastSeen = null; // { pos, t }
    this.lastHeard = null;
    this.timeSinceSeen = 999;
    this.canSee = false;
    this.path = null;
    this.pathIdx = 0;
    this.repathT = 0;
    this.goal = null;
    this.speed = 0;
    this.targetSpeed = 0;
    this.vel = new Vector3();
    this.yaw = 0;
    this.activity = null;
    this.searchList = [];
    this.searchIdx = 0;
    this.searchPhase = 0;
    this.knownHideSpot = null;
    this.frozen = false;
    this.lastNoiseT = 0;
    this.quietT = 0;
    this.time = 0;
    this.runRamp = 0;
    this.stuckT = 0;
    this.lastPos = new Vector3();
    this.lureFatigue = {}; // lure type -> count (brain may use)

    this.half = A.height / 2 - A.radius;
    this.prevFeet = new Vector3();
    this.curFeet = new Vector3();
    this._makeBody();

    this.offNoise = Events.on('noise', (e) => this.hear(e));
    this.offFoot = Events.on('player:footstep', (e) => this.hear({ position: e.position, loudness: e.loudness, kind: 'footstep' }));
    this.offLand = Events.on('player:land', (e) => this.hear({ position: e.position, loudness: Math.min(1, e.speed / 9), kind: 'land' }));
    this.offContact = Events.on('contact', (e) => this.onContact(e));
    this.anim.onEvent = (name) => this.onAnimEvent(name);
  }

  _makeBody() {
    const w = this.physics.world;
    this.body = w.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(6, 2, -22));
    this.collider = w.createCollider(
      RAPIER.ColliderDesc.capsule(this.half, A.radius)
        .setCollisionGroups(groups(GROUP.NEIGHBOR, GROUP.STATIC | GROUP.PROP))
        .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS),
      this.body,
    );
    this.physics.colliderData.set(this.collider.handle, { kind: 'neighbor' });
    const cc = w.createCharacterController(0.03);
    cc.setUp({ x: 0, y: 1, z: 0 });
    cc.enableAutostep(0.45, 0.15, true);
    cc.enableSnapToGround(0.4);
    cc.setMaxSlopeClimbAngle(55 * DEG);
    cc.setSlideEnabled(true);
    cc.setApplyImpulsesToDynamicBodies(true);
    cc.setCharacterMass(110);
    this.cc = cc;
    this.vy = 0;
  }

  teleport(pos, yaw = this.yaw) {
    const cy = pos.y + this.half + A.radius + 0.03;
    this.body.setTranslation({ x: pos.x, y: cy, z: pos.z }, true);
    this.body.setNextKinematicTranslation({ x: pos.x, y: cy, z: pos.z });
    this.curFeet.set(pos.x, pos.y + 0.03, pos.z);
    this.prevFeet.copy(this.curFeet);
    this.yaw = yaw;
    this.vel.set(0, 0, 0);
    this.vy = 0;
    this.path = null;
  }

  get feet() {
    return this.curFeet;
  }

  eyePos(out = new Vector3()) {
    return this.n.headWorldPos(out);
  }

  // ------------------------------------------------------------------ senses

  isDark(area) {
    return area === 'attic' || this.player.camera.position.y < 0.2;
  }

  sightRange() {
    const pArea = this.nav.locate(this.player.curFeet);
    const info = pArea ? this.nav.areaInfo.get(pArea) : null;
    let r = A.rangeDay;
    if (this.player.camera.position.y < 0.2) r = A.rangeDark;
    else if (info?.indoor) r = A.rangeIndoor;
    if (this.player.crouching) r *= 0.75;
    return r * this.diff.sight;
  }

  // How many of the player's 5 sample points can he see, and is it in the peripheral band?
  look() {
    const p = this.player;
    if (p.hiding || p.noclip || this.game.state !== 'play') return { visible: 0 };
    const eye = this.eyePos(_v);
    const fwd = _w.set(Math.sin(this.headYaw()), 0, Math.cos(this.headYaw()));
    const cam = p.camera.position;
    const toP = _d.copy(cam).sub(eye);
    const dist = toP.length();
    const range = this.sightRange();
    if (dist > range) return { visible: 0, dist };
    const flat = toP.clone().setY(0).normalize();
    const ang = Math.acos(MathUtils.clamp(flat.dot(fwd), -1, 1)) / DEG;
    const half = A.fov / 2;
    if (ang > half) return { visible: 0, dist };
    const peripheral = ang > half - A.peripheral;
    const feet = p.curFeet;
    const crouchK = p.crouching ? 0.6 : 1;
    const side = new Vector3(-flat.z, 0, flat.x).multiplyScalar(0.25);
    const pts = [
      cam.clone(),
      feet.clone().add(new Vector3(0, 1.2 * crouchK, 0)),
      feet.clone().add(new Vector3(0, 0.9 * crouchK, 0)),
      feet.clone().add(new Vector3(0, 1.1 * crouchK, 0)).add(side),
      feet.clone().add(new Vector3(0, 1.1 * crouchK, 0)).sub(side),
    ];
    let visible = 0;
    const filter = groups(GROUP.NEIGHBOR, GROUP.STATIC | GROUP.PROP);
    for (const pt of pts) {
      const dir = pt.clone().sub(eye);
      const len = dir.length();
      dir.divideScalar(len);
      const hit = this.physics.raycast(eye, dir, len, this.collider, filter);
      if (!hit || hit.toi > len - 0.15) visible++;
    }
    return { visible, dist, peripheral, range };
  }

  headYaw() {
    return this.yaw + this.anim.headLook.yaw;
  }

  updateSight(dt) {
    const s = this.look();
    this.canSee = s.visible > 0;
    if (this.canSee) {
      const closeness = Math.max(0.15, 1 - s.dist / s.range);
      const moving = this.player.horizSpeed > 0.4 ? 1 : 0.45;
      const crouch = this.player.crouching ? 0.55 : 1;
      const per = s.peripheral ? A.peripheralRate : 1;
      const rate = A.detectRate * this.diff.detect * closeness * (s.visible / 5) * moving * crouch * per;
      // point blank: instant
      this.meter = Math.min(1, this.meter + rate * dt * (s.dist < 2.5 ? 3 : 1));
      this.lastSeen = { pos: this.player.curFeet.clone(), t: this.time };
      this.timeSinceSeen = 0;
    } else {
      this.timeSinceSeen += dt;
      if (this.state !== S.CHASE) this.meter = Math.max(0, this.meter - A.detectDecay * dt);
    }
    // saw the player duck into a hiding spot
    if (this.player.hiding && this.timeSinceSeen < 0.6 && this.meter > 0.5) this.knownHideSpot = this.player.hideSpot;
  }

  hear(e) {
    if (this.frozen || this.state === S.CATCH || this.game.state !== 'play') return;
    if (e.loudness <= 0.01) return;
    const ear = this.eyePos(_v);
    const dist = ear.distanceTo(e.position);
    let heard = e.global ? e.loudness : e.loudness * Math.max(0, 1 - dist / (A.noiseRange * Math.max(0.3, e.loudness)));
    if (!e.global && heard > 0) heard *= Math.pow(A.wallAttenuation, this.countWalls(ear, e.position));
    heard *= this.diff.hearing;
    if (heard < A.hearingThreshold) return;
    // lure fatigue: the third time the same trick is used, he just looks around
    if (e.lure) {
      const n = (this.lureFatigue[e.lure] = (this.lureFatigue[e.lure] || 0) + 1);
      if (n >= (this.game.brain?.lureLimit?.(e.lure) ?? 99)) {
        this.n.setExpression('suspicious');
        return;
      }
    }
    this.lastNoiseT = this.time;
    this.lastHeard = { pos: e.position.clone(), t: this.time, kind: e.kind, loudness: heard };
    Events.emit('neighbor:heard', { kind: e.kind, position: e.position });
    if (this.state === S.CHASE || this.state === S.SPOT || this.state === S.STUNNED || this.state === S.STARE) {
      if (this.state === S.CHASE && !this.canSee) this.lastSeen = { pos: e.position.clone(), t: this.time };
      return;
    }
    if (this.state === S.ADAPT) return;
    this.investigateTarget = e.position.clone();
    this.setState(S.HEAR);
  }

  countWalls(a, b) {
    const dir = b.clone().sub(a);
    let len = dir.length();
    dir.divideScalar(len);
    let n = 0;
    const p = a.clone();
    const filter = groups(GROUP.NEIGHBOR, GROUP.STATIC);
    while (n < 5) {
      const hit = this.physics.raycast(p, dir, len, this.collider, filter);
      if (!hit) break;
      n++;
      p.copy(hit.point).addScaledVector(dir, 0.4);
      len -= hit.toi + 0.4;
      if (len <= 0) break;
    }
    return n;
  }

  onContact(e) {
    const mine = (d) => d && d.kind === 'neighbor';
    const prop = mine(e.a) ? e.b : mine(e.b) ? e.a : null;
    if (!prop || prop.kind !== 'prop') return;
    if (e.force < 60) return;
    const body = prop.entry?.body;
    if (!body) return;
    const v = body.linvel();
    const speed = Math.hypot(v.x, v.y, v.z);
    if (speed < 3.5 || !prop.entry.thrownRecently) return;
    // a thrown thing hit him: flinch, then come running
    const hitHead = body.translation().y > this.curFeet.y + 1.5;
    Events.emit('neighbor:hit', { head: hitHead });
    if (this.state !== S.CHASE && this.state !== S.CATCH) {
      this.lastSeen = { pos: this.player.curFeet.clone(), t: this.time };
      this.setState(S.STUNNED);
    }
  }

  // ------------------------------------------------------------------ state machine

  setState(s, data = {}) {
    const prev = this.state;
    this.state = s;
    this.stateTime = 0;
    this.stateData = data;
    this.path = null;
    Events.emit('neighbor:state', { state: s, prev });
    switch (s) {
      case S.HEAR:
        this.targetSpeed = 0;
        this.anim.play('hear', 0.12);
        this.n.setExpression('alarmed');
        this.vel.multiplyScalar(0.2);
        Events.emit('voice', { line: 'hm', position: this.curFeet.clone() });
        break;
      case S.INVESTIGATE:
        this.anim.play('walk');
        this.n.setExpression('curious');
        this.lookAroundT = MathUtils.randFloat(...A.investigateLook);
        break;
      case S.SUSPICIOUS:
        this.anim.play('sneak');
        this.n.setExpression('suspicious');
        break;
      case S.SPOT:
        this.targetSpeed = 0;
        this.vel.multiplyScalar(0.1);
        this.anim.play('spot', 0.08);
        this.n.setExpression('alarmed');
        Events.emit('neighbor:spotted', { position: this.curFeet.clone() });
        Events.emit('voice', { line: 'hey', position: this.curFeet.clone() });
        break;
      case S.CHASE:
        this.anim.play('run', 0.2);
        this.n.setExpression('angry');
        this.runRamp = 0;
        this.knownHideSpot = this.knownHideSpot ?? null;
        break;
      case S.SEARCH:
        this.anim.play('walk');
        this.n.setExpression('suspicious');
        this.buildSearchList();
        break;
      case S.LOST:
        this.anim.play('lost', 0.2);
        this.n.setExpression('angry');
        this.targetSpeed = 0;
        Events.emit('neighbor:lost', {});
        break;
      case S.STUNNED:
        this.anim.play('hear', 0.05);
        this.n.setExpression('scream');
        this.targetSpeed = 0;
        Events.emit('voice', { line: 'ow', position: this.curFeet.clone() });
        break;
      case S.STARE:
        this.anim.play('idle');
        this.n.setExpression('angry');
        this.targetSpeed = 0;
        Events.emit('voice', { line: 'pant', position: this.curFeet.clone() });
        break;
      case S.PATROL:
        this.anim.play('walk');
        this.n.setExpression('suspicious');
        this.meter = Math.min(this.meter, 0.15);
        break;
      case S.CATCH:
        this.targetSpeed = 0;
        this.vel.set(0, 0, 0);
        break;
      default:
        break;
    }
  }

  update(dt) {
    if (this.frozen || this.state === S.DISABLED) {
      this.anim.update(dt);
      this.n.update(dt);
      return;
    }
    this.time += dt;
    this.stateTime += dt;
    if (this.state !== S.CATCH) this.updateSight(dt);
    const p = this.player;
    const pFeet = p.curFeet;
    const myFeet = this.curFeet;
    const dist = Math.hypot(pFeet.x - myFeet.x, pFeet.z - myFeet.z);

    // anything -> spotted
    if (this.meter >= 1 && ![S.CHASE, S.SPOT, S.CATCH, S.STARE, S.STUNNED].includes(this.state)) {
      if (this.game.brain) this.game.brain.onSpotted?.();
      this.setState(S.SPOT);
    } else if (this.meter > A.suspicious && [S.PATROL, S.ACTIVITY, S.INVESTIGATE].includes(this.state)) {
      this.setState(S.SUSPICIOUS);
    }

    switch (this.state) {
      case S.PATROL: this.tickPatrol(dt); break;
      case S.ACTIVITY: this.tickActivity(dt); break;
      case S.HEAR:
        this.faceToward(this.investigateTarget, dt, 12);
        this.anim.headTarget = this.investigateTarget;
        if (this.stateTime > A.hearReactTime) this.setState(S.INVESTIGATE);
        break;
      case S.INVESTIGATE: this.tickInvestigate(dt); break;
      case S.SUSPICIOUS: this.tickSuspicious(dt); break;
      case S.SPOT:
        this.faceToward(pFeet, dt, 14);
        this.anim.headTarget = p.camera.position;
        if (this.stateTime > 0.55) this.setState(S.CHASE);
        break;
      case S.CHASE: this.tickChase(dt, dist); break;
      case S.SEARCH: this.tickSearch(dt); break;
      case S.LOST:
        if (this.stateTime > 3.0) this.setState(S.PATROL);
        break;
      case S.STUNNED:
        if (this.stateTime > A.stunTime) {
          this.meter = 1;
          this.setState(S.CHASE);
          this.n.noseHeat = 1;
        }
        break;
      case S.STARE:
        this.faceToward(pFeet, dt, 6);
        this.anim.headTarget = p.camera.position;
        if (this.stateTime > A.stareTime) {
          this.meter = 0;
          this.setState(S.PATROL);
        }
        break;
      default: break;
    }

    // eyes always track the player if he can see them
    this.n.lookTarget = this.canSee || this.state === S.CHASE || this.state === S.STARE ? p.camera.position : this.anim.headTarget;
    // nose heat while running
    this.n.noseHeat = MathUtils.damp(this.n.noseHeat, this.state === S.CHASE ? 1 : 0, 0.8, dt);
    this.anim.speed = this.speed;
    this.anim.update(dt);
    this.n.update(dt);
    this.game.debugInfo = { state: this.state, meter: this.meter };
  }

  // ---------------------------------------------------------------- patrol & activities

  pickActivity() {
    const recent = this._lastActivities || [];
    const opts = ACTIVITIES.filter((a) => !recent.includes(a.id));
    const extra = this.game.brain?.patrolBias?.() || {};
    let total = 0;
    for (const a of opts) total += a.w * (extra[a.id] ?? 1);
    let r = Math.random() * total;
    for (const a of opts) {
      r -= a.w * (extra[a.id] ?? 1);
      if (r <= 0) {
        this._lastActivities = [...recent, a.id].slice(-3);
        return a;
      }
    }
    return opts[0];
  }

  tickPatrol(dt) {
    if (!this.activity) {
      // the brain may want a trap or camera installed first
      const job = this.game.brain?.nextJob?.();
      if (job) {
        this.activity = { ...job, job: true };
      } else this.activity = this.pickActivity();
      this.goal = new Vector3(...this.activity.pos);
      this.path = null;
    }
    this.anim.headTarget = null;
    this.targetSpeed = A.walkSpeed;
    if (this.anim.clip !== 'walk') this.anim.play('walk');
    if (this.followPath(dt, this.goal, 0.35)) this.setState(S.ACTIVITY);
  }

  tickActivity(dt) {
    const a = this.activity;
    if (!a) { this.setState(S.PATROL); return; }
    if (this.stateTime < dt * 1.5) {
      this.dur = Array.isArray(a.dur) ? MathUtils.randFloat(a.dur[0], a.dur[1]) : a.dur;
      if (a.sit) {
        this.teleport(new Vector3(a.sit[0], NH.F0.y, a.sit[1]), a.sit[2]);
      }
      this.anim.play(a.anim, 0.35);
      if (a.expr) this.n.setExpression(a.expr);
      if (a.job) this.game.brain?.startJob?.(a);
    }
    this.targetSpeed = 0;
    if (!a.sit) this.faceToward(new Vector3(...a.face), dt, 3);
    this.anim.headTarget = a.lookAtPlayerHouse ? new Vector3(2.8, 2.2, 14) : new Vector3(...a.face);
    // dozing in front of the TV if it's quiet
    if (a.id === 'tv' && this.time - this.lastNoiseT > 8 && this.stateTime > 6 && this.anim.clip !== 'doze') {
      this.anim.play('doze', 1.2);
      this.n.setExpression('sleepy');
      Events.emit('voice', { line: 'snore', position: this.curFeet.clone(), loop: true });
    }
    if (this.stateTime > this.dur || (a.anim !== 'idle' && a.anim !== 'sit' && a.anim !== 'doze' && this.anim.clipDone)) {
      if (a.job) this.game.brain?.finishJob?.(a);
      if (a.sit) this.teleport(new Vector3(a.pos[0], a.pos[1], a.pos[2]), this.yaw);
      this.activity = null;
      this.setState(S.PATROL);
    }
  }

  tickInvestigate(dt) {
    const t = this.investigateTarget;
    this.targetSpeed = A.investigateSpeed;
    this.anim.headTarget = null;
    if (this.stateData.arrived) {
      this.targetSpeed = 0;
      if (this.anim.clip !== 'lookAround') this.anim.play('lookAround', 0.3);
      if (this.stateTime > this.lookAroundT) {
        Events.emit('voice', { line: 'mutter', position: this.curFeet.clone() });
        this.activity = null;
        this.setState(S.PATROL);
      }
      return;
    }
    if (this.anim.clip !== 'walk') this.anim.play('walk');
    if (this.followPath(dt, t, 1.0)) {
      this.stateData.arrived = true;
      this.stateTime = 0;
    }
    if (this.stateTime > 25) this.setState(S.PATROL);
  }

  tickSuspicious(dt) {
    const p = this.player;
    this.anim.headTarget = p.camera.position;
    if (this.lastSeen) this.faceToward(this.lastSeen.pos, dt, 4);
    this.targetSpeed = this.canSee ? A.sneakSpeed * 0.6 : A.sneakSpeed;
    if (this.lastSeen && this.curFeet.distanceTo(this.lastSeen.pos) > 1.5) this.followPath(dt, this.lastSeen.pos, 1.2);
    if (this.meter < 0.08) {
      Events.emit('voice', { line: 'mutter', position: this.curFeet.clone() });
      if (this.lastSeen && this.time - this.lastSeen.t < 6) {
        this.investigateTarget = this.lastSeen.pos.clone();
        this.setState(S.INVESTIGATE);
      } else this.setState(S.PATROL);
    }
  }

  // ---------------------------------------------------------------- chase

  tickChase(dt, dist) {
    const p = this.player;
    this.runRamp = Math.min(1, this.runRamp + dt / A.runAccelTime);
    this.targetSpeed = MathUtils.lerp(A.walkSpeed, this.diff.runSpeed, this.runRamp);
    this.anim.headTarget = p.camera.position;
    // he stops at the player's property line and stares, breathing heavily
    const pArea = this.nav.locate(p.curFeet);
    if (pArea === 'playerYard' || pArea === 'playerHouse' || p.curFeet.z > 6.2) {
      const edge = new Vector3(MathUtils.clamp(p.curFeet.x, -16, 16), 0, 5.0);
      if (this.followPath(dt, edge, 0.6) || this.curFeet.z > 4.2) this.setState(S.STARE);
      return;
    }
    // catch
    const dy = Math.abs(p.curFeet.y - this.curFeet.y);
    if (dist < A.catchDistance && dy < 1.3 && !p.hiding && (this.canSee || dist < 0.8)) {
      this.game.startCatch();
      return;
    }
    // he saw where you hid
    if (p.hiding && this.knownHideSpot) {
      this.searchList = [this.knownHideSpot];
      this.searchIdx = 0;
      this.setState(S.SEARCH, { forced: true });
      return;
    }
    if (!this.canSee && this.timeSinceSeen > A.loseSightTime) {
      this.setState(S.SEARCH);
      return;
    }
    const target = this.canSee ? p.curFeet : this.lastSeen?.pos ?? p.curFeet;
    this.followPath(dt, target, 0.2, true);
  }

  // ---------------------------------------------------------------- search

  buildSearchList() {
    if (this.stateData?.forced) return;
    const center = this.lastSeen?.pos ?? this.curFeet;
    const spots = (this.game.world.hideSpots || []).filter((s) => Math.abs(s.floorY - center.y) < 1.5 && s.eye.distanceTo(center) < A.searchRadius);
    spots.sort((a, b) => a.eye.distanceTo(center) - b.eye.distanceTo(center));
    const n = MathUtils.randInt(A.searchMin, A.searchMax);
    const out = [];
    const favored = this.game.brain?.favoredHideSpots?.() || new Set();
    for (const s of spots) {
      if (favored.has(s.id)) out.unshift(s);
      else if (Math.random() > A.searchSkip) out.push(s);
      if (out.length >= n) break;
    }
    if (this.knownHideSpot && !out.includes(this.knownHideSpot)) out.unshift(this.knownHideSpot);
    this.searchList = out;
    this.searchIdx = 0;
    this.searchPhase = 0;
  }

  tickSearch(dt) {
    const spot = this.searchList[this.searchIdx];
    if (!spot) { this.knownHideSpot = null; this.setState(S.LOST); return; }
    if (this.searchPhase === 0) {
      this.targetSpeed = this.stateData?.forced ? this.diff.runSpeed * 0.7 : A.walkSpeed * 1.2;
      if (this.anim.clip !== 'walk' && this.anim.clip !== 'run') this.anim.play(this.stateData?.forced ? 'run' : 'walk');
      if (this.followPath(dt, spot.checkFrom, 0.45) || this.stateTime > 14) {
        this.searchPhase = 1;
        this.stateTime = 0;
        const under = ['underBed', 'underTable', 'behind'].includes(spot.kind);
        this.anim.play(under ? 'searchUnder' : 'searchOpen', 0.2);
        Events.emit('hide:searching', { spot });
      }
      return;
    }
    this.targetSpeed = 0;
    this.faceToward(spot.eye, dt, 8);
    this.anim.headTarget = spot.eye;
    // the reveal: is the player in here?
    if (this.searchPhase === 1 && this.stateTime > 0.75) {
      this.searchPhase = 2;
      Events.emit('hide:checked', { spot });
      if (this.player.hiding && this.player.hideSpot === spot) {
        this.game.startCatch({ fromHide: spot });
        return;
      }
    }
    if (this.searchPhase === 2 && this.stateTime > 1.6) {
      Events.emit('voice', { line: 'exhale', position: this.curFeet.clone() });
      this.searchIdx++;
      this.searchPhase = 0;
      this.stateTime = 0;
    }
  }

  onAnimEvent(name) {
    Events.emit('neighbor:anim', { name, position: this.curFeet.clone() });
  }

  // ---------------------------------------------------------------- movement

  faceToward(target, dt, rate = A.turnRate) {
    if (!target) return;
    const dx = target.x - this.curFeet.x, dz = target.z - this.curFeet.z;
    if (dx * dx + dz * dz < 1e-4) return;
    const want = Math.atan2(dx, dz);
    let d = want - this.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.yaw += MathUtils.clamp(d, -rate * dt, rate * dt);
  }

  // Walk along a path to goal. Returns true when within `tol` of it.
  followPath(dt, goal, tol = 0.4, chasing = false) {
    this.repathT -= dt;
    const goalMoved = !this.goal || this.goal.distanceToSquared(goal) > 0.5;
    if (!this.path || (this.repathT <= 0 && (chasing || goalMoved))) {
      this.goal = goal.clone();
      this.path = this.nav.findPath(this.curFeet, goal, {
        blocked: (e) => e.door && this.game.world.doors.get(e.door)?.boards > 0,
        avoidAreas: new Set(['playerYard']),
      });
      this.pathIdx = 1;
      this.repathT = A.repathInterval;
      if (!this.path) {
        // no route: walk straight at it
        this.path = [{ pos: this.curFeet.clone() }, { pos: goal.clone() }];
      }
    }
    // final approach: if close and in sight of the goal, beeline
    const flatDist = Math.hypot(goal.x - this.curFeet.x, goal.z - this.curFeet.z);
    if (flatDist < tol && Math.abs(goal.y - this.curFeet.y) < 1.3) {
      this.desired = null;
      return true;
    }
    let wp = this.path[Math.min(this.pathIdx, this.path.length - 1)];
    // advance waypoints
    while (wp && this.pathIdx < this.path.length - 1 && Math.hypot(wp.pos.x - this.curFeet.x, wp.pos.z - this.curFeet.z) < (wp.edge?.type === 'door' ? 0.35 : wp.edge?.type === 'stairs' ? 0.15 : 0.6)) {
      this.pathIdx++;
      wp = this.path[this.pathIdx];
    }
    // doors along the way: open them (bang when chasing)
    for (let i = this.pathIdx; i < Math.min(this.path.length, this.pathIdx + 2); i++) {
      const e = this.path[i].edge;
      if (e?.door) {
        const door = this.game.world.doors.get(e.door);
        if (door && !door.isOpen && door.worldCenter(_v).distanceTo(this.curFeet) < A.doorOpenDist + 1.2) {
          door.forceOpen?.(this.curFeet, chasing) ?? door.open(this.curFeet, chasing);
        }
      }
      if (e?.type?.startsWith?.('gate:')) {
        const gate = this.game.world.doors.get(e.type.slice(5));
        if (gate && !gate.isOpen && gate.worldCenter(_v).distanceTo(this.curFeet) < 2.5) gate.open(this.curFeet, chasing);
      }
    }
    // shove open any door right in front while running
    if (chasing) for (const d of this.game.world.doors.near(this.curFeet, 1.2)) if (!d.isOpen && !d.locked) d.open(this.curFeet, true);
    // on stairs the risers would read as walls to the avoidance rays
    const et = wp.edge?.type;
    this.onStairs = et === 'stairs' || et === 'steps' || Math.abs(wp.pos.y - this.curFeet.y) > 0.25;
    let target = (this.pathIdx >= this.path.length - 1 && chasing && this.canSee) ? goal : wp.pos;
    this.stairEdge = null;
    // stairs: follow the stair's center line (pure pursuit) so he never clips the banister
    if (wp.edge?.type === 'stairs' && wp.fromNode) {
      const a = wp.fromNode.pos, b = wp.pos;
      const ab = _w.set(b.x - a.x, 0, b.z - a.z);
      const len = ab.length();
      ab.divideScalar(len);
      const t = MathUtils.clamp((this.curFeet.x - a.x) * ab.x + (this.curFeet.z - a.z) * ab.z + 0.9, 0, len);
      target = _d.set(a.x + ab.x * t, b.y, a.z + ab.z * t);
      // once he's lined up at the foot of the flight, ride the line (KCC autostep is unreliable on risers)
      const along = (this.curFeet.x - a.x) * ab.x + (this.curFeet.z - a.z) * ab.z;
      const lat = Math.abs((this.curFeet.x - a.x) * ab.z - (this.curFeet.z - a.z) * ab.x);
      if (along > -0.4 && along < len + 0.2 && lat < 0.7) this.stairEdge = { a: a.clone(), b: b.clone(), len, dir: ab.clone() };
    }
    this.desired = target.clone();
    return false;
  }

  fixedUpdate(dt) {
    if (this.frozen || this.state === S.DISABLED || this.state === S.CATCH) {
      this.prevFeet.copy(this.curFeet);
      return;
    }
    this.prevFeet.copy(this.curFeet);
    // speed ramps
    const accel = this.state === S.CHASE ? 9 : A.accel;
    this.speed = MathUtils.clamp(this.speed + Math.sign(this.targetSpeed - this.speed) * accel * dt, 0, Math.max(this.speed, this.targetSpeed));
    if (Math.abs(this.targetSpeed - this.speed) < accel * dt) this.speed = this.targetSpeed;
    // desired horizontal velocity
    const want = new Vector3();
    if (this.desired && this.speed > 0.01) {
      want.set(this.desired.x - this.curFeet.x, 0, this.desired.z - this.curFeet.z);
      const l = want.length();
      if (l > 1e-3) want.multiplyScalar(this.speed / l);
      // simple avoidance: feel ahead and to the sides
      if (!this.onStairs) this.avoid(want, dt);
    }
    if (this.sidestep) {
      this.sidestep.t -= dt;
      want.copy(this.sidestep.dir).multiplyScalar(Math.max(1.2, this.speed * 0.6));
      if (this.sidestep.t <= 0) this.sidestep = null;
    }
    const turnAcc = this.state === S.CHASE ? A.runTurnAccel : 14;
    this.vel.x += MathUtils.clamp(want.x - this.vel.x, -turnAcc * dt, turnAcc * dt);
    this.vel.z += MathUtils.clamp(want.z - this.vel.z, -turnAcc * dt, turnAcc * dt);
    if (want.lengthSq() < 1e-4 && this.speed < 0.05) this.vel.multiplyScalar(0.8);
    // face where he's going
    if (this.vel.lengthSq() > 0.05 && ![S.STARE, S.SPOT, S.HEAR].includes(this.state)) {
      const want2 = Math.atan2(this.vel.x, this.vel.z);
      let d = want2 - this.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.yaw += MathUtils.clamp(d, -A.turnRate * dt, A.turnRate * dt);
    }
    if (this.stairEdge && this.speed > 0.01 && !this.sidestep) {
      this._rideStairs(dt);
      this.lastPos.copy(this.curFeet);
      return;
    }
    this.vy = this.vy + CONFIG.physics.gravity * dt;
    const desired = { x: this.vel.x * dt, y: this.vy * dt, z: this.vel.z * dt };
    this.cc.computeColliderMovement(this.collider, desired, RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, groups(GROUP.NEIGHBOR, GROUP.STATIC | GROUP.PROP));
    const m = this.cc.computedMovement();
    const t = this.body.translation();
    this.body.setNextKinematicTranslation({ x: t.x + m.x, y: t.y + m.y, z: t.z + m.z });
    if (this.cc.computedGrounded()) this.vy = -1;
    this.curFeet.set(t.x + m.x, t.y + m.y - this.half - A.radius, t.z + m.z);
    // stuck detection: nudge sideways and repath
    if (this.speed > 0.5) {
      const moved = Math.hypot(this.curFeet.x - this.lastPos.x, this.curFeet.z - this.lastPos.z);
      this.stuckT = moved < this.speed * dt * 0.2 ? this.stuckT + dt : 0;
      if (this.stuckT > 0.8) {
        this.stuckT = 0;
        this.path = null;
        const side = new Vector3(-this.vel.z, 0, this.vel.x).normalize().multiplyScalar(Math.random() < 0.5 ? -1 : 1);
        this.sidestep = { dir: side.add(this.vel.clone().normalize().multiplyScalar(-0.6)).normalize(), t: 0.6 };
      }
    }
    this.lastPos.copy(this.curFeet);
    if (this.curFeet.y < -20) this.teleport(new Vector3(6, NH.F0.y, -22));
  }

  // Kinematic stair travel: slide along the flight's center line with height
  // interpolated between the landings.
  _rideStairs(dt) {
    const { a, b, len, dir } = this.stairEdge;
    const f = this.curFeet;
    let t = (f.x - a.x) * dir.x + (f.z - a.z) * dir.z;
    t = MathUtils.clamp(t + this.speed * 0.8 * dt, 0, len);
    const cx = a.x + dir.x * t, cz = a.z + dir.z * t;
    // keep progress along the line, decay sideways offset onto it
    const lat = (f.x - a.x) * dir.z - (f.z - a.z) * dir.x;
    const keep = lat * Math.max(0, 1 - dt * 8);
    const nx = cx + dir.z * keep, nz = cz - dir.x * keep;
    const s = t / len;
    const ny = MathUtils.lerp(a.y, b.y, s);
    this.vel.set(dir.x * this.speed * 0.8, 0, dir.z * this.speed * 0.8);
    this.vy = 0;
    const want2 = Math.atan2(dir.x, dir.z);
    let d = want2 - this.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.yaw += MathUtils.clamp(d, -A.turnRate * dt, A.turnRate * dt);
    const cy = ny + this.half + A.radius + 0.03;
    this.body.setNextKinematicTranslation({ x: nx, y: cy, z: nz });
    f.set(nx, ny + 0.03, nz);
    this.stuckT = 0;
  }

  // Local avoidance: if the way ahead is blocked (furniture, table tops at
  // chest height), pick the clearest nearby heading from a fan of candidates.
  avoid(want, dt) {
    const base = want.clone().normalize();
    const look = Math.min(1.5, 0.7 + this.speed * 0.15);
    const filter = groups(GROUP.NEIGHBOR, GROUP.STATIC | GROUP.PROP);
    const up = new Vector3(0, 1, 0);
    const clear = (dir) => {
      let best = look;
      for (const h of [0.45, 1.3]) {
        const o = new Vector3(this.curFeet.x, this.curFeet.y + h, this.curFeet.z);
        const hit = this.physics.raycast(o, dir, look, this.collider, filter);
        if (hit && !(hit.data && (hit.data.kind === 'door' || hit.data.kind === 'player'))) best = Math.min(best, hit.toi);
      }
      return best;
    };
    if (clear(base) >= look * 0.95) return;
    let bestDir = null, bestScore = -Infinity;
    for (const a of [25, -25, 50, -50, 75, -75, 100, -100]) {
      const d = base.clone().applyAxisAngle(up, a * DEG);
      const c = clear(d);
      const score = c - Math.abs(a) * 0.004;
      if (c >= look * 0.95) { bestDir = d; break; }
      if (score > bestScore) { bestScore = score; bestDir = d; }
    }
    if (bestDir) want.copy(bestDir.multiplyScalar(want.length()));
  }

  // Called each render frame: interpolate the model to the physics position.
  syncModel(alpha) {
    const r = this.n.root;
    r.position.lerpVectors(this.prevFeet, this.curFeet, alpha);
    r.rotation.y = this.yaw;
  }

  dispose() {
    this.offNoise(); this.offFoot(); this.offLand(); this.offContact();
  }
}

export { ACTIVITIES };
