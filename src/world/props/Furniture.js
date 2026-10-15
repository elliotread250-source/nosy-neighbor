// Furniture. Every piece: chunky, beveled, saturated, a little wrong.
// Each builder returns a Group with its origin on the floor at the center
// of its footprint, front facing +Z.
import {
  Group, Mesh, SphereGeometry, Shape, ExtrudeGeometry, Vector3, Box3, CatmullRomCurve3, TubeGeometry, PointLight,
  CylinderGeometry, TorusGeometry,
} from 'three';
import { makeMat } from '../../art/Materials.js';
import { roundedBox, chamferCylinder, turned, smoothNormals } from '../../art/Geo.js';
import { lean, taper, bulge, wobble, sag, bend, rng, seedFrom } from '../../art/Warp.js';
import * as Tex from '../../art/CanvasTextures.js';
import { CONFIG } from '../../config.js';
import { Palette } from '../../art/Palette.js';

const DEG = Math.PI / 180;
const WB = CONFIG.warpBudgets;

function m(geo, mat, { cast = true, receive = true } = {}) {
  const x = new Mesh(geo, mat);
  x.castShadow = cast;
  x.receiveShadow = receive;
  return x;
}

// Rounded box, base at y=0, with optional warps, smoothed.
function rb(w, h, d, r, warp = {}, name = '') {
  const g = roundedBox(w, h, d, r ?? Math.min(w, h, d) * 0.12, undefined, { bottom: true, skipNormals: true, midStep: warp.midStep ?? 0.35 });
  if (warp.taper) taper(g, warp.taper, 1);
  if (warp.bulge) bulge(g, warp.bulge);
  if (warp.sag) sag(g, warp.sag, warp.sagAxis ?? 'x');
  if (warp.lean) lean(g, warp.lean, warp.leanAxis ?? 'z');
  wobble(g, warp.wobble ?? WB.wobble, 1.3, seedFrom(name || `${w}${h}${d}`));
  return smoothNormals(g);
}

function knob(mat, r = 0.04) {
  return m(new SphereGeometry(r, 12, 10), mat ?? makeMat('BRASS', { spec: 0.6 }), { cast: false });
}

// Static collider from a placed group's world bounds (axis-aligned).
export function placeStatic(physics, obj, data = null, shrink = 0.02) {
  obj.updateWorldMatrix(true, true);
  const b = new Box3().setFromObject(obj, true);
  const c = b.getCenter(new Vector3());
  const h = b.getSize(new Vector3()).multiplyScalar(0.5).subScalar(shrink);
  return physics.addStaticBox(c, h, null, data);
}

export function wardrobe(name, color = 'WOOD_MID') {
  const r = rng(name);
  const g = new Group();
  const leanDeg = r.range(1.5, 3);
  const body = m(rb(1.2, 2.4, 0.7, 0.07, { taper: 1.12, lean: leanDeg, midStep: 0.3 }, name), makeMat(color));
  g.add(body);
  const k = Math.tan(leanDeg * DEG);
  const crown = m(rb(1.55, 0.18, 0.95, 0.05, {}, `${name}c`), makeMat('WOOD_DARK'));
  crown.position.set(0, 2.38, k * 2.4);
  g.add(crown);
  const doorMat = makeMat('WOOD_DARK');
  const doors = [];
  for (const s of [-1, 1]) {
    const pivot = new Group();
    pivot.position.set(s * 0.6, 0.12, 0.36 + k * 1.2);
    const dg = m(rb(0.56, 2.1, 0.05, 0.02, {}, `${name}d${s}`), makeMat(color));
    dg.position.set(-s * 0.29, 0, 0.02);
    const inset = m(rb(0.4, 1.6, 0.03, 0.01, {}, `${name}i${s}`), doorMat);
    inset.position.set(-s * 0.29, 0.22, 0.05);
    const kn = knob();
    kn.position.set(-s * 0.5, 1.1, 0.09);
    pivot.add(dg, inset, kn);
    pivot.rotation.x = -leanDeg * DEG;
    g.add(pivot);
    doors.push(pivot);
  }
  g.userData.doors = doors;
  g.userData.hide = { kind: 'wardrobe', offset: new Vector3(0, 0, 0) };
  return g;
}

