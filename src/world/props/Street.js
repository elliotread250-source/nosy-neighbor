// Street dressing: hydrant, hooked lamp posts, mailboxes, power poles with
// sagging wires, sawhorse barriers, signs, a kid's bike, a sprinkler.
import {
  Group, Mesh, CatmullRomCurve3, TubeGeometry, Vector3, SphereGeometry, TorusGeometry, Points, BufferGeometry,
  Float32BufferAttribute, PointsMaterial, CylinderGeometry, DoubleSide, PlaneGeometry,
} from 'three';
import { makeMat } from '../../art/Materials.js';
import { Palette } from '../../art/Palette.js';
import { roundedBox, chamferCylinder, smoothNormals } from '../../art/Geo.js';
import { taper, bulge, rng, lean } from '../../art/Warp.js';
import * as Tex from '../../art/CanvasTextures.js';

const DEG = Math.PI / 180;

function mesh(geo, mat, cast = true) {
  const m = new Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

export function hydrant() {
  const g = new Group();
  const red = makeMat('HYDRANT', { spec: 0.45, rim: 0.3 });
  const body = chamferCylinder(0.16, 0.19, 0.5, 18, 0.04, { bottom: true });
  bulge(body, 0.1);
  smoothNormals(body);
  g.add(mesh(body, red));
  const base = mesh(chamferCylinder(0.26, 0.28, 0.08, 18, 0.03, { bottom: true }), red);
  g.add(base);
  const cap = mesh(new SphereGeometry(0.19, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), red);
  cap.position.y = 0.5;
  g.add(cap);
  const nub = mesh(chamferCylinder(0.05, 0.06, 0.1, 10, 0.02, { bottom: true }), red);
  nub.position.y = 0.66;
  g.add(nub);
  for (const s of [-1, 1]) {
    const arm = mesh(chamferCylinder(0.075, 0.075, 0.16, 12, 0.025), red);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(s * 0.22, 0.36, 0);
    g.add(arm);
    const bolt = mesh(chamferCylinder(0.05, 0.05, 0.05, 6, 0.012), makeMat('BRASS', { spec: 0.5 }));
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set(s * 0.31, 0.36, 0);
    g.add(bolt);
  }
  const ring = mesh(new TorusGeometry(0.19, 0.035, 8, 20), red);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.48;
  g.add(ring);
  return g;
}

// 5.5 m lamp post, head hooked over like a candy cane / question mark.
export function lampPost(name) {
  const r = rng(name);
  const g = new Group();
  const green = makeMat('LAMP_POST', { spec: 0.3 });
  const pts = [
    new Vector3(0, 0, 0), new Vector3(0, 2.5, 0), new Vector3(r.range(-0.05, 0.05), 4.6, 0),
    new Vector3(0.25, 5.35, 0), new Vector3(0.75, 5.5, 0), new Vector3(1.15, 5.25, 0), new Vector3(1.2, 4.95, 0),
  ];
  const curve = new CatmullRomCurve3(pts);
  const tube = new TubeGeometry(curve, 48, 0.09, 10, false);
  g.add(mesh(tube, green));
  const base = mesh(chamferCylinder(0.2, 0.26, 0.6, 14, 0.05, { bottom: true }), green);
  g.add(base);
  const shade = chamferCylinder(0.12, 0.3, 0.32, 16, 0.04, { bottom: true });
  const head = mesh(shade, green);
  head.rotation.x = Math.PI;
  head.position.set(1.2, 5.0, 0);
  g.add(head);
  const bulb = mesh(new SphereGeometry(0.14, 14, 10), makeMat('LAMPSHADE', { rim: 0.2 }));
  bulb.position.set(1.2, 4.66, 0);
  g.add(bulb);
  g.userData.bulb = bulb;
  return g;
}

// Yellow school-bus-style mailbox on a fat post, with a flag.
export function mailbox(name, flagUp = false) {
  const g = new Group();
  const post = mesh(roundedBox(0.14, 1.05, 0.14, 0.03, 2, { bottom: true }), makeMat('WOOD_MID'));
  post.rotation.z = rng(name).range(-4, 4) * DEG;
  g.add(post);
  const box = new Group();
  const yellow = makeMat('YELLOW_TOY', { spec: 0.35 });
  const body = mesh(roundedBox(0.3, 0.22, 0.52, 0.04, 3), yellow);
  const top = mesh(new CylinderGeometry(0.15, 0.15, 0.52, 18, 1, false, 0, Math.PI), yellow);
  top.rotation.z = Math.PI / 2;
  top.rotation.x = Math.PI / 2;
  top.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  top.position.y = 0.11;
  box.add(body, top);
  const flag = new Group();
  const pole = mesh(roundedBox(0.03, 0.3, 0.03, 0.01, 1, { bottom: true }), makeMat('RED_TOY'));
  const pennant = mesh(roundedBox(0.03, 0.1, 0.14, 0.01, 1), makeMat('RED_TOY'));
  pennant.position.set(0, 0.25, 0.07);
  flag.add(pole, pennant);
  flag.position.set(0.17, -0.05, -0.1);
  flag.rotation.x = flagUp ? 0 : Math.PI / 2;
  box.add(flag);
  box.position.y = 1.15;
  g.add(box);
  return g;
}

// Wooden power pole with a crossbar. Wires are made separately.
export function powerPole(name, height = 8) {
  const r = rng(name);
  const g = new Group();
  const wood = makeMat('NH_PLANKS_OLD');
  const pole = chamferCylinder(0.13, 0.17, height, 10, 0.04, { bottom: true });
  lean(pole, r.range(-2, 2), 'x');
  smoothNormals(pole);
  g.add(mesh(pole, wood));
  const bar = mesh(roundedBox(2.0, 0.14, 0.14, 0.03, 2), wood);
  bar.position.y = height - 0.5;
  bar.rotation.z = r.range(-3, 3) * DEG;
  g.add(bar);
  for (const s of [-0.8, 0, 0.8]) {
    const ins = mesh(chamferCylinder(0.05, 0.06, 0.14, 8, 0.02, { bottom: true }), makeMat('KEY_GREEN', { spec: 0.5 }));
    ins.position.set(s, height - 0.43, 0);
    g.add(ins);
  }
  g.userData.anchors = [-0.8, 0, 0.8].map((s) => new Vector3(s, height - 0.3, 0));
  return g;
}

// A sagging wire between two world points.
export function wire(a, b, sagAmt = 0.9, radius = 0.02) {
  const mid = a.clone().lerp(b, 0.5);
  mid.y -= sagAmt;
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const p = a.clone().lerp(b, t);
    p.y -= sagAmt * 4 * t * (1 - t);
    pts.push(p);
  }
  const tube = new TubeGeometry(new CatmullRomCurve3(pts), 24, radius, 5, false);
  const m = new Mesh(tube, makeMat('BLACK_SOFT'));
  return m;
}

