// Cenário em VISTA DE CIMA (top-down), luz vinda do noroeste e sombra projetada para sudeste.
// Todos os sprites ficam CENTRADOS no tile (o renderizador centraliza pelo tamanho da imagem).
import { Pix, rampa, mistura, escurece, hash2, cv } from './gfx.js';

const novo = (w, h = w) => new Pix(w, h);
// sombra projetada: a própria silhueta, deslocada e escurecida, atrás do sprite
export function comSombra(p, dx = 3, dy = 4, a = 0.30) {
  const c = p.canvas ? p.canvas() : p; const w = c.width, h = c.height, o = cv(w, h), x = o.getContext('2d'); const s = cv(w, h), sx = s.getContext('2d');
  sx.drawImage(c, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = `rgba(10,6,20,${a})`; sx.fillRect(0, 0, w, h); x.drawImage(s, dx, dy); x.drawImage(c, 0, 0); return o;
}
const A = (i, v, s) => hash2(i, v, s);
const TAU = Math.PI * 2;

// ---------- vegetação ----------
export function arvore(v = 0, outono = false, morta = false) {
  const p = novo(48), cx = 22, cy = 22;
  if (morta) {
    for (let i = 0; i < 9; i++) { const a = A(i, v, 41) * TAU, L = 9 + A(i, v, 42) * 11, x1 = cx + Math.cos(a) * L, y1 = cy + Math.sin(a) * L; p.line(cx, cy, x1, y1, i % 2 ? '#4a3826' : '#5a4630', 2); p.line(x1, y1, x1 + Math.cos(a + 0.55) * 6, y1 + Math.sin(a + 0.55) * 6, '#4a3826'); p.line(x1, y1, x1 + Math.cos(a - 0.55) * 5, y1 + Math.sin(a - 0.55) * 5, '#6a5a40'); }
    p.ell(cx, cy, 4, 4, '#4a3826'); for (let i = 0; i < 12; i++) p.set(cx + (A(i, v, 43) - 0.5) * 34, cy + (A(i, v, 44) - 0.5) * 34, '#8a7a50');
    p.contorno(0.55); return comSombra(p, 2, 2, 0.22);
  }
  const cor = outono ? ['#b8641e', '#d08a24', '#9a4a1a'] : ['#2a7a34', '#3a9a3e', '#1f6a2a']; const R = 16 + (v % 3);
  p.ell(cx + 1, cy + 1, R, R, escurece(cor[2], 0.15));
  for (let i = 0; i < 9; i++) { const a = A(i, v, 43) * TAU, d = R * 0.55 * Math.sqrt(A(i, v, 44)), r = R * 0.36 + A(i, v, 45) * R * 0.18; p.ell(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r, r, cor[i % 3]); }
  const Rh = rampa(cor[0]), Rk = rampa(cor[1]);
  for (let i = 0; i < 46; i++) { const a = A(i, v, 46) * TAU, d = Math.sqrt(A(i, v, 47)) * R * 0.9; p.set(cx + Math.cos(a) * d, cy + Math.sin(a) * d, i % 3 ? Rh.h : Rk.h2); }
  p.contorno(0.55); return comSombra(p, 3, 4, 0.30);
}
export function pinheiro(v = 0) {
  const p = novo(44), cx = 20, cy = 20;
  for (let k = 0; k < 4; k++) { const R = 16 - k * 3.6, n = 10, pts = []; for (let i = 0; i < n * 2; i++) { const a = (i * Math.PI) / n + k * 0.31 + A(i, v, k) * 0.12, r = i % 2 ? R * 0.52 : R; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } p.poly(pts, k % 2 ? '#1c6a3a' : '#238046', 'g'); }
  p.ell(cx, cy, 2, 2, '#e8f0f8'); p.contorno(0.55); return comSombra(p, 3, 4, 0.3);
}
export function montanha(neve = true, v = 0) {
  const p = novo(48), cx = 22 + ((v % 3) - 1), cy = 22, n = 10, vs = [];
  for (let i = 0; i < n; i++) { const a = (i * TAU) / n + A(i, v, 51) * 0.3, r = 14 + A(i, v, 52) * 7; vs.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, a]); }
  const pk = [cx + (A(v, 1, 53) - 0.5) * 4, cy + (A(v, 2, 54) - 0.5) * 4];
  vs.forEach((a, i) => {
    const b = vs[(i + 1) % n]; const am = (a[2] + b[2] + (i === n - 1 ? TAU : 0)) / 2; const t = (Math.cos(am + 2.36) + 1) / 2;
    p.poly([pk, [a[0], a[1]], [b[0], b[1]]], mistura('#46425a', '#aaa6ba', t), 'f');
    if (neve) { const k = 0.46; p.poly([pk, [pk[0] + (a[0] - pk[0]) * k, pk[1] + (a[1] - pk[1]) * k], [pk[0] + (b[0] - pk[0]) * k, pk[1] + (b[1] - pk[1]) * k]], mistura('#bccae0', '#ffffff', t), 'f'); }
  });
  vs.forEach((a, i) => { if (i % 2 === 0) p.line(pk[0], pk[1], pk[0] + (a[0] - pk[0]) * 0.92, pk[1] + (a[1] - pk[1]) * 0.92, '#37334a'); });
  p.contorno(0.5); return comSombra(p, 3, 4, 0.3);
}
export function rocha(v = 0) {
  const p = novo(32); p.ell(17, 18, 11, 9, '#7a768a'); p.ell(13, 14, 7, 6, '#a09cae'); p.ell(21, 20, 6, 5, '#6a667c'); p.ell(12, 21, 4, 3, '#8a869a');
  if (v % 2) { p.ell(11, 13, 4, 2.5, '#4a8a3a'); p.set(9, 12, '#6aaa4a'); } p.line(15, 12, 20, 22, '#4a465a'); p.contorno(0.5); return comSombra(p, 2, 3, 0.28);
}
export const pedregulho = () => rocha(1);

