// Milestone 1 style-test yard: a lawn, a path, a handful of warped colored
// objects that exercise every warp, a climbable crate stack, steps, and a
// few physics toys. Replaced by the real neighborhood in Milestone 3.
import { Group, Mesh, Vector3, Quaternion, Euler, PlaneGeometry, SphereGeometry, CapsuleGeometry, IcosahedronGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { makeMat } from '../art/Materials.js';
import { roundedBox, chamferCylinder, turned, smoothNormals } from '../art/Geo.js';
import { lean, taper, bulge, twist, wobble, sag, skewTop, bend, furnitureWarp, rng, seedFrom } from '../art/Warp.js';
import * as Tex from '../art/CanvasTextures.js';
import { CONFIG } from '../config.js';

const DEG = Math.PI / 180;

export function buildTestScene(scene, physics) {
  const root = new Group();
  root.name = 'testScene';
  scene.add(root);

  const add = (mesh, { cast = true, receive = true, collide = true } = {}) => {
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    root.add(mesh);
    if (collide) physics.addStaticFromMesh(mesh);
    return mesh;
  };

  // ---- Lawn ----
  const grassMat = makeMat('WHITE', { map: Tex.grass(), rim: 0 });
  const ground = new Mesh(new PlaneGeometry(400, 400), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  // world-meter UVs for the plane
  const uv = ground.geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 400, uv.getY(i) * 400);
  root.add(ground);
  physics.addStaticBox(new Vector3(0, -0.5, 0), new Vector3(200, 0.5, 200));

  // ---- Path of chunky pavers ----
  const sidewalk = makeMat('SIDEWALK');
  for (let i = 0; i < 9; i++) {
    const r = rng(`paver${i}`);
    const g = roundedBox(1.5, 0.12, 1.3, 0.04, 3);
    wobble(g, 0.02, 1.2, seedFrom(`paver${i}`));
    smoothNormals(g);
    const m = new Mesh(g, sidewalk);
    m.position.set(r.range(-0.08, 0.08), 0.03, 6 - i * 1.45);
    m.rotation.y = r.range(-3, 3) * DEG;
    add(m, { cast: false, collide: false });
  }

  // ---- A leaning mustard "house chunk" with siding and a white trim cap ----
  {
    const g = roundedBox(4, 5.5, 3.5, 0.12, 3, { bottom: true });
    taper(g, 1.06, 1);
    lean(g, 3.5, 'x');
    wobble(g, 0.01, 1.2, seedFrom('chunk'));
    smoothNormals(g);
    const m = new Mesh(g, makeMat('WHITE', { map: Tex.siding('NH_SIDING_MAIN') }));
    m.position.set(-8, 0, -9);
    add(m);
    // roof wedge: a squashed, sagging, brick-red block
    const rg = roundedBox(4.9, 0.5, 4.3, 0.12, 3, { bottom: true });
    sag(rg, 0.12, 'x');
    smoothNormals(rg);
    const roof = new Mesh(rg, makeMat('WHITE', { map: Tex.shingles('NH_ROOF') }));
    roof.position.set(-8 + Math.tan(3.5 * DEG) * 5.5, 5.5, -9);
    roof.rotation.z = -2 * DEG;
    add(roof);
    // tall narrow window with blue shutters
    const frame = new Mesh(roundedBox(1.1, 1.8, 0.18, 0.05, 3), makeMat('NH_TRIM'));
    frame.position.set(-8 + Math.tan(3.5 * DEG) * 2.4, 2.4, -9 + 1.82);
    add(frame, { collide: false });
    const glass = new Mesh(roundedBox(0.85, 1.55, 0.06, 0.02, 2), makeMat('WHITE', { map: Tex.glassGlare(), rim: 0.1, spec: 0.5 }));
    glass.position.copy(frame.position).add(new Vector3(0, 0, 0.07));
    add(glass, { collide: false, cast: false });
    for (const s of [-1, 1]) {
      const sh = new Mesh(roundedBox(0.42, 1.75, 0.08, 0.03, 2), makeMat('NH_SHUTTERS'));
      sh.position.copy(frame.position).add(new Vector3(s * 0.8, 0, 0.02));
      if (s > 0) sh.rotation.z = -12 * DEG; // the dangling one
      add(sh, { collide: false });
    }
    // twisted, tapering brick chimney
    const cg = roundedBox(0.9, 7.5, 0.9, 0.08, 3, { bottom: true, midStep: 0.3 });
    taper(cg, 0.78, 1);
    twist(cg, 12);
    lean(cg, -2.5, 'x');
    smoothNormals(cg);
    const ch = new Mesh(cg, makeMat('WHITE', { map: Tex.brick('NH_ROOF') }));
    ch.position.set(-10.6, 0, -9.6);
    add(ch);
  }

  // ---- Tall narrow red door in a skewed, chunky frame ----
  {
    const fg = roundedBox(1.35, 3.05, 0.3, 0.06, 3, { bottom: true });
    skewTop(fg, 0.05, 0);
    smoothNormals(fg);
    const frame = new Mesh(fg, makeMat('NH_TRIM'));
    frame.position.set(-3.2, 0, -7.5);
    add(frame);
    const dg = roundedBox(0.95, 2.75, 0.12, 0.04, 3, { bottom: true });
    skewTop(dg, 0.045, 0);
    smoothNormals(dg);
    const door = new Mesh(dg, makeMat('NH_DOOR_FRONT', { spec: 0.2 }));
    door.position.set(-3.2, 0.06, -7.32);
    add(door, { collide: false });
    const knob = new Mesh(new SphereGeometry(0.06, 16, 12), makeMat('BRASS', { spec: 0.6, rim: 0.3 }));
    knob.position.set(-3.2 + 0.33, 1.15, -7.2);
    add(knob, { collide: false });
  }

  // ---- Furniture lineup: wardrobe, fridge, bookshelf, lamp ----
  {
    // Wardrobe: tapered 1.12 at top, leans 2 degrees forward
    const g = roundedBox(1.2, 2.4, 0.7, 0.06, 3, { bottom: true });
    taper(g, 1.12, 1);
    lean(g, 2, 'z');
    wobble(g, 0.012, 1.3, seedFrom('wardrobe'));
    smoothNormals(g);
    const w = new Mesh(g, makeMat('WOOD_MID'));
    w.position.set(1.5, 0, -8);
    add(w);
    const crown = new Mesh(roundedBox(1.5, 0.16, 0.9, 0.05, 3), makeMat('WOOD_DARK'));
    crown.position.set(1.5, 2.46, -8 + Math.tan(2 * DEG) * 2.4);
    add(crown, { collide: false });
    for (const s of [-1, 1]) {
      const k = new Mesh(new SphereGeometry(0.05, 14, 10), makeMat('BRASS', { spec: 0.6 }));
      k.position.set(1.5 + s * 0.09, 1.25, -8 + 0.42);
      add(k, { collide: false });
    }

    // Fridge: bulged, mint, glossy, with a fat chrome handle
    const fg = roundedBox(0.95, 1.9, 0.8, 0.14, 3, { bottom: true, midStep: 0.25 });
    bulge(fg, 0.08);
    lean(fg, -1.5, 'x');
    smoothNormals(fg);
    const fr = new Mesh(fg, makeMat('RETRO_MINT', { spec: 0.45 }));
    fr.position.set(3.4, 0, -8);
    add(fr);
    const hg = roundedBox(0.07, 0.6, 0.08, 0.03, 3);
    const handle = new Mesh(hg, makeMat('FRIDGE_HANDLE', { spec: 0.7 }));
    handle.position.set(3.4 + 0.3, 1.25, -8 + 0.5);
    add(handle, { collide: false });

    // Bookshelf leaning 5 degrees forward with fat colorful books
    const bg = roundedBox(1.3, 2.4, 0.4, 0.04, 3, { bottom: true });
    lean(bg, 5, 'z');
    smoothNormals(bg);
    const shelf = new Mesh(bg, makeMat('WOOD_LIGHT'));
    shelf.position.set(5.6, 0, -8.2);
    add(shelf);
    const bookColors = ['RED_TOY', 'BLUE_TOY', 'YELLOW_TOY', 'KEY_GREEN', 'TANGERINE', 'GRAPE', 'BUBBLEGUM'];
    const r = rng('books');
    for (let row = 0; row < 3; row++) {
      let x = -0.52;
      while (x < 0.5) {
        const bw = r.range(0.07, 0.12), bh = r.range(0.28, 0.42);
        const bkg = roundedBox(bw, bh, 0.26, 0.015, 2, { bottom: true });
        const book = new Mesh(bkg, makeMat(r.pick(bookColors)));
        const y = 0.35 + row * 0.7;
        book.position.set(5.6 + x + bw / 2, y, -8.2 + 0.08 + Math.tan(5 * DEG) * y);
        book.rotation.z = r.next() < 0.15 ? r.range(-12, 12) * DEG : 0;
        add(book, { collide: false, cast: false });
        x += bw + 0.01;
      }
      const plank = new Mesh(roundedBox(1.26, 0.06, 0.38, 0.02, 2), makeMat('WOOD_MID'));
      const py = 0.32 + row * 0.7;
      plank.position.set(5.6, py, -8.2 + Math.tan(5 * DEG) * py);
      add(plank, { collide: false, cast: false });
    }

    // Gigantic floor lamp, bent stem, glowing drum shade
    const stem = chamferCylinder(0.045, 0.06, 2.3, 12, 0.02, { bottom: true });
    bend(stem, 18, 'x');
    smoothNormals(stem);
    const lampStem = new Mesh(stem, makeMat('METAL_DARK', { spec: 0.4 }));
    lampStem.position.set(7.4, 0, -7.8);
    add(lampStem, { collide: false });
    const base = new Mesh(chamferCylinder(0.28, 0.32, 0.08, 20, 0.03), makeMat('METAL_DARK'));
    base.position.set(7.4, 0.04, -7.8);
    add(base, { collide: false });
    const shadeG = chamferCylinder(0.36, 0.42, 0.42, 24, 0.03);
    const shade = new Mesh(shadeG, makeMat('LAMPSHADE', { emissive: 'LAMPSHADE_GLOW', emissiveIntensity: 0.55, rim: 0.2 }));
    shade.position.set(7.4 + 0.36, 2.35, -7.8);
    shade.rotation.z = -10 * DEG;
    add(shade, { collide: false });
  }

  // ---- Steps to test autostep (0.22 rise, 0.26 run: steep) ----
  for (let i = 0; i < 6; i++) {
    const h = 0.22 * (i + 1);
    const g = roundedBox(1.6, h, 0.26 + 0.02, 0.03, 2, { bottom: true });
    const m = new Mesh(g, makeMat('WOOD_LIGHT'));
    m.position.set(9, 0, -2 - i * 0.26);
    add(m);
  }
  {
    const top = new Mesh(roundedBox(1.6, 1.32, 2, 0.06, 3, { bottom: true }), makeMat('WOOD_MID'));
    top.position.set(9, 0, -4.6);
    add(top);
  }

  // ---- Climbable crate stack and loose cardboard boxes (dynamic) ----
  const crateMat = makeMat('WOOD_LIGHT', { map: Tex.woodPlanks('WOOD_LIGHT', 4) });
  const boxMat = makeMat('CARDBOARD');
  const tapeMat = makeMat('CARDBOARD_TAPE');
  const crates = [
    [5, 0.5, -2, 0], [5.05, 1.5, -2.05, 8], [6.1, 0.5, -2.1, -6],
  ];
  for (const [x, y, z, rot] of crates) {
    const m = new Mesh(roundedBox(1, 1, 1, 0.06, 3), crateMat);
    m.position.set(x, y, z);
    m.rotation.y = rot * DEG;
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    physics.addDynamic(m, { mass: 10, friction: 0.9 });
  }
  const br = rng('boxes');
  for (let i = 0; i < 5; i++) {
    const s = br.range(0.45, 0.75);
    const g = new Group();
    const body = new Mesh(roundedBox(s, s * 0.8, s, 0.03, 2), boxMat);
    const tape = new Mesh(roundedBox(s * 0.18, s * 0.82, s * 1.01, 0.01, 1), tapeMat);
    body.castShadow = body.receiveShadow = true;
    g.add(body, tape);
    g.position.set(-1 + br.range(-1.5, 1.5), s * 0.4 + 0.01 + (i > 2 ? 0.9 : 0), 1 + br.range(-1, 1));
    g.rotation.y = br.range(0, Math.PI);
    root.add(g);
    physics.addDynamic(g, { mass: 3, half: { x: s / 2, y: s * 0.4, z: s / 2 } });
  }
  // a bouncy toy ball and a rubber-duck yellow ball
  for (const [col, x] of [['RED_TOY', 1.5], ['YELLOW_TOY', 2.3], ['BLUE_TOY', 3.1]]) {
    const m = new Mesh(new IcosahedronGeometry(0.18, 3), makeMat(col, { spec: 0.5, rim: 0.3 }));
    m.position.set(x, 0.4, 2);
    m.castShadow = true;
    root.add(m);
    physics.addDynamic(m, { shape: 'ball', radius: 0.18, mass: 0.4, restitution: 0.75 });
  }

  // ---- Character-sized test capsule (style probe for outlines in M2) ----
  {
    const g = new CapsuleGeometry(0.42, 1.1, 8, 24, 8);
    bulge(g, 0.12);
    const m = new Mesh(g, makeMat('NB_VEST_DARK', { rim: CONFIG.toon.rimStrengthCharacter }));
    m.position.set(-2, 0.97, -3);
    add(m);
    const head = new Mesh(new SphereGeometry(0.3, 32, 24), makeMat('NB_SKIN', { rim: CONFIG.toon.rimStrengthCharacter, skin: true }));
    head.scale.set(1, 1.15, 1);
    head.position.set(-2, 2.0, -3);
    add(head, { collide: false });
    const nose = new Mesh(new SphereGeometry(0.06, 20, 14), makeMat('NB_NOSE', { spec: 0.5, skin: true }));
    nose.position.set(-2, 1.95, -2.72);
    add(nose, { collide: false });
  }

  // ---- A wonky picket fence ----
  {
    const fr = rng('fence');
    const picketMat = makeMat('PH_TRIM');
    for (let s = 0; s < 3; s++) {
      const section = new Group();
      for (let p = 0; p < 8; p++) {
        const g = roundedBox(0.12, 1.0, 0.05, 0.02, 2, { bottom: true });
        // pointed top
        const pos = g.attributes.position;
        for (let v = 0; v < pos.count; v++) if (pos.getY(v) > 0.92) pos.setY(v, pos.getY(v) + (0.06 - Math.abs(pos.getX(v))) * 1.2);
        smoothNormals(g);
        const pk = new Mesh(g, picketMat);
        pk.position.set(p * 0.25, 0, 0);
        pk.rotation.z = fr.range(-3, 3) * DEG;
        pk.castShadow = pk.receiveShadow = true;
        section.add(pk);
      }
      for (const y of [0.25, 0.7]) {
        const rg = roundedBox(2.05, 0.09, 0.05, 0.02, 2);
        sag(rg, 0.015, 'x');
        smoothNormals(rg);
        const rail = new Mesh(rg, picketMat);
        rail.position.set(0.9, y, -0.05);
        rail.castShadow = true;
        section.add(rail);
      }
      section.position.set(-12 + s * 2.05, 0, 4);
      section.rotation.z = fr.range(-2, 2) * DEG;
      section.rotation.y = fr.range(-1.5, 1.5) * DEG;
      root.add(section);
      physics.addStaticBox(new Vector3(-12 + s * 2.05 + 0.9, 0.5, 4), new Vector3(1.0, 0.5, 0.06));
    }
  }

  // ---- A twisted cartoon tree ----
  {
    const tr = rng('tree');
    const tg = chamferCylinder(0.22, 0.42, 3.4, 14, 0.06, { bottom: true, heightSegs: 10 });
    twist(tg, 22);
    bend(tg, 9, 'z');
    wobble(tg, 0.03, 2, seedFrom('trunk'));
    smoothNormals(tg);
    const trunk = new Mesh(tg, makeMat('WOOD_MID'));
    trunk.position.set(-6, 0, 1);
    add(trunk);
    const crownParts = [];
    for (let i = 0; i < 6; i++) {
      const g = new IcosahedronGeometry(1, 3);
      const s = tr.range(0.9, 1.5);
      g.scale(s, s * 0.82, s);
      g.translate(tr.range(-1.1, 1.1), tr.range(-0.3, 0.7), tr.range(-1.1, 1.1));
      crownParts.push(g);
    }
    const half = Math.ceil(crownParts.length / 2);
    const cA = new Mesh(smoothNormals(mergeGeometries(crownParts.slice(0, half))), makeMat('GRASS_DARK', { rim: 0.2 }));
    const cB = new Mesh(smoothNormals(mergeGeometries(crownParts.slice(half))), makeMat('GRASS', { rim: 0.2 }));
    for (const c of [cA, cB]) {
      c.position.set(-6 + Math.sin(9 * DEG) * 3.4 * 0.5, 4.0, 1.25);
      add(c, { collide: false });
    }
    // gumdrop bushes
    for (let i = 0; i < 4; i++) {
      const b = new Mesh(new SphereGeometry(0.55, 24, 16), makeMat(i % 2 ? 'GRASS_DARK' : 'GRASS', { rim: 0.2 }));
      b.scale.set(1, 0.8, 1);
      b.position.set(-12.5 + i * 1.3, 0.38, -4);
      add(b, { collide: false });
    }
  }

  // ---- Turned dining-table leg sculpture + table ----
  {
    const top = new Mesh(roundedBox(1.8, 0.08, 1.0, 0.03, 3), makeMat('WOOD_MID'));
    top.position.set(-1, 0.86, -7.8);
    add(top);
    const legProfile = [[0, 0], [0.06, 0], [0.07, 0.03], [0.05, 0.12], [0.035, 0.28], [0.075, 0.42], [0.04, 0.56], [0.045, 0.72], [0.06, 0.78], [0.06, 0.82], [0, 0.82]];
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const leg = new Mesh(turned(legProfile, 14), makeMat('WOOD_DARK'));
      leg.position.set(-1 + sx * 0.78, 0, -7.8 + sz * 0.4);
      add(leg, { collide: false });
    }
    const mug = new Mesh(chamferCylinder(0.06, 0.055, 0.12, 16, 0.015), makeMat('TOMATO', { spec: 0.4 }));
    mug.position.set(-1.4, 0.96, -7.7);
    root.add(mug);
    mug.castShadow = true;
    physics.addDynamic(mug, { shape: 'cylinder', mass: 0.3 });
  }

  return { root, spawn: new Vector3(0, 0, 9), spawnYaw: 0 };
}
