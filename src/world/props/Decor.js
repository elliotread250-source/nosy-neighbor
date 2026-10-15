// Static decor for the neighbor's rooms. Origins on the floor (or on the wall
// for wall-hung pieces), front facing +Z.
import {
  Group, Mesh, SphereGeometry, TorusGeometry, CylinderGeometry, ConeGeometry, PointLight, Vector3, DoubleSide,
  CapsuleGeometry, IcosahedronGeometry,
} from 'three';
import { makeMat } from '../../art/Materials.js';
import { Palette } from '../../art/Palette.js';
import { roundedBox, chamferCylinder, turned, smoothNormals } from '../../art/Geo.js';
import { bulge, lean, taper, sag, rng, seedFrom, wobble } from '../../art/Warp.js';
import * as Tex from '../../art/CanvasTextures.js';
import { CONFIG } from '../../config.js';

const DEG = Math.PI / 180;

function m(geo, mat, cast = true) {
  const x = new Mesh(geo, mat);
  x.castShadow = cast;
  x.receiveShadow = true;
  return x;
}
function rb(w, h, d, r, opts = {}) {
  const g = roundedBox(w, h, d, r ?? Math.min(w, h, d) * 0.15, undefined, { bottom: true, midStep: 0.6, ...opts });
  return g;
}
function lightMarker(g, pos, intensity = CONFIG.lighting.lampIntensity, color = Palette.LAMP_LIGHT, distance = 5) {
  const pl = new PointLight(color, 0, distance, 1.4);
  pl.position.copy(pos);
  pl.userData.baseIntensity = intensity;
  g.add(pl);
  return pl;
}

export function bathtub(name, { clawfoot = false, curtain = true, color = 'FRIDGE' } = {}) {
  const g = new Group();
  const outer = rb(1.7, 0.6, 0.8, 0.22, { midStep: 0.2 });
  bulge(outer, 0.05);
  smoothNormals(outer);
  const tub = m(outer, makeMat(color, { spec: 0.5 }));
  tub.position.y = clawfoot ? 0.18 : 0;
  g.add(tub);
  const inner = m(rb(1.45, 0.06, 0.58, 0.2), makeMat('SKY_TOY', { spec: 0.6 }), false);
  inner.position.y = (clawfoot ? 0.18 : 0) + 0.56;
  g.add(inner);
  if (clawfoot) {
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const foot = m(new SphereGeometry(0.08, 10, 8), makeMat('BRASS', { spec: 0.6 }));
        foot.position.set(sx * 0.62, 0.08, sz * 0.26);
        foot.scale.y = 1.4;
        g.add(foot);
      }
  }
  const tap = m(new TorusGeometry(0.08, 0.02, 6, 12, Math.PI), makeMat('METAL', { spec: 0.6 }));
  tap.position.set(-0.75, (clawfoot ? 0.18 : 0) + 0.68, 0);
  tap.rotation.y = Math.PI / 2;
  g.add(tap);
  if (curtain) {
    const rod = m(chamferCylinder(0.02, 0.02, 1.8, 6, 0.008), makeMat('METAL'));
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, 2.1, 0.42);
    g.add(rod);
    const cur = new Group();
    const tex = duckCurtain();
    for (let i = 0; i < 6; i++) {
      const p = m(roundedBox(0.3, 1.55, 0.03, 0.01, 1), makeMat('WHITE', { map: tex, side: DoubleSide }), false);
      p.position.set(-0.72 + i * 0.29, 1.3, 0.42 + (i % 2) * 0.05);
      p.rotation.y = (i % 2 ? 0.25 : -0.25);
      cur.add(p);
    }
    cur.userData.noBake = true;
    g.add(cur);
    g.userData.curtain = cur;
  }
  g.userData.hide = { kind: 'tub' };
  return g;
}

function duckCurtain() {
  const t = Tex.wallpaper('dots', 'WHITE', 'YELLOW_TOY');
  return t;
}

export function toilet(name) {
  const g = new Group();
  const prof = [[0, 0], [0.16, 0], [0.12, 0.1], [0.12, 0.3], [0.2, 0.38], [0.21, 0.42], [0, 0.42]];
  const bowl = m(turned(prof, 18), makeMat('FRIDGE', { spec: 0.5 }));
  bowl.scale.z = 1.25;
  g.add(bowl);
  const seat = m(new TorusGeometry(0.17, 0.035, 8, 20), makeMat('BUBBLEGUM', { spec: 0.4 }));
  seat.rotation.x = Math.PI / 2;
  seat.position.y = 0.44;
  seat.scale.y = 1.25;
  g.add(seat);
  const tank = m(rb(0.42, 0.42, 0.18, 0.06), makeMat('FRIDGE', { spec: 0.5 }));
  tank.position.set(0, 0.42, -0.25);
  g.add(tank);
  return g;
}

