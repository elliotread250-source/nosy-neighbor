// Parametric straight stairs (spec 17). Given the total rise H between two
// floor tops and a target riser r, there are n = round(H / r) risers and
// n - 1 treads; the true riser is H / n, so the top always meets the upper
// floor exactly even when H changes with a measurement.
//
// Schema: { id, type: "straight", from: floorId, to: floorId,
//           foot: { x, z, tag }   (center of the first riser, at the lower floor)
//           direction: "+x" | "-x" | "+z" | "-z"   (the way you face going up)
//           width, riser (target), tread : tagged values }
import { val } from './Spec.js';
import { RULES } from './assumptions.js';

const DIRS = { '+x': [1, 0], '-x': [-1, 0], '+z': [0, 1], '-z': [0, -1] };

export function planStair(stair, floors) {
  const lower = floors.find((f) => f.id === stair.from);
  const upper = floors.find((f) => f.id === stair.to);
  if (!lower || !upper) throw new Error(`stair ${stair.id}: unknown floors ${stair.from} -> ${stair.to}`);
  const y0 = val(lower.elevation), y1 = val(upper.elevation);
  const H = y1 - y0;
  const n = Math.max(1, Math.round(H / val(stair.riser, RULES.stair_riser)));
  const riser = H / n;
  const tread = val(stair.tread, RULES.stair_tread);
  const width = val(stair.width, RULES.stair_width);
  const [dx, dz] = DIRS[stair.direction];
  const fx = val(stair.foot.x ?? stair.foot), fz = stair.foot.z;
  const run = (n - 1) * tread;
  const blondel = 2 * riser + tread;
  // perpendicular (across the stair)
  const px = -dz, pz = dx;
  const at = (along, across) => [fx + dx * along + px * across, fz + dz * along + pz * across];
  const rect = (a0, a1) => {
    const [ax, az] = at(a0, -width / 2), [bx, bz] = at(a1, width / 2);
    return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) };
  };
  const steps = [];
  for (let k = 1; k <= n - 1; k++) {
    // tread k: top at k * riser, spanning along [(k-1) * tread, k * tread]; solid down to the floor
    steps.push({ ...rect((k - 1) * tread, k * tread), y0, y1: y0 + k * riser, k });
  }
  const footprint = rect(0, run);
  return {
    id: stair.id, from: stair.from, to: stair.to, n, riser, tread, width, run, H, y0, y1, blondel,
    blondelOk: blondel >= 0.55 && blondel <= 0.7, comfortable: blondel >= 0.6 && blondel <= 0.65,
    dir: [dx, dz], foot: [fx, fz], steps, footprint, top: at(run, 0),
    // the line through the nosings, as a function of distance along the stair
    nosingY: (along) => y0 + riser + along * (riser / tread),
    at,
  };
}

// Clear height above the nosing line, sampled every 5 cm along the stair,
// against any box (slab pieces, walls, beams) over the stair footprint.
// Returns the minimum and where it happens, plus the obstruction.
export function stairHeadroom(plan, obstacles, step = 0.05) {
  let min = Infinity, where = null, by = null;
  const halfW = plan.width / 2 - 0.05;
  for (let a = 0; a <= plan.run + 1e-9; a += step) {
    const ny = plan.nosingY(Math.min(a, plan.run));
    let clear = Infinity, hit = null;
    for (const across of [-halfW, 0, halfW]) {
      const [x, z] = plan.at(a, across);
      for (const o of obstacles) {
        if (x <= o.x0 || x >= o.x1 || z <= o.z0 || z >= o.z1) continue;
        if (o.y1 <= ny + 1e-6) continue; // below the nosing (the stair itself, floor)
        const c = o.y0 - ny;
        if (c < clear) { clear = c; hit = o; }
      }
    }
    if (clear < min) { min = clear; where = a; by = hit; }
  }
  return { min, where, by };
}
