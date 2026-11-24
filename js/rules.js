// Regras puras: XP, níveis, ranks por PR, atributos, nutrição, missões, loot. Sem DOM.
import { CLASSES, ITENS, MONSTROS, ATRIBUTOS, rolar, d20, recursosMax } from './srd.js';
import { LIFTS, TIERS, MISSOES, EVENTOS, GRUPOS_TREINO, RARIDADES } from './conteudo.js';
import { CAPITULOS } from './story.js';

// ---------- RNG ----------
export function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const rngDe = (str) => mulberry32(hashStr(String(str)));
export const escolhe = (rng, arr) => arr[Math.floor(rng() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- XP e níveis ----------
export const NIVEL_MAX = 20;
export function xpParaNivel(L) { if (L <= 1) return 0; return Math.round(55 * Math.pow(L - 1, 2.35) / 10) * 10; }
export function nivelPorXp(xp) { let L = 1; while (L < NIVEL_MAX && xp >= xpParaNivel(L + 1)) L++; return L; }
export function progressoNivel(xp) {
  const L = nivelPorXp(xp);
  if (L >= NIVEL_MAX) { const extra = xp - xpParaNivel(NIVEL_MAX); const rank = Math.floor(extra / 3000); return { L, rank, atual: extra % 3000, falta: 3000, pct: (extra % 3000) / 3000, lendario: true }; }
  const a = xpParaNivel(L), b = xpParaNivel(L + 1);
  return { L, atual: xp - a, falta: b - a, pct: (xp - a) / (b - a), lendario: false };
}
export const bonusProf = (L) => 2 + Math.floor((L - 1) / 4);
export const modAtr = (v) => Math.floor((v - 10) / 2);

// ---------- Força: e1RM e ranks ----------
export function e1rm(carga, reps) { if (reps <= 1) return carga; return carga * (1 + Math.min(reps, 12) / 30); }
export function cargaEfetiva(liftId, carga, peso) { return liftId === 'barra_fixa' ? (peso || 70) + carga : carga; }
export function limiares(liftId, sexo, peso) {
  const L = LIFTS[liftId]; const bw = peso || 70;
  const arr = sexo === 'F' ? L.F : sexo === 'N' ? L.M.map((x, i) => (x + L.F[i]) / 2) : L.M;
  return arr.map((x) => x * bw);
}
export function infoTier(liftId, e1, sexo, peso) {
  const thr = limiares(liftId, sexo, peso);
  let tier = 0; while (tier < thr.length && e1 >= thr[tier]) tier++;
  const lo = tier === 0 ? 0 : thr[tier - 1], hi = tier >= thr.length ? lo : thr[tier];
  const cont = tier >= thr.length ? thr.length : tier + (hi > lo ? (e1 - lo) / (hi - lo) : 0);
  return { tier, nome: TIERS[tier], cont, p: cont / 9, prox: tier >= thr.length ? null : thr[tier], proxNome: TIERS[tier + 1] || null, thr, e1 };
}
export function melhorDoGrupo(s, grupoId) {
  const g = GRUPOS_TREINO.find((x) => x.id === grupoId); let best = null;
  for (const v of g.variantes) { const t = s.treino[v]; if (t && t.best && t.best.e1 > 0) { const inf = infoTier(v, t.best.e1, s.heroi.sexo, s.heroi.peso); if (!best || inf.cont > best.inf.cont) best = { id: v, inf, t }; } }
  return best;
}
export function tiersPorGrupo(s) { const out = {}; for (const g of GRUPOS_TREINO) { const b = melhorDoGrupo(s, g.id); if (b) out[g.id] = b.inf.tier; } return out; }
const pGrupo = (s, id) => { const b = melhorDoGrupo(s, id); return b ? b.inf.p : 0; };

// ---------- Atributos (vêm da vida real) ----------
export function progressosAtributo(s) {
  const cardio = 1 - Math.exp(-(s.stats.cardioMin || 0) / 6000);
  return {
    FOR: (pGrupo(s, 'supino') + pGrupo(s, 'terra')) / 2,
    DES: (pGrupo(s, 'barra') + pGrupo(s, 'remada')) / 2,
    CON: (pGrupo(s, 'agachamento') + cardio) / 2,
    INT: 1 - Math.exp(-((s.stats.estudoMin || 0) / 60) / 250),
    SAB: 1 - Math.exp(-(s.stats.diasAtivos || 0) / 120),
    CAR: pGrupo(s, 'ombros'),
  };
}
export function atributos(s) {
  const cls = CLASSES[s.heroi.cls]; const pr = progressosAtributo(s); const out = {};
  for (const a of ATRIBUTOS) out[a] = clamp(9 + Math.round(12 * pr[a]) + (cls.prim === a ? 4 : 0) + (cls.sec === a ? 2 : 0), 8, 20);
  for (const slot of ['ac1', 'ac2']) { const it = ITENS[s.equip[slot]]; if (it && it.minAtr) for (const [a, v] of Object.entries(it.minAtr)) out[a] = Math.max(out[a], v); }
  if (s.heroi.cls === 'barbaro' && s.heroi.nivel >= 20) { out.FOR = Math.min(24, out.FOR + 4); out.CON = Math.min(24, out.CON + 4); }
  return out;
}

// ---------- Estatísticas derivadas do herói ----------
export function derivar(s) {
  const h = s.heroi, cls = CLASSES[h.cls], L = h.nivel;
  const A = atributos(s), M = {}; for (const a of ATRIBUTOS) M[a] = modAtr(A[a]);
  const prof = bonusProf(L);
  let hpMax = cls.dado + (L - 1) * (cls.dado / 2 + 1) + L * M.CON + 4 + 2 * L + Math.floor((s.stats.paragon || 0));
  hpMax = Math.max(L + 2, Math.round(hpMax));
  if (h.exaustao >= 4) hpMax = Math.max(1, Math.floor(hpMax / 2));
  const armadura = ITENS[s.equip.armadura] || null, escudo = ITENS[s.equip.escudo] || null;
  const arma = ITENS[s.equip.arma] || ITENS.cajado;
  let ca;
  if (armadura) ca = armadura.base + (armadura.dexMax === 0 ? 0 : Math.min(M.DES, armadura.dexMax)) + armadura.mag;
  else if (h.cls === 'barbaro') ca = 10 + M.DES + M.CON;
  else if (h.cls === 'mago') ca = 13 + M.DES; // Armadura Arcana permanente
  else ca = 10 + M.DES;
  if (escudo) ca += escudo.ca;
  for (const slot of ['ac1', 'ac2']) { const it = ITENS[s.equip[slot]]; if (it && it.ca && (!it.semArmadura || !armadura)) ca += it.ca; }
  if (h.cls === 'guerreiro' && armadura) ca += 1; // estilo de luta: Defesa
  let ini = M.DES; for (const slot of ['ac1', 'ac2']) { const it = ITENS[s.equip[slot]]; if (it && it.ini) ini += it.ini; }
  const atrArma = arma.dist ? M.DES : arma.acu ? Math.max(M.FOR, M.DES) : M.FOR;
  const conj = cls.conj; const modConj = conj ? M[conj] : 0;
  let bonusMagia = 0; if (arma.bonusMagia) bonusMagia = arma.bonusMagia;
  let ataques = 1;
  if (h.cls === 'guerreiro') ataques = L >= 20 ? 4 : L >= 11 ? 3 : L >= 5 ? 2 : 1;
  else if (h.cls === 'barbaro' || h.cls === 'paladino') ataques = L >= 5 ? 2 : 1;
  const critMin = h.cls === 'guerreiro' ? (L >= 15 ? 18 : L >= 3 ? 19 : 20) : 20;
  let regen = 0; for (const slot of ['ac1', 'ac2']) { const it = ITENS[s.equip[slot]]; if (it && it.regen) regen += it.regen; }
  return {
    L, prof, A, M, hpMax, ca, ini, arma, armadura, escudo, atrArma, modAtq: prof + atrArma + arma.mag, modDano: atrArma + arma.mag,
    cd: 8 + prof + modConj + bonusMagia, atqMagia: prof + modConj + bonusMagia, modConj, conj, ataques, critMin, regen,
    resFogo: !!(armadura && armadura.resFogo), cls,
  };
}

// ---------- Nutrição ----------
export const FAIXAS = {
  sem_registro: { nome: 'Sem registro', cor: '#8a8a96', f: 0.75, exaust: 0, desc: 'Nenhuma refeição anotada. Descanso comum, sem bônus.' },
  banquete: { nome: 'Banquete de Herói', cor: '#6fcf7f', f: 1, exaust: -1, desc: 'Dentro da meta. Recursos 100%, Inspiração, −1 Exaustão e +1 Tocha.' },
  razoavel: { nome: 'Refeição Razoável', cor: '#e6d35a', f: 0.75, exaust: 0, desc: 'Perto da meta. Recursos 75%.' },
  fome: { nome: 'Fome', cor: '#ff9f40', f: 0.5, exaust: 1, desc: 'Comeu de menos. Recursos 50% e +1 Exaustão.' },
  jejum: { nome: 'Jejum Perigoso', cor: '#ff5c6c', f: 0.25, exaust: 2, desc: 'Muito abaixo da meta. Recursos 25% e +2 Exaustão.' },
  empanzinado: { nome: 'Empanzinado', cor: '#ff9f40', f: 0.5, exaust: 0, sono: true, desc: 'Comeu demais. Recursos 50% e Sonolência (−2 iniciativa).' },
  glutonaria: { nome: 'Glutonaria', cor: '#ff5c6c', f: 0.25, exaust: 0, sono: true, desc: 'Excesso grande. Recursos 25% e Sonolência (−2 iniciativa).' },
};
export function faixaNutricao(kcal, alvo, entradas, tolera = 0) {
  if (!entradas) return { id: 'sem_registro', q: 0, ...FAIXAS.sem_registro };
  const q = kcal / alvo; let id;
  if (Math.abs(q - 1) <= 0.10 + tolera) id = 'banquete';
  else if (q < 0.6) id = 'jejum'; else if (q < 0.8) id = 'fome'; else if (q < 1) id = 'razoavel';
  else if (q <= 1.2) id = 'razoavel'; else if (q <= 1.4) id = 'empanzinado'; else id = 'glutonaria';
  return { id, q, ...FAIXAS[id] };
}
// Mifflin-St Jeor
export function tmb(sexo, peso, altura, idade) { const base = 10 * peso + 6.25 * altura - 5 * idade; return Math.round(sexo === 'F' ? base - 161 : sexo === 'N' ? base - 78 : base + 5); }
export const FATORES_ATIV = [['Sedentário', 1.2], ['Leve (1–3 treinos/sem)', 1.375], ['Moderado (3–5 treinos/sem)', 1.55], ['Alto (6–7 treinos/sem)', 1.725], ['Muito alto', 1.9]];

// ---------- Datas ----------
export function dataStr(d = new Date()) { const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }
export function addDias(str, n) { const [y, m, d] = str.split('-').map(Number); const dt = new Date(y, m - 1, d + n); return dataStr(dt); }
export function difDias(a, b) { const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number); return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000); }
export const diaSemana = (str) => { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d).getDay(); };

