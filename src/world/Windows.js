// Window glass: blocks the player until broken by a thrown object (or the
// neighbor's boards go up). Breaking swaps the pane for jagged shards stuck in
// the frame plus little shard bodies that fall and fade out after 10 s.
import { Group, Mesh, Vector3, Quaternion, BufferGeometry, Float32BufferAttribute, DoubleSide, Box3 } from 'three';
import { RAPIER, GROUP, groups } from '../core/Physics.js';
import { Events } from '../core/Events.js';
import { makeMat } from '../art/Materials.js';
import { roundedBox } from '../art/Geo.js';
import * as Tex from '../art/CanvasTextures.js';
import { rng } from '../art/Warp.js';

const DEG = Math.PI / 180;

export class WindowManager {
  constructor(scene, physics) {
    this.root = new Group();
    this.root.name = 'windows';
    scene.add(this.root);
    this.physics = physics;
    this.windows = new Map();
    this.debris = [];
  }

  /**
   * Register a window built by Builder.window(). o: { id, group, glass, w, h, breakable, openable }
   */
  add(o) {
    const g = o.group;
    g.updateMatrixWorld(true);
    const center = new Vector3();
    o.glass.getWorldPosition(center);
    const q = new Quaternion();
    o.glass.getWorldQuaternion(q);
    const win = { ...o, center, quat: q, broken: false, boards: [], collider: null, open: false };
    if (!o.noCollider) {
      win.collider = this.physics.addStaticBox(center, new Vector3(o.w / 2, o.h / 2, 0.06), q, { kind: 'glass', window: win });
    }
    this.windows.set(o.id, win);
    return win;
  }

  get(id) {
    return this.windows.get(id);
  }

  // Thrown object hit glass hard enough, or forced open.
  breakGlass(id, impactDir = null) {
    const win = this.windows.get(id);
    if (!win || win.broken || win.boards.length) return false;
    win.broken = true;
    win.glass.visible = false;
    if (win.collider) {
      this.physics.colliderData.delete(win.collider.handle);
      this.physics.world.removeCollider(win.collider, true);
      win.collider = null;
    }
    // jagged shards left in the frame
    const r = rng(`shards${id}${Date.now()}`);
    const mat = makeMat('GLASS', { transparent: true, opacity: 0.55, side: DoubleSide, depthWrite: false, spec: 0.6 });
    const W = win.w / 2, H = win.h / 2;
    const edges = [[-W, -H, W, -H], [W, -H, W, H], [W, H, -W, H], [-W, H, -W, -H]];
    const n = r.int(4, 7);
    const tris = [];
    for (let i = 0; i < n; i++) {
      const [ax, ay, bx, by] = edges[i % 4];
      const t0 = r.range(0, 0.6), t1 = t0 + r.range(0.2, 0.4);
      const p0 = [ax + (bx - ax) * t0, ay + (by - ay) * t0];
      const p1 = [ax + (bx - ax) * t1, ay + (by - ay) * t1];
      const tip = [(p0[0] + p1[0]) / 2 * r.range(0.2, 0.6), (p0[1] + p1[1]) / 2 * r.range(0.2, 0.6)];
      tris.push(...p0, 0, ...p1, 0, ...tip, 0);
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(tris, 3));
    geo.computeVertexNormals();
    const shards = new Mesh(geo, mat);
    win.glass.parent.add(shards);
    shards.position.copy(win.glass.position);
    win.shards = shards;
    // falling shard bodies
    const pieceMat = makeMat('GLASS', { transparent: true, opacity: 0.7, spec: 0.6 });
    const dir = impactDir ? impactDir.clone().normalize() : new Vector3();
    for (let i = 0; i < r.int(8, 15); i++) {
      const s = r.range(0.05, 0.12);
      const m = new Mesh(roundedBox(s, s * r.range(0.5, 1.2), 0.012, 0.004, 1), pieceMat);
      m.position.copy(win.center).add(new Vector3(r.range(-W, W), r.range(-H, H), 0).applyQuaternion(win.quat));
      m.rotation.set(r.range(0, 6), r.range(0, 6), r.range(0, 6));
      this.root.add(m);
      const e = this.physics.addDynamic(m, { mass: 0.05, restitution: 0.2 });
      e.body.setLinvel({ x: dir.x * 2 + r.range(-1, 1), y: r.range(0, 1.5), z: dir.z * 2 + r.range(-1, 1) }, true);
      this.debris.push({ mesh: m, entry: e, life: 10 });
    }
    Events.emit('noise', { position: win.center.clone(), loudness: 1.5, kind: 'glass', global: true });
    Events.emit('sfx', { name: 'glassBreak', position: win.center.clone() });
    Events.emit('window:broken', { id, window: win });
    return true;
  }

  // Slide a window up (unlocked windows only). Removes the glass collider.
  openWindow(id) {
    const win = this.windows.get(id);
    if (!win || win.broken || win.open || win.boards.length || win.locked) return false;
    win.open = true;
    win.glass.position.y += win.h * 0.85;
    if (win.collider) {
      this.physics.colliderData.delete(win.collider.handle);
      this.physics.world.removeCollider(win.collider, true);
      win.collider = null;
    }
    Events.emit('sfx', { name: 'windowSlide', position: win.center.clone() });
    Events.emit('noise', { position: win.center.clone(), loudness: 0.3, kind: 'window' });
    return true;
  }

  // Neighbor nails planks across (also covers a broken pane).
  boardUp(id, n = 3) {
    const win = this.windows.get(id);
    if (!win) return;
    const mat = makeMat('NH_PLANKS');
    for (let i = 0; i < n; i++) {
      const b = new Mesh(roundedBox(win.w + 0.45, 0.2, 0.05, 0.02, 2), mat);
      b.position.set(0, -win.h / 2 + 0.3 + i * (win.h - 0.5) / Math.max(1, n - 1), 0.14);
      b.rotation.z = (i % 2 ? -1 : 1) * (6 + i * 3) * DEG;
      b.castShadow = true;
      win.glass.parent.add(b);
      b.position.add(win.glass.position);
      win.boards.push(b);
    }
    if (!win.collider) {
      win.collider = this.physics.addStaticBox(win.center, new Vector3(win.w / 2, win.h / 2, 0.08), win.quat, { kind: 'boards', window: win });
    } else this.physics.colliderData.set(win.collider.handle, { kind: 'boards', window: win });
    Events.emit('window:boarded', { id });
  }

  removeBoard(id) {
    const win = this.windows.get(id);
    if (!win || !win.boards.length) return false;
    const b = win.boards.pop();
    b.parent.remove(b);
    Events.emit('noise', { position: win.center.clone(), loudness: 0.7, kind: 'pry' });
    if (!win.boards.length && win.collider && win.broken) {
      this.physics.colliderData.delete(win.collider.handle);
      this.physics.world.removeCollider(win.collider, true);
      win.collider = null;
    } else if (!win.boards.length && win.collider) {
      this.physics.colliderData.set(win.collider.handle, { kind: 'glass', window: win });
    }
    return true;
  }

  update(dt) {
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.life -= dt;
      if (d.life < 1) d.mesh.scale.setScalar(Math.max(0.01, d.life));
      if (d.life <= 0) {
        this.physics.removeDynamic(d.entry);
        d.mesh.parent?.remove(d.mesh);
        this.debris.splice(i, 1);
      }
    }
  }
}

export { Box3, Tex };
