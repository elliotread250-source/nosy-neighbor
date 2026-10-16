// Second floor: upstairs hallway, Grimsby's bedroom, upstairs bathroom,
// back stairwell, study/workshop, the kid's room, the utility closet.
import { Group, Mesh, SphereGeometry, Vector3 } from 'three';
import { makePlacer } from './common.js';
import * as F from '../props/Furniture.js';
import * as D from '../props/Decor.js';
import { makeMat } from '../../art/Materials.js';
import * as Tex from '../../art/CanvasTextures.js';
import { roundedBox, chamferCylinder } from '../../art/Geo.js';
import { FLOOR_Y } from '../NeighborPlan.js';

export function furnishUpperFloor(ctx) {
  const { place, loose } = makePlacer(ctx, 'F1');
  const Y = FLOOR_Y.F1;
  const PI = Math.PI;

  // ---------------------------------------------------------------- upstairs hallway
  place(F.rug('hall1-runner', { w: 0.7, d: 3.4, color: 'CARPET_GREEN' }), -1.9, -23.8, 0, { collide: false, dy: 0.03 });
  place(F.table('hall1-console', { w: 0.5, d: 0.35, h: 0.85, turnedLegs: true }), 0.12, -14.6, -PI / 2);
  loose('vase', 0.12, -14.6, { dy: 0.85, room: 'hall1' });
  place(D.photoWall('hall1-ph1', 'house'), 0.32, -19.0, -PI / 2, { dy: 1.7, collide: false });
  place(D.photoWall('hall1-ph2', 'fair'), -2.32, -20.4, PI / 2, { dy: 1.7, collide: false });
  place(D.hamper('hall1-hamper', 'SKY_TOY'), 0.05, -25.65, 0, { noBake: true, hide: { kind: 'hamper', room: 'hall1' } });
  place(D.ceilingBulb('hall1-bulb'), -1.0, -24.0, 0, { y: Y + 2.7, collide: false });

  // ---------------------------------------------------------------- Grimsby's bedroom
  place(F.rug('bed-rug', { w: 2.4, d: 1.8, color: 'CARPET_RED' }), -4.6, -17.0, 0, { collide: false, dy: 0.03 });
  const bed = place(F.bed('bed-bed', { quilt: 'CARPET_RED', w: 1.5, l: 2.1, headH: 1.7 }), -5.85, -18.6, PI / 2, { hide: { kind: 'underBed', room: 'bedroom' }, collide: false });
  // bed collides only above the gap so the player can crawl under it
  ctx.physics.addStaticBox(new Vector3(-5.85, Y + 0.48, -18.6), new Vector3(1.05, 0.2, 0.75));
  ctx.house.bedUnder = new Vector3(-5.85, Y, -18.6);
  place(F.nightstand('bed-night'), -6.65, -17.35, PI / 2);
  loose('alarmClock', -6.65, -17.35, { dy: 0.56, room: 'bedroom', rotY: PI / 2 });
  place(F.lamp('bed-lamp', { kind: 'table', base: 'BUBBLEGUM' }), -6.65, -17.55, 0, { dy: 0.55, collide: false });
  place(F.dresser('bed-dresser'), -4.3, -20.12, 0);
  place(D.medicineCabinet('bed-mirror'), -4.3, -20.32, 0, { dy: 1.05, collide: false });
  place(F.wardrobe('bed-wardrobe', 'WOOD_DARK'), -3.15, -20.03, 0, { noBake: true, hide: { kind: 'wardrobe', room: 'bedroom' } });
  const vestChair = F.chair('bed-chair', 'WOOD_MID', 'SOFA_GREEN');
  const spare = new Mesh(roundedBox(0.5, 0.55, 0.06, 0.05, 2), makeMat('WHITE', { map: Tex.argyle() }));
  spare.position.set(0, 1.0, -0.17);
  spare.rotation.x = -0.15;
  vestChair.add(spare);
  place(vestChair, -3.0, -14.75, PI + 0.3);
  place(D.photoWall('bed-family', 'family'), -6.86, -18.6, PI / 2, { dy: 2.15, collide: false });
  place(D.shoebox('bed-shoebox'), -5.6, -18.9, 0.3, { collide: false, dy: 0.02 });
  for (let i = 0; i < 2; i++) loose('book', -4.0 + i * 0.3, -20.05, { dy: 0.96, room: 'bedroom' });

  // ---------------------------------------------------------------- upstairs bathroom (bright yellow tile)
  place(D.bathtub('bath1-tub', { clawfoot: true, color: 'FRIDGE' }), -5.2, -22.85, 0, { noBake: true, hide: { kind: 'tub', room: 'bath1', eyeY: 1.35, eyeFwd: 0 } });
  place(D.medicineCabinet('bath1-med', true), -6.2, -20.62, PI, { dy: 1.3, collide: false });
  place(D.pedestalSink('bath1-sink'), -6.2, -20.9, PI);
  place(D.hamper('bath1-hamper', 'YELLOW_TOY'), -3.0, -21.1, 0, { noBake: true, hide: { kind: 'hamper', room: 'bath1' } });
  place(D.toilet('bath1-toilet'), -3.1, -23.05, 0);
  loose('duck', -5.2, -22.85, { dy: 0.8, room: 'bath1' });

  // ---------------------------------------------------------------- study / workshop
  place(F.rug('study-rug', { w: 2.6, d: 2.0, color: 'CARPET_GREEN' }), 4.8, -16.6, 0, { collide: false, dy: 0.03 });
  place(D.desk('study-desk'), 2.4, -19.0, 0);
  place(D.typewriter('study-typewriter'), 2.15, -18.95, 0, { dy: 0.81, collide: false });
  place(D.draftingLamp('study-lamp'), 2.95, -19.15, 0, { dy: 0.81, collide: false });
  for (let i = 0; i < 4; i++) {
    const stack = new Mesh(roundedBox(0.26, 0.04 + i * 0.03, 0.32, 0.01, 1), makeMat('FRIDGE'));
    place(stack, 1.6 + (i % 2) * 0.05, -18.8 - Math.floor(i / 2) * 0.05, i * 0.2, { dy: 0.81 + (i >= 2 ? 0.08 : 0), collide: false });
  }
  place(D.blueprint('study-bp1'), 2.4, -19.4, 0, { dy: 1.5, collide: false });
  place(D.blueprint('study-bp2', 0.8, 0.6), 3.6, -19.4, 0.08, { dy: 1.6, collide: false });
  place(D.toolShelf('study-tools'), 8.3, -18.4, -PI / 2);
  loose('paintCan', 8.2, -18.0, { dy: 0.45, room: 'study' });
  loose('paintCan', 8.2, -18.8, { dy: 0.45, room: 'study' });
  place(F.table('study-modeltable', { w: 1.3, d: 0.9, h: 0.75, color: 'WOOD_LIGHT', turnedLegs: false }), 5.2, -16.6, 0);
  place(D.neighborhoodModel('study-model'), 5.2, -16.6, 0, { dy: 0.75, collide: false });
  // the green table by the window (the red key lives here)
  const greenTable = place(F.table('study-greentable', { w: 0.6, d: 0.45, h: 0.7, color: 'KEY_GREEN', legColor: 'GRASS_DARK', turnedLegs: false }), 3.3, -13.75, 0);
  ctx.house.greenTable = greenTable;
  place(F.wardrobe('study-cabinet', 'METAL'), 0.86, -18.55, PI / 2, { noBake: true, hide: { kind: 'wardrobe', room: 'study' } });
  loose('can', 6.0, -14.6, { room: 'study' });
  place(D.ceilingBulb('study-bulb'), 4.6, -16.8, 0, { y: Y + 2.7, collide: false });

  // ---------------------------------------------------------------- kid's room (frozen in time, quiet, creepy)
  const kidRug = F.rug('kid-rug', { w: 3.0, d: 2.2, color: 'GRASS', pattern: 'border' });
  place(kidRug, 4.0, -21.6, 0, { collide: false, dy: 0.03 });
  const kidBed = place(F.bed('kid-bed', { quilt: 'BLUE_TOY', w: 1.1, l: 1.9, headH: 1.0, kid: true, frame: 'RED_TOY' }), 7.35, -22.55, -PI / 2, { hide: { kind: 'underBed', room: 'kid' }, collide: false });
  ctx.physics.addStaticBox(new Vector3(7.35, Y + 0.48, -22.55), new Vector3(0.95, 0.2, 0.6));
  place(D.mannequinChild('kid-mannequin'), 7.7, -22.55, PI / 2, { dy: 0.55, collide: false });
  const mobile = place(D.planetMobile('kid-mobile'), 7.3, -22.5, 0, { y: Y + 2.4, collide: false, noBake: true });
  ctx.house.kidMobile = mobile;
  const chest = place(F.toyChest('kid-chest'), 2.0, -23.3, 0);
  ctx.house.toyChest = chest;
  // the high shelf (crowbar): too high to reach without stacking toys
  place(F.shelf('kid-highshelf', 1.4, 'WOOD_LIGHT'), 1.6, -19.68, PI, { y: Y + 2.75, collide: false });
  ctx.physics.addStaticBox(new Vector3(1.6, Y + 2.75, -19.72), new Vector3(0.7, 0.04, 0.16));
  ctx.house.highShelf = new Vector3(1.6, Y + 2.8, -19.72);
  place(F.shelf('kid-shelf', 1.6, 'BUBBLEGUM'), 5.0, -19.68, PI, { y: Y + 1.6, collide: false });
  ctx.physics.addStaticBox(new Vector3(5.0, Y + 1.6, -19.72), new Vector3(0.8, 0.04, 0.16));
  // too-big stuffed animals on the shelf and floor
  loose('stuffed', 4.6, -19.75, { dy: 1.65, room: 'kid' });
  loose('stuffed', 5.4, -19.75, { dy: 1.65, room: 'kid' });
  loose('stuffed', 3.2, -23.3, { room: 'kid', data: { label: 'Giant teddy' } });
  for (const [x, z] of [[3.4, -21.0], [4.2, -21.8], [4.6, -20.9], [3.0, -22.2]]) loose('block', x, z, { room: 'kid' });
  loose('toyCar', 5.0, -22.3, { room: 'kid' });
  loose('ball', 2.8, -20.4, { room: 'kid' });
  loose('smallBox', 1.4, -22.2, { room: 'kid', data: { label: 'Toy box' } });

  // ---------------------------------------------------------------- utility closet (red key)
  place(D.toolShelf('closet-shelf'), 6.0, -25.75, 0);
  const toolbox = new Group();
  const tb = new Mesh(roundedBox(0.55, 0.28, 0.28, 0.05, 2), makeMat('RED_TOY', { spec: 0.4 }));
  tb.position.y = 0.14;
  const handle = new Mesh(roundedBox(0.3, 0.05, 0.05, 0.02, 1), makeMat('BLACK_SOFT'));
  handle.position.y = 0.34;
  toolbox.add(tb, handle);
  place(toolbox, 2.2, -25.3, 0.2, { collide: false, noBake: true });
  ctx.house.toolbox = toolbox;
  // the crowbar hint: a child's crayon drawing taped to the wall
  const drawing = D.blueprint('closet-drawing', 0.6, 0.45);
  drawing.children[0].material = makeMat('WHITE', { map: Tex.label('CROWBAR\n-> TOP SHELF\n(KID ROOM)', { bg: 'FRIDGE', fg: 'BLUE_TOY', w: 512, h: 384, size: 64 }) });
  place(drawing, 1.4, -24.0, PI, { dy: 1.5, collide: false });
  place(F.wardrobe('closet-locker', 'METAL_DARK'), 8.15, -24.95, -PI / 2, { noBake: true, hide: { kind: 'wardrobe', room: 'closet' } });
  loose('bucket', 3.5, -25.5, { room: 'closet' });
  loose('paintCan', 4.3, -25.5, { room: 'closet' });
  place(D.ceilingBulb('closet-bulb'), 4.0, -24.9, 0, { y: Y + 2.7, collide: false });
}

export { SphereGeometry, chamferCylinder };
