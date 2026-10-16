// Every sound effect, built on demand from synth primitives and driven by
// game events. Footsteps know what they're stepping on. Loops (TV, radio,
// kettle, alarm) run until their Stop event. Heartbeat and breath follow
// the chase. Notable sounds also post captions for subtitles.
import { Vector3 } from 'three';
import { Events } from '../core/Events.js';
import { STREET } from '../world/Neighborhood.js';
import * as S from './Synth.js';

const MATERIAL = {
  mug: 'ceramic', plate: 'ceramic', vase: 'ceramic', snowGlobe: 'glass', bottle: 'glass', jello: 'soft',
  can: 'metal', paintCan: 'metal', bucket: 'metal', crowbar: 'metal', wrench: 'metal', magnet: 'metal', flashlight: 'plastic', alarmClock: 'metal',
  apple: 'soft', banana: 'soft', chicken: 'soft', plush: 'soft', newspaper: 'paper', book: 'paper',
  toyCar: 'plastic', block: 'wood', duck: 'plastic', ball: 'plastic', cone: 'plastic', remote: 'plastic', toyTrain: 'wood',
  box: 'cardboard', chair: 'wood', shard: 'glass',
};

const FLOOR_SURF = { wood: 'wood', old: 'wood', dark: 'wood', checker: 'tile', pinkTile: 'tile', yellowTile: 'tile', carpetGreen: 'carpet', carpetRed: 'carpet', basement: 'concrete' };

export class Sfx {
  constructor(audio) {
    this.audio = audio;
    this.game = audio.game;
    this.loops = new Map();
    this.time = 0;
    this.heartT = 0;
    this.breathT = 0;
    this.lastCaption = {};
    const on = (k, f) => Events.on(k, (e) => { if (this.audio.ready) f(e || {}); });
    on('sfx', (e) => this.play(e));
    on('player:footstep', (e) => this.footstep(e.position, e.loudness, false));
    on('player:land', (e) => this.footstep(e.position, Math.min(1.4, e.speed / 6), false, true));
    on('player:jump', () => this.oneShot((c, d, t) => S.noise(c, d, t, { type: 'bandpass', freq: 700, dur: 0.12, gain: 0.07 })));
    on('neighbor:step', (e) => this.footstep(e.position, e.run ? 1.4 : 1.0, true));
    on('neighbor:anim', (e) => this.animEvent(e));
    on('noise', (e) => { if (e.kind === 'shatter' || e.kind === 'glass') this.caption('[Glass breaking]'); });
    on('inventory:select', () => this.play({ name: 'click' }));
    on('door:unlocked', () => this.play({ name: 'unlock' }));
  }

  get ctx() { return this.audio.ctx; }

  caption(text, key = text) {
    if (this.time - (this.lastCaption[key] ?? -9) < 2.5) return;
    this.lastCaption[key] = this.time;
    Events.emit('caption', { text });
  }

  // Run a recipe either at a world position (spatial) or flat on a bus.
  oneShot(fn, pos = null, opts = {}) {
    const a = this.audio;
    if (!a.budget()) return;
    const t = a.now + 0.005;
    const dest = pos ? a.spatial(pos, opts).input : a.buses[opts.bus ?? 'sfx'];
    const end = fn(a.ctx, dest, t);
    a.track(typeof end === 'number' ? end : t + 1.5);
  }

  surfaceAt(p) {
    const z = this.game.zones?.at(new Vector3(p.x, p.y + 0.9, p.z));
    if (z?.room?.floorMat) return FLOOR_SURF[z.room.floorMat] ?? 'wood';
    if (z?.indoor) return 'wood';
    if (p.y < -0.3) return 'concrete';
    if (p.y > 0.45) return 'wood'; // porches, decks, roofs
    const az = Math.abs(p.z);
    if (az < STREET.sidewalkOuter && Math.abs(p.x) < STREET.halfLength) return 'concrete';
    return 'grass';
  }

