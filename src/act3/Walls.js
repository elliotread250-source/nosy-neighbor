// Room polygons (wall centerlines) -> wall runs -> box pieces with real holes
// for doors, windows and passages (spec 16.1, 16.2). Pure math, no rendering,
// so tests run in Node.
//
// Junction rule, which makes corners meet with no gap and no overlap:
//   * Walls running along X ("x-runs") are the through walls at corners: at an
//     L-corner an x-run extends by half the thickness of the wall it meets.
//   * Walls running along Z ("z-runs") stop at the face of any x-run that
//     touches their end.
//   * At a T, the stem stops at the face of the through wall.
//   * Where two runs cross (+), the z-run is split at the crossing.
// Rooms are rectilinear (axis-aligned edges); the validator rejects others.
import { RULES } from './assumptions.js';
import { val, tagOf } from './Spec.js';

const EPS = 1e-6;
const key = (n) => Math.round(n * 1e4) / 1e4;

// The edges of a polygon as segments with their room and index.
export function roomEdges(room) {
  const p = room.polygon;
  const out = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    out.push({ room, index: i, a, b });
  }
  return out;
}

// Absolute position of an opening along its wall's axis.
export function openingSpan(edge, op) {
  const { a, b } = edge;
  const along = Math.abs(b[0] - a[0]) > EPS ? 'x' : 'z';
  const s0 = along === 'x' ? a[0] : a[1];
  const s1 = along === 'x' ? b[0] : b[1];
  const dir = Math.sign(s1 - s0);
  const off = val(op.offset), w = val(op.width);
  const p0 = s0 + dir * off, p1 = s0 + dir * (off + w);
  return [Math.min(p0, p1), Math.max(p0, p1)];
}

