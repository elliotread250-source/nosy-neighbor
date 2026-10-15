// Physical route tests: stairs and ladders. Uses debug hooks.
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 480, height: 270 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:5173/?debug=1&gfx=low&nopost');
await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 180000 });
const st = () => page.evaluate(() => { const f = nn.player.curFeet; return `(${f.x.toFixed(2)}, ${f.y.toFixed(2)}, ${f.z.toFixed(2)}) ${nn.player.grounded ? 'G' : 'air'}${nn.player.onLadder ? ' LADDER' : ''}`; });
const tp = (x, y, z, yaw) => page.evaluate(([x, y, z, yaw]) => { nn.input.locked = true; nn.player.spawn({ x, y, z, clone() { return { ...this }; } }, yaw); }, [x, y, z, yaw]);
const hold = async (keys, ms) => { for (const k of keys) await page.keyboard.down(k); await page.waitForTimeout(ms); for (const k of keys) await page.keyboard.up(k); };
async function walkUntil(keys, pred, maxMs = 45000) {
  for (const k of keys) await page.keyboard.down(k);
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) { await page.waitForTimeout(250); if (await page.evaluate(pred)) break; }
  for (const k of keys) await page.keyboard.up(k);
}
// 1) main stairs
await tp(-0.85, 0.6, -16.7, 0);
await page.waitForTimeout(400);
await walkUntil(['KeyW'], () => nn.player.curFeet.y > 4.4 || nn.player.curFeet.z < -23);
console.log('main stairs ->', await st(), '(want y~4.5)');
// 2) back stairs: open door, west up flight 1, turn, east up flight 2
await page.evaluate(() => nn.level.doors.get('d-stair2').open(new nn.engine.camera.position.constructor(0, 5, -24.3)));
await tp(-1.8, 4.5, -24.25, Math.PI / 2);
await page.waitForTimeout(800);
await walkUntil(['KeyW'], () => nn.player.curFeet.x < -6.2, 45000);
console.log('flight 1 ->', await st(), '(want y~6.35 at landing)');
await page.evaluate(() => { nn.player.yaw = 0; });
await hold(['KeyW'], 1500);
await page.evaluate(() => { nn.player.yaw = -Math.PI / 2; });
await walkUntil(['KeyW'], () => nn.player.curFeet.x > -2.2, 45000);
console.log('flight 2 ->', await st(), '(want y~8.2)');
// 3) ladder shaft from the mudroom up to the purple room
await page.evaluate(() => { nn.level.interior.hatches.find((h) => h.id === 'h-purple').open(); });
await tp(-0.45, 0.6, -22.95, 0);
await page.waitForTimeout(500);
await walkUntil(['KeyW'], () => nn.player.curFeet.y > 8.0, 45000);
console.log('ladder ->', await st(), '(want y>8)');
await browser.close();
