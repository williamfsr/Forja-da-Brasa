// Simulação da campanha: avança estatísticas e capítulos e confere se as missões se encadeiam sem erros.
import * as C from '../js/campanha.js';
import { ITENS } from '../js/srd.js';
import { rngDe } from '../js/rules.js';
const S = { stats: { series: 0, cardioMin: 0, estudoMin: 0, prs: 0, diasAtivos: 0, perfeitos: 0, banquetes: 0, abates: 0, masmorras: 0, pomos: 0 }, heroi: { nivel: 1, insp: 0 }, historia: { limpos: [], flags: {}, moral: 50, ciclo: 1 }, dias: {}, campanha: C.novoEstado(), companheiros: [], inicio: '2026-01-01', criado: 1 };
const inv = {}; let ouro = 0; const rec = [];
const h = { ganharOuro: (n) => { ouro += n; }, invAdd: (id) => { inv[id] = (inv[id] || 0) + 1; if (!ITENS[id]) throw new Error('item inexistente ' + id); }, lerBaralho: () => C.lerBaralho(S, rngDe('x')), recrutar: (id) => S.companheiros.push(id) };
const feito = new Set();
for (let cap = 1; cap <= 20; cap++) {
  S.heroi.nivel = cap;
  // treino realista por capítulo
  S.stats.series += 12; S.stats.cardioMin += 70; S.stats.estudoMin += 90; S.stats.perfeitos += 2; S.stats.banquetes += 2; S.stats.prs += 1; S.stats.diasAtivos += 4; S.stats.abates += 10; S.stats.masmorras += 1;
  S.dias['2026-02-' + String(cap).padStart(2, '0')] = { liftSets: { barra: 6 } };
  let ev = C.avaliar(S, h);
  S.historia.limpos.push(cap); ev = ev.concat(C.aoConcluirCapitulo(S, cap, h)); ev = ev.concat(C.avaliar(S, h));
  for (const e of ev) { if (e.t === 'fim') feito.add(e.q.id); rec.push(`cap${cap} ${e.t} ${e.q ? e.q.id : e.p ? e.p.id : e.r ? e.r.nome : e.a ? e.a.nome : ''}`); }
}
console.log('missões concluídas:', feito.size, '/', C.QUESTS.length, [...feito].join(','));
console.log('pendentes:', C.QUESTS.filter((q) => !feito.has(q.id)).map((q) => q.id + '(' + (S.campanha.q[q.id] ? 'passo ' + S.campanha.q[q.id].passo : 'travada') + ')').join(' '));
console.log('relíquias', S.campanha.rel, 'leitura', S.campanha.leitura, 'aliados', S.companheiros, 'páginas', S.campanha.lore.length, 'ouro', ouro, 'itens', Object.keys(inv).length);
