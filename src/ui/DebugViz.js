// Debug visualizers (?debug=1): F4 nav graph + current path, F5 vision cone +
// detection meter, F6 freeze the neighbor.
import {
  Group, LineSegments, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, Mesh, ConeGeometry, MeshBasicMaterial,
  DoubleSide, Line,
} from 'three';
import { Events } from '../core/Events.js';
import { CONFIG } from '../config.js';

export class DebugViz {
  constructor(game) {
    this.game = game;
    this.group = new Group();
    this.group.name = 'debugViz';
    game.engine.scene.add(this.group);
    this.showNav = false;
    this.showVision = false;
    Events.on('debug:nav', () => { this.showNav = !this.showNav; this._buildNav(); });
    Events.on('debug:vision', () => { this.showVision = !this.showVision; });
    Events.on('debug:freezeAI', () => { if (game.ai) game.ai.frozen = !game.ai.frozen; });
    Events.on('debug:dumpBrain', () => console.log('brain', JSON.parse(JSON.stringify(game.brain?.counters ?? {}))));
    this.pathLine = new Line(new BufferGeometry(), new LineBasicMaterial({ color: 0xff3b3b, depthTest: false }));
    this.pathLine.renderOrder = 999;
    this.group.add(this.pathLine);
    const coneLen = 14;
    const cg = new ConeGeometry(Math.tan((CONFIG.ai.fov / 2) * Math.PI / 180) * coneLen, coneLen, 24, 1, true);
    cg.translate(0, -coneLen / 2, 0);
    cg.rotateX(-Math.PI / 2);
    this.cone = new Mesh(cg, new MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.12, side: DoubleSide, depthWrite: false }));
    this.group.add(this.cone);
  }

  _buildNav() {
    if (this.navLines) { this.group.remove(this.navLines); this.navLines = null; }
    const nav = this.game.nav;
    if (!this.showNav || !nav) return;
    const pts = [];
    for (const n of nav.nodes) for (const e of n.edges) if (e.to.id > n.id) pts.push(n.pos.x, n.pos.y + 0.15, n.pos.z, e.to.pos.x, e.to.pos.y + 0.15, e.to.pos.z);
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pts, 3));
    this.navLines = new LineSegments(g, new LineBasicMaterial({ color: 0x27ae60, depthTest: false, transparent: true, opacity: 0.6 }));
    this.navLines.renderOrder = 998;
    this.group.add(this.navLines);
  }

  update() {
    const ai = this.game.ai;
    this.pathLine.visible = this.showNav && !!ai?.path;
    if (this.pathLine.visible) {
      const pts = [];
      for (const p of ai.path) pts.push(p.pos.x, p.pos.y + 0.3, p.pos.z);
      this.pathLine.geometry.setAttribute('position', new Float32BufferAttribute(pts, 3));
    }
    this.cone.visible = this.showVision && !!ai;
    if (this.cone.visible) {
      ai.eyePos(this.cone.position);
      this.cone.rotation.set(0, ai.headYaw(), 0);
      this.cone.material.color.setRGB(1, 1 - ai.meter, 0.2);
      this.cone.material.opacity = 0.08 + ai.meter * 0.2;
    }
  }
}
