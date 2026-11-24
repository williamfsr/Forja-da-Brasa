// Arte 8-bit gerada por código: tiles, heróis, NPCs e monstros em grades de 16×16 pixels.
import { mulberry32 } from './rules.js';
import { CAPAS } from './conteudo.js';

export const TS = 16;
const OUT = '#14101c';
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

class Pix {
  constructor(w = 16, h = 16) { this.w = w; this.h = h; this.g = new Array(w * h).fill(null); }
  set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y * this.w + x] = c; return this; }
  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.g[y * this.w + x]; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; }
  ell(cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1.05) this.set(x, y, c); } return this; }
  line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) this.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); return this; }
  tri(x0, y0, x1, y1, x2, y2, c) { const minx = Math.floor(Math.min(x0, x1, x2)), maxx = Math.ceil(Math.max(x0, x1, x2)), miny = Math.floor(Math.min(y0, y1, y2)), maxy = Math.ceil(Math.max(y0, y1, y2)); const s = (ax, ay, bx, by, px, py) => (px - bx) * (ay - by) - (ax - bx) * (py - by); for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) { const d1 = s(x0, y0, x1, y1, x, y), d2 = s(x1, y1, x2, y2, x, y), d3 = s(x2, y2, x0, y0, x, y); if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) this.set(x, y, c); } return this; }
  outline(c = OUT) { const add = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (!this.get(x, y)) { if (this.get(x + 1, y) || this.get(x - 1, y) || this.get(x, y + 1) || this.get(x, y - 1)) add.push([x, y]); } for (const [x, y] of add) this.set(x, y, c); return this; }
  mirror() { const p = new Pix(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) p.g[y * this.w + (this.w - 1 - x)] = this.g[y * this.w + x]; return p; }
  canvas(sc = 1) { const c = cv(this.w * sc, this.h * sc), x = c.getContext('2d'); for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) { const v = this.g[j * this.w + i]; if (v) { x.fillStyle = v; x.fillRect(i * sc, j * sc, sc, sc); } } return c; }
}

// ---------- Herói e NPCs ----------
const SKIN = '#f0c090', SKIN2 = '#c98f5f', BELT = '#5a3a22', BOOT = '#3a2616';
function corpo(p, dir, f, pal) {
  const { t, T, h, c, C } = pal; const passo = f ? 1 : 0;
  if (dir === 'cima' || dir === 'baixo') {
    if (dir === 'cima') p.rect(3, 8, 10, 6, c).rect(3, 13, 10, 1, C);
    // pernas
    p.rect(5, 13, 2, 2, BOOT).rect(9, 13, 2, 2, BOOT); if (passo) { p.rect(5, 14, 2, 1, null).rect(9, 13, 2, 1, null); p.rect(5, 13, 2, 1, BOOT).rect(9, 14, 2, 2, BOOT); }
    p.rect(4, 8, 8, 5, t).rect(4, 12, 8, 1, T).rect(4, 11, 8, 1, BELT).rect(7, 11, 2, 1, '#e0c040');
    p.rect(3, 8, 1, 4, t).rect(12, 8, 1, 4, t).set(3, 12, SKIN).set(12, 12, SKIN);
    if (dir === 'baixo') {
      p.rect(5, 2, 6, 6, SKIN).rect(5, 1, 6, 2, h).rect(4, 2, 1, 4, h).rect(11, 2, 1, 4, h).rect(5, 7, 6, 1, SKIN2);
      p.set(6, 5, OUT).set(9, 5, OUT).rect(5, 3, 6, 1, h);
    } else { p.rect(5, 2, 6, 6, h).rect(4, 2, 1, 5, h).rect(11, 2, 1, 5, h).rect(5, 1, 6, 1, h); }
  } else {
    p.rect(8, 8, 5, 5, c).rect(8, 12, 5, 1, C);
    p.rect(5, 13, 3, 2, BOOT); if (passo) { p.rect(7, 13, 3, 2, BOOT).rect(5, 13, 2, 2, null); p.rect(4, 14, 3, 1, BOOT); } else p.rect(8, 13, 3, 2, BOOT);
    p.rect(5, 8, 6, 5, t).rect(5, 12, 6, 1, T).rect(5, 11, 6, 1, BELT);
    p.rect(4, 9, 2, 3, t).set(4, 12, SKIN);
    p.rect(4, 2, 7, 6, SKIN).rect(5, 1, 7, 2, h).rect(8, 2, 3, 5, h).rect(4, 7, 7, 1, SKIN2); p.set(5, 5, OUT).set(3, 5, SKIN);
  }
  return p;
}
const heroCache = {};
export function spriteHeroi(cls, capaId = 'padrao', cores) {
  const key = cls + capaId; if (heroCache[key]) return heroCache[key];
  const cp = CAPAS[capaId] || CAPAS.padrao; const pal = { ...cores, c: cp.c, C: cp.C }; const out = {};
  for (const d of ['baixo', 'cima', 'esq']) out[d] = [0, 1].map((f) => corpo(new Pix(), d, f, pal).outline().canvas());
  out.dir = [0, 1].map((f) => corpo(new Pix(), 'esq', f, pal).outline().mirror().canvas());
  return (heroCache[key] = out);
}
const npcCache = {};
export function spriteNpc(id, pal) {
  if (npcCache[id]) return npcCache[id];
  const full = { t: '#888', T: '#555', h: '#333', c: '#444', C: '#222', ...pal };
  const mk = (f) => { const p = corpo(new Pix(), 'baixo', f, full); if (pal.chapeu) { p.rect(4, 0, 8, 2, pal.chapeu).rect(2, 2, 12, 1, pal.chapeu); } if (pal.barba) p.rect(5, 6, 6, 2, pal.barba); if (pal.crianca) { /* menor */ } return p.outline().canvas(); };
  return (npcCache[id] = [mk(0), mk(1)]);
}
export const NPC_PAL = {
  brasa: { t: '#8a5a3a', T: '#5a3a22', h: '#c05020', barba: '#c05020' }, ferrao: { t: '#c06a2a', T: '#7a3e10', h: '#1a1210' },
  aurora: { t: '#f0f0e0', T: '#b8b8a0', h: '#e0c060' }, eruvim: { t: '#3a5a9a', T: '#223a6a', h: '#e8e8f0', barba: '#e8e8f0', chapeu: '#3a5a9a' },
  tavi: { t: '#b0402a', T: '#702010', h: '#8a3a1e' }, lucia: { t: '#6a7a8a', T: '#3a4a5a', h: '#5a3a1e' }, quinzinho: { t: '#3a8a4a', T: '#1e5a2a', h: '#4a2a14', chapeu: '#3a8a4a' },
  alquimista: { t: '#7a3a9a', T: '#4a1e6a', h: '#d0d0e0', chapeu: '#7a3a9a' }, aldeao1: { t: '#8a8a3a', T: '#5a5a1e', h: '#6a4a2a' }, aldeao2: { t: '#d06aa0', T: '#8a3a68', h: '#e0a040' },
};