  footstep(pos, loud, heavy, landing = false) {
    if (!pos) return;
    const surf = this.surfaceAt(pos);
    const g = Math.min(1.2, loud) * (heavy ? 0.55 : 0.2);
    if (g < 0.01) return;
    const k = heavy ? 0.75 : 1; // his are lower and bigger
    const v = 0.9 + Math.random() * 0.2;
    const fn = (c, d, t) => {
      switch (surf) {
        case 'grass': S.noise(c, d, t, { type: 'bandpass', freq: 1800 * v, q: 0.8, dur: 0.12, attack: 0.01, gain: g * 0.7 }); return S.noise(c, d, t, { type: 'lowpass', freq: 300, dur: 0.08, gain: g * 0.5 }).end;
        case 'carpet': return S.thump(c, d, t, { low: 60 * k, knock: 300, gain: g * 0.6, dur: 0.1 });
        case 'tile': S.thump(c, d, t, { low: 90 * k, knock: 2400 * v, gain: g * 0.6, dur: 0.07 }); return S.noise(c, d, t, { type: 'highpass', freq: 4000, dur: 0.03, gain: g * 0.3 }).end;
        case 'concrete': S.thump(c, d, t, { low: 70 * k, knock: 1500 * v, gain: g * 0.6, dur: 0.08 }); return S.noise(c, d, t, { type: 'bandpass', freq: 3200, q: 0.7, dur: 0.06, gain: g * 0.35 }).end;
        case 'metal': return S.clank(c, d, t, { base: 300 * v, gain: g * 0.4, dur: 0.3 });
        default: // wood, with a creak now and then
          S.thump(c, d, t, { low: 85 * k * v, knock: 700 * v, gain: g, dur: landing ? 0.2 : 0.12 });
          if (Math.random() < 0.08) S.tone(c, d, t + 0.05, { type: 'sawtooth', freq: 180, freqEnd: 140, dur: 0.25, gain: g * 0.04 });
          return t + 0.3;
      }
    };
    if (heavy) {
      this.oneShot(fn, pos, { ref: 3, rolloff: 0.9, max: 50 });
      // tell deaf players where he is when he's on another floor
      const me = this.game.player?.curFeet;
      if (me && pos.distanceTo(me) < 14 && Math.abs(pos.y - me.y) > 2.2) this.caption(pos.y > me.y ? '[Footsteps above]' : '[Footsteps below]', 'steps');
    } else this.oneShot(fn, null);
  }

  animEvent(e) {
    const p = e.position?.clone().add(new Vector3(0, 1, 0));
    switch (e.name) {
      case 'hammerHit': this.play({ name: 'hammer', position: p }); break;
      case 'trapSet': this.play({ name: 'trapSet', position: p }); break;
      case 'tap': this.oneShot((c, d, t) => S.thump(c, d, t, { low: 200, knock: 2000, gain: 0.15, dur: 0.05 }), p); break;
      case 'gulp': this.oneShot((c, d, t) => S.tone(c, d, t, { type: 'sine', freq: 180, freqEnd: 90, dur: 0.12, gain: 0.25 }).end, p, { bus: 'voice' }); break;
      case 'kick': this.oneShot((c, d, t) => S.thump(c, d, t, { low: 70, knock: 500, gain: 0.6, dur: 0.15 }), p); break;
      case 'yank': this.play({ name: 'doorCreak', position: p }); break;
      case 'release': this.play({ name: 'whoosh', position: p }); break;
      default: break;
    }
  }

  // ------------------------------------------------------------ the catalog
  play(e) {
    const n = e.name;
    if (!n) return;
    if (n.endsWith('Stop')) { this.stopLoop(e.id ?? n.slice(0, -4)); return; }
    const pos = e.position ?? null;
    const R = RECIPES[n];
    if (LOOPS[n]) { this.startLoop(n, e.id ?? n, pos); return; }
    if (!R) return;
    if (CAPTIONS[n]) this.caption(CAPTIONS[n]);
    this.oneShot((c, d, t) => R(c, d, t, e), pos, { bus: R.bus });
  }

  startLoop(name, id, pos) {
    if (this.loops.has(id)) return;
    const a = this.audio;
    const out = pos ? a.spatial(pos, { ref: 2.5, rolloff: 1.1 }) : { input: a.buses.sfx };
    const gain = a.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(1, a.now, 0.1);
    gain.connect(out.input);
    const loop = { name, gain, out, pos, next: a.now, step: 0 };
    this.loops.set(id, loop);
    if (CAPTIONS[name]) this.caption(CAPTIONS[name]);
  }

  stopLoop(id) {
    const l = this.loops.get(id);
    if (!l) return;
    this.loops.delete(id);
    const t = this.audio.now;
    l.gain.gain.setTargetAtTime(0, t, 0.08);
    setTimeout(() => l.gain.disconnect(), 600);
  }

