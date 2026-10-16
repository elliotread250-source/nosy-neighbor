// Waypoint graph for the neighbor: generated from the floor plan. Every room
// and outdoor area is a convex "area"; nodes in the same area connect freely;
// areas connect through portals (door pairs, stairs, porch steps, gates, open
// boundaries). A* over the result.
import { Vector3 } from 'three';
import { RAPIER, GROUP, groups } from '../core/Physics.js';
import { WALLS, ROOMS, FLOOR_Y } from '../world/NeighborPlan.js';

// Outdoor areas (y = ground unless noted). Convex rectangles.
export const OUTDOOR = [
  { id: 'porch', x0: -8, x1: 8, z0: -14, z1: -11.2, y: 0.6 },
  { id: 'frontYard', x0: -17, x1: 17, z0: -14.2, z1: -5.9, y: 0, exclude: [[-8.2, 8.2, -14.2, -10.2]] },
  { id: 'street', x0: -56, x1: 56, z0: -5.9, z1: 5.9, y: 0 },
  { id: 'playerYard', x0: -17, x1: 17, z0: 5.9, z1: 34, y: 0, forbidden: true },
  { id: 'eastSide', x0: 8.3, x1: 17, z0: -33.5, z1: -14.3, y: 0 },
  { id: 'westSide', x0: -17, x1: -8.3, z0: -33.5, z1: -14.3, y: 0 },
  { id: 'backYard', x0: -8.3, x1: 8.3, z0: -33.5, z1: -26.1, y: 0 },
  { id: 'backPorch', x0: -3.6, x1: -0.4, z0: -27.8, z1: -26.1, y: 0.6 },
];

export function areaAt(floor, p) {
  for (const r of ROOMS) {
    if (r.floor !== floor) continue;
    if (p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1) return r.id;
  }
  return null;
}

export function outdoorAt(p) {
  for (const a of OUTDOOR) {
    if (p.x <= a.x0 || p.x >= a.x1 || p.z <= a.z0 || p.z >= a.z1) continue;
    if (a.exclude?.some(([x0, x1, z0, z1]) => p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1)) continue;
    return a.id;
  }
  return null;
}

export class NavGraph {
  constructor(physics) {
    this.physics = physics;
    this.nodes = [];
    this.byArea = new Map();
    this.areaInfo = new Map();
    this._build();
  }

  // Can a neighbor-sized capsule stand here?
  fits(p) {
    if (!this.physics) return true;
    const shape = new RAPIER.Capsule(0.55, 0.3);
    const hit = this.physics.world.intersectionWithShape({ x: p.x, y: p.y + 0.95, z: p.z }, { x: 0, y: 0, z: 0, w: 1 }, shape,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS | RAPIER.QueryFilterFlags.EXCLUDE_KINEMATIC, groups(GROUP.NEIGHBOR, GROUP.STATIC));
    return !hit;
  }

  // Clear straight walk between two points? (rays at knee and chest height; doors ignored)
  clear(a, b) {
    if (!this.physics) return true;
    const d = b.clone().sub(a);
    const len = d.length();
    if (len < 1e-3) return true;
    d.divideScalar(len);
    const filter = groups(GROUP.NEIGHBOR, GROUP.STATIC);
    const pred = (c) => { const k = this.physics.colliderData.get(c.handle)?.kind; return k !== 'door'; };
    for (const off of [-0.25, 0.25]) {
      const side = new Vector3(-d.z, 0, d.x).multiplyScalar(off);
      for (const h of [0.45, 1.35]) {
        const o = a.clone().add(side).add(new Vector3(0, h, 0));
        if (this.physics.raycast(o, d, len, null, filter, pred)) return false;
      }
    }
    return true;
  }

  node(pos, area, tags = {}) {
    const n = { id: this.nodes.length, pos: pos.clone(), area, edges: [], ...tags };
    this.nodes.push(n);
    if (!this.byArea.has(area)) this.byArea.set(area, []);
    this.byArea.get(area).push(n);
    return n;
  }

  link(a, b, extra = {}) {
    const cost = (extra.cost ?? a.pos.distanceTo(b.pos)) * (extra.mul ?? 1);
    a.edges.push({ to: b, cost, ...extra });
    b.edges.push({ to: a, cost, ...extra });
  }

