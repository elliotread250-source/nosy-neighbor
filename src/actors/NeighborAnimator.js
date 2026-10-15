// Procedural animation for Grimsby: a tiny pose system on his bones.
// A pose is { boneName: [rx, ry, rz], hipsY, hipsX, lift, gripL, gripR } of
// offsets from the rest pose. Clips are either procedural cycles (walk, run)
// or keyframe lists, crossfaded. Head look and secondary motion layer on top.
import { MathUtils, Vector3 } from 'three';
import { Events } from '../core/Events.js';
import { CONFIG } from '../config.js';

const DEG = Math.PI / 180;
const BONES = ['hips', 'torso', 'chest', 'neck', 'head', 'shoulderL', 'shoulderR', 'upperArmL', 'upperArmR', 'forearmL', 'forearmR',
  'handL', 'handR', 'thighL', 'thighR', 'shinL', 'shinR', 'footL', 'footR'];
const SCALARS = ['hipsY', 'hipsX', 'hipsZ', 'lift', 'gripL', 'gripR'];

function emptyPose() {
  const p = {};
  for (const b of BONES) p[b] = [0, 0, 0];
  for (const s of SCALARS) p[s] = 0;
  return p;
}

function copyPose(dst, src) {
  for (const b of BONES) { const a = src[b] || [0, 0, 0]; dst[b][0] = a[0]; dst[b][1] = a[1]; dst[b][2] = a[2]; }
  for (const s of SCALARS) dst[s] = src[s] ?? 0;
  return dst;
}

function lerpPose(out, a, b, t) {
  for (const k of BONES) {
    const x = a[k] || [0, 0, 0], y = b[k] || [0, 0, 0];
    out[k][0] = x[0] + (y[0] - x[0]) * t;
    out[k][1] = x[1] + (y[1] - x[1]) * t;
    out[k][2] = x[2] + (y[2] - x[2]) * t;
  }
  for (const s of SCALARS) out[s] = (a[s] ?? 0) + ((b[s] ?? 0) - (a[s] ?? 0)) * t;
  return out;
}

const smooth = (t) => t * t * (3 - 2 * t);

// ---------------------------------------------------------------- keyframed clips
// Each: { duration, loop, keys: [[t, pose], ...], expr? }
const K = {
  stand: {},
  kneel: {
    hipsY: -0.42, chest: [0.35, 0, 0], neck: [0.15, 0, 0], head: [0.2, 0, 0],
    thighL: [-1.45, 0, 0], shinL: [1.45, 0, 0], thighR: [0.15, 0, 0], shinR: [1.6, 0, 0], footR: [0.6, 0, 0],
    upperArmL: [-0.9, 0, 0.05], forearmL: [-0.45, 0, 0], upperArmR: [-0.9, 0, -0.05], forearmR: [-0.45, 0, 0],
  },
  crouch: {
    hipsY: -0.48, hipsZ: -0.1, torso: [0.3, 0, 0], chest: [0.45, 0, 0], neck: [-0.25, 0, 0], head: [-0.25, 0, 0],
    thighL: [-1.7, 0, -0.15], shinL: [2.1, 0, 0], footL: [-0.45, 0, 0], thighR: [-1.7, 0, 0.15], shinR: [2.1, 0, 0], footR: [-0.45, 0, 0],
    upperArmL: [-0.6, 0, 0.2], forearmL: [-0.6, 0, 0], upperArmR: [-0.6, 0, -0.2], forearmR: [-0.6, 0, 0],
  },
  sit: {
    hipsY: -0.43, hipsZ: -0.12, torso: [-0.12, 0, 0], chest: [-0.05, 0, 0],
    thighL: [-1.5, 0, -0.08], shinL: [1.5, 0, 0], thighR: [-1.5, 0, 0.08], shinR: [1.5, 0, 0],
    upperArmL: [-0.55, 0, 0.12], forearmL: [-0.8, 0, 0], upperArmR: [-0.55, 0, -0.12], forearmR: [-0.8, 0, 0],
    gripL: 0.3, gripR: 0.3,
  },
  reach: {
    hipsZ: 0.12, torso: [0.15, 0, 0], chest: [0.32, 0, 0], neck: [-0.15, 0, 0], head: [-0.2, 0, 0],
    upperArmL: [-1.55, 0, 0.25], forearmL: [-0.1, 0, 0], upperArmR: [-1.55, 0, -0.25], forearmR: [-0.1, 0, 0],
    thighL: [-0.7, 0, 0], shinL: [0.45, 0, 0], thighR: [0.45, 0, 0], shinR: [0.2, 0, 0],
    gripL: -1, gripR: -1,
  },
};

