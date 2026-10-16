// Milestone 0, the two checks left after the first-minutes walk:
//   1. Which props vanish on their own (no player input, nobody near them)?
//   2. Can the player get through the neighbor's broken front window
//      (w-living2) standing, crouched, or with a crouch-jump?
// Screenshots go to reports/shots/m0/ (numbered after the walk's 00-24),
// the raw numbers to reports/m0checks.log.
// Usage: npm run build && node scripts/m0checks.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const PORT = 4175;
const base = `http://localhost:${PORT}/`;
const outDir = 'reports/shots/m0';
mkdirSync(outDir, { recursive: true });
const server = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 250)); }

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
const log = [];
const note = (s) => { log.push(s); console.log(s); };
page.on('pageerror', (e) => note(`PAGEERROR ${e.message}`));

await page.goto(`${base}?debug=1&gfx=low`);
await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 240000 });
await page.evaluate(() => { try { localStorage.clear(); } catch {} });
const titleBodies = await page.evaluate(() => nn.physics.dynamics.map((e) => `${e.data?.item || 'body'}@${e.body.translation().x.toFixed(1)},${e.body.translation().y.toFixed(1)},${e.body.translation().z.toFixed(1)}`));
const titleWins = await page.evaluate(() => [...nn.world.windows.windows.values()].filter((w) => w.broken).map((w) => w.id));
await page.click('.title-screen button[data-act=play]');
await page.waitForFunction(() => nn.state === 'play', null, { timeout: 60000 });
for (let t = 0; t < 60 && await page.evaluate(() => !!nn.story.mode); t += 0.5) await page.evaluate(() => nn.simulate(0.5));
await page.evaluate(() => { nn.input.locked = true; });
let shot = 25;
const snap = async (label) => page.screenshot({ timeout: 180000, path: `${outDir}/${String(shot++).padStart(2, '0')}-${label}.png` });

// ---------------------------------------------------------------- 1. props
const bodies = () => page.evaluate(() => {
  const out = [];
  nn.physics.world.forEachRigidBody((b) => {
    if (!b.isDynamic()) return;
    let label = 'body';
    for (let i = 0; i < b.numColliders(); i++) {
      const d = nn.physics.colliderData.get(b.collider(i).handle);
      if (d) { label = d.item || d.name || d.kind || d.mesh?.name || label; break; }
    }
    const p = b.translation();
    out.push({ h: b.handle, label, x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) });
  });
  return out;
});
const wins = await page.evaluate(() => [...nn.world.windows.windows.values()].filter((w) => w.broken || w.open).map((w) => `${w.id}${w.broken ? ' broken' : ''}${w.open ? ' open' : ''} at ${w.center.toArray().map((v) => v.toFixed(1))}`));
note(`at the title screen: ${titleBodies.length} dynamic bodies; windows broken: ${titleWins.join(', ') || 'none'}`);
note(`  shards at the title screen: ${titleBodies.filter((b) => /shard/.test(b)).join(' | ') || 'none'}`);
note(`  snow globe at the title screen: ${titleBodies.filter((b) => /snowGlobe/.test(b)).join(' | ') || 'MISSING'}`);
note(`  snow globe after the intro: ${(await page.evaluate(() => nn.physics.dynamics.filter((e) => e.data?.item === 'snowGlobe').length)) ? 'present' : 'MISSING'}`);
note(`windows already broken/open after the intro: ${wins.join(' | ') || 'none'}`);
const before = await bodies();
note(`dynamic bodies after the intro: ${before.length}`);
// The snow globe on the living-room mantel (GroundFloor.js, x -7.6 z -17.65)
// is the only breakable prop near the shards that exist before Play is even
// clicked. Look at the mantel to show what is (and is not) on it.
const lookAtMantel = async () => {
  await page.evaluate(() => { const V = nn.engine.camera.position.constructor; nn.player.spawn(new V(-5.6, 0.62, -17.2), Math.PI / 2); });
  for (let i = 0; i < 10; i++) await page.evaluate(() => { nn.player.yaw = Math.PI / 2; nn.player.pitch = -0.3; nn.simulate(0.1); });
  note(`  mantel camera at ${JSON.stringify(await page.evaluate(() => nn.engine.camera.position.toArray().map((v) => +v.toFixed(2))))}`);
};
await lookAtMantel();
await snap('mantel-snow-globe-already-gone-toy-train-still-there');
// stand the player in their own bedroom so nothing nearby is touched
await page.evaluate(() => { const V = nn.engine.camera.position.constructor; nn.player.spawn(new V(2.4, 0.5, 19.2), 0); });
for (let t = 0; t < 30; t += 0.5) await page.evaluate(() => nn.simulate(0.5));
const after = await bodies();
const byH = new Map(after.map((b) => [b.h, b]));
const gone = before.filter((b) => !byH.has(b.h));
const moved = before.filter((b) => byH.has(b.h) && Math.hypot(byH.get(b.h).x - b.x, byH.get(b.h).y - b.y, byH.get(b.h).z - b.z) > 0.5);
note(`after 30 s of game time with the player idle in their bedroom: ${after.length} dynamic bodies`);
const fmt = (b) => `${b.label}@${b.x},${b.y},${b.z}`;
note(`vanished (${gone.length}): ${gone.map(fmt).join(' | ') || 'none'}`);
note(`moved > 0.5 m on their own (${moved.length}): ${moved.map((b) => `${fmt(b)} -> ${byH.get(b.h).x},${byH.get(b.h).y},${byH.get(b.h).z}`).join(' | ') || 'none'}`);
note(`fell below y -1: ${after.filter((b) => b.y < -1).map(fmt).join(' | ') || 'none'}`);

