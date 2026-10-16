// Top-down floor plans as SVG (spec 8): every floor, rooms colored by tag
// (green measured, amber documented, red assumed, each with a text label and
// a hatch so color is never the only signal), walls, openings, stairs, and
// dimension lines in meters. Pure string building, so it runs in Node and
// the round-trip test can parse it back.
import { bucketOf, val } from './Spec.js';
import { polygonArea } from './Slabs.js';

const COLORS = { measured: '#3fa66b', documented: '#e0a030', assumed: '#d0473a' };
const LABEL = { measured: 'MEASURED', documented: 'DOCUMENTED', assumed: 'ASSUMED' };
const f3 = (n) => (Math.round(n * 1000) / 1000).toFixed(3);

export function floorplanSVG(spec, plan, floorId, { scale = 40, pad = 1.2 } = {}) {
  const f = plan.floors.find((x) => x.id === floorId);
  const fl = f.floor;
  const xs = fl.rooms.flatMap((r) => r.polygon.map((p) => p[0])), zs = fl.rooms.flatMap((r) => r.polygon.map((p) => p[1]));
  const X0 = Math.min(...xs) - pad, X1 = Math.max(...xs) + pad, Z0 = Math.min(...zs) - pad, Z1 = Math.max(...zs) + pad;
  const W = (X1 - X0) * scale, H = (Z1 - Z0) * scale;
  const X = (x) => ((x - X0) * scale).toFixed(1), Z = (z) => ((z - Z0) * scale).toFixed(1);
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" width="${W.toFixed(0)}" height="${H.toFixed(0)}" data-floor="${floorId}" data-scale="${scale}" data-x0="${X0}" data-z0="${Z0}" font-family="ui-monospace, monospace">`);
  out.push(`<title>${floorId} ${fl.label ?? ''}: plan view, meters, street side (z = 0) at the top</title>`);
  out.push('<defs>');
  for (const [k, c] of Object.entries(COLORS)) out.push(`<pattern id="h-${k}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(${k === 'assumed' ? 45 : k === 'documented' ? -45 : 0})"><rect width="8" height="8" fill="${c}" fill-opacity="0.16"/><line x1="0" y1="0" x2="0" y2="8" stroke="${c}" stroke-width="${k === 'measured' ? 0 : 1.2}" stroke-opacity="0.5"/></pattern>`);
  out.push('<marker id="tick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M5 0 L5 10" stroke="#223" stroke-width="2"/></marker>');
  out.push('</defs>');
  out.push(`<rect width="100%" height="100%" fill="#f7f5ef"/>`);
  // rooms
  for (const r of fl.rooms) {
    const b = bucketOf(r.polygonTag);
    const pts = r.polygon.map((p) => `${X(p[0])},${Z(p[1])}`).join(' ');
    out.push(`<polygon points="${pts}" fill="url(#h-${b})" stroke="${COLORS[b]}" stroke-width="1" data-room="${r.id}" data-tag="${r.polygonTag}"/>`);
  }
  // holes (stair openings, hatches)
  for (const h of fl.holes || []) out.push(`<rect x="${X(val(h.x0))}" y="${Z(val(h.z0))}" width="${((val(h.x1) - val(h.x0)) * scale).toFixed(1)}" height="${((val(h.z1) - val(h.z0)) * scale).toFixed(1)}" fill="#ffffff" stroke="#556" stroke-dasharray="4 3" data-hole="1"/>`);
  // walls
  for (const p of f.walls.pieces.filter((x) => x.kind === 'wall')) out.push(`<rect x="${X(p.x0)}" y="${Z(p.z0)}" width="${((p.x1 - p.x0) * scale).toFixed(1)}" height="${((p.z1 - p.z0) * scale).toFixed(1)}" fill="${p.exterior ? '#3a3f4a' : '#6a7080'}"/>`);
  // openings
  for (const o of f.walls.openings) {
    const half = o.t / 2;
    const [x0, x1, z0, z1] = o.orient === 'x' ? [o.p0, o.p1, o.c - half, o.c + half] : [o.c - half, o.c + half, o.p0, o.p1];
    const col = o.type === 'window' ? '#7fb3e0' : o.type === 'gate' ? '#c0392b' : o.type === 'hole' ? '#a0a0a0' : '#f7f5ef';
    out.push(`<rect x="${X(x0)}" y="${Z(z0)}" width="${((x1 - x0) * scale).toFixed(1)}" height="${((z1 - z0) * scale).toFixed(1)}" fill="${col}" stroke="#334" stroke-width="0.5" data-opening="${o.id}" data-type="${o.type}" data-width="${f3(o.p1 - o.p0)}"/>`);
  }
  // stairs on this floor
  for (const s of plan.stairs.filter((x) => x.from === floorId)) {
    const fp = s.footprint;
    out.push(`<rect x="${X(fp.x0)}" y="${Z(fp.z0)}" width="${((fp.x1 - fp.x0) * scale).toFixed(1)}" height="${((fp.z1 - fp.z0) * scale).toFixed(1)}" fill="none" stroke="#223" stroke-width="1"/>`);
    for (const st of s.steps) out.push(s.dir[0] ? `<line x1="${X(st.x0)}" y1="${Z(st.z0)}" x2="${X(st.x0)}" y2="${Z(st.z1)}" stroke="#223" stroke-width="0.5"/>` : `<line x1="${X(st.x0)}" y1="${Z(st.z0)}" x2="${X(st.x1)}" y2="${Z(st.z0)}" stroke="#223" stroke-width="0.5"/>`);
    const [tx, tz] = s.top;
    out.push(`<text x="${X(tx)}" y="${Z(tz)}" font-size="10" text-anchor="middle" fill="#223">UP ${s.n} x ${f3(s.riser)}</text>`);
  }
  // labels and dimension lines per room (the bounding rectangle, in meters)
  for (const r of fl.rooms) {
    const rx = r.polygon.map((p) => p[0]), rz = r.polygon.map((p) => p[1]);
    const a = Math.min(...rx), b = Math.max(...rx), c = Math.min(...rz), d = Math.max(...rz);
    const tag = bucketOf(r.polygonTag);
    out.push(`<text x="${X((a + b) / 2)}" y="${Z((c + d) / 2) - 6}" font-size="11" text-anchor="middle" fill="#223">${r.label ?? r.id}</text>`);
    out.push(`<text x="${X((a + b) / 2)}" y="${+Z((c + d) / 2) + 8}" font-size="9" text-anchor="middle" fill="${COLORS[tag]}">${LABEL[tag]} · ${polygonArea(r.polygon).toFixed(1)} m²</text>`);
    const yy = c + 0.35, xx = a + 0.35;
    out.push(`<g class="dim" data-room="${r.id}" data-axis="x" data-from="${f3(a)}" data-to="${f3(b)}" data-length="${f3(b - a)}"><line x1="${X(a)}" y1="${Z(yy)}" x2="${X(b)}" y2="${Z(yy)}" stroke="#223" stroke-width="0.7" marker-start="url(#tick)" marker-end="url(#tick)"/><text x="${X((a + b) / 2)}" y="${+Z(yy) - 2}" font-size="9" text-anchor="middle">${(b - a).toFixed(2)} m</text></g>`);
    out.push(`<g class="dim" data-room="${r.id}" data-axis="z" data-from="${f3(c)}" data-to="${f3(d)}" data-length="${f3(d - c)}"><line x1="${X(xx)}" y1="${Z(c)}" x2="${X(xx)}" y2="${Z(d)}" stroke="#223" stroke-width="0.7" marker-start="url(#tick)" marker-end="url(#tick)"/><text x="${+X(xx) + 3}" y="${Z((c + d) / 2)}" font-size="9" transform="rotate(90 ${+X(xx) + 3} ${Z((c + d) / 2)})" text-anchor="middle">${(d - c).toFixed(2)} m</text></g>`);
  }
  // legend and north arrow (street side)
  const ly = H - 14;
  out.push(`<g font-size="10"><text x="8" y="${ly}" fill="#223">${floorId} · elevation ${val(fl.elevation).toFixed(2)} m · ceiling ${val(fl.ceiling).toFixed(2)} m · 1 m = ${scale} px</text>`);
  let lx = 8;
  for (const k of ['measured', 'documented', 'assumed']) { out.push(`<rect x="${lx}" y="${ly - 23}" width="12" height="10" fill="url(#h-${k})" stroke="${COLORS[k]}"/><text x="${lx + 16}" y="${ly - 14}" fill="${COLORS[k]}">${LABEL[k]}</text>`); lx += 100; }
  out.push(`<text x="${W - 10}" y="14" text-anchor="end" fill="#556">street (z = 0) at the top</text></g>`);
  out.push('</svg>');
  return out.join('\n');
}

// Parse the dimension lines back out of an SVG string (round-trip test).
export function parseDims(svg) {
  const re = /<g class="dim" data-room="([^"]+)" data-axis="([xz])" data-from="([-\d.]+)" data-to="([-\d.]+)" data-length="([-\d.]+)">/g;
  const out = [];
  let m;
  while ((m = re.exec(svg))) out.push({ room: m[1], axis: m[2], from: +m[3], to: +m[4], length: +m[5] });
  return out;
}
