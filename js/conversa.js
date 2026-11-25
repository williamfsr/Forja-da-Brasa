// Motor de conversa: monta a cena de diálogo de cada NPC (só opções de fala), com reações à aparência, raça e classe do herói,
// tópicos que apontam o mapa e o Rei, missões ativas/concluídas e a afinidade crescente. Também roda visitas do Rei, sonhos, dádivas e Teo.
import * as St from './store.js';
import * as Camp from './campanha.js';
import * as R from './rules.js';
import { NPCS } from './story.js';
import { NPC_PERFIL, AFIN_RECOMPENSAS } from './personalidade.js';
import { ITENS } from './srd.js';
import { RACAS, MARCAS, ACESSORIOS } from './cosmeticos.js';
import { ATIT, RACA_L, MARCA_L, ACESS_L, CLASSE_L, QFALAS, VISITAS, DADIVAS, TEO, TOPICOS, SONHOS_INTRO } from './historia2.js';
import * as Au from './audio.js';
import { rel as relR, IMUNES, podeRomance, menuRomance, menuRude, modoInimigo, ehInimigo, estaPerdido, bomDia, mudarAfin, perderNpc, reiSabe } from './romance.js';

import { Dados } from './dados.js';
const ATR_ROT = { FOR: 'Força', DES: 'Destreza', CON: 'Constituição', INT: 'Inteligência', SAB: 'Sabedoria', CAR: 'Carisma' };
const S = () => St.S; const rnd = (n) => Math.floor(Math.random() * n);
function ctx() {
  const s = S(), h = s.heroi, ap = h.ap || {}; const d = R.derivar(s);
  return { s, h, ap, raca: ap.raca || 'humano', cls: h.cls, cap: s.historia.cap, nivel: h.nivel, inercia: St.inerciaEf(s), moral: s.historia.moral, mod: d.M || {}, marca: MARCAS[ap.marca | 0] || 'Nenhuma', acess: ACESSORIOS[ap.acess | 0] || 'Nenhum', flags: s.historia.flags };
}
const rel = (id) => (S().npcs[id] ||= { afin: 0, ultimo: null });
const vistos = (id) => (rel(id).v ||= {});
const efeito = (G, e) => {
  if (!e) return; const s = S(), H = s.historia;
  if (e.moral) H.moral = Math.max(0, Math.min(100, H.moral + e.moral)); if (e.inercia) H.inercia = Math.max(0, Math.min(10, H.inercia + e.inercia));
  if (e.lore) { const p = Camp.lerPagina(s, e.lore); if (p) G.ui.toast(`📖 Nova página do Diário: ${p.t}`, 4200); } if (e.flag) H.flags[e.flag] = true; if (e.perde) perderNpc(e.perde); if (e.insp) s.heroi.insp = Math.min(3, (s.heroi.insp || 0) + e.insp); if (e.ouro) St.ganharOuro(e.ouro);
  St.salvar(); G.ui.hud && G.ui.hud();
};
function teste(c, atr, dc) { const r = 1 + rnd(20), m = (c.mod && c.mod[atr]) || 0, t = r + m; Dados.teste20(r, { mod: m, dc, rot: ATR_ROT[atr] || atr, ok: t >= dc }); return { r, m, t, ok: t >= dc, txt: `* d20 ${r}${m >= 0 ? '+' : ''}${m} = ${t} contra CD ${dc} — ${t >= dc ? 'sucesso' : 'falha'}` }; }

