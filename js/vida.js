// O mundo respira com a sua rotina: quanto menos Inércia e mais atividade, mais cor, folhas e vagalumes; quanto mais parado, mais cinza, árvores secas e cinzas no ar.
import * as St from './store.js';

export function vidaAlvo(s) {
  if (!s) return 0.7; const H = s.historia, d = (s.dias && s.dias[St.hoje()]) || null; const ativo = d && (d.ativ || d.series > 0 || d.cardio > 0 || d.estudo > 0 || (d.comida && d.comida.length > 0));
  const v = 0.80 * (1 - H.inercia / 10) + 0.12 * (H.moral / 100) + (ativo ? 0.08 : 0) + Math.min(0.08, ((s.sequencia && s.sequencia.atual) || 0) * 0.01);
  return Math.max(0.02, Math.min(1, v));
}
export const Vida = { cur: null, alvo: null, onda: null, ult: 0, acum: 0 };
const msg = (a, b) => (b > a ? 'A cor volta ao Vale. Cada passo seu acende um pouco da Brasa.' : 'O Vale perde a cor. A Inércia se aproxima de quem para.');
// chamado todo quadro (dt em s). px,py = posição do herói em pixels de mundo (para a onda).
export function passoVida(dt, s, px, py, toast) {
  if (!s) return; const m = (s.mundo ||= { visitados: {} });
  const alvo = vidaAlvo(s); if (Vida.cur == null) { Vida.cur = typeof m.vida === 'number' ? m.vida : alvo; }
  Vida.alvo = alvo;
  if (Vida.onda) { const o = Vida.onda; o.t += dt / 2.4; if (o.t >= 1) { Vida.cur = o.novo; m.vida = o.novo; Vida.onda = null; } return; }
  if (Math.abs(alvo - Vida.cur) > 0.025) { Vida.onda = { x: px, y: py, t: 0, velho: Vida.cur, novo: alvo }; if (Math.abs(alvo - Vida.cur) > 0.08 && toast) toast(msg(Vida.cur, alvo), 4200); }
}
export const vidaAtual = () => (Vida.cur == null ? 0.7 : Vida.cur);
// partículas de ambiente: cinzas se morto, pólen e vagalumes se vivo
export function ambiente(dt, PART, cam, VW, v) {
  Vida.acum += dt; const morte = 1 - v; const passo = 0.07; if (Vida.acum < passo) return; Vida.acum = 0;
  if (morte > 0.35 && Math.random() < (morte - 0.3) * 1.2) PART.emitir(cam.x + Math.random() * VW.w, cam.y - 4, 1, { cor: ['#a9a9b8', '#8a8a9a', '#c2c2d0'], vel: 6, ang: 1.9, abre: 0.6, vida: 4.5, tam: 1, sobe: -12 });
  if (v > 0.62 && Math.random() < (v - 0.55) * 1.1) PART.emitir(cam.x + Math.random() * VW.w, cam.y + VW.h * (0.3 + Math.random() * 0.7), 1, { cor: ['#ffe27a', '#b8ff8a', '#fff6c0'], vel: 5, vida: 3.2, tam: 1, sobe: 7, brilho: true });
}
