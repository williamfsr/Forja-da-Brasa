// Barra de ações do combate, no estilo de BG3: tudo o que o herói pode fazer aparece em slots, agrupado e ordenado SOZINHO
// (ataques → habilidades de classe → ações padrão → magias por círculo → itens). Filtros por abas, dicas ao passar o mouse
// (computador) e toque-para-ver / toque-de-novo-para-usar (celular e tablet). Teclas 1–9 acionam os primeiros slots visíveis.
import { ITENS } from './srd.js';
import * as T from './tatico.js';
import * as St from './store.js';
import { esc, toast } from './uibase.js';
import * as Au from './audio.js';
import { urlIcone, icoFeat, icoMagia } from './ficha.js';

const GRUPOS = { atq: ['Ataques', '#ff6a4a'], padrao: ['Ações', '#7aa8d8'], hab: ['Habilidades', '#f0b840'], mag: ['Magias', '#b57bff'], item: ['Itens', '#6fcf7f'] };
const ORDEM = ['atq', 'hab', 'padrao', 'mag', 'item'];
const ABAS = [['tudo', 'Tudo', null], ['acoes', '⚔ Ações', ['atq', 'padrao']], ['hab', '🛡 Habilidades', ['hab']], ['mag', '✨ Magias', ['mag']], ['item', '🧪 Itens', ['item']]];
const PADRAO = ['correr', 'desengajar', 'esquivar', 'fugir'];
const EM_PADRAO = { correr: '🏃', desengajar: '↩️', esquivar: '🌀', fugir: '💨', falar: '💬' };
const CIR_COR = ['#9a8aa8', '#4aa8ff', '#6a8aff', '#b57bff', '#ff7ac8', '#ffb52e'];
const toqueApenas = () => { try { return !window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) { return true; } };
export const modoDock = () => { try { return window.matchMedia('(min-width: 900px) and (min-height: 561px)').matches; } catch (e) { return false; } };

