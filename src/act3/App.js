// Act 3 House Study: the app. Loads the tagged spec, applies measurements,
// plans and builds the house, and runs the player, the scale tools, the
// interaction and security systems, the train and the windmill.
import { Vector3, Box3 } from 'three';
import { CONFIG } from '../config.js';
import { Engine } from '../core/Engine.js';
import { Physics } from '../core/Physics.js';
import { Input } from '../core/Input.js';
import { Events } from '../core/Events.js';
import { Player } from '../actors/Player.js';
import { PLAYER } from './assumptions.js';
import { planHouse } from './Plan.js';
import { HouseView } from './HouseBuilder.js';
import { OpeningsView } from './Openings.js';
import { PropsView } from './Props.js';
import { RoofView } from './Roof.js';
import { Train } from './Train.js';
import { Security } from './Security.js';
import { Interact } from './Interact.js';
import { Act3Audio } from './Audio.js';
import { SurveyLighting } from './Scene.js';
import { Tools } from './Tools.js';
import { audit, auditText } from './Audit.js';
import { applyMeasurements } from './Measure.js';
import { val } from './Spec.js';
import { setLook } from './Look.js';
import testHouse from '../../data/act3/test-house.json';
import mainHouse from '../../data/act3/house.json';
import puzzleData from '../../data/act3/puzzle.json';
import securityData from '../../data/act3/security.json';
import trainData from '../../data/act3/train.json';
import measurementsData from '../../data/act3/measurements.json';

const qs = new URLSearchParams(location.search);