export function sawhorse(text = 'ROAD\nCLOSED') {
  const g = new Group();
  const stripe = makeMat('WHITE', { map: Tex.label(text, { bg: 'TANGERINE', fg: 'WHITE', w: 512, h: 128, size: 56 }) });
  const board = mesh(roundedBox(2.4, 0.4, 0.08, 0.03, 2), stripe);
  board.position.y = 1.0;
  g.add(board);
  const legMat = makeMat('WHITE');
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = mesh(roundedBox(0.08, 1.15, 0.08, 0.02, 2, { bottom: true }), legMat);
      leg.position.set(sx * 1.0, 0, sz * 0.22);
      leg.rotation.x = -sz * 12 * DEG;
      g.add(leg);
    }
  const light = mesh(new SphereGeometry(0.09, 12, 8), makeMat('TANGERINE', { emissive: 'TANGERINE', emissiveIntensity: 0.6 }));
  light.position.set(-0.9, 1.3, 0);
  g.add(light);
  return g;
}

export function sign(text, { bg = 'WHITE', fg = 'TOMATO', w = 0.8, h = 0.5, post = 1.0, tilt = 0, border = null } = {}) {
  const g = new Group();
  const tex = Tex.label(text, { bg, fg, w: 512, h: Math.round(512 * h / w), size: 72, border });
  const board = mesh(roundedBox(w, h, 0.05, 0.02, 2), makeMat('WHITE', { map: tex }));
  board.position.y = post + h / 2;
  g.add(board);
  if (post > 0) {
    const p = mesh(roundedBox(0.08, post + h * 0.5, 0.08, 0.02, 2, { bottom: true }), makeMat('WOOD_MID'));
    p.position.z = -0.06;
    g.add(p);
  }
  g.rotation.z = tilt * DEG;
  return g;
}

export function bike() {
  const g = new Group();
  const frameMat = makeMat('BUBBLEGUM', { spec: 0.4 });
  const tire = makeMat('BLACK_SOFT');
  for (const x of [-0.5, 0.5]) {
    const w = mesh(new TorusGeometry(0.3, 0.05, 8, 24), tire);
    w.position.set(x, 0, 0);
    g.add(w);
    const hub = mesh(chamferCylinder(0.06, 0.06, 0.08, 10, 0.02), makeMat('METAL'));
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, 0, 0);
    g.add(hub);
  }
  const bar = (a, b, rad = 0.035) => {
    const t = new TubeGeometry(new CatmullRomCurve3([a, b]), 2, rad, 8, false);
    g.add(mesh(t, frameMat));
  };
  bar(new Vector3(-0.5, 0, 0), new Vector3(-0.05, 0.4, 0));
  bar(new Vector3(-0.05, 0.4, 0), new Vector3(0.4, 0.42, 0));
  bar(new Vector3(0.4, 0.42, 0), new Vector3(0.5, 0, 0));
  bar(new Vector3(-0.05, 0.4, 0), new Vector3(0.05, 0, 0));
  bar(new Vector3(0.4, 0.42, 0), new Vector3(0.35, 0.65, 0));
  const hb = mesh(roundedBox(0.06, 0.06, 0.5, 0.02, 1), makeMat('METAL'));
  hb.position.set(0.35, 0.65, 0);
  g.add(hb);
  const seat = mesh(roundedBox(0.22, 0.06, 0.12, 0.03, 2), makeMat('BLUE_TOY'));
  seat.position.set(-0.08, 0.48, 0);
  g.add(seat);
  // lying on its side on the lawn
  g.rotation.x = Math.PI / 2 - 8 * DEG;
  g.position.y = 0.06;
  return g;
}

