// Headless gameplay-systems test (Milestone 9): pickups, keys, doors,
// throwing, glass, hiding, lures, tools. Drives the game through window.nn.
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
const errors = [];
page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text()); });
await page.goto('http://localhost:5173/classic.html?debug=1&gfx=low&nopost&notitle');
await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 180000 });
const run = (fn, arg) => page.evaluate(fn, arg);
let fails = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); if (!ok) fails++; };

await run(() => {
  window.V = nn.engine.camera.position.constructor;
  nn.input.locked = true;
  nn.ai.frozen = true;
  nn.ai.teleport(new V(6.4, 0.6, -22.4), Math.PI);
  // stand at feet, look at a point
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
  window.press = (code, hold = 0.05) => { nn.input._press(code); nn.simulate(hold); nn.input._release(code); nn.simulate(0.05); };
});

console.log('targets:', await run(() => nn.interaction.targets.length), 'hide spots:', await run(() => nn.world.hideSpots.length));

// 1. red key on the green table in the study
{
  const k = await run(() => nn.devices.keyRed.obj.getWorldPosition(new V()).toArray());
  const label = await run(([k]) => aim([k[0] - 0.9, 4.5, k[2] - 0.6], k), [k]);
  check('red key prompt', /red key/.test(label ?? ''), label);
  await run(() => press('KeyE'));
  check('red key collected', await run(() => nn.interaction.inv.keys.has('red')));
}

// 2. red door (utility closet) unlocks with the red key
{
  const d = await run(() => { const d = nn.world.doors.get('d-closet'); return d.worldCenter(new V()).toArray(); });
  const label = await run(([d]) => aim([d[0] - 1.0, 4.5, d[2]], d), [d]);
  check('closet door prompt', /Unlock with the red key/.test(label ?? ''), label);
  await run(() => press('KeyE'));
  check('closet door open', await run(() => { const d = nn.world.doors.get('d-closet'); return !d.lock && d.isOpen; }));
}

// 3. toolbox gives the wrench
{
  const t = await run(() => nn.world.house.toolbox.getWorldPosition(new V()).toArray());
  const label = await run(([t]) => aim([t[0] + 0.9, 4.5, t[2] + 0.6], [t[0], t[1] + 0.2, t[2]]), [t]);
  check('toolbox prompt', /toolbox/.test(label ?? ''), label);
  await run(() => press('KeyE'));
  check('wrench in hand', await run(() => nn.interaction.inv.has('wrench')));
}

// 4. pick up a mug and throw it through a window from outside
{
  const r = await run(() => {
    const e = nn.physics.dynamics.find((d) => d.data?.item === 'mug');
    const m = e.mesh.position;
    nn.player.spawn(new V(m.x + 0.8, m.y - 0.9, m.z), 0);
    nn.simulate(0.05);
    const label = aim([m.x + 0.8, Math.max(0.6, m.y - 0.95), m.z], [m.x, m.y + 0.05, m.z]);
    return { label, pos: m.toArray() };
  });
  check('mug prompt', /mug/i.test(r.label ?? ''), r.label);
  await run(() => press('KeyE'));
  check('mug in a slot', await run(() => nn.interaction.inv.held?.kind === 'mug'));
  // go outside the living room's front window and throw
  const w = await run(() => { const id = [...nn.world.windows.windows.keys()].find((k) => { const w = nn.world.windows.get(k); return w.center.y < 3 && w.center.z > -14.5 && w.center.z < -13 && !w.broken && !w.boards.length; }); const w = nn.world.windows.get(id); return { id, c: w.center.toArray() }; });
  await run(([w]) => aim([w.c[0], 0.6, w.c[2] + 3.0], w.c), [w]);
  await run(() => { nn.input._press('Mouse0'); nn.simulate(0.05); });
  // first press may target nothing: charge
  const charging = await run(() => nn.interaction.charging);
  await run(() => { nn.simulate(0.8); nn.input._release('Mouse0'); nn.simulate(1.5); });
  check('throw charged', charging);
  check('window smashed', await run((id) => nn.world.windows.get(id).broken, w.id), w.id);
}

// 5. hide in a wardrobe; the neighbor walks past without seeing
{
  const r = await run(() => {
    const spot = nn.world.hideSpots.find((s) => s.kind === 'wardrobe' && s.room === 'hall');
    const e = spot.eye;
    const label = aim([spot.exit.x, spot.exit.y, spot.exit.z], [e.x, e.y, e.z]);
    return label;
  });
  check('hide prompt', /Hide/.test(r ?? ''), r);
  await run(() => press('KeyE'));
  check('hiding', await run(() => nn.player.hiding));
  const seen = await run(() => { nn.ai.frozen = false; nn.ai.teleport(new V(0, 0.6, -18), 0); nn.ai.setState('patrol'); nn.simulate(3); return nn.ai.meter; });
  check('not seen while hidden', seen < 0.2, `meter=${seen.toFixed(2)}`);
  await run(() => press('KeyE'));
  check('left hiding spot', await run(() => !nn.player.hiding));
  await run(() => { nn.ai.frozen = true; nn.ai.teleport(new V(6.4, 0.6, -22.4), Math.PI); nn.player.spawn(new V(-30, 0.15, 3), 0); });
}

