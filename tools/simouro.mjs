// Balanço da economia: ouro esperado por dia de jogo em cada nível vs. meta (curva de riqueza do SRD/DMG).
import * as E from '../js/economia.js';
import { MONSTROS } from '../js/srd.js';
import * as R from '../js/rules.js';
const rng = R.mulberry32(42); const lin = [];
for (const L of [1, 2, 3, 5, 7, 10, 13, 16, 20]) {
  const alvo = E.ouroPorDia(L); let miss = 4 * E.ouroMissao(L, 1.1);
  const pool = R.poolCatacumbas(L, 1).map((id) => MONSTROS[id]);
  let bau = 0, mon = 0; const N = 400;
  for (let i = 0; i < N; i++) {
    // dia típico: 3,5 baús (2 da masmorra + treino) e 8 encontros de ~2,2 criaturas
    for (let b = 0; b < 3.5; b++) bau += E.ouroBau(L, Math.min(4, Math.floor(rng() * rng() * 5)), rng) / N;
    for (let k = 0; k < 8 * 2.2; k++) mon += E.ouroMonstro(pool[Math.floor(rng() * pool.length)], rng) / N;
  }
  const tot = miss + bau + mon; lin.push(`L${String(L).padStart(2)}  meta ${String(Math.round(alvo)).padStart(4)} po/dia | missões ${Math.round(miss)}  baús ${Math.round(bau)}  monstros ${Math.round(mon)}  = ${Math.round(tot)} (${Math.round(100 * tot / alvo)}% da meta; o resto vem de capítulos/eventos)`);
}
console.log(lin.join('\n'));
