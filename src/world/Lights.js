// Point-light budget. Three.js compiles light counts into shaders, so we keep
// a fixed pool of N real PointLights and hand them to the N lamps nearest the
// camera each frame (spec: cap active point lights at 8). Lamps register
// "sources": an Object3D marker plus color/intensity/distance.
import { PointLight } from 'three';
import { CONFIG } from '../config.js';
import { Palette } from '../art/Palette.js';

export class LightManager {
  constructor(scene, max = CONFIG.lighting.maxPointLights) {
    this.pool = [];
    for (let i = 0; i < max; i++) {
      const l = new PointLight(Palette.LAMP_LIGHT, 0, 5, 1.4);
      l.castShadow = false;
      scene.add(l);
      this.pool.push(l);
    }
    this.sources = [];
    this._tmp = [];
  }

  // marker: Object3D placed where the light should be. Lamp builders put a
  // PointLight in their group as a marker: we take its settings and remove it.
  addFrom(obj) {
    const found = [];
    obj.traverse((o) => { if (o.isPointLight && !o.userData.registered) found.push(o); });
    for (const l of found) {
      const marker = l.parent;
      const src = {
        marker: l, color: l.color.clone(), intensity: l.userData.baseIntensity ?? 2,
        distance: l.distance || 5, decay: l.decay, on: true, flicker: 1, wp: l.position.clone(),
      };
      l.visible = false;
      l.userData.registered = true;
      l.intensity = 0;
      this.sources.push(src);
      marker.userData.lightSource = src;
    }
    return found.length;
  }

  update(camPos) {
    const arr = this._tmp;
    arr.length = 0;
    for (const s of this.sources) {
      if (!s.on) continue;
      s.marker.getWorldPosition(s.wp);
      arr.push([s, s.wp.distanceToSquared(camPos)]);
    }
    arr.sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < this.pool.length; i++) {
      const l = this.pool[i];
      const e = arr[i];
      if (!e) { l.intensity = 0; continue; }
      const s = e[0];
      l.position.copy(s.wp);
      l.color.copy(s.color);
      l.distance = s.distance;
      l.decay = s.decay;
      l.intensity = s.intensity * s.flicker;
    }
  }
}