// ---------- Missões e eventos do dia ----------
export function gerarMissoes(s, data) {
  const rng = rngDe(data + ':m:' + s.criado); const L = s.heroi.nivel; const nomes = {}; for (const g of GRUPOS_TREINO) nomes[g.id] = g.nome;
  const descanso = (s.cfg.descanso || []).includes(diaSemana(data));
  const pickPilar = (pilar) => {
    let pool = MISSOES.filter((m) => m.pilar === pilar && !(m.needHab && !(s.habitos || []).length));
    const raras = pool.filter((m) => m.raro && Object.keys(s.treino).length); pool = pool.filter((m) => !m.raro);
    let m = (raras.length && rng() < 0.12 && !descanso) ? raras[0] : escolhe(rng, pool);
    const v = m.vals[Math.floor(rng() * m.vals.length)];
    let alvo = m.alvo || v, arg = null, txt;
    if (m.id === 'lift') { arg = v; txt = m.txt(v, s, nomes); } else txt = m.txt(v);
    if (descanso && pilar === 'corpo') { return { id: 'descanso', pilar, txt: 'Dia de descanso: caminhe 15 min ou alongue (opcional)', alvo: 15, arg: null, xp: 40, ouro: 6, prog: 0, feito: false, fim: false, tipoProg: 'cardio' }; }
    const mult = 1 + Math.min(0.5, (L - 1) * 0.02);
    return { id: m.id, pilar, txt, alvo, arg, xp: Math.round(m.xp(v) * mult), ouro: Math.round(m.ouro(v) * mult), prog: 0, feito: false, fim: !!m.fim };
  };
  return ['corpo', 'mente', 'alma'].map(pickPilar);
}
export function progMissao(q, s, D, ctx) {
  if (q.id === 'descanso') return D.cardio;
  const m = MISSOES.find((x) => x.id === q.id); return m ? m.prog(s, D, q, ctx) : 0;
}
export function gerarEvento(s, data) {
  const rng = rngDe(data + ':e:' + s.criado); if (rng() > 0.78) return null;
  const e = escolhe(rng, EVENTOS); return { id: e.id, feito: false, escolha: null, resultado: null };
}
export const eventoDef = (id) => EVENTOS.find((e) => e.id === id);

