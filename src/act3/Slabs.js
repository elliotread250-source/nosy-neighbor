// Floor and ceiling slabs with real thickness (spec 16.3). A floor's slab is
// the union of its room rectangles, grown to the outer face of the exterior
// walls, minus its holes (stairwells, hatches). Works on rectilinear rooms by
// coordinate compression: the plan is cut into a grid of cells at every x and
// z breakpoint, each cell is in or out, and boxes and outlines come from that.
import { val } from './Spec.js';
import { RULES } from './assumptions.js';

const EPS = 1e-6;

export function polygonArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, z0] = poly[i], [x1, z1] = poly[(i + 1) % poly.length];
    a += x0 * z1 - x1 * z0;
  }
  return Math.abs(a) / 2;
}

export function pointInPolygon(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function rectOf(r) {
  return { x0: val(r.x0), x1: val(r.x1), z0: val(r.z0), z1: val(r.z1) };
}

// Grow a room polygon's bounding rectangle out to the outer faces of its walls
// (rectilinear rooms only; good enough for the slab footprint).
function grownRooms(floor, grow) {
  return floor.rooms.map((rm) => {
    const xs = rm.polygon.map((p) => p[0]), zs = rm.polygon.map((p) => p[1]);
    return { poly: rm.polygon, x0: Math.min(...xs) - grow, x1: Math.max(...xs) + grow, z0: Math.min(...zs) - grow, z1: Math.max(...zs) + grow };
  });
}

// Cells of the slab: [{x0,x1,z0,z1}] inside the union and outside every hole.
export function slabCells(floor, { grow = RULES.wall_exterior / 2, extraHoles = [] } = {}) {
  const rooms = grownRooms(floor, grow);
  const holes = [...(floor.holes || []).map((h) => rectOf(h)), ...extraHoles];
  const xs = new Set(), zs = new Set();
  for (const r of [...rooms, ...holes]) { xs.add(r.x0); xs.add(r.x1); zs.add(r.z0); zs.add(r.z1); }
  // room polygons themselves contribute breakpoints too (L-shaped rooms)
  for (const rm of floor.rooms) for (const [x, z] of rm.polygon) { xs.add(x); zs.add(z); }
  const X = [...xs].sort((a, b) => a - b), Z = [...zs].sort((a, b) => a - b);
  const cells = [];
  for (let i = 0; i < X.length - 1; i++) for (let j = 0; j < Z.length - 1; j++) {
    const cx = (X[i] + X[i + 1]) / 2, cz = (Z[j] + Z[j + 1]) / 2;
    const inRoom = rooms.some((r) => cx > r.x0 && cx < r.x1 && cz > r.z0 && cz < r.z1 && (inGrown(r, cx, cz, grow)));
    const inHole = holes.some((h) => cx > h.x0 && cx < h.x1 && cz > h.z0 && cz < h.z1);
    if (inRoom && !inHole) cells.push({ x0: X[i], x1: X[i + 1], z0: Z[j], z1: Z[j + 1] });
  }
  return cells;
}

// A point is in a grown room if it's within `grow` of the room polygon.
function inGrown(r, x, z, grow) {
  if (pointInPolygon(x, z, r.poly)) return true;
  // rectangle approximation is exact for rectangular rooms
  return r.poly.length === 4;
}

// Merge cells into fewer rectangles (rows first, then stack equal rows).
export function mergeCells(cells) {
  const byRow = new Map();
  for (const c of cells) {
    const k = `${c.z0}|${c.z1}`;
    if (!byRow.has(k)) byRow.set(k, []);
    byRow.get(k).push(c);
  }
  const strips = [];
  for (const row of byRow.values()) {
    row.sort((a, b) => a.x0 - b.x0);
    let cur = null;
    for (const c of row) {
      if (cur && Math.abs(cur.x1 - c.x0) < EPS) cur.x1 = c.x1;
      else { cur = { ...c }; strips.push(cur); }
    }
  }
  strips.sort((a, b) => a.x0 - b.x0 || a.z0 - b.z0);
  const out = [];
  for (const s of strips) {
    const prev = out.find((o) => Math.abs(o.x0 - s.x0) < EPS && Math.abs(o.x1 - s.x1) < EPS && Math.abs(o.z1 - s.z0) < EPS);
    if (prev) prev.z1 = s.z1;
    else out.push({ ...s });
  }
  return out;
}

// Outline loops of a cell set (outer boundaries and hole boundaries), as
// closed polygons of [x, z]. Used for triangulated slab meshes.
export function cellOutlines(cells) {
  // collect boundary edges: an edge of a cell is boundary if no neighbour shares it
  const edges = new Map();
  const add = (a, b) => {
    const k = `${a[0]},${a[1]}|${b[0]},${b[1]}`;
    const rk = `${b[0]},${b[1]}|${a[0]},${a[1]}`;
    if (edges.has(rk)) edges.delete(rk);
    else edges.set(k, [a, b]);
  };
  // split cell edges at every breakpoint so shared edges cancel exactly
  const xs = [...new Set(cells.flatMap((c) => [c.x0, c.x1]))].sort((a, b) => a - b);
  const zs = [...new Set(cells.flatMap((c) => [c.z0, c.z1]))].sort((a, b) => a - b);
  const seg = (lo, hi, list) => { const out = []; let p = lo; for (const v of list) if (v > lo + EPS && v < hi - EPS) { out.push([p, v]); p = v; } out.push([p, hi]); return out; };
  for (const c of cells) {
    for (const [a, b] of seg(c.x0, c.x1, xs)) add([a, c.z0], [b, c.z0]);
    for (const [a, b] of seg(c.z0, c.z1, zs)) add([c.x1, a], [c.x1, b]);
    for (const [a, b] of seg(c.x0, c.x1, xs).reverse()) add([b, c.z1], [a, c.z1]);
    for (const [a, b] of seg(c.z0, c.z1, zs).reverse()) add([c.x0, b], [c.x0, a]);
  }
  const byStart = new Map();
  for (const [a, b] of edges.values()) byStart.set(`${a[0]},${a[1]}`, [a, b]);
  const loops = [];
  const used = new Set();
  for (const [k, e] of byStart) {
    if (used.has(k)) continue;
    const loop = [];
    let cur = e;
    let guard = 0;
    while (cur && guard++ < 10000) {
      const ck = `${cur[0][0]},${cur[0][1]}`;
      if (used.has(ck)) break;
      used.add(ck);
      loop.push(cur[0]);
      cur = byStart.get(`${cur[1][0]},${cur[1][1]}`);
    }
    // drop collinear points
    const clean = loop.filter((p, i) => {
      const a = loop[(i - 1 + loop.length) % loop.length], b = loop[(i + 1) % loop.length];
      return !((Math.abs(a[0] - p[0]) < EPS && Math.abs(b[0] - p[0]) < EPS) || (Math.abs(a[1] - p[1]) < EPS && Math.abs(b[1] - p[1]) < EPS));
    });
    if (clean.length >= 3) loops.push(clean);
  }
  return loops;
}

// Signed area: positive for counter-clockwise in the x-z plane.
export function signedArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, z0] = poly[i], [x1, z1] = poly[(i + 1) % poly.length];
    a += x0 * z1 - x1 * z0;
  }
  return a / 2;
}

// Floor slab of a floor (sits just below its floor top) and the roof slab of
// the topmost floor. Returns { y0, y1, cells, boxes, loops } per slab.
export function planSlabs(floor, { isLowest = false, extraHoles = [] } = {}) {
  const top = val(floor.elevation);
  const t = val(floor.slab, RULES.slab);
  const cells = slabCells(floor, { extraHoles });
  return { floor: floor.id, y0: top - t, y1: top, cells, boxes: mergeCells(cells), loops: cellOutlines(cells), isLowest };
}
