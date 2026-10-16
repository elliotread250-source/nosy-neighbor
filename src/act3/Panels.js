// The working panels (spec 8, 27.1): the F10 audit table, compare mode (K)
// and the navigation graph debug view (N). Plain, dense, monospace.
import { Mesh, BoxGeometry, MeshBasicMaterial, Group, BufferGeometry, Float32BufferAttribute, LineSegments, LineBasicMaterial } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { roomEdges } from './Walls.js';
import { navGraph } from './Nav.js';
import { auditText } from './Audit.js';
import posesData from '../../data/act3/poses.json';

const pct = (v) => `${v.toFixed(1)}%`;
const m = (v) => v.toFixed(1);
const POSE_KEY = 'act3-poses-v1';

export class Panels {
  constructor(app) {
    this.app = app;
    this.el = document.createElement('div');
    this.el.className = 'a3-auditui';
    document.getElementById('hud').appendChild(this.el);
    this.cmp = document.createElement('div');
    this.cmp.className = 'a3-compare';
    document.getElementById('hud').appendChild(this.cmp);
    this.overlay = document.createElement('img');
    this.overlay.className = 'a3-overlay';
    document.body.appendChild(this.overlay);
    this.highlight = new Group();
    app.engine.scene.add(this.highlight);
    this.poses = this._loadPoses();
  }

  // ------------------------------------------------------------ F10 audit
  toggleAudit(on = !this.el.classList.contains('show')) {
    this.el.classList.toggle('show', on);
    if (on) { this._renderAudit(); this.app.input.exitLock(); }
  }

  _renderAudit() {
    const a = this.app.audit;
    const row = (cls, name, w, ar, c, data = '') => `<tr class="${cls}" ${data}><td>${name}</td>` +
      `<td>${m(w.total * w.measured / 100)}</td><td>${pct(w.measured)}</td><td>${m(w.total * w.documented / 100)}</td><td>${pct(w.documented)}</td><td>${m(w.total * w.assumed / 100)}</td><td>${pct(w.assumed)}</td>` +
      `<td>${m(ar.total * ar.measured / 100)}</td><td>${m(ar.total * ar.documented / 100)}</td><td>${m(ar.total * ar.assumed / 100)}</td><td>${c}</td></tr>`;
    let rows = '';
    for (const f of a.floors) {
      rows += row('floor', `${f.id} ${f.label ?? ''}`, f.wallPct, f.areaPct, f.conflicts);
      for (const r of f.rooms) rows += row('room', `&nbsp;&nbsp;${r.label ?? r.id}`, r.wallPct, r.areaPct, r.conflicts, `data-floor="${f.id}" data-room="${r.id}" title="Fly there and show its assumed walls"`);
    }
    const t = a.totals;
    rows += row('total', 'TOTAL', t.wall, t.area, a.conflicts);
    const top = a.top20.map((x, i) => `<li><b>${x.path.replace('house.', '')}</b> = ${Number(x.value).toFixed(3)} m <span class="tag">[${x.tag}${x.rule ? `: ${x.rule}` : ''}]</span><br><span class="shot">shot: ${x.suggest}</span></li>`).join('');
    const zero = a.overallMeasured === 0;
    this.el.innerHTML = `
      <div class="head"><b>AUDIT</b> rev ${a.revision} · schema ${a.schemaVersion} · ${a.measuredCount} measurement(s)${a.lastImport ? ` · last import ${a.lastImport.slice(0, 10)}` : ''} <button data-x="text">copy as text</button> <button data-x="close">close (F10)</button></div>
      <div class="bar"><div style="width:${Math.max(0.5, a.overallMeasured)}%"></div><span class="${zero ? 'zero' : ''}">${a.overallMeasured.toFixed(1)} percent measured${zero ? ': a plausible stand-in, not a reconstruction' : ''}</span></div>
      <div class="notes">openings: ${a.totals.openings.measured.toFixed(0)}% measured, ${a.totals.openings.documented.toFixed(0)}% documented, ${a.totals.openings.assumed.toFixed(0)}% assumed (${a.totals.openings.total} openings) · tags in use: ${Object.entries(a.census).map(([k, v]) => `${k} ${v}`).join(', ')}</div>
      <table><thead><tr><th rowspan="2">floor / room</th><th colspan="6">wall length (m, %)</th><th colspan="3">floor area (m²)</th><th rowspan="2">conflicts</th></tr>
      <tr><th>meas</th><th></th><th>doc</th><th></th><th>asm</th><th></th><th>meas</th><th>doc</th><th>asm</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="notes">Tags: measured (green), documented (amber), assumed (red, includes standard and design). ${a.notes.join(' ')} Ledge forgiveness ${a.ledgeForgiveness} m.</div>
      <h3>Top 20 assumed dimensions to replace</h3><ol>${top}</ol>`;
    this.el.querySelectorAll('tr.room').forEach((tr) => tr.addEventListener('click', () => this.flyTo(tr.dataset.floor, tr.dataset.room)));
    this.el.querySelector('[data-x=close]').onclick = () => this.toggleAudit(false);
    this.el.querySelector('[data-x=text]').onclick = () => navigator.clipboard?.writeText(auditText(a));
  }

