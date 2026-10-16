// Act 3 House Study: the app. Loads the tagged spec, applies measurements,
// plans and builds the house, and runs the player and the scale tools.
import { Vector3 } from 'three';
import { CONFIG } from '../config.js';
import { Engine } from '../core/Engine.js';
import { Physics } from '../core/Physics.js';
import { Input } from '../core/Input.js';
import { Player } from '../actors/Player.js';
import { PLAYER } from './assumptions.js';
import { planHouse } from './Plan.js';
import { HouseView } from './HouseBuilder.js';
import { SurveyLighting } from './Scene.js';
import { Tools } from './Tools.js';
import { audit, auditText } from './Audit.js';
import { val } from './Spec.js';
import testHouse from '../../data/act3/test-house.json';

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
    noclipSpeed: 4,
    headBob: !matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
  CONFIG.physics.gravity = -PLAYER.gravity;
  CONFIG.camera.fov = 80;
}

export class App {
  static async create(specs) {
    const a = new App();
    await a.init(specs);
    return a;
  }

  async init(specs = {}) {
    configurePlayer();
    this.specs = { test: testHouse, ...specs };
    this.engine = new Engine(document.getElementById('app'));
    this.physics = await Physics.init();
    this.input = new Input(this.engine.canvas);
    this.lighting = new SurveyLighting(this.engine.scene);
    this.house = new HouseView(this.engine.scene, this.physics);
    this.specName = qs.get('house') || (this.specs.main ? 'main' : 'test');
    this.load(this.specs[this.specName]);
    this.player = new Player(this.engine, this.physics, this.input);
    this.player.hands.visible = false;
    const sp = this.spec.spawn ?? { x: 2.5, y: 0, z: 2 };
    this.player.spawn(new Vector3(val(sp.x ?? sp), val(sp.y ?? 0), val(sp.z ?? 0)), val(sp.yaw, 0));
    this.tools = new Tools(this);
    this._hud();
    this._lock();
    this.frame = 0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    window.a3 = this;
  }

  load(spec) {
    this.spec = spec;
    this.plan = planHouse(spec);
    this.house.build(this.plan);
    this.audit = audit(spec);
    if (this.plan.warnings.length) console.warn(this.plan.warnings.join('\n'));
  }

  _hud() {
    const hud = document.getElementById('hud');
    hud.innerHTML = `
      <div class="a3-cross"></div>
      <div class="a3-badge"></div>
      <div class="a3-hint"></div>
      <pre class="a3-panel a3-audit"></pre>
      <pre class="a3-panel a3-stats"></pre>
      <div class="a3-keys">WASD move · Shift sprint · Space jump · C crouch · R ruler · H height gauge · G grid · F7 freecam ([ ] speed) · F10 audit · F3 stats</div>`;
    this.badge = hud.querySelector('.a3-badge');
    this.hintEl = hud.querySelector('.a3-hint');
    this.auditEl = hud.querySelector('.a3-audit');
    this.statsEl = hud.querySelector('.a3-stats');
    this._badge();
  }

  _badge() {
    const m = this.audit.overallMeasured;
    this.badge.innerHTML = `<b>ACT 3 HOUSE STUDY</b> · survey mode · rev ${this.spec.revision} · <span class="${m === 0 ? 'zero' : ''}">${m.toFixed(1)}% measured</span>`;
  }

  hint(text, seconds = 3) {
    this.hintEl.textContent = text;
    this.hintEl.classList.add('show');
    clearTimeout(this._hintT);
    this._hintT = setTimeout(() => this.hintEl.classList.remove('show'), seconds * 1000);
  }

  // Freecam pose for screenshots and compare mode: eye position in meters,
  // yaw and pitch in degrees.
  pose(x, y, z, yawDeg = 0, pitchDeg = 0) {
    this.player.setNoclip(true);
    this.engine.camera.position.set(x, y, z);
    this.player.yaw = (yawDeg * Math.PI) / 180;
    this.player.pitch = (pitchDeg * Math.PI) / 180;
  }

  toggleAudit(on = !this.auditEl.classList.contains('show')) {
    this.auditEl.textContent = auditText(this.audit);
    this.auditEl.classList.toggle('show', on);
  }

  _stats() {
    if (!this.statsEl.classList.contains('show') || this.frame % 10) return;
    const p = this.engine.camera.position;
    const r = this.engine.renderer.info.render;
    const s = this.house.stats();
    this.statsEl.textContent = `fps ${(1 / Math.max(1e-3, this.dt ?? 0.016)).toFixed(0)}  draws ${r.calls}  tris ${r.triangles}\n` +
      `eye ${p.x.toFixed(3)} ${p.y.toFixed(3)} ${p.z.toFixed(3)} m\nmeshes ${s.meshes}  colliders ${s.colliders}\n` +
      `player ${PLAYER.height} m (assumed) eye ${PLAYER.eyeHeight} m`;
  }

  _lock() {
    const ov = document.getElementById('a3-start');
    ov?.addEventListener('click', () => { this.input.requestLock(); this.engine.canvas.focus(); });
    this.input.onLockChange = (locked) => ov?.classList.toggle('hidden', locked);
  }

  _keys() {
    const k = (c) => this.input.keyPressed(c);
    if (k('KeyR')) this.tools.toggleRuler();
    if (k('KeyH')) this.tools.toggleGauge();
    if (k('KeyG')) { this.house.setGrid(!this.house.gridOn); this.hint(this.house.gridOn ? 'Grid: 1 m lines, 10 cm minor' : 'Grid off'); }
    if (k('F7')) { this.player.setNoclip(!this.player.noclip); this.hint(this.player.noclip ? `Freecam (speed ${CONFIG.player.noclipSpeed} m/s)` : 'Walking'); }
    if (k('BracketRight')) { CONFIG.player.noclipSpeed = Math.min(40, CONFIG.player.noclipSpeed * 1.5); this.hint(`Freecam speed ${CONFIG.player.noclipSpeed.toFixed(1)} m/s`); }
    if (k('BracketLeft')) { CONFIG.player.noclipSpeed = Math.max(0.5, CONFIG.player.noclipSpeed / 1.5); this.hint(`Freecam speed ${CONFIG.player.noclipSpeed.toFixed(1)} m/s`); }
    if (k('F10')) this.toggleAudit();
    if (k('F3')) this.statsEl.classList.toggle('show');
    if (this.tools.mode === 'ruler' && k('Mouse0')) this.tools.clickRuler();
  }

  loop() {
    const dt = this.engine.tick();
    this.dt = dt;
    this.input.pollGamepad();
    this._keys();
    this.physics.step(dt, (h) => this.player.fixedUpdate(h));
    this.player.update(dt, this.physics.alpha);
    this.player.hands.visible = false; // survey: nothing in front of the lens
    this.tools.update(dt);
    this.engine.render(dt);
    this._stats();
    this.input.endFrame();
    this.frame++;
    if (this.frame === 20) window.__a3Ready = true;
    requestAnimationFrame(this.loop);
  }
}
