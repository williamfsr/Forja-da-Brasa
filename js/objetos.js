// Objetos do cenário em 32 bits: árvores, rochas, prédios, baús, portais… cada um com rampas de luz e sombra.
import { Pix, rampa, mistura, escurece, clareia, hash2, clamp, cv } from './gfx.js';

const P = (w, h, fn) => { const p = new Pix(w, h); fn(p); return p; };
const hasS = (v) => v >= 0; void hasS;
// sombra elíptica suave sob o objeto (desenhada atrás do sprite)
export function comSombra(c, cx, cy, rx, ry, a = 0.32) {
  const o = cv(c.width, c.height), x = o.getContext('2d'); x.fillStyle = `rgba(10,6,20,${(a * 0.55).toFixed(3)})`; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); x.drawImage(c, 0, 0); o.limpo = c; o.base = cy; return o; // limpo/base: a sombra dinâmica (luz.js) projeta a silhueta a partir do pé
}
const folhas = (p, cx, cy, r, cor, sem) => { p.ell(cx, cy, r, r * 0.9, cor); const R = rampa(cor); for (let i = 0; i < r * 2.2; i++) { const a = hash2(i, sem, 3) * 6.28, d = hash2(i, sem, 5) * r * 0.7; p.set(cx + Math.cos(a) * d - r * 0.15, cy + Math.sin(a) * d - r * 0.25, i % 3 ? R.h : R.h2); } for (let i = 0; i < r; i++) { const a = hash2(i, sem, 9) * 6.28, d = hash2(i, sem, 11) * r * 0.6; p.set(cx + Math.cos(a) * d + r * 0.2, cy + Math.sin(a) * d + r * 0.3, R.s2); } };

