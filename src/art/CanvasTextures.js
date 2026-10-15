// Every texture in the game is painted here at runtime on an offscreen canvas.
// Graphic, simple, painted. Never photographic. Each texture is cached and
// tagged with the world size (meters) one tile represents, for tile().
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, LinearMipmapLinearFilter, LinearFilter } from 'three';
import { css, srgb } from './Palette.js';
import { mulberry32, seedFrom, valueNoise3 } from './Warp.js';

const cache = new Map();

function canvas(size, sizeY = size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = sizeY;
  return [c, c.getContext('2d')];
}

function finishTex(c, meters, metersY = meters) {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.minFilter = LinearMipmapLinearFilter;
  t.magFilter = LinearFilter;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.userData.meters = [meters, metersY];
  t.repeat.set(1 / meters, 1 / metersY);
  return t;
}

function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

function shade(name, f) {
  const c = srgb(name);
  const k = (v) => Math.max(0, Math.min(255, Math.round(v * f * 255)));
  return `rgb(${k(c.r)},${k(c.g)},${k(c.b)})`;
}

// Wavy grain stroke across the width
function grainLine(g, x0, x1, y, amp, freq, phase) {
  g.beginPath();
  for (let x = x0; x <= x1; x += 4) {
    const yy = y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.4;
    if (x === x0) g.moveTo(x, yy);
    else g.lineTo(x, yy);
  }
  g.stroke();
}

// ---------- Wood planks (floors). One tile = 2 m. ----------
export function woodPlanks(base = 'FLOOR_WOOD', planks = 5) {
  return cached(`wood-${base}-${planks}`, () => {
    const S = 512;
    const [c, g] = canvas(S);
    const r = mulberry32(seedFrom(`wood${base}`));
    g.fillStyle = css(base);
    g.fillRect(0, 0, S, S);
    const ph = S / planks;
    for (let p = 0; p < planks; p++) {
      const y0 = p * ph;
      // per-plank brightness shift
      g.fillStyle = shade(base, 0.94 + r() * 0.12);
      g.fillRect(0, y0, S, ph);
      g.strokeStyle = shade(base, 0.88);
      g.lineWidth = 1.5;
      const lines = 3 + Math.floor(r() * 4);
      for (let l = 0; l < lines; l++) {
        grainLine(g, -10, S + 10, y0 + 8 + r() * (ph - 16), 2 + r() * 3, 0.01 + r() * 0.02, r() * 10);
      }
      // knots
      const knots = 1 + Math.floor(r() * 2);
      for (let k = 0; k < knots; k++) {
        g.fillStyle = shade(base, 0.78);
        g.beginPath();
        g.ellipse(r() * S, y0 + ph * (0.3 + r() * 0.4), 6 + r() * 6, 3 + r() * 2, 0, 0, Math.PI * 2);
        g.fill();
      }
      // plank end joint
      g.fillStyle = shade(base, 0.7);
      g.fillRect(((r() * S) | 0), y0, 2, ph);
      // gap
      g.fillRect(0, y0, S, 2);
    }
    return finishTex(c, 2);
  });
}

// ---------- Clapboard siding. Each board 18 cm. Tile = 1.8 m (10 boards). ----------
export function siding(base = 'NH_SIDING_MAIN') {
  return cached(`siding-${base}`, () => {
    const S = 256;
    const [c, g] = canvas(S);
    const boards = 10;
    const bh = S / boards;
    for (let i = 0; i < boards; i++) {
      const y0 = i * bh;
      const grd = g.createLinearGradient(0, y0, 0, y0 + bh);
      grd.addColorStop(0, shade(base, 1.07));
      grd.addColorStop(0.75, shade(base, 1.0));
      grd.addColorStop(1, shade(base, 0.93));
      g.fillStyle = grd;
      g.fillRect(0, y0, S, bh);
      g.fillStyle = shade(base, 0.72);
      g.fillRect(0, y0 + bh - 3, S, 3);
    }
    return finishTex(c, 1.8);
  });
}

// ---------- Fish-scale shingles. ~35 cm wide; tile = 1.4 m. ----------
export function shingles(base = 'NH_ROOF') {
  return cached(`shingles-${base}`, () => {
    const S = 256;
    const [c, g] = canvas(S);
    const r = mulberry32(seedFrom(`sh${base}`));
    g.fillStyle = shade(base, 0.62);
    g.fillRect(0, 0, S, S);
    const cols = 4, rows = 6;
    const w = S / cols, h = S / rows;
    for (let row = rows; row >= -1; row--) {
      const off = row % 2 ? w / 2 : 0;
      for (let col = -1; col <= cols; col++) {
        const x = col * w + off, y = row * h;
        g.fillStyle = shade(base, 0.94 + r() * 0.12);
        g.beginPath();
        g.moveTo(x + 2, y);
        g.lineTo(x + w - 2, y);
        g.lineTo(x + w - 2, y + h * 0.75);
        g.quadraticCurveTo(x + w / 2, y + h * 1.25, x + 2, y + h * 0.75);
        g.closePath();
        g.fill();
        g.fillStyle = shade(base, 1.08);
        g.fillRect(x + 4, y + 2, w - 8, 3);
      }
    }
    return finishTex(c, 1.4);
  });
}

