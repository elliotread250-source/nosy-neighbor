// Architecture kit: walls with door/window openings, floors, gable roofs,
// chunky window frames with cartoon glare glass. Static pieces are collected
// and merged per material at finalize() with world-space planar UVs, so
// siding and wallpaper flow continuously across wall pieces.
import {
  Group, Mesh, Vector3, Quaternion, Euler, Matrix4, Shape, ExtrudeGeometry, BufferAttribute, DoubleSide,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { roundedBox, smoothNormals } from '../art/Geo.js';
import { lean as leanWarp, wobble, skewTop as skewWarp, sag as sagWarp, seedFrom } from '../art/Warp.js';
import { makeMat } from '../art/Materials.js';
import * as Tex from '../art/CanvasTextures.js';
import { CONFIG } from '../config.js';

const DEG = Math.PI / 180;
const _m = new Matrix4();
const _q = new Quaternion();
const _e = new Euler();
const _v = new Vector3();

// Planar world UVs by dominant normal: walls get (horizontal, y), floors (x, z).
export function worldUV(geo) {
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  let uv = geo.attributes.uv;
  if (!uv) {
    uv = new BufferAttribute(new Float32Array(pos.count * 2), 2);
    geo.setAttribute('uv', uv);
  }
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (ny >= nx && ny >= nz) uv.setXY(i, x, z);
    else if (nx >= nz) uv.setXY(i, z, y);
    else uv.setXY(i, x, y);
  }
  uv.needsUpdate = true;
  return geo;
}

export class Builder {
  constructor(parent, physics, name = 'building') {
    this.root = new Group();
    this.root.name = name;
    parent.add(this.root);
    this.physics = physics;
    this.name = name;
    this.statics = new Map(); // material -> { mat, geos: [], cast, receive }
    this.count = 0;
    this.shear = null; // { deg, axis: 'x'|'z', baseY } leans the whole chunk
  }

  // Lean everything built after this call (a whole wing), pivoting at baseY.
  setShear(deg, axis, baseY) {
    this.shear = deg ? { deg, axis, baseY } : null;
  }

  // Horizontal offset the chunk shear applies at height y.
  shearAt(y) {
    if (!this.shear) return { x: 0, z: 0 };
    const k = Math.tan(this.shear.deg * DEG * CONFIG.world.warpIntensity) * (y - this.shear.baseY);
    return this.shear.axis === 'x' ? { x: k, z: 0 } : { x: 0, z: k };
  }

  // Register a geometry already in world space for merging.
  addStatic(geo, mat, { cast = true, receive = true } = {}) {
    const key = mat.uuid + (cast ? 'c' : '') + (receive ? 'r' : '');
    let e = this.statics.get(key);
    if (!e) { e = { mat, geos: [], cast, receive }; this.statics.set(key, e); }
    // keep attribute sets uniform for merging
    if (geo.index) geo = geo.toNonIndexed();
    for (const a of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(a)) geo.deleteAttribute(a);
    e.geos.push(geo);
    return geo;
  }

