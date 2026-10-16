// Enter Part III of ACT3_HOUSE_PROMPT.md (the house bible) into data
// (section 47). Writes data/act3/house.json, puzzle.json, security.json,
// train.json and palette.json. Every number is tagged. Absolute opening
// coordinates from the bible are turned into offsets on one room's wall.
//
//   node tools/act3/bootstrap.mjs          refuses to overwrite house.json
//   node tools/act3/bootstrap.mjs --force  regenerate (only before any value
//                                          is measured; measured values are
//                                          never thrown away silently)
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const out = (f) => join(root, 'data/act3', f);
if (existsSync(out('house.json')) && !process.argv.includes('--force')) {
  console.error('house.json exists. Re-run with --force to regenerate it (refused if any value is measured).');
  process.exit(1);
}
if (existsSync(out('house.json'))) {
  const old = readFileSync(out('house.json'), 'utf8');
  if (/"tag": ?"(measured|measured-rough|conflict)"/.test(old)) {
    console.error('house.json holds measured values; bootstrap will not overwrite them. Edit it, or run npm run ingest.');
    process.exit(1);
  }
}

const r3 = (v) => Math.round(v * 1000) / 1000;
// tags: [A] assumed, [D] documented, [S] standard, [X] design (Part III legend)
const A = (v, rule, extra = {}) => ({ value: r3(v), tag: 'assumed', ...(rule ? { rule } : {}), ...extra });
const D = (v, source, extra = {}) => ({ value: r3(v), tag: 'documented', source, ...extra });
const Dw = (v, source, extra = {}) => ({ value: r3(v), tag: 'documented-weak', source, ...extra });
const S = (v, note, extra = {}) => ({ value: r3(v), tag: 'standard', ...(note ? { note } : {}), ...extra });
const X = (v, note, extra = {}) => ({ value: r3(v), tag: 'design', ...(note ? { note } : {}), ...extra });
const P = (x, y, z, tag = 'design', note) => ({ x: r3(x), y: r3(y), z: r3(z), tag, ...(note ? { note } : {}) });
const rect = (x0, x1, z0, z1, tag = 'design', note) => ({ x0: r3(x0), x1: r3(x1), z0: r3(z0), z1: r3(z1), tag, ...(note ? { note } : {}) });

// ------------------------------------------------------------ rooms and openings
const SIDES = { S: 0, E: 1, N: 2, W: 3 };
function room(id, label, x0, x1, z0, z1, o = {}) {
  return { id, label, polygon: o.polygon ?? [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], polygonTag: o.tag ?? 'assumed', bounds: [x0, x1, z0, z1], walls: [], documented: o.documented ?? [], surfaces: o.surfaces ?? {}, ...(o.extra ?? {}) };
}
function wallOf(rm, side) {
  const from = SIDES[side];
  let w = rm.walls.find((x) => x.from === from);
  if (!w) { w = { from, to: (from + 1) % 4, openings: [] }; rm.walls.push(w); rm.walls.sort((a, b) => a.from - b.from); }
  return w;
}
// p0..p1 absolute along the wall (x for S/N walls, z for E/W walls)
function opening(rm, side, p0, p1, o) {
  const [x0, x1, z0, z1] = rm.bounds;
  const off = side === 'S' ? p0 - x0 : side === 'E' ? p0 - z0 : side === 'N' ? x1 - p1 : z1 - p1;
  const type = o.type ?? 'door';
  const tag = o.tag;
  const mk = (v, rule) => (tag === 'documented' ? D(v, o.source) : tag === 'design' ? X(v, o.note) : A(v, rule));
  const op = {
    id: o.id, type, ...(o.state ? { state: o.state } : {}),
    offset: X(off, `absolute ${side === 'S' || side === 'N' ? 'x' : 'z'} ${p0} to ${p1} in the house bible`),
    width: o.width ?? mk(p1 - p0, type === 'window' ? 'window_width' : 'door_width'),
    height: o.height ?? mk(type === 'window' ? 1.5 : 2.6, type === 'window' ? 'window_height' : 'door_height'),
  };
  if (type === 'window' || o.sill) op.sill = o.sill ?? A(0.9, 'window_sill');
  for (const k of ['source', 'note', 'barrier', 'boards', 'lock', 'leaf', 'glass']) if (o[k] !== undefined) op[k] = o[k];
  wallOf(rm, side).openings.push(op);
  return op;
}
const openWall = (rm, side, note) => { const w = wallOf(rm, side); w.open = true; w.note = note; };

// ------------------------------------------------------------ B1 basement
const b1 = room('basement_b1', 'Basement', 0, 9, 3, 11, {
  documented: ['basement entrance sealed with boards, bolts and a keycard lock (src_0005)'],
  surfaces: { floor: 'BASEMENT_FLOOR', wall: 'BASEMENT_WALL', ceiling: 'BASEMENT_WALL', light: 'BASEMENT_LIGHT' },
});
opening(b1, 'N', 7.0, 7.95, { id: 'b1_exit_door', state: 'locked', tag: 'design', note: 'exit to a short passage, locked [X]' });

// ------------------------------------------------------------ F0 ground floor
const foyer = room('foyer_f0', 'Foyer', 4.5, 9.5, 0, 3, { surfaces: { floor: 'FLOOR_WOOD', wall: 'WALLPAPER_GREEN', ink: 'WALLPAPER_GREEN_STRIPE', pattern: 'stripes', wainscot: A(1.0, 'wainscot height'), ceiling: 'CEILING' } });
const living = room('living_f0', 'Living room', 0, 4.5, 0, 6.5, { documented: ['the way in is a broken ground-floor window (src_0003)'], surfaces: { floor: 'FLOOR_WOOD', wall: 'WALLPAPER_BLUE', ink: 'WALLPAPER_BLUE_DIAMOND', pattern: 'diamonds', ceiling: 'CEILING' } });
const dining = room('dining_f0', 'Dining room', 9.5, 14, 0, 5.5, { surfaces: { floor: 'FLOOR_WOOD', wall: 'WALLPAPER_YELLOW', ink: 'WALLPAPER_YELLOW_STRIPE', pattern: 'pinstripes', ceiling: 'CEILING' } });
const hallG = room('hall_ground', 'Cluttered hallway', 4.5, 7, 3, 6, { documented: ['a cluttered hallway near the stairs (src_0003)'], surfaces: { floor: 'FLOOR_WOOD_DARK', wall: 'WALLPAPER_PINK', ink: 'WALLPAPER_PINK_DOT', pattern: 'dots', ceiling: 'CEILING' } });
const closet = room('closet_f0', 'Hall closet (electrical panel)', 7, 9.5, 3, 5.5, { surfaces: { floor: 'FLOOR_WOOD_DARK', wall: 'WAINSCOT', ceiling: 'CEILING' }, extra: { note: 'fills the x[7,9.5] z[3,5.5] gap in the bible tiling; the bible mentions this closet off the hallway [X]' } });
const stairHall = room('stair_hall_f0', 'Stair hall', 4.5, 7, 6, 11, { documented: ['stairs near the cluttered hallway (src_0003)'], surfaces: { floor: 'FLOOR_WOOD', wall: 'WALLPAPER_PINK', ink: 'WALLPAPER_PINK_DOT', pattern: 'dots', ceiling: 'CEILING' } });
const kitchen = room('kitchen_f0', 'Kitchen', 7, 14, 5.5, 11, { surfaces: { floor: 'checker', wall: 'RETRO_MINT', wainscot: A(1.2, 'tile height'), upper: 'CEILING', ceiling: 'CEILING' } });
const backHall = room('back_hall_f0', 'Back hall', 2, 4.5, 6.5, 11, { documented: ['basement sealed with boards and bolts and a keycard lock (src_0005)'], surfaces: { floor: '#B9B3A3', wall: '#9DBF7B', ceiling: 'CEILING' } });
const landing = room('basement_landing_f0', 'Basement landing', 0, 2, 6.5, 11, { surfaces: { floor: 'BASEMENT_FLOOR', wall: 'BASEMENT_WALL', ceiling: 'CEILING' } });

