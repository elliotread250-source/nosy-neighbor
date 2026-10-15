// Renderer, scene, camera, resize and clock. Post-processing plugs in via
// engine.setPostFX(fx) where fx has render(dt) and setSize(w, h).
import {
  WebGLRenderer, Scene, PerspectiveCamera, SRGBColorSpace, PCFShadowMap, NoToneMapping, Timer,
} from 'three';
import { CONFIG, gfx } from '../config.js';

export class Engine {
  constructor(container) {
    this.container = container;
    this.renderer = new WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: CONFIG.shotMode,
    });
    const r = this.renderer;
    r.outputColorSpace = SRGBColorSpace;
    r.toneMapping = NoToneMapping; // palette colors land on screen as authored
    r.shadowMap.enabled = gfx().shadows;
    r.shadowMap.type = PCFShadowMap;
    container.appendChild(r.domElement);
    r.domElement.tabIndex = 0;
    r.info.autoReset = false; // reset once per frame so stats count every pass

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(CONFIG.camera.fov, 1, CONFIG.camera.near, CONFIG.camera.far);
    this.scene.add(this.camera);

    this.timer = new Timer();
    this.timer.connect?.(document);
    this.postfx = null;

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  get canvas() {
    return this.renderer.domElement;
  }

  applyGraphics() {
    const g = gfx();
    this.renderer.shadowMap.enabled = g.shadows;
    this.resize();
  }

  resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const g = gfx();
    const pr = Math.min(window.devicePixelRatio || 1, g.maxPixelRatio) * g.renderScale;
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.postfx?.setSize(w, h, pr);
  }

  setPostFX(fx) {
    this.postfx = fx;
    this.resize();
  }

  tick() {
    this.timer.update();
    return Math.min(this.timer.getDelta(), 0.1);
  }

  render(dt) {
    this.renderer.info.reset();
    if (this.postfx) this.postfx.render(dt);
    else this.renderer.render(this.scene, this.camera);
  }
}