// ---------- Loot ----------
export function raridadePorRolagem(total) { return total >= 20 ? 4 : total >= 18 ? 3 : total >= 14 ? 2 : total >= 9 ? 1 : 0; }
export function itensPorRaridade(rar, nivel, tipos) {
  return Object.values(ITENS).filter((i) => i.preco > 0 && RARIDADES.indexOf(i.raro) === rar && i.nvLoja <= nivel + 3 && (!tipos || tipos.includes(i.tipo)));
}
// Fator de dano dos chefes por classe (calibrado por tools/tuneclasse.mjs para ~62% de vitória média em todas).
export const AJUSTE_CLASSE = { guerreiro: 1.05, barbaro: 1.07, ladino: 0.85, mago: 0.4, clerigo: 1.2, paladino: 1.52 };
// Itens que podem cair de baús: os da loja (até nível+3) e, mais tarde, relíquias que não são vendidas.
export function itensDeBau(rar, nivel) {
  return Object.values(ITENS).filter((i) => RARIDADES.indexOf(i.raro) === rar && ((i.preco > 0 && i.nvLoja <= nivel + 3) || (i.preco <= 0 && i.nvLoja >= 99 && nivel >= (rar >= 4 ? 12 : 6))));
}
const possuiItem = (s, id) => (s.inv || []).some((x) => x.id === id) || Object.values(s.equip || {}).includes(id);
// Sorteia um item pela raridade; se a faixa tiver poucas opções, mistura com a de baixo (e evita repetir relíquias que já são suas).
export function sortearItemBau(s, rng, rar, nivel) {
  for (let r = rar; r >= 0; r--) {
    let p = itensDeBau(r, nivel); if (!p.length) continue;
    const novos = p.filter((i) => i.tipo === 'consumivel' || !possuiItem(s, i.id)); if (novos.length) p = novos;
    if (p.length < 4 && r > 0) p = p.concat(itensDeBau(r - 1, nivel));
    return escolhe(rng, p);
  }
  return null;
}
export function rolarBau(s, rng, { forca = 0, bonus = 0, origem = 'bau' } = {}) {
  const L = s.heroi.nivel; const dado = d20(rng);
  const seq = Math.min(5, Math.floor((s.sequencia.atual || 0) / 4));
  const total = dado + forca + bonus + seq;
  let rar = raridadePorRolagem(total); if (dado === 1 && rar > 0) rar = Math.max(0, rar - 1);
  if (dado === 20) rar = 4;
  const ouroBase = Math.round((6 + L * 4) * (1 + rar * 1.1) * (0.7 + rng() * 0.6));
  const itens = [];
  if (rar >= 1 || rng() < 0.35) { const it = sortearItemBau(s, rng, rar, L); if (it) itens.push(it.id); }
  if (rar >= 3) { let pot = itensPorRaridade(Math.min(3, rar - 1), L, ['consumivel']); if (!pot.length) pot = itensPorRaridade(1, L, ['consumivel']); if (pot.length) itens.push(escolhe(rng, pot).id); }
  const tocha = (rar >= 2 && rng() < 0.2 + rar * 0.1) ? 1 : 0;
  return { d20: dado, forca, bonus: bonus + seq, total, rar, rarNome: RARIDADES[rar], ouro: ouroBase, itens, tocha, origem };
}

