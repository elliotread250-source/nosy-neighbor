// Little things: the too-tall gnome that turns to face you whenever you're
// not looking, and the front door's mail slot, where once (and only once)
// an eye looks back.
import { Vector3, Box3, Object3D, Frustum, Matrix4, MathUtils } from 'three';
import { Events } from '../core/Events.js';

const _v = new Vector3();
const _fr = new Frustum();
const _m = new Matrix4();

export class Extras {
  constructor(game) {
    this.game = game;
    this.gnome = game.world.yard?.gnome ?? null;
    this.peeks = 0;
    this.scareUsed = false;
    this.mode = null;
    this._mailSlot();
  }

  // ------------------------------------------------------------ the gnome
  _updateGnome(dt) {
    const gn = this.gnome;
    if (!gn) return;
    const cam = this.game.engine.camera;
    cam.updateMatrixWorld();
    _m.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    _fr.setFromProjectionMatrix(_m);
    gn.getWorldPosition(_v);
    const seen = _fr.containsPoint(_v.clone().add(new Vector3(0, 0.5, 0))) && _v.distanceTo(cam.position) < 60;
    if (seen) return;
    // turn, slowly, to face you
    const p = this.game.player.curFeet;
    const want = Math.atan2(p.x - _v.x, p.z - _v.z);
    let d = want - gn.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    gn.rotation.y += MathUtils.clamp(d, -dt * 0.5, dt * 0.5);
  }

  // ------------------------------------------------------------ the mail slot
  _mailSlot() {
    const door = this.game.world.doors?.get('d-front');
    const ix = this.game.interaction;
    if (!door || !ix) return;
    this.door = door;
    const marker = new Object3D();
    marker.position.set(door.w / 2, 1.2, 0);
    door.pivot.add(marker);
    this.slotMarker = marker;
    ix.addTarget({
      obj: marker,
      dynamicBox: (box) => { marker.getWorldPosition(_v); box.setFromCenterAndSize(_v, new Vector3(0.5, 0.25, 0.5)); },
      box: new Box3(),
      enabled: () => !door.isOpen && this.game.player.curFeet.z > door.pivot.position.z,
      label: 'Peek through the mail slot',
      act: () => this.peek(),
    });
  }

  peek() {
    const g = this.game;
    const p = g.player;
    this.mode = 'peek';
    this.t = 0;
    this.peeks++;
    // the scare happens once per session: a coin flip on early peeks, certain by the third
    this.scareNow = !this.scareUsed && (this.peeks >= 3 || Math.random() < 0.4);
    p.enabled = false;
    p.externalCamera = true;
    const cam = p.camera;
    this.slotMarker.getWorldPosition(_v);
    cam.position.set(_v.x, _v.y, _v.z + 0.05);
    cam.lookAt(_v.x, _v.y - 0.15, _v.z - 6);
    cam.fov = 55;
    cam.updateProjectionMatrix();
    Events.emit('mailslot', { on: true });
    Events.emit('sfx', { name: 'clunk', position: _v.clone() });
  }

  _endPeek() {
    const p = this.game.player;
    this.mode = null;
    p.externalCamera = false;
    p.enabled = true;
    p.camera.fov = p.fov;
    p.camera.updateProjectionMatrix();
    Events.emit('mailslot', { on: false });
  }

  _updatePeek(dt) {
    const g = this.game;
    this.t += dt;
    const inp = g.input;
    if (this.scareNow && this.t > 1.4 && !this.scared) {
      this.scared = true;
      this.scareUsed = true;
      Events.emit('mailslot:eye', {});
      Events.emit('sfx', { name: 'stinger' });
      Events.emit('voice', { line: 'hm', position: this.door.worldCenter(new Vector3()).add(new Vector3(0, -1, -0.5)) });
      g.postfx.flash = 0.25;
    }
    if (this.scared && this.t > 2.8) { this.scared = false; this.scareNow = false; this._endPeek(); return; }
    if (this.t > 0.3 && !this.scareNow && (inp.pressed('interact') || inp.pressed('jump') || inp.pressed('drop') || inp.moveAxis().some((v) => Math.abs(v) > 0.5))) this._endPeek();
  }

  update(dt) {
    this._updateGnome(dt);
    if (this.mode === 'peek') this._updatePeek(dt);
  }

  beforeCatch() {
    if (this.mode === 'peek') { this.scareNow = false; this.scared = false; this._endPeek(); }
  }
}
