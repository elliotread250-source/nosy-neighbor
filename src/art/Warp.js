// Vertex-level deformation helpers. Every warp edits a geometry's position
// attribute in local space and returns the same geometry for chaining.
// Call smoothNormals(geo) (from Geo.js) once after the last warp, or use
// finish(geo) which is the same thing.
import { CONFIG } from '../config.js';
import { smoothNormals } from './Geo.js';

const DEG = Math.PI / 180;

// ---------- Seeded randomness ----------

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a so each object gets a stable seed from its name.
export function seedFrom(name) {
  let h = 0x811c9dc5 ^ CONFIG.world.worldSeed;
  const s = String(name);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Convenience: a per-object random stream with range helpers.
export function rng(name) {
  const r = mulberry32(seedFrom(name));
  return {
    next: r,
    range: (a, b) => a + (b - a) * r(),
    sign: () => (r() < 0.5 ? -1 : 1),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    int: (a, b) => a + Math.floor(r() * (b - a + 1)),
    // signed value in [min,max] with random sign, handy for warp budgets
    signed: ([a, b]) => (r() < 0.5 ? -1 : 1) * (a + (b - a) * r()),
  };
}

// ---------- 3D value noise for wobble ----------

function hash3(x, y, z, seed) {
  let h = seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

export function valueNoise3(x, y, z, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
  let v = 0;
  for (let dz = 0; dz < 2; dz++)
    for (let dy = 0; dy < 2; dy++)
      for (let dx = 0; dx < 2; dx++) {
        const w = (dx ? xf : 1 - xf) * (dy ? yf : 1 - yf) * (dz ? zf : 1 - zf);
        v += w * hash3(xi + dx, yi + dy, zi + dz, seed);
      }
  return v * 2 - 1;
}

// ---------- Helpers ----------

function bounds(geo) {
  geo.computeBoundingBox();
  return geo.boundingBox;
}

function intensity() {
  return CONFIG.world.warpIntensity;
}

function eachVertex(geo, fn) {
  const pos = geo.attributes.position;
  const a = pos.array;
  for (let i = 0; i < a.length; i += 3) fn(a, i);
  pos.needsUpdate = true;
  geo.boundingBox = null;
  geo.boundingSphere = null;
  return geo;
}

// ---------- Warps ----------

// Shear along X or Z proportional to height above the base. Base stays planted.
// baseY: shear pivot height (defaults to the geometry's own base). Pass a
// shared baseY to lean several pieces of one wall consistently.
export function lean(geo, angleDeg, axis = 'z', baseY) {
  const b = bounds(geo);
  const y0 = baseY ?? b.min.y;
  const k = Math.tan(angleDeg * DEG * intensity());
  const off = axis === 'x' ? 0 : 2;
  return eachVertex(geo, (a, i) => {
    a[i + off] += (a[i + 1] - y0) * k;
  });
}

// Scale X/Z by a lerp from bottomScale (at min y) to topScale (at max y).
export function taper(geo, topScale = 1, bottomScale = 1) {
  const b = bounds(geo);
  const h = Math.max(1e-6, b.max.y - b.min.y);
  const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
  const I = intensity();
  const ts = 1 + (topScale - 1) * I, bs = 1 + (bottomScale - 1) * I;
  return eachVertex(geo, (a, i) => {
    const t = (a[i + 1] - b.min.y) / h;
    const s = bs + (ts - bs) * t;
    a[i] = cx + (a[i] - cx) * s;
    a[i + 2] = cz + (a[i + 2] - cz) * s;
  });
}

// Push outward from the vertical axis by amount * sin(pi * normalizedY).
// amount is a fraction of the object's horizontal half-size.
export function bulge(geo, amount = 0.05) {
  const b = bounds(geo);
  const h = Math.max(1e-6, b.max.y - b.min.y);
  const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
  const amt = amount * intensity();
  return eachVertex(geo, (a, i) => {
    const t = (a[i + 1] - b.min.y) / h;
    const s = 1 + amt * Math.sin(Math.PI * t);
    a[i] = cx + (a[i] - cx) * s;
    a[i + 2] = cz + (a[i + 2] - cz) * s;
  });
}

// Rotate around Y proportional to height.
export function twist(geo, degreesOverHeight) {
  const b = bounds(geo);
  const h = Math.max(1e-6, b.max.y - b.min.y);
  const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
  const total = degreesOverHeight * DEG * intensity();
  return eachVertex(geo, (a, i) => {
    const ang = ((a[i + 1] - b.min.y) / h) * total;
    const c = Math.cos(ang), s = Math.sin(ang);
    const x = a[i] - cx, z = a[i + 2] - cz;
    a[i] = cx + x * c - z * s;
    a[i + 2] = cz + x * s + z * c;
  });
}

// Low-frequency noise so straight edges look hand-sculpted.
// amplitude is a fraction of the object's largest dimension.
export function wobble(geo, amplitude = CONFIG.warpBudgets.wobble, frequency = 1.3, seed = 1) {
  const b = bounds(geo);
  const size = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
  const amp = amplitude * size * intensity();
  const f = frequency / Math.max(size, 1e-3);
  return eachVertex(geo, (a, i) => {
    const x = a[i] * f, y = a[i + 1] * f, z = a[i + 2] * f;
    a[i] += amp * valueNoise3(x, y, z, seed);
    a[i + 1] += amp * valueNoise3(x + 17.3, y, z, seed + 1);
    a[i + 2] += amp * valueNoise3(x, y + 31.7, z, seed + 2);
  });
}

// Pull the middle of a horizontal span downward. axis = span direction.
export function sag(geo, amount, axis = 'x') {
  const b = bounds(geo);
  const lo = axis === 'x' ? b.min.x : b.min.z;
  const hi = axis === 'x' ? b.max.x : b.max.z;
  const len = Math.max(1e-6, hi - lo);
  const off = axis === 'x' ? 0 : 2;
  const amt = amount * intensity();
  return eachVertex(geo, (a, i) => {
    const t = (a[i + off] - lo) / len;
    a[i + 1] -= amt * Math.sin(Math.PI * t);
  });
}

// Shift only the top vertices sideways (smoothly ramped by height).
export function skewTop(geo, dx = 0, dz = 0) {
  const b = bounds(geo);
  const h = Math.max(1e-6, b.max.y - b.min.y);
  const I = intensity();
  return eachVertex(geo, (a, i) => {
    const t = (a[i + 1] - b.min.y) / h;
    const w = t * t;
    a[i] += dx * w * I;
    a[i + 2] += dz * w * I;
  });
}

// Bend along Y: curve the object over like a banana in the given axis.
export function bend(geo, degrees, axis = 'z') {
  const b = bounds(geo);
  const h = Math.max(1e-6, b.max.y - b.min.y);
  const total = degrees * DEG * intensity();
  if (Math.abs(total) < 1e-5) return geo;
  const R = h / total;
  const off = axis === 'x' ? 0 : 2;
  return eachVertex(geo, (a, i) => {
    const t = (a[i + 1] - b.min.y) / h;
    const ang = t * total;
    const d = a[i + off];
    const r = R - d;
    a[i + off] = R - r * Math.cos(ang);
    a[i + 1] = b.min.y + r * Math.sin(ang);
  });
}

// One-call "make it wrong" for furniture, driven by the warp budgets.
export function furnitureWarp(geo, name, opts = {}) {
  const W = CONFIG.warpBudgets;
  const r = rng(name);
  const leanDeg = opts.lean ?? r.signed(W.furnitureLean);
  const taperTop = opts.taper ?? r.range(W.furnitureTaper[0], W.furnitureTaper[1]);
  const bul = opts.bulge ?? r.range(W.furnitureBulge[0], W.furnitureBulge[1]);
  taper(geo, taperTop, 1);
  if (bul > 0) bulge(geo, bul);
  lean(geo, leanDeg, opts.axis ?? (r.next() < 0.5 ? 'x' : 'z'));
  wobble(geo, W.wobble, 1.3, seedFrom(name));
  return smoothNormals(geo);
}

export const finish = smoothNormals;
