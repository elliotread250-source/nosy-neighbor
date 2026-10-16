// One-screen summary after every run (spec section 9): passed, failed and
// the overall measured percentage of the current house.
import { readFileSync, existsSync } from 'node:fs';
import { audit } from '../../src/act3/Audit.js';

export default class SummaryReporter {
  onFinished(files) { this.print(files); }

  onTestRunEnd(modules) { this.print(modules); }

  print(modules) {
    if (this.done) return;
    this.done = true;
    let passed = 0, failed = 0;
    const walk = (task) => {
      if (task.type === 'test') { if (task.result?.state === 'pass') passed++; else if (task.result?.state === 'fail') failed++; }
      for (const t of task.tasks || []) walk(t);
    };
    for (const m of modules || []) walk(m.task ?? m);
    const path = existsSync('data/act3/house.json') ? 'data/act3/house.json' : 'data/act3/test-house.json';
    const a = audit(JSON.parse(readFileSync(path, 'utf8')));
    const bar = '='.repeat(64);
    console.log(`\n${bar}\nACT 3 HOUSE STUDY  tests passed ${passed}  failed ${failed}  overall measured ${a.overallMeasured.toFixed(1)}%${a.overallMeasured === 0 ? '  (0 PERCENT MEASURED)' : ''}\n${bar}`);
  }
}
