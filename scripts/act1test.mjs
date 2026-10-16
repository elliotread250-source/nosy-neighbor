// Act 1 start to finish (Milestone 11): intro, every key and tool in order,
// the washer puzzle, the cage, the final unlock and the ending screen.
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
  window.log = [];
  import('/src/core/Events.js').then(({ Events }) => {
    for (const k of ['objective', 'act:complete', 'washer:open']) Events.on(k, (e) => log.push(`${k} ${e.id ?? ''}`));
  });
  window.aim = (feet, target) => {
    const p = nn.player;
    p.spawn(new V(...feet), 0);
    nn.simulate(0.05);
    const eye = p.camera.position;
    const dx = target[0] - eye.x, dy = target[1] - eye.y, dz = target[2] - eye.z;
    p.yaw = Math.atan2(-dx, -dz);
    p.pitch = Math.atan2(dy, Math.hypot(dx, dz));
    nn.simulate(0.05);
    const t = nn.interaction._findTarget();
    return t ? t.label : null;
  };
  window.press = (code = 'KeyE', hold = 0.05) => { nn.input._press(code); nn.simulate(hold); nn.input._release(code); nn.simulate(0.05); };
  window.doorAim = (id, fromDx, fromDz, floorY) => {
    const d = nn.world.doors.get(id).worldCenter(new V());
    return aim([d.x + fromDx, floorY, d.z + fromDz], [d.x, d.y, d.z]);
  };
  window.keep = () => { nn.ai.frozen = true; nn.ai.teleport(new V(6.4, 0.6, -22.4), Math.PI); };
});

// intro
await run(() => nn.story.startIntro());
const intro = await run(() => { const modes = []; for (let i = 0; i < 30 && nn.story.mode; i++) { nn.simulate(1); modes.push(nn.story.mode); } return { modes: [...new Set(modes)], enabled: nn.player.enabled, mode: nn.story.mode }; });
check('intro plays and hands over control', intro.mode === null && intro.enabled, intro.modes.join('>'));
await run(() => keep());

// red key -> closet -> wrench
await run(() => { const k = nn.devices.keyRed.obj.getWorldPosition(new V()); aim([k.x - 0.9, 4.5, k.z - 0.6], k.toArray()); press(); });
check('red key', await run(() => nn.interaction.inv.hasKey('red')));
check('closet door prompt', /Unlock/.test(await run(() => doorAim('d-closet', -1.0, 0, 4.5)) ?? ''));
await run(() => press());
await run(() => { const t = nn.world.house.toolbox.getWorldPosition(new V()); aim([t.x + 0.9, 4.5, t.z + 0.6], [t.x, t.y + 0.2, t.z]); press(); });
check('wrench', await run(() => nn.interaction.inv.has('wrench')));

// valve -> blue key -> kid room
await run(() => { const v = nn.world.yard.pool.userData.valve.getWorldPosition(new V()); aim([v.x - 0.9, 0.05, v.z + 0.4], v.toArray()); press(); nn.simulate(4.5); const k = nn.devices.keyBlue.obj.getWorldPosition(new V()); aim([k.x + 1.6, 0.05, k.z + 0.4], k.toArray()); press(); });
check('blue key', await run(() => nn.interaction.inv.hasKey('blue')));
check('kid door prompt', /blue key/.test(await run(() => doorAim('d-kid', -1.0, 0, 4.5)) ?? ''));
await run(() => press());
check('kid door open', await run(() => nn.world.doors.get('d-kid').isOpen));

// crowbar (from up high) -> pry purple door -> green key
await run(() => { const c = nn.devices.crowbar.mesh.position.toArray(); aim([c[0], 5.3, c[2] - 0.7], c); press(); });
check('crowbar', await run(() => nn.interaction.inv.has('crowbar')));
for (let i = 0; i < 3; i++) await run(() => { doorAim('d-purple', 1.0, 0, 8.2); press('KeyE', 1.05); });
check('purple boards off', await run(() => nn.world.doors.get('d-purple').boards === 0));
await run(() => { const k = nn.devices.keyGreen.obj.getWorldPosition(new V()); aim([k.x + 1.0, 8.2, k.z + 0.3], k.toArray()); press(); });
check('green key (from the hook)', await run(() => nn.interaction.inv.hasKey('green')));

// green door -> magnet gun -> monitors
const gl = await run(() => doorAim('d-green', -1.0, 0, 8.2));
check('green door prompt', /green key/.test(gl ?? ''), gl);
await run(() => { press(); nn.simulate(0.8); });
check('green door open', await run(() => nn.world.doors.get('d-green').isOpen));
await run(() => { const m = nn.devices.magnet.mesh.position.toArray(); aim([m[0] - 1.0, 8.6, m[2] + 0.5], m); press(); });
check('magnet gun', await run(() => nn.interaction.inv.has('magnet')));
const mon = await run(() => { const p = nn.world.house.monitors.getWorldPosition(new V()); const l = aim([p.x - 1.0, 8.6, p.z], [p.x, p.y + 1.1, p.z]); press(); const on = nn.story.mode; nn.simulate(0.3); press(); const cam2 = nn.story.camIdx; nn.simulate(0.3); press('Space'); return { l, on, cam2, after: nn.story.mode }; });
check('security monitors', mon.on === 'monitors' && mon.cam2 === 1 && mon.after === null, JSON.stringify(mon));

