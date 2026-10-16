// The dream: the first time you're caught three times inside five minutes,
// you wake "into" a night version of the street. Purple-magenta sky, houses
// twice as tall and leaning hard, furniture floating overhead, the road
// curling up into the sky, his house a black shape on the horizon with one
// glowing window, and a giant Grimsby striding slowly past. Run to the
// window to wake up. Every warp is turned up four times.
import {
  Group, Mesh, Vector3, Color, BufferGeometry, Float32BufferAttribute, CatmullRomCurve3, ConeGeometry, MeshBasicMaterial, DoubleSide, MathUtils,
} from 'three';
import { Events } from '../core/Events.js';
import { CONFIG } from '../config.js';
import { Palette } from '../art/Palette.js';
import { makeMat } from '../art/Materials.js';
import { roundedBox } from '../art/Geo.js';
import { lean, bulge, twist, wobble, taper, rng } from '../art/Warp.js';
import * as F from '../world/props/Furniture.js';
import * as D from '../world/props/Decor.js';
import { Neighbor } from '../actors/Neighbor.js';
import { NeighborAnimator } from '../actors/NeighborAnimator.js';
import { PLAYER_HOUSE } from '../world/PlayerHouse.js';

const O = new Vector3(0, 0, 700); // far from everything
const GOAL = new Vector3(0, 0, -72).add(O);

