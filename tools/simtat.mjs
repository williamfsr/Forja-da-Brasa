// Simulação do combate TÁTICO.  Uso: node tools/simtat.mjs [fumaca|balanco|grupo|boss]
import * as R from '../js/rules.js';
import { MONSTROS, MAGIAS } from '../js/srd.js';
import { CAPITULOS } from '../js/story.js';
import * as T from '../js/tatico.js';
import { heroiSim, criaBoss } from './simlib.mjs';

const modo = process.argv[2] || "fumaca";
const CLASSES = ['guerreiro', 'barbaro', 'ladino', 'mago', 'clerigo', 'paladino'];
export const arena = () => T.criarGrade(16, 11, (x, y) => (x === 7 && (y === 3 || y === 7)) || (x === 9 && y === 5) || (x === 5 && y === 1));
const posIni = (n) => [[12, 5], [12, 3], [12, 7], [13, 4], [13, 6], [11, 2]].slice(0, n).map(([x, y]) => ({ x, y }));

function monstrosDoGrupo(ids, L, n, rng, bossOpts = null, extra = {}) {
  const out = [];
  if (bossOpts) { out.push(R.criarMonstro(bossOpts.id, bossOpts.opts)); return out; }
  const [e0, d0] = R.escalaNivel(L); const esc = extra.esc ?? e0, dm = (extra.dm ?? d0) * Math.sqrt(extra.aj ?? 1); const g = T.escalaGrupo ? T.escalaGrupo(n) : { hp: 1, dm: 1 };
  for (let i = 0; i < n; i++) { const id = ids[Math.floor(rng() * ids.length)]; out.push(R.criarMonstro(id, { esc: esc * g.hp, ov: { dm: dm * g.dm } })); }
  return out;
}
export function lutarT(cls, L, ids, n, seeds, bossOpts = null, extra = {}) {
  let vit = 0, hpPerd = 0, rod = 0;
  for (let i = 0; i < seeds; i++) {
    const s = heroiSim(cls, L, extra.p); const rng = R.mulberry32(777 + i * 13);
    const mons = monstrosDoGrupo(ids, L, n, rng, bossOpts, extra);
    const B = T.simular(s, mons, arena(), rng, { pos: { heroi: { x: 2, y: 5 }, ini: posIni(mons.length) } });
    if (B.fim === 'vitoria') vit++; hpPerd += 1 - Math.max(0, B.h.hp) / B.h.hpMax; rod += B.rodada;
  }
  return { win: vit / seeds, hp: hpPerd / seeds, rod: rod / seeds };
}

if (modo === 'fumaca') {
  let falhas = 0;
  for (const cls of CLASSES) for (const L of [1, 5, 10, 15, 20]) {
    const cap = CAPITULOS[Math.min(L, CAPITULOS.length) - 1]; const ids = R.poolDoCapitulo(cap);
    try { const r = lutarT(cls, L, ids, 3, 6); console.log(cls.padEnd(9), String(L).padStart(2), `win ${(r.win * 100).toFixed(0)}% hp- ${(r.hp * 100).toFixed(0)}% rod ${r.rod.toFixed(1)}`); }
    catch (e) { falhas++; console.log('ERRO', cls, L, e.stack.split('\n').slice(0, 4).join(' | ')); }
  }
  // teste das magias de área / encanto / conversa
  const rng = R.mulberry32(5); const s = heroiSim('mago', 9, 0.3); const mons = [R.criarMonstro('goblin'), R.criarMonstro('goblin'), R.criarMonstro('bandido'), R.criarMonstro('orc')];
  const { B } = T.novaBatalha(s, mons, arena(), { rng, pos: { heroi: { x: 2, y: 5 }, ini: [{ x: 8, y: 5 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 8, y: 4 }] } });
  while (T.ativo(B) !== B.h) T.avancar(B, []);
  B.h.slots = [4, 3, 3, 3, 2, 0, 0, 0, 0]; const ev = T.agir(B, { id: 'magia', magia: 'bola_fogo', nv: 3, x: 8, y: 5 });
  console.log('bola de fogo:', ev.filter((e) => e.t === 'dano').map((e) => e.id + ':' + e.n).join(' '), 'tiles', ev.find((e) => e.t === 'aoe').tiles.length);
  const opc = T.opcoesConversa(B, B.un.find((u) => u.id === 'm2')); console.log('opções conversa bandido (não racional marcado):', opc.map((o) => o.id));
  if (falhas) process.exitCode = 1;
}

if (modo === 'balanco') {
  const n = +process.argv[3] || 2; const seeds = +process.argv[4] || 30;
  console.log(`Grupos de ${n} (monstros comuns do capítulo)`);
  for (const cap of CAPITULOS) { const L = cap.n; const ids = R.poolDoCapitulo(cap); const linha = [];
    for (const c of CLASSES) { const r = lutarT(c, L, ids, n, seeds, null, { esc: cap.comuns[0], dm: cap.comuns[1], aj: R.AJUSTE_CLASSE[c] }); linha.push(`${c.slice(0, 3)} ${(r.win * 100).toFixed(0)}%/${(r.hp * 100).toFixed(0)}`); }
    console.log(String(L).padStart(2), linha.join(' | ')); }
}
if (modo === 'boss') {
  const seeds = +process.argv[3] || 30; const mult = +process.argv[4] || 1;
  console.log('Chefes (vit%/PV perdido%)');
  for (const cap of CAPITULOS) { const L = cap.n; const linha = [];
    for (const c of CLASSES) { const b = criaBoss(cap); b.opts.ov.dm = (b.opts.ov.dm || 1) * (R.AJUSTE_CLASSE[c] ?? 1) * mult; const r = lutarT(c, L, [], 1, seeds, b); linha.push(`${c.slice(0, 3)} ${(r.win * 100).toFixed(0)}%/${(r.hp * 100).toFixed(0)}`); }
    console.log(String(L).padStart(2), cap.boss.nome.slice(0, 20).padEnd(20), linha.join(' | ')); }
}
void MONSTROS; void MAGIAS;
