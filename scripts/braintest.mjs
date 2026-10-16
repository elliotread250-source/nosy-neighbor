// Headless test of the learning brain (Milestone 10).
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
const errors = [];
page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
await page.goto('http://localhost:5173/classic.html?debug=1&gfx=low&nopost&notitle');
await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 180000 });
const run = (fn, arg) => page.evaluate(fn, arg);
let fails = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); if (!ok) fails++; };

await run(() => {
  window.V = nn.engine.camera.position.constructor;
  nn.input.locked = true;
  window.events = [];
  import('/src/core/Events.js').then(({ Events }) => {
    for (const k of ['brain:entry', 'brain:queued', 'brain:adapted', 'trap:sprung', 'camera:spotted', 'brain:shot']) Events.on(k, (e) => events.push(`${k} ${JSON.stringify(e)}`));
  });
  window.enter = (id) => {
    const b = nn.brain;
    const e = b.entries.find((x) => x.id === id);
    const out = e.center.clone().addScaledVector(e.inward, -1.6).setY(Math.max(0.05, e.floorY - (e.kind === 'door' ? 0 : 0)));
    const inn = e.center.clone().addScaledVector(e.inward, 1.6).setY(e.floorY);
    nn.player.spawn(out, 0); nn.simulate(0.2);
    nn.player.spawn(inn, 0); nn.simulate(0.2);
    nn.player.spawn(new V(-30, 0.15, 3), 0); nn.simulate(0.2);
  };
  window.away = () => nn.player.spawn(new V(-30, 0.15, 3), 0);
});
await page.waitForTimeout(300);
console.log('entries:', await run(() => nn.brain.entries.map((e) => e.id).join(' ')));

// 1. kitchen door twice -> trap job
await run(() => { enter('d-kitchen'); enter('d-kitchen'); });
check('entry counted twice', await run(() => nn.brain.entryCounts['d-kitchen'] === 2), JSON.stringify(await run(() => nn.brain.entryCounts)));
check('trap queued', await run(() => nn.brain.queue.some((j) => j.type === 'trap')));
// he goes and installs it while you're away
const t1 = await run(() => { away(); nn.ai.activity = null; nn.ai.setState('patrol'); for (let i = 0; i < 60 && !nn.brain.traps.length; i++) nn.simulate(1); return { traps: nn.brain.traps.length, s: nn.ai.state, p: nn.ai.curFeet.toArray().map((v) => v.toFixed(1)).join(',') }; });
check('trap installed', t1.traps === 1, JSON.stringify(t1));

// 2. step in it
const t2 = await run(() => {
  nn.ai.teleport(new V(-5, 4.5, -18), 0);
  const t = nn.brain.traps[0];
  nn.player.spawn(t.pos.clone().add(new V(0.6, 0, 0)), 0);
  nn.simulate(0.1);
  nn.player.spawn(t.pos.clone(), 0);
  nn.simulate(0.2);
  const trapped = !!nn.player.trapped;
  const st = nn.ai.state;
  // mash to escape
  for (let i = 0; i < 6; i++) { nn.input._press('Space'); nn.simulate(0.05); nn.input._release('Space'); nn.simulate(0.05); }
  nn.simulate(0.5);
  return { trapped, st, free: !nn.player.trapped, urgent: !!nn.ai.stateData?.urgent };
});
check('trap holds the player', t2.trapped);
check('trap alerts him', t2.st === 'investigate' && t2.urgent, t2.st);
check('mashing frees you', t2.free);

// 3. third and fourth entry -> camera, then boards
await run(() => { nn.ai.teleport(new V(6.4, 0.6, -22.4), Math.PI); nn.ai.setState('patrol'); enter('d-kitchen'); });
check('camera queued', await run(() => nn.brain.queue.some((j) => j.type === 'camera')));
const t3 = await run(() => { away(); nn.ai.activity = null; nn.ai.setState('patrol'); for (let i = 0; i < 60 && !nn.brain.cameras.length; i++) nn.simulate(1); return nn.brain.cameras.length; });
check('camera installed', t3 === 1);
const t4 = await run(() => {
  nn.ai.teleport(new V(-5, 4.5, -18), 0); nn.ai.setState('patrol');
  const e = nn.brain.entries.find((x) => x.id === 'd-kitchen');
  const p = e.center.clone().addScaledVector(e.inward, 2.2).setY(e.floorY);
  nn.player.spawn(p, 0);
  nn.simulate(0.6);
  return { spotted: events.some((x) => x.startsWith('camera:spotted')), st: nn.ai.state };
});
check('camera spots you', t4.spotted, t4.st);
await run(() => { nn.ai.teleport(new V(6.4, 0.6, -22.4), Math.PI); nn.ai.setState('patrol'); enter('d-kitchen'); });
const t5 = await run(() => { away(); nn.ai.activity = null; nn.ai.setState('patrol'); for (let i = 0; i < 60 && nn.brain.boards === 0; i++) nn.simulate(1); return nn.world.doors.get('d-kitchen').boards; });
check('kitchen door boarded', t5 > 0, `boards=${t5}`);

// 4. favorite hiding spot gets checked first
const t6 = await run(() => {
  const spot = nn.world.hideSpots.find((s) => s.room === 'living');
  for (let i = 0; i < 3; i++) { nn.hiding.enter(spot); nn.simulate(0.1); nn.hiding.exit(); }
  return nn.brain.favoredHideSpots().has(spot.id);
});
check('hide spot favored after 3 uses', t6);

// 5. lure fatigue: third TV in a row is ignored
const t7 = await run(() => {
  const ai = nn.ai, tv = nn.devices.tvs[0];
  const states = [];
  for (let k = 0; k < 3; k++) {
    ai.teleport(new V(4.4, 0.6, -24.6), 0); ai.activity = null; ai.setState('patrol');
    if (tv.on) tv.toggle();
    tv.toggle();
    nn.simulate(1.5);
    states.push(ai.state);
    if (tv.on) tv.toggle();
  }
  return states;
});
check('first TV heard', ['hear', 'investigate'].includes(t7[0]), t7.join(','));
check('third TV ignored', t7[2] === 'patrol' || t7[2] === 'activity', t7.join(','));

// 6. establishing shot after a catch when something new is queued
const t8 = await run(() => {
  nn.brain.pendingShot = nn.brain.queue[0] ?? nn.brain._makeJob('board', nn.brain.entries.find((e) => e.id === 'w-living1'));
  import('/src/core/Events.js').then(({ Events }) => Events.emit('catch:end', {}));
  return true;
});
await page.waitForTimeout(100);
const t9 = await run(() => { const a = !!nn.brain.shot; nn.simulate(2.6); return { a, b: !!nn.brain.shot, ext: nn.player.externalCamera }; });
check('establishing shot plays then ends', t9.a && !t9.b && !t9.ext, JSON.stringify(t9));

// 7. three broken windows -> glue
const t10 = await run(() => {
  const ids = nn.brain.entries.filter((e) => e.kind === 'window' && e.floor === 'F0' && !e.win.boards.length).slice(0, 3).map((e) => e.id);
  for (const id of ids) { nn.world.windows.breakGlass(id); import('/src/core/Events.js').then(({ Events }) => Events.emit('window:broken', { id })); }
  return ids;
});
await page.waitForTimeout(100);
check('glue queued after 3 broken windows', await run(() => nn.brain.queue.some((j) => j.type === 'glue')), t10.join(','));

console.log(await run(() => events.slice(-12).join('\n')));
check('no page errors', errors.length === 0, errors.slice(0, 3).join(' / '));
console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
await browser.close();
process.exit(fails ? 1 : 0);