// ---------- mobiliário e objetos de rua ----------
export function placa() {
  const p = novo(32); p.ell(16, 18, 3, 3, '#6a4426'); p.rect(5, 7, 22, 11, '#a47a4c', 'v'); p.rect(5, 7, 22, 1, '#c49a6c'); p.rect(8, 10, 14, 1, '#4a2e16'); p.rect(8, 13, 10, 1, '#4a2e16'); p.rect(5, 17, 22, 1, '#5a3a20');
  p.set(7, 9, '#2a1a0a'); p.set(25, 9, '#2a1a0a'); p.contorno(0.55); return comSombra(p, 2, 3, 0.3);
}
export function barril() {
  const p = novo(32); p.ell(16, 16, 11, 11, '#8a5a30'); p.ell(16, 16, 9, 9, '#a06a38'); for (let i = 0; i < 8; i++) { const a = (i * TAU) / 8; p.line(16 + Math.cos(a) * 3, 16 + Math.sin(a) * 3, 16 + Math.cos(a) * 9, 16 + Math.sin(a) * 9, '#6a4222'); }
  p.ell(16, 16, 3, 3, '#5a3a20'); for (const r of [10, 7]) for (let i = 0; i < 40; i++) { const a = (i * TAU) / 40; p.set(16 + Math.cos(a) * r, 16 + Math.sin(a) * r, '#3a2a1a'); }
  p.contorno(0.55); return comSombra(p, 2, 3, 0.3);
}
export function bigorna() {
  const p = novo(32); p.poly([[5, 11], [24, 11], [27, 14], [24, 17], [5, 17]], '#5a5a68', 'g'); p.poly([[24, 11], [30, 13], [30, 15], [24, 17]], '#46465a', 'f'); p.rect(10, 17, 10, 5, '#46465a', 'c'); p.rect(7, 22, 16, 4, '#38384a', 'v');
  p.rect(7, 12, 17, 1, '#8a8aa0'); p.contorno(0.55); return comSombra(p, 2, 3, 0.3);
}
export function braseiro(f = 0) {
  const p = novo(32); p.ell(16, 16, 12, 12, '#4a4658'); p.ell(16, 16, 10, 10, '#6a667a'); p.ell(16, 16, 8, 8, '#2a1a14'); p.ell(16, 16, 7, 7, '#a03a1a');
  const h = [0, 1, 0, 2][f % 4]; p.ell(15, 15, 5 + h, 5 + h, '#e8541a'); p.ell(16, 15, 3.5 + h * 0.6, 3.5 + h * 0.6, '#ff8a1a'); p.ell(16, 15, 2, 2, '#ffd23f'); p.set(9 + f, 9, '#ffb030'); p.set(23 - f, 10 + f, '#ffd23f'); p.set(14, 22 - f, '#ffd23f');
  p.contorno(0.5); return comSombra(p, 2, 3, 0.3);
}
export function poco() {
  const p = novo(32); p.ell(16, 16, 14, 14, '#7a7688'); for (let i = 0; i < 12; i++) { const a = (i * TAU) / 12; p.line(16 + Math.cos(a) * 9, 16 + Math.sin(a) * 9, 16 + Math.cos(a) * 14, 16 + Math.sin(a) * 14, '#5a566a'); }
  p.ell(16, 16, 9.5, 9.5, '#14223a'); p.ell(16, 16, 8, 8, '#2a5a9a'); p.ell(14, 14, 4, 3, '#5a9ae0'); p.set(12, 12, '#c8e8ff'); p.rect(2, 15, 28, 2, '#6a4426', 'v'); p.ell(25, 16, 3, 3, '#8a6a42'); p.contorno(0.5); return comSombra(p, 2, 3, 0.3);
}
export function tenda() {
  const p = novo(40, 36); for (let i = 0; i < 6; i++) p.rect(3 + i * 5.6, 4, 5.6, 28, i % 2 ? '#e8e0c8' : '#c83a3a', 'v'); p.rect(3, 17, 34, 2, '#7a2020'); p.rect(3, 4, 34, 1, '#ff8a8a'); p.rect(3, 31, 34, 1, '#601818');
  p.ell(6, 3, 1.6, 1.6, '#ffd23f'); p.ell(34, 3, 1.6, 1.6, '#ffd23f'); p.contorno(0.5); return comSombra(p, 2, 3, 0.3);
}
export function cerca(h = true, v = true) {
  const p = novo(32), m = '#a47a4c';
  if (h) { p.rect(0, 11, 32, 3, m, 'v'); p.rect(0, 19, 32, 3, m, 'v'); } if (v) { p.rect(11, 0, 3, 32, m, 'c'); p.rect(19, 0, 3, 32, m, 'c'); }
  for (const [x, y] of [[h ? 2 : 16, h ? 16 : 3], [h ? 29 : 16, h ? 16 : 29]]) p.ell(x, y, 3, 3, '#6a4a2a'); if (h && v) p.ell(16, 16, 3.5, 3.5, '#6a4a2a'); p.contorno(0.55); return comSombra(p, 2, 3, 0.28);
}
export function casinha() {
  const p = novo(32); p.rect(3, 4, 26, 12, '#c4543a', 'v'); p.rect(3, 16, 26, 12, '#a8432c', 'v'); p.rect(3, 15, 26, 2, '#e8896a'); for (let x = 3; x < 29; x += 5) { p.rect(x, 4, 1, 11, '#8a3320'); p.rect(x + 2, 17, 1, 11, '#7a2c1a'); }
  p.rect(22, 6, 5, 5, '#6a667a', 'v'); p.rect(23, 7, 3, 3, '#2a2638'); p.contorno(0.5); return comSombra(p, 2, 3, 0.3);
}
export function caverna(viva = false, f = 0) {
  const p = novo(44), cx = 22, cy = 21, n = 9, vs = [];
  for (let i = 0; i < n; i++) { const a = (i * TAU) / n + A(i, 7, 61) * 0.3, r = 15 + A(i, 7, 62) * 5; vs.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92, a]); }
  vs.forEach((a, i) => { const b = vs[(i + 1) % n]; const am = (a[2] + b[2] + (i === n - 1 ? TAU : 0)) / 2; p.poly([[cx, cy], [a[0], a[1]], [b[0], b[1]]], mistura('#4a465a', '#9a96aa', (Math.cos(am + 2.36) + 1) / 2), 'f'); });
  p.ell(cx, cy + 6, 9, 7, viva ? '#3a1a5a' : '#0c0914'); p.ell(cx, cy + 7, 7, 5, viva ? '#5a2a9a' : '#050308');
  if (viva) { p.ell(cx, cy + 7 - f, 4 + f, 3, '#a07af0'); p.ell(cx, cy + 7, 2, 1.6, '#e8d8ff'); p.set(14, cy + 2, '#d8c0ff'); p.set(30, cy + 4 - f, '#d8c0ff'); } else { p.set(cx, cy - 8, '#ffd23f'); p.set(cx - 1, cy - 7, '#c89a2a'); p.set(cx + 1, cy - 7, '#c89a2a'); }
  p.contorno(0.5); return comSombra(p, 3, 4, 0.3);
}
export function portal(f = 0) {
  const p = novo(32); p.ell(16, 16, 15, 15, '#5a566a'); p.ell(16, 16, 13, 13, '#7a7688'); p.ell(16, 16, 11, 11, '#2a1a5a'); p.ell(16, 16, 9, 9, f % 2 ? '#8a5af0' : '#6a3ae0'); p.ell(16, 16, 6, 6, f % 2 ? '#c0a0ff' : '#a07af0'); p.ell(16, 16, 3, 3, '#ffffff');
  for (let i = 0; i < 8; i++) { const a = (i * TAU) / 8 + f * 0.4; p.set(16 + Math.cos(a) * 12, 16 + Math.sin(a) * 12, '#6af0ff'); } p.contorno(0.5); return p.canvas();
}
export function bau(aberto = false, cor = '#8a5a30', ouro = false) {
  const p = novo(32), R = rampa(cor);
  if (!aberto) { p.rect(5, 9, 22, 15, cor, 'v'); p.rect(5, 9, 22, 2, R.h2); for (let x = 8; x < 26; x += 4) p.rect(x, 11, 1, 12, R.s); p.rect(5, 15, 22, 2, '#3a2a1a'); p.rect(14, 14, 4, 5, '#e0c040', 'v'); p.set(15, 17, '#3a2a1a'); p.rect(5, 22, 22, 2, R.s2); }
  else { p.rect(5, 12, 22, 14, cor, 'v'); p.rect(7, 14, 18, 10, '#2a1a10'); p.rect(5, 6, 22, 5, R, 'v'); p.rect(5, 6, 22, 1, R.h2); if (ouro) { p.ell(12, 19, 3, 2, '#ffd23f'); p.ell(18, 20, 3, 2, '#ffe680'); p.ell(15, 17, 2, 1.6, '#ffd23f'); } }
  p.contorno(0.5); return comSombra(p, 2, 3, 0.3);
}
export function armadilha(armada = true) {
  const p = novo(32); p.rect(4, 4, 24, 24, '#4a4658', 'v'); p.rect(4, 4, 24, 1, '#6a667a'); p.rect(4, 27, 24, 1, '#2a2638'); p.rect(4, 4, 1, 24, '#6a667a'); p.rect(27, 4, 1, 24, '#2a2638');
  for (const [x, y] of [[9, 9], [16, 9], [23, 9], [9, 16], [16, 16], [23, 16], [9, 23], [16, 23], [23, 23]]) { if (armada) { p.ell(x, y, 2.2, 2.2, '#c8c8d8'); p.set(x, y, '#fff'); } else p.ell(x, y, 1.6, 1.6, '#14101c'); } return p.canvas();
}
export function santuario(f = 0) {
  const p = novo(32); p.ell(16, 16, 13, 13, '#7a7688'); p.ell(16, 16, 10, 10, '#a8a4b8'); p.ell(16, 16, 7, 7, '#c8c4d8');
  for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6; p.line(16 + Math.cos(a) * 8, 16 + Math.sin(a) * 8, 16 + Math.cos(a) * 12, 16 + Math.sin(a) * 12, '#6af0ff'); }
  p.ell(16, 16, 4 + f, 4 + f, '#6af0ff'); p.ell(16, 16, 2.5, 2.5, '#c8fbff'); p.set(16, 16, '#ffffff'); p.contorno(0.5); return comSombra(p, 2, 3, 0.28);
}
export function caixaTocha() {
  const p = novo(32); p.rect(4, 9, 24, 16, '#8a5a30', 'v'); for (let x = 7; x < 26; x += 5) p.rect(x, 10, 1, 14, '#6a4222'); p.rect(4, 16, 24, 2, '#3a2a1a'); p.line(8, 6, 25, 12, '#6a4426', 2); p.ell(8, 6, 2.5, 2.5, '#ffb030'); p.set(8, 6, '#fff2a0'); p.contorno(0.5); return comSombra(p, 2, 3, 0.3);
}

