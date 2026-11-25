// Renderização 32 bits: vista em resolução do aparelho (zoom inteiro), mapas assados, objetos com profundidade, luz, sombras e partículas.
import { TS, assarExterno, assarMasmorra, spriteObjeto, ehObjeto, aplicarEscuridao, sombraEntidade, Particulas } from './arte.js';
import { spritePessoa } from './pessoa.js';
import { spriteMonstro, TAMANHO_SPR } from './monstros.js';
import { texto, hash2 } from './gfx.js';

import { ITENS } from './srd.js';
import { CAPAS } from './conteudo.js';
import { visualDe } from './pessoa.js';
import { normalizarAp } from './cosmeticos.js';
import { tokenHeroi, tokenPessoa, tokenMonstro, tamDe, tamanhoPx, desenharToken, angDe, escalaPessoa, armaDeItem } from './tokens.js';

export { TS };
export const VW = { canvas: null, ctx: null, Z: 3, w: 352, h: 256, cw: 0, ch: 0, sujo: true };
export const apDe = (s) => normalizarAp(s.heroi.ap, s.heroi.cls);
export const visDe = (s) => visualDe(s, ITENS, CAPAS);
export const spriteHeroi = (s, dir = 'baixo', pose = 'idle') => spritePessoa(apDe(s), visDe(s), dir, pose);
export const cam = { x: 0, y: 0 };
// ---------- tokens (vista superior) ----------
export const tokenHeroiDe = (s) => { const ap = apDe(s); const t = tokenHeroi(s, ap, visDe(s), ITENS); return t ? { t, px: 32 * escalaPessoa(ap) } : null; };
export function tokenPessoaDe(ap, vis, arma = null) { const t = tokenPessoa(ap, vis, arma); return t ? { t, px: 32 * escalaPessoa(ap) } : null; }
export function tokenMonstroDe(m) { const t = tokenMonstro(m); return t ? { t, px: tamanhoPx(tamDe(m)) } : null; }
export { armaDeItem };
export function tokenEm(ctx, tk, tx, ty, dir, obj, op = {}) { desenharToken(ctx, tk.t, cam, tx, ty, angDe(obj, dir), tk.px, op); }
export const PART = new Particulas();

