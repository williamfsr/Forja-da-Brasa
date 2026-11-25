// Teste de fumaça das magias do SRD: conjura cada magia importada em cenários reais e verifica ausência de erros/NaN.
// Uso: node tools/simmagias.mjs
import * as R from '../js/rules.js';
import { MAGIAS } from '../js/srd.js';
import { MAGIAS_SRD } from '../js/dados/magias_srd.js';
import * as T from '../js/tatico.js';
import { heroiSim } from './simlib.mjs';
const arena = () => T.criarGrade(16, 11, (x, y) => (x === 7 && (y === 3 || y === 7)) || (x === 9 && y === 5) || (x === 5 && y === 1));

let falhas = 0, total = 0; const porTipo = {};
const rel = [];
for (const cls of ['mago', 'clerigo', 'paladino']) {
  for (const m of MAGIAS_SRD) {
    if (!m.cls.includes(cls)) continue; total++;
    try {
      const s = heroiSim(cls, 17); const rng = R.mulberry32(11 + total);
      const [eh, ed] = R.escalaNivel(17); const mons = ['bandido', 'goblin', 'goblin', 'lobo'].map((id) => R.criarMonstro(id, { esc: eh, ov: { dm: ed } }));
      const { B } = T.novaBatalha(s, mons, arena(), { rng, pos: { heroi: { x: 6, y: 5 }, ini: [{ x: 8, y: 5 }, { x: 8, y: 4 }, { x: 9, y: 6 }, { x: 10, y: 5 }] } });
      B.h.slots = B.h.slots.map(() => 9); const mi = T.magiasDoHeroi(B).find((q) => q.id === m.id);
      if (!mi) { rel.push(`${cls}:${m.id} NÃO listada`); falhas++; continue; }
      let miras = T.mirasValidas(B, B.h, m.id); const g = T.geoDe(m.id);
      if (!miras.length) { const e0 = B.un.find((u) => u.eq !== 'j'); e0.x = 7; e0.y = 5; miras = T.mirasValidas(B, B.h, m.id); }
      const alvoT = (g.f === 'self' || g.f === 'aliados') ? { x: B.h.x, y: B.h.y } : (miras.find((q) => B.un.some((u) => u.x === q.x && u.y === q.y && u.eq !== 'j')) || miras[0]);
      if (!alvoT) { rel.push(`${cls}:${m.id} sem mira (${g.f})`); falhas++; continue; }
      const nv = mi.circulos[0] || m.nv; const evs = T.conjurar(B, B.h, m.id, nv, alvoT.x, alvoT.y, []);
      const ruim = evs.filter((e) => e.t === 'dano' && !(e.n >= 0)); const cond = evs.filter((e) => e.t === 'cond').length;
      const t = m.tipo; porTipo[t] = porTipo[t] || { n: 0, evs: 0, dano: 0, cond: 0, cura: 0 }; porTipo[t].n++; porTipo[t].evs += evs.length;
      porTipo[t].dano += evs.filter((e) => e.t === 'dano').length; porTipo[t].cond += cond; porTipo[t].cura += evs.filter((e) => e.t === 'cura').length;
      if (ruim.length || !evs.length) { rel.push(`${cls}:${m.id} eventos inválidos`); falhas++; }
      // avança alguns turnos para exercitar condições
      for (let i = 0; i < 6 && !B.fim; i++) { if (T.ativo(B) !== B.h) { T.avancar(B, []); continue; } T.turnoAutoHeroi(B, []); if (!B.fim) T.fimTurno(B); }
      for (const u of B.un) if (![u.hp, u.ca, u.hpMax].every(Number.isFinite)) { rel.push(`${cls}:${m.id} NaN em ${u.nome}`); falhas++; break; }
    } catch (e) { rel.push(`${cls}:${m.id} EXC ${e.message.split('\n')[0]}`); falhas++; }
  }
}
console.log(`magias testadas: ${total}, falhas: ${falhas}`); console.log(JSON.stringify(porTipo)); if (rel.length) console.log(rel.join('\n'));
process.exit(falhas ? 1 : 0);