export function bed(name, { quilt = 'CARPET_RED', frame = 'WOOD_MID', w = 1.5, l = 2.1, headH = 1.6, kid = false } = {}) {
  const g = new Group();
  const fm = makeMat(frame);
  const legH = 0.32;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = m(chamferCylinder(0.06, 0.05, legH, 10, 0.02, { bottom: true }), fm);
      leg.position.set(sx * (w / 2 - 0.08), 0, sz * (l / 2 - 0.08));
      g.add(leg);
    }
  const base = m(rb(w + 0.08, 0.16, l + 0.04, 0.05, {}, `${name}b`), fm);
  base.position.y = legH - 0.04;
  g.add(base);
  const mattress = m(rb(w, 0.24, l - 0.06, 0.09, { bulge: 0.04 }, `${name}m`), makeMat('WHITE'));
  mattress.position.y = legH + 0.1;
  g.add(mattress);
  const qg = rb(w + 0.14, 0.12, l * 0.72, 0.06, { sag: 0.04, sagAxis: 'x' }, `${name}q`);
  // drape the quilt edges down
  const pos = qg.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    if (Math.abs(x) > w / 2 - 0.05) pos.setY(i, pos.getY(i) - (Math.abs(x) - (w / 2 - 0.05)) * 2.2);
  }
  smoothNormals(qg);
  const q = m(qg, makeMat('WHITE', { map: Tex.carpet(quilt) }));
  q.position.set(0, legH + 0.32, l * 0.13);
  g.add(q);
  // scalloped headboard
  const sh = new Shape();
  const hw = w / 2 + 0.1;
  sh.moveTo(-hw, 0);
  sh.lineTo(hw, 0);
  sh.lineTo(hw, headH * 0.75);
  sh.bezierCurveTo(hw, headH * 1.0, hw * 0.4, headH * 0.88, 0, headH);
  sh.bezierCurveTo(-hw * 0.4, headH * 0.88, -hw, headH * 1.0, -hw, headH * 0.75);
  sh.closePath();
  const hg = new ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 3, curveSegments: 16 });
  hg.computeVertexNormals();
  const head = m(hg, fm);
  head.position.set(0, 0, -l / 2 - 0.05);
  g.add(head);
  if (kid) {
    // race-car bed: fat red side panels and wheels
    for (const s of [-1, 1]) {
      const panel = m(rb(0.1, 0.5, l + 0.3, 0.05, {}, `${name}p${s}`), makeMat('RED_TOY', { spec: 0.4 }));
      panel.position.set(s * (w / 2 + 0.08), 0.05, 0);
      g.add(panel);
      for (const z of [-l / 3, l / 3]) {
        const wh = m(chamferCylinder(0.22, 0.22, 0.12, 16, 0.04), makeMat('BLACK_SOFT'));
        wh.rotation.z = Math.PI / 2;
        wh.position.set(s * (w / 2 + 0.16), 0.22, z);
        g.add(wh);
      }
    }
  }
  for (const s of [-1, 1]) {
    const pg = new SphereGeometry(0.22, 16, 12);
    pg.scale(1.3, 0.45, 0.8);
    const p = m(pg, makeMat('WHITE'));
    p.position.set(s * w * 0.24, legH + 0.36, -l / 2 + 0.3);
    g.add(p);
  }
  g.userData.hide = { kind: 'underBed' };
  return g;
}

