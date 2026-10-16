// The house's gadgets and the things you find in it. Lures (TV, kettle,
// radio, toaster, alarm clock) make noise until he walks over and switches
// them off, muttering. Keys glow and bob where they lie. Tools start out as
// physics props in their spots. The pool valve needs the wrench.
import { Vector3, Group, MathUtils } from 'three';
import { Events } from '../core/Events.js';
import { Palette } from '../art/Palette.js';
import { FLOOR_Y } from '../world/NeighborPlan.js';
import { PLAYER_HOUSE } from '../world/PlayerHouse.js';
import { buildKey, TOOL_BUILDERS, KEY_NAMES } from './Items.js';

const _v = new Vector3();

// Lure sounds: how loud, how often a pulse goes out, how long it runs.
const LURES = {
  tv: { loud: 1.6, period: 2.2, delay: 0.2, dur: 60, sfx: 'tvLoop', label: 'TV' },
  radio: { loud: 1.5, period: 2.4, delay: 0.3, dur: 60, sfx: 'radioLoop', label: 'radio' },
  kettle: { loud: 1.8, period: 1.8, delay: 4, dur: 30, sfx: 'kettleWhistle', label: 'kettle' },
  toaster: { loud: 1.1, period: 99, delay: 3.5, dur: 0.5, sfx: 'toasterPop', label: 'toaster' },
  alarm: { loud: 1.8, period: 1.4, delay: 5, dur: 20, sfx: 'alarmRing', label: 'alarm clock' },
};

export class Devices {
  constructor(game) {
    this.game = game;
    this.ix = game.interaction;
    this.lures = [];
    this.pickups = [];
    this.serial = 0;
    this.time = 0;
    const world = game.world;
    if (!world.interior) return;
    for (const it of world.interior.interactables) this._device(it);
    this._placeKeys();
    this._placeTools();
    this._yard();
  }

  // ------------------------------------------------------------ lures
  startLure(kind, posFn, opts = {}) {
    const L = LURES[kind];
    const lure = { kind, id: `${kind}-${++this.serial}`, pos: posFn, t: -(opts.delay ?? L.delay), dur: opts.dur ?? L.dur, next: 0, L, onStop: opts.onStop };
    this.lures.push(lure);
    Events.emit('lure:start', { kind, id: lure.id });
    return lure;
  }

  stopLure(lure, by = 'player') {
    const i = this.lures.indexOf(lure);
    if (i < 0) return;
    this.lures.splice(i, 1);
    lure.onStop?.(by);
    Events.emit('lure:stop', { kind: lure.kind, id: lure.id, by });
    Events.emit('sfx', { name: `${lure.L.sfx}Stop`, id: lure.id });
  }

  activeLure(kind, ref) {
    return this.lures.find((l) => l.kind === kind && l.ref === ref);
  }

  armAlarm(entry) {
    if (this.lures.some((l) => l.ref === entry)) return;
    const lure = this.startLure('alarm', () => entry.mesh.getWorldPosition(_v));
    lure.ref = entry;
    Events.emit('hint', { text: 'Alarm set: 5 seconds' });
  }

  remote() {
    const tv = this.tvs?.[0];
    if (tv) tv.toggle();
  }

