// The navigation graph (spec 24) and the reachability proof (test 6). Pure:
// built from the spec and the plan, so it rebuilds whenever the data does.
//
// Nodes are rooms plus the outside areas (yard, terrace, roof, windmill top).
// Edges come from openings (with the player's size and jump deciding what is
// passable), open walls, stairs, ladders and the gated jump route. Some edges
// need items (the sealed basement door needs the crowbar and the keycard).
import { val } from './Spec.js';
import { PLAYER } from './assumptions.js';

// Jump physics (section 18.2): rise h = v^2 / 2g; foot-clear is h - 0.1.
export function jumpModel(p = PLAYER) {
  const v = p.jumpVelocity, g = p.gravity;
  const rise = (v * v) / (2 * g);
  return { v, g, rise, footClear: rise - p.footClear, apexT: v / g, air: (2 * v) / g, walk: p.walkSpeed, sprint: p.sprintSpeed };
}

// time intervals during a jump (from height 0 at t = 0) when the feet are above y
function aboveWindow(y, J) {
  const disc = J.v * J.v - 2 * J.g * y;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  return [(J.v - s) / J.g, (J.v + s) / J.g];
}

const rectOfFeature = (f) => {
  const [w, d, h] = f.size.map((v) => val(v));
  const r = (val(f.rot, 0) * Math.PI) / 180, c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
  const hx = (w / 2) * c + (d / 2) * s, hz = (w / 2) * s + (d / 2) * c;
  return { x0: f.at.x - hx, x1: f.at.x + hx, z0: f.at.z - hz, z1: f.at.z + hz, top: h, w: Math.min(w, d) };
};
const gap = (a, b) => Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.z0 - b.z1, b.z0 - a.z1));

// The railing-then-lamp-then-over route (section 18.3, 39), as a computation.
// Returns each hop's vertical and horizontal margins, and the culprit if one fails.
export function jumpRoute(spec, plan, p = PLAYER) {
  const J = jumpModel(p);
  const rail = spec.features.find((f) => f.kind === 'climbable_rail');
  const lamp = spec.features.find((f) => f.kind === 'lamp_climbable');
  const gate = plan.floors.flatMap((f) => f.walls.openings).find((o) => o.type === 'gate');
  if (!rail || !lamp || !gate) return { ok: false, error: 'rail, lamp or gate missing' };
  const R = rectOfFeature(rail), L = rectOfFeature(lamp);
  const barrier = val(gate.op.barrier?.height, 1.6);
  const clear = 0.1; // feet must pass 0.1 m over the barrier (section 39)
  const openTop = gate.y1 - gate.y0;
  const diam = 2 * p.capsuleRadius;
  const hops = [];
  // hop 1: floor to the rail top
  hops.push({ name: 'floor -> rail', rise: R.top, margin: J.footClear - R.top, stand: R.w - diam, culprit: 'rail height (gate_rail size[2]) or the jump velocity' });
  // hop 2: rail top to the lamp top, over a horizontal gap
  const d2 = gap(R, L);
  const up2 = L.top - R.top;
  const w2 = aboveWindow(up2, J);
  const reach2 = w2 ? w2[1] * J.walk : 0;
  hops.push({ name: 'rail -> lamp', rise: up2, margin: J.footClear - up2, gap: d2, reach: reach2, gapMargin: reach2 - d2, stand: L.w - diam, culprit: 'lamp cap height (gate_lamp size[2]) or the rail-lamp gap' });
  // hop 3: lamp top over the barrier into the far room
  const need3 = barrier + clear - L.top;
  const w3 = aboveWindow(need3, J);
  // horizontal: from the lamp's near edge to beyond the barrier plus the capsule
  const toBarrier = gate.orient === 'z' ? Math.abs(gate.c - (gate.c > L.x1 ? L.x1 : L.x0)) : Math.abs(gate.c - (gate.c > L.z1 ? L.z1 : L.z0));
  const cross = toBarrier + gate.t / 2 + diam;
  const span3 = w3 ? (w3[1] - Math.max(0, w3[0] - toBarrier / J.walk)) * J.walk : 0;
  const head = openTop - (L.top + J.rise + p.height);
  hops.push({ name: 'lamp -> over the gate', rise: need3, margin: J.footClear - need3, cross, reach: span3, gapMargin: span3 - cross, headroom: head, culprit: 'gate barrier height, gate opening height or the lamp height' });
  // the route must be needed: the barrier and the lamp are out of reach from the floor
  const direct = { barrier: barrier + clear > J.footClear, lamp: L.top > J.footClear };
  const fails = hops.filter((h) => h.margin < 0 || (h.gapMargin ?? 1) < 0 || (h.stand ?? 1) < 0 || (h.headroom ?? 1) < 0);
  const warns = hops.filter((h) => h.margin < 0.05 || h.margin > 0.4);
  return { ok: !fails.length && direct.barrier && direct.lamp, hops, fails, warns, direct, jump: J };
}

