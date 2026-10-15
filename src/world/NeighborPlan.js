// Mr. Grimsby's house as data. Front faces south (+z) toward the street.
// x: west (-) to east (+). Wall openings: `at` = center offset from `from`.
// Doors are 0.95 x 2.75 (tall and narrow). Ceilings 3.2 to 3.6 m.
//
//            back yard (north, -z)
//   z=-26 +-----------------------------------+
//         | bath | mudroom |stair| kitchen    |   F0 (y 0.6)
//   z=-22 |------+---door--+-----+            |
//         |              |hall|   ------------| z=-20
//         |   living     |    |   dining      |
//   z=-14 +------[win]--[win]-[DOOR]-[win]-[win]+
//                 porch (z -14..-11.2)

export const NH = {
  x0: -8, x1: 8, z0: -26, z1: -14,
  F0: { y: 0.6, h: 3.6 },
  F1: { y: 4.5, h: 3.4 },
  F2: { y: 8.2, h: 3.6 },
  TOMATO: { y: 8.6, h: 2.8, x0: 5, x1: 9, z0: -23, z1: -19 },
  TOWER: { y: 12.0, h: 4.4, x0: -5, x1: -2, z0: -23, z1: -20 },
  slab: 0.3,
  extT: 0.3,
  intT: 0.16,
  door: { w: 0.95, h: 2.75 },
  porch: { z0: -14, z1: -11.2, y: 0.6, roofBack: 4.3, roofFront: 3.85 },
};

const D = (at, extra = {}) => ({ at, w: 0.95, bottom: 0, top: 2.75, door: true, ...extra });
const W = (at, w = 0.9, bottom = 0.9, top = 2.5, extra = {}) => ({ at, w, bottom, top, window: true, ...extra });

