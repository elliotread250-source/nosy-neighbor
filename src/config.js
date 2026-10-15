// Every tunable number in the game lives here. Edit this file to tune feel.
// Units: meters, seconds, degrees unless a name says otherwise.
// Colors are referenced by Palette.js name, never by hex.

const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');

export const CONFIG = {
  debug: params.get('debug') === '1',
  shotMode: params.has('shot'),

  graphics: {
    preset: params.get('gfx') || 'medium', // low | medium | high
    presets: {
      low: { renderScale: 0.75, shadowMapSize: 512, shadows: true, bevelSegments: 2, maxPixelRatio: 1, msaa: 0, bloom: false, outlineScale: 0.8, grassCount: 2000 },
      medium: { renderScale: 1.0, shadowMapSize: 1024, shadows: true, bevelSegments: 3, maxPixelRatio: 1.5, msaa: 4, bloom: true, outlineScale: 1, grassCount: 4000 },
      high: { renderScale: 1.0, shadowMapSize: 2048, shadows: true, bevelSegments: 3, maxPixelRatio: 2, msaa: 4, bloom: true, outlineScale: 1.15, grassCount: 6000 },
    },
  },

  camera: {
    fov: 85,
    fovMin: 70,
    fovMax: 100,
    sprintFovBoost: 6,
    chaseFovBoost: 4,
    fovLerp: 6,
    near: 0.05,
    far: 900,
  },

  physics: {
    fixedStep: 1 / 60,
    maxSubSteps: 5,
    gravity: -20, // a bit heavier than real for snappy, cartoon jumps
  },

  player: {
    eyeHeight: 1.6,
    crouchEyeHeight: 0.95,
    height: 1.75,
    crouchHeight: 1.1,
    radius: 0.3,
    walkSpeed: 3.2,
    sprintSpeed: 5.2,
    crouchSpeed: 1.6,
    carrySpeedMul: 0.7,
    groundAccel: 40,
    airAccel: 8,
    jumpVelocity: 7.0, // apex ~1.22 m: clears a 1 m crate
    coyoteTime: 0.12,
    jumpBuffer: 0.12,
    staminaDrainTime: 6, // seconds of sprint from full
    staminaRecoverTime: 4, // seconds to refill from empty
    staminaRecoverDelay: 0.6,
    staminaMinToSprint: 0.2,
    crouchLerp: 10,
    mouseSensitivity: 0.0022,
    invertY: false,
    crouchToggle: false,
    pitchLimit: 88,
    controllerOffset: 0.02,
    autostepHeight: 0.42,
    autostepMinWidth: 0.18,
    snapToGround: 0.3,
    maxSlopeClimb: 50,
    minSlopeSlide: 55,
    pushMass: 60, // used to shove dynamic props
    headBob: true,
    bobWalkAmp: 0.02,
    bobSprintAmp: 0.04,
    bobSwayAmp: 0.012,
    bobStride: 1.5, // meters per full bob cycle (two footsteps)
    landDipPerMs: 0.012, // camera dip per m/s of fall speed
    landDipMax: 0.16,
    leanDistance: 0.35,
    leanRoll: 8,
    leanLerp: 9,
    noclipSpeed: 10,
    climbSpeed: 2.6,
  },

  world: {
    warpIntensity: 1.0, // global multiplier on every warp. Crank it for dream sequences.
    worldSeed: 1337,
    windStrength: 1.0,
  },

  lighting: {
    // Physically-based light units in three r155+; toon BRDF divides by PI, tuned by eye.
    sunIntensity: 2.3,
    sunElevation: 35,
    sunAzimuth: 248, // degrees, compass-ish: 270 = west, 248 = west-southwest
    sunDistance: 60,
    shadowRadius: 34, // half-extent of the sun shadow frustum around the player
    shadowBias: -0.0008,
    shadowNormalBias: 0.07,
    shadowSoftness: 3,
    hemiIntensity: 1.45,
    hemiIntensityIndoor: 1.15,
    indoorFade: 3, // crossfade speed
    hemiSky: 'HEMI_SKY_DAY',
    hemiGround: 'HEMI_GROUND_DAY',
    ambientIntensity: 0.15,
    maxPointLights: 8,
    lampIntensity: 0.9,
    ambientIndoor: 0.55,
  },

  toon: {
    gradientSteps: [0.35, 0.6, 0.85, 1.0],
    gradientSoftness: 0.08, // width of the ramp between tone bands (0 = hard cel)
    shadowTintOutdoor: 'SHADOW_TINT_OUT',
    shadowTintOutdoorStrength: 0.38,
    shadowTintIndoor: 'SHADOW_TINT_IN',
    shadowTintIndoorStrength: 0.3,
    rimColor: 'RIM',
    rimStrengthProp: 0.25,
    rimStrengthCharacter: 0.4,
    rimPower: 3.0,
    specThreshold: 0.92,
    specStrength: 0.35,
    minBrightness: 0.27, // ambient lift floor, fraction of albedo
    maxBrightness: 1.15, // lit color never exceeds this multiple of albedo
  },

  post: {
    enabled: true,
    edges: true,
    edgeOpacity: 0.55,
    edgeThickness: 1.0,
    edgeFadeStart: 22,
    edgeFadeEnd: 40,
    edgeDepthK: 40.0,
    edgeNormalK: 5.0,
    bloom: true,
    bloomStrength: 0.35,
    bloomRadius: 0.6,
    bloomThreshold: 1.2, // linear; only emissives and the sun exceed it
    grade: true,
    saturation: 1.18,
    chaseSaturation: 1.35,
    contrast: 1.06,
    liftAmount: 0.06,
    gainAmount: 0.08,
    warmth: 0.012,
    chaseAberration: 1.6, // px at screen edges
    vignetteOn: true,
    vignette: 0.35,
    vignetteChase: 0.6,
    grainOn: true,
    grain: 0.025,
  },

  outline: {
    thickness: 0.02, // meters at the reference distance
    refDistance: 4,
    minScale: 0.5,
    maxScale: 2.2,
    colorMul: 0.25,
    toward: 'OUTLINE_BASE',
    towardAmount: 0.5,
  },

  godRays: {
    opacity: 0.15,
    motesPerWindow: 40,
  },

  interior: {
    cullDistance: 42, // outdoors, interiors beyond this are hidden
  },

  fog: {
    near: 60,
    far: 220,
  },

  sky: {
    radius: 450,
    sunDiscSize: 0.9994, // cos of disc angular radius
    sunGlow: 0.55,
    cloudCount: 13,
    cloudMinDist: 120,
    cloudMaxDist: 300,
    cloudWind: 0.5,
  },

  warpBudgets: {
    neighborExteriorLean: [1.5, 4],
    neighborInteriorLean: [0.5, 2],
    neighborDoorSkew: [0.02, 0.05],
    playerHouseLean: [0, 0.5],
    otherHouseLean: [0.5, 1.5],
    furnitureLean: [1, 5],
    furnitureTaper: [0.9, 1.15],
    furnitureBulge: [0, 0.08],
    fenceSectionRot: 2,
    fencePicketRot: 3,
    treeTwist: [10, 25],
    treeLean: [3, 8],
    wobble: 0.012,
  },

  debugKeys: {
    stats: 'F3',
    nav: 'F4',
    vision: 'F5',
    freezeAI: 'F6',
    noclip: 'F7',
    giveAll: 'F8',
    dumpBrain: 'F9',
  },
};

export function gfx() {
  return CONFIG.graphics.presets[CONFIG.graphics.preset] || CONFIG.graphics.presets.medium;
}
