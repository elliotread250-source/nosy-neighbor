// Post stack: scene render with depth -> screen-space edge lines (from depth
// and reconstructed normals) -> subtle bloom -> color grade + chase FX +
// vignette + grain -> output. Every stage can be toggled from config/menus.
import {
  WebGLRenderTarget, DepthTexture, UnsignedIntType, HalfFloatType, Vector2, Matrix4, ShaderMaterial, Uniform,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CONFIG, gfx } from '../config.js';
import { Palette } from './Palette.js';

const PF = CONFIG.post;

// ---------------------------------------------------------------------------
// Scene + edges: renders the scene to an MSAA target with a depth texture,
// then composites dark-tinted edge lines into the composer's write buffer.
// ---------------------------------------------------------------------------
const EDGE_FRAG = /* glsl */ `
#include <packing>
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 uTexel;
uniform float uNear;
uniform float uFar;
uniform mat4 uProjInv;
uniform vec3 uLineColor;
uniform float uOpacity;
uniform float uFadeStart;
uniform float uFadeEnd;
uniform float uDepthK;
uniform float uNormalK;
uniform float uEnabled;
varying vec2 vUv;

vec3 viewPos(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  vec4 ndc = vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  vec4 v = uProjInv * ndc;
  return v.xyz / v.w;
}

void main() {
  vec4 col = texture2D(tColor, vUv);
  if (uEnabled < 0.5) { gl_FragColor = col; return; }
  vec2 dx = vec2(uTexel.x, 0.0), dy = vec2(0.0, uTexel.y);
  vec3 c = viewPos(vUv);
  vec3 l = viewPos(vUv - dx), r = viewPos(vUv + dx);
  vec3 d = viewPos(vUv - dy), u = viewPos(vUv + dy);
  float dc = -c.z;
  if (dc > uFar * 0.98) { gl_FragColor = col; return; } // sky
  // 1/z is linear in screen space on planes, so its laplacian is ~0 on flat
  // surfaces at any angle and spikes only at depth discontinuities.
  float ic = 1.0 / dc;
  float lap = (1.0 / -l.z + 1.0 / -r.z + 1.0 / -u.z + 1.0 / -d.z) - 4.0 * ic;
  // keep the line on the near (object) side only
  float depthEdge = clamp(-lap / ic * uDepthK, 0.0, 1.0);
  // creases: compare normals reconstructed from opposite neighbor pairs
  vec3 nA = normalize(cross(r - c, u - c));
  vec3 nB = normalize(cross(l - c, d - c));
  float crease = clamp((1.0 - dot(nA, nB)) * uNormalK - 0.15, 0.0, 1.0);
  // ignore crease noise where depth jumps (handled by the depth term)
  float edge = max(depthEdge, crease * (1.0 - step(0.02 * dc, abs(r.z - l.z) + abs(u.z - d.z))));
  float fade = 1.0 - smoothstep(uFadeStart, uFadeEnd, dc);
  float a = clamp(edge, 0.0, 1.0) * uOpacity * fade;
  gl_FragColor = vec4(mix(col.rgb, uLineColor, a), col.a);
}
`;

const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

class SceneEdgePass extends Pass {
  constructor(scene, camera) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.needsSwap = true;
    this.rt = null;
    this.material = new ShaderMaterial({
      uniforms: {
        tColor: new Uniform(null),
        tDepth: new Uniform(null),
        uTexel: new Uniform(new Vector2()),
        uNear: new Uniform(camera.near),
        uFar: new Uniform(camera.far),
        uProjInv: new Uniform(new Matrix4()),
        uLineColor: new Uniform(Palette.EDGE_LINE.clone()),
        uOpacity: new Uniform(PF.edgeOpacity),
        uFadeStart: new Uniform(PF.edgeFadeStart),
        uFadeEnd: new Uniform(PF.edgeFadeEnd),
        uDepthK: new Uniform(PF.edgeDepthK),
        uNormalK: new Uniform(PF.edgeNormalK),
        uEnabled: new Uniform(1),
      },
      vertexShader: QUAD_VERT,
      fragmentShader: EDGE_FRAG,
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.material);
  }

  setSize(w, h) {
    if (this.rt) this.rt.dispose();
    const depthTexture = new DepthTexture(w, h, UnsignedIntType);
    this.rt = new WebGLRenderTarget(w, h, {
      type: HalfFloatType,
      depthTexture,
      samples: gfx().msaa,
    });
    // edge thickness ~1px at 1080p, scaled with resolution
    const k = Math.max(1, h / 1080) * PF.edgeThickness;
    this.material.uniforms.uTexel.value.set(k / w, k / h);
  }

  render(renderer, writeBuffer) {
    renderer.setRenderTarget(this.rt);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    const u = this.material.uniforms;
    u.tColor.value = this.rt.texture;
    u.tDepth.value = this.rt.depthTexture;
    u.uNear.value = this.camera.near;
    u.uFar.value = this.camera.far;
    u.uProjInv.value.copy(this.camera.projectionMatrixInverse);
    u.uEnabled.value = PF.edges ? 1 : 0;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }

  dispose() {
    this.rt?.dispose();
    this.material.dispose();
    this.quad.dispose();
  }
}

