// Ficha do herói em estilo RPG: boneco visto de frente com os slots de equipamento ao redor, mochila em slots quadrados com ícones,
// descrição do item selecionado, aba de habilidades (classe e magias), atributos e conquistas. Usada pelo menu de pausa e pela Casa.
import * as St from './store.js';
import * as R from './rules.js';
import { CLASSES, ITENS, ATRIBUTOS, ATR_NOME, MAGIAS } from './srd.js';
import { GRUPOS_TREINO, ATR_FONTE, CONQUISTAS, RAR_COR } from './conteudo.js';
import { esc, fmt, toast, rerender } from './uibase.js';
import { tierTag, barra, descItem, raridadeTag, catIcone, recursosHtml } from './uiutil.js';
import { precoVenda } from './economia.js';
import * as Rn from './render.js';
import * as Au from './audio.js';

const S = () => St.S;
export const TIPO_NOME = { arma: 'Arma', armadura: 'Armadura', escudo: 'Escudo', acessorio: 'Acessório', consumivel: 'Consumível', comida: 'Comida', tesouro: 'Tesouro' };
export const EQUIPAVEL = ['arma', 'armadura', 'escudo', 'acessorio'];
const ORDEM_TIPO = ['arma', 'armadura', 'escudo', 'acessorio', 'consumivel', 'comida', 'tesouro'];
const ORDEM_RAR = ['comum', 'incomum', 'raro', 'épico', 'lendário'];
export const urlIcone = (it) => `assets/ic/items/${catIcone(it)}.webp`;

