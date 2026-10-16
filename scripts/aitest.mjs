// Headless AI scenario test using nn.simulate() (fast, no rendering).
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('nav:')) console.log('[console]', m.text()); });
await page.goto('http://localhost:5173/?debug=1&gfx=low&nopost');
await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 180000 });
const run = (fn, arg) => page.evaluate(fn, arg);
await run(() => { window.V = nn.engine.camera.position.constructor; nn.input.locked = true; });
const snap = () => run(() => {
  const a = nn.ai; const f = a.curFeet; const p = nn.player.curFeet;
  return `t=${a.time.toFixed(1)} ${a.state.padEnd(11)} m=${a.meter.toFixed(2)} grim=(${f.x.toFixed(1)},${f.y.toFixed(1)},${f.z.toFixed(1)}) ${nn.neighborAnim.clip.padEnd(10)} player=(${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}) catches=${nn.catches}${a.activity ? ' act=' + a.activity.id : ''}`;
});
const sim = async (sec, every = 1) => { for (let t = 0; t < sec; t += every) { await run((s) => nn.simulate(s), every); console.log(await snap()); } };

console.log('--- 1. patrol, player far away on the street');
await run(() => nn.player.spawn(new V(-30, 0.15, 3), 0));
await sim(16, 2);

console.log('--- 2. player stands in plain view in the living room while he is in it');
await run(() => { nn.ai.teleport(new V(-4.75, 0.6, -20.5), 0); nn.ai.activity = null; nn.ai.setState('patrol'); nn.player.spawn(new V(-4.75, 0.6, -15.5), Math.PI); });
await sim(4, 0.5);

console.log('--- 3. chase across the street: he stops at the property line and stares');
await run(() => { nn.ai.teleport(new V(0, 0.05, -9.5), 0); nn.ai.activity = null; nn.ai.meter = 1; nn.ai.setState('chase'); nn.player.spawn(new V(0, 0.15, -2), 0); });
for (let i = 0; i < 10; i++) {
  await run(() => { const p = nn.player; p.yaw = Math.PI; nn.input.held.add('KeyW'); nn.input.held.add('ShiftLeft'); });
  await run(() => nn.simulate(0.6));
  console.log(await snap());
}
await run(() => nn.input.held.clear());
await sim(7, 1);
console.log('--- 3b. he climbs the main stairs to the study');
await run(() => { nn.player.spawn(new V(-30, 0.15, 3), 0); nn.ai.teleport(new V(0.2, 0.6, -16.2), 0); nn.ai.meter = 0; nn.ai.setState('patrol'); nn.ai.activity = { id: 'study', pos: [2.4, 4.5, -18.1], face: [2.4, 5.2, -19.4], anim: 'idle', dur: 3 }; nn.ai.goal = new V(2.4, 4.5, -18.1); nn.ai.path = null; });
await sim(16, 2);
console.log('--- 4. a noise in the dining room while he patrols the living room');
await run(() => { nn.player.spawn(new V(-30, 0.15, 3), 0); nn.ai.teleport(new V(-4.5, 0.6, -19), 0); nn.ai.activity = null; nn.ai.setState('patrol'); });
await run(() => import('/src/core/Events.js').then(({ Events }) => Events.emit('noise', { position: new V(4.75, 1.0, -17), loudness: 1.5, kind: 'glass', global: true })));
await sim(14, 1);

console.log('--- 5. chase into the kitchen, he catches a standing player');
await run(() => { nn.ai.teleport(new V(3, 0.6, -24), Math.PI / 2); nn.ai.setState('patrol'); nn.ai.activity = { id: 'x', pos: [3.1, 0.6, -24], face: [6, 1, -24], anim: 'idle', dur: 9 }; nn.ai.goal = new V(3.1, 0.6, -24); nn.ai.setState('activity'); nn.player.spawn(new V(6.5, 0.6, -24), -Math.PI / 2); });
await sim(6, 0.5);
await browser.close();