export function planWalls(floor) {
  const warnings = [];
  const groups = new Map(); // `${orient}|${c}` -> list of edge records
  for (const room of floor.rooms) {
    for (const e of roomEdges(room)) {
      const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1];
      if (Math.abs(dx) > EPS && Math.abs(dz) > EPS) throw new Error(`${floor.id}.${room.id} edge ${e.index} is not axis-aligned`);
      const orient = Math.abs(dx) > EPS ? 'x' : 'z';
      const c = orient === 'x' ? e.a[1] : e.a[0];
      const lo = orient === 'x' ? Math.min(e.a[0], e.b[0]) : Math.min(e.a[1], e.b[1]);
      const hi = orient === 'x' ? Math.max(e.a[0], e.b[0]) : Math.max(e.a[1], e.b[1]);
      const decl = (room.walls || []).find((w) => w.from === e.index);
      const rec = { orient, c, lo, hi, room: room.id, index: e.index, decl, edge: e };
      const k = `${orient}|${key(c)}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(rec);
    }
  }
  // elementary intervals per line, with the rooms that share them
  let runs = [];
  for (const recs of groups.values()) {
    const { orient, c } = recs[0];
    const pts = [...new Set(recs.flatMap((r) => [key(r.lo), key(r.hi)]))].sort((a, b) => a - b);
    const cells = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const lo = pts[i], hi = pts[i + 1];
      const cover = recs.filter((r) => r.lo <= lo + EPS && r.hi >= hi - EPS);
      if (!cover.length) continue;
      const open = cover.some((r) => r.decl?.open);
      const exterior = cover.length === 1;
      const declared = cover.map((r) => r.decl?.thickness).filter(Boolean);
      const vals = declared.map((t) => val(t));
      if (vals.length > 1 && Math.max(...vals) - Math.min(...vals) > 0.02) warnings.push(`${floor.id}: shared wall at ${orient === 'x' ? 'z' : 'x'}=${c} has thicknesses ${vals.join(' vs ')} (using the thicker)`);
      const t = vals.length ? Math.max(...vals) : exterior ? RULES.wall_exterior : RULES.wall_interior;
      const tTag = declared.length ? tagOf(declared[vals.indexOf(Math.max(...vals))]) : 'assumed';
      const lengthTag = cover.map((r) => r.room)
        .map((id) => floor.rooms.find((rm) => rm.id === id)?.polygonTag ?? 'assumed')
        .sort((a, b) => rank(a) - rank(b))[0];
      cells.push({ lo, hi, cover, open, exterior, t, tTag, lengthTag });
    }
    // merge neighbouring cells with the same build properties into runs
    for (const cell of cells) {
      const last = runs[runs.length - 1];
      if (last && last.orient === orient && Math.abs(last.c - c) < EPS && Math.abs(last.hi - cell.lo) < EPS && last.t === cell.t && last.open === cell.open && last.exterior === cell.exterior) {
        last.hi = cell.hi;
        last.cells.push(cell);
      } else {
        runs.push({ orient, c, lo: cell.lo, hi: cell.hi, t: cell.t, tTag: cell.tTag, open: cell.open, exterior: cell.exterior, cells: [cell], lengthTag: cell.lengthTag });
      }
    }
  }
  const solid = runs.filter((r) => !r.open);
  // split z-runs where an x-run crosses straight through them
  const xRuns = solid.filter((r) => r.orient === 'x');
  let zRuns = solid.filter((r) => r.orient === 'z');
  const split = [];
  for (const z of zRuns) {
    const cuts = xRuns.filter((x) => x.lo < z.c - EPS && x.hi > z.c + EPS && x.c > z.lo + EPS && x.c < z.hi - EPS).map((x) => x.c).sort((a, b) => a - b);
    let lo = z.lo;
    for (const cut of cuts) { split.push({ ...z, lo, hi: cut, cells: z.cells }); lo = cut; }
    split.push({ ...z, lo });
  }
  zRuns = split;
  const all = [...xRuns, ...zRuns];
  // junctions: compute trimmed extents (s0, s1) along each run's own axis
  const touching = (run, pos) => all.filter((o) => o.orient !== run.orient && Math.abs(o.c - pos) < EPS && o.lo <= run.c + EPS && o.hi >= run.c - EPS);
  for (const r of all) {
    r.s0 = r.lo;
    r.s1 = r.hi;
    for (const [end, pos] of [['s0', r.lo], ['s1', r.hi]]) {
      const sign = end === 's0' ? -1 : 1; // direction pointing out of the run at this end
      const perps = touching(r, pos);
      if (!perps.length) continue;
      const thick = Math.max(...perps.map((p) => p.t)) / 2;
      const through = perps.some((p) => p.lo < r.c - EPS && p.hi > r.c + EPS);
      if (r.orient === 'z' || through) { r[end] = pos - sign * thick; continue; }
      // x-run at a corner: extend, unless a collinear run continues from here
      const continues = all.some((o) => o !== r && o.orient === 'x' && Math.abs(o.c - r.c) < EPS && (Math.abs(o.lo - pos) < EPS || Math.abs(o.hi - pos) < EPS));
      if (!continues) r[end] = pos + sign * thick;
    }
  }
  // openings
  const y0 = val(floor.elevation), y1 = y0 + val(floor.ceiling);
  const pieces = [];
  const openings = [];
  let runId = 0;
  for (const r of all) {
    r.id = `${floor.id}.w${runId++}`;
    const ops = [];
    for (const cell of r.cells) for (const rec of cell.cover) {
      for (const [i, op] of (rec.decl?.openings || []).entries()) {
        if (ops.some((o) => o.op === op)) continue;
        const [p0, p1] = openingSpan(rec.edge, op);
        if (p0 < r.lo - EPS || p1 > r.hi + EPS) continue; // belongs to another run of this edge
        ops.push({ op, p0, p1, room: rec.room, wall: rec.index, index: i });
      }
    }
    ops.sort((a, b) => a.p0 - b.p0);
    let cursor = r.s0;
    const box = (s0, s1, ya, yb, kind, extra = {}) => {
      if (s1 - s0 < EPS || yb - ya < EPS) return;
      const half = r.t / 2;
      const rect = r.orient === 'x' ? { x0: s0, x1: s1, z0: r.c - half, z1: r.c + half } : { x0: r.c - half, x1: r.c + half, z0: s0, z1: s1 };
      pieces.push({ ...rect, y0: ya, y1: yb, kind, run: r.id, exterior: r.exterior, orient: r.orient, floor: floor.id, ...extra });
    };
    for (const o of ops) {
      const type = o.op.type;
      const sill = type === 'door' || type === 'gate' ? 0 : val(o.op.sill, type === 'window' ? RULES.window_sill : 0);
      const h = val(o.op.height);
      const top = Math.min(y1, y0 + sill + h);
      box(cursor, o.p0, y0, y1, 'wall');
      if (sill > 0) box(o.p0, o.p1, y0, y0 + sill, 'sill', { opening: o.op.id });
      box(o.p0, o.p1, top, y1, 'lintel', { opening: o.op.id });
      openings.push({ id: o.op.id, type, state: o.op.state, run: r.id, room: o.room, wall: o.wall, index: o.index, orient: r.orient, c: r.c, t: r.t, p0: o.p0, p1: o.p1, y0: y0 + sill, y1: top, floor: floor.id, op: o.op, inside: o.p0 >= r.s0 - EPS && o.p1 <= r.s1 + EPS });
      cursor = o.p1;
    }
    box(cursor, r.s1, y0, y1, 'wall');
  }
  return { floor: floor.id, runs: all, openRuns: runs.filter((r) => r.open), pieces, openings, warnings };
}

const RANK = { measured: 0, 'measured-rough': 1, documented: 2, 'fan-plan': 3, 'documented-weak': 4, standard: 5, 'assumed-from-standard': 6, design: 7, assumed: 8, conflict: 9 };
function rank(t) { return RANK[t] ?? 8; }

// Overlap check between wall boxes on one floor (plan view, same height band).
export function wallOverlaps(pieces, tol = 0.001) {
  const out = [];
  for (let i = 0; i < pieces.length; i++) for (let j = i + 1; j < pieces.length; j++) {
    const a = pieces[i], b = pieces[j];
    const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
    const oz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
    const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    if (ox > tol && oz > tol && oy > tol) out.push({ a, b, ox, oz });
  }
  return out;
}

// Gaps at junctions: every run end that touches another run must sit flush
// against it (distance between the end face and the other run's face < tol).
export function junctionGaps(plan, tol = 0.001) {
  const gaps = [];
  const runs = plan.runs;
  for (const r of runs) {
    for (const [end, pos] of [['s0', r.lo], ['s1', r.hi]]) {
      const perps = runs.filter((o) => o.orient !== r.orient && Math.abs(o.c - pos) < 1e-6 && o.lo <= r.c + 1e-6 && o.hi >= r.c - 1e-6);
      for (const p of perps) {
        // the end must reach at least the near face of the perpendicular wall
        const sign = end === 's0' ? -1 : 1;
        const reach = (r[end] - pos) * sign; // how far past the centerline the end goes
        const need = -p.t / 2; // at least to the near face
        if (reach < need - tol) gaps.push({ run: r.id, end, gap: need - reach, with: p.id });
      }
    }
  }
  return gaps;
}