export function pedestalSink(name) {
  const g = new Group();
  const prof = [[0, 0], [0.12, 0], [0.08, 0.1], [0.07, 0.7], [0.1, 0.72], [0.28, 0.78], [0.3, 0.86], [0, 0.86]];
  g.add(m(turned(prof, 18), makeMat('FRIDGE', { spec: 0.5 })));
  const tap = m(new TorusGeometry(0.06, 0.016, 6, 12, Math.PI), makeMat('METAL', { spec: 0.6 }));
  tap.position.set(0, 0.88, -0.18);
  g.add(tap);
  return g;
}

export function medicineCabinet(name, overflowing = false) {
  const g = new Group();
  const box = m(rb(0.55, 0.65, 0.16, 0.04), makeMat('FRIDGE'));
  g.add(box);
  const mirror = m(rb(0.45, 0.55, 0.02, 0.02), makeMat('SKY_TOY', { spec: 0.9, rim: 0.4 }), false);
  mirror.position.set(0, 0.05, 0.08);
  g.add(mirror);
  if (overflowing) {
    const r = rng(name);
    for (let i = 0; i < 6; i++) {
      const b = m(chamferCylinder(0.025, 0.025, r.range(0.06, 0.12), 8, 0.008, { bottom: true }), makeMat(r.pick(['TANGERINE', 'BUBBLEGUM', 'KEY_GREEN', 'SKY_TOY'])));
      b.position.set(-0.2 + i * 0.08, -0.05, 0.12);
      b.rotation.z = r.range(-0.6, 0.6);
      g.add(b);
    }
  }
  return g;
}

export function hamper(name, color = 'WOOD_LIGHT') {
  const g = new Group();
  const b = chamferCylinder(0.26, 0.22, 0.75, 16, 0.04, { bottom: true });
  bulge(b, 0.06);
  smoothNormals(b);
  g.add(m(b, makeMat(color)));
  const lid = m(chamferCylinder(0.28, 0.28, 0.06, 16, 0.02), makeMat('WOOD_MID'));
  lid.position.y = 0.78;
  g.add(lid);
  const sock = m(new CapsuleGeometry(0.03, 0.12, 4, 8), makeMat('KEY_RED'));
  sock.position.set(0.18, 0.8, 0.1);
  sock.rotation.z = 1.2;
  g.add(sock);
  g.userData.hide = { kind: 'hamper' };
  return g;
}

export function chandelier(name, n = 5) {
  const g = new Group();
  const brass = makeMat('BRASS', { spec: 0.6 });
  const chain = m(chamferCylinder(0.015, 0.015, 1.2, 6, 0.005, { bottom: true }), brass);
  g.add(chain);
  const hub = m(new SphereGeometry(0.1, 12, 10), brass);
  g.add(hub);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const arm = m(new TorusGeometry(0.22, 0.015, 6, 12, Math.PI / 2), brass);
    arm.position.set(Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22);
    arm.rotation.y = -a;
    g.add(arm);
    const cup = m(chamferCylinder(0.04, 0.03, 0.05, 8, 0.01, { bottom: true }), brass);
    cup.position.set(Math.cos(a) * 0.44, -0.02, Math.sin(a) * 0.44);
    g.add(cup);
    const bulb = m(new SphereGeometry(0.045, 10, 8), makeMat('LAMPSHADE', { emissive: 'LAMPSHADE_GLOW', emissiveIntensity: 1.2 }), false);
    bulb.scale.y = 1.4;
    bulb.position.set(Math.cos(a) * 0.44, 0.07, Math.sin(a) * 0.44);
    g.add(bulb);
  }
  lightMarker(g, new Vector3(0, -0.1, 0), CONFIG.lighting.lampIntensity * 1.2, Palette.LAMP_LIGHT, 6);
  return g; // origin at the bulbs; chain goes up 1.2 m
}

export function ceilingBulb(name, color = 'LAMPSHADE', glow = 'LAMPSHADE_GLOW', lightColor = Palette.LAMP_LIGHT) {
  const g = new Group();
  const cord = m(chamferCylinder(0.01, 0.01, 0.7, 4, 0.004, { bottom: true }), makeMat('BLACK_SOFT'), false);
  g.add(cord);
  const bulb = m(new SphereGeometry(0.06, 10, 8), makeMat(color, { emissive: glow, emissiveIntensity: 1.5 }), false);
  bulb.scale.y = 1.3;
  g.add(bulb);
  lightMarker(g, new Vector3(0, -0.15, 0), CONFIG.lighting.lampIntensity, lightColor, 5);
  return g;
}