export class Dream {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.done = false;
    this.catchTimes = [];
    Events.on('player:caught', () => {
      const t = performance.now() / 1000;
      this.catchTimes = [...this.catchTimes.filter((x) => t - x < 300), t];
      if (!this.done && this.catchTimes.length >= 3) this.pending = true;
    });
    Events.on('catch:end', () => { if (this.pending) this.start(); });
  }

  wants() { return !!this.pending; }

  _build() {
    const g = this.game;
    const scene = g.engine.scene;
    const root = new Group();
    root.name = 'dream';
    root.position.copy(O);
    scene.add(root);
    const warp = CONFIG.world.warpIntensity;
    CONFIG.world.warpIntensity = warp * 4;
    const R = rng('dream');
    // ground
    const ground = new Mesh(roundedBox(220, 0.4, 220, 0.1, 1), makeMat('DREAM_GROUND'));
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    root.add(ground);
    this.groundCol = g.physics.addStaticBox(new Vector3(O.x, -0.2, O.z), new Vector3(110, 0.2, 110));
    // houses lining the way, twice as tall, leaning hard
    const sidings = ['NH_SIDING_MAIN', 'NH_SIDING_ALT', 'NH_SIDING_ADDON', 'PH_SIDING', 'BUBBLEGUM', 'RETRO_MINT', 'TANGERINE'];
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1;
      const z = -6 - Math.floor(i / 2) * 11;
      const h = R.range(12, 18);
      const geo = roundedBox(6.5, h, 6, 0.3, 2, { midStep: 1.2 });
      geo.translate(0, h / 2, 0);
      // these are multiplied by the 4x dream warp
      lean(geo, R.range(3, 6) * (R.next() < 0.5 ? -1 : 1), 'z', 0);
      bulge(geo, 0.04);
      twist(geo, R.range(-6, 6));
      wobble(geo, 0.05, 0.4, i);
      const house = new Mesh(geo, makeMat(sidings[i % sidings.length]));
      house.position.set(side * R.range(11, 14), 0, z);
      house.rotation.y = R.range(-0.4, 0.4);
      const roof = new Mesh(new ConeGeometry(5.4, R.range(4, 7), 4), makeMat('NH_ROOF'));
      roof.position.set(0, h + 2, 0);
      roof.rotation.set(R.range(-0.3, 0.3), Math.PI / 4, R.range(-0.4, 0.4));
      house.add(roof);
      for (let w = 0; w < 4; w++) {
        const win = new Mesh(roundedBox(1.0, 1.4, 0.1, 0.05, 1), makeMat('LAMPSHADE', { emissive: R.next() < 0.5 ? 'LAMPSHADE_GLOW' : 'DREAM_ACCENT', emissiveIntensity: 0.9 }));
        win.position.set(R.range(-2, 2), R.range(2, h - 2), -side * 3.05 * 0 + 3.06);
        house.add(win);
      }
      house.castShadow = true;
      root.add(house);
    }
    // the road, curling up off the ground into the sky like a ribbon
    const curve = new CatmullRomCurve3([
      new Vector3(0, 0.03, 8), new Vector3(0, 0.03, -20), new Vector3(2, 1, -40), new Vector3(12, 14, -55), new Vector3(24, 34, -48),
      new Vector3(18, 52, -30), new Vector3(-4, 60, -24), new Vector3(-22, 72, -40),
    ]);
    const N = 160, W = 3.4;
    const pos = [], col = [], idx = [];
    const up = new Vector3(0, 1, 0);
    const asphalt = new Color(Palette.DREAM_GROUND).lerp(new Color(Palette.ASPHALT), 0.6);
    const line = new Color(Palette.ROAD_LINE);
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const p = curve.getPointAt(u), t = curve.getTangentAt(u);
      const side = new Vector3().crossVectors(t, up).normalize();
      if (side.lengthSq() < 0.1) side.set(1, 0, 0);
      const twistA = Math.max(0, u - 0.25) * 4;
      side.applyAxisAngle(t, twistA);
      for (const s of [-1, -0.04, 0.04, 1]) {
        pos.push(p.x + side.x * s * W, p.y + side.y * s * W, p.z + side.z * s * W);
        const c = Math.abs(s) < 0.1 && i % 6 < 3 ? line : asphalt;
        col.push(c.r, c.g, c.b);
      }
      if (i < N) for (let k = 0; k < 3; k++) { const a = i * 4 + k, b = a + 4; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    const rg = new BufferGeometry();
    rg.setAttribute('position', new Float32BufferAttribute(pos, 3));
    rg.setAttribute('color', new Float32BufferAttribute(col, 3));
    rg.setIndex(idx);
    rg.computeVertexNormals();
    const road = new Mesh(rg, makeMat('WHITE', { vertexColors: true, side: DoubleSide }));
    root.add(road);
    // furniture drifting overhead, six times too big
    this.floaters = [];
    const builders = [() => F.chair('dch'), () => F.table('dtb'), () => F.armchair('dac'), () => F.tv('dtv'), () => F.lamp('dlp', { light: false }), () => F.bookshelf('dbs'), () => F.sofa('dsf'), () => D.trunk('dtr')];
    for (let i = 0; i < 9; i++) {
      const obj = builders[i % builders.length]();
      obj.scale.setScalar(R.range(4, 7));
      obj.position.set(R.range(-30, 30), R.range(10, 34), R.range(-70, 0));
      obj.rotation.set(R.range(-1, 1), R.range(0, 6), R.range(-1, 1));
      obj.userData.spin = new Vector3(R.range(-0.15, 0.15), R.range(-0.2, 0.2), R.range(-0.1, 0.1));
      obj.userData.bob = R.range(0, 6);
      obj.userData.y0 = obj.position.y;
      root.add(obj);
      this.floaters.push(obj);
    }
    // his house on the horizon: a black, top-heavy silhouette with one lit window
    const sil = new Group();
    const black = new MeshBasicMaterial({ color: 0x120a1c, fog: false });
    const parts = [[0, 0, 22, 14, 16, 0], [-2, 14, 18, 10, 14, -4], [3, 24, 14, 9, 12, 5], [-4, 33, 8, 10, 8, -8], [6, 28, 5, 14, 5, 3]];
    for (const [x, y, w, h, d, tilt] of parts) {
      const m = new Mesh(roundedBox(w, h, d, 0.5, 1), black);
      m.position.set(x, y + h / 2, 0);
      m.rotation.z = MathUtils.degToRad(tilt);
      sil.add(m);
    }
    const spire = new Mesh(new ConeGeometry(4, 9, 4), black);
    spire.position.set(-4, 47, 0);
    sil.add(spire);
    const win = new Mesh(roundedBox(2.4, 3, 0.4, 0.2, 1), makeMat('LAMPSHADE', { emissive: 'LAMPSHADE_GLOW', emissiveIntensity: 3.5, fog: false }));
    win.position.set(-1, 18.5, 8.1);
    sil.add(win);
    sil.position.copy(GOAL).sub(O).add(new Vector3(0, 0, -14));
    root.add(sil);
    this.window = win;
    // a beacon on the ground so you know where to run
    const glow = new Mesh(roundedBox(4, 0.05, 4, 0.5, 1), makeMat('LAMPSHADE', { emissive: 'LAMPSHADE_GLOW', emissiveIntensity: 1.2, transparent: true, opacity: 0.6, fog: false }));
    glow.position.copy(GOAL).sub(O).setY(0.05);
    root.add(glow);
    // giant Grimsby
    const giant = new Neighbor(root);
    giant.root.scale.setScalar(5.5);
    giant.root.position.set(-60, 0, -36);
    giant.root.rotation.y = Math.PI / 2;
    this.giant = giant;
    this.giantAnim = new NeighborAnimator(giant);
    this.giantAnim.play('walk', 0);
    giant.setExpression('suspicious');
    CONFIG.world.warpIntensity = warp;
    this.root = root;
  }

  start() {
    const g = this.game;
    this.pending = false;
    this.done = true;
    this.active = true;
    this.t = 0;
    if (!this.root) this._build();
    this.root.visible = true;
    const p = g.player;
    // remember the waking world
    const sky = g.sky;
    this.saved = {
      fog: g.engine.scene.fog?.color.clone(), density: g.engine.scene.fog?.density, near: g.engine.scene.fog?.near, far: g.engine.scene.fog?.far,
      sunColor: g.lighting.sun.color.clone(), sunI: g.lighting.sun.intensity, hemiSky: g.lighting.hemi.color.clone(), hemiGround: g.lighting.hemi.groundColor.clone(),
    };
    sky.setColors(new Color(Palette.DREAM_SKY_TOP), new Color(Palette.DREAM_SKY_TOP).lerp(new Color(Palette.DREAM_SKY_BOTTOM), 0.5), new Color(Palette.DREAM_SKY_BOTTOM));
    if (g.engine.scene.fog) g.engine.scene.fog.color.set(Palette.DREAM_FOG);
    g.lighting.sun.color.set(Palette.DREAM_ACCENT).lerp(new Color(0x8a7cff), 0.5);
    g.lighting.sun.intensity = 1.1;
    g.lighting.hemi.color.set(Palette.DREAM_SKY_BOTTOM);
    g.lighting.hemi.groundColor.set(Palette.DREAM_GROUND);
    if (g.ai) { g.ai.frozen = true; g.neighbor.root.visible = false; }
    p.spawn(O.clone().add(new Vector3(0, 0.05, 4)), 0);
    g.postfx.flash = 0.8;
    Events.emit('music', { track: 'dream' });
    Events.emit('dream', { on: true });
    g.hud.showObjective('Run to the light.', 5);
  }

  end() {
    const g = this.game;
    this.active = false;
    this.root.visible = false;
    const s = this.saved;
    if (g.engine.scene.fog && s.fog) g.engine.scene.fog.color.copy(s.fog);
    g.lighting.sun.color.copy(s.sunColor);
    g.lighting.sun.intensity = s.sunI;
    g.lighting.hemi.color.copy(s.hemiSky);
    g.lighting.hemi.groundColor.copy(s.hemiGround);
    g.storyClock.apply();
    if (g.ai) { g.ai.frozen = false; g.neighbor.root.visible = true; }
    g.player.spawn(PLAYER_HOUSE.bedSpawn, PLAYER_HOUSE.bedSpawnYaw);
    g.postfx.flash = 1;
    g.postfx.desat = 0.6;
    this.wakeT = 2;
    Events.emit('sfx', { name: 'gasp' });
    Events.emit('music', { track: g.interaction?.inv.hasKey('basement') ? 'tension' : 'explore' });
    Events.emit('dream', { on: false });
  }

  update(dt) {
    if (this.wakeT > 0) {
      // coming round in your own bed: the white-out and grey fade away
      this.wakeT -= dt;
      const pf = this.game.postfx;
      pf.flash = Math.max(0, pf.flash - dt * 1.2);
      pf.desat = Math.max(0, pf.desat - dt * 0.5);
    }
    if (!this.active) return;
    const g = this.game;
    this.t += dt;
    const t = this.t;
    for (const f of this.floaters) {
      f.rotation.x += f.userData.spin.x * dt;
      f.rotation.y += f.userData.spin.y * dt;
      f.rotation.z += f.userData.spin.z * dt;
      f.position.y = f.userData.y0 + Math.sin(t * 0.4 + f.userData.bob) * 1.5;
    }
    // the giant crosses the background, slowly
    const gx = -60 + t * 1.5;
    this.giant.root.position.x = gx;
    this.giantAnim.speed = 1.2;
    this.giantAnim.update(dt * 0.45);
    this.giant.lookTarget = g.engine.camera.position;
    this.giant.update(dt);
    this.window.material.emissiveIntensity = 3 + Math.sin(t * 2) * 0.6;
    g.postfx.desat = Math.max(0, (g.postfx.desat || 0) - dt);
    if (!this.whiteT) g.postfx.flash = Math.max(0, g.postfx.flash - dt * 0.8);
    const p = g.player.curFeet;
    const reached = Math.hypot(p.x - GOAL.x, p.z - GOAL.z) < 7;
    if (reached || t > 90) {
      g.postfx.flash = Math.min(1, (this.whiteT = (this.whiteT ?? 0) + dt) * 2);
      if (this.whiteT > 0.6) { this.whiteT = 0; this.end(); }
    }
  }
}