// ---------- prédios vistos de cima: telhado com cumeeira, beiral e chaminé ----------
const COR_TELHADO = { telhado: '#b4442c', telhadoAz: '#3a5ab4', telhadoVd: '#3a8a4a', telhadoCz: '#6a6a7a', telhadoMr: '#7a5030', telhadoRx: '#7a3a8a', telhadoPr: '#2a2a3a', telhadoOc: '#b08a30' };
export const TELHADOS = Object.keys(COR_TELHADO);
const predCache = new Map();
export function predio(w, h, tel = 'telhado', ruina = false) {
  const k = `${w}x${h}${tel}${ruina ? 'r' : ''}`; let c = predCache.get(k); if (c) return c;
  const W = w * 32, H = h * 32; const p = novo(W, H); const R = rampa(COR_TELHADO[tel] || tel); const meio = Math.floor(H / 2) - 1;
  p.rect(0, 0, W, H, R.b);
  for (let y = 0; y < H; y += 6) { const norte = y < meio; for (let x = 0; x < W; x++) p.set(x, y + 5 > H - 1 ? H - 1 : y + 5, norte ? R.s : R.s2); for (let x = ((y / 6) % 2) * 5; x < W; x += 10) { p.rect(x, y, 1, 5, norte ? R.s : R.s2); p.rect(x + 1, y, 2, 1, norte ? R.h2 : R.h); } }
  for (let y = 0; y < meio; y++) for (let x = 0; x < W; x++) if ((x + y) % 7 === 0) p.set(x, y, R.h);
  p.rect(0, meio - 1, W, 3, R.h2); p.rect(0, meio + 2, W, 2, R.s2);                       // cumeeira
  p.rect(0, 0, W, 2, R.s2); p.rect(0, H - 3, W, 3, R.s2); p.rect(0, 0, 2, H, R.s2); p.rect(W - 2, 0, 2, H, R.s2); p.rect(2, 2, W - 4, 1, R.h); // beiral
  const cx = Math.floor(W * 0.74), cy = Math.floor(H * 0.2); p.rect(cx, cy, 10, 10, '#7a768a', 'v'); p.rect(cx + 2, cy + 2, 6, 6, '#1c1826'); p.rect(cx, cy, 10, 1, '#b8b4c8');   // chaminé
  if (w >= 5) { p.rect(Math.floor(W * 0.2), Math.floor(H * 0.12), 12, 9, '#6ab0e0'); p.rect(Math.floor(W * 0.2), Math.floor(H * 0.12), 12, 2, '#9ad8f8'); p.rect(Math.floor(W * 0.2) + 5, Math.floor(H * 0.12), 2, 9, '#4a3018'); } // claraboia
  if (ruina) { for (let i = 0; i < 9; i++) { const x = Math.floor(A(i, w, 71) * (W - 14)) + 4, y = Math.floor(A(i, h, 72) * (H - 10)) + 4; p.rect(x, y, 6 + (i % 3) * 3, 5 + (i % 2) * 3, '#1c1620'); p.rect(x, y, 6, 1, '#3a2a2a'); } }
  p.contorno(0.5); c = p.canvas(); predCache.set(k, c); return c;
}
export function porta() {
  const p = novo(32); p.rect(0, 0, 32, 32, '#5a566a'); p.rect(0, 0, 32, 4, '#38281a'); p.rect(6, 3, 20, 19, '#4a3018'); p.rect(8, 5, 16, 17, '#8a5a30', 'c'); for (const x of [12, 16, 20]) p.rect(x, 5, 1, 17, '#5a3a1a');
  p.ell(21, 14, 1.4, 1.4, '#ffd23f'); p.rect(4, 22, 24, 4, '#a8a4b8', 'v'); p.rect(8, 27, 16, 4, '#a83a3a', 'v'); p.rect(8, 27, 16, 1, '#d86a6a'); p.ell(3, 8, 2, 2, '#ffd23f'); p.ell(29, 8, 2, 2, '#ffd23f'); return p.canvas();
}
export function muro(viz = {}) { // muro de pedra visto de cima, liga com vizinhos
  const p = novo(32); const h = viz.w || viz.e, v = viz.n || viz.s;
  const x0 = viz.w ? 0 : 6, x1 = viz.e ? 32 : 26, y0 = viz.n ? 0 : 6, y1 = viz.s ? 32 : 26; void h; void v;
  p.rect(0, 0, 32, 32, null); p.rect(x0, y0, x1 - x0, y1 - y0, '#8a869a', 'v'); for (let y = y0; y < y1; y += 6) for (let x = x0 + ((y / 6) % 2) * 5; x < x1; x += 10) { p.rect(x, y, 1, 6, '#5a566a'); } for (let y = y0; y < y1; y += 6) p.rect(x0, y, x1 - x0, 1, '#5a566a');
  p.rect(x0, y0, x1 - x0, 2, '#b8b4c8'); p.rect(x0, y1 - 2, x1 - x0, 2, '#4a465a'); p.contorno(0.5); return comSombra(p, 2, 3, 0.3);
}
export function torre() { // torre redonda vista de cima
  const p = novo(40); p.ell(20, 20, 17, 17, '#8a869a'); p.ell(20, 20, 13, 13, '#6a667a'); for (let i = 0; i < 16; i++) { const a = (i * TAU) / 16; p.rect(20 + Math.cos(a) * 15 - 1.5, 20 + Math.sin(a) * 15 - 1.5, 3, 3, '#b8b4c8', 'v'); }
  p.ell(20, 20, 9, 9, '#4a3a5a'); p.ell(18, 18, 5, 5, '#6a5a7a'); p.contorno(0.5); return comSombra(p, 3, 4, 0.3);
}