// ---------- componentes ----------
export function slot(id, { n = 0, sel = false, eq = false, act = 'f-sel', off = false, extra = '', tam = '' } = {}) {
  const it = ITENS[id]; if (!it) return '';
  return `<button class="sl ${sel ? 'sel' : ''} ${eq ? 'eq' : ''} ${off ? 'off' : ''} ${tam}" data-act="${act}" data-id="${esc(id)}" ${extra} style="--rar:${RAR_COR[it.raro] || '#8a6a3a'}" aria-label="${esc(it.nome)}"><img class="sl-ic" alt="" loading="lazy" src="${urlIcone(it)}">${n > 1 ? `<span class="qt">${n}</span>` : ''}${eq ? '<span class="eqm">E</span>' : ''}</button>`;
}
export const slotVazio = (rot = '', tam = '') => `<div class="sl vazio ${tam}" aria-hidden="true">${rot ? `<span class="sl-rot">${esc(rot)}</span>` : ''}</div>`;
// slot "de emoji" (habilidades e magias não têm arte de item)
export function slotEmoji(chave, emoji, { sel = false, off = false, act, cor = '#8a6a3a', n = '', nome = '' } = {}) {
  return `<button class="sl com-nome ${sel ? 'sel' : ''} ${off ? 'off' : ''}" data-act="${act}" data-id="${esc(chave)}" style="--rar:${cor}" aria-label="${esc(nome || chave)}" title="${esc(nome)}"><span class="sl-em">${emoji}</span>${nome ? `<span class="sl-nm">${esc(nome)}</span>` : ''}${n ? `<span class="qt">${esc(n)}</span>` : ''}</button>`;
}
const ICO_MAG = [[/misseis/, '☄️'], [/armadura/, '🧥'], [/escudo da fe|egide|escudo ardente/, '🛡️'], [/bencao|favor divino|auxilio|heroismo|sinal de esperanca/, '🙏'], [/curar|cura|restaur|regenera|revivific|reviver|ressurre|moribundos/, '💚'], [/invisib|servo invis/, '👻'], [/voo|levitac|queda suave|caminhar sobre|forma gasosa/, '🪶'], [/salto/, '🦘'], [/passos largos|retirada|celeridade|lentidao/, '👟'], [/familiar|cao fiel|montaria|fera/, '🐾'], [/nevoa|neblina|nuvem fetida/, '🌫️'], [/gargalh/, '🤡'], [/comando/, '📢'], [/imagem|ilusao|disfar|miragem|despistar|ilusoria/, '🎭'], [/sono|padrao hipnotico|leque/, '💤'], [/enfeiticar|dominar|cativar|sugestao|emocoes|modificar memoria/, '💫'], [/medo|malogro|moles|mau olhado|rogar|praga|maldi|perdicao/, '🧿'], [/fogo|chama|flamej|ardente|incend|meteoros|raio solar|explosao solar/, '🔥'], [/gelo|frio|glacial|nevasca|congel/, '❄️'], [/relampag|raio|choque|trov/, '⚡'], [/acid|bolha/, '🧪'], [/veneno|toxic/, '☠️'], [/necr|dedo da morte|vampir|vazia|infligir|circulo da morte/, '💀'], [/psiq|fantasmag|intelecto|mente/, '🧠'], [/teia|graxa|imobiliz|tentaculo|corda/, '🕸️'], [/escuridao|obscur|cegueira/, '🌑'], [/luz|radiante|sagrad|divin|guia|santuario|consagrar|punicao/, '✨'], [/teleport|passo nebul|porta dimens|piscar|portal|remeter/, '🌀'], [/muralha|barreira|globo|campo|circulo|tranca|glifo/, '🧱'], [/terremoto|despeda|onda|punho/, '💥'], [/protecao|reflexos|pele|turvar|vinculo|resist|orientacao|golpe certeiro/, '🛡️'], [/detect|identif|clarivid|videncia|augurio|olho|ver o|visao|verdade|localizar|encontrar|alarme/, '🔍'], [/mao|mãos/, '🖐️'], [/luzes|mensagem|taumaturgia|prestidigit|reparar/, '🪄']];
export function icoMagia(sp) {
  const nm = String((sp && sp.nome) || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); const h = ICO_MAG.find(([re]) => re.test(nm)); if (h) return h[1];
  const d = { fogo: '🔥', gelo: '❄️', frio: '❄️', 'elétrico': '⚡', trovão: '🌩️', ácido: '🧪', necrótico: '💀', radiante: '✨', força: '💥', psíquico: '🧠', veneno: '☠️' }[sp.dano];
  if (sp.tipo === 'cura') return '💚'; if (sp.tipo === 'buff') return '🛡️'; if (sp.tipo === 'sono') return '💤'; if (sp.tipo === 'ctrl') return '🌀'; if (sp.tipo === 'invoca') return '🐾'; if (sp.tipo === 'util' || sp.ex) return '🔮'; return d || '✴️';
}
export function icoFeat(nome) {
  const n = String(nome).toLowerCase(); const t = [[/fôlego|folego/, '💨'], [/surto/, '⚡'], [/fúria|furia/, '🔥'], [/furtiv/, '🗡️'], [/ardil|esquiva|astúcia/, '🌀'], [/sorte/, '🍀'], [/mãos|maos|cura|preservar/, '🙏'], [/canal|divin|expuls/, '☀️'], [/destrui|smite/, '⚔️'], [/magia|conjura|arcan|recup|grim/, '✨'], [/ataque extra|ataque/, '🗡️'], [/indom/, '🛡️'], [/crítico|critico/, '🎯'], [/sentido|percep|intuição/, '👁️'], [/aura|juramento/, '🌟'], [/estilo|luta/, '🥋'], [/perícia|pericia|especial/, '📚']];
  return (t.find(([re]) => re.test(n)) || [0, '✦'])[1];
}
const retratoFrente = (k = 6) => { const c = Rn.spriteHeroi(S(), 'baixo', 'idle'); return `<img class="fc-frente" alt="Herói visto de frente" src="${c.toDataURL()}" width="${c.width * k}" height="${c.height * k}">`; };
export const usavelFora = (it) => !!(it && (it.selo || it.pvMax || it.curaPerm || it.cura || it.restaura || it.escudoSeq || it.insp));
const valorRef = (it) => precoVenda(it);

