// Desktop still works as before: keyboard walks, the mouse looks (pointer
// lock), a gamepad moves, no touch controls are shown, the key hints are.
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://localhost:5173/act3/';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(base + '?reset=1');
await page.waitForFunction(() => window.__a3Ready, null, { timeout: 120000 });
let fails = 0;
const check = (n, ok, d = '') => { if (!ok) fails++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n} ${d}`); };
const ui = await page.evaluate(() => ({ device: window.a3.input.device, touch: getComputedStyle(document.getElementById('touch')).display, keys: getComputedStyle(document.querySelector('.a3-keys')).display, quality: window.a3.quality, gov: window.a3.governor.enabled, dpr: window.a3.engine.renderer.getPixelRatio() }));
check('desktop: keyboard/mouse mode, no touch controls, key hints shown', ui.device === 'kbm' && ui.touch === 'none' && ui.keys !== 'none', JSON.stringify(ui));
await page.mouse.click(640, 360);
await page.waitForTimeout(500);
const locked = await page.evaluate(() => window.a3.input.locked);
check('click to explore takes pointer lock', locked);
await page.evaluate(() => window.a3.teleport(2.05, 0, -6, 180));
await page.waitForTimeout(400);
const p0 = await page.evaluate(() => ({ ...window.a3.player.curFeet }));
await page.keyboard.down('KeyW'); await page.waitForTimeout(1500); await page.keyboard.up('KeyW');
await page.waitForTimeout(200);
const p1 = await page.evaluate(() => ({ ...window.a3.player.curFeet }));
check('W walks', Math.hypot(p1.x - p0.x, p1.z - p0.z) > 0.3, `${Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(2)} m`);
const y0 = await page.evaluate(() => window.a3.player.yaw);
// headless pointer lock reports movement as cancelling +x/-x pairs, so send
// mouse moves with explicit movement deltas through the same handler
await page.evaluate(() => { for (let i = 0; i < 10; i++) window.dispatchEvent(new MouseEvent('mousemove', { movementX: 20, movementY: 0 })); });
await page.waitForTimeout(400);
const y1 = await page.evaluate(() => window.a3.player.yaw);
check('mouse looks (with pointer lock)', !locked || Math.abs(y1 - y0) > 0.02, `yaw ${((y1 - y0) * 57.3).toFixed(1)} deg`);
// gamepad: fake one stick pushed forward
const q0 = await page.evaluate(() => ({ ...window.a3.player.curFeet }));
await page.evaluate(() => { const pad = { connected: true, axes: [0, -1, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }; navigator.getGamepads = () => [pad]; });
await page.waitForTimeout(1500);
await page.evaluate(() => { navigator.getGamepads = () => []; });
await page.waitForTimeout(200);
const q1 = await page.evaluate(() => ({ ...window.a3.player.curFeet, device: window.a3.input.device, touch: getComputedStyle(document.getElementById('touch')).display }));
check('gamepad stick walks, switches device, touch controls stay hidden', Math.hypot(q1.x - q0.x, q1.z - q0.z) > 0.3 && q1.device === 'pad' && q1.touch === 'none', `${Math.hypot(q1.x - q0.x, q1.z - q0.z).toFixed(2)} m, device ${q1.device}`);
check('no console errors', errors.length === 0, errors.join(' | '));
await browser.close();
process.exit(fails ? 1 : 0);