export function arvore(v = 0, outono = false) {
  const base = outono ? ['#b8641e', '#d08a24', '#9a4a1a'] : ['#2a7a34', '#3a9a3e', '#1f6a2a']; const p = new Pix(32, 48);
  p.rect(13, 30, 6, 14, '#6a4426', 'c'); p.rect(11, 41, 10, 3, '#6a4426', 'v'); p.set(12, 43, '#4a2e16'); p.set(19, 43, '#4a2e16'); p.rect(14, 32, 1, 8, '#8a5a34'); p.rect(17, 34, 1, 6, '#4a2e16');
  const o = v % 3; const cs = o === 0 ? [[16, 17, 12], [8, 22, 8], [24, 22, 8], [16, 9, 9]] : o === 1 ? [[16, 16, 11], [7, 20, 8], [25, 21, 8], [12, 9, 7], [21, 8, 7]] : [[16, 18, 12], [9, 24, 7], [23, 25, 7], [16, 8, 8], [8, 14, 6], [25, 14, 6]];
  cs.forEach(([x, y, r], i) => folhas(p, x, y, r, base[i % 3], v * 7 + i));
  p.contorno(0.55); return comSombra(p.canvas(), 16, 44, 11, 3.5);
}
export function pinheiro(v = 0) {
  const p = new Pix(32, 48); p.rect(14, 38, 4, 7, '#5a3a20', 'c');
  const tiers = [[16, 3, 13, 15, 1], [16, 12, 17, 22, 2], [16, 22, 20, 30, 3], [16, 30, 22, 40, 4]]; // topo, largura crescente
  tiers.forEach(([cx, y0, hw, y1, i]) => { p.poly([[cx, y0], [cx - hw * 0.62, y1], [cx + hw * 0.62, y1]], i % 2 ? '#1c6a3a' : '#238046', 'g'); for (let k = 0; k < 6; k++) p.set(cx - hw * 0.45 + hash2(k, i + v, 2) * hw * 0.9, y0 + 3 + hash2(k, i + v, 4) * (y1 - y0 - 3), '#4aa860'); p.rect(cx - Math.floor(hw * 0.62), y1, Math.floor(hw * 1.24), 1, '#0e3a20'); });
  p.set(16, 3, '#f4f8ff'); p.set(15, 5, '#e8f0f8'); p.set(17, 6, '#e8f0f8'); p.contorno(0.55); return comSombra(p.canvas(), 16, 44, 9, 3);
}
export function montanha(neve = true, v = 0) {
  const p = new Pix(32, 44); const cor = v % 2 ? '#7a7684' : '#8a8694'; const hw = 15 + (v % 3);
  p.poly([[16, 4], [16 - hw, 40], [16 + hw, 40]], cor, 'g'); p.poly([[16, 4], [16 + 2, 40], [16 + hw, 40]], mistura(cor, '#2a2638', 0.35), 'f');
  for (let k = 0; k < 9; k++) { const y = 12 + hash2(k, v, 7) * 26, x = 16 - (y - 4) * 0.4 + hash2(k, v, 8) * (y - 4) * 0.8; p.line(x, y, x + 3, y + 4, '#5a566a'); }
  if (neve) { p.poly([[16, 4], [10, 16], [13, 14], [16, 18], [19, 13], [22, 16]], '#f4f8ff', 'g'); p.set(16, 4, '#ffffff'); }
  p.contorno(0.5); return comSombra(p.canvas(), 16, 40, 14, 3);
}
export function rocha(v = 0) {
  const p = new Pix(32, 32); p.ell(16, 21, 11, 8, '#8a8694'); p.ell(12, 18, 6, 5, '#a09cae'); p.ell(22, 23, 5, 4, '#6e6a7c'); if (v % 2) { p.ell(10, 15, 4, 2.5, '#4a8a3a'); p.set(8, 14, '#6aaa4a'); } p.line(18, 17, 20, 22, '#4a4658'); p.contorno(0.55); return comSombra(p.canvas(), 16, 28, 11, 3);
}
export function pedregulho() { return rocha(1); }
export function placa() { const p = new Pix(32, 36); p.rect(14, 18, 4, 16, '#6a4426', 'c'); p.rect(5, 5, 22, 15, '#a47a4c', 'v'); p.rect(5, 5, 22, 2, '#c49a6c'); p.rect(7, 9, 14, 2, '#4a2e16'); p.rect(7, 13, 10, 2, '#4a2e16'); p.set(6, 6, '#e0c040'); p.set(25, 6, '#e0c040'); p.set(6, 17, '#e0c040'); p.set(25, 17, '#e0c040'); p.contorno(0.55); return comSombra(p.canvas(), 16, 33, 8, 2.5); }
export function barril() { const p = new Pix(32, 32); p.ell(16, 18, 9, 11, '#8a5a30'); p.rect(7, 10, 18, 2, '#3a2a1a'); p.rect(7, 23, 18, 2, '#3a2a1a'); for (const x of [12, 16, 20]) p.rect(x, 8, 1, 20, '#b07a44'); p.ell(16, 8, 8, 2.6, '#a0703c'); p.ell(16, 8, 6, 1.6, '#6a4426'); p.contorno(0.55); return comSombra(p.canvas(), 16, 29, 10, 3); }
export function bigorna() { const p = new Pix(32, 32); p.rect(6, 12, 20, 6, '#5a5a68', 'v'); p.poly([[6, 12], [0, 14], [6, 17]], '#5a5a68', 'g'); p.rect(11, 18, 10, 5, '#46465a', 'c'); p.rect(8, 23, 16, 5, '#38384a', 'v'); p.rect(8, 12, 16, 1, '#c0c0d4'); p.set(22, 11, '#ff8a2a'); p.set(23, 11, '#ffd23f'); p.contorno(0.5); return comSombra(p.canvas(), 16, 29, 11, 3); }
export function braseiro(f = 0) {
  const p = new Pix(32, 44); p.rect(12, 28, 8, 12, '#4a4658', 'c'); p.rect(9, 38, 14, 3, '#38344a', 'v'); p.ell(16, 28, 11, 4, '#6a667a'); p.ell(16, 28, 9, 3, '#2a1a14'); p.ell(16, 28, 7, 2, '#a03a1a');
  const h = [0, 2, 1, 3][f % 4];
  p.poly([[16, 9 - h], [9, 27], [23, 27]], '#e8541a', 'f'); p.poly([[16, 14 - h], [11, 27], [21, 27]], '#ff8a1a', 'f'); p.poly([[16, 19 - h], [13, 27], [19, 27]], '#ffd23f', 'f'); p.poly([[16, 23], [14, 27], [18, 27]], '#fff6c0', 'f');
  p.set(8 + f, 20, '#ffb030'); p.set(24 - f, 16 + f, '#ffd23f'); p.contorno(0.5); return comSombra(p.canvas(), 16, 41, 11, 3);
}
export function poco() { const p = new Pix(32, 44); p.ell(16, 32, 12, 7, '#7a7688'); p.ell(16, 31, 10, 5.5, '#1a2a4a'); p.ell(16, 30, 7, 3, '#2a5a9a'); p.rect(5, 12, 3, 19, '#6a4426', 'c'); p.rect(24, 12, 3, 19, '#6a4426', 'c'); p.poly([[4, 13], [16, 2], [28, 13]], '#a03a2e', 'g'); p.rect(4, 12, 24, 2, '#6a1e18'); p.line(16, 14, 16, 27, '#c8b080'); p.rect(14, 25, 4, 3, '#8a5a30'); p.contorno(0.5); return comSombra(p.canvas(), 16, 38, 13, 3); }
export function tenda() { const p = new Pix(32, 40); p.rect(3, 15, 2, 22, '#6a4426', 'c'); p.rect(27, 15, 2, 22, '#6a4426', 'c'); p.rect(3, 27, 26, 3, '#8a6a42', 'v'); p.rect(3, 29, 26, 8, '#5a3e22', 'v');
  for (let i = 0; i < 6; i++) { p.rect(2 + i * 4.4, 4, 4.4, 11, i % 2 ? '#e8e0c8' : '#c83a3a', 'v'); } p.poly([[2, 4], [16, 0], [30, 4]], '#c83a3a', 'g'); for (let i = 0; i < 6; i++) { p.ell(4.2 + i * 4.4, 16, 2.2, 1.6, i % 2 ? '#e8e0c8' : '#c83a3a'); }
  p.ell(8, 26, 3, 2.5, '#e0b040'); p.ell(15, 26, 3, 2.5, '#4a9ae0'); p.ell(22, 26, 3, 2.5, '#d84a6a'); p.contorno(0.5); return comSombra(p.canvas(), 16, 37, 14, 3); }
