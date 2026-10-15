// Mr. Harold Grimsby: built from primitives on a rigid bone hierarchy.
// A children's TV dad who's been awake for three days.
//
// root (feet) > hips > torso > chest > neck > head (+ face rig)
//                             chest > shoulderL/R > upperArm > forearm > hand > fingers
//              hips > thighL/R > shin > foot
import {
  Group, Mesh, Vector3, Quaternion, Euler, SphereGeometry, CapsuleGeometry, TorusGeometry, CylinderGeometry,
  LatheGeometry, Vector2, CatmullRomCurve3, TubeGeometry, Shape, ExtrudeGeometry, MathUtils, Object3D, Color,
  CanvasTexture, SRGBColorSpace, RepeatWrapping,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { makeMat } from '../art/Materials.js';
import { Palette } from '../art/Palette.js';
import { roundedBox, chamferCylinder, smoothNormals } from '../art/Geo.js';
import { taper, bulge, wobble, seedFrom } from '../art/Warp.js';
import * as Tex from '../art/CanvasTextures.js';
import { addOutline, setOutlineScale } from '../art/Outline.js';
import { bakeDeep } from '../art/Bake.js';
import { CONFIG } from '../config.js';

const DEG = Math.PI / 180;
const RIM = CONFIG.toon.rimStrengthCharacter;
const _v = new Vector3();
const _q = new Quaternion();
const _m = new Object3D();
const _gazeOrigin = new Vector3(0, 0.222, 0.124);

// Expression presets (targets blended over ~0.2 s)
// brow: raise (m), slant (rad, + = inner ends down), innerUp (sad);
// lidU: upper lid angle (rad, -0.64 = top 20% covered, -1.25 = wide, +1.4 = shut), lidL lower lid
export const EXPRESSIONS = {
  suspicious: { browRaise: 0.0, browSlant: 0.32, browAsym: 0, lidU: -0.64, lidL: 0.05, pupil: 1.0, mouth: 0.0, nose: 0, stache: 0, tilt: 0 },
  curious: { browRaise: 0.012, browSlant: 0.1, browAsym: 0.025, lidU: -0.85, lidL: 0.0, pupil: 1.1, mouth: 0.05, nose: 0, stache: 0, tilt: 10 },
  alarmed: { browRaise: 0.03, browSlant: -0.2, browAsym: 0, lidU: -1.3, lidL: -0.2, pupil: 0.7, mouth: 0.35, nose: 0.2, stache: 0.1, tilt: 0 },
  angry: { browRaise: -0.01, browSlant: 0.6, browAsym: 0, lidU: -0.35, lidL: 0.15, pupil: 1.2, mouth: 0.55, nose: 1, stache: -0.05, tilt: 0 },
  satisfied: { browRaise: 0.006, browSlant: 0.05, browAsym: 0, lidU: 0.15, lidL: 0.2, pupil: 1.0, mouth: 0.0, nose: 0, stache: 0.25, tilt: 4 },
  sad: { browRaise: 0.012, browSlant: -0.5, browAsym: 0, lidU: -0.8, lidL: 0.12, pupil: 1.25, mouth: 0.05, nose: 0.3, stache: -0.15, tilt: -6, glisten: 1 },
  sleepy: { browRaise: -0.005, browSlant: 0.0, browAsym: 0, lidU: 0.9, lidL: 0.25, pupil: 1.0, mouth: 0.1, nose: 0, stache: 0, tilt: -14 },
  scream: { browRaise: -0.012, browSlant: 0.7, browAsym: 0, lidU: -1.35, lidL: -0.25, pupil: 0.6, mouth: 1.0, nose: 1, stache: 0.3, tilt: 0 },
};

class Spring {
  constructor(k = 120, d = 9) { this.k = k; this.d = d; this.x = 0; this.v = 0; }
  update(dt, target = 0) {
    this.v += (-(this.x - target) * this.k - this.v * this.d) * dt;
    this.x += this.v * dt;
    return this.x;
  }
  kick(v) { this.v += v; }
}

function mesh(geo, mat, cast = true) {
  const m = new Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

export class Neighbor {
  constructor(scene) {
    this.root = new Group();
    this.root.name = 'grimsby';
    scene.add(this.root);
    this.bones = {};
    this.parts = {};
    this.mats = this._materials();
    this._build();
    this.exprName = 'suspicious';
    this.expr = { ...EXPRESSIONS.suspicious };
    this.exprTarget = { ...EXPRESSIONS.suspicious };
    this.blink = 0;
    this.blinkTimer = 3;
    this.lookTarget = null; // world-space point the eyes track
    this.eyeLimit = 35 * DEG;
    this.presence = 0;
    this.springs = {
      stacheL: new Spring(160, 8), stacheR: new Spring(160, 8), curl: new Spring(90, 5), belly: new Spring(140, 7),
    };
    this._prevHeadPos = new Vector3();
    this._prevHeadVel = new Vector3();
    this._prevRootY = 0;
    this.noseHeat = 0;
    this.time = 0;
    this._finish();
  }

  _materials() {
    const u = { unique: true };
    return {
      skin: makeMat('NB_SKIN', { rim: RIM, skin: true, ...u }),
      nose: makeMat('NB_NOSE', { rim: RIM, spec: 0.55, skin: true, ...u }),
      cheek: makeMat('NB_CHEEKS', { rim: RIM, skin: true, ...u }),
      ear: makeMat('NB_SKIN', { rim: RIM, skin: true, ...u }),
      earIn: makeMat('NB_CHEEKS', { rim: 0.1, skin: true, ...u }),
      hair: makeMat('NB_HAIR', { rim: RIM, ...u }),
      stache: makeMat('NB_MUSTACHE', { rim: RIM, ...u }),
      brow: makeMat('NB_EYEBROWS', { rim: 0.2, ...u }),
      eyeWhite: makeMat('NB_EYE_WHITE', { rim: 0.15, spec: 0.7, ...u }),
      iris: makeMat('NB_IRIS', { rim: 0.0, spec: 0.8, ...u }),
      pupil: makeMat('NB_PUPIL', { rim: 0.0, spec: 0.9, ...u }),
      bags: makeMat('NB_EYE_BAGS', { rim: 0.1, skin: true, ...u }),
      mouth: makeMat('BLACK_SOFT', { rim: 0, ...u }),
      tongue: makeMat('CARPET_RED', { rim: 0, ...u }),
      teeth: makeMat('NB_EYE_WHITE', { rim: 0, ...u }),
      shirt: makeMat('NB_SHIRT', { rim: RIM, ...u }),
      vest: makeMat('WHITE', { map: vestTexture(), rim: RIM, ...u }),
      vestRib: makeMat('NB_VEST_DARK', { rim: RIM, ...u }),
      pants: makeMat('WHITE', { map: plaid(), rim: RIM, ...u }),
      belt: makeMat('NB_BELT', { rim: RIM, ...u }),
      buckle: makeMat('NB_BUCKLE', { rim: RIM, spec: 0.7, ...u }),
      glove: makeMat('NB_GLOVES', { rim: 0.55, spec: 0.65, ...u }),
      sock: makeMat('BLACK_SOFT', { rim: RIM, ...u }),
      shoe: makeMat('NB_SHOES', { rim: RIM, spec: 0.35, ...u }),
      sole: makeMat('WOOD_DARK', { rim: 0.2, ...u }),
      watch: makeMat('BRASS', { rim: 0.4, spec: 0.8, ...u }),
      watchFace: makeMat('FRIDGE', { rim: 0.2, ...u }),
    };
  }

  bone(name, parent, x = 0, y = 0, z = 0) {
    const b = new Group();
    b.name = name;
    b.position.set(x, y, z);
    (parent ?? this.root).add(b);
    this.bones[name] = b;
    b.userData.rest = { pos: b.position.clone(), rot: b.rotation.clone() };
    return b;
  }

  _build() {
    const M = this.mats;
    const hips = this.bone('hips', this.root, 0, 0.93, 0);
    const torso = this.bone('torso', hips, 0, 0.05, 0);
    const chest = this.bone('chest', torso, 0, 0.35, 0);
    const neck = this.bone('neck', chest, 0, 0.24, 0.035);
    const head = this.bone('head', neck, 0, 0.08, 0.02);
    chest.rotation.x = 0.1; // slight forward stoop
    neck.rotation.x = 0.06;

    // ---------------------------------------------------------- torso: pear body in an argyle vest
    {
      const prof = [[0.0, -0.11], [0.235, -0.11], [0.268, -0.05], [0.29, 0.04], [0.293, 0.12], [0.278, 0.22], [0.245, 0.31], [0.205, 0.4], [0.19, 0.48], [0.178, 0.55], [0.135, 0.61], [0.078, 0.635], [0.0, 0.64]];
      const geo = new LatheGeometry(prof.map(([r, y]) => new Vector2(r, y)), 28);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        z *= 0.86;
        // belly pushes forward and sags a bit
        if (z > 0) z += 0.07 * Math.max(0, Math.sin(Math.PI * MathUtils.clamp((y + 0.1) / 0.42, 0, 1)));
        // sloped shoulders: squash the top width
        if (y > 0.5) x *= 1 - (y - 0.5) * 0.4;
        pos.setXYZ(i, x, y, z);
      }
      smoothNormals(geo);
      const body = mesh(geo, M.vest);
      torso.add(body);
      this.parts.body = body;
      // hem rib band, shirt peeking out under it, belt
      const hem = mesh(new TorusGeometry(0.262, 0.024, 8, 28), M.vestRib);
      hem.rotation.x = Math.PI / 2;
      hem.scale.set(1, 0.92, 1);
      hem.position.set(0, -0.04, 0.01);
      torso.add(hem);
      const peek = mesh(new TorusGeometry(0.25, 0.017, 6, 24, Math.PI * 0.9), M.shirt);
      peek.rotation.set(Math.PI / 2, 0, Math.PI * 0.05);
      peek.position.set(0, -0.075, 0.03);
      torso.add(peek);
      // V-neck: mustard shirt wedge with a ribbed navy border, collar points folding out
      const v = new Shape();
      v.moveTo(-0.085, 0.0);
      v.lineTo(0.085, 0.0);
      v.lineTo(0.0, -0.17);
      v.closePath();
      const vGeo = new ExtrudeGeometry(v, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
      const vMesh = mesh(vGeo, M.shirt);
      vMesh.position.set(0, 0.6, 0.12);
      vMesh.rotation.x = -0.35;
      torso.add(vMesh);
      for (const s of [-1, 1]) {
        const rib = mesh(roundedBox(0.03, 0.2, 0.03, 0.01, 1), M.vestRib);
        rib.position.set(s * 0.048, 0.52, 0.152);
        rib.rotation.set(-0.35, 0, s * 0.47);
        torso.add(rib);
        const collar = new Shape();
        collar.moveTo(0, 0);
        collar.lineTo(s * 0.075, -0.015);
        collar.lineTo(s * 0.02, -0.075);
        collar.closePath();
        const cg = new ExtrudeGeometry(collar, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
        const c = mesh(cg, M.shirt);
        c.position.set(s * 0.02, 0.645, 0.075);
        c.rotation.x = -0.6;
        torso.add(c);
      }
      // armhole ribbing + shirt shoulders
      for (const s of [-1, 1]) {
        const sh = mesh(new SphereGeometry(0.085, 16, 12), M.shirt);
        sh.position.set(s * 0.225, 0.535, -0.01);
        sh.scale.set(1, 0.9, 1);
        torso.add(sh);
        const arm = mesh(new TorusGeometry(0.085, 0.018, 8, 20), M.vestRib);
        arm.position.set(s * 0.19, 0.5, -0.005);
        arm.rotation.set(0, Math.PI / 2, 0.2 * s);
        torso.add(arm);
      }
    }
    // ---------------------------------------------------------- hips: high-waisted plaid trousers, belt
    {
      const prof = [[0.0, -0.27], [0.17, -0.27], [0.235, -0.2], [0.255, -0.1], [0.25, 0.0], [0.24, 0.06], [0.0, 0.06]];
      const geo = new LatheGeometry(prof.map(([r, y]) => new Vector2(r, y)), 24);
      geo.scale(1, 1, 0.82);
      smoothNormals(geo);
      const pants = mesh(geo, M.pants);
      hips.add(pants);
      const belt = mesh(new TorusGeometry(0.248, 0.032, 8, 28), M.belt);
      belt.rotation.x = Math.PI / 2;
      belt.scale.set(1, 0.83, 0.9);
      belt.position.y = 0.0;
      hips.add(belt);
      const buckle = mesh(roundedBox(0.075, 0.06, 0.025, 0.012, 2), M.buckle);
      buckle.position.set(0, 0.0, 0.212);
      hips.add(buckle);
    }

    // ---------------------------------------------------------- neck + head
    {
      const n = mesh(chamferCylinder(0.078, 0.085, 0.16, 16, 0.02), M.skin);
      n.position.y = 0.03;
      neck.add(n);
      const collarRing = mesh(new TorusGeometry(0.083, 0.02, 8, 20), M.shirt);
      collarRing.rotation.x = Math.PI / 2 - 0.15;
      collarRing.position.y = -0.03;
      neck.add(collarRing);
    }
    this._buildHead(head);

    // ---------------------------------------------------------- arms
    for (const s of [-1, 1]) {
      const side = s < 0 ? 'R' : 'L'; // +x is his left
      const shoulder = this.bone(`shoulder${side}`, chest, s * 0.255, 0.21, -0.01);
      const upper = this.bone(`upperArm${side}`, shoulder, 0, 0, 0);
      upper.rotation.z = s * 0.2;
      const sleeve = mesh(new CapsuleGeometry(0.062, 0.3, 6, 14), M.shirt);
      sleeve.position.y = -0.17;
      upper.add(sleeve);
      const fore = this.bone(`forearm${side}`, upper, 0, -0.38, 0);
      fore.rotation.x = -0.12;
      fore.rotation.z = -s * 0.1;
      const roll = mesh(new TorusGeometry(0.06, 0.03, 8, 18), M.shirt);
      roll.rotation.x = Math.PI / 2;
      roll.position.y = -0.03;
      fore.add(roll);
      const elbowCap = mesh(new SphereGeometry(0.06, 12, 10), M.shirt);
      fore.add(elbowCap);
      // long black rubber glove, flared ribbed cuff
      const gl = chamferCylinder(0.06, 0.052, 0.28, 16, 0.015);
      const glove = mesh(gl, M.glove);
      glove.position.y = -0.2;
      fore.add(glove);
      const cuff = mesh(new TorusGeometry(0.066, 0.016, 8, 18), M.glove);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.y = -0.065;
      fore.add(cuff);
      for (let r = 0; r < 3; r++) {
        const rib = mesh(new TorusGeometry(0.063, 0.006, 4, 18), M.glove);
        rib.rotation.x = Math.PI / 2;
        rib.position.y = -0.085 - r * 0.012;
        fore.add(rib);
      }
      if (side === 'L') {
        // chunky gold watch worn over the glove
        const band = mesh(new TorusGeometry(0.058, 0.014, 6, 18), M.watch);
        band.rotation.x = Math.PI / 2;
        band.position.y = -0.3;
        fore.add(band);
        const face = mesh(chamferCylinder(0.03, 0.03, 0.016, 14, 0.005), M.watch);
        face.rotation.z = Math.PI / 2;
        face.position.set(0.058, -0.3, 0);
        fore.add(face);
        const glass = mesh(chamferCylinder(0.023, 0.023, 0.006, 14, 0.002), M.watchFace);
        glass.rotation.z = Math.PI / 2;
        glass.position.set(0.068, -0.3, 0);
        fore.add(glass);
      }
      const hand = this.bone(`hand${side}`, fore, 0, -0.34, 0);
      this._buildHand(hand, side, s);
    }

    // ---------------------------------------------------------- legs
    for (const s of [-1, 1]) {
      const side = s < 0 ? 'R' : 'L';
      const thigh = this.bone(`thigh${side}`, hips, s * 0.13, -0.1, 0);
      const tg = chamferCylinder(0.085, 0.112, 0.36, 16, 0.03);
      const tm = mesh(tg, M.pants);
      tm.position.y = -0.17;
      thigh.add(tm);
      const shin = this.bone(`shin${side}`, thigh, 0, -0.36, 0);
      const sg = chamferCylinder(0.09, 0.08, 0.31, 16, 0.025); // slightly flared at the cuff
      const sm = mesh(sg, M.pants);
      sm.position.y = -0.155;
      shin.add(sm);
      const knee = mesh(new SphereGeometry(0.085, 12, 10), M.pants);
      shin.add(knee);
      const sock = mesh(chamferCylinder(0.056, 0.056, 0.07, 12, 0.015), M.sock);
      sock.position.y = -0.33;
      shin.add(sock);
      const foot = this.bone(`foot${side}`, shin, 0, -0.38, 0);
      const shoeG = roundedBox(0.135, 0.1, 0.31, 0.05, 3, { midStep: 0.08 });
      bulge(shoeG, 0.08);
      smoothNormals(shoeG);
      const shoe = mesh(shoeG, M.shoe);
      shoe.position.set(0, -0.025, 0.07);
      foot.add(shoe);
      const toe = mesh(new SphereGeometry(0.07, 14, 10), M.shoe);
      toe.scale.set(1, 0.75, 1.0);
      toe.position.set(0, -0.03, 0.18);
      foot.add(toe);
      const sole = mesh(roundedBox(0.15, 0.035, 0.34, 0.015, 2), M.sole);
      sole.position.set(0, -0.075, 0.08);
      foot.add(sole);
      for (let i = 0; i < 3; i++) {
        const lace = mesh(roundedBox(0.07, 0.012, 0.014, 0.005, 1), M.sole);
        lace.position.set(0, 0.03, 0.04 + i * 0.03);
        lace.rotation.y = (i % 2 ? 1 : -1) * 0.3;
        foot.add(lace);
      }
    }
  }

  _buildHand(hand, side, s) {
    const M = this.mats;
    const palm = mesh(roundedBox(0.12, 0.12, 0.055, 0.025, 3), M.glove);
    palm.position.y = -0.055;
    hand.add(palm);
    const fingers = [];
    for (let i = 0; i < 4; i++) {
      const base = new Group();
      base.position.set(-0.042 + i * 0.028, -0.115, 0);
      const seg1 = mesh(new CapsuleGeometry(0.0165, 0.04, 4, 8), M.glove);
      seg1.position.y = -0.028;
      base.add(seg1);
      const tip = new Group();
      tip.position.y = -0.058;
      const seg2 = mesh(new CapsuleGeometry(0.0155, 0.032, 4, 8), M.glove);
      seg2.position.y = -0.022;
      tip.add(seg2);
      base.add(tip);
      base.userData.tip = tip;
      hand.add(base);
      fingers.push(base);
    }
    const thumb = new Group();
    thumb.position.set(-s * 0.06, -0.06, 0.02);
    const t1 = mesh(new CapsuleGeometry(0.018, 0.045, 4, 8), M.glove);
    t1.position.y = -0.03;
    thumb.add(t1);
    thumb.rotation.z = -s * 0.7;
    thumb.rotation.x = 0.4;
    hand.add(thumb);
    hand.userData.fingers = fingers;
    hand.userData.thumb = thumb;
    hand.rotation.x = 0.1;
  }

  _buildHead(head) {
    const M = this.mats;
    const face = new Group();
    face.name = 'face';
    head.add(face);
    this.face = face;
    // skull: egg-shaped, wider at cheeks and jaw, flat at the back
    {
      const g = new SphereGeometry(0.17, 40, 32);
      g.scale(1.06, 1.17, 0.97);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const t = MathUtils.clamp((y + 0.2) / 0.4, 0, 1); // 0 chin .. 1 crown
        const k = 1.12 + (0.94 - 1.12) * t; // bottom wider than top
        x *= k;
        if (z > 0) z *= 1 + (1 - t) * 0.08;
        if (z < -0.07) z = -0.07 + (z + 0.07) * 0.78; // flatter back
        pos.setXYZ(i, x, y, z);
      }
      smoothNormals(g);
      const skull = mesh(g, M.skin);
      skull.position.y = 0.2;
      face.add(skull);
      this.parts.skull = skull;
    }
    // ears: big, sticking out 20 degrees
    for (const s of [-1, 1]) {
      const eg = new SphereGeometry(0.05, 16, 12, 0, Math.PI);
      eg.scale(0.55, 1.35, 1);
      const ear = mesh(eg, M.ear);
      ear.position.set(s * 0.194, 0.2, -0.005);
      ear.rotation.set(0, s * (Math.PI / 2 - 20 * DEG), 0);
      face.add(ear);
      const inner = mesh(new SphereGeometry(0.03, 12, 8), M.earIn);
      inner.scale.set(0.35, 1.2, 0.6);
      inner.position.set(s * 0.212, 0.2, 0.004);
      face.add(inner);
    }
    // eyes: big bulging spheres set low (52% of head height), with lids and tracking irises
    this.eyes = [];
    for (const s of [-1, 1]) {
      const eye = new Group();
      eye.position.set(s * 0.07, 0.222, 0.124);
      face.add(eye);
      const white = mesh(new SphereGeometry(0.041, 24, 18), M.eyeWhite, false);
      eye.add(white);
      const look = new Group(); // rotates to track
      eye.add(look);
      const iris = mesh(new SphereGeometry(0.0415, 24, 10, 0, Math.PI * 2, 0, 0.66), M.iris, false);
      iris.rotation.x = Math.PI / 2;
      look.add(iris);
      const pupilPivot = new Group();
      look.add(pupilPivot);
      const pupil = mesh(new SphereGeometry(0.0422, 18, 6, 0, Math.PI * 2, 0, 0.3), M.pupil, false);
      pupil.rotation.x = Math.PI / 2;
      pupilPivot.add(pupil);
      const glint = mesh(new SphereGeometry(0.006, 8, 6), makeMat('WHITE', { emissive: 'WHITE', emissiveIntensity: 0.6, unique: true }), false);
      glint.userData.noOutline = true;
      glint.position.set(0.013, 0.014, 0.04);
      look.add(glint);
      // lids: hemisphere shells of skin that rotate over the eye
      const lidU = new Group();
      const lu = mesh(new SphereGeometry(0.0445, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.skin, false);
      lidU.add(lu);
      eye.add(lidU);
      const lidL = new Group();
      const ll = mesh(new SphereGeometry(0.0442, 20, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.skin, false);
      lidL.add(ll);
      eye.add(lidL);
      // tired purple-tinted bags
      const bag = mesh(new TorusGeometry(0.034, 0.009, 6, 14, Math.PI * 0.8), M.bags, false);
      bag.userData.noBake = true;
      bag.userData.noOutline = true;
      bag.position.set(0, -0.026, 0.02);
      bag.rotation.set(-0.3, 0, Math.PI + Math.PI * 0.1);
      eye.add(bag);
      this.eyes.push({ eye, look, pupilPivot, lidU, lidL, glint, side: s });
    }
    // brows: thick, bent, dark, default slanting down toward the nose
    this.brows = [];
    for (const s of [-1, 1]) {
      const pivot = new Group();
      pivot.position.set(s * 0.07, 0.28, 0.15);
      face.add(pivot);
      const pts = [new Vector3(-s * 0.048, -0.004, 0.0), new Vector3(-s * 0.015, 0.006, 0.006), new Vector3(s * 0.02, 0.008, 0.004), new Vector3(s * 0.05, -0.002, -0.008)];
      const tube = new TubeGeometry(new CatmullRomCurve3(pts), 16, 0.0125, 8, false);
      const brow = mesh(tube, M.brow, false);
      // fatter in the middle: squash ends
      const p = tube.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = Math.abs(p.getX(i)) / 0.05;
        p.setY(i, p.getY(i) * (1 - x * 0.25));
      }
      smoothNormals(tube);
      pivot.add(brow);
      this.brows.push({ pivot, side: s });
    }
    // nose: big ruddy ball, slightly upturned, shiny
    {
      const g = new SphereGeometry(0.041, 24, 18);
      g.scale(1, 0.9, 1.1);
      const nose = mesh(g, M.nose);
      nose.userData.noBake = true;
      nose.position.set(0, 0.165, 0.198);
      nose.rotation.x = -0.25;
      face.add(nose);
      this.parts.nose = nose;
      for (const s of [-1, 1]) {
        const cheek = mesh(new SphereGeometry(0.036, 14, 10), M.cheek, false);
        cheek.userData.noBake = true;
        cheek.userData.noOutline = true;
        cheek.scale.set(1, 0.7, 0.4);
        cheek.position.set(s * 0.1, 0.16, 0.15);
        cheek.rotation.y = s * 0.5;
        face.add(cheek);
      }
    }
    // mouth: mostly hidden under the mustache; opens for grunts and the catch scream
    {
      const mouth = new Group();
      mouth.position.set(0, 0.098, 0.165);
      face.add(mouth);
      const dark = mesh(new SphereGeometry(0.048, 20, 12), M.mouth, false);
      dark.scale.set(1, 0.25, 0.45);
      mouth.add(dark);
      const tongue = mesh(new SphereGeometry(0.03, 12, 8), M.tongue, false);
      tongue.scale.set(1.1, 0.4, 0.6);
      tongue.position.set(0, -0.01, 0.005);
      mouth.add(tongue);
      const teeth = mesh(roundedBox(0.06, 0.012, 0.012, 0.004, 1), M.teeth, false);
      teeth.position.set(0, 0.008, 0.016);
      mouth.add(teeth);
      for (const m of [dark, tongue, teeth]) m.userData.noOutline = true;
      mouth.userData.noOutline = true;
      this.mouth = { group: mouth, dark, tongue, teeth };
      // chin/jaw piece that drops when the mouth opens wide
      const jaw = new Group();
      jaw.position.set(0, 0.12, 0.03);
      face.add(jaw);
      const chin = mesh(new SphereGeometry(0.09, 20, 14), M.skin);
      chin.scale.set(1.25, 0.6, 0.85);
      chin.position.set(0, -0.085, 0.07);
      jaw.add(chin);
      this.jaw = jaw;
    }
    // mustache: his signature. Two tapered halves that sweep out and curl up, on springs.
    this.stache = [];
    for (const s of [-1, 1]) {
      const pivot = new Group();
      pivot.position.set(s * 0.012, 0.118, 0.2);
      face.add(pivot);
      const curve = new CatmullRomCurve3([
        new Vector3(0, 0, 0), new Vector3(s * 0.05, -0.012, -0.004), new Vector3(s * 0.1, -0.02, -0.03),
        new Vector3(s * 0.145, -0.008, -0.065), new Vector3(s * 0.168, 0.022, -0.08), new Vector3(s * 0.158, 0.046, -0.075),
        new Vector3(s * 0.14, 0.042, -0.068), new Vector3(s * 0.142, 0.03, -0.066),
      ]);
      const N = 34;
      const geos = [];
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const r = 0.024 * (1 - t) + 0.008 * t;
        const g = new SphereGeometry(r, 10, 8);
        g.scale(1, 0.85, 0.9);
        const p = curve.getPoint(t);
        g.translate(p.x, p.y, p.z);
        geos.push(g);
      }
      const geo = mergeGeometries(geos);
      wobble(geo, 0.03, 4, seedFrom(`stache${s}`));
      smoothNormals(geo);
      const half = mesh(geo, M.stache);
      pivot.add(half);
      this.stache.push({ pivot, side: s });
    }
    // hair: swept-back cap with a wavy edge, temple clumps, sideburns, and the unruly curl
    {
      const g = new SphereGeometry(0.183, 36, 18, 0, Math.PI * 2, 0, 1.45);
      g.scale(1.06, 1.17, 1.0);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const t = MathUtils.clamp((y + 0.2) / 0.4, 0, 1);
        x *= 1.12 + (0.94 - 1.12) * t;
        if (z < -0.07) z = -0.07 + (z + 0.07) * 0.8;
        // wavy bottom edge
        if (y < 0.05) y += Math.sin(Math.atan2(z, x) * 9) * 0.008;
        // volume swept back on top
        if (y > 0.1) { y += 0.012; z -= 0.01; }
        pos.setXYZ(i, x, y, z);
      }
      smoothNormals(g);
      const cap = mesh(g, M.hair);
      cap.position.set(0, 0.215, -0.014);
      cap.rotation.x = -0.42; // high forehead, low at the back
      face.add(cap);
      for (const s of [-1, 1]) {
        const clump = mesh(new SphereGeometry(0.036, 12, 10), M.hair);
        clump.scale.set(0.7, 0.9, 1.3);
        clump.position.set(s * 0.168, 0.3, -0.07);
        face.add(clump);
        const burn = mesh(roundedBox(0.02, 0.06, 0.035, 0.008, 2), M.hair);
        burn.position.set(s * 0.182, 0.262, 0.03);
        burn.rotation.y = s * 0.3;
        face.add(burn);
      }
      const curlPivot = new Group();
      curlPivot.position.set(0.02, 0.4, -0.02);
      face.add(curlPivot);
      const spiral = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const a = t * Math.PI * 2.4;
        const r = 0.035 * (1 - t * 0.6);
        spiral.push(new Vector3(Math.sin(a) * r * 0.6, t * 0.06 + Math.cos(a) * r * 0.5, Math.cos(a) * r * 0.3));
      }
      const curl = mesh(new TubeGeometry(new CatmullRomCurve3(spiral), 30, 0.008, 6, false), M.hair, false);
      curlPivot.add(curl);
      this.curl = curlPivot;
    }
  }

  // Merge the static parts of each bone into a few meshes, then outline.
  _finish() {
    // animated sub-groups keep their own transforms
    const keep = [
      ...this.eyes.flatMap((e) => [e.look, e.lidU, e.lidL]), ...this.brows.map((b) => b.pivot), ...this.stache.map((s) => s.pivot),
      this.curl, this.jaw, this.mouth.group,
    ];
    for (const b of Object.values(this.bones)) b.userData.noBake = true;
    for (const k of keep) k.userData.noBake = true;
    for (const h of [this.bones.handL, this.bones.handR]) {
      for (const f of h.userData.fingers) { f.userData.noBake = true; f.userData.tip.userData.noBake = true; }
      h.userData.thumb.userData.noBake = true;
    }
    bakeDeep(this.root, 'grimsby', { unique: true });
    // nose stays its own mesh (it reddens): keep it out of the head bake
    this.root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    this.outlines = addOutline(this.root, { thickness: 0.02, unique: true });
    this.rimMats = [];
    this.root.traverse((m) => { if (m.isMesh && !m.userData.isOutline && m.material.userData.toon) this.rimMats.push(m.material); });
    this.rimBase = this.rimMats.map((m) => m.userData.toon.uRim.value);
    this._noseMesh = null;
    this.root.traverse((m) => { if (m.isMesh && !m.userData.isOutline && m.material === this.mats.nose) this._noseMesh = m; });
  }

  setExpression(name) {
    if (!EXPRESSIONS[name]) return;
    this.exprName = name;
    Object.assign(this.exprTarget, EXPRESSIONS[name]);
    if (this.exprTarget.glisten === undefined) this.exprTarget.glisten = 0;
  }

  // Head pose helper (layered on top of body animation by NeighborAnimator)
  headWorldPos(out = new Vector3()) {
    return this.bones.head.localToWorld(out.set(0, 0.22, 0.05));
  }

  setPresence(k) {
    this.presence = k;
  }

  /**
   * Per-frame: expressions, blinking, eye tracking, springs, presence.
   */
  update(dt) {
    this.time += dt;
    const E = this.expr, T = this.exprTarget;
    const rate = 1 - Math.exp(-dt / 0.07);
    for (const k of Object.keys(T)) E[k] = (E[k] ?? 0) + ((T[k] ?? 0) - (E[k] ?? 0)) * rate;

    // blinking: every 3-6 s, 120 ms
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) { this.blink = 0.12; this.blinkTimer = 3 + Math.random() * 3; }
    let blinkAmt = 0;
    if (this.blink > 0) { this.blink -= dt; blinkAmt = Math.sin(Math.max(0, this.blink) / 0.12 * Math.PI); }

    // lids, pupils, glisten
    for (const e of this.eyes) {
      e.lidU.rotation.x = MathUtils.lerp(E.lidU + (E.browSlant > 0.4 ? -0.0 : 0), 1.45, blinkAmt);
      // angry: upper lids tilt inward
      e.lidU.rotation.z = -e.side * Math.max(0, E.browSlant - 0.3) * 0.5;
      e.lidL.rotation.x = 0.95 - E.lidL * 2;
      e.pupilPivot.scale.setScalar(MathUtils.clamp(E.pupil, 0.5, 1.5));
      e.glint.scale.setScalar(1 + (E.glisten ?? 0) * 0.7);
    }
    // brows
    for (const b of this.brows) {
      b.pivot.position.y = 0.28 + E.browRaise + (b.side > 0 ? E.browAsym : 0);
      b.pivot.rotation.z = b.side * E.browSlant;
    }
    // mouth / jaw
    const open = E.mouth;
    this.mouth.dark.scale.set(1 + open * 0.7, 0.25 + open * 2.6, 0.5);
    this.mouth.group.position.y = 0.098 - open * 0.055;
    this.mouth.tongue.visible = open > 0.15;
    this.mouth.teeth.visible = open > 0.25;
    this.jaw.rotation.x = open * 0.55;
    this.jaw.position.y = 0.12 - open * 0.03;
    // nose reddens when he runs or is angry
    if (this._noseMesh) {
      const k = MathUtils.clamp(Math.max(E.nose, this.noseHeat), 0, 1);
      this._noseMesh.material.color.copy(Palette.NB_NOSE).lerp(Palette.NB_NOSE_RUN, k);
    }
    // head tilt for expression (added by animator on top of pose)
    this.face.rotation.z = E.tilt * DEG * 0.5;

    // eye tracking: irises follow the target before the head does
    if (this.lookTarget) {
      // both eyes share one gaze direction from the bridge of the nose (no cross-eyes up close)
      this.face.updateWorldMatrix(true, false);
      const gaze = this.face.worldToLocal(_v.copy(this.lookTarget)).sub(_gazeOrigin);
      for (const e of this.eyes) {
        _v.copy(gaze);
        const yaw = MathUtils.clamp(Math.atan2(_v.x, _v.z), -this.eyeLimit, this.eyeLimit);
        const pitch = MathUtils.clamp(Math.atan2(-_v.y, Math.hypot(_v.x, _v.z)), -this.eyeLimit * 0.7, this.eyeLimit * 0.7);
        e.look.rotation.y += (yaw - e.look.rotation.y) * Math.min(1, dt * 18);
        e.look.rotation.x += (pitch - e.look.rotation.x) * Math.min(1, dt * 18);
      }
    } else {
      for (const e of this.eyes) {
        e.look.rotation.y *= 1 - Math.min(1, dt * 4);
        e.look.rotation.x *= 1 - Math.min(1, dt * 4);
      }
    }

    // secondary motion: springs driven by head acceleration
    const hp = this.headWorldPos(_v);
    const vel = hp.clone().sub(this._prevHeadPos).divideScalar(Math.max(dt, 1e-3));
    const acc = vel.clone().sub(this._prevHeadVel);
    this._prevHeadPos.copy(hp);
    this._prevHeadVel.copy(vel);
    const kick = MathUtils.clamp(acc.y * 0.02, -0.6, 0.6);
    const side = MathUtils.clamp(acc.length() * 0.004, 0, 0.4);
    for (const st of this.stache) {
      const sp = st.side > 0 ? this.springs.stacheL : this.springs.stacheR;
      sp.kick(-kick * 2 + (Math.random() - 0.5) * side * 3);
      const x = sp.update(dt, E.stache * 0.25);
      st.pivot.rotation.z = st.side * x;
      st.pivot.rotation.y = -st.side * x * 0.4;
    }
    this.springs.curl.kick(-kick * 3 + (Math.random() - 0.5) * side * 4);
    const cx = this.springs.curl.update(dt, 0);
    this.curl.rotation.z = cx;
    this.curl.rotation.x = cx * 0.6;
    // belly jiggle on vertical motion
    const rootY = this.root.position.y + this.bones.hips.position.y;
    this.springs.belly.kick(-(rootY - this._prevRootY) * 40);
    this._prevRootY = rootY;
    const bj = this.springs.belly.update(dt, 0);
    const breathe = Math.sin(this.time * Math.PI * 2 / 3.5) * 0.01;
    this.bones.torso.scale.set(1 + bj * 0.3, 1 + breathe + bj * 0.5, 1 + breathe + bj * 0.6);

    // presence: more vivid when the player is close and looking
    const pk = this.presence;
    for (let i = 0; i < this.rimMats.length; i++) this.rimMats[i].userData.toon.uRim.value = this.rimBase[i] * (1 + pk * 0.6);
    setOutlineScale(this.outlines, 1 + pk * 0.35);
  }

  // Curl / splay fingers: 0 relaxed, 1 fist, -1 splayed wide
  setGrip(side, amt) {
    const h = this.bones[`hand${side}`];
    for (let i = 0; i < h.userData.fingers.length; i++) {
      const f = h.userData.fingers[i];
      const curl = amt >= 0 ? 0.25 + amt * 1.1 : 0.05;
      f.rotation.x = curl;
      f.userData.tip.rotation.x = amt >= 0 ? 0.3 + amt * 1.2 : 0.05;
      f.rotation.z = amt < 0 ? (i - 1.5) * 0.18 * -amt : (i - 1.5) * 0.04;
    }
    h.userData.thumb.rotation.x = amt < 0 ? 0.1 : 0.4 + amt * 0.4;
  }
}

// The argyle, tiled for the torso lathe (own copy so other vests keep their scale).
function vestTexture() {
  const t = Tex.argyle().clone();
  t.repeat.set(7, 2.6);
  t.needsUpdate = true;
  return t;
}

// Warm brown trousers with a faint darker plaid.
let _plaid = null;
function plaid() {
  if (!_plaid) _plaid = plaidTexture();
  return _plaid;
}

function plaidTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const base = Palette.NB_PANTS.clone();
  const css = (col, a = 1) => {
    const o = { r: 0, g: 0, b: 0 };
    col.getRGB(o, 'srgb');
    return `rgba(${Math.round(o.r * 255)},${Math.round(o.g * 255)},${Math.round(o.b * 255)},${a})`;
  };
  g.fillStyle = css(base);
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = css(Palette.NB_BELT, 0.35);
  for (let i = 0; i < 128; i += 32) { g.fillRect(i, 0, 8, 128); g.fillRect(0, i, 128, 8); }
  g.fillStyle = css(Palette.NB_BELT, 0.18);
  for (let i = 16; i < 128; i += 32) { g.fillRect(i, 0, 2, 128); g.fillRect(0, i, 128, 2); }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(5, 3);
  return t;
}

export { Euler, Color, CylinderGeometry, taper };