// ---------- vista ----------
export function iniciarVista(canvas) {
  VW.canvas = canvas; VW.ctx = canvas.getContext('2d'); VW.sujo = true;
  try { new ResizeObserver(() => { VW.sujo = true; }).observe(canvas.parentElement); } catch (e) { window.addEventListener('resize', () => { VW.sujo = true; }); }
  window.addEventListener('orientationchange', () => { VW.sujo = true; });
}
export function ajustarVista() {
  const c = VW.canvas, box = c.parentElement; const cw = box.clientWidth, ch = box.clientHeight; if (!cw || !ch) return;
  const dpr = Math.min(3, window.devicePixelRatio || 1); const Wd = Math.max(64, Math.round(cw * dpr)), Hd = Math.max(64, Math.round(ch * dpr));
  const bat = document.body.classList.contains('em-batalha'); const alvoTiles = (cw < 520 ? 9.5 : cw < 900 ? 12 : 15) + (bat ? (cw < 520 ? 3 : 3) : 0); const Z = Math.max(1, Math.round(Wd / (alvoTiles * TS)));
  if (c.width !== Wd || c.height !== Hd) { c.width = Wd; c.height = Hd; }
  VW.cw = cw; VW.ch = ch; VW.Z = Z; VW.w = Math.ceil(Wd / Z); VW.h = Math.ceil(Hd / Z); VW.sujo = false; VW.ctx.imageSmoothingEnabled = false;
}
export function inicioFrame() {
  if (VW.sujo) ajustarVista(); const ctx = VW.ctx; ctx.setTransform(VW.Z, 0, 0, VW.Z, 0, 0); ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, VW.w, VW.h); return ctx;
}
// coordenada de tela (clientX/Y) → tile do mundo
export function telaParaTile(cx, cy) { const r = VW.canvas.getBoundingClientRect(); const ax = (cx - r.left) / r.width * VW.w + cam.x, ay = (cy - r.top) / r.height * VW.h + cam.y; return { x: Math.floor(ax / TS), y: Math.floor(ay / TS), ax, ay }; }
export function tileParaTela(tx, ty) { const r = VW.canvas.getBoundingClientRect(); return { x: r.left + ((tx + 0.5) * TS - cam.x) / VW.w * r.width, y: r.top + ((ty + 0.5) * TS - cam.y) / VW.h * r.height }; }
export function camPara(fx, fy, mw, mh, suave = 0) { // fx, fy em tiles (float) → centro da câmera
  const W = VW.w, H = VW.h; let cx = fx * TS + TS / 2 - W / 2, cy = fy * TS + TS / 2 - H / 2;
  cx = mw * TS <= W ? (mw * TS - W) / 2 : Math.max(0, Math.min(mw * TS - W, cx)); cy = mh * TS <= H ? (mh * TS - H) / 2 : Math.max(0, Math.min(mh * TS - H, cy));
  if (suave > 0) { cam.x += (cx - cam.x) * suave; cam.y += (cy - cam.y) * suave; } else { cam.x = cx; cam.y = cy; }
  cam.x = Math.round(cam.x); cam.y = Math.round(cam.y);
}
function blit(ctx, img) { // desenha só o pedaço visível do mapa assado
  const sx = Math.max(0, cam.x), sy = Math.max(0, cam.y); const ex = Math.min(img.width, cam.x + VW.w), ey = Math.min(img.height, cam.y + VW.h); const sw = ex - sx, sh = ey - sy; if (sw <= 0 || sh <= 0) return;
  ctx.drawImage(img, sx, sy, sw, sh, sx - cam.x, sy - cam.y, sw, sh);
}

