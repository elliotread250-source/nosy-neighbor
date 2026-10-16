// Act 1: the intro, the chain of keys and tools, the washing machine puzzle,
// the caged basement key, the final run, and the long walk down.
import { Vector3, Group, Mesh, TubeGeometry, CatmullRomCurve3, SphereGeometry, MathUtils, MeshBasicMaterial, Euler, Quaternion } from 'three';
import { Events } from '../core/Events.js';
import { RAPIER, GROUP, groups } from '../core/Physics.js';
import { makeMat } from '../art/Materials.js';
import { roundedBox, chamferCylinder } from '../art/Geo.js';
import { NH, FLOOR_Y } from '../world/NeighborPlan.js';
import { PLAYER_HOUSE } from '../world/PlayerHouse.js';
import { buildEndingSet, END } from '../world/EndingSet.js';

const _v = new Vector3();
const _m = new Euler(0, 0, 0, 'YXZ');

// what the HUD says as you make progress
const OBJECTIVES = {
  start: 'Find out what\'s in the basement.',
  key_red: 'A red key. There\'s a red door upstairs.',
  wrench: 'A wrench. That rusty valve by the kiddie pool...',
  key_blue: 'The blue key. The kid\'s room upstairs.',
  crowbar: 'A crowbar. Those boards on the third floor won\'t hold.',
  key_green: 'The green key. That bolted-on room on the side.',
  magnet: 'A magnet gun. Something metal hangs high in the upstairs hall.',
  key_attic: 'The attic key. Up into the tower.',
  note: 'A washing machine and three numbers. The mudroom...',
  washer: 'A secret tunnel under the washer.',
  key_basement: 'The basement key! He\'s guarding the hall now. Lure him away.',
};

export class Story {
  constructor(game) {
    this.game = game;
    this.ix = game.interaction;
    this.devices = game.devices;
    this.world = game.world;
    this.code = [0, 0, 0].map(() => MathUtils.randInt(1, 9));
    this.knobs = [];
    this.time = 0;
    this.playTime = 0;
    this.trapsSprung = 0;
    this.done = new Set();
    this.mode = null; // 'intro' | 'monitors' | 'note' | 'ending'
    this.ending = buildEndingSet(game.engine.scene, game.lights, game.zones);
    const anchors = this.world.house;
    const pz = this.devices?.puzzleDevices || {};
    if (pz.monitors) this._monitors(pz.monitors);
    if (pz.trunk) this._trunk(pz.trunk);
    if (pz.washer) this._washer(pz.washer);
    if (anchors.tunnelEnd) this._cage(anchors.tunnelEnd);
    this._basementDoorDressing();
    Events.on('key:pickup', (e) => this.progress(`key_${e.color}`));
    Events.on('item:pickup', (e) => { if (['wrench', 'crowbar', 'magnet'].includes(e.item)) this.progress(e.item); });
    Events.on('trap:sprung', () => { this.trapsSprung++; });
    Events.on('key:pickup', (e) => { if (e.color === 'basement') this.finalRun(); });
  }

  progress(id) {
    if (this.done.has(id) || !OBJECTIVES[id]) return;
    this.done.add(id);
    this.game.hud.showObjective(OBJECTIVES[id], 6);
    Events.emit('objective', { id, text: OBJECTIVES[id] });
  }

