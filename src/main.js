// Boot, main loop, and the (for now tiny) screen state machine.
import { Vector3 } from 'three';
import { CONFIG } from './config.js';
import { Engine } from './core/Engine.js';
import { Input } from './core/Input.js';
import { Physics } from './core/Physics.js';
import { Sky } from './art/Sky.js';
import { Lighting } from './world/Lighting.js';
import { buildTestScene } from './world/TestScene.js';
import { Player } from './actors/Player.js';
import { HUD } from './ui/HUD.js';
import { DebugOverlay } from './ui/DebugOverlay.js';

// Fixed camera poses for automated screenshots: ?shot=<name>
const SHOTS = {
  yard: { pos: [0, 1.6, 9], target: [0, 1.4, -8] },
  furniture: { pos: [4.2, 1.6, -3.2], target: [4, 1.1, -8] },
  chunk: { pos: [-3.5, 1.8, -1.5], target: [-8, 3, -9] },
  character: { pos: [-1.2, 1.75, -0.6], target: [-2, 1.5, -3] },
  sky: { pos: [0, 1.6, 6], target: [-30, 14, 10] },
  crates: { pos: [3.2, 1.6, 1.5], target: [5.5, 0.8, -2.2] },
  fence: { pos: [-8.5, 1.5, 8], target: [-9, 1.2, 2] },
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
  const input = new Input(engine.canvas);

  const sky = new Sky(engine.scene);
  const lighting = new Lighting(engine.scene);
  const level = buildTestScene(engine.scene, physics);

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

  if (CONFIG.debug) Object.assign(window, { nn: { engine, physics, player, sky, lighting, input } });
}

boot().catch((err) => {
  console.error(err);
  const o = document.getElementById('overlay');
  if (o) o.querySelector('.overlay-sub').textContent = `Failed to start: ${err.message}`;
  window.__nnError = String(err && err.stack || err);
});
