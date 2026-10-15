// Boot, main loop, and the (for now tiny) screen state machine.
import { Vector3 } from 'three';
import { CONFIG } from './config.js';
import { Engine } from './core/Engine.js';
import { Input } from './core/Input.js';
import { Physics } from './core/Physics.js';
import { Sky } from './art/Sky.js';
import { PostFX } from './art/PostFX.js';
import { Lighting } from './world/Lighting.js';
import { buildTestScene } from './world/TestScene.js';
import { buildWorld } from './world/World.js';
import { LightManager } from './world/Lights.js';
import { Zones } from './world/Zones.js';
import { ToonShared } from './art/Materials.js';
import { MathUtils } from 'three';
import { Player } from './actors/Player.js';
import { HUD } from './ui/HUD.js';
import { DebugOverlay } from './ui/DebugOverlay.js';

// Fixed camera poses for automated screenshots: ?shot=<name>
const SHOTS = {
  // Milestone 1/2 test yard (?test=1)
  yard: { pos: [0, 1.6, 9], target: [0, 1.4, -8] },
  furniture: { pos: [4.2, 1.6, -3.2], target: [4, 1.1, -8] },
  chunk: { pos: [-3.5, 1.8, -1.5], target: [-8, 3, -9] },
  character: { pos: [-1.2, 1.75, -0.6], target: [-2, 1.5, -3] },
  sky: { pos: [0, 1.6, 6], target: [-30, 14, 10] },
  crates: { pos: [3.2, 1.6, 1.5], target: [5.5, 0.8, -2.2] },
  fence: { pos: [-8.5, 1.5, 8], target: [-9, 1.2, 2] },
  // The street
  porch: { pos: [-1.2, 1.9, 12.9], target: [0, 4, -20] },
  street: { pos: [-30, 2.2, 3], target: [10, 2, 0] },
  playerFront: { pos: [-6, 1.8, 3], target: [0, 2.5, 18] },
  aerial: { pos: [0, 38, 48], target: [0, 0, 0] },
  bedroom: { pos: [2.2, 1.9, 19.5], target: [2.8, 1.6, 14] },
  living: { pos: [0.0, 1.7, 15.2], target: [-4.4, 1.0, 20] },
  flanking: { pos: [20, 1.8, 2], target: [30, 3, 12] },
  eastEnd: { pos: [40, 2, 0], target: [60, 1.5, 0] },
  // The neighbor's house
  nhPorch: { pos: [0.5, 2.0, 12.6], target: [0, 7, -20] },
  nhCorner: { pos: [22, 2.2, 4], target: [0, 6.5, -20] },
  nhBack: { pos: [8, 2.0, -33], target: [-1, 6, -20] },
  nhWest: { pos: [-15, 2.5, -8], target: [-4, 6, -22] },
  nhTree: { pos: [13.5, 2.0, -11.0], target: [10.5, 4.5, -16.5] },
  nhRoof: { pos: [16, 14, -6], target: [-1, 9, -22] },
};

function poseFromTarget(pos, target) {
  const d = new Vector3(...target).sub(new Vector3(...pos));
  const yaw = Math.atan2(-d.x, -d.z);
  const pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
  return { yaw, pitch };
}

async function boot() {
  const app = document.getElementById('app');
  const engine = new Engine(app);
  const physics = await Physics.init();
  const postfx = new PostFX(engine.renderer, engine.scene, engine.camera);
  if (CONFIG.post.enabled && !new URLSearchParams(location.search).has('nopost')) engine.setPostFX(postfx);
  const input = new Input(engine.canvas);

  const sky = new Sky(engine.scene);
  const lighting = new Lighting(engine.scene);
  const lights = new LightManager(engine.scene);
  const zones = new Zones();
  const useTest = new URLSearchParams(location.search).has('test');
  const level = useTest ? buildTestScene(engine.scene, physics) : buildWorld(engine.scene, physics, lights, zones);
  const updaters = level.updaters || [];
  let indoorK = 0;

  const player = new Player(engine, physics, input);
  player.spawn(level.spawn, level.spawnYaw);

  const hud = new HUD(document.getElementById('hud'));
  const debug = new DebugOverlay(document.getElementById('debug'), { engine, physics, player, input });

  const overlay = document.getElementById('overlay');
  const shotName = new URLSearchParams(location.search).get('shot');
  const shot = shotName ? SHOTS[shotName] : null;

  if (shot) {
    overlay.style.display = 'none';
    hud.setVisible(false);
    player.enabled = false;
    player.noclip = true;
    player.hands.visible = new URLSearchParams(location.search).get('hands') === '1';
    const { yaw, pitch } = poseFromTarget(shot.pos, shot.target);
    player.yaw = yaw;
    player.pitch = pitch;
    engine.camera.position.set(...shot.pos);
  } else {
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
        hud.showObjective('Milestone 1 test yard: walk, sprint, crouch, jump, climb the crates');
      }
    };
  }

  let frame = 0;
  function loop() {
    const dt = engine.tick();
    input.pollGamepad();
    physics.step(dt, (h) => player.fixedUpdate(h));
    player.update(dt, physics.alpha);
    const t = performance.now() / 1000;
    ToonShared.uTime.value = t;
    for (const u of updaters) u(dt, t);
    lights.update(engine.camera.position);
    indoorK = MathUtils.damp(indoorK, zones.isIndoor(engine.camera.position) ? 1 : 0, CONFIG.lighting.indoorFade, dt);
    lighting.setIndoor(indoorK);
    lighting.update(engine.camera.position);
    sky.update(dt, engine.camera);
    hud.update(dt, player);
    debug.update(dt);
    engine.render(dt);
    input.endFrame();
    frame++;
    if (frame === 45) window.__nnReady = true;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  if (CONFIG.debug) Object.assign(window, { nn: { engine, physics, player, sky, lighting, input, postfx, zones, lights, level } });
}

boot().catch((err) => {
  console.error(err);
  const o = document.getElementById('overlay');
  if (o) o.querySelector('.overlay-sub').textContent = `Failed to start: ${err.message}`;
  window.__nnError = String(err && err.stack || err);
});
