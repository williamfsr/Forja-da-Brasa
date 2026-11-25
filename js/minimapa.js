// Minimapa circular no canto do jogo: mostra o entorno do herói e aponta as missões rastreadas (estrela = principal, losango = secundária).
// Toque/clique abre o Mapa do menu de pausa. Nas masmorras o jogo usa o minimapa próprio de exploração.
import * as St from './store.js';
import * as Camp from './campanha.js';
import { QLUG } from './historia2.js';
import { prepararExterno, TS } from './render.js';
import { rastreadas, alvosDaQuest } from './mapaq.js';

const TAM = 108;
export function instalarMinimapa(G) {
  const jogo = document.getElementById('jogo'); if (!jogo) return;
  const cv = document.createElement('canvas'); cv.id = 'minimapa'; cv.className = 'oculto'; cv.setAttribute('aria-label', 'Minimapa'); jogo.append(cv);
  const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = cv.height = Math.round(TAM * dpr); cv.style.width = cv.style.height = TAM + 'px';
  cv.addEventListener('click', () => { if (!G.ui.modalAberto()) G.ui.painel('menu', { aba: 'mapa' }); });
  const x = cv.getContext('2d'); let t0 = performance.now();
  function posicionar() { const h = document.getElementById('hud'); const r = h ? h.getBoundingClientRect() : { bottom: 0 }; const j = jogo.getBoundingClientRect(); cv.style.top = Math.max(6, r.bottom - j.top + 8) + 'px'; }
  function ponta(ang, cor) { x.save(); x.translate(TAM / 2, TAM / 2); x.rotate(ang); x.translate(TAM / 2 - 7, 0); x.fillStyle = cor; x.strokeStyle = 'rgba(30,15,3,.9)'; x.lineWidth = 2; x.beginPath(); x.moveTo(6, 0); x.lineTo(-5, -5.5); x.lineTo(-5, 5.5); x.closePath(); x.stroke(); x.fill(); x.restore(); }
  function marca(px, py, principal, t) {
    x.save(); x.translate(px, py); const pulso = 1 + 0.12 * Math.sin(t * 5); x.scale(pulso, pulso); x.lineWidth = 1.8; x.strokeStyle = principal ? '#6a3c00' : '#0c3a70'; x.fillStyle = principal ? '#ffd23f' : '#6ac8ff'; x.beginPath();
    if (principal) { for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.2 : 7, a = -Math.PI / 2 + (i * Math.PI) / 5; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); } else { x.moveTo(0, -6.5); x.lineTo(5, 0); x.lineTo(0, 6.5); x.lineTo(-5, 0); x.closePath(); }
    x.stroke(); x.fill(); x.restore();
  }
  function desenhar() {
    const s = St.S; const ok = s && ['vila', 'vale'].includes(G.modo) && G.mp && !G.ui.modalAberto() && !G.ocupado; cv.classList.toggle('oculto', !ok); if (!ok) return; posicionar();
    const t = (performance.now() - t0) / 1000; const m = G.mp; const A = prepararExterno(m); const P = G.P; const mov = P.mov; const fx = mov ? P.x + (mov.x1 - P.x) * Math.min(1, mov.t) : P.x, fy = mov ? P.y + (mov.y1 - P.y) * Math.min(1, mov.t) : P.y;
    const R = Math.min(13, Math.max(m.w, m.h) / 2); const jan = R * 2; const esc = TAM / jan; // pixels do minimapa por tile
    x.clearRect(0, 0, TAM, TAM); x.save(); x.scale(cv.width / TAM, cv.height / TAM); x.beginPath(); x.arc(TAM / 2, TAM / 2, TAM / 2 - 2, 0, 7); x.clip();
    x.fillStyle = '#1a1208'; x.fillRect(0, 0, TAM, TAM); x.imageSmoothingEnabled = true;
    const cxm = m.w <= jan ? m.w / 2 : Math.max(R, Math.min(m.w - R, fx + 0.5)), cym = m.h <= jan ? m.h / 2 : Math.max(R, Math.min(m.h - R, fy + 0.5)); // centro da janela (no mundo, em tiles)
    const sx = (cxm - R) * TS, sy = (cym - R) * TS; x.drawImage(A.canvas, Math.max(0, sx), Math.max(0, sy), Math.min(A.canvas.width - Math.max(0, sx), jan * TS), Math.min(A.canvas.height - Math.max(0, sy), jan * TS), Math.max(0, -sx / TS * esc), Math.max(0, -sy / TS * esc), Math.min(A.canvas.width - Math.max(0, sx), jan * TS) / TS * esc, Math.min(A.canvas.height - Math.max(0, sy), jan * TS) / TS * esc);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgba(220,175,105,.55)'; x.fillRect(0, 0, TAM, TAM); x.globalCompositeOperation = 'source-over';
    const aTela = (wx, wy) => ({ x: (wx + 0.5 - (cxm - R)) * esc, y: (wy + 0.5 - (cym - R)) * esc });
    const cid = String(G.mapa || 'vila').split('/')[0]; const naRegiao = m.tipo === 'regiao';
    const pontos = []; const aqui = []; // pontos {x,y (mundo em tiles), principal}; aqui = missões que pedem algo nesta área mas sem alvo visível
    for (const q of rastreadas()) {
      const pr = q.tipo === 'principal';
      if (naRegiao) { for (const a of alvosDaQuest(q)) pontos.push({ x: a.x, y: a.y, pr }); }
      else { const dono = (G.npcsAtuais ? G.npcsAtuais() : []).find((n) => n.id === q.npc); if (dono) pontos.push({ x: dono.x, y: dono.y, pr }); else if ((QLUG[q.id] || []).includes(cid)) aqui.push(pr); }
    }
    for (const p of pontos) {
      const a = aTela(p.x, p.y); const dx = a.x - TAM / 2, dy = a.y - TAM / 2; const d = Math.hypot(dx, dy);
      if (d > TAM / 2 - 9) { ponta(Math.atan2(dy, dx), p.pr ? '#ffd23f' : '#6ac8ff'); } else marca(a.x, a.y, p.pr, t);
    }
    const h = aTela(fx, fy); x.fillStyle = '#fff'; x.strokeStyle = '#c02030'; x.lineWidth = 2; x.beginPath(); x.arc(h.x, h.y, 4, 0, 7); x.fill(); x.stroke();
    const dv = { cima: [0, -1], baixo: [0, 1], esq: [-1, 0], dir: [1, 0] }[P.dir] || [0, 1]; x.fillStyle = '#c02030'; x.beginPath(); x.arc(h.x + dv[0] * 6, h.y + dv[1] * 6, 1.8, 0, 7); x.fill();
    x.restore();
    // aro de papiro/ouro e a letra N
    x.save(); x.scale(cv.width / TAM, cv.height / TAM); x.lineWidth = 4; x.strokeStyle = '#6a4220'; x.beginPath(); x.arc(TAM / 2, TAM / 2, TAM / 2 - 2, 0, 7); x.stroke(); x.lineWidth = 1.5; x.strokeStyle = '#e8c880'; x.beginPath(); x.arc(TAM / 2, TAM / 2, TAM / 2 - 4.5, 0, 7); x.stroke();
    aqui.slice(0, 3).forEach((pr, i) => { x.save(); x.translate(18 + i * 15, TAM - 20); marca(0, 0, pr, t); x.restore(); });
    x.fillStyle = '#fff2c8'; x.strokeStyle = 'rgba(40,20,5,.9)'; x.lineWidth = 2.5; x.font = '700 10px Georgia,serif'; x.textAlign = 'center'; x.strokeText('N', TAM / 2, 12); x.fillText('N', TAM / 2, 12); x.restore();
  }
  setInterval(() => { try { desenhar(); } catch (e) { /* mapa ainda não carregado */ } }, 120);
  void Camp;
}