  /**
   * A rounded, optionally warped box placed in world space.
   * opts: { radius, rotY, lean:[deg, axis, baseY?], skewTop:[dx,dz], wobble, sag:[amt,axis],
   *         collide (default true), dynamic (return Mesh instead of merging), cast, receive, worldUV }
   */
  box(w, h, d, mat, x, y, z, opts = {}) {
    if (this.shear && !opts.noShear) {
      if (opts.rotX || opts.rotZ) {
        const o = this.shearAt(y + h / 2);
        x += o.x; z += o.z;
      } else if (!opts.lean) {
        opts = { ...opts, lean: [this.shear.deg, this.shear.axis, this.shear.baseY - y] };
      }
    }
    const g = roundedBox(w, h, d, opts.radius ?? Math.min(w, h, d, 0.5) * 0.12, opts.segments, { skipNormals: true, midStep: opts.midStep });
    g.translate(0, h / 2, 0); // origin at base
    if (opts.sag) sagWarp(g, opts.sag[0], opts.sag[1] ?? 'x');
    if (opts.skewTop) skewWarp(g, opts.skewTop[0], opts.skewTop[1]);
    if (opts.lean) leanWarp(g, opts.lean[0], opts.lean[1] ?? 'z', opts.lean[2]);
    if (opts.lean2) leanWarp(g, opts.lean2[0], opts.lean2[1] ?? 'x', opts.lean2[2]);
    if (opts.wobble !== 0) wobble(g, opts.wobble ?? CONFIG.warpBudgets.wobble * 0.5, 1.3, seedFrom(`${this.name}${this.count++}`));
    smoothNormals(g);
    _e.set(opts.rotX ?? 0, opts.rotY ?? 0, opts.rotZ ?? 0);
    _q.setFromEuler(_e);
    if (opts.dynamic) {
      const m = new Mesh(g, mat);
      m.position.set(x, y, z);
      m.quaternion.copy(_q);
      m.castShadow = opts.cast ?? true;
      m.receiveShadow = opts.receive ?? true;
      this.root.add(m);
      if (opts.collide !== false) this.physics.addStaticFromMesh(m, opts.data);
      return m;
    }
    _m.compose(_v.set(x, y, z), _q, new Vector3(1, 1, 1));
    g.applyMatrix4(_m);
    if (opts.worldUV !== false) worldUV(g);
    this.addStatic(g, mat, opts);
    if (opts.collide !== false) {
      // collider: unwarped box, tilted by the lean angle about its center
      let cx = 0, cz = 0;
      const q = _q.clone();
      if (opts.lean) {
        const k = Math.tan(opts.lean[0] * DEG * CONFIG.world.warpIntensity);
        const base = opts.lean[2] ?? 0;
        const off = (h / 2 - base) * k;
        if ((opts.lean[1] ?? 'z') === 'x') cx = off; else cz = off;
        const tilt = new Quaternion().setFromEuler(
          (opts.lean[1] ?? 'z') === 'x' ? new Euler(0, 0, -Math.atan(k)) : new Euler(Math.atan(k), 0, 0),
        );
        q.multiply(tilt);
      }
      const c = new Vector3(cx, h / 2, cz).applyQuaternion(_q).add(_v.set(x, y, z));
      this.physics.addStaticBox(c, new Vector3(w / 2, h / 2, d / 2), q, opts.data ?? null);
    }
    return g;
  }

  /**
   * Wall along X (axis 'x', at z) or along Z (axis 'z', at x).
   * spec: { axis, from, to, at, y, h, t, mat, matB (other face), openings:[{at, w, bottom, top}], lean, leanAxis }
   * Openings: 'at' is the center offset along the wall from 'from'.
   * Returns opening world positions for placing frames.
   */
  wall(spec) {
    const { axis = 'x', from, to, at, y = 0, h, t = 0.25, mat } = spec;
    const len = Math.abs(to - from);
    const dir = Math.sign(to - from) || 1;
    const ops = [...(spec.openings || [])].sort((a, b) => a.at - b.at);
    const pieces = []; // [start, end, bottom, top] along wall local
    let cur = 0;
    for (const o of ops) {
      const s = o.at - o.w / 2, e = o.at + o.w / 2;
      if (s > cur + 0.01) pieces.push([cur, s, 0, h]);
      if (o.bottom > 0.01) pieces.push([s, e, 0, o.bottom]);
      if (o.top < h - 0.01) pieces.push([s, e, o.top, h]);
      cur = e;
    }
    if (cur < len - 0.01) pieces.push([cur, len, 0, h]);
    const leanDeg = spec.lean ?? 0;
    // lean perpendicular to the wall: walls along X lean in z and vice versa
    const leanAxis = axis === 'x' ? 'z' : 'x';
    for (const [s, e, b, tp] of pieces) {
      const pw = e - s, ph = tp - b;
      const mid = from + dir * (s + pw / 2);
      const px = axis === 'x' ? mid : at;
      const pz = axis === 'x' ? at : mid;
      const w = axis === 'x' ? pw : t, d = axis === 'x' ? t : pw;
      this.box(w, ph, d, mat, px, y + b, pz, {
        radius: Math.min(0.04, t * 0.2),
        lean: leanDeg ? [leanDeg, leanAxis, -b] : undefined,
        wobble: spec.wobble ?? 0.003,
        collide: spec.collide,
        cast: spec.cast,
        midStep: 1.0,
      });
    }
    return ops.map((o) => {
      const mid = from + dir * o.at;
      const shear = Math.tan(leanDeg * DEG * CONFIG.world.warpIntensity) * ((o.bottom + o.top) / 2);
      const cy = y + (o.bottom + o.top) / 2;
      const ch = leanDeg ? { x: 0, z: 0 } : this.shearAt(cy);
      return {
        x: (axis === 'x' ? mid : at + (leanAxis === 'x' ? shear : 0)) + ch.x,
        z: (axis === 'x' ? at + (leanAxis === 'z' ? shear : 0) : mid) + ch.z,
        y: cy,
        w: o.w, h: o.top - o.bottom, bottom: y + o.bottom, axis, t,
        lean: leanDeg || (this.shear && this.shear.axis === leanAxis ? this.shear.deg : 0),
        spec: o,
      };
    });
  }