  // ------------------------------------------------------------ intro
  startIntro() {
    const g = this.game;
    const p = g.player;
    const ai = g.ai;
    if (!ai) { this.progress('start'); return; }
    this.mode = 'intro';
    this.introT = 0;
    p.enabled = false;
    p.externalCamera = true;
    g.storyClock.set(1);
    g.postfx.fade = 0.32;
    ai.frozen = true;
    this.introPath = [new Vector3(-3.4, 0.02, -9.2), new Vector3(-8.6, 0.02, -10.4), new Vector3(-10.3, 0.02, -13.3)];
    ai.teleport(this.introPath[0], -Math.PI / 2);
    g.neighborAnim.play('walk', 0);
    g.neighbor.setExpression('sad');
    // the lumpy sack he drags
    const sack = new Group();
    const mat = makeMat('CARDBOARD', { spec: 0.05 });
    for (const [x, y, z, r] of [[0, 0.32, 0, 0.36], [0.18, 0.2, 0.22, 0.24], [-0.15, 0.22, -0.25, 0.26], [0.05, 0.55, -0.05, 0.2]]) {
      const b = new Mesh(new SphereGeometry(r, 12, 9), mat);
      b.position.set(x, y, z);
      b.scale.y = 0.85;
      b.castShadow = true;
      sack.add(b);
    }
    const tie = new Mesh(chamferCylinder(0.05, 0.08, 0.16, 8, 0.02), mat);
    tie.position.set(0.05, 0.72, 0.0);
    sack.add(tie);
    g.engine.scene.add(sack);
    this.sack = sack;
    const cam = p.camera;
    cam.position.set(2.8, 1.95, 13.8);
    cam.fov = 26;
    cam.updateProjectionMatrix();
    Events.emit('cinematic', { on: true });
    Events.emit('music', { track: 'intro' });
  }

  _updateIntro(dt) {
    const g = this.game;
    const ai = g.ai;
    const cam = g.player.camera;
    this.introT += dt;
    const t = this.introT;
    const path = this.introPath;
    const speed = 1.5;
    const len1 = path[0].distanceTo(path[1]), len2 = path[1].distanceTo(path[2]);
    const walkT = (len1 + len2) / speed;
    let pos, yaw = ai.yaw;
    if (t < walkT) {
      const d = t * speed;
      if (d < len1) { pos = path[0].clone().lerp(path[1], d / len1); yaw = Math.atan2(path[1].x - path[0].x, path[1].z - path[0].z); } else { pos = path[1].clone().lerp(path[2], (d - len1) / len2); yaw = Math.atan2(path[2].x - path[1].x, path[2].z - path[1].z); }
      g.neighborAnim.speed = 1.1;
    } else {
      pos = path[2].clone();
      if (t < walkT + 2.2) {
        if (g.neighborAnim.clip !== 'lookAround') { g.neighborAnim.play('lookAround', 0.3); g.neighbor.setExpression('suspicious'); }
      } else {
        // he sees you in the window
        if (g.neighborAnim.clip !== 'idle') {
          g.neighborAnim.play('idle', 0.4);
          g.neighbor.setExpression('angry');
          Events.emit('sfx', { name: 'stinger' });
        }
        const want = Math.atan2(cam.position.x - pos.x, cam.position.z - pos.z);
        let d = want - ai.yaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        yaw = ai.yaw + MathUtils.clamp(d, -dt * 2.5, dt * 2.5);
        g.neighborAnim.headTarget = cam.position;
        g.neighbor.lookTarget = cam.position;
      }
    }
    ai.yaw = yaw;
    ai.curFeet.copy(pos);
    ai.prevFeet.copy(pos);
    ai.syncModel(1);
    // the sack drags behind him until he drops it at the cellar doors
    const back = new Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    if (t < walkT) {
      this.sack.position.copy(pos).addScaledVector(back, 1.0);
      this.sack.rotation.set(Math.sin(t * 6) * 0.08, yaw, Math.sin(t * 4) * 0.1);
    }
    // camera follows him; zooms in slowly on the stare
    const look = pos.clone().add(new Vector3(0, t > walkT + 2.2 ? 1.6 : 1.0, 0));
    cam.lookAt(look);
    const stare = MathUtils.clamp((t - walkT - 2.4) / 2.5, 0, 1);
    cam.fov = MathUtils.lerp(26, 7, stare * stare * (3 - 2 * stare));
    cam.updateProjectionMatrix();
    const end = walkT + 6.2;
    const skip = t > 1 && g.input.pressedThisFrame.size > 0;
    if (t > end - 0.8) g.postfx.fade = MathUtils.clamp(0.32 + (t - (end - 0.8)) / 0.8, 0, 1);
    if (t > end || skip) this._endIntro();
  }

