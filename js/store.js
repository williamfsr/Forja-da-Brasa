// Estado do jogo, persistência e todas as ações que transformam vida real em progresso.
import { CLASSES, ITENS, recursosMax, recursosComFator, rolar, d20 } from './srd.js';
import { LIFTS, GRUPOS_TREINO, AERO, INTENSIDADES, ESTUDO_TIPOS, CONQUISTAS, EVENTOS, MISSOES, CAPAS } from './conteudo.js';
import { CAPITULOS, ATOS, finalPorMoral } from './story.js';
import * as R from './rules.js';
import { apPadrao } from './cosmeticos.js';
import { precoVenda, COMERCIANTES, NOMES_NEG, nivelNegociacao, modCompra, caixaMax, vendaLoja } from './economia.js';
import * as Camp from './campanha.js';

export const KEY = 'forja.save.v1';
export const fila = []; // popups a exibir (recompensas, level-ups...)
const ouvintes = {};
export const bus = { on(e, f) { (ouvintes[e] ||= []).push(f); }, emit(e, d) { (ouvintes[e] || []).forEach((f) => f(d)); } };
export let S = null;
let ultimoSnap = null;
export const setEstado = (s) => { S = s; };

const hoje = () => R.dataStr();
export { hoje };

// ---------- criação e persistência ----------
export function estadoInicial({ nome = 'Herói', cls = 'guerreiro', sexo = 'M', peso = 75, altura = 175, idade = 30, kcalAlvo = 2200, ap = null } = {}) {
  const c = CLASSES[cls];
  const s = {
    v: 1, mig5: true, criado: Date.now(),
    heroi: { nome, cls, sexo, peso, altura, idade, kcalAlvo, nivel: 1, xp: 0, hp: null, ouro: 60, tochas: 3, exaustao: 0, insp: 0, sono: false, capa: 'padrao', capas: ['padrao'], paragon: 0, bonusPV: 0, bonusCura: 0, interesse: 'oposto', ap: ap || apPadrao(cls) },
    companheiros: [], npcs: {},
    recursos: { slots: [], cont: {} }, recursosMax: { slots: [], cont: {} },
    inv: [{ id: 'pocao1', n: 2 }], equip: { arma: c.inicio.arma, armadura: c.inicio.armadura, escudo: c.inicio.escudo, ac1: null, ac2: null },
    treino: {}, extras: [], habitos: [], provas: [],
    stats: { cardioMin: 0, estudoMin: 0, series: 0, prs: 0, diasAtivos: 0, perfeitos: 0, banquetes: 0, abates: 0, chefes: 0, ouroTotal: 60, triplices: 0, voltas: 0, pomos: 0, aeroTipos: {}, masmorras: 0, paragon: 0 },
    dias: {}, diario: { data: hoje(), missoes: [], evento: null, loot: 0 },
    sequencia: { atual: 0, melhor: 0, escudos: 0, ultimaAtiv: null, voltaBonus: 0 },
    historia: { cap: 1, limpos: [], flags: {}, moral: 50, inercia: 9, decisoes: {}, checkpoint: {}, ciclo: 1, prologo: false, vistos: {}, final: null },
    catacumbas: { melhor: 0 }, campanha: Camp.novoEstado(),
    conquistas: {}, cfg: { som: true, vibra: true, musica: false, descanso: [0], textoGrande: false },
    timers: {}, relatorio: null, run: null, log: [], inicio: hoje(),
    rastro: [], glos: { mon: {}, it: {}, lug: {} }, com: {},
  };
  const max = recursosMax(cls, 1); s.recursosMax = max; s.recursos = JSON.parse(JSON.stringify(max));
  s.diario.missoes = R.gerarMissoes(s, s.diario.data); s.diario.evento = R.gerarEvento(s, s.diario.data);
  return s;
}
export function novoJogo(cfg) { S = estadoInicial(cfg); semearGlos(S); const d = R.derivar(S); S.heroi.hp = d.hpMax; iniciarCampanha(true); salvar(); bus.emit('mudou'); return S; }
export function salvar() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* armazenamento cheio/bloqueado */ } }
export function carregar() {
  try { const t = localStorage.getItem(KEY); if (!t) return null; S = migrar(JSON.parse(t)); iniciarCampanha(); return S; } catch (e) { return null; }
}
function migrar(s) {
  const base = estadoInicial({ cls: s.heroi.cls });
  const merge = (a, b) => { for (const k of Object.keys(b)) { if (a[k] === undefined) a[k] = b[k]; else if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]); } return a; };
  if (!s.mig5) { if (s.npcs && s.npcs.safira && !s.npcs.ordalia) { s.npcs.ordalia = s.npcs.safira; delete s.npcs.safira; } s.mig5 = true; } // v5: a leitora de cartas virou Ordália
  merge(s, base); semearGlos(s); return s;
}
// Maré efetiva: o Selo da Aurora (Safira) silencia a Inércia por alguns dias sem mexer no valor real
export const inerciaEf = (s = S) => { const H = s && s.historia; if (!H) return 0; return H.selo && hoje() <= H.selo.ate ? 0 : H.inercia; };
export function zerar() { localStorage.removeItem(KEY); S = null; }
export function exportar() { return JSON.stringify(S); }
export function importar(txt) { const o = JSON.parse(txt); if (!o || !o.heroi || !o.stats) throw new Error('Arquivo inválido'); S = migrar(o); salvar(); bus.emit('mudou'); }
export function snapshot() { ultimoSnap = JSON.stringify(S); }
export function podeDesfazer() { return !!ultimoSnap; }
export function desfazer() { if (!ultimoSnap) return false; S = JSON.parse(ultimoSnap); ultimoSnap = null; salvar(); bus.emit('mudou'); return true; }
let avaliandoCamp = false;
const salvaEmite = () => {
  if (!avaliandoCamp && S && S.campanha) { avaliandoCamp = true; try { anunciarLote(Camp.avaliar(S, ganchosCamp)); } finally { avaliandoCamp = false; } }
  salvar(); bus.emit('mudou');
};
// ---------- campanha: ganchos e anúncios ----------
const ganchosCamp = {
  ganharOuro: (n) => ganharOuro(n), invAdd: (id, n) => invAdd(id, n),
  lerBaralho: () => Camp.lerBaralho(S, R.rngDe(`baralho:${S.criado}:${S.historia.ciclo}`)),
  recrutar: (id) => {
    const a = Camp.ALIADOS[id]; if (!a) return; const c = { mon: a.mon, nome: a.nome, ap: Object.assign(apPadrao(a.cls, a.raca), { cabelo: 3 }), frase: a.frase, tags: ['aliado'], aliadoId: id };
    S.companheiros = S.companheiros.filter((x) => x.aliadoId !== id); if (S.companheiros.length >= 2) S.companheiros.shift(); S.companheiros.push(c);
  },
};
function anunciarLote(ev) {
  const novas = ev.filter((e) => e.t === 'nova');
  if (novas.length > 2) { pop({ tipo: 'texto', titulo: `${novas.length} novas missões`, txt: novas.map((e) => '• ' + e.q.titulo).join('\n') + '\n\nVeja tudo no Diário (menu).', cor: '#ffd24a' }); ev = ev.filter((e) => e.t !== 'nova'); }
  for (const e of ev) anunciarCamp(e);
}
// Ativa as primeiras missões (jogo novo) ou as que um save antigo já pode ter; chamado ao criar e ao carregar.
export function iniciarCampanha(silencioso = false) {
  if (!S || !S.campanha || avaliandoCamp) return; avaliandoCamp = true;
  try { const ev = Camp.avaliar(S, ganchosCamp); if (!silencioso) anunciarLote(ev); else for (const e of ev) if (e.t === 'fim') { logar(`Missão concluída: ${e.q.titulo}.`); memorizar(e.q.npc, `Você concluiu "${e.q.titulo}" a pedido dele(a).`); } } finally { avaliandoCamp = false; }
  salvar();
}
function anunciarCamp(e) {
  const nome = (id) => (Camp.PERSONAGENS[id] ? Camp.PERSONAGENS[id].nome : '');
  if (e.t === 'nova' && e.q.tipo === 'principal' && !(S.rastro || []).length) rastrear(e.q.id, true);
  if (e.t === 'fim') rastrear(e.q.id, false);
  if (e.t === 'nova') pop({ tipo: 'texto', titulo: (e.q.tipo === 'principal' ? 'Missão: ' : 'Missão secundária: ') + e.q.titulo, txt: `${nome(e.q.npc)} — ${e.q.resumo}`, cor: '#ffd24a' });
  else if (e.t === 'passo') pop({ tipo: 'texto', titulo: `${e.q.titulo}: etapa cumprida`, txt: e.fala, cor: '#6fcf7f' });
  else if (e.t === 'fim') { logar(`Missão concluída: ${e.q.titulo}.`); memorizar(e.q.npc, `Você concluiu "${e.q.titulo}" a pedido dele(a).`); pop({ tipo: 'texto', titulo: 'Missão concluída!', txt: `${e.q.titulo}. Recompensas entregues.`, cor: '#ff9f40' }); }
  else if (e.t === 'lore') pop({ tipo: 'texto', titulo: `Diário de Nhor: ${e.p.t}`, txt: e.p.txt, cor: '#b49bff' });
  else if (e.t === 'leitura') pop({ tipo: 'texto', titulo: 'O Baralho do Hábito fala', txt: `Ordália vira quatro cartas.\n☀ ${Camp.RELIQUIAS.sol.carta}: ${Camp.SITIOS[e.L.sol].dica}\n✦ ${Camp.RELIQUIAS.simbolo.carta}: ${Camp.SITIOS[e.L.simbolo].dica}\n📖 ${Camp.RELIQUIAS.diario.carta}: ${Camp.SITIOS[e.L.diario].dica}\n♟ ${Camp.ALIADOS[e.L.aliado].carta}: ${Camp.ALIADOS[e.L.aliado].dica}\n(Detalhes no Diário.)`, cor: '#9ad0ff' });
  else if (e.t === 'reliquia') pop({ tipo: 'texto', titulo: `Relíquia: ${e.r.nome}`, txt: e.r.txt, cor: '#ffd24a' });
  else if (e.t === 'aliado') pop({ tipo: 'texto', titulo: `${e.a.nome} se junta a você`, txt: `"${e.a.frase}"`, cor: '#9ad0ff' });
}

