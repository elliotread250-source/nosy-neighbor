// Production static server for dist/: no dependencies. Brotli or gzip when
// the browser accepts it (compressed once, kept in memory), long-lived cache
// headers for hashed assets, application/wasm for Rapier, and a health check.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.wasm', '.svg', '.txt']);
const cache = new Map(); // path -> { raw, br, gz, type, etag }

async function load(path) {
  const hit = cache.get(path);
  if (hit) return hit;
  const raw = await readFile(path);
  const ext = extname(path);
  const entry = { raw, type: TYPES[ext] || 'application/octet-stream', etag: `"${raw.length.toString(36)}-${(await stat(path)).mtimeMs.toString(36)}"` };
  if (COMPRESSIBLE.has(ext) && raw.length > 1024) {
    entry.br = zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } });
    entry.gz = zlib.gzipSync(raw, { level: 9 });
  }
  cache.set(path, entry);
  return entry;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/healthz') { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('ok'); return; }
    // the study lives in a folder: /act3 -> /act3/
    if (url.pathname === '/act3') { res.writeHead(301, { location: `/act3/${url.search}` }); res.end(); return; }
    let rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    if (rel.endsWith('/')) rel += 'index.html';
    let path = join(ROOT, rel);
    if (!path.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    let entry;
    try { entry = await load(path); } catch {
      // unknown paths get the game (single page)
      path = join(ROOT, 'index.html');
      entry = await load(path);
    }
    const hashed = rel.startsWith('/assets/') || rel.startsWith('assets/');
    const headers = {
      'content-type': entry.type,
      'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
      etag: entry.etag,
      vary: 'accept-encoding',
      'x-content-type-options': 'nosniff',
    };
    if (req.headers['if-none-match'] === entry.etag) { res.writeHead(304, headers); res.end(); return; }
    const accept = req.headers['accept-encoding'] || '';
    let body = entry.raw;
    if (entry.br && /\bbr\b/.test(accept)) { body = entry.br; headers['content-encoding'] = 'br'; } else if (entry.gz && /\bgzip\b/.test(accept)) { body = entry.gz; headers['content-encoding'] = 'gzip'; }
    headers['content-length'] = body.length;
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('server error');
    console.error(e);
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`Nosy Neighbor on :${PORT}`));