export function sofa(name, color = 'RETRO_ORANGE', seats = 3) {
  const g = new Group();
  const mat = makeMat(color, { rim: 0.25 });
  const w = seats * 0.7 + 0.4;
  const base = m(rb(w, 0.32, 0.95, 0.08, {}, `${name}b`), mat);
  base.position.y = 0.12;
  g.add(base);
  for (let i = 0; i < seats; i++) {
    const x = -((seats - 1) * 0.7) / 2 + i * 0.7;
    const seat = m(rb(0.68, 0.22, 0.75, 0.1, { bulge: 0.12, midStep: 0.15 }, `${name}s${i}`), mat);
    seat.position.set(x, 0.42, 0.08);
    const back = m(rb(0.68, 0.62, 0.24, 0.1, { bulge: 0.12, midStep: 0.15 }, `${name}k${i}`), mat);
    back.position.set(x, 0.42, -0.36);
    back.rotation.x = -10 * DEG;
    g.add(seat, back);
  }
  for (const s of [-1, 1]) {
    const arm = m(chamferCylinder(0.2, 0.2, 0.95, 16, 0.06), mat);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(s * (w / 2 - 0.08), 0.56, 0);
    g.add(arm);
    const armBase = m(rb(0.34, 0.5, 0.95, 0.06, {}, `${name}a${s}`), mat);
    armBase.position.set(s * (w / 2 - 0.08), 0.1, 0);
    g.add(armBase);
  }
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = m(chamferCylinder(0.035, 0.055, 0.14, 8, 0.015, { bottom: true }), makeMat('WOOD_DARK'));
      leg.position.set(sx * (w / 2 - 0.15), 0, sz * 0.35);
      g.add(leg);
    }
  g.userData.hide = { kind: 'behind' };
  return g;
}

export function armchair(name, color = 'SOFA_GREEN', doily = true) {
  const g = sofa(name, color, 1);
  if (doily) {
    const d = m(chamferCylinder(0.2, 0.2, 0.02, 16, 0.008), makeMat('WHITE'));
    d.rotation.x = Math.PI / 2 - 10 * DEG;
    d.position.set(0, 0.95, -0.47);
    g.add(d);
  }
  return g;
}

export function table(name, { w = 1.6, d = 0.9, h = 0.78, color = 'WOOD_MID', legColor = 'WOOD_DARK', turnedLegs = true } = {}) {
  const g = new Group();
  const top = m(rb(w, 0.08, d, 0.03, { wobble: 0.004 }, `${name}t`), makeMat(color));
  top.position.y = h - 0.08;
  g.add(top);
  const prof = [[0, 0], [0.055, 0], [0.065, 0.03], [0.045, 0.1], [0.03, 0.25], [0.07, 0.4], [0.035, 0.52], [0.04, 0.62], [0.055, 0.68], [0.055, 1], [0, 1]];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const geo = turnedLegs
        ? turned(prof.map(([r, y]) => [r, y * (h - 0.08)]), 12)
        : chamferCylinder(0.05, 0.035, h - 0.08, 10, 0.015, { bottom: true });
      const leg = m(geo, makeMat(legColor));
      leg.position.set(sx * (w / 2 - 0.1), 0, sz * (d / 2 - 0.1));
      g.add(leg);
    }
  return g;
}

export function chair(name, color = 'WOOD_LIGHT', cushion = 'CARPET_RED') {
  const r = rng(name);
  const g = new Group();
  const wood = makeMat(color);
  const seatY = 0.5;
  const seat = m(rb(0.48, 0.07, 0.46, 0.025, {}, `${name}s`), wood);
  seat.position.y = seatY - 0.07;
  g.add(seat);
  const cu = m(rb(0.42, 0.07, 0.4, 0.03, { bulge: 0.1 }, `${name}c`), makeMat(cushion));
  cu.position.y = seatY;
  g.add(cu);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = m(chamferCylinder(0.035, 0.028, seatY - 0.07, 8, 0.012, { bottom: true }), wood);
      leg.position.set(sx * 0.19, 0, sz * 0.18);
      leg.rotation.z = sx * 2 * DEG;
      g.add(leg);
    }
  // tall spindle back (1.2 m)
  const backH = 1.2 - seatY;
  for (const sx of [-1, 1]) {
    const post = m(chamferCylinder(0.035, 0.035, backH + 0.05, 8, 0.012, { bottom: true }), wood);
    post.position.set(sx * 0.2, seatY - 0.05, -0.2);
    g.add(post);
  }
  for (let i = 0; i < 4; i++) {
    const sp = m(chamferCylinder(0.02, 0.02, backH - 0.12, 8, 0.008, { bottom: true }), wood);
    sp.position.set(-0.12 + i * 0.08, seatY, -0.2);
    g.add(sp);
  }
  const crest = m(rb(0.5, 0.1, 0.06, 0.03, { sag: -0.02 }, `${name}cr`), wood);
  crest.position.set(0, seatY + backH - 0.08, -0.2);
  g.add(crest);
  g.rotation.y = r.range(-4, 4) * DEG;
  return g;
}

