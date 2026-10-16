// Lights and sky for the house study. Survey mode: flat, neutral, evenly lit
// so scale is easy to judge (spec 21). Style mode swaps in the main game's
// sky, toon lighting and post-processing (Milestone 7).
import { HemisphereLight, DirectionalLight, AmbientLight, Color, Fog } from 'three';
import { Sky } from '../art/Sky.js';
import { Lighting } from '../world/Lighting.js';

export class SurveyLighting {
  constructor(scene) {
    this.scene = scene;
    this.hemi = new HemisphereLight(0xffffff, 0x8a8a84, 1.25);
    this.amb = new AmbientLight(0xffffff, 0.35);
    this.sun = new DirectionalLight(0xffffff, 1.0);
    this.sun.position.set(-18, 30, -14);
    this.sun.castShadow = true;
    const s = this.sun.shadow;
    s.mapSize.set(2048, 2048);
    s.camera.left = -22; s.camera.right = 22; s.camera.top = 22; s.camera.bottom = -22;
    s.camera.near = 1; s.camera.far = 90;
    s.bias = -0.0005;
    s.normalBias = 0.03;
    this.sun.target.position.set(7, 0, 5.5);
    scene.add(this.hemi, this.amb, this.sun, this.sun.target);
    scene.background = new Color(0xc9d3dc);
    scene.fog = new Fog(0xc9d3dc, 60, 220);
  }

  setVisible(on) {
    for (const l of [this.hemi, this.amb, this.sun]) l.visible = on;
    if (on) {
      this.scene.background = new Color(0xc9d3dc);
      this.scene.fog = new Fog(0xc9d3dc, 60, 220);
    }
  }
}

// Style mode: the main game's painted sky, sun and toon fill (spec 7, 22),
// built on first use.
export class StyleLighting {
  constructor(scene) {
    this.scene = scene;
    this.sky = new Sky(scene);
    this.lighting = new Lighting(scene);
    this.fog = scene.fog;
    this.setVisible(false);
  }

  setVisible(on) {
    this.sky.group.visible = on;
    for (const l of [this.lighting.sun, this.lighting.hemi, this.lighting.ambient]) l.visible = on;
    if (on) { this.scene.background = null; this.scene.fog = this.fog; }
  }

  update(dt, camera, indoor) {
    this.sky.update(dt, camera);
    this.lighting.update(camera.position);
    this.lighting.setIndoor(indoor);
  }
}