opening(foyer, 'S', 6.5, 7.45, { id: 'front_door', state: 'bolted', note: 'shut and bolted from inside; the way in is the broken window [D]', leaf: 'NH_DOOR_FRONT' });
opening(foyer, 'W', 1.0, 1.95, { id: 'foyer_living' });
opening(foyer, 'E', 1.0, 1.95, { id: 'foyer_dining' });
opening(foyer, 'N', 5.2, 6.15, { id: 'foyer_hall' });
opening(living, 'S', 1.6, 2.5, { id: 'broken_window', type: 'window', state: 'broken', tag: 'documented', source: 'src_0003', note: 'the documented way in; route: box stack (0.35 m) then a jump [X]', assist: undefined });
opening(living, 'W', 3.0, 3.9, { id: 'living_west_window', type: 'window', state: 'boarded', boards: 3 });
opening(living, 'N', 3.2, 4.15, { id: 'living_backhall' });
opening(dining, 'S', 11.3, 12.2, { id: 'dining_front_window', type: 'window', state: 'intact' });
opening(dining, 'E', 2.3, 3.2, { id: 'dining_east_window', type: 'window', state: 'boarded', boards: 3 });
opening(dining, 'N', 9.5, 10.9, { id: 'dining_kitchen', width: A(1.4, 'double_swing_door'), note: 'double swing door, left open' });
openWall(hallG, 'N', 'the hallway opens straight into the stair hall (no wall)');
opening(hallG, 'E', 4.0, 4.95, { id: 'hall_closet', note: 'laser tripwire across it at 0.3 m [X]' });
opening(kitchen, 'W', 8.0, 8.95, { id: 'kitchen_stairhall' });
opening(kitchen, 'N', 11.0, 11.95, { id: 'kitchen_service_door', state: 'locked', leaf: 'NH_DOOR_FRONT', note: 'mudroom service door, locked' });
opening(kitchen, 'E', 7.0, 7.95, { id: 'kitchen_side_door', state: 'locked', leaf: 'NH_PLANKS', note: 'side door, locked, camera above' });
opening(kitchen, 'E', 9.3, 10.2, { id: 'kitchen_east_window', type: 'window', state: 'intact' });
opening(backHall, 'W', 8.5, 9.45, {
  id: 'basement_door', state: 'sealed', tag: 'documented', source: 'src_0005', leaf: 'BASEMENT_WALL',
  note: 'heavy steel door, three boards on six bolts, keycard panel on the north jamb at 1.25 m',
  boards: { heights: [X(0.55), X(1.3), X(2.05)], length: X(1.15), section: S(0.14, '140 x 38 mm board'), thickness: S(0.038), bolts: 6, boltHead: S(0.024, 'hex head 24 mm'), washer: S(0.04) },
  lock: { kind: 'keycard', height: X(1.25), panelW: X(0.12), panelH: X(0.18) },
});
opening(landing, 'W', 9.4, 10.3, { id: 'landing_west_window', type: 'window', state: 'boarded', boards: 3, note: 'the bible puts a boarded west window in the back hall, which has no west exterior wall; it sits on the landing instead' });

// ------------------------------------------------------------ F1 first floor
const hall1 = room('hall_f1', 'First floor hall', 4.5, 7, 0, 6.2, { documented: ['a second-floor section is gated off; the way past is a railing, then a lamp (src_0003)'], surfaces: { floor: 'FLOOR_WOOD', wall: 'WALLPAPER_PINK', ink: 'WALLPAPER_PINK_DOT', pattern: 'dots', runner: 'CARPET_GREEN', ceiling: 'CEILING' } });
const well1 = room('stairwell_f1', 'Stairwell', 4.5, 7, 6.2, 11, { surfaces: { floor: 'FLOOR_WOOD', wall: 'WALLPAPER_PINK', ink: 'WALLPAPER_PINK_DOT', pattern: 'dots', ceiling: 'CEILING' } });
const bedroom = room('bedroom_a', 'Bedroom', 0, 4.5, 0, 5.5, { surfaces: { floor: 'FLOOR_WOOD', wall: 'WALLPAPER_BLUE', ink: 'WALLPAPER_BLUE_DIAMOND', pattern: 'diamonds', ceiling: 'CEILING' } });
const bath = room('bath_f1', 'Bathroom', 0, 4.5, 5.5, 8, { surfaces: { floor: 'FLOOR_TILE_A', wall: 'WALLPAPER_YELLOW', ceiling: 'CEILING' } });
const study = room('study_f1', 'Study', 0, 4.5, 8, 11, { surfaces: { floor: 'FLOOR_WOOD', wall: 'WALL_PAINT_PURPLE', ceiling: 'CEILING' } });
const gallery = room('gallery_f1', 'Gallery (the gated section)', 7, 14, 0, 6, { documented: ['second-floor gated section (src_0003)', 'ladder to the penultimate floor (src_0004)'], surfaces: { floor: 'FLOOR_WOOD', wall: 'WALLPAPER_GREEN', ink: 'WALLPAPER_GREEN_STRIPE', pattern: 'stripes', ceiling: 'CEILING' } });
const birthday = room('birthday_room', 'Birthday room', 7, 14, 6, 11, { documented: ['a birthday room that needs several mannequins (src_0006)'], surfaces: { floor: 'FLOOR_WOOD', wall: 'WALLPAPER_PINK', ink: 'WALLPAPER_PINK_DOT', pattern: 'dots', ceiling: 'CEILING' } });

opening(hall1, 'W', 1.0, 1.95, { id: 'hall_bedroom' });
opening(hall1, 'E', 1.5, 3.5, {
  id: 'dutch_gate', type: 'gate', state: 'barrier', tag: 'documented', source: 'src_0003', width: X(2.0, 'gate opening'), height: X(3.4, 'gate opening: full height. The bible has 2.6 m, which leaves 1.0 m over the barrier; a 1.2 m player whose feet clear 1.6 m has their head at 2.8 m or more, so the hop could never pass. The bible hop check ignored head clearance'),
  barrier: { height: X(1.6, 'lower 1.60 m filled with pickets'), rail: X(0.04), pickets: X(0.1, 'picket spacing') },
  note: 'Dutch-style gate: pickets fill the lower 1.6 m, the upper 1.0 m is open; latch on the far side, out of reach',
});
openWall(hall1, 'N', 'the hall runs straight on into the stairwell (no wall)');
opening(well1, 'E', 8.0, 8.95, { id: 'stairwell_birthday' });
opening(well1, 'W', 9.5, 10.45, { id: 'stairwell_study', note: 'the bible opens the study and bath off the stairwell; the stair opening blocks z 5.37 to 8.55 of that wall, so the study door sits past it and the bath is reached through the study' });
opening(study, 'S', 2.5, 3.45, { id: 'study_bath' });
opening(bedroom, 'W', 2.3, 3.2, { id: 'bedroom_window', type: 'window', state: 'boarded', boards: 3 });
opening(study, 'W', 9.0, 9.9, { id: 'study_window', type: 'window', state: 'intact' });
for (const [i, z] of [0.8, 2.55, 4.3].entries()) opening(gallery, 'E', z, z + 0.9, { id: `gallery_east_window_${i}`, type: 'window', state: 'intact' });
opening(gallery, 'S', 8.5, 9.4, { id: 'gallery_front_window_0', type: 'window', state: 'intact' });
opening(gallery, 'S', 11.5, 12.4, { id: 'gallery_front_window_1', type: 'window', state: 'intact' });
opening(birthday, 'E', 8.0, 8.9, { id: 'birthday_east_window', type: 'window', state: 'intact' });
opening(birthday, 'N', 10.0, 10.9, { id: 'birthday_back_window', type: 'window', state: 'intact' });

