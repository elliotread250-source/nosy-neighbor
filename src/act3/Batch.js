// Static batching for the draw-call budget (spec 26): every mesh that never
// moves is baked into world space and merged with the others that share its
// look. Two merged sets are made, one exact (survey) and one with each source
// mesh warped on its own (style, capped at 4 percent), and the mode decides
// which shows. Meshes that move or animate are marked userData.keep.
import { Mesh, Group, Matrix4 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Float32BufferAttribute } from 'three';
import { look, colorOf, NEUTRAL } from './Look.js';
import { warpProp } from './StyleWarp.js';

function kept(o) {
  for (let p = o; p; p = p.parent) if (p.userData?.keep) return true;
  return false;
}

export function batchStatic(scene, roots, { warpRoots = [] } = {}) {
  const buckets = new Map();
  const sources = [];
  const warpSet = new Set(warpRoots);
  for (const root of roots) {
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || kept(o) || !o.userData.look || !o.visible) return;
      if (o.material?.transparent && o.userData.lookOpts?.opacity === undefined) return;
      const opts = o.userData.lookOpts ?? {};
      const styleOnly = !!o.userData.styleOnly || (o.parent && o.parent.userData.styleOnly);
      // plain opaque surfaces share one vertex-colored bucket; emissive and
      // see-through ones keep their own material
      const plain = !opts.emissive && (opts.opacity ?? 1) >= 1 && !opts.vertexColors;
      const key = plain ? JSON.stringify(['plain', styleOnly, o.castShadow]) : JSON.stringify([o.userData.look, opts.emissive ?? '', opts.opacity ?? 1, styleOnly, o.castShadow, !!opts.vertexColors]);
      if (!buckets.has(key)) buckets.set(key, { look: o.userData.look, opts, plain, styleOnly, cast: o.castShadow, survey: [], style: [] });
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && !(k === 'color' && opts.vertexColors)) g.deleteAttribute(k);
      // style copy: warp the whole prop the same way, in its own frame (the
      // direct child of a warp root), so its parts stay together
      let prop = null;
      for (let p = o; p && p.parent; p = p.parent) if (warpSet.has(p.parent)) { prop = p; break; }
      const sg = g.clone();
      if (prop) {
        if (!prop.userData.warpBox) {
          const inv = new Matrix4().copy(prop.matrixWorld).invert();
          const bb = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
          prop.traverse((c) => {
            if (!c.isMesh) return;
            const a = c.geometry.attributes.position, mm = new Matrix4().multiplyMatrices(inv, c.matrixWorld);
            const v = { x: 0, y: 0, z: 0 };
            for (let i = 0; i < a.count; i++) {
              const x = a.getX(i), y = a.getY(i), z = a.getZ(i), e = mm.elements;
              v.x = e[0] * x + e[4] * y + e[8] * z + e[12]; v.y = e[1] * x + e[5] * y + e[9] * z + e[13]; v.z = e[2] * x + e[6] * y + e[10] * z + e[14];
              bb.min[0] = Math.min(bb.min[0], v.x); bb.min[1] = Math.min(bb.min[1], v.y); bb.min[2] = Math.min(bb.min[2], v.z);
              bb.max[0] = Math.max(bb.max[0], v.x); bb.max[1] = Math.max(bb.max[1], v.y); bb.max[2] = Math.max(bb.max[2], v.z);
            }
          });
          prop.userData.warpBox = bb;
        }
        // into the prop's frame, warp, back to the mesh's frame
        const toProp = new Matrix4().multiplyMatrices(new Matrix4().copy(prop.matrixWorld).invert(), o.matrixWorld);
        sg.applyMatrix4(toProp);
        sg.attributes.position.array.set(warpProp(sg.attributes.position.array, (prop.id * 2654435761) >>> 0, undefined, prop.userData.warpBox));
        sg.applyMatrix4(new Matrix4().copy(toProp).invert());
      }
      const m = new Matrix4().copy(o.matrixWorld);
      g.applyMatrix4(m);
      sg.applyMatrix4(m);
      const b = buckets.get(key);
      if (b.plain) {
        // survey gets the color pulled to neutral, style the full palette color
        const full = colorOf(o.userData.look), muted = full.clone().lerp(NEUTRAL, 0.6);
        for (const [geo, c] of [[g, muted], [sg, full]]) {
          const col = new Float32Array(geo.attributes.position.count * 3);
          for (let i = 0; i < col.length; i += 3) col.set([c.r, c.g, c.b], i);
          geo.setAttribute('color', new Float32BufferAttribute(col, 3));
        }
      }
      b.survey.push(g);
      b.style.push(sg);
      sources.push(o);
    });
  }
  for (const o of sources) o.parent?.remove(o);
  const out = new Group();
  out.name = 'act3-batched';
  for (const b of buckets.values()) {
    for (const mode of ['survey', 'style']) {
      if (mode === 'survey' && b.styleOnly) continue;
      const mesh = new Mesh(mergeGeometries(b[mode]));
      if (b.plain) look(mesh, '#ffffff', { vertexColors: true, keep: true });
      else look(mesh, b.look, b.opts);
      mesh.castShadow = b.cast;
      mesh.receiveShadow = true;
      if (mode === 'survey') mesh.userData.surveyOnly = true;
      else mesh.userData.styleOnly = true;
      mesh.visible = mode === 'survey';
      out.add(mesh);
    }
  }
  scene.add(out);
  return { group: out, merged: sources.length, meshes: out.children.length };
}
