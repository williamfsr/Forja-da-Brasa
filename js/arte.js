// Cenários em 32 bits: texturas de chão sem emenda, transições suaves entre terrenos, paredes, luz e partículas.
import { Pix, rampa, mistura, escurece, clareia, hash2, clamp, cv } from './gfx.js';
import * as O from './objetos.js';
import * as TD from './topdown.js';

export const TS = 32;
const per = (x, y, p, s) => { const w = (i) => ((i % p) + p) % p; const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); const a = hash2(w(x0), w(y0), s), b = hash2(w(x0 + 1), w(y0), s), c = hash2(w(x0), w(y0 + 1), s), d = hash2(w(x0 + 1), w(y0 + 1), s); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
const mk = (fn) => { const p = new Pix(32, 32); fn(p); return p; };
// textura contínua com clusters de tom
function chaoBase(cor, v, seed, o = {}) {
  const R = rampa(cor); const esc = o.esc || 4; const lo = o.lo ?? 0.3, hi = o.hi ?? 0.68, top = o.top ?? 0.92;
  return mk((p) => { for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const n = per(x / 32 * esc + v * 3.1, y / 32 * esc + v * 1.7, esc, seed + v) * 0.62 + per(x / 32 * esc * 2, y / 32 * esc * 2, esc * 2, seed + 9 + v) * 0.3 + hash2(x, y, seed + v) * 0.08; p.set(x, y, n < lo - 0.1 ? R.s2 : n < lo ? R.s : n < hi ? R.b : n < top ? R.h : R.h2); } });
}
function grama(v, flores) {
  const p = chaoBase('#41903e', v, 11, { esc: 3, lo: 0.27, hi: 0.7, top: 0.93 }); const R = rampa('#3f8c3c'); const n = 9 + v;
  for (let i = 0; i < n; i++) { const x = Math.floor(hash2(i, v, 21) * 30) + 1, y = Math.floor(hash2(i, v, 22) * 28) + 3; const t = hash2(i, v, 23); p.set(x, y, R.h); p.set(x, y - 1, t > 0.5 ? R.h2 : R.h); if (t > 0.8) { p.set(x + 1, y - 1, R.h); } }
  if (flores) for (let i = 0; i < 5; i++) { const x = 3 + Math.floor(hash2(i, v, 31) * 26), y = 4 + Math.floor(hash2(i, v, 32) * 24); const c = ['#ffffff', '#ffd23f', '#ff7ab0', '#a07af0', '#ff8a3a'][(i + v) % 5]; p.set(x, y, c); p.set(x + 1, y, c); p.set(x, y - 1, c); p.set(x - 1, y, c); p.set(x, y + 1, c); p.set(x, y, '#fff2a0'); p.set(x, y + 2, R.s2); }
  return p;
}
function terra(v, cor = '#b08a5a', pedras = true) {
  const p = chaoBase(cor, v, 41, { esc: 5, lo: 0.36, hi: 0.64, top: 0.9 }); const R = rampa(cor);
  if (pedras) for (let i = 0; i < 7; i++) { const x = 2 + Math.floor(hash2(i, v, 42) * 27), y = 2 + Math.floor(hash2(i, v, 43) * 27), w = 2 + Math.floor(hash2(i, v, 44) * 3); p.rect(x, y, w, 1, R.h2); p.rect(x, y + 1, w, 1, R.s2); p.set(x + w, y + 1, R.s); }
  return p;
}
function praca(v) { const p = new Pix(32, 32); const base = ['#9a9aa8', '#a4a4b2', '#92929f', '#a0a0ac']; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const off = j % 2 ? 8 : 0; void off; const c = base[(i + j * 2 + v) % 4]; const R = rampa(c); const x = i * 16, y = j * 16; p.rect(x, y, 16, 16, R.b); p.rect(x, y, 16, 1, R.h); p.rect(x, y, 1, 16, R.h); p.rect(x, y + 15, 16, 1, R.s2); p.rect(x + 15, y, 1, 16, R.s2); for (let k = 0; k < 8; k++) p.set(x + 2 + hash2(k, i + j * 5 + v, 61) * 11, y + 2 + hash2(k, i + j * 5 + v, 62) * 11, k % 2 ? R.h : R.s); } return p; }
function agua(v) { const R = rampa('#2f6fd0'); const p = new Pix(32, 32); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const n = per(x / 32 * 3 + v, y / 32 * 5, 3, 51) * 0.7 + per(x / 32 * 6, y / 32 * 9 + v, 6, 52) * 0.3; p.set(x, y, n < 0.32 ? R.s2 : n < 0.46 ? R.s : n < 0.7 ? R.b : R.h); } for (let i = 0; i < 4; i++) { const x = Math.floor(hash2(i, v, 53) * 24), y = Math.floor(hash2(i, v, 54) * 30); p.rect(x, y, 5 + (i % 3) * 2, 1, R.h2); p.rect(x + 2, y + 1, 3, 1, R.h); } return p; }
function areia(v) { const p = chaoBase('#dcc486', v, 71, { esc: 3, lo: 0.4, hi: 0.62, top: 0.88 }); const R = rampa('#dcc486'); for (let r = 0; r < 4; r++) { const y0 = 4 + r * 8 + v; for (let x = 0; x < 32; x++) p.set(x, (y0 + Math.round(Math.sin(x * 0.4 + r * 2) * 1.2)) & 31, R.s); } for (let i = 0; i < 5; i++) p.set(hash2(i, v, 72) * 32, hash2(i, v, 73) * 32, R.h2); return p; }
function neve(v) { const p = chaoBase('#e8f0fa', v, 81, { esc: 3, lo: 0.34, hi: 0.7, top: 0.94 }); for (let i = 0; i < 6; i++) { const x = hash2(i, v, 82) * 30, y = hash2(i, v, 83) * 30; p.set(x, y, '#ffffff'); p.set(x + 1, y, '#c8dcf4'); } return p; }
function pantano(v) { const p = chaoBase('#2e4a3a', v, 91, { esc: 4, lo: 0.34, hi: 0.66, top: 0.9 }); for (let i = 0; i < 3; i++) { const x = 3 + Math.floor(hash2(i, v, 92) * 22), y = 4 + Math.floor(hash2(i, v, 93) * 22); p.ell(x + 3, y + 2, 3.4, 2.2, '#1e4a52'); p.set(x + 2, y + 1, '#4a8a8a'); } for (let i = 0; i < 4; i++) { const x = 2 + Math.floor(hash2(i, v, 94) * 28), y = 8 + Math.floor(hash2(i, v, 95) * 20); p.line(x, y, x, y - 5, '#8a9a3a'); p.set(x, y - 6, '#6a4a2a'); } return p; }
function nuvem(v) { return chaoBase('#241f3c', v, 101, { esc: 3, lo: 0.4, hi: 0.62, top: 0.88 }); }
function lava(v) { const R = rampa('#c0350f'); const p = new Pix(32, 32); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const n = per(x / 32 * 4 + v, y / 32 * 4, 4, 111) * 0.7 + per(x / 32 * 8, y / 32 * 8 + v, 8, 112) * 0.3; p.set(x, y, n < 0.3 ? '#5a1408' : n < 0.45 ? R.s : n < 0.7 ? R.b : n < 0.85 ? '#ff7a1a' : '#ffd23f'); } return p; }
function rochaChao(v) { const p = chaoBase('#7a7686', v, 121, { esc: 4, lo: 0.36, hi: 0.66, top: 0.9 }); for (let i = 0; i < 3; i++) { const x = hash2(i, v, 122) * 24, y = hash2(i, v, 123) * 24; p.line(x, y, x + 5, y + 4, '#4a465a'); p.line(x + 5, y + 4, x + 4, y + 9, '#4a465a'); } return p; }
function estrada(v) { const p = terra(v, '#c4a46e', false); const R = rampa('#c4a46e'); for (let i = 0; i < 9; i++) { const x = 1 + Math.floor(hash2(i, v, 131) * 29), y = 1 + Math.floor(hash2(i, v, 132) * 29); p.set(x, y, R.h2); p.set(x + 1, y, R.h); p.set(x + 1, y + 1, R.s2); } return p; }
function ponte(v) { const p = new Pix(32, 32); p.rect(0, 0, 32, 32, '#6a4a2a'); for (let i = 0; i < 4; i++) { const y = i * 8; p.rect(0, y, 32, 7, ['#a47a4c', '#9a7044', '#ae8454', '#a07648'][(i + v) % 4], 'v'); p.rect(0, y + 7, 32, 1, '#3a2814'); for (const x of [3, 29]) p.set(x, y + 3, '#2a1a0a'); } p.rect(0, 0, 2, 32, '#3a2814'); p.rect(30, 0, 2, 32, '#3a2814'); return p; }

