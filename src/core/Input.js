// Keyboard, mouse (pointer lock) and gamepad, mapped to named actions.
import { CONFIG } from '../config.js';

const DEFAULT_BINDINGS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  crouch: ['KeyC', 'ControlLeft'],
  jump: ['Space'],
  interact: ['KeyE', 'Mouse0'],
  drop: ['Mouse2', 'KeyG'],
  useItem: ['KeyF', 'Mouse1'],
  leanLeft: ['KeyQ'],
  leanRight: ['KeyZ'],
  slot1: ['Digit1'],
  slot2: ['Digit2'],
  slot3: ['Digit3'],
  slot4: ['Digit4'],
  pause: ['Escape'],
  flyUp: ['Space'],
  flyDown: ['KeyC'],
};

const GAME_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);
const DEBUG_KEYS = new Set(['F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9']);

export class Input {
  constructor(element) {
    this.el = element;
    this.bindings = structuredClone(DEFAULT_BINDINGS);
    this.held = new Set();
    this.pressedThisFrame = new Set();
    this.releasedThisFrame = new Set();
    this.lookX = 0;
    this.lookY = 0;
    this.wheel = 0;
    this.locked = false;
    this.gamepad = { move: [0, 0], look: [0, 0], buttons: [], prev: [] };
    this.onLockChange = null;
    // on-screen touch controls feed this: a move vector, and look deltas into
    // lookX/lookY; buttons press and release key codes through press()/release()
    this.touchMove = [0, 0];
    // which device the player is using right now: 'kbm', 'touch' or 'pad'
    this.device = 'kbm';
    this.onDeviceChange = null;
    window.addEventListener('pointerdown', (e) => this._setDevice(e.pointerType === 'touch' || e.pointerType === 'pen' ? 'touch' : 'kbm'), true);
    window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && (Math.abs(e.movementX) + Math.abs(e.movementY) > 2)) this._setDevice('kbm'); }, true);

    window.addEventListener('keydown', (e) => {
      this._setDevice('kbm');
      if (GAME_KEYS.has(e.code) && this.locked) e.preventDefault();
      if (DEBUG_KEYS.has(e.code) && CONFIG.debug) e.preventDefault();
      if (e.repeat) return;
      this._press(e.code);
    });
    window.addEventListener('keyup', (e) => this._release(e.code));
    window.addEventListener('blur', () => {
      for (const c of this.held) this.releasedThisFrame.add(c);
      this.held.clear();
    });
    element.addEventListener('mousedown', (e) => {
      if (!this.locked) return;
      this._press(`Mouse${e.button}`);
    });
    window.addEventListener('mouseup', (e) => this._release(`Mouse${e.button}`));
    element.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.lookX += e.movementX;
      this.lookY += e.movementY;
    });
    window.addEventListener('wheel', (e) => {
      if (this.locked) this.wheel += Math.sign(e.deltaY);
    }, { passive: true });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.el;
      if (!this.locked) {
        this.held.clear();
      }
      this.onLockChange?.(this.locked);
    });
  }

  requestLock() {
    try {
      const p = this.el.requestPointerLock?.({ unadjustedMovement: true });
      if (p && p.catch) p.catch(() => this.el.requestPointerLock?.());
    } catch {
      this.el.requestPointerLock?.();
    }
  }

  exitLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  _setDevice(d) {
    if (d === this.device) return;
    this.device = d;
    this.onDeviceChange?.(d);
  }

  // virtual key presses from on-screen buttons
  press(code) { this._press(code); }
  release(code) { this._release(code); }

  _press(code) {
    if (!this.held.has(code)) this.pressedThisFrame.add(code);
    this.held.add(code);
  }

  _release(code) {
    if (this.held.has(code)) this.releasedThisFrame.add(code);
    this.held.delete(code);
  }

  down(action) {
    const codes = this.bindings[action];
    if (codes) for (const c of codes) if (this.held.has(c)) return true;
    return this._padDown(action);
  }

  pressed(action) {
    const codes = this.bindings[action];
    if (codes) for (const c of codes) if (this.pressedThisFrame.has(c)) return true;
    return this._padPressed(action);
  }

  released(action) {
    const codes = this.bindings[action];
    if (codes) for (const c of codes) if (this.releasedThisFrame.has(c)) return true;
    return false;
  }

  keyPressed(code) {
    return this.pressedThisFrame.has(code);
  }

  // Movement as a vector: x = strafe right, y = forward
  moveAxis() {
    let x = 0, y = 0;
    if (this.down('forward')) y += 1;
    if (this.down('back')) y -= 1;
    if (this.down('right')) x += 1;
    if (this.down('left')) x -= 1;
    x += this.gamepad.move[0] + this.touchMove[0];
    y += this.gamepad.move[1] + this.touchMove[1];
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return [x, y];
  }

  // Returns accumulated look delta in pixels (gamepad converted to pixels/frame).
  consumeLook(dt) {
    const gx = this.gamepad.look[0] * 900 * dt;
    const gy = this.gamepad.look[1] * 700 * dt;
    const out = [this.lookX + gx, this.lookY + gy];
    this.lookX = 0;
    this.lookY = 0;
    return out;
  }

  consumeWheel() {
    const w = this.wheel;
    this.wheel = 0;
    return w;
  }

  // --- Gamepad: A jump, B crouch, X interact, Y drop, LB lean L, RB lean R, L3 sprint, RT interact
  static PAD = { jump: 0, crouch: 1, interact: 2, drop: 3, leanLeft: 4, leanRight: 5, sprint: 10, pause: 9 };

  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && [...pads].find((g) => g && g.connected);
    const gp = this.gamepad;
    gp.prev = gp.buttons;
    if (!p) {
      gp.move = [0, 0]; gp.look = [0, 0]; gp.buttons = [];
      return;
    }
    const dz = (v) => (Math.abs(v) < 0.15 ? 0 : (v - Math.sign(v) * 0.15) / 0.85);
    gp.move = [dz(p.axes[0] || 0), -dz(p.axes[1] || 0)];
    gp.look = [dz(p.axes[2] || 0), dz(p.axes[3] || 0)];
    gp.buttons = p.buttons.map((b) => b.pressed);
    if (gp.buttons.some(Boolean) || Math.abs(gp.move[0]) + Math.abs(gp.move[1]) + Math.abs(gp.look[0]) + Math.abs(gp.look[1]) > 0.3) this._setDevice('pad');
    if (p.buttons[7]?.pressed) gp.buttons[2] = true; // RT also interacts
  }

  _padDown(action) {
    const i = Input.PAD[action];
    return i !== undefined && !!this.gamepad.buttons[i];
  }

  _padPressed(action) {
    const i = Input.PAD[action];
    return i !== undefined && !!this.gamepad.buttons[i] && !this.gamepad.prev[i];
  }

  endFrame() {
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
  }
}