  // fly the freecam into a room and outline its assumed walls in red
  flyTo(floorId, roomId) {
    const A = this.app;
    const f = A.spec.floors.find((x) => x.id === floorId);
    const r = f.rooms.find((x) => x.id === roomId);
    const xs = r.polygon.map((p) => p[0]), zs = r.polygon.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const pf = A.plan.floors.find((x) => x.id === floorId);
    const y = pf.floorSlab.y1;
    A.pose(x0 + 0.4, y + 2.4, z0 + 0.4, -135, -25);
    this.highlight.clear();
    const auditRoom = A.audit.floors.find((x) => x.id === floorId)?.rooms.find((x) => x.id === roomId);
    const geos = [];
    for (const e of roomEdges(r)) {
      if (!auditRoom?.assumedWalls.includes(e.index)) continue;
      const ax = Math.min(e.a[0], e.b[0]), bx = Math.max(e.a[0], e.b[0]), az = Math.min(e.a[1], e.b[1]), bz = Math.max(e.a[1], e.b[1]);
      const g = new BoxGeometry(Math.max(0.2, bx - ax), 0.12, Math.max(0.2, bz - az));
      g.translate((ax + bx) / 2, y + 0.06, (az + bz) / 2);
      geos.push(g);
      const g2 = g.clone(); g2.translate(0, 3.0, 0); geos.push(g2);
    }
    if (geos.length) {
      const mesh = new Mesh(mergeGeometries(geos), new MeshBasicMaterial({ color: '#ff2a2a', transparent: true, opacity: 0.75, depthTest: false }));
      mesh.renderOrder = 998;
      this.highlight.add(mesh);
    }
    A.hint(`${r.label ?? r.id}: ${auditRoom?.assumedWalls.length ?? 0} assumed wall(s) outlined in red`, 5);
    clearTimeout(this._hl);
    this._hl = setTimeout(() => this.highlight.clear(), 9000);
  }

  // ------------------------------------------------------------ compare mode
  _loadPoses() {
    let local = [];
    try { local = JSON.parse(localStorage.getItem(POSE_KEY) || '[]'); } catch { local = []; }
    return [...(posesData.poses || []), ...local];
  }

  toggleCompare(on = !this.cmp.classList.contains('show')) {
    this.cmp.classList.toggle('show', on);
    this.overlay.classList.toggle('show', on && !!this.overlay.src);
    if (on) { this._renderCompare(); this.app.input.exitLock(); }
  }

