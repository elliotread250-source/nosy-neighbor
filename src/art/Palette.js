import { Color, SRGBColorSpace } from 'three';

// Every color in the game. No inline hex codes anywhere else.
const HEX = {
  // 4.1 Sky and atmosphere
  SKY_ZENITH: 0x3e7bea,
  SKY_MID: 0x7fb2f5,
  SKY_HORIZON: 0xf8d9b8,
  SUN_DISC: 0xfff3c4,
  SUN_LIGHT: 0xffe7b0,
  CLOUD_TOP: 0xffffff,
  CLOUD_BOTTOM: 0xbdb5d8,
  FOG_DAY: 0xe9d8c6,
  FOG_DUSK: 0xe8a27c,
  FOG_NIGHT: 0x1f2747,

  // 4.2 Ground and street
  GRASS: 0x6cc24a,
  GRASS_DARK: 0x4fa236,
  GRASS_LIGHT: 0x9bdb5e,
  ASPHALT: 0x5f6268,
  ASPHALT_WARM: 0x6e6a6a,
  ROAD_LINE: 0xffd23f,
  SIDEWALK: 0xe8dfc9,
  CURB: 0xcfc6af,
  DIRT: 0xa8743f,
  GRAVEL: 0xb9a88e,

  // 4.3 Neighbor's house exterior
  NH_SIDING_MAIN: 0xf2c94c,
  NH_SIDING_MAIN_2: 0xebc14a,
  NH_SIDING_ALT: 0x7cc6b6,
  NH_SIDING_ADDON: 0xe07a5f,
  NH_TRIM: 0xfff8ec,
  NH_ROOF: 0xb33a3a,
  NH_ROOF_ALT: 0x3f5e8c,
  NH_DOOR_FRONT: 0xc0392b,
  NH_SHUTTERS: 0x2e86ab,
  NH_PLANKS: 0xb5835a,
  NH_PLANKS_OLD: 0x8c6a4f,
  NH_METAL_SHEET: 0x9aa7b0,
  NH_SCAFFOLD: 0xc9a227,
  NH_FOUNDATION: 0xa79a8a,

  // 4.4 Player's house
  PH_SIDING: 0x9fd3f0,
  PH_TRIM: 0xffffff,
  PH_ROOF: 0x4d5d7a,
  PH_DOOR: 0xf4d35e,

  // Flanking houses
  HOUSE_PINK: 0xf7c6d0,
  HOUSE_GREEN: 0xc5e8b7,
  HOUSE_LAVENDER: 0xd6c8f0,
  HOUSE_PEACH: 0xffd3b0,

  // 4.5 Neighbor's interior
  WALLPAPER_GREEN: 0xa8c686,
  WALLPAPER_GREEN_STRIPE: 0x8fb370,
  WALLPAPER_PINK: 0xf2b5b5,
  WALLPAPER_PINK_DOT: 0xe89393,
  WALLPAPER_BLUE: 0x9ec5e8,
  WALLPAPER_BLUE_DIAMOND: 0x7fafd9,
  WALLPAPER_YELLOW: 0xf6e3a1,
  WALLPAPER_YELLOW_STRIPE: 0xe3c873,
  WALL_PAINT_PURPLE: 0x9b7bc8,
  WAINSCOT: 0xd9c3a0,
  FLOOR_WOOD: 0xb9773e,
  FLOOR_WOOD_DARK: 0x8a5328,
  FLOOR_TILE_A: 0xf3f0e6,
  FLOOR_TILE_B: 0x2e2e36,
  CARPET_RED: 0xb23a48,
  CARPET_GREEN: 0x4e8c5a,
  CEILING: 0xfbf4e6,
  BASEMENT_WALL: 0x6f8f86,
  BASEMENT_FLOOR: 0x4c5a57,
  BASEMENT_LIGHT: 0xa6f0d0,

  // 4.6 Furniture and props
  WOOD_LIGHT: 0xd9a066,
  WOOD_MID: 0xa86b3c,
  WOOD_DARK: 0x6b3f22,
  FRIDGE: 0xf7f3e3,
  FRIDGE_HANDLE: 0xc8ccd0,
  RETRO_MINT: 0xa8e6cf,
  RETRO_ORANGE: 0xf39c4a,
  SOFA_GREEN: 0x6b8e4e,
  LAMPSHADE: 0xf5dca0,
  LAMPSHADE_GLOW: 0xffd98a,
  TV_BODY: 0x5b3a29,
  TV_SCREEN_OFF: 0x2c3e50,
  TV_SCREEN_ON: 0x9fe2ff,
  RED_TOY: 0xe63946,
  BLUE_TOY: 0x457b9d,
  YELLOW_TOY: 0xffd166,
  CARDBOARD: 0xc9965b,
  CARDBOARD_TAPE: 0xe8d3a7,
  METAL: 0xa7b1ba,
  METAL_DARK: 0x5c6770,
  BRASS: 0xd4a93c,

  // 4.7 Keys
  KEY_RED: 0xff3b3b,
  KEY_BLUE: 0x2f80ed,
  KEY_GREEN: 0x27ae60,
  KEY_YELLOW: 0xf2c94c,
  KEY_PURPLE: 0x9b51e0,
  KEY_BASEMENT: 0xff7a00,

  // 4.8 The neighbor
  NB_SKIN: 0xf2c6a0,
  NB_SKIN_SHADOW: 0xd9a27e,
  NB_NOSE: 0xe89a84,
  NB_NOSE_RUN: 0xe07a6a,
  NB_CHEEKS: 0xeba897,
  NB_HAIR: 0x5a3a22,
  NB_MUSTACHE: 0x4a2f1b,
  NB_EYEBROWS: 0x3e2716,
  NB_EYE_WHITE: 0xf7f4ec,
  NB_IRIS: 0x3e8e5a,
  NB_PUPIL: 0x111111,
  NB_EYE_BAGS: 0xc49a8c,
  NB_SHIRT: 0xf4d35e,
  NB_VEST_DARK: 0x2c4a7a,
  NB_VEST_LIGHT: 0x6fa3d8,
  NB_VEST_LINE: 0xe9eef5,
  NB_PANTS: 0x6b4e3d,
  NB_BELT: 0x3a2a1e,
  NB_BUCKLE: 0xd4a93c,
  NB_GLOVES: 0x1e1e22,
  NB_SHOES: 0x3b2416,
  NB_SKIN_SSS: 0xc97a6a,

  // Player
  PLAYER_SKIN: 0xf5c9a4,
  PLAYER_SLEEVE: 0x3f7fd0,

  // 4.9 Night and dream
  DREAM_SKY_TOP: 0x2a1b4d,
  DREAM_SKY_BOTTOM: 0xc0397b,
  DREAM_FOG: 0x5b2a6e,
  DREAM_ACCENT: 0xff5e5b,
  DREAM_GROUND: 0x3a2e5c,

  // Shading, outlines, grading
  SHADOW_TINT_OUT: 0x5b5fa8,
  SHADOW_TINT_IN: 0x8a5a44,
  RIM: 0xfff1d6,
  OUTLINE_BASE: 0x2a1e3a,
  EDGE_LINE: 0x3a2c44,
  GRADE_LIFT: 0x3a2e5c,
  GRADE_GAIN: 0xfff2d6,
  GLASS: 0xcde8f5,
  LAMP_LIGHT: 0xffc97a,
  GODRAY: 0xffe6a8,
  HEMI_SKY_DAY: 0xbfd9ff,
  HEMI_GROUND_DAY: 0x9c7a52,
  HEMI_SKY_IN: 0xffe2b8,
  HEMI_GROUND_IN: 0x7a4e33,
  LAMP_POST: 0x2f4f3e,
  HYDRANT: 0xd7263d,
  WHITE: 0xffffff,
  BLACK_SOFT: 0x1c1a22,

  // Debug / test scene accents
  TOMATO: 0xe85d4a,
  TANGERINE: 0xf39237,
  BUBBLEGUM: 0xf47fb0,
  GRAPE: 0x8e5cc8,
  LIME: 0x9bd34a,
  SKY_TOY: 0x5bb3f0,
};

export const HEX_PALETTE = HEX;

export const Palette = Object.fromEntries(Object.entries(HEX).map(([k, v]) => [k, new Color(v)]));

// CSS string version for canvas painting.
export function css(name, alpha = 1) {
  const c = Palette[name];
  if (!c) throw new Error(`Unknown palette color ${name}`);
  if (alpha >= 1) return `#${c.getHexString()}`;
  const s = srgb(c);
  return `rgba(${Math.round(s.r * 255)},${Math.round(s.g * 255)},${Math.round(s.b * 255)},${alpha})`;
}

export function hex(name) {
  const v = HEX[name];
  if (v === undefined) throw new Error(`Unknown palette color ${name}`);
  return v;
}

// sRGB 0..1 components, for painting palette colors into canvases.
const _rgb = { r: 0, g: 0, b: 0 };
export function srgb(nameOrColor) {
  const c = typeof nameOrColor === 'string' ? Palette[nameOrColor] : nameOrColor;
  c.getRGB(_rgb, SRGBColorSpace);
  return { r: _rgb.r, g: _rgb.g, b: _rgb.b };
}
