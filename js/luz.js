// Luz: sol e lua pelo relógio, sombras dinâmicas (objetos, construções, personagens), níveis de contraste por hora do dia,
// luzes da noite e o tom tenebroso quando a Inércia está alta. Tudo é aproximação 2D feita em canvas, em pixel art.
import * as St from './store.js';
import { TS, aplicarEscuridao } from './arte.js';
import { cv } from './gfx.js';
import { Clima } from './clima.js';
import { horaAtual, faseDe, passoRelogio } from './relogio.js';
import { MOBILIA_SOLIDA } from './tiles.js';

const KY = 0.55; // achatamento vertical das sombras (câmera inclinada)
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const mixC = (A, B, t) => [mix(A[0], B[0], t), mix(A[1], B[1], t), mix(A[2], B[2], t)];
const rgb = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a.toFixed(3)})`;

// chaves do dia: hora, cor do tom, força do tom, contraste (-1..1), força das sombras, escuridão
const KF = [
  [0, [16, 24, 96], 0.30, -0.15, 0.10, 0.42], [4.6, [24, 34, 104], 0.28, -0.12, 0.10, 0.40],
  [5.7, [255, 140, 120], 0.20, 0.06, 0.40, 0.20], [6.7, [255, 196, 130], 0.14, 0.22, 0.62, 0.05],
  [8.5, [255, 226, 170], 0.07, 0.38, 0.82, 0], [12, [255, 250, 235], 0.02, 0.60, 1.0, 0],
  [15.5, [255, 232, 180], 0.07, 0.40, 0.86, 0], [17.3, [255, 168, 88], 0.17, 0.26, 0.70, 0.04],
  [18.4, [200, 100, 124], 0.20, 0.06, 0.40, 0.18], [19.5, [70, 60, 140], 0.26, -0.10, 0.16, 0.34],
  [21, [16, 24, 96], 0.30, -0.15, 0.10, 0.42], [24, [16, 24, 96], 0.30, -0.15, 0.10, 0.42],
];
function kf(h) {
  let i = 0; while (i < KF.length - 2 && h >= KF[i + 1][0]) i++; const a = KF[i], b = KF[i + 1]; let t = cl((h - a[0]) / (b[0] - a[0]), 0, 1); t = t * t * (3 - 2 * t);
  return { tint: mixC(a[1], b[1], t), ta: mix(a[2], b[2], t), ct: mix(a[3], b[3], t), fs: mix(a[4], b[4], t), es: mix(a[5], b[5], t) };
}
// posição do sol (6h–18h) ou da lua (resto da noite): direção da sombra no chão e comprimento relativo
function posAstro(h) {
  const dia = h >= 6 && h <= 18; let t; if (dia) t = (h - 6) / 12; else { const hh = h < 6 ? h + 24 : h; t = (hh - 18) / 12; }
  const alt = Math.sin(Math.PI * t); const ang = alt * 1.15; const L = cl(1 / Math.tan(Math.max(0.12, ang)), 0.32, 2.6);
  let dx = -Math.cos(Math.PI * t), dy = 0.1 + Math.sin(Math.PI * t) * 0.9; const n = Math.hypot(dx, dy) || 1; return { dx: dx / n, dy: dy / n, L, alt, lua: !dia };
}

export const E = { ext: false, dx: 0, dy: 1, L: 1, forca: 1, tint: [255, 250, 235], ta: 0, ct: 0, escuro: 0, escCor: [8, 12, 52], noite: 0, lua: false, tenebra: 0, hora: 12, fase: 'Meio-dia', alt: 1 };
let tenebra = null, tempo = 0;
export { forcarHora, horaForcada } from './relogio.js';
// suaviza o tom tenebroso conforme a Inércia sobe e desce (0 até Inércia 3,5; máximo na 10)
export function passo(dt, s) { tempo += dt; passoRelogio(dt); const alvo = s ? cl((St.inerciaEf(s) - 3.5) / 6.5, 0, 1) : 0.1; tenebra = tenebra == null ? alvo : tenebra + (alvo - tenebra) * Math.min(1, dt * 0.5); }
export const tenebraAtual = () => tenebra ?? 0;
export function snapLuz(s) { tenebra = s ? cl((St.inerciaEf(s) - 3.5) / 6.5, 0, 1) : 0.1; }
// calcula tudo que depende da hora, do clima e da Inércia; chamado no começo do desenho de cada quadro
export function preparar(ext) {
  E.ext = ext; E.tenebra = tenebra ?? 0; if (!ext) { LZ = []; return E; } const T = tenebra ?? 0, h = horaAtual(), a = posAstro(h), k = kf(h), c = Clima.cur;
  const nub = cl(c.nuvens * 0.85 + c.chuva * 0.3, 0, 1), neb = c.nevoa, tmp = c.tempestade;
  let tint = k.tint, ta = k.ta;
  tint = mixC(tint, [150, 158, 172], 0.55 * nub); ta += 0.09 * nub; tint = mixC(tint, [198, 203, 214], 0.5 * neb); ta += 0.08 * neb; tint = mixC(tint, [78, 40, 98], 0.85 * T); ta += 0.3 * T; // Inércia alta: luz roxa e doente
  ta += T * 0.05 * Math.sin(tempo * 7) * Math.sin(tempo * 2.3); // tremor sinistro
  // com Inércia alta as sombras balançam e se esticam, como se tivessem vontade própria
  const sw = T * 0.2 * Math.sin(tempo * 0.7), cs = Math.cos(sw), sn = Math.sin(sw);
  E.dx = a.dx * cs - a.dy * sn; E.dy = a.dx * sn + a.dy * cs; E.L = a.L * (1 + 0.9 * T) * (1 + T * 0.3 * (0.5 + 0.5 * Math.sin(tempo * 1.1)));
  E.lua = a.lua; E.alt = a.alt; E.hora = h; E.fase = faseDe(h); E.tenebra = T;
  const fb = k.fs * (1 - 0.88 * cl(nub + neb * 0.5, 0, 1)); E.forca = cl(Math.max(fb, 0.46 * T), 0, 1); E.tint = tint; E.ta = cl(ta, 0, 0.62);
  E.ct = cl(k.ct - 0.55 * nub - 0.3 * neb + 0.34 * T, -0.5, 0.9);
  E.escuro = Math.min(0.68, k.es + 0.3 * T * (1 - k.es) + 0.14 * tmp + 0.08 * c.chuva + 0.05 * nub); E.escCor = mixC([8, 12, 52], [26, 8, 44], T); E.noite = cl(E.escuro / 0.3, 0, 1);
  return E;
}
export function descricao() { // texto curto para o painel da Maré
  const e = E; const p = e.escuro > 0.3 ? 'escuro' : e.forca > 0.75 ? 'forte' : e.forca > 0.4 ? 'médio' : 'suave'; return { fase: e.fase, contraste: e.ct > 0.45 ? 'alto' : e.ct > 0.1 ? 'médio' : e.ct > -0.1 ? 'baixo' : 'muito baixo', sombras: p, astro: e.lua ? 'lua' : 'sol' };
}

// ---------- sombras projetadas ----------
// Duas fontes de sombra se somam: o sol/lua (direção pelo horário) e as luzes pontuais do quadro (braseiros, portas, lareiras, tochas,
// lanterna do herói), cuja sombra sempre aponta para longe da própria luz e encolhe/some com a distância. Quando o herói anda, as sombras giram.
let LZ = []; // luzes do quadro, em px de tela: { x, y, r, a }
export const definirLuzes = (l) => { LZ = l; };
export const luzesAtuais = () => LZ;
const pesoLuz = () => (E.ext ? cl(E.escuro / 0.2, 0, 1) : 1); // ao ar livre, de dia, as luzes pontuais não competem com o sol
// vetor da ponta da sombra (por unidade de altura) e força, para um ponto da tela; combina sol e luzes pontuais
export function campo(px, py) {
  let tx = 0, ty = 0, S = 0;
  if (E.ext && E.forca > 0.02) { const len = Math.min(2.1, E.L); tx += E.dx * len * E.forca; ty += E.dy * len * KY * E.forca; S += E.forca; }
  const pl = pesoLuz();
  if (pl > 0.03) for (const L of LZ) { const dx = px - L.x, dy = py - L.y, d = Math.hypot(dx, dy); if (d < 10 || d >= L.r) continue; const fo = 1 - d / L.r, s = L.a * pl * fo * (0.55 + 0.45 * fo), len = Math.min(1.7, 0.4 + (d / L.r) * 1.3); tx += (dx / d) * len * s; ty += (dy / d) * len * KY * s; S += s; }
  if (S < 0.02) return null; return { x: tx / S, y: ty / S, f: Math.min(1, S) };
}
const silCache = new WeakMap();
function silhueta(img) {
  const src = img.limpo || img; let s = silCache.get(src); if (s) return s; s = cv(src.width, src.height); const x = s.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#000'; x.fillRect(0, 0, s.width, s.height); silCache.set(src, s); return s;
}
const ALT = { arvore: 1, arvoreFixa: 1, pinheiro: 1, montanha: 0.4, rocha: 0.7, placa: 0.8, barril: 0.8, bigorna: 0.8, braseiro: 0.8, poco: 0.9, tenda: 0.9, cerca: 0.55, casinha: 1, muro: 0.9, torreT: 1 };
const camadas = {};
function camadaDe(nome, V) { let c = camadas[nome]; if (!c || c.width !== V.w || c.height !== V.h) c = camadas[nome] = cv(V.w, V.h); return c; }
// bloco = volume com base retangular (px de tela) e altura H; varre o retângulo na direção da sombra (sx, sy)
function varrer(c, b, sx, sy) {
  const P = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];
  for (let i = 0; i < 4; i++) { const p = P[i], q = P[(i + 1) % 4]; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.lineTo(q[0] + sx, q[1] + sy); c.lineTo(p[0] + sx, p[1] + sy); c.closePath(); c.fill(); }
  c.fillRect(b.x + sx, b.y + sy, b.w, b.h);
}
function cisalhar(c, o, dx, dy, L) { const kk = o.k * 0.9; c.setTransform(1, 0, -dx * L * kk, -dy * L * KY * kk, dx * L * kk * o.BY, o.BY * (1 + dy * L * KY * kk)); c.drawImage(o.sil, o.px, o.py); }
// luzes do quadro ao ar livre: braseiros, portas (à noite), lanterna do herói e extras
function luzesExt(V, cam, m, A, opc, r) {
  const T = E.tenebra, t = opc.tempo || tempo, out = []; const pisca = (s) => 1 + (0.04 + 0.05 * T) * Math.sin(t * 9 + s) + 0.03 * Math.sin(t * 5.3 + s * 2);
  for (let y = Math.max(0, r.y0 - 3); y <= Math.min(m.h + 3, r.y1 + 3); y++) for (const o of A.linhas[y] || []) { if (o.id !== 'braseiro') continue; const lx = o.x * TS + 16 - cam.x, ly = o.y * TS + 10 - cam.y; if (lx < -90 || ly < -90 || lx > V.w + 90 || ly > V.h + 90) continue; out.push({ x: lx, y: ly, r: 62 * (1 - 0.2 * T) * pisca(o.x), a: 0.92 }); }
  for (const b of m.predios || []) { if (!b.porta) continue; const lx = b.porta.x * TS + 16 - cam.x, ly = b.porta.y * TS + 14 - cam.y; if (lx < -70 || ly < -70 || lx > V.w + 70 || ly > V.h + 70) continue; out.push({ x: lx, y: ly, r: 46, a: 0.7 }); }
  if (opc.heroiTile) out.push({ x: opc.heroiTile.x * TS + 16 - cam.x, y: opc.heroiTile.y * TS + 14 - cam.y, r: 112 * (1 - 0.38 * T) * pisca(1.7), a: 0.9 });
  for (const L of opc.luzesExtra || []) out.push({ x: L.x * TS + 16 - cam.x, y: L.y * TS + 16 - cam.y, r: L.r, a: L.a ?? 0.8 });
  LZ = out;
}
// sombras das luzes pontuais: cada luz projeta objetos e blocos para longe dela e a sombra some com a distância (máscara radial)
function sombrasDeLuz(ctx, V, objs, blocos, cor, forcaAlfa) {
  const pl = pesoLuz(); if (pl < 0.05) return; const ls = LZ.filter((L) => L.r > 20 && L.a > 0.05 && L.x > -L.r && L.y > -L.r && L.x < V.w + L.r && L.y < V.h + L.r); if (!ls.length) return;
  const acc = camadaDe('acc', V).getContext('2d'), tmp = camadaDe('tmp', V).getContext('2d'); acc.setTransform(1, 0, 0, 1, 0, 0); acc.globalCompositeOperation = 'source-over'; acc.clearRect(0, 0, V.w, V.h); let algo = false;
  for (const L of ls) {
    const bx = Math.max(0, Math.floor(L.x - L.r - 6)), by = Math.max(0, Math.floor(L.y - L.r - 6)), bw = Math.min(V.w, Math.ceil(L.x + L.r + 6)) - bx, bh = Math.min(V.h, Math.ceil(L.y + L.r + 6)) - by; if (bw <= 0 || bh <= 0) continue;
    tmp.setTransform(1, 0, 0, 1, 0, 0); tmp.globalCompositeOperation = 'source-over'; tmp.clearRect(bx, by, bw, bh); tmp.fillStyle = '#000'; let n = 0;
    for (const b of blocos) { const cx = b.x + b.w / 2, cy = b.y + b.h / 2, d = Math.hypot(cx - L.x, cy - L.y); if (d > L.r + 16 || d < 5) continue; const len = Math.min(1.7, 0.4 + (d / L.r) * 1.3); varrer(tmp, b, ((cx - L.x) / d) * len * b.H, ((cy - L.y) / d) * len * b.H * KY); n++; }
    for (const o of objs) { const d = Math.hypot(o.cx - L.x, o.BY - L.y); if (d > L.r || d < 8) continue; const len = Math.min(1.7, 0.4 + (d / L.r) * 1.3); cisalhar(tmp, o, (o.cx - L.x) / d, (o.BY - L.y) / d, len); n++; }
    tmp.setTransform(1, 0, 0, 1, 0, 0); if (!n) continue; tmp.globalCompositeOperation = 'destination-in'; const g = tmp.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, `rgba(0,0,0,${(0.8 * L.a).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); tmp.fillStyle = g; tmp.fillRect(bx, by, bw, bh);
    acc.drawImage(tmp.canvas, bx, by, bw, bh, bx, by, bw, bh); algo = true;
  }
  if (!algo) return; acc.globalCompositeOperation = 'destination-out'; for (const b of blocos) acc.fillRect(b.x, b.y, b.w, b.h);
  acc.globalCompositeOperation = 'source-in'; acc.fillStyle = cor; acc.fillRect(0, 0, V.w, V.h); acc.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalAlpha = cl(forcaAlfa * pl, 0, 0.8); ctx.drawImage(acc.canvas, 0, 0); ctx.restore();
}
// ao ar livre: sombra do sol + sombras das luzes pontuais. r = { x0,y0,x1,y1, imgDe(o) }; opc = { heroiTile, tempo, luzesExtra }
export function desenharSombras(ctx, V, cam, m, A, r, opc = {}) {
  if (!E.ext) { LZ = []; return; } luzesExt(V, cam, m, A, opc, r);
  const objs = [];
  for (let y = Math.max(0, r.y0 - 6); y <= Math.min(m.h + 3, r.y1 + 1); y++) for (const o of A.linhas[y] || []) {
    if (o.x < r.x0 - 5 || o.x > r.x1 + 5) continue; if (o.id === 'caverna' || o.id === 'cavernaLiv' || (m.capPos && m.capPos.has(o.y * m.w + o.x))) continue;
    const img = r.imgDe(o); const px = Math.round(o.x * TS + 16 - img.width / 2 - cam.x), py = Math.round(o.y * TS + 16 - img.height / 2 - cam.y); const BY = py + (img.base ?? img.height - 4);
    if (px > V.w + 40 || px + img.width < -120 || py > V.h + 8 || py + img.height < -140) continue; objs.push({ sil: silhueta(img), px, py, BY, cx: px + img.width / 2, k: ALT[o.id] ?? 0.8 });
  }
  const blocos = []; for (const b of m.predios || []) { const bx = b.x * TS - cam.x, by = b.y * TS - cam.y, bw = b.w * TS, bh = b.h * TS; if (bx > V.w + 120 || bx + bw < -140 || by > V.h + 20 || by + bh < -140) continue; blocos.push({ x: bx, y: by, w: bw, h: bh, H: Math.min(40, 20 + Math.max(b.w, b.h) * 2.2) }); }
  if (E.forca >= 0.03) {
    const cvs = camadaDe('sol', V), c = cvs.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, V.w, V.h); c.fillStyle = '#000'; const Lh = E.L;
    for (const o of objs) cisalhar(c, o, E.dx, E.dy, Lh); c.setTransform(1, 0, 0, 1, 0, 0);
    for (const b of blocos) { const Lb = Math.min(2.1, Lh); varrer(c, b, E.dx * Lb * b.H, E.dy * Lb * b.H * KY); }
    c.globalCompositeOperation = 'destination-out'; for (const b of blocos) c.fillRect(b.x, b.y, b.w, b.h); // o telhado fica ao sol
    c.globalCompositeOperation = 'source-in'; c.fillStyle = E.lua ? 'rgb(10,16,52)' : E.tenebra > 0.4 ? 'rgb(14,4,28)' : 'rgb(18,8,38)'; c.fillRect(0, 0, V.w, V.h); c.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha = cl(0.14 + 0.46 * E.forca + 0.1 * E.tenebra, 0, 0.64); ctx.drawImage(cvs, 0, 0); ctx.restore();
  }
  sombrasDeLuz(ctx, V, objs, blocos, 'rgb(12,5,20)', 0.62);
}
// interiores: lareiras, fogões, forjas e altares acendem luzes; paredes e móveis projetam sombras para longe delas
const FONTES_INT = { lareira: [170, 0.85], fogao: [110, 0.6], fornalha: [150, 0.85], caldeirao: [90, 0.5], altar: [110, 0.55] }; const PAREDES_INT = new Set(['paredeI', 'paredeP', 'janela']);
const ALT_MOV = { estante: 22, pilar: 22, estatua: 20, lareira: 14, balcao: 12, mesa: 10, cama: 7, banco: 7, cadeira: 7, toneis: 12, armas: 14, mapa: 14 };
export function sombrasInterior(ctx, V, cam, m, r) {
  const out = [], blocos = []; const t = tempo;
  for (let y = Math.max(0, r.y0 - 4); y <= Math.min(m.h - 1, r.y1 + 4); y++) for (let x = Math.max(0, r.x0 - 4); x <= Math.min(m.w - 1, r.x1 + 4); x++) {
    const id = m.g[y * m.w + x]; const px = x * TS - cam.x, py = y * TS - cam.y; const f = FONTES_INT[id];
    if (f) out.push({ x: px + 16, y: py + 14, r: f[0] * (1 + 0.04 * Math.sin(t * 8 + x)), a: f[1] });
    if (PAREDES_INT.has(id)) blocos.push({ x: px, y: py, w: TS, h: TS, H: 26 }); else if (MOBILIA_SOLIDA.includes(id)) blocos.push({ x: px, y: py, w: TS, h: TS, H: ALT_MOV[id] ?? 9 });
  }
  LZ = out; if (!out.length) return; sombrasDeLuz(ctx, V, [], blocos, 'rgb(14,6,10)', 0.78);
}
// masmorra: tocha do herói e das paredes; paredes projetam sombra para longe delas. LZ já foi definida pelo render (px de tela)
export function sombrasMasmorra(ctx, V, cam, d, vis, r) {
  const blocos = []; const idx = (x, y) => y * d.w + x; const chao = (x, y) => x >= 0 && y >= 0 && x < d.w && y < d.h && d.tiles[idx(x, y)] !== 0;
  for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) { if (d.tiles[idx(x, y)] !== 0 || !d.explorado[idx(x, y)]) continue; if (!(chao(x + 1, y) || chao(x - 1, y) || chao(x, y + 1) || chao(x, y - 1))) continue; blocos.push({ x: x * TS - cam.x, y: y * TS - cam.y, w: TS, h: TS, H: 28 }); }
  sombrasDeLuz(ctx, V, [], blocos, 'rgb(6,3,12)', 0.85);
}
// sombra de personagem/monstro em sprite: elipse alongada para longe da luz (sol e/ou luzes pontuais). Devolve false se não houver luz (usa a sombra redonda antiga).
export function sombraEnt(ctx, cx, cy, rx, ry, a) {
  if (!E.ext && !LZ.length) return false; const c = campo(cx, cy);
  if (!c || c.f < 0.05) { ctx.fillStyle = rgb([14, 8, 30], a * 0.6); ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.85, ry * 0.85, 0, 0, 6.2832); ctx.fill(); return true; }
  const H = rx * 1.45; const sx = c.x * H, sy = c.y * H, sl = Math.hypot(sx, sy) || 1e-6, nx = sx / sl, ny = sy / sl;
  const rho = (ux, uy) => Math.sqrt((rx * ux) ** 2 + (ry * uy) ** 2); const major = sl / 2 + rho(nx, ny), minor = rho(-ny, nx);
  ctx.fillStyle = rgb(E.ext && E.lua ? [10, 16, 52] : [14, 8, 30], a * (0.2 + 1.0 * c.f)); ctx.beginPath(); ctx.ellipse(Math.round(cx + sx / 2), Math.round(cy + sy / 2), major, minor, Math.atan2(ny, nx), 0, 6.2832); ctx.fill(); return true;
}
// sombra de token (vista de cima): a própria silhueta deslocada para longe da luz
export function sombraToken(ctx, tk, cam, tx, ty, ang, { alfa = 1, dx = 0, dy = 0 } = {}) {
  if (!tk || (!E.ext && !LZ.length)) return; const bx = tx * TS + 16 - cam.x + dx, by = ty * TS + 16 - cam.y + dy; const c = campo(bx, by); if (!c || c.f < 0.04) return;
  const len = Math.min(1.9, Math.hypot(c.x, c.y / KY)), off = 4.4; const ox = c.x * off * 1.05, oy = c.y * off * 1.5 + 1;
  ctx.save(); ctx.globalAlpha = alfa * cl(0.1 + 0.36 * c.f, 0, 0.42); ctx.imageSmoothingEnabled = true; ctx.translate(Math.round(bx + ox), Math.round(by + oy)); ctx.rotate(ang); ctx.drawImage(silhueta(tk.t), -tk.px / 2, -tk.px / 2, tk.px, tk.px); ctx.restore(); void len;
}