// ---------- desenho de seres ----------
export function pessoaEm(ctx, spr, tx, ty, dir = 'baixo', { alfa = 1, flash: fl = null, dy = 0, dx = 0 } = {}) {
  const px = Math.round(tx * TS - cam.x + dx), py = Math.round(ty * TS - 13 - cam.y + dy); ctx.globalAlpha = alfa; const img = fl || spr;
  if (dir === 'dir') { ctx.save(); ctx.translate(px + 32, py); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); } else ctx.drawImage(img, px, py); ctx.globalAlpha = 1;
}
export function monstroEm(ctx, spr, tx, ty, { alfa = 1, flash: fl = null, dy = 0, dx = 0, espelha = false } = {}) {
  const w = spr.width, h = spr.height; const px = Math.round(tx * TS + 16 - w / 2 - cam.x + dx), py = Math.round(ty * TS + 33 - h - cam.y + dy); ctx.globalAlpha = alfa; const img = fl || spr;
  if (espelha) { ctx.save(); ctx.translate(px + w, py); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); } else ctx.drawImage(img, px, py); ctx.globalAlpha = 1;
}
export const sombraTile = (ctx, tx, ty, rx = 10, ry = 4, a = 0.3) => sombraEntidade(ctx, Math.round(tx * TS + 16 - cam.x), Math.round(ty * TS + 30 - cam.y), rx, ry, a);
export const spriteMonstroDe = (m) => spriteMonstro(m.spr, m.pal || {}, m.id || m.mon || 'x', m.tags || [], m.ap || null);
export const alturaSprite = (spr) => (TAMANHO_SPR[spr] ? TAMANHO_SPR[spr][1] : 40);
export function barraHp(ctx, tx, ty, frac, { largura = 22, y = -2, cor = null, alt = 3 } = {}) {
  const px = Math.round(tx * TS + 16 - largura / 2 - cam.x), py = Math.round(ty * TS - cam.y + y); frac = Math.max(0, Math.min(1, frac));
  ctx.fillStyle = 'rgba(8,4,16,0.85)'; ctx.fillRect(px - 1, py - 1, largura + 2, alt + 2); ctx.fillStyle = cor || (frac > 0.5 ? '#6fcf7f' : frac > 0.22 ? '#e6d35a' : '#ff5c6c'); ctx.fillRect(px, py, Math.round(largura * frac), alt); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(px, py, Math.round(largura * frac), 1);
}
export function tileRect(ctx, x, y, fill, borda = null, pulso = 0) {
  const px = x * TS - cam.x, py = y * TS - cam.y; if (px < -TS || py < -TS || px > VW.w || py > VW.h) return;
  ctx.fillStyle = fill; ctx.fillRect(px + 1, py + 1, TS - 2, TS - 2); if (borda) { ctx.strokeStyle = borda; ctx.lineWidth = 1; ctx.strokeRect(px + 1.5 + pulso, py + 1.5 + pulso, TS - 3 - pulso * 2, TS - 3 - pulso * 2); }
}
export function flutuar(lista, tx, ty, txt, cor = '#fff', tam = 9) { lista.push({ x: tx, y: ty, txt, cor, tam, t: 0 }); }
export function desenharFlutuantes(ctx, lista) {
  for (const f of lista) { const px = Math.round(f.x * TS + 16 - cam.x), py = Math.round(f.y * TS - 4 - cam.y - f.t * 22); ctx.globalAlpha = Math.max(0, Math.min(1, 2.4 - f.t * 2)); texto(ctx, f.txt, px, py, { cor: f.cor, tam: f.tam + (f.t < 0.15 ? 2 : 0) }); ctx.globalAlpha = 1; }
}
// balão de fala (coordenadas em tiles)
export function balao(ctx, tx, ty, txt, { cor = '#fff', fundo = '#1a1428', borda = '#e8d8a0', max = 22 } = {}) {
  ctx.save(); ctx.font = '700 7px ui-sans-serif, system-ui, sans-serif'; const palavras = String(txt).split(' '); const linhas = []; let at = '';
  for (const p of palavras) { if ((at + ' ' + p).trim().length > max) { linhas.push(at); at = p; } else at = (at + ' ' + p).trim(); } if (at) linhas.push(at);
  const w = Math.max(...linhas.map((l) => ctx.measureText(l).width)) + 10, h = linhas.length * 9 + 8; let px = Math.round(tx * TS + 16 - cam.x - w / 2), py = Math.round(ty * TS - 18 - cam.y - h);
  px = Math.max(3, Math.min(VW.w - w - 3, px)); py = Math.max(3, py);
  ctx.fillStyle = borda; ctx.fillRect(px - 1, py - 1, w + 2, h + 2); ctx.fillStyle = fundo; ctx.fillRect(px, py, w, h);
  const ax = Math.max(px + 6, Math.min(px + w - 6, Math.round(tx * TS + 16 - cam.x))); ctx.fillStyle = borda; ctx.beginPath(); ctx.moveTo(ax - 4, py + h); ctx.lineTo(ax + 4, py + h); ctx.lineTo(ax, py + h + 5); ctx.fill(); ctx.fillStyle = fundo; ctx.beginPath(); ctx.moveTo(ax - 3, py + h - 1); ctx.lineTo(ax + 3, py + h - 1); ctx.lineTo(ax, py + h + 3); ctx.fill();
  ctx.fillStyle = cor; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; linhas.forEach((l, i) => ctx.fillText(l, px + 5, py + 4 + i * 9)); ctx.restore();
}