export function bookshelf(name, { w = 1.3, h = 2.4, d = 0.4, color = 'WOOD_LIGHT', leanDeg = 5, rows = 4 } = {}) {
  const r = rng(name);
  const g = new Group();
  const k = Math.tan(leanDeg * DEG);
  const shell = m(rb(w, h, d, 0.04, { lean: leanDeg, midStep: 0.4 }, name), makeMat(color));
  g.add(shell);
  const back = m(rb(w - 0.1, h - 0.1, 0.04, 0.01, { lean: leanDeg }, `${name}bk`), makeMat('WOOD_DARK'));
  back.position.set(0, 0.05, -d / 2 + 0.05);
  g.add(back);
  const colors = ['RED_TOY', 'BLUE_TOY', 'YELLOW_TOY', 'KEY_GREEN', 'TANGERINE', 'GRAPE', 'BUBBLEGUM', 'SKY_TOY'];
  const books = new Map();
  for (let row = 0; row < rows; row++) {
    const y = 0.12 + row * ((h - 0.2) / rows);
    let x = -w / 2 + 0.08;
    while (x < w / 2 - 0.12) {
      const bw = r.range(0.06, 0.12), bh = r.range(0.24, Math.min(0.42, (h - 0.2) / rows - 0.05));
      const geo = roundedBox(bw, bh, d * 0.7, 0.012, 2, { bottom: true });
      const book = m(geo, makeMat(r.pick(colors)), { cast: false });
      book.position.set(x + bw / 2, y, k * y + 0.02);
      if (r.next() < 0.12) book.rotation.z = r.range(-14, 14) * DEG;
      g.add(book);
      x += bw + 0.008;
    }
    if (row > 0) {
      const plank = m(rb(w - 0.06, 0.05, d - 0.04, 0.015, { sag: 0.015 }, `${name}pl${row}`), makeMat(color), { cast: false });
      plank.position.set(0, y - 0.05, k * y);
      g.add(plank);
    }
  }
  return g;
}

export function lamp(name, { kind = 'floor', h = 2.4, shade = 'LAMPSHADE', base = 'METAL_DARK', light = true } = {}) {
  const g = new Group();
  const glow = makeMat(shade, { emissive: 'LAMPSHADE_GLOW', emissiveIntensity: 0.5, rim: 0.2 });
  if (kind === 'floor') {
    const stem = chamferCylinder(0.04, 0.055, h - 0.35, 10, 0.015, { bottom: true });
    bend(stem, 14, 'x');
    smoothNormals(stem);
    g.add(m(stem, makeMat(base, { spec: 0.4 })));
    g.add(m(chamferCylinder(0.26, 0.3, 0.07, 18, 0.025, { bottom: true }), makeMat(base)));
    const s = m(chamferCylinder(0.34, 0.42, 0.44, 22, 0.03), glow);
    s.position.set(Math.sin(14 * DEG) * (h - 0.35) * 0.5, h - 0.2, 0);
    g.add(s);
    g.userData.lightPos = new Vector3(s.position.x, h - 0.3, 0);
  } else {
    // table lamp: bulbous ceramic base
    const prof = [[0, 0], [0.09, 0], [0.13, 0.05], [0.16, 0.14], [0.12, 0.25], [0.05, 0.3], [0.03, 0.42], [0, 0.42]];
    g.add(m(turned(prof, 16), makeMat(base, { spec: 0.5 })));
    const s = m(chamferCylinder(0.16, 0.22, 0.24, 18, 0.02), glow);
    s.position.y = 0.5;
    g.add(s);
    g.userData.lightPos = new Vector3(0, 0.45, 0);
  }
  if (light) {
    const pl = new PointLight(Palette.LAMP_LIGHT, 0, 5.5, 1.4);
    pl.position.copy(g.userData.lightPos);
    pl.userData.baseIntensity = CONFIG.lighting.lampIntensity;
    g.add(pl);
    g.userData.light = pl;
  }
  return g;
}

