// Milestone 0 baseline: serves the production build (dist/ via server.js),
// measures time to the title screen, collects console errors and warnings,
// and records draw calls, triangles and physics bodies at every named camera
// pose on the Medium and Low presets.
// Usage: npm run build && node scripts/baseline.mjs [out.json]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const PORT = 4173;
const base = `http://localhost:${PORT}/`;
const out = process.argv[2] || 'reports/baseline.json';
const SHOTS = [
  'porch', 'street', 'aerial', 'bedroom', 'living',
  'nhPorch', 'nhCorner', 'nhBack', 'nhWest', 'nhTree', 'nhRoof',
  'inHall', 'inLiving', 'inDining', 'inKitchen', 'inMudroom', 'inBath0',
  'inHall1', 'inBedroom', 'inStudy', 'inKid', 'inCloset',
  'inLanding', 'inPurple', 'inTomato', 'inAttic', 'inTunnel', 'inBasement',
];

const server = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(base)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 250));
}

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const result = { date: new Date().toISOString(), renderer: 'SwiftShader (software)', load: {}, console: [], perf: {} };

// 1) Cold load to the title screen, no debug flags, like a player would.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => result.console.push({ where: 'title', type: 'pageerror', text: e.message }));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') result.console.push({ where: 'title', type: m.type(), text: m.text() }); });
  let bytes = 0;
  page.on('response', async (r) => { const len = Number(r.headers()['content-length'] || 0); bytes += len; });
  const t0 = Date.now();
  await page.goto(base);
  await page.waitForSelector('.title-logo', { timeout: 240000 });
  result.load.titleDomMs = Date.now() - t0;
  await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 240000 });
  result.load.readyMs = Date.now() - t0;
  result.load.transferredBytesCompressed = bytes;
  result.load.error = await page.evaluate(() => window.__nnError ? String(window.__nnError) : null);
  await page.waitForTimeout(3000);
  await ctx.close();
}

// 2) Per-pose numbers on Medium and Low.
for (const preset of ['medium', 'low']) {
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => result.console.push({ where: preset, type: 'pageerror', text: e.message }));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') result.console.push({ where: preset, type: m.type(), text: m.text() }); });
  result.perf[preset] = {};
  for (const s of SHOTS) {
    await page.goto(`${base}?shot=${s}&debug=1&notitle&nointro&gfx=${preset}`);
    await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 240000 });
    await page.waitForTimeout(600);
    const r = await page.evaluate(async () => {
      const t0 = performance.now(); let frames = 0;
      await new Promise((res) => { const f = () => { frames++; if (performance.now() - t0 > 1500) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
      const i = window.nn.engine.renderer.info;
      const w = window.nn.physics.world;
      let awake = 0, dyn = 0;
      w.forEachRigidBody((b) => { if (b.isDynamic()) { dyn++; if (!b.isSleeping()) awake++; } });
      return {
        calls: i.render.calls, tris: i.render.triangles, bodies: window.nn.physics.bodyCount(), dynamic: dyn, awake,
        programs: i.programs.length, textures: i.memory.textures, geometries: i.memory.geometries,
        swFrameMs: +((performance.now() - t0) / frames).toFixed(1),
      };
    });
    result.perf[preset][s] = r;
    console.log(preset, s.padEnd(11), JSON.stringify(r));
  }
  await ctx.close();
}

await browser.close();
server.kill();
mkdirSync('reports', { recursive: true });
writeFileSync(out, JSON.stringify(result, null, 2));
console.log('load', JSON.stringify(result.load));
console.log('console messages', result.console.length);
for (const c of result.console.slice(0, 30)) console.log(' ', c.where, c.type, c.text.slice(0, 200));
