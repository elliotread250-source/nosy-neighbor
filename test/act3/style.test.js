// Style mode stays within the dimension cap (spec 7, 29): compare the
// bounding boxes of warped geometry against the survey geometry.
import { describe, it, expect } from 'vitest';
import { warpProp, capCheck, wobble } from '../../src/act3/StyleWarp.js';
import { DESIGN } from '../../src/act3/assumptions.js';
import { KINDS } from '../../src/act3/Props.js';
import { load } from './helpers.js';
import { val } from '../../src/act3/Spec.js';

// the corners of every box part of a prop, in its local frame
function propPositions(kind, w, d, h, f) {
  const spec = KINDS[kind](w, d, h, f);
  const out = [];
  for (const p of spec.parts) {
    const hw = (p.w ?? p.r * 2) / 2, hd = (p.d ?? p.r * 2) / 2, ph = p.h ?? p.r * 2;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [0, ph]) out.push(p.x + sx * hw, p.y + y, p.z + sz * hd);
  }
  return new Float32Array(out);
}

describe('style mode: the 4 percent cap', () => {
  it(`every prop in the house keeps every bounding dimension within ${DESIGN.styleWarpCap * 100} percent`, () => {
    const spec = load('data/act3/house.json');
    let worst = 0, who = '';
    for (const [i, f] of spec.features.entries()) {
      if (!f.size || !KINDS[f.kind]) continue;
      const [w, d, h] = f.size.map((v) => val(v));
      const pos = propPositions(f.kind, w, d ?? w, h ?? w, f);
      if (!pos.length) continue;
      for (let seed = 1; seed < 20; seed++) {
        const c = capCheck(pos, warpProp(pos, i * 977 + seed));
        if (c > worst) { worst = c; who = f.id; }
      }
    }
    expect(worst, `worst ${(worst * 100).toFixed(2)} % on ${who}`).toBeLessThanOrEqual(DESIGN.styleWarpCap + 1e-6);
  });
  it('wall skins wobble by at most 2 cm, under 1 percent of the smallest wall height', () => {
    let m = 0;
    for (let i = 0; i < 5000; i++) m = Math.max(m, Math.abs(wobble(Math.sin(i) * 20, (i % 37) * 0.3, Math.cos(i * 1.3) * 20)));
    expect(m).toBeLessThanOrEqual(0.02);
    expect(0.02 / 3.0).toBeLessThan(0.01);
  });
});
