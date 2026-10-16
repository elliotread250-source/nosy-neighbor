// Loads the game with debug off and reports any page errors.
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://localhost:5173/';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(base);
await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 240000 });
const title = await page.textContent('.title-logo');
await page.screenshot({ path: 'screenshots/smoke.png' });
console.log(`title: ${title}  nn exposed: ${await page.evaluate(() => !!window.nn)}  errors: ${errors.length}`);
for (const e of errors.slice(0, 5)) console.log('  ', e);
await browser.close();
process.exit(errors.length ? 1 : 0);