// 6. TV lure: he walks over and switches it off
{
  await run(() => { nn.ai.frozen = false; nn.ai.teleport(new V(6.4, 0.6, -22.4), Math.PI); nn.ai.activity = null; nn.ai.setState('patrol'); nn.player.spawn(new V(-30, 0.15, 3), 0); });
  const ok = await run(() => { const tv = nn.devices.tvs[0]; tv.toggle(); return tv.on; });
  check('TV on', ok);
  let off = false, states = [];
  for (let i = 0; i < 16 && !off; i++) {
    const r = await run(() => { nn.simulate(1.5); return { on: nn.devices.tvs[0].on, s: nn.ai.state, p: nn.ai.curFeet.toArray().map((v) => v.toFixed(1)).join(',') }; });
    states.push(`${r.s}@${r.p}`);
    off = !r.on;
  }
  check('neighbor switched the TV off', off, states.slice(-4).join(' | '));
  await run(() => { nn.ai.frozen = true; nn.ai.teleport(new V(6.4, 0.6, -22.4), Math.PI); });
}

// 7. wrench on the pool valve drains it; blue key appears
{
  const v = await run(() => nn.world.yard.pool.userData.valve.getWorldPosition(new V()).toArray());
  const label = await run(([v]) => aim([v[0] - 0.9, 0.05, v[2] + 0.4], v), [v]);
  check('valve prompt', /valve/.test(label ?? ''), label);
  await run(() => { press('KeyE'); nn.simulate(4.5); });
  check('pool drained', await run(() => nn.devices.pool.drained));
  const k = await run(() => nn.devices.keyBlue.obj.getWorldPosition(new V()).toArray());
  const l2 = await run(([k]) => aim([k[0] + 1.6, 0.05, k[2] + 0.4], k), [k]);
  check('blue key reachable', /blue key/.test(l2 ?? ''), l2);
  await run(() => press('KeyE'));
  check('blue key collected', await run(() => nn.interaction.inv.keys.has('blue')));
}

// 8. crowbar: too high from the floor, reachable standing on something
{
  const c = await run(() => nn.devices.crowbar.mesh.position.toArray());
  const low = await run(([c]) => aim([c[0], 4.5, c[2] - 0.7], c), [c]);
  check('crowbar out of reach from the floor', !low || /Too high/.test(low), low);
  // standing on something (mid-fall from 0.8 m up works the same in this test)
  await run(([c]) => { aim([c[0], 5.3, c[2] - 0.7], c); press('KeyE'); }, [c]);
  check('crowbar taken', await run(() => nn.interaction.inv.has('crowbar')));
}

// 9. crowbar pries the boards off the purple room door (hold E)
{
  const d = await run(() => nn.world.doors.get('d-purple').worldCenter(new V()).toArray());
  const before = await run(() => nn.world.doors.get('d-purple').boards);
  const label = await run(([d]) => aim([d[0] + 1.0, 8.2, d[2]], d), [d]);
  check('pry prompt', /Pry/.test(label ?? ''), label);
  for (let i = 0; i < before; i++) await run(([d]) => { aim([d[0] + 1.0, 8.2, d[2]], d); press('KeyE', 1.05); }, [d]);
  check('all boards off', await run(() => nn.world.doors.get('d-purple').boards === 0), `before=${before}`);
}

// 10. carry a big cardboard box and stack it
{
  const r = await run(() => {
    const e = nn.physics.dynamics.find((d) => d.data?.climbable && d.mesh.position.y < 1);
    const m = e.mesh.position;
    const label = aim([m.x + 1.2, Math.max(0.05, m.y - 0.3), m.z], [m.x, m.y + 0.2, m.z]);
    return { label };
  });
  check('carry prompt', /Pick up/.test(r.label ?? ''), r.label);
  await run(() => press('KeyE'));
  check('carrying', await run(() => !!nn.interaction.carry && nn.player.carrying));
  await run(() => { nn.simulate(0.5); press('KeyE'); nn.simulate(1); });
  check('dropped', await run(() => !nn.interaction.carry && !nn.player.carrying));
}

// 11. magnet gun pulls the green key off its hook
{
  await run(() => {
    const e = nn.devices.magnet;
    nn.interaction.inv.addProp(e);
    const k = nn.devices.keyGreen.obj.getWorldPosition(new V());
    aim([k.x + 2.4, 8.2, k.z + 0.3], k.toArray());
    nn.input._press('Mouse0');
    nn.simulate(2.5);
    nn.input._release('Mouse0');
    nn.simulate(0.1);
  });
  check('green key pulled in', await run(() => nn.interaction.inv.keys.has('green')));
}

check('no page errors', errors.length === 0, errors.slice(0, 3).join(' / '));
console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
await browser.close();
process.exit(fails ? 1 : 0);