export function fireplace(name) {
  const g = new Group();
  const brick = makeMat('WHITE', { map: Tex.brick('NH_ROOF', 'SIDEWALK') });
  const body = m(rb(1.9, 1.4, 0.55, 0.05), brick);
  g.add(body);
  const hole = m(rb(0.95, 0.85, 0.3, 0.12), makeMat('BLACK_SOFT'), false);
  hole.position.set(0, 0, 0.14);
  g.add(hole);
  const mantel = m(rb(2.2, 0.14, 0.75, 0.04), makeMat('WOOD_DARK'));
  mantel.position.y = 1.4;
  g.add(mantel);
  const chimney = m(rb(1.3, 2.2, 0.45, 0.05), brick);
  chimney.position.set(0, 1.54, -0.05);
  g.add(chimney);
  // logs and a cartoon flame
  for (let i = 0; i < 3; i++) {
    const log = m(chamferCylinder(0.07, 0.07, 0.6, 8, 0.02), makeMat('WOOD_DARK'));
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i - 1) * 0.4;
    log.position.set(0, 0.08 + (i === 1 ? 0.1 : 0), 0.15);
    g.add(log);
  }
  const flame = m(new ConeGeometry(0.16, 0.4, 10), makeMat('TANGERINE', { emissive: 'TANGERINE', emissiveIntensity: 1.3 }), false);
  flame.position.set(0, 0.42, 0.16);
  g.add(flame);
  g.userData.flame = flame;
  lightMarker(g, new Vector3(0, 0.5, 0.6), CONFIG.lighting.lampIntensity * 0.9, Palette.TANGERINE, 4.5);
  return g;
}

export function chinaCabinet(name) {
  const g = new Group();
  const body = rb(1.4, 2.1, 0.5, 0.05);
  taper(body, 1.08, 1);
  smoothNormals(body);
  g.add(m(body, makeMat('WOOD_DARK')));
  const glass = m(rb(1.2, 1.0, 0.03, 0.02), makeMat('FRIDGE', { transparent: true, opacity: 0.55, spec: 0.5 }), false);
  glass.position.set(0, 1.0, 0.26);
  g.add(glass);
  for (let i = 0; i < 4; i++) {
    const plate = m(chamferCylinder(0.13, 0.13, 0.02, 16, 0.006), makeMat('SKY_TOY'), false);
    plate.rotation.x = Math.PI / 2 - 0.2;
    plate.position.set(-0.42 + i * 0.28, 1.35, 0.1);
    g.add(plate);
  }
  return g;
}

export function corkBoard(name) {
  const g = new Group();
  g.add(m(rb(1.0, 0.7, 0.04, 0.02), makeMat('CARDBOARD')));
  const frame = m(rb(1.06, 0.76, 0.03, 0.02), makeMat('WOOD_DARK'));
  frame.position.z = -0.02;
  frame.position.y = -0.03;
  g.add(frame);
  const notes = [['?', 'PH_SIDING'], ['MILK', 'FRIDGE'], ['3-1-4', 'YELLOW_TOY'], ['DON\'T\nFORGET', 'BUBBLEGUM']];
  notes.forEach(([t, bg], i) => {
    const n = m(rb(0.24, 0.22, 0.01, 0.004), makeMat('WHITE', { map: Tex.label(t, { bg, fg: 'BLACK_SOFT', w: 256, h: 256, size: 70 }) }), false);
    n.position.set(-0.32 + (i % 2) * 0.5, 0.08 + Math.floor(i / 2) * 0.32, 0.03);
    n.rotation.z = (i % 2 ? 1 : -1) * 0.12;
    // uv: show label on front face
    frontUV(n.geometry, 0.24, 0.22);
    g.add(n);
  });
  return g;
}

// Map a front-facing box's UVs so a label texture fills its +Z face.
export function frontUV(geo, w, h, yBase = 0) {
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, (pos.getY(i) - yBase) / h + (yBase ? 0 : 0));
  uv.needsUpdate = true;
}

export function toaster(name) {
  const g = new Group();
  g.add(m(rb(0.28, 0.2, 0.17, 0.06), makeMat('METAL', { spec: 0.7 })));
  for (const x of [-0.05, 0.05]) {
    const toast = m(rb(0.03, 0.12, 0.12, 0.02), makeMat('WOOD_LIGHT'));
    toast.position.set(x, 0.12, 0);
    g.add(toast);
  }
  g.userData.toasts = g.children.slice(1);
  for (const t of g.userData.toasts) t.userData.noBake = true;
  return g;
}