// ---------- mundo externo (vila e vale) ----------
export function prepararExterno(m) {
  if (m.arte) return m.arte; const { canvas, base } = assarExterno(m); const linhas = Array.from({ length: m.h + 4 }, () => []);
  const eh = (x, y, id) => x >= 0 && y >= 0 && x < m.w && y < m.h && m.g[y * m.w + x] === id;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const id = m.g[y * m.w + x]; if (!ehObjeto(id)) continue;
    const viz = { n: eh(x, y - 1, id), s: eh(x, y + 1, id), w: eh(x - 1, y, id), e: eh(x + 1, y, id) }; viz.h = viz.w || viz.e; viz.v = viz.n || viz.s; if (id === 'cerca' && !viz.h && !viz.v) viz.h = true; if (id === 'arvore' && hash2(x, y, 5) < 0.18) viz.outono = true;
    const o = { id, x, y, v: Math.floor(hash2(x, y, 3) * 4), viz }; if (id === 'arvore') { o.lim = hash2(x, y, 11); o.vizM = { ...viz, morta: true, outono: false }; } linhas[y].push(o); }
  m.arte = { canvas, base, linhas }; return m.arte;
}
// ---------- mundo vivo/morto: cor, secura e a onda que muda o mundo ----------
export const fracMorta = (v) => Math.max(0, Math.min(1, (0.62 - v) / 0.5));
function gradeUnica(ctx, v, forca) {
  const k = Math.max(0, Math.min(1, 1 - v)) * forca; const W = VW.w, H = VW.h; ctx.save();
  if (k >= 0.02) {
    ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = Math.min(0.92, k * 1.15); ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.08 + k * 0.34; ctx.fillStyle = `rgb(${Math.round(150 - 108 * k)},${Math.round(104 - 58 * k)},${Math.round(44 + 28 * k)})`; ctx.fillRect(0, 0, W, H);
    const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.22, W / 2, H / 2, Math.max(W, H) * 0.7); gr.addColorStop(0, 'rgba(8,6,16,0)'); gr.addColorStop(1, `rgba(8,6,16,${(k * 0.72).toFixed(3)})`); ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  } else if (v > 0.78) { ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = Math.min(0.5, (v - 0.78) * 2.4); ctx.fillStyle = '#ffd47a'; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}
