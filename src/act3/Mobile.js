// Phones and tablets: device detection, quality presets and the adaptive
// governor, the 30 fps cap, fullscreen, screen wake lock, orientation and
// the page lifecycle (pause and save when hidden, resume cleanly).
// Desktop keeps the existing defaults: nothing here changes unless the
// device looks like a phone or tablet, or the player picks it.
import { setTextureCap } from '../art/CanvasTextures.js';

export function deviceInfo() {
  const coarse = matchMedia?.('(pointer: coarse)').matches ?? false;
  const touch = coarse || (navigator.maxTouchPoints ?? 0) > 1;
  const short = Math.min(screen.width || innerWidth, screen.height || innerHeight);
  const phone = touch && short < 600;
  const tablet = touch && !phone;
  let gpu = '';
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER) ?? '';
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch { gpu = ''; }
  const mobileGpu = /adreno|mali|powervr|apple gpu|sgx|tegra|videocore|immortalis/i.test(gpu);
  const mem = navigator.deviceMemory ?? 8, cores = navigator.hardwareConcurrency ?? 8;
  const lowEnd = phone || mem <= 4 || cores <= 4 || (touch && mobileGpu && short < 800);
  return { touch, phone, tablet, coarse, gpu, mobileGpu, mem, cores, lowEnd, maxDpr: phone ? 1.5 : tablet ? 2 : Infinity };
}

// What each quality level changes. Desktop Medium is the existing look.
export const QUALITY = {
  low: { shadows: false, shadowMap: 512, lights: 3, post: false, far: 70, texCap: 256, dprCap: 1 },
  medium: { shadows: true, shadowMap: 1024, lights: 8, post: true, far: 400, texCap: 512, dprCap: 1.5 },
  high: { shadows: true, shadowMap: 2048, lights: 8, post: true, far: 400, texCap: 1024, dprCap: 2 },
};
export const LEVELS = ['low', 'medium', 'high'];

export function toast(text, ms = 2200) {
  let el = document.querySelector('.a3-toast');
  if (!el) { el = document.createElement('div'); el.className = 'a3-toast'; document.body.appendChild(el); }
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

// Steps quality down when the frame rate stays under 45 fps for 3 seconds,
// and back up slowly (after 20 s of headroom) while there is room.
export class Governor {
  constructor(app, { enabled = true } = {}) {
    this.app = app;
    this.enabled = enabled;
    this.low = 0; this.high = 0; this.ema = 60; this.cool = 0;
  }

  frame(dt) {
    if (!this.enabled || dt <= 0 || this.app.suspended) return;
    const fps = 1 / dt;
    this.ema += (fps - this.ema) * Math.min(1, dt * 2);
    this.cool = Math.max(0, this.cool - dt);
    const cap = this.app.fpsCap ? 30 : 60;
    if (this.ema < Math.min(45, cap - 3)) { this.low += dt; this.high = 0; } else if (this.ema > cap * 0.95) { this.high += dt; this.low = 0; } else { this.low = 0; this.high = 0; }
    const i = LEVELS.indexOf(this.app.quality);
    if (this.low > 3 && this.cool <= 0 && i > 0) { this.app.setQuality(LEVELS[i - 1], { auto: true }); this.reset(); toast(`Quality lowered to ${LEVELS[i - 1]} (${this.ema.toFixed(0)} fps)`); }
    else if (this.high > 20 && this.cool <= 0 && i < LEVELS.indexOf(this.app.qualityCeiling ?? 'high')) { this.app.setQuality(LEVELS[i + 1], { auto: true }); this.reset(); toast(`Quality raised to ${LEVELS[i + 1]}`); }
  }

  reset() { this.low = 0; this.high = 0; this.cool = 6; }
}

export function applyTextureCap(q) { setTextureCap(QUALITY[q]?.texCap); }

// ------------------------------------------------------------ the page lifecycle
export class Lifecycle {
  constructor(app) {
    this.app = app;
    this.wake = null;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.hidden();
      else this.visible();
    });
    // the browser may kill a hidden tab: save on the way out
    window.addEventListener('pagehide', () => this.app.saveNow?.());
    window.addEventListener('beforeunload', () => this.app.saveNow?.());
    const resize = () => { this.app.engine.resize(); this.app.checkOrientation?.(); };
    window.addEventListener('orientationchange', () => setTimeout(resize, 150));
    screen.orientation?.addEventListener?.('change', () => setTimeout(resize, 150));
    window.visualViewport?.addEventListener('resize', resize);
  }

  hidden() {
    this.app.saveNow?.();
    this.app.suspend?.('hidden');
    this.app.audio?.suspend?.();
  }

  visible() {
    this.app.resume?.('hidden');
    this.app.audio?.unlock?.();
    if (this.app.playing) this.requestWake();
  }

  async requestWake() {
    try {
      if (!('wakeLock' in navigator) || this.wake) return;
      this.wake = await navigator.wakeLock.request('screen');
      this.wake.addEventListener?.('release', () => { this.wake = null; });
    } catch { this.wake = null; }
  }

  async fullscreen() {
    const el = document.documentElement;
    try {
      if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch { /* not allowed here (iPhone Safari): carry on windowed */ }
    try { await screen.orientation?.lock?.('landscape'); } catch { /* lock not supported: the rotate overlay covers it */ }
  }
}
