// Tests 2 to 4: walls meet cleanly, openings sit inside their walls, room
// polygons are closed and simple. Plus: rooms on a floor don't overlap.
import { describe, it, expect } from 'vitest';
import { planHouse } from '../../src/act3/Plan.js';
import { wallOverlaps, junctionGaps } from '../../src/act3/Walls.js';
import { houses } from './helpers.js';

function segmentsIntersect(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b) && o(a, b, c) !== 0 && o(a, b, d) !== 0;
}

for (const [name, spec] of houses()) {
  const plan = planHouse(spec);
  describe(`${name}`, () => {
    it('test 2: no wall overlaps or junction gaps over 1 mm', () => {
      for (const f of plan.floors) {
        expect(wallOverlaps(f.walls.pieces, 0.001), `${f.id} overlaps`).toEqual([]);
        expect(junctionGaps(f.walls, 0.001), `${f.id} gaps`).toEqual([]);
      }
    });
    it('test 3: every opening sits fully inside its wall segment', () => {
      for (const f of plan.floors) for (const o of f.walls.openings) expect(o.inside, `${f.id} ${o.id}`).toBe(true);
      // and every declared opening was placed
      for (const fl of spec.floors) for (const r of fl.rooms) for (const w of r.walls || []) for (const op of w.openings || []) {
        const placed = plan.floors.find((f) => f.id === fl.id).walls.openings.some((o) => o.op === op);
        expect(placed, `${fl.id}.${r.id} ${op.id} not placed on any wall`).toBe(true);
      }
    });
    it('test 4: room polygons are closed and not self-intersecting', () => {
      for (const fl of spec.floors) for (const r of fl.rooms) {
        const p = r.polygon;
        expect(p.length, `${r.id} vertices`).toBeGreaterThanOrEqual(3);
        for (let i = 0; i < p.length; i++) for (let j = i + 2; j < p.length; j++) {
          if (i === 0 && j === p.length - 1) continue;
          expect(segmentsIntersect(p[i], p[(i + 1) % p.length], p[j], p[(j + 1) % p.length]), `${r.id} edges ${i} and ${j}`).toBe(false);
        }
      }
    });
    it('rooms on the same floor do not overlap by more than 1 mm', () => {
      for (const fl of spec.floors) {
        const rects = fl.rooms.map((r) => ({ id: r.id, x0: Math.min(...r.polygon.map((p) => p[0])), x1: Math.max(...r.polygon.map((p) => p[0])), z0: Math.min(...r.polygon.map((p) => p[1])), z1: Math.max(...r.polygon.map((p) => p[1])) }));
        for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i], b = rects[j];
          const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
          expect(ox > 0.001 && oz > 0.001, `${fl.id}: ${a.id} overlaps ${b.id}`).toBe(false);
        }
      }
    });
  });
}
