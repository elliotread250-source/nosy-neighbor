// Headless controller smoke test: drives keys and reads player state.
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:5173/';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`${base}?debug=1`);
await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 90000 });

const state = () => page.evaluate(() => {
  const p = window.nn.player;
  const f = p.curFeet;
  return { x: +f.x.toFixed(2), y: +f.y.toFixed(2), z: +f.z.toFixed(2), grounded: p.grounded, crouch: p.crouching, sprint: p.sprinting, stamina: +p.stamina.toFixed(2), eye: +window.nn.engine.camera.position.y.toFixed(2) };
});
const hold = async (keys, ms) => {
  for (const k of keys) await page.keyboard.down(k);
  await page.waitForTimeout(ms);
  for (const k of keys) await page.keyboard.up(k);
};
await page.evaluate(() => { window.nn.input.locked = true; });
await page.waitForTimeout(500);
console.log('start', await state());
await hold(['KeyW'], 1000);
console.log('after walk 1s (expect ~3m north)', await state());
await hold(['ShiftLeft', 'KeyW'], 1500);
console.log('after sprint 1.5s', await state());
await page.keyboard.press('Space');
await page.waitForTimeout(150);
console.log('mid jump', await state());
await page.waitForTimeout(900);
console.log('landed', await state());
await page.keyboard.down('KeyC');
await page.waitForTimeout(500);
console.log('crouched', await state());
await page.keyboard.up('KeyC');
await page.waitForTimeout(500);
console.log('stood', await state());
// stairs: teleport in front of steps at (9, -1.5) facing north, walk up
await page.evaluate(() => { const T = window.nn.player; T.spawn({ x: 9, y: 0, z: -1, clone() { return this; } }, 0); });
await page.waitForTimeout(300);
await hold(['KeyW'], 1800);
console.log('after stairs (expect y ~1.32)', await state());
// crates: approach crate stack at (5,-2) from south, crouch-jump onto it
await page.evaluate(() => { const T = window.nn.player; T.spawn({ x: 5, y: 0, z: 0.2, clone() { return this; } }, 0); });
await page.waitForTimeout(300);
await page.keyboard.down('KeyW');
await page.keyboard.press('Space');
await page.waitForTimeout(80);
await page.keyboard.down('KeyC');
await page.waitForTimeout(700);
await page.keyboard.up('KeyW');
await page.keyboard.up('KeyC');
await page.waitForTimeout(400);
console.log('after crate jump (expect y ~1)', await state());
await browser.close();
