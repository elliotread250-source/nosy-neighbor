// tools/measure.html: click a screenshot, get meters with an uncertainty.
// Straight-on mode: 2 ruler clicks, 2 target clicks. Four-corner mode: the 4
// corners of a known rectangle (TL, TR, BR, BL), then 2 target clicks.
import { straightOn, fourCorner, sha256 } from './Measure.js';

const $ = (id) => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
const lp = $('lp'), lctx = lp.getContext('2d'), loupe = $('loupe');
let img = null, imgInfo = null, pts = [], session = [], house = null;

const MODES = {
  straight: ['ruler start', 'ruler end', 'target start', 'target end'],
  four: ['rect top-left', 'rect top-right', 'rect bottom-right', 'rect bottom-left', 'target start', 'target end'],
};
const mode = () => $('mode').value;

async function loadHouse() {
  for (const f of ['/data/act3/house.json', '/data/act3/test-house.json']) {
    try { const r = await fetch(f); if (r.ok) { house = await r.json(); break; } } catch { /* offline */ }
  }
  if (!house) return;
  const list = ['playerHeight'];
  for (const fl of house.floors) {
    list.push(`${fl.id}.ceiling`, `${fl.id}.elevation`);
    for (const rm of fl.rooms) {
      rm.polygon.forEach((_, i) => list.push(`${fl.id}.${rm.id}.wall${i}.length`));
      for (const w of rm.walls || []) (w.openings || []).forEach((_, j) => ['width', 'height', 'sill'].forEach((k) => list.push(`${fl.id}.${rm.id}.wall${w.from}.opening${j}.${k}`)));
    }
  }
  $('targets').innerHTML = list.map((t) => `<option value="${t}">`).join('');
}

function steps() {
  const names = MODES[mode()];
  $('steps').innerHTML = names.map((n, i) => `<li class="${i < pts.length ? 'done' : i === pts.length ? 'now' : ''}">${n}${pts[i] ? ` (${pts[i][0].toFixed(1)}, ${pts[i][1].toFixed(1)})` : ''}</li>`).join('');
}

function draw() {
  if (!img) return;
  ctx.drawImage(img, 0, 0);
  const names = MODES[mode()];
  ctx.lineWidth = 2;
  const col = (i) => (names[i].startsWith('target') ? '#48d6a1' : '#ff3366');
  const line = (a, b, c) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); };
  if (mode() === 'straight') {
    if (pts[1]) line(pts[0], pts[1], '#ff3366');
    if (pts[3]) line(pts[2], pts[3], '#48d6a1');
  } else {
    for (let i = 1; i < Math.min(pts.length, 4); i++) line(pts[i - 1], pts[i], '#ff3366');
    if (pts.length >= 4) line(pts[3], pts[0], '#ff3366');
    if (pts[5]) line(pts[4], pts[5], '#48d6a1');
  }
  pts.forEach((p, i) => { ctx.strokeStyle = col(i); ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, 7); ctx.stroke(); });
}

function compute() {
  const n = MODES[mode()].length;
  if (pts.length < n) { $('result').textContent = `Place ${n - pts.length} more click(s).`; return null; }
  const clickSigma = +$('clickSig').value;
  let r;
  try {
    if (mode() === 'straight') r = straightOn({ ruler: [pts[0], pts[1]], target: [pts[2], pts[3]], rulerLength: +$('rulerLen').value, rulerSigma: +$('rulerSig').value, clickSigma });
    else r = fourCorner({ corners: pts.slice(0, 4), rectWidth: +$('rectW').value, rectHeight: +$('rectH').value, target: [pts[4], pts[5]], rectSigma: +$('rectSig').value, clickSigma });
  } catch (e) { $('result').textContent = String(e.message); return null; }
  $('result').textContent = `${r.value.toFixed(3)} m ± ${r.sigma.toFixed(3)}\n\n${r.working.join('\n')}`;
  return r;
}

function refresh() { steps(); draw(); compute(); }

$('file').addEventListener('change', (e) => e.target.files[0] && open(e.target.files[0]));
document.body.addEventListener('dragover', (e) => e.preventDefault());
document.body.addEventListener('drop', (e) => { e.preventDefault(); if (e.dataTransfer.files[0]) open(e.dataTransfer.files[0]); });

