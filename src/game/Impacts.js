// What happens when physics things hit: every impact makes a noise scaled by
// the item's noise value and how hard it hit (the neighbor hears these),
// thrown things break window glass, and ceramics shatter into shards.
import { Mesh, TetrahedronGeometry, Vector3, Quaternion } from 'three';
import { Events } from '../core/Events.js';
import { makeMat } from '../art/Materials.js';
import { CONFIG } from '../config.js';

const _p = new Vector3();

export class Impacts {
  constructor(game) {
    this.game = game;
    this.physics = game.physics;
    this.last = new WeakMap();
    this.shards = [];
    this.off = Events.on('contact', (e) => this.onContact(e));
  }

  onContact(e) {
    const pa = e.a?.kind === 'prop' ? e.a : null;
    const pb = e.b?.kind === 'prop' ? e.b : null;
    for (const [prop, other] of [[pa, e.b], [pb, e.a]]) {
      if (!prop) continue;
      const entry = prop.entry;
      if (!entry || entry.held || entry.dead) continue;
      this.hit(entry, prop, other, e.force);
    }
  }

  hit(entry, data, other, force) {
    const now = performance.now() / 1000;
    const body = entry.body;
    const t = body.translation();
    _p.set(t.x, t.y, t.z);
    const v = body.linvel();
    const speed = Math.hypot(v.x, v.y, v.z);
    const mass = body.mass() || 1;
    const thrown = !!entry.thrownRecently;
    // glass: a thrown thing (or anything heavy and fast) goes through
    if (other?.kind === 'glass' && other.window && (thrown || speed > 7) && (data.breaksGlass || mass >= 0.15 || speed > 9)) {
      _p.set(v.x, v.y, v.z).normalize();
      if (this.game.world.windows.breakGlass(other.window.id, _p.clone())) Events.emit('window:broken', { id: other.window.id, by: 'throw' });
    }
    // break ceramics
    const brk = CONFIG.interact;
    if (data.breaks && (force > 260 || (thrown && force > 120))) {
      this.shatter(entry, data);
      return;
    }
    // impact noise, throttled per prop
    const prev = this.last.get(entry) ?? -1;
    if (now - prev < 0.22) return;
    const strength = Math.min(1.5, force / (180 + mass * 40));
    if (strength < 0.08) return;
    this.last.set(entry, now);
    const loud = (data.noise ?? 0.4) * strength * (thrown ? 1.25 : 1);
    Events.emit('sfx', { name: 'impact', item: data.item, strength, position: _p.clone() });
    if (data.squeak) Events.emit('sfx', { name: 'squeak', position: _p.clone() });
    if (loud > 0.12) Events.emit('noise', { position: _p.clone(), loudness: loud, kind: 'impact', item: data.item, thrown });
    return brk;
  }

  shatter(entry, data) {
    entry.dead = true;
    const pos = entry.mesh.getWorldPosition(new Vector3());
    const color = findColor(entry.mesh);
    this.physics.removeDynamic(entry);
    entry.mesh.parent?.remove(entry.mesh);
    Events.emit('sfx', { name: data.breaksGlass ? 'glassSmash' : 'shatter', position: pos.clone() });
    Events.emit('noise', { position: pos.clone(), loudness: Math.max(0.9, (data.noise ?? 0.6) * 1.3), kind: 'shatter', item: data.item });
    Events.emit('prop:broken', { item: data.item, position: pos.clone() });
    const mat = makeMat(color ?? 'FRIDGE', { spec: 0.5 });
    const scene = this.game.engine.scene;
    for (let i = 0; i < 7; i++) {
      const s = 0.03 + Math.random() * 0.04;
      const m = new Mesh(new TetrahedronGeometry(s), mat);
      m.position.copy(pos).add(new Vector3((Math.random() - 0.5) * 0.15, Math.random() * 0.1, (Math.random() - 0.5) * 0.15));
      m.castShadow = true;
      scene.add(m);
      const shard = this.physics.addDynamic(m, { shape: 'hull', mass: 0.02, restitution: 0.2, impactThreshold: 1e9, data: { item: 'shard', noise: 0 } });
      shard.body.setLinvel({ x: (Math.random() - 0.5) * 3, y: Math.random() * 2.5, z: (Math.random() - 0.5) * 3 }, true);
      shard.body.setAngvel({ x: Math.random() * 10, y: Math.random() * 10, z: Math.random() * 10 }, true);
      this.shards.push({ entry: shard, mesh: m, life: 8 + Math.random() * 3 });
    }
  }

  update(dt) {
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.life -= dt;
      if (s.life < 1) s.mesh.scale.setScalar(Math.max(0.01, s.life));
      if (s.life <= 0) {
        this.physics.removeDynamic(s.entry);
        s.mesh.parent?.remove(s.mesh);
        s.mesh.geometry.dispose();
        this.shards.splice(i, 1);
      }
    }
  }
}

function findColor(obj) {
  let c = null;
  obj.traverse((m) => { if (!c && m.isMesh && m.material?.color) c = m.material.color.clone(); });
  return c;
}

export { Quaternion };
