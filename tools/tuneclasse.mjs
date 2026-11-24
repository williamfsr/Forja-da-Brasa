// Calibra um fator de dano dos chefes por classe (para todas terem ~62% de vitória média nos chefes).
import { CAPITULOS } from '../js/story.js';
import { lutar } from './simlib.mjs';
const classes = ['guerreiro', 'barbaro', 'ladino', 'mago', 'clerigo', 'paladino'];
const alvo = 0.62;
const winMedio = (c, m, n = 20) => { let t = 0; for (const cap of CAPITULOS) { const b = cap.boss; t += lutar(c, cap.n, { id: b.base, opts: { chefe: true, ov: { ...(b.ov || {}), dm: (b.dm || 1) * m }, nome: b.nome, esc: b.esc } }, n).win; } return t / CAPITULOS.length; };
const out = {};
for (const c of classes) {
  let lo = 0.15, hi = 2.2; for (let i = 0; i < 8; i++) { const mid = (lo + hi) / 2; if (winMedio(c, mid) > alvo) lo = mid; else hi = mid; }
  out[c] = +((lo + hi) / 2).toFixed(2); console.log(c, out[c], 'win', winMedio(c, out[c], 60).toFixed(2));
}
console.log('AJUSTE_CLASSE=' + JSON.stringify(out));
