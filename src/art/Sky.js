// Gradient sky dome with a soft sun disc baked into the shader, plus
// cotton-ball cartoon clouds drifting on the wind.
import {
  Group, Mesh, SphereGeometry, ShaderMaterial, BackSide, Vector3, Color, Uniform, IcosahedronGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONFIG } from '../config.js';
import { Palette } from './Palette.js';
import { makeMat } from './Materials.js';
import { verticalGradient, smoothNormals } from './Geo.js';
import { rng } from './Warp.js';

const DEG = Math.PI / 180;

export function sunDirection(elevationDeg = CONFIG.lighting.sunElevation, azimuthDeg = CONFIG.lighting.sunAzimuth) {
  // Compass azimuth: 0 = north (-Z), 90 = east (+X), 270 = west (-X).
  const e = elevationDeg * DEG, a = azimuthDeg * DEG;
  return new Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).normalize();
}

const VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww; // pin to far plane
}
`;

const FRAG = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunCos;
uniform float uGlow;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.32, y));
  col = mix(col, uZenith, smoothstep(0.22, 0.95, y));
  // warm the horizon on the sun side
  float sd = max(dot(d, uSunDir), 0.0);
  col += uSunColor * pow(sd, 6.0) * 0.12 * (1.0 - smoothstep(0.0, 0.5, y));
  // glow halo and crisp disc
  col += uSunColor * (pow(sd, 90.0) * uGlow + pow(sd, 900.0) * 0.6);
  float disc = smoothstep(uSunCos - 0.00025, uSunCos + 0.00005, sd);
  col = mix(col, uSunColor * 1.35, disc);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export class Sky {
  constructor(scene) {
    this.group = new Group();
    this.group.name = 'sky';
    scene.add(this.group);
    this.sunDir = sunDirection();

    this.uniforms = {
      uZenith: new Uniform(Palette.SKY_ZENITH.clone()),
      uMid: new Uniform(Palette.SKY_MID.clone()),
      uHorizon: new Uniform(Palette.SKY_HORIZON.clone()),
      uSunDir: new Uniform(this.sunDir.clone()),
      uSunColor: new Uniform(Palette.SUN_DISC.clone()),
      uSunCos: new Uniform(CONFIG.sky.sunDiscSize),
      uGlow: new Uniform(CONFIG.sky.sunGlow),
    };
    const mat = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: BackSide,
      depthWrite: false,
      fog: false,
    });
    this.dome = new Mesh(new SphereGeometry(CONFIG.sky.radius, 48, 24), mat);
    this.dome.renderOrder = -1000;
    this.dome.frustumCulled = false;
    this.group.add(this.dome);

    this.clouds = new Group();
    this.group.add(this.clouds);
    this._buildClouds();
  }

  _buildClouds() {
    const r = rng('clouds');
    const S = CONFIG.sky;
    const mat = makeMat('CLOUD_TOP', { vertexColors: true, fog: false, rim: 0.18 });
    for (let i = 0; i < S.cloudCount; i++) {
      const parts = [];
      const n = r.int(5, 9);
      const w = r.range(14, 26);
      for (let p = 0; p < n; p++) {
        const g = new IcosahedronGeometry(1, 3);
        const t = n === 1 ? 0.5 : p / (n - 1);
        const rad = w * r.range(0.22, 0.32) * (1 - Math.abs(t - 0.5) * 0.9);
        g.scale(rad, rad * r.range(0.78, 0.95), rad * r.range(0.8, 1.0));
        g.translate((t - 0.5) * w, r.range(-0.08, 0.22) * rad + (1 - Math.abs(t - 0.5) * 2) * rad * 0.35, r.range(-0.3, 0.3) * rad);
        parts.push(g);
      }
      const geo = mergeGeometries(parts);
      // flatten the bottom a touch so they sit like cotton balls on glass
      const pos = geo.attributes.position;
      geo.computeBoundingBox();
      const minY = geo.boundingBox.min.y;
      for (let k = 0; k < pos.count; k++) {
        const y = pos.getY(k);
        const floor = minY + (geo.boundingBox.max.y - minY) * 0.18;
        if (y < floor) pos.setY(k, floor - (floor - y) * 0.35);
      }
      smoothNormals(geo);
      verticalGradient(geo, Palette.CLOUD_BOTTOM, Palette.CLOUD_TOP, 0.3);
      const m = new Mesh(geo, mat);
      const ang = r.range(0, Math.PI * 2);
      const dist = r.range(S.cloudMinDist, S.cloudMaxDist);
      m.position.set(Math.cos(ang) * dist, r.range(42, 85) + dist * 0.12, Math.sin(ang) * dist);
      m.rotation.y = r.range(0, Math.PI * 2);
      m.userData.speed = S.cloudWind * r.range(0.7, 1.3);
      m.frustumCulled = false;
      this.clouds.add(m);
    }
  }

  setSun(dir, color) {
    this.sunDir.copy(dir);
    this.uniforms.uSunDir.value.copy(dir);
    if (color) this.uniforms.uSunColor.value.copy(color);
  }

  setColors(zenith, mid, horizon) {
    this.uniforms.uZenith.value.copy(zenith);
    this.uniforms.uMid.value.copy(mid);
    this.uniforms.uHorizon.value.copy(horizon);
  }

  update(dt, camera) {
    this.group.position.set(camera.position.x, 0, camera.position.z);
    const lim = CONFIG.sky.cloudMaxDist;
    for (const c of this.clouds.children) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > lim) c.position.x = -lim;
    }
  }
}

export { Color };
