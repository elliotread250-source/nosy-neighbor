// Phones and tablets under Playwright device emulation (Chromium with each
// device's viewport, pixel ratio, user agent and touch). Screenshots of the
// title, the HUD with touch controls, the pause menu and the options; real
// multi-touch through CDP to check the joystick, look drag, each button, and
// moving plus looking at once; layout checks for overflow and safe areas.
// Emulation is not a real device: GPU, thermals and Safari quirks differ.
//   node scripts/act3mobile.mjs [base]
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
const base = process.argv[2] || 'http://localhost:5173/act3/';
const out = 'screenshots/act3/mobile';
mkdirSync(out, { recursive: true });
const ONLY = process.env.ONLY;
const DEVICES = [
  ['iphone13-portrait', devices['iPhone 13']],
  ['iphone13-landscape', devices['iPhone 13 landscape']],
  ['pixel7-landscape', devices['Pixel 7 landscape']],
  ['ipad-landscape', devices['iPad (gen 7) landscape'] ?? devices['iPad Pro 11 landscape']],
];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failures = 0;
const check = (name, ok, detail = '') => { if (!ok) failures++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `  ${detail}` : ''}`); };

for (const [name, d] of DEVICES.filter(([n]) => !ONLY || n.includes(ONLY))) {
  const { defaultBrowserType, ...desc } = d;
  void defaultBrowserType;
  const ctx = await browser.newContext({ ...desc });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/GPU stall|WebGL|ReadPixels/.test(m.text())) errors.push(m.text()); });
  console.log(`\n${name} (${desc.viewport.width}x${desc.viewport.height} @${desc.deviceScaleFactor}x)`);
  await page.goto(base + '?reset=1');
  await page.waitForFunction(() => window.__a3Ready || window.__a3Error, null, { timeout: 120000 });
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y, id]) => ({ x, y, id, radiusX: 8, radiusY: 8, force: 1 })) });
  const W = desc.viewport.width, H = desc.viewport.height;
  const st = await page.evaluate(() => ({ device: window.a3.input.device, quality: window.a3.quality, dpr: window.a3.engine.renderer.getPixelRatio(), low: window.a3.dev.lowEnd }));
  check('detected as touch, quality default', st.device === 'touch', `quality ${st.quality}, pixel ratio ${st.dpr.toFixed(2)}, low-end ${st.low}`);
  await page.screenshot({ path: `${out}/${name}-title.png` });

  if (H > W) {
    const p = await page.evaluate(() => ({ rotate: document.getElementById('a3-rotate').classList.contains('show'), suspended: window.a3.suspended }));
    check('portrait shows the rotate overlay and pauses', p.rotate && p.suspended);
    // rotate to landscape without a reload: state survives
    await page.evaluate(() => { window.__marker = 42; });
    await page.setViewportSize({ width: H, height: W });
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({ rotate: document.getElementById('a3-rotate').classList.contains('show'), marker: window.__marker, w: window.a3.engine.renderer.domElement.width, iw: innerWidth }));
    check('rotating to landscape resumes, no reload, renderer resized', !r.rotate && r.marker === 42, `canvas ${r.w}px for ${r.iw} css px`);
    await page.screenshot({ path: `${out}/${name}-rotated.png` });
    await ctx.close();
    continue;
  }

  // tap to start
  await page.touchscreen.tap(W / 2, H / 2);
  await page.waitForTimeout(500);
  const started = await page.evaluate(() => ({ playing: window.a3.playing, touch: document.getElementById('touch').classList.contains('on'), audio: window.a3.audio.ctx?.state }));
  check('tap to start: controls shown, audio context created', started.playing && started.touch, `audio ${started.audio}`);
  // put the player somewhere open: the yard, facing the house
  await page.evaluate(() => { window.a3.teleport(2.05, 0, -5, 180); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}-hud.png` });

  // layout: no scroll, nothing outside the viewport, targets at least 48 px
  const lay = await page.evaluate(() => {
    const r = [];
    for (const el of document.querySelectorAll('#touch .tc-btn, #touch .tc-pause')) {
      const b = el.getBoundingClientRect();
      r.push({ id: el.className, x0: b.left, y0: b.top, x1: b.right, y1: b.bottom, w: b.width, h: b.height });
    }
    return { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight, r };
  });
  check('no horizontal or vertical scroll', lay.sw <= lay.iw && lay.sh <= lay.ih, `${lay.sw}x${lay.sh} in ${lay.iw}x${lay.ih}`);
  const inside = lay.r.every((b) => b.x0 >= 0 && b.y0 >= 0 && b.x1 <= lay.iw && b.y1 <= lay.ih);
  check('every control inside the viewport', inside);
  check('every touch target at least 48 px', lay.r.every((b) => b.w >= 48 && b.h >= 48), lay.r.map((b) => `${Math.round(b.w)}`).join(' '));

  // joystick: push forward for a second
  const p0 = await page.evaluate(() => ({ ...window.a3.player.curFeet }));
  await touch('touchStart', [[W * 0.22, H * 0.68, 1]]);
  for (let i = 1; i <= 6; i++) { await touch('touchMove', [[W * 0.22, H * 0.68 - i * 9, 1]]); await page.waitForTimeout(30); }
  await page.waitForTimeout(1000);
  const mv = await page.evaluate(() => ({ axis: window.a3.input.moveAxis(), sprint: window.a3.input.held.has('ShiftLeft') }));
  await touch('touchEnd', []);
  await page.waitForTimeout(200);
  const p1 = await page.evaluate(() => ({ ...window.a3.player.curFeet }));
  const moved = Math.hypot(p1.x - p0.x, p1.z - p0.z);
  check('joystick moves the player', moved > 0.3, `${moved.toFixed(2)} m, axis ${mv.axis.map((v) => v.toFixed(2))}, sprint ${mv.sprint}`);

  // look: drag on the right half
  const y0 = await page.evaluate(() => window.a3.player.yaw);
  await touch('touchStart', [[W * 0.62, H * 0.35, 2]]);
  for (let i = 1; i <= 8; i++) { await touch('touchMove', [[W * 0.62 + i * 15, H * 0.35, 2]]); await page.waitForTimeout(20); }
  await touch('touchEnd', []);
  await page.waitForTimeout(200);
  const y1 = await page.evaluate(() => window.a3.player.yaw);
  check('dragging the right half looks around', Math.abs(y1 - y0) > 0.1, `yaw ${((y1 - y0) * 57.3).toFixed(1)} deg`);

  // both at once: one thumb on the stick, one dragging
  const q0 = await page.evaluate(() => ({ ...window.a3.player.curFeet, yaw: window.a3.player.yaw }));
  await touch('touchStart', [[W * 0.22, H * 0.68, 3]]);
  await touch('touchStart', [[W * 0.22, H * 0.68, 3], [W * 0.6, H * 0.4, 4]]);
  for (let i = 1; i <= 8; i++) { await touch('touchMove', [[W * 0.22, H * 0.68 - Math.min(i, 5) * 10, 3], [W * 0.6 - i * 12, H * 0.4, 4]]); await page.waitForTimeout(60); }
  await page.waitForTimeout(500);
  await touch('touchEnd', []);
  await page.waitForTimeout(200);
  const q1 = await page.evaluate(() => ({ ...window.a3.player.curFeet, yaw: window.a3.player.yaw }));
  check('moving and looking at the same time', Math.hypot(q1.x - q0.x, q1.z - q0.z) > 0.2 && Math.abs(q1.yaw - q0.yaw) > 0.1, `moved ${Math.hypot(q1.x - q0.x, q1.z - q0.z).toFixed(2)} m, turned ${((q1.yaw - q0.yaw) * 57.3).toFixed(1)} deg`);

  // buttons
  const center = async (sel) => page.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  const press = async (sel, ms = 250) => { const [x, y] = await center(sel); await touch('touchStart', [[x, y, 9]]); await page.waitForTimeout(ms); await touch('touchEnd', []); await page.waitForTimeout(150); };
  // jump: watch the feet rise
  await page.evaluate(() => window.a3.teleport(2.05, 0, -6, 180));
  await page.waitForTimeout(500);
  const jumpP = page.evaluate(async () => { const a = window.a3; const y0 = a.player.curFeet.y; let top = y0; const t0 = performance.now(); while (performance.now() - t0 < 3000) { top = Math.max(top, a.player.curFeet.y); await new Promise((r) => requestAnimationFrame(r)); } return top - y0; });
  await press('#touch .tc-jump');
  const rise = await jumpP;
  check('Jump jumps', rise > 0.2, `rose ${rise.toFixed(2)} m`);
  await press('#touch .tc-crouch');
  await page.waitForTimeout(300);
  const cr = await page.evaluate(() => window.a3.player.crouching);
  await press('#touch .tc-crouch');
  await page.waitForTimeout(300);
  const cr2 = await page.evaluate(() => window.a3.player.crouching);
  check('Crouch toggles on and off', cr && !cr2);
  // Use: stand in the kitchen at the crowbar and hold Use
  await page.evaluate(() => { const a = window.a3; a.teleport(9.0, 0, 9.0, 180); a.player.pitch = -0.9; });
  await page.waitForTimeout(500);
  await press('#touch .tc-use', 250);
  const got = await page.evaluate(() => [...window.a3.interact.items]);
  check('Use picks up the crowbar', got.includes('crowbar'), JSON.stringify(got));
  // hold-to-interact: pry a bolt with the Use button held 1.6 s
  await page.evaluate(() => { const a = window.a3; a.teleport(2.75, 0, 8.975, 90); a.player.pitch = -0.05; });
  await page.waitForTimeout(400);
  // keep aiming at the bolt every frame, as a player would while holding
  await page.evaluate(() => { const a = window.a3; window.__aim = true; const step = () => { if (!window.__aim) return; const t = a.interact.targets.find((x) => x.id === 'basement_bolt_3'); const p = t.pos(); const c = a.engine.camera.position; a.player.yaw = Math.atan2(-(p.x - c.x), -(p.z - c.z)); a.player.pitch = Math.atan2(p.y - c.y, Math.hypot(p.x - c.x, p.z - c.z)); requestAnimationFrame(step); }; step(); });
  await page.waitForTimeout(600);
  const tgt = await page.evaluate(() => ({ t: window.a3.interact.target?.id, m: window.a3.interact.target ? window.a3.interact._missing(window.a3.interact.target) : 'none', items: [...window.a3.interact.items], cam: window.a3.engine.camera.position.toArray().map((v) => +v.toFixed(2)), feet: window.a3.player.curFeet.toArray().map((v) => +v.toFixed(2)), nc: window.a3.player.noclip, cr: window.a3.player.crouching, rot: window.a3.engine.camera.rotation.toArray().slice(0, 3).map((v) => +(+v).toFixed(2)), susp: window.a3.suspended, ruler: window.a3.tools.mode, carried: window.a3.interact.carried, held: !!window.a3.interact.held }));
  {
    // hold Use until the bolt gives (game time runs slow under software GL)
    const [x, y] = await center('#touch .tc-use');
    await touch('touchStart', [[x, y, 9]]);
    await page.waitForFunction(() => window.a3.interact.flags.basement_bolt_3, null, { timeout: 8000 }).catch(() => {});
    await touch('touchEnd', []);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => { window.__aim = false; });
  const bolts = await page.evaluate(() => Object.keys(window.a3.interact.flags).filter((k) => k.startsWith('basement_bolt')));
  check('holding Use pries a bolt (1.5 s, progress ring)', bolts.length >= 1, JSON.stringify(bolts) + ' ' + JSON.stringify(tgt));
  // Throw: pick up a box, hold Throw, release
  await page.evaluate(() => { const a = window.a3; const e = a.props.dynamics.find((d) => d.feature === 'living_box_2'); a.interact._pickProp(e); });
  await press('#touch .tc-throw', 700);
  const thrown = await page.evaluate(() => ({ held: !!window.a3.interact.held, flying: window.a3.interact.thrown.length }));
  check('Throw charges and throws', !thrown.held && thrown.flying > 0);
  // Drop: carry a mannequin, tap Drop
  await page.evaluate(() => { const a = window.a3; const r = a.interact.mannequins.get('mannequin_basement'); a.interact._carry(r); });
  await press('#touch .tc-drop');
  const dropped = await page.evaluate(() => !window.a3.interact.carried);
  check('Drop sets the mannequin down', dropped);

  // performance in emulation (software GL, so slower than a real phone GPU)
  await page.evaluate(() => { const a = window.a3; a.teleport(2.05, 0, -5, 180); });
  const perf = await page.evaluate(async () => { const a = window.a3; const dts = []; for (let i = 0; i < 90; i++) { await new Promise((r) => requestAnimationFrame(r)); dts.push(a.dt); } dts.sort((x, y) => x - y); const r = a.engine.renderer.info.render; return { med: dts[45] * 1000, calls: r.calls, tris: r.triangles, quality: a.quality }; });
  console.log(`  perf: frame ${perf.med.toFixed(1)} ms median, ${perf.calls} draw calls, ${perf.tris} triangles, quality ${perf.quality} (emulated, software GL)`);

  // pause button, menu, options
  await press('#touch .tc-pause');
  await page.waitForTimeout(300);
  const menu = await page.evaluate(() => ({ open: !document.getElementById('a3-menu').classList.contains('hidden'), suspended: window.a3.suspended, rows: [...document.querySelectorAll('#a3-menu button, #a3-menu label')].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect().height) }));
  check('Pause opens the menu and pauses', menu.open && menu.suspended);
  check('menu rows are finger-sized (>= 44 px)', menu.rows.every((h) => h >= 44), `min ${Math.min(...menu.rows).toFixed(0)} px`);
  await page.screenshot({ path: `${out}/${name}-pause.png` });
  await page.evaluate(() => document.querySelector('#a3-menu h3.touch-only').scrollIntoView());
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/${name}-options.png` });
  // left-handed mirror and bigger buttons
  await page.evaluate(() => { window.a3.touch.set('leftHanded', true); window.a3.touch.set('size', 1.3); });
  const [mx] = await page.evaluate(() => { const b = document.querySelector('#touch .tc-use').getBoundingClientRect(); return [b.left]; });
  check('left-handed mode mirrors the buttons', mx < W / 2);
  await page.evaluate(() => { window.a3.touch.set('leftHanded', false); window.a3.touch.set('size', 1); });
  // the audit panel by finger, with a close button
  await page.evaluate(() => document.querySelector('#a3-menu [data-t=audit]').click());
  await page.waitForTimeout(300);
  const audit = await page.evaluate(() => ({ open: document.querySelector('.a3-auditui').classList.contains('show'), close: !!document.querySelector('.a3-auditui [data-x=close]') }));
  check('audit opens from the menu and has a close button', audit.open && audit.close);
  await page.screenshot({ path: `${out}/${name}-audit.png` });
  await page.evaluate(() => document.querySelector('.a3-auditui [data-x=close]').click());
  // resume
  await page.evaluate(() => document.querySelector('#a3-menu [data-a=resume]').click());
  await page.waitForTimeout(300);
  const res = await page.evaluate(() => ({ suspended: window.a3.suspended, touch: document.getElementById('touch').classList.contains('on') }));
  check('Resume goes back to play', !res.suspended && res.touch);
  // hidden tab pauses and saves
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  const hid = await page.evaluate(() => ({ suspended: window.a3.suspended, saved: !!localStorage.getItem('act3-house-study-save-v1') }));
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  const back = await page.evaluate(() => window.a3.suspended);
  check('hidden tab pauses and saves, coming back resumes', hid.suspended && hid.saved && !back);
  check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}
await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall mobile checks passed');
process.exit(failures ? 1 : 0);