// ------------------------------------------------------------ F2 box
const ladderRoom = room('ladder_room_f2', 'Ladder room', 3.5, 10.5, 3, 5.5, { documented: ['ladder up to the penultimate floor (src_0004)', 'a train track and a hole that leads into another room (src_0004)'], surfaces: { floor: 'BASEMENT_FLOOR', wall: 'RETRO_MINT', ceiling: 'CEILING' } });
const control = room('control_room_f2', 'Control room', 3.5, 10.5, 5.5, 8, { documented: ['a button and a lever start the train (src_0004)'], surfaces: { floor: 'BASEMENT_FLOOR', wall: 'RETRO_MINT', ceiling: 'CEILING' } });
const hole = { width: X(1.2, 'track hole'), height: X(1.0, 'track hole'), sill: X(0.3, 'track sits 0.3 m above the box floor') };
opening(ladderRoom, 'W', 3.8, 5.0, { id: 'track_hole_west', type: 'hole', ...hole, note: 'the train track enters here' });
opening(ladderRoom, 'E', 3.8, 5.0, { id: 'track_hole_east', type: 'hole', ...hole, note: 'the train track exits here' });
opening(ladderRoom, 'N', 5.0, 6.2, { id: 'crawl_hole', type: 'hole', tag: 'documented', source: 'src_0004', width: X(1.2, 'crawl hole'), height: X(1.0, 'crawl hole'), sill: X(0, 'crawl hole at floor level: the bible has a 0.30 m sill, but a crouching player cannot step a sill only 0.18 m deep, so the hole starts at the floor'), note: 'the documented hole into the control room, big enough to crawl through' });
opening(control, 'N', 6.5, 7.45, { id: 'control_terrace_door', note: 'exterior door out to the back terrace (the bible says "south"; the back terrace is the z = 11 side)' });
opening(control, 'N', 8.8, 9.7, { id: 'control_window', type: 'window', state: 'cracked' });

// ------------------------------------------------------------ floors
const floor = (id, label, elev, ceil, rooms, o = {}) => ({
  id, label, elevation: elev, ceiling: ceil, slab: o.slab ?? A(0.3, 'slab'), rooms, ...(o.holes ? { holes: o.holes } : {}), ...(o.ceilingHoles ? { ceilingHoles: o.ceilingHoles } : {}), ...(o.extra ?? {}),
});
const floors = [
  floor('B1', 'Basement', A(-3.5, 'basement_depth'), A(3.2, 'ceiling_basement'), [b1]),
  floor('F0', 'Ground floor', A(0, 'ground_zero'), A(3.4, 'ceiling_default'), [foyer, living, dining, hallG, closet, stairHall, kitchen, backHall, landing], {
    holes: [rect(0.15, 1.25, 6.95, 10.15, 'design', 'basement stair opening: covers the flight where the slab would cut headroom below 2.0 m')],
  }),
  floor('F1', 'First floor', A(3.7, 'floor_to_floor'), A(3.4, 'ceiling_default'), [hall1, well1, bedroom, bath, study, gallery, birthday], {
    holes: [rect(4.59, 5.69, 5.37, 8.55, 'design', 'main stair opening: the bible has x[4.5,5.6] z[6.2,10.9]; follows the moved flight and stops where headroom no longer needs it, so the study door has floor')],
  }),
  floor('F2', 'Upper box', A(7.4, 'floor_to_floor'), A(3.0, 'ceiling_f2_box'), [ladderRoom, control], {
    holes: [rect(8.05, 8.75, 4.65, 5.35, 'design', 'ladder hatch, 0.7 x 0.7 m')],
  }),
];
for (const f of floors) for (const r of f.rooms) delete r.bounds;

// ------------------------------------------------------------ stairs
const stairs = [
  {
    id: 'stair_main', label: 'Main stair', type: 'straight', from: 'F0', to: 'F1', direction: '-z',
    foot: P(5.14, 0, 10.05, 'design', 'bible: along the west wall, bottom step z 10.9, top z 6.22. The bible puts the first riser against the back wall, leaving nowhere to stand in front of it; moved 0.8 m forward to give a bottom landing (top now z 5.37, in the hall), and onto the west wall face (x 4.59)'),
    width: A(1.1, 'stair_width'), riser: A(0.2, 'stair_riser'), tread: A(0.26, 'stair_tread'),
    banister: { side: 'east', height: A(0.9, 'handrail'), gap: A(0.1, 'baluster_gap'), startAlong: X(0.3, 'banister from the second tread up') },
    documented: ['stairs to the second floor (src_0003)'],
  },
  {
    id: 'stair_basement', label: 'Basement stair', type: 'straight', from: 'B1', to: 'F0', direction: '+z',
    foot: P(0.7, -3.5, 5.73, 'design', 'bible: descends toward +z with 0.08 m to spare, but the landing is 4.26 m clear inside its walls; flipped to descend toward -z, running under the living room floor'),
    width: A(1.1, 'stair_width'), riser: A(0.2, 'stair_riser'), tread: A(0.26, 'stair_tread'),
    banister: { side: 'east', height: A(0.9, 'handrail'), gap: A(0.1, 'baluster_gap'), startAlong: X(0.3), note: 'open side faces the landing strip' },
  },
];

// ------------------------------------------------------------ features (props and fixtures)
// Each feature: id, kind, room, floor, at (tagged point, floor-relative y),
// size [w, d, h] (tagged), rot (deg), physics, plus kind-specific fields.
const features = [];
let seed = 20261016;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
function feat(kind, id, floorId, roomId, x, y, z, size, o = {}) {
  const tag = o.tag ?? 'assumed';
  const sz = size ? { size: size.map((v) => (typeof v === 'object' ? v : tag === 'standard' ? S(v) : tag === 'design' ? X(v) : A(v, o.rule ?? `prop_${kind}`))), sizeTag: undefined } : {};
  delete sz.sizeTag;
  const f = { id, kind, floor: floorId, room: roomId, at: P(x, y, z, o.atTag ?? 'design'), ...sz, ...(o.rot ? { rot: X(o.rot) } : {}) };
  for (const [k, v] of Object.entries(o)) if (!['tag', 'rule', 'atTag', 'rot', 'kind', 'y'].includes(k)) f[k] = v;
  if (f.light) f.light = { ...f.light, tag: 'design' };
  features.push(f);
  return f;
}
const box = (id, f, r, x, z, w, d, h, o = {}) => feat(o.kind ?? 'cardboard', id, f, r, x, o.y ?? 0, z, [w, d, h], { physics: true, ...o });