export const AGRUPA = { grama: 'grama', flor: 'grama', terra: 'terra', estrada: 'estrada', caminho: 'estrada', praca: 'praca', agua: 'agua', areia: 'areia', neve: 'neve', pantano: 'pantano', nuvem: 'nuvem', lava: 'lava', ponte: 'ponte', montanha: 'rochaChao', rocha: 'rochaChao' };
const GER = { grama: (v, f) => grama(v, false), flor: (v) => grama(v, true), terra: (v) => terra(v), estrada: (v) => estrada(v), praca: (v) => praca(v), agua: (v) => agua(v), areia: (v) => areia(v), neve: (v) => neve(v), pantano: (v) => pantano(v), nuvem: (v) => nuvem(v), lava: (v) => lava(v), ponte: (v) => ponte(v), rochaChao: (v) => rochaChao(v) };
// prioridade de "sangramento" (maior cobre o menor)
const PRI = { agua: 0, lava: 1, nuvem: 2, pantano: 3, areia: 4, neve: 5, rochaChao: 6, terra: 7, estrada: 7.5, grama: 8, flor: 8, praca: 99, ponte: 99 };
const RIM = { agua: { grama: '#2a6a3a', terra: '#5a4a30', areia: '#e8d8a0', neve: '#cfe8f8', rochaChao: '#5a566a', estrada: '#6a5a3a', pantano: '#1e3a30' }, lava: { terra: '#2a1008', rochaChao: '#2a1008', grama: '#2a3a20' } };