function gradearMundo(ctx, vd, forca) {
  const o = vd.onda; if (!o) { gradeUnica(ctx, vd.v, forca); return; }
  const cx = o.x - cam.x, cy = o.y - cam.y, Rmax = Math.hypot(VW.w, VW.h) * 1.05, R = Math.max(1, o.t * Rmax), W = VW.w, H = VW.h;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, R, 0, 6.2832); ctx.clip('evenodd'); gradeUnica(ctx, o.velho, forca); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.clip(); gradeUnica(ctx, o.novo, forca); ctx.restore();
  const melhora = o.novo > o.velho; ctx.save(); ctx.globalAlpha = Math.max(0, 0.8 - o.t * 0.7); ctx.lineWidth = 3; ctx.strokeStyle = melhora ? '#ffe27a' : '#8a7ac8'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = melhora ? '#b8ff8a' : '#c8c0ff'; ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.1, R - 4), 0, 6.2832); ctx.stroke(); ctx.restore();
}
let tintCache = { t: 0, v: null };
function tintHora() { const n = Date.now(); if (n - tintCache.t < 20000 && tintCache.v !== undefined) return tintCache.v; const d = new Date(), h = d.getHours() + d.getMinutes() / 60; let v = null; if (h >= 20.5 || h < 5) v = 'rgba(14,20,86,0.36)'; else if (h >= 18) v = 'rgba(255,120,40,0.15)'; else if (h < 7) v = 'rgba(255,170,90,0.10)'; tintCache = { t: n, v }; return v; }
// opc: { tempo, itens:[{y,d}], antes(ctx), depois(ctx), vila:bool, vale:{reg,lim}, ativoCap, caps:[{n,x,y,limpo}] }
export function desenharExterno(ctx, m, opc) {
  const A = prepararExterno(m); const tempo = opc.tempo || 0; blit(ctx, A.canvas);
  const x0 = Math.max(0, Math.floor(cam.x / TS) - 1), y0 = Math.max(0, Math.floor(cam.y / TS) - 1), x1 = Math.min(m.w - 1, Math.ceil((cam.x + VW.w) / TS) + 1), y1 = Math.min(m.h - 1, Math.ceil((cam.y + VW.h) / TS) + 1);
  // água e lava vivas
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const id = m.g[y * m.w + x]; if (id === 'agua') { const px = x * TS - cam.x, py = y * TS - cam.y; for (let k = 0; k < 2; k++) { const ph = (tempo * 0.7 + hash2(x, y, k + 9) * 6) % 3; if (ph < 1) { const sx = px + 4 + hash2(x, y, k + 20) * 24, sy = py + 4 + hash2(x, y, k + 30) * 24; ctx.globalAlpha = Math.sin(ph * 3.14) * 0.7; ctx.fillStyle = '#e8f6ff'; ctx.fillRect(Math.round(sx), Math.round(sy), 3, 1); ctx.globalAlpha = 1; } } }
    else if (id === 'lava') { const px = x * TS - cam.x, py = y * TS - cam.y; const a = 0.1 + 0.08 * Math.sin(tempo * 2 + hash2(x, y, 4) * 6); ctx.fillStyle = `rgba(255,170,40,${a})`; ctx.fillRect(px, py, TS, TS); } }
  if (opc.antes) opc.antes(ctx);
  // objetos altos + entidades por profundidade
  const lista = []; const f = Math.floor(tempo * 2.2) % 2;
  for (let y = Math.max(0, y0 - 1); y <= Math.min(m.h + 3, y1 + 3); y++) for (const o of A.linhas[y] || []) { if (o.x < x0 - 2 || o.x > x1 + 2) continue;
    if (o.id === 'caverna' || o.id === 'cavernaLiv' || (m.capPos && m.capPos.has(o.y * m.w + o.x))) continue; lista.push({ y: o.y * TS + 4, d: () => { const img = spriteObjeto(o.id, o.v, f, (o.lim !== undefined && opc.vida && o.lim < fracMorta(opc.vida.v)) ? o.vizM : o.viz); ctx.drawImage(img, Math.round(o.x * TS + 16 - img.width / 2 - cam.x), Math.round(o.y * TS + 16 - img.height / 2 - cam.y)); } }); }
  if (opc.caps) for (const c of opc.caps) { if (c.x < x0 - 2 || c.x > x1 + 2 || c.y < y0 - 2 || c.y > y1 + 3) continue; lista.push({ y: c.y * TS + 4, d: () => { const img = spriteObjeto(c.cata ? 'caverna' : (c.spr && c.spr !== 'caverna') ? c.spr : (c.ativo ? 'cavernaLiv' : 'caverna'), 0, f, {}); const px = Math.round(c.x * TS + 16 - img.width / 2 - cam.x), py = Math.round(c.y * TS + 16 - img.height / 2 - cam.y); ctx.drawImage(img, px, py);
    if (c.cata) texto(ctx, '∞', px + img.width / 2, py + img.height / 2 + 1, { cor: '#c8b6ff', tam: 9 }); else if (c.ativo) texto(ctx, '!', px + img.width / 2, py - 2 + Math.round(Math.sin(tempo * 5) * 2), { cor: '#6af0ff', tam: 10 }); else texto(ctx, String(c.n), px + img.width / 2, py + img.height / 2, { cor: c.limpo ? '#6fcf7f' : '#a8a8b8', tam: 8 }); } }); }
  lista.sort((a, b) => a.y - b.y); for (const e of lista) e.d(ctx);
  if (opc.vida) gradearMundo(ctx, opc.vida, m.interior ? 0.55 : opc.batalha ? 0.5 : 1);
  const ents = (opc.itens || []).slice().sort((a, b) => a.y - b.y); for (const e of ents) e.d(ctx);
  if (opc.depois) opc.depois(ctx);
  // rótulos de lugares (prédios, vilas, entradas)
  for (const t of m.rotulos || []) { const cxp = Math.round((t.x + 0.5) * TS - cam.x), cyp = Math.round(t.y * TS - cam.y - 3); if (cxp > -90 && cxp < VW.w + 90 && cyp > -12 && cyp < VW.h + 12) texto(ctx, t.t, cxp, cyp, { cor: t.int ? '#ffe9a8' : t.reg ? '#e8e0ff' : '#fff', tam: t.reg ? 7 : 8 }); }
  // névoa do Vale: regiões além do capítulo ativo
  if (opc.vale) { const { reg, lim } = opc.vale; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const r = reg[y * m.w + x]; if (r > lim) { ctx.fillStyle = `rgba(10,8,22,${Math.min(0.9, 0.5 + (r - lim) * 0.06)})`; ctx.fillRect(x * TS - cam.x, y * TS - cam.y, TS, TS); } } }
  const tint = m.interior ? m.tint : tintHora(); if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, VW.w, VW.h); }
  if (opc.topo) opc.topo(ctx);
}