// ---------- Loja ----------
export function estoqueLoja(s, loja, data) {
  const L = s.heroi.nivel; const rng = rngDe(`${data}:${loja}:${s.criado}`);
  const tipos = { ferreiro: ['arma', 'armadura', 'escudo'], alquimista: ['consumivel'], mercador: ['acessorio', 'arma', 'armadura', 'escudo', 'consumivel'] }[loja];
  let pool = Object.values(ITENS).filter((i) => i.preco > 0 && tipos.includes(i.tipo) && i.nvLoja <= L + (loja === 'mercador' ? 4 : 1) && i.nvLoja >= (loja === 'mercador' ? Math.max(1, L - 8) : 1));
  if (loja === 'ferreiro') { pool = pool.filter((i) => i.mag === 0 || i.nvLoja <= L); }
  if (loja === 'alquimista') return pool.map((i) => i.id);
  const n = loja === 'mercador' ? 8 : 12; const ids = pool.map((i) => i.id); const out = [];
  while (out.length < Math.min(n, ids.length)) { const id = escolhe(rng, ids); if (!out.includes(id)) out.push(id); }
  return out;
}
export function precoItem(id, s, modLoja = 1) {
  const i = ITENS[id]; const moral = s.historia.moral; const d = moral >= 70 ? 0.9 : moral >= 40 ? 1 : moral >= 20 ? 1.1 : 1.25;
  return Math.max(1, Math.round(i.preco * d * modLoja));
}

