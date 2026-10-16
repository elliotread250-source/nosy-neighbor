// The game: owns every system and runs the frame in a fixed order.
import { Vector3, MathUtils } from 'three';
import { CONFIG } from '../config.js';
import { Engine } from '../core/Engine.js';
import { Input } from '../core/Input.js';
import { Physics } from '../core/Physics.js';
import { Events } from '../core/Events.js';
import { Sky } from '../art/Sky.js';
import { PostFX } from '../art/PostFX.js';
import { ToonShared } from '../art/Materials.js';
import { Lighting } from '../world/Lighting.js';
import { LightManager } from '../world/Lights.js';
import { Zones } from '../world/Zones.js';
import { buildWorld } from '../world/World.js';
import { buildTestScene } from '../world/TestScene.js';
import { StoryClock } from '../world/StoryClock.js';
import { PLAYER_HOUSE } from '../world/PlayerHouse.js';
import { NH } from '../world/NeighborPlan.js';
import { Player } from '../actors/Player.js';
import { Neighbor } from '../actors/Neighbor.js';
import { NeighborAnimator } from '../actors/NeighborAnimator.js';
import { NeighborAI, S } from '../actors/NeighborAI.js';
import { NavGraph } from '../nav/NavGraph.js';
import { CatchSequence } from './CatchSequence.js';
import { Interaction } from './Interaction.js';
import { Devices } from './Devices.js';
import { Impacts } from './Impacts.js';
import { SHOTS, poseFromTarget, setupViewer } from './Shots.js';
import { HUD } from '../ui/HUD.js';
import { DebugOverlay } from '../ui/DebugOverlay.js';
import { DebugViz } from '../ui/DebugViz.js';

const qs = new URLSearchParams(location.search);

export class Game {
  static async create() {
    const g = new Game();
    await g.init();
    return g;
  }

  async init() {
    const app = document.getElementById('app');
    this.engine = new Engine(app);
    this.physics = await Physics.init();
    this.postfx = new PostFX(this.engine.renderer, this.engine.scene, this.engine.camera);
    if (CONFIG.post.enabled && !qs.has('nopost')) this.engine.setPostFX(this.postfx);
    this.input = new Input(this.engine.canvas);
    const scene = this.engine.scene;
    this.sky = new Sky(scene);
    this.lighting = new Lighting(scene);
    this.lights = new LightManager(scene);
    this.zones = new Zones();
    this.test = qs.has('test');
    this.world = this.test ? buildTestScene(scene, this.physics) : buildWorld(scene, this.physics, this.lights, this.zones);
    this.updaters = [...(this.world.updaters || [])];
    if (this.world.interior) this.world.hideSpots = this.world.interior.hideSpots;
    this.storyClock = new StoryClock(this.sky, this.lighting, scene);

    this.player = new Player(this.engine, this.physics, this.input);
    this.player.spawn(this.world.spawn, this.world.spawnYaw);
    if (this.world.interior) this.player.ladders = this.world.interior.ladderVolumes;

    this.viewer = setupViewer(this.engine, this.updaters);
    this.shot = qs.get('shot') ? SHOTS[qs.get('shot')] : null;
    this.useAI = !this.test && !this.viewer && !qs.has('noai');
    if (this.useAI) {
      this.physics.world.step(this.physics.eventQueue); // make every collider visible to queries
      this.nav = new NavGraph(this.physics);
      if (CONFIG.debug) console.log(`nav: ${this.nav.nodes.length} nodes`);
      this.neighbor = new Neighbor(scene);
      this.neighborAnim = new NeighborAnimator(this.neighbor);
      this.ai = new NeighborAI(this);
      this.ai.teleport(new Vector3(6.4, NH.F0.y, -22.4), Math.PI);
      this.catchSeq = new CatchSequence(this);
    }
    if (!this.viewer) {
      this.interaction = new Interaction(this);
      this.interaction.addHideSpots(this.world.hideSpots || []);
      this.devices = new Devices(this);
      this.impacts = new Impacts(this);
    }
    this.timeScale = 1;
    this.state = 'play';
    this.catches = 0;
    this.indoorK = 0;
    this.chaseK = 0;

    this.hud = new HUD(document.getElementById('hud'));
    this.debug = new DebugOverlay(document.getElementById('debug'), { engine: this.engine, physics: this.physics, player: this.player, input: this.input, game: this });
    this.debugViz = new DebugViz(this);
    this._setupScreens();
    this.frame = 0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    if (CONFIG.debug) window.nn = this;
  }

