// The world's room tone. Outside: wind, birds, a far-off lawnmower that
// comes and goes, a dog, a sprinkler. Inside his house: the grandfather
// clock, the fridge hum, wall creaks, a thump from below now and then, and
// a sour detuned drone by the basement door.
import { Vector3 } from 'three';
import * as S from './Synth.js';
import { setPos } from './AudioEngine.js';

export class Ambience {
  constructor(audio) {
    this.audio = audio;
    this.game = audio.game;
    this.t = 0;
    this.birdT = 2;
    this.dogT = 40;
    this.mowT = 30;
    this.creakT = 15;
    this.thumpT = 45;
    this.tinkleT = 3;
    this.tickT = 0;
    this.tick = 0;
  }

  start() {
    const a = this.audio;
    const c = a.ctx;
    const bus = a.buses.ambience;
    // wind: looping brown noise through a slowly breathing lowpass
    this.windG = c.createGain();
    this.windG.gain.value = 0;
    const src = c.createBufferSource();
    src.buffer = S.brownBuffer(c);
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const lg = c.createGain();
    lg.gain.value = 260;
    lfo.connect(lg).connect(lp.frequency);
    src.connect(lp).connect(this.windG).connect(bus);
    src.start();
    lfo.start();
    // static spatial loops: fridge hum, basement drone, sprinkler
    const house = this.game.world?.house || {};
    this.fixed = [];
    const loop = (pos, build, opts) => {
      if (!pos) return;
      const sp = a.spatial(pos, { bus: 'ambience', occlude: false, ...opts });
      const g = c.createGain();
      g.gain.value = 0;
      g.connect(sp.input);
      build(c, g);
      this.fixed.push({ pos: pos.clone(), sp, g, max: opts?.max ?? 20 });
    };
    if (house.fridge) loop(house.fridge.getWorldPosition(new Vector3()).add(new Vector3(0, 1, 0)), (cc, g) => {
      for (const [f, gg] of [[59, 0.05], [118, 0.03], [177, 0.01]]) { const o = cc.createOscillator(); o.frequency.value = f; const og = cc.createGain(); og.gain.value = gg; o.connect(og).connect(g); o.start(); }
    }, { ref: 1.2, rolloff: 1.8, max: 12 });
    loop(new Vector3(0.6, 1.2, -21.8), (cc, g) => {
      for (const [f, gg] of [[55, 0.08], [58.3, 0.08], [82.4, 0.03]]) { const o = cc.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const og = cc.createGain(); og.gain.value = gg; o.connect(og).connect(g); o.start(); }
    }, { ref: 1.0, rolloff: 2.2, max: 10 });
    loop(new Vector3(22, 0.3, 9), (cc, g) => {
      const n = cc.createBufferSource(); n.buffer = S.noiseBuffer(cc); n.loop = true;
      const hp = cc.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500;
      const am = cc.createGain(); am.gain.value = 0.03;
      const lfo2 = cc.createOscillator(); lfo2.type = 'square'; lfo2.frequency.value = 3.2;
      const lg2 = cc.createGain(); lg2.gain.value = 0.025; lfo2.connect(lg2).connect(am.gain);
      n.connect(hp).connect(am).connect(g); n.start(); lfo2.start();
    }, { ref: 2, rolloff: 1.5, max: 25 });
  }

  _shot(pos, fn, opts = {}) {
    const a = this.audio;
    if (!a.budget()) return;
    const t = a.now + 0.01;
    const dest = pos ? a.spatial(pos, { bus: 'ambience', ...opts }).input : a.buses.ambience;
    a.track(fn(a.ctx, dest, t) ?? t + 2);
  }

