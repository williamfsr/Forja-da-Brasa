// Menu de pausa em papiro: Mapa (com missões rastreadas), Diário de Missões, Pessoas, Glossário, Herói, Crônica e Sistema.
// O registro da vida real (treino, dieta, hábitos…) mora no Diário Pessoal (diario.js), aberto pela fita "Diário".
import * as St from './store.js';
import * as Camp from './campanha.js';
import { QLUG } from './historia2.js';
import { LUG } from './world.js';
import { CAPS } from './mundo.js';
import { NPCS, CAPITULOS } from './story.js';
import { NPC_PERFIL, TEMPERAMENTOS } from './personalidade.js';
import { MONSTROS, ITENS, CLASSES } from './srd.js';
import { RAR_COR } from './conteudo.js';
import { registrar, abrirPainel, painelDef, painelId, fecharPainel, rerender, esc, fmt, pct, toast, $, $$, confirmar } from './uibase.js';
import { raridadeTag } from './uiutil.js';
import { G } from './game.js';
import * as Au from './audio.js';
import { retrato, spritePessoa } from './pessoa.js';
import { spriteMonstro } from './monstros.js';
import { idToken } from './tokens.js';
import { desenharMapaVale, alvosDaQuest, nomesDeLugar } from './mapaq.js';
import { htmlFicha, acoesFicha, slot, detalheItem, TIPO_NOME } from './ficha.js';
import { nivelNegociacao, NOMES_NEG, COMERCIANTES } from './economia.js';
import { acoesConfig, aoConfig, htmlConfig, posConfig } from './paineis2.js';

const S = () => St.S;
const LOCAIS = Camp.LOCAIS, PERSONAGENS = Camp.PERSONAGENS;

// ---------- estado da interface ----------
let aba = 'mapa'; const sub = { missoes: 'andamento', glos: 'monstros' };
let foco = null, todas = false, pessoaSel = null, monSel = null, itSel = null, lugSel = null, abrindo = false, trocou = false, zerarRolagem = false;
const usados = new WeakSet();
const ABAS = [
  ['mapa', '🗺️', 'Mapa', '#2f6a8a'], ['missoes', '📜', 'Missões', '#8a2a1a'], ['pessoas', '👥', 'Pessoas', '#7a4a8a'], ['glos', '📖', 'Glossário', '#3a7a4a'],
  ['heroi', '🛡️', 'Herói', '#a8742a'], ['cronica', '🕯️', 'Crônica', '#5a4a8a'], ['sistema', '⚙️', 'Sistema', '#5a5a5a'],
];

// ---------- bordas rasgadas do papiro (polígono fixo, em %) ----------
function poligonoRasgado() {
  let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const p = [];
  for (let i = 0; i <= 34; i++) p.push(`${(i * 100 / 34).toFixed(2)}% ${(r() * 0.9 + (i % 5 === 2 ? 0.5 : 0)).toFixed(2)}%`);
  for (let i = 1; i <= 22; i++) p.push(`${(100 - r() * 0.7).toFixed(2)}% ${(i * 100 / 22).toFixed(2)}%`);
  for (let i = 34; i >= 0; i--) p.push(`${(i * 100 / 34).toFixed(2)}% ${(100 - r() * 0.9 - (i % 6 === 3 ? 0.5 : 0)).toFixed(2)}%`);
  for (let i = 21; i >= 1; i--) p.push(`${(r() * 0.7).toFixed(2)}% ${(i * 100 / 22).toFixed(2)}%`);
  return p.join(',');
}
const RASGO = poligonoRasgado();

// ---------- imagens de pessoas e monstros ----------
const cacheRet = new Map();
const visNpc = (pf) => ({ nivel: 6, capaC: '#8a2a1a', capaC2: '#5a1a10', ...pf.vis });
export function imgPessoa(id, k = 4, busto = false) {
  const pf = NPC_PERFIL[id]; if (!pf) return null; const ch = `${id}|${k}|${busto}`; if (cacheRet.has(ch)) return cacheRet.get(ch);
  let c; try { c = busto ? retrato(pf.ap, visNpc(pf), k) : spritePessoa(pf.ap, visNpc(pf), 'baixo', 'idle'); } catch (e) { return null; }
  const u = { url: c.toDataURL(), w: c.width * (busto ? 1 : k), h: c.height * (busto ? 1 : k) }; cacheRet.set(ch, u); return u;
}
const imgHtml = (u, cls = '') => (u ? `<img class="${cls}" alt="" src="${u.url}" width="${u.w}" height="${u.h}">` : '');
const tokMon = (id) => { const t = idToken({ id }); return t ? `assets/tokens/mon/${t}.webp` : null; };
function fallbackMon(id) { const m = MONSTROS[id]; if (!m) return ''; try { return spriteMonstro(m.spr, {}, id, m.tags || [], null).toDataURL(); } catch (e) { return ''; } }
const imgMon = (id, cls = 'gl-ic') => { const t = tokMon(id); const fb = t ? '' : fallbackMon(id); return `<img class="${cls}" alt="" data-mon="${esc(id)}" loading="lazy" src="${t || fb}">`; };

