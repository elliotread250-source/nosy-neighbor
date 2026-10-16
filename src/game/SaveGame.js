// Autosave: on every key pickup and story milestone. Stores progress, not
// physics: keys, tools in your hands, what's been unlocked, pried, drained
// and opened, the washer code, catches, time, and what he's learned.
import { Vector3 } from 'three';
import { Events } from '../core/Events.js';
import { SaveSystem } from '../core/SaveSystem.js';

const ORIGINAL_LOCKS = ['d-closet', 'd-kid', 'd-green'];

export class SaveGame {
  constructor(game) {
    this.game = game;
    const save = () => this.save();
    Events.on('key:pickup', save);
    Events.on('objective', save);
    Events.on('door:unlocked', save);
    Events.on('brain:adapted', save);
  }

  snapshot() {
    const g = this.game;
    const ix = g.interaction;
    const st = g.story;
    const doors = g.world.doors;
    return {
      v: 1,
      keys: [...ix.inv.keys],
      tools: ix.inv.slots.filter((s) => s?.tool).map((s) => s.kind),
      unlocked: ORIGINAL_LOCKS.filter((id) => doors.get(id) && !doors.get(id).lock),
      purpleBoards: doors.get('d-purple')?.boards ?? 0,
      pool: !!g.devices?.pool?.drained,
      washer: !!st?.washer?.open,
      cage: !!st?.cage?.open,
      atticOpen: !!g.world.interior.hatches.find((h) => h.id === 'h-attic')?.isOpen,
      code: st?.code,
      done: st ? [...st.done] : [],
      catches: g.catches,
      time: st ? st.time - (st.startTime ?? 0) : 0,
      brain: g.brain?.toJSON(),
      brainDone: g.brain ? [...g.brain.done] : [],
      clock: g.storyClock.target,
    };
  }

  save() {
    if (this.game.state !== 'play' || this.game.story?.mode === 'ending') return;
    SaveSystem.save(this.snapshot());
  }

  // Put a saved run back into a freshly built world.
  restore(s) {
    const g = this.game;
    const ix = g.interaction;
    const dv = g.devices;
    const st = g.story;
    if (!s || !ix) return false;
    if (st && s.code) st.code = s.code;
    for (const pk of dv.pickups) if (s.keys.includes(pk.color) && !pk.collected) { pk.collected = true; pk.obj.parent?.remove(pk.obj); ix.removeTarget(pk.target); }
    if (st?.keyBasement && s.keys.includes('basement')) { /* collected above via pickups */ }
    for (const k of s.keys) ix.inv.keys.add(k);
    const toolEntry = { crowbar: dv.crowbar, magnet: dv.magnet, flashlight: dv.flashlightTool };
    for (const t of s.tools) {
      const e = t === 'wrench' ? dv.spawnTool('wrench', new Vector3(0, -50, 0)) : toolEntry[t];
      if (e && !e.held) ix.inv.addProp(e);
    }
    if (s.tools.includes('wrench')) { const tb = ix.targets.find((x) => x.obj === g.world.house.toolbox); if (tb) ix.removeTarget(tb); }
    for (const id of s.unlocked) g.world.doors.get(id)?.unlock(g.world.doors.get(id).lock);
    const purple = g.world.doors.get('d-purple');
    while (purple && purple.boards > s.purpleBoards) purple.removeBoard();
    if (s.pool && dv.pool) { dv.pool.t = 4; dv.pool.drained = true; dv.pool.water.visible = false; }
    if (s.washer && st) { st.openWasher(); st.washer.t = 2.69; }
    if (s.cage && st) st.cage.open = true;
    if (s.atticOpen) { const h = g.world.interior.hatches.find((x) => x.id === 'h-attic'); if (h) { h.lock = null; h.open(); } }
    if (st) {
      for (const d of s.done) st.done.add(d);
      st.startTime = st.time - (s.time || 0);
      if (s.keys.includes('basement')) st.finalRun();
    }
    g.catches = s.catches || 0;
    g.storyClock.set(s.clock || 0);
    if (g.brain && s.brain) {
      Object.assign(g.brain, s.brain);
      // rebuild what he'd already put in
      for (const key of s.brainDone || []) {
        const [type, id] = key.split(':');
        const e = g.brain.entries.find((x) => x.id === id);
        const job = e && g.brain._makeJob(type, e);
        if (job) { g.brain.done.add(key); g.brain.install(job); }
      }
    }
    return true;
  }
}