  floor(x0, x1, z0, z1, y, t, mat, opts = {}) {
    const w = Math.abs(x1 - x0), d = Math.abs(z1 - z0);
    return this.box(w, t, d, mat, (x0 + x1) / 2, y - t, (z0 + z1) / 2, { radius: 0.02, wobble: 0, midStep: 2, ...opts });
  }

  // Floor slab with rectangular holes [x0,x1,z0,z1]: split into strips.
  floorWithHoles(x0, x1, z0, z1, y, t, mat, holes = [], opts = {}) {
    const xs = new Set([x0, x1]);
    for (const h of holes) { xs.add(Math.max(x0, Math.min(x1, h[0]))); xs.add(Math.max(x0, Math.min(x1, h[1]))); }
    const xl = [...xs].sort((a, b) => a - b);
    for (let i = 0; i < xl.length - 1; i++) {
      const a = xl[i], bb = xl[i + 1];
      if (bb - a < 0.01) continue;
      const mid = (a + bb) / 2;
      const cut = holes.filter((h) => h[0] < mid && h[1] > mid).map((h) => [h[2], h[3]]).sort((p, q) => p[0] - q[0]);
      let cz = z0;
      const spans = [];
      for (const [h0, h1] of cut) {
        if (h0 > cz + 0.01) spans.push([cz, Math.min(h0, z1)]);
        cz = Math.max(cz, h1);
      }
      if (cz < z1 - 0.01) spans.push([cz, z1]);
      for (const [s0, s1] of spans) this.floor(a, bb, s0, s1, y, t, mat, opts);
    }
  }

  /**
   * Straight stairs. Starts at (x, z) at height y0, climbs `steps` risers along dir
   * ('+x','-x','+z','-z'), each rise r and run u, width w. Solid stringer blocks under each step.
   */
  stairs(x, z, y0, dir, steps, r, u, w, mat, opts = {}) {
    const ax = dir[1], sgn = dir[0] === '-' ? -1 : 1;
    for (let i = 0; i < steps; i++) {
      const top = y0 + (i + 1) * r;
      const along = (i + 0.5) * u * sgn;
      const px = ax === 'x' ? x + along : x;
      const pz = ax === 'z' ? z + along : z;
      const base = opts.solid === false ? top - 0.12 : y0;
      this.box(ax === 'x' ? u + 0.02 : w, top - base, ax === 'z' ? u + 0.02 : w, mat, px, base, pz, { radius: 0.03, wobble: 0.002, cast: true });
      // chunky nosing
      const nx = ax === 'x' ? px + sgn * (u / 2 - 0.02) : px;
      const nz = ax === 'z' ? pz + sgn * (u / 2 - 0.02) : pz;
      if (opts.nosing) this.box(ax === 'x' ? 0.06 : w + 0.04, 0.06, ax === 'z' ? 0.06 : w + 0.04, opts.nosing, nx, top - 0.05, nz, { collide: false, radius: 0.02 });
    }
    const end = steps * u * sgn;
    return { x: ax === 'x' ? x + end : x, z: ax === 'z' ? z + end : z, y: y0 + steps * r };
  }

