// The honesty report (spec sections 0, 8, 27.1, 28.4): how much of the house
// is measured, documented or assumed, by wall length, floor area and
// openings, per room and per floor, plus the assumed dimensions whose
// replacement would help most.
import { val, tagOf, bucketOf, forEachTagged } from './Spec.js';
import { polygonArea } from './Slabs.js';
import { roomEdges } from './Walls.js';
import { DESIGN } from './assumptions.js';

const B = () => ({ measured: 0, documented: 0, assumed: 0 });
const pct = (b) => {
  const t = b.measured + b.documented + b.assumed;
  return t ? { measured: (100 * b.measured) / t, documented: (100 * b.documented) / t, assumed: (100 * b.assumed) / t, total: t } : { measured: 0, documented: 0, assumed: 100, total: 0 };
};

export function audit(spec, measurements = []) {
  const floors = [];
  const tot = { wall: B(), area: B(), openings: B() };
  let conflicts = 0;
  for (const f of spec.floors) {
    const fl = { id: f.id, label: f.label, rooms: [], wall: B(), area: B(), openings: B(), conflicts: 0 };
    for (const r of f.rooms) {
      const rm = { id: r.id, label: r.label, wall: B(), area: B(), openings: B(), conflicts: 0, assumedWalls: [] };
      const area = polygonArea(r.polygon);
      rm.area[bucketOf(r.polygonTag)] += area;
      for (const e of roomEdges(r)) {
        const len = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]);
        const w = (r.walls || []).find((x) => x.from === e.index);
        const tag = w?.lengthTag ?? r.polygonTag;
        rm.wall[bucketOf(tag)] += len;
        if (tag === 'conflict') rm.conflicts++;
        if (bucketOf(tag) === 'assumed') rm.assumedWalls.push(e.index);
        for (const op of w?.openings || []) {
          const t = tagOf(op.width);
          rm.openings[bucketOf(t)] += 1;
          if (t === 'conflict') rm.conflicts++;
        }
      }
      for (const k of ['wall', 'area', 'openings']) for (const b of ['measured', 'documented', 'assumed']) fl[k][b] += rm[k][b];
      fl.conflicts += rm.conflicts;
      fl.rooms.push({ ...rm, wallPct: pct(rm.wall), areaPct: pct(rm.area), openingsPct: pct(rm.openings) });
    }
    for (const k of ['wall', 'area', 'openings']) for (const b of ['measured', 'documented', 'assumed']) tot[k][b] += fl[k][b];
    conflicts += fl.conflicts;
    floors.push({ ...fl, wallPct: pct(fl.wall), areaPct: pct(fl.area), openingsPct: pct(fl.openings) });
  }
  // every tagged value, for the tag census and the ranked list
  const census = {};
  const assumed = [];
  forEachTagged(spec, (node, path) => {
    census[node.tag] = (census[node.tag] || 0) + 1;
    if (bucketOf(node.tag) === 'assumed' && 'value' in node) assumed.push({ path, value: node.value, tag: node.tag, rule: node.rule, weight: weightOf(path, node.value) });
  });
  for (const f of spec.floors) for (const r of f.rooms) {
    if (bucketOf(r.polygonTag) !== 'assumed') continue;
    for (const e of roomEdges(r)) {
      const len = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]);
      assumed.push({ path: `house.floors[${f.id}].rooms[${r.id}].wall${e.index}.length`, value: len, tag: r.polygonTag, rule: 'part3 layout', weight: len, suggest: shotFor(f, r, e) });
    }
  }
  assumed.sort((a, b) => b.weight - a.weight);
  const top20 = assumed.slice(0, 20).map((a) => ({ ...a, suggest: a.suggest ?? suggestionFor(a.path) }));
  const measuredCount = measurements.length;
  return {
    revision: spec.revision, schemaVersion: spec.schemaVersion,
    lastImport: measurements.reduce((d, m) => (m.date && m.date > d ? m.date : d), null),
    floors, totals: { wall: pct(tot.wall), area: pct(tot.area), openings: pct(tot.openings) },
    overallMeasured: pct(tot.wall).measured, conflicts, census, top20, measuredCount,
    styleCap: DESIGN.styleWarpCap, cartoonScale: DESIGN.cartoonScale, ledgeForgiveness: DESIGN.ledgeForgiveness,
    notes: [
      'Standard fixtures are weak rulers here: this game exaggerates proportions on purpose.',
      `Style mode warps geometry by up to ${DESIGN.styleWarpCap * 100} percent; survey mode is exact.`,
      `Props are drawn at a cartoon scale of ${DESIGN.cartoonScale}x their standard size; architecture is never scaled.`,
    ],
  };
}