  update(dt) {
    if (!this.audio.ready) return;
    this.time += dt;
    const c = this.ctx;
    const now = c.currentTime;
    // loops schedule their next little pieces ahead of time
    for (const l of this.loops.values()) {
      while (l.next < now + 0.25) {
        l.next += LOOPS[l.name](c, l.gain, Math.max(l.next, now), l.step++);
      }
    }
    // occlusion for static loops: update every so often
    if ((this._occT = (this._occT ?? 0) - dt) <= 0) {
      this._occT = 0.3;
      for (const l of this.loops.values()) if (l.pos && l.out.filter) {
        const w = this.audio.wallsTo(l.pos);
        l.out.filter.frequency.setTargetAtTime(w ? Math.max(350, 5000 / (w * 1.6)) : 20000, now, 0.1);
        l.out.gain.gain.setTargetAtTime(Math.pow(0.62, w), now, 0.1);
      }
    }
    // heartbeat: he's chasing, or near your hiding spot
    const g = this.game;
    const ai = g.ai;
    const p = g.player;
    let fear = 0;
    if (ai && p) {
      const d = ai.curFeet.distanceTo(p.curFeet);
      if (ai.state === 'chase' || ai.state === 'spot') fear = Math.max(0.5, 1 - d / 20);
      else if (p.hiding && d < 9) fear = 1 - d / 9;
      else if (ai.state === 'search' && d < 8) fear = 0.4;
    }
    if (fear > 0.05) {
      this.heartT -= dt;
      if (this.heartT <= 0) {
        const bpm = 70 + fear * 75;
        this.heartT = 60 / bpm;
        const gain = 0.15 + fear * 0.35;
        this.oneShot((cc, d, t) => { S.tone(cc, d, t, { type: 'sine', freq: 62, freqEnd: 40, glide: 0.1, dur: 0.14, gain }); return S.tone(cc, d, t + 0.16, { type: 'sine', freq: 55, freqEnd: 38, glide: 0.1, dur: 0.12, gain: gain * 0.7 }).end; });
      }
    }
    // out of breath
    if (p && p.stamina < 0.35 && !p.hiding) {
      this.breathT -= dt;
      if (this.breathT <= 0) {
        this.breathT = 0.55 + p.stamina;
        const gain = 0.05 + (0.35 - p.stamina) * 0.25;
        this.oneShot((cc, d, t) => { S.noise(cc, d, t, { type: 'bandpass', freq: 1100, q: 1.2, dur: 0.22, attack: 0.05, gain }); return S.noise(cc, d, t + 0.28, { type: 'bandpass', freq: 800, q: 1.2, dur: 0.25, attack: 0.06, gain: gain * 0.8 }).end; }, null, { bus: 'voice' });
      }
    }
  }
}

// Caption text for sounds worth subtitling.
const CAPTIONS = {
  glassBreak: '[Glass breaking]', glassSmash: '[Glass smashing]', doorBang: '[Door bangs open]', doorSlam: '[Door slams]', trapSnap: '[Bear trap snaps]',
  cameraAlarm: '[Camera alarm beeping]', alarmRing: '[Alarm clock ringing]', kettleWhistle: '[Kettle whistling]', tvLoop: '[TV blaring]', radioLoop: '[Radio playing]',
  hammering: '[Hammering]', hammer: '[Hammering]', washerShudder: '[Washing machine shuddering]', shatter: '[Something shatters]', catchStinger: '[Sting!]', lockTurn: '[A lock turns]',
};