  // ------------------------------------------------------------ devices from the house
  _device(it) {
    const ix = this.ix;
    const pos = () => it.obj.getWorldPosition(new Vector3()).add(new Vector3(0, 0.5, 0));
    switch (it.kind) {
      case 'tv': {
        const screen = it.obj.userData.screen;
        const dev = { it, on: false, lure: null };
        const setScreen = (on) => {
          if (!screen) return;
          screen.material.color.copy(on ? Palette.TV_SCREEN_ON : Palette.TV_SCREEN_OFF);
          screen.material.emissive.copy(Palette.TV_SCREEN_ON);
          screen.material.emissiveIntensity = on ? 0.9 : 0;
        };
        setScreen(false);
        dev.toggle = () => {
          dev.on = !dev.on;
          setScreen(dev.on);
          Events.emit('sfx', { name: dev.on ? 'tvOn' : 'tvOff', position: pos() });
          if (dev.on) {
            dev.lure = this.startLure('tv', pos, { onStop: () => { dev.on = false; dev.lure = null; setScreen(false); } });
            dev.lure.ref = dev;
          } else if (dev.lure) this.stopLure(dev.lure);
        };
        dev.flicker = (t) => { if (dev.on && screen) screen.material.emissiveIntensity = 0.75 + Math.sin(t * 23) * 0.1 + Math.sin(t * 7.1) * 0.12; };
        (this.tvs ??= []).push(dev);
        ix.addTarget({ obj: it.obj, label: () => (dev.on ? 'Turn the TV off' : 'Turn the TV on (loud)'), act: () => dev.toggle() });
        break;
      }
      case 'radio': {
        const dev = { on: false, lure: null };
        dev.toggle = () => {
          dev.on = !dev.on;
          Events.emit('sfx', { name: 'click', position: pos() });
          if (dev.on) dev.lure = this.startLure('radio', pos, { onStop: () => { dev.on = false; dev.lure = null; } });
          else if (dev.lure) this.stopLure(dev.lure);
        };
        ix.addTarget({ obj: it.obj, label: () => (dev.on ? 'Turn the radio off' : 'Turn the radio on (loud)'), act: () => dev.toggle() });
        break;
      }
      case 'kettle': {
        const dev = { lure: null };
        ix.addTarget({
          obj: it.obj,
          label: () => (dev.lure ? (dev.lure.t < 0 ? 'The kettle is heating up' : 'Take the kettle off') : 'Put the kettle on'),
          act: () => {
            if (dev.lure) { if (dev.lure.t >= 0) this.stopLure(dev.lure); return; }
            Events.emit('sfx', { name: 'kettleOn', position: pos() });
            dev.lure = this.startLure('kettle', pos, { onStop: () => { dev.lure = null; } });
          },
        });
        break;
      }
      case 'toaster': {
        const dev = { lure: null };
        ix.addTarget({
          obj: it.obj, label: () => (dev.lure ? null : 'Push the toaster lever'),
          act: () => {
            Events.emit('sfx', { name: 'toasterDown', position: pos() });
            dev.lure = this.startLure('toaster', pos, { onStop: () => { dev.lure = null; } });
          },
        });
        break;
      }
      case 'decoyKeys':
        ix.addTarget({
          obj: it.obj, label: 'Rummage through the keys',
          act: () => {
            Events.emit('sfx', { name: 'keyJingle', position: pos() });
            Events.emit('noise', { position: pos(), loudness: it.noise ?? 0.45, kind: 'jingle' });
            Events.emit('hint', { text: 'Just a pile of old keys. None of them fit anything.' });
          },
        });
        break;
      case 'fridge':
        ix.addTarget({
          obj: it.obj, label: 'Open the fridge',
          act: () => {
            Events.emit('sfx', { name: 'fridge', position: pos() });
            Events.emit('hint', { text: 'Forty jars of pickled eggs. Nothing else.' });
          },
        });
        break;
      default:
        // puzzle devices (washer, monitors, trunk) are wired up by the story
        (this.puzzleDevices ??= {})[it.kind] = it;
        break;
    }
  }

  // ------------------------------------------------------------ keys
  addKey(color, pos, { parent = null, rotY = 0, enabled = null, magnetic = false, hanging = false, reachableOnlyPulled = false, canTake = null } = {}) {
    const obj = buildKey(color);
    obj.position.copy(pos);
    obj.rotation.set(hanging ? 0 : Math.PI / 2, rotY, 0);
    (parent ?? this.game.engine.scene).add(obj);
    const pk = { color, obj, base: pos.clone(), hanging, collected: false, phase: Math.random() * 6 };
    pk.target = this.ix.addTarget({
      obj, pad: 0.08, magnetic,
      enabled: () => !pk.collected && (!enabled || enabled()),
      label: () => {
        if (pk.target.pulled) return `Take the ${KEY_NAMES[color] ?? 'key'}`;
        if (reachableOnlyPulled) return 'Way out of reach';
        if (canTake && !canTake()) return null;
        return `Take the ${KEY_NAMES[color] ?? 'key'}`;
      },
      dynamicBox: (box) => box.setFromObject(obj).expandByScalar(0.08),
      act: () => { if (pk.target.pulled || (!reachableOnlyPulled && (!canTake || canTake()))) this.collectKey(pk); },
      collect: () => this.collectKey(pk),
    });
    this.pickups.push(pk);
    return pk;
  }

