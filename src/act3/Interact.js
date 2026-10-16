// The interaction system (spec 25): every interactable has an id, a
// position, a prompt, preconditions as plain data and a handler that only
// changes flags and emits events. Puzzle state is one flat object, saved to
// localStorage inside try/catch (the game still runs when storage is
// blocked), reset with ?reset=1 or the pause menu.
//
// Controls: E use / pick up / place, hold E for timed actions (bolts,
// keycard), G drop, left click throws a light object you are holding.
import { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, Vector3, Raycaster, Quaternion } from 'three';
import { Events } from '../core/Events.js';
import { val } from './Spec.js';
import { look } from './Look.js';
import { partsMesh } from './Props.js';

const SAVE_KEY = 'act3-house-study-save-v1';
const REACH = 2.2;
const _v = new Vector3();

// a plain dress-form mannequin, 1.75 m by default (section 20)
export function mannequinMesh(h = 1.75, o = {}) {
  const k = h / 1.75;
  const c = o.color ?? '#e8d8c4';
  const g = partsMesh([
    { s: 'cyl', r: 0.16 * k, h: 0.03 * k, x: 0, y: 0, z: 0, c: 'WOOD_DARK' },
    { s: 'cyl', r: 0.02 * k, h: 0.8 * k, x: 0, y: 0, z: 0, c: 'WOOD_DARK' },
    { s: 'box', w: 0.34 * k, h: 0.22 * k, d: 0.2 * k, x: 0, y: 0.8 * k, z: 0, c },
    { s: 'box', w: 0.4 * k, h: 0.45 * k, d: 0.22 * k, x: 0, y: 1.02 * k, z: 0, c },
    { s: 'box', w: 0.08 * k, h: 0.5 * k, d: 0.08 * k, x: 0.25 * k, y: 0.95 * k, z: 0, c },
    { s: 'box', w: 0.08 * k, h: 0.5 * k, d: 0.08 * k, x: -0.25 * k, y: 0.95 * k, z: 0, c },
    { s: 'cyl', r: 0.05 * k, h: 0.08 * k, x: 0, y: 1.47 * k, z: 0, c },
    { s: 'ball', r: 0.11 * k, x: 0, y: 1.53 * k, z: 0, c },
  ]);
  if (o.bag) {
    const bag = new Mesh(new BoxGeometry(0.55 * k, 1.8 * k, 0.4 * k).translate(0, 0.9 * k, 0));
    look(bag, '#c8d4dc', { opacity: 0.45 });
    g.add(bag);
  }
  g.userData.mannequin = true;
  return g;
}

export class Interact {
  constructor(app) {
    this.app = app;
    this.targets = [];
    this.items = new Set();
    this.flags = {};
    this.mannequins = new Map(); // id -> { mesh, where }
    this.carried = null; // mannequin id
    this.held = null; // { entry } light physics prop
    this.thrown = [];
    this.holdT = 0;
    this.ray = new Raycaster();
    this.prompt = '';
    this.root = new Group();
    this.root.name = 'act3-interact';
    app.engine.scene.add(this.root);
    this.ui = this._ui();
  }

  _ui() {
    const hud = document.getElementById('hud');
    const el = document.createElement('div');
    el.className = 'a3-prompt';
    const bar = document.createElement('div');
    bar.className = 'a3-items';
    const obj = document.createElement('div');
    obj.className = 'a3-objective';
    const ring = document.createElement('div');
    ring.className = 'a3-hold';
    hud.append(el, bar, obj, ring);
    return { prompt: el, bar, obj, ring };
  }

  add(t) { this.targets.push(t); return t; }