export function typewriter(name) {
  const g = new Group();
  g.add(m(rb(0.42, 0.14, 0.32, 0.05), makeMat('KEY_GREEN', { spec: 0.4 })));
  const roller = m(chamferCylinder(0.04, 0.04, 0.46, 10, 0.01), makeMat('BLACK_SOFT'));
  roller.rotation.z = Math.PI / 2;
  roller.position.set(0, 0.17, -0.1);
  g.add(roller);
  const paper = m(rb(0.24, 0.26, 0.005, 0.002), makeMat('FRIDGE'), false);
  paper.position.set(0, 0.17, -0.12);
  paper.rotation.x = -0.2;
  g.add(paper);
  for (let i = 0; i < 12; i++) {
    const k = m(new SphereGeometry(0.014, 6, 4), makeMat('FRIDGE'), false);
    k.position.set(-0.15 + (i % 6) * 0.06, 0.15, 0.05 + Math.floor(i / 6) * 0.05);
    g.add(k);
  }
  return g;
}

export function blueprint(name, w = 1.0, h = 0.7) {
  const g = new Group();
  const tex = Tex.label('HOUSE PLAN\n?? ROOMS ??', { bg: 'BLUE_TOY', fg: 'WHITE', w: 512, h: 360, size: 50, border: 'WHITE' });
  const p = m(rb(w, h, 0.01, 0.003), makeMat('WHITE', { map: tex }), false);
  frontUV(p.geometry, w, h);
  g.add(p);
  for (const [x, y] of [[-w / 2 + 0.05, h - 0.05], [w / 2 - 0.05, h - 0.05]]) {
    const pin = m(new SphereGeometry(0.018, 6, 4), makeMat('RED_TOY'), false);
    pin.position.set(x, y, 0.015);
    g.add(pin);
  }
  return g;
}

export function neighborhoodModel(name) {
  const g = new Group();
  const base = m(rb(1.1, 0.06, 0.7, 0.02), makeMat('GRASS'));
  g.add(base);
  const road = m(rb(1.1, 0.065, 0.12, 0.01), makeMat('ASPHALT'), false);
  g.add(road);
  const houses = [[-0.35, -0.2, 'HOUSE_PINK'], [0, -0.2, 'NH_SIDING_MAIN'], [0.35, -0.2, 'HOUSE_GREEN'], [-0.35, 0.2, 'HOUSE_LAVENDER'], [0, 0.2, 'PH_SIDING'], [0.35, 0.2, 'HOUSE_PEACH']];
  for (const [x, z, c] of houses) {
    const h = m(rb(0.12, c === 'NH_SIDING_MAIN' ? 0.3 : 0.12, 0.1, 0.01), makeMat(c), false);
    h.position.set(x, 0.06, z);
    g.add(h);
  }
  // red X on the tiny player's house
  for (const s of [-1, 1]) {
    const bar = m(rb(0.16, 0.02, 0.025, 0.005), makeMat('KEY_RED', { emissive: 'KEY_RED', emissiveIntensity: 0.3 }), false);
    bar.position.set(0, 0.19, 0.2);
    bar.rotation.y = s * 0.8;
    g.add(bar);
  }
  return g;
}

export function toolShelf(name) {
  const g = new Group();
  const wood = makeMat('WOOD_LIGHT');
  for (let i = 0; i < 3; i++) {
    const p = m(rb(1.4, 0.05, 0.36, 0.015, {}), wood);
    p.position.y = 0.4 + i * 0.55;
    g.add(p);
  }
  for (const s of [-1, 1]) {
    const side = m(rb(0.05, 1.6, 0.36, 0.015), makeMat('WOOD_MID'));
    side.position.x = s * 0.68;
    g.add(side);
  }
  // hammer, wrench, saw, jar of nails
  const hammer = new Group();
  const hh = m(chamferCylinder(0.015, 0.015, 0.28, 6, 0.005), makeMat('WOOD_MID'));
  hh.rotation.z = Math.PI / 2;
  const hd = m(rb(0.06, 0.05, 0.12, 0.015), makeMat('METAL_DARK'));
  hd.position.x = 0.14;
  hammer.add(hh, hd);
  hammer.position.set(-0.4, 0.48, 0);
  const saw = m(rb(0.4, 0.14, 0.01, 0.01), makeMat('METAL', { spec: 0.6 }));
  saw.position.set(0.1, 1.06, 0.12);
  const jar = m(chamferCylinder(0.07, 0.07, 0.16, 12, 0.02, { bottom: true }), makeMat('GLASS', { transparent: true, opacity: 0.6, spec: 0.6 }));
  jar.position.set(0.45, 0.98, 0);
  g.add(hammer, saw, jar);
  return g;
}

export function desk(name, color = 'WOOD_MID') {
  const g = new Group();
  const top = m(rb(1.5, 0.07, 0.75, 0.025), makeMat(color));
  top.position.y = 0.74;
  g.add(top);
  const ped = m(rb(0.45, 0.72, 0.68, 0.03), makeMat(color));
  ped.position.x = 0.5;
  g.add(ped);
  for (let i = 0; i < 3; i++) {
    const dr = m(rb(0.38, 0.18, 0.03, 0.01), makeMat('WOOD_DARK'), false);
    dr.position.set(0.5, 0.1 + i * 0.22, 0.35);
    g.add(dr);
  }
  for (const [x, z] of [[-0.68, -0.3], [-0.68, 0.3]]) {
    const leg = m(chamferCylinder(0.04, 0.03, 0.72, 8, 0.012, { bottom: true }), makeMat('WOOD_DARK'));
    leg.position.set(x, 0, z);
    g.add(leg);
  }
  return g;
}

