// Geometry helpers: soft-edged boxes and cylinders that survive warping.
// Unlike three's RoundedBoxGeometry, these boxes carry interior subdivisions
// so bulge / twist / bend have vertices to move.
import { BoxGeometry, LatheGeometry, Vector2, BufferAttribute } from 'three';
import { gfx } from '../config.js';

// Build a box with rounded edges and corners. Origin at the center.
// UVs are in world meters on each face, so a texture's repeat = 1 / tileSizeMeters.
export function roundedBox(w, h, d, radius, segments, opts = {}) {
  const r = Math.min(radius ?? Math.min(w, h, d) * 0.08, Math.min(w, h, d) / 2 - 1e-4);
  let s = Math.max(1, segments ?? gfx().bevelSegments);
  // small things don't need many bevel rings
  const minDim = Math.min(w, h, d);
  if (minDim < 0.1) s = Math.min(s, 1);
  else if (minDim < 0.35) s = Math.min(s, 2);
  const midStep = opts.midStep ?? 0.9; // target interior segment length in meters
  const midMax = opts.midMax ?? 8;
  const mx = Math.max(1, Math.min(midMax, Math.ceil(w / midStep)));
  const my = Math.max(1, Math.min(midMax, Math.ceil(h / midStep)));
  const mz = Math.max(1, Math.min(midMax, Math.ceil(d / midStep)));
  const nx = 2 * s + mx, ny = 2 * s + my, nz = 2 * s + mz;

  const geo = new BoxGeometry(1, 1, 1, nx, ny, nz);
  geo.clearGroups();
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  const half = [w / 2, h / 2, d / 2];
  const ns = [nx, ny, nz];
  const ms = [mx, my, mz];
  const c = [0, 0, 0];

  for (let v = 0; v < pos.count; v++) {
    const raw = [pos.getX(v), pos.getY(v), pos.getZ(v)];
    for (let k = 0; k < 3; k++) {
      const n = ns[k], hk = half[k];
      const i = Math.round((raw[k] + 0.5) * n);
      let t;
      if (i <= s) t = -hk + r * (i / s);
      else if (i >= n - s) t = hk - r * ((n - i) / s);
      else t = -hk + r + 2 * (hk - r) * ((i - s) / ms[k]);
      c[k] = t;
    }
    // project corner/edge zones onto the rounding radius
    let dx = 0, dy = 0, dz = 0;
    const ix = Math.max(-(half[0] - r), Math.min(half[0] - r, c[0]));
    const iy = Math.max(-(half[1] - r), Math.min(half[1] - r, c[1]));
    const iz = Math.max(-(half[2] - r), Math.min(half[2] - r, c[2]));
    dx = c[0] - ix; dy = c[1] - iy; dz = c[2] - iz;
    const len = Math.hypot(dx, dy, dz);
    if (len > 1e-9) {
      c[0] = ix + (dx / len) * r;
      c[1] = iy + (dy / len) * r;
      c[2] = iz + (dz / len) * r;
    }
    pos.setXYZ(v, c[0], c[1], c[2]);

    // world-meter UVs chosen by the original flat face normal
    const fx = nor.getX(v), fy = nor.getY(v), fz = nor.getZ(v);
    if (Math.abs(fx) > 0.5) uv.setXY(v, c[2] * -Math.sign(fx) + d / 2, c[1] + h / 2);
    else if (Math.abs(fy) > 0.5) uv.setXY(v, c[0] + w / 2, c[2] * -Math.sign(fy) + d / 2);
    else uv.setXY(v, c[0] * Math.sign(fz) + w / 2, c[1] + h / 2);
  }
  pos.needsUpdate = true;
  uv.needsUpdate = true;
  if (opts.bottom) geo.translate(0, h / 2, 0);
  if (!opts.skipNormals) smoothNormals(geo);
  return geo;
}

