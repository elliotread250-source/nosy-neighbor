// Mint wing landing, the purple room, the tomato-red bolted-on room, and the
// attic tower.
import { Group, Mesh, Vector3 } from 'three';
import { makePlacer } from './common.js';
import * as F from '../props/Furniture.js';
import * as D from '../props/Decor.js';
import { makeMat } from '../../art/Materials.js';
import { roundedBox, chamferCylinder } from '../../art/Geo.js';
import { FLOOR_Y } from '../NeighborPlan.js';

export function furnishTopFloors(ctx) {
  const PI = Math.PI;

  // ---------------------------------------------------------------- mint wing landing
  {
    const { place, loose } = makePlacer(ctx, 'F2');
    // boxes stacked to the ceiling
    let k = 0;
    for (const [x, z] of [[-6.4, -18.7], [-5.6, -18.75], [-6.4, -19.5]]) {
      for (let lvl = 0; lvl < 4; lvl++) {
        const s = 0.75 - lvl * 0.04;
        const b = F.cardboardBox(`land-box${k++}`, s);
        place(b, x + (lvl % 2) * 0.06, z, lvl * 0.2, { dy: lvl * s * 0.8 + s * 0.4, collide: lvl === 0 });
      }
    }
    place(D.dressDummy('land-dummy'), -2.0, -19.0, -0.6);
    const horse = place(D.rockingHorse('land-horse'), -4.4, -19.3, 0.4, { noBake: true });
    ctx.house.rockingHorse = horse;
    for (let i = 0; i < 3; i++) place(D.suitcase(`land-case${i}`), -6.5, -21.6, PI / 2 + i * 0.1, { dy: i * 0.22, collide: i === 0 });
    place(F.wardrobe('land-wardrobe', 'NH_PLANKS_OLD'), -6.5, -22.7, PI / 2, { noBake: true, hide: { kind: 'wardrobe', room: 'landing' } });
    place(D.ceilingBulb('land-bulb'), -4.0, -20.0, 0, { y: FLOOR_Y.F2 + 2.9, collide: false });
    loose('book', -2.4, -20.5, { room: 'landing' });
    loose('smallBox', -3.0, -18.6, { room: 'landing' });
  }

  // ---------------------------------------------------------------- purple room
  {
    const { place, loose } = makePlacer(ctx, 'F2');
    const chairObj = F.chair('purple-chair', 'WOOD_DARK', 'GRAPE');
    place(chairObj, 0.5, -20.9, 0);
    const tv = place(F.tv('purple-tv'), 0.5, -18.75, PI, { noBake: true, interact: { kind: 'tv', label: 'Watch', lure: 'tv', on: true }, room: 'purple' });
    ctx.house.purpleTv = tv;
    const stool = new Group();
    const seat = new Mesh(chamferCylinder(0.2, 0.2, 0.06, 14, 0.02), makeMat('WOOD_MID'));
    seat.position.y = 0.55;
    stool.add(seat);
    for (let i = 0; i < 3; i++) {
      const leg = new Mesh(chamferCylinder(0.025, 0.025, 0.55, 6, 0.01, { bottom: true }), makeMat('WOOD_DARK'));
      const a = (i / 3) * PI * 2;
      leg.position.set(Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13);
      stool.add(leg);
    }
    place(stool, 1.5, -20.6, 0);
    const radio = place(F.radio('purple-radio'), 1.5, -20.6, -0.6, { dy: 0.58, collide: false, interact: { kind: 'radio', label: 'Turn on radio', lure: 'radio' }, room: 'purple' });
    ctx.house.purpleRadio = radio;
    // hook by the door, where the green key hangs
    const hook = new Mesh(chamferCylinder(0.015, 0.015, 0.08, 6, 0.005), makeMat('BRASS'));
    hook.rotation.x = PI / 2;
    place(hook, -0.86, -21.2, 0, { dy: 1.5, collide: false });
    ctx.house.greenKeyHook = new Vector3(-0.8 + makePlacer(ctx, 'F2').shearX(FLOOR_Y.F2 + 1.5), FLOOR_Y.F2 + 1.42, -21.2);
    place(F.cardboardBox('purple-bigbox', 1.1), 1.4, -25.2, 0.2, { noBake: true, dy: 0.44, hide: { kind: 'box', room: 'purple' } });
  }

  // ---------------------------------------------------------------- tomato-red bolted-on room
  {
    const { place, loose } = makePlacer(ctx, 'TR');
    const bench = place(D.workbench('tr-bench'), 7.4, -22.5, 0, { hide: { kind: 'underTable', room: 'tomato' }, collide: false });
    ctx.physics.addStaticBox(new Vector3(7.4 + 0.5, FLOOR_Y.TR + 0.9, -22.5), new Vector3(1.0, 0.06, 0.4));
    ctx.house.workbench = bench;
    const mons = place(D.monitors('tr-monitors'), 8.5, -20.6, -PI / 2, { noBake: true, room: 'tomato', interact: { kind: 'monitors', label: 'Watch the monitors' } });
    ctx.house.monitors = mons;
    place(D.trapBox('tr-traps'), 5.7, -22.4, 0.3);
    place(D.tripod('tr-tripod'), 5.9, -19.7, 0.5, { collide: false });
    place(D.ceilingBulb('tr-bulb'), 7.0, -21.0, 0, { y: FLOOR_Y.TR + 2.1, collide: false });
    loose('paintCan', 6.3, -22.5, { room: 'tomato' });
  }

  // ---------------------------------------------------------------- attic tower
  {
    const { place } = makePlacer(ctx, 'TW');
    const trunk = place(D.trunk('attic-trunk'), -3.5, -22.55, 0, { noBake: true, interact: { kind: 'trunk', label: 'Open the trunk' }, room: 'attic' });
    ctx.house.atticTrunk = trunk;
    place(D.telescope('attic-scope'), -3.5, -20.7, 0, { collide: false });
    place(D.ceilingBulb('attic-bulb'), -3.2, -21.5, 0, { y: FLOOR_Y.TW + 2.7, collide: false });
  }
}

export { roundedBox };