// opções "Sobre mim…": cada item usa a personalização do herói e rende afinidade na primeira vez
function sobreMim(id, c) {
  const att = ATIT[id] === 'desconfia' ? 1 : 0, out = [];
  out.push({ id: 'm_raca', rot: `Sou ${RACAS[c.raca] ? RACAS[c.raca].nome.toLowerCase() : 'viajante'}.`, tom: 'Raça', npc: [(RACA_L[c.raca] || RACA_L.humano)[att]] });
  if (c.marca !== 'Nenhuma' && MARCA_L[c.marca]) out.push({ id: 'm_marca', rot: `Esta marca (${c.marca.toLowerCase()})…`, tom: 'Aparência', npc: [MARCA_L[c.marca]] });
  if (c.acess !== 'Nenhum' && ACESS_L[c.acess]) out.push({ id: 'm_acess', rot: `Gostou do meu acessório?`, tom: 'Aparência', npc: [ACESS_L[c.acess]] });
  const cl = CLASSE_L[c.cls]; if (cl) out.push({ id: 'm_cls', rot: `(${cl[0]})`, tom: 'Classe', npc: [cl[1]] });
  if (c.ap.altura >= 2) out.push({ id: 'm_alt', rot: 'Sim, sou alto.', tom: 'Aparência', npc: ['Alto como a ponte da Garganta! Cuidado com os tetos baixos da estalagem.'] }); else if (c.ap.altura <= -2) out.push({ id: 'm_alt', rot: 'Sim, sou baixo.', tom: 'Aparência', npc: ['Baixinho e teimoso: a combinação que mais me incomoda e mais respeito.'] });
  if (c.ap.chifre !== undefined && c.raca === 'tiefling') out.push({ id: 'm_chifre', rot: 'Sobre meus chifres...', tom: 'Raça', npc: ['Chifres. O Vale não julga. Julga só quem para.'] });
  if (c.raca === 'draconato') out.push({ id: 'm_dra', rot: 'Posso soltar uma faísca. Quer ver?', tom: 'Raça', npc: ['Guarde o fôlego para a Inércia. Mas obrigado pela oferta.'] });
  return out;
}
const respFalas = (v, c) => (typeof v === 'function' ? v(c) : v);

