// Title, pause, options and credits. Chunky cut-out buttons, each glued on
// at a slightly different angle; they wobble when you hover them.
import { Events } from '../core/Events.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { Settings } from './Settings.js';

const VERSION = 'v0.13 · Act 1';

const OPTION_TABS = {
  Graphics: [
    ['preset', 'Quality preset', 'select', ['low', 'medium', 'high'], 'Takes effect after a restart'],
    ['renderScale', 'Render scale', 'range', [0.5, 1, 0.05]],
    ['shadows', 'Shadows', 'toggle'],
    ['outlines', 'Outlines', 'toggle'],
    ['bloom', 'Bloom', 'toggle'],
    ['grain', 'Film grain', 'toggle'],
  ],
  Audio: [
    ['master', 'Master', 'range', [0, 1, 0.05]],
    ['music', 'Music', 'range', [0, 1, 0.05]],
    ['sfx', 'Sound effects', 'range', [0, 1, 0.05]],
    ['ambience', 'Ambience', 'range', [0, 1, 0.05]],
    ['voice', 'Voice', 'range', [0, 1, 0.05]],
  ],
  Controls: [
    ['sensitivity', 'Mouse sensitivity', 'range', [0.0006, 0.005, 0.0002]],
    ['fov', 'Field of view', 'range', [70, 100, 1]],
    ['invertY', 'Invert Y', 'toggle'],
    ['crouchToggle', 'Crouch toggles', 'toggle'],
    ['headBob', 'Head bob', 'toggle'],
    ['_bindings', 'Keys', 'bindings'],
  ],
  Gameplay: [
    ['difficulty', 'Difficulty', 'select', ['easy', 'normal', 'hard']],
    ['reducedScare', 'Gentler catch (no lunge)', 'toggle'],
    ['subtitles', 'Subtitles for sounds', 'toggle'],
  ],
  Accessibility: [
    ['colorblindKeys', 'Key shapes (not just colors)', 'toggle'],
    ['subtitles', 'Subtitles for sounds', 'toggle'],
    ['headBob', 'Head bob', 'toggle'],
    ['reducedScare', 'Gentler catch', 'toggle'],
  ],
};

const REBIND = [['forward', 'Forward'], ['back', 'Back'], ['left', 'Left'], ['right', 'Right'], ['sprint', 'Sprint'], ['crouch', 'Crouch'], ['jump', 'Jump'], ['interact', 'Interact'], ['useItem', 'Use item'], ['drop', 'Drop'], ['leanLeft', 'Lean left'], ['leanRight', 'Lean right']];

function tilt() { return `${(Math.random() * 3 - 1.5).toFixed(2)}deg`; }
function keyName(code) { return (code || '?').replace(/^Key/, '').replace(/^Digit/, '').replace('Mouse0', 'LMB').replace('Mouse2', 'RMB').replace('Mouse1', 'MMB').replace('ShiftLeft', 'Shift').replace('ControlLeft', 'Ctrl').replace('Space', 'Space'); }