export function draftingLamp(name) {
  const g = new Group();
  const base = m(chamferCylinder(0.09, 0.1, 0.04, 12, 0.01, { bottom: true }), makeMat('RED_TOY', { spec: 0.4 }));
  g.add(base);
  const a1 = m(chamferCylinder(0.015, 0.015, 0.45, 6, 0.005, { bottom: true }), makeMat('RED_TOY'));
  a1.rotation.z = 0.35;
  g.add(a1);
  const a2 = m(chamferCylinder(0.015, 0.015, 0.4, 6, 0.005, { bottom: true }), makeMat('RED_TOY'));
  a2.position.set(-0.15, 0.42, 0);
  a2.rotation.z = -1.1;
  g.add(a2);
  const shade = m(new ConeGeometry(0.1, 0.14, 14, 1, true), makeMat('RED_TOY', { side: DoubleSide }));
  shade.position.set(0.22, 0.56, 0);
  shade.rotation.z = 2.4;
  g.add(shade);
  lightMarker(g, new Vector3(0.25, 0.45, 0), CONFIG.lighting.lampIntensity * 0.7, Palette.LAMP_LIGHT, 3);
  return g;
}

export function mannequinChild(name) {
  // a child-sized dressmaker's mannequin, smooth and blank. Sits facing the wall.
  const g = new Group();
  const mat = makeMat('WAINSCOT', { spec: 0.2 });
  const torso = new CapsuleGeometry(0.13, 0.3, 6, 14);
  bulge(torso, 0.05);
  const t = m(torso, mat);
  t.position.y = 0.45;
  g.add(t);
  const head = m(new SphereGeometry(0.12, 18, 14), mat);
  head.scale.y = 1.15;
  head.position.y = 0.82;
  g.add(head);
  for (const s of [-1, 1]) {
    const arm = m(new CapsuleGeometry(0.035, 0.28, 4, 8), mat);
    arm.position.set(s * 0.17, 0.42, 0.04);
    arm.rotation.x = -0.3;
    const leg = m(new CapsuleGeometry(0.045, 0.3, 4, 8), mat);
    leg.position.set(s * 0.07, 0.18, 0.18);
    leg.rotation.x = Math.PI / 2;
    g.add(arm, leg);
  }
  return g;
}

export function planetMobile(name) {
  const g = new Group();
  const spin = new Group();
  const string = m(chamferCylinder(0.004, 0.004, 0.5, 4, 0.001, { bottom: true }), makeMat('WHITE'), false);
  g.add(string);
  const cols = ['TANGERINE', 'SKY_TOY', 'RED_TOY', 'YELLOW_TOY', 'GRAPE'];
  cols.forEach((c, i) => {
    const a = (i / cols.length) * Math.PI * 2;
    const p = m(new SphereGeometry(0.05 + (i % 3) * 0.025, 12, 10), makeMat(c, { spec: 0.4 }), false);
    p.position.set(Math.cos(a) * 0.32, -0.15 - (i % 2) * 0.12, Math.sin(a) * 0.32);
    spin.add(p);
    const s = m(chamferCylinder(0.003, 0.003, 0.15 + (i % 2) * 0.12, 4, 0.001, { bottom: true }), makeMat('WHITE'), false);
    s.position.copy(p.position);
    spin.add(s);
  });
  const ring = m(new TorusGeometry(0.32, 0.008, 4, 30), makeMat('BRASS'), false);
  ring.rotation.x = Math.PI / 2;
  spin.add(ring);
  spin.userData.noBake = true;
  g.add(spin);
  g.userData.update = (dt) => { spin.rotation.y += dt * 0.25; };
  return g; // origin at the ring; string goes up
}

export function trunk(name) {
  const g = new Group();
  const body = m(rb(1.0, 0.5, 0.55, 0.06), makeMat('WOOD_MID'));
  g.add(body);
  const lidG = new CylinderGeometry(0.275, 0.275, 1.0, 16, 1, false, 0, Math.PI);
  const lid = m(lidG, makeMat('WOOD_MID'));
  lid.rotation.set(0, 0, Math.PI / 2);
  lid.rotation.order = 'ZYX';
  lid.rotation.y = Math.PI / 2;
  lid.position.y = 0.5;
  lid.scale.set(1, 1, 0.6);
  g.add(lid);
  for (const x of [-0.35, 0.35]) {
    const band = m(rb(0.06, 0.52, 0.57, 0.02), makeMat('BRASS', { spec: 0.5 }));
    band.position.x = x;
    g.add(band);
  }
  const lock = m(rb(0.1, 0.12, 0.05, 0.02), makeMat('BRASS', { spec: 0.6 }));
  lock.position.set(0, 0.35, 0.28);
  g.add(lock);
  g.userData.hide = { kind: 'trunk' };
  return g;
}