  _endIntro() {
    const g = this.game;
    const p = g.player;
    this.mode = 'introCard';
    this.cardT = 0;
    g.postfx.fade = 1;
    this.sack.position.set(-9.0, 0.02, -21.0);
    this.world.doors.get('g-west')?.close();
    Events.emit('titlecard', { text: 'The next afternoon...' });
    p.camera.fov = p.fov;
    p.camera.updateProjectionMatrix();
    g.storyClock.set(0);
    g.ai.teleport(new Vector3(6.4, NH.F0.y, -22.4), Math.PI);
    g.ai.frozen = false;
    g.ai.setState('patrol');
    g.neighbor.lookTarget = null;
  }

  _updateCard(dt) {
    const g = this.game;
    this.cardT += dt;
    if (this.cardT > 2.2) {
      const p = g.player;
      this.mode = null;
      p.spawn(PLAYER_HOUSE.bedSpawn, PLAYER_HOUSE.bedSpawnYaw);
      p.externalCamera = false;
      p.enabled = true;
      Events.emit('titlecard', { text: null });
      Events.emit('cinematic', { on: false });
      g.postfx.flash = 0.2;
      this.startTime = this.time;
      this.progress('start');
      Events.emit('music', { track: 'explore' });
    }
    g.postfx.fade = this.cardT > 1.6 ? Math.max(0, 1 - (this.cardT - 1.6) / 0.6) : 1;
  }

  // ------------------------------------------------------------ security monitors (intel)
  _monitors(it) {
    this.monitorObj = it.obj;
    this.cams = [
      { name: 'CAM 1  BASEMENT DOOR', pos: [1.3, 2.75, -15.2], look: [0.2, 0.9, -21.8] },
      { name: 'CAM 2  KITCHEN', pos: [7.7, 2.9, -20.3], look: [3.5, 0.7, -25.2] },
      { name: 'CAM 3  BACK YARD', pos: [13.0, 4.2, -33.5], look: [2.5, 0.2, -27.5] },
    ];
    this.ix.addTarget({ obj: it.obj, label: 'Watch the security monitors', act: () => this.enterMonitors() });
  }

  enterMonitors() {
    const p = this.game.player;
    this.mode = 'monitors';
    this.camIdx = 0;
    this.modeT = 0;
    p.enabled = false;
    p.externalCamera = true;
    this._applyCam();
    Events.emit('sfx', { name: 'click' });
  }

  _applyCam() {
    const c = this.cams[this.camIdx];
    const cam = this.game.player.camera;
    cam.position.set(...c.pos);
    cam.lookAt(...c.look);
    cam.fov = 70;
    cam.updateProjectionMatrix();
    Events.emit('monitor', { on: true, name: c.name });
  }

  exitMonitors() {
    if (this.mode !== 'monitors') return;
    const p = this.game.player;
    this.mode = null;
    p.externalCamera = false;
    p.enabled = true;
    p.camera.fov = p.fov;
    p.camera.updateProjectionMatrix();
    Events.emit('monitor', { on: false });
  }

  _updateMonitors(dt) {
    const inp = this.game.input;
    this.modeT += dt;
    if (this.modeT < 0.25) return;
    if (inp.pressed('interact')) { this.camIdx = (this.camIdx + 1) % this.cams.length; this._applyCam(); Events.emit('sfx', { name: 'click' }); } else if (inp.pressed('drop') || inp.pressed('jump') || inp.moveAxis().some((v) => Math.abs(v) > 0.5)) this.exitMonitors();
  }

  // ------------------------------------------------------------ the trunk's note
  _trunk(it) {
    this.ix.addTarget({
      obj: it.obj,
      label: () => (this.done.has('note') ? 'Read the note again' : 'Open the trunk'),
      act: () => this.showNote(),
    });
  }