  // ------------------------------------------------------------ build the puzzle
  build(puzzle, plan) {
    const A = this.app;
    const elev = Object.fromEntries(plan.floors.map((f) => [f.id, f.floorSlab.y1]));
    this.puzzle = puzzle;
    // items
    for (const it of puzzle.items) {
      const y0 = elev[it.floor] ?? 0;
      const k = it.kind === 'keycard' ? val(it.cartoonScale, 2) : 1;
      const mesh = it.kind === 'crowbar'
        ? partsMesh([{ s: 'box', w: 0.025, h: 0.025, d: val(it.size[0], 0.6), x: 0, y: 0, z: 0, c: 'TOMATO' }, { s: 'box', w: 0.025, h: 0.08, d: 0.025, x: 0, y: 0, z: val(it.size[0], 0.6) / 2, c: 'METAL_DARK' }])
        : partsMesh([{ s: 'box', w: val(it.size[0]) * k, h: val(it.size[2]) * k * 2, d: val(it.size[1]) * k, x: 0, y: 0, z: 0, c: 'KEY_BLUE' }]);
      mesh.position.set(it.at.x, y0 + it.at.y, it.at.z);
      this.root.add(mesh);
      this.add({
        id: it.id, pos: () => mesh.position, radius: 0.35,
        prompt: () => `Pick up the ${it.kind}`,
        visible: () => !this.items.has(it.id),
        act: () => { this.items.add(it.id); mesh.visible = false; this.flags[`has_${it.id}`] = true; this.say(`Got the ${it.kind}.`); this.save(); },
        onRestore: () => { if (this.items.has(it.id)) mesh.visible = false; },
      });
    }
    this._basement();
    this._train(puzzle);
    this._mannequins(puzzle, elev);
    this._pads(puzzle, elev);
    // a light physics prop can be picked up and thrown (to hit camera switches)
    for (const e of A.props.dynamics) {
      if (!e.collider || e.collider.mass() > 4) continue;
      this.add({ id: `prop_${e.feature ?? e.body.handle}`, pos: () => e.mesh.position, radius: 0.4, light: true, prompt: () => 'Pick up', visible: () => !this.held && !this.carried, act: () => this._pickProp(e) });
    }
  }

  // the sealed basement door: six bolts (crowbar, 1.5 s each), the boards
  // fall when their two bolts are out, then the keycard panel (0.4 s)
  _basement() {
    const d = this.app.openings.byId.get('basement_door');
    if (!d?.bolts) return;
    const hold = val(this.puzzle.basement.boltHold, 1.5), kh = val(this.puzzle.basement.keycardHold, 0.4);
    for (const b of d.bolts) {
      this.add({
        id: b.id, pos: () => b.mesh.getWorldPosition(new Vector3()), radius: 0.12, hold,
        requires: { item: 'crowbar' },
        visible: () => !this.flags[b.id],
        prompt: () => 'Pry out the bolt (hold E)',
        act: () => this._removeBolt(d, b),
      });
    }
    this.add({
      id: 'basement_keycard_lock', pos: () => d.panel.getWorldPosition(new Vector3()), radius: 0.15, hold: kh,
      requires: { item: 'keycard', flags: d.bolts.map((b) => b.id) },
      visible: () => !this.flags.basement_unlocked,
      prompt: () => 'Swipe the keycard (hold E)',
      why: () => (!d.bolts.every((b) => this.flags[b.id]) ? 'The boards are still bolted across the door' : null),
      act: () => this._unlock(d),
    });
  }

  _removeBolt(d, b, quiet = false) {
    this.flags[b.id] = true;
    b.mesh.visible = false;
    if (!quiet) {
      Events.emit('bolt_removed', { id: b.id, position: b.mesh.getWorldPosition(new Vector3()), loudness: 45 });
      this.app.audio?.clank();
      this.say('The bolt gives with a clank.', 'clank');
      // drop the bolt as a physics prop
      const m = new Mesh(new CylinderGeometry(0.012, 0.012, 0.08, 6));
      look(m, 'METAL_DARK');
      b.mesh.getWorldPosition(m.position);
      this.app.engine.scene.add(m);
      this.app.physics.addDynamic(m, { mass: 0.1, half: { x: 0.012, y: 0.04, z: 0.012 } });
    }
    const board = d.boards[b.board];
    if (board.bolts.every((x) => this.flags[x.id]) && board.collider) {
      this.app.physics.world.removeCollider(board.collider, true);
      board.collider = null;
      if (quiet) board.mesh.visible = false;
      else {
        const m = board.mesh;
        const wp = m.getWorldPosition(new Vector3()), wq = m.getWorldQuaternion(new Quaternion());
        this.app.engine.scene.attach(m);
        m.position.copy(wp);
        m.quaternion.copy(wq);
        m.position.y += 0.07;
        this.app.physics.addDynamic(m, { mass: 2, half: { x: 0.575, y: 0.07, z: 0.019 } });
      }
    }
    this.save();
  }

