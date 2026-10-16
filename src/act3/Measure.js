// Meters out of screenshots (spec sections 3.2, 3.3, 13), and the pipeline
// that turns measurements into tag upgrades on the spec (sections 28.3, 32).
// Pure math, no DOM, so the measure tool, the ingest script and the tests all
// share it.
//
// A measurement record (data/act3/measurements.json):
//   { id, target, value, sigma, method, ratio?, ratioSigma?, dependsOn?,
//     image: { file, sha256, given, build, note }, points, ruler, date }
// `target` is a dotted path ("F0.foyer.ceiling", "F0.foyer.wall0.opening0.height",
// "F0.foyer.wall2.length", "playerHeight"). When the ruler was the player,
// dependsOn is ["playerHeight"] and the value is stored as a ratio of the
// player height, so rescaling the player rescales the measurement.
import { val, tagOf, resolveTarget } from './Spec.js';

// ------------------------------------------------------------ straight-on
// Ruler and target lie in one plane parallel to the image (section 13.2).
// Uncertainty: click error on all four endpoints plus the ruler's own sigma.
export function straightOn({ ruler, target, rulerLength, rulerSigma = 0, clickSigma = 1.5 }) {
  const r = dist(ruler[0], ruler[1]);
  const t = dist(target[0], target[1]);
  if (r < 1e-9) throw new Error('ruler has zero length in the image');
  const ratio = t / r;
  const value = rulerLength * ratio;
  const relRatio = Math.sqrt(2 * (clickSigma / r) ** 2 + 2 * (clickSigma / t) ** 2);
  const rel = Math.sqrt(relRatio ** 2 + (rulerSigma / rulerLength) ** 2);
  return {
    value, sigma: value * rel, ratio, ratioSigma: ratio * relRatio,
    working: [
      `ruler ${r.toFixed(1)} px = ${rulerLength} m (sigma ${rulerSigma} m)`,
      `target ${t.toFixed(1)} px`,
      `scale ${(rulerLength / r).toFixed(5)} m/px, value = ${rulerLength} x ${t.toFixed(1)} / ${r.toFixed(1)} = ${value.toFixed(3)} m`,
      `sigma: click ${clickSigma} px on 4 endpoints and the ruler sigma -> ${(value * rel).toFixed(3)} m (${(rel * 100).toFixed(1)} %)`,
    ],
  };
}

// ------------------------------------------------------------ four-corner
// A known rectangle (a door, a window) in the target plane gives a
// homography from the image to the plane (section 13.3), so the wall does not
// have to face the camera. Corners in order: top-left, top-right,
// bottom-right, bottom-left of the rectangle as it hangs on the wall.
export function homography(src, dst) {
  // solve for h (8 unknowns, h33 = 1) from 4 correspondences
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  const h = solve(A, b);
  return [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], 1]];
}

export function applyH(H, [x, y]) {
  const w = H[2][0] * x + H[2][1] * y + H[2][2];
  return [(H[0][0] * x + H[0][1] * y + H[0][2]) / w, (H[1][0] * x + H[1][1] * y + H[1][2]) / w];
}

export function fourCorner({ corners, rectWidth, rectHeight, target, rectSigma = 0, clickSigma = 1.5, samples = 400, seed = 7 }) {
  const plane = [[0, 0], [rectWidth, 0], [rectWidth, rectHeight], [0, rectHeight]];
  const measure = (cs, tg, w, h) => {
    const H = homography(cs, [[0, 0], [w, 0], [w, h], [0, h]]);
    return dist(applyH(H, tg[0]), applyH(H, tg[1]));
  };
  const value = measure(corners, target, rectWidth, rectHeight);
  // Monte Carlo over click error and the rectangle's own size
  const rnd = gauss(seed);
  const vals = [];
  for (let i = 0; i < samples; i++) {
    const j = (p) => [p[0] + rnd() * clickSigma, p[1] + rnd() * clickSigma];
    const k = 1 + (rnd() * rectSigma) / Math.max(rectWidth, rectHeight);
    vals.push(measure(corners.map(j), target.map(j), rectWidth * k, rectHeight * k));
  }
  const mean = vals.reduce((a, v) => a + v, 0) / vals.length;
  const sigma = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / (vals.length - 1));
  void plane;
  return {
    value, sigma,
    working: [
      `rectangle ${rectWidth} x ${rectHeight} m mapped from 4 clicked corners (homography)`,
      `target endpoints rectified into the wall plane: ${value.toFixed(3)} m`,
      `sigma from ${samples} Monte Carlo draws of ${clickSigma} px click error${rectSigma ? ` and ${rectSigma} m rectangle error` : ''}: ${sigma.toFixed(3)} m`,
    ],
  };
}