// ---------- dia atual ----------
export function dia(d = hoje()) {
  return (S.dias[d] ||= { xp: 0, series: 0, liftSets: {}, grupoSets: {}, extraSets: 0, cardio: 0, estudo: 0, questoes: 0, pomos: 0, comida: [], kcal: 0, prs: 0, hab: {}, ativ: false, toch: { lift: 0, cardio: 0, estudo: 0 }, treinoFim: false, triplice: false, perfeito: false, bonus: {} });
}
export const der = () => R.derivar(S);
export function logar(txt) { S.log.unshift({ t: Date.now(), txt }); if (S.log.length > 120) S.log.length = 120; }
function pop(p) { fila.push(p); bus.emit('popup', p); }

// ---------- multiplicadores ----------
export function eventoAtual() { const e = S.diario.evento; return e ? { ...R.eventoDef(e.id), estado: e } : null; }
function modEvento(chave) { const e = eventoAtual(); if (!e || !e.mod || e.estado.feito === 'falhou') return 1; return e.mod[chave] || 1; }
export function multSequencia() { return 1 + Math.min(0.5, (S.sequencia.atual || 0) * 0.02); }
function multProva() { const hojeS = hoje(); return S.provas.some((p) => { const d = R.difDias(hojeS, p.data); return d >= 0 && d <= 14; }) ? 1.1 : 1; }
function multGeral() { return multSequencia() * (S.sequencia.voltaBonus > 0 ? 1.25 : 1) * modEvento('xp'); }

