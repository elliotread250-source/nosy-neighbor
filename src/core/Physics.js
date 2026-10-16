// Rapier world wrapper: fixed 1/60 timestep with render interpolation,
// helpers to make static colliders and dynamic props from meshes.
import RAPIER from '@dimforge/rapier3d-compat';
import { Vector3, Quaternion, Box3, Matrix4 } from 'three';
import { CONFIG } from '../config.js';
import { Events } from './Events.js';

export { RAPIER };

// Collision groups: membership in high 16 bits, filter in low 16 bits.
export const GROUP = {
  STATIC: 1 << 0,
  PROP: 1 << 1,
  PLAYER: 1 << 2,
  NEIGHBOR: 1 << 3,
  TRIGGER: 1 << 4,
};
export function groups(member, filter = 0xffff) {
  return ((member & 0xffff) << 16) | (filter & 0xffff);
}

const _v = new Vector3();
const _q = new Quaternion();
const _s = new Vector3();
const _box = new Box3();
const _m = new Matrix4();

export class Physics {
  static async init() {
    await RAPIER.init();
    return new Physics();
  }

  constructor() {
    this.world = new RAPIER.World({ x: 0, y: CONFIG.physics.gravity, z: 0 });
    this.world.timestep = CONFIG.physics.fixedStep;
    this.accumulator = 0;
    this.alpha = 0;
    this.dynamics = []; // { body, mesh, prevP, prevQ, curP, curQ }
    this.colliderData = new Map(); // collider handle -> user data
    this.eventQueue = new RAPIER.EventQueue(true);
    this.stepCount = 0;
  }

  // Run as many fixed steps as the frame needs. onFixed(dt) runs before each world step.
  step(frameDt, onFixed) {
    const h = CONFIG.physics.fixedStep;
    this.accumulator += frameDt;
    let n = 0;
    while (this.accumulator >= h && n < CONFIG.physics.maxSubSteps) {
      for (const d of this.dynamics) {
        d.prevP.copy(d.curP);
        d.prevQ.copy(d.curQ);
      }
      onFixed?.(h);
      this.world.step(this.eventQueue);
      this.stepCount++;
      this.eventQueue.drainContactForceEvents((ev) => {
        const h1 = ev.collider1(), h2 = ev.collider2();
        Events.emit('contact', {
          a: this.colliderData.get(h1) ?? null, b: this.colliderData.get(h2) ?? null, h1, h2,
          force: ev.totalForceMagnitude(), dir: ev.maxForceDirection(),
        });
      });
      for (const d of this.dynamics) {
        const t = d.body.translation();
        const r = d.body.rotation();
        d.curP.set(t.x, t.y, t.z);
        d.curQ.set(r.x, r.y, r.z, r.w);
      }
      this.accumulator -= h;
      n++;
    }
    if (n === CONFIG.physics.maxSubSteps) this.accumulator = 0; // spiral-of-death guard
    this.alpha = this.accumulator / h;
    this._syncMeshes();
    return n;
  }

  _syncMeshes() {
    const a = this.alpha;
    for (const d of this.dynamics) {
      if (d.body.isSleeping() && d.mesh.userData._synced) continue;
      d.mesh.position.lerpVectors(d.prevP, d.curP, a);
      d.mesh.quaternion.slerpQuaternions(d.prevQ, d.curQ, a);
      d.mesh.userData._synced = d.body.isSleeping();
    }
  }

  // ---------- Static colliders ----------