export const CLIPS = {
  idle: { proc: 'idle' },
  walk: { proc: 'walk' },
  sneak: { proc: 'sneak' },
  run: { proc: 'run' },
  kneel: { duration: 0.6, keys: [[0, K.stand], [0.6, K.kneel]] },
  crouch: { duration: 0.5, keys: [[0, K.stand], [0.5, K.crouch]] },
  sit: { duration: 0.8, keys: [[0, K.stand], [0.8, K.sit]] },
  doze: { duration: 2.5, loop: true, keys: [[0, { ...K.sit, neck: [0.5, 0, 0.15], head: [0.4, 0, 0.1] }], [1.25, { ...K.sit, neck: [0.55, 0, 0.15], head: [0.45, 0, 0.1], chest: [0.02, 0, 0] }], [2.5, { ...K.sit, neck: [0.5, 0, 0.15], head: [0.4, 0, 0.1] }]] },
  reach: { duration: 0.22, keys: [[0, K.stand], [0.22, K.reach]] },
  // board up: hold the plank with the left hand, three big hammer arcs with the right
  hammer: {
    duration: 2.4, loop: true,
    keys: (() => {
      const base = { chest: [0.1, 0, 0], upperArmL: [-1.35, 0, -0.3], forearmL: [-0.35, 0, 0], gripL: 0.6, gripR: 0.8 };
      const up = { ...base, upperArmR: [-2.7, 0, 0.2], forearmR: [-0.9, 0, 0], chest: [0.0, -0.15, 0] };
      const hit = { ...base, upperArmR: [-1.25, 0, 0.0], forearmR: [-0.2, 0, 0], chest: [0.18, 0.1, 0] };
      return [[0, up], [0.45, up], [0.7, hit], [0.8, hit], [1.25, up], [1.5, hit], [1.6, hit], [2.05, up], [2.4, up]];
    })(),
    events: [[0.7, 'hammerHit'], [1.5, 'hammerHit'], [2.3, 'hammerHit']],
  },
  // set a bear trap: kneel, pry the jaws open with both hands, nod
  setTrap: {
    duration: 3.2,
    keys: [
      [0, K.stand], [0.6, K.kneel],
      [1.1, { ...K.kneel, upperArmL: [-1.0, 0, 0.35], upperArmR: [-1.0, 0, -0.35], forearmL: [-0.2, 0, 0], forearmR: [-0.2, 0, 0], gripL: 0.8, gripR: 0.8 }],
      [1.9, { ...K.kneel, upperArmL: [-1.0, 0, 0.75], upperArmR: [-1.0, 0, -0.75], forearmL: [-0.4, 0, 0], forearmR: [-0.4, 0, 0], gripL: 0.8, gripR: 0.8 }],
      [2.4, K.stand], [2.7, { head: [0.25, 0, 0], neck: [0.1, 0, 0] }], [3.0, K.stand], [3.2, K.stand],
    ],
    events: [[1.9, 'trapSet'], [2.75, 'hmph']],
  },
  // mount a camera: tiptoes, screw it in, tap it twice
  setCamera: {
    duration: 2.8,
    keys: [
      [0, K.stand],
      [0.5, { lift: 0.08, footL: [0.4, 0, 0], footR: [0.4, 0, 0], upperArmR: [-2.8, 0, -0.2], forearmR: [-0.4, 0, 0], upperArmL: [-2.6, 0, 0.2], forearmL: [-0.5, 0, 0], neck: [-0.3, 0, 0], head: [-0.3, 0, 0] }],
      [1.2, { lift: 0.08, footL: [0.4, 0, 0], footR: [0.4, 0, 0], upperArmR: [-2.8, 0.4, -0.2], forearmR: [-0.4, 0, 0], upperArmL: [-2.6, 0, 0.2], forearmL: [-0.5, 0, 0], neck: [-0.3, 0, 0], head: [-0.3, 0, 0] }],
      [1.7, { lift: 0.08, footL: [0.4, 0, 0], footR: [0.4, 0, 0], upperArmR: [-2.6, 0, -0.2], forearmR: [-0.6, 0, 0], neck: [-0.3, 0, 0], head: [-0.3, 0, 0], gripR: 1 }],
      [1.9, { lift: 0.08, footL: [0.4, 0, 0], footR: [0.4, 0, 0], upperArmR: [-2.75, 0, -0.2], forearmR: [-0.45, 0, 0], neck: [-0.3, 0, 0], head: [-0.3, 0, 0], gripR: 1 }],
      [2.1, { lift: 0.08, footL: [0.4, 0, 0], footR: [0.4, 0, 0], upperArmR: [-2.6, 0, -0.2], forearmR: [-0.6, 0, 0], neck: [-0.3, 0, 0], head: [-0.3, 0, 0], gripR: 1 }],
      [2.8, K.stand],
    ],
    events: [[1.75, 'tap'], [2.05, 'tap']],
  },
  // pour a glass of milk and drink it, head back
  drink: {
    duration: 3.5,
    keys: [
      [0, K.stand],
      [0.6, { upperArmR: [-0.75, 0, -0.45], forearmR: [-1.9, 0, 0], gripR: 0.7 }],
      [1.2, { upperArmR: [-1.0, 0, -0.5], forearmR: [-2.15, 0, 0], neck: [-0.35, 0, 0], head: [-0.35, 0, 0], gripR: 0.7 }],
      [2.6, { upperArmR: [-1.1, 0, -0.5], forearmR: [-2.2, 0, 0], neck: [-0.45, 0, 0], head: [-0.4, 0, 0], gripR: 0.7, chest: [-0.1, 0, 0] }],
      [3.0, { upperArmR: [-0.6, 0, -0.3], forearmR: [-1.4, 0, 0], gripR: 0.7 }],
      [3.5, K.stand],
    ],
    events: [[1.3, 'gulp'], [2.0, 'gulp'], [3.1, 'ahh']],
  },
  checkWatch: {
    duration: 2.4,
    keys: [
      [0, K.stand],
      [0.5, { upperArmL: [-0.45, 0.2, -0.55], forearmL: [-1.35, 0.5, 0], neck: [0.35, 0.25, 0], head: [0.3, 0.2, 0] }],
      [1.8, { upperArmL: [-0.47, 0.2, -0.55], forearmL: [-1.35, 0.5, 0], neck: [0.37, 0.25, 0], head: [0.32, 0.2, 0] }],
      [2.4, K.stand],
    ],
  },
  scratch: {
    duration: 2.2,
    keys: (() => {
      const a = { upperArmR: [-0.75, 0, 0.35], forearmR: [-2.15, -0.4, 0], gripR: 0.5, head: [0.05, 0, 0.08] };
      const b = { upperArmR: [-0.8, 0, 0.38], forearmR: [-2.25, -0.4, 0], gripR: 0.9, head: [0.05, 0, 0.08] };
      return [[0, K.stand], [0.5, a], [0.7, b], [0.9, a], [1.1, b], [1.3, a], [1.5, b], [2.2, K.stand]];
    })(),
  },
  lookAround: {
    duration: 4,
    keys: [[0, K.stand], [1, { neck: [0, 0.5, 0], head: [0, 0.4, 0], chest: [0, 0.15, 0] }], [2.2, { neck: [0, -0.55, 0], head: [0, -0.45, 0], chest: [0, -0.15, 0] }], [3.2, { neck: [-0.1, 0, 0] }], [4, K.stand]],
  },
  // freeze, head snaps, one hand lifts
  hear: {
    duration: 0.5,
    keys: [[0, K.stand], [0.12, { upperArmR: [-0.55, 0, -0.35], forearmR: [-0.7, 0, 0], gripR: -0.4, chest: [0.05, 0, 0], neck: [-0.1, 0, 0] }], [0.5, { upperArmR: [-0.6, 0, -0.38], forearmR: [-0.75, 0, 0], gripR: -0.4, chest: [0.05, 0, 0], neck: [-0.1, 0, 0] }]],
  },
  // spotted the player: startle hop, arms fly up
  spot: {
    duration: 0.55,
    keys: [
      [0, K.stand],
      [0.12, { lift: 0.16, upperArmL: [-0.9, 0, 0.9], upperArmR: [-0.9, 0, -0.9], forearmL: [-0.8, 0, 0], forearmR: [-0.8, 0, 0], gripL: -1, gripR: -1, chest: [-0.15, 0, 0] }],
      [0.3, { lift: 0.0, upperArmL: [-0.5, 0, 0.6], upperArmR: [-0.5, 0, -0.6], forearmL: [-0.5, 0, 0], forearmR: [-0.5, 0, 0], gripL: -1, gripR: -1, hipsY: -0.06 }],
      [0.55, { upperArmL: [-0.3, 0, 0.35], upperArmR: [-0.3, 0, -0.35], gripL: -0.6, gripR: -0.6 }],
    ],
    events: [[0.05, 'hey']],
  },
  // lost the player: shrug, mutter, kick something
  lost: {
    duration: 3.0,
    keys: [
      [0, K.stand],
      [0.6, { upperArmL: [-0.3, 0, 0.55], upperArmR: [-0.3, 0, -0.55], forearmL: [-1.0, 0.6, 0], forearmR: [-1.0, -0.6, 0], shoulderL: [0, 0, 0.12], shoulderR: [0, 0, -0.12], gripL: -0.6, gripR: -0.6, head: [0.15, 0, 0] }],
      [1.4, { upperArmL: [-0.1, 0, 0.3], upperArmR: [-0.1, 0, -0.3], head: [0.2, 0, 0] }],
      [1.8, { thighR: [0.4, 0, 0], shinR: [0.6, 0, 0], chest: [-0.05, 0, 0] }],
      [2.05, { thighR: [-1.2, 0, 0], shinR: [0.1, 0, 0], chest: [-0.15, 0, 0], upperArmR: [0.3, 0, -0.3], upperArmL: [-0.4, 0, 0.3] }],
      [2.5, K.stand], [3.0, K.stand],
    ],
    events: [[0.6, 'mutter'], [2.05, 'kick']],
  },
  // lean around a corner before committing
  peek: {
    duration: 1.4,
    keys: [[0, K.stand], [0.45, { torso: [0.1, 0, 0.18], chest: [0.15, 0, 0.18], neck: [0, 0, -0.1], hipsX: 0.06 }], [1.0, { torso: [0.1, 0, 0.18], chest: [0.15, 0, 0.2], neck: [0, 0, -0.1], hipsX: 0.06 }], [1.4, K.stand]],
  },
  // search a wardrobe/cabinet: pause, reach, yank, peer in, exhale
  searchOpen: {
    duration: 1.6,
    keys: [
      [0, K.stand], [0.35, { chest: [0.05, 0, 0], upperArmR: [-0.6, 0, -0.1], forearmR: [-0.6, 0, 0] }],
      [0.6, { chest: [0.2, 0, 0], upperArmR: [-1.35, 0, -0.1], forearmR: [-0.2, 0, 0], gripR: 0.8 }],
      [0.8, { chest: [0.0, 0.2, 0], upperArmR: [-1.0, 0.6, -0.5], forearmR: [-0.3, 0, 0], gripR: 0.8 }],
      [1.2, { chest: [0.35, 0, 0], neck: [0.2, 0, 0], head: [0.1, 0, 0], upperArmR: [-0.9, 0.4, -0.5] }],
      [1.6, { chest: [0.15, 0, 0] }],
    ],
    events: [[0.75, 'yank']],
  },
  searchUnder: {
    duration: 1.8,
    keys: [[0, K.stand], [0.6, { ...K.crouch, chest: [0.9, 0, 0], neck: [-0.5, 0, 0], head: [-0.4, 0, 0] }], [1.3, { ...K.crouch, chest: [0.95, 0, 0], neck: [-0.55, 0, 0], head: [-0.45, 0, 0] }], [1.8, K.crouch]],
  },
  throw: {
    duration: 1.1,
    keys: [
      [0, K.stand],
      [0.45, { chest: [-0.1, 0.5, 0], upperArmR: [0.6, 0, -0.6], forearmR: [-1.2, 0, 0], thighL: [-0.4, 0, 0], gripR: 0.8 }],
      [0.62, { chest: [0.35, -0.4, 0], upperArmR: [-2.6, 0, -0.1], forearmR: [-0.2, 0, 0], thighL: [-0.5, 0, 0], shinL: [0.3, 0, 0], gripR: -0.6 }],
      [0.8, { chest: [0.3, -0.3, 0], upperArmR: [-0.9, 0, 0], forearmR: [-0.2, 0, 0], gripR: -0.6 }],
      [1.1, K.stand],
    ],
    events: [[0.62, 'release']],
  },
};

