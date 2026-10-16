// Tiny procedural synth kit: every sound in the game is built from these.
// All functions schedule at absolute AudioContext time t and connect to dest.

let noiseBuf = null;
let brownBuf = null;

export function noiseBuffer(ctx) {
  if (noiseBuf) return noiseBuf;
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

export function brownBuffer(ctx) {
  if (brownBuf) return brownBuf;
  const len = ctx.sampleRate * 4;
  brownBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = brownBuf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  return brownBuf;
}

// Attack/decay envelope on a gain AudioParam.
export function env(param, t, { attack = 0.005, decay = 0.2, peak = 1, sustain = 0, hold = 0, release = 0.05 } = {}) {
  param.cancelScheduledValues(t);
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  if (sustain > 0) {
    param.exponentialRampToValueAtTime(Math.max(0.0002, peak * sustain), t + attack + decay);
    param.setValueAtTime(Math.max(0.0002, peak * sustain), t + attack + decay + hold);
    param.exponentialRampToValueAtTime(0.0001, t + attack + decay + hold + release);
    return t + attack + decay + hold + release;
  }
  param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return t + attack + decay;
}

// Oscillator note with envelope and optional pitch glide.
export function tone(ctx, dest, t, { type = 'sine', freq = 440, freqEnd = null, glide = null, dur = 0.3, attack = 0.005, gain = 0.3, detune = 0, vibrato = 0, vibratoRate = 6, sustain = 0, release = 0.05 } = {}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + (glide ?? dur));
  o.detune.value = detune;
  const g = ctx.createGain();
  const end = env(g.gain, t, { attack, decay: sustain ? 0.08 : dur, peak: gain, sustain, hold: sustain ? dur : 0, release });
  if (vibrato) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = vibratoRate;
    const lg = ctx.createGain();
    lg.gain.value = vibrato;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t);
    lfo.stop(end + 0.05);
  }
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(end + 0.05);
  return { osc: o, gain: g, end };
}

// Filtered noise burst.
export function noise(ctx, dest, t, { type = 'bandpass', freq = 1000, freqEnd = null, q = 1, dur = 0.2, attack = 0.002, gain = 0.3, brown = false, sustain = 0, release = 0.05 } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = brown ? brownBuffer(ctx) : noiseBuffer(ctx);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  const end = env(g.gain, t, { attack, decay: sustain ? 0.08 : dur, peak: gain, sustain, hold: sustain ? dur : 0, release });
  src.connect(f).connect(g).connect(dest);
  src.start(t, Math.random() * 1.5);
  src.stop(end + 0.05);
  return { src, filter: f, gain: g, end };
}

// Plucked string / music box: triangle with fast decay and a tiny pitch drop.
export function pluck(ctx, dest, t, freq, { dur = 0.5, gain = 0.2, type = 'triangle', bright = 0 } = {}) {
  tone(ctx, dest, t, { type, freq: freq * 1.003, freqEnd: freq, glide: 0.04, dur, attack: 0.002, gain });
  if (bright) tone(ctx, dest, t, { type: 'sine', freq: freq * 2.01, dur: dur * 0.5, attack: 0.001, gain: gain * bright });
}

export function kick(ctx, dest, t, gain = 0.6) {
  tone(ctx, dest, t, { type: 'sine', freq: 140, freqEnd: 42, glide: 0.12, dur: 0.22, attack: 0.002, gain });
  noise(ctx, dest, t, { type: 'lowpass', freq: 900, dur: 0.02, gain: gain * 0.25 });
}

export function hat(ctx, dest, t, gain = 0.08, dur = 0.04) {
  noise(ctx, dest, t, { type: 'highpass', freq: 7000, dur, gain });
}

export function shaker(ctx, dest, t, gain = 0.05) {
  noise(ctx, dest, t, { type: 'bandpass', freq: 5200, q: 1.5, dur: 0.06, attack: 0.012, gain });
}

// A thump with body: low sine plus a filtered knock.
export function thump(ctx, dest, t, { low = 80, knock = 600, gain = 0.4, dur = 0.12 } = {}) {
  tone(ctx, dest, t, { type: 'sine', freq: low * 1.6, freqEnd: low, glide: 0.05, dur, attack: 0.002, gain });
  noise(ctx, dest, t, { type: 'bandpass', freq: knock, q: 1.2, dur: dur * 0.6, gain: gain * 0.6 });
  return t + dur + 0.05;
}