  collectKey(pk) {
    if (pk.collected) return;
    pk.collected = true;
    const p = pk.obj.getWorldPosition(new Vector3());
    pk.obj.parent?.remove(pk.obj);
    this.ix.removeTarget(pk.target);
    this.ix.sparkle(p);
    this.ix.inv.addKey(pk.color);
  }

  _placeKeys() {
    const h = this.game.world.house;
    const floors = this.game.world.interior.floors;
    if (h.greenTable) {
      const t = h.greenTable.position;
      this.keyRed = this.addKey('red', new Vector3(t.x, FLOOR_Y.F1 + 0.74, t.z), { parent: floors.F1, rotY: 0.4 });
    }
    if (h.greenKeyHook) this.keyGreen = this.addKey('green', h.greenKeyHook.clone(), { parent: floors.F2, hanging: true, magnetic: true });
    // attic key: on a nail high in the main stairwell, out of reach except by magnet
    this.keyAttic = this.addKey('attic', new Vector3(-2.33, FLOOR_Y.F1 + 2.55, -18.2), { parent: floors.F1, hanging: true, magnetic: true, rotY: Math.PI / 2, reachableOnlyPulled: true });
  }

  // ------------------------------------------------------------ tools
  spawnTool(kind, pos, rotY = 0) {
    const obj = TOOL_BUILDERS[kind]();
    obj.position.copy(pos);
    if (kind === 'crowbar' || kind === 'wrench') obj.rotation.set(0, rotY, Math.PI / 2);
    else obj.rotation.set(0, rotY, 0);
    this.game.engine.scene.add(obj);
    const mass = { crowbar: 1.6, wrench: 0.9, magnet: 1.4, flashlight: 0.5 }[kind] ?? 1;
    const entry = this.game.physics.addDynamic(obj, {
      mass, angularDamping: 0.8,
      data: { item: kind, label: obj.userData.item.label, tool: true, metal: kind !== 'flashlight', noise: 0.55, throwable: false },
    });
    return entry;
  }

  _placeTools() {
    const h = this.game.world.house;
    if (h.highShelf) {
      const s = h.highShelf;
      this.crowbar = this.spawnTool('crowbar', new Vector3(s.x, s.y + 0.06, s.z), 0.1);
      // too high to reach from the floor: stack something or jump from the chest
      const ix = this.ix;
      const orig = ix._propTarget.bind(ix);
      ix._propTarget = (entry) => {
        if (entry === this.crowbar && !entry.everTaken && this.game.player.camera.position.y < s.y - 0.75) return { obj: entry.mesh, label: 'Too high to reach', act: () => Events.emit('hint', { text: 'Too high. Stack something to stand on.' }) };
        return orig(entry);
      };
      Events.on('item:pickup', (e) => { if (e.item === 'crowbar') this.crowbar.everTaken = true; });
    }
    if (h.workbench) {
      const b = h.workbench.position;
      this.magnet = this.spawnTool('magnet', new Vector3(b.x + 0.3, FLOOR_Y.TR + 1.05, b.z), -0.4);
    }
    // a flashlight on your own dresser
    const ph = PLAYER_HOUSE;
    this.flashlightTool = this.spawnTool('flashlight', new Vector3(1.95, ph.floorY + 1.2, 21.45), 1.2);
    // the toolbox in the utility closet holds the wrench
    if (h.toolbox) {
      const tb = h.toolbox;
      let given = false;
      const t = this.ix.addTarget({
        obj: tb, label: () => (given ? null : 'Open the toolbox'),
        act: () => {
          given = true;
          Events.emit('sfx', { name: 'toolbox', position: tb.position.clone() });
          const entry = this.spawnTool('wrench', tb.getWorldPosition(new Vector3()).add(new Vector3(0, 0.45, 0)));
          if (!this.ix.inv.addProp(entry)) entry.body.setLinvel({ x: 0, y: 1.5, z: 0 }, true);
          this.ix.removeTarget(t);
        },
      });
    }
  }