// ---------------------------------------------------------------- 2. window
// w-living2: x -3.5, wall face z -14, sill y 1.5, top y 3.1, 0.9 m wide.
const st = () => page.evaluate(() => { const p = nn.player, f = p.curFeet; return [+f.x.toFixed(2), +f.y.toFixed(2), +f.z.toFixed(2), p.crouching]; });
const attempt = async (name, plan) => {
  await page.evaluate(() => { const V = nn.engine.camera.position.constructor; nn.player.spawn(new V(-3.5, 0.9, -12.6), 0); nn.player.pitch = 0; });
  for (let i = 0; i < 4; i++) await page.evaluate(() => nn.simulate(0.1));
  let minZ = 0, maxY = 0;
  const step = async (n = 1) => { for (let i = 0; i < n; i++) { await page.evaluate(() => { nn.player.yaw = 0; nn.simulate(0.1); }); const s = await st(); minZ = Math.min(minZ, s[2]); maxY = Math.max(maxY, s[1]); } };
  await plan(page.keyboard, step);
  for (const k of ['KeyW', 'KeyC', 'Space']) await page.keyboard.up(k);
  await step(5);
  const end = await st();
  const inside = end[2] < -14.3;
  note(`window "${name}": end ${JSON.stringify(end)}, furthest z ${minZ.toFixed(2)}, highest feet y ${maxY.toFixed(2)} -> ${inside ? 'GOT INSIDE' : 'still outside'}`);
  return inside;
};
const results = {};
results.walk = await attempt('walk standing', async (kb, step) => { await kb.down('KeyW'); await step(30); });
results.jump = await attempt('walk + jump', async (kb, step) => { await kb.down('KeyW'); await step(6); await kb.down('Space'); await step(1); await kb.up('Space'); await step(30); });
await snap('window-stuck-on-flower-box-after-jump');
results.crouchOnBox = await attempt('jump onto box, then hold crouch and keep walking', async (kb, step) => {
  await kb.down('KeyW'); await step(6); await kb.down('Space'); await step(1); await kb.up('Space'); await step(15);
  await kb.down('KeyC'); await step(2);
  await snap('window-crouching-on-flower-box');
  await step(30);
});
await snap('window-after-crouch-back-on-porch');
results.crouchJump = await attempt('crouch-jump (jump, crouch in the air) while walking', async (kb, step) => {
  await kb.down('KeyW'); await step(6); await kb.down('Space'); await step(1); await kb.up('Space'); await step(1);
  await kb.down('KeyC'); await step(30);
});
await snap('window-after-crouch-jump');
results.crouchFirst = await attempt('hold crouch, then try to jump', async (kb, step) => { await kb.down('KeyC'); await kb.down('KeyW'); await step(6); await kb.down('Space'); await step(1); await kb.up('Space'); await step(30); });

note(`window summary (glass intact): ${JSON.stringify(results)}`);

// ---------------------------------------------------------------- 3. window, glass broken
// The pane is intact at the start ("Shut tight (break it?)"), so the real
// question is whether the opening is passable once the glass is gone.
await page.evaluate(() => nn.world.windows.breakGlass('w-living2'));
note(`broke w-living2 with breakGlass(): broken=${await page.evaluate(() => nn.world.windows.get('w-living2').broken)}`);
const broken = {};
broken.walk = await attempt('[broken] walk standing', async (kb, step) => { await kb.down('KeyW'); await step(30); });
broken.jump = await attempt('[broken] walk + jump', async (kb, step) => { await kb.down('KeyW'); await step(6); await kb.down('Space'); await step(1); await kb.up('Space'); await step(30); });
await snap('broken-window-jump-stops-on-flower-box');
broken.crouchOnBox = await attempt('[broken] jump onto box, then hold crouch and keep walking', async (kb, step) => {
  await kb.down('KeyW'); await step(6); await kb.down('Space'); await step(1); await kb.up('Space'); await step(15);
  await kb.down('KeyC'); await step(2);
  await snap('broken-window-crouched-on-flower-box');
  await step(30);
});
await snap('broken-window-after-crouch-attempt');
broken.crouchJump = await attempt('[broken] crouch-jump (crouch in the air) while walking', async (kb, step) => {
  await kb.down('KeyW'); await step(6); await kb.down('Space'); await step(1); await kb.up('Space'); await step(1);
  await kb.down('KeyC'); await step(30);
});
await snap('broken-window-after-crouch-jump');
note(`window summary (glass broken): ${JSON.stringify(broken)}`);
writeFileSync('reports/m0checks.log', log.join('\n') + '\n');
await browser.close();
server.kill();