export function cerca(h = true, v = true) {
  const p = new Pix(32, 32); const m = '#a47a4c';
  p.rect(4, 14, 5, 14, m, 'c'); p.rect(23, 14, 5, 14, m, 'c'); p.set(6, 14, '#c49a6c'); p.set(25, 14, '#c49a6c');
  if (h) { p.rect(0, 17, 32, 3, m, 'v'); p.rect(0, 23, 32, 3, m, 'v'); }
  if (v) { p.rect(13, 6, 5, 24, m, 'c'); }
  p.contorno(0.55); return comSombra(p.canvas(), 16, 29, 13, 2.5);
}
export function casinha() {
  const p = new Pix(32, 44); p.rect(4, 22, 24, 18, '#d8c8a0', 'v'); p.rect(4, 22, 24, 2, '#b8a880'); p.rect(4, 38, 24, 2, '#6a4a2a'); p.rect(4, 22, 2, 18, '#6a4a2a'); p.rect(26, 22, 2, 18, '#6a4a2a');
  p.poly([[16, 4], [0, 24], [32, 24]], '#b0402a', 'g'); for (let y = 10; y < 24; y += 4) p.line(16 - (y - 4) * 0.8, y, 16 + (y - 4) * 0.8, y, '#701c10'); p.rect(0, 23, 32, 2, '#701c10');
  p.rect(13, 28, 7, 12, '#6a4426', 'c'); p.set(18, 34, '#ffd23f'); p.rect(7, 28, 5, 5, '#6ab0e0'); p.rect(7, 28, 5, 1, '#9ad0f0'); p.rect(9, 28, 1, 5, '#6a4a2a'); p.rect(7, 30, 5, 1, '#6a4a2a'); p.rect(22, 28, 3, 5, '#6ab0e0'); p.rect(22, 6, 4, 8, '#7a7688', 'c');
  p.contorno(0.5); return comSombra(p.canvas(), 16, 40, 14, 3);
}
export function caverna(viva = false, f = 0) {
  const p = new Pix(32, 44); p.poly([[16, 2], [-2, 40], [34, 40]], '#8a8694', 'g'); p.poly([[16, 2], [20, 40], [34, 40]], '#5a566a', 'f');
  p.ell(16, 29, 10, 12, '#4a465a'); p.ell(16, 31, 8, 11, viva ? '#3a1a5a' : '#100c1a'); p.rect(8, 33, 16, 8, viva ? '#3a1a5a' : '#100c1a');
  if (viva) { p.ell(16, 34 - f, 4 + f, 6, '#a07af0'); p.ell(16, 34, 2, 3, '#e8d8ff'); p.set(10, 24, '#d8c0ff'); p.set(22, 28 - f, '#d8c0ff'); } else { p.set(16, 22, '#ffd23f'); p.set(15, 23, '#c89a2a'); p.set(17, 23, '#c89a2a'); }
  p.poly([[16, 2], [11, 12], [14, 10], [16, 14], [19, 9], [22, 12]], '#f4f8ff', 'g'); p.contorno(0.5); return comSombra(p.canvas(), 16, 41, 15, 3);
}
export function portal(f = 0) {
  const p = new Pix(32, 48); p.rect(2, 20, 5, 24, '#7a7688', 'c'); p.rect(25, 20, 5, 24, '#7a7688', 'c'); p.rect(0, 40, 32, 5, '#5a566a', 'v'); p.poly([[2, 20], [16, 2], [30, 20]], '#7a7688', 'g'); p.rect(5, 18, 22, 3, '#6a667a', 'v');
  p.ell(16, 28, 9, 14, '#3a1a7a'); p.ell(16, 28, 7, 12, f % 2 ? '#8a5af0' : '#6a3ae0'); p.ell(16, 28, 5, 9, f % 2 ? '#c0a0ff' : '#a07af0'); p.ell(16, 28, 2.5, 5, '#ffffff'); for (let i = 0; i < 6; i++) p.set(16 + Math.cos(i + f * 1.3) * 9, 28 + Math.sin(i * 1.7 + f) * 13, '#e8d8ff');
  p.set(16, 8, '#6af0ff'); p.set(15, 9, '#6af0ff'); p.set(17, 9, '#6af0ff'); p.contorno(0.5); return p.canvas();
}
export function bau(aberto = false, cor = '#8a5a30', ouro = false) {
  const p = new Pix(32, 32); const R = rampa(cor);
  if (!aberto) { p.rect(5, 14, 22, 13, cor, 'v'); p.ell(16, 14, 11, 5, R.h); p.rect(5, 14, 22, 2, R.h2); p.rect(5, 19, 22, 2, '#3a2a1a'); p.rect(14, 17, 4, 6, '#e0c040', 'v'); p.set(15, 20, '#3a2a1a'); p.rect(5, 14, 2, 13, '#c0b070'); p.rect(25, 14, 2, 13, '#c0b070'); }
  else { p.rect(5, 18, 22, 9, cor, 'v'); p.rect(7, 18, 18, 3, '#2a1a10'); p.poly([[5, 17], [8, 6], [24, 6], [27, 17]], R, 'g'); p.rect(8, 6, 16, 2, R.h2); if (ouro) { p.ell(12, 19, 3, 2, '#ffd23f'); p.ell(18, 18, 3, 2, '#fff2a0'); p.ell(22, 19, 2, 1.5, '#e0a020'); p.set(10, 16, '#ffffff'); p.set(20, 14, '#ffffff'); } }
  p.contorno(0.5); return comSombra(p.canvas(), 16, 28, 12, 3);
}
export function armadilha(armada = true) {
  const p = new Pix(32, 32); p.rect(4, 4, 24, 24, '#4a4658', 'v'); p.rect(4, 4, 24, 1, '#6a667a'); p.rect(4, 27, 24, 1, '#2a2638'); p.rect(4, 4, 1, 24, '#6a667a'); p.rect(27, 4, 1, 24, '#2a2638');
  for (const [x, y] of [[9, 9], [16, 9], [23, 9], [9, 16], [16, 16], [23, 16], [9, 23], [16, 23], [23, 23]]) { if (armada) { p.poly([[x, y - 4], [x - 2, y + 2], [x + 2, y + 2]], '#c8c8d8', 'g'); p.set(x, y - 3, '#ffffff'); } else p.ell(x, y, 1.5, 1.5, '#1a1624'); }
  return p.canvas();
}
export function santuario(f = 0) {
  const p = new Pix(32, 44); p.rect(8, 33, 16, 8, '#7a7688', 'v'); p.rect(11, 20, 10, 14, '#a8a4b8', 'c'); p.ell(16, 18, 7, 6, '#b8b4c8'); p.rect(10, 38, 12, 3, '#5a566a'); p.rect(14, 24, 4, 1, '#6af0ff'); p.rect(15, 22, 2, 5, '#6af0ff');
  p.ell(16, 10 - f, 5 + f, 5 + f, '#6af0ff'); p.ell(16, 10 - f, 3, 3, '#c8fbff'); p.set(16, 9 - f, '#ffffff'); for (let i = 0; i < 4; i++) p.set(16 + Math.cos(i * 1.6 + f) * 10, 14 + Math.sin(i * 2.1 + f) * 6, '#a8f4ff'); p.contorno(0.5); return comSombra(p.canvas(), 16, 40, 10, 3);
}
export function caixaTocha() { const p = new Pix(32, 36); p.rect(4, 16, 24, 14, '#8a5a30', 'v'); p.rect(4, 22, 24, 2, '#3a2a1a'); p.rect(4, 16, 24, 2, '#b07a44'); p.rect(7, 4, 3, 14, '#6a4426', 'c'); p.rect(15, 2, 3, 16, '#6a4426', 'c'); p.rect(22, 5, 3, 13, '#6a4426', 'c'); for (const x of [8, 16, 23]) { p.ell(x, 3 + (x === 16 ? 0 : 2), 2.5, 3, '#ff8a1a'); p.ell(x, 4 + (x === 16 ? 0 : 2), 1.2, 1.8, '#ffd23f'); } p.contorno(0.5); return comSombra(p.canvas(), 16, 32, 12, 3); }
export function escada(desce = true) {
  const p = new Pix(32, 32); p.rect(0, 0, 32, 32, '#1c1830');
  for (let i = 0; i < 5; i++) { const y = desce ? 3 + i * 5 : 3 + (4 - i) * 5; const c = ['#7a7692', '#625e7c', '#4e4a66', '#3a364e', '#2a2640'][desce ? i : 4 - i]; p.rect(3 + i * 1.2, y, 26 - i * 2.4, 5, c, 'v'); p.rect(3 + i * 1.2, y + 4, 26 - i * 2.4, 1, '#14101c'); }
  if (desce) { p.rect(12, 26, 8, 3, '#ffd23f'); p.set(15, 25, '#fff2a0'); p.set(16, 25, '#fff2a0'); } else { p.rect(12, 3, 8, 3, '#6af0ff'); p.set(15, 6, '#c8fbff'); p.set(16, 6, '#c8fbff'); }
  p.rect(0, 0, 3, 32, '#5a566a', 'c'); p.rect(29, 0, 3, 32, '#5a566a', 'c'); return p.canvas();
}
export function saidaMasmorra(f = 0) { const p = new Pix(32, 32); p.rect(0, 0, 32, 32, '#0c0a18'); p.ell(16, 16, 12, 14, '#3a1a7a'); p.ell(16, 16, 9, 11, f % 2 ? '#8a5af0' : '#6a3ae0'); p.ell(16, 16, 5, 7, '#e8d8ff'); p.rect(0, 0, 3, 32, '#5a566a', 'c'); p.rect(29, 0, 3, 32, '#5a566a', 'c'); return p.canvas(); }
export function tochaParede(f = 0) { const p = new Pix(32, 32); p.rect(14, 14, 4, 12, '#4a3a2a', 'c'); p.rect(11, 22, 10, 3, '#2a2a38', 'v'); p.ell(16, 11 - f * 0.6, 3.4, 5, '#e8541a'); p.ell(16, 12 - f * 0.6, 2.2, 3.6, '#ff8a1a'); p.ell(16, 13, 1.2, 2, '#ffd23f'); p.contorno(0.5); return p.canvas(); }

