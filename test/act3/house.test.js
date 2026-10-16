// Section 9 tests 5 to 8 on the full house, plus the Part III checks.
import { describe, it, expect } from 'vitest';
import { planHouse, headroomReport, solidBoxes } from '../../src/act3/Plan.js';
import { audit, auditText } from '../../src/act3/Audit.js';
import { jumpRoute, navGraph, reach, roomAtPoint, jumpModel } from '../../src/act3/Nav.js';
import { planRoof, trackCurve, minRadius } from '../../src/act3/Roof.js';
import { validateSpec, val } from '../../src/act3/Spec.js';
import { PLAYER } from '../../src/act3/assumptions.js';
import { load, houses } from './helpers.js';

const spec = load('data/act3/house.json');
const puzzle = load('data/act3/puzzle.json');
const train = load('data/act3/train.json');
const security = load('data/act3/security.json');
const plan = planHouse(spec);

describe('data files', () => {
  it('test 1 (all files): every number in puzzle, security, train and palette is tagged', () => {
    for (const f of ['puzzle', 'security', 'train', 'palette']) expect(validateSpec(load(`data/act3/${f}.json`), f)).toEqual([]);
  });
});

describe('test 5: stair headroom', () => {
  it('every staircase has at least 2.0 m of headroom along its whole length', () => {
    for (const h of headroomReport(plan)) {
      const why = `${h.id}: ${(h.min * 100).toFixed(1)} cm at ${h.where?.toFixed(2)} m along, under ${h.by?.kind} ${h.by?.floor ?? ''}`;
      expect(h.min, why).toBeGreaterThanOrEqual(2.0);
    }
  });
  it('stairs recompute their risers from the floor-to-floor height', () => {
    const s = plan.stairs.find((x) => x.id === 'stair_main');
    expect(s.n).toBe(19);
    expect(s.riser * s.n).toBeCloseTo(3.7, 9);
    expect(s.blondelOk).toBe(true);
  });
});

describe('test 6: reachability and the jump route', () => {
  it('the railing -> lamp -> over-the-gate route works, and is not trivially easy', () => {
    const jr = jumpRoute(spec, plan);
    const report = jr.hops.map((h) => `${h.name}: rise ${h.rise.toFixed(2)} margin ${(h.margin * 100).toFixed(0)} cm${h.gapMargin !== undefined ? `, distance margin ${(h.gapMargin * 100).toFixed(0)} cm` : ''}${h.headroom !== undefined ? `, head ${(h.headroom * 100).toFixed(0)} cm` : ''}`).join('\n');
    expect(jr.ok, `${report}\n${jr.fails.map((f) => `FAILS ${f.name}: likely culprit ${f.culprit}`).join('\n')}`).toBe(true);
    for (const h of jr.hops) {
      expect(h.margin, `${h.name} margin`).toBeGreaterThan(0.05 - 1e-9);
      expect(h.margin, `${h.name} is trivial`).toBeLessThan(0.4);
      if (h.stand !== undefined) expect(h.stand, `${h.name}: standing surface narrower than the capsule`).toBeGreaterThanOrEqual(0);
    }
    expect(jr.direct.barrier && jr.direct.lamp, 'the barrier and the lamp must be out of reach from the floor').toBe(true);
    // bible margins (section 39): 0.17, 0.07, 0.22
    expect(jr.hops.map((h) => +h.margin.toFixed(2))).toEqual([0.17, 0.07, 0.22]);
  });
  it('a shorter jump breaks the route and the test says which hop', () => {
    const jr = jumpRoute(spec, plan, { ...PLAYER, jumpVelocity: 3.7 });
    expect(jr.ok).toBe(false);
    expect(jr.fails[0].name).toBe('rail -> lamp');
  });
  it('every floor, the roof and every mannequin can be reached from the entry window', () => {
    const g = navGraph(spec, plan, PLAYER, puzzle);
    const where = (it) => roomAtPoint(spec, it.floor, it.at.x, it.at.z)?.id;
    const items = Object.fromEntries(puzzle.items.map((it) => [it.id, where(it)]));
    const r = reach(g, 'yard', items);
    for (const f of spec.floors) expect(f.rooms.some((rm) => r.reached.has(rm.id)), `floor ${f.id}`).toBe(true);
    for (const n of ['terrace', 'roof', 'windmill', 'birthday_room', 'gallery_f1', 'control_room_f2', 'basement_b1']) expect(r.reached.has(n), n).toBe(true);
    // every room is reachable (none sealed off by mistake)
    const all = spec.floors.flatMap((f) => f.rooms.map((rm) => rm.id));
    expect(all.filter((id) => !r.reached.has(id))).toEqual([]);
    // the basement needs both items: without the keycard it stays shut
    const noCard = reach(g, 'yard', { crowbar: items.crowbar });
    expect(noCard.reached.has('basement_b1')).toBe(false);
    expect(r.items).toEqual(['crowbar', 'keycard']);
    // the gated section is only reachable by the jump route
    const noJump = { ...g, edges: g.edges.filter((e) => e.kind !== 'jump route') };
    expect(reach(noJump, 'yard', items).reached.has('gallery_f1')).toBe(false);
  });
  it('the jump numbers follow the physics: rise = v^2 / 2g', () => {
    const J = jumpModel();
    expect(J.rise).toBeCloseTo(0.8155, 3);
    expect(J.footClear).toBeCloseTo(0.7155, 3);
  });
});