// ---------- XP e níveis ----------
// XP vem SOMENTE de treino, aeróbico, estudo, alimentação e hábitos/missões diárias. Combate, masmorras, chefes e eventos não dão XP.
const ORIGENS_SEM_XP = new Set(['chefe', 'masmorra', 'combate', 'evento', 'historia']);
export function ganharXp(base, origem, { mod = 1, semMult = false } = {}) {
  if (base <= 0 || ORIGENS_SEM_XP.has(origem)) return 0;
  const antes = S.heroi.nivel; const total = Math.round(base * mod * (semMult ? 1 : multGeral()));
  S.heroi.xp += total; dia().xp += total; bus.emit('xp', { n: total, origem });
  const novo = R.nivelPorXp(S.heroi.xp);
  if (novo > antes) subirNivel(antes, novo);
  else if (novo >= R.NIVEL_MAX) { const rank = Math.floor((S.heroi.xp - R.xpParaNivel(R.NIVEL_MAX)) / 3000); if (rank > S.stats.paragon) { S.stats.paragon = rank; pop({ tipo: 'texto', titulo: `Rank Lendário ${rank}!`, txt: 'Seu PV máximo aumenta em +1 permanentemente.', cor: '#ffd23f' }); } }
  return total;
}
function subirNivel(de, para) {
  const cls = CLASSES[S.heroi.cls]; S.heroi.nivel = para;
  const novoMax = recursosMax(S.heroi.cls, para), velho = S.recursosMax;
  S.recursos.slots = novoMax.slots.map((n, i) => (S.recursos.slots[i] || 0) + Math.max(0, n - (velho.slots[i] || 0)));
  for (const k of Object.keys(novoMax.cont)) S.recursos.cont[k] = (S.recursos.cont[k] || 0) + Math.max(0, novoMax.cont[k] - (velho.cont[k] || 0));
  S.recursosMax = novoMax; const d = R.derivar(S); S.heroi.hp = d.hpMax;
  const novos = cls.feats.filter(([n]) => n > de && n <= para);
  const cap = CAPITULOS[Math.min(para, 20) - 1]; const ato = ATOS.find((a) => a.n === (cap ? cap.ato : 5));
  pop({ tipo: 'nivel', de, para, novos, cap: para <= 20 ? cap : null, hp: d.hpMax });
  logar(`Nível ${para}!`); verificarConquistas();
}

// ---------- atividade, sequência ----------
function marcarAtivo() {
  const D = dia(); if (D.ativ) return; D.ativ = true; S.stats.diasAtivos++;
  S.historia.inercia = R.clamp(S.historia.inercia - 1, 0, 10); // a primeira brasa do dia: o mundo respira
  const q = S.sequencia, h = hoje();
  if (q.ultimaAtiv !== h) {
    if (!q.ultimaAtiv) q.atual = 1;
    else {
      const gap = R.difDias(q.ultimaAtiv, h);
      let perdidos = gap - 1; for (let i = 1; i < gap; i++) if ((S.cfg.descanso || []).includes(R.diaSemana(R.addDias(q.ultimaAtiv, i)))) perdidos--;
      if (perdidos <= 0) q.atual++;
      else if (q.escudos >= perdidos) { q.escudos -= perdidos; q.atual++; pop({ tipo: 'texto', titulo: 'Escudo de Sequência!', txt: `Seu escudo protegeu ${perdidos} dia(s) perdido(s). A sequência continua.`, cor: '#4aa8ff' }); }
      else { q.atual = 1; if (gap >= 4) { q.voltaBonus = 2; S.stats.voltas++; pop({ tipo: 'texto', titulo: 'Bem-vindo de volta!', txt: 'Bônus de retorno: +25% de XP pelos próximos 2 dias.', cor: '#6fcf7f' }); } }
    }
    q.ultimaAtiv = h; if (q.atual > q.melhor) q.melhor = q.atual;
    if ([3, 7, 14, 30, 60, 100, 200, 365].includes(q.atual)) pop({ tipo: 'texto', titulo: `Sequência de ${q.atual} dias!`, txt: 'A Brasa arde forte. O XP de sequência cresce a cada dia.', cor: '#ff9f40' });
  }
}

// ---------- baús ----------
export function darBau(forca, origem, bonus = 0) {
  const r = R.rolarBau(S, Math.random, { forca, bonus: bonus + modEvento('lootBonus') - 1 + (modEvento('lootBonus') > 1 ? 1 : 0), origem });
  aplicarBau(r); pop({ tipo: 'bau', r, origem }); return r;
}
function aplicarBau(r) {
  ganharOuro(r.ouro); for (const id of r.itens) invAdd(id, 1); if (r.tocha) S.heroi.tochas = Math.min(15, S.heroi.tochas + 1);
}
export function ganharOuro(n) { S.heroi.ouro = Math.max(0, S.heroi.ouro + n); if (n > 0) S.stats.ouroTotal += n; }
export function invAdd(id, n = 1) { const x = S.inv.find((i) => i.id === id); if (x) x.n += n; else S.inv.push({ id, n }); descobrirItem(id); }
export function invDel(id, n = 1) { const x = S.inv.find((i) => i.id === id); if (!x) return false; x.n -= n; if (x.n <= 0) S.inv.splice(S.inv.indexOf(x), 1); return true; }
export const invQtd = (id) => (S.inv.find((i) => i.id === id) || { n: 0 }).n;

