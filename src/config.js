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

  brain: {
    trapAt: 2, // entries through the same opening before a bear trap goes in
    cameraAt: 3,
    boardAt: 4,
    hideAt: 3, // uses of one hiding spot before he always checks it first
    glueAt: 3, // windows broken
    lureIgnoreAt: 3, // the third time a lure type is used, he ignores it
    roomBiasSeconds: 25, // seconds in a room per extra patrol weight
    installDistance: 16, // he only installs things when you're this far away (or outside)
    maxTraps: 6,
    maxCameras: 4,
    maxBoards: 3,
    maxGlue: 4,
    trapRadius: 0.34,
    trapHold: 3, // seconds stuck
    trapMash: 0.35, // seconds off per key mash
    cameraRange: 6.5,
    cameraFov: 52,
    cameraCooldown: 5,
    glueSlow: 0.3,
    glueJarLife: 14,
    glueThrowEvery: 7,
    shotLength: 2.2,
  },

  interact: {
    reach: 2.2,
    chargeTime: 0.8, // seconds to a full-power throw
    throwMin: 4, // m/s for a tap
    throwMax: 15, // m/s fully charged (for a 0.5 kg thing)
    throwUp: 1.6, // upward bias
    thrownWindow: 3, // seconds a thrown thing counts as "thrown" (stuns, breaks glass)
    pryTime: 0.9, // seconds of holding E per board
    magnetRange: 12,
    magnetCone: 0.16, // radians
    flashlightIntensity: 26,
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

  ai: {
    difficulty: params.get('difficulty') || 'normal', // easy | normal | hard
    difficulties: {
      easy: { runSpeed: 5.0, sight: 0.85, detect: 0.7, hearing: 0.8, adapt: 1.4, throws: false },
      normal: { runSpeed: 5.6, sight: 1.0, detect: 1.0, hearing: 1.0, adapt: 1.0, throws: false },
      hard: { runSpeed: 6.0, sight: 1.15, detect: 1.3, hearing: 1.25, adapt: 0.75, throws: true },
    },
    height: 2.0,
    radius: 0.34,
    walkSpeed: 1.4,
    sneakSpeed: 1.0,
    investigateSpeed: 1.9,
    accel: 6, // m/s^2 at walking speeds
    runAccelTime: 0.6, // seconds from walk to full run
    runTurnAccel: 11, // lower = wider skids on corners
    turnRate: 7, // rad/s for facing
    fov: 110,
    peripheral: 25, // outer degrees of the cone that fill the meter slowly
    peripheralRate: 0.35,
    rangeDay: 22,
    rangeIndoor: 14,
    rangeDark: 8,
    detectRate: 1.7, // meter units/s at point blank, fully visible, moving
    detectDecay: 0.3,
    suspicious: 0.22,
    hearingThreshold: 0.12,
    noiseRange: 16, // meters a loudness-1 sound carries
    wallAttenuation: 0.5, lureWallAttenuation: 0.74, // TVs and kettles carry through walls
    memory: 20,
    loseSightTime: 4,
    catchDistance: 1.1,
    stareTime: 5,
    searchMin: 2,
    searchMax: 4,
    searchSkip: 0.3,
    searchRadius: 9,
    stunTime: 1,
    hearReactTime: 0.5,
    doorOpenDist: 1.3,
    repathInterval: 0.4,
    investigateLook: [4, 8],
  },

  catch: {
    slowTo: 0.3,
    slowIn: 0.15,
    wrench: 0.2,
    cutAt: 1.05, // seconds (real time) until the hard cut to black
    blackFor: 0.45,
    colorBack: 1.5,
    reducedScare: params.has('gentle'),
  },

  storyClock: {
    perCatch: 0.2,
    sunElevationEnd: 13,
    sunAzimuthEnd: 262,
    blendTime: 3,
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