// The child player from spec section 18, poured into the shared controller.
function configurePlayer() {
  const P = CONFIG.player;
  Object.assign(P, {
    height: PLAYER.height,
    eyeHeight: PLAYER.eyeHeight,
    crouchHeight: 0.8,
    crouchEyeHeight: 0.7,
    radius: PLAYER.capsuleRadius,
    walkSpeed: PLAYER.walkSpeed,
    sprintSpeed: PLAYER.sprintSpeed,
    crouchSpeed: 1.2,
    jumpVelocity: PLAYER.jumpVelocity,
    coyoteTime: PLAYER.coyoteTime,
    jumpBuffer: PLAYER.jumpBuffer,
    autostepHeight: PLAYER.maxStepHeight,
    autostepMinWidth: 0.12,
    snapToGround: 0.3,
    groundPress: -0.05, // ground snapping holds the player down; a hard press slows stair climbing
    noclipSpeed: 4,
    headBob: !matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
  CONFIG.physics.gravity = -PLAYER.gravity;
  CONFIG.camera.fov = 80;
}

export class App {
  static async create() {
    const a = new App();
    await a.init();
    return a;
  }

  async init() {
    configurePlayer();
    this.specs = { test: testHouse, main: mainHouse };
    this.engine = new Engine(document.getElementById('app'));
    this.physics = await Physics.init();
    this.input = new Input(this.engine.canvas);
    this.lighting = new SurveyLighting(this.engine.scene);
    this.house = new HouseView(this.engine.scene, this.physics);
    this.specName = qs.get('house') || 'main';
    this.mode = 'survey';
    this.audio = new Act3Audio((t) => this.subtitle(t));
    this._hud();
    this.load(this.specs[this.specName] ?? mainHouse);
    this.player = new Player(this.engine, this.physics, this.input);
    this.player.hands.visible = false;
    this.player.ladders = this.ladders;
    const sp = this.spec.spawn?.at ?? this.spec.spawn ?? { x: 2.5, y: 0, z: 2 };
    this.player.spawn(new Vector3(val(sp.x), val(sp.y, 0), val(sp.z)), val(this.spec.spawn?.yaw, 0));
    this.tools = new Tools(this);
    if (this.full) {
      this.interact = new Interact(this);
      this.interact.build(puzzleData, this.plan);
      this.interact.load();
    }
    this._lock();
    this._events();
    this.frame = 0;
    this.loop = this.loop.bind(this);
    window.addEventListener('keydown', (e) => { if (['F3', 'F7', 'F10'].includes(e.code)) e.preventDefault(); });
    requestAnimationFrame(this.loop);
    window.a3 = this;
  }

  load(spec) {
    // measurements first: assumed -> measured upgrades, conflicts flagged
    const applied = applyMeasurements(spec, measurementsData.measurements || []);
    this.spec = applied.spec;
    this.conflicts = applied.conflicts;
    this.plan = planHouse(this.spec);
    this.house.build(this.plan);
    this.audit = audit(this.spec, measurementsData.measurements || []);
    this.full = !!this.spec.features?.length;
    this.ladders = [];
    if (this.full) {
      this.openings = new OpeningsView(this.engine.scene, this.physics).build(this.spec, this.plan);
      this.props = new PropsView(this.engine.scene, this.physics).build(this.spec, this.plan);
      this.train = new Train(this.engine.scene, this.physics, trainData);
      this.roof = new RoofView(this.engine.scene, this.physics).build(this.spec, this.plan, trainData);
      this.security = new Security(this.engine.scene, securityData, this.plan, this.house.meshes);
      for (const l of [...this.props.ladders, ...this.roof.ladders]) {
        const b = new Box3(l.min, l.max);
        b.userData = l;
        this.ladders.push(b);
      }
    }
    if (this.plan.warnings.length) console.warn(this.plan.warnings.join('\n'));
    this._badge();
  }

  // ------------------------------------------------------------ HUD
  _hud() {
    const hud = document.getElementById('hud');
    hud.innerHTML = `
      <div class="a3-cross"></div>
      <div class="a3-badge"></div>
      <div class="a3-hint"></div>
      <div class="a3-sub"></div>
      <div class="a3-alarm">ALARM</div>
      <pre class="a3-panel a3-audit"></pre>
      <pre class="a3-panel a3-stats"></pre>
      <div class="a3-keys">WASD move · Shift sprint · Space jump · C crouch · E use · G drop/grid · R ruler · H height gauge · V survey/style · F7 freecam ([ ] speed) · F10 audit · F3 stats · Esc menu</div>`;
    this.badge = hud.querySelector('.a3-badge');
    this.hintEl = hud.querySelector('.a3-hint');
    this.subEl = hud.querySelector('.a3-sub');
    this.alarmEl = hud.querySelector('.a3-alarm');
    this.auditEl = hud.querySelector('.a3-audit');
    this.statsEl = hud.querySelector('.a3-stats');
  }

  _badge() {
    if (!this.badge) return;
    const m = this.audit.overallMeasured;
    this.badge.innerHTML = `<b>ACT 3 HOUSE STUDY</b> · ${this.mode} mode · rev ${this.spec.revision} · <span class="${m === 0 ? 'zero' : ''}">${m.toFixed(1)}% measured</span>${this.conflicts?.length ? ` · <span class="zero">${this.conflicts.length} conflict(s)</span>` : ''}`;
  }

  hint(text, seconds = 3) {
    this.hintEl.textContent = text;
    this.hintEl.classList.add('show');
    clearTimeout(this._hintT);
    this._hintT = setTimeout(() => this.hintEl.classList.remove('show'), seconds * 1000);
  }

  subtitle(text) {
    if (this.subsOn === false) return;
    this.subEl.textContent = text;
    this.subEl.classList.add('show');
    clearTimeout(this._subT);
    this._subT = setTimeout(() => this.subEl.classList.remove('show'), 2200);
  }

  toggleAudit(on = !this.auditEl.classList.contains('show')) {
    this.auditEl.textContent = auditText(this.audit);
    this.auditEl.classList.toggle('show', on);
    window.a3Audit?.(on);
  }

  setMode(m) {
    this.mode = m;
    setLook(this.engine.scene, m);
    this.styleHooks?.forEach((f) => f(m));
    this._badge();
    this.hint(m === 'survey' ? 'Survey mode: exact geometry, flat light' : 'Style mode: toon look, warp capped at 4 percent');
  }

  _stats() {
    if (!this.statsEl.classList.contains('show') || this.frame % 10) return;
    const p = this.engine.camera.position;
    const r = this.engine.renderer.info.render;
    const lights = this.props ? this.props.lights.filter((l) => l.visible).length : 0;
    this.statsEl.textContent = `frame ${((this.dt ?? 0.016) * 1000).toFixed(1)} ms  (${(1 / Math.max(1e-3, this.dt ?? 0.016)).toFixed(0)} fps)\n` +
      `draw calls ${r.calls}  triangles ${r.triangles}\n` +
      `physics bodies ${this.physics.world.bodies.len()}  awake ${this.physics.dynamics.filter((d) => !d.body.isSleeping()).length}\n` +
      `point lights ${lights}  rooms ${this.plan.floors.reduce((n, f) => n + f.floor.rooms.length, 0)}\n` +
      `eye ${p.x.toFixed(3)} ${p.y.toFixed(3)} ${p.z.toFixed(3)} m  room ${this.roomAt(this.player.curFeet)?.id ?? 'outside'}\n` +
      `player ${PLAYER.height} m (assumed) eye ${PLAYER.eyeHeight} m`;
  }

  roomAt(p) {
    for (const f of this.plan.floors) {
      const y0 = f.floorSlab.y1, y1 = y0 + val(f.floor.ceiling);
      if (p.y < y0 - 0.3 || p.y > y1) continue;
      for (const r of f.floor.rooms) {
        const xs = r.polygon.map((q) => q[0]), zs = r.polygon.map((q) => q[1]);
        if (p.x >= Math.min(...xs) && p.x <= Math.max(...xs) && p.z >= Math.min(...zs) && p.z <= Math.max(...zs)) return r;
      }
    }
    return null;
  }

  // ------------------------------------------------------------ pause menu
  _lock() {
    const ov = document.getElementById('a3-start');
    const menu = document.getElementById('a3-menu');
    const go = () => { this.audio.unlock(); this.input.requestLock(); this.engine.canvas.focus(); };
    ov?.addEventListener('click', go);
    const on = (a, ev, fn) => menu?.querySelector(`[data-a=${a}]`)?.addEventListener(ev, fn);
    on('resume', 'click', go);
    on('reset', 'click', () => this.interact?.reset());
    on('mode', 'click', () => { this.setMode(this.mode === 'survey' ? 'style' : 'survey'); this._menuLabels(); });
    on('quit', 'click', () => { location.href = '/classic.html'; });
    on('vol', 'input', (e) => this.audio.setVolume(+e.target.value));
    on('sens', 'input', (e) => { CONFIG.player.mouseSensitivity = +e.target.value; });
    on('inv', 'change', (e) => { CONFIG.player.invertY = e.target.checked; });
    on('bob', 'change', (e) => { CONFIG.player.headBob = e.target.checked; });
    on('subs', 'change', (e) => { this.subsOn = e.target.checked; this.audio.subs = e.target.checked; });
    on('gfx', 'change', (e) => this.setGraphics(e.target.value));
    this.input.onLockChange = (locked) => {
      if (locked) { ov?.classList.add('hidden'); menu?.classList.add('hidden'); return; }
      if (ov && !ov.classList.contains('hidden')) return;
      menu?.classList.remove('hidden');
      this._menuLabels();
    };
  }

  _menuLabels() {
    const b = document.querySelector('#a3-menu [data-a=mode]');
    if (b) b.textContent = `Mode: ${this.mode} (V)`;
  }

  setGraphics(q) {
    this.graphics = q;
    const sun = this.lighting.sun;
    sun.castShadow = q !== 'low';
    sun.shadow.mapSize.set(q === 'high' ? 2048 : 1024, q === 'high' ? 2048 : 1024);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
    this.engine.renderer.setPixelRatio(Math.min(devicePixelRatio, q === 'low' ? 0.75 : q === 'high' ? 2 : 1));
    this.engine.resize?.();
  }

  _events() {
    Events.on('alarm', (e) => {
      this.alarmEl.textContent = `ALARM  ${e.source}  loudness ${e.loudness}`;
      this.alarmEl.classList.add('show');
      clearTimeout(this._alT);
      this._alT = setTimeout(() => this.alarmEl.classList.remove('show'), 2500);
      this.audio.alarm();
    });
  }

  celebrate() {
    this.audio.party();
    const disco = this.props?.byId.get('party_disco');
    if (disco?.group) disco.group.userData.spin = true;
  }

  // ------------------------------------------------------------ loop
  _keys() {
    const k = (c) => this.input.keyPressed(c);
    if (k('KeyR')) this.tools.toggleRuler();
    if (k('KeyH')) this.tools.toggleGauge();
    if (k('KeyG') && !this.interact?.carried && !this.interact?.held) { this.house.setGrid(!this.house.gridOn); this.hint(this.house.gridOn ? 'Grid: 1 m lines, 10 cm minor' : 'Grid off'); }
    if (k('KeyV')) this.setMode(this.mode === 'survey' ? 'style' : 'survey');
    if (k('F7')) { this.player.setNoclip(!this.player.noclip); this.hint(this.player.noclip ? `Freecam (speed ${CONFIG.player.noclipSpeed} m/s)` : 'Walking'); }
    if (k('BracketRight')) { CONFIG.player.noclipSpeed = Math.min(40, CONFIG.player.noclipSpeed * 1.5); this.hint(`Freecam speed ${CONFIG.player.noclipSpeed.toFixed(1)} m/s`); }
    if (k('BracketLeft')) { CONFIG.player.noclipSpeed = Math.max(0.5, CONFIG.player.noclipSpeed / 1.5); this.hint(`Freecam speed ${CONFIG.player.noclipSpeed.toFixed(1)} m/s`); }
    if (k('F10')) this.toggleAudit();
    if (k('F3')) this.statsEl.classList.toggle('show');
    if (this.tools.mode === 'ruler' && k('Mouse0')) this.tools.clickRuler();
  }

  // Freecam pose for screenshots and compare mode: eye position in meters,
  // yaw and pitch in degrees.
  pose(x, y, z, yawDeg = 0, pitchDeg = 0) {
    this.player.setNoclip(true);
    this.engine.camera.position.set(x, y, z);
    this.player.yaw = (yawDeg * Math.PI) / 180;
    this.player.pitch = (pitchDeg * Math.PI) / 180;
  }

  // Walk-mode teleport (feet position), for tests and debugging.
  teleport(x, y, z, yawDeg = 0) {
    this.player.setNoclip(false);
    this.player.spawn(new Vector3(x, y, z), (yawDeg * Math.PI) / 180);
  }

  // Deterministic simulation without rendering, for the route tests:
  // hold `keys` for `seconds` of simulated time, pressing jump at `jumps`.
  simulate(seconds, { keys = [], jumps = [], hz = 120 } = {}) {
    this.paused = true;
    const dt = 1 / hz;
    const pending = [...jumps].sort((a, b) => a - b);
    for (const k of keys) this.input._press(k);
    for (let t = 0; t < seconds; t += dt) {
      if (pending.length && t >= pending[0]) { pending.shift(); this.input._press('Space'); this._jumpUp = t + 0.06; }
      if (this._jumpUp && t >= this._jumpUp) { this.input._release('Space'); this._jumpUp = 0; }
      this.physics.step(dt, (h) => { this.train?.fixed(h, this.player); this.player.fixedUpdate(h); });
      this.player.update(dt, 1);
      this.input.endFrame();
    }
    for (const k of keys) this.input._release(k);
    this.input._release('Space');
    this.input.endFrame();
    this.paused = false;
    const f = this.player.curFeet;
    return { x: +f.x.toFixed(2), y: +f.y.toFixed(2), z: +f.z.toFixed(2), room: this.roomAt(f)?.id ?? 'outside', ladder: this.player.onLadder };
  }

  loop() {
    if (this.paused) { requestAnimationFrame(this.loop); return; }
    const dt = this.engine.tick();
    this.dt = dt;
    this.input.pollGamepad();
    this._keys();
    this.physics.step(dt, (h) => {
      this.train?.fixed(h, this.player);
      this.player.fixedUpdate(h);
    });
    this.player.update(dt, this.physics.alpha);
    this.player.hands.visible = false; // survey: nothing in front of the lens
    this.train?.update(dt, 1);
    const chest = this.player.curFeet.clone().add(new Vector3(0, 0.6, 0));
    const onWm = this.ladders.some((b) => b.userData?.windmill && b.containsPoint(chest));
    this.roof?.update(dt, onWm);
    this.props?.update(this.frame / 60);
    if (this.security && !this.player.noclip) this.security.update(dt, this.player, this.interact?.thrown.map((t) => t.mesh) ?? []);
    this.interact?.update(dt);
    if (this.train?.running && this.frame % 20 === 0) this.audio.chuff(this.train.v);
    this.tools.update(dt);
    this.lightsUpdate?.(dt);
    this.engine.render(dt);
    this._stats();
    this.input.endFrame();
    this.frame++;
    if (this.frame === 20) window.__a3Ready = true;
    requestAnimationFrame(this.loop);
  }
}
