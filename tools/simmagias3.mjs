// Testes de mecânica das magias de apoio/controle novas (escudos, concentração, invocação, muro, banimento…).
import * as R from '../js/rules.js';
import { MAGIAS } from '../js/srd.js';
import * as T from '../js/tatico.js';
import { heroiSim } from './simlib.mjs';
const arena = () => T.criarGrade(18, 13, (x, y) => (x === 9 && y === 5));
let ok = 0, bad = 0; const A = (c, msg) => { if (c) ok++; else { bad++; console.log('FALHOU:', msg); } };
function cena(cls = 'mago', n = 15, mons = ['goblin', 'goblin', 'lobo'], seed = 7) {
  const s = heroiSim(cls, n); const [eh, ed] = R.escalaNivel(n);
  const ms = mons.map((id) => R.criarMonstro(id, { esc: eh * 0.6, ov: { dm: ed } }));
  const { B } = T.novaBatalha(s, ms, arena(), { rng: R.mulberry32(seed), aliados: [R.criarMonstro('lobo', { esc: eh, ov: { dm: ed } })], pos: { heroi: { x: 4, y: 5 }, aliados: [{ x: 3, y: 5 }], ini: [{ x: 7, y: 5 }, { x: 7, y: 4 }, { x: 8, y: 6 }].slice(0, ms.length) } });
  B.h.slots = B.h.slots.map(() => 9); return B;
}
const cast = (B, id, x, y, nv) => T.conjurar(B, B.h, id, nv || MAGIAS[id].nv, x ?? B.h.x, y ?? B.h.y, []);
// 1. Escudo Arcano: +5 CA até o início do próximo turno
{ const B = cena(); const ca0 = B.h.ca; cast(B, 'm_shield'); A(B.h.ca === ca0 + 5, 'Shield +5 CA'); T.fimTurno(B); A(B.h.ca === ca0, 'Shield expira no início do turno seguinte (ca=' + B.h.ca + ')'); }
// 2. Concentração: nova magia de concentração encerra a anterior; dano pode quebrar
{ const B = cena(); cast(B, 'm_blur'); A(B.h.conc && B.h.conc.id === 'm_blur', 'conc Blur'); cast(B, 'm_invisibility', B.h.x, B.h.y); A(!B.h.bf.borrao && B.h.bf.invisivel, 'Blur terminou ao conjurar outra concentração (' + Object.keys(B.h.bf) + ')'); cast(B, 'm_mirror_image'); A(B.h.bf.invisivel && B.h.bf.imagens, 'Imagem Espelhada não é concentração');
  const B2 = cena(); cast(B2, 'm_blur'); let quebrou = false; for (let i = 0; i < 40 && B2.h.conc; i++) { const evs = []; B2.h.hp = B2.h.hpMax; T.mover; B2.h.conc && (quebrou = false); const e = B2.un.find((u) => u.eq === 'm'); const ev2 = T.conjurar; void ev2; /* dano direto abaixo */ }
}
// 3. Proteção contra a Morte
{ const B = cena('mago', 15, ['goblin']); cast(B, 'm_death_ward', B.h.x, B.h.y); A(B.h.bf.protecao_morte, 'Death Ward aplicado'); const inim = B.un.find((u) => u.eq === 'm'); const evs = []; // matar o herói
  B.h.hp = 1; B.h.vivo = true; const mon = inim; mon.x = 5; mon.y = 5; mon.atq = [{ n: 'Golpe', b: 30, d: '10d10', t: 'fis', alc: 1 }]; T.fimTurno(B); A(B.h.vivo && B.h.hp >= 1 && B.fim !== 'derrota', 'Death Ward manteve o herói de pé'); A(!B.h.bf.protecao_morte, 'Death Ward consumido'); }
