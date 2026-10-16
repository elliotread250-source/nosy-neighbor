// In-game HUD: crosshair, interaction prompt, hold-progress ring, four
// inventory slots with drawn icons, the keyring, hint toasts, stamina, the
// objective line, and the hiding overlay (wardrobe slats, under the bed).
import { Events } from '../core/Events.js';
import { css } from '../art/Palette.js';
import { KEY_COLORS } from '../world/Doors.js';

const HIDE_CLASS = { wardrobe: 'wardrobe', underBed: 'under', underTable: 'under', box: 'box', hamper: 'box', trunk: 'box', behind: 'behind', curtain: 'behind' };

export class HUD {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <div class="hud-hide"></div>
      <div class="hud-cine"><div></div><div></div></div>
      <div class="hud-crosshair"></div>
      <svg class="hud-hold" viewBox="0 0 46 46"><circle cx="23" cy="23" r="18" fill="none" stroke="rgba(42,30,58,0.5)" stroke-width="6"/><circle class="arc" cx="23" cy="23" r="18" fill="none" stroke="#f2c94c" stroke-width="5" stroke-linecap="round" transform="rotate(-90 23 23)" stroke-dasharray="113" stroke-dashoffset="113"/></svg>
      <div class="hud-prompt"></div>
      <div class="hud-objective"></div>
      <div class="hud-hint"></div>
      <div class="hud-keys"></div>
      <div class="hud-itemname"></div>
      <div class="hud-stamina"><div class="hud-stamina-fill"></div></div>
      <div class="hud-slots">${[0, 1, 2, 3].map((i) => `<div class="hud-slot"><span class="n">${i + 1}</span><canvas width="96" height="96"></canvas></div>`).join('')}</div>
    `;
    const q = (s) => root.querySelector(s);
    this.cross = q('.hud-crosshair');
    this.prompt = q('.hud-prompt');
    this.hold = q('.hud-hold');
    this.holdArc = q('.hud-hold .arc');
    this.objective = q('.hud-objective');
    this.hint = q('.hud-hint');
    this.keysEl = q('.hud-keys');
    this.itemName = q('.hud-itemname');
    this.stamina = q('.hud-stamina');
    this.staminaFill = q('.hud-stamina-fill');
    this.hideEl = q('.hud-hide');
    this.slotEls = [...root.querySelectorAll('.hud-slot')];
    this.cine = q('.hud-cine');
    Events.on('cinematic', (e) => { this.cine.classList.toggle('show', e.on); root.classList.toggle('cinematic', e.on); });
    this._objTimer = 0;
    this._hintTimer = 0;
    this._nameTimer = 0;
    this._lastPrompt = '';
    this._slotSig = '';
    this._keySig = '';
    Events.on('hint', (e) => this.showHint(e.text, e.seconds));
    Events.on('key:pickup', (e) => this.showHint(`Got the ${e.label}!`, 2.5));
    Events.on('inventory:select', () => { this._nameTimer = 1.6; });
    Events.on('item:pickup', () => { this._nameTimer = 1.6; });
    Events.on('hide:enter', (e) => { this.hideEl.className = `hud-hide show ${HIDE_CLASS[e.spot.kind] ?? 'behind'}`; });
    Events.on('hide:exit', () => { this.hideEl.classList.remove('show'); });
  }

  setVisible(v) {
    this.root.style.display = v ? '' : 'none';
  }

  showObjective(text, seconds = 5) {
    this.objective.textContent = text;
    this.objective.classList.add('show');
    this._objTimer = seconds;
  }

  showHint(text, seconds = 3.5) {
    this.hint.textContent = text;
    this.hint.classList.add('show');
    this._hintTimer = seconds;
  }

  update(dt, player, game) {
    const s = player.stamina;
    this.stamina.classList.toggle('show', s < 0.999);
    this.stamina.classList.toggle('exhausted', player.exhausted);
    this.staminaFill.style.transform = `scaleX(${s.toFixed(3)})`;
    if (this._objTimer > 0) {
      this._objTimer -= dt;
      if (this._objTimer <= 0) this.objective.classList.remove('show');
    }
    if (this._hintTimer > 0) {
      this._hintTimer -= dt;
      if (this._hintTimer <= 0) this.hint.classList.remove('show');
    }
    const ix = game?.interaction;
    if (!ix) return;
    // prompt
    const cur = ix.current;
    const text = cur?.label ?? '';
    if (text !== this._lastPrompt) {
      this._lastPrompt = text;
      this.prompt.innerHTML = text ? `<kbd>E</kbd>${escapeHtml(text)}` : '';
      this.prompt.classList.toggle('show', !!text);
    }
    this.cross.classList.toggle('active', !!cur && !player.hiding);
    this.cross.style.display = player.hiding ? 'none' : '';
    // hold ring
    const hk = ix.holdTarget ? Math.min(1, ix.holdT / ix.holdTarget.hold) : 0;
    this.hold.classList.toggle('show', hk > 0);
    if (hk > 0) this.holdArc.setAttribute('stroke-dashoffset', (113 * (1 - hk)).toFixed(1));
    // slots
    const inv = ix.inv;
    const sig = inv.slots.map((x) => x?.kind ?? '-').join(',') + inv.sel;
    if (sig !== this._slotSig) {
      this._slotSig = sig;
      this.slotEls.forEach((el, i) => {
        el.classList.toggle('sel', i === inv.sel);
        drawIcon(el.querySelector('canvas'), inv.slots[i]);
      });
      const held = inv.held;
      this.itemName.textContent = held ? held.label : '';
    }
    this._nameTimer -= dt;
    this.itemName.classList.toggle('show', this._nameTimer > 0 && !!inv.held);
    const ksig = [...inv.keys].join(',');
    if (ksig !== this._keySig) {
      this._keySig = ksig;
      this.keysEl.innerHTML = '';
      for (const k of inv.keys) {
        const d = document.createElement('div');
        d.className = 'hud-key';
        d.title = k;
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        d.appendChild(c);
        drawKey(c.getContext('2d'), css(KEY_COLORS[k] ?? 'BRASS'), 64);
        this.keysEl.appendChild(d);
      }
    }
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// --------------------------------------------------------------- icons (2D, chunky, outlined)
const INK = '#2a1e3a';

function drawKey(x, color, S) {
  x.clearRect(0, 0, S, S);
  x.save();
  x.translate(S / 2, S / 2);
  x.rotate(-0.6);
  x.lineWidth = S * 0.05;
  x.strokeStyle = INK;
  x.fillStyle = color;
  x.beginPath();
  x.arc(-S * 0.2, 0, S * 0.15, 0, Math.PI * 2);
  x.arc(-S * 0.2, 0, S * 0.06, 0, Math.PI * 2, true);
  x.fill('evenodd');
  x.stroke();
  x.fillRect(-S * 0.06, -S * 0.05, S * 0.36, S * 0.1);
  x.strokeRect(-S * 0.06, -S * 0.05, S * 0.36, S * 0.1);
  x.fillRect(S * 0.18, S * 0.04, S * 0.08, S * 0.12);
  x.strokeRect(S * 0.18, S * 0.04, S * 0.08, S * 0.12);
  x.restore();
}

const ICON_COLORS = {
  mug: '#e63946', plate: '#fbfaf2', vase: '#6fb7e8', bottle: '#27ae60', can: '#e63946', paintCan: '#a7b1ba', apple: '#e63946', banana: '#ffd166',
  chicken: '#f4a261', book: '#457b9d', toyCar: '#e63946', block: '#ffd166', duck: '#ffd166', ball: '#ff8fab', alarmClock: '#e63946', cone: '#f4a261',
  newspaper: '#fbfaf2', remote: '#2a2a2a', snowGlobe: '#cfe9f5', toyTrain: '#457b9d', plush: '#f4a261', bucket: '#6fb7e8', box: '#c8a46e', jello: '#27ae60',
  crowbar: '#e63946', wrench: '#457b9d', magnet: '#e63946', flashlight: '#ffd166',
};

function drawIcon(canvas, item) {
  const x = canvas.getContext('2d');
  const S = canvas.width;
  x.clearRect(0, 0, S, S);
  if (!item) return;
  const col = ICON_COLORS[item.kind] ?? '#c8a46e';
  x.save();
  x.translate(S / 2, S / 2 + 4);
  x.lineWidth = 5;
  x.lineJoin = 'round';
  x.lineCap = 'round';
  x.strokeStyle = INK;
  x.fillStyle = col;
  const shape = (fn) => { x.beginPath(); fn(); x.fill(); x.stroke(); };
  switch (item.kind) {
    case 'crowbar':
      x.rotate(-0.7);
      x.lineWidth = 15; x.strokeStyle = INK;
      x.beginPath(); x.moveTo(-30, 0); x.lineTo(24, 0); x.arc(24, -10, 10, Math.PI / 2, -Math.PI / 2, true); x.stroke();
      x.lineWidth = 8; x.strokeStyle = col;
      x.beginPath(); x.moveTo(-30, 0); x.lineTo(24, 0); x.arc(24, -10, 10, Math.PI / 2, -Math.PI / 2, true); x.stroke();
      break;
    case 'wrench':
      x.rotate(-0.7);
      shape(() => x.roundRect(-30, -6, 44, 12, 5));
      shape(() => { x.arc(20, 0, 14, 0.7, Math.PI * 2 - 0.7); x.lineTo(20, 0); x.closePath(); });
      break;
    case 'magnet':
      x.lineWidth = 16; x.strokeStyle = INK;
      x.beginPath(); x.arc(0, -4, 18, Math.PI, 0); x.lineTo(18, 18); x.moveTo(-18, -4); x.lineTo(-18, 18); x.stroke();
      x.lineWidth = 9; x.strokeStyle = col;
      x.beginPath(); x.arc(0, -4, 18, Math.PI, 0); x.lineTo(18, 12); x.moveTo(-18, -4); x.lineTo(-18, 12); x.stroke();
      x.fillStyle = '#d7dde2'; x.lineWidth = 4; x.strokeStyle = INK;
      shape(() => x.rect(-25, 12, 14, 10)); shape(() => x.rect(11, 12, 14, 10));
      break;
    case 'flashlight':
      x.rotate(-0.5);
      shape(() => x.roundRect(-28, -9, 38, 18, 6));
      shape(() => { x.moveTo(10, -9); x.lineTo(26, -16); x.lineTo(26, 16); x.lineTo(10, 9); x.closePath(); });
      break;
    case 'book':
      x.rotate(-0.2);
      shape(() => x.roundRect(-20, -26, 40, 50, 5));
      x.fillStyle = '#fbfaf2'; shape(() => x.rect(14, -22, 6, 42));
      break;
    case 'box':
      shape(() => x.roundRect(-26, -20, 52, 42, 5));
      x.fillStyle = '#e8d6a8'; x.fillRect(-5, -20, 10, 42);
      break;
    case 'banana':
      x.lineWidth = 16; x.beginPath(); x.arc(0, -18, 30, 0.4, Math.PI - 0.4); x.stroke();
      x.lineWidth = 9; x.strokeStyle = col; x.beginPath(); x.arc(0, -18, 30, 0.4, Math.PI - 0.4); x.stroke();
      break;
    case 'mug': case 'can': case 'paintCan': case 'bucket': case 'bottle': case 'vase': case 'snowGlobe': case 'jello':
      shape(() => x.roundRect(-17, -24, 34, 46, 7));
      if (item.kind === 'mug') { x.fillStyle = 'transparent'; x.beginPath(); x.arc(20, 0, 9, -1.4, 1.4); x.stroke(); }
      break;
    case 'alarmClock':
      shape(() => x.arc(0, 2, 20, 0, Math.PI * 2));
      x.fillStyle = '#fbfaf2'; shape(() => x.arc(0, 2, 13, 0, Math.PI * 2));
      x.fillStyle = '#d4a93c'; shape(() => x.arc(-15, -18, 7, 0, Math.PI * 2)); shape(() => x.arc(15, -18, 7, 0, Math.PI * 2));
      break;
    default:
      shape(() => x.arc(0, 0, 20, 0, Math.PI * 2));
      break;
  }
  x.restore();
}