  _setupScreens() {
    const overlay = document.getElementById('overlay');
    const { player, hud, input, engine } = this;
    if (this.shot) {
      overlay.style.display = 'none';
      hud.setVisible(false);
      player.enabled = false;
      player.noclip = true;
      player.hands.visible = qs.get('hands') === '1';
      const { yaw, pitch } = poseFromTarget(this.shot.pos, this.shot.target);
      player.yaw = yaw;
      player.pitch = pitch;
      engine.camera.position.set(...this.shot.pos);
      if (this.ai && !qs.has('ai')) this.ai.frozen = true;
      if (this.ai && qs.get('npos')) {
        const [x, y, z, r] = qs.get('npos').split(',').map(Number);
        this.ai.teleport(new Vector3(x, y, z), (r || 0) * Math.PI / 180);
        this.ai.syncModel(1);
      }
      return;
    }
    let started = false;
    overlay.addEventListener('click', () => {
      input.requestLock();
      engine.canvas.focus();
    });
    input.onLockChange = (locked) => {
      overlay.classList.toggle('hidden', locked);
      overlay.querySelector('.overlay-title').textContent = started ? 'Paused' : 'Nosy Neighbor';
      overlay.querySelector('.overlay-sub').textContent = started ? 'Click to keep sneaking' : 'Click to play';
      if (locked && !started) {
        started = true;
        hud.showObjective('Find out what\'s in the basement.');
      }
    };
  }

  // ------------------------------------------------------------ catch & respawn
  startCatch(opts = {}) {
    if (!this.catchSeq || this.catchSeq.active) return;
    this.catchSeq.start(opts);
  }

  onCaught() {
    this.catches++;
    const p = this.player;
    Events.emit('player:caught', { position: p.curFeet.clone(), count: this.catches });
    this.interaction?.onCaught(p.curFeet.clone());
    p.spawn(PLAYER_HOUSE.bedSpawn, PLAYER_HOUSE.bedSpawnYaw);
    p.camera.quaternion.identity();
    p.pitch = 0;
    // he goes home
    this.ai.teleport(new Vector3(6.4, NH.F0.y, -22.4), Math.PI);
    this.ai.meter = 0;
    this.ai.lastSeen = null;
    this.ai.knownHideSpot = null;
    this.ai.activity = null;
    this.ai.setState(S.PATROL);
    this.storyClock.advance();
  }

  // Debug/test: advance the simulation quickly without rendering.
  simulate(seconds, dt = 1 / 30) {
    const { physics, player } = this;
    let left = seconds;
    while (left > 0) {
      const realDt = Math.min(dt, left);
      left -= realDt;
      const d = realDt * this.timeScale;
      physics.step(d, (h) => { player.fixedUpdate(h); this.ai?.fixedUpdate(h); });
      player.update(d, physics.alpha);
      this._tickSystems(d);
      if (this.ai) {
        if (!this.catchSeq.active) this.ai.syncModel(physics.alpha);
        this.ai.update(d);
        this.catchSeq.update(realDt);
      }
      for (const u of this.updaters) u(d, performance.now() / 1000);
      this.input.endFrame();
    }
  }

  _tickSystems(dt) {
    this.interaction?.update(dt);
    this.devices?.update(dt);
    this.impacts?.update(dt);
  }

  // ------------------------------------------------------------ frame
  loop() {
    const realDt = this.engine.tick();
    const dt = realDt * this.timeScale;
    const { input, physics, player, engine } = this;
    input.pollGamepad();
    physics.step(dt, (h) => {
      player.fixedUpdate(h);
      this.ai?.fixedUpdate(h);
    });
    player.update(dt, physics.alpha);
    this._tickSystems(dt);
    if (this.ai) {
      if (!this.catchSeq.active) this.ai.syncModel(physics.alpha);
      this.ai.update(dt);
      this.catchSeq.update(realDt);
    }
    const t = performance.now() / 1000;
    ToonShared.uTime.value = t;
    for (const u of this.updaters) u(dt, t);
    this.lights.update(engine.camera.position);
    this.world.updateCulling?.(engine.camera.position);
    this.indoorK = MathUtils.damp(this.indoorK, this.zones.isIndoor(engine.camera.position) ? 1 : 0, CONFIG.lighting.indoorFade, realDt);
    this.lighting.setIndoor(this.indoorK);
    this.lighting.update(engine.camera.position);
    this.storyClock.update(realDt);
    this.sky.update(dt, engine.camera);
    // chase intensity drives post FX, FOV and the heartbeat vignette
    const chasing = this.ai && (this.ai.state === S.CHASE || this.ai.state === S.SPOT);
    this.chaseK = MathUtils.damp(this.chaseK, chasing ? 1 : 0, chasing ? 4 : 0.6, realDt);
    if (!this.catchSeq?.active) this.postfx.chase = this.chaseK;
    player.chaseIntensity = this.chaseK;
    this.postfx.pulse = this.chaseK * (0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 2.1));
    this.hud.update(realDt, player, this);
    this.debug.update(realDt);
    this.debugViz.update(realDt);
    engine.render(realDt);
    input.endFrame();
    this.frame++;
    if (this.frame === 45) window.__nnReady = true;
    requestAnimationFrame(this.loop);
  }
}
