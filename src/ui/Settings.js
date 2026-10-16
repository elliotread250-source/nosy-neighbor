// Player settings: stored in localStorage (if it works), applied to CONFIG
// and to live systems. Graphics preset changes take effect after a restart
// because geometry detail is baked at load.
import { CONFIG } from '../config.js';
import { SaveSystem } from '../core/SaveSystem.js';
import { Events } from '../core/Events.js';

const qs = new URLSearchParams(location.search);

export const DEFAULTS = {
  preset: 'medium', renderScale: 1, shadows: true, outlines: true, bloom: true, grain: true,
  master: 0.9, music: 0.55, sfx: 0.9, ambience: 0.7, voice: 1,
  sensitivity: 0.0022, invertY: false, crouchToggle: false, headBob: true, fov: 85, bindings: {},
  difficulty: 'normal', reducedScare: false, subtitles: true, colorblindKeys: false,
};

export const Settings = {
  values: { ...DEFAULTS },

  // Before the world is built: graphics preset and difficulty.
  load() {
    const saved = SaveSystem.loadSettings();
    this.values = { ...DEFAULTS, ...saved, bindings: { ...(saved.bindings || {}) } };
    const v = this.values;
    if (!qs.get('gfx')) CONFIG.graphics.preset = v.preset;
    if (!qs.get('difficulty')) CONFIG.ai.difficulty = v.difficulty;
    const p = CONFIG.graphics.presets[CONFIG.graphics.preset];
    if (p) {
      if (saved.renderScale !== undefined) p.renderScale = v.renderScale;
      p.shadows = v.shadows;
      p.bloom = p.bloom && v.bloom;
    }
    this.applyConfig();
    return v;
  },

  applyConfig() {
    const v = this.values;
    Object.assign(CONFIG.audio, { master: v.master, music: v.music, sfx: v.sfx, ambience: v.ambience, voice: v.voice });
    CONFIG.player.mouseSensitivity = v.sensitivity;
    CONFIG.player.invertY = v.invertY;
    CONFIG.player.crouchToggle = v.crouchToggle;
    CONFIG.player.headBob = v.headBob;
    CONFIG.camera.fov = v.fov;
    CONFIG.catch.reducedScare = v.reducedScare;
    CONFIG.post.grainOn = v.grain;
    CONFIG.post.bloom = v.bloom;
  },

  // Live changes once the game exists.
  apply(game) {
    this.applyConfig();
    const v = this.values;
    if (!game) return;
    game.audio?.applyVolumes();
    for (const [action, code] of Object.entries(v.bindings)) if (game.input.bindings[action]) game.input.bindings[action][0] = code;
    const p = CONFIG.graphics.presets[CONFIG.graphics.preset];
    if (p) {
      p.renderScale = v.renderScale;
      p.shadows = v.shadows;
    }
    game.engine.applyGraphics();
    // outlines: the edge pass and the inverted hulls
    const edge = game.postfx && Object.values(game.postfx.scenePass).find((x) => x?.uniforms?.uOpacity);
    if (edge) edge.uniforms.uOpacity.value = v.outlines ? CONFIG.post.edgeOpacity : 0;
    if (this._outlines !== v.outlines) {
      this._outlines = v.outlines;
      game.engine.scene.traverse((m) => { if (m.userData?.isOutline) m.visible = v.outlines; });
    }
    if (game.ai) {
      const A = CONFIG.ai;
      A.difficulty = v.difficulty;
      game.ai.diff = A.difficulties[v.difficulty] || A.difficulties.normal;
    }
    Events.emit('settings:changed', { values: v });
  },

  set(key, value, game) {
    this.values[key] = value;
    SaveSystem.saveSettings(this.values);
    this.apply(game);
  },

  reset(game) {
    this.values = { ...DEFAULTS, bindings: {} };
    SaveSystem.saveSettings(this.values);
    this.apply(game);
  },
};
