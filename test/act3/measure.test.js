// Milestone 2: the measure math, the tag-upgrade pipeline, and the section 29
// conflict, rescale and migration tests.
import { describe, it, expect } from 'vitest';
import { straightOn, fourCorner, homography, applyH, combine, applyMeasurements, insertVertex } from '../../src/act3/Measure.js';
import { validateSpec, val, resolveTarget } from '../../src/act3/Spec.js';
import { roomEdges } from '../../src/act3/Walls.js';
import { load } from './helpers.js';

describe('measure math', () => {
  it('straight-on: scale from a ruler, with an uncertainty', () => {
    // a 1.2 m player 240 px tall, a door 520 px tall -> 2.6 m
    const r = straightOn({ ruler: [[100, 500], [100, 260]], target: [[300, 500], [300, -20]], rulerLength: 1.2, rulerSigma: 0.02, clickSigma: 1.5 });
    expect(r.value).toBeCloseTo(2.6, 6);
    expect(r.sigma).toBeGreaterThan(0.03);
    expect(r.sigma).toBeLessThan(0.08);
    expect(r.ratio).toBeCloseTo(520 / 240, 6);
  });
  it('homography maps the four corners exactly', () => {
    const src = [[110, 40], [400, 70], [380, 600], [90, 560]];
    const H = homography(src, [[0, 0], [0.95, 0], [0.95, 2.6], [0, 2.6]]);
    expect(applyH(H, src[2])[0]).toBeCloseTo(0.95, 6);
    expect(applyH(H, src[2])[1]).toBeCloseTo(2.6, 6);
  });
  it('four-corner: a length in a wall seen at an angle', () => {
    // synthetic: a plane seen through a known projective map
    const P = [[300, 40, 100], [-20, 260, 80], [0.05, 0.02, 1]];
    const proj = ([x, y]) => { const w = P[2][0] * x + P[2][1] * y + 1; return [(P[0][0] * x + P[0][1] * y + P[0][2]) / w, (P[1][0] * x + P[1][1] * y + P[1][2]) / w]; };
    const corners = [[0, 0], [0.95, 0], [0.95, 2.6], [0, 2.6]].map(proj);
    const target = [[1.5, 0], [1.5, 3.4]].map(proj); // a 3.4 m ceiling line in the same wall
    const r = fourCorner({ corners, rectWidth: 0.95, rectHeight: 2.6, target, clickSigma: 0.5 });
    expect(r.value).toBeCloseTo(3.4, 4);
    expect(r.sigma).toBeGreaterThan(0);
    expect(r.sigma).toBeLessThan(0.1);
  });
});

describe('measurement pipeline', () => {
  const spec = load('data/act3/test-house.json');
  it('upgrades assumed to measured automatically', () => {
    const r = applyMeasurements(spec, [{ id: 'm1', target: 'F0.ceiling', value: 3.21, sigma: 0.03 }]);
    expect(r.diff).toHaveLength(1);
    expect(r.spec.floors[0].ceiling.value).toBe(3.21);
    expect(r.spec.floors[0].ceiling.tag).toBe('measured');
    expect(validateSpec(r.spec)).toEqual([]);
  });
  it('conflict test: two inconsistent measurements are flagged, neither is picked', () => {
    const r = applyMeasurements(spec, [
      { id: 'a', target: 'F0.ceiling', value: 3.1, sigma: 0.02 },
      { id: 'b', target: 'F0.ceiling', value: 3.6, sigma: 0.02 },
    ]);
    expect(r.conflicts).toHaveLength(1);
    expect(r.spec.floors[0].ceiling.tag).toBe('conflict');
    expect(r.spec.floors[0].ceiling.value).toBe(3.4); // old value kept
    expect(r.spec.floors[0].ceiling.candidates.map((c) => c.value)).toEqual([3.1, 3.6]);
    expect(validateSpec(r.spec)).toEqual([]);
  });
  it('consistent measurements combine by inverse variance', () => {
    const c = combine([{ id: 'a', value: 3.0, sigma: 0.1 }, { id: 'b', value: 3.1, sigma: 0.1 }]);
    expect(c.conflict).toBe(false);
    expect(c.value).toBeCloseTo(3.05, 6);
    expect(c.sigma).toBeCloseTo(0.1 / Math.SQRT2, 6);
  });
  it('never overwrites a measured value with a disagreeing one', () => {
    const first = applyMeasurements(spec, [{ id: 'a', target: 'F0.ceiling', value: 3.2, sigma: 0.02 }]).spec;
    const r = applyMeasurements(first, [{ id: 'b', target: 'F0.ceiling', value: 3.5, sigma: 0.02 }]);
    expect(r.conflicts[0].kind).toBe('overwrite');
    expect(r.spec.floors[0].ceiling.value).toBe(3.2);
  });
});