// ---------- Monstros ----------
const M = {
  rato: (p, c) => { p.ell(9, 10, 5, 3, c.a).rect(6, 12, 6, 1, c.l).ell(4, 9, 3, 2.5, c.a).set(1, 10, '#e08a8a').ell(5, 6, 1.6, 1.6, c.A).set(5, 6, '#e0a0a0').set(3, 8, c.e).set(2, 11, '#fff').line(14, 10, 15, 8, c.A).set(14, 7, c.A).rect(6, 13, 1, 2, c.A).rect(11, 13, 1, 2, c.A); },
  morcego: (p, c) => { p.tri(6, 7, 0, 3, 1, 10, c.A).tri(6, 7, 1, 10, 5, 11, c.A).tri(10, 7, 15, 3, 14, 10, c.A).tri(10, 7, 14, 10, 10, 11, c.A).ell(8, 8, 2.2, 3, c.a).ell(8, 5, 2.4, 2, c.a).set(6, 3, c.A).set(10, 3, c.A).set(7, 5, c.e).set(9, 5, c.e).set(7, 7, '#fff').set(9, 7, '#fff'); },
  limo: (p, c) => { p.ell(8, 10, 6.5, 5, c.l).rect(1, 11, 14, 3, c.l).ell(8, 10, 5.5, 4, c.a).rect(2, 12, 12, 2, c.a).rect(4, 8, 2, 3, '#fff').rect(10, 8, 2, 3, '#fff').set(5, 9, OUT).set(11, 9, OUT).rect(6, 12, 4, 1, c.A).set(4, 6, '#fff').set(5, 6, c.l); },
  goblin: (p, c) => { p.rect(5, 8, 6, 4, c.y || '#7a5a3a').rect(3, 8, 2, 3, c.a).rect(11, 8, 2, 3, c.a).rect(5, 12, 2, 3, c.A).rect(9, 12, 2, 3, c.A).ell(8, 5, 3.5, 3, c.a).tri(2, 4, 5, 3, 5, 6, c.a).tri(14, 4, 11, 3, 11, 6, c.a).set(6, 5, c.e).set(9, 5, c.e).rect(6, 7, 4, 1, '#fff').set(7, 7, c.A).set(9, 7, c.A).line(13, 5, 13, 11, '#d8dce8').set(13, 12, '#7a5a3a'); },
  humano: (p, c) => { p.rect(4, 8, 8, 5, c.u).rect(4, 12, 8, 1, c.U).rect(3, 8, 1, 4, c.u).rect(12, 8, 1, 4, c.u).set(3, 12, '#f0c090').set(12, 12, '#f0c090').rect(5, 13, 2, 2, '#3a2616').rect(9, 13, 2, 2, '#3a2616').rect(5, 2, 6, 6, '#f0c090').rect(5, 1, 6, 2, c.h || '#3a2a1a').set(6, 5, OUT).set(9, 5, OUT).line(14, 4, 14, 11, '#d8dce8').set(14, 12, '#7a5a3a').rect(4, 11, 8, 1, '#5a3a22'); },
  esqueleto: (p, c) => { p.ell(8, 4, 3.2, 3.2, c.e || '#e8e8f0').rect(6, 4, 1, 2, OUT).rect(9, 4, 1, 2, OUT).rect(6, 7, 4, 1, '#e8e8f0').set(7, 7, OUT).set(9, 7, OUT).rect(7, 8, 2, 4, '#e8e8f0').line(5, 9, 10, 9, '#e8e8f0').line(5, 10, 10, 10, '#d0d0e0').line(4, 8, 3, 12, '#e8e8f0').line(11, 8, 12, 12, '#e8e8f0').rect(6, 12, 1, 3, '#e8e8f0').rect(9, 12, 1, 3, '#e8e8f0').line(14, 4, 14, 12, '#a8b0c0').rect(13, 12, 3, 1, '#7a5a3a'); },
  zumbi: (p, c) => { p.rect(5, 8, 6, 5, c.u || '#5a6a4a').rect(1, 8, 5, 2, c.z || '#8aa07a').rect(10, 8, 5, 2, c.z || '#8aa07a').rect(5, 13, 2, 2, '#3a3a2a').rect(9, 13, 2, 2, '#3a3a2a').ell(8, 4, 3, 3, c.z || '#8aa07a').set(6, 4, '#c03030').set(9, 4, OUT).rect(6, 6, 4, 1, OUT).set(5, 9, c.Z || '#4a5a3a'); },
  lobo: (p, c) => { p.ell(9, 9, 5, 3, c.f || '#8a8a9a').ell(4, 7, 2.6, 2.3, c.f || '#8a8a9a').rect(0, 8, 3, 2, c.f || '#8a8a9a').tri(3, 3, 5, 5, 3, 5, c.F || '#5a5a6a').tri(6, 3, 7, 6, 5, 5, c.F || '#5a5a6a').set(3, 6, '#ffd23f').set(0, 8, OUT).set(1, 10, '#fff').rect(5, 12, 1, 3, c.F || '#5a5a6a').rect(7, 12, 1, 3, c.F || '#5a5a6a').rect(10, 12, 1, 3, c.F || '#5a5a6a').rect(12, 12, 1, 3, c.F || '#5a5a6a').line(14, 8, 15, 5, c.f || '#8a8a9a').rect(6, 11, 6, 1, c.F || '#5a5a6a'); },
  aranha: (p, c) => { const a = c.a || '#6a3a5a'; p.ell(9, 9, 3.4, 3, a).ell(5, 8, 2.2, 2, c.A || '#4a2440').set(4, 7, '#ff3030').set(6, 7, '#ff3030').set(4, 9, '#ff3030').set(6, 9, '#ff3030'); for (const [x, y] of [[7, 7], [8, 6], [10, 6], [11, 7]]) p.line(x, y, x - 1 + (x > 9 ? 4 : -2), y - 3, c.A || '#4a2440'); for (const [x, y] of [[7, 10], [8, 11], [10, 11], [11, 10]]) p.line(x, y, x + (x > 9 ? 4 : -4), y + 3, c.A || '#4a2440'); },
  bruto: (p, c) => { const b = c.b || '#6a9a4a', B = c.B || '#3a5a2a'; p.rect(3, 6, 10, 3, b).rect(4, 8, 8, 5, B).rect(0, 6, 3, 6, b).rect(13, 6, 3, 6, b).rect(5, 13, 2, 2, B).rect(9, 13, 2, 2, B).ell(8, 3, 2.7, 2.6, b).set(7, 3, '#ffd23f').set(9, 3, '#ffd23f').set(6, 5, '#fff').set(10, 5, '#fff').rect(7, 5, 3, 1, OUT).rect(14, 1, 2, 8, '#7a5a3a').rect(4, 11, 8, 1, '#5a3a22'); },
  fantasma: (p, c) => { const a = c.p || '#cfd8f0'; p.ell(8, 6, 4.2, 4, a).rect(4, 6, 9, 6, a); for (let x = 4; x <= 12; x++) p.set(x, 12 + (x % 2 ? 1 : 0), a); p.rect(6, 5, 1, 3, OUT).rect(10, 5, 1, 3, OUT).ell(8, 9, 1.1, 1.3, OUT).rect(2, 8, 2, 3, a).rect(13, 8, 2, 3, a).set(5, 3, '#ffffff'); },
  gargula: (p, c) => { const g = c.r || '#8a8a96', G = c.R || '#5a5a66'; p.tri(5, 7, 0, 2, 1, 10, G).tri(11, 7, 15, 2, 14, 10, G).rect(5, 6, 6, 6, g).ell(8, 4, 3, 2.5, g).tri(5, 1, 6, 3, 4, 3, G).tri(11, 1, 10, 3, 12, 3, G).set(6, 4, '#ff3030').set(9, 4, '#ff3030').rect(6, 6, 4, 1, '#fff').rect(5, 12, 2, 3, G).rect(9, 12, 2, 3, G); },
  dragao: (p, c) => { const d = c.d || '#c03a2a', D = c.D || '#701410'; p.tri(8, 8, 12, 0, 15, 8, D).line(12, 1, 11, 7, d).ell(8, 10, 5, 3, d).ell(8, 11, 3, 1.6, '#e8c070').rect(2, 5, 3, 6, d).ell(3, 4, 2.6, 2, d).rect(0, 4, 2, 2, d).set(3, 3, '#ffd23f').set(0, 5, '#fff').rect(5, 12, 2, 3, D).rect(10, 12, 2, 3, D).line(13, 11, 15, 13, d).set(15, 12, D).tri(2, 2, 3, 3, 1, 3, D); },
  golem: (p, c) => { const g = c.g || '#8a8a94', G = c.G || '#4a4a54'; p.rect(6, 2, 4, 3, g).rect(4, 5, 8, 6, g).rect(1, 5, 3, 7, G).rect(12, 5, 3, 7, G).rect(5, 11, 2, 4, G).rect(9, 11, 2, 4, G).set(7, 3, '#ffd23f').set(9, 3, '#ffd23f').line(6, 7, 8, 9, G).line(8, 9, 7, 11, G).rect(0, 11, 3, 2, g).rect(13, 11, 3, 2, g); },
  rei: (p, c) => { p.tri(8, 6, 2, 15, 14, 15, '#2a2640').rect(4, 8, 8, 7, '#2a2640').rect(5, 0, 6, 2, '#bfe8ff').set(5, 0, OUT).set(7, 0, OUT).set(9, 0, OUT).set(5, -1, '#bfe8ff').ell(8, 4, 3, 3, '#e8e8f0').rect(6, 4, 1, 2, '#6af0ff').rect(9, 4, 1, 2, '#6af0ff').rect(6, 7, 4, 1, '#e8e8f0').rect(7, 9, 2, 5, '#e8e8f0').line(14, 1, 14, 14, '#7a5a3a').ell(14, 1, 1.4, 1.4, '#6af0ff').line(5, 9, 11, 9, '#4a4670'); },
  serpe: (p, c) => { const s = c.s || '#5a8a3a', S = c.S || '#2e5a1e'; for (let x = 1; x <= 12; x++) { const y = 10 + Math.round(2.4 * Math.sin(x * 0.85)); p.rect(x, y, 1, 2, x % 3 ? s : S).rect(x, y + 1, 1, 1, S); } p.ell(13, 6, 2.4, 2, s).set(14, 5, '#ffd23f').set(15, 7, '#ff5050').set(13, 4, S); },
  vampiro: (p, c) => { const v = c.v || '#6a1a3a', V = c.V || '#2e0a18'; p.tri(8, 6, 0, 15, 16, 15, V).tri(8, 7, 3, 15, 13, 15, v).rect(5, 8, 6, 6, '#1a1020').rect(6, 8, 4, 2, '#e8e8f0').ell(8, 4, 3, 3, '#e8d8d8').rect(5, 1, 6, 2, '#1a1020').set(6, 4, '#ff3030').set(9, 4, '#ff3030').set(7, 6, '#fff').set(9, 6, '#fff').rect(3, 8, 2, 5, V).rect(11, 8, 2, 5, V); },
};
const monCache = {};
const claro = (hex) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.min(255, v + 70); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); };
export function spriteMonstro(spr, pal = {}) {
  const key = spr + JSON.stringify(pal); if (monCache[key]) return monCache[key];
  const defs = { rato: { a: '#8a7a6a', A: '#5a4a3a', l: '#b0a090', e: '#ff3030' }, morcego: { a: '#5a3a6a', A: '#3a2248', e: '#ff3030' }, limo: { a: '#4ac86a', A: '#2a8a44', l: '#9af0b0' }, goblin: { a: '#6aa83a', A: '#3a6a1e', e: '#ffd23f' }, esqueleto: {}, zumbi: {}, lobo: {}, aranha: { a: '#6a3a5a', A: '#4a2440' }, bruto: {}, fantasma: {}, gargula: {}, dragao: {}, golem: {}, rei: {}, serpe: {}, vampiro: {}, humano: { u: '#5a6a8a', U: '#34405a', h: '#3a2a1a' } };
  const c = { ...(defs[spr] || {}), ...pal }; if (spr === 'goblin' && pal.g) { c.a = pal.g; c.A = pal.G; } if (spr === 'limo' && pal.l) { c.a = pal.l; c.A = pal.L; c.l = claro(pal.l); } const p = new Pix(); (M[spr] || M.limo)(p, c); p.outline();
  return (monCache[key] = p.canvas());
}