// ---------- Treino ----------
export function registrarSerie(liftId, carga, reps) {
  const L = LIFTS[liftId]; if (!L) return null; carga = Math.max(0, +carga || 0); reps = Math.round(+reps || 0);
  if (reps < 1 || reps > 40 || (carga <= 0 && liftId !== 'barra_fixa')) return { erro: 'Informe carga e repetições válidas.' };
  snapshot(); const D = dia(); const peso = S.heroi.peso;
  const ef = R.cargaEfetiva(liftId, carga, peso); const e1 = R.e1rm(ef, reps);
  const t = (S.treino[liftId] ||= { best: { e1: 0, w: 0, r: 0, data: null }, sets: 0 });
  const antes = t.best.e1; const tierAntes = antes > 0 ? R.infoTier(liftId, antes, S.heroi.sexo, peso).tier : -1;
  const nSet = (D.liftSets[liftId] || 0) + 1; const dentro = nSet <= 6;
  const res = { liftId, e1, ef, xp: 0, base: 0, prXp: 0, pr: null, baseline: false, tierUp: null, limite: !dentro, aquec: false };
  if (antes <= 0) { res.baseline = true; res.base = 60; t.best = { e1, w: carga, r: reps, data: hoje() }; }
  else {
    const I = e1 / antes;
    if (I < 0.5) res.aquec = true; else res.base = dentro ? Math.round(6 + 14 * Math.pow(Math.min(1, I), 3)) : 0;
    if (e1 > antes * 1.005) { res.pr = { de: antes, para: e1, delta: e1 - antes, w: carga, r: reps }; res.prXp = 120 + Math.min(400, Math.round((e1 - antes) * 6)); t.best = { e1, w: carga, r: reps, data: hoje() }; S.stats.prs++; D.prs++; }
  }
  D.series++; D.liftSets[liftId] = nSet; D.grupoSets[L.grupo] = (D.grupoSets[L.grupo] || 0) + 1; S.stats.series++; t.sets++;
  marcarAtivo();
  const mTreino = modEvento('treinoXp');
  res.xp += ganharXp(res.base, 'treino', { mod: mTreino }); if (res.prXp) res.xp += ganharXp(res.prXp, 'pr', { mod: modEvento('prXp') });
  const tierDepois = R.infoTier(liftId, t.best.e1, S.heroi.sexo, peso).tier;
  if (tierAntes >= 0 && tierDepois > tierAntes) { res.tierUp = { de: tierAntes, para: tierDepois }; const b = 150 + 100 * tierDepois; res.xp += ganharXp(b, 'tier', { semMult: true }); }
  if (res.baseline) S.heroi.hp = S.heroi.hp ?? der().hpMax;
  const tc = { 6: 1, 12: 1 }; if (tc[D.series] && D.toch.lift < 2) { D.toch.lift++; S.heroi.tochas = Math.min(15, S.heroi.tochas + 1); res.tocha = true; }
  S.stats.tiers = R.tiersPorGrupo(S);
  if (res.pr) { pop({ tipo: 'pr', liftId, pr: res.pr, tier: tierDepois }); darBau(3 + tierDepois, 'pr'); }
  if (res.tierUp) { pop({ tipo: 'tier', liftId, de: res.tierUp.de, para: res.tierUp.para }); darBau(9, 'tier'); }
  logar(`${L.nome}: ${carga}kg × ${reps}${res.pr ? ' — PR!' : ''}`);
  depoisDeAcao(); return res;
}
export function registrarSerieExtra(nome, carga, reps) {
  snapshot(); nome = String(nome || '').trim().slice(0, 40); if (!nome) return { erro: 'Dê um nome ao exercício.' };
  let e = S.extras.find((x) => x.nome.toLowerCase() === nome.toLowerCase()); if (!e) { e = { id: 'x' + Date.now(), nome, sets: 0, ultimo: null, melhor: 0 }; S.extras.push(e); }
  const D = dia(); e.sets++; e.ultimo = { w: +carga || 0, r: +reps || 0, d: hoje() }; e.melhor = Math.max(e.melhor, R.e1rm(+carga || 0, +reps || 1));
  D.extraSets++; marcarAtivo();
  const xp = D.extraSets <= 10 ? ganharXp(2, 'extra', { semMult: true }) : 0; depoisDeAcao(); return { xp, extra: true };
}
export function finalizarTreino() {
  const D = dia(); if (D.treinoFim || D.series < 3) return { erro: D.treinoFim ? 'Treino de hoje já finalizado.' : 'Faça pelo menos 3 séries pontuáveis.' };
  snapshot(); D.treinoFim = true; const xp = ganharXp(30 + D.series * 3, 'treino-fim');
  const r = darBau(Math.min(6, Math.floor(D.series / 3)), 'treino'); depoisDeAcao(); return { xp, r };
}
export function removerExtra(id) { S.extras = S.extras.filter((e) => e.id !== id); salvaEmite(); }

// ---------- Aeróbico ----------
function xpComRetorno(jaFeito, min, limites, f = 1) {
  const [a, b] = limites; let xp = 0; for (let i = 0; i < min; i++) { const t = jaFeito + i; xp += t < a ? 1 : t < b ? 0.6 : 0.25; } return xp * f;
}
export function registrarCardio(ativId, min, intensId = 'moderado') {
  min = Math.round(+min); if (!min || min < 1 || min > 600) return { erro: 'Informe os minutos (1–600).' };
  const at = AERO.find((a) => a.id === ativId) || AERO[0]; const it = INTENSIDADES.find((i) => i.id === intensId) || INTENSIDADES[1];
  snapshot(); const D = dia();
  const base = Math.round(xpComRetorno(D.cardio, min, [60, 120]) * at.mult * it.f);
  const xp = ganharXp(base, 'cardio', { mod: modEvento('aeroXp') });
  const antes = D.cardio; D.cardio += min; S.stats.cardioMin += min; S.stats.aeroTipos[at.id] = (S.stats.aeroTipos[at.id] || 0) + min; marcarAtivo();
  let tocha = 0; for (const lim of [20, 60]) if (antes < lim && D.cardio >= lim && D.toch.cardio < 2) { D.toch.cardio++; tocha++; S.heroi.tochas = Math.min(15, S.heroi.tochas + 1); }
  let bau = null; if (min >= 15) bau = darBau(Math.min(6, Math.floor(min / 20)), 'cardio');
  logar(`${at.nome}: ${min} min (+${xp} XP)`); depoisDeAcao(); return { xp, tocha, bau, at, base };
}

// ---------- Estudo ----------
export function registrarEstudo(tipoId, catId, min, nota = '', pomo = false) {
  min = Math.round(+min); if (!min || min < 1 || min > 720) return { erro: 'Informe os minutos (1–720).' };
  const tp = ESTUDO_TIPOS.find((t) => t.id === tipoId) || ESTUDO_TIPOS[0]; snapshot(); const D = dia();
  const base = Math.round(xpComRetorno(D.estudo, min, [240, 480]) * tp.mult * multProva());
  const xp = ganharXp(base + (pomo ? 20 : 0), 'estudo', { mod: modEvento('estudoXp') });
  const antes = D.estudo; D.estudo += min; S.stats.estudoMin += min; if (tipoId === 'questoes' || tipoId === 'simulado') D.questoes += min; if (pomo) { D.pomos++; S.stats.pomos++; }
  marcarAtivo();
  let tocha = 0; for (const lim of [45, 120]) if (antes < lim && D.estudo >= lim && D.toch.estudo < 2) { D.toch.estudo++; tocha++; S.heroi.tochas = Math.min(15, S.heroi.tochas + 1); }
  let bau = null; if (min >= 20) bau = darBau(Math.min(6, Math.floor(min / 25)), 'estudo');
  logar(`Estudo (${tp.nome}${nota ? ': ' + nota : ''}): ${min} min`); depoisDeAcao(); return { xp, tocha, bau, tp };
}

