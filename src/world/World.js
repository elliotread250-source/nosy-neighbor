// Assembles the whole playable world and exposes its systems.
import { Vector3 } from 'three';
import { buildNeighborhood } from './Neighborhood.js';
import { buildNeighborHouse } from './NeighborHouse.js';
import { buildNeighborYard } from './NeighborYard.js';
import { DoorManager } from './Doors.js';
import { WindowManager } from './Windows.js';

export function buildWorld(scene, physics, lights, zones) {
  const doors = new DoorManager(scene, physics);
  const windows = new WindowManager(scene, physics);
  const street = buildNeighborhood(scene, physics, lights, zones);
  const house = buildNeighborHouse(scene, physics, { doors, windows, lights, zones });
  const yard = buildNeighborYard(scene, physics, { doors });

  // register loose physics props after everything static exists
  const props = [];
  for (const { obj, opts } of yard.loose) props.push(physics.addDynamic(obj, opts));
  for (const lp of street.playerHouse.looseProps) {
    lp.obj.position.copy(lp.pos);
    scene.add(lp.obj);
    props.push(physics.addDynamic(lp.obj, { mass: lp.mass, half: lp.half, data: { item: 'box', noise: 0.3, climbable: true } }));
  }

  const updaters = [
    ...street.updaters, ...house.updaters, ...yard.updaters,
    (dt) => doors.update(dt), (dt) => windows.update(dt),
  ];
  return {
    street, house, yard, doors, windows, props, updaters,
    spawn: street.spawn, spawnYaw: street.spawnYaw,
    playerHouse: street.playerHouse,
  };
}

export { Vector3 };
