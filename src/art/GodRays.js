// Fake sunlight shafts: soft additive cards slanting from sunlit windows to
// the floor, plus slow dust motes drifting in the light.
import {
  Group, Mesh, PlaneGeometry, MeshBasicMaterial, AdditiveBlending, DoubleSide, CanvasTexture, Points,
  BufferGeometry, Float32BufferAttribute, PointsMaterial, Vector3, Quaternion, Matrix4, SRGBColorSpace,
} from 'three';
import { Palette } from './Palette.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONFIG } from '../config.js';

let shaftTex = null;
function shaftTexture() {
  if (shaftTex) return shaftTex;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(64, 128);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 64; x++) {
      const u = x / 63, v = y / 127;
      const edge = Math.sin(u * Math.PI) ** 1.5;
      const along = Math.min(1, v * 6) * (1 - v) ** 0.7;
      const a = edge * along;
      const i = (y * 64 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(a * 255);
    }
  g.putImageData(img, 0, 0);
  shaftTex = new CanvasTexture(c);
  shaftTex.colorSpace = SRGBColorSpace;
  return shaftTex;
}

export class GodRays {
  constructor(scene) {
    this.group = new Group();
    this.group.name = 'godRays';
    scene.add(this.group);
    this.mat = new MeshBasicMaterial({
      color: Palette.GODRAY, map: shaftTexture(), transparent: true, opacity: CONFIG.godRays.opacity,
      blending: AdditiveBlending, depthWrite: false, side: DoubleSide, fog: false,
    });
    this.motes = [];
  }

  /**
   * win: { center: Vector3, w, h, normal: Vector3 (outward), floorY }
   * lightDir: direction sunlight travels (from sun into the world).
   */
  addWindow(win, lightDir) {
    const inward = win.normal.clone().negate();
    if (lightDir.dot(inward) <= 0.05) return; // window not facing the sun
    const drop = win.center.y - win.floorY;
    const len = Math.min(6, (drop + win.h * 0.5) / Math.max(0.2, -lightDir.y));
    const side = new Vector3().crossVectors(win.normal, new Vector3(0, 1, 0)).normalize();
    for (let k = 0; k < 2; k++) {
      const geo = new PlaneGeometry(win.w * (k ? 0.8 : 1), len);
      const m = new Mesh(geo, this.mat);
      // plane's local +y along the light, its x across the window
      const yAxis = lightDir.clone().normalize();
      const xAxis = side.clone();
      const zAxis = new Vector3().crossVectors(xAxis, yAxis).normalize();
      xAxis.crossVectors(yAxis, zAxis).normalize();
      const basis = new Matrix4().makeBasis(xAxis, yAxis.clone().negate(), zAxis.clone().negate());
      m.quaternion.setFromRotationMatrix(basis);
      const start = win.center.clone().add(new Vector3(0, (k ? -0.25 : 0.1) * win.h, 0));
      m.position.copy(start).addScaledVector(lightDir, len / 2);
      m.renderOrder = 5;
      m.frustumCulled = true;
      this.group.add(m);
    }
    // dust motes floating in the beam
    const N = CONFIG.godRays.motesPerWindow;
    const pos = new Float32Array(N * 3);
    const seeds = [];
    for (let i = 0; i < N; i++) {
      const t = Math.random() * len * 0.8;
      const p = win.center.clone().addScaledVector(lightDir, t).addScaledVector(side, (Math.random() - 0.5) * win.w).add(new Vector3(0, (Math.random() - 0.5) * win.h * 0.6, 0));
      seeds.push({ base: p, ph: Math.random() * 10 });
      pos.set([p.x, p.y, p.z], i * 3);
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    const pts = new Points(geo, new PointsMaterial({ color: Palette.GODRAY, size: 0.025, transparent: true, opacity: 0.8, depthWrite: false, blending: AdditiveBlending }));
    this.group.add(pts);
    this.motes.push({ pts, seeds });
  }

  // Merge all the shaft cards into one mesh (they never move).
  finalize() {
    const cards = this.group.children.filter((c) => c.isMesh);
    if (!cards.length) return;
    const geos = cards.map((c) => { c.updateMatrixWorld(true); return c.geometry.clone().applyMatrix4(c.matrixWorld); });
    for (const c of cards) this.group.remove(c);
    const m = new Mesh(mergeGeometries(geos), this.mat);
    m.renderOrder = 5;
    this.group.add(m);
  }

  update(dt, t) {
    for (const { pts, seeds } of this.motes) {
      const a = pts.geometry.attributes.position.array;
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i];
        a[i * 3] = s.base.x + Math.sin(t * 0.21 + s.ph) * 0.12;
        a[i * 3 + 1] = s.base.y + Math.sin(t * 0.13 + s.ph * 2) * 0.15;
        a[i * 3 + 2] = s.base.z + Math.cos(t * 0.17 + s.ph) * 0.12;
      }
      pts.geometry.attributes.position.needsUpdate = true;
    }
  }
}

export { Quaternion };
