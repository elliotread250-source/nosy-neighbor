// Web Audio root: one context (created on the first click), a master
// compressor, four buses (music, sfx, ambience, voice) with their own
// volumes, an HRTF listener that follows the camera, and spatial emitters
// that get muffled by walls between you and them.
import { Vector3 } from 'three';
import { CONFIG } from '../config.js';
import { GROUP, groups } from '../core/Physics.js';

const _f = new Vector3();
const _u = new Vector3();
const _d = new Vector3();

export class AudioEngine {
  constructor(game) {
    this.game = game;
    this.ctx = null;
    this.ready = false;
    this.voices = 0;
    this.listenerPos = new Vector3();
    this.modules = [];
  }

  // Must run inside a user gesture.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC({ latencyHint: 'interactive' });
    } catch {
      return;
    }
    const ctx = this.ctx;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -16;
    this.comp.knee.value = 12;
    this.comp.ratio.value = 4;
    this.comp.attack.value = 0.004;
    this.comp.release.value = 0.2;
    this.master = ctx.createGain();
    this.master.connect(this.comp).connect(ctx.destination);
    this.buses = {};
    for (const b of ['music', 'sfx', 'ambience', 'voice']) {
      const g = ctx.createGain();
      g.connect(this.master);
      this.buses[b] = g;
    }
    this.applyVolumes();
    this.ready = true;
    for (const m of this.modules) m.start?.();
  }

  add(module) {
    this.modules.push(module);
    if (this.ready) module.start?.();
    return module;
  }

  get now() { return this.ctx ? this.ctx.currentTime : 0; }

  applyVolumes() {
    if (!this.ctx) return;
    const v = CONFIG.audio;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(v.master, t, 0.05);
    for (const [k, g] of Object.entries(this.buses)) g.gain.setTargetAtTime(v[k] ?? 1, t, 0.05);
  }

  // A one-shot emitter at a world position. Returns a node to connect sounds into.
  // opts: { bus, ref, rolloff, max, occlude }
  spatial(pos, opts = {}) {
    const ctx = this.ctx;
    const p = ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = opts.ref ?? 2;
    p.rolloffFactor = opts.rolloff ?? 1.2;
    p.maxDistance = opts.max ?? 60;
    setPos(p, pos);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 20000;
    const g = ctx.createGain();
    g.gain.value = 1;
    if (opts.occlude !== false) {
      const walls = this.wallsTo(pos);
      if (walls > 0) {
        lp.frequency.value = Math.max(350, 5000 / (walls * 1.6));
        g.gain.value = Math.pow(0.62, walls);
      }
    }
    g.connect(lp).connect(p).connect(this.buses[opts.bus ?? 'sfx']);
    return { input: g, panner: p, filter: lp, gain: g };
  }

  // Count walls (static geometry) between the listener and a point (max 3).
  wallsTo(pos) {
    const ph = this.game.physics;
    if (!ph) return 0;
    const from = _d.copy(this.listenerPos);
    const dir = _u.copy(pos).sub(from);
    let len = dir.length();
    if (len < 0.5 || len > 45) return 0;
    dir.divideScalar(len);
    let n = 0;
    const filter = groups(GROUP.PLAYER, GROUP.STATIC);
    const o = from.clone();
    while (n < 3) {
      const hit = ph.raycast(o, dir, len - 0.25, this.game.player?.collider, filter);
      if (!hit) break;
      n++;
      o.copy(hit.point).addScaledVector(dir, 0.35);
      len -= hit.toi + 0.35;
      if (len <= 0.3) break;
    }
    return n;
  }

  // Can we afford another one-shot right now?
  budget() {
    return this.ready && this.voices < 40;
  }

  track(endTime) {
    this.voices++;
    const ms = Math.max(50, (endTime - this.ctx.currentTime) * 1000 + 100);
    setTimeout(() => { this.voices--; }, ms);
  }

  update(dt) {
    if (!this.ready) return;
    const cam = this.game.engine.camera;
    cam.getWorldPosition(this.listenerPos);
    cam.getWorldDirection(_f);
    _u.set(0, 1, 0).applyQuaternion(cam.quaternion);
    const l = this.ctx.listener;
    const t = this.ctx.currentTime;
    if (l.positionX) {
      l.positionX.setTargetAtTime(this.listenerPos.x, t, 0.02);
      l.positionY.setTargetAtTime(this.listenerPos.y, t, 0.02);
      l.positionZ.setTargetAtTime(this.listenerPos.z, t, 0.02);
      l.forwardX.setTargetAtTime(_f.x, t, 0.02);
      l.forwardY.setTargetAtTime(_f.y, t, 0.02);
      l.forwardZ.setTargetAtTime(_f.z, t, 0.02);
      l.upX.setTargetAtTime(_u.x, t, 0.02);
      l.upY.setTargetAtTime(_u.y, t, 0.02);
      l.upZ.setTargetAtTime(_u.z, t, 0.02);
    } else {
      l.setPosition(this.listenerPos.x, this.listenerPos.y, this.listenerPos.z);
      l.setOrientation(_f.x, _f.y, _f.z, _u.x, _u.y, _u.z);
    }
    for (const m of this.modules) m.update?.(dt);
  }
}

export function setPos(p, pos) {
  if (p.positionX) {
    p.positionX.value = pos.x;
    p.positionY.value = pos.y;
    p.positionZ.value = pos.z;
  } else p.setPosition(pos.x, pos.y, pos.z);
}
