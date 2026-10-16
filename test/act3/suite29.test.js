// Section 29: property tests on random specs, and the floor plan round trip.
import { describe, it, expect } from 'vitest';
import { planWalls, wallOverlaps, junctionGaps } from '../../src/act3/Walls.js';
import { planHouse } from '../../src/act3/Plan.js';
import { validateSpec } from '../../src/act3/Spec.js';
import { floorplanSVG, parseDims } from '../../src/act3/Floorplan.js';
import { load } from './helpers.js';

// seeded generator of valid rectilinear floors: a grid of rooms with random
// column and row breaks, and random openings that fit their walls
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function randomFloor(seed) {
  const r = rng(seed);
  const cols = 1 + Math.floor(r() * 3), rows = 1 + Math.floor(r() * 3);
  const xs = [0], zs = [0];
  for (let i = 0; i < cols; i++) xs.push(+(xs[i] + 2.5 + r() * 3).toFixed(2));
  for (let i = 0; i < rows; i++) zs.push(+(zs[i] + 2.5 + r() * 3).toFixed(2));
  const rooms = [];
  let n = 0;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x0 = xs[i], x1 = xs[i + 1], z0 = zs[j], z1 = zs[j + 1];
    const walls = [];
    // openings on the south and east edges only, so no wall gets openings
    // from both of its rooms (which could overlap: an invalid spec)
    for (let e = 0; e < 2; e++) {
      if (r() < 0.4) continue;
      const len = e % 2 === 0 ? x1 - x0 : z1 - z0;
      const w = 0.8 + r() * 0.3;
      const off = 0.4 + r() * (len - w - 0.8);
      walls.push({ from: e, to: (e + 1) % 4, openings: [{ id: `o${n}_${e}`, type: r() < 0.5 ? 'door' : 'window', offset: { value: +off.toFixed(3), tag: 'assumed' }, width: { value: +w.toFixed(3), tag: 'assumed' }, height: { value: 1.5, tag: 'assumed' }, sill: { value: 0.9, tag: 'assumed' } }] });
    }
    rooms.push({ id: `r${n++}`, polygon: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], polygonTag: 'assumed', walls });
  }
  return { id: 'F0', elevation: { value: 0, tag: 'assumed' }, ceiling: { value: 3.4, tag: 'assumed' }, slab: { value: 0.3, tag: 'assumed' }, rooms, cols, rows, xs, zs };
}

describe('property tests (seeded)', () => {
  for (let seed = 1; seed <= 60; seed++) {
    it(`random house ${seed}: builds, no gaps, no overlaps, the piece count the spec implies`, () => {
      const fl = randomFloor(seed);
      const spec = { schemaVersion: 1, revision: 1, playerHeight: { value: 1.2, tag: 'assumed' }, floors: [fl], stairs: [] };
      const { cols, rows, xs, zs } = fl;
      delete fl.cols; delete fl.rows; delete fl.xs; delete fl.zs;
      expect(validateSpec(spec)).toEqual([]);
      const w = planWalls(fl);
      expect(wallOverlaps(w.pieces)).toEqual([]);
      expect(junctionGaps(w)).toEqual([]);
      // every opening lands inside its run
      expect(w.openings.every((o) => o.inside)).toBe(true);
      // pieces: x-lines are through walls (one run each); interior z-lines are
      // cut by every interior x-line they cross, exterior z-lines are not;
      // each opening adds a full-height piece and a lintel (and a sill for windows)
      const xRuns = rows + 1, zSegments = 2 + (cols - 1) * rows;
      const ops = w.openings.length, windows = w.openings.filter((o) => o.type === 'window').length;
      expect(w.pieces.length).toBe(xRuns + zSegments + ops * 2 + windows);
      expect(() => planHouse(spec)).not.toThrow();
      void xs; void zs;
    });
  }
});

describe('round trip: spec -> floor plan SVG -> dimensions', () => {
  const spec = load('data/act3/house.json');
  const plan = planHouse(spec);
  for (const f of plan.floors) {
    it(`${f.id}: every room's dimension lines match the spec within 1 mm`, () => {
      const dims = parseDims(floorplanSVG(spec, plan, f.id));
      expect(dims.length).toBe(f.floor.rooms.length * 2);
      for (const r of f.floor.rooms) {
        const xs = r.polygon.map((p) => p[0]), zs = r.polygon.map((p) => p[1]);
        const dx = dims.find((d) => d.room === r.id && d.axis === 'x'), dz = dims.find((d) => d.room === r.id && d.axis === 'z');
        expect(Math.abs(dx.length - (Math.max(...xs) - Math.min(...xs)))).toBeLessThanOrEqual(0.001);
        expect(Math.abs(dz.length - (Math.max(...zs) - Math.min(...zs)))).toBeLessThanOrEqual(0.001);
        expect(Math.abs(dx.from - Math.min(...xs))).toBeLessThanOrEqual(0.001);
      }
    });
  }
});
