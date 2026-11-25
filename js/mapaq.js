// Mapa-múndi do Vale com marcadores de missão (só as rastreadas) e as informações de "onde ir" de cada missão.
import * as St from './store.js';
import * as Camp from './campanha.js';
import { QLUG } from './historia2.js';
import { LUG, obterMapa } from './world.js';
import { CAPS } from './mundo.js';
import { prepararExterno } from './render.js';
import { CAPITULOS } from './story.js';

export const S = () => St.S;
export const rastreadas = () => { const s = S(); const ids = new Set(s.rastro || []); return Camp.ativas(s).filter((q) => ids.has(q.id)); };
// onde a missão leva: lugares do QLUG + a entrada do capítulo do passo atual (quando o passo é "vença o capítulo N")
export function alvosDaQuest(q) {
  const s = S(); const e = s.campanha.q[q.id]; const out = [];
  if (e && e.est === 'ativa') { const p = q.passos[e.passo || 0]; if (p && p.obj && p.obj.k === 'capitulo') { const c = CAPS[p.obj.n]; const cap = CAPITULOS[p.obj.n - 1]; if (c) out.push({ x: c.x, y: c.y, nome: `Cap. ${p.obj.n}: ${cap ? cap.local : ''}`, cap: p.obj.n }); } }
  for (const k of QLUG[q.id] || []) { const l = LUG[k]; if (l) out.push({ x: l.x, y: l.y, nome: l.nome, lug: k }); }
  return out;
}
export const nomesDeLugar = (q) => (QLUG[q.id] || []).map((k) => (LUG[k] || {}).nome).filter(Boolean);
export function posicaoDoHeroi(G) {
  const m = obterMapa('vale'); const id0 = String(G.mapa || 'vila').split('/')[0];
  if (G.mp && G.mp.tipo === 'regiao') return { x: G.P.x, y: G.P.y, dentro: false }; if (LUG[id0]) return { x: LUG[id0].x, y: LUG[id0].y, dentro: true }; return { x: LUG.vila.x, y: LUG.vila.y, dentro: true };
  void m;
}

// Estrela (principal) ou losango (secundária) com brilho; foco = anel pulsante extra
function marcador(x, ctx, px, py, principal, foco) {
  const cor = principal ? '#ffd23f' : '#6ac8ff', borda = principal ? '#7a4a00' : '#10407a';
  ctx.save(); ctx.translate(px, py);
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, foco ? 22 : 15); g.addColorStop(0, principal ? 'rgba(255,220,80,.85)' : 'rgba(110,200,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, foco ? 22 : 15, 0, 7); ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = borda; ctx.fillStyle = cor; ctx.beginPath();
  if (principal) { for (let i = 0; i < 10; i++) { const r = i % 2 ? 4.6 : 10, a = -Math.PI / 2 + (i * Math.PI) / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }
  else { ctx.moveTo(0, -9); ctx.lineTo(7, 0); ctx.lineTo(0, 9); ctx.lineTo(-7, 0); ctx.closePath(); }
  ctx.stroke(); ctx.fill(); if (foco) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); ctx.stroke(); } ctx.restore(); void x;
}
// Desenha o Vale no canvas. opc: { larg, foco (id de missão), todas (mostra também as não rastreadas, apagadas), G }
export function desenharMapaVale(cv, opc = {}) {
  const m = obterMapa('vale'); const A = prepararExterno(m); const W = opc.larg || 720, H = Math.round(W * m.h / m.w); cv.width = W; cv.height = H; const x = cv.getContext('2d'); x.imageSmoothingEnabled = true;
  x.drawImage(A.canvas, 0, 0, W, H); const k = W / m.w; const s = S(); const ativo = St.capituloDisponivel() || 20; const lim = ativo + 1.2;
  for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) { const r = m.reg[j * m.w + i]; if (r > lim) { x.fillStyle = `rgba(10,8,22,${Math.min(0.9, 0.58 + (r - lim) * 0.05)})`; x.fillRect(i * k, j * k, k + 0.6, k + 0.6); } }
  // sépia: o mapa fica com cara de papel velho
  x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgba(214,170,100,.5)'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
  x.textAlign = 'center'; x.font = `bold ${Math.round(W / 62)}px Georgia,serif`;
  const txt = (t, px, py, cor = '#fff', borda = 'rgba(40,20,5,.9)') => { x.lineWidth = 3.5; x.strokeStyle = borda; x.strokeText(t, px, py); x.fillStyle = cor; x.fillText(t, px, py); };
  for (const t of m.rotulos) { const r = m.reg[Math.min(m.h - 1, Math.max(0, Math.round(t.y + 5))) * m.w + Math.round(t.x)] || 0; if (r > lim) continue; txt(t.t, (t.x + 0.5) * k, t.y * k + 8, '#fff2c8'); }
  for (const e of m.extra) { if (e.cata) { txt('∞', (e.x + 0.5) * k, (e.y + 0.5) * k + 4, '#e0d0ff'); continue; } const feito = s.historia.limpos.includes(e.n); txt(String(e.n), (e.x + 0.5) * k, (e.y + 0.5) * k + 4, feito ? '#9dffb0' : e.n === ativo ? '#8af4ff' : '#e8e0d0'); }
  const sel = opc.todas ? Camp.ativas(s) : rastreadas(); const feitos = new Set();
  for (const q of sel) { const trk = (s.rastro || []).includes(q.id); for (const a of alvosDaQuest(q)) { const kk = `${q.id}:${a.x},${a.y}`; if (feitos.has(kk)) continue; feitos.add(kk); x.globalAlpha = trk ? 1 : 0.45; marcador(x, x, (a.x + 0.5) * k, (a.y + 0.5) * k - 8, q.tipo === 'principal', opc.foco === q.id); x.globalAlpha = 1; } }
  if (opc.G) { const p = posicaoDoHeroi(opc.G); x.fillStyle = '#e83a4a'; x.strokeStyle = '#fff'; x.lineWidth = 2.5; x.beginPath(); x.arc((p.x + 0.5) * k, (p.y + 0.5) * k, 6.5, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.arc((p.x + 0.5) * k, (p.y + 0.5) * k, 2, 0, 7); x.fill(); }
  return { m, k, W, H };
}