// ---------- interiores: chão, parede e mobília ----------
export const PISOS = {
  piso: ['#a4784a', '#94683c'], pisoPedra: ['#8a869a', '#7a768a'], pisoMarm: ['#c4c0d0', '#b0acc0'], pisoEscuro: ['#4a4258', '#3e3650'], pisoTerra: ['#7a5a3a', '#6a4a2c'],
};
export function pisoInt(tipo, v) {
  const [a, b] = PISOS[tipo] || PISOS.piso; const p = novo(32); const R = rampa(a), R2 = rampa(b);
  if (tipo === 'piso') { for (let i = 0; i < 4; i++) { const c = (i + v) % 2 ? R : R2; p.rect(0, i * 8, 32, 8, c.b); p.rect(0, i * 8, 32, 1, c.s2); p.rect(0, i * 8 + 7, 32, 1, c.s); const off = (A(i, v, 81) * 28) | 0; p.rect(off, i * 8, 1, 8, c.s2); for (let k = 0; k < 6; k++) p.set(A(k, i + v * 9, 82) * 31, i * 8 + 1 + A(k, i, 83) * 5, c.h); } }
  else if (tipo === 'pisoTerra') { p.rect(0, 0, 32, 32, R.b); for (let i = 0; i < 40; i++) p.set(A(i, v, 84) * 31, A(i, v, 85) * 31, i % 2 ? R.s : R.h); }
  else { const lg = tipo === 'pisoMarm' ? 16 : 16; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const c = rampa((i + j + v) % 2 ? a : b); p.rect(i * lg, j * lg, lg, lg, c.b); p.rect(i * lg, j * lg, lg, 1, c.h); p.rect(i * lg, j * lg, 1, lg, c.h); p.rect(i * lg, j * lg + lg - 1, lg, 1, c.s2); p.rect(i * lg + lg - 1, j * lg, 1, lg, c.s2); for (let k = 0; k < 6; k++) p.set(i * lg + 2 + A(k, i + j * 3 + v * 5, 86) * 12, j * lg + 2 + A(k, i + j * 3, 87) * 12, c.s); } }
  return p.canvas();
}
export function paredeInt(viz = {}, tema = 'madeira') { // parede vista de cima; viz = {n,s,w,e} vizinhos que também são parede
  const p = novo(32); const cor = tema === 'pedra' ? ['#7a768a', '#9a96aa', '#4a465a'] : ['#6a4a2e', '#8a6a44', '#3a2818']; const R = rampa(cor[0]);
  p.rect(0, 0, 32, 32, R.s); p.rect(0, 0, 32, 32, R.b, 'f'); for (let y = 0; y < 32; y += 8) { p.rect(0, y, 32, 1, R.s2); if (tema === 'pedra') for (let x = ((y / 8) % 2) * 8; x < 32; x += 16) p.rect(x, y, 1, 8, R.s2); }
  if (!viz.n) p.rect(0, 0, 32, 2, cor[1]); if (!viz.w) p.rect(0, 0, 2, 32, cor[1]); if (!viz.s) p.rect(0, 29, 32, 3, cor[2]); if (!viz.e) p.rect(30, 0, 2, 32, cor[2]);
  return p.canvas();
}
export function janelaInt() { const p = novo(32); p.rect(0, 0, 32, 32, '#6a4a2e'); p.rect(4, 6, 24, 20, '#2a1c10'); p.rect(6, 8, 20, 16, '#7ac0f0'); p.rect(6, 8, 20, 5, '#b8e4ff'); p.rect(15, 8, 2, 16, '#2a1c10'); p.rect(6, 15, 20, 1, '#2a1c10'); p.rect(2, 26, 28, 4, '#3a2818'); return p.canvas(); }
export function tapete(viz = {}, cor = '#a83a3a') {
  const p = novo(32); const R = rampa(cor); p.rect(0, 0, 32, 32, R.b); const bx = (n) => (n ? 0 : 3), ex = (e) => (e ? 32 : 29); p.rect(bx(viz.w), bx(viz.n), ex(viz.e) - bx(viz.w), 1, '#e8c860'); p.rect(bx(viz.w), (viz.s ? 32 : 29) - 1, ex(viz.e) - bx(viz.w), 1, '#e8c860');
  if (!viz.w) p.rect(3, 0, 1, 32, '#e8c860'); if (!viz.e) p.rect(28, 0, 1, 32, '#e8c860'); for (let i = 0; i < 14; i++) p.set(6 + A(i, 3, 91) * 20, 6 + A(i, 4, 92) * 20, R.h); if (!viz.n) p.rect(0, 0, 32, 3, R.s2); if (!viz.s) p.rect(0, 29, 32, 3, R.s2); if (!viz.w) p.rect(0, 0, 3, 32, R.s2); if (!viz.e) p.rect(29, 0, 3, 32, R.s2); return p.canvas();
}
// mobília: cada peça ocupa um tile; viz = vizinhos do mesmo tipo (n,s,w,e) para peças compridas
export function mobilia(tipo, v = 0, f = 0, viz = {}) {
  const p = novo(32);
  switch (tipo) {
    case 'cama': p.rect(4, 2, 24, 28, '#6a4426', 'v'); p.rect(6, 4, 20, 24, v % 2 ? '#3a5ab4' : '#b4442c', 'v'); p.rect(8, 5, 16, 7, '#f0e8d8', 'c'); p.rect(6, 14, 20, 2, '#00000022' && '#8a2a1a'); p.rect(6, 28, 20, 2, '#4a2e16'); break;
    case 'mesa': { const x0 = viz.w ? 0 : 3, x1 = viz.e ? 32 : 29, y0 = viz.n ? 0 : 3, y1 = viz.s ? 32 : 29; p.rect(x0, y0, x1 - x0, y1 - y0, '#a47a4c', 'v'); p.rect(x0, y0, x1 - x0, 1, '#d0a46c'); p.rect(x0, y1 - 2, x1 - x0, 2, '#6a4a2a'); for (let k = 0; k < 8; k++) p.set(x0 + 2 + A(k, v, 95) * (x1 - x0 - 4), y0 + 3 + A(k, v, 96) * (y1 - y0 - 6), '#8a6038'); if (v % 3 === 1 && !viz.e) { p.ell(16, 14, 4, 4, '#e8e0cc'); p.ell(16, 14, 2.5, 2.5, '#c8a060'); } break; }
    case 'cadeira': p.rect(8, 8, 16, 16, '#8a5a30', 'v'); p.rect(8, 6, 16, 4, '#6a4222', 'v'); p.rect(10, 11, 12, 11, '#b4442c', 'v'); break;
    case 'banco': p.rect(2, 9, 28, 14, '#8a5a30', 'v'); p.rect(2, 9, 28, 2, '#c49a6c'); p.rect(2, 21, 28, 2, '#4a2e16'); break;
    case 'estante': p.rect(1, 1, 30, 30, '#4a3018', 'v'); for (let i = 0; i < 4; i++) { p.rect(3, 3 + i * 7, 26, 6, '#2a1c10'); for (let k = 0; k < 8; k++) p.rect(4 + k * 3, 4 + i * 7, 2, 5, ['#b4442c', '#3a5ab4', '#3a8a4a', '#d0a030', '#7a3a8a', '#c8c0b0'][(k + i + v) % 6]); } break;
    case 'altar': p.rect(2, 4, 28, 24, '#c8c4d8', 'v'); p.rect(2, 4, 28, 2, '#ffffff'); p.rect(2, 26, 28, 2, '#8a869a'); p.rect(6, 8, 20, 16, '#7a3a8a', 'v'); p.rect(14, 8, 4, 16, '#e8c860'); p.rect(10, 14, 12, 4, '#e8c860'); p.ell(7, 6, 2, 2, '#ffd23f'); p.ell(25, 6, 2, 2, '#ffd23f'); break;
    case 'lareira': p.rect(0, 2, 32, 28, '#6a667a', 'v'); p.rect(4, 6, 24, 20, '#14101c'); p.ell(16, 18, 9, 6, '#a03a1a'); p.ell(16, 17 - (f % 2), 6, 4 + (f % 2), '#ff8a1a'); p.ell(16, 16, 3, 2.4, '#ffd23f'); p.rect(0, 2, 32, 2, '#b8b4c8'); break;
    case 'fogao': p.rect(3, 3, 26, 26, '#4a4658', 'v'); for (const [x, y] of [[10, 10], [22, 10], [10, 21], [22, 21]]) { p.ell(x, y, 5, 5, '#1c1826'); p.ell(x, y, 3, 3, f % 2 ? '#a03a1a' : '#6a2a14'); } p.rect(3, 3, 26, 1, '#8a869a'); break;
    case 'balcao': { const x0 = viz.w ? 0 : 1, x1 = viz.e ? 32 : 31; p.rect(x0, 4, x1 - x0, 24, '#7a4a26', 'v'); p.rect(x0, 4, x1 - x0, 3, '#c49a6c'); p.rect(x0, 26, x1 - x0, 2, '#3a2412'); if (!viz.e && v % 2) p.ell(16, 16, 4, 4, '#e0c040'); break; }
    case 'bau': return bau(false);
    case 'espelho': p.rect(4, 2, 24, 28, '#6a4426', 'v'); p.rect(7, 5, 18, 22, '#9ad8f0'); p.rect(7, 5, 18, 6, '#d8f4ff'); p.line(9, 24, 22, 8, '#ffffff'); p.ell(16, 16, 5, 7, '#7ac0e0'); break;
    case 'planta': p.ell(16, 16, 10, 10, '#a0602a'); p.ell(16, 16, 8, 8, '#3a2412'); for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6 + v; p.ell(16 + Math.cos(a) * 6, 16 + Math.sin(a) * 6, 5, 3, '#3a9a3e'); } p.ell(16, 16, 3, 3, '#6ad05a'); break;
    case 'vaso': p.ell(16, 16, 8, 8, '#c8a060'); p.ell(16, 16, 6, 6, '#3a2412'); p.ell(16, 16, 3, 3, '#e8c860'); break;
    case 'caldeirao': p.ell(16, 16, 13, 13, '#2a2638'); p.ell(16, 16, 11, 11, '#4a4658'); p.ell(16, 16, 9, 9, f % 2 ? '#6ad05a' : '#4ab04a'); p.ell(13, 14, 3, 2, '#c8ffc0'); p.set(20, 18, '#e8ffe0'); break;
    case 'bancada': { const x0 = viz.w ? 0 : 1, x1 = viz.e ? 32 : 31; p.rect(x0, 3, x1 - x0, 26, '#6a5a48', 'v'); p.rect(x0, 3, x1 - x0, 2, '#a89878'); for (const [x, c] of [[6, '#d84a3a'], [13, '#4aa0e0'], [20, '#6ad05a'], [26, '#e0c040']]) { if (x < x1 - 2) { p.ell(x, 14, 3, 3, c); p.set(x - 1, 13, '#fff'); } } break; }
    case 'mapa': p.rect(2, 3, 28, 26, '#d8c8a0', 'v'); p.line(6, 8, 14, 12, '#6a4a2a'); p.line(14, 12, 20, 9, '#6a4a2a'); p.line(20, 9, 26, 18, '#6a4a2a'); p.ell(26, 18, 2, 2, '#c83a3a'); p.rect(2, 3, 28, 1, '#fff2c8'); break;
    case 'livro': p.ell(16, 16, 11, 11, '#7a7688'); p.ell(16, 16, 9, 9, '#a8a4b8'); p.rect(8, 10, 16, 12, '#e8e0c8'); p.rect(15, 10, 2, 12, '#8a6a42'); for (let i = 0; i < 4; i++) { p.rect(9, 12 + i * 2.5, 5, 1, '#6a5a40'); p.rect(18, 12 + i * 2.5, 5, 1, '#6a5a40'); } break;
    case 'estatua': p.ell(16, 16, 12, 12, '#8a869a'); p.ell(16, 16, 9, 9, '#b8b4c8'); p.ell(16, 13, 4, 4, '#d8d4e4'); p.rect(10, 17, 12, 6, '#a8a4b8', 'c'); break;
    case 'pilar': p.ell(16, 16, 11, 11, '#6a667a'); p.ell(16, 16, 9, 9, '#9a96aa'); p.ell(16, 16, 5, 5, '#b8b4c8'); break;
    case 'armas': p.rect(2, 8, 28, 16, '#5a3a20', 'v'); for (let i = 0; i < 4; i++) { p.line(5 + i * 7, 10, 5 + i * 7, 22, ['#c8c8d8', '#a8a8b8', '#d8d0a8', '#b0b0c8'][i], 2); p.rect(3 + i * 7, 20, 5, 2, '#8a5a30'); } break;
    case 'fornalha': p.rect(1, 1, 30, 30, '#4a3a38', 'v'); p.rect(5, 5, 22, 22, '#14101c'); p.ell(16, 16, 9, 9, '#a03a1a'); p.ell(16, 15, 6 + (f % 2), 6 + (f % 2), '#ff7a1a'); p.ell(16, 15, 3, 3, '#ffe080'); break;
    case 'toneis': p.ell(10, 10, 8, 8, '#8a5a30'); p.ell(10, 10, 6, 6, '#a06a38'); p.ell(22, 20, 8, 8, '#7a4a26'); p.ell(22, 20, 6, 6, '#946030'); p.ell(10, 10, 2, 2, '#5a3a20'); p.ell(22, 20, 2, 2, '#4a2e16'); break;
    case 'saco': p.ell(16, 16, 10, 10, '#c8a870'); p.ell(14, 14, 6, 6, '#dcc088'); p.rect(14, 5, 4, 3, '#6a4a2a'); break;
    case 'fonte': p.ell(16, 16, 14, 14, '#8a869a'); p.ell(16, 16, 11, 11, '#3a7ad0'); p.ell(14, 14, 6, 5, '#7ac0f0'); p.ell(16, 16, 3, 3, '#c8e8ff'); break;
    case 'trono': p.rect(3, 2, 26, 28, '#3a2a4a', 'v'); p.rect(6, 5, 20, 22, '#7a3a8a', 'v'); p.rect(6, 5, 20, 5, '#5a2a6a'); p.ell(16, 16, 4, 4, '#e8c860'); p.rect(3, 2, 26, 2, '#8a6aa0'); break;
    case 'cripta': p.rect(4, 3, 24, 26, '#8a869a', 'v'); p.rect(6, 5, 20, 22, '#6a667a', 'v'); p.rect(14, 8, 4, 16, '#b8b4c8'); p.rect(10, 12, 12, 4, '#b8b4c8'); break;
    case 'alcapao': p.rect(2, 2, 28, 28, '#5a3a20', 'v'); for (let i = 0; i < 4; i++) p.rect(2, 2 + i * 7, 28, 1, '#3a2412'); p.rect(13, 4, 6, 3, '#c8c8d8'); p.ell(16, 5, 3, 1.6, '#e0c040'); break;
    case 'colchao': p.rect(4, 4, 24, 24, '#c8b890', 'v'); p.rect(6, 6, 20, 8, '#f0e8d8', 'c'); break;
    case 'tela': p.rect(3, 3, 26, 26, '#4a3018'); p.rect(5, 5, 22, 22, '#2a5a9a'); p.ell(16, 18, 8, 5, '#3a9a3e'); p.ell(22, 10, 3, 3, '#ffd23f'); break;
    case 'barril': return barril();
    case 'luz': p.ell(16, 16, 6, 6, '#ffd23f'); p.ell(16, 16, 3, 3, '#fff2a0'); break;
    default: p.rect(4, 4, 24, 24, '#8a5a30', 'v');
  }
  p.contorno(0.5); return comSombra(p, 1, 2, 0.28);
}
export const MOBILIA_TIPOS = ['cama', 'mesa', 'cadeira', 'banco', 'estante', 'altar', 'lareira', 'fogao', 'balcao', 'espelho', 'planta', 'vaso', 'caldeirao', 'bancada', 'mapa', 'livro', 'estatua', 'pilar', 'armas', 'fornalha', 'toneis', 'saco', 'fonte', 'trono', 'cripta', 'alcapao', 'colchao', 'tela', 'luz'];