// ---------- Chunky brick 30x12 cm. Tile = 1.2 m x 0.96 m ----------
export function brick(base = 'NH_ROOF', mortar = 'SIDEWALK') {
  return cached(`brick-${base}-${mortar}`, () => {
    const S = 256;
    const [c, g] = canvas(S);
    const r = mulberry32(seedFrom(`br${base}`));
    g.fillStyle = css(mortar);
    g.fillRect(0, 0, S, S);
    const cols = 4, rows = 8;
    const w = S / cols, h = S / rows;
    for (let row = 0; row < rows; row++) {
      const off = row % 2 ? w / 2 : 0;
      for (let col = -1; col <= cols; col++) {
        g.fillStyle = shade(base, 0.86 + r() * 0.24);
        const x = col * w + off + 3, y = row * h + 3;
        roundRect(g, x, y, w - 6, h - 6, 3);
        g.fill();
      }
    }
    return finishTex(c, 1.2, 0.96);
  });
}

// ---------- Wallpapers. Tile = 0.8 m ----------
export function wallpaper(kind = 'stripes', base = 'WALLPAPER_GREEN', ink = 'WALLPAPER_GREEN_STRIPE') {
  return cached(`wp-${kind}-${base}-${ink}`, () => {
    const S = 256;
    const [c, g] = canvas(S);
    g.fillStyle = css(base);
    g.fillRect(0, 0, S, S);
    g.fillStyle = css(ink);
    g.strokeStyle = css(ink);
    if (kind === 'stripes') {
      for (let x = 0; x < S; x += 64) g.fillRect(x, 0, 28, S);
    } else if (kind === 'pinstripes') {
      for (let x = 0; x < S; x += 32) g.fillRect(x, 0, 6, S);
    } else if (kind === 'dots') {
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          g.beginPath();
          g.arc(x * 64 + (y % 2 ? 32 : 0) + 16, y * 64 + 32, 12, 0, Math.PI * 2);
          g.fill();
        }
    } else if (kind === 'diamonds') {
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          const cx = x * 64 + 32, cy = y * 64 + 32;
          g.beginPath();
          g.moveTo(cx, cy - 26); g.lineTo(cx + 18, cy); g.lineTo(cx, cy + 26); g.lineTo(cx - 18, cy);
          g.closePath();
          g.fill();
        }
    } else if (kind === 'flowers') {
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          const cx = x * 64 + (y % 2 ? 32 : 0) + 16, cy = y * 64 + 32;
          for (let p = 0; p < 5; p++) {
            const a = (p / 5) * Math.PI * 2;
            g.beginPath();
            g.arc(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, 6, 0, Math.PI * 2);
            g.fill();
          }
          g.fillStyle = css('YELLOW_TOY');
          g.beginPath(); g.arc(cx, cy, 5, 0, Math.PI * 2); g.fill();
          g.fillStyle = css(ink);
        }
    } else if (kind === 'clouds') {
      g.fillStyle = css(ink);
      for (let i = 0; i < 3; i++) {
        const cx = 40 + i * 90, cy = 60 + (i % 2) * 120;
        [[0, 0, 22], [22, -8, 18], [-20, 4, 16], [38, 6, 14]].forEach(([dx, dy, rr]) => {
          g.beginPath(); g.arc(cx + dx, cy + dy, rr, 0, Math.PI * 2); g.fill();
        });
      }
    }
    return finishTex(c, 0.8);
  });
}

// ---------- Checkerboard tile, 30 cm squares. Tile = 0.6 m ----------
export function checker(a = 'FLOOR_TILE_A', b = 'FLOOR_TILE_B') {
  return cached(`checker-${a}-${b}`, () => {
    const S = 128;
    const [c, g] = canvas(S);
    const h = S / 2;
    g.fillStyle = css(a); g.fillRect(0, 0, S, S);
    g.fillStyle = css(b); g.fillRect(h, 0, h, h); g.fillRect(0, h, h, h);
    g.strokeStyle = 'rgba(120,110,100,0.35)';
    g.lineWidth = 1;
    g.strokeRect(0.5, 0.5, h, h); g.strokeRect(h + 0.5, h + 0.5, h - 1, h - 1);
    return finishTex(c, 0.6);
  });
}