// How much a dimension matters: heights that set every floor count most.
function weightOf(path, v) {
  if (/playerHeight/.test(path)) return 100;
  if (/\.ceiling$/.test(path) || /\.elevation$/.test(path)) return 40 + Math.abs(v);
  if (/stairs.*riser/.test(path)) return 30;
  if (/stairs.*tread/.test(path)) return 25;
  if (/gate|rail|lamp/i.test(path)) return 20 + Math.abs(v);
  if (/height$/.test(path)) return 5 + Math.abs(v);
  return Math.abs(v);
}

function suggestionFor(path) {
  if (/playerHeight/.test(path)) return 'A straight-on shot of the player standing next to a door, both fully in frame.';
  if (/F0.*ceiling|F0\.ceiling/.test(path)) return 'A straight-on shot of a ground-floor wall from floor to ceiling, with a door in it.';
  if (/elevation/.test(path)) return 'The main staircase from the side, every step visible.';
  if (/riser|tread/.test(path)) return 'The main staircase from the side, every step visible.';
  if (/gate|rail|lamp/i.test(path)) return 'The second-floor gate, rail and lamp together in one frame, straight on.';
  if (/opening/.test(path)) return 'That door or window straight on, with the player beside it.';
  return 'A straight-on shot of this wall with a door or the player in frame.';
}

function shotFor(f, r, e) {
  const dir = Math.abs(e.b[0] - e.a[0]) > 1e-6 ? (e.a[1] === Math.min(...r.polygon.map((p) => p[1])) ? 'front (street-side)' : 'back') : (e.a[0] === Math.min(...r.polygon.map((p) => p[0])) ? 'west' : 'east');
  return `A straight-on shot of the ${dir} wall of ${r.label ?? r.id} (${f.id}), with a door or the player in frame.`;
}

// Plain-text audit for `npm run audit` and the terminal summary.
export function auditText(a) {
  const f = (n) => `${n.toFixed(1).padStart(5)}%`;
  const lines = [];
  lines.push(`ACT 3 HOUSE STUDY AUDIT  revision ${a.revision}  schema ${a.schemaVersion}`);
  lines.push(`OVERALL MEASURED: ${a.overallMeasured.toFixed(1)} percent of wall length${a.overallMeasured === 0 ? '   <<< 0 PERCENT MEASURED: plausible stand-in, not a reconstruction >>>' : ''}`);
  lines.push('');
  lines.push('floor/room                    wall: meas   doc   asm | area: meas   doc   asm | conflicts');
  for (const fl of a.floors) {
    lines.push(`${fl.id.padEnd(30)}${f(fl.wallPct.measured)}${f(fl.wallPct.documented)}${f(fl.wallPct.assumed)} |${f(fl.areaPct.measured)}${f(fl.areaPct.documented)}${f(fl.areaPct.assumed)} | ${fl.conflicts}`);
    for (const r of fl.rooms) lines.push(`  ${r.id.padEnd(28)}${f(r.wallPct.measured)}${f(r.wallPct.documented)}${f(r.wallPct.assumed)} |${f(r.areaPct.measured)}${f(r.areaPct.documented)}${f(r.areaPct.assumed)} | ${r.conflicts}`);
  }
  const t = a.totals;
  lines.push(`${'TOTAL'.padEnd(30)}${f(t.wall.measured)}${f(t.wall.documented)}${f(t.wall.assumed)} |${f(t.area.measured)}${f(t.area.documented)}${f(t.area.assumed)} | ${a.conflicts}`);
  lines.push('');
  lines.push('Top assumed dimensions to replace (biggest effect first):');
  a.top20.forEach((x, i) => lines.push(`${String(i + 1).padStart(2)}. ${x.path} = ${Number(x.value).toFixed(3)} m [${x.tag}${x.rule ? `: ${x.rule}` : ''}]\n      shot: ${x.suggest}`));
  lines.push('');
  for (const n of a.notes) lines.push(`note: ${n}`);
  return lines.join('\n');
}