// ---------- painel de detalhe (ícone grande + descrição + botões) ----------
export function detalheItem(id, botoes = '', { extra = '', semValor = false } = {}) {
  const it = ITENS[id]; if (!it) return '<div class="det vazio"><p class="suave">Selecione um slot para ver o item.</p></div>';
  const stat = descItem(it); const desc = it.desc && !stat.includes(it.desc) ? it.desc : '';
  return `<div class="det" style="--rar:${RAR_COR[it.raro] || '#8a6a3a'}"><div class="det-ic"><img alt="" src="${urlIcone(it)}"></div>
    <div class="det-txt"><h4>${esc(it.nome)}</h4><div class="det-tags">${raridadeTag(it.raro)} <span class="tag" style="background:#6a5030">${esc(TIPO_NOME[it.tipo] || it.tipo)}</span></div>
    ${stat ? `<p class="det-stat">${esc(stat)}</p>` : ''}${desc ? `<p class="det-desc">${esc(desc)}</p>` : ''}${extra}${it.preco > 0 && !semValor ? `<p class="peq suave">Valor de mercado ${fmt(it.preco)} 🪙 · comerciantes pagam menos (≈ ${fmt(valorRef(it))} 🪙)</p>` : ''}</div>
    ${botoes ? `<div class="det-btn">${botoes}</div>` : ''}</div>`;
}

// ---------- estado da ficha ----------
let fAba = 'equip'; let fFiltro = 'tudo'; let fSel = null; let fHabSel = null; let fHabFiltro = 'classe';
const FILTROS = [['tudo', 'Tudo', null], ['arma', 'Armas', ['arma']], ['armadura', 'Armaduras', ['armadura', 'escudo']], ['acessorio', 'Acessórios', ['acessorio']], ['uso', 'Consumíveis', ['consumivel', 'comida']], ['outros', 'Outros', ['tesouro']]];
export const ordenaInv = (a, b) => ORDEM_TIPO.indexOf(ITENS[a.id].tipo) - ORDEM_TIPO.indexOf(ITENS[b.id].tipo) || ORDEM_RAR.indexOf(ITENS[b.id].raro) - ORDEM_RAR.indexOf(ITENS[a.id].raro) || ITENS[a.id].nome.localeCompare(ITENS[b.id].nome, 'pt');
export const abaAtual = () => fAba;
export const definirAba = (a) => { fAba = a; };

export function abaEquipamento() {
  const s = S(), d = St.der(); const E = s.equip;
  const slots = [['armadura', 'Armadura'], ['arma', 'Arma'], ['escudo', 'Escudo'], ['ac1', 'Acessório'], ['ac2', 'Acessório']];
  const sl = ([k, rot]) => { const id = E[k]; return `<div class="fc-eqslot"><div class="fc-eqrot">${rot}</div>${id ? slot(id, { act: 'f-sel-eq', extra: `data-slot="${k}"`, sel: fSel && fSel.eq === k, tam: 'grande' }) : slotVazio(rot, 'grande')}</div>`; };
  const filtro = FILTROS.find((f) => f[0] === fFiltro) || FILTROS[0];
  const inv = s.inv.filter((i) => ITENS[i.id] && (!filtro[2] || filtro[2].includes(ITENS[i.id].tipo))).sort(ordenaInv);
  const cont = (f) => s.inv.filter((i) => ITENS[i.id] && (!f[2] || f[2].includes(ITENS[i.id].tipo))).reduce((a, i) => a + 1, 0);
  const total = Math.max(24, Math.ceil(inv.length / 6) * 6); const casas = inv.map((i) => slot(i.id, { n: i.n, act: 'f-sel', sel: fSel && fSel.id === i.id && !fSel.eq })); while (casas.length < total) casas.push(slotVazio());
  let det = '';
  if (fSel && fSel.eq && E[fSel.eq]) det = detalheItem(E[fSel.eq], `<button class="btn peq" data-act="f-tirar" data-slot="${fSel.eq}">Desequipar</button>`);
  else if (fSel && !fSel.eq && ITENS[fSel.id] && St.invQtd(fSel.id)) { const it = ITENS[fSel.id]; const eq = EQUIPAVEL.includes(it.tipo); const pode = !eq || St.podeEquipar(it);
    det = detalheItem(fSel.id, `${eq ? `<button class="btn peq pri" data-act="f-equipar" data-id="${esc(fSel.id)}" ${pode ? '' : 'disabled'}>${pode ? 'Equipar' : 'Sua classe não usa'}</button>` : ''}${usavelFora(it) ? `<button class="btn peq ok" data-act="f-usar" data-id="${esc(fSel.id)}">Usar</button>` : ''}<button class="btn peq" data-act="f-fecha-sel">Voltar</button>`, { extra: it.preco > 0 ? '<p class="peq suave">Para vender, procure um comerciante na vila.</p>' : '' }); }
  else det = '';
  return `<div class="fc-eq"><div class="fc-doll"><div class="fc-topo"><div class="fc-lado"><div class="fc-eqcol">${sl(slots[0])}${sl(slots[1])}</div></div>
    <div class="fc-heroi">${retratoFrente(6)}<div class="fc-pedestal"></div><div class="fc-nome">${esc(s.heroi.nome)}<small>${CLASSES[s.heroi.cls].emoji} ${esc(CLASSES[s.heroi.cls].nome)} · nível ${s.heroi.nivel}</small></div></div>
    <div class="fc-lado"><div class="fc-eqcol">${sl(slots[2])}${sl(slots[3])}${sl(slots[4])}</div></div></div>
    <div class="fc-stats"><span class="chip">❤️ ${s.heroi.hp}/${d.hpMax}</span><span class="chip">🛡️ CA ${d.ca}</span><span class="chip">⚔️ ${esc(d.arma.nome)}</span><span class="chip">${d.ataques} ataque(s)</span><span class="chip">Prof. +${d.prof}</span><span class="chip">Ini ${d.ini >= 0 ? '+' : ''}${d.ini}</span><span class="chip">🪙 ${fmt(s.heroi.ouro)}</span></div></div>
    <div class="fc-bag"><h3>Mochila</h3><div class="pp-sub fc-filtros">${FILTROS.map((f) => `<button class="${fFiltro === f[0] ? 'sel' : ''}" data-act="f-filtro" data-k="${f[0]}">${f[1]} <span class="n">${cont(f)}</span></button>`).join('')}</div>
    <p class="peq suave fc-dica">${det ? '' : 'Toque em um slot para ver o item, equipar ou usar.'}</p><div class="fc-inv"><div class="sl-grade">${casas.join('')}</div>${det ? `<div class="fc-det">${det}</div>` : ''}</div></div></div>`;
}