// ---------- Alimentação ----------
export function addComida(nome, kcal) {
  kcal = Math.round(+kcal); if (!kcal || kcal < 1 || kcal > 6000) return { erro: 'Informe kcal (1–6000).' };
  snapshot(); const D = dia(); D.comida.push({ n: String(nome || 'Refeição').slice(0, 40), k: kcal, t: Date.now() }); D.kcal += kcal;
  let xp = 0; if (D.comida.length <= 5) xp = ganharXp(8, 'comida', { semMult: true });
  depoisDeAcao(); return { xp };
}
export function delComida(i) { snapshot(); const D = dia(); const [x] = D.comida.splice(i, 1); if (x) D.kcal -= x.k; depoisDeAcao(); }
export function faixaDeHoje() { const D = dia(); const tol = modEvento('tolera') > 1 ? 0 : 0; const e = eventoAtual(); const t = e && e.mod && e.mod.tolera ? e.mod.tolera : 0; return R.faixaNutricao(D.kcal, S.heroi.kcalAlvo, D.comida.length, t); }

// ---------- Hábitos e provas ----------
export const HAB_CAP_XP = 120; // teto diário de XP vindo de hábitos (o dia ainda conta como ativo)
export function addHabito(nome, xp = 20, extra = {}) { const n = String(nome).trim().slice(0, 40); if (!n) return null; const h = { id: 'h' + Date.now() + Math.floor(Math.random() * 99), nome: n, xp: Math.max(5, Math.min(60, +xp || 20)), ...extra, desde: hoje() }; S.habitos.push(h); salvaEmite(); return h; }
export function delHabito(id) { S.habitos = S.habitos.filter((h) => h.id !== id); salvaEmite(); }
export function cumprirHabito(id) {
  const h = S.habitos.find((x) => x.id === id); const D = dia(); if (!h || D.hab[id]) return null; snapshot(); D.hab[id] = true; marcarAtivo();
  const usado = D.xpHab || 0; const base = Math.max(0, Math.min(h.xp, HAB_CAP_XP - usado)); D.xpHab = usado + base; const xp = base > 0 ? ganharXp(base, 'habito') : 0; logar(`Hábito: ${h.nome}`); depoisDeAcao(); return { xp, limite: base < h.xp };
}
// dias seguidos cumprindo o hábito (se hoje ainda não foi feito, conta a partir de ontem)
export function sequenciaHabito(id) { let d = hoje(), n = 0; if (!(S.dias[d] && S.dias[d].hab && S.dias[d].hab[id])) d = R.addDias(d, -1); while (S.dias[d] && S.dias[d].hab && S.dias[d].hab[id] && n < 400) { n++; d = R.addDias(d, -1); } return n; }
export function addProva(nome, data) { S.provas.push({ id: 'p' + Date.now(), nome: String(nome).slice(0, 40), data }); S.provas.sort((a, b) => a.data.localeCompare(b.data)); salvaEmite(); }
export function delProva(id) { S.provas = S.provas.filter((p) => p.id !== id); salvaEmite(); }

// ---------- Missões / evento ----------
function progCtx() { return { faixa: faixaDeHoje().id }; }
export function checarMissoes() {
  const D = dia(); const ctx = progCtx();
  for (const q of S.diario.missoes) {
    if (q.feito) continue; q.prog = Math.min(q.alvo, R.progMissao(q, S, D, ctx));
    if (!q.fim && q.prog >= q.alvo) concluirMissao(q);
  }
  const todas = S.diario.missoes.every((q) => q.feito);
  if (todas && !D.perfeito) { D.perfeito = true; S.stats.perfeitos++; ganharXp(100, 'dia-perfeito'); S.heroi.tochas = Math.min(15, S.heroi.tochas + 1); S.historia.inercia = Math.max(0, S.historia.inercia - 1); S.historia.moral = Math.min(100, S.historia.moral + 1); const r = darBau(5, 'dia-perfeito'); pop({ tipo: 'texto', titulo: 'DIA PERFEITO!', txt: 'Todas as missões cumpridas. +1 Tocha, −1 Maré da Inércia e um baú especial.', cor: '#ffd23f' }); }
}
function concluirMissao(q) {
  q.feito = true; const xp = ganharXp(q.xp, 'missao'); ganharOuro(q.ouro); S.heroi.hp = Math.min(S.heroi.hp ?? 999, der().hpMax);
  pop({ tipo: 'missao', q, xp }); logar(`Missão: ${q.txt}`);
}
function checarTriplice() {
  const D = dia(); if (D.triplice) return; const corpo = D.series > 0 || D.cardio > 0, mente = D.estudo > 0, alma = D.comida.length > 0 || Object.keys(D.hab).length > 0;
  if (corpo && mente && alma) { D.triplice = true; S.stats.triplices++; S.historia.inercia = R.clamp(S.historia.inercia - 1, 0, 10); ganharXp(100, 'triplice'); darBau(4, 'triplice'); pop({ tipo: 'texto', titulo: 'TRÍPLICE COROA!', txt: 'Corpo, Mente e Alma no mesmo dia. +100 XP e baú raro.', cor: '#b57bff' }); }
}
export function aplicarEfeito(ef, origem) {
  if (!ef) return; const H = S.historia;
  if (ef.ouro) ganharOuro(ef.ouro); if (ef.moral) H.moral = R.clamp(H.moral + ef.moral, 0, 100); if (ef.inercia) H.inercia = R.clamp(H.inercia + ef.inercia, 0, 10);
  if (ef.tochas) S.heroi.tochas = R.clamp(S.heroi.tochas + ef.tochas, 0, 15); if (ef.xp) ganharXp(ef.xp, origem || 'evento', { semMult: true }); if (ef.item) invAdd(ef.item, 1);
  if (ef.flag) H.flags[ef.flag] = true; if (ef.loot) darBau(ef.loot, 'evento');
}
export function checarEvento() {
  const e = eventoAtual(); if (!e || e.tipo !== 'desafio' || e.estado.feito) return; const D = dia(); let v = 0;
  const m = e.meta; v = m.tipo === 'cardio' ? D.cardio : m.tipo === 'estudo' ? D.estudo : m.tipo === 'series' ? D.series : m.tipo === 'refeicoes' ? D.comida.length : 0;
  if (v >= m.alvo) { e.estado.feito = 'ok'; aplicarEfeito(e.ok, 'evento'); pop({ tipo: 'texto', titulo: `${e.nome} — vencido!`, txt: 'Desafio do dia concluído. Recompensa entregue.', cor: '#6fcf7f' }); }
}
export function escolherEvento(i) {
  const e = eventoAtual(); if (!e || e.tipo !== 'escolha' || e.estado.feito) return null; const op = e.opcoes[i]; if (!op) return null;
  if (op.ef.ouro && op.ef.ouro < 0 && S.heroi.ouro < -op.ef.ouro) return { erro: 'Ouro insuficiente.' }; if (op.ef.tochas && op.ef.tochas < 0 && S.heroi.tochas < -op.ef.tochas) return { erro: 'Tochas insuficientes.' };
  snapshot(); e.estado.feito = 'ok'; e.estado.escolha = i; e.estado.resultado = op.r; aplicarEfeito(op.ef, 'evento'); salvaEmite(); return { r: op.r };
}
function depoisDeAcao() { checarMissoes(); checarEvento(); checarTriplice(); S.stats.tiers = R.tiersPorGrupo(S); verificarConquistas(); salvaEmite(); }