export function telescope(name) {
  const g = new Group();
  for (let i = 0; i < 3; i++) {
    const leg = m(chamferCylinder(0.015, 0.02, 1.2, 6, 0.006, { bottom: true }), makeMat('WOOD_DARK'));
    const a = (i / 3) * Math.PI * 2;
    leg.position.set(Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25);
    leg.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22);
    g.add(leg);
  }
  const tube = m(chamferCylinder(0.06, 0.09, 0.9, 14, 0.02), makeMat('BRASS', { spec: 0.6 }));
  tube.rotation.x = Math.PI / 2 - 0.15;
  tube.position.set(0, 1.18, 0.2);
  g.add(tube);
  return g;
}

export function dressDummy(name) {
  const g = new Group();
  const pole = m(chamferCylinder(0.02, 0.02, 1.0, 6, 0.006, { bottom: true }), makeMat('WOOD_DARK'));
  g.add(pole);
  const base = m(chamferCylinder(0.22, 0.25, 0.05, 12, 0.015, { bottom: true }), makeMat('WOOD_DARK'));
  g.add(base);
  const torso = new CapsuleGeometry(0.2, 0.35, 6, 14);
  bulge(torso, 0.1);
  const t = m(torso, makeMat('BUBBLEGUM'));
  t.position.y = 1.3;
  t.scale.z = 0.75;
  g.add(t);
  const knob = m(new SphereGeometry(0.05, 10, 8), makeMat('WOOD_DARK'));
  knob.position.y = 1.72;
  g.add(knob);
  return g;
}

export function rockingHorse(name) {
  const g = new Group();
  const rock = new Group();
  const wood = makeMat('WOOD_LIGHT');
  for (const s of [-1, 1]) {
    const rocker = m(new TorusGeometry(0.7, 0.03, 6, 24, 1.1), makeMat('WOOD_DARK'));
    rocker.rotation.z = Math.PI + (Math.PI - 1.1) / 2 + Math.PI;
    rocker.rotation.set(0, 0, -Math.PI / 2 - 0.55);
    rocker.position.set(0, 0.7, s * 0.16);
    rock.add(rocker);
  }
  const body = new CapsuleGeometry(0.15, 0.45, 6, 12);
  const b = m(body, wood);
  b.rotation.z = Math.PI / 2;
  b.position.y = 0.55;
  rock.add(b);
  const head = m(rb(0.14, 0.32, 0.22, 0.05), wood);
  head.position.set(0.32, 0.6, 0);
  head.rotation.z = -0.4;
  rock.add(head);
  const mane = m(rb(0.06, 0.28, 0.06, 0.02), makeMat('RED_TOY'));
  mane.position.set(0.28, 0.72, 0);
  mane.rotation.z = -0.4;
  rock.add(mane);
  for (const [x, z] of [[-0.2, -0.12], [-0.2, 0.12], [0.2, -0.12], [0.2, 0.12]]) {
    const leg = m(chamferCylinder(0.03, 0.03, 0.4, 6, 0.01, { bottom: true }), wood);
    leg.position.set(x, 0.12, z);
    rock.add(leg);
  }
  rock.userData.noBake = true;
  g.add(rock);
  let tRock = 0, amp = 0;
  g.userData.update = (dt, t) => {
    tRock -= dt;
    if (tRock <= 0) { tRock = 6 + Math.random() * 14; amp = 0.18; }
    amp *= Math.exp(-dt * 0.6);
    rock.rotation.z = Math.sin(t * 3.2) * amp;
  };
  return g;
}

export function suitcase(name, color) {
  const r = rng(name);
  const g = new Group();
  const c = color ?? r.pick(['TOMATO', 'NB_PANTS', 'SOFA_GREEN', 'WALLPAPER_BLUE']);
  g.add(m(rb(0.7, 0.45, 0.22, 0.06), makeMat(c)));
  const h = m(new TorusGeometry(0.07, 0.015, 6, 12, Math.PI), makeMat('BLACK_SOFT'));
  h.position.y = 0.45;
  g.add(h);
  return g;
}