// --- F0 foyer
feat('coat_stand', 'coat_stand', 'F0', 'foyer_f0', 4.95, 0, 0.45, [0.5, 0.5, 1.9], { tag: 'design', rot: 5 });
feat('table', 'foyer_console', 'F0', 'foyer_f0', 8.6, 0, 2.7, [1.1, 0.4, 0.8], { rot: 0, items: ['bowl', 'keys'], noise: 'jingle' });
feat('picture', 'foyer_picture', 'F0', 'foyer_f0', 8.6, 1.5, 2.9, [0.5, 0.04, 0.4]);
box('foyer_box', 'F0', 'foyer_f0', 7.85, 0.45, 0.5, 0.4, 0.35, { label: 'scribble' });
feat('runner', 'foyer_runner', 'F0', 'foyer_f0', 6.975, 0.005, 1.6, [1.1, 3.0, 0.01], { color: 'CARPET_RED' });
feat('lamp_pendant', 'foyer_bulb', 'F0', 'foyer_f0', 7.0, 3.0, 1.5, null, { light: { color: '#FFC97A', intensity: 0.8, range: 6, flicker: true } });

// --- F0 living room
feat('sofa', 'living_sofa', 'F0', 'living_f0', 0.6, 0, 3.4, [2.0, 0.9, 0.85], { rot: 90, color: 'RETRO_ORANGE' });
feat('armchair', 'living_armchair', 'F0', 'living_f0', 2.6, 0, 1.4, [0.85, 0.85, 0.9], { rot: 35, color: 'SOFA_GREEN' });
feat('table', 'living_coffee_table', 'F0', 'living_f0', 2.0, 0, 3.4, [1.1, 0.6, 0.42], { items: ['mug', 'newspaper'] });
feat('bookcase', 'living_bookcase', 'F0', 'living_f0', 2.2, 0, 6.24, [1.0, 0.3, 2.3], { lean: X(4), books: 25 });
feat('tv', 'living_tv', 'F0', 'living_f0', 3.9, 0, 4.6, [0.65, 0.5, 0.5], { rot: -90, stand: X(0.45) });
// the step up to the broken window: two medium boxes on the floor, one small on top (stack 2 high)
box('living_box_0', 'F0', 'living_f0', 1.8, 0.45, 0.5, 0.4, 0.35, { note: 'step 1 of the window route (0.35 m) [X]' });
box('living_box_1', 'F0', 'living_f0', 2.35, 0.45, 0.5, 0.4, 0.35);
box('living_box_2', 'F0', 'living_f0', 1.2, 0.5, 0.35, 0.3, 0.25);
box('living_box_3', 'F0', 'living_f0', 2.1, 0.45, 0.35, 0.3, 0.25, { y: 0.35 });
feat('glass_shards', 'living_glass', 'F0', 'living_f0', 2.05, 0, 0.5, [1.2, 0.8, 0.01], { count: 14, physicsShards: 6 });
box('outside_crate', 'F0', null, 2.05, -0.62, 0.6, 0.4, 0.4, { kind: 'crate', tag: 'standard', physics: false, note: 'a crate under the broken window outside: the step up from the yard (0.4 m, then a 0.5 m hop to the 0.9 m sill) [X]' });
feat('glass_shards', 'porch_glass', 'F0', null, 2.05, 0, -0.6, [1.2, 0.6, 0.01], { count: 10, physicsShards: 0, exterior: true });

// --- F0 dining
feat('table', 'dining_table', 'F0', 'dining_f0', 11.75, 0, 2.6, [2.2, 1.0, 0.78], { tag: 'standard', items: ['plates'] });
for (let i = 0; i < 6; i++) {
  const side = i < 3 ? -1 : 1, k = i % 3;
  feat('chair', `dining_chair_${i}`, 'F0', 'dining_f0', 11.0 + k * 0.75, 0, 2.6 + side * 0.75, [0.45, 0.45, 0.95], { tag: 'standard', rot: side > 0 ? 180 : 0, physics: true, knocked: i === 1 || i === 4 });
}
feat('chandelier', 'dining_chandelier', 'F0', 'dining_f0', 11.75, 2.4, 2.6, [0.7, 0.7, 0.4], { tilt: X(12, 'snapped chain') });
feat('cabinet', 'dining_china_cabinet', 'F0', 'dining_f0', 10.3, 0, 5.18, [1.2, 0.45, 1.9], { rot: 180 });
feat('sideboard', 'dining_sideboard', 'F0', 'dining_f0', 13.6, 0, 1.4, [1.6, 0.45, 0.85], { rot: -90 });
feat('lamp_table', 'dining_lamp', 'F0', 'dining_f0', 13.6, 0.85, 1.0, [0.3, 0.3, 0.55], { tag: 'standard', light: { color: '#FFD9A0', intensity: 0.4, range: 4 } });

// --- F0 cluttered hallway: 35 seeded physics props
const clutter = [
  ['cardboard', 0.5, 0.4, 0.35], ['cardboard', 0.5, 0.4, 0.35], ['cardboard', 0.5, 0.4, 0.35],
  ['carpet_roll', 0.3, 0.3, 1.6], ['bicycle', 1.4, 0.4, 0.8], ['crate', 0.6, 0.4, 0.4], ['bucket', 0.3, 0.3, 0.3], ['newspapers', 0.4, 0.3, 0.3],
  ['frames', 0.6, 0.1, 0.5], ['stepladder', 0.5, 0.15, 1.2],
];
const kinds2 = ['cardboard', 'cardboard_small', 'paint_can', 'bucket', 'crate', 'newspapers', 'cardboard', 'paint_can', 'cardboard_small'];
const sizes = { cardboard: [0.5, 0.4, 0.35], cardboard_small: [0.35, 0.3, 0.25], paint_can: [0.16, 0.16, 0.19], bucket: [0.3, 0.3, 0.3], crate: [0.6, 0.4, 0.4], newspapers: [0.4, 0.3, 0.2] };
// fixed items first (named in the bible), then seeded filler to reach 35
box('clutter_00', 'F0', 'hall_ground', 6.6, 3.6, 0.5, 0.4, 0.35, { kind: 'cardboard' });
box('clutter_01', 'F0', 'hall_ground', 6.6, 3.6, 0.5, 0.4, 0.35, { kind: 'cardboard', y: 0.35 });
box('clutter_02', 'F0', 'hall_ground', 6.6, 5.4, 0.5, 0.4, 0.35, { kind: 'cardboard' });
box('clutter_03', 'F0', 'hall_ground', 4.78, 4.6, 0.3, 0.3, 1.6, { kind: 'carpet_roll', lean: X(12) });
box('clutter_04', 'F0', 'hall_ground', 6.1, 4.9, 1.4, 0.4, 0.8, { kind: 'bicycle', rot: 70 });
box('clutter_05', 'F0', 'hall_ground', 6.5, 4.3, 0.6, 0.4, 0.4, { kind: 'crate', tag: 'standard' });
box('clutter_06', 'F0', 'hall_ground', 5.0, 3.5, 0.3, 0.3, 0.3, { kind: 'bucket' });
box('clutter_07', 'F0', 'hall_ground', 5.9, 3.4, 0.4, 0.3, 0.3, { kind: 'newspapers' });
box('clutter_08', 'F0', 'hall_ground', 4.68, 3.9, 0.6, 0.1, 0.5, { kind: 'frames', rot: 90 });
box('clutter_09', 'F0', 'hall_ground', 6.85, 5.0, 0.5, 0.15, 1.2, { kind: 'stepladder', rot: 90 });
for (let i = 10; i < 35; i++) {
  const k = kinds2[Math.floor(rnd() * kinds2.length)];
  const [w, d, h] = sizes[k];
  // seeded scatter, keeping a weaving lane down the middle clear-ish
  const x = 4.75 + rnd() * 2.0, z = 3.25 + rnd() * 1.95;
  if (x > 5.45 && x < 5.95) continue;
  box(`clutter_${String(i).padStart(2, '0')}`, 'F0', 'hall_ground', r3(x), r3(z), w, d, h, { kind: k, rot: Math.round(rnd() * 90), seeded: true });
}
void clutter;
feat('lamp_pendant', 'hall_bulb', 'F0', 'hall_ground', 5.75, 3.0, 5.6, null, { light: { color: '#FFC97A', intensity: 0.5, range: 5, flicker: true } });
feat('panel', 'electrical_panel', 'F0', 'closet_f0', 9.38, 1.3, 4.3, [0.05, 0.5, 0.7], { tag: 'design' });