export function tv(name, { on = true } = {}) {
  const g = new Group();
  const body = m(rb(0.8, 0.62, 0.55, 0.07, { bulge: 0.04 }, name), makeMat('TV_BODY'));
  body.position.y = 0.26;
  g.add(body);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = m(chamferCylinder(0.03, 0.02, 0.26, 8, 0.01, { bottom: true }), makeMat('WOOD_DARK'));
      leg.position.set(sx * 0.3, 0, sz * 0.2);
      leg.rotation.z = sx * 8 * DEG;
      g.add(leg);
    }
  const screenG = roundedBox(0.56, 0.42, 0.06, 0.06, 3, { midStep: 0.1 });
  bulge(screenG, 0.0);
  const sp = screenG.attributes.position;
  for (let i = 0; i < sp.count; i++) if (sp.getZ(i) > 0) sp.setZ(i, sp.getZ(i) + 0.04 * (1 - (sp.getX(i) / 0.28) ** 2) * (1 - (sp.getY(i) / 0.21) ** 2));
  smoothNormals(screenG);
  const screenMat = makeMat(on ? 'TV_SCREEN_ON' : 'TV_SCREEN_OFF', { emissive: on ? 'TV_SCREEN_ON' : undefined, emissiveIntensity: 0.6, spec: 0.6, unique: true });
  const screen = m(screenG, screenMat, { cast: false });
  screen.position.set(-0.06, 0.57, 0.27);
  g.add(screen);
  for (let i = 0; i < 2; i++) {
    const k = m(chamferCylinder(0.035, 0.035, 0.04, 10, 0.01), makeMat('BRASS', { spec: 0.5 }));
    k.rotation.x = Math.PI / 2;
    k.position.set(0.3, 0.68 - i * 0.14, 0.28);
    g.add(k);
  }
  for (const s of [-1, 1]) {
    const ant = m(chamferCylinder(0.01, 0.012, 0.55, 6, 0.004, { bottom: true }), makeMat('METAL'));
    ant.position.set(s * 0.06, 0.88, -0.05);
    ant.rotation.z = -s * 30 * DEG;
    g.add(ant);
  }
  g.userData.screen = screen;
  return g;
}

export function fridge(name, color = 'RETRO_MINT') {
  const g = new Group();
  const body = m(rb(0.95, 1.95, 0.8, 0.14, { bulge: 0.08, lean: -1.5, leanAxis: 'x', midStep: 0.25 }, name), makeMat(color, { spec: 0.45 }));
  g.add(body);
  const line = m(rb(0.9, 0.03, 0.04, 0.01, {}, `${name}l`), makeMat('FRIDGE_HANDLE'), { cast: false });
  line.position.set(0, 1.25, 0.43);
  g.add(line);
  for (const [y, hh] of [[1.4, 0.4], [0.6, 0.5]]) {
    const h = m(rb(0.07, hh, 0.08, 0.03, {}, `${name}h${y}`), makeMat('FRIDGE_HANDLE', { spec: 0.7 }));
    h.position.set(0.32, y, 0.47);
    g.add(h);
  }
  return g;
}

export function counter(name, { w = 2, color = 'WOOD_LIGHT', top = 'FRIDGE', sink = false } = {}) {
  const g = new Group();
  const body = m(rb(w, 0.86, 0.6, 0.04, { taper: 1.06 }, name), makeMat(color));
  g.add(body);
  const t = m(rb(w + 0.08, 0.07, 0.68, 0.025, {}, `${name}t`), makeMat(top));
  t.position.y = 0.86;
  g.add(t);
  const n = Math.max(1, Math.round(w / 0.6));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * (w / n);
    const door = m(rb(w / n - 0.08, 0.6, 0.04, 0.015, {}, `${name}d${i}`), makeMat('WOOD_MID'));
    door.position.set(x, 0.12, 0.31);
    g.add(door);
    const k = knob(null, 0.03);
    k.position.set(x + 0.1, 0.6, 0.35);
    g.add(k);
  }
  if (sink) {
    const s = m(rb(0.6, 0.06, 0.42, 0.04, {}, `${name}sink`), makeMat('METAL', { spec: 0.6 }));
    s.position.set(0, 0.9, 0);
    g.add(s);
    const tap = m(new TorusGeometry(0.1, 0.025, 8, 16, Math.PI), makeMat('METAL', { spec: 0.6 }));
    tap.position.set(0, 0.98, -0.2);
    g.add(tap);
  }
  return g;
}