export function monitors(name) {
  const g = new Group();
  const shelf = m(rb(1.6, 0.06, 0.5, 0.02), makeMat('METAL_DARK'));
  shelf.position.y = 0.9;
  g.add(shelf);
  const screens = [];
  for (let i = 0; i < 4; i++) {
    const tv = m(rb(0.42, 0.36, 0.38, 0.06), makeMat('METAL'));
    tv.position.set(-0.6 + (i % 2) * 0.48 + Math.floor(i / 2) * 0.72, 0.96 + 0 * 0.4, 0);
    if (i >= 2) tv.position.set(-0.6 + (i - 2) * 0.48, 1.36, 0);
    else tv.position.set(-0.6 + i * 0.48, 0.96, 0);
    const scr = m(rb(0.34, 0.27, 0.02, 0.03), makeMat('TV_SCREEN_ON', { emissive: 'TV_SCREEN_ON', emissiveIntensity: 0.5, unique: true }), false);
    scr.position.set(tv.position.x, tv.position.y + 0.045, 0.2);
    scr.userData.noBake = true;
    g.add(tv, scr);
    screens.push(scr);
  }
  const big = m(rb(0.6, 0.5, 0.42, 0.07), makeMat('METAL'));
  big.position.set(0.55, 0.96, 0);
  const bigScr = m(rb(0.5, 0.38, 0.02, 0.04), makeMat('TV_SCREEN_ON', { emissive: 'TV_SCREEN_ON', emissiveIntensity: 0.5, unique: true }), false);
  bigScr.position.set(0.55, 1.02, 0.22);
  bigScr.userData.noBake = true;
  g.add(big, bigScr);
  screens.push(bigScr);
  g.userData.screens = screens;
  g.userData.update = (dt, t) => {
    for (let i = 0; i < screens.length; i++) {
      const k = 0.35 + 0.25 * Math.sin(t * (9 + i * 3)) * Math.sin(t * (2.3 + i));
      screens[i].material.emissiveIntensity = k;
    }
  };
  return g;
}

export function workbench(name) {
  const g = new Group();
  const top = m(rb(2.0, 0.1, 0.8, 0.03), makeMat('WOOD_LIGHT', { map: Tex.woodPlanks('WOOD_LIGHT', 3) }));
  top.position.y = 0.88;
  g.add(top);
  for (const [x, z] of [[-0.9, -0.32], [0.9, -0.32], [-0.9, 0.32], [0.9, 0.32]]) {
    const leg = m(rb(0.1, 0.88, 0.1, 0.02), makeMat('WOOD_MID'));
    leg.position.set(x, 0, z);
    g.add(leg);
  }
  const lower = m(rb(1.9, 0.05, 0.7, 0.015), makeMat('WOOD_MID'));
  lower.position.y = 0.2;
  g.add(lower);
  const vise = m(rb(0.18, 0.14, 0.14, 0.03), makeMat('BLUE_TOY', { spec: 0.4 }));
  vise.position.set(-0.8, 0.98, 0.36);
  g.add(vise);
  g.userData.hide = { kind: 'underTable' };
  return g;
}

export function trapBox(name) {
  const g = new Group();
  g.add(m(rb(0.7, 0.4, 0.5, 0.03), makeMat('CARDBOARD')));
  const label = m(rb(0.5, 0.18, 0.01, 0.005), makeMat('WHITE', { map: Tex.label('TRAPS', { bg: 'CARDBOARD_TAPE', fg: 'KEY_RED', w: 256, h: 96, size: 64 }) }), false);
  frontUV(label.geometry, 0.5, 0.18);
  label.position.set(0, 0.12, 0.255);
  g.add(label);
  for (let i = 0; i < 2; i++) {
    const jaw = m(new TorusGeometry(0.14, 0.02, 6, 16, Math.PI), makeMat('METAL', { spec: 0.6 }));
    jaw.position.set(-0.12 + i * 0.22, 0.42, 0);
    jaw.rotation.x = -0.4;
    g.add(jaw);
  }
  return g;
}

export function tripod(name) {
  const g = new Group();
  for (let i = 0; i < 3; i++) {
    const leg = m(chamferCylinder(0.015, 0.015, 1.3, 6, 0.005, { bottom: true }), makeMat('METAL_DARK'));
    const a = (i / 3) * Math.PI * 2;
    leg.position.set(Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25);
    leg.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2);
    g.add(leg);
  }
  const cam = m(rb(0.26, 0.16, 0.18, 0.04), makeMat('METAL', { spec: 0.4 }));
  cam.position.y = 1.28;
  const lensM = m(chamferCylinder(0.05, 0.05, 0.1, 12, 0.015), makeMat('BLACK_SOFT'));
  lensM.rotation.x = Math.PI / 2;
  lensM.position.set(0, 1.36, 0.13);
  g.add(cam, lensM);
  return g;
}

