// Four slots for things you carry in your hand, plus a keyring that never
// fills up. Held props keep their physics entry; the body is just switched
// off and the mesh rides in the right hand until it's thrown or dropped.
import { Group, Vector3, Quaternion, Box3, MathUtils } from 'three';
import { Events } from '../core/Events.js';
import { ITEM_DEFS, KEY_NAMES } from './Items.js';

const _p = new Vector3();
const _q = new Quaternion();

export class Inventory {
  constructor(game) {
    this.game = game;
    this.slots = [null, null, null, null];
    this.sel = 0;
    this.keys = new Set();
    this.anchor = new Group();
    this.anchor.name = 'heldAnchor';
    this.anchor.position.set(-0.01, 0.05, -0.08);
    game.player.handR.add(this.anchor);
  }

  get held() { return this.slots[this.sel]; }
  get full() { return this.slots.every(Boolean); }
  get count() { return this.slots.filter(Boolean).length; }

  has(kind) { return this.slots.some((s) => s && s.kind === kind); }
  hasKey(color) { return this.keys.has(color); }

  select(i) {
    if (i === this.sel || i < 0 || i > 3) return;
    this.sel = i;
    this._refresh();
    Events.emit('inventory:select', { slot: i, item: this.held?.kind ?? null });
  }

  cycle(d) {
    this.select((this.sel + d + 4) % 4);
  }

  addKey(color) {
    if (this.keys.has(color)) return;
    this.keys.add(color);
    Events.emit('key:pickup', { color, label: KEY_NAMES[color] ?? color });
    Events.emit('sfx', { name: 'keyJingle' });
    Events.emit('inventory:changed', {});
  }

  // A physics prop (small throwable or tool) goes into a slot.
  addProp(entry) {
    let i = this.slots[this.sel] ? this.slots.findIndex((s) => !s) : this.sel;
    if (i < 0) return false;
    const data = entry.data || {};
    const kind = data.item || 'thing';
    entry.held = true;
    entry.body.setEnabled(false);
    const obj = entry.mesh;
    // big things shrink to a hand-sized silhouette while held
    obj.scale.set(1, 1, 1);
    obj.updateMatrixWorld(true);
    const size = new Box3().setFromObject(obj).getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 0.2;
    const scale = data.tool ? 0.85 : MathUtils.clamp(0.18 / maxDim, 0.4, 1);
    this.anchor.add(obj);
    obj.scale.setScalar(scale);
    const hold = ITEM_DEFS[kind]?.hold;
    obj.position.set(...(hold?.pos ?? [0, -0.02, -0.06]));
    obj.rotation.set(...(hold?.rot ?? [0.3, 0.6, 0]));
    obj.traverse((m) => { if (m.isMesh) m.castShadow = false; });
    const item = { kind, entry, obj, data, label: data.label ?? kind, tool: !!data.tool };
    this.slots[i] = item;
    this.sel = i;
    this._refresh();
    Events.emit('item:pickup', { item: kind, label: item.label });
    Events.emit('sfx', { name: item.tool ? 'pickupTool' : 'pickup' });
    Events.emit('inventory:changed', {});
    return true;
  }

  // Take an item out of the hand and give it back to the world.
  release(item, pos, quat, vel = null, angvel = null) {
    const i = this.slots.indexOf(item);
    if (i < 0) return;
    this.slots[i] = null;
    const { entry, obj } = item;
    const scene = this.game.engine.scene;
    scene.add(obj);
    obj.position.copy(pos);
    obj.quaternion.copy(quat);
    obj.scale.set(1, 1, 1);
    obj.visible = true;
    obj.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    entry.held = false;
    entry.body.setEnabled(true);
    this.game.physics.resetEntry(entry, pos, quat);
    entry.body.setLinvel(vel ?? { x: 0, y: 0, z: 0 }, true);
    entry.body.setAngvel(angvel ?? { x: 0, y: 0, z: 0 }, true);
    entry.body.wakeUp();
    this._refresh();
    Events.emit('inventory:changed', {});
  }

  // World pose of the held item right now (for throws and drops).
  heldPose(item, outP = _p, outQ = _q) {
    item.obj.getWorldPosition(outP);
    item.obj.getWorldQuaternion(outQ);
    return [outP, outQ];
  }

  _refresh() {
    this.slots.forEach((s, i) => { if (s) s.obj.visible = i === this.sel; });
  }

  // Everything in the slots (not keys) falls to the floor at p.
  dropAll(p) {
    for (const item of [...this.slots]) {
      if (!item) continue;
      const pos = p.clone().add(new Vector3((Math.random() - 0.5) * 0.8, 0.5 + Math.random() * 0.3, (Math.random() - 0.5) * 0.8));
      this.release(item, pos, new Quaternion(), { x: 0, y: 1, z: 0 });
    }
  }
}