export function rug(name, { w = 2.6, d = 1.8, color = 'CARPET_RED', pattern = 'border' } = {}) {
  const geo = roundedBox(w, 0.025, d, 0.012, 2, { bottom: true });
  const uv = geo.attributes.uv;
  const pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, -pos.getZ(i) / d + 0.5);
  return m(geo, makeMat('WHITE', { map: Tex.carpet(color, pattern) }), { cast: false });
}

export function nightstand(name, color = 'WOOD_MID') {
  const g = new Group();
  const body = m(rb(0.5, 0.55, 0.42, 0.04, { taper: 1.08, lean: 2 }, name), makeMat(color));
  g.add(body);
  const drawer = m(rb(0.42, 0.16, 0.04, 0.015, {}, `${name}d`), makeMat('WOOD_DARK'));
  drawer.position.set(0, 0.32, 0.22);
  g.add(drawer);
  const k = knob(null, 0.03);
  k.position.set(0, 0.4, 0.26);
  g.add(k);
  return g;
}

export function dresser(name, color = 'WOOD_LIGHT') {
  const g = new Group();
  const body = m(rb(1.2, 0.95, 0.5, 0.05, { taper: 1.1, bulge: 0.04 }, name), makeMat(color));
  g.add(body);
  for (let i = 0; i < 3; i++) {
    const dr = m(rb(1.06, 0.24, 0.04, 0.02, {}, `${name}d${i}`), makeMat('WOOD_MID'));
    dr.position.set(0, 0.08 + i * 0.29, 0.26);
    g.add(dr);
    for (const s of [-1, 1]) {
      const k = knob(null, 0.035);
      k.position.set(s * 0.3, 0.2 + i * 0.29, 0.3);
      g.add(k);
    }
  }
  return g;
}

export function radio(name) {
  const g = new Group();
  const body = m(rb(0.42, 0.26, 0.18, 0.06, { bulge: 0.05 }, name), makeMat('TOMATO', { spec: 0.4 }));
  g.add(body);
  const grill = m(rb(0.2, 0.16, 0.02, 0.02, {}, `${name}g`), makeMat('WAINSCOT'));
  grill.position.set(-0.08, 0.05, 0.09);
  g.add(grill);
  const dial = m(chamferCylinder(0.04, 0.04, 0.03, 12, 0.01), makeMat('BRASS', { spec: 0.6 }));
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0.12, 0.13, 0.1);
  g.add(dial);
  const handle = m(new TorusGeometry(0.12, 0.018, 6, 16, Math.PI), makeMat('METAL_DARK'));
  handle.position.y = 0.26;
  g.add(handle);
  return g;
}

export function cardboardBox(name, s = 0.6) {
  const g = new Group();
  const body = m(roundedBox(s, s * 0.8, s, 0.03, 2), makeMat('CARDBOARD'));
  const tape = m(roundedBox(s * 0.18, s * 0.82, s * 1.01, 0.01, 1), makeMat('CARDBOARD_TAPE'), { cast: false });
  g.add(body, tape);
  return g;
}

export function crate(name, s = 1) {
  return m(roundedBox(s, s, s, 0.06, 3), makeMat('WOOD_LIGHT', { map: Tex.woodPlanks('WOOD_LIGHT', 4) }));
}