// ---------- tom, contraste, escuridão e luzes da noite ----------
function contraste(ctx, V, c) {
  if (c > 0.03) { const s = ctx.canvas; ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = Math.min(0.9, c * 0.95); ctx.imageSmoothingEnabled = false; ctx.drawImage(s, 0, 0, s.width, s.height, 0, 0, s.width / V.Z, s.height / V.Z); ctx.restore(); }
  else if (c < -0.03) { ctx.save(); ctx.globalAlpha = Math.min(0.5, -c * 0.55); ctx.fillStyle = 'rgb(126,130,146)'; ctx.fillRect(0, 0, V.w, V.h); ctx.restore(); }
}
// opc: { heroiTile:{x,y}, batalha, tempo }
export function aplicar(ctx, V, cam, m, A, opc, r) {
  const e = E; if (!e.ext) return; const t = opc.tempo || tempo;
  if (e.ta > 0.005) { ctx.fillStyle = rgb(e.tint, e.ta); ctx.fillRect(0, 0, V.w, V.h); }
  contraste(ctx, V, e.ct);
  let esc = e.escuro; if (opc.batalha) esc *= 0.6; // em combate a noite não esconde o campo
  if (esc > 0.04) aplicarEscuridao(ctx, V.w, V.h, LZ.map((L) => ({ ...L, quente: true })), esc, `${Math.round(e.escCor[0])},${Math.round(e.escCor[1])},${Math.round(e.escCor[2])}`, cl(esc / 0.3, 0.15, 1));
  if (e.tenebra > 0.05) { // vinheta sombria que respira, mais forte quanto maior a Inércia
    const k = Math.min(0.8, e.tenebra * (0.52 + 0.12 * Math.sin(t * 1.1))); const g = ctx.createRadialGradient(V.w / 2, V.h / 2, Math.min(V.w, V.h) * 0.28, V.w / 2, V.h / 2, Math.max(V.w, V.h) * 0.68); g.addColorStop(0, 'rgba(20,6,34,0)'); g.addColorStop(1, `rgba(20,6,34,${k.toFixed(3)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, V.w, V.h);
  }
}
