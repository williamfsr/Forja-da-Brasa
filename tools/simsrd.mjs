// Valida o bestiário SRD importado: cada criatura, no nível em que aparece nas masmorras, contra 4 classes.
import * as R from '../js/rules.js';
import { MONSTROS } from '../js/srd.js';
import { lutarT } from './simtat.mjs';
const classes = ['guerreiro', 'mago', 'clerigo', 'ladino'];
const lista = Object.values(MONSTROS).filter((m) => m.srd && !m.inv && m.tp !== 'custom' && m.cr >= 0.125 && m.cr <= 17).sort((a, b) => a.cr - b.cr);
const so = process.argv[2]; const out = [];
for (const m of lista) {
  if (so && !m.id.includes(so)) continue;
  const L = Math.max(1, Math.min(20, Math.ceil((m.cr - 0.4) / 0.62) + 1)); const n = m.cr < 2 ? 2 : 1;
  let w = 0, h = 0;
  for (const c of classes) { const r = lutarT(c, L, [m.id], n, 8); w += r.win; h += r.hp; }
  out.push({ id: m.id, cr: m.cr, L, n, win: +(w / 4).toFixed(2), hp: +(h / 4).toFixed(2) });
}
const ruins = out.filter((o) => o.win < 0.55 || o.win > 0.995 && o.hp > 0.001 && false);
console.log('total', out.length, 'média win', (out.reduce((a, o) => a + o.win, 0) / out.length).toFixed(2), 'média hp perdido', (out.reduce((a, o) => a + o.hp, 0) / out.length).toFixed(2));
console.log('difíceis demais:', out.filter((o) => o.win < 0.6).map((o) => `${o.id}(cr${o.cr},L${o.L}:${o.win})`).join(' '));
console.log('fáceis demais:', out.filter((o) => o.hp < 0.08).map((o) => `${o.id}(cr${o.cr},L${o.L}:${o.hp})`).join(' '));
import('fs').then((fs) => fs.writeFileSync('/tmp/simsrd.json', JSON.stringify(out)));