// --- F0 stair hall landing strip
feat('umbrella_stand', 'umbrella_stand', 'F0', 'stair_hall_f0', 6.75, 0, 10.6, [0.3, 0.3, 0.6], { physics: true });
feat('table', 'stairhall_side_table', 'F0', 'stair_hall_f0', 6.7, 0, 7.0, [0.5, 0.5, 0.7]);
feat('lamp_table', 'stairhall_lamp', 'F0', 'stair_hall_f0', 6.7, 0.7, 7.0, [0.3, 0.3, 0.55], { tag: 'standard', note: 'a normal lamp, not the climbable one', light: { color: '#FFD9A0', intensity: 0.4, range: 4 } });

// --- F0 kitchen
feat('fridge', 'kitchen_fridge', 'F0', 'kitchen_f0', 7.6, 0, 10.45, [0.8, 0.75, 1.8], { color: 'RETRO_MINT', ajar: true, rot: 180 });
feat('stove', 'kitchen_stove', 'F0', 'kitchen_f0', 9.0, 0, 10.5, [0.75, 0.65, 0.9], { rot: 180, items: ['kettle'] });
feat('counter', 'kitchen_counter_n', 'F0', 'kitchen_f0', 11.6, 0, 10.55, [3.6, 0.6, 0.9], { rot: 180, sink: true });
feat('counter', 'kitchen_counter_e', 'F0', 'kitchen_f0', 13.55, 0, 6.6, [1.8, 0.6, 0.9], { rot: -90 });
feat('table', 'kitchen_island', 'F0', 'kitchen_f0', 10.6, 0, 8.3, [1.6, 0.8, 0.9], { items: ['laundry'] });
for (let i = 0; i < 4; i++) feat('stool', `kitchen_stool_${i}`, 'F0', 'kitchen_f0', 10.0 + i * 0.4, 0, 7.6, [0.35, 0.35, 0.65], { physics: true });
feat('cabinet', 'kitchen_pantry', 'F0', 'kitchen_f0', 13.55, 0, 9.6, [1.0, 0.55, 2.1], { rot: -90 });
feat('corkboard', 'kitchen_corkboard', 'F0', 'kitchen_f0', 12.0, 1.5, 5.6, [0.9, 0.03, 0.6]);

// --- F0 back hall and basement door
feat('drain', 'backhall_drain', 'F0', 'back_hall_f0', 3.25, 0.002, 8.75, [0.25, 0.25, 0.01]);
feat('lamp_pendant', 'landing_bulb', 'F0', 'basement_landing_f0', 1.0, 3.0, 8.0, null, { light: { color: '#FFF0D0', intensity: 0.5, range: 5 } });

// --- B1 basement
feat('workbench', 'b1_workbench', 'B1', 'basement_b1', 5.5, 0, 10.45, [2.4, 0.7, 0.9], { rot: 180, items: ['tools'] });
feat('boiler', 'b1_boiler', 'B1', 'basement_b1', 8.2, 0, 4.0, [0.9, 0.9, 1.6]);
feat('shelf', 'b1_shelves', 'B1', 'basement_b1', 3.0, 0, 3.35, [1.8, 0.4, 2.0], { items: ['jars'] });
feat('chalk_outline', 'b1_chalk', 'B1', 'basement_b1', 5.0, 0.002, 6.5, [0.9, 1.9, 0.01]);
feat('pipe', 'b1_pipe', 'B1', 'basement_b1', 4.5, 2.95, 7.0, [8.5, 0.12, 0.12]);
feat('tally_wall', 'b1_tally', 'B1', 'basement_b1', 8.83, 1.4, 7.5, [0.02, 2.0, 0.8]);
for (let i = 0; i < 3; i++) feat('tube_light', `b1_tube_${i}`, 'B1', 'basement_b1', 2.5 + i * 3, 3.1, 7, [1.2, 0.08, 0.08], { light: { color: '#A6F0D0', intensity: 0.7, range: 7 } });

// --- F1 hall: gate route (section 39)
feat('climbable_rail', 'gate_rail', 'F1', 'hall_f1', 6.66, 0, 4.6, [X(0.5, 'cap wider than the 0.44 m capsule'), X(2.0), X(0.55, 'rail top')], {
  tag: 'design', documented: 'jump onto a railing (src_0003)', note: 'bible: x[6.5,7.0]; slid west to the wall face (x 6.91) so it does not stand inside the wall',
});
feat('lamp_climbable', 'gate_lamp', 'F1', 'hall_f1', 6.25, 0, 2.65, [X(0.52, 'shade cap'), X(0.52), X(1.2, 'cap height')], {
  tag: 'design', documented: 'then onto a lamp (src_0003)', anchored: true, note: 'heavy steel-reinforced drum shade, anchored, never tips',
});
feat('lamp_pendant', 'hall1_bulb', 'F1', 'hall_f1', 5.75, 3.0, 3.0, null, { light: { color: '#FFC97A', intensity: 0.6, range: 6 } });
feat('runner', 'hall1_runner', 'F1', 'hall_f1', 5.5, 0.005, 3.0, [0.9, 5.6, 0.01], { color: 'CARPET_GREEN' });

// --- F1 rooms
feat('bed', 'bedroom_bed', 'F1', 'bedroom_a', 1.3, 0, 1.4, [2.0, 1.4, 0.55], { tag: 'standard', rot: 90 });
feat('nightstand', 'bedroom_nightstand', 'F1', 'bedroom_a', 0.4, 0, 2.6, [0.5, 0.4, 0.55], { items: ['alarm_clock'] });
feat('wardrobe', 'bedroom_wardrobe', 'F1', 'bedroom_a', 3.6, 0, 5.08, [1.2, 0.6, 2.2], { tag: 'standard', rot: 180 });
feat('dresser', 'bedroom_dresser', 'F1', 'bedroom_a', 1.8, 0, 5.15, [1.2, 0.5, 1.0], { rot: 180, mirror: true });
feat('chair', 'bedroom_chair', 'F1', 'bedroom_a', 3.4, 0, 0.6, [0.45, 0.45, 0.95], { tag: 'standard', physics: true });
feat('rug', 'bedroom_rug', 'F1', 'bedroom_a', 2.4, 0.005, 2.6, [2.0, 1.4, 0.01], { color: 'CARPET_RED' });
feat('desk', 'study_desk', 'F1', 'study_f1', 1.0, 0, 9.45, [0.7, 1.4, 0.75], { items: ['typewriter', 'monitor'] });
feat('cabinet', 'study_filing', 'F1', 'study_f1', 2.4, 0, 10.62, [0.5, 0.6, 1.3], { rot: 180 });
feat('closet', 'study_closet', 'F1', 'study_f1', 3.8, 0, 10.55, [1.1, 0.7, 2.1], { rot: 180, note: 'the study closet, holds a mannequin in a plastic bag [X]' });
feat('map', 'study_map', 'F1', 'study_f1', 0.12, 1.5, 9.45, [0.02, 0.9, 0.6]);
feat('tub', 'bath_tub', 'F1', 'bath_f1', 0.95, 0, 6.75, [1.7, 0.75, 0.65], { rot: 90 });
feat('toilet', 'bath_toilet', 'F1', 'bath_f1', 3.6, 0, 5.9, [0.4, 0.65, 0.75], { tag: 'standard' });
feat('sink', 'bath_sink', 'F1', 'bath_f1', 2.6, 0, 5.85, [0.55, 0.45, 0.85], { tag: 'standard' });
feat('plant', 'stairwell_plant', 'F1', 'stairwell_f1', 6.6, 0, 10.5, [0.5, 0.5, 1.6]);
feat('railing', 'stairwell_balustrade', 'F1', 'stairwell_f1', 0, 0, 0, null, { path: [P(5.7, 0, 5.37), P(5.7, 0, 8.55), P(4.59, 0, 8.55)], height: A(0.9, 'handrail'), gap: A(0.1, 'baluster_gap'), note: 'open balustrade along the stair opening' });
feat('railing', 'landing_balustrade', 'F0', 'basement_landing_f0', 0, 0, 0, null, { path: [P(0.15, 0, 6.95), P(1.26, 0, 6.95), P(1.26, 0, 10.15)], height: A(0.9, 'handrail'), gap: A(0.1, 'baluster_gap') });