export function stove(name) {
  const g = new Group();
  const body = m(rb(0.8, 0.9, 0.65, 0.07, { bulge: 0.03 }, name), makeMat('RETRO_MINT', { spec: 0.4 }));
  g.add(body);
  const top = m(rb(0.84, 0.05, 0.69, 0.02, {}, `${name}t`), makeMat('METAL_DARK'));
  top.position.y = 0.9;
  g.add(top);
  for (const [x, z] of [[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]]) {
    const b = m(new TorusGeometry(0.09, 0.02, 6, 16), makeMat('BLACK_SOFT'));
    b.rotation.x = Math.PI / 2;
    b.position.set(x, 0.96, z);
    g.add(b);
  }
  const door = m(rb(0.62, 0.45, 0.04, 0.03, {}, `${name}d`), makeMat('RETRO_MINT', { spec: 0.4 }));
  door.position.set(0, 0.12, 0.33);
  g.add(door);
  const win = m(rb(0.36, 0.2, 0.02, 0.02, {}, `${name}w`), makeMat('TV_SCREEN_OFF', { spec: 0.6 }));
  win.position.set(0, 0.28, 0.36);
  g.add(win);
  const h = m(chamferCylinder(0.025, 0.025, 0.5, 8, 0.01), makeMat('METAL', { spec: 0.6 }));
  h.rotation.z = Math.PI / 2;
  h.position.set(0, 0.62, 0.38);
  g.add(h);
  return g;
}

export function kettle(name) {
  const g = new Group();
  const prof = [[0, 0], [0.11, 0], [0.14, 0.05], [0.14, 0.12], [0.1, 0.19], [0.04, 0.22], [0.03, 0.24], [0, 0.24]];
  g.add(m(turned(prof, 16), makeMat('TOMATO', { spec: 0.6 })));
  const spout = m(chamferCylinder(0.02, 0.035, 0.14, 8, 0.008), makeMat('TOMATO', { spec: 0.6 }));
  spout.position.set(0.15, 0.13, 0);
  spout.rotation.z = -50 * DEG;
  g.add(spout);
  const handle = m(new TorusGeometry(0.08, 0.016, 6, 14, Math.PI), makeMat('BLACK_SOFT'));
  handle.position.y = 0.22;
  g.add(handle);
  return g;
}

export function washingMachine(name) {
  const g = new Group();
  const body = m(rb(0.75, 0.95, 0.7, 0.1, { bulge: 0.08, midStep: 0.2 }, name), makeMat('WHITE', { spec: 0.4 }));
  g.add(body);
  const ring = m(new TorusGeometry(0.22, 0.05, 10, 24), makeMat('METAL', { spec: 0.6 }));
  ring.position.set(0, 0.45, 0.38);
  g.add(ring);
  const door = m(new SphereGeometry(0.2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 3), makeMat('TV_SCREEN_ON', { spec: 0.6 }));
  door.rotation.x = Math.PI / 2;
  door.position.set(0, 0.45, 0.32);
  g.add(door);
  const dial = m(chamferCylinder(0.07, 0.07, 0.05, 14, 0.015), makeMat('TOMATO', { spec: 0.5 }));
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0.22, 0.83, 0.37);
  g.add(dial);
  g.userData.dial = dial;
  return g;
}

export function grandfatherClock(name) {
  const g = new Group();
  const body = m(rb(0.62, 2.9, 0.42, 0.06, { taper: 0.92, lean: 1.5, leanAxis: 'x', midStep: 0.4 }, name), makeMat('WOOD_DARK'));
  g.add(body);
  const face = m(chamferCylinder(0.24, 0.24, 0.04, 24, 0.012), makeMat('FRIDGE'));
  face.rotation.x = Math.PI / 2;
  face.position.set(0.03, 2.4, 0.22);
  g.add(face);
  // a sad little cartoon face
  for (const s of [-1, 1]) {
    const e = m(new SphereGeometry(0.025, 8, 6), makeMat('BLACK_SOFT'), { cast: false });
    e.position.set(0.03 + s * 0.08, 2.45, 0.245);
    g.add(e);
  }
  const mouth = m(new TorusGeometry(0.06, 0.012, 6, 12, Math.PI), makeMat('BLACK_SOFT'), { cast: false });
  mouth.position.set(0.03, 2.3, 0.245);
  g.add(mouth);
  const win = m(rb(0.34, 1.0, 0.03, 0.02, {}, `${name}w`), makeMat('TV_SCREEN_OFF', { spec: 0.5 }));
  win.position.set(0.02, 0.9, 0.21);
  g.add(win);
  const pend = new Group();
  const rod = m(chamferCylinder(0.012, 0.012, 0.8, 6, 0.004), makeMat('BRASS'));
  rod.position.y = -0.4;
  const bob = m(chamferCylinder(0.09, 0.09, 0.03, 16, 0.01), makeMat('BRASS', { spec: 0.7 }));
  bob.rotation.x = Math.PI / 2;
  bob.position.y = -0.82;
  pend.add(rod, bob);
  pend.position.set(0.02, 1.85, 0.25);
  g.add(pend);
  g.userData.update = (dt, t) => { pend.rotation.z = Math.sin(t * Math.PI) * 0.22; };
  return g;
}

