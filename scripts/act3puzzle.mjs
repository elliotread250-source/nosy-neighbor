// End-to-end puzzle check: drives the interaction handlers in order and
// checks flags, colliders and the save. Run with a dev server up.
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://localhost:5173/act3/';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(base + '?reset=1');
await page.waitForFunction(() => window.__a3Ready, null, { timeout: 90000 });
const r = await page.evaluate(async () => {
  const a = window.a3, I = a.interact;
  const T = (id) => I.targets.find((t) => t.id === id);
  const out = {};
  const alarms = [];
  const { Events } = await import('/src/core/Events.js');
  Events.on('alarm', (e) => alarms.push(e.source));
  out.boltBlocked = I._missing(T('basement_bolt_1'));
  T('crowbar').act();
  out.boltOk = I._missing(T('basement_bolt_1'));
  out.cardBlocked = I._missing(T('basement_keycard_lock'));
  for (let i = 1; i <= 6; i++) T(`basement_bolt_${i}`).act();
  out.boardsLeft = a.openings.byId.get('basement_door').boards.filter((b) => b.collider).length;
  out.cardNeeds = I._missing(T('basement_keycard_lock'));
  T('keycard').act();
  T('basement_keycard_lock').act();
  out.unlocked = !!I.flags.basement_unlocked && !a.openings.byId.get('basement_door').leafCollider;
  // wrong order first, then right
  T('train_lever').act();
  out.afterWrong = !!I.flags.train_started;
  T('train_button').act(); T('train_lever').act();
  out.trainStarted = !!I.flags.train_started && a.train.running;
  const s0 = a.train.s;
  a.simulate(5);
  out.trainMoved = +(((a.train.s - s0 + a.train.L) % a.train.L)).toFixed(2);
  // mannequins onto the pads
  for (const [id, rec] of I.mannequins) { if (rec.sheet) rec.sheet.visible = false; I._carry(rec); I._placeOnPad(I.pads.find((p) => !p.taken)); }
  out.birthday = !!I.flags.birthday_complete;
  // the save round-trips
  const snap = JSON.parse(localStorage.getItem('act3-house-study-save-v1'));
  out.saved = snap && snap.flags.birthday_complete && Object.values(snap.mannequins).every((w) => w.startsWith('pad:'));
  // a laser: stand in the hall grid
  a.teleport(5.5, 3.7, 5.0, 0); a.simulate(0.2);
  a.security.update(0.1, a.player, []);
  out.alarms = alarms;
  return out;
});
console.log(JSON.stringify(r, null, 1));
// reload: the state comes back
await page.goto(base);
await page.waitForFunction(() => window.__a3Ready, null, { timeout: 90000 });
console.log('restored', await page.evaluate(() => ({ unlocked: !!window.a3.interact.flags.basement_unlocked, items: [...window.a3.interact.items], birthday: !!window.a3.interact.flags.birthday_complete })));
if (errors.length) console.log('errors', errors);
await browser.close();
