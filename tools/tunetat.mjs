// Recalibra a dificuldade para o combate TÁTICO: escala dos comuns (esc/dm por nível), chefes por capítulo e ajuste por classe.
import * as R from '../js/rules.js';
import { CAPITULOS } from '../js/story.js';
import { lutarT } from './simtat.mjs';
import { criaBoss } from './simlib.mjs';
const CL = ['guerreiro', 'barbaro', 'ladino', 'mago', 'clerigo', 'paladino'];
const alvoBoss = 0.62, alvoPerda = 0.24;
const AJ = { ...R.AJUSTE_CLASSE };
const bis = (f, lo, hi, alvo, cresce, it = 9) => { for (let i = 0; i < it; i++) { const mid = (lo + hi) / 2; const v = f(mid); if (cresce ? v < alvo : v > alvo) lo = mid; else hi = mid; } return (lo + hi) / 2; };
const perda = (L, esc, dm, n = 20) => { let t = 0; const ids = R.poolDoCapitulo(CAPITULOS[L - 1]); for (const c of CL) t += lutarT(c, L, ids, 1, n, null, { esc, dm, aj: AJ[c] }).hp; return t / CL.length; };
const bossRes = (cap, c, esc, dm, n = 30) => { const b = criaBoss(cap); b.opts.esc = esc; b.opts.ov = { ...b.opts.ov, dm: dm * AJ[c] }; return lutarT(c, cap.n, [], 1, n, b).win; };
const winBoss = (cap, esc, dm, n = 30) => CL.reduce((t, c) => t + bossRes(cap, c, esc, dm, n), 0) / CL.length;
const rodadas = +process.argv[2] || 2;
let normal = [], bosses = [];
for (let r = 0; r < rodadas; r++) {
  normal = []; bosses = [];
  for (let L = 1; L <= 20; L++) {
    let esc = 1, dm = bis((x) => perda(L, 1, x), 0.2, 3.5, alvoPerda, true);
    if (dm > 2.2) { dm = 2.2; esc = bis((x) => perda(L, x, 2.2), 0.3, 6, alvoPerda, true); }
    if (dm < 0.4) { dm = 0.4; esc = bis((x) => perda(L, x, 0.4), 0.2, 1, alvoPerda, true); }
    normal.push([+esc.toFixed(2), +dm.toFixed(2)]);
  }
  for (const cap of CAPITULOS) {
    let esc = 1, dm = bis((x) => winBoss(cap, 1, x), 0.15, 3, alvoBoss, false);
    if (dm > 1.6) { dm = 1.6; esc = bis((x) => winBoss(cap, x, 1.6), 0.5, 4, alvoBoss, false); }
    if (dm < 0.45) { dm = 0.45; esc = bis((x) => winBoss(cap, x, 0.45), 0.2, 1.5, alvoBoss, false); }
    bosses.push([+esc.toFixed(2), +dm.toFixed(2)]);
  }
  // ajuste por classe: fator multiplicativo de dano do chefe, para cada classe ~62% de vitória média
  for (const c of CL) {
    const win = (m) => { let t = 0; CAPITULOS.forEach((cap, i) => { const [esc, dm] = bosses[i]; const b = criaBoss(cap); b.opts.esc = esc; b.opts.ov = { ...b.opts.ov, dm: dm * m }; t += lutarT(c, cap.n, [], 1, 20, b).win; }); return t / CAPITULOS.length; };
    const lo0 = 0.2, hi0 = 2.4; AJ[c] = +bis(win, lo0, hi0, alvoBoss, false, 8).toFixed(2);
  }
  console.log(`rodada ${r + 1}: AJUSTE_CLASSE=` + JSON.stringify(AJ));
}
console.log('ESCALA_N=' + JSON.stringify(normal));
console.log('BOSS=' + JSON.stringify(bosses));
// verificação
for (const cap of CAPITULOS) { const i = cap.n - 1; console.log(String(cap.n).padStart(2), CL.map((c) => c.slice(0, 3) + ' ' + (bossRes(cap, c, bosses[i][0], bosses[i][1], 60) * 100).toFixed(0) + '%').join(' | ')); }