// Cylinder with rounded top and bottom edges via a lathe profile.
// Origin at the center. Extra height rings so it bends and bulges cleanly.
export function chamferCylinder(rTop, rBottom, h, radialSegs = 16, bevel, opts = {}) {
  const b = Math.min(bevel ?? Math.min(rTop, rBottom) * 0.3, h / 2 - 1e-4, Math.min(rTop, rBottom) - 1e-4);
  const bs = opts.bevelSegs ?? Math.max(2, gfx().bevelSegments);
  const heightSegs = opts.heightSegs ?? Math.max(1, Math.min(10, Math.ceil(h / 0.25)));
  const pts = [];
  pts.push(new Vector2(0, 0));
  // bottom rim arc: from (rBottom - b, 0) to (rBottom, b)
  for (let i = 0; i <= bs; i++) {
    const a = -Math.PI / 2 + (i / bs) * (Math.PI / 2);
    pts.push(new Vector2(rBottom - b + Math.cos(a) * b, b + Math.sin(a) * b));
  }
  for (let i = 1; i < heightSegs; i++) {
    const t = i / heightSegs;
    const y = b + (h - 2 * b) * t;
    pts.push(new Vector2(rBottom + (rTop - rBottom) * t, y));
  }
  // top rim arc: from (rTop, h - b) to (rTop - b, h)
  for (let i = 0; i <= bs; i++) {
    const a = (i / bs) * (Math.PI / 2);
    pts.push(new Vector2(rTop - b + Math.cos(a) * b, h - b + Math.sin(a) * b));
  }
  pts.push(new Vector2(0, h));
  const geo = new LatheGeometry(pts, radialSegs);
  geo.translate(0, opts.bottom ? 0 : -h / 2, 0);
  if (!opts.skipNormals) smoothNormals(geo);
  return geo;
}

// Lathe from an arbitrary [radius, y] profile, e.g. turned table legs.
export function turned(profile, radialSegs = 14, opts = {}) {
  const pts = profile.map(([r, y]) => new Vector2(Math.max(0, r), y));
  const geo = new LatheGeometry(pts, radialSegs);
  if (!opts.skipNormals) smoothNormals(geo);
  return geo;
}

// Compute normals, then average across vertices that share a position so
// face seams on rounded boxes and lathe seams shade as one smooth surface.
export function smoothNormals(geo) {
  geo.computeVertexNormals();
  const pos = geo.attributes.position.array;
  const nor = geo.attributes.normal.array;
  const map = new Map();
  const q = 1e4;
  const keys = new Array(pos.length / 3);
  for (let i = 0, v = 0; i < pos.length; i += 3, v++) {
    const k = `${Math.round(pos[i] * q)},${Math.round(pos[i + 1] * q)},${Math.round(pos[i + 2] * q)}`;
    keys[v] = k;
    let acc = map.get(k);
    if (!acc) { acc = [0, 0, 0]; map.set(k, acc); }
    acc[0] += nor[i]; acc[1] += nor[i + 1]; acc[2] += nor[i + 2];
  }
  for (let v = 0; v < keys.length; v++) {
    const acc = map.get(keys[v]);
    const l = Math.hypot(acc[0], acc[1], acc[2]) || 1;
    nor[v * 3] = acc[0] / l; nor[v * 3 + 1] = acc[1] / l; nor[v * 3 + 2] = acc[2] / l;
  }
  geo.attributes.normal.needsUpdate = true;
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

// Vertical vertex-color gradient (used for cloud undersides, grass tufts, etc).
export function verticalGradient(geo, bottomColor, topColor, bias = 0) {
  geo.computeBoundingBox();
  const b = geo.boundingBox;
  const h = Math.max(1e-6, b.max.y - b.min.y);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    let t = (pos.getY(i) - b.min.y) / h;
    t = Math.min(1, Math.max(0, t + bias));
    t = t * t * (3 - 2 * t);
    col[i * 3] = bottomColor.r + (topColor.r - bottomColor.r) * t;
    col[i * 3 + 1] = bottomColor.g + (topColor.g - bottomColor.g) * t;
    col[i * 3 + 2] = bottomColor.b + (topColor.b - bottomColor.b) * t;
  }
  geo.setAttribute('color', new BufferAttribute(col, 3));
  return geo;
}