// ---------- Conquistas ----------
export function verificarConquistas() {
  S._tiers = R.tiersPorGrupo(S);
  for (const c of CONQUISTAS) {
    if (S.conquistas[c.id]) continue; let ok = false; try { ok = c.ok(S); } catch (e) { ok = false; }
    if (!ok) continue; S.conquistas[c.id] = hoje(); const rec = c.rec || {};
    if (rec.ouro) ganharOuro(rec.ouro); if (rec.cap && !S.heroi.capas.includes(rec.cap)) S.heroi.capas.push(rec.cap);
    pop({ tipo: 'conquista', c }); if (rec.xp) ganharXp(rec.xp, 'conquista', { semMult: true });
  }
  delete S._tiers;
}

// ---------- Virada de dia (descanso longo) ----------
export function virarDia() {
  const h = hoje(); let d = S.diario.data; if (d === h) return null;
  const rel = { dias: [], novo: h, faixa: null, nivelAntes: S.heroi.nivel };
  let ultimaFaixa = null;
  while (d < h) {
    const D = S.dias[d] || null; const ehUltimo = R.addDias(d, 1) === h;
    const e = avaliarDia(d, D, rel); ultimaFaixa = e.faixa; rel.dias.push(e.resumo);
    d = R.addDias(d, 1);
  }
  // novo dia: descanso longo
  const f = ultimaFaixa || R.faixaNutricao(0, S.heroi.kcalAlvo, 0); rel.faixa = f;
  const novoMax = recursosMax(S.heroi.cls, S.heroi.nivel); S.recursosMax = novoMax; S.recursos = recursosComFator(novoMax, f.f);
  S.heroi.exaustao = R.clamp((S.heroi.exaustao || 0) + (f.exaust || 0), 0, 5); S.heroi.sono = !!f.sono;
  if (f.id === 'banquete') { S.heroi.insp = Math.min(1, (S.heroi.insp || 0) + 1); S.heroi.tochas = Math.min(15, S.heroi.tochas + 1); S.stats.banquetes++; }
  if (S.sequencia.voltaBonus > 0) S.sequencia.voltaBonus--;
  S.heroi.tochas = Math.min(15, S.heroi.tochas + 1); S.heroi.hp = der().hpMax;
  S.diario = { data: h, missoes: [], evento: null, loot: 0 }; S.diario.missoes = R.gerarMissoes(S, h); S.diario.evento = R.gerarEvento(S, h);
  rel.inercia = S.historia.inercia; rel.moral = S.historia.moral; rel.exaustao = S.heroi.exaustao;
  S.relatorio = rel; delete S.dias[R.addDias(h, -60)]; // limpa histórico muito antigo
  checarMissoes(); verificarConquistas(); salvaEmite(); pop({ tipo: 'amanhecer', rel }); return rel;
}
function avaliarDia(data, D, rel) {
  const res = { data, resumo: {} }; const rest = (S.cfg.descanso || []).includes(R.diaSemana(data));
  const d0 = D || { kcal: 0, comida: [], ativ: false }; const diario = S.diario.data === data ? S.diario : null;
  const ev = diario && diario.evento ? { ...R.eventoDef(diario.evento.id), estado: diario.evento } : null;
  const tol = ev && ev.mod && ev.mod.tolera ? ev.mod.tolera : 0;
  const faixa = R.faixaNutricao(d0.kcal || 0, S.heroi.kcalAlvo, (d0.comida || []).length, tol); res.faixa = faixa;
  let feitas = 0, total = 0;
  if (diario) {
    for (const q of diario.missoes) {
      total++;
      if (q.fim && !q.feito && faixa.id === 'banquete' && (d0.comida || []).length >= 2) concluirMissao(q);
      if (q.feito) feitas++;
    }
    if (ev && ev.tipo === 'desafio' && !ev.estado.feito) { ev.estado.feito = 'falhou'; aplicarEfeito(ev.falha, 'evento'); }
  }
  const H = S.historia; let dInercia = 0;
  if (!d0.ativ && !rest) { dInercia = 1; H.moral = R.clamp(H.moral - 1, 0, 100); }
  else if (feitas === 0 && total && !rest) dInercia = 0;
  if (diario && feitas === total && total && !diario.perfeitoRecebido) { /* inércia -1 já aplicado ao completar */ }
  H.inercia = R.clamp(H.inercia + dInercia, 0, 10);
  res.resumo = { data, ativ: !!d0.ativ, feitas, total, faixa: faixa.id, dInercia, xp: d0.xp || 0, rest };
  return res;
}

