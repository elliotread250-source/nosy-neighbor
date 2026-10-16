// Ad-hoc probe: node scripts/probe.mjs "<query>" "<js to eval after ready>" out.png [wait ms]
import { chromium } from 'playwright';
const [q, js, out, wait] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'log') console.log(`[${m.type()}]`, m.text()); });
await page.goto(`http://localhost:5173/classic.html?${q}`);
await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 120000 });
if (js) { const r = await page.evaluate(js); if (r !== undefined) console.log('eval:', JSON.stringify(r)); }
await page.waitForTimeout(+(wait || 1500));
if (out) await page.screenshot({ path: `screenshots/${out}` });
await browser.close();