// One-shot recipes: (ctx, dest, t, event) -> end time.
const RECIPES = {
  click: (c, d, t) => S.tone(c, d, t, { type: 'square', freq: 1800, dur: 0.02, gain: 0.05 }).end,
  pickup: (c, d, t) => S.tone(c, d, t, { type: 'sine', freq: 520, freqEnd: 900, dur: 0.1, gain: 0.15 }).end,
  pickupTool: (c, d, t) => { S.clank(c, d, t, { base: 500, gain: 0.12, dur: 0.3 }); return S.tone(c, d, t + 0.05, { type: 'triangle', freq: 660, freqEnd: 990, dur: 0.12, gain: 0.12 }).end; },
  keyJingle: (c, d, t) => { for (let i = 0; i < 5; i++) S.clink(c, d, t + i * 0.045 + Math.random() * 0.02, { base: 2600 + Math.random() * 1200, gain: 0.08, dur: 0.18 }); S.tone(c, d, t + 0.1, { type: 'sine', freq: 1320, dur: 0.15, gain: 0.07 }); return S.tone(c, d, t + 0.2, { type: 'sine', freq: 1760, dur: 0.3, gain: 0.07 }).end; },
  drop: (c, d, t) => S.thump(c, d, t, { low: 120, knock: 900, gain: 0.15, dur: 0.08 }),
  dropHeavy: (c, d, t) => S.thump(c, d, t, { low: 60, knock: 400, gain: 0.4, dur: 0.18 }),
  liftHeavy: (c, d, t) => S.noise(c, d, t, { type: 'bandpass', freq: 400, dur: 0.2, attack: 0.05, gain: 0.08 }).end,
  throw: (c, d, t) => S.noise(c, d, t, { type: 'bandpass', freq: 900, freqEnd: 2200, q: 2, dur: 0.18, attack: 0.04, gain: 0.08 }).end,
  throwHard: (c, d, t) => S.noise(c, d, t, { type: 'bandpass', freq: 700, freqEnd: 3200, q: 2, dur: 0.24, attack: 0.03, gain: 0.14 }).end,
  whoosh: (c, d, t) => S.noise(c, d, t, { type: 'bandpass', freq: 600, freqEnd: 2600, q: 2, dur: 0.3, attack: 0.05, gain: 0.15 }).end,
  squeak: (c, d, t) => S.tone(c, d, t, { type: 'square', freq: 1400, freqEnd: 2200, dur: 0.18, gain: 0.08, vibrato: 60, vibratoRate: 30 }).end,
  impact: (c, d, t, e) => {
    const s = Math.min(1.3, e.strength ?? 0.5);
    switch (MATERIAL[e.item] ?? 'wood') {
      case 'metal': return S.clank(c, d, t, { base: 380 + Math.random() * 200, gain: 0.25 * s, dur: 0.45 });
      case 'ceramic': return S.clink(c, d, t, { base: 1500 + Math.random() * 400, gain: 0.2 * s, dur: 0.2 });
      case 'glass': return S.clink(c, d, t, { base: 2600, gain: 0.18 * s, dur: 0.25 });
      case 'soft': return S.thump(c, d, t, { low: 90, knock: 300, gain: 0.25 * s, dur: 0.08 });
      case 'paper': S.thump(c, d, t, { low: 110, knock: 1200, gain: 0.25 * s, dur: 0.06 }); return S.noise(c, d, t, { type: 'highpass', freq: 2500, dur: 0.06, gain: 0.08 * s }).end;
      case 'plastic': return S.thump(c, d, t, { low: 220, knock: 1800, gain: 0.22 * s, dur: 0.05 });
      case 'cardboard': return S.thump(c, d, t, { low: 70, knock: 500, gain: 0.3 * s, dur: 0.12 });
      default: return S.thump(c, d, t, { low: 110, knock: 900, gain: 0.3 * s, dur: 0.1 });
    }
  },
  shatter: (c, d, t) => { S.noise(c, d, t, { type: 'highpass', freq: 2500, dur: 0.35, gain: 0.4 }); for (let i = 0; i < 8; i++) S.clink(c, d, t + Math.random() * 0.25, { base: 1600 + Math.random() * 2000, gain: 0.1, dur: 0.15 }); return t + 0.6; },
  glassSmash: (c, d, t) => { S.noise(c, d, t, { type: 'highpass', freq: 1800, dur: 0.5, gain: 0.55 }); for (let i = 0; i < 12; i++) S.clink(c, d, t + Math.random() * 0.45, { base: 2000 + Math.random() * 3000, gain: 0.12, dur: 0.2 }); return t + 0.9; },
  glassBreak: (c, d, t) => RECIPES.glassSmash(c, d, t),
  glassTap: (c, d, t) => S.clink(c, d, t, { base: 2100, gain: 0.1, dur: 0.12 }),
  doorCreak: (c, d, t) => { S.tone(c, d, t, { type: 'sawtooth', freq: 260, freqEnd: 180, dur: 0.6, attack: 0.05, gain: 0.05, vibrato: 25, vibratoRate: 11 }); return S.noise(c, d, t, { type: 'bandpass', freq: 900, q: 6, dur: 0.6, attack: 0.05, gain: 0.04 }).end; },
  screenOpen: (c, d, t) => S.tone(c, d, t, { type: 'sawtooth', freq: 900, freqEnd: 1300, dur: 0.3, gain: 0.03, vibrato: 40, vibratoRate: 18 }).end,
  screenSlap: (c, d, t) => S.thump(c, d, t, { low: 140, knock: 1500, gain: 0.45, dur: 0.08 }),
  doorClose: (c, d, t) => S.thump(c, d, t, { low: 70, knock: 500, gain: 0.35, dur: 0.12 }),
  doorBang: (c, d, t) => { S.thump(c, d, t, { low: 55, knock: 400, gain: 0.8, dur: 0.25 }); return S.noise(c, d, t, { type: 'lowpass', freq: 1200, dur: 0.15, gain: 0.3 }).end; },
  doorSlam: (c, d, t) => { S.thump(c, d, t, { low: 45, knock: 300, gain: 1.0, dur: 0.4 }); return S.noise(c, d, t, { type: 'lowpass', freq: 800, dur: 0.5, gain: 0.4 }).end; },
  rattle: (c, d, t) => { for (let i = 0; i < 4; i++) S.clank(c, d, t + i * 0.06, { base: 600 + Math.random() * 300, gain: 0.08, dur: 0.1 }); return t + 0.4; },
  unlock: (c, d, t) => { S.clank(c, d, t, { base: 900, gain: 0.12, dur: 0.12 }); return S.thump(c, d, t + 0.12, { low: 300, knock: 2500, gain: 0.2, dur: 0.05 }); },
  unlockSequence: (c, d, t) => { for (let i = 0; i < 5; i++) RECIPES.unlock(c, d, t + 0.25 + i * 0.55); return t + 3; },
  lockTurn: (c, d, t) => { S.clank(c, d, t, { base: 300, gain: 0.3, dur: 0.3 }); return S.thump(c, d, t + 0.18, { low: 120, knock: 1800, gain: 0.4, dur: 0.06 }); },
  chainDrop: (c, d, t) => { for (let i = 0; i < 10; i++) S.clank(c, d, t + i * 0.05 + Math.random() * 0.03, { base: 700 + Math.random() * 600, gain: 0.09, dur: 0.15 }); return t + 0.8; },
  pryStart: (c, d, t) => S.tone(c, d, t, { type: 'sawtooth', freq: 420, freqEnd: 900, dur: 0.8, attack: 0.1, gain: 0.05, vibrato: 30, vibratoRate: 14 }).end,
  pryPop: (c, d, t) => { S.noise(c, d, t, { type: 'bandpass', freq: 1500, dur: 0.08, gain: 0.5 }); return S.thump(c, d, t, { low: 90, knock: 700, gain: 0.5, dur: 0.15 }); },
  hatch: (c, d, t) => S.thump(c, d, t, { low: 60, knock: 500, gain: 0.4, dur: 0.2 }),
  windowSlide: (c, d, t) => S.noise(c, d, t, { type: 'bandpass', freq: 1200, q: 3, dur: 0.5, attack: 0.05, gain: 0.08 }).end,
  hammer: (c, d, t) => { S.thump(c, d, t, { low: 120, knock: 1400, gain: 0.5, dur: 0.06 }); return S.clank(c, d, t, { base: 1100, gain: 0.08, dur: 0.15 }); },
  hammering: (c, d, t) => { for (let i = 0; i < 4; i++) RECIPES.hammer(c, d, t + i * 0.4); return t + 1.8; },
  rummage: (c, d, t) => { for (let i = 0; i < 5; i++) S.noise(c, d, t + i * 0.12, { type: 'bandpass', freq: 1500 + Math.random() * 1500, dur: 0.06, gain: 0.08 }); return t + 0.8; },
  trapSet: (c, d, t) => S.clank(c, d, t, { base: 500, gain: 0.25, dur: 0.4 }),
  trapSnap: (c, d, t) => { S.clank(c, d, t, { base: 260, gain: 0.8, dur: 0.8 }); S.thump(c, d, t, { low: 60, knock: 2000, gain: 0.7, dur: 0.1 }); return t + 0.9; },
  trapRattle: (c, d, t) => S.clank(c, d, t, { base: 380 + Math.random() * 200, gain: 0.15, dur: 0.15 }),
  cameraAlarm: (c, d, t) => { for (let i = 0; i < 6; i++) S.tone(c, d, t + i * 0.18, { type: 'square', freq: i % 2 ? 1400 : 1900, dur: 0.12, gain: 0.08 }); return t + 1.2; },
  magnetHum: (c, d, t) => S.tone(c, d, t, { type: 'sawtooth', freq: 60, dur: 0.5, gain: 0.03 }).end,
  magnetWhirr: (c, d, t) => S.tone(c, d, t, { type: 'sawtooth', freq: 110, freqEnd: 220, dur: 0.5, gain: 0.05, vibrato: 8, vibratoRate: 22 }).end,
  magnetClunk: (c, d, t) => S.clank(c, d, t, { base: 350, gain: 0.35, dur: 0.4 }),
  washerShudder: (c, d, t) => { for (let i = 0; i < 12; i++) S.thump(c, d, t + i * 0.1, { low: 45, knock: 250, gain: 0.35, dur: 0.08 }); S.noise(c, d, t + 1.2, { type: 'lowpass', freq: 500, dur: 1.4, attack: 0.1, gain: 0.25 }); return t + 2.8; },
  dialClick: (c, d, t) => S.thump(c, d, t, { low: 400, knock: 3000, gain: 0.1, dur: 0.03 }),
  valveSqueak: (c, d, t) => S.tone(c, d, t, { type: 'sawtooth', freq: 700, freqEnd: 500, dur: 0.9, attack: 0.05, gain: 0.05, vibrato: 50, vibratoRate: 9 }).end,
  drain: (c, d, t) => { S.noise(c, d, t, { type: 'lowpass', freq: 700, dur: 3.5, attack: 0.3, gain: 0.12 }); for (let i = 0; i < 8; i++) S.tone(c, d, t + 0.4 + i * 0.4, { type: 'sine', freq: 300 + Math.random() * 200, freqEnd: 600, dur: 0.08, gain: 0.05 }); return t + 4; },
  kettleOn: (c, d, t) => S.thump(c, d, t, { low: 300, knock: 2500, gain: 0.12, dur: 0.04 }),
  toasterDown: (c, d, t) => { S.clank(c, d, t, { base: 800, gain: 0.08, dur: 0.15 }); return t + 0.2; },
  toasterPop: (c, d, t) => { S.clank(c, d, t, { base: 1200, gain: 0.25, dur: 0.3 }); return S.tone(c, d, t + 0.05, { type: 'sine', freq: 2400, dur: 0.6, gain: 0.08 }).end; },
  alarmWind: (c, d, t) => { for (let i = 0; i < 6; i++) S.thump(c, d, t + i * 0.07, { low: 600, knock: 4000, gain: 0.05, dur: 0.02 }); return t + 0.5; },
  tvOn: (c, d, t) => { S.tone(c, d, t, { type: 'sine', freq: 15000, dur: 0.4, gain: 0.02 }); return S.noise(c, d, t, { type: 'highpass', freq: 3000, dur: 0.3, gain: 0.1 }).end; },
  tvOff: (c, d, t) => S.tone(c, d, t, { type: 'sine', freq: 900, freqEnd: 60, dur: 0.15, gain: 0.08 }).end,
  fridge: (c, d, t) => { S.thump(c, d, t, { low: 80, knock: 400, gain: 0.15, dur: 0.1 }); return S.tone(c, d, t, { type: 'sine', freq: 60, dur: 1.0, gain: 0.05 }).end; },
  toolbox: (c, d, t) => { S.clank(c, d, t, { base: 450, gain: 0.2, dur: 0.4 }); return S.clank(c, d, t + 0.15, { base: 700, gain: 0.12, dur: 0.3 }); },
  unbolt: (c, d, t) => { S.tone(c, d, t, { type: 'sawtooth', freq: 300, freqEnd: 200, dur: 0.4, gain: 0.05 }); return S.clank(c, d, t + 0.4, { base: 500, gain: 0.3, dur: 0.4 }); },
  paper: (c, d, t) => S.noise(c, d, t, { type: 'highpass', freq: 3000, dur: 0.25, attack: 0.03, gain: 0.08 }).end,
  clunk: (c, d, t) => S.thump(c, d, t, { low: 70, knock: 600, gain: 0.3, dur: 0.15 }),
  creak: (c, d, t) => S.tone(c, d, t, { type: 'sawtooth', freq: 150, freqEnd: 110, dur: 1.2, attack: 0.2, gain: 0.06, vibrato: 12, vibratoRate: 7 }).end,
  splat: (c, d, t) => S.noise(c, d, t, { type: 'lowpass', freq: 600, freqEnd: 200, dur: 0.25, gain: 0.35 }).end,
  squelch: (c, d, t) => S.noise(c, d, t, { type: 'bandpass', freq: 500, freqEnd: 1500, q: 4, dur: 0.2, gain: 0.15 }).end,
  wardrobeIn: (c, d, t) => { RECIPES.doorCreak(c, d, t); return S.thump(c, d, t + 0.5, { low: 90, knock: 600, gain: 0.15, dur: 0.08 }); },
  wardrobeOut: (c, d, t) => RECIPES.doorCreak(c, d, t),
  rustle: (c, d, t) => S.noise(c, d, t, { type: 'bandpass', freq: 2000, q: 0.8, dur: 0.35, attack: 0.05, gain: 0.07 }).end,
  stinger: (c, d, t) => { for (const f of [146.8, 155.6, 207.7, 311]) S.tone(c, d, t, { type: 'sawtooth', freq: f, dur: 1.4, attack: 0.01, gain: 0.07 }); return t + 1.5; },
  catchStinger: (c, d, t) => {
    for (const f of [98, 103.8, 138.6, 207.7, 277, 415]) S.tone(c, d, t, { type: 'sawtooth', freq: f, dur: 0.9, attack: 0.003, gain: 0.09 });
    S.tone(c, d, t, { type: 'sine', freq: 90, freqEnd: 28, glide: 0.8, dur: 1.2, gain: 0.8 });
    return S.noise(c, d, t, { type: 'lowpass', freq: 3000, dur: 0.4, gain: 0.4 }).end;
  },
  catchSoft: (c, d, t) => { for (const f of [220, 277, 330]) S.tone(c, d, t, { type: 'triangle', freq: f, dur: 0.6, gain: 0.08 }); return t + 0.7; },
  ring: (c, d, t) => S.tone(c, d, t, { type: 'sine', freq: 3200, dur: 2.2, attack: 0.01, gain: 0.05 }).end,
  gasp: (c, d, t) => S.noise(c, d, t, { type: 'bandpass', freq: 1400, freqEnd: 900, q: 2, dur: 0.45, attack: 0.03, gain: 0.25 }).end,
  hover: (c, d, t) => S.tone(c, d, t, { type: 'triangle', freq: 1200, dur: 0.04, gain: 0.04 }).end,
  uiClick: (c, d, t) => S.tone(c, d, t, { type: 'triangle', freq: 700, freqEnd: 1100, dur: 0.07, gain: 0.08 }).end,
};
RECIPES.ring.bus = 'sfx';
RECIPES.gasp.bus = 'voice';