// ---------- utilidades de dados ----------
const nomeNpc = (id) => (NPCS[id] || PERSONAGENS[id] || { nome: id }).nome;
const papelNpc = (id) => (NPCS[id] && NPCS[id].papel) || (PERSONAGENS[id] && PERSONAGENS[id].papel) || '';
const curto = (id) => nomeNpc(id).replace(/^(Mestra|Mestre|Dona|Irmã|Frei|Dra\.|Capitã|Prefeito|General|Sr\.|Seu)\s+/, '').split(' ')[0];
const dataBr = (d) => (d ? String(d).split('-').reverse().slice(0, 2).join('/') : '');
const RACAS = { humano: 'Humano', elfo: 'Elfo', meioelfo: 'Meio-elfo', anao: 'Anão', gnomo: 'Gnomo', halfling: 'Halfling', tiefling: 'Tiefling', draconato: 'Draconato', meioorc: 'Meio-orc' };
const TOWN = new Set(['brasa', 'ferrao', 'aurora', 'eruvim', 'tavi', 'lucia', 'quinzinho', 'alquimista', 'nhor']);
const noVale = () => G.modo === 'vale', naMasmorra = () => G.modo === 'masmorra';
const quests = () => Camp.QUESTS;
const estQ = (q) => (S().campanha.q[q.id] || {}).est || null;
const rastreando = (id) => (S().rastro || []).includes(id);

// ---------- cabeçalho / fitas ----------
const TITULOS = {
  mapa: () => ['Mapa do Vale', `Capítulo ${St.capituloDisponivel() || '—'} · ${esc(noVale() ? 'no Vale' : naMasmorra() ? 'em uma masmorra' : 'em Forjaluz')}`],
  missoes: () => ['Diário de Missões', `${Camp.ativas(S()).length} em andamento · ${Camp.feitas(S()).length} concluídas`],
  pessoas: () => ['Pessoas do Vale', `${conhecidos().length} conhecidos`],
  glos: () => ['Glossário', `${Object.keys(S().glos.mon).length} monstros · ${Object.keys(S().glos.it).length} itens`],
  heroi: () => ['Ficha do Herói', `${esc(S().heroi.nome)} · ${esc(CLASSES[S().heroi.cls].nome)} nível ${S().heroi.nivel}`],
  cronica: () => ['Crônica da Aventura', 'Moral, Maré da Inércia e capítulos'],
  sistema: () => ['Sistema', 'Perfil, metas, som e backup'],
};
function marcas(mobile) {
  const n = Camp.ativas(S()).length; const bt = (k, em, nome, cor) => `<button class="pp-marca ${aba === k ? 'sel' : ''}" style="--cor:${cor}" data-act="pp-aba" data-k="${k}" aria-label="${nome}"><span class="em">${em}</span><span class="lb">${nome}</span>${k === 'missoes' && n ? `<i class="pt">${n}</i>` : ''}</button>`;
  return ABAS.map(([k, em, nome, cor]) => bt(k, em, nome, cor)).join('') + `<button class="pp-marca diario" style="--cor:#5a3418" data-act="pp-diario" aria-label="Diário pessoal"><span class="em">📔</span><span class="lb">Diário</span></button>`;
  void mobile;
}