// ---------- Monstros e masmorras ----------
export function criarMonstro(id, { chefe = false, ov = null, nome = null, esc = 1, inercia = 0, ciclo = 1 } = {}) {
  const b = JSON.parse(JSON.stringify(MONSTROS[id]));
  if (ov) Object.assign(b, ov);
  const f = 1 + 0.12 * (ciclo - 1) + (inercia >= 10 ? 0.25 : inercia >= 7 ? 0.1 : 0);
  const hp = Math.round(b.hp * esc * f);
  return { ...b, id, n: nome || b.n, hp, hpMax: hp, dm: (ov && ov.dm) || b.dm || 1, chefe: chefe || !!b.chefe, conds: {}, sopro: true, rodada: 0 };
}
export function poolDoCapitulo(cap) {
  const L = cap.n, hi = L * 0.62 + 0.4, lo = L * 0.2; let p = cap.pool.filter((id) => MONSTROS[id].cr <= hi && MONSTROS[id].cr >= lo);
  if (!p.length) p = cap.pool.filter((id) => MONSTROS[id].cr <= hi); if (!p.length) p = [cap.pool.slice().sort((a, b) => MONSTROS[a].cr - MONSTROS[b].cr)[0]];
  return p;
}
export function poolCatacumbas(L, andar) {
  const E = clamp(L + Math.floor(andar / 4), 1, 24); const lo = E * 0.2, hi = E * 0.62 + 0.4;
  let pool = Object.values(MONSTROS).filter((m) => !m.chefe && m.cr >= lo && m.cr <= hi && m.cr <= 17);
  if (!pool.length) pool = [MONSTROS.rato];
  return pool.map((m) => m.id);
}
// Escala dos monstros comuns por nível (PV, dano) — calibrada por simulação (tools/tune.mjs)
export const ESCALA_N = [[1, .45], [.8, .42], [.6, .45], [.8, .55], [1, .85], [1, .85], [1, .95], [1, 1.3], [1, 1.7], [1.05, 2], [1.2, 2.2], [1.4, 2.2], [1.7, 2.2], [1.9, 2.2], [2.2, 2.2], [1.8, 2.2], [2, 2.2], [2.05, 2.2], [2.2, 2.2], [2.5, 2.2]];
export const escalaNivel = (L) => ESCALA_N[clamp(Math.round(L), 1, 20) - 1];
export function ouroDoMonstro(m, rng) { const base = m.cr < 1 ? 4 : m.cr * 9; return Math.round(base * (0.6 + rng() * 0.9) * (m.chefe ? 4 : 1)); }

// Capítulo atual útil
export const capitulo = (n) => CAPITULOS[n - 1];
export function capituloAtivo(s) {
  const lim = Math.min(s.heroi.nivel, CAPITULOS.length);
  for (let i = 1; i <= lim; i++) if (!s.historia.limpos.includes(i)) return i;
  return null;
}
