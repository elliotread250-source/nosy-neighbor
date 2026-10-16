import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
await page.goto('http://localhost:5173/classic.html?shot=porch&debug=1&gfx=low');
await page.waitForFunction(() => window.__nnReady, null, { timeout: 180000 });
console.log(await page.evaluate(() => {
  const groups = {};
  let casters = 0, castTris = 0, outlines = 0, outTris = 0;
  nn.engine.scene.traverseVisible((o) => {
    if (!o.isMesh) return;
    const g = o.geometry;
    const tris = ((g.index ? g.index.count : g.attributes.position.count) / 3) * (o.isInstancedMesh ? o.count : 1);
    let top = o; while (top.parent && top.parent.type !== 'Scene') top = top.parent;
    const k = (o.userData.isOutline ? 'OUTLINE:' : '') + (top.name || top.type);
    groups[k] = groups[k] || { n: 0, tris: 0 };
    groups[k].n++; groups[k].tris += tris;
    if (o.castShadow) { casters++; castTris += tris; }
    if (o.userData.isOutline) { outlines++; outTris += tris; }
  });
  const big = []; nn.engine.scene.traverseVisible((o) => { if (!o.isMesh) return; const g = o.geometry; const tris = ((g.index ? g.index.count : g.attributes.position.count) / 3) * (o.isInstancedMesh ? o.count : 1); big.push([tris, o.name || o.parent?.name || '?', o.isInstancedMesh ? 'inst' + o.count : '', o.castShadow ? 'cast' : '']); }); big.sort((a, b) => b[0] - a[0]);
  const rows0 = big.slice(0, 14).map((b) => `${Math.round(b[0] / 1000)}k ${b[1]} ${b[2]} ${b[3]}`).join('\n');
  const rows = Object.entries(groups).sort((a, b) => b[1].tris - a[1].tris).slice(0, 18).map(([k, v]) => `${k.padEnd(34)} meshes ${String(v.n).padStart(4)}  tris ${Math.round(v.tris / 1000)}k`);
  return rows0 + '\n---\n' + rows.join('\n') + `\ncasters ${casters} (${Math.round(castTris / 1000)}k tris)  outlines ${outlines} (${Math.round(outTris / 1000)}k)`;
}));
await browser.close();
