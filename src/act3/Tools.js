// In-game scale tools (spec section 8):
//   R  ruler: click two points in the world, read the distance in meters
//   H  height gauge: a figure exactly the configured player height, standing
//      wherever you look, with 10 cm ticks and the eye line
//   G  grid overlay: 1 m grid on floors and walls (10 cm minor lines)
//   F7 freecam: noclip camera; [ and ] change its speed
import {
  Group, Mesh, SphereGeometry, CylinderGeometry, MeshBasicMaterial, BufferGeometry, Line, LineBasicMaterial,
  Float32BufferAttribute, Raycaster, Vector2, Vector3, RingGeometry, BoxGeometry,
} from 'three';
import { PLAYER } from './assumptions.js';

const CENTER = new Vector2(0, 0);

export class Tools {
  constructor(app) {
    this.app = app;
    this.scene = app.engine.scene;
    this.camera = app.engine.camera;
    this.ray = new Raycaster();
    this.mode = null; // 'ruler'
    this.points = [];
    this.root = new Group();
    this.root.name = 'tools';
    this.scene.add(this.root);
    this._buildRuler();
    this._buildGauge();
    this.label = document.createElement('div');
    this.label.className = 'a3-measure';
    document.body.appendChild(this.label);
  }

  // what the crosshair points at
  pick() {
    this.ray.setFromCamera(CENTER, this.camera);
    this.ray.far = 80;
    const hits = this.ray.intersectObjects(this.app.house.meshes, false);
    return hits[0] ?? null;
  }

  // ------------------------------------------------------------ ruler
  _buildRuler() {
    const dot = new MeshBasicMaterial({ color: 0xff3366, depthTest: false });
    this.markers = [0, 1].map(() => {
      const m = new Mesh(new SphereGeometry(0.025, 12, 8), dot);
      m.renderOrder = 999;
      m.visible = false;
      this.root.add(m);
      return m;
    });
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(6), 3));
    this.line = new Line(g, new LineBasicMaterial({ color: 0xff3366, depthTest: false }));
    this.line.renderOrder = 999;
    this.line.visible = false;
    this.root.add(this.line);
  }

  toggleRuler() {
    this.mode = this.mode === 'ruler' ? null : 'ruler';
    this.points = [];
    this.markers.forEach((m) => { m.visible = false; });
    this.line.visible = false;
    this.app.hint(this.mode ? 'Ruler: click two points (R to close)' : 'Ruler off');
  }

  clickRuler() {
    const hit = this.pick();
    if (!hit) return;
    if (this.points.length >= 2) this.points = [];
    this.points.push(hit.point.clone());
    const i = this.points.length - 1;
    this.markers[i].position.copy(hit.point);
    this.markers[i].visible = true;
    if (i === 0) { this.markers[1].visible = false; this.line.visible = false; }
    if (this.points.length === 2) {
      const [a, b] = this.points;
      const pos = this.line.geometry.attributes.position;
      pos.setXYZ(0, a.x, a.y, a.z);
      pos.setXYZ(1, b.x, b.y, b.z);
      pos.needsUpdate = true;
      this.line.geometry.computeBoundingSphere();
      this.line.visible = true;
      this.last = { a, b, d: a.distanceTo(b), dx: Math.abs(b.x - a.x), dy: Math.abs(b.y - a.y), dz: Math.abs(b.z - a.z) };
    }
  }

  // ------------------------------------------------------------ height gauge
  _buildGauge() {
    const g = new Group();
    const h = PLAYER.height, r = PLAYER.capsuleRadius;
    const body = new Mesh(new CylinderGeometry(r, r, h, 20, 1, true), new MeshBasicMaterial({ color: 0x33aaff, transparent: true, opacity: 0.28, depthWrite: false }));
    body.position.y = h / 2;
    g.add(body);
    const tick = new MeshBasicMaterial({ color: 0x113355 });
    for (let i = 1; i * 0.1 < h + 1e-6; i++) {
      const t = new Mesh(new BoxGeometry(i % 5 === 0 ? 0.16 : 0.08, 0.006, 0.006), tick);
      t.position.set(r + 0.02, i * 0.1, 0);
      g.add(t);
    }
    const pole = new Mesh(new BoxGeometry(0.01, h, 0.01), tick);
    pole.position.set(r + 0.02, h / 2, 0);
    g.add(pole);
    const eye = new Mesh(new RingGeometry(r * 0.98, r * 1.05, 24), new MeshBasicMaterial({ color: 0xffcc00, side: 2 }));
    eye.rotation.x = -Math.PI / 2;
    eye.position.y = PLAYER.eyeHeight;
    g.add(eye);
    const top = new Mesh(new RingGeometry(r * 0.98, r * 1.05, 24), new MeshBasicMaterial({ color: 0xff3366, side: 2 }));
    top.rotation.x = -Math.PI / 2;
    top.position.y = h;
    g.add(top);
    g.visible = false;
    this.gauge = g;
    this.root.add(g);
  }

  toggleGauge() {
    this.gauge.visible = !this.gauge.visible;
    this.app.hint(this.gauge.visible ? `Height gauge: ${PLAYER.height.toFixed(2)} m player, eye ${PLAYER.eyeHeight.toFixed(2)} m (H to hide)` : 'Height gauge off');
  }

  // ------------------------------------------------------------ per frame
  update() {
    if (this.gauge.visible) {
      const hit = this.pick();
      if (hit) {
        // stand on the floor below the hit point, a little out from walls
        const p = hit.point.clone();
        if (hit.face && Math.abs(hit.face.normal.y) < 0.5) p.addScaledVector(hit.face.normal, 0.3);
        const down = new Raycaster(p.clone().add(new Vector3(0, 0.05, 0)), new Vector3(0, -1, 0), 0, 20);
        const fh = down.intersectObjects(this.app.house.meshes, false)[0];
        if (fh) this.gauge.position.copy(fh.point);
        const c = this.camera.position;
        this.gauge.rotation.y = Math.atan2(c.x - this.gauge.position.x, c.z - this.gauge.position.z) + Math.PI / 2;
      }
    }
    // ruler label, pinned near the middle of the line
    if (this.mode === 'ruler' && this.last && this.points.length === 2) {
      const mid = this.last.a.clone().add(this.last.b).multiplyScalar(0.5).project(this.camera);
      const vis = mid.z < 1;
      this.label.style.display = vis ? 'block' : 'none';
      this.label.style.left = `${((mid.x + 1) / 2) * innerWidth}px`;
      this.label.style.top = `${((1 - mid.y) / 2) * innerHeight}px`;
      const L = this.last;
      this.label.innerHTML = `<b>${L.d.toFixed(3)} m</b> ±0.002<br><small>dx ${L.dx.toFixed(3)}  dy ${L.dy.toFixed(3)}  dz ${L.dz.toFixed(3)}</small>`;
    } else this.label.style.display = 'none';
  }
}