  /**
   * Chunky window: fat frame, sill, glare glass. Glass is a separate mesh
   * (breakable later). Returns { group, glass }.
   * o = {x, y (center), z, w, h, axis ('x' wall runs along x => window faces z), t (wall thickness),
   *      frameMat, curtain, shutters, shutterMat, crookedShutter, facing (+1/-1), box: flower box mat}
   */
  window(o) {
    const g = new Group();
    const fw = 0.12, fd = (o.t ?? 0.25) + 0.1;
    const frameMat = o.frameMat ?? makeMat('NH_TRIM');
    const W = o.w, H = o.h;
    const parts = [
      [W + fw * 2, fw, fd, 0, H / 2 + fw / 2],
      [W + fw * 2, fw, fd, 0, -H / 2 - fw / 2],
      [fw, H, fd, -W / 2 - fw / 2, 0],
      [fw, H, fd, W / 2 + fw / 2, 0],
      [fw * 0.6, H, fd * 0.5, 0, 0], // mullion
    ];
    for (const [w, h, d, px, py] of parts) {
      const m = new Mesh(roundedBox(w, h, d, 0.025, 2), frameMat);
      m.position.set(px, py, 0);
      m.castShadow = true;
      g.add(m);
    }
    const sill = new Mesh(roundedBox(W + fw * 2 + 0.16, 0.08, fd + 0.12, 0.03, 2), frameMat);
    sill.position.set(0, -H / 2 - fw - 0.03, 0.06);
    sill.castShadow = true;
    g.add(sill);
    const glassMat = makeMat('WHITE', { map: Tex.glassGlare(), transparent: true, depthWrite: false, rim: 0.05, spec: 0.6, side: DoubleSide });
    const glass = new Mesh(roundedBox(W, H, 0.03, 0.01, 1), glassMat);
    glass.renderOrder = 2;
    g.add(glass);
    if (o.curtain) {
      const cm = makeMat('WHITE', { map: Tex.curtain(o.curtain) });
      const cur = new Mesh(roundedBox(W, H, 0.04, 0.01, 1), cm);
      cur.position.z = -0.08;
      g.add(cur);
    }
    if (o.shutters) {
      const sm = o.shutterMat ?? makeMat('NH_SHUTTERS');
      for (const s of [-1, 1]) {
        const sh = new Group();
        const slab = new Mesh(roundedBox(W * 0.5, H + 0.1, 0.07, 0.025, 2), sm);
        slab.castShadow = true;
        sh.add(slab);
        for (let i = 0; i < 5; i++) {
          const slat = new Mesh(roundedBox(W * 0.42, 0.04, 0.03, 0.01, 1), sm);
          slat.position.set(0, -H / 2 + 0.2 + i * (H - 0.3) / 4, 0.045);
          sh.add(slat);
        }
        sh.position.set(s * (W / 2 + fw + W * 0.25 + 0.03), 0, fd / 2 + 0.04);
        if (o.crookedShutter && s === o.crookedShutter) {
          sh.rotation.z = -s * 20 * DEG;
          sh.position.y -= 0.12;
        }
        g.add(sh);
      }
    }
    if (o.flowerBox) {
      const fb = new Mesh(roundedBox(W + 0.2, 0.22, 0.26, 0.04, 2), o.flowerBox);
      fb.position.set(0, -H / 2 - fw - 0.2, fd / 2 + 0.13);
      fb.castShadow = true;
      g.add(fb);
      const dead = o.deadFlowers;
      const n = Math.round(W / 0.14);
      for (let i = 0; i < n; i++) {
        const col = dead ? 'DIRT' : i % 2 ? 'RED_TOY' : 'YELLOW_TOY';
        const fl = new Mesh(roundedBox(0.11, 0.11, 0.11, 0.05, 2), makeMat(col));
        fl.position.set(-W / 2 + 0.07 + i * (W / n), -H / 2 - fw - 0.04 + (dead ? -0.04 : 0), fd / 2 + 0.13);
        fl.rotation.z = dead ? 0.6 : 0;
        g.add(fl);
        const leaf = new Mesh(roundedBox(0.06, 0.12, 0.06, 0.02, 1), makeMat(dead ? 'NH_PLANKS_OLD' : 'GRASS_DARK'));
        leaf.position.copy(fl.position).add(new Vector3(0.03, -0.08, 0));
        g.add(leaf);
      }
    }
    g.position.set(o.x, o.y, o.z);
    g.rotation.y = o.axis === 'z' ? Math.PI / 2 * (o.facing ?? 1) : (o.facing ?? 1) < 0 ? Math.PI : 0;
    if (o.axis === 'z') g.rotation.y = (o.facing ?? 1) > 0 ? Math.PI / 2 : -Math.PI / 2;
    if (o.lean) g.rotation[o.axis === 'x' ? 'x' : 'z'] = o.lean * DEG * (o.axis === 'x' ? 1 : -1);
    this.root.add(g);
    return { group: g, glass };
  }