const texCache = new Map();
export function texChao(id, v = 0) { const g = AGRUPA[id] || id; const k = g + v; let c = texCache.get(k); if (c) return c; const fn = GER[g] || GER.grama; c = fn(v, false).canvas(); if (id === 'flor') c = GER.flor(v).canvas(); texCache.set(k, c); return c; }
const texFlor = (id, v) => (id === 'flor' ? texChao('flor', v) : texChao(id, v));

// máscaras de borda (ragged) por lado e variante
const mascaras = new Map();
function mascara(lado, mv, forca) { const k = lado + mv + forca; let m = mascaras.get(k); if (m) return m; const c = cv(32, 32), x = c.getContext('2d'), im = x.createImageData(32, 32); for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) { let u, t; if (lado === 'n') { u = i; t = j; } else if (lado === 's') { u = i; t = 31 - j; } else if (lado === 'w') { u = j; t = i; } else if (lado === 'e') { u = j; t = 31 - i; } else { const dx = lado[1] === 'w' ? i : 31 - i, dy = lado[0] === 'n' ? j : 31 - j; const d = Math.hypot(dx, dy); const lim = (forca + 3) + (per(i / 8, j / 8, 4, 140 + mv) - 0.5) * 6; im.data[(j * 32 + i) * 4 + 3] = d < lim ? 255 : 0; im.data[(j * 32 + i) * 4] = 255; continue; } const lim = forca + (per(u / 32 * 4 + mv * 2, 1 + mv, 4, 150 + mv) - 0.5) * forca * 1.4 + (hash2(u, mv, 3) - 0.5) * 1.5; im.data[(j * 32 + i) * 4 + 3] = t < lim ? 255 : 0; im.data[(j * 32 + i) * 4] = 255; if (Math.abs(t - lim) < 1) im.data[(j * 32 + i) * 4] = 254; } x.putImageData(im, 0, 0); mascaras.set(k, c); return c; }
const bordaCache = new Map();
function borda(Bid, lado, mv, tv, forca) { const k = Bid + lado + mv + tv + forca; let c = bordaCache.get(k); if (c) return c; c = cv(32, 32); const x = c.getContext('2d'); x.drawImage(texFlor(Bid, tv), 0, 0); x.globalCompositeOperation = 'destination-in'; x.drawImage(mascara(lado, mv, forca), 0, 0); bordaCache.set(k, c); return c; }