// attic key with the magnet
const at = await run(() => {
  const slot = nn.interaction.inv.slots.findIndex((s) => s?.kind === 'magnet');
  nn.interaction.inv.select(slot);
  const k = nn.devices.keyAttic.obj.getWorldPosition(new V());
  const l = aim([k.x + 2.0, 4.5, k.z + 1.2], k.toArray());
  nn.input._press('Mouse0'); nn.simulate(2.5); nn.input._release('Mouse0'); nn.simulate(0.1);
  return l;
});
check('attic key by magnet', await run(() => nn.interaction.inv.hasKey('attic')), at);

// attic hatch -> trunk note
const hatch = await run(() => {
  const h = nn.world.interior.hatches.find((x) => x.lock === 'attic');
  const t = nn.interaction._hatchTarget(h);
  const l = t.label;
  t.act();
  return { l, open: h.isOpen };
});
check('attic hatch unlocks', /attic key/.test(hatch.l) && hatch.open, hatch.l);
const note = await run(() => { const p = nn.world.house.atticTrunk.getWorldPosition(new V()); const l = aim([p.x, 12.0, p.z + 1.1], [p.x, p.y + 0.4, p.z]); press(); const m = nn.story.mode; nn.simulate(0.5); press(); return { l, m, after: nn.story.mode, code: nn.story.code }; });
check('trunk note shows the code', note.m === 'note' && note.after === null, JSON.stringify(note));

// washer: dial in the code
const wash = await run(() => {
  keep();
  const code = nn.story.code;
  nn.story.knobs.forEach((k, i) => {
    for (let n = 1; n < code[i]; n++) nn.story.turnKnob(k);
  });
  nn.simulate(3.5);
  const h = nn.world.interior.hatches.find((x) => x.id === 'h-washer');
  return { open: nn.story.washer.open, hatch: h?.isOpen, moved: nn.story.washer.obj.position.x - nn.story.washer.base.x };
});
check('washer slides aside and the hatch opens', wash.open && wash.hatch && wash.moved > 0.8, JSON.stringify(wash));

// knob prompt works through the interaction system
const knobLabel = await run(() => { const k = nn.story.knobs[0].knob.getWorldPosition(new V()); return aim([k.x, 0.6, k.z + 1.0], k.toArray()); });
check('knob prompt (after open: none)', knobLabel === null || !/dial/.test(knobLabel), knobLabel);

// tunnel: cage needs the wrench, then the basement key
const cage = await run(() => {
  const end = nn.world.house.tunnelEnd;
  const c = nn.story.cage.g.getWorldPosition(new V());
  const l1 = aim([end.x - 1.4, end.y, end.z], c.toArray());
  const keyBefore = (() => { const k = nn.story.keyBasement.obj.getWorldPosition(new V()); return aim([end.x - 1.0, end.y, end.z], k.toArray()); })();
  aim([end.x - 1.4, end.y, end.z], c.toArray());
  press();
  nn.simulate(0.6);
  const k = nn.story.keyBasement.obj.getWorldPosition(new V());
  const l2 = aim([end.x - 1.0, end.y, end.z], k.toArray());
  press();
  return { l1, keyBefore, l2, has: nn.interaction.inv.hasKey('basement') };
});
check('cage unbolts with the wrench', /wrench/.test(cage.l1 ?? ''), cage.l1);
check('caged key not takeable by hand', !/Take/.test(cage.keyBefore ?? ''), cage.keyBefore);
check('basement key', cage.has, cage.l2);
check('final run: he heads for the basement door', await run(() => nn.brain.storyBias?.basementDoor > 1));

// final unlock and the ending
const fin = await run(() => {
  keep();
  const l = doorAim('d-basement', 0, 1.2, 0.6);
  nn.input._press('KeyE'); nn.simulate(3.3); nn.input._release('KeyE'); nn.simulate(0.1);
  return { l, mode: nn.story.mode, chains: nn.world.doors.get('d-basement').chains };
});
check('basement door unlock (hold 3 s)', /basement door/.test(fin.l ?? '') && fin.mode === 'ending' && fin.chains === 0, JSON.stringify(fin));
const end = await run(() => { const ph = []; for (let i = 0; i < 70 && !log.some((x) => x.startsWith('act:complete')); i++) { nn.simulate(0.5); ph.push(nn.story.endPhase); } return { ph: [...new Set(ph)], done: log.some((x) => x.startsWith('act:complete')), state: nn.state }; });
check('ending plays to ACT 1 COMPLETE', end.done && end.state === 'ended', end.ph.join('>'));
console.log(await run(() => log.join('\n')));
check('no page errors', errors.length === 0, errors.slice(0, 3).join(' / '));
console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
await browser.close();
process.exit(fails ? 1 : 0);
