// On-screen touch controls for phones and tablets. They only feed the shared
// Input (a move vector, look deltas, and the same key codes the keyboard
// uses), so every system downstream works unchanged, and keyboard, mouse and
// gamepad keep working the moment the player switches back.
//
//   left half:  a floating joystick wherever the thumb lands; full forward sprints
//   right half: drag to look (sensitivity, invert Y, optional gyro)
//   buttons:    jump, crouch (toggle), use (hold for timed actions), throw
//               (hold to charge, release to throw), drop, pause, slots
// Multi-touch is tracked by pointer id, so moving and looking work together.
import { CONFIG } from '../config.js';
import { Events } from '../core/Events.js';

const KEY = 'act3-touch-v1';
export const TOUCH_DEFAULTS = { sens: 1.0, invertY: false, leftHanded: false, size: 1.0, gyro: false, haptics: true };

export function loadTouchSettings() {
  try { return { ...TOUCH_DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...TOUCH_DEFAULTS }; }
}
export function saveTouchSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ }
}

// likely touch-first device: a coarse primary pointer or touch points
export function isTouchDevice() {
  return (matchMedia?.('(pointer: coarse)').matches ?? false) || (navigator.maxTouchPoints ?? 0) > 1;
}

const BUTTONS = [
  { id: 'jump', icon: '⤒', label: 'Jump', code: 'Space' },
  { id: 'crouch', icon: '⤓', label: 'Crouch', code: 'KeyC', toggle: true },
  { id: 'use', icon: '✋', label: 'Use', code: 'KeyE' },
  { id: 'throw', icon: '➶', label: 'Throw', charge: true },
  { id: 'drop', icon: '⇣', label: 'Drop', code: 'KeyG' },
];

export class TouchControls {
  constructor(app) {
    this.app = app;
    this.input = app.input;
    this.s = loadTouchSettings();
    this.pointers = new Map(); // pointerId -> { role, x0, y0, x, y }
    this.stick = null;
    this.crouched = false;
    this.root = document.createElement('div');
    this.root.id = 'touch';
    this.root.innerHTML = `
      <div class="tc-layer"></div>
      <div class="tc-stick"><div class="tc-knob"></div></div>
      <div class="tc-buttons">${BUTTONS.map((b) => `<button class="tc-btn tc-${b.id}" data-id="${b.id}" aria-label="${b.label}"><span>${b.icon}</span><small>${b.label}</small><i class="tc-ring"></i></button>`).join('')}</div>
      <button class="tc-pause" aria-label="Pause">❚❚</button>
      <button class="tc-mark" aria-label="Mark a ruler point">◎ Mark</button>
      <div class="tc-slots"></div>`;
    document.body.appendChild(this.root);
    this.layer = this.root.querySelector('.tc-layer');
    this.stickEl = this.root.querySelector('.tc-stick');
    this.knob = this.root.querySelector('.tc-knob');
    this._bind();
    this.apply();
    this.setVisible(false);
    this._haptics();
  }

  apply() {
    const s = this.s;
    this.root.classList.toggle('left-handed', !!s.leftHanded);
    this.root.style.setProperty('--tb', `${Math.round(64 * s.size)}px`);
    CONFIG.player.invertY = !!s.invertY;
    if (s.gyro) this.enableGyro(); else this.disableGyro();
  }

  set(k, v) { this.s[k] = v; saveTouchSettings(this.s); this.apply(); }

  setVisible(on) {
    this.visible = on;
    this.root.classList.toggle('on', on);
    document.body.classList.toggle('touch-mode', on);
    if (!on) this.releaseAll();
  }

  _idle() {
    this.root.classList.remove('idle');
    clearTimeout(this._idleT);
    this._idleT = setTimeout(() => this.root.classList.add('idle'), 2500);
  }

  _leftSide(x) {
    const half = innerWidth / 2;
    return this.s.leftHanded ? x > half : x < half;
  }

