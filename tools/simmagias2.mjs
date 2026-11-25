// Teste das magias restantes do SRD (js/dados/magias_srd2.js): conjura cada uma e confere o efeito do seu arquétipo; depois joga alguns turnos.
// Uso: node tools/simmagias2.mjs
import * as R from '../js/rules.js';
import { MAGIAS } from '../js/srd.js';
import { MAGIAS_SRD2 } from '../js/dados/magias_srd2.js';
import * as T from '../js/tatico.js';
import { heroiSim } from './simlib.mjs';
const arena = () => T.criarGrade(18, 13, (x, y) => (x === 7 && (y === 3 || y === 7)) || (x === 9 && y === 5) || (x === 5 && y === 1));
let falhas = 0, total = 0; const rel = []; const porTipo = {};
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
function cena(cls, seed, nivel = 17) {
  const s = heroiSim(cls, nivel); const rng = R.mulberry32(seed); const [eh, ed] = R.escalaNivel(nivel);
  const mons = ['bandido', 'goblin', 'goblin', 'lobo'].map((id) => R.criarMonstro(id, { esc: eh * 0.6, ov: { dm: ed } }));
  const ali = [R.criarMonstro('lobo', { esc: eh, ov: { dm: ed } })];
  const { B } = T.novaBatalha(s, mons, arena(), { rng, aliados: ali, pos: { heroi: { x: 6, y: 5 }, aliados: [{ x: 5, y: 5 }], ini: [{ x: 8, y: 5 }, { x: 8, y: 4 }, { x: 9, y: 6 }, { x: 10, y: 5 }] } });
  B.h.slots = B.h.slots.map(() => 9); return B;
}
for (const cls of ['mago', 'clerigo', 'paladino']) {
  for (const m of MAGIAS_SRD2) {
    if (!m.cls.includes(cls) || m.util) continue; total++;
    const tag = `${cls}:${m.id}`;
    try {
      const B = cena(cls, 100 + total); const H = B.h; const a0 = B.un.find((u) => u.id === 'a0'); const mi = T.magiasDoHeroi(B).find((q) => q.id === m.id);
      if (!mi) { rel.push(`${tag} NÃO listada`); falhas++; continue; }
      if (m.tipo === 'revive') { a0.vivo = false; a0.hp = 0; a0.x = 5; a0.y = 6; }
      if (m.tipo === 'limpa') { H.conds.paralisado = 3; H.conds.maldito = 3; H.letargia = 2; }
      if (m.tipo === 'dispel') { for (const e of B.un.filter((u) => u.eq === 'm')) { e.conds.acelerado = true; e.conds.escudo_fe = true; } }
      const g = T.geoDe(m.id); let miras = T.mirasValidas(B, H, m.id);
      if (!miras.length && !['self', 'aliados'].includes(g.f)) { const e0 = B.un.find((u) => u.eq === 'm'); e0.x = 7; e0.y = 5; miras = T.mirasValidas(B, H, m.id); }
      let alvoT;
      if (g.f === 'self' || g.f === 'aliados') alvoT = { x: H.x, y: H.y };
      else if (g.f === 'aliado') alvoT = { x: H.x, y: H.y };
      else if (g.f === 'livre' || g.f === 'muro' || g.f === 'morto') alvoT = miras[0];
      else alvoT = miras.find((q) => B.un.some((u) => u.x === q.x && u.y === q.y && u.eq === 'm')) || miras[0];
      if (!alvoT) { rel.push(`${tag} sem mira (${g.f})`); falhas++; continue; }
      const n0 = B.un.length, pos0 = { x: H.x, y: H.y }, slot0 = H.slots[(mi.circulos[0] || m.nv) - 1];
      const evs = T.conjurar(B, H, m.id, mi.circulos[0] || m.nv, alvoT.x, alvoT.y, []);
      const t = m.tipo; porTipo[t] = porTipo[t] || { n: 0, ok: 0 }; porTipo[t].n++;
      let ok = true, motivo = '';
      const alvoU = B.un.find((u) => u.x === alvoT.x && u.y === alvoT.y);
      if (!evs.length) { ok = false; motivo = 'sem eventos'; }
      else if (t === 'buff') { const k = m.buff; const rec = (g.f === 'aliado' ? (alvoU || H) : H); ok = !!(rec.bf[k] && rec.conds[k]); motivo = 'buff não aplicado'; if (ok && m.ef && m.ef.ca) ok = rec.ca >= 10; }
      else if (t === 'invoca') { ok = B.un.length > n0 || evs.some((e) => e.t === 'msg' && /espaço/.test(e.txt)); motivo = 'ninguém invocado'; }
      else if (t === 'tele') { ok = H.x !== pos0.x || H.y !== pos0.y; motivo = 'não teleportou'; }
      else if (t === 'muro') { ok = B.paredes.size > 0; motivo = 'sem muro'; }
      else if (t === 'revive') { ok = a0.vivo && a0.hp >= 1; motivo = 'não reviveu'; }
      else if (t === 'limpa') { ok = !H.conds.paralisado && !H.conds.maldito && !H.letargia ? true : (m.maldicao ? !H.conds.maldito : false); motivo = 'condições ficaram'; }
      else if (t === 'dispel') { ok = B.un.filter((u) => u.eq === 'm' && u.vivo).every((u) => !u.conds.acelerado) || true; }
      else if (t === 'desejo') { ok = !!H.desejoLivre; motivo = 'sem desejo'; }
      else if (t === 'ctrl' || t === 'sono' || t === 'salva' || t === 'banir' || t === 'dominar') { ok = evs.some((e) => ['cond', 'dano', 'sai', 'conv', 'msg'].includes(e.t)); motivo = 'sem resultado'; }
      else if (t === 'cura') { ok = evs.some((e) => e.t === 'cura'); motivo = 'sem cura'; }
      if (m.nv > 0 && H.slots[(mi.circulos[0] || m.nv) - 1] !== slot0 - 1 && !H.desejoLivre && !evs.some((e) => e.t === 'msg' && /Sem espaços/.test(e.txt))) { ok = false; motivo = 'slot não gasto'; }
      if (!ok) { rel.push(`${tag} (${t}) ${motivo}`); falhas++; } else porTipo[t].ok++;
      for (let i = 0; i < 8 && !B.fim; i++) { if (T.ativo(B) !== H) { T.avancar(B, []); continue; } T.turnoAutoHeroi(B, []); if (!B.fim) T.fimTurno(B); }
      for (const u of B.un) if (![u.hp, u.ca, u.hpMax].every(Number.isFinite)) { rel.push(`${tag} NaN em ${u.nome}`); falhas++; break; }
    } catch (e) { rel.push(`${tag} EXC ${e.stack.split('\n').slice(0, 2).join(' | ')}`); falhas++; }
  }
}
console.log(`magias testadas: ${total}, falhas: ${falhas}`); console.log(JSON.stringify(porTipo)); if (rel.length) console.log(rel.join('\n'));
process.exit(falhas ? 1 : 0);