export class Menus {
  constructor(game) {
    this.game = game;
    const root = document.getElementById('menus');
    this.root = root;
    const hasSave = SaveSystem.hasSave();
    root.innerHTML = `
      <div class="menu-screen title-screen">
        <div class="title-logo">
          <div class="w1">N<svg class="eye" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="44" ry="40" fill="#fff8ec" stroke="#2a1e3a" stroke-width="9"/><circle class="pupil" cx="50" cy="52" r="16" fill="#2a1e3a"/><circle class="glint" cx="56" cy="45" r="5" fill="#fff8ec"/></svg>SY</div>
          <div class="w2">NEIGHBOR</div>
        </div>
        <div class="menu-buttons">
          <button data-act="play">Play</button>
          ${hasSave ? '<button data-act="continue">Continue</button>' : ''}
          <button data-act="options">Options</button>
          <button data-act="credits">Credits</button>
        </div>
        <div class="title-help">WASD move · Shift sprint · C crouch · Space jump · E interact · hold click to throw · F use item · Q/Z lean</div>
        <div class="version">${VERSION}</div>
      </div>
      <div class="menu-screen pause-screen">
        <div class="menu-title">Paused</div>
        <div class="menu-buttons">
          <button data-act="resume">Resume</button>
          <button data-act="options">Options</button>
          <button data-act="restart">Restart Act</button>
          <button data-act="quit">Quit to Title</button>
        </div>
      </div>
      <div class="menu-screen options-screen">
        <div class="menu-title">Options</div>
        <div class="tabs">${Object.keys(OPTION_TABS).map((t, i) => `<button class="tab${i ? '' : ' on'}" data-tab="${t}">${t}</button>`).join('')}</div>
        <div class="panel"></div>
        <div class="menu-buttons row"><button data-act="reset">Reset</button><button data-act="back">Back</button></div>
      </div>
      <div class="menu-screen credits-screen">
        <div class="menu-title">Credits</div>
        <div class="credits">
          <p><b>Nosy Neighbor</b> is a fan homage to stealth-horror-comedy games, built from scratch.</p>
          <p>Every model, texture, sound and note of music is made by code at load time: no downloaded assets.</p>
          <p>Built with three.js, Rapier physics and the Web Audio API.</p>
          <p>Mr. Grimsby is entirely fictional. Any resemblance to your actual neighbor is your own business.</p>
        </div>
        <div class="menu-buttons"><button data-act="back">Back</button></div>
      </div>`;
    root.querySelectorAll('button').forEach((b) => this._button(b));
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.tab) { this.tab(b.dataset.tab); return; }
      if (b.dataset.act) this.act(b.dataset.act);
    });
    this.eye = root.querySelector('.pupil');
    this.glint = root.querySelector('.glint');
    window.addEventListener('mousemove', (e) => this._look(e));
    this.stack = [];
    this.current = null;
    this.curTab = 'Graphics';
  }

  _button(b) {
    b.style.setProperty('--tilt', tilt());
    b.addEventListener('mouseenter', () => Events.emit('sfx', { name: 'hover' }));
  }

  _look(e) {
    if (this.current !== 'title' || !this.eye) return;
    const r = this.eye.ownerSVGElement.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / 300);
    const px = 50 + (dx / d) * 20 * k, py = 52 + (dy / d) * 17 * k;
    this.eye.setAttribute('cx', px.toFixed(1));
    this.eye.setAttribute('cy', py.toFixed(1));
    this.glint.setAttribute('cx', (px + 6).toFixed(1));
    this.glint.setAttribute('cy', (py - 7).toFixed(1));
  }

  show(name) {
    this.current = name;
    this.root.querySelectorAll('.menu-screen').forEach((s) => s.classList.toggle('show', s.classList.contains(`${name}-screen`)));
    this.root.classList.toggle('open', !!name);
    this.root.classList.toggle('dim', name === 'pause' || (name === 'options' && this.stack.includes('pause')) || (name === 'credits' && false));
    if (name === 'options') this.tab(this.curTab);
  }

  hide() {
    this.current = null;
    this.stack = [];
    this.root.querySelectorAll('.menu-screen').forEach((s) => s.classList.remove('show'));
    this.root.classList.remove('open', 'dim');
  }

  act(a) {
    const g = this.game;
    Events.emit('sfx', { name: 'uiClick' });
    switch (a) {
      case 'play':
        SaveSystem.clear();
        g.audio.unlock();
        g.input.requestLock();
        this.hide();
        g.startGame(false);
        break;
      case 'continue':
        g.audio.unlock();
        g.input.requestLock();
        this.hide();
        g.startGame(true);
        break;
      case 'resume':
        g.input.requestLock();
        this.hide();
        g.resume();
        break;
      case 'options':
      case 'credits':
        this.stack.push(this.current);
        this.show(a);
        break;
      case 'back':
        this.show(this.stack.pop() ?? 'title');
        break;
      case 'reset':
        Settings.reset(g);
        this.tab(this.curTab);
        break;
      case 'restart':
        SaveSystem.clear();
        location.reload();
        break;
      case 'quit':
        location.reload();
        break;
      default: break;
    }
  }

  tab(name) {
    this.curTab = name;
    this.root.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === name));
    const panel = this.root.querySelector('.panel');
    const v = Settings.values;
    panel.innerHTML = '';
    for (const [key, label, type, arg, note] of OPTION_TABS[name]) {
      const row = document.createElement('div');
      row.className = 'opt';
      const lab = document.createElement('label');
      lab.textContent = label;
      if (note) { const n = document.createElement('small'); n.textContent = note; lab.appendChild(n); }
      row.appendChild(lab);
      if (type === 'toggle') {
        const b = document.createElement('button');
        b.className = `toggle${v[key] ? ' on' : ''}`;
        b.textContent = v[key] ? 'On' : 'Off';
        b.onclick = () => { Settings.set(key, !Settings.values[key], this.game); this.tab(name); Events.emit('sfx', { name: 'uiClick' }); };
        row.appendChild(b);
      } else if (type === 'range') {
        const r = document.createElement('input');
        r.type = 'range';
        [r.min, r.max, r.step] = arg;
        r.value = v[key];
        const out = document.createElement('span');
        out.className = 'val';
        const fmt = (x) => (arg[1] <= 1 ? `${Math.round(x * 100)}%` : arg[1] < 0.01 ? x : Math.round(x));
        out.textContent = key === 'sensitivity' ? (v[key] * 1000).toFixed(1) : fmt(v[key]);
        r.oninput = () => { const x = Number(r.value); Settings.set(key, x, this.game); out.textContent = key === 'sensitivity' ? (x * 1000).toFixed(1) : fmt(x); };
        row.append(r, out);
      } else if (type === 'select') {
        const wrap = document.createElement('div');
        wrap.className = 'choices';
        for (const o of arg) {
          const b = document.createElement('button');
          b.textContent = o;
          b.className = v[key] === o ? 'on' : '';
          b.onclick = () => { Settings.set(key, o, this.game); this.tab(name); Events.emit('sfx', { name: 'uiClick' }); };
          wrap.appendChild(b);
        }
        row.appendChild(wrap);
      } else if (type === 'bindings') {
        row.classList.add('binds');
        const grid = document.createElement('div');
        grid.className = 'bindgrid';
        for (const [action, alabel] of REBIND) {
          const b = document.createElement('button');
          const code = Settings.values.bindings[action] ?? this.game.input.bindings[action]?.[0];
          b.innerHTML = `<span>${alabel}</span><kbd>${keyName(code)}</kbd>`;
          b.onclick = () => this._rebind(action, b);
          grid.appendChild(b);
        }
        row.appendChild(grid);
      }
      panel.appendChild(row);
    }
  }

  _rebind(action, btn) {
    btn.querySelector('kbd').textContent = 'press a key';
    btn.classList.add('listening');
    const onKey = (e) => {
      e.preventDefault();
      window.removeEventListener('keydown', onKey, true);
      if (e.code !== 'Escape') {
        const b = { ...Settings.values.bindings, [action]: e.code };
        Settings.set('bindings', b, this.game);
      }
      this.tab(this.curTab);
    };
    window.addEventListener('keydown', onKey, true);
  }
}