// ---------------------------------------------------------------- walls
// kind: 'ext' (siding outside) or 'int'. id lets doors/windows be referenced.
export const WALLS = [
  // ---- F0 exterior ----
  { id: 'f0-front', floor: 'F0', kind: 'ext', axis: 'x', from: -8, to: 8, at: -14, lean: 1.6, out: 1,
    openings: [W(2, 0.9, 0.9, 2.5, { id: 'w-living1', shutters: true, box: true }), W(4.5, 0.9, 0.9, 2.5, { id: 'w-living2', shutters: true, box: true, dead: true, crooked: 1 }),
      D(8, { id: 'd-front', w: 1.05, lock: 'yellow', front: true }),
      W(11.5, 0.9, 0.9, 2.5, { id: 'w-dining1', shutters: true, box: true, dead: true }), W(14, 0.9, 0.9, 2.5, { id: 'w-dining2', shutters: true, box: true })] },
  { id: 'f0-back', floor: 'F0', kind: 'ext', axis: 'x', from: -8, to: 8, at: -26, lean: -1.8, out: -1,
    openings: [W(4.2, 0.8, 1.2, 2.4, { id: 'w-mud' }), D(6, { id: 'd-back', screen: true, top: 2.6 }), W(13, 1.2, 1.2, 2.4, { id: 'w-kitchen' })] },
  { id: 'f0-west', floor: 'F0', kind: 'ext', axis: 'z', from: -14, to: -26, at: -8, lean: -2.2, out: -1,
    openings: [W(6, 0.9, 0.9, 2.5, { id: 'w-living3' }), W(10, 0.7, 1.4, 2.4, { id: 'w-bath0' })] },
  { id: 'f0-east', floor: 'F0', kind: 'ext', axis: 'z', from: -14, to: -26, at: 8, lean: 1.5, out: 1,
    openings: [W(3, 0.9, 0.9, 2.5, { id: 'w-dining3' }), D(9.5, { id: 'd-kitchen', top: 2.6, side: true })] },
  // ---- F0 interior ----
  { id: 'f0-hallW', floor: 'F0', kind: 'int', axis: 'z', from: -14, to: -22, at: -1.5, openings: [D(2.5, { id: 'd-living' })] },
  { id: 'f0-hallE', floor: 'F0', kind: 'int', axis: 'z', from: -14, to: -20, at: 1.5, openings: [D(2.5, { id: 'd-dining' })] },
  { id: 'f0-kitW', floor: 'F0', kind: 'int', axis: 'z', from: -20, to: -26, at: 1.5, openings: [] },
  { id: 'f0-hallBack', floor: 'F0', kind: 'int', axis: 'x', from: -1.5, to: 1.5, at: -22, openings: [D(2.2, { id: 'd-basement', basement: true })] },
  { id: 'f0-dinKit', floor: 'F0', kind: 'int', axis: 'x', from: 1.5, to: 8, at: -20, openings: [{ at: 2.5, w: 1.15, bottom: 0, top: 2.4, door: true, id: 'd-saloon', saloon: true }] },
  { id: 'f0-livBack', floor: 'F0', kind: 'int', axis: 'x', from: -8, to: -1.5, at: -22, openings: [D(5, { id: 'd-mudroom' })] },
  { id: 'f0-bathE', floor: 'F0', kind: 'int', axis: 'z', from: -22, to: -26, at: -4.5, openings: [D(2, { id: 'd-bath0' })] },
  { id: 'f0-mudE', floor: 'F0', kind: 'int', axis: 'z', from: -22, to: -26, at: 0, openings: [] },

  // ---- F1 exterior ----
  { id: 'f1-front', floor: 'F1', kind: 'ext', axis: 'x', from: -7, to: 2, at: -14, lean: 2.4, out: 1, siding: 'NH_SIDING_MAIN_2',
    openings: [W(1.5, 0.9, 0.9, 2.5, { id: 'w-bed1' }), W(3.5, 0.9, 0.9, 2.5, { id: 'w-bed2' }), W(6, 1.4, 0.7, 2.8, { id: 'w-hall1' })] },
  { id: 'f1-frontR', floor: 'F1', kind: 'ext', axis: 'x', from: 2, to: 8.6, at: -13.2, lean: 2.8, out: 1, siding: 'NH_SIDING_MAIN_2',
    openings: [W(1.3, 0.9, 0.9, 2.5, { id: 'w-study1' }), D(3.5, { id: 'd-balcony', balcony: true }), W(5.6, 0.6, 1.0, 2.5, { id: 'w-study2' })] },
  { id: 'f1-stub', floor: 'F1', kind: 'ext', axis: 'z', from: -13.2, to: -14, at: 2, out: -1, siding: 'NH_SIDING_MAIN_2', openings: [] },
  { id: 'f1-east', floor: 'F1', kind: 'ext', axis: 'z', from: -13.2, to: -26, at: 8.6, lean: 2.2, out: 1, siding: 'NH_SIDING_MAIN_2',
    openings: [W(2.8, 0.95, 0.7, 2.4, { id: 'w-tree', tree: true }), W(8.5, 0.9, 0.9, 2.5, { id: 'w-kid' })] },
  { id: 'f1-west', floor: 'F1', kind: 'ext', axis: 'z', from: -14, to: -26, at: -7, lean: -2.6, out: -1, siding: 'NH_SIDING_MAIN_2',
    openings: [W(3, 0.9, 0.9, 2.5, { id: 'w-bed3' }), W(8, 0.7, 1.3, 2.4, { id: 'w-bath1' }), W(10.8, 0.6, 1.6, 2.6, { id: 'w-stair2' })] },
  { id: 'f1-back', floor: 'F1', kind: 'ext', axis: 'x', from: -7, to: 8.6, at: -26, lean: -2.4, out: -1, siding: 'NH_SIDING_MAIN_2',
    openings: [W(6, 0.7, 1.1, 2.3, { id: 'w-hallEnd' }), W(11, 0.6, 1.4, 2.4, { id: 'w-closet' })] },
  // ---- F1 interior ----
  { id: 'f1-hallW', floor: 'F1', kind: 'int', axis: 'z', from: -14, to: -26, at: -2.4,
    openings: [D(1.2, { id: 'd-fake', fake: true }), D(4.5, { id: 'd-bedroom' }), D(8, { id: 'd-bath1' }), D(10.3, { id: 'd-stair2' })] },
  { id: 'f1-hallE', floor: 'F1', kind: 'int', axis: 'z', from: -14, to: -26, at: 0.4,
    openings: [D(2.8, { id: 'd-study' }), D(7.6, { id: 'd-kid', lock: 'blue' }), D(10.9, { id: 'd-closet', lock: 'red' })] },
  { id: 'f1-bedBath', floor: 'F1', kind: 'int', axis: 'x', from: -7, to: -2.4, at: -20.5, openings: [] },
  { id: 'f1-bathStair', floor: 'F1', kind: 'int', axis: 'x', from: -7, to: -2.4, at: -23.5, openings: [] },
  { id: 'f1-studyKid', floor: 'F1', kind: 'int', axis: 'x', from: 0.4, to: 8.6, at: -19.5, openings: [] },
  { id: 'f1-kidCloset', floor: 'F1', kind: 'int', axis: 'x', from: 0.4, to: 8.6, at: -23.8, openings: [] },

  // ---- F2 mint wing (whole chunk leans 3 degrees west) ----
  { id: 'f2-front', floor: 'F2', kind: 'ext', axis: 'x', from: -7, to: 2, at: -18, out: 1, siding: 'NH_SIDING_ALT',
    openings: [W(3, 0.9, 1.2, 2.1, { id: 'w-porthole', round: true }), W(7.5, 0.55, 0.6, 2.8, { id: 'w-narrow' })] },
  { id: 'f2-back', floor: 'F2', kind: 'ext', axis: 'x', from: -7, to: 2, at: -26, out: -1, siding: 'NH_SIDING_ALT', openings: [W(3, 0.9, 1.0, 2.3, { id: 'w-f2back' })] },
  { id: 'f2-west', floor: 'F2', kind: 'ext', axis: 'z', from: -18, to: -26, at: -7, out: -1, siding: 'NH_SIDING_ALT', openings: [W(3, 0.9, 1.0, 2.3, { id: 'w-f2west' })] },
  { id: 'f2-east', floor: 'F2', kind: 'ext', axis: 'z', from: -18, to: -26, at: 2, out: 1, siding: 'NH_SIDING_ALT',
    openings: [D(2, { id: 'd-green', lock: 'green' }), W(5.5, 0.9, 0.5, 2.2, { id: 'w-plank', plank: true })] },
  { id: 'f2-purple', floor: 'F2', kind: 'int', axis: 'z', from: -18, to: -26, at: -1, openings: [D(4, { id: 'd-purple', boarded: true })] },

  // ---- tomato-red bolted-on room (leans 5 degrees east, out over the yard) ----
  { id: 'tr-west', floor: 'TR', kind: 'ext', axis: 'z', from: -19, to: -23, at: 5, out: -1, siding: 'NH_SIDING_ADDON',
    openings: [D(1, { id: 'd-tomato', top: 2.4, noDoor: true }), { at: 3.5, w: 0.8, bottom: 0.25, top: 2.1, id: 'w-tomatoIn', open: true }] },
  { id: 'tr-east', floor: 'TR', kind: 'ext', axis: 'z', from: -19, to: -23, at: 9, out: 1, siding: 'NH_SIDING_ADDON', openings: [] },
  { id: 'tr-front', floor: 'TR', kind: 'ext', axis: 'x', from: 5, to: 9, at: -19, out: 1, siding: 'NH_SIDING_ADDON', openings: [W(2, 0.7, 1.0, 2.0, { id: 'w-tomato', curtain: true })] },
  { id: 'tr-back', floor: 'TR', kind: 'ext', axis: 'x', from: 5, to: 9, at: -23, out: -1, siding: 'NH_SIDING_ADDON', openings: [] },

  // ---- attic tower ----
  { id: 'tw-front', floor: 'TW', kind: 'ext', axis: 'x', from: -5, to: -2, at: -20, out: 1, siding: 'NH_SIDING_ALT', openings: [W(1.5, 0.5, 1.4, 2.3, { id: 'w-attic', bulb: true })] },
  { id: 'tw-back', floor: 'TW', kind: 'ext', axis: 'x', from: -5, to: -2, at: -23, out: -1, siding: 'NH_SIDING_ALT', openings: [] },
  { id: 'tw-west', floor: 'TW', kind: 'ext', axis: 'z', from: -20, to: -23, at: -5, out: -1, siding: 'NH_SIDING_ALT', openings: [] },
  { id: 'tw-east', floor: 'TW', kind: 'ext', axis: 'z', from: -20, to: -23, at: -2, out: 1, siding: 'NH_SIDING_ALT', openings: [] },
];

