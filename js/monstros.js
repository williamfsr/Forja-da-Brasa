// Monstros e armas em 32 bits: 17 criaturas com silhueta própria, sombreamento por rampa e paleta por espécie.
import { Pix, rampa, mistura, escurece, clareia, hash2, cv } from './gfx.js';
import { spritePessoa } from './pessoa.js';
import { sortearAp } from './cosmeticos.js';

const OL = '#1a1222';
const claro = (c, t = 0.4) => mistura(c, '#ffffff', t);
const mulb = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const sh = (x, y, w, h) => ({ x, y, w, h }); void sh;
// olho brilhante com ponto de luz
const olho = (p, x, y, cor = '#ff3030', r = 1) => { p.ell(x, y, r + 0.5, r + 0.5, cor); p.set(x, y, claro(cor, 0.7)); };
const dentes = (p, x, y, n, cor = '#f4f0e0') => { for (let i = 0; i < n; i++) { p.set(x + i * 2, y, cor); p.set(x + i * 2, y + 1, mistura(cor, '#000', 0.25)); } };

const M = {
  rato: (p, c) => { const a = c.a || '#8a7a6a', A = c.A || '#5a4a3a'; const R = rampa(a);
    p.line(26, 15, 29, 11, '#d8a0a0', 2); p.line(29, 11, 31, 6, '#d8a0a0', 1); p.ell(16, 14, 10, 6, a); p.ell(14, 12, 6, 3, R.h); p.ell(7, 13, 5.2, 4.2, a); p.poly([[1, 15], [5, 11], [5, 16]], A, 'g'); p.set(1, 15, '#e08a8a'); p.set(2, 15, '#e08a8a');
    p.ell(9, 8, 3.2, 3.2, A); p.ell(9, 8, 1.8, 1.8, '#e0a0a0'); p.ell(13, 9, 2.6, 2.6, A); p.ell(13, 9, 1.4, 1.4, '#e0a0a0'); olho(p, 6, 12, c.e || '#ff3030', 0.6);
    for (const x of [8, 12, 20, 24]) p.rect(x, 18, 2, 3, A, 'c'); p.line(2, 14, -1, 13, '#e8e0d0'); p.line(2, 15, -1, 16, '#e8e0d0'); p.set(3, 17, '#f4f0e0'); },
  morcego: (p, c) => { const a = c.a || '#5a3a6a', A = c.A || '#3a2248'; const W = rampa(A);
    for (const s of [-1, 1]) { const cx = 20, bx = (x) => cx + s * x; p.poly([[bx(3), 13], [bx(18), 3], [bx(19), 12], [bx(14), 16], [bx(11), 22], [bx(7), 17], [bx(3), 21]], W, 'g'); p.line(bx(3), 13, bx(18), 3, a); p.line(bx(3), 14, bx(14), 16, a); p.line(bx(3), 14, bx(11), 22, a); p.line(bx(3), 14, bx(19), 12, a); }
    p.ell(20, 16, 4.2, 6, a); p.ell(20, 11, 4.4, 3.8, a); p.poly([[16, 10], [15, 3], [19, 8]], A, 'g'); p.poly([[24, 10], [25, 3], [21, 8]], A, 'g'); p.set(15, 4, '#e0a0b0'); p.set(25, 4, '#e0a0b0'); olho(p, 18, 11, c.e || '#ff3030', 0.7); olho(p, 22, 11, c.e || '#ff3030', 0.7); p.set(19, 14, '#fff'); p.set(21, 14, '#fff'); p.set(19, 15, '#fff'); p.set(21, 15, '#fff'); },
  limo: (p, c) => { const a = c.a || '#4ac86a', A = c.A || '#2a8a44', l = c.l || claro(a, 0.45);
    p.rect(2, 20, 36, 7, A, 'v'); p.ell(20, 17, 17.5, 11.5, A); p.ell(20, 15, 15.5, 9.8, a); p.ell(14, 10, 7, 3.6, l); p.set(10, 8, '#fff'); p.set(11, 8, '#fff'); p.set(9, 9, '#fff');
    for (const [x, y, r] of [[26, 18, 2.2], [31, 14, 1.6], [12, 21, 1.8], [24, 22, 1.3]]) { p.ell(x, y, r, r, A); p.set(x - 1, y - 1, l); }
    p.ell(14, 14, 3.4, 4, '#f4fff4'); p.ell(25, 14, 3.4, 4, '#f4fff4'); p.ell(14.5, 15, 1.6, 2.2, '#1a1222'); p.ell(25.5, 15, 1.6, 2.2, '#1a1222'); p.set(14, 14, '#fff'); p.set(25, 14, '#fff'); p.rect(16, 20, 8, 1, '#1a3a22'); p.set(15, 19, '#1a3a22'); p.set(24, 19, '#1a3a22'); p.rect(30, 24, 2, 4, a); p.set(30, 28, l); p.contorno(0.5); },
  goblin: (p, c) => { const a = c.g || c.a || '#6aa83a', A = c.G || c.A || '#3a6a1e'; const cu = '#7a5a3a'; const R = rampa(a);
    p.rect(11, 29, 4, 9, A, 'c'); p.rect(17, 29, 4, 9, A, 'c'); p.rect(10, 36, 6, 3, '#3a2616', 'cv'); p.rect(16, 36, 6, 3, '#3a2616', 'cv'); p.rect(9, 21, 14, 11, cu, 'v'); p.rect(9, 28, 14, 2, '#4a3018'); p.rect(15, 28, 2, 2, '#e0c040');
    p.rect(5, 22, 4, 9, a, 'c'); p.rect(23, 22, 4, 9, a, 'c'); p.ell(7, 32, 2.4, 2.4, R.b); p.ell(25, 32, 2.4, 2.4, R.b);
    p.poly([[1, 14], [9, 11], [10, 17], [8, 18]], a, 'g'); p.poly([[31, 14], [23, 11], [22, 17], [24, 18]], a, 'g'); p.set(4, 14, '#e0a090'); p.set(28, 14, '#e0a090');
    p.ell(16, 14, 8, 7.5, a); p.ell(14, 11, 4, 2.5, R.h); olho(p, 12, 13, c.e || '#ffd23f', 1); olho(p, 20, 13, c.e || '#ffd23f', 1); p.set(12, 13, '#1a1222'); p.set(20, 13, '#1a1222'); p.rect(11, 10, 4, 1, A); p.rect(18, 10, 4, 1, A);
    p.rect(12, 18, 8, 2, '#3a1a1a'); dentes(p, 13, 18, 3); p.set(15, 15, R.s2); p.set(16, 15, R.s2);
    p.line(28, 30, 31, 20, '#d8dce8', 2); p.rect(26, 29, 6, 2, '#5a3a22'); p.contorno(0.5); },
  esqueleto: (p, c) => { const b = c.e || '#e6e2d4', B = '#a8a290'; const R = rampa(b);
    p.rect(12, 33, 3, 12, R, 'c'); p.rect(17, 33, 3, 12, R, 'c'); p.rect(11, 43, 5, 3, B, 'cv'); p.rect(16, 43, 5, 3, B, 'cv'); p.ell(13.5, 38, 2.2, 2, R.h); p.ell(18.5, 38, 2.2, 2, R.h); p.rect(10, 31, 12, 3, R.b, 'v'); p.rect(14, 22, 4, 10, R, 'c');
    for (let i = 0; i < 4; i++) { p.rect(9, 21 + i * 3, 14, 2, R.b, 'v'); p.rect(15, 21 + i * 3, 2, 2, B); } p.rect(8, 21, 3, 3, R.h); p.rect(21, 21, 3, 3, R.h);
    p.rect(5, 22, 3, 12, R, 'c'); p.rect(24, 22, 3, 12, R, 'c'); p.ell(6.5, 35, 2, 2, R.h); p.ell(25.5, 35, 2, 2, R.h);
    p.ell(16, 12, 7.2, 7, b); p.rect(11, 16, 10, 5, b, 'v'); p.rect(11, 19, 10, 2, B); p.rect(11, 16, 10, 1, R.s); p.ell(12.5, 12, 2.4, 2.6, OL); p.ell(19.5, 12, 2.4, 2.6, OL); olho(p, 12, 12, '#6af0ff', 0.7); olho(p, 20, 12, '#6af0ff', 0.7); p.set(16, 15, OL); p.set(16, 16, OL);
    for (const x of [12, 14, 16, 18, 20]) p.set(x, 19, OL);
    p.line(27, 36, 29, 16, '#c0c8d8', 2); p.rect(25, 35, 6, 2, '#6a4a2a'); p.rect(27, 37, 2, 4, '#4a3018'); p.contorno(0.5); },
  zumbi: (p, c) => { const z = c.z || '#8aa07a', Z = c.Z || '#4a5a3a', u = c.u || '#5a6a4a'; const R = rampa(z);
    p.rect(11, 33, 4, 12, '#4a4a3a', 'c'); p.rect(17, 33, 4, 12, '#3e3e30', 'c'); p.rect(10, 43, 6, 3, '#2a2a22', 'cv'); p.rect(16, 43, 6, 3, '#2a2a22', 'cv'); p.rect(9, 22, 14, 12, u, 'v'); p.rect(9, 32, 14, 2, '#2a3a24'); p.rect(12, 26, 3, 5, Z); p.set(17, 24, '#8a1a1a'); p.set(18, 25, '#8a1a1a');
    p.rect(2, 22, 8, 4, z, 'v'); p.rect(22, 22, 8, 4, z, 'v'); p.ell(2, 24, 2.4, 2.4, R.b); p.ell(30, 24, 2.4, 2.4, R.b); p.rect(3, 25, 1, 3, R.s); p.rect(29, 25, 1, 3, R.s);
    p.ell(16, 13, 7.5, 7.5, z); p.ell(14, 10, 4, 2.4, R.h); p.rect(11, 18, 10, 4, z, 'v'); p.ell(12.5, 12, 2.2, 2.4, OL); p.ell(19.5, 12, 2, 2, OL); olho(p, 12, 12, '#d03030', 0.6); p.set(20, 12, '#d0d040'); p.rect(12, 19, 8, 2, '#2a1a1a'); dentes(p, 13, 19, 3, '#c8c0a0'); p.rect(11, 7, 5, 1, Z); p.set(14, 8, '#8a1a1a'); p.contorno(0.5); },
  lobo: (p, c) => { const f = c.f || '#8a8a9a', F = c.F || '#5a5a6a'; const R = rampa(f);
    p.poly([[38, 14], [47, 5], [46, 14], [41, 18]], F, 'g'); p.ell(26, 16, 15, 7.5, f); p.ell(23, 13, 10, 3.6, R.h); p.ell(30, 20, 11, 3, F);
    for (const [x, o] of [[12, 0], [18, 1], [31, 0], [37, 1]]) { p.rect(x, 20, 4, 9, o ? F : f, 'c'); p.rect(x - 1, 27, 6, 3, escurece(F, 0.2), 'cv'); }
    p.ell(10, 14, 7, 6, f); p.ell(8, 12, 4, 2.4, R.h); p.poly([[1, 15], [8, 13], [8, 20], [2, 19]], f, 'g'); p.rect(2, 18, 6, 2, R.s); p.set(1, 15, OL); p.set(2, 15, OL); p.set(0, 16, OL);
    p.poly([[7, 5], [10, 11], [5, 11]], F, 'g'); p.poly([[13, 5], [14, 11], [9, 10]], F, 'g'); olho(p, 7, 13, '#ffd23f', 0.8); p.set(7, 13, '#1a1222'); dentes(p, 3, 18, 3);
    for (let i = 0; i < 6; i++) p.set(14 + i * 4, 9 + (i % 2), R.h2); p.contorno(0.5); },
  aranha: (p, c) => { const a = c.a || '#6a3a5a', A = c.A || '#4a2440'; const R = rampa(a);
    for (const [x0, y0, ang] of [[22, 20, 0], [20, 21, 1], [18, 21, 2], [16, 20, 3]]) { const dx = [-1, -1.1, -1.2, -1.4][ang]; for (const s of [-1, 1]) { const ex = 24 + dx * 18, up = 6 + ang * 2; p.line(x0, y0, x0 + s * 8 * (ang < 2 ? 0.9 : 1.0) * 1, y0 - 8 + ang, A, 1); const bx = x0 + s * (7 + ang), by = y0 - 7 + ang; p.line(bx, by, bx + s * 5, 33 - ang * 0.5, A, 1); void ex; void up; } }
    p.ell(31, 20, 9.5, 8.5, a); p.ell(28, 16, 5, 3.6, R.h); p.poly([[29, 14], [33, 11], [36, 14]], '#c8302a', 'f'); p.set(31, 12, '#e86050'); p.ell(18, 21, 6.4, 5.4, A); p.ell(17, 19, 3.2, 2, rampa(A).h);
    for (const [x, y] of [[14, 19], [16, 17], [18, 17], [20, 19]]) olho(p, x, y, '#ff3030', 0.6); p.poly([[13, 24], [15, 28], [17, 24]], '#e8e0d0', 'f'); p.poly([[19, 24], [21, 28], [23, 24]], '#e8e0d0', 'f'); p.contorno(0.5); },
  bruto: (p, c, W, H, o) => { const b = c.b || '#6a9a4a', B = c.B || '#3a5a2a'; const R = rampa(b); const tusk = (o.tags || []).includes('humanoide') || true; const G = (o.tam || 48) / 48; void G;
    p.rect(14, 38, 8, 15, B, 'c'); p.rect(26, 38, 8, 15, B, 'c'); p.rect(12, 50, 11, 5, '#3a2a1a', 'cv'); p.rect(25, 50, 11, 5, '#3a2a1a', 'cv');
    p.rect(12, 22, 24, 18, B, 'v'); p.rect(14, 22, 20, 12, R, 'v'); p.rect(12, 36, 24, 4, '#5a3a22', 'v'); p.rect(22, 36, 4, 4, '#e0c040'); p.line(14, 22, 34, 36, '#4a3018', 2); p.rect(12, 38, 24, 5, '#6a4a2a'); for (let x = 12; x < 36; x += 4) p.rect(x, 43, 2, 3, '#6a4a2a');
    p.ell(9, 25, 6.4, 5.4, R); p.ell(39, 25, 6.4, 5.4, R); p.rect(4, 28, 7, 12, b, 'c'); p.rect(37, 28, 7, 12, b, 'c'); p.ell(7, 41, 4, 3.6, R); p.ell(41, 41, 4, 3.6, R);
    p.rect(43, 2, 4, 36, '#7a5a3a', 'c'); p.ell(45, 4, 5, 4.6, '#6a4a2a'); for (const [x, y] of [[42, 2], [48, 6], [44, 8]]) p.set(x, y, '#c0c0c8'); p.rect(42, 38, 6, 3, R.b);
    p.ell(24, 15, 8, 7.4, b); p.ell(22, 12, 4.4, 2.6, R.h); p.rect(15, 11, 18, 3, B); olho(p, 20, 15, '#ffd23f', 1); olho(p, 28, 15, '#ffd23f', 1); p.set(20, 15, OL); p.set(28, 15, OL); p.rect(18, 12, 5, 1, OL); p.rect(26, 12, 5, 1, OL);
    p.rect(19, 20, 10, 3, '#2a1414'); p.poly([[19, 20], [20, 16], [22, 20]], '#f4f0e0', 'f'); p.poly([[29, 20], [28, 16], [26, 20]], '#f4f0e0', 'f'); p.contorno(0.5); },
  fantasma: (p, c) => { const a = c.p || '#cfd8f0'; const R = rampa(a);
    p.ell(18, 17, 11, 13, a); p.rect(7, 17, 22, 20, a, 'cv'); for (let x = 7; x < 29; x++) { const y = 37 + Math.round(Math.sin(x * 0.9) * 3); p.rect(x, 35, 1, y - 35 + 1, x % 4 < 2 ? R.b : R.s); }
    p.ell(14, 11, 5, 4, R.h); p.poly([[3, 22], [8, 20], [10, 28], [4, 34]], R.s, 'g'); p.poly([[33, 22], [28, 20], [26, 28], [32, 34]], R.s, 'g');
    p.ell(14, 17, 2.6, 3.4, OL); p.ell(22, 17, 2.6, 3.4, OL); olho(p, 14, 17, '#6af0ff', 0.7); olho(p, 22, 17, '#6af0ff', 0.7); p.ell(18, 25, 2.6, 3.8, OL); p.contorno(0.42); },
  gargula: (p, c) => { const g = c.r || '#8a8a96', G = c.R || '#5a5a66'; const R = rampa(g);
    for (const s of [-1, 1]) { const bx = (x) => 24 + s * x; p.poly([[bx(5), 18], [bx(23), 4], [bx(22), 20], [bx(16), 24], [bx(12), 30], [bx(7), 26]], G, 'g'); p.line(bx(5), 18, bx(22), 8, R.h); p.line(bx(6), 22, bx(18), 20, R.s2); }
    p.rect(17, 40, 5, 7, G, 'c'); p.rect(26, 40, 5, 7, G, 'c'); p.rect(15, 45, 8, 3, '#4a4a56', 'cv'); p.rect(25, 45, 8, 3, '#4a4a56', 'cv'); p.ell(24, 31, 9, 10, g); p.ell(21, 28, 4, 4, R.h); p.rect(18, 36, 12, 3, G);
    p.ell(24, 18, 6.6, 6, g); p.poly([[18, 15], [14, 6], [21, 12]], G, 'g'); p.poly([[30, 15], [34, 6], [27, 12]], G, 'g'); olho(p, 21, 18, '#ff3030', 0.9); olho(p, 27, 18, '#ff3030', 0.9); p.rect(20, 22, 8, 2, OL); dentes(p, 21, 22, 3); p.rect(11, 28, 5, 3, g); p.rect(32, 28, 5, 3, g); p.contorno(0.5); },
  dragao: (p, c) => { const d = c.d || '#c03a2a', D = c.D || '#701410'; const R = rampa(d); const Dr = rampa(D);
    p.poly([[30, 24], [44, 2], [60, 10], [54, 22], [50, 18], [47, 28], [42, 24], [36, 32]], Dr, 'g'); p.line(30, 24, 44, 2, R.h); p.line(34, 26, 47, 14, R.b); p.line(40, 28, 54, 20, R.b);
    p.line(46, 40, 60, 46, d, 5); p.line(60, 46, 63, 38, d, 3); p.poly([[63, 36], [61, 42], [63, 44]], D, 'g');
    p.ell(34, 36, 20, 11, d); p.ell(30, 31, 12, 4, R.h); p.ell(32, 42, 16, 5, '#e8c070'); for (let i = 0; i < 5; i++) p.rect(20 + i * 5, 39, 4, 1, '#c8a050'); for (let i = 0; i < 6; i++) p.poly([[24 + i * 4, 26], [26 + i * 4, 22], [28 + i * 4, 26]], D, 'f');
    p.rect(40, 44, 7, 10, d, 'c'); p.rect(24, 45, 7, 9, D, 'c'); p.rect(38, 52, 10, 4, '#2a1a14', 'cv'); p.rect(22, 52, 10, 4, '#2a1a14', 'cv'); for (const x of [39, 43, 47]) p.poly([[x, 55], [x + 1, 55], [x, 57]], '#e8e0d0', 'f');
    p.line(16, 30, 9, 18, d, 7); p.line(10, 20, 9, 14, d, 6); p.ell(8, 14, 8, 6, d); p.poly([[0, 14], [8, 11], [10, 19], [2, 19]], d, 'g'); p.ell(7, 11, 5, 2.4, R.h); p.rect(1, 17, 8, 2, D); dentes(p, 1, 17, 4); olho(p, 8, 12, '#ffd23f', 1); p.set(8, 12, '#1a1222'); p.set(1, 14, OL); p.set(2, 14, OL);
    p.poly([[10, 8], [12, 0], [14, 9]], '#e8e0d0', 'g'); p.poly([[16, 9], [19, 2], [20, 11]], '#e8e0d0', 'g'); p.ell(0, 20, 2, 3, '#ff8a1a'); p.set(0, 20, '#ffd23f'); p.contorno(0.5); },
  golem: (p, c) => { const g = c.g || '#8a8a94', G = c.G || '#4a4a54'; const R = rampa(g);
    p.rect(14, 42, 9, 12, G, 'c'); p.rect(26, 42, 9, 12, G, 'c'); p.rect(12, 51, 12, 5, '#3a3a44', 'cv'); p.rect(25, 51, 12, 5, '#3a3a44', 'cv');
    p.rect(11, 18, 26, 26, g, 'v'); for (const [x, y, w, h] of [[12, 19, 11, 9], [24, 19, 12, 9], [12, 29, 8, 10], [21, 29, 15, 10]]) { p.rect(x, y, w, h, R.b, 'v'); p.rect(x, y + h - 1, w, 1, R.s2); }
    p.line(20, 28, 27, 34, G); p.line(27, 34, 24, 42, G); p.rect(23, 30, 4, 6, '#ffd23f'); p.rect(24, 31, 2, 4, '#fff2a0');
    p.rect(2, 20, 9, 12, G, 'c'); p.rect(37, 20, 9, 12, G, 'c'); p.rect(0, 31, 11, 13, g, 'v'); p.rect(37, 31, 11, 13, g, 'v'); p.rect(0, 43, 11, 2, G); p.rect(37, 43, 11, 2, G); p.rect(3, 33, 3, 3, R.s); p.rect(41, 34, 3, 3, R.s);
    p.rect(17, 5, 14, 14, g, 'v'); p.rect(17, 5, 14, 3, R.h); p.rect(18, 11, 4, 3, '#ffd23f'); p.rect(26, 11, 4, 3, '#ffd23f'); p.set(19, 12, '#fff2a0'); p.set(27, 12, '#fff2a0'); p.rect(20, 16, 8, 1, G); p.contorno(0.5); },
  rei: (p, c) => { const rb = c.v || '#2a2640';
    p.poly([[24, 20], [4, 55], [44, 55]], rb, 'g'); p.poly([[24, 24], [12, 55], [36, 55]], mistura(rb, '#4a4670', 0.3), 'g'); p.rect(4, 52, 40, 3, '#14101c'); for (let i = 0; i < 6; i++) p.set(10 + i * 6, 54, '#4a4670');
    p.rect(20, 26, 8, 12, '#4a4670', 'c'); p.rect(14, 24, 20, 3, '#6a64a0', 'v'); p.ell(11, 26, 5, 4, '#4a4670'); p.ell(37, 26, 5, 4, '#4a4670'); p.rect(6, 28, 5, 14, '#2a2640', 'c'); p.rect(37, 28, 5, 14, '#2a2640', 'c'); p.ell(8, 43, 2.6, 2.6, '#e8e8f0'); p.ell(40, 43, 2.6, 2.6, '#e8e8f0');
    p.ell(24, 14, 7.5, 8, '#e8e8f0'); p.ell(22, 11, 3.6, 2.4, '#fff'); p.ell(20.5, 14, 2.4, 3, OL); p.ell(27.5, 14, 2.4, 3, OL); olho(p, 20, 14, '#6af0ff', 0.8); olho(p, 28, 14, '#6af0ff', 0.8); p.rect(23, 18, 2, 2, OL); for (const x of [19, 21, 23, 25, 27]) p.set(x, 21, OL); p.rect(18, 20, 12, 2, '#d8d8e4');
    p.rect(15, 4, 18, 4, '#bfe8ff', 'v'); for (const x of [15, 20, 26, 31]) p.poly([[x, 4], [x + 2, -3], [x + 3, 4]], '#d8f4ff', 'g'); p.ell(24, 6, 1.5, 1.5, '#ff3a6a'); p.line(42, 6, 42, 54, '#7a5a3a', 2); p.ell(42, 6, 4.6, 4.6, '#6af0ff'); p.ell(42, 6, 2.2, 2.2, '#fff'); p.contorno(0.5); },
  serpe: (p, c) => { const s = c.s || '#5a8a3a', S = c.S || '#2e5a1e'; const R = rampa(s);
    const pts = []; for (let t = 0; t <= 1; t += 0.02) { const x = 44 - t * 40, y = 22 + Math.sin(t * 9) * 7 * (0.4 + t * 0.6); pts.push([x, y, 3.4 - t * 1.6]); }
    pts.forEach(([x, y, r], i) => p.ell(x, y, r + 0.5, r + 0.5, i % 4 < 2 ? s : S));
    pts.forEach(([x, y, r], i) => { if (i % 4 === 0) p.set(x - 1, y - r + 1, R.h2); });
    p.ell(8, 12, 6.4, 5, s); p.ell(6, 10, 3.4, 2, R.h); p.poly([[1, 12], [9, 9], [11, 15], [2, 15]], s, 'g'); olho(p, 8, 10, '#ffd23f', 0.9); p.set(8, 10, '#1a1222'); p.line(1, 14, -1, 14, '#e03a3a'); p.set(-1, 13, '#e03a3a'); p.set(-1, 15, '#e03a3a'); p.set(0, 14, '#e03a3a'); p.set(1, 13, S); p.contorno(0.5); },
  vampiro: (p, c) => { const v = c.v || '#6a1a3a', V = c.V || '#2e0a18'; const R = rampa(v);
    for (const s of [-1, 1]) p.poly([[18 + s * 6, 14], [18 + s * 17, 30], [18 + s * 18, 46], [18 + s * 4, 47]], V, 'g');
    p.poly([[18, 16], [4, 47], [32, 47]], v, 'g'); p.rect(10, 20, 16, 26, '#1a1020', 'v'); p.rect(14, 20, 8, 8, '#e8e8f0'); p.rect(17, 22, 2, 8, '#a02a3a'); p.rect(10, 38, 16, 2, '#4a2a2a'); p.rect(12, 44, 5, 4, '#14101c'); p.rect(19, 44, 5, 4, '#14101c');
    p.poly([[4, 14], [8, 30], [12, 22], [12, 14]], R, 'g'); p.poly([[32, 14], [28, 30], [24, 22], [24, 14]], R, 'g');
    p.ell(18, 11, 6.4, 7, '#ecdada'); p.ell(16, 8, 3, 2, '#fff2f2'); p.ell(18, 5, 6.6, 3, '#1a1020'); p.rect(11, 6, 14, 2, '#1a1020'); p.poly([[13, 6], [18, 12], [11, 11]], '#1a1020', 'f'); olho(p, 15, 11, '#ff3030', 0.7); olho(p, 21, 11, '#ff3030', 0.7); p.rect(15, 15, 6, 1, '#7a2a3a'); p.set(15, 16, '#fff'); p.set(20, 16, '#fff'); p.contorno(0.5); },
};
const TAM = { rato: [32, 22], morcego: [40, 32], limo: [40, 30], goblin: [32, 40], esqueleto: [32, 48], zumbi: [32, 48], lobo: [48, 32], aranha: [48, 36], bruto: [48, 56], fantasma: [36, 48], gargula: [48, 48], dragao: [64, 58], golem: [48, 56], rei: [48, 56], serpe: [48, 32], vampiro: [36, 48] };
export const TAMANHO_SPR = TAM;
const DEF = { rato: { a: '#8a7a6a', A: '#5a4a3a', e: '#ff3030' }, morcego: { a: '#5a3a6a', A: '#3a2248' }, limo: { a: '#4ac86a', A: '#2a8a44' }, goblin: { a: '#6aa83a', A: '#3a6a1e' }, aranha: { a: '#6a3a5a', A: '#4a2440' } };
const cache = new Map();
export function spriteMonstro(spr, pal = {}, id = 'x', tags = [], ap = null) {
  const k = spr + JSON.stringify(pal) + id + (ap ? JSON.stringify(ap) : ''); let c = cache.get(k); if (c) return c;
  if (spr === 'humano') { c = humanoide(pal, id, ap); cache.set(k, c); return c; }
  const [W, H] = TAM[spr] || TAM.limo; const p = new Pix(W, H); const cor = { ...(DEF[spr] || {}), ...pal };
  if (spr === 'limo' && pal.l) { cor.a = pal.l; cor.A = pal.L; cor.l = claro(pal.l, 0.45); }
  (M[spr] || M.limo)(p, cor, W, H, { tags, id }); const cn = p.canvas(); cache.set(k, cn); return cn;
}
function humanoide(pal, id, apIn = null) {
  const racas = ['humano', 'humano', 'meioorc', 'meioelfo', 'humano', 'anao'], rng = mulb([...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7)); const raca = racas[Math.floor(rng() * racas.length)];
  const ap = apIn ? { ...apIn } : sortearAp(rng, 'ladino', raca); ap.roupa = 0; ap.roupa1 = pal.u || '#5a6a8a'; ap.roupa2 = pal.U || '#34405a'; ap.capa = 0; ap.acess = rng() < 0.3 ? 1 : 0; ap.barba = rng() < 0.4 ? 2 + Math.floor(rng() * 4) : 0;
  if (id === 'medusa') { ap.raca = 'humano'; ap.pele = '#7ab88a'; ap.cabelo = 0; }
  const base = spritePessoa(ap, { cls: 'ladino' }, 'baixo', 'idle'); const w = 36, h = 48, c = cv(w, h), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(base, 2, 0);
  // arma na mão direita
  x.drawImage(spriteArma('espada', '#d0d6e4'), 5, 10);
  return c;
}

