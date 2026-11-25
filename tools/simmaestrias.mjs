// Teste de fumaça das maestrias de arma (SRD 5.2.1): cada maestria deve disparar seu efeito em combates simulados.
import * as R from '../js/rules.js';
import * as T from '../js/tatico.js';
import { MAESTRIAS } from '../js/maestrias.js';
import { heroiSim } from './simlib.mjs';
const arena = () => T.criarGrade(16, 11, () => false);
const ARMA = { cleave: 'machadoGrande', graze: 'espadaGrande', nick: 'adaga', push: 'martelo', sap: 'espadaLonga', slow: 'arcoLongo', topple: 'machadoBatalha', vex: 'rapieira' };
let falhas = 0; const res = {};
for (const [m, arma] of Object.entries(ARMA)) {
  const cont = { n: 0, cond: 0, msg: 0, mov: 0, erro: 0 };
  for (let seed = 0; seed < 40; seed++) {
    const s = heroiSim('guerreiro', 8); s.equip.arma = arma; const rng = R.mulberry32(100 + seed);
    const [eh, ed] = R.escalaNivel(8); const mons = ['goblin', 'goblin', 'lobo', 'bandido'].map((id) => R.criarMonstro(id, { esc: eh * 3, ov: { dm: ed } }));
    const { B } = T.novaBatalha(s, mons, arena(), { rng, pos: { heroi: { x: 6, y: 5 }, ini: [{ x: 7, y: 5 }, { x: 7, y: 4 }, { x: 8, y: 5 }, { x: 8, y: 6 }] } });
    if (B.h.maest !== m) { console.log(`ERRO: ${arma} → maestria ${B.h.maest}, esperado ${m}`); falhas++; break; }
    for (let i = 0; i < 40 && !B.fim; i++) {
      if (T.ativo(B) !== B.h) { const e = T.avancar(B, []); for (const x of e) if (x.t === 'cond' || x.t === 'mov') { /* efeitos dos monstros */ } continue; }
      const alvo = T.inimigosDe(B, B.h).sort((a, b) => Math.hypot(a.x - B.h.x, a.y - B.h.y) - Math.hypot(b.x - B.h.x, b.y - B.h.y))[0]; if (!alvo) break;
      const evs = []; T.turnoAutoHeroi(B, evs); cont.n++;
      for (const x of evs) { if (x.t === 'cond' && ['sap', 'desacel', 'vex', 'caido'].includes(x.cond)) cont.cond++; if (x.t === 'mov' && x.id !== 'h') cont.mov++; if (x.t === 'msg' && x.txt.startsWith(MAESTRIAS[m].nome)) cont.msg++; }
      if (!B.fim) T.fimTurno(B);
      for (const u of B.un) if (![u.hp, u.ca, u.x, u.y].every(Number.isFinite)) { console.log('NaN', u.nome); falhas++; }
    }
  }
  res[m] = cont; const ok = (m === 'push' ? cont.mov : m === 'graze' || m === 'cleave' || m === 'nick' ? cont.msg : cont.cond + cont.msg) > 0; if (!ok) { console.log(`FALHA: ${m} nunca disparou`); falhas++; }
}
console.log(JSON.stringify(res)); console.log(falhas ? `${falhas} falhas` : 'maestrias ok'); process.exit(falhas ? 1 : 0);