const _v = new Vector3();

export class NeighborAnimator {
  constructor(neighbor) {
    this.n = neighbor;
    this.bones = neighbor.bones;
    this.rest = {};
    for (const b of BONES) {
      const bone = this.bones[b];
      this.rest[b] = { rx: bone.rotation.x, ry: bone.rotation.y, rz: bone.rotation.z, x: bone.position.x, y: bone.position.y, z: bone.position.z };
    }
    this.pose = emptyPose();
    this.from = emptyPose();
    this.target = emptyPose();
    this.clip = 'idle';
    this.clipTime = 0;
    this.fade = 0;
    this.fadeDur = 0.25;
    this.phase = 0; // gait phase, radians
    this.speed = 0; // m/s, set by the AI
    this.lastStepIndex = 0;
    this.headLook = { yaw: 0, pitch: 0 };
    this.headTarget = null; // world point
    this.headLimit = 70 * DEG;
    this.armLag = 0;
    this.prevYaw = 0;
    this.onEvent = null;
    this.idleGestureTimer = 4;
    this.gesture = null;
    this.gestureTime = 0;
    this.time = 0;
    this.frozen = false;
  }

  play(name, fade = 0.25) {
    if (this.clip === name && !CLIPS[name]?.keys) return;
    copyPose(this.from, this.pose);
    this.clip = name;
    this.clipTime = 0;
    this.fade = fade <= 0 ? 1 : 0;
    this.fadeDur = fade;
    this.firedEvents = new Set();
  }