  _unlock(d, quiet = false) {
    this.flags.basement_unlocked = true;
    look(d.led, '#20ff60', { emissive: '#20ff60', keep: true });
    if (d.leafCollider) { this.app.physics.world.removeCollider(d.leafCollider, true); d.leafCollider = null; }
    d.leaf.rotation.y = -1.6;
    d.leaf.position.x = -d.w / 2;
    if (!quiet) { Events.emit('door_unlocked', { id: 'basement_door' }); this.app.audio?.chirp(); this.say('Keycard accepted. The door swings open.', 'chirp'); }
    this.save();
  }

  // button then lever (section 19.4): the order is data; a wrong order resets with a buzz
  _train(puzzle) {
    const A = this.app;
    const seq = puzzle.train.sequence;
    this.seqIdx = 0;
    const btn = A.props.byId.get('train_button'), lev = A.props.byId.get('train_lever');
    const fault = A.props.byId.get('train_fault');
    this.fault = fault;
    if (lev?.group) {
      const handle = new Mesh(new BoxGeometry(0.04, 0.45, 0.04).translate(0, 0.22, 0));
      look(handle, 'TOMATO');
      handle.position.set(0, val(lev.size[2], 0.9), 0);
      handle.rotation.x = 0.5;
      lev.group.add(handle);
      lev.handle = handle;
    }
    const press = (id) => {
      if (this.flags.train_started) return;
      if (seq[this.seqIdx] === id) {
        this.seqIdx++;
        if (id === 'train_button') { A.audio?.click(); this.say('Click.', 'click'); }
        if (id === 'train_lever') { A.audio?.clunk(); this.say('Clunk.', 'clunk'); }
        if (this.seqIdx >= seq.length) {
          this.flags.train_started = true;
          A.train?.start();
          Events.emit('train_started', {});
          this.say('Somewhere on the roof, a little train starts to chuff.', 'train');
          this.save();
        }
      } else { this.seqIdx = 0; A.audio?.buzz(); this.say('Bzzzt. Wrong order.', 'buzz'); }
    };
    if (btn) this.add({ id: 'train_button', pos: () => btn.pos.clone().add(new Vector3(0, 1.0, 0)), radius: 0.2, prompt: () => 'Press the button', act: () => { const cap = btn.group.getObjectByName('cap'); if (cap) { cap.position.y = -0.03; setTimeout(() => { cap.position.y = 0; }, 300); } press('train_button'); } });
    if (lev) this.add({ id: 'train_lever', pos: () => lev.pos.clone().add(new Vector3(0, 1.0, 0)), radius: 0.25, prompt: () => 'Pull the lever', act: () => { if (lev.handle) { lev.handle.rotation.x = -0.55; setTimeout(() => { if (!this.flags.train_started) lev.handle.rotation.x = 0.5; }, 600); } press('train_lever'); } });
  }

