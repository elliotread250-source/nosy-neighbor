// Debug tools, enabled with ?debug=1. F3 stats, F7 noclip.
// F4/F5/F6/F8/F9 hook into systems as they arrive in later milestones.
import { CONFIG } from '../config.js';
import { Events } from '../core/Events.js';

export class DebugOverlay {
  constructor(root, { engine, physics, player, input }) {
    this.enabled = CONFIG.debug;
    this.engine = engine;
    this.physics = physics;
    this.player = player;
    this.input = input;
    this.showStats = this.enabled;
    this.el = document.createElement('pre');
    this.el.className = 'debug-stats';
    root.appendChild(this.el);
    this.frames = 0;
    this.acc = 0;
    this.fps = 0;
    this.el.style.display = this.showStats ? '' : 'none';
  }

  update(dt) {
    if (!this.enabled) return;
    const K = CONFIG.debugKeys;
    const inp = this.input;
    if (inp.keyPressed(K.stats)) {
      this.showStats = !this.showStats;
      this.el.style.display = this.showStats ? '' : 'none';
    }
    if (inp.keyPressed(K.noclip)) this.player.setNoclip(!this.player.noclip);
    if (inp.keyPressed(K.nav)) Events.emit('debug:nav');
    if (inp.keyPressed(K.vision)) Events.emit('debug:vision');
    if (inp.keyPressed(K.freezeAI)) Events.emit('debug:freezeAI');
    if (inp.keyPressed(K.giveAll)) Events.emit('debug:giveAll');
    if (inp.keyPressed(K.dumpBrain)) Events.emit('debug:dumpBrain');

    this.frames++;
    this.acc += dt;
    if (this.acc >= 0.5) {
      this.fps = this.frames / this.acc;
      this.frames = 0;
      this.acc = 0;
      if (this.showStats) {
        const info = this.engine.renderer.info;
        const p = this.player;
        const c = this.engine.camera.position;
        this.el.textContent =
          `FPS ${this.fps.toFixed(0)}\n` +
          `draws ${info.render.calls}  tris ${(info.render.triangles / 1000).toFixed(1)}k\n` +
          `bodies ${this.physics.bodyCount()}\n` +
          `pos ${c.x.toFixed(1)} ${c.y.toFixed(1)} ${c.z.toFixed(1)}\n` +
          `${p.noclip ? 'NOCLIP ' : ''}${p.grounded ? 'ground' : 'air'} ${p.crouching ? 'crouch' : ''} ${p.sprinting ? 'sprint' : ''}\n` +
          `stamina ${(p.stamina * 100).toFixed(0)}%`;
      }
    }
  }
}