// ---------- mapas externos (vila e vale): chão assado ----------
const CHAO_IDS = new Set(['grama', 'flor', 'terra', 'estrada', 'caminho', 'praca', 'agua', 'areia', 'neve', 'pantano', 'nuvem', 'lava', 'ponte', 'piso', 'pisoPedra', 'pisoMarm', 'pisoEscuro', 'pisoTerra', 'tapete']);
const INT_PAREDES = new Set(['paredeI', 'paredeP', 'janela']);
const OBJ_ALTOS = new Set(['arvore', 'pinheiro', 'montanha', 'rocha', 'placa', 'barril', 'bigorna', 'braseiro', 'poco', 'tenda', 'cerca', 'casinha', 'caverna', 'cavernaLiv', 'saida', 'arvoreFixa', 'bau_mundo', 'bauF', 'bauA', 'muro', 'torreT', ...TD.MOBILIA_TIPOS]);
const PREDIO_IDS = new Set([...TD.TELHADOS, 'parede', 'paredeLisa', 'porta']);
const objCache = new Map();
export const ehObjeto = (id) => OBJ_ALTOS.has(id);
function tipoChao(m, x, y, pad = 'grama') {
  const id = m.g[y * m.w + x]; if (CHAO_IDS.has(id)) return id;
  // objeto: herda o terreno predominante em volta
  const cont = {}; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= m.w || yy >= m.h) continue; const t = m.g[yy * m.w + xx]; if (CHAO_IDS.has(t) && t !== 'agua' && t !== 'lava' && t !== 'ponte') cont[t] = (cont[t] || 0) + 1; }
  let b = pad, n = 0; for (const [t, c] of Object.entries(cont)) if (c > n) { n = c; b = t; } if (id === 'montanha' || id === 'rocha' && b === 'terra') return id === 'montanha' ? 'montanha' : b; return b;
}
export function assarExterno(m, opcoes = {}) {
  const W = m.w * TS, H = m.h * TS, c = cv(W, H), x = c.getContext('2d'); x.imageSmoothingEnabled = false; const grupo = (id) => AGRUPA[id] || id;
  const base = new Array(m.w * m.h); for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) base[j * m.w + i] = tipoChao(m, i, j);
  const at = (i, j) => (i < 0 || j < 0 || i >= m.w || j >= m.h ? null : base[j * m.w + i]);
  for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
    const t = base[j * m.w + i], g = grupo(t), v = Math.floor(hash2(i, j, 7) * 4); const px = i * TS, py = j * TS; const id = m.g[j * m.w + i];
    if (PREDIO_IDS.has(id)) { x.drawImage(texChao('grama', v), px, py); continue; }
    if (id === 'portaI') { x.drawImage(TD.pisoInt('piso', 0), px, py); x.drawImage(TD.porta(), px, py); continue; }
    if (INT_PAREDES.has(id)) { const W = (a, b) => { if (a < 0 || b < 0 || a >= m.w || b >= m.h) return true; return INT_PAREDES.has(m.g[b * m.w + a]); }; const viz = { n: W(i, j - 1), s: W(i, j + 1), w: W(i - 1, j), e: W(i + 1, j) }; const kk = `pi${id}${viz.n ? 1 : 0}${viz.s ? 1 : 0}${viz.w ? 1 : 0}${viz.e ? 1 : 0}`; let im = objCache.get(kk); if (!im) { im = id === 'janela' ? TD.janelaInt() : TD.paredeInt(viz, id === 'paredeP' ? 'pedra' : 'madeira'); objCache.set(kk, im); } x.drawImage(im, px, py); continue; }
    if (TD.PISOS[t] || id === 'tapete') { const vi = id === 'tapete' ? (() => { const E = (a, b) => a >= 0 && b >= 0 && a < m.w && b < m.h && m.g[b * m.w + a] === 'tapete'; return { n: E(i, j - 1), s: E(i, j + 1), w: E(i - 1, j), e: E(i + 1, j) }; })() : null; const kk = `pt${t}${v % 2}${vi ? `${vi.n ? 1 : 0}${vi.s ? 1 : 0}${vi.w ? 1 : 0}${vi.e ? 1 : 0}${m.tapeteCor || ''}` : ''}`; let im = objCache.get(kk); if (!im) { im = vi ? TD.tapete(vi, m.tapeteCor || '#a83a3a') : TD.pisoInt(t, v % 2); objCache.set(kk, im); } x.drawImage(im, px, py);
      const eP = (a, b) => a < 0 || b < 0 || a >= m.w || b >= m.h || INT_PAREDES.has(m.g[b * m.w + a]);
      if (eP(i, j - 1)) { const g = x.createLinearGradient(0, py, 0, py + 10); g.addColorStop(0, 'rgba(8,6,16,0.5)'); g.addColorStop(1, 'rgba(8,6,16,0)'); x.fillStyle = g; x.fillRect(px, py, 32, 10); }
      if (eP(i - 1, j)) { const g = x.createLinearGradient(px, 0, px + 8, 0); g.addColorStop(0, 'rgba(8,6,16,0.4)'); g.addColorStop(1, 'rgba(8,6,16,0)'); x.fillStyle = g; x.fillRect(px, py, 8, 32); }
      if (eP(i + 1, j)) { const g = x.createLinearGradient(px + 32, 0, px + 24, 0); g.addColorStop(0, 'rgba(8,6,16,0.4)'); g.addColorStop(1, 'rgba(8,6,16,0)'); x.fillStyle = g; x.fillRect(px + 24, py, 8, 32); }
      continue; }
    x.drawImage(texFlor(t, v), px, py);
    const pa = PRI[g] ?? 8; if (pa >= 99) { if (g === 'ponte') { /* trilhos para a água */ } continue; }
    const viz = { n: at(i, j - 1), s: at(i, j + 1), w: at(i - 1, j), e: at(i + 1, j) };
    for (const [lado, tn] of Object.entries(viz)) { if (!tn) continue; const gn = grupo(tn); if (gn === g) continue; const pb = PRI[gn] ?? 8; if (pb >= 99 || pb <= pa) continue; const mv = Math.floor(hash2(i * 3 + lado.charCodeAt(0), j, 11) * 3); const forca = g === 'agua' || g === 'lava' ? 5 : 6; x.drawImage(borda(tn, lado, mv, Math.floor(hash2(i, j, 13) * 4), forca), px, py);
      const rc = (RIM[g] || {})[gn]; if (rc) { x.fillStyle = rc; for (let u = 0; u < 32; u++) { const k = 31; void k; } } }
    for (const [dl, a, b2] of [['nw', 'n', 'w'], ['ne', 'n', 'e'], ['sw', 's', 'w'], ['se', 's', 'e']]) { const dx = dl[1] === 'w' ? -1 : 1, dy = dl[0] === 'n' ? -1 : 1; const td = at(i + dx, j + dy); if (!td) continue; const gd = grupo(td); if (gd === g || (PRI[gd] ?? 8) >= 99 || (PRI[gd] ?? 8) <= pa) continue; const ga = grupo(viz[a] || t), gb = grupo(viz[b2] || t); if (ga === gd || gb === gd) continue; x.drawImage(borda(td, dl, 0, Math.floor(hash2(i, j, 15) * 4), 6), px, py); }
    // sombra de ambiente sob árvores e montanhas vizinhas
  }
  // praça e pontes: borda de pedra
  for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) { const id = m.g[j * m.w + i]; if (id === 'praca') { x.fillStyle = 'rgba(20,16,30,0.25)'; if (at(i, j + 1) !== 'praca' && !PREDIO_IDS.has(m.g[(j + 1) * m.w + i])) x.fillRect(i * TS, j * TS + 30, TS, 2); if (at(i, j - 1) !== 'praca') x.fillRect(i * TS, j * TS, TS, 1); } if (id === 'ponte') { x.fillStyle = '#3a2814'; if (m.g[(j - 1) * m.w + i] !== 'ponte' && m.g[(j - 1) * m.w + i] !== 'estrada') x.fillRect(i * TS, j * TS, TS, 3); } }
  // prédios vistos de cima: sombra no chão, telhado com cumeeira e a porta (degrau + tapete)
  for (const b of m.predios || []) { x.fillStyle = 'rgba(10,6,20,0.30)'; x.fillRect(b.x * TS + 5, b.y * TS + 7, b.w * TS, b.h * TS); x.drawImage(TD.predio(b.w, b.h, b.tel || 'telhado', b.ruina), b.x * TS, b.y * TS); if (b.porta) x.drawImage(TD.porta(), b.porta.x * TS, b.porta.y * TS); }
  void opcoes; return { canvas: c, base };
}
export function spriteObjeto(id, v = 0, f = 0, viz = {}) {
  const k = id + v + ':' + f + ':' + (viz.h ? 1 : 0) + (viz.v ? 1 : 0) + (viz.n ? 1 : 0) + (viz.s ? 1 : 0) + (viz.w ? 1 : 0) + (viz.e ? 1 : 0) + (viz.outono ? 'o' : '') + (viz.morta ? 'm' : ''); let c = objCache.get(k); if (c) return c;
  switch (id) {
    case 'arvore': case 'arvoreFixa': c = TD.arvore(v, viz.outono, viz.morta); break; case 'pinheiro': c = TD.pinheiro(v); break; case 'montanha': c = TD.montanha(true, v); break; case 'rocha': c = TD.rocha(v); break;
    case 'placa': c = TD.placa(); break; case 'barril': c = TD.barril(); break; case 'bigorna': c = TD.bigorna(); break; case 'braseiro': c = TD.braseiro(f); break; case 'poco': c = TD.poco(); break; case 'tenda': c = TD.tenda(); break;
    case 'cerca': c = TD.cerca(viz.h, viz.v); break; case 'casinha': c = TD.casinha(); break; case 'caverna': c = TD.caverna(false, f); break; case 'cavernaLiv': c = TD.caverna(true, f % 2); break; case 'saida': c = TD.portal(f); break;
    case 'bau_mundo': case 'bauF': c = TD.bau(false); break; case 'bauA': c = TD.bau(true, '#8a5a30', true); break;
    case 'santuario': c = TD.santuario(f); break; case 'armadilha': c = TD.armadilha(true); break; case 'caixaTocha': c = TD.caixaTocha(); break; case 'muro': c = TD.muro(viz); break; case 'torreT': c = TD.torre(); break;
    default: c = TD.MOBILIA_TIPOS.includes(id) ? TD.mobilia(id, v, f, viz) : TD.rocha(v);
  }
  objCache.set(k, c); return c;
}