// Metal clank: a few inharmonic partials.
export function clank(ctx, dest, t, { base = 420, gain = 0.25, dur = 0.5 } = {}) {
  for (const [m, g] of [[1, 1], [2.76, 0.6], [5.4, 0.35], [8.93, 0.2]]) tone(ctx, dest, t, { type: 'sine', freq: base * m, dur: dur / Math.sqrt(m), attack: 0.001, gain: gain * g });
  noise(ctx, dest, t, { type: 'highpass', freq: 3000, dur: 0.03, gain: gain * 0.5 });
  return t + dur + 0.05;
}

// Glassy/ceramic clink: high partials, short.
export function clink(ctx, dest, t, { base = 1800, gain = 0.2, dur = 0.25 } = {}) {
  for (const [m, g] of [[1, 1], [2.32, 0.5], [4.25, 0.3]]) tone(ctx, dest, t, { type: 'sine', freq: base * m * (0.98 + Math.random() * 0.04), dur, attack: 0.001, gain: gain * g });
  return t + dur + 0.05;
}

// Formant voice: a buzzy source through band-pass formants with pitch glide.
export const VOWELS = {
  a: [800, 1150, 2900], e: [400, 2000, 2550], i: [300, 2300, 3000], o: [450, 800, 2830], u: [325, 700, 2530], m: [250, 1000, 2200], h: [600, 1500, 2500],
};

export function voice(ctx, dest, t, { vowel = 'a', vowelEnd = null, f0 = 120, f0End = null, dur = 0.3, gain = 0.4, attack = 0.02, breath = 0.1, type = 'sawtooth', drive = 0 } = {}) {
  const src = ctx.createOscillator();
  src.type = type;
  src.frequency.setValueAtTime(f0, t);
  if (f0End) src.frequency.linearRampToValueAtTime(f0End, t + dur);
  // a little jitter so it doesn't sound like a synth
  const jit = ctx.createOscillator();
  jit.frequency.value = 5.5 + Math.random() * 2;
  const jg = ctx.createGain();
  jg.gain.value = f0 * 0.02;
  jit.connect(jg).connect(src.frequency);
  const mix = ctx.createGain();
  mix.gain.value = 1;
  let input = src;
  if (drive) {
    const ws = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = (i / 128) - 1; curve[i] = Math.tanh(x * (1 + drive * 6)); }
    ws.curve = curve;
    src.connect(ws);
    input = ws;
  }
  const out = ctx.createGain();
  const end = env(out.gain, t, { attack, decay: dur, peak: gain, sustain: 0.85, hold: dur * 0.6, release: dur * 0.4 });
  const fa = VOWELS[vowel], fb = VOWELS[vowelEnd ?? vowel];
  const gains = vowel === 'm' ? [1, 0.25, 0.1] : [1, 0.6, 0.25];
  fa.forEach((f, i) => {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 6 + i * 3;
    bp.frequency.setValueAtTime(f, t);
    bp.frequency.linearRampToValueAtTime(fb[i], t + dur);
    const g = ctx.createGain();
    g.gain.value = gains[i] * 3;
    input.connect(bp).connect(g).connect(mix);
  });
  mix.connect(out).connect(dest);
  if (breath > 0) noise(ctx, dest, t, { type: 'bandpass', freq: fa[1], q: 1, dur: dur * 0.8, gain: gain * breath, attack });
  src.start(t);
  jit.start(t);
  src.stop(end + 0.05);
  jit.stop(end + 0.05);
  return end;
}

// Note names to Hz (A4 = 440).
const NOTE = { C: -9, 'C#': -8, D: -7, 'D#': -6, E: -5, F: -4, 'F#': -3, G: -2, 'G#': -1, A: 0, 'A#': 1, B: 2 };
export function hz(name) {
  const m = /^([A-G]#?)(-?\d)$/.exec(name);
  if (!m) return 0;
  return 440 * Math.pow(2, (NOTE[m[1]] + (Number(m[2]) - 4) * 12) / 12);
}