async function open(file) {
  const bytes = await file.arrayBuffer();
  const hash = await sha256(bytes);
  const url = URL.createObjectURL(new Blob([bytes]));
  img = new Image();
  img.onload = () => {
    cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    $('drop').hidden = true;
    imgInfo = { file: file.name, sha256: hash, width: img.naturalWidth, height: img.naturalHeight, given: new Date().toISOString().slice(0, 10) };
    $('imginfo').textContent = `${file.name}  ${img.naturalWidth}x${img.naturalHeight}  sha256 ${hash.slice(0, 16)}...`;
    pts = [];
    refresh();
  };
  img.src = url;
}

const pos = (e) => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * (cv.width / b.width), (e.clientY - b.top) * (cv.height / b.height)]; };
cv.addEventListener('click', (e) => { if (!img || pts.length >= MODES[mode()].length) return; pts.push(pos(e)); refresh(); });
cv.addEventListener('mousemove', (e) => {
  if (!img) return;
  const [x, y] = pos(e);
  loupe.style.display = 'block';
  loupe.style.left = `${e.clientX + 18}px`; loupe.style.top = `${e.clientY + 18}px`;
  lctx.imageSmoothingEnabled = false;
  lctx.clearRect(0, 0, 150, 150);
  lctx.drawImage(cv, x - 15, y - 15, 30, 30, 0, 0, 150, 150);
  lctx.strokeStyle = '#ff3366'; lctx.beginPath(); lctx.moveTo(75, 0); lctx.lineTo(75, 150); lctx.moveTo(0, 75); lctx.lineTo(150, 75); lctx.stroke();
});
cv.addEventListener('mouseleave', () => { loupe.style.display = 'none'; });
$('undo').onclick = () => { pts.pop(); refresh(); };
$('clear').onclick = () => { pts = []; refresh(); };
$('mode').onchange = () => { $('m-straight').hidden = mode() !== 'straight'; $('m-four').hidden = mode() !== 'four'; pts = []; refresh(); };
$('rulerKind').onchange = () => {
  const k = $('rulerKind').value;
  if (k === 'player') { $('rulerLen').value = house?.playerHeight?.value ?? 1.2; $('rulerSig').value = 0.02; }
  if (k === 'door') { $('rulerLen').value = 2.6; $('rulerSig').value = 0.15; }
};
for (const id of ['rulerLen', 'rulerSig', 'rectW', 'rectH', 'rectSig', 'clickSig']) $(id).oninput = () => compute();

$('add').onclick = () => {
  const r = compute();
  const target = $('target').value.trim();
  if (!r || !target) { alert('Need a complete set of clicks and a target path.'); return; }
  if (!$('build').value.trim()) { alert('Say which build, act and room the image is from (provenance).'); return; }
  const player = mode() === 'straight' && $('rulerKind').value === 'player';
  const m = {
    id: `m_${Date.now().toString(36)}`, target, value: +r.value.toFixed(4), sigma: +r.sigma.toFixed(4),
    method: mode() === 'straight' ? 'straight-on' : 'four-corner',
    ...(player ? { dependsOn: ['playerHeight'], ratio: +r.ratio.toFixed(5), ratioSigma: +r.ratioSigma.toFixed(5) } : {}),
    image: { ...imgInfo, build: $('build').value.trim() },
    points: pts.map((p) => p.map((v) => +v.toFixed(1))),
    ruler: mode() === 'straight' ? { kind: $('rulerKind').value, length: +$('rulerLen').value, sigma: +$('rulerSig').value } : { kind: 'rectangle', width: +$('rectW').value, height: +$('rectH').value, sigma: +$('rectSig').value },
    clickSigma: +$('clickSig').value, working: r.working, date: new Date().toISOString(),
  };
  session.push(m);
  $('list').innerHTML = session.map((s) => `<tr><td>${s.target}</td><td>${s.value.toFixed(3)} ± ${s.sigma.toFixed(3)}</td><td>${s.method}</td></tr>`).join('');
  pts = [];
  refresh();
};

$('export').onclick = () => {
  const images = [...new Map(session.map((s) => [s.image.sha256, s.image])).values()];
  const blob = new Blob([JSON.stringify({ schemaVersion: 1, images, measurements: session }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'measurements.json';
  a.click();
};

window.__measure = { straightOn, fourCorner, get pts() { return pts; } };
loadHouse();
refresh();