// decoração do piso das masmorras
export function decor(tipo, v = 0) {
  const p = new Pix(32, 32);
  if (tipo === 'osso') { p.line(7, 22, 20, 17, '#e8e0cc', 2); p.ell(6, 23, 2, 2, '#e8e0cc'); p.ell(8, 25, 2, 2, '#d8d0bc'); p.ell(21, 16, 2, 2, '#e8e0cc'); p.ell(22, 18, 2, 2, '#d8d0bc'); p.ell(22, 8 + v, 3.4, 3, '#efe8d8'); p.rect(20, 8 + v, 1, 2, '#2a2430'); p.rect(23, 8 + v, 1, 2, '#2a2430'); }
  else if (tipo === 'entulho') { for (const [x, y, r] of [[8, 22, 3], [14, 25, 2.4], [22, 20, 3.2], [18, 14, 2], [26, 26, 2]]) p.ell(x, y, r + 0.5, r, '#7a768a'); }
  else if (tipo === 'teia') { p.line(0, 0, 14, 14, '#d8d8e4'); p.line(0, 0, 4, 18, '#c8c8d8'); p.line(0, 0, 18, 4, '#c8c8d8'); p.line(0, 7, 7, 0, '#e8e8f0'); p.line(0, 12, 12, 0, '#e8e8f0'); p.line(0, 17, 17, 0, '#d8d8e4'); }
  else if (tipo === 'pote') { p.ell(16, 20, 7, 8, '#a0602a'); p.rect(11, 10, 10, 3, '#8a4e22', 'v'); p.ell(16, 11, 5, 1.8, '#5a3216'); p.rect(10, 20, 12, 1, '#e0a050'); p.contorno(0.5); }
  else if (tipo === 'cogumelo') { p.rect(8, 22, 3, 5, '#e8e0d0'); p.ell(9, 21, 5, 3.4, '#d84a3a'); p.set(8, 20, '#fff'); p.set(11, 21, '#fff'); p.rect(19, 24, 2, 4, '#e8e0d0'); p.ell(20, 23, 3.4, 2.4, '#7a4ae0'); p.set(19, 22, '#c8a0ff'); p.contorno(0.5); }
  else if (tipo === 'vela') { p.rect(14, 18, 5, 8, '#f0e8d0', 'c'); p.ell(16, 16, 2, 2.8, '#ffb030'); p.set(16, 15, '#fff2a0'); p.rect(11, 26, 11, 2, '#6a667a'); p.contorno(0.5); }
  else if (tipo === 'musgo') { for (let i = 0; i < 16; i++) p.ell(4 + hash2(i, v, 1) * 24, 4 + hash2(i, v, 2) * 24, 2 + hash2(i, v, 3) * 2, 1.6 + hash2(i, v, 4) * 1.5, i % 2 ? '#3a7a3a' : '#2a6a34'); }
  else if (tipo === 'rachadura') { p.line(6, 8, 14, 15, '#14101c'); p.line(14, 15, 12, 22, '#14101c'); p.line(14, 15, 24, 18, '#14101c'); p.line(24, 18, 27, 25, '#14101c'); }
  else if (tipo === 'runa') { p.ell(16, 16, 9, 9, '#3a2a6a'); p.ell(16, 16, 7, 7, '#2a1c50'); for (let i = 0; i < 6; i++) { const a = i * 1.047; p.line(16 + Math.cos(a) * 3, 16 + Math.sin(a) * 3, 16 + Math.cos(a + 1) * 6.5, 16 + Math.sin(a + 1) * 6.5, '#a07af0'); } }
  else if (tipo === 'sangue') { for (let i = 0; i < 9; i++) p.ell(8 + hash2(i, v, 1) * 16, 10 + hash2(i, v, 2) * 14, 1.5 + hash2(i, v, 3) * 3, 1 + hash2(i, v, 4) * 2, '#6a1420'); }
  return p.canvas();
}
export const DECOR_TIPOS = ['osso', 'entulho', 'teia', 'pote', 'cogumelo', 'vela', 'musgo', 'rachadura', 'runa', 'sangue'];

