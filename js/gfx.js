// Ferramentas de pixel art 32 bits: cores com rampas de luz/sombra, formas sombreadas e contorno seletivo.
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---------- cores ----------
export function rgb(hex) {
  if (typeof hex !== 'string') return [255, 0, 255];
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const hex = (r, g, b) => '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
export function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
export function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2; let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
export function ajusta(cor, { h = 0, s = 0, l = 0 } = {}) {
  const [hh, ss, ll] = rgb2hsl(...rgb(cor)); return hex(...hsl2rgb(hh + h, clamp(ss + s, 0, 1), clamp(ll + l, 0, 1)));
}
export function mistura(a, b, t) { const A = rgb(a), B = rgb(b); return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
export const escurece = (c, t = 0.3) => mistura(c, '#0d0a18', t);
export const clareia = (c, t = 0.3) => mistura(c, '#fff6e0', t);
export const alpha = (c, a) => { const [r, g, b] = rgb(c); return `rgba(${r},${g},${b},${a})`; };

// Rampa de 5 tons com sombras frias e luzes quentes (aspecto "pintado" dos jogos de 32 bits).
const cacheRampa = new Map();
export function rampa(cor) {
  if (cor && typeof cor === 'object') return cor; let r = cacheRampa.get(cor); if (r) return r;
  const [h, s, l] = rgb2hsl(...rgb(cor)); const sh = (dl, dh, ds) => hex(...hsl2rgb(h + dh, clamp(s + ds, 0, 1), clamp(l + dl, 0, 1)));
  const quente = h > 200 || h < 30 ? 0 : 1; void quente;
  r = { s2: sh(-0.30, 14, 0.03), s: sh(-0.15, 8, 0.02), b: hex(...rgb(cor)), h: sh(0.11, -7, 0.0), h2: sh(0.24, -12, -0.05) };
  cacheRampa.set(cor, r); return r;
}

// ---------- grade de pixels ----------
export class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.g = new Array(w * h).fill(null); }
  set(x, y, c) { x = Math.round(x); y = Math.round(y); if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y * this.w + x] = c; return this; }
  clr(x, y) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y * this.w + x] = null; return this; }
  get(x, y) { x = Math.round(x); y = Math.round(y); return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.g[y * this.w + x]; }
  // retângulo simples ou sombreado: 'v' (luz no topo), 'c' (cilindro: luz à esquerda), 'f' (chato)
  rect(x, y, w, h, c, modo = 'f') {
    if (!c) return this; const R = typeof c === 'string' ? rampa(c) : c;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      let t = R.b;
      if (modo === 'v') t = j === 0 ? R.h : j >= h - 1 ? R.s : R.b;
      else if (modo === 'c') { const nx = w <= 1 ? 0 : (i / (w - 1)) * 2 - 1; t = nx < -0.55 ? R.h : nx > 0.55 ? R.s : R.b; if (w >= 4 && i === w - 1) t = R.s2; if (j === h - 1 && h > 2) t = R.s; }
      else if (modo === 'cv') { const nx = w <= 1 ? 0 : (i / (w - 1)) * 2 - 1; t = nx < -0.5 ? R.h : nx > 0.5 ? R.s : R.b; if (j === 0) t = R.h; if (j === h - 1 && h > 1) t = R.s; if (w >= 4 && i === w - 1) t = R.s2; }
      this.set(x + i, y + j, t);
    }
    return this;
  }
  // esfera/elipse com luz vinda do alto à esquerda
  ell(cx, cy, rx, ry, c, luz = 1) {
    const R = typeof c === 'string' ? rampa(c) : c;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d2 = nx * nx + ny * ny; if (d2 > 1) continue;
      const nz = Math.sqrt(1 - d2); const t = (-nx * 0.45 - ny * 0.55 + nz * 0.7) * luz;
      this.set(x, y, t > 0.82 ? R.h2 : t > 0.58 ? R.h : t > 0.12 ? R.b : t > -0.25 ? R.s : R.s2);
    }
    return this;
  }
  // polígono preenchido com sombreamento por posição (claro em cima/esquerda)
  poly(pts, c, modo = 'g') {
    const R = typeof c === 'string' ? rampa(c) : c; let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (const [x, y] of pts) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
    const dentro = (px, py) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) ins = !ins; } return ins; };
    for (let y = Math.floor(miny); y <= Math.ceil(maxy); y++) for (let x = Math.floor(minx); x <= Math.ceil(maxx); x++) {
      if (!dentro(x + 0.5, y + 0.5)) continue; const u = (x - minx) / Math.max(1, maxx - minx), v = (y - miny) / Math.max(1, maxy - miny);
      let t = R.b; if (modo === 'g') { const k = u * 0.5 + v * 0.7; t = k < 0.22 ? R.h : k > 0.95 ? R.s : k > 0.7 ? R.s : R.b; if (k > 1.1) t = R.s2; } else if (modo === 'f') t = R.b;
      this.set(x, y, t);
    }
    return this;
  }
  line(x0, y0, x1, y1, c, esp = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n; this.set(x, y, c); if (esp > 1) { for (let k = 1; k < esp; k++) this.set(x + (Math.abs(x1 - x0) < Math.abs(y1 - y0) ? k : 0), y + (Math.abs(x1 - x0) >= Math.abs(y1 - y0) ? k : 0), c); } }
    return this;
  }
  // cobre apenas pixels ainda vazios (sombra por baixo) ou só onde já existe pixel (detalhe por cima)
  sobre(fn) { const t = new Pix(this.w, this.h); fn(t); for (let i = 0; i < t.g.length; i++) if (t.g[i] && this.g[i]) this.g[i] = t.g[i]; return this; }
  // contorno seletivo: cor do vizinho escurecida
  contorno(forca = 0.62, ext = true) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.g[y * this.w + x]) continue; let viz = null;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = this.get(x + dx, y + dy); if (v) { viz = v; break; } }
      if (viz) add.push([x, y, escurece(viz, forca)]);
    }
    for (const [x, y, c] of add) this.set(x, y, c); void ext; return this;
  }
  espelho() { const p = new Pix(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) p.g[y * this.w + (this.w - 1 - x)] = this.g[y * this.w + x]; return p; }
  cola(o, dx = 0, dy = 0) { for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) { const v = o.g[y * o.w + x]; if (v) this.set(x + dx, y + dy, v); } return this; }
  canvas() { const c = cv(this.w, this.h), x = c.getContext('2d'); for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) { const v = this.g[j * this.w + i]; if (v) { x.fillStyle = v; x.fillRect(i, j, 1, 1); } } return c; }
}

// ---------- ruído determinístico ----------
export function hash2(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function ruido2(x, y, s = 0) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0, s), b = hash2(x0 + 1, y0, s), c = hash2(x0, y0 + 1, s), d = hash2(x0 + 1, y0 + 1, s); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

// ---------- texto no canvas (já na escala da arte) ----------
export function texto(ctx, str, x, y, { cor = '#fff', borda = '#14101c', tam = 8, alinha = 'center', peso = '800' } = {}) {
  ctx.font = `${peso} ${tam}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`; ctx.textAlign = alinha; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (borda) { ctx.strokeStyle = borda; ctx.lineWidth = Math.max(2, tam / 3); ctx.strokeText(str, x, y); }
  ctx.fillStyle = cor; ctx.fillText(str, x, y);
}
// mascara de cor sobre um sprite (flash de dano)
const flashCache = new WeakMap();
export function flash(src, cor = '#ffffff') {
  let m = flashCache.get(src); if (!m) { m = {}; flashCache.set(src, m); } if (m[cor]) return m[cor];
  const c = cv(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = cor; x.fillRect(0, 0, c.width, c.height); return (m[cor] = c);
}