// --- gallery (gated section)
feat('table', 'gallery_table', 'F1', 'gallery_f1', 11.0, 0, 3.0, [2.4, 0.9, 0.78]);
feat('sofa', 'gallery_sofa', 'F1', 'gallery_f1', 13.4, 0, 2.55, [2.0, 0.9, 0.85], { tag: 'standard', rot: -90, color: 'SOFA_GREEN' });
feat('rug', 'gallery_rug', 'F1', 'gallery_f1', 11.0, 0.005, 3.0, [3.4, 2.2, 0.01], { color: 'CARPET_GREEN' });
feat('shelf', 'gallery_toy_shelf', 'F1', 'gallery_f1', 9.6, 0, 5.75, [2.0, 0.4, 1.6], { rot: 180, items: ['toys'] });
for (let i = 0; i < 2; i++) feat('dust_sheet', `gallery_sheet_${i}`, 'F1', 'gallery_f1', 12.6 + i * 0.6, 0, 0.55, [0.5, 0.45, 1.75]);
feat('ladder', 'gallery_ladder', 'F1', 'gallery_f1', 8.4, 0, 4.68, [X(0.9, 'frame'), X(0.9), X(3.7, 'gallery floor to the F2 floor')], {
  tag: 'design', documented: 'a ladder to the penultimate floor (src_0004)', rungSpacing: S(0.28, 'ladder rung spacing'), railGap: S(0.45), rungDia: S(0.025), facing: '-z', to: 'F2', note: 'rungs on the south edge of the hatch, the climber faces -z and steps off forward; the bible frame x[8.0,8.8] z[4.6,5.4] is kept as the hatch area',
});

// --- birthday room
feat('table', 'party_table', 'F1', 'birthday_room', 10.5, 0, 8.5, [3.0, 1.0, 0.78], { tag: 'standard', items: ['cake', 'hats'] });
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2;
  feat('chair_child', `party_chair_${i}`, 'F1', 'birthday_room', 10.5 + Math.cos(a) * 1.9, 0, 8.5 + Math.sin(a) * 1.0, [0.3, 0.3, 0.55], { rot: Math.round((-a * 180) / Math.PI + 90), physics: true, knocked: i === 2 });
}
feat('cake', 'party_cake', 'F1', 'birthday_room', 10.5, 0.78, 8.5, [S(0.25, 'birthday cake'), S(0.25), S(0.15)], { tag: 'standard' });
feat('banner', 'party_banner', 'F1', 'birthday_room', 10.5, 2.4, 6.12, [3.0, 0.02, 0.5]);
feat('balloons', 'party_balloons', 'F1', 'birthday_room', 10.5, 2.2, 8.5, [S(0.25, 'balloon')], { count: 14 });
feat('disco_ball', 'party_disco', 'F1', 'birthday_room', 10.5, 2.9, 8.5, [0.35, 0.35, 0.35]);
feat('string_lights', 'party_lights', 'F1', 'birthday_room', 10.5, 3.2, 8.5, null, { light: { color: '#FFD6A0', intensity: 0.6, range: 7 } });

// --- F2
feat('guard_rail', 'hatch_guard', 'F2', 'ladder_room_f2', 8.4, 0, 4.9, [1.1, 0.95, 0.9], { tag: 'design', openSide: '-z', note: 'steel guard rail around the hatch' });
feat('lamp_pendant', 'f2_bulb', 'F2', 'ladder_room_f2', 6.5, 2.6, 4.2, null, { light: { color: '#FFF0D0', intensity: 0.6, range: 6 } });
feat('switch_bank', 'control_switches', 'F2', 'control_room_f2', 3.7, 0, 6.75, [0.3, 2.0, 1.4], { rot: 90 });
feat('desk', 'control_desk', 'F2', 'control_room_f2', 9.4, 0, 6.15, [1.4, 0.7, 0.75], { drawer: true, note: 'the keycard is in the drawer [X]' });
feat('button_post', 'train_button', 'F2', 'control_room_f2', 6.0, 0, 7.4, [0.25, 0.25, X(1.0, 'post height')], { tag: 'design', documented: 'a button and a lever start the train (src_0004)' });
feat('lever_box', 'train_lever', 'F2', 'control_room_f2', 8.5, 0, 7.4, [X(0.3), X(0.3), X(0.9)], { tag: 'design', throwDeg: X(60, 'lever throw') });
feat('fault_light', 'train_fault', 'F2', 'control_room_f2', 8.5, 1.7, 7.86, [0.12, 0.05, 0.12], { light: { color: '#FF3030', intensity: 0.5, range: 3, blink: true } });

// ------------------------------------------------------------ roof, terrace, windmill
const roofSpec = {
  terrace: { floor: 'F1', deck: A(7.4, 'floor_to_floor'), color: '#3B3B44', seams: X(1.0, 'felt seams') },
  parapet: { height: X(0.55, 'parapet'), thickness: X(0.25, 'parapet'), coping: 'NH_ROOF' },
  box: { floor: 'F2', pitch: A(12, 'roof_pitch_low'), ridge: 'x', color: 'NH_ROOF_ALT', eaves: A(0.15, 'box eaves, small') },
  perch: { at: P(10.0, 0, 5.5, 'design', 'flat 1.0 m perch at the east end of the box roof, where the ladder lands'), size: [X(1.0), X(1.2), X(0.1)] },
  boxLadder: { at: P(10.72, 7.4, 5.4, 'design', 'bible: x 10.5 + 0.05 on the east wall, z[5.0,5.8]'), width: X(0.8), rungSpacing: S(0.28, 'ladder rung spacing'), cage: true, facing: '-x' },
  chimney: { at: P(13.4, 7.4, 7.45, 'design', 'east edge of the terrace'), size: [X(0.9), X(0.9), X(1.5, 'above the deck')] },
  porch: { width: A(5.0, 'porch'), depth: A(1.6, 'porch'), columns: A(0.28, 'porch column'), steps: { count: 3, rise: S(0.18, 'step rise'), tread: S(0.3, 'step tread'), width: A(3.0) }, eaves: A(0.45, 'eaves') },
  foundation: { height: A(0.45, 'foundation plinth'), color: 'NH_FOUNDATION', vents: 3 },
  yard: { depth: A(8, 'back yard'), fence: A(1.2, 'fence height') },
};
const windmill = {
  at: P(7.0, 0, 5.5, 'documented-weak', 'on the roof (src_0007, weak source); stands on the ridge of the box roof'),
  tower: { height: A(3.0, 'windmill_tower'), base: X(1.2), top: X(0.8), sides: 8 },
  blades: { count: 4, length: A(1.8, 'windmill_blade'), width: A(0.35, 'windmill_blade'), twist: X(8), rps: A(0.3, 'windmill_speed'), rpsClimbing: X(0.1) },
  hub: X(0.3), platform: X(0.8, 'top platform'), rungSpacing: S(0.28, 'ladder rung spacing'),
  source: 'src_0007',
};