  addStaticBox(center, half, quat = null, data = null, friction = 0.8) {
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const desc = RAPIER.ColliderDesc.cuboid(half.x, half.y, half.z)
      .setTranslation(center.x, center.y, center.z)
      .setFriction(friction)
      .setCollisionGroups(groups(GROUP.STATIC));
    if (quat) desc.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w });
    const col = this.world.createCollider(desc, body);
    if (data) this.colliderData.set(col.handle, data);
    return col;
  }

  // Oriented box collider from a mesh's local bounding box and world transform.
  // Good enough for warped architecture: the warp is a few cm at most.
  addStaticFromMesh(mesh, data = null) {
    mesh.updateWorldMatrix(true, false);
    const geo = mesh.geometry;
    if (!geo.boundingBox) geo.computeBoundingBox();
    _box.copy(geo.boundingBox);
    mesh.matrixWorld.decompose(_v, _q, _s);
    const c = _box.getCenter(new Vector3()).multiply(_s).applyQuaternion(_q).add(_v);
    const half = _box.getSize(new Vector3()).multiply(_s).multiplyScalar(0.5);
    return this.addStaticBox(c, half, _q.clone(), data ?? mesh.userData.interact ?? null);
  }

  // Exact triangle collider for static, odd-shaped geometry (stairs, ramps, terrain).
  addStaticTrimesh(mesh, data = null) {
    mesh.updateWorldMatrix(true, false);
    const geo = mesh.geometry.index ? mesh.geometry : mesh.geometry;
    const pos = geo.attributes.position;
    const verts = new Float32Array(pos.count * 3);
    _m.copy(mesh.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      _v.fromBufferAttribute(pos, i).applyMatrix4(_m);
      verts[i * 3] = _v.x; verts[i * 3 + 1] = _v.y; verts[i * 3 + 2] = _v.z;
    }
    let idx;
    if (geo.index) idx = new Uint32Array(geo.index.array);
    else {
      idx = new Uint32Array(pos.count);
      for (let i = 0; i < pos.count; i++) idx[i] = i;
    }
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const col = this.world.createCollider(
      RAPIER.ColliderDesc.trimesh(verts, idx).setCollisionGroups(groups(GROUP.STATIC)),
      body,
    );
    if (data) this.colliderData.set(col.handle, data);
    return col;
  }

  // ---------- Dynamic props ----------

  /**
   * Make a mesh (or group) a rigid body. Shape from its bounding box unless given.
   * opts: { shape: 'box'|'ball'|'cylinder'|'hull', mass, friction, restitution, half, radius, data,
   *         linearDamping, angularDamping, ccd }
   */
  addDynamic(obj, opts = {}) {
    obj.updateWorldMatrix(true, true);
    _box.setFromObject(obj, true);
    const worldCenter = _box.getCenter(new Vector3());
    const size = _box.getSize(new Vector3());
    // Body origin = object origin; collider offset to bbox center (in body local space).
    obj.getWorldPosition(_v);
    obj.getWorldQuaternion(_q);
    const local = worldCenter.clone().sub(_v).applyQuaternion(_q.clone().invert());

    const bdesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(_v.x, _v.y, _v.z)
      .setRotation({ x: _q.x, y: _q.y, z: _q.z, w: _q.w })
      .setLinearDamping(opts.linearDamping ?? 0.05)
      .setAngularDamping(opts.angularDamping ?? 0.4)
      .setCanSleep(true)
      .setCcdEnabled(opts.ccd ?? false);
    const body = this.world.createRigidBody(bdesc);

    let cdesc;
    const shape = opts.shape || 'box';
    if (shape === 'ball') cdesc = RAPIER.ColliderDesc.ball(opts.radius ?? Math.max(size.x, size.y, size.z) / 2);
    else if (shape === 'cylinder') cdesc = RAPIER.ColliderDesc.cylinder(size.y / 2, opts.radius ?? Math.max(size.x, size.z) / 2);
    else if (shape === 'hull' && obj.geometry) {
      const pos = obj.geometry.attributes.position;
      const pts = new Float32Array(pos.array.length);
      obj.getWorldScale(_s);
      for (let i = 0; i < pos.count; i++) {
        pts[i * 3] = pos.getX(i) * _s.x; pts[i * 3 + 1] = pos.getY(i) * _s.y; pts[i * 3 + 2] = pos.getZ(i) * _s.z;
      }
      cdesc = RAPIER.ColliderDesc.convexHull(pts) ?? RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2);
    } else {
      // box in the object's own frame: unrotated local bbox gives a tighter fit
      const h = opts.half;
      if (h) cdesc = RAPIER.ColliderDesc.cuboid(h.x, h.y, h.z);
      else if (obj.geometry) {
        if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
        const lb = obj.geometry.boundingBox;
        obj.getWorldScale(_s);
        const ls = lb.getSize(new Vector3()).multiply(_s);
        const lc = lb.getCenter(new Vector3()).multiply(_s);
        cdesc = RAPIER.ColliderDesc.cuboid(ls.x / 2, ls.y / 2, ls.z / 2);
        local.copy(lc);
      } else cdesc = RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2);
    }
    if (shape !== 'hull') cdesc.setTranslation(local.x, local.y, local.z);
    cdesc
      .setFriction(opts.friction ?? 0.7)
      .setRestitution(opts.restitution ?? 0.15)
      .setCollisionGroups(groups(GROUP.PROP))
      .setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
      .setContactForceEventThreshold(opts.impactThreshold ?? 40);
    if (opts.mass) cdesc.setMass(opts.mass);
    const col = this.world.createCollider(cdesc, body);

    // Re-parent to scene root so the body owns the world transform.
    if (obj.parent && obj.parent.type !== 'Scene') {
      const scene = findScene(obj);
      if (scene) scene.attach(obj);
    }
    const entry = {
      body, collider: col, mesh: obj,
      prevP: _v.clone(), curP: _v.clone(), prevQ: _q.clone(), curQ: _q.clone(),
      data: opts.data ?? null,
    };
    this.dynamics.push(entry);
    this.colliderData.set(col.handle, { kind: 'prop', entry, ...(opts.data || {}) });
    obj.userData.physics = entry;
    return entry;
  }

  removeDynamic(entry) {
    const i = this.dynamics.indexOf(entry);
    if (i >= 0) this.dynamics.splice(i, 1);
    this.colliderData.delete(entry.collider.handle);
    this.world.removeRigidBody(entry.body);
  }

  // ---------- Queries ----------

  // Ray from origin along unit dir. Returns { point, normal, toi, collider, data } or null.
  raycast(origin, dir, maxDist, excludeCollider = null, filterGroups = undefined, predicate = undefined) {
    const ray = new RAPIER.Ray(origin, dir);
    const hit = this.world.castRayAndGetNormal(ray, maxDist, true, undefined, filterGroups, excludeCollider ?? undefined, undefined, predicate);
    if (!hit) return null;
    const p = ray.pointAt(hit.timeOfImpact);
    return {
      point: new Vector3(p.x, p.y, p.z),
      normal: new Vector3(hit.normal.x, hit.normal.y, hit.normal.z),
      toi: hit.timeOfImpact,
      collider: hit.collider,
      data: this.colliderData.get(hit.collider.handle) ?? null,
    };
  }

  bodyCount() {
    return this.world.bodies.len();
  }
}

function findScene(o) {
  while (o.parent) o = o.parent;
  return o.type === 'Scene' ? o : null;
}