// ======================= ABA: MAPA =======================
function htmlMapa() {
  const tr = Camp.ativas(S()).filter((q) => rastreando(q.id)); const ativas = Camp.ativas(S());
  const lado = tr.length ? tr.map((q) => `<div class="mp-q ${q.tipo === 'principal' ? 'princ' : 'sec'} ${foco === q.id ? 'foco' : ''}"><div class="mp-qt"><span class="mp-ic">${q.tipo === 'principal' ? '★' : '◆'}</span><b>${esc(q.titulo)}</b></div>${txtPasso(q)}<div class="linha mp-qb"><button class="btn peq" data-act="foco" data-id="${q.id}">🔎 Destacar</button><button class="btn peq" data-act="rastrear" data-id="${q.id}">Parar</button></div></div>`).join('')
    : `<p class="suave">Nenhuma missão rastreada. Abra o <b>Diário de Missões</b> e toque em 📌 para ver o alvo no mapa e no minimapa.</p>`;
  return `<div class="mp"><div class="mp-mapa"><canvas id="pp-mapa" aria-label="Mapa do Vale"></canvas>
    <div class="mp-leg"><span><i class="lg p">★</i> Principal</span><span><i class="lg s">◆</i> Secundária</span><span><i class="lg h">●</i> Você</span><span><i class="lg n">▒</i> Região bloqueada</span></div>
    <p id="mp-cap" class="mp-cap">${lugSel ? lugSel : 'Toque em um lugar do mapa para ver o nome e a história dele.'}</p></div>
    <div class="mp-lado"><h3>Missões rastreadas</h3>${lado}
    ${ativas.length > tr.length ? `<label class="mp-tog"><input type="checkbox" data-on="todas" data-reset ${todas ? 'checked' : ''}> mostrar também as ${ativas.length - tr.length} não rastreadas (apagadas)</label>` : ''}
    <div class="linha mp-bt">${!naMasmorra() ? '<button class="btn bloco" data-act="viagem">🧭 Viagem rápida</button>' : '<button class="btn ruim bloco" data-act="sair">🚪 Sair da masmorra</button>'}<button class="btn bloco" data-act="pp-sub-missoes">📜 Abrir diário de missões</button></div></div></div>`;
}
let infoMapa = null;
function desenharMapa() {
  const cv = $('#pp-mapa'); if (!cv) return; try { infoMapa = desenharMapaVale(cv, { larg: 960, foco, todas, G }); } catch (e) { console.warn('mapa', e); return; }
  cv.addEventListener('click', (ev) => {
    if (!infoMapa) return; const r = cv.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width * infoMapa.m.w, y = (ev.clientY - r.top) / r.height * infoMapa.m.h; const ativo = St.capituloDisponivel() || 1; const vis = G.visitados();
    let melhor = null, dm = 7;
    for (const [k, l] of Object.entries(LUG)) { const d = Math.hypot(l.x - x, l.y - y); if (d < dm) { dm = d; melhor = { k, nome: l.nome, x: l.x, y: l.y, conhecido: k === 'vila' || vis[k] || (l.n || 0) <= ativo }; } }
    for (const [n, c] of Object.entries(CAPS)) { const d = Math.hypot(c.x - x, c.y - y); if (d < dm) { dm = d; const cap = CAPITULOS[n - 1]; melhor = { nome: `Capítulo ${n}: ${cap ? cap.local : ''}`, conhecido: +n <= ativo, cap: true }; } }
    const cap = $('#mp-cap'); if (!cap) return;
    if (!melhor) lugSel = 'Terras selvagens do Vale. A Névoa cobre o que ainda não foi explorado.';
    else if (!melhor.conhecido) lugSel = '🔒 Um lugar que você ainda não conhece. Avance nos capítulos para clareá-lo.';
    else { const chave = { vila: 'forjaluz', ambar: 'templo', cidadela: 'trono' }[melhor.k] || melhor.k; const txt = LOCAIS[chave] ? LOCAIS[chave].txt : ''; lugSel = `📍 <b>${esc(melhor.nome)}</b>${txt ? ` — ${esc(txt)}` : ''}`; }
    cap.innerHTML = lugSel; Au.sfx('select');
  });
}
function txtPasso(q) {
  const s = S(), e = s.campanha.q[q.id]; if (!e) return ''; const pr = Camp.progressoQuest(s, q); if (!pr) return '';
  const lug = nomesDeLugar(q); const alvo = alvosDaQuest(q).find((a) => a.cap); const onde = [alvo ? alvo.nome : '', ...lug].filter(Boolean);
  return `<p class="mp-passo">${esc(pr.txt)}</p><div class="prog"><i style="width:${pct(pr.a, pr.n)}%"></i></div><p class="peq suave">${Math.floor(pr.a)}/${pr.n}${onde.length ? ` · 📍 ${esc(onde.slice(0, 2).join(' → '))}` : ''}</p>`;
}

// ======================= ABA: MISSÕES =======================
function cartaQuest(q) {
  const s = S(), e = s.campanha.q[q.id]; const feita = !!e && e.est === 'feita'; const ip = feita ? q.passos.length : (e ? e.passo : 0); const trk = rastreando(q.id);
  const pr = e && !feita ? Camp.progressoQuest(s, q) : null; const rec = q.rec || {};
  const passos = q.passos.map((p, i) => {
    if (i < ip) return `<li class="ok">✔ ${esc(p.txt)}</li>`;
    if (i === ip && pr) return `<li class="at"><b>➤ ${esc(p.txt)}</b><div class="prog"><i style="width:${pct(pr.a, pr.n)}%"></i></div><span class="peq suave">${Math.floor(pr.a)}/${pr.n}</span></li>`;
    return `<li class="fut">◦ ${i === ip + 1 ? 'Um próximo passo se revelará…' : '…'}</li>`;
  }).join('');
  const prem = [rec.ouroK ? '💰 ouro' : '', rec.item ? `🎁 ${esc((ITENS[rec.item] || { nome: 'item' }).nome)}` : '', rec.lore ? '📖 página do diário de Nhor' : '', rec.reliquia ? '🔱 relíquia' : '', rec.moral ? '🏘️ moral da vila' : '', rec.leitura ? '🃏 leitura do Baralho' : ''].filter(Boolean);
  const onde = nomesDeLugar(q);
  return `<div class="qd ${q.tipo === 'principal' ? 'princ' : 'sec'} ${feita ? 'feita' : ''} ${trk ? 'trk' : ''}"><div class="qd-cab"><span class="qd-ic">${feita ? '✔' : q.tipo === 'principal' ? '★' : '◆'}</span><div class="qd-tit"><b>${esc(q.titulo)}</b><small>${q.tipo === 'principal' ? 'Missão principal' : 'Missão secundária'} · pedida por ${esc(nomeNpc(q.npc))}${onde.length ? ` · 📍 ${esc(onde.join(' → '))}` : ''}</small></div></div>
    <p class="qd-res">${esc(q.resumo)}</p><ul class="qd-pass">${passos}</ul>${prem.length ? `<p class="qd-rec peq"><b>Recompensa:</b> ${prem.join(' · ')}</p>` : ''}
    ${feita ? '' : `<div class="linha qd-bt"><button class="btn peq ${trk ? 'pri' : ''}" data-act="rastrear" data-id="${q.id}">${trk ? '📌 Rastreando' : '📍 Rastrear'}</button><button class="btn peq" data-act="ver-mapa" data-id="${q.id}">🗺️ Ver no mapa</button></div>`}</div>`;
}
function htmlMissoes() {
  const s = S(), C = s.campanha; const at = Camp.ativas(s), fe = Camp.feitas(s); const bloq = quests().filter((q) => !C.q[q.id]);
  const subs = [['andamento', `Em andamento (${at.length})`], ['feitas', `Concluídas (${fe.length})`], ['descobrir', 'A descobrir']];
  let h = `<div class="pp-sub">${subs.map(([k, n]) => `<button class="${sub.missoes === k ? 'sel' : ''}" data-act="pp-sub" data-g="missoes" data-k="${k}">${n}</button>`).join('')}</div>`;
  if (sub.missoes === 'andamento') {
    const pr = at.filter((q) => q.tipo === 'principal'), se = at.filter((q) => q.tipo !== 'principal');
    h += `<p class="peq suave">Toque em <b>📍 Rastrear</b> para marcar a missão no mapa e no minimapa: ★ amarela para principais, ◆ azul para secundárias.</p>`;
    h += `<h3>★ Principais</h3>${pr.map(cartaQuest).join('') || '<p class="suave">Nenhuma missão principal ativa. Suba de nível e avance nos capítulos.</p>'}<h3>◆ Secundárias</h3>${se.map(cartaQuest).join('') || '<p class="suave">Nenhuma missão secundária ativa. Converse com os moradores do Vale.</p>'}`;
  } else if (sub.missoes === 'feitas') h += fe.map(cartaQuest).join('') || '<p class="suave">Ainda não há missões concluídas.</p>';
  else h += `<p class="peq suave">Pistas de histórias que ainda vão se abrir conforme você sobe de nível e cumpre as anteriores.</p>${bloq.slice(0, 8).map((q) => { const quase = q.nv <= s.heroi.nivel + 1; return `<div class="qd bloq"><div class="qd-cab"><span class="qd-ic">🔒</span><div class="qd-tit"><b>${quase ? esc(q.titulo) : '???'}</b><small>${q.tipo === 'principal' ? 'Principal' : 'Secundária'} · nível ${q.nv}${quase ? ` · ${esc(nomeNpc(q.npc))}` : ''}</small></div></div></div>`; }).join('')}`;
  return h;
}

