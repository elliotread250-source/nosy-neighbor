// Throwables and clutter. Every builder returns { obj, phys } where phys is
// the addDynamic options including item metadata: mass, noise (how loud an
// impact is), breaks (ceramic/glass shatter), squeak, bounce, lure type.
import { Group, Mesh, SphereGeometry, TorusGeometry, CylinderGeometry, IcosahedronGeometry, ConeGeometry } from 'three';
import { makeMat } from '../../art/Materials.js';
import { roundedBox, chamferCylinder, turned, smoothNormals } from '../../art/Geo.js';
import { bulge, rng } from '../../art/Warp.js';
import * as Tex from '../../art/CanvasTextures.js';

function mesh(geo, mat, cast = true) {
  const m = new Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

const BRIGHT = ['RED_TOY', 'BLUE_TOY', 'YELLOW_TOY', 'KEY_GREEN', 'TANGERINE', 'GRAPE', 'BUBBLEGUM', 'SKY_TOY'];

export const CLUTTER = {
  mug(name, color) {
    const g = new Group();
    const c = color ?? rng(name).pick(BRIGHT);
    g.add(mesh(chamferCylinder(0.055, 0.05, 0.11, 14, 0.012), makeMat(c, { spec: 0.4 })));
    const h = mesh(new TorusGeometry(0.035, 0.012, 6, 12), makeMat(c, { spec: 0.4 }));
    h.position.x = 0.06;
    g.add(h);
    return { obj: g, phys: { shape: 'cylinder', mass: 0.3, radius: 0.055, data: { item: 'mug', label: 'Mug', throwable: true, noise: 0.6, breaks: true } } };
  },
  plate(name) {
    const m = mesh(chamferCylinder(0.14, 0.11, 0.025, 20, 0.008), makeMat('FRIDGE', { spec: 0.4 }));
    return { obj: m, phys: { shape: 'cylinder', mass: 0.4, data: { item: 'plate', label: 'Plate', throwable: true, noise: 0.7, breaks: true } } };
  },
  vase(name) {
    const prof = [[0, 0], [0.07, 0], [0.11, 0.08], [0.1, 0.2], [0.05, 0.28], [0.06, 0.34], [0.05, 0.34]];
    const m = mesh(turned(prof, 16), makeMat(rng(name).pick(['SKY_TOY', 'BUBBLEGUM', 'RETRO_MINT']), { spec: 0.5 }));
    return { obj: m, phys: { shape: 'cylinder', mass: 0.6, data: { item: 'vase', label: 'Vase', throwable: true, noise: 0.8, breaks: true } } };
  },
  bottle(name) {
    const prof = [[0, 0], [0.05, 0], [0.055, 0.02], [0.055, 0.18], [0.025, 0.25], [0.02, 0.3], [0.022, 0.31], [0, 0.31]];
    const m = mesh(turned(prof, 14), makeMat('KEY_GREEN', { transparent: true, opacity: 0.8, spec: 0.7 }));
    return { obj: m, phys: { shape: 'cylinder', mass: 0.5, data: { item: 'bottle', label: 'Glass bottle', throwable: true, noise: 1.0, breaks: true, breaksGlass: true } } };
  },
  can(name, color) {
    const c = color ?? rng(name).pick(['RED_TOY', 'KEY_GREEN']);
    const m = mesh(chamferCylinder(0.035, 0.035, 0.12, 14, 0.008), makeMat(c, { spec: 0.6 }));
    return { obj: m, phys: { shape: 'cylinder', mass: 0.2, restitution: 0.3, data: { item: 'can', metal: true, label: 'Soda can', throwable: true, noise: 0.45, rolls: true } } };
  },
  paintCan(name) {
    const g = new Group();
    g.add(mesh(chamferCylinder(0.1, 0.1, 0.18, 16, 0.01), makeMat('METAL', { spec: 0.4 })));
    const lid = mesh(chamferCylinder(0.095, 0.095, 0.02, 16, 0.006), makeMat(rng(name).pick(BRIGHT)));
    lid.position.y = 0.1;
    const h = mesh(new TorusGeometry(0.1, 0.006, 4, 16, Math.PI), makeMat('METAL_DARK'));
    h.position.y = 0.09;
    g.add(lid, h);
    return { obj: g, phys: { shape: 'cylinder', mass: 1.5, data: { item: 'paintCan', metal: true, label: 'Paint can', throwable: true, noise: 0.75, breaksGlass: true } } };
  },
  apple(name) {
    const g = new Group();
    const b = new SphereGeometry(0.045, 12, 10);
    b.scale(1, 0.9, 1);
    g.add(mesh(b, makeMat('RED_TOY', { spec: 0.5 })));
    const st = mesh(chamferCylinder(0.005, 0.006, 0.03, 4, 0.002), makeMat('WOOD_DARK'));
    st.position.y = 0.045;
    g.add(st);
    return { obj: g, phys: { shape: 'ball', radius: 0.045, mass: 0.2, data: { item: 'apple', label: 'Apple', throwable: true, noise: 0.25 } } };
  },
  banana(name) {
    const g = new TorusGeometry(0.09, 0.025, 8, 14, Math.PI * 0.7);
    const m = mesh(g, makeMat('YELLOW_TOY', { spec: 0.3 }));
    return { obj: m, phys: { mass: 0.15, data: { item: 'banana', label: 'Banana', throwable: true, noise: 0.2 } } };
  },
  chickenLeg(name) {
    const g = new Group();
    const meat = new SphereGeometry(0.06, 12, 10);
    meat.scale(1.3, 1, 1);
    g.add(mesh(meat, makeMat('TANGERINE', { spec: 0.3 })));
    const bone = mesh(chamferCylinder(0.015, 0.015, 0.1, 6, 0.006), makeMat('FRIDGE'));
    bone.rotation.z = Math.PI / 2;
    bone.position.x = 0.1;
    g.add(bone);
    return { obj: g, phys: { mass: 0.2, data: { item: 'chicken', label: 'Chicken leg', throwable: true, noise: 0.25 } } };
  },
  book(name) {
    const r = rng(name);
    const g = new Group();
    const w = r.range(0.14, 0.2), h = r.range(0.2, 0.28), d = r.range(0.04, 0.07);
    g.add(mesh(roundedBox(w, h, d, 0.012, 2), makeMat(r.pick(BRIGHT))));
    const pages = mesh(roundedBox(w - 0.02, h - 0.02, d * 0.8, 0.005, 1), makeMat('FRIDGE'));
    pages.position.x = 0.012;
    g.add(pages);
    return { obj: g, phys: { mass: 0.5, data: { item: 'book', label: 'Book', throwable: true, noise: 0.5 } } };
  },
  toyCar(name) {
    const g = new Group();
    const c = rng(name).pick(BRIGHT);
    g.add(mesh(roundedBox(0.18, 0.06, 0.09, 0.025, 2), makeMat(c, { spec: 0.5 })));
    const top = mesh(roundedBox(0.09, 0.05, 0.08, 0.02, 2), makeMat(c, { spec: 0.5 }));
    top.position.set(-0.01, 0.05, 0);
    g.add(top);
    for (const [x, z] of [[-0.055, 0.045], [0.055, 0.045], [-0.055, -0.045], [0.055, -0.045]]) {
      const w = mesh(chamferCylinder(0.022, 0.022, 0.02, 10, 0.006), makeMat('BLACK_SOFT'));
      w.rotation.x = Math.PI / 2;
      w.position.set(x, -0.03, z);
      g.add(w);
    }
    return { obj: g, phys: { mass: 0.2, data: { item: 'toyCar', metal: true, label: 'Toy car', throwable: true, noise: 0.35 } } };
  },
  block(name) {
    const r = rng(name);
    const m = mesh(roundedBox(0.1, 0.1, 0.1, 0.015, 2), makeMat(r.pick(BRIGHT)));
    return { obj: m, phys: { mass: 0.15, data: { item: 'block', label: 'Toy block', throwable: true, noise: 0.35 } } };
  },
  duck(name) {
    const g = new Group();
    const body = new SphereGeometry(0.07, 14, 10);
    body.scale(1.3, 0.9, 1);
    g.add(mesh(body, makeMat('YELLOW_TOY', { spec: 0.5 })));
    const head = mesh(new SphereGeometry(0.045, 12, 10), makeMat('YELLOW_TOY', { spec: 0.5 }));
    head.position.set(0.05, 0.07, 0);
    const beak = mesh(new ConeGeometry(0.02, 0.05, 8), makeMat('TANGERINE'));
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.1, 0.065, 0);
    g.add(head, beak);
    return { obj: g, phys: { shape: 'ball', radius: 0.07, mass: 0.1, restitution: 0.5, data: { item: 'duck', label: 'Rubber duck', throwable: true, noise: 0.4, squeak: true } } };
  },
  ball(name) {
    const m = mesh(new IcosahedronGeometry(0.11, 3), makeMat(rng(name).pick(BRIGHT), { spec: 0.5, rim: 0.3 }));
    return { obj: m, phys: { shape: 'ball', radius: 0.11, mass: 0.25, restitution: 0.82, data: { item: 'ball', label: 'Toy ball', throwable: true, noise: 0.4, bounce: true } } };
  },
  alarmClock(name) {
    const g = new Group();
    g.add(mesh(chamferCylinder(0.08, 0.08, 0.06, 18, 0.015), makeMat('RED_TOY', { spec: 0.4 })));
    g.children[0].rotation.x = Math.PI / 2;
    const face = mesh(chamferCylinder(0.065, 0.065, 0.01, 18, 0.003), makeMat('FRIDGE'));
    face.rotation.x = Math.PI / 2;
    face.position.z = 0.032;
    g.add(face);
    for (const s of [-1, 1]) {
      const bell = mesh(new SphereGeometry(0.035, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), makeMat('BRASS', { spec: 0.6 }));
      bell.position.set(s * 0.05, 0.08, 0);
      bell.rotation.z = -s * 0.5;
      g.add(bell);
    }
    return { obj: g, phys: { mass: 0.4, data: { item: 'alarmClock', label: 'Alarm clock', throwable: true, noise: 0.55, lure: 'alarm' } } };
  },
  cone(name) {
    const g = new Group();
    const c = chamferCylinder(0.02, 0.16, 0.55, 14, 0.015, { bottom: true });
    g.add(mesh(c, makeMat('TANGERINE', { spec: 0.3 })));
    const band = mesh(chamferCylinder(0.11, 0.13, 0.08, 14, 0.01, { bottom: true }), makeMat('WHITE'));
    band.position.y = 0.22;
    g.add(band);
    const base = mesh(roundedBox(0.38, 0.04, 0.38, 0.015, 2, { bottom: true }), makeMat('TANGERINE'));
    g.add(base);
    return { obj: g, phys: { mass: 1.2, data: { item: 'cone', label: 'Traffic cone', throwable: true, noise: 0.4 } } };
  },
  newspaper(name) {
    const m = mesh(roundedBox(0.3, 0.02, 0.22, 0.006, 1), makeMat('WHITE', { map: Tex.label('THE DAILY\nGAZETTE', { bg: 'FRIDGE', fg: 'BLACK_SOFT', size: 60 }) }));
    return { obj: m, phys: { mass: 0.2, data: { item: 'newspaper', label: 'Newspaper', throwable: true, noise: 0.15 } } };
  },
  remote(name) {
    const g = new Group();
    g.add(mesh(roundedBox(0.05, 0.025, 0.17, 0.012, 2), makeMat('BLACK_SOFT')));
    const b = mesh(new SphereGeometry(0.012, 6, 4), makeMat('RED_TOY'));
    b.position.set(0, 0.015, 0.05);
    g.add(b);
    return { obj: g, phys: { mass: 0.15, data: { item: 'remote', label: 'TV remote', throwable: true, noise: 0.3, lure: 'tvRemote' } } };
  },
  snowGlobe(name) {
    const g = new Group();
    g.add(mesh(chamferCylinder(0.06, 0.07, 0.04, 14, 0.01, { bottom: true }), makeMat('WOOD_DARK')));
    const glass = mesh(new SphereGeometry(0.065, 14, 10), makeMat('GLASS', { transparent: true, opacity: 0.5, spec: 0.8 }));
    glass.position.y = 0.09;
    const house = mesh(roundedBox(0.04, 0.05, 0.04, 0.01, 1), makeMat('NH_SIDING_MAIN'));
    house.position.y = 0.07;
    g.add(glass, house);
    return { obj: g, phys: { mass: 0.5, data: { item: 'snowGlobe', label: 'Snow globe', throwable: true, noise: 0.8, breaks: true } } };
  },
  toyTrain(name) {
    const g = new Group();
    for (let i = 0; i < 3; i++) {
      const car = mesh(roundedBox(0.12, 0.08, 0.07, 0.02, 2), makeMat(BRIGHT[i], { spec: 0.4 }));
      car.position.x = i * 0.14 - 0.14;
      g.add(car);
    }
    const chimney = mesh(chamferCylinder(0.015, 0.02, 0.05, 8, 0.005), makeMat('BLACK_SOFT'));
    chimney.position.set(-0.17, 0.06, 0);
    g.add(chimney);
    return { obj: g, phys: { mass: 0.6, half: { x: 0.21, y: 0.045, z: 0.04 }, data: { item: 'toyTrain', label: 'Toy train', throwable: true, noise: 0.45 } } };
  },
  stuffed(name, scale = 1) {
    const g = new Group();
    const c = rng(name).pick(['TANGERINE', 'BUBBLEGUM', 'SKY_TOY', 'WOOD_LIGHT']);
    const body = new SphereGeometry(0.16 * scale, 14, 10);
    body.scale(1, 1.15, 0.85);
    g.add(mesh(body, makeMat(c)));
    const head = mesh(new SphereGeometry(0.12 * scale, 14, 10), makeMat(c));
    head.position.y = 0.24 * scale;
    g.add(head);
    for (const s of [-1, 1]) {
      const ear = mesh(new SphereGeometry(0.05 * scale, 10, 8), makeMat(c));
      ear.position.set(s * 0.09 * scale, 0.34 * scale, 0);
      const eye = mesh(new SphereGeometry(0.018 * scale, 8, 6), makeMat('BLACK_SOFT'));
      eye.position.set(s * 0.045 * scale, 0.27 * scale, 0.1 * scale);
      g.add(ear, eye);
    }
    return { obj: g, phys: { mass: 0.4 * scale, data: { item: 'plush', label: 'Stuffed animal', throwable: true, noise: 0.1 } } };
  },
  bucket(name) {
    const g = new Group();
    const b = chamferCylinder(0.15, 0.12, 0.28, 16, 0.02, { bottom: true });
    g.add(mesh(b, makeMat('SKY_TOY', { spec: 0.3 })));
    const h = mesh(new TorusGeometry(0.15, 0.008, 4, 16, Math.PI), makeMat('METAL_DARK'));
    h.position.y = 0.28;
    g.add(h);
    return { obj: g, phys: { shape: 'cylinder', mass: 1.0, data: { item: 'bucket', metal: true, label: 'Bucket', throwable: true, noise: 0.6 } } };
  },
  smallBox(name, s = 0.4) {
    const g = new Group();
    g.add(mesh(roundedBox(s, s * 0.75, s, 0.02, 2), makeMat('CARDBOARD')));
    const tape = mesh(roundedBox(s * 0.18, s * 0.77, s * 1.01, 0.008, 1), makeMat('CARDBOARD_TAPE'), false);
    g.add(tape);
    return { obj: g, phys: { mass: 1 + s * 4, half: { x: s / 2, y: s * 0.375, z: s / 2 }, data: { item: 'box', label: 'Cardboard box', throwable: s < 0.5, noise: 0.25, climbable: s >= 0.5 } } };
  },
  chair(name, builder) {
    return { obj: builder(name), phys: { mass: 4, half: { x: 0.24, y: 0.6, z: 0.23 }, data: { item: 'chair', label: 'Chair', throwable: true, noise: 0.7, heavy: true } } };
  },
  jello(name) {
    const prof = [[0, 0], [0.11, 0], [0.12, 0.03], [0.09, 0.07], [0.1, 0.1], [0.07, 0.14], [0.03, 0.15], [0, 0.15]];
    const m = mesh(turned(prof, 16), makeMat('KEY_GREEN', { transparent: true, opacity: 0.8, spec: 0.7, emissive: 'KEY_GREEN', emissiveIntensity: 0.15 }));
    return { obj: m, phys: { mass: 0.5, data: { item: 'jello', label: 'Jello', throwable: true, noise: 0.2, wobbly: true } } };
  },
};

export { CylinderGeometry, smoothNormals, bulge };