// ---------- masmorra ----------
export function prepararMasmorra(d, tema, T, semente) { if (d.arte) return d.arte; d.arte = assarMasmorra(d, tema, T, semente); return d.arte; }
// opc: { tempo, itens, antes, depois, vis:Set, raio, jogador:{x,y} (tiles, float), luzesExtra:[{x,y,r}], T }
export function desenharMas(ctx, d, opc) {
  const A = d.arte; const T = opc.T; blit(ctx, A.canvas); const tempo = opc.tempo || 0;
  const x0 = Math.max(0, Math.floor(cam.x / TS)), y0 = Math.max(0, Math.floor(cam.y / TS)), x1 = Math.min(d.w - 1, Math.ceil((cam.x + VW.w) / TS)), y1 = Math.min(d.h - 1, Math.ceil((cam.y + VW.h) / TS));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * d.w + x; const px = x * TS - cam.x, py = y * TS - cam.y;
    if (!d.explorado[i]) { ctx.fillStyle = '#05030a'; ctx.fillRect(px, py, TS, TS); continue; }
    if (!opc.vis.has(i)) { ctx.fillStyle = 'rgba(6,4,14,0.62)'; ctx.fillRect(px, py, TS, TS); } }
  if (opc.antes) opc.antes(ctx);
  const f = Math.floor(tempo * 2.2) % 2; void f; const lista = [...(opc.itens || [])]; lista.sort((a, b) => a.y - b.y); for (const e of lista) e.d(ctx);
  if (opc.depois) opc.depois(ctx);
  // luz: jogador + tochas das paredes
  const luzes = []; const jx = opc.jogador.x * TS + 16 - cam.x, jy = opc.jogador.y * TS + 16 - cam.y; luzes.push({ x: jx, y: jy, r: (opc.raio + 0.9) * TS, a: 1, quente: true });
  for (const L of A.luzes) { const lx = L.x - cam.x, ly = L.y - cam.y; if (lx < -L.r || ly < -L.r || lx > VW.w + L.r || ly > VW.h + L.r) continue; const ix = Math.floor(L.x / TS), iy = Math.floor(L.y / TS) + 1; if (!d.explorado[iy * d.w + ix]) continue; luzes.push({ x: lx, y: ly + (Math.sin(tempo * 7 + L.x) * 1.2), r: L.r * (0.55 + 0.04 * Math.sin(tempo * 9 + L.x)), a: 0.7, quente: true }); }
  for (const L of opc.luzesExtra || []) luzes.push({ x: L.x * TS + 16 - cam.x, y: L.y * TS + 16 - cam.y, r: L.r, a: L.a ?? 0.8, quente: !!L.quente });
  aplicarEscuridao(ctx, VW.w, VW.h, luzes, opc.escuro ?? 0.82, '8,5,20');
  if (opc.topo) opc.topo(ctx); void T;
}