export async function conversar(G, n, def, pf, ret, nome, extra) {
  const s = S(), id = n.id, ui = G.ui; const r = rel(id); const c = ctx(); const hoje = St.hoje(); const att = ATIT[id] === 'desconfia' ? 1 : 0;
  const di = (txt, extra = {}) => ui.dialogo(nome, Array.isArray(txt) ? txt : [txt], { retrato: ret, ...extra });
  // Abertura: primeira vez reage à aparência; depois, fala o contexto do dia
  const falas = def.falas || ['...']; const primeira = !r.viu; r.viu = true;
  const aberto = [];
  if (primeira) aberto.push((RACA_L[c.raca] || RACA_L.humano)[att]); else aberto.push(falas[rnd(falas.length)]);
  if (!primeira && extra && rnd(2) === 0) aberto.push(extra);
  if (!primeira && c.inercia >= 7 && rnd(3) === 0) aberto.push('A Névoa está pesada hoje. Respire fundo antes de seguir.');
  if (estaPerdido(id) || ehInimigo(id)) { Au.sfx('select'); await modoInimigo(G, id, ret, nome); St.salvar(); return false; }
  Au.sfx('select'); await di(aberto); await bomDia(G, id, ret, nome);
  // quests deste NPC
  const qs = () => Camp.QUESTS.filter((q) => q.npc === id && s.campanha.q[q.id]);
  const pred = n.painel ? { nome: (G.NOME_PAINEL && G.NOME_PAINEL[n.painel]) || 'o balcão' } : null; let abrir = false, sair = false, volta = 0;
  while (!sair) {
    const opc = []; const topicos = (TOPICOS[id] || []).filter((t) => !t.req || t.req(c));
    for (const t of topicos) opc.push({ id: 't:' + t.id, rot: t.rot, tom: t.tom, sub: vistos(id)[t.id] ? 'já conversado' : '' });
    for (const q of qs()) { const e = s.campanha.q[q.id]; opc.push({ id: 'q:' + q.id, rot: e.est === 'feita' ? `Sobre «${q.titulo}» (concluída)` : `Sobre «${q.titulo}»`, tom: q.tipo === 'principal' ? 'Missão' : 'Missão extra' }); }
    if (pred) opc.push({ id: 'serv', rot: serviçoFala(n.painel), tom: 'Serviço' });
    if (id === 'safira' && G.lojaSafira && c.flags.rei_derrotado) opc.push({ id: 'lojaS', rot: 'Ver as mercadorias de cura.', tom: 'Serviço' });
    opc.push({ id: 'eu', rot: 'Falar de mim…', tom: 'Você' });
    if (podeRomance(id)) opc.push({ id: 'rom', rot: 'Romance…', tom: '💞', sub: `Romance ${r.rom | 0}/15 · Afinidade ${r.afin}${S().historia.par && S().historia.par.id === id ? (S().historia.par.tipo === 'casado' ? ' · 💍 casados' : ' · 💞 namorando') : ''}` });
    if (pf && pf.afin) opc.push({ id: 'papo', rot: 'Bater um papo.', sub: r.ultimo === hoje ? `Afinidade ${r.afin} ♥ (já conversaram hoje)` : `Afinidade ${r.afin} ♥ · +1 por dia`, tom: 'Relação' });
    if (!IMUNES.has(id)) opc.push({ id: 'rude', rot: 'Ser grosseiro…', tom: 'Risco' });
    opc.push({ id: 'sair', rot: 'Até logo.' });
    const resp = await ui.dialogoEscolha({ nome, retrato: ret, texto: volta++ ? (pf && pf.gosta ? pf.gosta : 'Algo mais?') : (pf && pf.gosta ? pf.gosta : 'No que posso ajudar?'), opcoes: opc });
    if (resp === 'sair') { sair = true; await di(['» Até logo.', att ? 'Vá com cuidado.' : 'Volte sempre.']); }
    else if (resp === 'serv') { abrir = true; sair = true; await di([`» ${serviçoFala(n.painel)}`, 'Claro. Fique à vontade.']); }
    else if (resp === 'lojaS') await G.lojaSafira(G, ret, nome);
    else if (resp === 'papo') await papo(G, n, def, pf, ret, nome);
    else if (resp === 'eu') await menuEu(G, id, c, ret, nome);
    else if (resp === 'rom') await menuRomance(G, id, ret, nome);
    else if (resp === 'rude') { await menuRude(G, id, ret, nome); if (ehInimigo(id)) sair = true; }
    else if (resp.startsWith('t:')) {
      const t = topicos.find((x) => 't:' + x.id === resp); if (!t) continue; vistos(id)[t.id] = true;
      if (t.teste) { const tt = teste(c, t.teste.atr, t.teste.dc); await di([`» ${t.rot}`, tt.txt, ...(tt.ok ? t.ok : t.falha)]); if (tt.ok) efeito(G, t.ef); }
      else { await di([`» ${t.rot}`, ...respFalas(t.npc, c)]); efeito(G, t.ef); }
    } else if (resp.startsWith('q:')) await falarMissao(G, id, resp.slice(2), c, ret, nome);
  }
  r.ultimo = r.ultimo || null; St.salvar(); return abrir;
}
const serviçoFala = (p) => ({ forja: 'Preciso da forja.', loja: 'Quero ver o que você vende.', mercador: 'Quero ver o que você vende.', arena: 'Quero treinar na Arena.', biblioteca: 'Vim estudar.', templo: 'Vim buscar a bênção.', taverna: 'Quero uma refeição.', alquimista: 'Preciso de poções.', guarda: 'Vim falar com a guarda.', estalagem: 'Preciso de um quarto.', trilha: 'Quero correr na trilha.', prefeitura: 'Tenho algo a tratar com o prefeito.', igreja: 'Vim ao descanso sagrado.', abadia: 'Preciso de um cuidado.' }[p] || 'Preciso do seu serviço.');
async function menuEu(G, id, c, ret, nome) {
  const ops = sobreMim(id, c); const v = vistos(id); const r = rel(id);
  const op = await G.ui.dialogoEscolha({ nome, retrato: ret, texto: 'O que você quer me contar?', opcoes: [...ops.map((o) => ({ id: o.id, rot: o.rot, tom: o.tom, sub: v[o.id] ? 'já falei' : '' })), { id: 'volta', rot: 'Deixa pra lá.' }] });
  const o = ops.find((x) => x.id === op); if (!o) return;
  await G.ui.dialogo(nome, [`» ${o.rot}`, ...o.npc], { retrato: ret });
  if (!v[o.id]) { v[o.id] = true; r.afin = Math.min(12, r.afin + 1); G.ui.toast(`${nome.split(' · ')[0]} gostou de saber mais sobre você (Afinidade ${r.afin} ♥)`); darRecompensaAfin(G, r.afin, id, nome, ret); St.salvar(); }
}
async function darRecompensaAfin(G, afin, id, nome, ret) {
  const rec = AFIN_RECOMPENSAS[afin]; if (!rec) return; if (rec.ouro) St.ganharOuro(rec.ouro); if (rec.item) St.invAdd(rec.item); Au.sfx('coin');
  await G.ui.dialogo(nome, [`(${(NPCS[id] || {}).nome || 'Alguém'} ${rec.txt})`, `Afinidade ${afin} ♥ ${rec.ouro ? `+${rec.ouro} ouro` : ''}${rec.item ? ` + ${ITENS[rec.item] ? ITENS[rec.item].nome : rec.item}` : ''}`], { retrato: ret }); G.ui.hud();
}
async function papo(G, n, def, pf, ret, nome) {
  const a = rel(n.id), hoje = St.hoje();
  if (a.ultimo === hoje) { await G.ui.dialogo(nome, ['» Podemos conversar mais?', 'Já conversamos hoje. Volte amanhã — sempre tenho mais uma história.'], { retrato: ret }); return; }
  a.ultimo = hoje; a.afin = Math.min(12, a.afin + 1); const linha = pf.afin[((Math.max(1, a.afin) - 1) % pf.afin.length)]; await G.ui.dialogo(nome, ['» Me conta mais sobre você.', linha], { retrato: ret });
  await darRecompensaAfin(G, a.afin, n.id, nome, ret); St.salvar(); G.ui.hud();
}
async function falarMissao(G, npcId, qid, c, ret, nome) {
  const q = Camp.QUEST_POR_ID[qid], e = c.s.campanha.q[qid], F = QFALAS[qid] || {}; const pr = Camp.progressoQuest(c.s, q);
  if (e.est === 'feita') { await G.ui.dialogo(nome, [`» Sobre «${q.titulo}»…`, ...(F.feita || ['Você já cumpriu. Obrigado.'])], { retrato: ret }); return; }
  const linhas = [`» Sobre «${q.titulo}»…`, ...(F.ativa || [q.resumo])]; if (pr) linhas.push(`* Objetivo: ${pr.txt} (${pr.a}/${pr.n}) — passo ${pr.passo + 1}/${pr.de}.`);
  await G.ui.dialogo(nome, linhas, { retrato: ret });
}