// ---------- Grass. Tile = 6 m ----------
export function grass() {
  return cached('grass', () => {
    const S = 512;
    const [c, g] = canvas(S);
    const r = mulberry32(seedFrom('grass'));
    g.fillStyle = css('GRASS');
    g.fillRect(0, 0, S, S);
    // low-frequency patchiness, tileable by sampling noise on a torus
    const img = g.getImageData(0, 0, S, S);
    const d = img.data;
    const light = srgb('GRASS_LIGHT'), dark = srgb('GRASS_DARK'), base = srgb('GRASS');
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const ax = (x / S) * Math.PI * 2, ay = (y / S) * Math.PI * 2;
        const n = valueNoise3(Math.cos(ax) * 1.6 + 5, Math.sin(ax) * 1.6 + Math.cos(ay) * 1.6, Math.sin(ay) * 1.6, 7) * 0.75 +
          valueNoise3(Math.cos(ax) * 4 + 9, Math.sin(ax) * 4 + Math.cos(ay) * 4, Math.sin(ay) * 4, 11) * 0.25;
        const t = n * 0.5;
        const tgt = t > 0 ? light : dark;
        const k = Math.min(1, Math.abs(t)) * 0.55;
        const i = (y * S + x) * 4;
        d[i] = (base.r + (tgt.r - base.r) * k) * 255;
        d[i + 1] = (base.g + (tgt.g - base.g) * k) * 255;
        d[i + 2] = (base.b + (tgt.b - base.b) * k) * 255;
      }
    g.putImageData(img, 0, 0);
    // hundreds of short blade strokes
    g.lineCap = 'round';
    for (let i = 0; i < 2600; i++) {
      const x = r() * S, y = r() * S;
      const l = 3 + r() * 6;
      const lightStroke = r() < 0.5;
      g.strokeStyle = lightStroke ? css('GRASS_LIGHT', 0.35) : css('GRASS_DARK', 0.35);
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (r() - 0.5) * 3, y - l);
      g.stroke();
    }
    return finishTex(c, 6);
  });
}

// ---------- Argyle for the vest. One diamond ~9 cm wide. Tile = 0.18 m x 0.26 m ----------
export function argyle() {
  return cached('argyle', () => {
    const W = 256, H = 370;
    const [c, g] = canvas(W, H);
    g.fillStyle = css('NB_VEST_DARK');
    g.fillRect(0, 0, W, H);
    const dw = W / 2, dh = H / 2;
    const diamond = (cx, cy, col) => {
      g.fillStyle = css(col);
      g.beginPath();
      g.moveTo(cx, cy - dh / 2); g.lineTo(cx + dw / 2, cy); g.lineTo(cx, cy + dh / 2); g.lineTo(cx - dw / 2, cy);
      g.closePath(); g.fill();
    };
    for (let y = 0; y <= 2; y++)
      for (let x = 0; x <= 2; x++) diamond(x * dw, y * dh, (x + y) % 2 ? 'NB_VEST_LIGHT' : 'NB_VEST_DARK');
    for (let y = 0; y <= 2; y++)
      for (let x = 0; x <= 2; x++) diamond(x * dw + dw / 2, y * dh + dh / 2, (x + y) % 2 ? 'NB_VEST_DARK' : 'NB_VEST_LIGHT');
    g.strokeStyle = css('NB_VEST_LINE');
    g.lineWidth = 3;
    for (let i = -2; i <= 4; i++) {
      g.beginPath(); g.moveTo(i * dw, 0); g.lineTo(i * dw + W, H); g.stroke();
      g.beginPath(); g.moveTo(i * dw + W, 0); g.lineTo(i * dw, H); g.stroke();
    }
    return finishTex(c, 0.18, 0.26);
  });
}

// ---------- Carpet with darker border band. Not tiled: stretch over a rug. ----------
export function carpet(base = 'CARPET_RED', pattern = 'border') {
  return cached(`carpet-${base}-${pattern}`, () => {
    const S = 256;
    const [c, g] = canvas(S);
    const r = mulberry32(seedFrom(`carpet${base}`));
    g.fillStyle = css(base);
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
      g.fillRect(r() * S, r() * S, 2, 1);
    }
    g.strokeStyle = shade(base, 0.72);
    if (pattern === 'circles') {
      for (let rr = 120; rr > 0; rr -= 22) {
        g.lineWidth = 9;
        g.strokeStyle = rr % 44 ? shade(base, 0.75) : shade(base, 1.18);
        g.beginPath(); g.arc(S / 2, S / 2, rr, 0, Math.PI * 2); g.stroke();
      }
    } else {
      g.lineWidth = 18;
      g.strokeRect(14, 14, S - 28, S - 28);
      g.lineWidth = 4;
      g.strokeStyle = shade(base, 1.2);
      g.strokeRect(30, 30, S - 60, S - 60);
    }
    const t = finishTex(c, 1);
    t.wrapS = t.wrapT = 1001; // ClampToEdgeWrapping
    t.repeat.set(1, 1);
    return t;
  });
}

// ---------- Cartoon window glare: two diagonal bars. Stretch over the pane. ----------
export function glassGlare() {
  return cached('glare', () => {
    const S = 128;
    const [c, g] = canvas(S);
    g.clearRect(0, 0, S, S);
    g.fillStyle = css('GLASS', 1);
    g.globalAlpha = 1;
    g.fillRect(0, 0, S, S);
    g.translate(S / 2, S / 2);
    g.rotate(-Math.PI / 4);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.fillRect(-S, -22, S * 2, 16);
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.fillRect(-S, 4, S * 2, 8);
    const t = finishTex(c, 1);
    t.wrapS = t.wrapT = 1001;
    t.repeat.set(1, 1);
    return t;
  });
}

function roundRect(g, x, y, w, h, rr) {
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}