  // five mannequins (count is data): each can be carried two-handed
  _mannequins(puzzle, elev) {
    const A = this.app;
    const H = val(puzzle.mannequinHeight, 1.75);
    for (const m of puzzle.mannequins) {
      const mesh = mannequinMesh(H, { bag: m.bagged });
      this.root.add(mesh);
      const rec = { id: m.id, def: m, mesh, where: 'start' };
      this.mannequins.set(m.id, rec);
      if (m.sheet) {
        const sheet = partsMesh([{ s: 'box', w: 0.6, h: 1.65, d: 0.55, x: 0, y: 0, z: 0, c: '#e8e4dc' }, { s: 'ball', r: 0.22, x: 0, y: 1.55, z: 0, c: '#e8e4dc' }]);
        mesh.add(sheet);
        rec.sheet = sheet;
      }
      this._placeStart(rec, elev);
      this.add({
        id: m.id, pos: () => mesh.getWorldPosition(_v).clone().add(new Vector3(0, 1.0, 0)), radius: 0.45,
        visible: () => rec.where !== 'carried' && !this.carried && !rec.where.startsWith('pad'),
        prompt: () => (rec.sheet?.visible !== false && rec.sheet ? 'Pull off the dust sheet' : m.bagged && rec.where === 'start' ? 'Take the mannequin out of the bag' : 'Pick up the mannequin'),
        why: () => (m.onTrain && A.train?.running && !A.train.riding ? 'It is riding the train: stop it or hop on' : null),
        act: () => {
          if (rec.sheet && rec.sheet.visible !== false) { rec.sheet.visible = false; this.flags[`${m.id}_uncovered`] = true; this.save(); return; }
          this._carry(rec);
        },
      });
    }
  }

  _placeStart(rec, elev) {
    const A = this.app, m = rec.def, mesh = rec.mesh;
    if (m.onTrain && A.train) {
      const car = A.train.lastCar();
      car.group.add(mesh);
      mesh.position.set(0, car.top - 0.75, 0);
      mesh.scale.setScalar(1);
      return;
    }
    if (m.onWindmill && A.roof?.windmill) {
      const w = A.roof.windmill;
      A.engine.scene.add(mesh);
      mesh.position.copy(w.hubWorld).add(new Vector3(0, -0.2 - 1.75 * 0.88, 0.05));
      return;
    }
    // puzzle.json stores absolute heights
    mesh.position.set(m.at.x, m.at.y, m.at.z);
    void elev;
  }

  _pads(puzzle, elev) {
    const b = puzzle.birthday;
    const y0 = elev.F1 ?? 3.7;
    this.pads = b.pads.map((p, i) => {
      const m = new Mesh(new CylinderGeometry(val(b.padDiameter, 0.6) / 2, val(b.padDiameter, 0.6) / 2, 0.02, 24).translate(0, 0.01, 0));
      look(m, 'NH_PLANKS');
      m.position.set(p.x, y0, p.z);
      this.root.add(m);
      const pad = { i, mesh: m, taken: null };
      this.add({
        id: `birthday_pad_${i + 1}`, pos: () => m.position.clone().add(new Vector3(0, 0.3, 0)), radius: 0.4,
        visible: () => !pad.taken,
        requires: { carrying: true },
        why: () => (!this.carried ? 'Bring a mannequin here' : null),
        prompt: () => `Stand the mannequin on pad ${i + 1}`,
        act: () => this._placeOnPad(pad),
      });
      return pad;
    });
  }

  _placeOnPad(pad, id = this.carried, quiet = false) {
    const rec = this.mannequins.get(id);
    if (!rec) return;
    this.app.engine.scene.attach(rec.mesh);
    rec.mesh.position.copy(pad.mesh.position);
    rec.mesh.rotation.set(0, -Math.PI / 2, 0);
    rec.where = `pad:${pad.i}`;
    pad.taken = id;
    if (this.carried === id) { this.carried = null; this.app.player.speedMul = 1; }
    const placed = this.pads.filter((p) => p.taken).length;
    this.app.audio?.musicBox?.(placed);
    if (!quiet) this.say(`Mannequin ${placed} of ${this.puzzle.birthday.mannequinCount} in place.`);
    if (placed >= this.puzzle.birthday.mannequinCount && !this.flags.birthday_complete) {
      this.flags.birthday_complete = true;
      Events.emit('puzzle_complete', { id: 'birthday' });
      if (!quiet) this.say('The disco ball flickers on. The party can start.', 'party');
      this.app.celebrate?.();
    }
    this.save();
  }