// ---------- armas ----------
const armaCache = new Map();
export function spriteArma(tipo, cor = '#d0d6e4') {
  const k = tipo + cor; let c = armaCache.get(k); if (c) return c; const p = new Pix(32, 40); const M = rampa(cor);
  if (tipo === 'espada') { p.rect(21, 3, 3, 22, M, 'c'); p.poly([[21, 3], [22.5, 0], [24, 3]], M.h2, 'f'); p.rect(18, 24, 9, 2, '#d8b43a', 'v'); p.rect(21, 26, 3, 7, '#5a3a22', 'c'); p.ell(22.5, 34, 2, 2, '#d8b43a'); p.rect(22, 4, 1, 18, M.h2); }
  else if (tipo === 'adaga') { p.rect(21, 12, 3, 12, M, 'c'); p.poly([[21, 12], [22.5, 8], [24, 12]], M.h2, 'f'); p.rect(19, 24, 7, 2, '#8a6a2a', 'v'); p.rect(21, 26, 3, 5, '#3a2616', 'c'); }
  else if (tipo === 'machado') { p.rect(21, 4, 3, 30, '#6a4a2a', 'c'); p.poly([[24, 4], [32, 7], [32, 17], [24, 14]], M, 'g'); p.poly([[21, 6], [14, 9], [14, 15], [21, 14]], M, 'g'); p.rect(24, 5, 6, 1, M.h2); p.rect(21, 32, 3, 3, '#3a2616'); }
  else if (tipo === 'martelo') { p.rect(21, 8, 3, 28, '#6a4a2a', 'c'); p.rect(14, 2, 18, 9, M, 'v'); p.rect(14, 2, 18, 1, M.h2); p.rect(14, 10, 18, 1, M.s2); p.rect(21, 34, 3, 3, '#3a2616'); }
  else if (tipo === 'lanca') { p.rect(22, 8, 2, 30, '#8a6a42', 'c'); p.poly([[21, 8], [23, 0], [25, 8]], M, 'g'); p.rect(21, 8, 4, 2, '#c8302a'); }
  else if (tipo === 'cajado') { p.rect(22, 8, 3, 30, '#7a5230', 'c'); p.ell(23.5, 6, 5, 5, '#6af0ff'); p.ell(23.5, 6, 2.4, 2.4, '#e8fcff'); p.rect(20, 10, 7, 2, '#d8b43a'); p.set(19, 4, '#a8f4ff'); p.set(28, 8, '#a8f4ff'); }
  else if (tipo === 'arco') { for (let t = 0; t <= 1; t += 0.04) { const a = (t - 0.5) * 2.6; p.set(18 + Math.cos(a) * 7 - 3, 20 + Math.sin(a) * 15, '#8a5a30'); p.set(19 + Math.cos(a) * 7 - 3, 20 + Math.sin(a) * 15, '#a47a4c'); } p.line(18, 5, 18, 35, '#e8e0d0'); p.line(18, 20, 28, 20, '#a47a4c'); p.poly([[28, 18], [32, 20], [28, 22]], '#c0c8d8', 'f'); }
  else if (tipo === 'maca') { p.rect(21, 10, 3, 26, '#6a4a2a', 'c'); p.ell(22.5, 7, 5.4, 5.4, M); for (const [x, y] of [[17, 7], [28, 7], [22, 1], [18, 3], [27, 3]]) p.poly([[x, y], [x + (x < 22 ? -2 : 2), y - 2], [x, y - 3]], M.h2, 'f'); }
  p.contorno(0.5); c = p.canvas(); armaCache.set(k, c); return c;
}
export function tipoArma(item) { const n = ((item && (item.n || item.nome || item.id)) || '').toLowerCase(); if (/machad/.test(n)) return 'machado'; if (/martelo|marreta/.test(n)) return 'martelo'; if (/lan[cç]a|tridente|pique|alabarda/.test(n)) return 'lanca'; if (/cajado|bast[aã]o|varinha/.test(n)) return 'cajado'; if (/arco|besta/.test(n)) return 'arco'; if (/adaga|punhal|faca/.test(n)) return 'adaga'; if (/ma[cç]a|clava|mangual|estrela/.test(n)) return 'maca'; return 'espada'; }
void hash2; void clareia;