// ---------------------------------------------------------------- rooms
export const ROOMS = [
  { id: 'hall', name: 'Front hallway', floor: 'F0', x0: -1.5, x1: 1.5, z0: -22, z1: -14, paper: ['stripes', 'WALLPAPER_GREEN', 'WALLPAPER_GREEN_STRIPE'], wainscot: true, floorMat: 'dark' },
  { id: 'living', name: 'Living room', floor: 'F0', x0: -8, x1: -1.5, z0: -22, z1: -14, paper: ['diamonds', 'WALLPAPER_BLUE', 'WALLPAPER_BLUE_DIAMOND'], floorMat: 'wood' },
  { id: 'dining', name: 'Dining room', floor: 'F0', x0: 1.5, x1: 8, z0: -20, z1: -14, paper: ['pinstripes', 'WALLPAPER_YELLOW', 'WALLPAPER_YELLOW_STRIPE'], wainscot: true, floorMat: 'wood' },
  { id: 'kitchen', name: 'Kitchen', floor: 'F0', x0: 1.5, x1: 8, z0: -26, z1: -20, paper: ['flowers', 'WALLPAPER_GREEN', 'WALLPAPER_GREEN_STRIPE'], floorMat: 'checker' },
  { id: 'mudroom', name: 'Mudroom', floor: 'F0', x0: -4.5, x1: 0, z0: -26, z1: -22, paint: 'WAINSCOT', floorMat: 'dark' },
  { id: 'bath0', name: 'Downstairs bathroom', floor: 'F0', x0: -8, x1: -4.5, z0: -26, z1: -22, paper: ['dots', 'WALLPAPER_PINK', 'WALLPAPER_PINK_DOT'], floorMat: 'pinkTile' },
  { id: 'basementStair', name: 'Basement stairs', floor: 'F0', x0: 0, x1: 1.5, z0: -26, z1: -22, paint: 'BASEMENT_WALL', floorMat: 'basement' },

  { id: 'hall1', name: 'Upstairs hallway', floor: 'F1', x0: -2.4, x1: 0.4, z0: -26, z1: -14, paper: ['dots', 'WALLPAPER_PINK', 'WALLPAPER_PINK_DOT'], floorMat: 'wood' },
  { id: 'bedroom', name: "Grimsby's bedroom", floor: 'F1', x0: -7, x1: -2.4, z0: -20.5, z1: -14, paper: ['diamonds', 'WALLPAPER_BLUE', 'WALLPAPER_BLUE_DIAMOND'], floorMat: 'carpetGreen' },
  { id: 'bath1', name: 'Upstairs bathroom', floor: 'F1', x0: -7, x1: -2.4, z0: -23.5, z1: -20.5, paper: ['pinstripes', 'WALLPAPER_YELLOW', 'YELLOW_TOY'], floorMat: 'yellowTile' },
  { id: 'stair2', name: 'Back stairwell', floor: 'F1', x0: -7, x1: -2.4, z0: -26, z1: -23.5, paint: 'WAINSCOT', floorMat: 'dark' },
  { id: 'study', name: 'Study', floor: 'F1', x0: 0.4, x1: 8.6, z0: -19.5, z1: -14, paper: ['stripes', 'WALLPAPER_GREEN', 'WALLPAPER_GREEN_STRIPE'], floorMat: 'wood' },
  { id: 'study', part: true, name: 'Study', floor: 'F1', x0: 2, x1: 8.6, z0: -14, z1: -13.2, paper: ['stripes', 'WALLPAPER_GREEN', 'WALLPAPER_GREEN_STRIPE'], floorMat: 'wood' },
  { id: 'kid', name: "Kid's room", floor: 'F1', x0: 0.4, x1: 8.6, z0: -23.8, z1: -19.5, paper: ['clouds', 'WALLPAPER_BLUE', 'WHITE'], floorMat: 'carpetRed' },
  { id: 'closet', name: 'Utility closet', floor: 'F1', x0: 0.4, x1: 8.6, z0: -26, z1: -23.8, paint: 'METAL', floorMat: 'dark' },

  { id: 'landing', name: 'Mint wing landing', floor: 'F2', x0: -7, x1: -1, z0: -26, z1: -18, paint: 'RETRO_MINT', floorMat: 'old' },
  { id: 'purple', name: 'Purple room', floor: 'F2', x0: -1, x1: 2, z0: -26, z1: -18, paint: 'WALL_PAINT_PURPLE', floorMat: 'old' },
  { id: 'tomato', name: 'Bolted-on room', floor: 'TR', x0: 5, x1: 9, z0: -23, z1: -19, paint: 'NH_PLANKS', floorMat: 'old' },
  { id: 'attic', name: 'Attic tower', floor: 'TW', x0: -5, x1: -2, z0: -23, z1: -20, paint: 'NH_PLANKS_OLD', floorMat: 'old' },
];

// Holes in floor slabs: [x0, x1, z0, z1]
export const HOLES = {
  F0: [[-4.4, -3.2, -25.9, -24.7], [0.1, 1.4, -25.8, -22.2]], // washer stair (secret), basement stair
  F1: [[-1.42, -0.28, -22.0, -17.15], [-0.8, -0.1, -23.4, -22.7]], // main stairs, ladder shaft
  F2: [[-6.95, -2.7, -25.95, -23.55], [-0.8, -0.1, -23.4, -22.7]], // back stairs (U-turn), ladder shaft
  TW: [[-4.0, -3.2, -22.0, -21.2]], // attic hatch
};

export const FLOOR_Y = { F0: NH.F0.y, F1: NH.F1.y, F2: NH.F2.y, TR: NH.TOMATO.y, TW: NH.TOWER.y };
export const FLOOR_H = { F0: NH.F0.h, F1: NH.F1.h, F2: NH.F2.h, TR: NH.TOMATO.h, TW: NH.TOWER.h };
// Whole-chunk leans: degrees, axis, pivot height
export const CHUNK_SHEAR = { F2: [-3, 'x', NH.F2.y], TW: [-6.5, 'x', NH.TOWER.y], TR: [5, 'x', NH.TOMATO.y] };