const limpar = (t) => String(t || '').replace(/\s*\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
const frase = (t, max = 240) => { t = limpar(t); if (t.length <= max) return t; const c = t.slice(0, max); const p = Math.max(c.lastIndexOf('. '), c.lastIndexOf('! '), c.lastIndexOf('? ')); return (p > 80 ? c.slice(0, p + 1) : c.trimEnd() + '…'); };
function geoTxt(sp) {
  const g = sp.geo || {}; return g.f === 'circulo' ? `área r${g.raio}` : g.f === 'cone' ? `cone ${g.len}` : g.f === 'linha' ? `linha ${g.len}` : g.f === 'cadeia' ? 'corrente' : g.f === 'self' ? 'pessoal' : g.f === 'aliados' ? 'aliados' : g.f === 'muro' ? `muro ${g.len}` : g.f === 'morto' ? 'aliado caído' : g.f === 'livre' ? `teleporte ${g.alc}` : `alcance ${g.alc}`;
}

// ---------- coleta e ordenação automáticas ----------
export function coletar(bt, api) {
  const B = bt.B, H = B.h, E = []; const acaoOk = H.acoes > 0, bonOk = H.bonus > 0; const armaId = St.S.equip && St.S.equip.arma; const armaIt = armaId && ITENS[armaId];
  for (const a of T.acoesHeroi(B)) {
    const ok = T.podeAgir(B, a); const motivo = a.off ? 'Indisponível agora' : a.acao && !acaoOk ? 'Sem ação neste turno' : a.bonus && !bonOk ? 'Sem ação bônus' : '';
    if (a.id === 'atacar') E.push({ k: 'atq:atacar', g: 'atq', ord: 0, rot: 'Atacar', sub: `${H.arma.nome}${H.ataques > 1 ? ' ×' + H.ataques : ''}`, desc: a.desc, img: armaIt ? urlIcone(armaIt) : null, em: '⚔️', custo: 'a', off: !ok, motivo, ativo: bt.modo === 'atacar' && !bt.smite, run: () => api.atacar() });
    else if (a.id.startsWith('smite')) E.push({ k: 'atq:' + a.id, g: 'atq', ord: a.arg, rot: a.rot, desc: a.desc, em: '🌟', badge: `${a.arg}º`, custo: 'a', off: !ok, motivo, ativo: bt.smite === a.id, run: () => api.hab(a) });
    else if (PADRAO.includes(a.id)) E.push({ k: 'padrao:' + a.id, g: 'padrao', ord: PADRAO.indexOf(a.id), rot: a.rot, desc: a.desc, em: EM_PADRAO[a.id], custo: 'a', off: !ok, motivo, run: () => api.hab(a) });
    else E.push({ k: 'hab:' + a.id, g: 'hab', ord: E.length, rot: a.rot, desc: a.desc, em: icoFeat(a.rot), custo: a.bonus ? 'b' : a.livre ? 'l' : 'a', off: !ok, motivo, run: () => api.hab(a) });
  }
  const falaveis = T.inimigosDe(B, H).some((e) => e.racional || (e.tags || []).includes('fera'));
  E.push({ k: 'padrao:falar', g: 'padrao', ord: 9, rot: 'Falar', desc: 'Tente persuadir, intimidar ou subornar um inimigo racional, ou acalmar uma fera.', em: EM_PADRAO.falar, custo: 'a', off: !acaoOk || !falaveis, motivo: !acaoOk ? 'Sem ação neste turno' : 'Ninguém aqui quer conversar', ativo: bt.modo === 'falar', run: () => api.falar() });
  const mags = T.magiasDoHeroi(B).slice().sort((x, y) => x.nv - y.nv || x.nome.localeCompare(y.nome, 'pt'));
  for (const sp of mags) {
    const escala = sp.up || sp.dardos || sp.raios || sp.tipo === 'sono'; const cir = sp.nv === 0 ? [0] : sp.circulos; const base = sp.nv === 0 ? 0 : (cir[0] || sp.nv); const bonus = !!sp.bonus;
    const semEspaco = sp.nv > 0 && !cir.length; const semAcao = bonus ? !bonOk : !acaoOk; const dano = sp.dado ? ` · ${sp.dado}${sp.dano ? ' ' + sp.dano : ''}` : '';
    E.push({ k: 'mag:' + sp.id, g: 'mag', ord: sp.nv, nv: sp.nv, rot: sp.nome, sub: `${sp.nv ? sp.nv + 'º círculo' : 'Truque'} · ${geoTxt(sp)}${dano}`, desc: frase(sp.desc), em: icoMagia(sp), badge: sp.nv ? `${sp.nv}º` : '', custo: bonus ? 'b' : 'a', off: semEspaco || semAcao, motivo: semEspaco ? 'Sem espaço de magia' : bonus ? 'Sem ação bônus' : 'Sem ação neste turno', circulos: escala && cir.length > 1 ? cir : null, run: (nv) => api.magia(sp, nv ?? base) });
  }
  B.inv.forEach((x, i) => { const it = ITENS[x.id]; if (x.n > 0 && it && it.tipo === 'consumivel') E.push({ k: 'item:' + x.id, g: 'item', ord: i, rot: it.nome, sub: 'Consumível', desc: limpar(it.desc), img: urlIcone(it), qt: x.n, custo: 'a', off: !acaoOk, motivo: 'Sem ação neste turno', run: () => api.item(i) }); });
  return E.sort((a, b) => ORDEM.indexOf(a.g) - ORDEM.indexOf(b.g) || a.ord - b.ord || a.rot.localeCompare(b.rot, 'pt'));
}

// ---------- dica flutuante (computador) ----------
let tip = null; let mapa = new Map();
function dicaEl() { if (!tip) { tip = document.createElement('div'); tip.id = 'hb-tip'; tip.className = 'oculto'; document.body.append(tip); } return tip; }
const custoTxt = { a: 'Ação', b: 'Ação bônus', l: 'Ação livre' };
function conteudoDica(e) {
  return `<b>${esc(e.rot)}</b><div class="hb-tags"><span class="c-${e.custo}">${custoTxt[e.custo]}</span>${e.sub ? `<span>${esc(e.sub)}</span>` : ''}${e.qt ? `<span>×${e.qt}</span>` : ''}</div><p>${esc(e.desc || '')}</p>${e.off ? `<p class="hb-nao">⛔ ${esc(e.motivo || 'Indisponível')}</p>` : e.circulos ? '<p class="hb-nota">Clique para escolher o círculo.</p>' : ''}`;
}
function mostrarDica(btn, e) {
  if (toqueApenas()) return; const t = dicaEl(); t.innerHTML = conteudoDica(e); t.classList.remove('oculto'); t.style.setProperty('--c', (GRUPOS[e.g] || [0, '#fff'])[1]);
  const r = btn.getBoundingClientRect(); const w = t.offsetWidth, h = t.offsetHeight; let x = r.left + r.width / 2 - w / 2; x = Math.max(8, Math.min(window.innerWidth - w - 8, x)); let y = r.top - h - 10; if (y < 8) y = r.bottom + 10; t.style.left = x + 'px'; t.style.top = y + 'px';
}
export const esconderDica = () => { if (tip) tip.classList.add('oculto'); };

// ---------- montagem ----------
const tamNome = (t) => { const m = Math.max(...String(t).split(/\s+/).map((w) => w.length)); return m >= 12 ? 'xs' : m >= 9 ? 's' : ''; };
function slotHtml(e, i, bt) {
  const cor = e.g === 'mag' ? CIR_COR[Math.min(5, Math.ceil((e.nv || 0) / 2))] : GRUPOS[e.g][1]; const sel = bt.hbSel === e.k;
  return `<button class="hb-slot ${e.off ? 'off' : ''} ${sel ? 'sel' : ''} ${e.ativo ? 'ativo' : ''}" data-k="${esc(e.k)}" data-i="${i}" style="--c:${cor}" aria-label="${esc(e.rot)}${e.off ? ' (indisponível)' : ''}">
    ${e.img ? `<img class="hb-img" alt="" src="${e.img}">` : `<span class="hb-ic">${e.em || '✦'}</span>`}<span class="hb-nm ${tamNome(e.rot)}">${esc(e.rot)}</span><i class="hb-custo ${e.custo}"></i>${e.badge ? `<b class="hb-nv">${esc(e.badge)}</b>` : ''}${e.qt ? `<b class="hb-qt">${e.qt}</b>` : ''}${e.off ? '<span class="hb-x">✕</span>' : ''}</button>`;
}
function pipsEspaco(bt) {
  const H = bt.B.h, mx = (St.S.recursosMax && St.S.recursosMax.slots) || []; const p = [];
  H.slots.forEach((v, i) => { const m = mx[i] || 0; if (m > 0) p.push(`<span class="hb-esp" title="${i + 1}º círculo">${i + 1}º ${'●'.repeat(Math.max(0, v))}${'○'.repeat(Math.max(0, m - v))}</span>`); });
  return p.join('');
}
export function montarHotbar(bt, menu, api) {
  const E = coletar(bt, api); menu.classList.add('hb-on'); mapa = new Map(E.map((e) => [e.k, e])); esconderDica();
    const temG = (gs) => E.filter((e) => gs.includes(e.g)); const abas = ABAS.filter((a) => !a[2] || temG(a[2]).length); if (!abas.some((a) => a[0] === (bt.hbAba || 'tudo'))) bt.hbAba = 'tudo'; const aba = bt.hbAba || 'tudo';
  const filtro = ABAS.find((a) => a[0] === aba)[2]; const vis = filtro ? E.filter((e) => filtro.includes(e.g)) : E;
  // chips de círculo (só na aba Magias)
  const nvs = [...new Set(E.filter((e) => e.g === 'mag').map((e) => e.nv))]; if (bt.hbNv === undefined || (bt.hbNv !== 'todas' && !nvs.includes(bt.hbNv))) bt.hbNv = 'todas';
  const chips = aba === 'mag' && nvs.length > 1 ? `<div class="hb-chips">${['todas', ...nvs].map((n) => `<button class="hb-chip ${bt.hbNv === n ? 'sel' : ''}" data-chip="${n}">${n === 'todas' ? 'Todas' : n === 0 ? 'Truques' : n + 'º'}</button>`).join('')}</div>` : '';
  const lista = aba === 'mag' && bt.hbNv !== 'todas' ? vis.filter((e) => e.nv === bt.hbNv) : vis;
  let i = 0; let corpo = '';
  for (const g of ORDEM) {
    const es = lista.filter((e) => e.g === g); if (!es.length) continue; let sub = -1; let slots = '';
    for (const e of es) { if (g === 'mag' && (aba === 'tudo' || aba === 'mag') && e.nv !== sub) { sub = e.nv; slots += `<div class="hb-sub">${sub === 0 ? 'Truques' : `${sub}º círculo`}</div>`; } slots += slotHtml(e, i++, bt); }
    corpo += `<section class="hb-gr g-${g}"><h6 style="--c:${GRUPOS[g][1]}">${GRUPOS[g][0]}${g === 'mag' ? `<span class="hb-esps">${pipsEspaco(bt)}</span>` : ''}</h6><div class="hb-slots">${slots}</div></section>`;
  }
  if (!corpo) corpo = '<p class="hb-vazio">Nada disponível nesta aba.</p>';
  // cartão do slot selecionado (toque) ou de magia com escolha de círculo
  const sel = bt.hbSel && mapa.get(bt.hbSel); let det = '';
  if (sel && (toqueApenas() || sel.circulos)) {
    const cir = sel.circulos ? (bt.hbCir ?? sel.circulos[0]) : null;
    det = `<div class="hb-det" style="--c:${GRUPOS[sel.g][1]}"><div class="hb-det-t"><b>${esc(sel.rot)}</b><div class="hb-tags"><span class="c-${sel.custo}">${custoTxt[sel.custo]}</span>${sel.sub ? `<span>${esc(sel.sub)}</span>` : ''}${sel.qt ? `<span>×${sel.qt}</span>` : ''}</div></div><p>${esc(sel.desc || '')}</p>
      ${sel.off ? `<p class="hb-nao">⛔ ${esc(sel.motivo)}</p>` : ''}${sel.circulos ? `<div class="hb-cir">Lançar no: ${sel.circulos.map((n) => `<button class="hb-chip ${cir === n ? 'sel' : ''}" data-cir="${n}">${n}º</button>`).join('')}</div>` : ''}
      <div class="hb-det-b"><button class="bt-btn bt-ok" data-hb="usar" ${sel.off ? 'disabled' : ''}><span>${sel.g === 'mag' ? '✦ Lançar' : sel.g === 'item' ? 'Usar' : 'Usar'}${cir ? ` (${cir}º)` : ''}</span></button><button class="bt-btn" data-hb="fechar"><span>Fechar</span></button></div></div>`;
  }
  const H = bt.B.h;
  menu.insertAdjacentHTML('beforeend', `<div class="hb">${api.dica ? `<div class="hb-dica">${esc(api.dica)}</div>` : ''}
    <div class="hb-top"><div class="hb-abas">${abas.map(([k, n, gs]) => `<button class="hb-aba ${aba === k ? 'sel' : ''}" data-aba="${k}">${n}${gs ? `<i>${temG(gs).length}</i>` : ''}</button>`).join('')}</div>
      <div class="hb-fim"><button class="bt-btn bt-auto ${bt.auto ? 'sel' : ''}" data-hb="auto"><span>${bt.auto ? 'Auto: ON' : 'Auto'}</span><small>ação sugerida</small></button><button class="bt-btn bt-fim" data-hb="fim"><span>Fim do turno ▶</span><small>Mov ${H.movRest} · tecla F</small></button></div></div>
    ${chips}${det}<div class="hb-corpo">${corpo}</div></div>`);
  ligar(bt, menu, api);
}

function executar(bt, e, api, cir) { bt.hbSel = null; bt.hbCir = null; esconderDica(); Au.destravar(); Au.sfx('select'); e.run(cir); void api; }
function ligar(bt, menu, api) {
  const refaz = () => api.rerender();
  menu.querySelectorAll('.hb-aba').forEach((b) => b.addEventListener('click', () => { Au.sfx('select'); bt.hbAba = b.dataset.aba; bt.hbSel = null; refaz(); }));
  menu.querySelectorAll('[data-chip]').forEach((b) => b.addEventListener('click', () => { Au.sfx('select'); bt.hbNv = b.dataset.chip === 'todas' ? 'todas' : +b.dataset.chip; bt.hbSel = null; refaz(); }));
  menu.querySelectorAll('[data-cir]').forEach((b) => b.addEventListener('click', () => { Au.sfx('select'); bt.hbCir = +b.dataset.cir; refaz(); }));
  menu.querySelectorAll('[data-hb]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.hb; Au.destravar(); Au.sfx('select');
    if (a === 'auto') { api.auto(); } else if (a === 'fim') { api.fim(); } else if (a === 'fechar') { bt.hbSel = null; bt.hbCir = null; refaz(); }
    else if (a === 'usar') { const e = mapa.get(bt.hbSel); if (e && !e.off) executar(bt, e, api, e.circulos ? (bt.hbCir ?? e.circulos[0]) : undefined); }
  }));
  menu.querySelectorAll('.hb-slot').forEach((b) => {
    const e = mapa.get(b.dataset.k); if (!e) return;
    b.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse') mostrarDica(b, e); }); b.addEventListener('pointerleave', esconderDica);
    b.addEventListener('click', () => {
      Au.destravar(); esconderDica();
      if (e.off) { if (toqueApenas()) { bt.hbSel = e.k; refaz(); } else toast(e.motivo || 'Indisponível agora.'); return; }
      if (toqueApenas() || e.circulos) { if (bt.hbSel === e.k) executar(bt, e, api, e.circulos ? (bt.hbCir ?? e.circulos[0]) : undefined); else { Au.sfx('select'); bt.hbSel = e.k; bt.hbCir = null; refaz(); } return; }
      executar(bt, e, api);
    });
  });
  // mantém o slot selecionado à vista
  const s = menu.querySelector('.hb-slot.sel'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
// teclas 1–9 acionam os slots visíveis; F encerra o turno
document.addEventListener('keydown', (ev) => {
  if (!document.body.classList.contains('em-batalha') || ev.ctrlKey || ev.metaKey || ev.altKey) return; const t = (document.activeElement || {}).tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
  if (/^[1-9]$/.test(ev.key)) { const b = document.querySelector(`#bt-menu .hb-slot[data-i="${+ev.key - 1}"]`); if (b) { b.click(); ev.preventDefault(); } }
  else if (ev.key === 'f' || ev.key === 'F') { const b = document.querySelector('#bt-menu [data-hb="fim"]'); if (b) { b.click(); ev.preventDefault(); } }
});
document.addEventListener('scroll', esconderDica, true);