// ---- Visitas do Rei ----
export function visitaPendente() {
  const s = S(); if (!s) return null; const H = s.historia; const v = (H.vistos ||= {}); const n = v.visitas | 0; const hoje = St.hoje();
  if (v.visitaDia !== hoje) { const esp = reiSabe(); if (esp) return esp; }
  const st = s.stats || {}; if (!(st.series || st.cardioMin || st.estudoMin || (H.limpos && H.limpos.length))) return null;
  if (n >= VISITAS.length || v.visitaDia === hoje || H.cap > 20) return null; const V = VISITAS[n]; if (s.heroi.nivel < V.nv) return null;
  if (n > 0 && H.inercia < 3 && (hoje.charCodeAt(hoje.length - 1) % 2)) return null; return V;
}
export async function visitaDoRei(G) {
  const V = visitaPendente(); if (!V) return false; const s = S(), H = s.historia, v = H.vistos; v.visitaDia = St.hoje(); if (V.especial) H.flags[V.flag] = true; else v.visitas = (v.visitas | 0) + 1; St.salvar(); G.ocupado = true;
  Au.tocarMusica && Au.tocarMusica('chefe'); const nome = 'Nhor-Kaal · Rei da Inércia';
  const ret = (G.retratoNhor && G.retratoNhor()) || null;
  await G.ui.dialogo(nome, V.txt, { retrato: ret });
  const op = await G.ui.dialogoEscolha({ nome, retrato: ret, texto: '...e então? Diga algo.', opcoes: V.op.map((o, i) => ({ id: String(i), rot: o.rot, tom: o.tom })) });
  const o = V.op[+op]; await G.ui.dialogo(nome, [`» ${o.rot}`, ...o.resp], { retrato: ret }); efeito(G, o.ef);
  Au.tocarMusica && Au.tocarMusica(G.modo === 'vale' ? 'mundo' : 'vila'); G.ocupado = false; return true;
}
// ---- Sonhos: ao dormir em casa, revê uma página do Diário ----
export async function sonho(G) {
  const s = S(), C = s.campanha, H = s.historia; const v = (H.vistos ||= {}); v.sonhos = v.sonhos || {}; const pg = C.lore.find((id) => !v.sonhos[id]); if (!pg) return false;
  const p = Camp.PAGINAS.find((x) => x.id === pg); v.sonhos[pg] = true; St.salvar();
  await G.ui.dialogo('Sonho', [...SONHOS_INTRO, `* «${p.t}»`, `* ${p.txt}`], { retrato: null });
  const op = await G.ui.dialogoEscolha({ nome: 'Sonho', texto: 'Você acorda com o coração acelerado. O que você pensa?', opcoes: [{ id: 'a', rot: 'Ele merecia piedade.', tom: 'Compaixão' }, { id: 'b', rot: 'Ele fez as próprias escolhas.', tom: 'Firmeza' }, { id: 'c', rot: 'Preciso treinar. Agora.', tom: 'Ação' }] });
  efeito(G, op === 'a' ? { moral: 2 } : op === 'b' ? { moral: 1 } : { moral: 2, insp: 0 }); G.ui.toast(op === 'c' ? 'Você acorda com vontade de se mexer.' : 'O sonho se desfaz, mas a ideia fica.'); return true;
}
// ---- Templo Âmbar ----
export async function dadiva(G) {
  const s = S(), H = s.historia; const v = (H.vistos ||= {}); v.ambar = v.ambar || { rec: 0, dia: '' }; const hoje = St.hoje();
  if (v.ambar.dia === hoje) { await G.ui.dialogo('Templo Âmbar', ['* Os altares estão apagados. Só voltam a brilhar amanhã.']); return; }
  const nome = 'Altar de Âmbar'; const ops = [...DADIVAS.map((d) => ({ id: d.id, rot: d.nome, sub: d.desc, tom: 'Aceitar' })), { id: 'recusa', rot: 'Recusar todas.', tom: 'Vitória' }];
  await G.ui.dialogo(nome, ['* O ar tem cheiro de resina. Três altares brilham em silêncio.', 'Poder sem suor. Basta tocar. Ninguém o saberá.'], { retrato: null });
  const op = await G.ui.dialogoEscolha({ nome, texto: 'O Emissário sussurra pela pedra: escolha.', opcoes: ops }); v.ambar.dia = hoje;
  if (op === 'recusa') { v.ambar.rec++; efeito(G, { moral: 4, insp: 1 }); await G.ui.dialogo(nome, ['» Não preciso de atalhos.', '* O âmbar racha. Nhor, de longe, desvia o olhar.'], { retrato: null });
    if (v.ambar.rec >= 3 && !H.flags.ambar_campeao) { efeito(G, { flag: 'ambar_campeao', lore: 'pg13', ouro: 120 }); await G.ui.dialogo(nome, ['* Três recusas. O templo inteiro estremece e um altar escondido se abre: dentro há uma bolsa pesada e uma página do Diário.'], { retrato: null }); } return; }
  const d = DADIVAS.find((x) => x.id === op); Au.sfx('coin'); const h = s.heroi; if (d.pega.tochas) h.tochas = Math.min(15, h.tochas + d.pega.tochas); if (d.pega.ouro) St.ganharOuro(d.pega.ouro); if (d.pega.cura) h.hp = R.derivar(s).hpMax;
  efeito(G, { inercia: 1, moral: -5 }); await G.ui.dialogo(nome, [`» Aceitar: ${d.nome}.`, '* O âmbar se derrete em você, quente. Depois o calor some, e fica um vazio.', 'Viu como é fácil? Volte amanhã.'], { retrato: null });
}
// ---- Teo ----
export async function teo(G) {
  const s = S(), H = s.historia; const nome = 'Teo · Menino da Casa Velha'; if (H.flags.teo_levantou) { await G.ui.dialogo(nome, ['* A cama está vazia e arrumada. Do lado de fora, ouve-se uma risada de criança.']); return; }
  const D = St.dia(); const ativo = !!(D && (D.series > 0 || D.cardio > 0 || D.estudo > 0));
  if (!ativo) { await G.ui.dialogo(nome, TEO.frio); await G.ui.dialogo('Dica', ['* Teo só vai levantar por quem se levantou hoje. Registre uma atividade (série, aeróbico ou estudo) e volte.']); return; }
  await G.ui.dialogo(nome, TEO.quente);
  const op = await G.ui.dialogoEscolha({ nome, texto: 'Se eu levantar só até a janela... você fica comigo?', opcoes: [{ id: 's', rot: 'Fico. Um passo de cada vez.', tom: 'Cuidar' }, { id: 'b', rot: 'Vou te contar de uma corrida que fiz hoje.', tom: 'Inspirar' }, { id: 'n', rot: 'Anda logo, levanta!', tom: 'Pressionar' }] });
  if (op === 'n') { await G.ui.dialogo(nome, ['» Anda logo, levanta!', '* Teo puxa o cobertor até os olhos.', '(A pressa só aumentou o peso. Tente com mais calma.)']); efeito(G, { moral: -1 }); return; }
  await G.ui.dialogo(nome, [op === 's' ? '» Fico. Um passo de cada vez.' : '» Hoje eu corri e quase desisti no meio. Mas dei mais um passo.', ...TEO.fim]); efeito(G, { flag: 'teo_levantou', moral: 4 });
}
