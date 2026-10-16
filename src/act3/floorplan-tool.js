// tools/floorplan.html: every floor top-down, color-coded by tag, with
// dimension lines in meters and an SVG download per floor.
import house from '../../data/act3/house.json';
import measurements from '../../data/act3/measurements.json';
import { applyMeasurements } from './Measure.js';
import { planHouse } from './Plan.js';
import { audit } from './Audit.js';
import { floorplanSVG } from './Floorplan.js';

const spec = applyMeasurements(house, measurements.measurements || []).spec;
const plan = planHouse(spec);
const a = audit(spec, measurements.measurements || []);
document.getElementById('meta').innerHTML = `rev ${spec.revision} · <span class="${a.overallMeasured === 0 ? 'zero' : ''}">${a.overallMeasured.toFixed(1)}% measured</span> · green measured, amber documented, red assumed`;
const root = document.getElementById('plans');
for (const f of plan.floors) {
  const svg = floorplanSVG(spec, plan, f.id);
  const s = document.createElement('section');
  s.innerHTML = `<h2><span>${f.id} · ${f.floor.label ?? ''}</span><button>Download SVG</button></h2>${svg}`;
  s.querySelector('button').onclick = () => {
    const el = document.createElement('a');
    el.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    el.download = `act3-${f.id}-rev${spec.revision}.svg`;
    el.click();
  };
  root.appendChild(s);
}
window.__plansReady = true;