// ---------- Tiles ----------
const T_ = {}; // atlas: id -> [frames canvases]
function tile(fn, frames = 1) { const out = []; for (let f = 0; f < frames; f++) { const p = new Pix(); fn(p, f, mulberry32(f * 997 + 13)); out.push(p.canvas()); } return out; }
function speck(p, r, base, cols, n) { p.rect(0, 0, 16, 16, base); for (let i = 0; i < n; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), cols[Math.floor(r() * cols.length)]); }
const TEMAS = {
  porao: ['#4a3a30', '#5a4a3c', '#2a2018', '#3a2c22'], caverna: ['#3e4452', '#4e5666', '#222832', '#2e3442'], cripta: ['#443e56', '#554e6a', '#26223a', '#352f4a'], floresta: ['#2f4a2c', '#3c5c38', '#1a2c18', '#243c22'],
  mina: ['#5a4630', '#6c5640', '#2e2418', '#44361f'], pantano: ['#30443a', '#3e5648', '#18261e', '#243428'], torre: ['#3c4666', '#4c5878', '#1e2640', '#2c3652'], abismo: ['#2c2440', '#3a3054', '#120e22', '#1e1832'],
  afundada: ['#24506a', '#316a86', '#0e2a3c', '#1a3c52'], forja: ['#5a3028', '#6e3e34', '#2c1410', '#44201a'], cemiterio: ['#3e4a40', '#4e5c50', '#1e2620', '#2e382f'], trono: ['#2a3454', '#3a466a', '#0e1428', '#1a2240'],
};
export function criarAtlas() {
  // exterior
  T_.grama = tile((p, f, r) => speck(p, r, '#3d8a3a', ['#4aa046', '#2f6f2e', '#58b050'], 22));
  T_.flor = tile((p, f, r) => { speck(p, r, '#3d8a3a', ['#4aa046', '#2f6f2e'], 14); for (let i = 0; i < 5; i++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 15); p.set(x, y, ['#ffffff', '#ffd23f', '#ff7ab0'][i % 3]); } });
  T_.terra = tile((p, f, r) => speck(p, r, '#b08a5a', ['#9a764a', '#c4a070', '#a28052'], 26));
  T_.praca = tile((p) => { p.rect(0, 0, 16, 16, '#9a9aa6'); for (let i = 0; i < 16; i += 8) { p.rect(0, i, 16, 1, '#7a7a88'); p.rect(i, 0, 1, 16, '#7a7a88'); } p.set(3, 3, '#b0b0bc').set(11, 11, '#b0b0bc'); });
  T_.agua = tile((p, f, r) => { p.rect(0, 0, 16, 16, '#2a62c8'); for (let i = 0; i < 6; i++) { const x = (i * 5 + f * 3) % 16, y = (i * 7) % 16; p.rect(x, y, 3, 1, '#5a92e8'); } }, 2);
  T_.arvore = tile((p, f, r) => { speck(p, mulberry32(5), '#3d8a3a', ['#4aa046', '#2f6f2e'], 14); p.rect(7, 10, 2, 5, '#6a4426').ell(8, 6, 6.3, 5.4, '#1f6a2a').ell(7, 5, 4, 3.4, '#2a8a36').set(5, 4, '#58b050').set(9, 3, '#58b050').set(11, 7, '#175a22'); });
  T_.arvoreFixa = T_.arvore;
  T_.telhado = tile((p) => { p.rect(0, 0, 16, 16, '#b0402a'); for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, '#702010'); for (let x = (y / 4) % 2 ? 4 : 0; x < 16; x += 8) p.rect(x, y, 1, 3, '#702010'); } p.rect(0, 0, 16, 1, '#d05a40'); });
  T_.telhadoAz = tile((p) => { p.rect(0, 0, 16, 16, '#3a5ab0'); for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, '#1e3070'); for (let x = (y / 4) % 2 ? 4 : 0; x < 16; x += 8) p.rect(x, y, 1, 3, '#1e3070'); } p.rect(0, 0, 16, 1, '#5a7ae0'); });
  T_.telhadoVd = tile((p) => { p.rect(0, 0, 16, 16, '#3a8a4a'); for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, '#1e5a2a'); for (let x = (y / 4) % 2 ? 4 : 0; x < 16; x += 8) p.rect(x, y, 1, 3, '#1e5a2a'); } p.rect(0, 0, 16, 1, '#5aaa6a'); });
  T_.parede = tile((p) => { p.rect(0, 0, 16, 16, '#d8c8a0'); p.rect(0, 0, 16, 2, '#6a4a2a').rect(0, 14, 16, 2, '#6a4a2a').rect(0, 0, 2, 16, '#6a4a2a').rect(14, 0, 2, 16, '#6a4a2a'); p.rect(4, 4, 8, 6, '#6ab0e0').rect(4, 4, 8, 1, '#8ac8f0').rect(7, 4, 2, 6, '#6a4a2a').rect(4, 7, 8, 1, '#6a4a2a'); });
  T_.paredeLisa = tile((p) => { p.rect(0, 0, 16, 16, '#d8c8a0'); p.rect(0, 14, 16, 2, '#6a4a2a'); p.rect(7, 0, 2, 14, '#c0b088'); });
  T_.porta = tile((p) => { p.rect(0, 0, 16, 16, '#d8c8a0'); p.rect(2, 1, 12, 15, '#6a4a2a').rect(3, 2, 10, 14, '#8a5a30').rect(7, 2, 2, 14, '#6a4a2a').set(10, 9, '#ffd23f').set(5, 9, '#ffd23f').rect(0, 15, 16, 1, '#4a3018'); });
  T_.cerca = tile((p, f, r) => { speck(p, mulberry32(5), '#3d8a3a', ['#4aa046', '#2f6f2e'], 14); p.rect(1, 5, 3, 9, '#8a6a42').rect(12, 5, 3, 9, '#8a6a42').rect(0, 7, 16, 2, '#a07a4c').rect(0, 11, 16, 2, '#a07a4c'); });
  T_.braseiro = tile((p, f) => { speck(p, mulberry32(7), '#9a9aa6', ['#7a7a88'], 5); p.rect(4, 9, 8, 6, '#4a4a56').rect(3, 8, 10, 2, '#6a6a76').ell(8, 6 - f, 3, 3.5 + f * 0.5, '#ff7a1a').ell(8, 7 - f, 1.8, 2.5, '#ffd23f').set(5, 4 + f, '#ff5a1a').set(11, 5, '#ff5a1a'); }, 2);
  T_.placa = tile((p) => { speck(p, mulberry32(5), '#3d8a3a', ['#4aa046', '#2f6f2e'], 14); p.rect(7, 8, 2, 7, '#6a4426').rect(2, 2, 12, 7, '#a07a4c').rect(2, 2, 12, 1, '#c09a6c').rect(4, 4, 8, 1, '#5a3a22').rect(4, 6, 6, 1, '#5a3a22'); });
  T_.bigorna = tile((p) => { speck(p, mulberry32(7), '#b08a5a', ['#9a764a'], 6); p.rect(3, 5, 10, 3, '#5a5a66').rect(5, 8, 6, 3, '#4a4a56').rect(4, 11, 8, 3, '#3a3a46').rect(2, 5, 2, 2, '#5a5a66').set(6, 5, '#9a9aa6'); });
  T_.barril = tile((p) => { speck(p, mulberry32(5), '#b08a5a', ['#9a764a'], 8); p.ell(8, 8, 5, 6, '#8a5a30').rect(3, 5, 10, 1, '#4a3018').rect(3, 11, 10, 1, '#4a3018').rect(5, 3, 1, 10, '#a0703c'); });
  T_.tenda = tile((p) => { p.rect(0, 0, 16, 16, '#e8e0c8'); for (let x = 0; x < 16; x += 4) p.rect(x, 0, 2, 10, '#c03a3a'); p.rect(0, 10, 16, 2, '#7a2020').rect(0, 12, 16, 4, '#8a6a42'); p.rect(2, 12, 3, 3, '#e0b040').rect(7, 12, 3, 3, '#4a9ae0').rect(12, 12, 2, 3, '#c0c0c8'); });
  T_.poco = tile((p) => { speck(p, mulberry32(5), '#3d8a3a', ['#4aa046'], 12); p.ell(8, 9, 6, 5, '#7a7a88').ell(8, 9, 4, 3, '#1a2a4a').rect(4, 2, 1, 5, '#6a4426').rect(11, 2, 1, 5, '#6a4426').rect(3, 2, 10, 2, '#a02a2a'); });
  T_.estrada = tile((p, f, r) => { speck(p, r, '#c8a874', ['#b89864', '#d8b884', '#a88854'], 18); p.rect(0, 0, 16, 1, '#b89864').rect(0, 15, 16, 1, '#b89864'); });
  T_.casinha = tile((p) => { speck(p, mulberry32(5), '#3d8a3a', ['#4aa046', '#2f6f2e'], 12); p.rect(3, 7, 10, 7, '#d8c8a0').tri(8, 1, 1, 8, 15, 8, '#b0402a').rect(7, 10, 3, 4, '#6a4a2a').rect(4, 9, 2, 2, '#6ab0e0').rect(11, 9, 1, 2, '#6ab0e0').rect(11, 2, 2, 4, '#7a7a88').outline(); });
  T_.caminho = T_.estrada;
  // masmorra por tema
  for (const [tema, [piso, piso2, par, par2]] of Object.entries(TEMAS)) {
    T_['piso_' + tema] = tile((p, f, r) => speck(p, r, piso, [piso2, par2], 18));
    T_['parede_' + tema] = tile((p) => { p.rect(0, 0, 16, 16, par); for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, par2 === par ? '#000' : '#00000066'); for (let x = (y / 4) % 2 ? 0 : 4; x < 16; x += 8) p.rect(x, y, 1, 3, '#00000044'); } p.rect(0, 0, 16, 1, par2); p.rect(0, 4, 16, 1, par2); });
  }
  T_.desce = tile((p) => { p.rect(0, 0, 16, 16, '#2a2438'); for (let i = 0; i < 4; i++) p.rect(1 + i, 2 + i * 3, 14 - i * 2, 3, ['#6a6480', '#544e6a', '#3e3a52', '#2c2840'][i]); p.rect(6, 12, 4, 2, '#ffd23f'); p.set(7, 11, '#ffd23f').set(8, 11, '#ffd23f'); });
  T_.sobe = tile((p) => { p.rect(0, 0, 16, 16, '#2a2438'); for (let i = 0; i < 4; i++) p.rect(1 + i, 2 + (3 - i) * 3, 14 - i * 2, 3, ['#6a6480', '#544e6a', '#3e3a52', '#2c2840'][3 - i]); p.rect(6, 2, 4, 2, '#6af0ff'); });
  T_.saida = tile((p, f) => { p.rect(0, 0, 16, 16, '#101020'); p.ell(8, 8, 6, 7, '#6a3ae0').ell(8, 8, 4, 5, f ? '#a07af0' : '#8a5af0').ell(8, 8, 2, 3, '#fff'); }, 2);
  T_.bauF = tile((p) => { p.rect(2, 6, 12, 8, '#8a5a30').rect(2, 4, 12, 3, '#a06a38').rect(2, 8, 12, 1, '#3a2616').rect(7, 7, 2, 3, '#ffd23f').rect(2, 4, 12, 1, '#c08a50').rect(1, 6, 1, 8, '#3a2616').rect(14, 6, 1, 8, '#3a2616').outline(); });
  T_.bauA = tile((p) => { p.rect(2, 8, 12, 6, '#8a5a30').rect(2, 8, 12, 1, '#3a2616').rect(3, 3, 10, 3, '#a06a38').rect(3, 6, 10, 2, '#f0c040').set(6, 5, '#fff').set(10, 4, '#fff').outline(); });
  T_.armadilha = tile((p) => { for (const [x, y] of [[3, 4], [8, 3], [12, 5], [5, 9], [10, 10], [7, 13]]) p.tri(x, y - 2, x - 1, y + 1, x + 1, y + 1, '#c0c0d0'); });
  T_.santuario = tile((p, f) => { p.rect(4, 11, 8, 3, '#7a7a88').rect(5, 6, 6, 5, '#a0a0b0').ell(8, 4, 2.4, 2.4, '#a0a0b0'); p.ell(8, 2, 2 + f, 2 + f, '#6af0ff').set(8, 2, '#fff'); p.outline(); }, 2);
  T_.tochaCx = tile((p, f) => { p.rect(7, 6, 2, 8, '#6a4426').ell(8, 3 - f, 2, 3, '#ff7a1a').ell(8, 4 - f, 1, 2, '#ffd23f').outline(); }, 2);
  T_.nevoa = tile((p, f, r) => { p.rect(0, 0, 16, 16, '#0a0812'); });
  // mundo aberto
  T_.montanha = tile((p, f, r) => { speck(p, r, '#7a7a86', ['#6a6a76', '#8a8a96'], 10); p.tri(8, 1, 1, 15, 15, 15, '#5a5a66').tri(8, 1, 8, 15, 15, 15, '#4a4a56').tri(8, 1, 6, 6, 10, 6, '#f0f0f8'); });
  T_.pinheiro = tile((p) => { speck(p, mulberry32(5), '#2f6f2e', ['#245a24', '#3c8a3c'], 14); p.rect(7, 12, 2, 3, '#4a3018').tri(8, 1, 2, 11, 14, 11, '#1a5a2a').tri(8, 4, 3, 13, 13, 13, '#226a32').set(8, 2, '#f0f0f8'); });
  T_.pantano = tile((p, f, r) => { p.rect(0, 0, 16, 16, '#2a4a3a'); for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#3a6a4a'); p.line(3, 12, 3, 7, '#7a8a3a').line(12, 14, 12, 9, '#7a8a3a').set(3, 6, '#6a4a2a').set(12, 8, '#6a4a2a'); });
  T_.areia = tile((p, f, r) => speck(p, r, '#d8c080', ['#c8b070', '#e8d090'], 20));
  T_.neve = tile((p, f, r) => speck(p, r, '#e8f0f8', ['#c8d8e8', '#ffffff'], 16));
  T_.lava = tile((p, f) => { p.rect(0, 0, 16, 16, '#a02a10'); for (let i = 0; i < 6; i++) p.rect((i * 5 + f * 4) % 16, (i * 7) % 16, 3, 1, '#ff7a1a'); }, 2);
  T_.nuvem = tile((p, f, r) => { p.rect(0, 0, 16, 16, '#1c1830'); for (let i = 0; i < 20; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#2c2848'); p.ell(8, 8, 6, 4, '#2a2644'); });
  T_.caverna = tile((p) => { speck(p, mulberry32(7), '#7a7a86', ['#6a6a76'], 8); p.ell(8, 9, 7, 7, '#5a5a66').ell(8, 10, 5, 6, '#14101c').rect(3, 14, 10, 2, '#14101c'); p.set(8, 5, '#ffd23f'); });
  T_.cavernaLiv = tile((p, f) => { speck(p, mulberry32(7), '#7a7a86', ['#6a6a76'], 8); p.ell(8, 9, 7, 7, '#5a5a66').ell(8, 10, 5, 6, '#3a1a5a').rect(3, 14, 10, 2, '#3a1a5a'); p.ell(8, 11, 2 + f, 3, '#a07af0'); }, 2);
  T_.ponte = tile((p) => { p.rect(0, 0, 16, 16, '#2a62c8'); p.rect(0, 2, 16, 12, '#a07a4c'); for (let x = 1; x < 16; x += 4) p.rect(x, 2, 1, 12, '#6a4a2a'); p.rect(0, 2, 16, 1, '#6a4a2a').rect(0, 13, 16, 1, '#6a4a2a'); });
  T_.rocha = tile((p, f, r) => { speck(p, mulberry32(5), '#3d8a3a', ['#4aa046', '#2f6f2e'], 12); p.ell(8, 10, 5, 4, '#7a7a86').ell(7, 9, 3, 2, '#9a9aa6').outline(); });
  T_.bau_mundo = T_.bauF;
  return T_;
}
export function tileCanvas(id, frame = 0) { const t = T_[id]; if (!t) return null; return t[frame % t.length]; }
export const temaPalavras = Object.keys(TEMAS);
export function corTema(tema) { return (TEMAS[tema] || TEMAS.porao)[2]; }

// ---------- Fonte de pixels 3×5 ----------
const FONTE = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
  '-': '000000111000000', '+': '000010111010000', '!': '010010010000010', '.': '000000000000010', ',': '000000000010100', ':': '000010000010000', '?': '110001010000010', '/': '001001010100100', '%': '101001010100101', "'": '010010000000000', ' ': '000000000000000',
};
const semAcento = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
export const larguraTexto = (txt) => semAcento(txt).length * 4 - 1;
export function textoPixel(ctx, txt, x, y, cor = '#fff', sombra = '#000', alinha = 'esq') {
  const t = semAcento(txt); const larg = t.length * 4 - 1; if (alinha === 'centro') x = Math.round(x - larg / 2); else if (alinha === 'dir') x -= larg;
  const desenha = (ox, oy, c) => { ctx.fillStyle = c; let cx = x + ox; for (const ch of t) { const g = FONTE[ch]; if (g) { for (let i = 0; i < 15; i++) if (g[i] === '1') ctx.fillRect(cx + (i % 3), y + oy + Math.floor(i / 3), 1, 1); } cx += 4; } };
  if (sombra) { desenha(1, 1, sombra); } desenha(0, 0, cor);
}
export const numeroPixel = textoPixel;