// ======================= ABA: PESSOAS =======================
function conhecidos() {
  const s = S(); const ids = new Set();
  for (const id of Object.keys(NPCS)) { const r = s.npcs[id]; if (TOWN.has(id) || (r && (r.viu || r.afin || r.rom || r.ini || r.perdido || (r.memo && r.memo.length)))) ids.add(id); }
  for (const q of quests()) if (s.campanha.q[q.id] && PERSONAGENS[q.npc]) ids.add(q.npc);
  const lidas = Camp.PAGINAS.filter((p) => s.campanha.lore.includes(p.id)).map((p) => p.txt).join(' '); if (/Kaal/.test(lidas)) ids.add('kaal'); if (/Aélis/.test(lidas)) ids.add('aelis');
  const par = s.historia.par && s.historia.par.id; if (par) ids.add(par);
  return [...ids].filter((id) => NPCS[id] || PERSONAGENS[id]).sort((a, b) => {
    const ra = s.npcs[a] || {}, rb = s.npcs[b] || {}; const pa = s.historia.par && s.historia.par.id === a ? 1 : 0, pb = s.historia.par && s.historia.par.id === b ? 1 : 0;
    return pb - pa || (rb.afin | 0) - (ra.afin | 0) || nomeNpc(a).localeCompare(nomeNpc(b), 'pt');
  });
}
const LIMIAR = [2, 5, 8];
function estagio(id) {
  const s = S(), r = s.npcs[id] || { afin: 0 }, af = r.afin | 0; const par = s.historia.par && s.historia.par.id === id ? s.historia.par : null;
  if (r.perdido) return { rot: 'Perdido(a)', cor: '#6a5a6a', t: `${curto(id)} foi levado(a) pela Inércia. Resta a lembrança.` };
  if ((r.ini | 0) > 0) return { rot: 'Inimigo(a)', cor: '#a82a2a', t: `Algo se quebrou entre vocês e ${curto(id)} agora o(a) vê como ameaça.` };
  if (par) return { rot: par.tipo === 'casado' ? 'Cônjuge' : 'Namorado(a)', cor: '#c0407a', t: `Vocês ${par.tipo === 'casado' ? 'são casados' : 'estão juntos'}${par.desde ? ` desde ${dataBr(par.desde)}` : ''}.` };
  const d = [[-99, 'Hostil', '#a82a2a', 'só consegue ver em você mais uma ameaça'], [-4, 'Neutro', '#7a6a4a', 'ainda mede cada palavra sua; uma conversa por dia derrete o gelo'], [2, 'Conhecido', '#5a8a3a', 'já guarda seu nome e começa a contar com você'], [5, 'Próximo', '#3a8a5a', 'deixou de ser só um conhecido e se preocupa quando você demora a voltar'], [8, 'Amigo', '#2a7a9a', 'confia em você como em pouca gente e começa a contar o que não conta a ninguém'], [12, 'Confidente', '#2a5aaa', 'é hoje parte da família que você escolheu']];
  let cur = d[0]; for (const x of d) if (af >= x[0]) cur = x;
  return { rot: cur[1], cor: cur[2], t: `${curto(id)} ${cur[3]}.` };
}
function becoming(id) {
  const s = S(), r = s.npcs[id] || { afin: 0 }, af = r.afin | 0; const est = estagio(id); const qs = quests().filter((q) => q.npc === id && s.campanha.q[q.id]); const feitas = qs.filter((q) => estQ(q) === 'feita').length; const parts = [est.t];
  if (qs.length) parts.push(feitas === qs.length ? `Você já cumpriu ${feitas === 1 ? 'o pedido' : `todos os ${feitas} pedidos`} de ${curto(id)}.` : `Há ${qs.length - feitas} pedido(s) de ${curto(id)} em aberto.`);
  const prox = LIMIAR.find((n) => af < n); if (!r.perdido && !(r.ini > 0) && prox !== undefined && NPC_PERFIL[id]) parts.push(`Com afinidade ${prox}, ${curto(id)} deve contar outra história.`);
  if (af >= 8 && !r.ini) parts.push('Esse laço já pesa nas decisões que você toma no Vale.');
  return parts.join(' ');
}
function merchantLoja(id) { return Object.entries(COMERCIANTES).find(([, c]) => c.npc === id); }
function detalhePessoa(id) {
  const s = S(), r = s.npcs[id] || { afin: 0 }, pf = NPC_PERFIL[id], af = r.afin | 0; const est = estagio(id); const u = imgPessoa(id, 5);
  const hist = pf ? pf.afin.map((t, i) => (af >= (LIMIAR[i] ?? 99) ? `<blockquote>“${esc(t)}”</blockquote>` : `<div class="pe-trava">🔒 Uma história ${i === 0 ? 'curta' : i === 1 ? 'mais íntima' : 'que poucos ouvem'} — afinidade ${LIMIAR[i]}.</div>`)).join('') : '';
  const qs = quests().filter((q) => q.npc === id && s.campanha.q[q.id]);
  const mem = (r.memo || []).slice().reverse(); const m = merchantLoja(id);
  let comerc = ''; if (m) { const [lk, c] = m; const rel = St.relComerciante(lk); const cx = St.caixaLoja(lk); comerc = `<div class="pe-sec"><h4>🛒 Negócios</h4><p class="peq">Afinidade de negociação: <b>${esc(NOMES_NEG[rel.nivel])}</b> (nível ${rel.nivel}/5). Compra por ${esc(c.aceita.map((t) => TIPO_NOME[t] || t).join(', ').toLowerCase())}. Caixa de hoje: ${fmt(cx.resta)} de ${fmt(cx.max)} 🪙.</p></div>`; }
  return `<div class="pe-det"><button class="btn peq pe-volta" data-act="pe-volta">← Pessoas</button>
    <div class="pe-cab"><div class="pe-ret">${u ? imgHtml(u, 'pe-img') : '<span class="pe-em">👤</span>'}</div><div class="pe-tit"><h3>${esc(nomeNpc(id))}</h3><p class="suave">${esc(papelNpc(id))}</p>
    <div class="pe-chips">${pf ? `<span class="chip">${esc(RACAS[pf.raca] || pf.raca)}</span><span class="chip">${esc((TEMPERAMENTOS[pf.tmp] || { nome: pf.tmp }).nome)}</span>` : ''}<span class="chip" style="border-color:${est.cor};color:${est.cor}">${esc(est.rot)}</span></div>
    <div class="pe-af"><span>Afinidade ${af}</span><div class="prog"><i style="width:${pct(af + 10, 22)}%;${af < 0 ? 'background:linear-gradient(#c04040,#802020)' : ''}"></i></div>${(r.rom | 0) > 0 ? `<span>Romance ${r.rom | 0}/15 ♥</span><div class="prog"><i style="width:${pct(r.rom, 15)}%;background:linear-gradient(#e0609a,#a02a60)"></i></div>` : ''}</div></div></div>
    ${pf ? `<div class="pe-sec"><h4>Primeira impressão</h4><p>${esc(pf.gosta)}</p></div>` : ''}
    <div class="pe-sec"><h4>No que está se tornando</h4><p>${esc(becoming(id))}</p></div>
    ${hist ? `<div class="pe-sec"><h4>O que ${esc(curto(id))} já contou</h4>${hist}</div>` : ''}
    ${qs.length ? `<div class="pe-sec"><h4>Missões com ${esc(curto(id))}</h4>${qs.map((q) => `<div class="pe-q"><span>${estQ(q) === 'feita' ? '✔' : q.tipo === 'principal' ? '★' : '◆'}</span><b>${esc(q.titulo)}</b><small>${estQ(q) === 'feita' ? 'concluída' : 'em andamento'}</small></div>`).join('')}</div>` : ''}
    <div class="pe-sec"><h4>O que vocês viveram</h4>${mem.length ? `<ul class="pe-mem">${mem.map((x) => `<li><small>${dataBr(x.d)}</small> ${esc(x.t)}</li>`).join('')}</ul>` : '<p class="suave">Nada registrado ainda. Converse, ajude, presenteie: cada gesto vira uma lembrança aqui.</p>'}</div>${comerc}</div>`;
}
function htmlPessoas() {
  const ids = conhecidos(); const total = Object.keys(NPCS).length + Object.keys(PERSONAGENS).filter((k) => !NPCS[k]).length;
  const lista = ids.map((id) => { const u = imgPessoa(id, 3, true); const est = estagio(id); return `<button class="pe-card ${pessoaSel === id ? 'sel' : ''}" data-act="pessoa" data-id="${id}"><span class="pe-mini">${u ? imgHtml(u, 'pe-bu') : '<span class="pe-em">👤</span>'}</span><span class="pe-nm"><b>${esc(nomeNpc(id))}</b><small>${esc(papelNpc(id) || 'morador')}</small></span><span class="pe-tag" style="background:${est.cor}">${esc(est.rot)}</span></button>`; }).join('');
  return `<div class="pe ${pessoaSel ? 'tem-sel' : ''}"><div class="pe-lista"><p class="peq suave">Quem você conheceu no Vale, o que viveram e no que cada laço está se tornando.</p>${lista}${ids.length < total - 6 ? '<p class="peq suave">Há mais gente por aí, esperando para ser conhecida…</p>' : ''}<button class="btn bloco" data-act="relacoes">💞 Relações e romance</button></div>
    <div class="pe-painel">${pessoaSel && (NPCS[pessoaSel] || PERSONAGENS[pessoaSel]) ? detalhePessoa(pessoaSel) : '<div class="pe-vazio"><span>📜</span><p>Selecione alguém da lista para ler sua história.</p></div>'}</div></div>`;
}

