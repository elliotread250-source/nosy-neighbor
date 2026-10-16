// Capture fixed-camera screenshots of the running dev server for visual review.
// Usage: node scripts/screenshots.mjs [baseUrl] [shot1,shot2,...] [extraQuery]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:5173/classic.html';
const shots = (process.argv[3] || 'porch,street,playerFront,aerial,bedroom,living,flanking,eastEnd').split(',');
const extra = process.argv[4] || '';
const outDir = 'screenshots';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${m.type()}]`, m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

for (const name of shots) {
  const url = `${base}?shot=${name}${extra ? `&${extra}` : ''}`;
  await page.goto(url, { waitUntil: 'load' });
  try {
    await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 90000 });
  } catch {
    console.log(`timeout waiting for ${name}`);
  }
  const err = await page.evaluate(() => window.__nnError);
  if (err) console.log(`error in ${name}:`, err);
  await page.screenshot({ path: `${outDir}/${name}.png` });
  console.log(`saved ${outDir}/${name}.png`);
}
await browser.close();