// ---------- prédios da vila ----------
export function telhado(cor, topo, esq, dir) {
  const R = rampa(cor); const p = new Pix(32, 32);
  p.rect(0, 0, 32, 32, R.b); for (let y = 0; y < 32; y += 6) { p.rect(0, y + 5, 32, 1, R.s2); for (let x = ((y / 6) % 2) * 5; x < 32; x += 10) { p.rect(x, y, 1, 5, R.s); p.rect(x + 1, y, 2, 1, R.h); } p.rect(0, y, 32, 1, R.h); }
  if (topo) { p.rect(0, 0, 32, 5, R.h, 'v'); p.rect(0, 5, 32, 1, R.s2); p.rect(0, 0, 32, 1, R.h2); }
  else { p.rect(0, 26, 32, 6, R.s); p.rect(0, 26, 32, 1, R.h); p.rect(0, 31, 32, 1, R.s2); for (let x = 0; x < 32; x += 6) p.rect(x, 26, 1, 6, R.s2); }
  if (esq) { p.rect(0, 0, 3, 32, R.s2); p.rect(3, 0, 1, 32, R.h); } if (dir) { p.rect(29, 0, 3, 32, R.s2); p.rect(28, 0, 1, 32, R.s); }
  return p.canvas();
}
export function paredePredio(janela, esq, dir, cor = '#d8c8a0') {
  const R = rampa(cor); const p = new Pix(32, 32); p.rect(0, 0, 32, 32, R.b); for (let y = 0; y < 32; y += 8) { p.rect(0, y, 32, 1, R.s); } for (let i = 0; i < 24; i++) p.set(hash2(i, 1, 1) * 32, hash2(i, 2, 1) * 32, R.s);
  p.rect(0, 0, 32, 4, '#38281a'); p.rect(0, 4, 32, 2, '#00000033' && '#5a4a38'); p.rect(0, 28, 32, 4, '#7a7688'); p.rect(0, 28, 32, 1, '#a8a4b8'); p.rect(0, 31, 32, 1, '#4a4658');
  p.rect(0, 6, 3, 22, '#6a4a2a', 'c'); p.rect(29, 6, 3, 22, '#6a4a2a', 'c'); if (esq === false) void 0;
  if (janela) { p.rect(7, 10, 18, 14, '#4a3018'); p.rect(9, 12, 14, 10, '#6ab0e0'); p.rect(9, 12, 14, 3, '#9ad8f8'); p.rect(15, 12, 2, 10, '#4a3018'); p.rect(9, 16, 14, 1, '#4a3018'); p.set(11, 18, '#e8f8ff'); p.set(18, 13, '#ffffff'); p.rect(6, 24, 20, 3, '#6a4a2a', 'v'); for (let x = 8; x < 24; x += 3) p.ell(x, 23, 1.5, 1.5, ['#e84a6a', '#ffd23f', '#ff8ab0'][(x / 3 | 0) % 3]); p.rect(6, 10, 2, 14, '#2a6a4a'); p.rect(24, 10, 2, 14, '#2a6a4a'); }
  void dir; return p.canvas();
}
export function portaPredio() {
  const p = new Pix(32, 32); p.rect(0, 0, 32, 32, '#d8c8a0'); p.rect(0, 0, 32, 4, '#38281a'); p.rect(0, 28, 32, 4, '#7a7688'); p.rect(0, 28, 32, 1, '#a8a4b8');
  p.rect(5, 6, 22, 26, '#4a3018'); p.poly([[5, 12], [9, 6], [23, 6], [27, 12]], '#4a3018', 'f'); p.rect(7, 9, 18, 23, '#8a5a30', 'c'); p.poly([[7, 14], [10, 9], [22, 9], [25, 14]], '#8a5a30', 'f'); p.rect(15, 9, 2, 23, '#5a3a1e'); for (const y of [13, 20, 26]) { p.rect(7, y, 18, 1, '#5a3a1e'); p.set(9, y - 1, '#e0c040'); p.set(22, y - 1, '#e0c040'); }
  p.ell(12, 20, 1.5, 1.5, '#ffd23f'); p.ell(20, 20, 1.5, 1.5, '#ffd23f'); p.rect(3, 29, 26, 3, '#a8a4b8', 'v'); p.rect(5, 2, 3, 6, '#2a2a38'); p.ell(6, 9, 2, 2.5, '#ffd23f'); p.rect(24, 2, 3, 6, '#2a2a38'); p.ell(25, 9, 2, 2.5, '#ffd23f'); return p.canvas();
}