// ------------------------------------------------------------ house.json
const house = {
  schemaVersion: 1,
  revision: 1,
  units: 'm',
  polygonConvention: 'centerline',
  name: 'Act 3 House Study: the baseline house (Part III, all assumed until measured)',
  origin: 'Room rectangles are wall centerlines from (0, 0); the outer face of the front-left corner is at (-0.15, -0.15).',
  playerHeight: A(1.2, 'player_height_default', { note: 'child, unconfirmed' }),
  spawn: { at: P(2.05, 0, -2.6, 'design', 'on the front path, facing the broken window'), yaw: X(0) },
  floors,
  stairs,
  roof: roofSpec,
  windmill,
  features,
  sources: 'sources.json',
};

// ------------------------------------------------------------ puzzle, security, train, palette
const puzzle = {
  schemaVersion: 1,
  note: 'Pickup locations, the bolt order, the mannequin count and the train sequence. All design placeholders [X]; the real solution is not claimed.',
  items: [
    { id: 'crowbar', kind: 'crowbar', at: P(9.0, 0.02, 9.9, 'design', 'behind the stove in the kitchen'), floor: 'F0', size: [S(0.6, 'crowbar length'), S(0.02, 'round steel')] },
    { id: 'keycard', kind: 'keycard', at: P(9.4, 0.6, 6.15, 'design', 'in the control room desk drawer'), floor: 'F2', size: [S(0.0856, 'ISO ID-1 card'), S(0.05398), S(0.00076)], cartoonScale: X(2.0, 'cartoon scale for props') },
  ],
  basement: { door: 'basement_door', bolts: 6, boltOrder: 'any', boltHold: X(1.5, 'seconds per bolt'), keycardHold: X(0.4, 'seconds'), requires: ['crowbar', 'keycard'] },
  mannequinCount: 5,
  mannequinHeight: A(1.75, 'mannequin adult'),
  mannequins: [
    { id: 'mannequin_gallery', at: P(12.3, 3.7, 1.2, 'design', 'under a dust sheet in the gallery'), floor: 'F1', sheet: true },
    { id: 'mannequin_train', at: P(0, 0, 0, 'design', 'rides the last train carriage'), onTrain: true, decoy: true },
    { id: 'mannequin_windmill', at: P(7.0, 0, 5.5, 'design', 'hangs from the windmill hub, 0.2 m below its center'), onWindmill: true },
    { id: 'mannequin_study', at: P(3.8, 3.7, 10.5, 'design', 'in the study closet, in a plastic bag'), floor: 'F1', bagged: true },
    { id: 'mannequin_basement', at: P(8.5, -3.5, 8.5, 'design', 'standing against the basement wall'), floor: 'B1' },
  ],
  birthday: {
    room: 'birthday_room', mannequinCount: 5,
    pads: Array.from({ length: 5 }, (_, i) => P(13.4, 3.7, 6.9 + i * 1.2, 'design', `pad ${i + 1}`)),
    padDiameter: X(0.6), order: 'any',
  },
  train: { sequence: ['train_button', 'train_lever'], laps: 3, station: 'P1' },
};

const sec = (id, floorId, x, y, z, yaw, pitch, o = {}) => ({
  id, kind: 'camera', floor: floorId, at: P(x, y, z, 'design'), yaw: X(yaw), pitch: X(pitch),
  fov: X(o.fov ?? 70, 'camera field of view'), range: X(o.range ?? 10, 'camera range'), sweep: X(o.sweep ?? 90, 'sweep degrees'), period: X(o.period ?? 8, 'seconds per sweep'),
  body: [S(0.2, 'camera body'), S(0.1), S(0.1)], arm: S(0.25, 'bracket arm'), switchAt: o.switchAt ?? null, ...(o.blind ? { blind: o.blind } : {}), note: o.note,
});
// yaw: 0 looks toward -z (the game's forward), 90 toward -x, -90 toward +x, 180 toward +z
const security = {
  schemaVersion: 1,
  note: 'Reports mention new cameras and laser grids (src_0001). Every position here is design [X].',
  alarm: { beep: X(2.0, 'tracking seconds before the alarm'), loudCamera: X(90), loudLaser: X(100) },
  cameras: [
    sec('cam_dining', 'F0', 13.7, 3.15, 5.2, 100, -35, { note: 'north-east ceiling corner, covers the kitchen doorway', switchAt: P(13.85, 1.4, 4.4) }),
    sec('cam_kitchen', 'F0', 13.75, 2.95, 7.475, 90, -30, { note: 'above the east door', switchAt: P(13.85, 1.4, 8.6) }),
    sec('cam_landing', 'F0', 0.25, 3.1, 10.7, -45, -35, { sweep: 90, period: 8, blind: X(3, 'seconds, left side'), note: 'over the sealed door, covers the six bolts', switchAt: P(0.15, 1.4, 7.4) }),
    sec('cam_hall_gate', 'F1', 4.7, 3.1, 2.5, -90, -30, { note: 'above the gate on the hall side, sees the rail', switchAt: P(4.62, 1.4, 0.6) }),
    sec('cam_gallery_0', 'F1', 9.0, 3.2, 5.8, 0, -45, { fov: 60, note: 'leaves a 1.5 m blind strip along the south wall', switchAt: P(7.12, 1.4, 5.4) }),
    sec('cam_gallery_1', 'F1', 12.5, 3.2, 5.8, 0, -45, { fov: 60, switchAt: P(13.85, 1.4, 5.6) }),
    sec('cam_control', 'F2', 10.25, 2.85, 7.75, 45, -35, { switchAt: P(10.35, 1.4, 6.2) }),
    sec('cam_terrace_0', 'F1', 0.0, 4.25, 0.0, -135, -20, { range: 12, note: 'terrace parapet corner' }),
    sec('cam_terrace_1', 'F1', 14.0, 4.25, 0.0, 135, -20, { range: 12 }),
    sec('cam_terrace_2', 'F1', 14.0, 4.25, 11.0, 45, -20, { range: 12 }),
    sec('cam_terrace_3', 'F1', 0.0, 4.25, 11.0, -45, -20, { range: 12 }),
    sec('cam_east_door', 'F0', 14.4, 3.0, 7.475, -90, -35, { range: 8, note: 'outside, above the kitchen side door' }),
  ],
  lasers: [
    { id: 'laser_closet', floor: 'F0', a: P(6.95, 0.3, 4.0), b: P(6.95, 0.3, 4.95), note: 'tripwire across the closet door, 0.3 m up' },
    ...[0.2, 0.6, 1.0].map((h, i) => ({ id: `laser_hall_${i}`, floor: 'F1', a: P(4.6, h, 5.0), b: P(6.4, h, 5.0), note: 'laser grid across the hall at z 5.0; the rail top carries you past it' })),
  ],
  emitter: S(0.06, 'laser emitter cube'), beam: S(0.01, 'beam thickness'),
};