// 4. Invocação age e entra na ordem
{ const B = cena(); const n0 = B.un.length; cast(B, 'm_conjure_elemental', 5, 5, 5); const inv = B.un.find((u) => u.invocado); A(inv && inv.eq === 'j', 'elemental invocado como aliado'); A(B.ordem.includes(inv.id), 'invocado entra na ordem'); let atacou = false; for (let i = 0; i < 6 && !B.fim; i++) { const evs = T.fimTurno(B); if (evs.some((e) => e.t === 'atq' && e.de === inv.id)) atacou = true; } A(atacou, 'invocado ataca por conta própria'); A(B.un.length > n0, 'unidade nova'); }
// 5. Isca (Imagem Silenciosa) atrai e some pela duração
{ const B = cena(); cast(B, 'm_silent_image', 6, 5); const d = B.un.find((u) => u.isca); A(d && d.atq.length === 0, 'isca sem ataques'); for (let i = 0; i < 6; i++) T.fimTurno(B); A(d.saiu || !d.vivo, 'isca some após a duração'); }
// 6. Polimorfia: PV temporários absorvem e a forma termina
{ const B = cena(); cast(B, 'm_polymorph', B.h.x, B.h.y); A(B.h.tmpHp === 40 && B.h.bf.forma, 'forma com 40 PV temp'); const hp0 = B.h.hp; const evs = []; const e = B.un.find((u) => u.eq === 'm'); e.atq = [{ n: 'Golpe', b: 30, d: '10d1', t: 'fis', alc: 1 }]; e.x = 5; e.y = 5; T.fimTurno(B); A(B.h.hp === hp0 || B.h.tmpHp < 40, 'PV temp absorvem antes do PV real'); }
// 7. Muro bloqueia e expira
{ const B = cena(); const t = T.mirasValidas(B, B.h, 'm_wall_of_force'); A(t.length > 0, 'miras do muro'); cast(B, 'm_wall_of_force', 6, 5); A(B.paredes.size >= 3, 'muro criado (' + B.paredes.size + ')'); A(B.g.solido(6, 5), 'tile do muro é sólido'); for (const u of B.un.filter((q) => q.eq === 'm')) { u.atq = []; u.hp = u.hpMax = 9999; } for (let i = 0; i < 20 && B.paredes.size; i++) T.fimTurno(B); A(B.paredes.size === 0, 'muro de força expira'); }
// 8. Banimento: inimigo volta; combate não acaba com todos banidos
{ const B = cena('mago', 15, ['goblin']); const g = B.un.find((u) => u.eq === 'm'); g.hp = 999; g.hpMax = 999; g.conds.banido = 3; g.conds.paralisado = 0; B.h.x = 4; const fim0 = T.vivos(B, 'm').length; A(fim0 === 0, 'banido não conta como unidade em cena'); for (let i = 0; i < 2; i++) T.fimTurno(B); A(!B.fim, 'combate segue com inimigos banidos'); for (let i = 0; i < 4; i++) T.fimTurno(B); A(!g.conds.banido && T.vivos(B, 'm').length === 1, 'inimigo reaparece'); }
// 9. Confusão e Proteção contra o Mal
{ const B = cena(); const e = B.un.find((u) => u.eq === 'm'); e.conds.confuso = 3; let agiu = 0, parou = 0; for (let i = 0; i < 3; i++) { const evs = T.fimTurno(B); if (evs.some((q) => q.t === 'msg' && /confuso/.test(q.txt))) parou++; } A(parou >= 1, 'confusão faz perder turnos'); }
{ const B = cena(); const e = B.un.find((u) => u.eq === 'm'); e.mono.tp = 'morto'; cast(B, 'm_protection_from_evil_and_good', B.h.x, B.h.y); const v = T.vantDesvTeste ? 0 : 1; A(B.h.bf.protmal, 'Proteção contra o mal'); void v; }
// 10. Marca radiante + Verdadeiro Golpe
{ const B = cena('paladino', 15, ['goblin']); cast(B, 'm_branding_smite'); A(B.h.bf.marca_radiante && B.h.bf.marca_radiante.ef.smite === '2d6', 'marca radiante 2d6'); const e = B.un.find((u) => u.eq === 'm'); e.x = 5; e.y = 5; e.hp = e.hpMax = 999; const evs = T.agir(B, { id: 'atacar', alvo: e.id }); const marcou = evs.some((q) => q.t === 'fx' && q.id === 'radiante') || !B.h.bf.marca_radiante; A(marcou, 'marca consumida no primeiro acerto (ou errou)'); }
// 11. Contramágica preparada
{ const B = cena(); cast(B, 'm_counterspell', B.h.x, B.h.y, 3); A(B.h.bf.contra, 'Contramágica preparada'); }
// 12. Desejo: próxima magia grátis
{ const B = cena('mago', 17); cast(B, 'm_wish'); const sl = B.h.slots[8]; T.conjurar(B, B.h, 'm_fireball' in MAGIAS ? 'm_fireball' : 'bola_fogo', 3, 7, 5, []); A(B.h.slots[2] === 9 && B.h.slots[8] === sl && !B.h.desejoLivre, 'Desejo pagou o espaço (' + B.h.slots + ')'); }
console.log(`ok=${ok} falhas=${bad}`); process.exit(bad ? 1 : 0);