// Loops: schedule one chunk, return its length in seconds.
const LOOPS = {
  tvLoop: (c, d, t, i) => {
    // babbling announcer and a laugh track, through a tiny speaker
    const f0 = 140 + Math.random() * 60;
    S.voice(c, d, t, { vowel: 'aeiou'[i % 5], vowelEnd: 'aeiou'[(i * 3 + 1) % 5], f0, f0End: f0 * (0.9 + Math.random() * 0.25), dur: 0.16, gain: 0.25, breath: 0.2 });
    if (i % 23 === 0) S.noise(c, d, t, { type: 'bandpass', freq: 1500, q: 0.6, dur: 1.2, attack: 0.1, gain: 0.12 });
    return 0.18 + Math.random() * 0.1;
  },
  radioLoop: (c, d, t, i) => {
    const scale = [261.6, 293.7, 329.6, 392, 440, 523.3];
    S.pluck(c, d, t, scale[(i * 5 + (i >> 2)) % 6], { dur: 0.25, gain: 0.12, type: 'square' });
    if (i % 2 === 0) S.tone(c, d, t, { type: 'triangle', freq: scale[(i >> 3) % 3] / 2, dur: 0.3, gain: 0.12 });
    S.noise(c, d, t, { type: 'highpass', freq: 4000, dur: 0.2, gain: 0.015 });
    return 0.2;
  },
  kettleWhistle: (c, d, t) => { S.tone(c, d, t, { type: 'sine', freq: 2300, dur: 0.6, attack: 0.05, gain: 0.12, vibrato: 30, vibratoRate: 6, sustain: 1 }); return 0.55; },
  alarmRing: (c, d, t, i) => { for (let k = 0; k < 6; k++) S.clank(c, d, t + k * 0.05, { base: 2400, gain: 0.08, dur: 0.06 }); return i % 4 === 3 ? 0.7 : 0.35; },
};