  showNote() {
    const p = this.game.player;
    this.mode = 'note';
    this.modeT = 0;
    p.enabled = false;
    Events.emit('sfx', { name: 'paper' });
    Events.emit('note', { open: true, code: this.code });
  }

  _updateNote(dt) {
    this.modeT += dt;
    const inp = this.game.input;
    if (this.modeT > 0.35 && (inp.pressed('interact') || inp.pressed('drop') || inp.pressed('jump'))) {
      this.mode = null;
      this.game.player.enabled = true;
      Events.emit('note', { open: false });
      this.progress('note');
    }
  }

  // ------------------------------------------------------------ the washing machine
  _washer(it) {
    const w = it.obj;
    this.washer = { obj: w, collider: it.collider, open: false, t: 0, base: w.position.clone() };
    if (w.userData.dial) w.userData.dial.visible = false;
    for (let i = 0; i < 3; i++) {
      const knob = new Group();
      const k = new Mesh(chamferCylinder(0.06, 0.06, 0.05, 16, 0.015), makeMat('TOMATO', { spec: 0.5 }));
      k.rotation.x = Math.PI / 2;
      const notch = new Mesh(roundedBox(0.016, 0.05, 0.02, 0.006, 1), makeMat('WHITE'));
      notch.position.set(0, 0.03, 0.03);
      knob.add(k, notch);
      knob.position.set(-0.2 + i * 0.2, 0.83, 0.37);
      knob.userData.noBake = true;
      w.add(knob);
      const state = { knob, value: 1 };
      this.knobs.push(state);
      this.ix.addTarget({
        obj: knob, pad: 0.05,
        label: () => (this.washer.open ? null : `Turn dial ${i + 1} (now ${state.value})`),
        act: () => this.turnKnob(state),
      });
    }
    this.ix.addTarget({ obj: w, label: () => (this.washer.open ? null : 'An old washing machine with three dials'), act: () => Events.emit('sfx', { name: 'clunk' }) });
  }

  turnKnob(s) {
    s.value = (s.value % 9) + 1;
    s.knob.rotation.z = -(s.value - 1) * (Math.PI * 2 / 9);
    Events.emit('sfx', { name: 'dialClick', position: s.knob.getWorldPosition(new Vector3()) });
    if (this.knobs.every((k, i) => k.value === this.code[i])) this.openWasher();
  }

  openWasher() {
    const W = this.washer;
    if (W.open) return;
    W.open = true;
    W.t = 0.001;
    Events.emit('sfx', { name: 'washerShudder', position: W.obj.position.clone() });
    Events.emit('noise', { position: W.obj.position.clone(), loudness: 0.8, kind: 'washer' });
  }

  _updateWasher(dt) {
    const W = this.washer;
    if (!W || !W.t || W.t >= 3) return;
    W.t += dt;
    const shake = W.t < 1.2 ? Math.sin(W.t * 70) * 0.012 : 0;
    const slide = MathUtils.clamp((W.t - 1.2) / 1.5, 0, 1);
    const k = slide * slide * (3 - 2 * slide);
    W.obj.position.set(W.base.x + k * 0.95 + shake, W.base.y, W.base.z + shake * 0.5);
    if (W.t >= 2.7 && !W.moved) {
      W.moved = true;
      const phys = this.game.physics;
      if (W.collider) {
        const tr = W.collider.translation();
        const he = W.collider.halfExtents();
        phys.colliderData.delete(W.collider.handle);
        phys.world.removeCollider(W.collider, true);
        phys.addStaticBox(new Vector3(tr.x + 0.95, tr.y, tr.z), new Vector3(he.x, he.y, he.z));
      }
      const hatch = this.world.interior.hatches.find((h) => h.id === 'h-washer' || h.lock === 'puzzle');
      if (hatch) { hatch.lock = null; hatch.open(); }
      this.progress('washer');
      Events.emit('washer:open', {});
    }
  }

