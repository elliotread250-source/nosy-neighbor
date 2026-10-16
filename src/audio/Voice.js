// Mr. Grimsby's voice: no words, just formant-synth noises. "Hm?" when he
// hears something, the two-syllable "HEY!", grunts on the run, panting,
// muttering, humming while he potters, the distorted "AAH!" of a catch.
import { Vector3 } from 'three';
import { Events } from '../core/Events.js';
import * as S from './Synth.js';

const LINE_CAPTIONS = { hey: '[Neighbor: Hey!]', hm: '[Neighbor: Hm?]', aah: '[Neighbor: AAH!]', mutter: '[Neighbor mutters]', ow: '[Neighbor: Ow!]', snore: '[Snoring]' };

export class Voice {
  constructor(audio) {
    this.audio = audio;
    this.game = audio.game;
    this.humT = 6;
    this.pantT = 0;
    this.stepN = 0;
    Events.on('voice', (e) => { if (this.audio.ready) this.say(e.line, e.position); });
    Events.on('neighbor:anim', (e) => {
      if (!this.audio.ready) return;
      if (e.name === 'hmph') this.say('hmph', e.position);
      if (e.name === 'ahh') this.say('ahh', e.position);
      if (e.name === 'mutter') this.say('mutter', e.position);
    });
    Events.on('neighbor:step', (e) => {
      if (!this.audio.ready || !e.run) return;
      if (++this.stepN % 2 === 0 && Math.random() < 0.35) this.say('grunt', e.position);
    });
  }

  say(line, pos) {
    const a = this.audio;
    if (!a.budget()) return;
    const head = pos ? pos.clone().add(new Vector3(0, 1.7, 0)) : null;
    const t = a.now + 0.01;
    const dest = head && line !== 'aah' ? a.spatial(head, { bus: 'voice', ref: 3, rolloff: 1 }).input : a.buses.voice;
    const c = a.ctx;
    const f = 105 + Math.random() * 10; // his speaking pitch
    let end = t + 1;
    switch (line) {
      case 'hm': end = S.voice(c, dest, t, { vowel: 'm', f0: f, f0End: f * 1.45, dur: 0.38, gain: 0.5, breath: 0.05 }); break;
      case 'hey':
        S.noise(c, dest, t, { type: 'bandpass', freq: 1800, dur: 0.06, gain: 0.25 });
        S.voice(c, dest, t + 0.03, { vowel: 'e', f0: f * 1.7, f0End: f * 1.9, dur: 0.14, gain: 0.8, attack: 0.01, drive: 0.4 });
        end = S.voice(c, dest, t + 0.19, { vowel: 'e', vowelEnd: 'i', f0: f * 2.1, f0End: f * 1.6, dur: 0.3, gain: 0.9, attack: 0.01, drive: 0.4 });
        break;
      case 'ow': end = S.voice(c, dest, t, { vowel: 'a', vowelEnd: 'u', f0: f * 2, f0End: f * 1.2, dur: 0.4, gain: 0.8, drive: 0.5 }); break;
      case 'grunt': end = S.voice(c, dest, t, { vowel: 'u', f0: f * 0.9, f0End: f * 0.75, dur: 0.12, gain: 0.45, breath: 0.3 }); break;
      case 'pant':
        for (let i = 0; i < 4; i++) S.noise(c, dest, t + i * 0.5, { type: 'bandpass', freq: i % 2 ? 900 : 1300, q: 1.5, dur: 0.28, attack: 0.06, gain: 0.3 });
        end = t + 2.1;
        break;
      case 'exhale': end = S.noise(c, dest, t, { type: 'bandpass', freq: 1000, freqEnd: 500, q: 1, dur: 0.7, attack: 0.08, gain: 0.25 }).end; break;
      case 'mutter': {
        let tt = t;
        const n = 6 + Math.floor(Math.random() * 6);
        for (let i = 0; i < n; i++) {
          const v = 'aeoum'[Math.floor(Math.random() * 5)];
          const d = 0.08 + Math.random() * 0.12;
          S.voice(c, dest, tt, { vowel: v, vowelEnd: 'aeoum'[Math.floor(Math.random() * 5)], f0: f * (0.85 + Math.random() * 0.3), f0End: f * (0.8 + Math.random() * 0.3), dur: d, gain: 0.32, breath: 0.15 });
          tt += d + Math.random() * 0.07;
        }
        end = tt;
        break;
      }
      case 'snore':
        for (let i = 0; i < 3; i++) {
          S.noise(c, dest, t + i * 2.6, { type: 'lowpass', freq: 220, dur: 1.0, attack: 0.4, gain: 0.35, brown: true });
          S.voice(c, dest, t + i * 2.6 + 0.2, { vowel: 'o', f0: 60, f0End: 52, dur: 0.8, gain: 0.25, breath: 0.4 });
          S.noise(c, dest, t + i * 2.6 + 1.3, { type: 'highpass', freq: 2500, dur: 0.6, attack: 0.2, gain: 0.05 });
        }
        end = t + 8;
        break;
      case 'aah':
        S.voice(c, dest, t, { vowel: 'a', f0: 300, f0End: 210, dur: 0.75, gain: 1.0, attack: 0.005, drive: 0.9, breath: 0.4 });
        end = S.tone(c, dest, t, { type: 'sine', freq: 70, freqEnd: 32, glide: 0.5, dur: 0.8, gain: 0.9 }).end;
        break;
      case 'hmph': end = S.voice(c, dest, t, { vowel: 'm', f0: f * 1.2, f0End: f * 0.8, dur: 0.22, gain: 0.45, breath: 0.4 }); break;
      case 'ahh': end = S.voice(c, dest, t, { vowel: 'a', f0: f * 1.1, f0End: f * 0.85, dur: 0.6, gain: 0.35, breath: 0.4 }); break;
      case 'hum': {
        // off-key little tune
        const notes = [0, 2, 4, 2, 0, -1, 0, 5];
        const base = f * 1.2;
        notes.forEach((n, i) => S.tone(c, dest, t + i * 0.32, { type: 'sine', freq: base * Math.pow(2, (n + (Math.random() - 0.5) * 0.6) / 12), dur: 0.3, attack: 0.04, gain: 0.12, vibrato: 3, vibratoRate: 5.5, sustain: 0.8 }));
        end = t + notes.length * 0.32 + 0.3;
        break;
      }
      default: return;
    }
    a.track(end);
    if (LINE_CAPTIONS[line]) Events.emit('caption', { text: LINE_CAPTIONS[line] });
  }

  update(dt) {
    if (!this.audio.ready) return;
    const ai = this.game.ai;
    if (!ai || ai.frozen) return;
    // hums while pottering about
    if (ai.state === 'activity' && ai.activity?.id !== 'tv') {
      this.humT -= dt;
      if (this.humT <= 0) {
        this.humT = 9 + Math.random() * 10;
        this.say('hum', ai.curFeet);
      }
    }
    // heavy breathing when he's close and chasing
    if (ai.state === 'chase' && ai.curFeet.distanceTo(this.game.player.curFeet) < 8) {
      this.pantT -= dt;
      if (this.pantT <= 0) { this.pantT = 2.2; this.say('pant', ai.curFeet); }
    }
  }
}