// Animated sprinkler: a chunky base plus an arc of little blue droplets.
export function sprinkler() {
  const g = new Group();
  const base = mesh(chamferCylinder(0.12, 0.16, 0.12, 12, 0.03, { bottom: true }), makeMat('KEY_GREEN', { spec: 0.4 }));
  g.add(base);
  const N = 160;
  const pos = new Float32Array(N * 3);
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  const mat = new PointsMaterial({ color: Palette.SKY_TOY, size: 0.07, transparent: true, opacity: 0.85, depthWrite: false });
  const pts = new Points(geo, mat);
  pts.frustumCulled = false;
  g.add(pts);
  const seeds = Array.from({ length: N }, (_, i) => [i / N, Math.random()]);
  g.userData.update = (dt, t) => {
    const sweep = Math.sin(t * 0.8) * 1.0;
    for (let i = 0; i < N; i++) {
      const life = (seeds[i][0] + t * 0.6) % 1;
      const ang = sweep + (seeds[i][1] - 0.5) * 0.25;
      const v = 4.2, up = 4.5;
      const tt = life * 1.0;
      pos[i * 3] = Math.sin(ang) * v * tt;
      pos[i * 3 + 1] = 0.15 + up * tt - 4.9 * tt * tt;
      pos[i * 3 + 2] = Math.cos(ang) * v * tt;
      if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = -10;
    }
    geo.attributes.position.needsUpdate = true;
  };
  return g;
}

// The neighbor's suspiciously tall garden gnome (70 cm). Turns to face you.
export function gnome() {
  const g = new Group();
  const body = chamferCylinder(0.12, 0.17, 0.32, 14, 0.05, { bottom: true });
  g.add(mesh(body, makeMat('BLUE_TOY')));
  const face = mesh(new SphereGeometry(0.1, 16, 12), makeMat('NB_SKIN', { skin: true }));
  face.position.y = 0.38;
  g.add(face);
  const beard = mesh(new SphereGeometry(0.11, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), makeMat('WHITE'));
  beard.position.set(0, 0.36, 0.03);
  beard.scale.set(1, 1.6, 0.9);
  g.add(beard);
  const hatG = chamferCylinder(0.005, 0.12, 0.32, 14, 0.004, { bottom: true });
  taper(hatG, 1, 1);
  const hat = mesh(hatG, makeMat('RED_TOY'));
  hat.position.y = 0.43;
  hat.rotation.z = 0.25;
  g.add(hat);
  const nose = mesh(new SphereGeometry(0.03, 10, 8), makeMat('NB_NOSE'));
  nose.position.set(0, 0.37, 0.1);
  g.add(nose);
  for (const s of [-1, 1]) {
    const eye = mesh(new SphereGeometry(0.014, 8, 6), makeMat('BLACK_SOFT'));
    eye.position.set(s * 0.035, 0.41, 0.09);
    g.add(eye);
  }
  return g;
}

export function doormat(text) {
  const tex = Tex.label(text, { bg: 'DIRT', fg: 'NB_BELT', w: 512, h: 256, size: 120 });
  const m = mesh(roundedBox(1.2, 0.04, 0.7, 0.015, 2), makeMat('WHITE', { map: tex }), false);
  // label is drawn on the top face via worldish UVs: rotate the texture to fit
  const uv = m.geometry.attributes.uv;
  const pos = m.geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 1.2 + 0.5, -pos.getZ(i) / 0.7 + 0.5);
  return m;
}

export function hose() {
  const pts = [];
  for (let i = 0; i < 60; i++) {
    const a = i * 0.42;
    const r = 0.25 + i * 0.004;
    pts.push(new Vector3(Math.cos(a) * r, 0.04 + (i % 15) * 0.003, Math.sin(a) * r));
  }
  pts.push(new Vector3(1.5, 0.04, 0.8), new Vector3(2.4, 0.04, 0.4));
  const m = mesh(new TubeGeometry(new CatmullRomCurve3(pts), 160, 0.03, 6, false), makeMat('KEY_GREEN', { spec: 0.4 }));
  return m;
}

export { PlaneGeometry, DoubleSide };