describe('test 7: the train track', () => {
  const R = planRoof(spec, plan);
  for (const key of ['ring', 'route']) {
    it(`${key}: closed loop, turn radius at least ${val(train.minRadius)} m`, () => {
      const c = trackCurve(train[key].controlPoints, true);
      expect(c.getPoint(0).distanceTo(c.getPoint(1))).toBeLessThan(1e-6);
      const m = minRadius(c);
      expect(m.min, `tightest turn ${m.min.toFixed(2)} m at ${m.at.toFixed(1)} m`).toBeGreaterThanOrEqual(val(train.minRadius));
    });
  }
  it('the train route clears the roof geometry: 0.3 m from the centerline to anything beside the cars, never touching the surface below', () => {
    const c = trackCurve(train.route.controlPoints, true);
    const solids = [...solidBoxes(plan), ...R.boxes];
    const H = Math.max(...[train.engine, ...train.carriages].map((x) => val(x.size[2])));
    const surface = 7.4; // the terrace deck and the box floor
    let worst = { d: Infinity }, low = Infinity;
    for (const p of c.getSpacedPoints(600)) {
      low = Math.min(low, p.y - surface);
      for (const b of solids) {
        if (b.y1 <= p.y + 0.05 || b.y0 >= p.y + H) continue; // what the rails rest on, or above the cars
        const dx = Math.max(0, b.x0 - p.x, p.x - b.x1), dz = Math.max(0, b.z0 - p.z, p.z - b.z1);
        const d = Math.hypot(dx, dz);
        if (d < worst.d) worst = { d, at: p, b };
      }
    }
    expect(worst.d, `closest ${worst.d.toFixed(2)} m to ${worst.b?.kind ?? worst.b?.id} at (${worst.at?.x.toFixed(2)}, ${worst.at?.z.toFixed(2)})`).toBeGreaterThanOrEqual(val(train.clearance) - 1e-6);
    expect(low, 'the rails follow the deck at 0.05 m and never dip into it').toBeGreaterThanOrEqual(0.03);
  });
});

describe('test 8: audit totals', () => {
  for (const [name, s] of houses()) {
    it(`${name}: measured + documented + assumed = 100 percent per floor`, () => {
      const a = audit(s);
      for (const f of a.floors) for (const k of ['wallPct', 'areaPct']) expect(f[k].measured + f[k].documented + f[k].assumed).toBeCloseTo(100, 6);
      expect(a.overallMeasured).toBe(0);
      expect(auditText(a)).toContain('0 PERCENT MEASURED');
    });
  }
});

describe('Part III checks', () => {
  it('every security device and pickup sits inside the house or on its roof', () => {
    for (const c of security.cameras) expect(c.at.x).toBeGreaterThan(-0.5);
    for (const it of puzzle.items) expect(roomAtPoint(spec, it.floor, it.at.x, it.at.z), it.id).not.toBeNull();
  });
  it('the mannequin count is data, and matches the pads', () => {
    expect(puzzle.birthday.pads).toHaveLength(puzzle.birthday.mannequinCount);
    expect(puzzle.mannequins).toHaveLength(puzzle.mannequinCount);
  });
});