  // ------------------------------------------------------------ the yard: pool valve, blue key under the scum
  _yard() {
    const yard = this.game.world.yard;
    const pool = yard?.pool;
    if (!pool) return;
    const water = pool.userData.water;
    const valve = pool.userData.valve;
    this.pool = { drained: false, t: 0, water, valve, baseY: water.position.y };
    const P = this.pool;
    const kp = pool.position;
    this.keyBlue = this.addKey('blue', new Vector3(kp.x + 0.3, 0.1, kp.z + 0.2), { rotY: 0.8, enabled: () => P.drained });
    this.ix.addTarget({
      obj: valve, pad: 0.12,
      label: () => (P.drained || P.t > 0 ? null : this.ix.inv.has('wrench') ? 'Turn the valve with the wrench' : 'Rusted stuck (needs a wrench)'),
      hold: undefined,
      act: () => {
        if (!this.ix.inv.has('wrench')) { Events.emit('sfx', { name: 'rattle', position: valve.position.clone() }); return; }
        P.t = 0.001;
        Events.emit('sfx', { name: 'valveSqueak', position: valve.position.clone() });
        Events.emit('sfx', { name: 'drain', position: kp.clone() });
        Events.emit('noise', { position: valve.position.clone(), loudness: 0.55, kind: 'valve' });
        Events.emit('pool:draining', {});
      },
    });
  }

  // ------------------------------------------------------------ per frame
  update(dt) {
    this.time += dt;
    const t = this.time;
    // keys bob and glow at 1 Hz
    for (const pk of this.pickups) {
      if (pk.collected) continue;
      const m = pk.obj.userData.glowMat;
      if (m) m.emissiveIntensity = 0.22 + 0.2 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 + pk.phase));
      if (pk.target.pulled) continue;
      if (pk.hanging) pk.obj.rotation.z = Math.sin(t * 1.3 + pk.phase) * 0.06;
      else pk.obj.position.y = pk.base.y + 0.012 + Math.sin(t * 2.2 + pk.phase) * 0.012;
    }
    for (const tv of this.tvs ?? []) tv.flicker(t);
    // pool draining
    const P = this.pool;
    if (P && P.t > 0 && !P.drained) {
      P.t += dt;
      const k = Math.min(1, P.t / 4);
      P.valve.rotation.x = k * Math.PI * 4;
      P.water.position.y = MathUtils.lerp(P.baseY, 0.07, k);
      P.water.scale.set(1 - k * 0.15, 1, 1 - k * 0.15);
      if (k >= 1) {
        P.drained = true;
        P.water.visible = false;
        Events.emit('pool:drained', {});
        Events.emit('hint', { text: 'Something blue glints at the bottom of the pool.' });
      }
    }
    // lures pulse noise; he switches them off when he gets there
    const ai = this.game.ai;
    for (const l of [...this.lures]) {
      l.t += dt;
      if (l.t < 0) continue;
      if (!l.started) {
        l.started = true;
        Events.emit('sfx', { name: l.L.sfx, id: l.id, position: l.pos().clone(), loop: l.L.period < 50 });
      }
      if (l.t >= l.next) {
        l.next = l.t + l.L.period;
        Events.emit('noise', { position: l.pos().clone(), loudness: l.L.loud, kind: l.kind, lure: l.kind, lureId: l.id });
      }
      if (l.t > l.dur) { this.stopLure(l, 'timeout'); continue; }
      if (ai && ai.state !== 'chase' && ai.state !== 'catch') {
        const p = l.pos();
        if (Math.hypot(p.x - ai.curFeet.x, p.z - ai.curFeet.z) < 1.8 && Math.abs(p.y - ai.curFeet.y) < 1.8) {
          this.stopLure(l, 'neighbor');
          Events.emit('voice', { line: 'mutter', position: ai.curFeet.clone() });
          ai.anim?.play?.('searchOpen', 0.2);
        }
      }
    }
  }
}

export { Group };