// ---------- masmorras ----------
const TEMAS = {
  porao: ['#5a4a3c', '#4a3a30', '#2a2018', '#3a2c22'], caverna: ['#4e5666', '#3e4452', '#222832', '#2e3442'], cripta: ['#554e6a', '#443e56', '#26223a', '#352f4a'], floresta: ['#3c5c38', '#2f4a2c', '#1a2c18', '#243c22'],
  mina: ['#6c5640', '#5a4630', '#2e2418', '#44361f'], pantano: ['#3e5648', '#30443a', '#18261e', '#243428'], torre: ['#4c5878', '#3c4666', '#1e2640', '#2c3652'], abismo: ['#3a3054', '#2c2440', '#120e22', '#1e1832'],
  afundada: ['#316a86', '#24506a', '#0e2a3c', '#1a3c52'], forja: ['#6e3e34', '#5a3028', '#2c1410', '#44201a'], cemiterio: ['#4e5c50', '#3e4a40', '#1e2620', '#2e382f'], trono: ['#3a466a', '#2a3454', '#0e1428', '#1a2240'],
};
export const TEMAS_LISTA = Object.keys(TEMAS);
export const corTema = (t) => (TEMAS[t] || TEMAS.porao)[2];
function pisoMas(tema, v) {
  const [a, b, par, par2] = TEMAS[tema] || TEMAS.porao; const p = new Pix(32, 32); const lajes = [[0, 0, 16, 16], [16, 0, 16, 16], [0, 16, 16, 16], [16, 16, 16, 16]];
  if (v % 2) { lajes.length = 0; lajes.push([0, 0, 32, 12], [0, 12, 14, 20], [14, 12, 18, 20]); }
  lajes.forEach(([x, y, w, h], i) => { const c = mistura(a, b, hash2(i, v, 201) * 0.8); const R = rampa(c); p.rect(x, y, w, h, R.b); p.rect(x, y, w, 1, R.h); p.rect(x, y, 1, h, R.h); p.rect(x, y + h - 1, w, 1, R.s2); p.rect(x + w - 1, y, 1, h, R.s2); for (let k = 0; k < w * h / 24; k++) p.set(x + 1 + hash2(k, i + v * 7, 202) * (w - 3), y + 1 + hash2(k, i + v * 7, 203) * (h - 3), hash2(k, i, 204) > 0.5 ? R.s : R.h); if (hash2(i, v, 205) > 0.7) { p.line(x + 3, y + 3, x + w / 2, y + h / 2, R.s2); } });
  void par; void par2; return p;
}
function paredeFrente(tema, v) {
  const [a, b, par, par2] = TEMAS[tema] || TEMAS.porao; const R = rampa(mistura(a, par2, 0.2)); const p = new Pix(32, 32);
  p.rect(0, 0, 32, 32, R.s); for (let r = 0; r < 4; r++) { const y = r * 8, off = r % 2 ? 8 : 0; for (let bx = -16 + off; bx < 32; bx += 16) { const c = mistura(R.b, R.s2, hash2(bx + 40, r, 211 + v) * 0.5); const RR = rampa(c); const x0 = Math.max(0, bx), x1 = Math.min(32, bx + 16); if (x1 <= x0) continue; p.rect(x0, y, x1 - x0, 8, RR.b); p.rect(x0, y, x1 - x0, 1, RR.h); p.rect(x0, y + 7, x1 - x0, 1, par); if (bx >= 0) p.rect(bx, y, 1, 8, par); if (bx + 15 < 32) p.rect(bx + 15, y, 1, 8, par); for (let k = 0; k < 4; k++) p.set(x0 + 1 + hash2(k, bx + r, 212) * (x1 - x0 - 2), y + 1 + hash2(k, bx + r, 213) * 5, k % 2 ? RR.s : RR.h); } }
  p.rect(0, 0, 32, 3, rampa(par2).h); p.rect(0, 0, 32, 1, rampa(par2).h2); p.rect(0, 3, 32, 1, par); p.rect(0, 29, 32, 3, par); return p;
}
function paredeTopo(tema, v) { const [a, , par, par2] = TEMAS[tema] || TEMAS.porao; const R = rampa(mistura(par, par2, 0.5)); const p = new Pix(32, 32); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const n = per(x / 32 * 4 + v, y / 32 * 4, 4, 221) * 0.7 + hash2(x, y, 222) * 0.3; p.set(x, y, n < 0.55 ? R.s2 : n < 0.88 ? R.s : R.b); } void a; return p; }
const dungCache = new Map();
export function assarMasmorra(d, tema, T = { PAREDE: 0, CHAO: 1, DESCE: 2, SOBE: 3, SAIDA: 4 }, semente = 1) {
  const W = d.w * TS, H = d.h * TS, c = cv(W, H), x = c.getContext('2d'); x.imageSmoothingEnabled = false; const tl = d.tiles; const IT = (i, j) => (i < 0 || j < 0 || i >= d.w || j >= d.h ? T.PAREDE : tl[j * d.w + i]); const luzes = [];
  const gc = (k, fn) => { let r = dungCache.get(k); if (!r) { r = fn().canvas(); dungCache.set(k, r); } return r; };
  for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) {
    const t = IT(i, j), px = i * TS, py = j * TS, v = Math.floor(hash2(i, j, semente) * 4);
    if (t === T.PAREDE) {
      const sul = IT(i, j + 1) !== T.PAREDE; const RP = rampa((TEMAS[tema] || TEMAS.porao)[3]);
      x.drawImage(gc(`pt${tema}${v % 3}`, () => paredeTopo(tema, v % 3)), px, py);
      x.fillStyle = RP.h; if (IT(i - 1, j) !== T.PAREDE) x.fillRect(px, py, 2, 32); if (IT(i + 1, j) !== T.PAREDE) x.fillRect(px + 30, py, 2, 32); if (IT(i, j - 1) !== T.PAREDE) x.fillRect(px, py, 32, 3);
      if (sul) { x.fillStyle = RP.h2; x.fillRect(px, py + 27, 32, 2); x.fillStyle = 'rgba(8,6,16,0.6)'; x.fillRect(px, py + 29, 32, 3); if (hash2(i, j, 301 + semente) < 0.1 && i > 0) { luzes.push({ x: px + 16, y: py + 26, r: 150, tipo: 'tocha' }); x.fillStyle = '#5a3a20'; x.fillRect(px + 13, py + 22, 6, 6); x.fillStyle = '#ffb030'; x.fillRect(px + 14, py + 23, 4, 4); x.fillStyle = '#fff2a0'; x.fillRect(px + 15, py + 24, 2, 2); } }
      continue;
    }
    x.drawImage(gc(`pi${tema}${v}`, () => pisoMas(tema, v)), px, py);
    // oclusão de ambiente pelas paredes
    if (IT(i, j - 1) === T.PAREDE) { const g = x.createLinearGradient(0, py, 0, py + 12); g.addColorStop(0, 'rgba(8,6,16,0.55)'); g.addColorStop(1, 'rgba(8,6,16,0)'); x.fillStyle = g; x.fillRect(px, py, 32, 12); }
    if (IT(i - 1, j) === T.PAREDE) { const g = x.createLinearGradient(px, 0, px + 8, 0); g.addColorStop(0, 'rgba(8,6,16,0.4)'); g.addColorStop(1, 'rgba(8,6,16,0)'); x.fillStyle = g; x.fillRect(px, py, 8, 32); }
    if (IT(i + 1, j) === T.PAREDE) { const g = x.createLinearGradient(px + 32, 0, px + 24, 0); g.addColorStop(0, 'rgba(8,6,16,0.4)'); g.addColorStop(1, 'rgba(8,6,16,0)'); x.fillStyle = g; x.fillRect(px + 24, py, 8, 32); }
    if (IT(i, j + 1) === T.PAREDE) { x.fillStyle = 'rgba(8,6,16,0.18)'; x.fillRect(px, py + 28, 32, 4); }
    // decoração determinística (não bloqueia)
    if (t === T.CHAO) { const h = hash2(i, j, 401 + semente); if (h < 0.1) { const tipo = O.DECOR_TIPOS[Math.floor(hash2(i, j, 402) * O.DECOR_TIPOS.length)]; if (tipo !== 'teia') x.drawImage(gc(`d${tipo}${v}`, () => ({ canvas: () => O.decor(tipo, v) })), px, py); } }
    if (t === T.DESCE) x.drawImage(O.escada(true), px, py); else if (t === T.SOBE) x.drawImage(O.escada(false), px, py);
  }
  // teias nos cantos
  for (let j = 1; j < d.h - 1; j++) for (let i = 1; i < d.w - 1; i++) { if (IT(i, j) === T.CHAO && IT(i - 1, j) === T.PAREDE && IT(i, j - 1) === T.PAREDE && hash2(i, j, 501) < 0.4) x.drawImage(O.decor('teia'), i * TS, j * TS); }
  return { canvas: c, luzes };
}