// ---------------------------------------------------------------------------
// Grade: saturation, contrast, lift/gain, warmth, chase FX, vignette, grain.
// Works in a gamma-ish space so the numbers feel like a photo editor.
// ---------------------------------------------------------------------------
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uSaturation: { value: PF.saturation },
    uContrast: { value: PF.contrast },
    uLift: { value: Palette.GRADE_LIFT.clone() },
    uLiftAmt: { value: PF.liftAmount },
    uGain: { value: Palette.GRADE_GAIN.clone() },
    uGainAmt: { value: PF.gainAmount },
    uWarmth: { value: PF.warmth },
    uChase: { value: 0 },
    uChaseTint: { value: Palette.DREAM_ACCENT.clone() },
    uAberration: { value: PF.chaseAberration },
    uVignette: { value: PF.vignette },
    uVignetteChase: { value: PF.vignetteChase },
    uPulse: { value: 0 },
    uGrain: { value: PF.grain },
    uTime: { value: 0 },
    uResolution: { value: new Vector2(1, 1) },
    uDesat: { value: 0 },
    uFade: { value: 0 },
    uFlash: { value: 0 },
    uGradeOn: { value: 1 },
    uVignetteOn: { value: 1 },
    uGrainOn: { value: 1 },
  },
  vertexShader: QUAD_VERT,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uSaturation, uContrast, uLiftAmt, uGainAmt, uWarmth;
uniform vec3 uLift, uGain, uChaseTint;
uniform float uChase, uAberration, uVignette, uVignetteChase, uPulse, uGrain, uTime;
uniform vec2 uResolution;
uniform float uDesat, uFade, uFlash, uGradeOn, uVignetteOn, uGrainOn;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = vUv;
  vec2 cc = uv - 0.5;
  float r2 = dot(cc, cc);
  vec3 col;
  // chromatic aberration, edges only, during chase
  float ab = uAberration * uChase * r2 * 4.0;
  if (ab > 0.0001) {
    vec2 off = cc * ab / uResolution * 2.0;
    col.r = texture2D(tDiffuse, uv + off).r;
    col.g = texture2D(tDiffuse, uv).g;
    col.b = texture2D(tDiffuse, uv - off).b;
  } else col = texture2D(tDiffuse, uv).rgb;

  vec3 g = pow(max(col, 0.0), vec3(1.0 / 2.2));
  if (uGradeOn > 0.5) {
    float sat = uSaturation + (${PF.chaseSaturation.toFixed(3)} - uSaturation) * uChase;
    sat *= (1.0 - uDesat);
    float l = dot(g, vec3(0.299, 0.587, 0.114));
    g = mix(vec3(l), g, sat);
    g = (g - 0.5) * uContrast + 0.5;
    vec3 liftC = pow(uLift, vec3(1.0 / 2.2));
    vec3 gainC = pow(uGain, vec3(1.0 / 2.2));
    float lum = clamp(dot(g, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    g = mix(g, liftC + g * (1.0 - liftC * 0.5), uLiftAmt * (1.0 - lum));
    g = mix(g, g * gainC * 1.04, uGainAmt * lum);
    g += vec3(uWarmth, uWarmth * 0.35, -uWarmth);
    // red edge tint during chase
    g = mix(g, g * uChaseTint * 1.3, uChase * smoothstep(0.08, 0.5, r2) * 0.45);
  }
  if (uVignetteOn > 0.5) {
    float vig = mix(uVignette, uVignetteChase, uChase) * (1.0 + uPulse * 0.25);
    g *= 1.0 - vig * smoothstep(0.12, 0.62, r2 * 1.35);
  }
  if (uGrainOn > 0.5) {
    float n = hash(uv * uResolution + fract(uTime * 7.13) * 100.0) - 0.5;
    g += n * uGrain;
  }
  g = mix(g, vec3(1.0), uFlash);
  g *= 1.0 - uFade;
  gl_FragColor = vec4(pow(max(g, 0.0), vec3(2.2)), 1.0);
}
`,
};

export class PostFX {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.composer = new EffectComposer(renderer);
    this.scenePass = new SceneEdgePass(scene, camera);
    this.bloom = new UnrealBloomPass(new Vector2(256, 256), PF.bloomStrength, PF.bloomRadius, PF.bloomThreshold);
    this.grade = new ShaderPass(GradeShader);
    this.output = new OutputPass();
    this.composer.addPass(this.scenePass);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.grade);
    this.composer.addPass(this.output);
    this.time = 0;
    // driven by gameplay
    this.chase = 0;
    this.pulse = 0;
    this.desat = 0;
    this.fade = 0;
    this.flash = 0;
  }

  setSize(w, h, pr) {
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.grade.uniforms.uResolution.value.set(w * pr, h * pr);
  }

  render(dt) {
    this.time += dt;
    const u = this.grade.uniforms;
    u.uTime.value = this.time;
    u.uChase.value = this.chase;
    u.uPulse.value = this.pulse;
    u.uDesat.value = this.desat;
    u.uFade.value = this.fade;
    u.uFlash.value = this.flash;
    u.uGradeOn.value = PF.grade ? 1 : 0;
    u.uVignetteOn.value = PF.vignetteOn ? 1 : 0;
    u.uGrainOn.value = PF.grainOn ? 1 : 0;
    this.bloom.enabled = PF.bloom && gfx().bloom;
    this.composer.render(dt);
  }
}
