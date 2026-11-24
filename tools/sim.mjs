// Simulação de balanceamento e testes de regras (Node).  Uso: node tools/sim.mjs [testes|balanco]
import * as St from '../js/store.js';
import * as R from '../js/rules.js';
import { CLASSES, ITENS, MONSTROS, recursosMax } from '../js/srd.js';
import { CAPITULOS } from '../js/story.js';
import { simular, novaBatalha } from '../js/combat.js';
import { GRUPOS_TREINO, LIFTS } from '../js/conteudo.js';

import { heroiSim, lutar, criaBoss } from './simlib.mjs';
const modo = process.argv[2] || 'testes';
const ok = (c, m) => { if (!c) { console.log('  FALHOU:', m); process.exitCode = 1; } else console.log('  ok:', m); };

if (modo === 'testes') {
  console.log('== Regras ==');
  ok(R.xpParaNivel(2) === 60 || R.xpParaNivel(2) > 0, `XP nível 2 = ${R.xpParaNivel(2)}`);
  console.log('  curva:', [2, 5, 10, 15, 20].map((l) => `${l}:${R.xpParaNivel(l)}`).join(' '));
  ok(R.nivelPorXp(R.xpParaNivel(7)) === 7, 'nivelPorXp inverso');
  ok(Math.abs(R.e1rm(100, 10) - 133.3) < 0.1, 'e1RM 100x10');
  console.log('== Fluxo de vida real ==');
  const s = St.estadoInicial({ nome: 'Teste', cls: 'mago', peso: 80 }); St.setEstado(s);
  let r = St.registrarSerie('supino', 80, 8); ok(r.baseline && r.xp > 0, `Supino baseline xp=${r.xp}`);
  r = St.registrarSerie('supino', 80, 8); ok(!r.pr && r.base > 0, `Série repetida sem PR xp=${r.xp}`);
  r = St.registrarSerie('supino', 85, 8); ok(!!r.pr && r.xp > 100, `PR detectado xp=${r.xp}`);
  r = St.registrarCardio('corrida', 30, 'moderado'); ok(r.xp >= 40, `Corrida 30min xp=${r.xp}`);
  r = St.registrarEstudo('questoes', 'residencia', 60); ok(r.xp > 60, `Estudo 60 min xp=${r.xp}`);
  St.addComida('Almoço', 800); St.addComida('Jantar', 900); St.addComida('Lanche', 500);
  console.log('  faixa hoje:', St.faixaDeHoje().id, 'kcal', St.dia().kcal);
  console.log('  nível', s.heroi.nivel, 'xp', s.heroi.xp, 'tochas', s.heroi.tochas, 'ouro', s.heroi.ouro, 'missões', s.diario.missoes.map((q) => `${q.txt} [${q.prog}/${q.alvo}${q.feito ? ' ✔' : ''}]`));
  ok(s.heroi.xp > 150, 'XP acumulado');
  console.log('== Atributos ==');
  const A = R.atributos(s); console.log('  ', JSON.stringify(A));
  console.log('== Nutrição ==');
  for (const q of [0.5, 0.7, 0.85, 1, 1.1, 1.15, 1.3, 1.6]) console.log('  ', q, R.faixaNutricao(2200 * q, 2200, 3).id);
  console.log('== Virada de dia ==');
  s.diario.data = R.addDias(R.dataStr(), -2); s.dias[s.diario.data] = { ...St.dia(), kcal: 2200, comida: [{ n: 'a', k: 2200 }], ativ: true }; const rel = St.virarDia();
  ok(rel && rel.dias.length === 2, `relatório com ${rel && rel.dias.length} dia(s); faixa=${rel && rel.faixa.id}`);
  console.log('  inércia', s.historia.inercia, 'exaustão', s.heroi.exaustao, 'recursos', JSON.stringify(s.recursos));
  console.log('== Masmorra ==');
  const { gerarMasmorra } = await import('../js/dungeon.js');
  const d = gerarMasmorra({ seed: 123, andar: 2, final: true, tema: 'porao', pool: CAPITULOS[0].pool, nivel: 1, chefe: CAPITULOS[0].boss });
  ok(d.ents.some((e) => e.tipo === 'chefe') && d.salas.length >= 3, `masmorra gerada: ${d.salas.length} salas, ${d.ents.length} entidades`);
}

if (modo === 'balanco') {
  const classes = ['guerreiro', 'barbaro', 'ladino', 'mago', 'clerigo', 'paladino'];
  console.log('Vitória (média PV perdido) vs. monstros comuns do capítulo | chefe');
  for (const cap of CAPITULOS) {
    const L = cap.n; const linha = [];
    for (const c of classes) {
      let wins = 0, hp = 0, k = 0; for (const id of cap.pool) { const r = lutar(c, L, { id }, 40); wins += r.win; hp += r.hp; k++; }
      const b = lutar(c, L, criaBoss(cap), 60);
      linha.push(`${c.slice(0, 3)} ${(wins / k * 100).toFixed(0)}%/${(hp / k * 100).toFixed(0)}  B${(b.win * 100).toFixed(0)}%`);
    }
    console.log(String(L).padStart(2), cap.boss.nome.slice(0, 22).padEnd(22), linha.join(' | '));
  }
}
