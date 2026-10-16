// Golden screenshots (spec 29): every pose in data/act3/poses.json in survey
// mode, frozen, compared against stored baselines with a 1 percent pixel
// tolerance. Also the performance check (spec 26): draw calls and
// triangles at each pose in both modes.
//   node scripts/act3golden.mjs [base] [--update]
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
const base = process.argv.find((a) => a.startsWith('http')) || 'http://localhost:5173/';
const update = process.argv.includes('--update');
const dir = 'test/act3/golden';
mkdirSync(dir, { recursive: true });
const poses = JSON.parse(readFileSync('data/act3/poses.json', 'utf8')).poses;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
await page.goto(base + '?golden=1&reset=1');
await page.waitForFunction(() => window.__a3Ready, null, { timeout: 120000 });
await page.evaluate(() => { document.getElementById('a3-start').classList.add('hidden'); document.getElementById('hud').style.visibility = 'hidden'; });
let fails = 0;
const perf = [];
for (const p of poses) {
  for (const mode of ['survey', 'style']) {
    await page.evaluate(({ p, mode }) => { const a = window.a3; if (a.mode !== mode) a.setMode(mode); a.pose(p.pose.x, p.pose.y, p.pose.z, p.pose.yaw, p.pose.pitch); }, { p, mode });
    await page.waitForTimeout(400);
    const info = await page.evaluate(() => { const r = window.a3.engine.renderer.info.render; return { calls: r.calls, triangles: r.triangles }; });
    perf.push({ pose: p.name, mode, ...info });
    if (mode !== 'survey') continue;
    const png = await page.screenshot();
    const file = `${dir}/${p.name}.png`;
    if (update || !existsSync(file)) { writeFileSync(file, png); console.log(`baseline ${file}`); continue; }
    const diff = await page.evaluate(async ({ a, b }) => {
      const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height;
      const g = c.getContext('2d');
      g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, c.width, c.height).data;
      g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 30) n++;
      return n / (da.length / 4);
    }, { a: `data:image/png;base64,${png.toString('base64')}`, b: `data:image/png;base64,${readFileSync(file).toString('base64')}` });
    const ok = diff <= 0.01;
    if (!ok) { fails++; writeFileSync(`${dir}/${p.name}.actual.png`, png); }
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${p.name.padEnd(18)} ${(diff * 100).toFixed(2)} % of pixels differ`);
  }
}
const worst = perf.reduce((w, x) => (x.calls > w.calls ? x : w), perf[0]);
const worstT = perf.reduce((w, x) => (x.triangles > w.triangles ? x : w), perf[0]);
console.log(`performance: max draw calls ${worst.calls} (${worst.pose}, ${worst.mode}; budget 350), max triangles ${worstT.triangles} (${worstT.pose}, ${worstT.mode}; budget 1.2M)`);
if (worst.calls >= 350 || worstT.triangles >= 1.2e6) fails++;
await browser.close();
process.exit(fails ? 1 : 0);