  _renderCompare() {
    const list = this.poses.map((p, i) => `<li><button data-i="${i}">${p.name}</button> <span>${p.image ?? ''}</span></li>`).join('');
    this.cmp.innerHTML = `<div class="head"><b>COMPARE</b> <button data-x="close">close (K)</button></div>
      <ol>${list}</ol>
      <button data-x="save">Save the current camera pose</button> <button data-x="dl">Download poses.json</button>
      <label>Reference screenshot (stays on your machine) <input type="file" accept="image/*" data-x="img"></label>
      <label>Overlay opacity <input type="range" min="0" max="1" step="0.05" value="${this.opacity ?? 0.5}" data-x="op"></label>
      <button data-x="flip">Flip render / screenshot</button>
      <div class="muted">Pick a pose, load its screenshot, slide the opacity. Poses live in data/act3/poses.json.</div>`;
    this.cmp.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => this.goPose(this.poses[+b.dataset.i])));
    this.cmp.querySelector('[data-x=close]').onclick = () => this.toggleCompare(false);
    this.cmp.querySelector('[data-x=save]').onclick = () => this.savePose();
    this.cmp.querySelector('[data-x=dl]').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify({ schemaVersion: 1, poses: this.poses }, null, 1)], { type: 'application/json' }));
      a.download = 'poses.json';
      a.click();
    };
    this.cmp.querySelector('[data-x=img]').onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      this.overlay.src = URL.createObjectURL(f);
      this.overlay.classList.add('show');
      this.overlay.style.opacity = this.opacity ?? 0.5;
    };
    this.cmp.querySelector('[data-x=op]').oninput = (e) => { this.opacity = +e.target.value; this.overlay.style.opacity = this.opacity; };
    this.cmp.querySelector('[data-x=flip]').onclick = () => { this.flipped = !this.flipped; this.overlay.style.opacity = this.flipped ? 1 : this.opacity ?? 0.5; };
  }

  goPose(p) {
    const A = this.app;
    A.pose(p.pose.x, p.pose.y, p.pose.z, p.pose.yaw, p.pose.pitch);
    if (p.pose.fov) { A.engine.camera.fov = p.pose.fov; A.engine.camera.updateProjectionMatrix(); }
    A.hint(`Pose: ${p.name}${p.image ? ` (compare with ${p.image})` : ''}`);
  }

  savePose() {
    const A = this.app, c = A.engine.camera.position;
    const name = prompt('Name this pose (and the screenshot it matches):', `pose-${this.poses.length + 1}`);
    if (!name) return;
    const p = { name, image: `reference/${name}.png`, pose: { x: +c.x.toFixed(3), y: +c.y.toFixed(3), z: +c.z.toFixed(3), yaw: +((A.player.yaw * 180) / Math.PI).toFixed(2), pitch: +((A.player.pitch * 180) / Math.PI).toFixed(2), fov: A.engine.camera.fov }, tag: 'design' };
    this.poses.push(p);
    try { localStorage.setItem(POSE_KEY, JSON.stringify(this.poses.slice((posesData.poses || []).length))); } catch { /* blocked */ }
    this._renderCompare();
  }

  // ------------------------------------------------------------ nav graph view
  toggleNav() {
    const A = this.app;
    if (this.navLines) { A.engine.scene.remove(this.navLines); this.navLines = null; A.hint('Nav graph off'); return; }
    const g = navGraph(A.spec, A.plan);
    const pos = (id) => {
      const n = g.nodes.get(id);
      if (id === 'yard') return [2, 0.3, -3];
      if (id === 'terrace') return [7, 7.7, 10];
      if (id === 'roof') return [9, 11.6, 5.5];
      if (id === 'windmill') return [7, 14.6, 5.5];
      return [n.x, (n.y ?? 0) + 0.3, n.z];
    };
    const P = [], C = [];
    const col = { door: [0.2, 0.9, 0.3], open: [0.2, 0.9, 0.3], stair: [0.2, 0.5, 1], ladder: [1, 0.8, 0.1], 'jump route': [1, 0.2, 0.8], 'sealed door': [1, 0.2, 0.2], 'window climb': [0.3, 0.9, 0.9], crawl: [0.9, 0.5, 0.1] };
    for (const e of g.edges) { P.push(...pos(e.a), ...pos(e.b)); const c = col[e.kind] ?? [1, 1, 1]; C.push(...c, ...c); }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(P, 3));
    geo.setAttribute('color', new Float32BufferAttribute(C, 3));
    this.navLines = new LineSegments(geo, new LineBasicMaterial({ vertexColors: true, depthTest: false }));
    this.navLines.renderOrder = 997;
    A.engine.scene.add(this.navLines);
    A.hint(`Nav graph: ${g.nodes.size} nodes, ${g.edges.length} edges (green doors, blue stairs, yellow ladders, pink the jump route, red sealed)`, 5);
  }
}