  _carry(rec) {
    this.app.engine.scene.attach(rec.mesh);
    this.carried = rec.id;
    rec.where = 'carried';
    this.app.player.speedMul = 0.6; // two-handed: 60 percent speed (section 25.1)
    this.say('Carrying a mannequin. E on a birthday pad to stand it there, G to set it down.');
    this.save();
  }

  _dropCarry() {
    const rec = this.mannequins.get(this.carried);
    if (!rec) return;
    const p = this.app.player.curFeet;
    const yaw = this.app.player.yaw;
    rec.mesh.position.set(p.x - Math.sin(yaw) * 0.7, p.y, p.z - Math.cos(yaw) * 0.7);
    rec.mesh.rotation.set(0, yaw, 0);
    rec.where = `floor:${rec.mesh.position.x.toFixed(2)},${rec.mesh.position.y.toFixed(2)},${rec.mesh.position.z.toFixed(2)}`;
    this.carried = null;
    this.app.player.speedMul = 1;
    this.save();
  }

  _pickProp(e) {
    this.held = e;
    e.body.setBodyType(2, true); // kinematic position based
  }

  _throw(strength = 7) {
    const e = this.held;
    if (!e) return;
    this.held = null;
    e.body.setBodyType(0, true);
    const cam = this.app.engine.camera;
    const dir = new Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const m = e.collider.mass();
    e.body.setLinvel({ x: dir.x * strength, y: dir.y * strength + 1.2, z: dir.z * strength }, true);
    void m;
    this.thrown.push({ mesh: e.mesh, t: 0 });
  }

  // ------------------------------------------------------------ per frame
  update(dt) {
    const A = this.app;
    const cam = A.engine.camera;
    // carried mannequin and held prop follow the camera
    if (this.carried) {
      const rec = this.mannequins.get(this.carried);
      const p = A.player.curFeet, yaw = A.player.yaw;
      rec.mesh.position.set(p.x - Math.sin(yaw) * 0.55, p.y + 0.15, p.z - Math.cos(yaw) * 0.55);
      rec.mesh.rotation.set(0, yaw + Math.PI, 0);
    }
    if (this.held) {
      const t = new Vector3(0.25, -0.25, -0.8).applyQuaternion(cam.quaternion).add(cam.position);
      this.held.body.setNextKinematicTranslation({ x: t.x, y: t.y, z: t.z });
    }
    for (const t of this.thrown) { t.t += dt; t.position = t.mesh.position; }
    this.thrown = this.thrown.filter((t) => t.t < 2.5);

    // what the crosshair is on
    const origin = cam.position, dir = new Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    this.ray.set(origin, dir);
    this.ray.far = REACH + 0.5;
    const wall = this.ray.intersectObjects(A.house.meshes, false)[0];
    const wallD = wall ? wall.distance : Infinity;
    let best = null, bd = Infinity;
    for (const t of this.targets) {
      if (t.visible && !t.visible()) continue;
      const p = t.pos();
      _v.copy(p).sub(origin);
      const along = _v.dot(dir);
      if (along < 0.1 || along > REACH || along > wallD + 0.15) continue;
      const perp = _v.addScaledVector(dir, -along).length();
      if (perp > t.radius) continue;
      if (perp + along * 0.05 < bd) { bd = perp + along * 0.05; best = t; }
    }
    this.target = best;
    const inp = A.input;
    let text = '', ok = false;
    if (best) {
      const miss = this._missing(best);
      ok = !miss;
      text = miss ? `${best.prompt()}  (${miss})` : `E  ${best.prompt()}`;
    } else if (this.carried) text = 'G  set the mannequin down';
    else if (this.held) text = 'Click to throw  ·  G drop';
    this.ui.prompt.textContent = text;
    this.ui.prompt.classList.toggle('show', !!text);
    this.ui.prompt.classList.toggle('blocked', !!best && !ok);
    document.querySelector('.a3-cross')?.classList.toggle('hand', !!best && ok);

    if (A.tools.mode === 'ruler') return;
    // timed and instant actions
    const eDown = inp.held.has('KeyE');
    if (best && ok && best.hold) {
      if (eDown) {
        this.holdT += dt;
        this.ui.ring.style.setProperty('--p', `${Math.min(1, this.holdT / best.hold) * 100}%`);
        this.ui.ring.classList.add('show');
        if (best.id.startsWith('basement_bolt') && Math.floor(this.holdT * 6) !== Math.floor((this.holdT - dt) * 6)) A.audio?.creak?.();
        if (this.holdT >= best.hold) { this.holdT = 0; best.act(); }
      } else { this.holdT = 0; this.ui.ring.classList.remove('show'); }
    } else {
      this.holdT = 0;
      this.ui.ring.classList.remove('show');
      if (inp.keyPressed('KeyE')) {
        if (best && ok) best.act();
        else if (best && !ok) A.audio?.buzz?.();
      }
    }
    if (inp.keyPressed('KeyG')) { if (this.carried) this._dropCarry(); else if (this.held) { const e = this.held; this.held = null; e.body.setBodyType(0, true); } }
    if (inp.keyPressed('Mouse0') && this.held) this._throw();
    this._items();
  }