  /**
   * Gable roof over a rectangle. ridge runs along 'axis'.
   * o = {x, z, w (along x), d (along z), y (eave height), pitch (deg), overhang, t, mat, gableMat, axis, sag}
   */
  gableRoof(o) {
    const axis = o.axis ?? 'x';
    const span = axis === 'x' ? o.d : o.w; // across the ridge
    const len = (axis === 'x' ? o.w : o.d) + (o.overhang ?? 0.5) * 2;
    const pitch = (o.pitch ?? 35) * DEG;
    const t = o.t ?? 0.24;
    const half = span / 2 + (o.overhang ?? 0.5);
    const slope = half / Math.cos(pitch);
    const rise = (span / 2) * Math.tan(pitch);
    for (const s of [-1, 1]) {
      if (o.slabs === false) break;
      // slab centered on its slope
      const cx = axis === 'x' ? 0 : s * (half / 2);
      const cz = axis === 'x' ? s * (half / 2) : 0;
      const cy = o.y + rise - (half / 2) * Math.tan(pitch) + t / 2;
      const w = axis === 'x' ? len : slope, d = axis === 'x' ? slope : len;
      const rot = axis === 'x' ? { rotX: s * pitch } : { rotZ: -s * pitch };
      this.box(w, t, d, o.mat, o.x + cx, cy - t / 2, o.z + cz, {
        ...rot, radius: 0.06, sag: o.sag ? [o.sag, axis] : undefined, wobble: 0.004, midStep: 1.2, worldUV: false,
        collide: o.collide,
      });
      // fat fascia board along the eave
      if (o.fasciaMat) {
        const ex = axis === 'x' ? 0 : s * half;
        const ez = axis === 'x' ? s * half : 0;
        const ey = o.y + rise - half * Math.tan(pitch) - 0.08;
        this.box(axis === 'x' ? len : 0.1, 0.3, axis === 'x' ? 0.1 : len, o.fasciaMat, o.x + ex, ey - 0.1, o.z + ez, { collide: false, radius: 0.03, sag: o.sag ? [o.sag * 0.6, axis] : undefined });
      }
    }
    // gable triangles
    if (o.gableMat) {
      const sh = new Shape();
      sh.moveTo(-span / 2, 0);
      sh.lineTo(span / 2, 0);
      sh.lineTo(0, rise);
      sh.closePath();
      for (const s of [-1, 1]) {
        const geo = new ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
        geo.translate(0, 0, -0.11);
        const L = (axis === 'x' ? o.w : o.d) / 2 - 0.11;
        _e.set(0, axis === 'x' ? Math.PI / 2 : 0, 0);
        _q.setFromEuler(_e);
        _m.compose(new Vector3(o.x + (axis === 'x' ? s * L : 0), o.y, o.z + (axis === 'x' ? 0 : s * L)), _q, new Vector3(1, 1, 1));
        geo.applyMatrix4(_m);
        geo.computeVertexNormals();
        worldUV(geo);
        this.addStatic(geo, o.gableMat);
      }
    }
    // roof uv: shingles laid along the slope
    return { rise, ridgeY: o.y + rise };
  }

  // Merge everything registered with addStatic into one mesh per material.
  finalize() {
    for (const e of this.statics.values()) {
      if (!e.geos.length) continue;
      const geo = mergeGeometries(e.geos, false);
      if (!geo) continue;
      const m = new Mesh(geo, e.mat);
      m.castShadow = e.cast;
      m.receiveShadow = e.receive;
      m.name = `${this.name}:${e.mat.name}`;
      this.root.add(m);
    }
    this.statics.clear();
    return this.root;
  }
}

export { DEG };
