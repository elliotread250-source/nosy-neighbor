// Ground floor: front hallway, living room, dining room, kitchen, mudroom,
// downstairs bathroom.
import { Group, Mesh, SphereGeometry, Vector3 } from 'three';
import { makePlacer, DEG } from './common.js';
import * as F from '../props/Furniture.js';
import * as D from '../props/Decor.js';
import { makeMat } from '../../art/Materials.js';
import { roundedBox, chamferCylinder } from '../../art/Geo.js';
import { FLOOR_Y } from '../NeighborPlan.js';

export function furnishGroundFloor(ctx) {
  const { place, loose } = makePlacer(ctx, 'F0');
  const Y = FLOOR_Y.F0;
  const PI = Math.PI;

  // ---------------------------------------------------------------- front hallway
  place(F.rug('hall-runner', { w: 0.95, d: 7.2, color: 'CARPET_RED' }), 0.6, -17.9, 0, { collide: false, dy: 0.03 });
  place(F.coatStand('hall-coat'), -1.1, -14.55, 0.4);
  const keyTable = place(F.table('hall-table', { w: 0.6, d: 0.42, h: 0.82, turnedLegs: true }), -1.15, -15.55, PI / 2);
  // bowl of useless decoy keys: they jingle (make noise) when touched
  const bowl = new Group();
  const b = new Mesh(new SphereGeometry(0.16, 16, 8, 0, PI * 2, PI / 2, PI / 2), makeMat('SKY_TOY', { spec: 0.5, side: 2 }));
  bowl.add(b);
  for (let i = 0; i < 5; i++) {
    const k = new Mesh(roundedBox(0.12, 0.02, 0.03, 0.008, 1), makeMat(['BRASS', 'METAL', 'BRASS', 'METAL_DARK', 'BRASS'][i], { spec: 0.6 }));
    k.position.set(-0.06 + i * 0.03, -0.03 + (i % 2) * 0.02, (i % 3) * 0.03 - 0.03);
    k.rotation.y = i;
    bowl.add(k);
  }
  place(bowl, -1.15, -15.55, 0, { dy: 0.98, collide: false, interact: { kind: 'decoyKeys', label: 'Rummage through keys', noise: 0.45 } });
  const clock = place(F.grandfatherClock('hall-clock'), 1.12, -19.45, -PI / 2, { noBake: true, room: 'hall' });
  ctx.house.clock = clock;
  place(D.photoWall('ph-family', 'family'), -1.38, -15.0, PI / 2, { dy: 1.95, collide: false });
  place(D.photoWall('ph-house', 'house'), 1.38, -17.4, -PI / 2, { dy: 2.05, collide: false });
  place(D.photoWall('ph-fair', 'fair'), 1.38, -18.4, -PI / 2, { dy: 1.85, collide: false });
  place(F.wardrobe('hall-closet', 'WOOD_DARK'), 1.03, -14.95, -PI / 2, { noBake: true, hide: { kind: 'wardrobe', room: 'hall' } });

  // ---------------------------------------------------------------- living room
  place(F.rug('liv-rug', { w: 3.2, d: 2.6, color: 'CARPET_GREEN', pattern: 'circles' }), -4.75, -16.4, 0, { collide: false, dy: 0.03 });
  const tv = place(F.tv('liv-tv'), -4.75, -14.6, PI, { noBake: true, interact: { kind: 'tv', label: 'Turn TV on', lure: 'tv', on: true }, room: 'living' });
  ctx.house.tv = tv;
  place(F.sofa('liv-sofa', 'RETRO_ORANGE', 3), -4.75, -17.95, 0, { hide: { kind: 'behind', room: 'living' } });
  const arm = place(F.armchair('liv-armchair', 'SOFA_GREEN'), -2.55, -17.1, 0.55);
  ctx.house.armchair = arm;
  place(F.table('liv-coffee', { w: 1.2, d: 0.62, h: 0.45, color: 'WOOD_LIGHT', turnedLegs: false }), -4.75, -16.25, 0);
  loose('mug', -4.4, -16.2, { dy: 0.45, room: 'living', color: 'TOMATO' });
  loose('newspaper', -5.0, -16.3, { dy: 0.45, room: 'living' });
  loose('remote', -4.85, -16.05, { dy: 0.45, room: 'living' });
  place(D.fireplace('liv-fire'), -7.55, -17.0, PI / 2, { room: 'living' });
  loose('toyTrain', -7.6, -16.6, { dy: 1.48, room: 'living', rotY: PI / 2 });
  loose('snowGlobe', -7.6, -17.65, { dy: 1.48, room: 'living' });
  // candle
  const candle = new Group();
  const wax = new Mesh(chamferCylinder(0.04, 0.04, 0.22, 10, 0.01, { bottom: true }), makeMat('FRIDGE'));
  const flame = new Mesh(new SphereGeometry(0.025, 8, 6), makeMat('TANGERINE', { emissive: 'TANGERINE', emissiveIntensity: 1.5 }));
  flame.position.y = 0.26;
  flame.scale.y = 1.6;
  candle.add(wax, flame);
  place(candle, -7.6, -17.25, 0, { dy: 1.54, collide: false });
  place(F.bookshelf('liv-shelf', { leanDeg: 5 }), -7.55, -14.95, PI / 2);
  for (let i = 0; i < 3; i++) loose('book', -6.9 + i * 0.25, -14.5, { room: 'living' });
  place(F.lamp('liv-lamp', { h: 2.4 }), -2.05, -14.6, 0, { collide: false });
  place(F.wardrobe('liv-wardrobe', 'WOOD_MID'), -5.6, -21.5, 0, { noBake: true, hide: { kind: 'wardrobe', room: 'living' } });
  loose('vase', -2.3, -21.6, { room: 'living' });
  loose('ball', -3.6, -19.6, { room: 'living' });
  loose('can', -2.0, -19.0, { room: 'living' });

  // ---------------------------------------------------------------- dining room
  place(F.rug('din-rug', { w: 3.8, d: 2.4, color: 'CARPET_RED' }), 4.75, -17.0, 0, { collide: false, dy: 0.03 });
  place(F.table('din-table', { w: 3.0, d: 1.1, h: 0.8, color: 'WOOD_MID' }), 4.75, -17.0, 0, { hide: { kind: 'underTable', room: 'dining' }, collide: false });
  // the table: collide only with the top so the player can crouch under it
  ctx.physics.addStaticBox(new Vector3(4.75, Y + 0.76, -17.0), new Vector3(1.5, 0.05, 0.55));
  for (const [x, z, r] of [[3.75, -16.25, PI], [4.75, -16.25, PI], [5.75, -15.95, PI + 0.35], [3.75, -17.75, 0], [4.75, -17.75, 0], [5.75, -17.75, 0]]) {
    loose('chair', x, z, { builder: (n) => F.chair(n, 'WOOD_LIGHT', 'CARPET_GREEN'), rotY: r, room: 'dining', lift: 0.02 });
  }
  // set for three, with toy-like food
  for (const [x, z] of [[3.75, -16.75], [4.75, -16.75], [3.75, -17.25]]) loose('plate', x, z, { dy: 0.8, room: 'dining', rotY: 0 });
  place(D.roastChicken('din-chicken'), 4.9, -17.05, 0.4, { dy: 0.86, collide: false });
  place(D.peas('din-peas'), 3.75, -16.75, 0, { dy: 0.84, collide: false });
  loose('jello', 5.6, -17.0, { dy: 0.8, room: 'dining' });
  loose('apple', 5.3, -16.7, { dy: 0.8, room: 'dining' });
  const chand = D.chandelier('din-chand');
  place(chand, 4.75, -17.0, 0, { y: Y + 2.55, collide: false });
  place(D.chinaCabinet('din-cabinet'), 6.6, -19.62, 0);
  loose('mug', 6.9, -19.4, { dy: 0.96, room: 'dining', color: 'SKY_TOY' });

  // ---------------------------------------------------------------- kitchen
  place(F.counter('kit-counter1', { w: 2.4, sink: true, color: 'WOOD_LIGHT' }), 4.9, -25.6, 0);
  place(F.counter('kit-counter2', { w: 1.2, color: 'WOOD_LIGHT' }), 6.95, -25.6, 0);
  const fridge = place(F.fridge('kit-fridge', 'RETRO_MINT'), 7.42, -20.5, PI, { noBake: true, interact: { kind: 'fridge', label: 'Open fridge' }, room: 'kitchen' });
  ctx.house.fridge = fridge;
  place(F.stove('kit-stove'), 1.97, -22.4, PI / 2, { room: 'kitchen' });
  const kettle = place(F.kettle('kit-kettle'), 2.0, -22.25, PI / 2, { dy: 0.98, collide: false, interact: { kind: 'kettle', label: 'Put the kettle on', lure: 'kettle' }, room: 'kitchen' });
  ctx.house.kettle = kettle;
  const toaster = place(D.toaster('kit-toaster'), 6.9, -25.65, 0, { dy: 0.93, collide: false, interact: { kind: 'toaster', label: 'Push the toaster lever' }, room: 'kitchen' });
  ctx.house.toaster = toaster;
  // counter clutter
  const board = new Mesh(roundedBox(0.4, 0.03, 0.26, 0.01, 1), makeMat('WOOD_LIGHT'));
  place(board, 3.9, -25.6, 0.1, { dy: 0.93, collide: false });
  const bread = new Mesh(roundedBox(0.28, 0.13, 0.13, 0.06, 2), makeMat('WOOD_LIGHT'));
  place(bread, 3.9, -25.55, 0.3, { dy: 0.96, collide: false });
  for (let i = 0; i < 3; i++) {
    const jar = new Group();
    const glass = new Mesh(chamferCylinder(0.07, 0.07, 0.2, 12, 0.02, { bottom: true }), makeMat('GLASS', { transparent: true, opacity: 0.55, spec: 0.6 }));
    const candy = new Mesh(chamferCylinder(0.06, 0.06, 0.12, 10, 0.02, { bottom: true }), makeMat(['RED_TOY', 'BUBBLEGUM', 'YELLOW_TOY'][i]));
    candy.position.y = 0.01;
    const lid = new Mesh(chamferCylinder(0.075, 0.075, 0.03, 12, 0.01), makeMat('METAL'));
    lid.position.y = 0.21;
    jar.add(candy, glass, lid);
    place(jar, 6.6 + i * 0.18, -25.75, 0, { dy: 0.93, collide: false });
  }
  const fruitBowl = new Mesh(new SphereGeometry(0.18, 16, 8, 0, PI * 2, PI / 2, PI / 2), makeMat('TANGERINE', { side: 2 }));
  place(fruitBowl, 5.0, -23.0, 0, { dy: 0.86, collide: false });
  loose('apple', 4.95, -23.0, { dy: 0.86, room: 'kitchen' });
  loose('banana', 5.08, -22.95, { dy: 0.86, room: 'kitchen' });
  loose('apple', 5.05, -23.1, { dy: 0.9, room: 'kitchen' });
  place(F.table('kit-table', { w: 1.0, d: 0.8, h: 0.78, turnedLegs: false, color: 'RETRO_MINT' }), 5.0, -23.0, 0, { collide: false });
  ctx.physics.addStaticBox(new Vector3(5.0, Y + 0.74, -23.0), new Vector3(0.5, 0.05, 0.4));
  loose('chair', 4.2, -23.0, { builder: (n) => F.chair(n, 'WOOD_MID', 'CARPET_RED'), rotY: PI / 2, room: 'kitchen' });
  loose('chair', 5.8, -23.0, { builder: (n) => F.chair(n, 'WOOD_MID', 'CARPET_RED'), rotY: -PI / 2, room: 'kitchen' });
  place(D.corkBoard('kit-cork'), 1.64, -24.0, PI / 2, { dy: 1.8, collide: false });
  place(F.wardrobe('kit-pantry', 'FRIDGE'), 2.05, -25.35, PI / 2, { noBake: true, hide: { kind: 'wardrobe', room: 'kitchen' } });
  loose('bottle', 7.3, -25.6, { dy: 0.93, room: 'kitchen' });
  loose('plate', 5.6, -25.55, { dy: 0.93, room: 'kitchen' });
  loose('can', 7.6, -25.5, { dy: 0.93, room: 'kitchen', color: 'KEY_GREEN' });

  // ---------------------------------------------------------------- mudroom
  const washer = place(F.washingMachine('mud-washer'), -3.8, -25.55, 0, { noBake: true, interact: { kind: 'washer', label: 'Turn the dial' }, room: 'mudroom' });
  ctx.house.washer = washer;
  place(F.washingMachine('mud-dryer'), -0.55, -25.55, 0);
  place(D.coatHooks('mud-hooks'), -1.4, -22.1, PI, { dy: 2.1, collide: false });
  place(D.boots('mud-boots'), -1.6, -22.4, PI, { collide: false });
  place(D.umbrellaStand('mud-umbrella'), -2.3, -22.4, 0);
  place(D.hamper('mud-hamper', 'WOOD_LIGHT'), -4.05, -22.6, 0, { noBake: true, hide: { kind: 'hamper', room: 'mudroom' } });
  loose('bucket', -1.0, -24.4, { room: 'mudroom' });
  loose('paintCan', -4.0, -23.8, { room: 'mudroom' });

  // ---------------------------------------------------------------- downstairs bathroom
  const tub = place(D.bathtub('bath0-tub', { color: 'FRIDGE' }), -6.6, -25.5, 0, { noBake: true, hide: { kind: 'tub', room: 'bath0', eyeY: 1.2, eyeFwd: 0, exitFwd: 1.0 } });
  place(D.toilet('bath0-toilet'), -7.55, -22.85, PI / 2);
  place(D.pedestalSink('bath0-sink'), -5.25, -22.4, PI);
  place(D.medicineCabinet('bath0-med'), -5.25, -22.1, PI, { dy: 1.25, collide: false });
  loose('duck', -6.6, -25.4, { dy: 0.62, room: 'bath0' });
  ctx.house.bathTub0 = tub;
}

export { DEG };
