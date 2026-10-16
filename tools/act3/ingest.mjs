// npm run ingest (spec section 32): list new reference images, record their
// provenance, apply data/act3/measurements.json to house.json, and print the
// diff. Assumed -> measured is automatic; a measured value is never replaced
// by a disagreeing one (it is reported as a conflict instead).
//   node tools/act3/ingest.mjs           dry run: print the diff
//   node tools/act3/ingest.mjs --write   apply it, bump the revision, log the changelog
import { readFileSync, writeFileSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyMeasurements, sha256 } from '../../src/act3/Measure.js';
import { audit } from '../../src/act3/Audit.js';
import { assertValid } from '../../src/act3/Spec.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.includes('--write');
const housePath = join(root, 'data/act3/house.json');
const measPath = join(root, 'data/act3/measurements.json');
const spec = assertValid(JSON.parse(readFileSync(housePath, 'utf8')));
const meas = JSON.parse(readFileSync(measPath, 'utf8'));

// 1. reference images (git-ignored folder): hash anything new
const refDir = join(root, 'reference');
const known = new Map(meas.images.map((i) => [i.sha256, i]));
const fresh = [];
if (existsSync(refDir)) {
  for (const f of readdirSync(refDir).filter((n) => /\.(png|jpe?g|webp|bmp)$/i.test(n))) {
    const h = await sha256(readFileSync(join(refDir, f)));
    if (!known.has(h)) fresh.push({ file: f, sha256: h, given: new Date().toISOString().slice(0, 10), build: 'ASK: which build and act?', note: '' });
  }
}
if (fresh.length) {
  console.log(`${fresh.length} new reference image(s). For each, I need: which build, which act, which room.`);
  for (const i of fresh) console.log(`  ${i.file}  sha256 ${i.sha256.slice(0, 16)}...`);
} else console.log('No new reference images in reference/.');

// 2. apply the measurements
const before = audit(spec).overallMeasured;
const r = applyMeasurements(spec, meas.measurements);
const after = audit(r.spec, meas.measurements).overallMeasured;
console.log(`\n${meas.measurements.length} measurement record(s), ${r.diff.length} change(s), ${r.conflicts.length} conflict(s).`);
for (const d of r.diff) console.log(`  ${d.target}: ${d.old} [${d.oldTag}] -> ${d.value} [${d.tag}] sigma ${d.sigma}`);
for (const c of r.conflicts) console.log(`  CONFLICT ${c.target} (${c.kind}): ${c.note ?? JSON.stringify(c.conflicts)}`);
for (const m of r.missing) console.log(`  MISSING target ${m} (no such dimension in house.json)`);
console.log(`\nmeasured: ${before.toFixed(1)} % -> ${after.toFixed(1)} %`);

if (write) {
  if (fresh.length) { meas.images.push(...fresh); writeFileSync(measPath, JSON.stringify(meas, null, 2) + '\n'); }
  if (r.diff.length) {
    r.spec.revision = (spec.revision ?? 0) + 1;
    writeFileSync(housePath, JSON.stringify(r.spec, null, 1) + '\n');
    const lines = [`\n## rev ${r.spec.revision} (ingest ${new Date().toISOString().slice(0, 10)})\n`, ...r.diff.map((d) => `- ${d.target}: ${d.old} [${d.oldTag}] -> ${d.value} [${d.tag}], sigma ${d.sigma}`), ...r.conflicts.map((c) => `- CONFLICT ${c.target} (${c.kind}), not applied`), `\nMeasured: ${before.toFixed(1)} % -> ${after.toFixed(1)} %\n`];
    appendFileSync(join(root, 'data/act3/CHANGELOG.md'), lines.join('\n'));
  }
  console.log(write && r.diff.length ? `wrote house.json revision ${r.spec.revision}` : 'nothing to write');
} else if (r.diff.length) console.log('dry run: re-run with --write to apply');
