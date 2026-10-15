// Named axis-aligned zones (rooms, houses, yards). Used for the indoor
// lighting crossfade, room culling, and the neighbor brain's room tracking.
import { Vector3, Box3 } from 'three';

export class Zones {
  constructor() {
    this.list = [];
  }

  add(name, min, max, opts = {}) {
    const z = { name, box: new Box3(min.clone(), max.clone()), indoor: !!opts.indoor, group: opts.group ?? null, ...opts };
    this.list.push(z);
    return z;
  }

  // Smallest zone containing p (rooms win over whole-house zones).
  at(p) {
    let best = null, bestVol = Infinity;
    for (const z of this.list) {
      if (!z.box.containsPoint(p)) continue;
      const s = z.box.getSize(_s);
      const v = s.x * s.y * s.z;
      if (v < bestVol) { best = z; bestVol = v; }
    }
    return best;
  }

  isIndoor(p) {
    for (const z of this.list) if (z.indoor && z.box.containsPoint(p)) return true;
    return false;
  }

  byName(name) {
    return this.list.find((z) => z.name === name);
  }
}

const _s = new Vector3();