  _missing(t) {
    const r = t.requires;
    if (t.why) { const w = t.why(); if (w) return w; }
    if (!r) return null;
    if (r.item && !this.items.has(r.item)) return `Needs the ${r.item}`;
    if (r.flags && !r.flags.every((f) => this.flags[f])) return 'Not yet';
    if (r.carrying && !this.carried) return 'Bring a mannequin here';
    return null;
  }

  _items() {
    const list = [...this.items].map((i) => `<span>${i}</span>`);
    if (this.carried) list.push('<span>mannequin</span>');
    const html = list.join('');
    if (html !== this._lastItems) { this.ui.bar.innerHTML = html; this._lastItems = html; }
  }

  say(text, cue) {
    this.app.hint(text, 3.5);
    if (cue) Events.emit('subtitle', { text, cue });
  }

  // ------------------------------------------------------------ save
  snapshot() {
    return {
      flags: this.flags, items: [...this.items],
      mannequins: Object.fromEntries([...this.mannequins].map(([id, r]) => [id, r.where === 'carried' ? 'start' : r.where])),
      sheets: Object.fromEntries([...this.mannequins].filter(([, r]) => r.sheet).map(([id, r]) => [id, r.sheet.visible !== false])),
      security: this.app.security?.state(),
    };
  }

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.snapshot())); } catch { /* storage blocked: the game still runs */ }
  }

  load() {
    let s = null;
    try {
      if (new URLSearchParams(location.search).get('reset') === '1') localStorage.removeItem(SAVE_KEY);
      s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    } catch { s = null; }
    if (!s) return false;
    this.restore(s);
    return true;
  }

  restore(s) {
    this.flags = { ...(s.flags || {}) };
    this.items = new Set(s.items || []);
    for (const t of this.targets) t.onRestore?.();
    const d = this.app.openings.byId.get('basement_door');
    if (d?.bolts) for (const b of d.bolts) if (this.flags[b.id]) this._removeBolt(d, b, true);
    if (this.flags.basement_unlocked && d) this._unlock(d, true);
    for (const [id, open] of Object.entries(s.sheets || {})) { const r = this.mannequins.get(id); if (r?.sheet && !open) r.sheet.visible = false; }
    for (const [id, where] of Object.entries(s.mannequins || {})) {
      const r = this.mannequins.get(id);
      if (!r) continue;
      if (where.startsWith('pad:')) this._placeOnPad(this.pads[Number(where.slice(4))], id, true);
      else if (where.startsWith('floor:')) { const [x, y, z] = where.slice(6).split(',').map(Number); this.app.engine.scene.attach(r.mesh); r.mesh.position.set(x, y, z); r.where = where; }
    }
    if (this.flags.train_started && this.app.train) { this.app.train.start(); this.app.train.travelled = this.app.train.laps * this.app.train.L; }
    this.app.security?.restore(s.security);
  }

  reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    location.search = '?reset=1';
  }
}

export { SphereGeometry };