  _bind() {
    const L = this.layer;
    L.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      L.setPointerCapture?.(e.pointerId);
      this._idle();
      if (this._leftSide(e.clientX) && !this.stick) {
        this.stick = { id: e.pointerId, x0: e.clientX, y0: e.clientY };
        this.pointers.set(e.pointerId, { role: 'move' });
        this.stickEl.style.left = `${e.clientX}px`;
        this.stickEl.style.top = `${e.clientY}px`;
        this.stickEl.classList.add('on');
        this.knob.style.transform = 'translate(-50%, -50%)';
      } else this.pointers.set(e.pointerId, { role: 'look', x: e.clientX, y: e.clientY });
    });
    const move = (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      e.preventDefault();
      if (p.role === 'move') {
        const R = 56 * this.s.size;
        let dx = e.clientX - this.stick.x0, dy = e.clientY - this.stick.y0;
        const l = Math.hypot(dx, dy);
        if (l > R) { dx *= R / l; dy *= R / l; }
        this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        const mx = dx / R, my = -dy / R;
        this.input.touchMove[0] = Math.abs(mx) < 0.12 ? 0 : mx;
        this.input.touchMove[1] = Math.abs(my) < 0.12 ? 0 : my;
        // pushed all the way forward: sprint
        const sprint = my > 0.92 && Math.abs(mx) < 0.5;
        if (sprint !== this.sprinting) { this.sprinting = sprint; if (sprint) this.input.press('ShiftLeft'); else this.input.release('ShiftLeft'); }
      } else if (p.role === 'look') {
        // touch looks a little faster than the mouse per pixel; the slider scales it
        const k = 1.6 * this.s.sens;
        this.input.lookX += (e.clientX - p.x) * k;
        this.input.lookY += (e.clientY - p.y) * k;
        p.x = e.clientX; p.y = e.clientY;
      }
    };
    const up = (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      this.pointers.delete(e.pointerId);
      if (p.role === 'move') this._stickOff();
    };
    L.addEventListener('pointermove', move);
    L.addEventListener('pointerup', up);
    L.addEventListener('pointercancel', up);
    L.addEventListener('lostpointercapture', up);

    for (const el of this.root.querySelectorAll('.tc-btn')) {
      const b = BUTTONS.find((x) => x.id === el.dataset.id);
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.setPointerCapture?.(e.pointerId);
        el.classList.add('down');
        this._idle();
        this._buzz(8);
        if (b.toggle) {
          this.crouched = !this.crouched;
          el.classList.toggle('latched', this.crouched);
          // crouch is a toggle on touch: one tap down, one tap up
          if (this.crouched) this.input.press(b.code); else this.input.release(b.code);
          return;
        }
        if (b.charge) { this.chargeStart = performance.now(); el.style.setProperty('--p', '0%'); return; }
        // Drop only drops: with empty hands G would toggle the grid on a keyboard
        if (b.id === 'drop' && !this.app.interact?.carried && !this.app.interact?.held) { this.app.hint('Nothing in your hands'); el.classList.remove('down'); return; }
        this.input.press(b.code);
      });
      const end = (e) => {
        if (!el.classList.contains('down')) return;
        e.preventDefault();
        el.classList.remove('down');
        if (b.toggle) return;
        if (b.charge) {
          const t = (performance.now() - (this.chargeStart ?? performance.now())) / 1000;
          this.chargeStart = null;
          el.style.setProperty('--p', '0%');
          this.app.interact?.throwCharged?.(t);
          return;
        }
        this.input.release(b.code);
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('lostpointercapture', end);
    }
    this.root.querySelector('.tc-pause').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.app.openMenu?.(); });
    this.root.querySelector('.tc-mark').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this._buzz(10); this.app.tools?.clickRuler(); });
  }

  _stickOff() {
    this.stick = null;
    this.stickEl.classList.remove('on');
    this.input.touchMove[0] = this.input.touchMove[1] = 0;
    if (this.sprinting) { this.sprinting = false; this.input.release('ShiftLeft'); }
  }

  releaseAll() {
    this._stickOff();
    this.pointers.clear();
    for (const b of BUTTONS) if (b.code && !b.toggle) this.input.release(b.code);
    for (const el of this.root.querySelectorAll('.tc-btn.down')) el.classList.remove('down');
  }

  // per frame: charge ring, ruler button, slots, use-button hint
  update() {
    if (!this.visible) return;
    const thr = this.root.querySelector('.tc-throw');
    if (this.chargeStart) thr.style.setProperty('--p', `${Math.min(1, (performance.now() - this.chargeStart) / 1000) * 100}%`);
    thr.classList.toggle('dim', !this.app.interact?.held);
    this.root.querySelector('.tc-mark').classList.toggle('show', this.app.tools?.mode === 'ruler');
    const I = this.app.interact;
    const use = this.root.querySelector('.tc-use');
    use.classList.toggle('ready', !!I?.target);
    // the hold-to-interact ring sits on the Use button too
    const ring = I?.ui?.ring?.style.getPropertyValue('--p') || '0%';
    use.style.setProperty('--p', I?.ui?.ring?.classList.contains('show') ? ring : '0%');
    const items = I ? [...I.items, ...(I.carried ? ['mannequin'] : [])] : [];
    const html = items.map((i, n) => `<button class="tc-slot" data-n="${n + 1}">${i}</button>`).join('');
    if (html !== this._slots) {
      this._slots = html;
      const el = this.root.querySelector('.tc-slots');
      el.innerHTML = html;
      el.querySelectorAll('.tc-slot').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.input.press(`Digit${b.dataset.n}`); setTimeout(() => this.input.release(`Digit${b.dataset.n}`), 80); }));
    }
  }

  // ------------------------------------------------------------ gyro aiming
  async enableGyro() {
    if (this._gyro) return;
    try {
      const DM = window.DeviceMotionEvent;
      if (DM?.requestPermission) { const r = await DM.requestPermission(); if (r !== 'granted') { this.s.gyro = false; return; } }
    } catch { this.s.gyro = false; return; }
    this._gyro = (e) => {
      const r = e.rotationRate;
      if (!r || !this.visible) return;
      const dt = (e.interval || 16) / 1000;
      const ang = screen.orientation?.angle ?? window.orientation ?? 90;
      const sgn = ang === 270 || ang === -90 ? -1 : 1;
      // landscape: turning about the world vertical is the device x axis
      // (beta), tilting up and down is the device y axis (gamma)
      const k = 18 * this.s.sens;
      this.input.lookX += -(r.beta || 0) * sgn * dt * k;
      this.input.lookY += -(r.gamma || 0) * sgn * dt * k;
    };
    window.addEventListener('devicemotion', this._gyro);
  }

  disableGyro() {
    if (this._gyro) window.removeEventListener('devicemotion', this._gyro);
    this._gyro = null;
  }

  // ------------------------------------------------------------ haptics
  _buzz(p) {
    if (!this.s.haptics || !this.visible) return;
    try { navigator.vibrate?.(p); } catch { /* not supported */ }
  }

  _haptics() {
    Events.on('alarm', () => this._buzz([70, 40, 70]));
    Events.on('bolt_removed', () => this._buzz(35));
    Events.on('door_unlocked', () => this._buzz([20, 30, 20]));
    Events.on('camera:disabled', () => this._buzz(25));
    Events.on('player:land', (e) => { if ((e?.speed ?? 0) > 6) this._buzz(30); });
    Events.on('puzzle_complete', () => this._buzz([40, 40, 40, 40, 80]));
  }
}