export function abaHabilidades() {
  const s = S(), d = St.der(), cls = CLASSES[s.heroi.cls], pn = R.progressoNivel(s.heroi.xp);
  const feats = cls.feats.map(([n, nome, desc]) => ({ chave: 'c:' + nome, n, nome, desc, ok: n <= s.heroi.nivel }));
  const mags = d.conj ? Object.entries(MAGIAS).filter(([, m]) => m.cls.includes(s.heroi.cls) && m.nv <= (s.recursosMax.slots.length || 0)).map(([id, m]) => ({ id, ...m })).sort((a, b) => a.nv - b.nv || a.nome.localeCompare(b.nome, 'pt')) : [];
  const abas = [['classe', `Classe (${feats.filter((f) => f.ok).length}/${feats.length})`]]; if (mags.length) abas.push(['magias', `Magias (${mags.length})`]);
  if (!abas.some((a) => a[0] === fHabFiltro)) fHabFiltro = 'classe';
  let grade = '', det = '';
  if (fHabFiltro === 'classe') {
    grade = feats.map((f) => slotEmoji(f.chave, f.ok ? icoFeat(f.nome) : '🔒', { act: 'f-hab', sel: fHabSel === f.chave, off: !f.ok, cor: f.ok ? '#c8963c' : '#6a5a40', n: f.ok ? '' : f.n, nome: f.nome.replace(/^Campeão: /, '') })).join('');
    const f = feats.find((x) => x.chave === fHabSel); det = f ? `<div class="det" style="--rar:${f.ok ? '#c8963c' : '#6a5a40'}"><div class="det-ic"><span class="sl-em grande">${f.ok ? icoFeat(f.nome) : '🔒'}</span></div><div class="det-txt"><h4>${esc(f.nome.replace(/^Campeão: /, ''))}</h4><div class="det-tags"><span class="tag" style="background:${f.ok ? '#5a8a3a' : '#7a5a3a'}">${f.ok ? 'Desbloqueada' : 'Nível ' + f.n}</span></div><p class="det-desc">${esc(f.desc)}</p></div></div>` : '';
  } else {
    const nvs = [...new Set(mags.map((m) => m.nv))]; const sel = mags.find((m) => m.id === fHabSel); grade = mags.map((m) => slotEmoji(m.id, icoMagia(m), { act: 'f-hab', sel: fHabSel === m.id, cor: ['#9a8aa8', '#4aa8ff', '#6a5aff', '#b57bff', '#ff7ac8', '#ffb52e'][Math.min(5, Math.ceil(m.nv / 2))], n: m.nv ? m.nv + 'º' : '', nome: m.nome })).join(''); void nvs;
    det = sel ? `<div class="det" style="--rar:#6a5aff"><div class="det-ic"><span class="sl-em grande">${icoMagia(sel)}</span></div><div class="det-txt"><h4>${esc(sel.nome)}</h4><div class="det-tags"><span class="tag" style="background:#6a4aa8">${sel.nv ? sel.nv + 'º círculo' : 'Truque'}</span>${sel.dado ? `<span class="tag" style="background:#a8503a">${esc(sel.dado)} ${esc(sel.dano || '')}</span>` : ''}</div><p class="det-desc">${esc(String(sel.desc || '').replace(/\s*\[[^\]]*\]/g, ''))}</p></div></div>` : '';
  }
  return `<div class="fc-hab"><div class="fc-heroi grande">${retratoFrente(9)}<div class="fc-pedestal"></div><div class="fc-nome">${esc(s.heroi.nome)}<small>${cls.emoji} ${esc(cls.nome)} · nível ${s.heroi.nivel}</small></div>
      <div class="fc-barras"><div class="peq">PV ${s.heroi.hp}/${d.hpMax}</div>${barra(s.heroi.hp, d.hpMax, 'ok')}<div class="peq">${pn.lendario ? 'Lendário ' + pn.rank : `XP ${fmt(pn.atual)}/${fmt(pn.falta)}`}</div>${barra(pn.atual, pn.falta)}</div>${recursosHtml(s.recursos, s.recursosMax)}</div>
    <div class="fc-habs"><div class="pp-sub">${abas.map(([k, n]) => `<button class="${fHabFiltro === k ? 'sel' : ''}" data-act="f-hab-aba" data-k="${k}">${n}</button>`).join('')}</div><div class="sl-grade hab">${grade}</div>${det ? `<div class="fc-det">${det}</div>` : '<p class="peq suave fc-dica">Toque em uma habilidade para ler a descrição.</p>'}</div></div>`;
}

