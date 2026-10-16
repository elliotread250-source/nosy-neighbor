// Milestone 2 check: render the test room straight-on with the height gauge
// beside the door, then measure the door in tools/measure.html using the
// gauge (the player) as the ruler. The answer should come back near 2.6 m.
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://localhost:5173/act3/';
const out = 'screenshots/act3';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(base + '?house=test');
await page.waitForFunction(() => window.__a3Ready, null, { timeout: 60000 });
const px = await page.evaluate(() => {
  const a = window.a3;
  document.getElementById('a3-start').classList.add('hidden');
  document.getElementById('hud').style.display = 'none';
  a.pose(2.475, 1.3, 3.75, 0, 0);
  a.tools.gauge.visible = true; a.tools.gaugePinned = true;
  a.tools.gauge.position.set(1.6, 0, 0.17); a.tools.gauge.rotation.y = 0;
  a.engine.camera.updateMatrixWorld();
  const V = a.engine.camera.position.constructor;
  const P = (x, y, z) => { const v = new V(x, y, z).project(a.engine.camera); return [((v.x + 1) / 2) * innerWidth, ((1 - v.y) / 2) * innerHeight]; };
  return { gaugeBottom: P(1.6, 0, 0.17), gaugeTop: P(1.6, 1.2, 0.17), doorBottom: P(2.475, 0, 0.15), doorTop: P(2.475, 2.6, 0.15) };
});
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/m2-source.png` });
const tool = await browser.newPage({ viewport: { width: 1700, height: 900 } });
await tool.goto(base + 'tools/measure.html');
await tool.setInputFiles('#file', `${out}/m2-source.png`);
await tool.waitForFunction(() => document.getElementById('imginfo').textContent.includes('sha256'));
await tool.fill('#build', 'own render of the one-room test house (tool check, not the game)');
await tool.selectOption('#rulerKind', 'player');
await tool.fill('#clickSig', '1.5');
await tool.fill('#target', 'F0.test_room.wall0.opening0.height');
const box = await tool.locator('#cv').boundingBox();
const k = box.width / 1280;
for (const p of [px.gaugeBottom, px.gaugeTop, px.doorBottom, px.doorTop]) await tool.mouse.click(box.x + p[0] * k, box.y + p[1] * k);
const text = await tool.textContent('#result');
await tool.mouse.move(5, 890); await tool.screenshot({ path: `${out}/m2-measure-tool.png` });
console.log(JSON.stringify(px));
console.log(text);
await browser.close();