// ---------- luz e partículas ----------
let escuridao = null;
// desenha a escuridão cobrindo a vista inteira; "luzes" em coordenadas de tela (px) com raio e intensidade
export function aplicarEscuridao(ctx, w, h, luzes, base = 0.9, cor = '10,6,24') {
  if (!escuridao || escuridao.width !== w || escuridao.height !== h) escuridao = cv(w, h); const o = escuridao.getContext('2d'); o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, w, h); o.fillStyle = `rgba(${cor},${base})`; o.fillRect(0, 0, w, h); o.globalCompositeOperation = 'destination-out';
  for (const L of luzes) { const g = o.createRadialGradient(L.x, L.y, L.r * 0.1, L.x, L.y, L.r); const a = L.a ?? 1; g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.55, `rgba(0,0,0,${a * 0.65})`); g.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = g; o.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2); }
  ctx.drawImage(escuridao, 0, 0);
  // brilho quente das luzes
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const L of luzes) { if (!L.quente) continue; const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r * 0.9); g.addColorStop(0, 'rgba(255,170,70,0.20)'); g.addColorStop(1, 'rgba(255,120,30,0)'); ctx.fillStyle = g; ctx.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2); } ctx.restore();
}
export function sombraEntidade(ctx, cx, cy, rx = 10, ry = 4, a = 0.35) { ctx.fillStyle = `rgba(10,6,20,${a})`; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
export class Particulas {
  constructor() { this.l = []; }
  emitir(x, y, n, o = {}) { for (let i = 0; i < n; i++) { const a = o.ang !== undefined ? o.ang + (Math.random() - 0.5) * (o.abre ?? 1) : Math.random() * 6.283, v = (o.vel ?? 40) * (0.4 + Math.random() * 0.8); this.l.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + (o.sobe ? -o.sobe : 0), g: o.g ?? 0, t: 0, vida: (o.vida ?? 0.6) * (0.6 + Math.random() * 0.7), cor: Array.isArray(o.cor) ? o.cor[i % o.cor.length] : (o.cor || '#fff'), tam: o.tam ?? 2, brilho: o.brilho }); } }
  anel(x, y, r, cor, n = 18, vida = 0.5) { for (let i = 0; i < n; i++) { const a = (i / n) * 6.283; this.l.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.6, vx: Math.cos(a) * 16, vy: Math.sin(a) * 10, g: 0, t: 0, vida, cor, tam: 2, brilho: true }); } }
  passo(dt) { for (const p of this.l) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; } this.l = this.l.filter((p) => p.t < p.vida); }
  desenhar(ctx, ox = 0, oy = 0) { for (const p of this.l) { const k = 1 - p.t / p.vida; ctx.globalAlpha = Math.min(1, k * 1.6); ctx.fillStyle = p.cor; const s = Math.max(1, Math.round(p.tam * (0.5 + k * 0.5))); ctx.fillRect(Math.round(p.x - ox - s / 2), Math.round(p.y - oy - s / 2), s, s); } ctx.globalAlpha = 1; }
}
void escurece; void clareia; void clamp;
