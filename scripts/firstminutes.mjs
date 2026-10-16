// Milestone 0: "play the first three minutes of Act 1" against the production
// build. Clicks Play from the title, lets the intro run, then walks a player
// route with real key presses (W, Space, E, C) from the bedroom, across the
// street, through the broken window and into the hallway. Aiming is done by
// setting the camera yaw toward the next waypoint, which is what a mouse
// would do. Logs every stuck spot, fall, error and timing, and screenshots
// each waypoint into reports/shots/m0/.
// Usage: npm run build && node scripts/firstminutes.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const PORT = 4174;
const base = `http://localhost:${PORT}/`;
const outDir = 'reports/shots/m0';
mkdirSync(outDir, { recursive: true });
const server = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 250)); }

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
const log = [];
const note = (s) => { const line = `[${((Date.now() - T0) / 1000).toFixed(1)}s] ${s}`; log.push(line); console.log(line); };
page.on('pageerror', (e) => note(`PAGEERROR ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') note(`CONSOLE.${m.type()} ${m.text().slice(0, 240)}`); });

const T0 = Date.now();
await page.goto(`${base}?debug=1&gfx=low`);
await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 240000 });
note(`title ready, state=${await page.evaluate(() => nn.state)} error=${await page.evaluate(() => window.__nnError || null)}`);
await page.evaluate(() => { try { localStorage.clear(); } catch {} });
await page.screenshot({ path: `${outDir}/00-title.png` });
await page.click('.title-screen button[data-act=play]');
const tIntro = Date.now();
await page.waitForFunction(() => nn.state === 'play', null, { timeout: 60000 });
note(`play clicked, story.mode=${await page.evaluate(() => nn.story.mode)}`);
await page.waitForTimeout(4000);
await page.screenshot({ path: `${outDir}/01-intro.png` });
// Let the intro run on its own, up to 60 s of wall time.
await page.waitForFunction(() => !nn.story.mode, null, { timeout: 90000 }).catch(() => note('INTRO did not end by itself within 90 s'));
note(`intro ended after ${((Date.now() - tIntro) / 1000).toFixed(1)}s wall`);
await page.evaluate(() => { nn.input.locked = true; });

const st = () => page.evaluate(() => { const p = nn.player, f = p.curFeet; return { x: +f.x.toFixed(2), y: +f.y.toFixed(2), z: +f.z.toFixed(2), g: p.grounded, caught: nn.catchSeq?.active || false, state: nn.state }; });
note(`spawn ${JSON.stringify(await st())}`);
await page.screenshot({ path: `${outDir}/02-wake.png` });

// Route: [x, z, label, opts]. opts.jump: press space on the way; opts.crouch.
const route = [
  [2.4, 19.2, 'bedroom middle'],
  [1.6, 20.0, 'partition doorway (bedroom side)'],
  [-0.4, 20.0, 'partition doorway (living side)'],
  [-1.2, 16.0, 'living room toward front door'],
  [-1.2, 13.2, 'front door'],
  [-1.2, 10.0, 'front path'],
  [-1.2, 4.6, 'south sidewalk'],
  [3.0, 0.0, 'middle of the road'],
  [8.0, -5.0, 'north sidewalk at the gate'],
  [8.0, -7.6, 'through the picket gate'],
  [2.0, -10.0, 'front lawn'],
  [-3.5, -11.6, 'porch in front of the broken window'],
  [-3.5, -13.4, 'at the broken window sill', { jump: true }],
  [-3.5, -15.2, 'inside the living room', { jump: true }],
  [-3.0, -16.5, 'living room middle'],
  [-1.2, -16.5, 'door to the hall'],
  [0.0, -17.5, 'front hallway'],
  [0.4, -20.5, 'hall north end'],
];

let shot = 3;
for (const [x, z, label, opts = {}] of route) {
  const t0 = Date.now();
  let last = await st(), lastMoveT = Date.now(), pressedE = false, jumped = false, reached = false;
  await page.keyboard.down('KeyW');
  while (Date.now() - t0 < 40000) {
    const s = await st();
    if (s.state !== 'play') { note(`STATE ${s.state} while heading to "${label}"`); break; }
    if (s.y < -2) note(`FALL below world at ${JSON.stringify(s)}`);
    const d = Math.hypot(x - s.x, z - s.z);
    if (d < 0.45) { reached = true; break; }
    await page.evaluate(([x, z]) => { const p = nn.player, f = p.curFeet; p.yaw = Math.atan2(-(x - f.x), -(z - f.z)); p.pitch = 0; }, [x, z]);
    if (Math.hypot(s.x - last.x, s.z - last.z) > 0.15) { last = s; lastMoveT = Date.now(); }
    const stuckFor = Date.now() - lastMoveT;
    if (stuckFor > 1500 && opts.jump && !jumped) { await page.keyboard.press('Space'); jumped = true; lastMoveT = Date.now(); }
    else if (stuckFor > 1500 && !pressedE) { await page.keyboard.press('KeyE'); pressedE = true; note(`stuck ${(stuckFor / 1000).toFixed(1)}s near ${JSON.stringify(s)} heading to "${label}", pressed E`); lastMoveT = Date.now(); }
    else if (stuckFor > 1500 && !jumped) { await page.keyboard.press('Space'); jumped = true; note(`still stuck at ${JSON.stringify(s)}, jumped`); lastMoveT = Date.now(); }
    else if (stuckFor > 4000) { note(`STUCK for 4 s at ${JSON.stringify(s)} heading to "${label}" (${d.toFixed(2)} m away)`); break; }
    await page.waitForTimeout(120);
  }
  await page.keyboard.up('KeyW');
  const s = await st();
  note(`${reached ? 'reached' : 'MISSED '} "${label}" in ${((Date.now() - t0) / 1000).toFixed(1)}s at ${JSON.stringify(s)}`);
  await page.screenshot({ path: `${outDir}/${String(shot++).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-')}.png` });
  if (!reached) {
    // Recover so the rest of the walk still gets looked at: teleport to the waypoint.
    await page.evaluate(([x, z]) => { const V = nn.engine.camera.position.constructor; const y = nn.player.curFeet.y; nn.player.spawn(new V(x, y + 0.3, z), nn.player.yaw); }, [x, z]);
    note(`  teleported to "${label}" to continue`);
    await page.waitForTimeout(500);
  }
}
// Look around the hall for 4 directions.
for (let i = 0; i < 4; i++) {
  await page.evaluate((i) => { nn.player.yaw = i * Math.PI / 2; nn.player.pitch = 0; }, i);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/${String(shot++).padStart(2, '0')}-hall-look-${i}.png` });
}
note(`total wall time ${((Date.now() - T0) / 1000).toFixed(0)}s, game time ${await page.evaluate(() => (nn.time ?? 0).toFixed?.(1))}`);
writeFileSync('reports/firstminutes.log', log.join('\n') + '\n');
await browser.close();
server.kill();