  get clipDone() {
    const c = CLIPS[this.clip];
    return c && c.duration && !c.loop && this.clipTime >= c.duration;
  }

  // Sample a clip at time t into out
  sample(name, t, out) {
    const c = CLIPS[name];
    if (c.proc) return this[`_${c.proc}`](out, t);
    const keys = c.keys;
    let tt = c.loop ? t % c.duration : Math.min(t, c.duration);
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1][0] <= tt) i++;
    const [t0, p0] = keys[i];
    const [t1, p1] = keys[Math.min(i + 1, keys.length - 1)];
    const k = t1 > t0 ? smooth(MathUtils.clamp((tt - t0) / (t1 - t0), 0, 1)) : 1;
    const a = copyPose(emptyPose(), p0);
    const b = copyPose(emptyPose(), p1);
    return lerpPose(out, a, b, k);
  }

  // ---------------------------------------------------------- procedural cycles
  _idle(out, t) {
    copyPose(out, K.stand);
    // weight shifts foot to foot every few seconds, arms hang heavy
    const w = Math.sin(t * 0.7);
    out.hipsX = w * 0.025;
    out.hips[2] = -w * 0.03;
    out.chest[2] = w * 0.03;
    out.thighL[2] = -w * 0.03;
    out.thighR[2] = -w * 0.03;
    out.shinL[0] = Math.max(0, w) * 0.08;
    out.shinR[0] = Math.max(0, -w) * 0.08;
    out.upperArmL[0] = Math.sin(t * 1.1) * 0.03;
    out.upperArmR[0] = Math.sin(t * 1.1 + 1) * 0.03;
    out.gripL = 0.25;
    out.gripR = 0.25;
    return out;
  }

  _gait(out, opts) {
    copyPose(out, K.stand);
    const { A, Kn, arm, armOut, bounce, sway, lean, chest, elbow, headF, grip } = opts;
    const p = this.phase;
    const sL = Math.sin(p), sR = Math.sin(p + Math.PI);
    out.thighL[0] = -A * sL;
    out.thighR[0] = -A * sR;
    out.shinL[0] = Kn * Math.max(0, Math.cos(p + 0.35)) ** 1.2 + 0.05;
    out.shinR[0] = Kn * Math.max(0, Math.cos(p + Math.PI + 0.35)) ** 1.2 + 0.05;
    out.footL[0] = -0.25 * Math.max(0, -Math.cos(p));
    out.footR[0] = -0.25 * Math.max(0, Math.cos(p));
    // heavy waddle: hips sway 4 degrees, torso counter-rotates
    out.hips[2] = Math.sin(p) * sway;
    out.hips[1] = Math.sin(p) * 0.08;
    out.torso[1] = -Math.sin(p) * 0.12;
    out.torso[0] = lean;
    out.chest[0] = chest;
    out.hipsY = -Math.abs(Math.cos(p)) * bounce;
    // arms swing low and wide, opposite to the legs
    out.upperArmL[0] = arm * sL;
    out.upperArmR[0] = arm * sR;
    out.upperArmL[2] = armOut;
    out.upperArmR[2] = -armOut;
    out.forearmL[0] = elbow - Math.max(0, -sL) * 0.3;
    out.forearmR[0] = elbow - Math.max(0, -sR) * 0.3;
    out.neck[0] = headF;
    out.head[0] = -headF * 0.5;
    out.gripL = grip;
    out.gripR = grip;
    return out;
  }

  _walk(out) {
    return this._gait(out, { A: 0.42, Kn: 0.65, arm: 0.38, armOut: 0.08, bounce: 0.035, sway: 4 * DEG, lean: 0.03, chest: 0.0, elbow: -0.15, headF: 0.0, grip: 0.3 });
  }

  _sneak(out) {
    // slower, hunched, head forward, arms slightly out
    return this._gait(out, { A: 0.32, Kn: 0.55, arm: 0.15, armOut: 0.38, bounce: 0.025, sway: 3 * DEG, lean: 0.12, chest: 0.28, elbow: -0.5, headF: 0.2, grip: -0.2 });
  }

  _run(out) {
    // big lunging strides, arms pumping wildly with splayed hands, torso pitched 25 degrees
    this._gait(out, { A: 1.0, Kn: 1.55, arm: 1.4, armOut: 0.38, bounce: 0.1, sway: 6 * DEG, lean: 0.22, chest: 0.3, elbow: -0.9, headF: -0.12, grip: -1 });
    out.head[0] = -0.3; // face fixed forward on the player
    out.upperArmL[1] = Math.sin(this.phase) * 0.3;
    out.upperArmR[1] = -Math.sin(this.phase) * 0.3;
    return out;
  }

  // ---------------------------------------------------------- update
  update(dt) {
    if (this.frozen) return;
    this.time += dt;
    this.clipTime += dt;
    const c = CLIPS[this.clip];
    // gait phase from speed: walk stride 0.82 m per step, run 1.35
    const stride = this.clip === 'run' ? 1.35 : this.clip === 'sneak' ? 0.6 : 0.82;
    if (c.proc && c.proc !== 'idle') {
      this.phase += (this.speed / stride) * Math.PI * dt;
      const idx = Math.floor(this.phase / Math.PI);
      if (idx !== this.lastStepIndex) {
        this.lastStepIndex = idx;
        this._event(this.clip === 'run' ? 'stepRun' : 'step');
      }
    }
    this.sample(this.clip, this.clipTime, this.target);
    // idle gestures: watch, mustache scratch, look around
    if (this.clip === 'idle') {
      this.idleGestureTimer -= dt;
      if (!this.gesture && this.idleGestureTimer <= 0 && this.allowGestures !== false) {
        const g = ['checkWatch', 'scratch', 'lookAround'][Math.floor(Math.random() * 3)];
        this.gesture = g;
        this.gestureTime = 0;
        this.idleGestureTimer = 5 + Math.random() * 6;
      }
      if (this.gesture) {
        this.gestureTime += dt;
        const gc = CLIPS[this.gesture];
        const gp = this.sample(this.gesture, this.gestureTime, emptyPose());
        const env = Math.min(1, this.gestureTime / 0.3, (gc.duration - this.gestureTime) / 0.3);
        // upper body only
        for (const b of ['chest', 'neck', 'head', 'upperArmL', 'upperArmR', 'forearmL', 'forearmR']) {
          for (let i = 0; i < 3; i++) this.target[b][i] += gp[b][i] * Math.max(0, env);
        }
        if (this.gestureTime >= gc.duration) this.gesture = null;
      }
    } else this.gesture = null;
    // clip events
    if (c.events) {
      for (const [et, name] of c.events) {
        const key = `${et}${name}`;
        const tt = c.loop ? this.clipTime % c.duration : this.clipTime;
        if (tt >= et && !this.firedEvents?.has(key)) {
          this.firedEvents?.add(key);
          this._event(name);
        }
        if (c.loop && tt < et) this.firedEvents?.delete(key);
      }
    }
    // crossfade
    this.fade = Math.min(1, this.fade + dt / Math.max(0.01, this.fadeDur));
    lerpPose(this.pose, this.from, this.target, smooth(this.fade));
    this._apply(dt);
  }

  _event(name) {
    this.onEvent?.(name);
    if (name === 'step' || name === 'stepRun') {
      const p = this.n.root.getWorldPosition(_v).clone();
      Events.emit('neighbor:footstep', { position: p, run: name === 'stepRun' });
    }
  }

  _apply(dt) {
    const P = this.pose;
    // arms trail a little behind fast turns
    const yaw = this.n.root.rotation.y;
    let dyaw = yaw - this.prevYaw;
    dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
    this.prevYaw = yaw;
    this.armLag += (MathUtils.clamp(dyaw / Math.max(dt, 1e-3) * 0.05, -0.4, 0.4) - this.armLag) * Math.min(1, dt * 6);
    for (const b of BONES) {
      const bone = this.bones[b], r = this.rest[b], p = P[b];
      bone.rotation.set(r.rx + p[0], r.ry + p[1], r.rz + p[2]);
    }
    this.bones.upperArmL.rotation.y += this.armLag;
    this.bones.upperArmR.rotation.y += this.armLag;
    const h = this.bones.hips, hr = this.rest.hips;
    h.position.set(hr.x + P.hipsX, hr.y + P.hipsY + P.lift, hr.z + P.hipsZ);
    // fingers
    this.n.setGrip('L', P.gripL);
    this.n.setGrip('R', P.gripR);
    // head look layer: eyes lead (model), the head follows on top of the pose
    if (this.headTarget) {
      const head = this.bones.neck;
      head.parent.updateWorldMatrix(true, false);
      _v.copy(this.headTarget);
      head.parent.worldToLocal(_v);
      _v.sub(head.position);
      const yawT = MathUtils.clamp(Math.atan2(_v.x, _v.z), -this.headLimit, this.headLimit);
      const pitchT = MathUtils.clamp(Math.atan2(-_v.y + 0.25, Math.hypot(_v.x, _v.z)), -0.6, 0.6);
      this.headLook.yaw += (yawT - this.headLook.yaw) * Math.min(1, dt * 5);
      this.headLook.pitch += (pitchT - this.headLook.pitch) * Math.min(1, dt * 5);
    } else {
      this.headLook.yaw *= 1 - Math.min(1, dt * 3);
      this.headLook.pitch *= 1 - Math.min(1, dt * 3);
    }
    this.bones.neck.rotation.y += this.headLook.yaw * 0.55;
    this.bones.head.rotation.y += this.headLook.yaw * 0.45;
    this.bones.neck.rotation.x += this.headLook.pitch * 0.5;
    this.bones.head.rotation.x += this.headLook.pitch * 0.5;
  }
}

export { BONES, CONFIG };