  update(dt) {
    const a = this.audio;
    if (!a.ready || !this.windG) return;
    const g = this.game;
    this.t += dt;
    const indoor = g.indoorK ?? 0;
    const out = 1 - indoor;
    const now = a.now;
    const ending = g.story?.mode === 'ending';
    this.windG.gain.setTargetAtTime(ending ? 0 : 0.05 + out * 0.2, now, 0.5);
    for (const f of this.fixed) {
      const d = f.pos.distanceTo(a.listenerPos);
      f.g.gain.setTargetAtTime(d < f.max && !ending ? 1 : 0, now, 0.3);
    }
    if (ending) return;
    const L = a.listenerPos;
    const around = (r0, r1, y = 4) => { const ang = Math.random() * Math.PI * 2, r = r0 + Math.random() * (r1 - r0); return new Vector3(L.x + Math.cos(ang) * r, y + Math.random() * 3, L.z + Math.sin(ang) * r); };
    // birds (outside, daylight)
    this.birdT -= dt;
    if (this.birdT <= 0) {
      this.birdT = 0.6 + Math.random() * 3.2;
      if (out > 0.3) this._shot(around(8, 22), (c, d, t) => {
        const n = 2 + Math.floor(Math.random() * 4), base = 2400 + Math.random() * 1600;
        for (let i = 0; i < n; i++) S.tone(c, d, t + i * 0.09, { type: 'sine', freq: base * (1 + Math.random() * 0.2), freqEnd: base * (1.4 + Math.random() * 0.4), dur: 0.06, gain: 0.04 * out });
        return t + n * 0.1;
      });
    }
    // lawnmower: comes and goes every couple of minutes
    this.mowT -= dt;
    if (this.mowT <= 0) {
      this.mowT = 90 + Math.random() * 60;
      this._shot(new Vector3(-55, 1, 28), (c, d, t) => S.tone(c, d, t, { type: 'sawtooth', freq: 92, freqEnd: 96, dur: 16, attack: 4, gain: 0.05, vibrato: 3, vibratoRate: 9, sustain: 1, release: 4 }).end, { ref: 15, rolloff: 0.5, occlude: false });
    }
    // a dog, far away
    this.dogT -= dt;
    if (this.dogT <= 0) {
      this.dogT = 35 + Math.random() * 60;
      this._shot(new Vector3(48, 1, 35), (c, d, t) => {
        for (let i = 0; i < 2; i++) S.voice(c, d, t + i * 0.32, { vowel: 'a', vowelEnd: 'u', f0: 320, f0End: 240, dur: 0.14, gain: 0.35, attack: 0.005, type: 'square', drive: 0.5 });
        return t + 0.8;
      }, { ref: 15, rolloff: 0.6, occlude: false });
    }
    // inside the neighbor's house
    const z = g.zones?.at(g.engine.camera.position);
    const inHouse = z?.house === 'neighbor';
    const clock = g.world?.house?.clock;
    if (clock) {
      const cp = clock.getWorldPosition(new Vector3()).add(new Vector3(0, 1.4, 0));
      if (cp.distanceTo(L) < 16) {
        this.tickT -= dt;
        if (this.tickT <= 0) {
          this.tickT = 1;
          const hi = this.tick++ % 2;
          this._shot(cp, (c, d, t) => S.thump(c, d, t, { low: hi ? 900 : 700, knock: hi ? 3200 : 2600, gain: 0.08, dur: 0.03 }), { ref: 1.5, rolloff: 1.4 });
        }
      }
    }
    if (inHouse) {
      this.creakT -= dt;
      if (this.creakT <= 0) {
        this.creakT = 18 + Math.random() * 30;
        this._shot(around(3, 7, L.y), (c, d, t) => S.tone(c, d, t, { type: 'sawtooth', freq: 120 + Math.random() * 60, freqEnd: 90, dur: 0.9, attack: 0.2, gain: 0.05, vibrato: 10, vibratoRate: 6 }).end);
      }
      this.thumpT -= dt;
      if (this.thumpT <= 0) {
        this.thumpT = 40 + Math.random() * 50;
        this._shot(new Vector3(0.75, -2.5, -25), (c, d, t) => S.thump(c, d, t, { low: 40, knock: 180, gain: 0.5, dur: 0.3 }), { ref: 4, rolloff: 0.8 });
      }
      // the kid's room: the mobile tinkles
      if (z?.room?.id === 'kid') {
        this.tinkleT -= dt;
        if (this.tinkleT <= 0) {
          this.tinkleT = 1.4 + Math.random() * 2.5;
          const m = g.world.house.kidMobile?.getWorldPosition(new Vector3()) ?? L;
          this._shot(m, (c, d, t) => { const f = [1046, 1174, 1318, 1568, 1760][Math.floor(Math.random() * 5)]; S.pluck(c, d, t, f, { dur: 1.2, gain: 0.05, type: 'sine', bright: 0.4 }); return t + 1.3; }, { ref: 1.5 });
        }
      }
    }
    void setPos;
  }
}
