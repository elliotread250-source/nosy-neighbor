// Drive the player through the route with simulated keys and report where
// they end up. Each leg: teleport (feet), face a yaw, hold keys, optional jumps.
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://localhost:5173/';
const only = process.argv[3];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(base + '?reset=1');
await page.waitForFunction(() => window.__a3Ready, null, { timeout: 90000 });
await page.evaluate(() => {
  document.getElementById('a3-start').classList.add('hidden');
  const a = window.a3;
  window.leg = ({ at, yaw = 0, keys = [], ms = 1000, jumps = [], pitch = 0 }) => {
    if (at) { a.teleport(at[0], at[1], at[2], yaw); a.simulate(0.3); }
    a.player.yaw = (yaw * Math.PI) / 180;
    a.player.pitch = (pitch * Math.PI) / 180;
    a.simulate(ms / 1000, { keys, jumps: jumps.map((j) => j / 1000) });
    return a.simulate(0.4);
  };
});
const legs = {
  // outside: onto the crate, then hop through the broken window
  window: [{ at: [2.05, 0, -1.6], yaw: 180, keys: ['KeyW'], ms: 2200, jumps: [250, 900, 1500] }],
  // up the main stair from the side strip at the bottom
  stair: [{ at: [6.3, 0, 10.5], yaw: 90, keys: ['KeyW'], ms: 600 }, { yaw: 0, keys: ['KeyW'], ms: 5000 }],
  // F1: floor -> rail -> lamp -> over the gate
  gate: [
    { at: [6.0, 3.7, 4.6], yaw: -90, keys: ['KeyW'], ms: 450, jumps: [40] },
    { at: [6.66, 4.26, 4.3], yaw: 13, keys: ['KeyW'], ms: 700, jumps: [300] },
    { yaw: -90, keys: ['KeyW'], ms: 900, jumps: [30] },
  ],
  // gallery ladder up to F2
  ladder: [{ at: [8.4, 3.7, 5.0], yaw: 0, keys: ['KeyW'], ms: 3500 }, { yaw: 0, keys: ['KeyW'], ms: 700 }],
  // crawl through the partition hole from the ladder room
  crawl: [{ at: [5.6, 7.4, 4.9], yaw: 180, keys: ['KeyC', 'KeyW'], ms: 2200, jumps: [] }],
  // out of the control room onto the back terrace, round to the box ladder, up to the perch
  boxladder: [{ at: [11.3, 7.4, 5.4], yaw: 90, keys: ['KeyW'], ms: 4200 }, { yaw: 90, keys: ['KeyW'], ms: 900 }],
  // windmill ladder from the ridge
  windmill: [{ at: [8.0, 11.45, 5.5], yaw: 90, keys: ['KeyW'], ms: 4800 }, { yaw: 90, keys: ['KeyW'], ms: 600 }],
  // basement stair: down from the landing
  basement: [{ at: [0.7, 0, 10.5], yaw: 0, keys: ['KeyW'], ms: 3800 }],
};
for (const [name, steps] of Object.entries(legs)) {
  if (only && name !== only) continue;
  const out = [];
  for (const s of steps) out.push(await page.evaluate((s) => window.leg(s), s));
  console.log(name.padEnd(10), JSON.stringify(out));
}
if (errors.length) console.log('errors', errors);
await browser.close();
