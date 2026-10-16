// "Story clock": each catch nudges the afternoon toward golden hour. Not real
// time, just mood: the sun lowers, the sky and fog warm up.
import { Color, MathUtils } from 'three';
import { CONFIG } from '../config.js';
import { Palette } from '../art/Palette.js';
import { sunDirection } from '../art/Sky.js';

const SC = CONFIG.storyClock;

export class StoryClock {
  constructor(sky, lighting, scene) {
    this.sky = sky;
    this.lighting = lighting;
    this.scene = scene;
    this.value = 0; // 0 late afternoon .. 1 golden hour
    this.target = 0;
    this.goldHorizon = Palette.FOG_DUSK.clone();
    this.goldMid = new Color().copy(Palette.SKY_MID).lerp(Palette.TANGERINE, 0.35);
    this.goldZenith = new Color().copy(Palette.SKY_ZENITH).lerp(Palette.GRAPE, 0.25);
    this.goldSun = new Color().copy(Palette.SUN_LIGHT).lerp(Palette.TANGERINE, 0.45);
    this._c = new Color();
    this.apply();
  }

  advance(amount = SC.perCatch) {
    this.target = Math.min(1, this.target + amount);
  }

  set(v) {
    this.value = this.target = MathUtils.clamp(v, 0, 1);
    this.apply();
  }

  update(dt) {
    if (Math.abs(this.value - this.target) < 1e-4) return;
    this.value += Math.sign(this.target - this.value) * Math.min(Math.abs(this.target - this.value), dt / SC.blendTime);
    this.apply();
  }

  apply() {
    const k = this.value;
    const L = CONFIG.lighting;
    const elev = MathUtils.lerp(L.sunElevation, SC.sunElevationEnd, k);
    const az = MathUtils.lerp(L.sunAzimuth, SC.sunAzimuthEnd, k);
    const dir = sunDirection(elev, az);
    this.lighting.setSunDirection(dir);
    this.lighting.sun.color.copy(Palette.SUN_LIGHT).lerp(this.goldSun, k);
    this.lighting.sun.intensity = L.sunIntensity * (1 - k * 0.12);
    this.sky.setSun(dir, this._c.copy(Palette.SUN_DISC).lerp(Palette.TANGERINE, k * 0.4));
    this.sky.setColors(
      this._z ?? (this._z = new Color()).copy(Palette.SKY_ZENITH).lerp(this.goldZenith, k),
      (this._m ?? (this._m = new Color())).copy(Palette.SKY_MID).lerp(this.goldMid, k),
      (this._h ?? (this._h = new Color())).copy(Palette.SKY_HORIZON).lerp(this.goldHorizon, k),
    );
    if (this.scene.fog) this.scene.fog.color.copy(Palette.FOG_DAY).lerp(Palette.FOG_DUSK, k);
  }
}
