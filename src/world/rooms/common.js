// Shared helpers for furnishing rooms.
import { Vector3 } from 'three';
import { FLOOR_Y, CHUNK_SHEAR } from '../NeighborPlan.js';
import { placeStatic } from '../props/Furniture.js';
import { CLUTTER } from '../props/Clutter.js';
import { CONFIG } from '../../config.js';
import { bakeDeep } from '../../art/Bake.js';

const DEG = Math.PI / 180;

export function makePlacer(ctx, floor) {
  const group = ctx.floors[floor];
  const baseY = FLOOR_Y[floor];
  const sh = CHUNK_SHEAR[floor];
  const shearX = (y) => (sh && sh[1] === 'x' ? Math.tan(sh[0] * DEG * CONFIG.world.warpIntensity) * (y - sh[2]) : 0);

  /**
   * place(obj, x, z, rotY, opts)
   * opts: { y (absolute) | dy (above floor), collide=true, noBake, hide: {kind, room, eye?}, interact: {...},
   *         room, data (collider data) }
   */
  function place(obj, x, z, rotY = 0, opts = {}) {
    const y = opts.y ?? baseY + (opts.dy ?? 0);
    obj.position.set(x + shearX(y), y, z);
    obj.rotation.y = rotY;
    if (opts.noBake) obj.userData.noBake = true;
    group.add(obj);
    let col = null;
    if (opts.collide !== false) col = placeStatic(ctx.physics, obj, opts.interact ? { kind: 'interact', target: opts.interact, obj } : opts.data ?? null, opts.shrink ?? 0.02);
    if (opts.interact) {
      opts.interact.obj = obj;
      opts.interact.room = opts.room ?? null;
      opts.interact.collider = col;
      obj.userData.noBake = true;
      ctx.interactables.push(opts.interact);
    }
    if (opts.hide) registerHide(obj, rotY, opts.hide, y);
    if (obj.userData.update) ctx.updaters.push(obj.userData.update);
    // objects kept out of the floor bake still get their static parts merged locally
    if (obj.userData.noBake && obj.children.length > 1) bakeDeep(obj, `${obj.name || 'obj'}-local`);
    return obj;
  }

  function registerHide(obj, rotY, h, y) {
    const fwd = new Vector3(Math.sin(rotY), 0, Math.cos(rotY));
    const p = obj.position.clone();
    const spot = {
      id: `${h.room}-${h.kind}-${ctx.hideSpots.length}`,
      kind: h.kind, room: h.room, obj, floorY: y, yaw: rotY,
      // where the player's eye sits while hidden, and where they pop out
      eye: p.clone().add(new Vector3(0, h.eyeY ?? (h.kind === 'underBed' || h.kind === 'underTable' ? 0.32 : h.kind === 'behind' ? 0.75 : h.kind === 'hamper' || h.kind === 'box' || h.kind === 'trunk' ? 0.85 : 1.55), 0))
        .addScaledVector(fwd, h.eyeFwd ?? (h.kind === 'behind' ? -0.85 : 0)),
      exit: p.clone().addScaledVector(fwd, h.exitFwd ?? (h.kind === 'behind' ? -1.2 : 1.0)).setY(y),
      // where the neighbor stands to check it
      checkFrom: p.clone().addScaledVector(fwd, h.kind === 'behind' ? -1.1 : 1.1).setY(y),
      look: fwd.clone(),
    };
    if (h.kind === 'behind') spot.look.negate();
    ctx.hideSpots.push(spot);
    obj.userData.hideSpot = spot;
    return spot;
  }

  // Loose physics clutter, registered with the world after all statics exist.
  function loose(kind, x, z, opts = {}) {
    const name = `${floor}-${kind}-${x.toFixed(2)}-${z.toFixed(2)}`;
    const { obj, phys } = opts.builder ? CLUTTER.chair(name, opts.builder) : CLUTTER[kind](name, opts.color);
    const y = opts.y ?? baseY + (opts.dy ?? 0);
    obj.position.set(x + shearX(y), y + (opts.lift ?? 0.06), z);
    obj.rotation.set(opts.rx ?? 0, opts.rotY ?? Math.random() * Math.PI * 2, opts.rz ?? 0);
    obj.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    obj.userData.noBake = true;
    group.add(obj);
    if (phys.data) phys.data.room = opts.room ?? null;
    if (opts.data) Object.assign(phys.data, opts.data);
    ctx.loose.push({ obj, opts: phys });
    return obj;
  }

  return { place, loose, registerHide, baseY, group, shearX };
}

export { DEG };