// ---------- Equipamentos, loja e itens ----------
export function podeEquipar(it) {
  const c = CLASSES[S.heroi.cls];
  if (it.tipo === 'armadura') { const need = { veste: 0, leve: 1, media: 2, pesada: 3 }[it.cat]; return c.arm >= need; }
  if (it.tipo === 'escudo') return c.escudo; return true;
}
export function equipar(id) {
  const it = ITENS[id]; if (!it || !invQtd(id)) return { erro: 'Você não tem esse item.' }; if (!podeEquipar(it)) return { erro: `${CLASSES[S.heroi.cls].nome} não pode usar isso.` };
  const slot = it.tipo === 'arma' ? 'arma' : it.tipo === 'armadura' ? 'armadura' : it.tipo === 'escudo' ? 'escudo' : it.tipo === 'acessorio' ? (S.equip.ac1 ? 'ac2' : 'ac1') : null; if (!slot) return { erro: 'Não equipável.' };
  if (it.tipo === 'arma' && it.duas && S.equip.escudo) { /* duas mãos: remove escudo */ invAdd(S.equip.escudo, 1); S.equip.escudo = null; }
  if (it.tipo === 'escudo' && S.equip.arma && ITENS[S.equip.arma].duas) return { erro: 'Arma de duas mãos equipada.' };
  const atual = S.equip[slot]; invDel(id, 1); if (atual) invAdd(atual, 1); S.equip[slot] = id; ajustarHp(); salvaEmite(); return { ok: true };
}
export function desequipar(slot) { const id = S.equip[slot]; if (!id) return; invAdd(id, 1); S.equip[slot] = null; ajustarHp(); salvaEmite(); }
function ajustarHp() { const m = der().hpMax; if (S.heroi.hp > m) S.heroi.hp = m; }
// ----- comércio: afinidade de negociação, preços e caixa diário de cada comerciante -----
export const relComerciante = (loja) => { const c = COMERCIANTES[loja]; const r = S.npcs[c.npc]; const afin = r ? r.afin | 0 : 0; return { afin, nivel: nivelNegociacao(afin), nome: NOMES_NEG[nivelNegociacao(afin)] }; };
export function caixaLoja(loja) {
  const d = hoje(); const e = ((S.com ||= {})[loja] = S.com[loja] && S.com[loja].data === d ? S.com[loja] : { data: d, gasto: 0 }); const max = caixaMax(loja, S.heroi.nivel, relComerciante(loja).nivel);
  return { max, gasto: e.gasto, resta: Math.max(0, max - e.gasto) };
}
export const precoCompra = (id, loja) => Math.max(1, Math.round(R.precoItem(id, S, COMERCIANTES[loja].mod) * modCompra(relComerciante(loja).nivel)));
export const precoVendaItem = (id, loja) => vendaLoja(ITENS[id], loja, relComerciante(loja).nivel);
export function comprar(id, loja) {
  const it = ITENS[id]; if (!it || !COMERCIANTES[loja]) return { erro: 'Item indisponível.' }; const p = precoCompra(id, loja); if (S.heroi.ouro < p) return { erro: 'Ouro insuficiente.' };
  snapshot(); S.heroi.ouro -= p; invAdd(id, 1); const e = caixaLoja(loja); S.com[loja].gasto = Math.max(0, e.gasto - Math.round(p * 0.5)); salvaEmite(); return { ok: true, p };
}
// o herói só vende a comerciantes; eles pagam menos do que cobram e têm um limite de caixa por dia
export function vender(id, loja) {
  const it = ITENS[id]; const c = COMERCIANTES[loja]; if (!it || !c) return { erro: 'Só é possível vender a comerciantes.' }; if (!invQtd(id)) return { erro: 'Sem o item.' };
  if (!c.aceita.includes(it.tipo)) return { erro: `${c.nome} não compra isso.` }; const p = vendaLoja(it, loja, relComerciante(loja).nivel); if (!(p > 0)) return { erro: `${c.nome} não quer isso.` };
  const cx = caixaLoja(loja); if (p > cx.resta) return { erro: `O caixa de ${c.nome} não cobre isso hoje (restam ${cx.resta} 🪙).`, caixa: true };
  invDel(id, 1); ganharOuro(p); S.com[loja].gasto += p; salvaEmite(); return { ok: true, p };
}
export function usarForaDaMasmorra(id) {
  const it = ITENS[id]; if (!it || !invQtd(id)) return { erro: 'Sem o item.' };
  if (it.selo) { S.historia.selo = { ate: R.addDias(hoje(), it.selo - 1) }; invDel(id); salvaEmite(); return { msg: `🔔 A Névoa recua por ${it.selo} dia(s): a Maré efetiva é 0/10.` }; }
  if (it.pvMax) { S.heroi.bonusPV = (S.heroi.bonusPV || 0) + it.pvMax; invDel(id); S.heroi.hp = Math.min(der().hpMax, (S.heroi.hp ?? 0) + it.pvMax); salvaEmite(); return { msg: `PV máximos +${it.pvMax} (permanente).` }; }
  if (it.curaPerm) { S.heroi.bonusCura = (S.heroi.bonusCura || 0) + it.curaPerm; invDel(id); salvaEmite(); return { msg: `Suas curas rendem +${it.curaPerm} PV (permanente).` }; }
  if (it.cura) { const n = rolar(it.cura).total + (S.heroi.bonusCura || 0); const m = der().hpMax; S.heroi.hp = Math.min(m, (S.heroi.hp ?? m) + n); invDel(id); salvaEmite(); return { msg: `Curou ${n} PV.` }; }
  if (it.restaura) { if (!S.heroi.exaustao) return { erro: 'Você não está exausto.' }; S.heroi.exaustao--; invDel(id); salvaEmite(); return { msg: 'Exaustão reduzida em 1 nível.' }; }
  if (it.escudoSeq) { S.sequencia.escudos++; invDel(id); salvaEmite(); return { msg: 'Escudo de Sequência ativo (protege 1 dia perdido).' }; }
  if (it.insp) { S.heroi.insp = Math.min(2, S.heroi.insp + 1); invDel(id); salvaEmite(); return { msg: 'Inspiração concedida.' }; }
  return { erro: 'Use em combate.' };
}
export function templo(servico) {
  const custo = { cura: 0, exaustao: 40 * S.heroi.nivel }[servico]; if (custo === undefined) return { erro: '?' };
  if (servico === 'exaustao' && !S.heroi.exaustao) return { erro: 'Você não está exausto.' }; if (S.heroi.ouro < custo) return { erro: `Custa ${custo} de ouro.` };
  S.heroi.ouro -= custo; if (servico === 'exaustao') S.heroi.exaustao--; else S.heroi.hp = der().hpMax; salvaEmite(); return { ok: true };
}
export function descansarEmCasa() { S.heroi.hp = der().hpMax; salvaEmite(); }