  _build() {
    // grids of standable nodes per area (rooms 0.9 m, yards 2.4 m, street 4 m)
    const grid = (area, x0, x1, z0, z1, y, step, accept) => {
      const nx = Math.max(1, Math.round((x1 - x0) / step)), nz = Math.max(1, Math.round((z1 - z0) / step));
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < nz; j++) {
          const p = new Vector3(x0 + (i + 0.5) * (x1 - x0) / nx, y, z0 + (j + 0.5) * (z1 - z0) / nz);
          if (accept && !accept(p)) continue;
          if (!this.fits(p)) continue;
          this.node(p, area, { grid: true });
        }
    };
    for (const r of ROOMS) {
      const id = r.id;
      if (!this.areaInfo.has(id)) this.areaInfo.set(id, { indoor: true, floor: r.floor, room: r });
      grid(id, r.x0 + 0.1, r.x1 - 0.1, r.z0 + 0.1, r.z1 - 0.1, FLOOR_Y[r.floor], 0.9);
    }
    for (const a of OUTDOOR) {
      this.areaInfo.set(a.id, { indoor: false, outdoor: a });
      const step = a.id === 'street' || a.id === 'playerYard' ? 4 : 2.4;
      grid(a.id, a.x0, a.x1, a.z0, a.z1, a.y, step, (p) => outdoorAt(p) === a.id);
    }
    // door portals from the plan
    for (const w of WALLS) {
      for (const o of w.openings || []) {
        if (!o.door || o.fake) continue;
        const along = w.from + Math.sign(w.to - w.from) * o.at;
        const y = FLOOR_Y[w.floor];
        const c = new Vector3(w.axis === 'x' ? along : w.at, y, w.axis === 'x' ? w.at : along);
        const n = w.axis === 'x' ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0);
        const pA = c.clone().addScaledVector(n, 0.75), pB = c.clone().addScaledVector(n, -0.75);
        const corridorDoor = o.id === 'd-green' || o.id === 'd-tomato';
        const areaA = areaAt(w.floor, pA) ?? (w.floor === 'F0' ? outdoorAt(pA) : corridorDoor ? 'corridor' : null);
        const areaB = areaAt(w.floor, pB) ?? (w.floor === 'F0' ? outdoorAt(pB) : corridorDoor ? 'corridor' : null);
        if (!areaA || !areaB) continue;
        pA.y = this.areaY(areaA, y);
        pB.y = this.areaY(areaB, y);
        const a = this.node(pA, areaA, { door: o.id });
        const b = this.node(pB, areaB, { door: o.id });
        this.link(a, b, { door: o.id, type: 'door' });
      }
    }
    this.areaInfo.set('corridor', { indoor: true, floor: 'F2' });
    // stairs
    const stair = (a, pa, b, pb, mul = 1.3) => this.link(this.node(pa, a), this.node(pb, b), { type: 'stairs', mul });
    stair('hall', new Vector3(-0.85, FLOOR_Y.F0, -16.6), 'hall1', new Vector3(-0.85, FLOOR_Y.F1, -22.5));
    this.areaInfo.set('stairLanding2', { indoor: true, floor: 'F1' });
    stair('stair2', new Vector3(-2.75, FLOOR_Y.F1, -24.18), 'stairLanding2', new Vector3(-5.9, FLOOR_Y.F1 + 1.85, -24.2));
    stair('stairLanding2', new Vector3(-5.9, FLOOR_Y.F1 + 1.85, -25.38), 'landing', new Vector3(-2.3, FLOOR_Y.F2, -25.38));
    // outdoor portals
    const portal = (a, pa, b, pb, type = 'walk') => this.link(this.node(pa, a), this.node(pb, b), { type });
    portal('porch', new Vector3(0, 0.6, -11.7), 'frontYard', new Vector3(0, 0, -9.8), 'steps');
    portal('frontYard', new Vector3(10.4, 0, -13.4), 'eastSide', new Vector3(10.4, 0, -15.2), 'gate:g-east');
    portal('frontYard', new Vector3(-10.4, 0, -13.4), 'westSide', new Vector3(-10.4, 0, -15.2), 'gate:g-west');
    portal('eastSide', new Vector3(9.4, 0, -29.5), 'backYard', new Vector3(7.2, 0, -29.5));
    portal('westSide', new Vector3(-9.4, 0, -29.5), 'backYard', new Vector3(-7.2, 0, -29.5));
    portal('backPorch', new Vector3(-2, 0.6, -27.2), 'backYard', new Vector3(-2, 0, -28.6), 'steps');
    for (const x of [-30, -14, 0, 14, 30]) {
      portal('frontYard', new Vector3(Math.max(-16, Math.min(16, x)), 0, -6.6), 'street', new Vector3(x, 0, -4.8));
      portal('street', new Vector3(x, 0, 4.8), 'playerYard', new Vector3(Math.max(-16, Math.min(16, x)), 0, 6.6));
    }
    // connect nodes inside each area when the straight walk is clear
    for (const [, list] of this.byArea) {
      for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i], b = list[j];
          if (Math.abs(a.pos.y - b.pos.y) > 1.2) continue;
          const d = a.pos.distanceTo(b.pos);
          const maxLink = a.grid && b.grid ? (this.areaInfo.get(a.area)?.indoor ? 1.35 : a.area === 'street' || a.area === 'playerYard' ? 5.8 : 3.5) : 2.2;
          if (d > maxLink) continue;
          if (!this.clear(a.pos, b.pos)) continue;
          this.link(a, b, { type: 'walk' });
        }
    }
    // drop isolated grid nodes
    this.nodes = this.nodes.filter((n) => n.edges.length || !n.grid);
    for (const [k, list] of this.byArea) this.byArea.set(k, list.filter((n) => n.edges.length || !n.grid));
  }

  areaY(area, fallback) {
    const a = OUTDOOR.find((o) => o.id === area);
    return a ? a.y : fallback;
  }

  // The area containing a world position (uses height to pick the floor).
  locate(p) {
    const floors = [['TW', FLOOR_Y.TW], ['TR', FLOOR_Y.TR], ['F2', FLOOR_Y.F2], ['F1', FLOOR_Y.F1], ['F0', FLOOR_Y.F0]];
    for (const [f, y] of floors) {
      if (p.y >= y - 0.6) {
        const r = areaAt(f, p);
        if (r) return r;
        if (f === 'F1' && p.x > -7 && p.x < -4.7 && p.z > -26 && p.z < -23.5 && p.y > y + 1) return 'stairLanding2';
        if (f === 'F2' && p.x > 2 && p.x < 5 && Math.abs(p.z + 20) < 0.8) return 'corridor';
        if (f !== 'F0') continue;
      }
    }
    if (p.y < 0.3 || p.y < 2) return outdoorAt(p);
    return null;
  }

  nearestNode(p, area = this.locate(p)) {
    const list = (area && this.byArea.get(area)) || this.nodes;
    let best = null, bd = Infinity, bestClear = null, bdc = Infinity;
    for (const n of list) {
      const d = n.pos.distanceToSquared(p) + Math.abs(n.pos.y - p.y) * 6;
      if (d < bd) { bd = d; best = n; }
    }
    // prefer a nearby node we can walk straight to
    for (const n of list) {
      const d = n.pos.distanceToSquared(p) + Math.abs(n.pos.y - p.y) * 6;
      if (d < bdc && d < bd + 9 && this.clear(new Vector3(p.x, n.pos.y, p.z), n.pos)) { bdc = d; bestClear = n; }
    }
    return bestClear ?? best;
  }

  /**
   * A* from world position to world position. Returns [{pos, edge}] or null.
   * opts: { blocked: (edge) => bool, avoidAreas: Set }
   */
  findPath(from, to, opts = {}) {
    const a = this.nearestNode(from), b = this.nearestNode(to);
    if (!a || !b) return null;
    if (a === b) return [{ pos: to.clone(), node: b }];
    const heap = [];
    const push = (n, f) => {
      heap.push([f, n]);
      let i = heap.length - 1;
      while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
    };
    const pop = () => {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === i) break;
          [heap[m], heap[i]] = [heap[i], heap[m]];
          i = m;
        }
      }
      return top[1];
    };
    const g = new Map([[a, 0]]);
    const came = new Map();
    const closed = new Set();
    push(a, a.pos.distanceTo(b.pos));
    while (heap.length) {
      const cur = pop();
      if (cur === b) break;
      if (closed.has(cur)) continue;
      closed.add(cur);
      for (const e of cur.edges) {
        if (opts.blocked?.(e)) continue;
        if (opts.avoidAreas?.has(e.to.area) && e.to !== b) continue;
        const ng = g.get(cur) + e.cost;
        if (ng < (g.get(e.to) ?? Infinity)) {
          came.set(e.to, { from: cur, edge: e });
          g.set(e.to, ng);
          push(e.to, ng + e.to.pos.distanceTo(b.pos));
        }
      }
    }
    if (!came.has(b)) return null;
    const out = [];
    let n = b;
    while (n !== a) {
      const c = came.get(n);
      out.unshift({ pos: n.pos.clone(), node: n, edge: c.edge, fromNode: c.from });
      n = c.from;
    }
    out.unshift({ pos: a.pos.clone(), node: a });
    out.push({ pos: to.clone(), node: null });
    return out;
  }
}