  // ------------------------------------------------------------ the cage at the end of the tunnel
  _cage(end) {
    const floors = this.world.interior.floors;
    const g = new Group();
    const metal = makeMat('METAL_DARK', { spec: 0.5 });
    const cx = -0.3, cy = end.y + 1.3, cz = end.z;
    const W = 0.42, H = 0.6, D = 0.5;
    for (const y of [-H / 2, H / 2]) {
      const plate = new Mesh(roundedBox(W, 0.03, D, 0.01, 1), metal);
      plate.position.set(0, y, 0);
      g.add(plate);
    }
    for (const z of [-D / 2, D / 2]) for (let i = 0; i < 4; i++) {
      const bar = new Mesh(chamferCylinder(0.008, 0.008, H, 5, 0.003), metal);
      bar.position.set(-W / 2 + 0.05 + i * (W - 0.1) / 3, 0, z);
      g.add(bar);
    }
    const door = new Group();
    door.position.set(-W / 2, 0, -D / 2);
    for (let i = 0; i < 5; i++) {
      const bar = new Mesh(chamferCylinder(0.008, 0.008, H, 5, 0.003), metal);
      bar.position.set(0, 0, 0.05 + i * (D - 0.1) / 4);
      door.add(bar);
    }
    const bolt = new Mesh(roundedBox(0.04, 0.08, 0.1, 0.012, 1), makeMat('BRASS', { spec: 0.6 }));
    bolt.position.set(-0.02, 0.05, D - 0.06);
    door.add(bolt);
    g.add(door);
    // a nail on the wall
    const nail = new Mesh(chamferCylinder(0.006, 0.006, 0.08, 5, 0.002), makeMat('METAL'));
    nail.rotation.z = Math.PI / 2;
    nail.position.set(W / 2 - 0.04, 0.12, 0);
    g.add(nail);
    g.position.set(cx, cy, cz);
    g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    floors.UG.add(g);
    // collides with bodies but lets look-rays through (you can see the key)
    const col = this.game.physics.addStaticBox(new Vector3(cx, cy, cz), new Vector3(W / 2, H / 2, D / 2));
    col.setCollisionGroups(groups(GROUP.STATIC, GROUP.PROP | GROUP.NEIGHBOR));
    this.cage = { g, door, open: false, t: 0 };
    const keyPos = new Vector3(cx + W / 2 - 0.06, cy + 0.02, cz);
    this.keyBasement = this.devices.addKey('basement', keyPos, { parent: floors.UG, hanging: true, magnetic: true, rotY: Math.PI / 2, canTake: () => this.cage.open });
    this.ix.addTarget({
      obj: g, pad: 0.04,
      label: () => (this.cage.open ? null : this.ix.inv.has('wrench') ? 'Unbolt the cage with the wrench' : 'A bolted cage (a wrench would do it)'),
      hold: undefined,
      act: () => {
        if (!this.ix.inv.has('wrench')) { Events.emit('sfx', { name: 'rattle' }); return; }
        this.cage.open = true;
        Events.emit('sfx', { name: 'unbolt', position: g.position.clone() });
      },
    });
  }