// ======================= ABA: GLOSSÁRIO =======================
function htmlGlos() {
  const s = S(), g = s.glos; const subs = [['monstros', `🐺 Monstros (${Object.keys(g.mon).length})`], ['itens', `🎒 Itens (${Object.keys(g.it).length})`], ['lugares', '📍 Lugares'], ['lore', '📖 Lore']];
  let h = `<div class="pp-sub">${subs.map(([k, n]) => `<button class="${sub.glos === k ? 'sel' : ''}" data-act="pp-sub" data-g="glos" data-k="${k}">${n}</button>`).join('')}</div>`;
  if (sub.glos === 'monstros') {
    const ids = Object.keys(g.mon).filter((id) => MONSTROS[id]).sort((a, b) => MONSTROS[a].cr - MONSTROS[b].cr || MONSTROS[a].n.localeCompare(MONSTROS[b].n, 'pt'));
    if (!ids.length) return h + '<p class="suave">Nenhum monstro catalogado ainda. Enfrente criaturas nas masmorras e no Vale: cada nova espécie vira uma página aqui.</p>';
    const crTxt = (cr) => (cr === 0.125 ? '1/8' : cr === 0.25 ? '1/4' : cr === 0.5 ? '1/2' : String(cr));
    const det = monSel && MONSTROS[monSel] && g.mon[monSel] ? detMon(monSel) : '';
    h += `<div class="gl"><div class="gl-grade">${ids.map((id) => `<button class="gl-mon ${monSel === id ? 'sel' : ''}" data-act="g-mon" data-id="${esc(id)}">${imgMon(id)}<span class="gl-nm">${esc(MONSTROS[id].n)}</span><span class="gl-cr">ND ${crTxt(MONSTROS[id].cr)}</span>${g.mon[id].k ? `<i class="gl-k">☠${g.mon[id].k}</i>` : ''}</button>`).join('')}</div><div class="gl-det">${det || '<p class="peq suave">Toque em um monstro para ver a ficha dele.</p>'}</div></div>`;
  } else if (sub.glos === 'itens') {
    const ids = Object.keys(g.it).filter((id) => ITENS[id]).sort((a, b) => ITENS[a].tipo.localeCompare(ITENS[b].tipo) || ['comum', 'incomum', 'raro', 'épico', 'lendário'].indexOf(ITENS[b].raro) - ['comum', 'incomum', 'raro', 'épico', 'lendário'].indexOf(ITENS[a].raro) || ITENS[a].nome.localeCompare(ITENS[b].nome, 'pt'));
    if (!ids.length) return h + '<p class="suave">Nenhum item catalogado ainda.</p>';
    const det = itSel && ITENS[itSel] ? detalheItem(itSel, '', { extra: `<p class="peq suave">Descoberto em ${dataBr(g.it[itSel] && g.it[itSel].d)}${St.invQtd(itSel) ? ` · você tem ×${St.invQtd(itSel)}` : ''}.</p>` }) : '';
    h += `<div class="fc-inv"><div class="sl-grade">${ids.map((id) => slot(id, { act: 'g-item', sel: itSel === id })).join('')}</div>${det ? `<div class="fc-det">${det}</div>` : '<p class="peq suave fc-dica">Toque em um item para ler a descrição.</p>'}</div>`;
  } else if (sub.glos === 'lugares') {
    const ativo = St.capituloDisponivel() || 1; const vis = G.visitados();
    h += Object.entries(LUG).map(([k, l]) => { const ok = k === 'vila' || vis[k] || (l.n || 0) <= ativo; const chave = { vila: 'forjaluz', ambar: 'templo', cidadela: 'trono' }[k] || k; const lo = LOCAIS[chave]; return ok ? `<div class="card"><h4><span>📍 ${esc(l.nome)}</span>${vis[k] ? '<small>visitado</small>' : ''}</h4>${lo ? `<p class="peq">${esc(lo.txt)}</p>` : ''}</div>` : `<div class="lista-item" style="opacity:.5"><span class="fixo">🔒</span><div class="nome"><b>Lugar desconhecido</b><small>Avance nos capítulos</small></div></div>`; }).join('');
    h += `<h3>Regiões sombrias</h3>${['nevoa', 'casa'].map((k) => `<div class="card"><h4><span>${esc(LOCAIS[k].nome)}</span></h4><p class="peq">${esc(LOCAIS[k].txt)}</p></div>`).join('')}`;
  } else h += htmlLore();
  return h;
}
function detMon(id) {
  const m = MONSTROS[id], e = S().glos.mon[id]; const crTxt = m.cr === 0.125 ? '1/8' : m.cr === 0.25 ? '1/4' : m.cr === 0.5 ? '1/2' : m.cr;
  const atq = (m.atq || []).slice(0, 4).map((a) => `${esc(a.n)} (${esc(a.d)})`).join(' · ');
  return `<div class="det gl-d"><div class="det-ic gl-big">${imgMon(id, 'gl-img')}</div><div class="det-txt"><h4>${esc(m.n)}</h4>${m.en && m.en !== m.n ? `<p class="peq suave">${esc(m.en)}</p>` : ''}
    <div class="det-tags"><span class="tag" style="background:#7a3a2a">ND ${crTxt}</span>${m.tp ? `<span class="tag" style="background:#5a4a7a">${esc(m.tp)}</span>` : ''}${m.tam ? `<span class="tag" style="background:#4a6a5a">${{ peq: 'Pequeno', med: 'Médio', gra: 'Grande', enor: 'Enorme', garg: 'Imenso' }[m.tam] || esc(m.tam)}</span>` : ''}</div>
    <p class="det-stat">❤️ ${m.hp} PV · 🛡️ CA ${m.ca}${m.vel ? ` · 🥾 ${m.vel * 1.5} m` : ''}</p>${atq ? `<p class="peq">⚔️ ${atq}</p>` : ''}${m.tr && m.tr.length ? `<p class="peq">✦ ${esc(m.tr.join(', '))}</p>` : ''}${m.al ? `<p class="peq suave">Tendência: ${esc(m.al)}</p>` : ''}
    <p class="peq suave">Visto ${e.v + e.k}× desde ${dataBr(e.d)}${e.k ? ` · derrotado ${e.k}×` : ''}.</p></div></div>`;
}
function htmlLore() {
  const s = S(), C = s.campanha; const L = C.leitura; let h = '';
  h += `<h3>🃏 Baralho do Hábito</h3>`;
  if (!L) h += '<p class="suave">Dona Ordália ainda não leu o Baralho para você. Conclua a missão <b>O Baralho do Hábito</b> (nível 5).</p>';
  else {
    const linha = (nome, cap, dica, ok) => `<div class="card"><h4><span>${ok ? '✅' : '🃏'} ${esc(nome)}</span><small>${cap ? 'Cap. ' + cap + ' — ' + esc(Camp.SITIOS[cap].nome) : ''}</small></h4><p class="peq suave">${esc(dica)}</p></div>`;
    h += `<p class="peq suave">Ciclo ${L.ciclo}. As cartas mudam a cada Laço do Tempo.</p>`;
    for (const k of ['sol', 'simbolo', 'diario']) h += linha(Camp.RELIQUIAS[k].nome, L[k], Camp.SITIOS[L[k]].dica + ' — ' + Camp.RELIQUIAS[k].txt, !!C.rel[k]);
    const a = Camp.ALIADOS[L.aliado]; h += linha(a.nome, L.aliadoCap, a.dica, s.companheiros.some((c) => c.aliadoId === L.aliado));
    h += `<p class="peq suave">Relíquias em mãos: ${Camp.nReliquias(s)}/3. Cada uma enfraquece Nhor-Kaal em 8% de PV.</p>`;
  }
  const lidas = Camp.PAGINAS.filter((p) => C.lore.includes(p.id));
  h += `<h3>📖 Diário de Nhor (${lidas.length}/${Camp.PAGINAS.length})</h3><p class="peq suave">Páginas aparecem ao vencer capítulos e concluir missões.</p>`;
  h += Camp.PAGINAS.map((p) => (C.lore.includes(p.id) ? `<div class="card"><h4><span>${esc(p.t)}</span></h4><p class="peq">${esc(p.txt)}</p></div>` : '<div class="lista-item" style="opacity:.4"><span class="fixo">▒</span><div class="nome"><b>Página perdida</b></div></div>')).join('');
  return h;
}

