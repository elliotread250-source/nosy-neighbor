// Procedural cues for the house (spec 23), each with a subtitle line.
// Web Audio only; silent until the first click unlocks the context.
const SUBS = {
  click: '[button clicks]', clunk: '[lever clunks]', buzz: '[harsh buzz]', chirp: '[keycard chirps]', clank: '[bolt clanks free]',
  creak: '[crowbar squeals]', alarm: '[alarm whoops]', chuff: '[train chuffs]', music: '[music box plays]', party: '[party music]',
};

export class Act3Audio {
  constructor(subtitle) {
    this.subtitle = subtitle;
    this.ctx = null;
    this.volume = 0.6;
    this.subs = true;
    // fewer simultaneous voices on phones
    this.maxVoices = (matchMedia?.('(pointer: coarse)').matches ?? false) ? 6 : 16;
    this.voices = 0;
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume?.(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.out = this.ctx.createGain();
      this.out.gain.value = this.volume;
      this.out.connect(this.ctx.destination);
      this.ctx.resume?.();
      // iOS can leave the context 'interrupted' after a call: retry on the next touch
      this.ctx.onstatechange = () => { if (this.ctx.state !== 'running') window.addEventListener('pointerdown', () => this.ctx.resume?.(), { once: true }); };
    } catch { this.ctx = null; }
  }

  // phone calls and tab switches suspend the context; resume on the way back
  suspend() { try { this.ctx?.suspend(); } catch { /* ignore */ } }

  setVolume(v) { this.volume = v; if (this.out) this.out.gain.value = v; }

  tone(freq, dur, type = 'sine', gain = 0.3, slide = 0, delay = 0) {
    const c = this.ctx;
    if (!c || c.state !== 'running' || this.voices >= this.maxVoices) return;
    this.voices++;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.onended = () => { this.voices--; };
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noise(dur, gain = 0.2, freq = 1200) {
    const c = this.ctx;
    if (!c || c.state !== 'running' || this.voices >= this.maxVoices) return;
    this.voices++;
    setTimeout(() => { this.voices--; }, dur * 1000 + 50);
    const b = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = gain;
    s.connect(f).connect(g).connect(this.out);
    s.start();
  }

  cue(name) { if (this.subs) this.subtitle?.(SUBS[name] ?? `[${name}]`); }
  click() { this.tone(1800, 0.05, 'square', 0.15); this.cue('click'); }
  clunk() { this.tone(110, 0.25, 'triangle', 0.4, -50); this.noise(0.15, 0.2, 300); this.cue('clunk'); }
  buzz() { this.tone(90, 0.4, 'sawtooth', 0.2); this.cue('buzz'); }
  chirp() { this.tone(1400, 0.08, 'sine', 0.2); this.tone(2100, 0.1, 'sine', 0.2, 0, 0.09); this.cue('chirp'); }
  clank() { this.tone(520, 0.3, 'square', 0.15, -300); this.noise(0.2, 0.3, 2500); this.cue('clank'); }
  creak() { this.tone(700 + Math.random() * 300, 0.12, 'sawtooth', 0.05, 200); }
  alarm() { for (let i = 0; i < 4; i++) this.tone(600, 0.28, 'square', 0.12, 500, i * 0.3); this.cue('alarm'); }
  chuff(rate) { this.noise(0.08, 0.06 + rate * 0.04, 600); }
  musicBox(placed) {
    const notes = [523, 659, 784, 659, 587, 698, 880, 698];
    const step = 0.32 / (1 + placed * 0.35);
    notes.forEach((n, i) => this.tone(n, 0.3, 'sine', 0.12, 0, i * step));
    this.cue('music');
  }
  party() { [523, 659, 784, 1047, 784, 1047].forEach((n, i) => this.tone(n, 0.25, 'triangle', 0.15, 0, i * 0.15)); this.cue('party'); }
}
