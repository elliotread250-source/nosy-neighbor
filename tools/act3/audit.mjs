// npm run audit: print the full audit and write reports/audit-YYYYMMDD.json (spec 28.4).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { audit, auditText } from '../../src/act3/Audit.js';
import { applyMeasurements } from '../../src/act3/Measure.js';
import { assertValid } from '../../src/act3/Spec.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const file = process.argv[2] || (existsSync(join(root, 'data/act3/house.json')) ? 'data/act3/house.json' : 'data/act3/test-house.json');
const spec = assertValid(JSON.parse(readFileSync(join(root, file), 'utf8')));
const meas = JSON.parse(readFileSync(join(root, 'data/act3/measurements.json'), 'utf8'));
const applied = applyMeasurements(spec, meas.measurements);
const a = audit(applied.spec, meas.measurements);
console.log(auditText(a));
if (applied.conflicts.length) console.log(`\n${applied.conflicts.length} conflict(s): ${applied.conflicts.map((c) => c.target).join(', ')}`);
const d = new Date();
const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
mkdirSync(join(root, 'reports'), { recursive: true });
const out = join(root, `reports/audit-${stamp}.json`);
writeFileSync(out, JSON.stringify({ file, date: d.toISOString(), ...a, conflictsDetail: applied.conflicts }, null, 1));
console.log(`\nwrote ${out.replace(root + '/', '')}`);