// ======================= ABAS: HERÓI, CRÔNICA, SISTEMA =======================
function htmlHeroi() {
  const d = St.der();
  return `${htmlFicha()}<div class="linha pp-extra"><button class="btn peq" data-act="aparencia">🎨 Aparência do herói</button>${d.conj ? '<button class="btn peq" data-act="grimorio">✨ Grimório</button>' : ''}</div>`;
}
const htmlCronica = () => { const d = painelDef('livro'); return d ? d.render() : ''; };
function htmlSistema() {
  return `<div class="linha pp-extra"><button class="btn peq" data-act="aparencia">🎨 Aparência</button><button class="btn peq" data-act="ajuda">❓ Como jogar</button>${!naMasmorra() ? '<button class="btn peq" data-act="viagem">🧭 Viagem rápida</button>' : '<button class="btn peq ruim" data-act="sair">🚪 Sair da masmorra</button>'}<button class="btn peq" data-act="pp-diario">📔 Diário pessoal</button></div>${htmlConfig()}`;
}
const CORPO = { mapa: htmlMapa, missoes: htmlMissoes, pessoas: htmlPessoas, glos: htmlGlos, heroi: htmlHeroi, cronica: htmlCronica, sistema: htmlSistema };

// ======================= PAINEL =======================
const livro = () => (painelDef('livro') || {}).acoes || {};
registrar('menu', {
  titulo: 'Menu',
  classe: 'papiro',
  rolagem: '.pp-conteudo',
  render(a) {
    if (a && !usados.has(a)) { usados.add(a); if (a.aba) { aba = a.aba === 'diario' ? 'missoes' : a.aba; abrindo = true; } if (a.sub) sub[aba === 'glos' ? 'glos' : 'missoes'] = a.sub; if (a.foco !== undefined) foco = a.foco; if (a.pessoa) pessoaSel = a.pessoa; }
    if (!CORPO[aba]) aba = 'mapa';
    const [t, st] = TITULOS[aba](); const novo = abrindo ? 'pp-novo' : ''; const fade = trocou ? 'pp-troca' : '';
    return `<div class="pp ${novo}" data-aba="${aba}"><div class="pp-rolo cima"></div>
      <div class="pp-folha"><header class="pp-cab"><h2>${esc(t)}<small>${st}</small></h2><button class="pp-selo" data-act="fechar" aria-label="Fechar">✕</button></header><div class="pp-orna"></div>
      <nav class="pp-marcas-m">${marcas(true)}</nav><div class="pp-conteudo ${fade}">${CORPO[aba]()}</div></div>
      <nav class="pp-marcas">${marcas(false)}</nav><div class="pp-rolo baixo"></div></div>`;
  },
  aoAbrir(a, de) {
    $('#painel').style.setProperty('--rasgo', RASGO); abrindo = false; trocou = false;
    if (zerarRolagem) { const c = $('.pp-conteudo'); if (c) c.scrollTop = 0; zerarRolagem = false; }
    if (aba === 'mapa') desenharMapa(); if (aba === 'sistema') posConfig();
    if (aba === 'glos' && sub.glos === 'monstros') $$('img[data-mon]').forEach((im) => im.addEventListener('error', () => { const f = fallbackMon(im.dataset.mon); if (f && im.src !== f) im.src = f; }, { once: true }));
    void de;
  },
  ao: {
    ...aoConfig,
    todas: (el) => { todas = el.checked; desenharMapa(); },
  },
  acoes: {
    ...acoesFicha, ...acoesConfig,
    ...Object.fromEntries(['prologo', 'ciclo', 'previa-hora', 'previa-tempo', 'explorador'].map((k) => [k, (el, e) => { const f = livro()[k]; if (f) f(el, e); }])),
    'pp-aba': (el) => { if (aba === el.dataset.k) return; aba = el.dataset.k; trocou = true; zerarRolagem = true; Au.sfx('select'); rerender(); },
    'pp-diario': () => abrirPainel('pessoal'),
    'pp-sub': (el) => { sub[el.dataset.g] = el.dataset.k; zerarRolagem = true; rerender(); },
    'pp-sub-missoes': () => { aba = 'missoes'; trocou = true; zerarRolagem = true; rerender(); },
    rastrear: (el) => { const on = St.rastrear(el.dataset.id); toast(on ? '📌 Missão rastreada: aparece no mapa e no minimapa.' : 'Missão deixou de ser rastreada.'); rerender(); },
    'ver-mapa': (el) => { if (!rastreando(el.dataset.id)) St.rastrear(el.dataset.id, true); foco = el.dataset.id; aba = 'mapa'; trocou = true; zerarRolagem = true; rerender(); },
    foco: (el) => { foco = foco === el.dataset.id ? null : el.dataset.id; rerender(); },
    pessoa: (el) => { pessoaSel = el.dataset.id; zerarRolagem = true; rerender(); },
    'pe-volta': () => { pessoaSel = null; zerarRolagem = true; rerender(); },
    relacoes: () => abrirPainel('coracoes'),
    'g-mon': (el) => { monSel = monSel === el.dataset.id ? null : el.dataset.id; rerender(); },
    'g-item': (el) => { itSel = itSel === el.dataset.id ? null : el.dataset.id; rerender(); },
    viagem: () => abrirPainel('viagem'),
    ajuda: () => abrirPainel('ajuda'),
    aparencia: () => abrirPainel('casa', { aba: 'ap' }),
    grimorio: () => abrirPainel('grimorio'),
    sair: async () => { fecharPainel(); if (G.D && G.D.d) { const ok = await confirmar('Sair da masmorra?', 'Você sobe à superfície. O capítulo continua do andar atual (nova Tocha para voltar).', 'Sair', 'Ficar'); if (ok) G.sair(); } },
  },
});
// setas ← → e Q/E trocam de fita enquanto o menu está aberto
document.addEventListener('keydown', (e) => {
  if (painelId() !== 'menu' || /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) return;
  const i = ABAS.findIndex((a) => a[0] === aba); let d = 0; if (e.key === 'ArrowRight' || e.key === 'e' || e.key === 'E') d = 1; else if (e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'Q') d = -1; if (!d) return;
  aba = ABAS[(i + d + ABAS.length) % ABAS.length][0]; trocou = true; zerarRolagem = true; Au.sfx('select'); rerender(); e.preventDefault();
});
void raridadeTag; void RAR_COR; void nivelNegociacao;
