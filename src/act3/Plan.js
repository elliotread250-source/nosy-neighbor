// Spec -> plan: every box, slab and stair of the house as plain numbers.
// Deterministic: the same spec always gives the same plan (spec 15.4).
// HouseBuilder turns the plan into meshes and colliders; the tests and the
// audit read the plan directly.
import { assertValid, val } from './Spec.js';
import { planWalls } from './Walls.js';
import { planSlabs, slabCells, mergeCells, cellOutlines } from './Slabs.js';
import { planStair, stairHeadroom } from './Stairs.js';
import { RULES } from './assumptions.js';

export function planHouse(spec, { validate = true } = {}) {
  if (validate) assertValid(spec);
  const floors = [...spec.floors].sort((a, b) => val(a.elevation) - val(b.elevation));
  const out = { floors: [], stairs: [], warnings: [], spec };
  for (let i = 0; i < floors.length; i++) {
    const f = floors[i];
    const walls = planWalls(f);
    out.warnings.push(...walls.warnings);
    const floorSlab = planSlabs(f, { isLowest: i === 0 });
    // ceiling: this floor's footprint, minus wherever the next floor's own slab sits
    const upper = floors[i + 1];
    const top = val(f.elevation) + val(f.ceiling);
    const t = val(f.roofSlab ?? f.slab, RULES.slab);
    const covered = upper && Math.abs(val(upper.elevation) - (top + t)) < 0.01 ? upper.rooms.map((r) => grownRect(r, RULES.wall_exterior / 2)) : [];
    const cCells = slabCells(f, { extraHoles: covered });
    // the ceiling still has this floor's ceiling openings (hatches) cut through it
    const ceilHoles = (f.ceilingHoles || []).map((h) => ({ x0: val(h.x0), x1: val(h.x1), z0: val(h.z0), z1: val(h.z1) }));
    const ceilCells = ceilHoles.length ? slabCells(f, { extraHoles: [...covered, ...ceilHoles] }) : cCells;
    const ceilingSlab = { floor: f.id, y0: top, y1: top + t, cells: ceilCells, boxes: mergeCells(ceilCells), loops: cellOutlines(ceilCells), roof: true };
    out.floors.push({ id: f.id, floor: f, walls, floorSlab, ceilingSlab });
  }
  for (const s of spec.stairs || []) out.stairs.push(planStair(s, floors));
  return out;
}

function grownRect(room, g) {
  const xs = room.polygon.map((p) => p[0]), zs = room.polygon.map((p) => p[1]);
  return { x0: Math.min(...xs) - g, x1: Math.max(...xs) + g, z0: Math.min(...zs) - g, z1: Math.max(...zs) + g };
}

// All solid boxes of the house (walls, slab pieces, stair steps) as
// { x0,x1,y0,y1,z0,z1, kind } in world meters.
export function solidBoxes(plan) {
  const out = [];
  for (const f of plan.floors) {
    for (const p of f.walls.pieces) out.push({ ...p });
    for (const s of [f.floorSlab, f.ceilingSlab]) for (const b of s.boxes) out.push({ ...b, y0: s.y0, y1: s.y1, kind: s.roof ? 'ceiling' : 'slab', floor: f.id });
  }
  for (const s of plan.stairs) for (const st of s.steps) out.push({ ...st, kind: 'step', stair: s.id });
  return out;
}

export function headroomReport(plan) {
  const boxes = solidBoxes(plan).filter((b) => b.kind !== 'step');
  return plan.stairs.map((s) => ({ id: s.id, ...stairHeadroom(s, boxes), n: s.n, riser: s.riser, blondel: s.blondel }));
}