describe('test 9 / rescale test', () => {
  it('a 10 percent taller player rescales every player-ruled measurement by 10 percent and nothing else', () => {
    const spec = load('data/act3/test-house.json');
    const ms = [
      { id: 'p1', target: 'F0.ceiling', value: 3.3, sigma: 0.05, ratio: 3.3 / 1.2, ratioSigma: 0.04, dependsOn: ['playerHeight'] },
      { id: 'p2', target: 'F0.test_room.wall0.opening0.height', value: 2.5, sigma: 0.05, ratio: 2.5 / 1.2, ratioSigma: 0.04, dependsOn: ['playerHeight'] },
      { id: 'i1', target: 'F0.test_room.wall1.opening0.width', value: 0.92, sigma: 0.01 }, // ruled by something else
    ];
    const a = applyMeasurements(spec, ms).spec;
    const taller = structuredClone(spec);
    taller.playerHeight.value = 1.32;
    const b = applyMeasurements(taller, ms).spec;
    for (const t of ['F0.ceiling', 'F0.test_room.wall0.opening0.height']) {
      const va = val(resolveTarget(a, t).node[resolveTarget(a, t).key]);
      const vb = val(resolveTarget(b, t).node[resolveTarget(b, t).key]);
      expect(vb / va).toBeCloseTo(1.1, 2);
    }
    const ia = resolveTarget(a, 'F0.test_room.wall1.opening0.width'), ib = resolveTarget(b, 'F0.test_room.wall1.opening0.width');
    expect(val(ib.node[ib.key])).toBe(val(ia.node[ia.key]));
  });
});

describe('migration test', () => {
  it('inserting a vertex keeps every measurement on the same physical wall', () => {
    const spec = load('data/act3/test-house.json');
    const ms = [
      { id: 'w2', target: 'F0.test_room.wall2.length', value: 5, sigma: 0.05 },
      { id: 'o1', target: 'F0.test_room.wall1.opening0.width', value: 0.9, sigma: 0.01 },
      { id: 'o0', target: 'F0.test_room.wall0.opening0.width', value: 0.95, sigma: 0.01 },
    ];
    const seg = (s, t) => {
      const [f, r, w] = t.split('.');
      const room = s.floors.find((x) => x.id === f).rooms.find((x) => x.id === r);
      const e = roomEdges(room)[Number(/\d+/.exec(w)[0])];
      return { e, room };
    };
    const onLine = (p, e) => Math.abs((e.b[0] - e.a[0]) * (p[1] - e.a[1]) - (e.b[1] - e.a[1]) * (p[0] - e.a[0])) < 1e-9;
    // split wall 0 (the door wall, (0,0)->(5,0)) at x = 1: the door (offset 2) moves to the new edge
    const m = insertVertex(spec, ms, 'F0', 'test_room', 0, [1, 0]);
    expect(validateSpec(m.spec)).toEqual([]);
    for (let i = 0; i < ms.length; i++) {
      const before = seg(spec, ms[i].target).e, after = seg(m.spec, m.measurements[i].target).e;
      expect(onLine(after.a, before) && onLine(after.b, before)).toBe(true);
    }
    // the door now lives on wall1 at offset 1.0, same absolute position
    expect(m.measurements[2].target).toBe('F0.test_room.wall1.opening0.width');
    const w1 = m.spec.floors[0].rooms[0].walls.find((w) => w.from === 1);
    expect(w1.openings[0].offset.value).toBe(1);
    expect(m.measurements[0].target).toBe('F0.test_room.wall3.length');
  });
});
