// Style mode warps (spec section 7): a lean, a taper and a gentle bulge on
// top of the survey geometry, with every dimension change capped at
// DESIGN.styleWarpCap (4 percent). Pure functions on position arrays, so the
// cap is tested in Node. Survey mode keeps the original positions.
import { DESIGN } from './assumptions.js';

function rand(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bboxOf(pos) {
  const b = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) {
    if (pos[i + k] < b.min[k]) b.min[k] = pos[i + k];
    if (pos[i + k] > b.max[k]) b.max[k] = pos[i + k];
  }
  return b;
}

// Warp a prop-sized object (local positions, y up from its base). The lean
// moves the top sideways by at most half the cap times the footprint, the
// taper changes it by 30 % and the bulge by 15 % of the cap, so no bounding
// dimension grows or shrinks by more than the cap.
export function warpProp(pos, seed, cap = DESIGN.styleWarpCap) {
  const out = new Float32Array(pos);
  const b = bboxOf(pos);
  const sx = b.max[0] - b.min[0], sy = b.max[1] - b.min[1], sz = b.max[2] - b.min[2];
  if (sy < 1e-6) return out;
  const r = rand(seed);
  const leanX = (r() * 2 - 1) * cap * 0.5 * sx, leanZ = (r() * 2 - 1) * cap * 0.5 * sz;
  const taper = (r() * 2 - 1) * cap * 0.3, bulge = r() * cap * 0.3;
  const cx = (b.min[0] + b.max[0]) / 2, cz = (b.min[2] + b.max[2]) / 2;
  for (let i = 0; i < out.length; i += 3) {
    const t = (out[i + 1] - b.min[1]) / sy;
    const k = 1 + taper * (t - 0.5) * 2 + bulge * Math.sin(Math.PI * t) - bulge * 0.5;
    out[i] = cx + (out[i] - cx) * k + leanX * t;
    out[i + 2] = cz + (out[i + 2] - cz) * k + leanZ * t;
  }
  return out;
}

// A smooth wobble field for wall skins: displacement along the face normal,
// at most `amp` meters (2 cm by default: under 1 % of any wall).
export function wobble(x, y, z, amp = 0.02) {
  return amp * (0.5 * Math.sin(x * 1.7 + z * 0.9) * Math.cos(y * 1.3) + 0.5 * Math.sin(z * 2.3 - x * 0.7 + y * 0.8));
}

// The largest relative change of any bounding dimension between two arrays.
export function capCheck(before, after) {
  const a = bboxOf(before), b = bboxOf(after);
  let worst = 0;
  for (let k = 0; k < 3; k++) {
    const s = a.max[k] - a.min[k];
    if (s < 1e-6) continue;
    worst = Math.max(worst, Math.abs((b.max[k] - b.min[k]) - s) / s);
  }
  return worst;
}
