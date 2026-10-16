// In-play screenshots with the HUD visible (prompts, slots, keyring, hiding).
// Usage: node scripts/hudshot.mjs [scene,...]
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('screenshots', { recursive: true });
const scenes = (process.argv[2] || 'keyPrompt,throwArc,wardrobe,underBed,carry,flashlight').split(',');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:5173/?debug=1');
await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 240000 });
await page.evaluate(() => {
  window.V = nn.engine.camera.position.constructor;
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('debug').style.display = 'none';
  nn.input.locked = true;
  nn.ai.frozen = true;
  window.aim = (feet, target) => {
    const p = nn.player;
    p.spawn(new V(...feet), 0);
    nn.simulate(0.1);
    const eye = p.camera.position;
    const dx = target[0] - eye.x, dy = target[1] - eye.y, dz = target[2] - eye.z;
    p.yaw = Math.atan2(-dx, -dz);
    p.pitch = Math.atan2(dy, Math.hypot(dx, dz));
  };
  window.give = (kind) => { const e = nn.physics.dynamics.find((d) => d.data?.item === kind && !d.held); if (e) nn.interaction.inv.addProp(e); return !!e; };
});
const SCENES = {
  adapt: () => {
    const b = nn.brain;
    const ent = (id) => b.entries.find((e) => e.id === id);
    for (const [t, id] of [['trap', 'd-kitchen'], ['camera', 'd-kitchen'], ['glue', 'w-kitchen'], ['board', 'w-kitchen']]) { const j = b._makeJob(t, ent(id)); if (j) b.install(j); }
    const e = ent('d-kitchen');
    const eye = e.center.clone().addScaledVector(e.inward, 3.4).add(new V(-1.2, 0, 0)).setY(0.6);
    const tr = b.traps[0].pos;
    aim(eye.toArray(), [tr.x, tr.y + 0.2, tr.z]);
  },
  trapClose: () => {
    const tr = nn.brain.traps[0].pos;
    const e = nn.brain.entries.find((x) => x.id === 'd-kitchen');
    const eye = tr.clone().addScaledVector(e.inward, 1.3).add(new V(0, 0, 0.5));
    aim([eye.x, 0.6, eye.z], [tr.x, tr.y, tr.z]);
    nn.player.pitch -= 0.15;
  },
  cameraView: () => {
    const c = nn.brain.cameras[0].obj;
    const p = c.getWorldPosition(new V());
    const e = nn.brain.entries.find((x) => x.id === 'd-kitchen');
    const eye = p.clone().addScaledVector(e.inward, 3.0).setY(0.6);
    aim(eye.toArray(), [p.x, p.y - 0.4, p.z]);
  },
  establish: () => {
    nn.ai.frozen = false;
    nn.brain.startShot(nn.brain._makeJob('board', nn.brain.entries.find((x) => x.id === 'w-living1')));
  },
  keyPrompt: () => {
    give('mug'); nn.devices.spawnTool && nn.interaction.inv.addProp(nn.devices.spawnTool('wrench', new V(0, 1, 0)));
    nn.interaction.inv.addKey('blue');
    const k = nn.devices.keyRed.obj.getWorldPosition(new V());
    aim([k.x - 0.9, 4.5, k.z - 0.7], [k.x, k.y, k.z]);
  },
  throwArc: () => {
    give('vase');
    aim([-3.0, 0.6, -16.0], [-6, 0.6, -20]);
    nn.interaction.charging = true; nn.interaction.charge = 0.75; nn.input._press('Mouse0');
  },
  wardrobe: () => {
    const spot = nn.world.hideSpots.find((s) => s.kind === 'wardrobe' && s.room === 'hall');
    nn.hiding.enter(spot);
    nn.ai.teleport(new V(-0.2, 0.6, -18.5), 0.3);
  },
  underBed: () => {
    nn.hiding.exit(false);
    const spot = nn.world.hideSpots.find((s) => s.kind === 'underBed');
    nn.hiding.enter(spot);
    nn.ai.teleport(new V(spot.checkFrom.x + 0.6, spot.floorY, spot.checkFrom.z + 0.8), 0);
  },
  carry: () => {
    nn.hiding.exit(false);
    const e = nn.physics.dynamics.find((d) => d.data?.climbable && d.mesh.position.distanceTo(new V(0, 0, -30)) < 15);
    const m = e.mesh.position;
    aim([m.x + 1.3, 0.05, m.z + 0.3], [m.x, m.y + 0.3, m.z]);
    nn.interaction.startCarry(e);
  },
  flashlight: () => {
    if (nn.interaction.carry) nn.interaction.dropCarry(0);
    nn.storyClock.setTime?.(0.95);
    nn.interaction.inv.addProp(nn.devices.flashlightTool);
    nn.interaction.flashOn = true;
    aim([-3.5, -1.6, -25.3], [-0.3, -1.4, -25.3]);
  },
};
for (const name of scenes) {
  await page.evaluate(`(${SCENES[name].toString()})()`);
  const f0 = await page.evaluate(() => nn.frame);
  await page.waitForFunction((f) => nn.frame > f + 4, f0, { timeout: 60000 });
  await page.screenshot({ path: `screenshots/hud-${name}.png` });
  console.log('saved', name);
  if (name === 'throwArc') await page.evaluate(() => { nn.interaction.charging = false; nn.input._release('Mouse0'); });
}
await browser.close();