// ------------------------------------------------------------ combining
// Inverse-variance mean. Two measurements of one thing conflict when they
// differ by more than twice their combined sigma (section 13.5).
export function combine(list) {
  if (!list.length) return null;
  const w = list.map((m) => 1 / Math.max(m.sigma, 1e-4) ** 2);
  const W = w.reduce((a, b) => a + b, 0);
  const value = list.reduce((a, m, i) => a + m.value * w[i], 0) / W;
  const sigma = Math.sqrt(1 / W);
  const conflicts = [];
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    const lim = 2 * Math.hypot(a.sigma, b.sigma);
    if (Math.abs(a.value - b.value) > lim) conflicts.push({ a: a.id, b: b.id, diff: Math.abs(a.value - b.value), limit: lim });
  }
  return { value, sigma, conflict: conflicts.length > 0, conflicts, ids: list.map((m) => m.id) };
}

// The value a record stands for right now: a player-ruled measurement
// follows the current player height.
export function resolvedValue(m, playerHeight) {
  if (m.dependsOn?.includes('playerHeight') && typeof m.ratio === 'number') {
    return { ...m, value: m.ratio * playerHeight, sigma: (m.ratioSigma ?? m.sigma / Math.max(m.value, 1e-9) * m.ratio) * playerHeight };
  }
  return m;
}

// ------------------------------------------------------------ the pipeline
// Apply measurements to a copy of the spec. Rules (section 28.3):
//   * assumed/documented -> measured is automatic;
//   * a value already tagged measured is only replaced when the new value
//     agrees within the combined sigma; otherwise it becomes a conflict and
//     the old number stays;
//   * a target with mutually inconsistent measurements is tagged conflict
//     and keeps its old value;
//   * a wall length cannot move a polygon by itself: if it disagrees with the
//     polygon it is reported, otherwise the wall's lengthTag is upgraded.
export function applyMeasurements(spec, measurements, { roughRel = 0.05 } = {}) {
  const out = structuredClone(spec);
  const diff = [], conflicts = [], missing = [];
  // the player height first, because other records depend on it
  const order = [...new Set(measurements.map((m) => m.target))].sort((a, b) => (a === 'playerHeight' ? -1 : b === 'playerHeight' ? 1 : 0));
  for (const target of order) {
    const ph = val(out.playerHeight, 1.2);
    const list = measurements.filter((m) => m.target === target).map((m) => resolvedValue(m, ph));
    const c = combine(list);
    if (/\.wall\d+\.length$/.test(target)) {
      const r = wallLength(out, target);
      if (!r) { missing.push(target); continue; }
      if (c.conflict) { r.wall.lengthTag = 'conflict'; conflicts.push({ target, kind: 'inconsistent', ...c }); continue; }
      if (Math.abs(c.value - r.length) > 2 * c.sigma + 0.01) {
        conflicts.push({ target, kind: 'polygon', old: r.length, value: c.value, sigma: c.sigma, note: 'measured wall length disagrees with the room polygon; edit the polygon (move the least certain room) and re-run' });
        continue;
      }
      const old = r.wall.lengthTag ?? 'assumed';
      r.wall.lengthTag = c.sigma / c.value > roughRel ? 'measured-rough' : 'measured';
      r.wall.lengthSources = c.ids;
      diff.push({ target, old: r.length, value: r.length, oldTag: old, tag: r.wall.lengthTag, sigma: c.sigma });
      continue;
    }
    const ref = resolveTarget(out, target);
    if (!ref) { missing.push(target); continue; }
    const node = ref.node[ref.key];
    const oldV = val(node), oldTag = tagOf(node);
    if (c.conflict) {
      ref.node[ref.key] = { ...(typeof node === 'object' ? node : { value: node }), tag: 'conflict', candidates: list.map((m) => ({ id: m.id, value: round(m.value), sigma: round(m.sigma), tag: 'measured' })) };
      conflicts.push({ target, kind: 'inconsistent', ...c });
      continue;
    }
    if ((oldTag === 'measured' || oldTag === 'measured-rough') && Math.abs(c.value - oldV) > Math.hypot(c.sigma, node.sigma ?? 0)) {
      conflicts.push({ target, kind: 'overwrite', old: oldV, oldSigma: node.sigma, value: c.value, sigma: c.sigma, note: 'would change a measured value by more than the combined sigma; not applied' });
      continue;
    }
    const tag = c.sigma / Math.max(c.value, 1e-9) > roughRel ? 'measured-rough' : 'measured';
    ref.node[ref.key] = { value: round(c.value), tag, sigma: round(c.sigma), sources: c.ids, ...(list.some((m) => m.dependsOn?.includes('playerHeight')) ? { dependsOn: ['playerHeight'] } : {}), was: { value: oldV, tag: oldTag } };
    diff.push({ target, old: oldV, value: round(c.value), oldTag, tag, sigma: round(c.sigma) });
  }
  return { spec: out, diff, conflicts, missing };
}