export function coatStand(name) {
  const g = new Group();
  const pole = chamferCylinder(0.03, 0.045, 1.9, 10, 0.012, { bottom: true });
  lean(pole, 6, 'x');
  smoothNormals(pole);
  g.add(m(pole, makeMat('WOOD_DARK')));
  for (let i = 0; i < 3; i++) {
    const foot = m(rb(0.5, 0.05, 0.06, 0.02, {}, `${name}f${i}`), makeMat('WOOD_DARK'));
    foot.rotation.y = (i / 3) * Math.PI;
    g.add(foot);
  }
  const hat = m(chamferCylinder(0.12, 0.13, 0.12, 14, 0.03), makeMat('NB_BELT'));
  hat.position.set(Math.tan(6 * DEG) * 1.9, 1.95, 0);
  g.add(hat);
  const brim = m(chamferCylinder(0.2, 0.2, 0.02, 16, 0.008), makeMat('NB_BELT'));
  brim.position.copy(hat.position).add(new Vector3(0, -0.06, 0));
  g.add(brim);
  const coat = m(rb(0.45, 0.9, 0.22, 0.1, { taper: 0.7, bulge: 0.1 }, `${name}coat`), makeMat('NB_PANTS'));
  coat.position.set(Math.tan(6 * DEG) * 1.0, 0.85, 0.12);
  g.add(coat);
  return g;
}

export function toyChest(name) {
  const g = new Group();
  const body = m(rb(1.0, 0.55, 0.55, 0.06, { taper: 1.05 }, name), makeMat('BLUE_TOY'));
  g.add(body);
  const lid = m(rb(1.06, 0.12, 0.6, 0.05, { sag: -0.03 }, `${name}l`), makeMat('YELLOW_TOY'));
  lid.position.y = 0.55;
  g.add(lid);
  for (const s of [-1, 1]) {
    const star = m(new SphereGeometry(0.08, 10, 8), makeMat('RED_TOY'));
    star.position.set(s * 0.28, 0.3, 0.28);
    star.scale.z = 0.4;
    g.add(star);
  }
  return g;
}

export function shelf(name, w = 1.2, color = 'WOOD_LIGHT') {
  const g = new Group();
  const p = m(rb(w, 0.06, 0.32, 0.02, { sag: 0.02 }, name), makeMat(color));
  g.add(p);
  for (const s of [-1, 1]) {
    const br = m(rb(0.05, 0.22, 0.22, 0.015, {}, `${name}b${s}`), makeMat('WOOD_DARK'));
    br.position.set(s * (w / 2 - 0.12), -0.22, -0.04);
    g.add(br);
  }
  return g;
}

export function frame(name, { w = 0.5, h = 0.4, color = 'WOOD_DARK', pic = 'SKY_TOY' } = {}) {
  const g = new Group();
  const f = m(rb(w, h, 0.06, 0.02, {}, name), makeMat(color), { cast: false });
  const p = m(rb(w - 0.12, h - 0.12, 0.02, 0.01, {}, `${name}p`), makeMat(pic), { cast: false });
  p.position.set(0, 0.06, 0.03);
  g.add(f, p);
  return g;
}

export { CatmullRomCurve3, TubeGeometry, CylinderGeometry };