// ------------------------------------------------------------ the graph
function roomRect(r) {
  const xs = r.polygon.map((p) => p[0]), zs = r.polygon.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
}
const inRect = (q, x, z, m = 0) => x > q.x0 - m && x < q.x1 + m && z > q.z0 - m && z < q.z1 + m;

export function roomAtPoint(spec, floorId, x, z) {
  const f = spec.floors.find((fl) => fl.id === floorId);
  return f?.rooms.find((r) => inRect(roomRect(r), x, z, 1e-6)) ?? null;
}

const OUTSIDE = { B1: null, F0: 'yard', F1: null, F2: 'terrace' };

export function navGraph(spec, plan, p = PLAYER, puzzle = null) {
  const J = jumpModel(p);
  const nodes = new Map();
  const edges = [];
  const node = (id, o = {}) => { if (!nodes.has(id)) nodes.set(id, { id, ...o }); return nodes.get(id); };
  for (const f of spec.floors) for (const r of f.rooms) {
    const q = roomRect(r);
    node(r.id, { floor: f.id, x: (q.x0 + q.x1) / 2, z: (q.z0 + q.z1) / 2, y: val(f.elevation) });
  }
  for (const id of ['yard', 'terrace', 'roof', 'windmill']) node(id, { floor: id === 'yard' ? 'F0' : 'R' });
  const edge = (a, b, o = {}) => edges.push({ a, b, cost: o.cost ?? 1, needs: o.needs ?? [], kind: o.kind ?? 'door', via: o.via, oneWay: !!o.oneWay });
  const diam = 2 * p.capsuleRadius;
  const feats = spec.features || [];
  for (const f of plan.floors) {
    // rooms on both sides of every opening
    for (const o of f.walls.openings) {
      const off = 0.25;
      const mid = (o.p0 + o.p1) / 2;
      const [ax, az, bx, bz] = o.orient === 'x' ? [mid, o.c - off, mid, o.c + off] : [o.c - off, mid, o.c + off, mid];
      const ra = roomAtPoint(spec, f.id, ax, az)?.id ?? OUTSIDE[f.id];
      const rb = roomAtPoint(spec, f.id, bx, bz)?.id ?? OUTSIDE[f.id];
      if (!ra || !rb || ra === rb) continue;
      const w = o.p1 - o.p0, h = o.y1 - o.y0, sill = o.y0 - val(f.floor.elevation);
      const state = o.op.state ?? (o.type === 'window' ? 'intact' : 'open');
      if (w < diam + 0.04) continue;
      if (o.type === 'door') {
        if (['bolted', 'locked'].includes(state)) continue;
        if (state === 'sealed') { edge(ra, rb, { needs: puzzle?.basement?.requires ?? ['crowbar', 'keycard'], via: o.id, kind: 'sealed door' }); continue; }
        if (h >= p.height) edge(ra, rb, { via: o.id });
      } else if (o.type === 'window') {
        if (state !== 'broken') continue;
        // a step under the sill on each side (fixed props only, plus movable boxes inside)
        const steps = feats.filter((x) => ['crate', 'cardboard', 'cardboard_small'].includes(x.kind) && Math.hypot(x.at.x - (o.orient === 'x' ? mid : o.c), x.at.z - (o.orient === 'x' ? o.c : mid)) < 1.4);
        const stepTop = (side) => Math.max(0, ...steps.filter((x) => Math.sign((o.orient === 'x' ? x.at.z : x.at.x) - o.c) === side).map((x) => val(x.size[2]) + (x.at.y ?? 0)));
        const room = (side) => (side < 0 ? ra : rb);
        for (const side of [-1, 1]) {
          const from = room(side), to = room(-side);
          if (sill - stepTop(side) <= J.footClear && h >= p.height) edge(from, to, { via: o.id, kind: 'window climb', oneWay: true });
        }
      } else if (o.type === 'hole') {
        if (h >= 0.8 && sill < p.maxStepHeight - 0.05) edge(ra, rb, { via: o.id, kind: sill > 0 || h < p.height ? 'crawl' : 'hole', cost: 2 });
        else if (h >= 0.8 && sill <= J.footClear) edge(ra, rb, { via: o.id, kind: 'climb through', cost: 2 });
      } else if (o.type === 'gate') {
        const jr = jumpRoute(spec, plan, p);
        const railRoom = feats.find((x) => x.kind === 'climbable_rail')?.room;
        const from = [ra, rb].find((x) => x === railRoom), to = from === ra ? rb : ra;
        if (jr.ok && from) edge(from, to, { via: 'rail, lamp, over the gate', kind: 'jump route', oneWay: true, cost: 3 });
      }
    }
    // open walls join rooms directly
    for (const run of f.walls.openRuns) {
      const ids = new Set(run.cells.flatMap((c) => c.cover.map((r) => r.room)));
      const list = [...ids];
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) edge(list[i], list[j], { kind: 'open', via: run.id });
    }
  }
  // stairs: room at the foot to room at the top
  for (const s of plan.stairs) {
    const [fx, fz] = s.at(-0.3, 0), [tx, tz] = s.at(s.run + 0.3, 0);
    const a = roomAtPoint(spec, s.from, fx, fz), b = roomAtPoint(spec, s.to, tx, tz);
    if (a && b) edge(a.id, b.id, { kind: 'stair', via: s.id, cost: 2 });
  }
  // ladders (features) to the floor above
  for (const f of feats.filter((x) => x.kind === 'ladder')) {
    const a = roomAtPoint(spec, f.floor, f.at.x, f.at.z), b = roomAtPoint(spec, f.to, f.at.x, f.at.z - 0.4);
    if (a && b) edge(a.id, b.id, { kind: 'ladder', via: f.id, cost: 3 });
  }
  if (spec.roof?.boxLadder) edge('terrace', 'roof', { kind: 'ladder', via: 'box_ladder', cost: 3 });
  if (spec.windmill) edge('roof', 'windmill', { kind: 'ladder', via: 'windmill_ladder', cost: 3 });
  return { nodes, edges };
}

// Breadth-first search with item pickups: returns every reachable node and
// the order items were found.
export function reach(graph, start, itemsAt = {}) {
  const have = new Set();
  const seen = new Set([start]);
  let frontier = [start];
  const order = [];
  let progress = true;
  while (progress) {
    progress = false;
    while (frontier.length) {
      const next = [];
      for (const n of frontier) {
        for (const [item, room] of Object.entries(itemsAt)) if (room === n && !have.has(item)) { have.add(item); order.push(item); progress = true; }
        for (const e of graph.edges) {
          const other = e.a === n ? e.b : !e.oneWay && e.b === n ? e.a : null;
          if (!other || seen.has(other)) continue;
          if (!e.needs.every((i) => have.has(i))) continue;
          seen.add(other);
          next.push(other);
        }
      }
      frontier = next;
    }
    if (progress) frontier = [...seen];
  }
  return { reached: seen, items: order };
}
