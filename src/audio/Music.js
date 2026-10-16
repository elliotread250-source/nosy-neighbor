// A tiny lookahead sequencer and the game's themes:
//  sneak: a 90 BPM music-box lullaby in A minor that's gone slightly wrong
//  suspicion: a detuned saw pad and ticking hats, faded in by the meter
//  chase: 160 BPM staccato strings, kick, the "dun-dun" bass, a screeching line
//  title: the lullaby slower; ending: one held tone that thins to nothing
import { Events } from '../core/Events.js';
import * as S from './Synth.js';

const H = S.hz;
// 32 eighth notes (4 bars): melody, with a few notes nudged off-key at play time
const SNEAK_MEL = ['A4', null, 'C5', 'E5', null, 'D5', 'C5', 'B4', 'A4', null, 'E4', null, 'G#4', null, 'B4', null,
  'C5', null, 'E5', 'A5', null, 'G5', 'F5', 'E5', 'D5', null, 'B4', null, 'G#4', 'A4', null, null];
const SNEAK_BASS = ['A2', 'E2', 'A2', 'E2', 'F2', 'C3', 'E2', 'G#2'];
const PAD = [['A2', 'C3', 'E3'], ['A2', 'C3', 'E3'], ['F2', 'A2', 'C3'], ['E2', 'G#2', 'B2']];
const CHASE_OST = ['D2', 'D2', 'D3', 'D2', 'D2', 'F2', 'D2', 'G#2', 'D2', 'D2', 'D3', 'D2', 'C#2', 'C#2', 'C#3', 'E2'];
const CHASE_LINE = ['D6', 'C#6', 'F6', 'E6'];

export class Music {
  constructor(audio) {
    this.audio = audio;
    this.game = audio.game;
    this.track = 'silence';
    this.base = 'sneak';
    this.step = 0;
    this.next = 0;
    this.layerK = 0;
    this.chaseOffT = 99;
    Events.on('music', (e) => this.request(e.track));
  }

  start() {
    const c = this.audio.ctx;
    const bus = this.audio.buses.music;
    this.main = c.createGain();
    this.layer = c.createGain();
    this.layer.gain.value = 0;
    this.main.connect(bus);
    this.layer.connect(bus);
    // a little room on the music box
    this.next = c.currentTime + 0.1;
    if (this.pending) this.request(this.pending);
  }

  request(name) {
    const map = { intro: 'title', explore: 'sneak', tension: 'tension', ending: 'ending', silence: 'silence', title: 'title', chase: 'chase', sneak: 'sneak' };
    const t = map[name] ?? name;
    if (!this.audio.ready) { this.pending = t; return; }
    if (t !== 'chase') this.base = t;
    this.switchTo(t);
  }

  switchTo(t) {
    if (t === this.track) return;
    const c = this.audio.ctx;
    const now = c.currentTime;
    this.track = t;
    this.step = 0;
    this.next = now + 0.05;
    this.main.gain.cancelScheduledValues(now);
    this.main.gain.setValueAtTime(t === 'chase' ? 1 : 0.0001, now);
    this.main.gain.exponentialRampToValueAtTime(1, now + (t === 'chase' ? 0.01 : 1.2));
    if (this.drone) {
      const d = this.drone;
      d.g.gain.setTargetAtTime(0, now, 0.4);
      setTimeout(() => d.oscs.forEach((o) => o.stop()), 3000);
      this.drone = null;
    }
    if (t === 'ending') this._drone();
  }