export function abaAtributos() {
  const s = S(), d = St.der(), cls = CLASSES[s.heroi.cls], pr = R.progressosAtributo(s); const e = s.heroi.exaustao;
  return `<h3>Atributos (vêm da vida real)</h3><div class="atr">${ATRIBUTOS.map((a) => `<div><small>${ATR_NOME[a]}</small><b>${d.A[a]}</b><small>mod ${d.M[a] >= 0 ? '+' : ''}${d.M[a]}${cls.prim === a ? ' ★' : ''}</small>${barra(pr[a], 1)}<small>${esc(ATR_FONTE[a])}</small></div>`).join('')}</div>
  <h3>Combate</h3><div class="card"><div class="linha" style="gap:6px;flex-wrap:wrap"><span class="chip">PV ${s.heroi.hp}/${d.hpMax}</span><span class="chip">CA ${d.ca}</span><span class="chip">Prof. +${d.prof}</span><span class="chip">${d.ataques} ataque(s)</span><span class="chip">Ini ${d.ini >= 0 ? '+' : ''}${d.ini}</span>${d.conj ? `<span class="chip">CD ${d.cd}</span>` : ''}<span class="chip">${esc(d.arma.nome)}</span></div></div>
  <h3>Recursos de descanso</h3><div class="card">${recursosHtml(s.recursos, s.recursosMax)}<p class="peq suave">Renovados no amanhecer conforme sua alimentação (Taverna).</p></div>
  <h3>Exaustão ${e}</h3><div class="card"><p class="peq ${e >= 3 ? 'verm' : ''}">${esc(['Sem exaustão.', 'Fugir fica mais difícil.', 'Você age depois dos inimigos e fugir é bem mais difícil.', 'Desvantagem em todos os seus ataques.', 'Seus PV máximos caem pela metade.', 'Exausto demais: sem Tochas, você não consegue entrar em masmorras.'][Math.min(e, 5)])}</p></div>
  <h3>Ranks de força</h3><div class="card">${GRUPOS_TREINO.map((g) => { const b = R.melhorDoGrupo(s, g.id); return `<div class="lista-item"><div class="nome">${esc(g.nome)}${b ? `<small>e1RM ${fmt(b.inf.e1, 1)} kg · ${fmt(s.treino[b.id].best.w, 1)} kg × ${s.treino[b.id].best.r}</small>` : '<small>sem registro</small>'}</div>${b ? tierTag(b.inf.tier) : '—'}</div>`; }).join('')}</div>
  <h3>Números da jornada</h3><div class="card peq"><div class="linha"><span>Dias ativos: <b>${s.stats.diasAtivos}</b></span><span>Séries: <b>${s.stats.series}</b></span><span>PRs: <b>${s.stats.prs}</b></span></div><div class="linha"><span>Aeróbico: <b>${fmt(s.stats.cardioMin)} min</b></span><span>Estudo: <b>${fmt(s.stats.estudoMin / 60, 1)} h</b></span><span>Dias perfeitos: <b>${s.stats.perfeitos}</b></span></div><div class="linha"><span>Abates: <b>${s.stats.abates}</b></span><span>Ouro total: <b>${fmt(s.stats.ouroTotal)}</b></span></div></div>`;
}
export function abaConquistas() {
  const s = S(); const n = CONQUISTAS.filter((c) => s.conquistas[c.id]).length;
  return `<p class="suave">${n}/${CONQUISTAS.length} conquistas.</p><div class="conq-grade">${CONQUISTAS.map((c) => { const ok = s.conquistas[c.id]; return `<div class="card conq ${ok ? '' : 'trava'}"><h4><span>${ok ? '🏆' : '🔒'} ${esc(c.nome)}</span>${ok ? `<span class="peq suave">${ok.split('-').reverse().join('/')}</span>` : ''}</h4><p class="peq">${esc(c.desc)}</p><p class="peq suave">${c.rec.ouro ? `+${c.rec.ouro} ouro ` : ''}${c.rec.tochas ? `+${c.rec.tochas} tochas ` : ''}${c.rec.xp ? `+${c.rec.xp} XP` : ''}</p></div>`; }).join('')}</div>`;
}
export const SUBABAS = [['equip', '🎒 Itens'], ['hab', '✨ Habilidades'], ['atr', '📊 Atributos'], ['conq', '🏆 Conquistas']];
export function htmlFicha() {
  const corpo = fAba === 'equip' ? abaEquipamento() : fAba === 'hab' ? abaHabilidades() : fAba === 'atr' ? abaAtributos() : abaConquistas();
  return `<div class="pp-sub fc-abas">${SUBABAS.map(([k, n]) => `<button class="${fAba === k ? 'sel' : ''}" data-act="f-aba" data-k="${k}">${n}</button>`).join('')}</div>${corpo}`;
}
// ações (data-act) — o painel que embute a ficha junta isto às suas próprias ações
export const acoesFicha = {
  'f-aba': (el) => { fAba = el.dataset.k; rerender(); },
  'f-filtro': (el) => { fFiltro = el.dataset.k; fSel = null; rerender(); },
  'f-sel': (el) => { fSel = fSel && fSel.id === el.dataset.id && !fSel.eq ? null : { id: el.dataset.id }; rerender(); },
  'f-sel-eq': (el) => { fSel = fSel && fSel.eq === el.dataset.slot ? null : { eq: el.dataset.slot }; rerender(); },
  'f-fecha-sel': () => { fSel = null; rerender(); },
  'f-tirar': (el) => { St.desequipar(el.dataset.slot); fSel = null; Au.sfx('confirm'); rerender(); },
  'f-equipar': (el) => { const r = St.equipar(el.dataset.id); if (r.erro) toast(r.erro); else { Au.sfx('confirm'); fSel = null; } rerender(); },
  'f-usar': (el) => { const r = St.usarForaDaMasmorra(el.dataset.id); toast(r.erro || r.msg); if (r.msg) { Au.sfx('heal'); if (!St.invQtd(el.dataset.id)) fSel = null; } rerender(); },
  'f-hab': (el) => { fHabSel = fHabSel === el.dataset.id ? null : el.dataset.id; rerender(); },
  'f-hab-aba': (el) => { fHabFiltro = el.dataset.k; fHabSel = null; rerender(); },
};
export const resetarSelecao = () => { fSel = null; fHabSel = null; };
void ATR_NOME;
