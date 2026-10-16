// The catch: time slows, the camera is wrenched to face him, his face lunges
// into the screen with splayed black gloves, a stinger, a hard cut to black
// with a ringing tone, then you wake up in your own bed with a gasp.
import { Vector3, Quaternion, Matrix4, MathUtils } from 'three';
import { Events } from '../core/Events.js';
import { CONFIG } from '../config.js';

const C = CONFIG.catch;
const _m = new Matrix4();
const _q = new Quaternion();
const _v = new Vector3();

export class CatchSequence {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.t = 0;
  }

  start(opts = {}) {
    const g = this.game;
    this.active = true;
    this.t = 0;
    this.opts = opts;
    this.stage = 'grab';
    const p = g.player;
    p.enabled = false;
    p.externalCamera = true;
    if (p.hiding) g.hiding?.forceExit(false);
    this.startQuat = p.camera.quaternion.clone();
    this.camPos = p.camera.position.clone();
    const n = g.neighbor;
    g.ai.setState('catch');
    g.neighborAnim.play('reach', 0.12);
    n.setExpression(C.reducedScare ? 'angry' : 'scream');
    // put him right in front of the camera, facing it
    const toCam = this.camPos.clone().sub(g.ai.curFeet).setY(0);
    const dist = toCam.length();
    toCam.normalize();
    this.nStart = g.ai.curFeet.clone();
    const close = C.reducedScare ? 1.3 : 0.62;
    this.nEnd = this.camPos.clone().addScaledVector(toCam, -close).setY(g.ai.curFeet.y);
    if (dist < close) this.nStart.copy(this.nEnd);
    g.ai.yaw = Math.atan2(toCam.x, toCam.z);
    n.lookTarget = p.camera.position;
    g.neighborAnim.headTarget = p.camera.position;
    Events.emit('catch:start', { reduced: C.reducedScare });
    Events.emit('voice', { line: 'aah', position: this.camPos.clone() });
    Events.emit('sfx', { name: C.reducedScare ? 'catchSoft' : 'catchStinger' });
  }

  update(realDt) {
    if (!this.active) return;
    const g = this.game;
    const p = g.player;
    this.t += realDt;
    const t = this.t;
    if (this.stage === 'grab') {
      // slow time
      g.timeScale = MathUtils.lerp(1, C.slowTo, MathUtils.clamp(t / C.slowIn, 0, 1));
      // wrench the camera toward his face
      const face = g.neighbor.headWorldPos(_v).add(new Vector3(0, 0.0, 0));
      _m.lookAt(p.camera.position, face, new Vector3(0, 1, 0));
      _q.setFromRotationMatrix(_m);
      const k = MathUtils.clamp(t / C.wrench, 0, 1);
      p.camera.quaternion.slerpQuaternions(this.startQuat, _q, k * k * (3 - 2 * k));
      // the lunge
      const lk = MathUtils.clamp((t - 0.05) / 0.35, 0, 1);
      const pos = this.nStart.clone().lerp(this.nEnd, 1 - (1 - lk) ** 3);
      g.ai.curFeet.copy(pos);
      g.ai.prevFeet.copy(pos);
      g.neighbor.root.position.copy(pos);
      g.neighbor.root.rotation.y = g.ai.yaw;
      // shake
      if (!C.reducedScare) p.camera.position.copy(this.camPos).add(new Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, 0));
      g.postfx.chase = 1;
      if (t >= C.cutAt) {
        this.stage = 'black';
        this.t = 0;
        g.postfx.fade = 1;
        g.timeScale = 1;
        Events.emit('sfx', { name: 'ring' });
        g.onCaught(this.opts);
      }
    } else if (this.stage === 'black') {
      g.postfx.fade = 1;
      if (t >= C.blackFor) {
        this.stage = 'wake';
        this.t = 0;
        Events.emit('sfx', { name: 'gasp' });
        p.externalCamera = false;
        p.enabled = true;
        g.postfx.desat = 1;
        g.postfx.flash = 0.6;
      }
    } else if (this.stage === 'wake') {
      g.postfx.fade = Math.max(0, 1 - t / 0.35);
      g.postfx.flash = Math.max(0, 0.6 - t * 1.5);
      g.postfx.desat = Math.max(0, 1 - t / C.colorBack);
      if (t > C.colorBack) {
        this.active = false;
        g.postfx.desat = 0;
        Events.emit('catch:end', {});
      }
    }
  }
}