// The train loop (section 41): the outer ring is the full track; the train
// itself runs the front half of the ring plus the chord through the box.
// Each corner of the bible's P0..P7 rectangle is a true circular arc of
// radius 1.3 m (nine points), and straights get a point every ~0.5 m, so the
// Catmull-Rom spline keeps its minimum turn radius above 1.2 m.
const deck = 7.45, inside = 7.7;
// Corners are eased: the curvature ramps up over 0.6 m, holds a 1.5 m
// radius, and ramps down again (a clothoid-style transition). A plain arc
// meeting a straight makes the Catmull-Rom spline overshoot and dip under
// the 1.2 m minimum; an eased corner does not. Points every 0.25 m.
const RC = 1.5, LS = 0.5, STEP = 0.25;
const easedTurn = (() => {
  // integrate a 90 degree left turn starting at the origin heading +x
  const k = 1 / RC, Lc = (Math.PI / 2) / k - LS, L = 2 * LS + Lc, ds = 0.002;
  let x = 0, y = 0, h = 0;
  const pts = [[0, 0, 0]];
  for (let s = 0; s < L - 1e-9; s += ds) {
    const m = s + ds / 2;
    const kap = m < LS ? (k * m) / LS : m < LS + Lc ? k : (k * (L - m)) / LS;
    h += kap * ds;
    x += Math.cos(h) * ds;
    y += Math.sin(h) * ds;
    pts.push([x, y, s + ds]);
  }
  const T = x; // the end heading is +y, so the corner is at (x, 0)
  const out = [];
  for (let d = 0; d <= L + 1e-9; d += L / Math.round(L / STEP)) {
    const q = pts.reduce((b, p) => (Math.abs(p[2] - d) < Math.abs(b[2] - d) ? p : b));
    out.push([q[0] - T, q[1]]);
  }
  return { T, pts: out };
})();
// a corner at (cx, cz): incoming direction (dx0, dz0), outgoing (dx1, dz1)
const corner = (cx, cz, dx0, dz0, dx1, dz1, y0 = deck, y1 = y0, note) => {
  const n = easedTurn.pts.length;
  return easedTurn.pts.map(([u, v], i) => {
    // u runs along the incoming direction (ending at 0 at the corner line), v along the outgoing
    const x = cx + dx0 * u + dx1 * v, z = cz + dz0 * u + dz1 * v;
    const t = i / (n - 1);
    return P(x, y0 + (y1 - y0) * t, z, 'design', i === Math.floor(n / 2) ? note : undefined);
  });
};
const T = easedTurn.T;
const straight = (x0, z0, x1, z1, y0 = deck, y1 = y0) => {
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(0, Math.round(L / STEP) - 1);
  return Array.from({ length: n }, (_, i) => { const t = (i + 1) / (n + 1); return P(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t); });
};
// the bible's rectangle P0..P7 has its front at z 1.5; the front runs at z
// 0.85 here so the train's two turns into the box (chord at z 4.4) fit
const ZF = 0.85, ZB = 9.5, XW = 1.5, XE = 12.5, ZC = 4.4;
if (2 * T > ZC - ZF + 1e-6) throw new Error(`track turns do not fit: 2T = ${(2 * T).toFixed(2)} > ${(ZC - ZF).toFixed(2)}`);
const ring = [
  ...corner(XW, ZF, 0, -1, 1, 0, deck, deck, 'P0 front-left corner'), ...straight(XW + T, ZF, XE - T, ZF),
  ...corner(XE, ZF, 1, 0, 0, 1, deck, deck, 'P2 front-right corner'), ...straight(XE, ZF + T, XE, ZB - T),
  ...corner(XE, ZB, 0, 1, -1, 0, deck, deck, 'P4 back-right corner'), ...straight(XE - T, ZB, XW + T, ZB),
  ...corner(XW, ZB, -1, 0, 0, -1, deck, deck, 'P6 back-left corner'), ...straight(XW, ZB - T, XW, ZF + T),
];
// train route: the front of the ring, down the east side, west through both
// holes of the box (rails 0.3 m above the box floor), back up the west side.
// The climb from the deck to the holes happens on the turns.
const route = [
  ...corner(XW, ZF, 0, -1, 1, 0, deck, deck, 'P0'), ...straight(XW + T, ZF, XE - T, ZF),
  ...corner(XE, ZF, 1, 0, 0, 1, deck, deck, 'P2'), ...straight(XE, ZF + T, XE, ZC - T),
  ...corner(XE, ZC, 0, 1, -1, 0, deck, inside, 'east turn into the box'), ...straight(XE - T, ZC, XW + T, ZC, inside, inside),
  ...corner(XW, ZC, -1, 0, 0, -1, inside, deck, 'west turn out of the box'), ...straight(XW, ZC - T, XW, ZF + T),
];
// the bible runs the chord at z 4.2 through holes z[3.8,5.0]; it runs at the
// holes' center line, z 4.4
// mark the station on the front straight
const st = route.reduce((b, p) => (Math.abs(p.x - 7) + Math.abs(p.z - ZF) < Math.abs(b.x - 7) + Math.abs(b.z - ZF) ? p : b), route[0]);
st.note = 'P1 station';
const train = {
  schemaVersion: 1,
  note: 'Catmull-Rom control points (centripetal), each tagged. The plan-view path is design/assumed until a photo or map arrives.',
  gauge: A(0.45, 'rail_gap'), sleeperSpacing: X(0.3), railHeight: X(0.05, 'above the deck'), minRadius: X(1.2, 'minimum turn radius'), clearance: X(0.3),
  speed: A(1.0, 'train speed m/s'), laps: 3, station: 'P1',
  ring: { closed: true, controlPoints: ring },
  route: { closed: true, controlPoints: route, note: 'the train path: front half of the ring plus the chord through the box' },
  engine: { size: [A(0.9, 'train car'), A(0.5, 'train car'), A(0.6, 'engine height')], color: 'RED_TOY', chimney: 'YELLOW_TOY' },
  carriages: [
    { size: [A(0.9, 'train car'), A(0.5, 'train car'), A(0.45, 'carriage height')], color: 'BLUE_TOY' },
    { size: [A(0.9, 'train car'), A(0.5, 'train car'), A(0.45, 'carriage height')], color: 'YELLOW_TOY', carries: 'mannequin_train' },
  ],
  carGap: X(0.1),
};

const palette = {
  schemaVersion: 1,
  note: 'Surface id -> palette name (or hex). Change one line when a color reference arrives. All colors assumed.',
  exterior: { F0: 'NH_SIDING_MAIN', F1: '#EBC14A', F2: 'NH_SIDING_ALT', trim: 'NH_TRIM', foundation: 'NH_FOUNDATION', roof: 'NH_ROOF', boxRoof: 'NH_ROOF_ALT', frontDoor: 'NH_DOOR_FRONT', downspout: 'NH_METAL_SHEET', terrace: '#3B3B44' },
  rooms: Object.fromEntries(floors.flatMap((f) => f.rooms.map((r) => [r.id, r.surfaces]))),
};

const json = (o) => JSON.stringify(o, null, 1) + '\n';
writeFileSync(out('house.json'), json(house));
writeFileSync(out('puzzle.json'), json(puzzle));
writeFileSync(out('security.json'), json(security));
writeFileSync(out('train.json'), json(train));
writeFileSync(out('palette.json'), json(palette));
console.log(`wrote house.json (${floors.reduce((n, f) => n + f.rooms.length, 0)} rooms, ${features.length} features), puzzle.json, security.json, train.json, palette.json`);
