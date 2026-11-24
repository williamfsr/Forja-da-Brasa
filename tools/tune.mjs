// Ajuste automático de dificuldade (dm = multiplicador de dano, esc = multiplicador de PV).
import { CAPITULOS } from '../js/story.js';
import { poolCatacumbas } from '../js/rules.js';
import { lutar } from './simlib.mjs';
const classes = ['guerreiro', 'barbaro', 'ladino', 'mago', 'clerigo', 'paladino'];
const alvoBoss = 0.62, alvoPerda = 0.24;
const bis = (f, lo, hi, alvo, cresce, it = 8) => { for (let i = 0; i < it; i++) { const mid = (lo + hi) / 2; const v = f(mid); if (cresce ? v < alvo : v > alvo) lo = mid; else hi = mid; } return (lo + hi) / 2; };
// perda média de PV vs. monstros comuns (cresce com dm)
const perda = (L, esc, dm, n = 18) => { let t = 0, k = 0; for (const c of classes) for (const id of poolCatacumbas(L, 0).slice(0, 8)) { t += lutar(c, L, { id, opts: { esc, ov: { dm } } }, n).hp; k++; } return t / k; };
const winBoss = (cap, esc, dm, n = 36) => { let t = 0; const b = cap.boss; for (const c of classes) t += lutar(c, cap.n, { id: b.base, opts: { chefe: true, ov: { ...b.ov, dm }, nome: b.nome, esc } }, n).win; return t / classes.length; };
const normal = [], bosses = [];
for (let L = 1; L <= 20; L++) {
  let esc = 1, dm = bis((x) => perda(L, 1, x), 0.2, 3.5, alvoPerda, true);
  if (dm > 2.2) { dm = 2.2; esc = bis((x) => perda(L, x, 2.2), 0.3, 6, alvoPerda, true); }
  if (dm < 0.4) { dm = 0.4; esc = bis((x) => perda(L, x, 0.4), 0.2, 1, alvoPerda, true); }
  normal.push([L, +esc.toFixed(2), +dm.toFixed(2)]); console.log('normal', L, esc.toFixed(2), dm.toFixed(2));
}
for (const cap of CAPITULOS) {
  let esc = 1, dm = bis((x) => winBoss(cap, 1, x), 0.15, 3, alvoBoss, false);
  if (dm > 1.6) { dm = 1.6; esc = bis((x) => winBoss(cap, x, 1.6), 0.5, 4, alvoBoss, false); }
  if (dm < 0.45) { dm = 0.45; esc = bis((x) => winBoss(cap, x, 0.45), 0.2, 1.5, alvoBoss, false); }
  bosses.push([cap.n, +esc.toFixed(2), +dm.toFixed(2)]); console.log('boss', cap.n, esc.toFixed(2), dm.toFixed(2), 'win', winBoss(cap, esc, dm, 60).toFixed(2));
}
console.log('NORMAL=' + JSON.stringify(normal)); console.log('BOSS=' + JSON.stringify(bosses));
