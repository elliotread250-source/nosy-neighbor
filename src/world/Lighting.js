// Sun, hemisphere fill, ambient floor and fog. The sun's shadow frustum
// follows the player so shadow detail stays where they're looking.
import { DirectionalLight, HemisphereLight, AmbientLight, Fog, Object3D, Vector3 } from 'three';
import { CONFIG, gfx } from '../config.js';
import { Palette } from '../art/Palette.js';
import { sunDirection } from '../art/Sky.js';
import { ToonShared } from '../art/Materials.js';

const L = CONFIG.lighting;

export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.sunDir = sunDirection();

    this.sun = new DirectionalLight(Palette.SUN_LIGHT, L.sunIntensity);
    this.sun.castShadow = gfx().shadows;
    const sm = gfx().shadowMapSize;
    this.sun.shadow.mapSize.set(sm, sm);
    const sc = this.sun.shadow.camera;
    sc.left = -L.shadowRadius; sc.right = L.shadowRadius;
    sc.top = L.shadowRadius; sc.bottom = -L.shadowRadius;
    sc.near = 1; sc.far = L.sunDistance * 2.5;
    this.sun.shadow.bias = L.shadowBias;
    this.sun.shadow.normalBias = L.shadowNormalBias;
    this.sun.shadow.radius = L.shadowSoftness;
    this.sun.target = new Object3D();
    scene.add(this.sun, this.sun.target);

    this.hemi = new HemisphereLight(Palette[L.hemiSky], Palette[L.hemiGround], L.hemiIntensity);
    this.ambient = new AmbientLight(Palette.WHITE, L.ambientIntensity);
    scene.add(this.hemi, this.ambient);

    scene.fog = new Fog(Palette.FOG_DAY.clone(), CONFIG.fog.near, CONFIG.fog.far);
    ToonShared.uSunRef.value = L.sunIntensity / Math.PI;
    this._focus = new Vector3();
  }

  // Keep the shadow frustum centered just ahead of the viewer, snapped to
  // shadow texels so edges don't shimmer as the player walks.
  update(focus) {
    const sm = this.sun.shadow.mapSize.x;
    const texel = (L.shadowRadius * 2) / sm;
    this._focus.set(
      Math.round(focus.x / texel) * texel,
      Math.round(focus.y / texel) * texel,
      Math.round(focus.z / texel) * texel,
    );
    this.sun.target.position.copy(this._focus);
    this.sun.position.copy(this._focus).addScaledVector(this.sunDir, L.sunDistance);
  }

  setSunDirection(dir) {
    this.sunDir.copy(dir);
  }
}
