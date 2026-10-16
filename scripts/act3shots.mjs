// Act 3 House Study screenshots: boots the page, poses the camera, and shoots.
// Usage: node scripts/act3shots.mjs [base] [house]
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://localhost:5173/';
const house = process.argv[3] || '';
const out = process.argv[4] || 'screenshots/act3';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(base + (house ? `?house=${house}` : ''));
await page.waitForFunction(() => window.__a3Ready || window.__a3Error, null, { timeout: 60000 });
const err = await page.evaluate(() => window.__a3Error);
if (err) { console.error('boot error', err); process.exit(1); }
await page.screenshot({ path: `${out}/00-start.png` });
await page.evaluate(() => document.getElementById('a3-start').classList.add('hidden'));
const poses = JSON.parse(process.env.POSES || '[]');
const shot = async (name, pose, setup) => {
  await page.evaluate(({ pose, setup }) => {
    const a = window.a3;
    if (pose) a.pose(pose.x, pose.y, pose.z, pose.yaw ?? 0, pose.pitch ?? 0);
    if (setup) (new Function('a', setup))(a);
  }, { pose, setup });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}.png` });
};
for (const p of poses) await shot(p.name, p.pose, p.setup);
console.log(JSON.stringify(await page.evaluate(() => ({ stats: window.a3.house.stats(), measured: window.a3.audit.overallMeasured, warnings: window.a3.plan.warnings }))));
if (errors.length) console.log('errors:', errors.join('\n'));
await browser.close();