  // ------------------------------------------------------------ the basement door: three locks, a chain, a padlock
  _basementDoorDressing() {
    const door = this.world.doors.get('d-basement');
    if (!door) return;
    this.basementDoor = door;
    const g = new Group();
    const orange = makeMat('KEY_BASEMENT', { spec: 0.5, emissive: 'KEY_BASEMENT', emissiveIntensity: 0.15 });
    for (let i = 0; i < 3; i++) {
      const lock = new Mesh(roundedBox(0.1, 0.13, 0.05, 0.02, 2), orange);
      lock.position.set(door.w - 0.12, 0.9 + i * 0.32, 0.07);
      g.add(lock);
    }
    const pts = [];
    for (let i = 0; i <= 8; i++) pts.push(new Vector3(0.12 + (door.w - 0.3) * (i / 8), 1.08 + Math.sin(i * 1.3) * 0.05 - Math.sin((i / 8) * Math.PI) * 0.12, 0.08));
    const chain = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), 32, 0.022, 6), makeMat('METAL', { spec: 0.6 }));
    g.add(chain);
    const pad = new Mesh(roundedBox(0.16, 0.18, 0.07, 0.04, 2), orange);
    pad.position.set(door.w * 0.5, 0.86, 0.1);
    g.add(pad);
    g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    door.pivot.add(g);
    this.basementLocks = g;
  }

  doorTarget(door) {
    if (door !== this.basementDoor || door.chains === 0) return undefined;
    if (!this.ix.inv.hasKey('basement')) {
      return { obj: door.slab, label: 'Three locks, a chain and a padlock', act: () => { Events.emit('sfx', { name: 'rattle', position: door.worldCenter() }); Events.emit('noise', { position: door.worldCenter(), loudness: 0.35, kind: 'rattle' }); } };
    }
    return { obj: door.slab, label: 'Unlock the basement door (hold)', hold: 3, holdSfx: 'unlockSequence', act: () => this.unlockBasement() };
  }

  finalRun() {
    const ai = this.game.ai;
    const brain = this.game.brain;
    if (brain) brain.storyBias = { basementDoor: 14 };
    if (ai && !['chase', 'catch', 'spot'].includes(ai.state)) {
      ai.activity = null;
      ai.setState('patrol');
      ai.n.setExpression('angry');
    }
    Events.emit('music', { track: 'tension' });
  }

  unlockBasement() {
    const g = this.game;
    const door = this.basementDoor;
    door.chains = 0;
    this.basementLocks.visible = false;
    door.open(g.player.curFeet);
    Events.emit('sfx', { name: 'chainDrop', position: door.worldCenter() });
    this.startEnding();
  }

  // ------------------------------------------------------------ the ending
  startEnding() {
    const g = this.game;
    const p = g.player;
    this.mode = 'ending';
    this.endT = 0;
    this.endPhase = 'glow';
    p.enabled = false;
    if (g.ai) { g.ai.frozen = true; g.ai.teleport(new Vector3(6.4, NH.F0.y, -22.4), Math.PI); }
    this.ix.onCaught?.(p.curFeet.clone());
    Events.emit('music', { track: 'ending' });
    Events.emit('glow', { on: true });
    Events.emit('cinematic', { on: true });
    this.stats = {
      time: this.time - (this.startTime ?? 0),
      catches: g.catches,
      routes: Object.keys(g.brain?.entryCounts ?? {}).length,
      traps: this.trapsSprung,
    };
  }

  _updateEnding(dt) {
    const g = this.game;
    const p = g.player;
    const cam = p.camera;
    this.endT += dt;
    const t = this.endT;
    const E = this.ending;
    const set = END;
    if (this.endPhase === 'glow') {
      if (t > 1.6) {
        g.postfx.fade = Math.min(1, (t - 1.6) / 0.4);
        if (t > 2.1) {
          this.endPhase = 'stairs';
          this.endT = 0;
          E.root.visible = true;
          p.externalCamera = true;
          Events.emit('glow', { on: false });
          cam.fov = 70;
          cam.updateProjectionMatrix();
          g.world.interior && Object.values(g.world.interior.floors).forEach((f) => { f.visible = false; });
        }
      }
      return;
    }
    const o = set.origin;
    const stairLen = set.steps * set.run;
    if (this.endPhase === 'stairs') {
      g.postfx.fade = Math.max(0, 1 - t / 0.8);
      const speed = 1.45;
      const z = Math.min(stairLen + 0.4, t * speed);
      const y = -Math.min(z, stairLen) * (set.rise / set.run);
      const bob = Math.sin(t * 7.5) * 0.025;
      cam.position.set(o.x + Math.sin(t * 0.9) * 0.05, o.y + y + 1.6 + bob, o.z - z);
      _m.set(-0.42 + Math.sin(t * 0.5) * 0.03, 0, Math.sin(t * 3.7) * 0.012);
      cam.quaternion.setFromEuler(_m);
      if (z >= stairLen + 0.4) { this.endPhase = 'room'; this.endT = 0; }
      return;
    }
    const by = o.y - set.steps * set.rise;
    const bz = o.z - stairLen;
    if (this.endPhase === 'room') {
      const k = MathUtils.clamp(t / 4.2, 0, 1);
      const z = bz - 0.4 - (1 - (1 - k) * (1 - k)) * 1.5;
      cam.position.set(o.x, by + 1.6 + Math.sin(t * 6) * 0.02 * (1 - k), z);
      // glance at the drawing, then back to the door
      const glance = Math.sin(MathUtils.clamp((t - 0.6) / 2.4, 0, 1) * Math.PI);
      _m.set(MathUtils.lerp(-0.25, -0.05, Math.min(1, t)), glance * 0.9, 0);
      cam.quaternion.setFromEuler(_m);
      if (t > 4.6) {
        this.endPhase = 'behind';
        this.endT = 0;
        Events.emit('sfx', { name: 'creak' });
        // he's in the stairwell behind you, a black shape against the bulbs
        const n = g.neighbor;
        const steps = 6;
        const at = new Vector3(o.x, by + steps * set.rise, bz + steps * set.run - 0.1);
        if (g.ai) { g.ai.curFeet.copy(at); g.ai.prevFeet.copy(at); g.ai.yaw = Math.PI; }
        n.root.position.copy(at);
        n.root.rotation.y = Math.PI;
        g.neighborAnim.play('idle', 0);
        n.setExpression('angry');
        const black = new MeshBasicMaterial({ color: 0x07060a, fog: false });
        // his face code tints skin every frame: pin the output to black in the shader
        black.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  gl_FragColor = vec4(0.027, 0.024, 0.04, 1.0);'); };
        n.root.traverse((m) => { if (m.isMesh) { if (m.userData.isOutline) m.visible = false; else m.material = black; } });
        this.silhouette = true;
      }
      return;
    }
    if (this.endPhase === 'behind') {
      const k = MathUtils.clamp((t - 0.5) / 1.1, 0, 1);
      const e = k * k * (3 - 2 * k);
      _m.set(MathUtils.lerp(-0.05, 0.12, e), e * Math.PI, 0);
      cam.quaternion.setFromEuler(_m);
      if (t > 2.6) {
        this.endPhase = 'black';
        this.endT = 0;
        g.postfx.fade = 1;
        Events.emit('sfx', { name: 'doorSlam' });
        Events.emit('music', { track: 'silence' });
      }
      return;
    }
    if (this.endPhase === 'black') {
      g.postfx.fade = 1;
      if (t > 0.8 && !this.lockSfx) { this.lockSfx = true; Events.emit('sfx', { name: 'lockTurn' }); }
      if (t > 2.0 && !this.shownEnd) {
        this.shownEnd = true;
        Events.emit('act:complete', { stats: this.stats });
        g.input.exitLock();
        g.state = 'ended';
      }
    }
  }

  // ------------------------------------------------------------ per frame
  update(dt) {
    this.time += dt;
    switch (this.mode) {
      case 'intro': this._updateIntro(dt); break;
      case 'introCard': this._updateCard(dt); break;
      case 'monitors': this._updateMonitors(dt); break;
      case 'note': this._updateNote(dt); break;
      case 'ending': this._updateEnding(dt); break;
      default: break;
    }
    this._updateWasher(dt);
    if (this.cage?.open && this.cage.t < 1) {
      this.cage.t = Math.min(1, this.cage.t + dt * 2);
      this.cage.door.rotation.y = -this.cage.t * 1.9;
    }
  }

  // before a catch: get out of any camera mode so the lunge frames correctly
  beforeCatch() {
    if (this.mode === 'monitors') this.exitMonitors();
    if (this.mode === 'note') { this.mode = null; this.game.player.enabled = true; Events.emit('note', { open: false }); }
  }
}

export { Quaternion, FLOOR_Y, RAPIER };