function wallLength(spec, target) {
  const [fid, rid, w] = target.split('.');
  const room = spec.floors.find((f) => f.id === fid)?.rooms.find((r) => r.id === rid);
  if (!room) return null;
  const i = Number(/wall(\d+)/.exec(w)[1]);
  const p = room.polygon, a = p[i], b = p[(i + 1) % p.length];
  if (!a) return null;
  room.walls = room.walls || [];
  let wall = room.walls.find((x) => x.from === i);
  if (!wall) { wall = { from: i, to: (i + 1) % p.length }; room.walls.push(wall); }
  return { wall, length: Math.hypot(b[0] - a[0], b[1] - a[1]) };
}

// ------------------------------------------------------------ migration
// Insert a vertex into a room polygon after vertex `after` (splitting edge
// `after`). Wall declarations and measurement targets are renumbered so each
// still points at the same physical wall (section 29, migration test).
export function insertVertex(spec, measurements, floorId, roomId, after, point) {
  const s = structuredClone(spec);
  const room = s.floors.find((f) => f.id === floorId).rooms.find((r) => r.id === roomId);
  const n = room.polygon.length;
  const a = room.polygon[after], b = room.polygon[(after + 1) % n];
  const splitLen = Math.hypot(point[0] - a[0], point[1] - a[1]);
  room.polygon.splice(after + 1, 0, point);
  const N = n + 1;
  const newWalls = [];
  for (const w of room.walls || []) {
    if (w.from < after) { newWalls.push({ ...w, to: (w.from + 1) % N }); continue; }
    if (w.from > after) { newWalls.push({ ...w, from: w.from + 1, to: (w.from + 2) % N }); continue; }
    // the split edge: openings before the new vertex stay, the rest move on
    const first = { ...w, to: after + 1, openings: [] }, second = { ...w, from: after + 1, to: (after + 2) % N, openings: [] };
    for (const op of w.openings || []) {
      if (val(op.offset) + val(op.width) <= splitLen + 1e-6) first.openings.push(op);
      else second.openings.push({ ...op, offset: { ...op.offset, value: round(val(op.offset) - splitLen) } });
    }
    newWalls.push(first, second);
  }
  room.walls = newWalls;
  void b;
  const ms = measurements.map((m) => {
    const parts = m.target.split('.');
    if (parts[0] !== floorId || parts[1] !== roomId) return m;
    const mw = /^wall(\d+)$/.exec(parts[2] ?? '');
    if (!mw) return m;
    const k = Number(mw[1]);
    let nk = k;
    if (k > after) nk = k + 1;
    else if (k === after && /^opening(\d+)$/.test(parts[3] ?? '')) {
      const old = (spec.floors.find((f) => f.id === floorId).rooms.find((r) => r.id === roomId).walls || []).find((w) => w.from === after);
      const op = old?.openings?.[Number(/\d+/.exec(parts[3])[0])];
      if (op && val(op.offset) + val(op.width) > splitLen + 1e-6) {
        nk = after + 1;
        const second = newWalls.find((w) => w.from === after + 1);
        parts[3] = `opening${second.openings.findIndex((o) => o.id === op.id)}`;
      } else {
        const first = newWalls.find((w) => w.from === after);
        parts[3] = `opening${first.openings.findIndex((o) => o.id === op.id)}`;
      }
    }
    parts[2] = `wall${nk}`;
    return { ...m, target: parts.join('.') };
  });
  return { spec: s, measurements: ms };
}

// ------------------------------------------------------------ helpers
function dist(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }
function round(v) { return Math.round(v * 1000) / 1000; }

function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) throw new Error('degenerate corners: the four points must form a quadrilateral');
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

function gauss(seed) {
  let s = seed >>> 0 || 1;
  const u = () => ((s = (s * 1664525 + 1013904223) >>> 0) + 0.5) / 4294967296;
  return () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
}

// SHA-256 of an image's bytes, for provenance (works in the browser and Node).
export async function sha256(bytes) {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