// ---------- História ----------
export function capituloDisponivel() { return R.capituloAtivo(S); }
export function concluirCapitulo(n, escolha) {
  const cap = CAPITULOS[n - 1]; const H = S.historia; if (H.limpos.includes(n)) return;
  H.limpos.push(n); S.stats.chefes++;
  if (escolha != null) { const op = cap.decisao.opcoes[escolha]; H.decisoes[n] = escolha; aplicarEfeito(op.ef, 'historia'); }
  const rc = cap.recompensa || {}; if (rc.ouro) ganharOuro(rc.ouro); if (rc.item) invAdd(rc.item, 1); ganharXp(100 + n * 25, 'chefe', { semMult: true });
  if (cap.brasa) pop({ tipo: 'texto', titulo: cap.brasa, txt: 'Uma nova Brasa acende na Forja Primeva.', cor: '#ff9f40' });
  if (n === 20) { H.final = finalPorMoral(H.moral, H.inercia); H.flags.rei_derrotado = true; }
  for (const e of Camp.aoConcluirCapitulo(S, n, ganchosCamp)) anunciarCamp(e);
  delete H.checkpoint[n]; verificarConquistas(); salvaEmite();
}
export function novoCiclo() {
  const H = S.historia; H.ciclo++; H.limpos = []; H.checkpoint = {}; H.decisoes = {}; H.final = null; H.inercia = 9; H.cap = 1; delete H.festa; delete H.flags.festa_feita;
  const C = S.campanha; C.q = {}; C.leitura = null; C.rel = {}; C.modo = 'campanha'; C.loops++; S.companheiros = S.companheiros.filter((c) => !c.aliadoId); salvaEmite();
}
// Fim de campanha: 'explorador' abre as catacumbas infinitas com tudo o que o herói conquistou.
export function escolherModoFinal(modo) { const C = S.campanha; C.modo = modo === 'explorador' ? 'explorador' : 'campanha'; salvaEmite(); }
export function marcarVisto(k) { S.historia.vistos[k] = true; salvar(); }

// ---------- Masmorra ----------
export function tochaDisponivel() { return S.heroi.tochas > 0 && S.heroi.exaustao < 5; }
export function gastarTocha() { if (!tochaDisponivel()) return false; S.heroi.tochas--; salvaEmite(); return true; }
export function salvarBatalha(B) {
  const H = B.h; S.heroi.hp = Math.max(0, Math.min(H.hp, der().hpMax)); S.recursos.slots = H.slots; S.recursos.cont = H.cont; S.heroi.insp = H.insp;
  for (const u of B.usados.splice(0)) invDel(u, 1); salvar(); bus.emit('mudou');
}
export function derrotaNaMasmorra() {
  const r = S.run; const perdido = r ? r.ouroGanho : 0; S.heroi.hp = Math.max(1, Math.floor(der().hpMax * 0.25));
  if (r) { r.itensGanhos.forEach(() => {}); } S.run = null; logar(`Derrotado na masmorra (perdeu ${perdido} de ouro do saque).`); salvaEmite(); return perdido;
}
export function ganhoDaMasmorra(ouro) { ganharOuro(ouro); if (S.run) S.run.ouroGanho += ouro; }
export function abateRegistrado(m) { S.stats.abates++; avistar(m, true); verificarConquistas(); }

// ---------- glossário (o que o herói já viu), memória dos NPCs e missões rastreadas ----------
export function semearGlos(s) {
  const g = (s.glos ||= { mon: {}, it: {}, lug: {} }); g.mon ||= {}; g.it ||= {}; g.lug ||= {}; const d = s.inicio || hoje();
  for (const i of s.inv || []) if (i && !g.it[i.id]) g.it[i.id] = { d };
  for (const id of Object.values(s.equip || {})) if (id && !g.it[id]) g.it[id] = { d };
}
export function descobrirItem(id) { if (!S || !S.glos || !id) return; if (!S.glos.it[id]) S.glos.it[id] = { d: hoje() }; }
// m: unidade/monstro criado por criarMonstro (tem id, n, cr…). matou=true conta um abate.
export function avistar(m, matou = false) {
  if (!S || !m || !m.id || m.heroi) return; const id = String(m.id); if (m.eq === 'j' || m.aliado) return;
  const g = (S.glos ||= { mon: {}, it: {}, lug: {} }).mon; const e = (g[id] ||= { d: hoje(), v: 0, k: 0 }); if (matou) e.k++; else e.v++;
}
export function avistarLugar(id) { if (!S || !S.glos) return; if (!S.glos.lug[id]) { S.glos.lug[id] = { d: hoje() }; salvar(); } }
// o que você viveu com um NPC: entra no diário de relações (últimas 14 lembranças)
export function memorizar(id, txt) {
  if (!S || !id || !txt) return; const r = (S.npcs[id] ||= { afin: 0, ultimo: null }); const m = (r.memo ||= []);
  if (m.length && m[m.length - 1].t === txt && m[m.length - 1].d === hoje()) return; m.push({ d: hoje(), t: txt }); if (m.length > 14) m.splice(0, m.length - 14);
}
export function garantirRastro() { if (!S || !S.campanha || S.rastroIni) return; S.rastroIni = true; const a = Camp.ativas(S).find((q) => q.tipo === 'principal'); if (a && !(S.rastro || []).length) rastrear(a.id, true); }
export function rastrear(id, on) {
  const r = (S.rastro ||= []); const i = r.indexOf(id); if (on === undefined) on = i < 0; if (on && i < 0) r.push(id); else if (!on && i >= 0) r.splice(i, 1); salvar(); bus.emit('mudou'); return on;
}
export function andarConcluido(andar, final) {
  const xp = ganharXp(10 + 2 * S.heroi.nivel + andar * 3, 'masmorra', { semMult: true }); S.stats.masmorras++;
  verificarConquistas(); salvaEmite(); return xp;
}
