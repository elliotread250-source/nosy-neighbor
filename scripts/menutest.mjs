// Title -> options tabs -> play -> pause; then save, reload, Continue restores progress.
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
let fails = 0;
const check = (n, ok, x = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  ' + x : ''}`); if (!ok) fails++; };
const ready = () => page.waitForFunction(() => window.__nnReady, null, { timeout: 240000 });
const frames = async (n = 4) => { const f0 = await page.evaluate(() => nn.frame); await page.waitForFunction((f) => nn.frame > f, f0 + n, { timeout: 60000 }); };
await page.goto('http://localhost:5173/classic.html?debug=1');
await ready();
await page.evaluate(() => localStorage.clear());
check('title state', await page.evaluate(() => nn.state === 'title'));
await page.click('.title-screen button[data-act=options]');
for (const tab of ['Graphics', 'Audio', 'Controls', 'Gameplay', 'Accessibility']) {
  await page.click(`.tab[data-tab=${tab}]`);
  await frames(2);
  await page.screenshot({ path: `screenshots/menu-options-${tab}.png` });
}
// flip subtitles and difficulty, check they persist
await page.click('.tab[data-tab=Gameplay]');
await page.click('.opt:has-text("Difficulty") .choices button:has-text("hard")');
check('difficulty applied', await page.evaluate(() => nn.ai.diff === nn.constructor && false || nn.ai.diff.runSpeed === 6.0));
check('settings saved', await page.evaluate(() => JSON.parse(localStorage.getItem('nosy-neighbor-settings-v1')).difficulty === 'hard'));
await page.click('.options-screen button[data-act=back]');
await page.click('.title-screen button[data-act=play]');
await frames(3);
check('play starts intro', await page.evaluate(() => nn.state === 'play' && nn.story.mode === 'intro'));
await page.evaluate(() => { nn.story._endIntro(); nn.simulate(2.5); nn.ai.frozen = true; document.exitPointerLock(); nn.pause(); });
await frames(3);
await page.screenshot({ path: 'screenshots/menu-pause.png' });
check('pause menu', await page.evaluate(() => nn.paused && document.querySelector('.pause-screen.show') !== null));
await page.click('.pause-screen button[data-act=resume]');
check('resume', await page.evaluate(() => !nn.paused));
// progress, autosave, reload, continue
await page.evaluate(() => { nn.devices.collectKey(nn.devices.keyRed); nn.giveAll(); nn.interaction.inv.keys.delete('basement'); nn.saveGame.save(); });
check('autosave written', await page.evaluate(() => !!localStorage.getItem('nosy-neighbor-save-v1')));
await page.goto('http://localhost:5173/classic.html?debug=1');
await ready();
check('continue offered', await page.isVisible('.title-screen button[data-act=continue]'));
await page.click('.title-screen button[data-act=continue]');
await frames(3);
const st = await page.evaluate(() => ({ keys: [...nn.interaction.inv.keys].sort().join(','), tools: nn.interaction.inv.slots.map((s) => s?.kind).join(','), red: !nn.devices.keyRed.obj.parent, diff: nn.ai.diff.runSpeed, mode: nn.story.mode }));
check('continue restores keys and tools', st.keys.includes('red') && st.tools.includes('crowbar') && st.red && !st.mode, JSON.stringify(st));
check('settings survive reload', st.diff === 6.0);
check('no errors', errors.length === 0, errors.slice(0, 3).join(' / '));
console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
await browser.close();
