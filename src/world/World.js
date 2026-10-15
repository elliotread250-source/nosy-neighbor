// Assembles the whole playable world and exposes its systems.
import { Vector3 } from 'three';
import { buildNeighborhood } from './Neighborhood.js';
import { buildNeighborHouse } from './NeighborHouse.js';
import { buildNeighborYard } from './NeighborYard.js';
import { DoorManager } from './Doors.js';
import { WindowManager } from './Windows.js';
import { buildNeighborInterior } from './NeighborInterior.js';
import { CONFIG } from '../config.js';
import { bakeStatic, bakeDeep } from '../art/Bake.js';

export function buildWorld(scene, physics, lights, zones) {
  const doors = new DoorManager(scene, physics);
  const windows = new WindowManager(scene, physics);
  const street = buildNeighborhood(scene, physics, lights, zones);
  const house = buildNeighborHouse(scene, physics, { doors, windows, lights, zones });
  const yard = buildNeighborYard(scene, physics, { doors });
  const interior = buildNeighborInterior(scene, physics, { doors, windows, lights, zones, house });

  // merge every static exterior piece per material (lights stay as markers)
  lights.addFrom(street.root);
  for (const g of [street.root, house.root, yard.root]) bakeStatic(g, `${g.name}-baked`);

  // register loose physics props after everything static exists
  const props = [];
  for (const { obj, opts } of [...yard.loose, ...interior.loose]) {
    if (obj.isGroup && obj.children.length > 1) bakeDeep(obj, 'prop');
    props.push(physics.addDynamic(obj, opts));
  }
  for (const lp of street.playerHouse.looseProps) {
    lp.obj.position.copy(lp.pos);
    scene.add(lp.obj);
    props.push(physics.addDynamic(lp.obj, { mass: lp.mass, half: lp.half, data: { item: 'box', noise: 0.3, climbable: true } }));
  }

  const updaters = [
    ...street.updaters, ...house.updaters, ...yard.updaters, ...interior.updaters,
    (dt) => doors.update(dt), (dt) => windows.update(dt),
  ];
  // Interior culling: only floors you could plausibly see are drawn.
  const NEAR = { F0: ['F0', 'F1', 'UG'], F1: ['F0', 'F1', 'F2', 'TR'], F2: ['F1', 'F2', 'TR', 'TW'], TR: ['F1', 'F2', 'TR'], TW: ['F2', 'TW'], UG: ['UG', 'F0'] };
  const ALL_ABOVE = ['F0', 'F1', 'F2', 'TR', 'TW'];
  const houseCenter = new Vector3(0, 4, -20);
  function updateCulling(camPos) {
    const z = zones.at(camPos);
    let show;
    if (camPos.y < 0.2 && Math.abs(camPos.x) < 8.5 && camPos.z < -13.8 && camPos.z > -26.5) show = NEAR.UG;
    else if (z && z.house === 'neighbor') show = NEAR[z.room.floor] || ALL_ABOVE;
    else show = camPos.distanceTo(houseCenter) < CONFIG.interior.cullDistance ? ALL_ABOVE : [];
    for (const [k, g] of Object.entries(interior.floors)) g.visible = show.includes(k);
  }
  updaters.push(() => {});

  return {
    street, house, yard, interior, doors, windows, props, updaters, updateCulling,
    spawn: street.spawn, spawnYaw: street.spawnYaw,
    playerHouse: street.playerHouse,
  };
}

export { Vector3 };