  _drone() {
    // one held tone that thins out as you go down
    const c = this.audio.ctx;
    const now = c.currentTime;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.16, now + 3);
    g.gain.exponentialRampToValueAtTime(0.03, now + 22);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2400, now);
    lp.frequency.exponentialRampToValueAtTime(300, now + 22);
    const oscs = [220, 220.8, 330.5].map((f, i) => {
      const o = c.createOscillator();
      o.type = i === 2 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.connect(lp);
      o.start(now);
      return o;
    });
    lp.connect(g).connect(this.main);
    this.drone = { g, oscs };
  }

  update(dt) {
    if (!this.audio.ready || !this.main) return;
    const g = this.game;
    const ai = g.ai;
    const c = this.audio.ctx;
    const now = c.currentTime;
    // chase: hard cut in, fade back to the base track 4 s after he loses you
    const chasing = ai && (ai.state === 'chase' || ai.state === 'spot') && g.state === 'play';
    if (chasing) {
      this.chaseOffT = 0;
      if (this.track !== 'chase' && ['sneak', 'tension'].includes(this.base)) this.switchTo('chase');
    } else if (this.track === 'chase') {
      this.chaseOffT += dt;
      if (this.chaseOffT > 4) this.switchTo(this.base);
    }
    // suspicion layer
    let want = 0;
    if (ai && ['sneak', 'tension'].includes(this.track)) {
      if (ai.meter > 0.15 || ['investigate', 'suspicious', 'search', 'hear', 'lost'].includes(ai.state)) want = 1;
      if (this.track === 'tension') want = Math.max(want, 0.6);
    }
    this.layerK += (want - this.layerK) * Math.min(1, dt * 1.2);
    this.layer.gain.setTargetAtTime(this.layerK * 0.9, now, 0.1);
    // the kid's room: music drops out
    const z = g.zones?.at(g.engine.camera.position);
    const hush = z?.room?.id === 'kid' && this.track !== 'chase';
    if (hush !== this.hushed) {
      this.hushed = hush;
      this.main.gain.setTargetAtTime(hush ? 0.0001 : 1, now, 0.6);
    }
    // schedule ahead
    const bpm = { sneak: 90, tension: 96, chase: 160, title: 62 }[this.track];
    if (!bpm) return;
    const sixteenth = 60 / bpm / 4;
    if (this.next < now) this.next = now + 0.02;
    while (this.next < now + 0.15) {
      this._schedule(this.track, this.step, this.next);
      this.next += sixteenth;
      this.step++;
    }
  }

  _schedule(track, step, t) {
    const c = this.audio.ctx;
    const m = this.main;
    const l = this.layer;
    if (track === 'sneak' || track === 'tension' || track === 'title') {
      const slow = track === 'title';
      if (step % 2 === 0) {
        const e = (step / 2) % 32;
        const note = SNEAK_MEL[e];
        if (note) {
          // slightly wrong: some notes drift flat
          const cents = (e % 7 === 3 ? -35 : 0) + (Math.random() - 0.5) * 14;
          S.pluck(c, m, t, H(note) * Math.pow(2, cents / 1200), { dur: slow ? 1.4 : 0.7, gain: 0.11, bright: 0.35 });
        }
        if (!slow && e % 4 === 0) S.pluck(c, m, t, H(SNEAK_BASS[Math.floor(e / 4) % 8]), { dur: 0.35, gain: 0.16, type: 'sine' });
        if (slow && e % 8 === 0) S.tone(c, m, t, { type: 'sine', freq: H(SNEAK_BASS[Math.floor(e / 4) % 8]), dur: 2.5, attack: 0.3, gain: 0.08 });
      }
      if (!slow && step % 2 === 1) S.shaker(c, m, t, step % 8 === 3 ? 0.05 : 0.025);
      // suspicion layer: a pad per bar and ticking hats
      if (track !== 'title') {
        if (step % 16 === 0) {
          const chord = PAD[(step / 16) % 4];
          for (const n of chord) for (const det of [-9, 9]) {
            const lp = c.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 650;
            lp.connect(l);
            S.tone(c, lp, t, { type: 'sawtooth', freq: H(n), detune: det, dur: 2.6, attack: 0.5, gain: 0.03, sustain: 0.9, release: 0.4 });
          }
          S.tone(c, l, t, { type: 'sine', freq: H(chord[0]) / 2, dur: 2.6, attack: 0.3, gain: 0.08 });
        }
        S.hat(c, l, t, step % 4 === 2 ? 0.05 : 0.02, 0.03);
      }
      return;
    }
    if (track === 'chase') {
      const s = step % 16;
      // staccato low strings
      const n = CHASE_OST[s];
      S.tone(c, m, t, { type: 'sawtooth', freq: H(n), dur: 0.07, attack: 0.003, gain: 0.08 });
      S.tone(c, m, t, { type: 'sawtooth', freq: H(n) * 1.004, dur: 0.07, attack: 0.003, gain: 0.05 });
      if (s % 4 === 0) S.kick(c, m, t, 0.5);
      if (s % 4 === 2) S.hat(c, m, t, 0.06);
      // dun-dun
      if (s === 0 || s === 3) S.tone(c, m, t, { type: 'square', freq: s === 0 ? 73.4 : 69.3, dur: 0.18, attack: 0.004, gain: 0.12 });
      // screeching violin every two bars
      if (step % 32 === 0) {
        const f = H(CHASE_LINE[(step / 32) % 4]);
        S.tone(c, m, t, { type: 'sawtooth', freq: f, freqEnd: f * 0.94, glide: 1.4, dur: 1.4, attack: 0.05, gain: 0.035, vibrato: f * 0.025, vibratoRate: 7, sustain: 0.8 });
      }
    }
  }
}
