// Draw calls / triangles / fps at a few camera poses. node scripts/perf.mjs [shot,...] [extra query]
import { chromium } from 'playwright';
const shots = (process.argv[2] || 'porch,inLiving,inHall1,nhCorner').split(',');
const extra = process.argv[3] || '';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
for (const s of shots) {
  await page.goto(`http://localhost:5173/?shot=${s}&debug=1${extra ? '&' + extra : ''}`);
  await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 180000 });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const i = window.nn.engine.renderer.info;
    let meshes = 0; window.nn.engine.scene.traverseVisible((o) => { if (o.isMesh) meshes++; });
    return { calls: i.render.calls, tris: Math.round(i.render.triangles / 1000) + 'k', progs: i.programs.length, visibleMeshes: meshes, bodies: window.nn.physics.bodyCount() };
  });
  console.log(s, JSON.stringify(r));
}
await browser.close();