export function umbrellaStand(name) {
  const g = new Group();
  g.add(m(chamferCylinder(0.13, 0.12, 0.5, 14, 0.03, { bottom: true }), makeMat('SKY_TOY', { spec: 0.4 })));
  const cols = ['RED_TOY', 'YELLOW_TOY'];
  cols.forEach((c, i) => {
    const u = m(chamferCylinder(0.02, 0.05, 0.85, 8, 0.01, { bottom: true }), makeMat(c));
    u.position.set(-0.03 + i * 0.06, 0.1, 0);
    u.rotation.z = (i ? 1 : -1) * 0.12;
    g.add(u);
  });
  return g;
}

export function boots(name) {
  const g = new Group();
  for (const s of [-1, 1]) {
    const shaft = m(chamferCylinder(0.07, 0.07, 0.35, 10, 0.02, { bottom: true }), makeMat('KEY_GREEN', { spec: 0.5 }));
    shaft.position.x = s * 0.1;
    const foot = m(rb(0.12, 0.1, 0.25, 0.04), makeMat('KEY_GREEN', { spec: 0.5 }));
    foot.position.set(s * 0.1, 0, 0.06);
    g.add(shaft, foot);
  }
  return g;
}

export function coatHooks(name) {
  const g = new Group();
  const board = m(rb(1.3, 0.12, 0.04, 0.02), makeMat('WOOD_DARK'));
  g.add(board);
  const cols = ['NB_PANTS', 'RED_TOY', 'SOFA_GREEN'];
  cols.forEach((c, i) => {
    const coat = m(rb(0.42, 0.95, 0.16, 0.09), makeMat(c));
    taper(coat.geometry, 0.65, 1);
    coat.position.set(-0.4 + i * 0.4, -0.95, 0.08);
    g.add(coat);
  });
  return g;
}

export function roastChicken(name) {
  const g = new Group();
  const body = new SphereGeometry(0.13, 16, 12);
  body.scale(1.25, 0.8, 1);
  g.add(m(body, makeMat('TANGERINE', { spec: 0.4 })));
  for (const s of [-1, 1]) {
    const leg = m(new SphereGeometry(0.05, 10, 8), makeMat('TANGERINE', { spec: 0.4 }));
    leg.position.set(0.12, 0.04, s * 0.08);
    const bone = m(chamferCylinder(0.012, 0.012, 0.06, 6, 0.004), makeMat('FRIDGE'));
    bone.rotation.z = -1.2;
    bone.position.set(0.17, 0.07, s * 0.08);
    g.add(leg, bone);
  }
  return g;
}

export function peas(name) {
  const g = new Group();
  const r = rng(name);
  for (let i = 0; i < 10; i++) {
    const p = m(new SphereGeometry(0.018, 8, 6), makeMat('LIME'), false);
    p.position.set(r.range(-0.06, 0.06), 0.02, r.range(-0.06, 0.06));
    g.add(p);
  }
  return g;
}

export function shoebox(name) {
  const g = new Group();
  g.add(m(rb(0.4, 0.15, 0.25, 0.02), makeMat('KEY_BLUE')));
  const lid = m(rb(0.42, 0.04, 0.27, 0.015), makeMat('SKY_TOY'));
  lid.position.set(0.05, 0.15, 0.02);
  lid.rotation.y = 0.15;
  g.add(lid);
  return g;
}

export function photoWall(name, kind = 'family') {
  const g = new Group();
  const tex = Tex.label(kind === 'family' ? 'FAMILY' : kind === 'house' ? 'HOME' : 'FUN FAIR', { bg: kind === 'family' ? 'SKY_TOY' : kind === 'house' ? 'NH_SIDING_MAIN' : 'BUBBLEGUM', fg: 'WHITE', w: 256, h: 200, size: 48 });
  const f = m(rb(0.5, 0.42, 0.05, 0.02), makeMat('WOOD_DARK'), false);
  const p = m(rb(0.38, 0.3, 0.01, 0.005), makeMat('WHITE', { map: tex }), false);
  frontUV(p.geometry, 0.38, 0.3);
  p.position.set(0, 0.06, 0.03);
  g.add(f, p);
  if (kind === 'family') {
    // four little cartoon people; two have their faces scribbled out
    for (let i = 0; i < 4; i++) {
      const head = m(new SphereGeometry(0.03, 8, 6), makeMat(i === 1 || i === 3 ? 'BLACK_SOFT' : 'NB_SKIN'), false);
      head.position.set(-0.12 + i * 0.08, 0.24, 0.04);
      const bod = m(rb(0.05, 0.08, 0.01, 0.01), makeMat(['NB_VEST_DARK', 'BUBBLEGUM', 'TANGERINE', 'SKY_TOY'][i]), false);
      bod.position.set(-0.12 + i * 0.08, 0.13, 0.04);
      g.add(head, bod);
    }
  }
  return g;
}

export { sag, lean, wobble, seedFrom, IcosahedronGeometry };
