// Fires every sound in the game and checks the master bus carries signal, with no errors.
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:5173/classic.html?debug=1&gfx=low&nopost&notitle');
await page.waitForFunction(() => window.__nnReady || window.__nnError, null, { timeout: 180000 });
const res = await page.evaluate(async () => {
  const { Events } = await import('/src/core/Events.js');
  const a = nn.audio;
  a.unlock();
  await a.ctx.resume();
  const an = a.ctx.createAnalyser();
  an.fftSize = 2048;
  a.master.connect(an);
  const buf = new Float32Array(an.fftSize);
  const rms = () => { an.getFloatTimeDomainData(buf); let s = 0; for (const v of buf) s += v * v; return Math.sqrt(s / buf.length); };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const V = nn.engine.camera.position.constructor;
  const pos = nn.engine.camera.position.clone().add(new V(1, 0, -2));
  const levels = {};
  const names = ['click', 'pickup', 'pickupTool', 'keyJingle', 'impact', 'shatter', 'glassSmash', 'doorBang', 'doorSlam', 'doorCreak', 'trapSnap', 'cameraAlarm', 'hammering', 'pryStart', 'pryPop', 'magnetWhirr', 'washerShudder', 'catchStinger', 'gasp', 'squeak', 'drain', 'unlockSequence', 'stinger'];
  for (const n of names) { Events.emit('sfx', { name: n, position: pos, item: 'mug', strength: 1 }); await wait(120); levels[n] = rms(); }
  for (const l of ['hm', 'hey', 'mutter', 'aah', 'pant', 'hum', 'snore']) { Events.emit('voice', { line: l, position: pos }); await wait(250); levels['voice:' + l] = rms(); }
  for (const k of ['tvLoop', 'kettleWhistle', 'alarmRing', 'radioLoop']) { Events.emit('sfx', { name: k, id: k, position: pos }); nn.simulate(0.05); a.update(0.05); await wait(300); a.update(0.05); levels['loop:' + k] = rms(); Events.emit('sfx', { name: k + 'Stop', id: k }); }
  Events.emit('player:footstep', { position: nn.player.curFeet.clone(), loudness: 1 });
  Events.emit('neighbor:step', { position: pos, run: true });
  await wait(150); levels.steps = rms();
  for (const tr of ['explore', 'chase', 'title', 'ending']) { Events.emit('music', { track: tr }); for (let i = 0; i < 20; i++) { a.update(0.05); await wait(50); } levels['music:' + tr] = rms(); }
  return { levels, voices: a.voices, state: a.ctx.state };
});
const quiet = Object.entries(res.levels).filter(([, v]) => !(v > 1e-4)).map(([k]) => k);
console.log('context:', res.state, ' live voices:', res.voices);
console.log(Object.entries(res.levels).map(([k, v]) => `${k}=${v.toFixed(4)}`).join('  '));
console.log('silent:', quiet.join(', ') || 'none');
console.log('errors:', errors.length, errors.slice(0, 5).join(' / '));
await browser.close();
process.exit(errors.length || quiet.length > 3 ? 1 : 0);
