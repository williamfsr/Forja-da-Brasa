// Infraestrutura da interface: painéis, diálogos, popups e avisos (DOM).
import * as Au from './audio.js';
import { aguardar as aguardarDados, ocupado as dadosOcupado } from './dados.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fmt = (n, d = 0) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const val = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
export const valNum = (id) => parseFloat(String(val(id)).replace(',', '.'));
export const pct = (a, b) => Math.max(0, Math.min(100, b > 0 ? (a / b) * 100 : 0));

// ---------- toast ----------
let toastT = null;
export function toast(txt, ms = 3200) {
  const t = $('#toast'); t.textContent = txt; t.classList.remove('oculto'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('oculto'), ms);
}

// ---------- painéis ----------
const regs = {}; let atual = null;
export const registrar = (id, def) => { regs[id] = def; };
export const painelDef = (id) => regs[id];
export const painelArgs = () => (atual ? atual.args : undefined);
// Painéis com "pele" própria (papiro, diário, vitrine…): def.classe aplica classes no #painel enquanto o painel está aberto
let classesPainel = [];
function aplicarClasse(def, id) {
  const P = $('#painel'); P.classList.remove(...classesPainel); classesPainel = def.classe ? def.classe.split(' ') : []; P.classList.add(...classesPainel); P.dataset.p = id;
}
export const painelAberto = () => !!atual;
export const painelId = () => (atual ? atual.id : null);
export function abrirPainel(id, args) {
  const def = regs[id]; if (!def) { toast('Painel indisponível.'); return; }
  atual = { id, def, args }; aplicarClasse(def, id); $('#painel').classList.remove('oculto'); $('#painel-titulo').textContent = typeof def.titulo === 'function' ? def.titulo(args) : def.titulo;
  const c = $('#painel-corpo'); c.innerHTML = def.render(args); c.scrollTop = 0; if (def.aoAbrir) def.aoAbrir(args); Au.sfx('confirm');
}
export function rerender() {
  if (!atual) return; const c = $('#painel-corpo'); const sc = () => (atual.def.rolagem && c.querySelector(atual.def.rolagem)) || c; const topo = sc().scrollTop; const vals = {}; const foco = document.activeElement && document.activeElement.id;
  c.querySelectorAll('input[id],select[id],textarea[id]').forEach((el) => { if (el.dataset.reset === undefined) vals[el.id] = el.type === 'checkbox' ? el.checked : el.value; });
  c.innerHTML = atual.def.render(atual.args);
  for (const [id, v] of Object.entries(vals)) { const el = document.getElementById(id); if (el) { if (el.type === 'checkbox') el.checked = v; else el.value = v; } }
  sc().scrollTop = topo; if (foco) { const f = document.getElementById(foco); if (f && f.tagName !== 'SELECT') f.focus({ preventScroll: true }); }
  if (atual.def.aoAbrir) atual.def.aoAbrir(atual.args, true);
}
export function fecharPainel() { if (!atual) return; const d = atual.def; atual = null; $('#painel').classList.add('oculto'); $('#painel').classList.remove(...classesPainel); classesPainel = []; if (d.aoFechar) d.aoFechar(); Au.sfx('back'); }
export function ligarPainel() {
  const corpo = $('#painel-corpo'); const raiz = $('#painel');
  raiz.addEventListener('click', (e) => {
    if (e.target === raiz) return fecharPainel(); const el = e.target.closest('[data-act]'); if (!el) return;
    if (el.dataset.act === 'fechar') return fecharPainel(); if (el.disabled) return; Au.destravar && Au.destravar();
    const fn = atual && atual.def.acoes && atual.def.acoes[el.dataset.act]; if (fn) { Au.sfx('select'); fn(el, e); }
  });
  const reage = (e) => { const el = e.target.closest('[data-on]'); if (!el || !atual) return; const fn = atual.def.ao && atual.def.ao[el.dataset.on]; if (fn) fn(el, e); };
  corpo.addEventListener('input', reage); corpo.addEventListener('change', reage);
}

// ---------- popups ----------
let popupAtivo = false;
export const popupAberto = () => popupAtivo;
let cadeia = Promise.resolve();
function mostrarPopup(html, { classe = '', aoMostrar = null } = {}) {
  return new Promise((res) => {
    const p = $('#popup'); const cx = $('.popup-caixa', p); cx.className = 'popup-caixa ' + classe; cx.innerHTML = html; p.classList.remove('oculto'); popupAtivo = true; cx.scrollTop = 0;
    const h = (e) => { const b = e.target.closest('[data-res]'); if (!b) return; p.removeEventListener('click', h); p.classList.add('oculto'); popupAtivo = false; Au.sfx('select'); res(b.dataset.res); };
    p.addEventListener('click', h); if (aoMostrar) aoMostrar();
  });
}
// Os popups são enfileirados: nunca dois ao mesmo tempo.
export function popup(html, opts = {}) { const r = cadeia.then(() => mostrarPopup(html, opts)); cadeia = r.catch(() => {}); return r; }
export const popupAtualizar = (html) => { const cx = $('#popup .popup-caixa'); if (cx) cx.innerHTML = html; };
export async function confirmar(titulo, txt, sim = 'Sim', nao = 'Não') {
  const r = await popup(`<h2>${esc(titulo)}</h2><p>${esc(txt)}</p><div class="linha" style="margin-top:12px"><button class="btn" data-res="0">${esc(nao)}</button><button class="btn pri" data-res="1">${esc(sim)}</button></div>`);
  return r === '1';
}
export const aviso = (titulo, txt, ok = 'OK') => popup(`<h2>${esc(titulo)}</h2><p>${txt}</p><button class="btn pri bloco" data-res="1">${esc(ok)}</button>`);

// ---------- diálogos: cena de RPG clássico (herói à esquerda, interlocutor à direita, caixa de texto e lista de opções com cursor) ----------
let dlg = null, heroiRet = null, heroiNome = () => 'Você';
export const dialogoAberto = () => !!dlg;
export const definirHeroiCena = (retFn, nomeFn) => { heroiRet = retFn; if (nomeFn) heroiNome = nomeFn; };
function poeCena(ret) {
  const H = $('#dialogo .cena-heroi'), N = $('#dialogo .cena-npc'), root = $('#dialogo'); H.innerHTML = ''; N.innerHTML = '';
  if (!ret) { root.classList.remove('cena'); return; }
  ret.className = 'ret'; N.append(ret); const hr = heroiRet && heroiRet(); if (hr) { hr.className = 'ret'; H.append(hr); } root.classList.add('cena');
}
function falante(q) { const root = $('#dialogo'); root.classList.toggle('f-heroi', q === 'heroi'); root.classList.toggle('f-npc', q !== 'heroi'); }
function dialogoImpl(nome, linhas, opts = {}) {
  return new Promise((res) => {
    dlg = { nome, linhas: linhas.slice(), i: 0, res, cheio: false, h: null }; poeCena(opts.retrato || null); $('#dialogo .dialogo-opcoes').innerHTML = '';
    $('#dialogo').classList.remove('oculto', 'com-opcoes'); $('.dialogo-seta').style.display = ''; mostrarLinha();
    $('#dialogo').onclick = (e) => { if (e.target.closest('.dialogo-opcoes')) return; dialogoAvancar(); };
  });
}
// Mostra um texto e as opções (só de fala); devolve o id da escolhida. Setas/W-S navegam, Enter confirma; toque escolhe direto.
function dialogoEscolhaImpl({ nome, retrato = null, texto, opcoes }) {
  return new Promise((res) => {
    dlg = { nome, linhas: [texto], i: 0, res, cheio: false, h: null, escolha: true, cur: Math.max(0, opcoes.findIndex((o) => !o.off)), ops: opcoes }; poeCena(retrato); $('#dialogo').classList.remove('oculto'); $('#dialogo').classList.add('com-opcoes'); $('.dialogo-seta').style.display = 'none';
    const box = $('#dialogo .dialogo-opcoes'); box.innerHTML = '';
    opcoes.forEach((o, n) => { const b = document.createElement('button'); b.className = 'op' + (o.off ? ' off' : ''); b.disabled = !!o.off; b.innerHTML = `<i class="cur">▶</i><span class="op-t">${esc(o.rot)}${o.tom ? ` <em>${esc(o.tom)}</em>` : ''}</span>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}`; b.addEventListener('pointerenter', () => { dlg && (dlg.cur = n, marcaCursor()); }); b.addEventListener('click', (e) => { e.stopPropagation(); escolher(n); }); box.append(b); });
    marcaCursor(); $('#dialogo').onclick = () => dialogoAvancar(); mostrarLinha(); falante('npc');
  });
}
function marcaCursor() { if (!dlg || !dlg.ops) return; [...$('#dialogo .dialogo-opcoes').children].forEach((b, i) => b.classList.toggle('sel', i === dlg.cur)); }
function escolher(n) { if (!dlg || !dlg.ops || !dlg.ops[n] || dlg.ops[n].off) return; const o = dlg.ops[n], r = dlg.res; clearInterval(dlg.h); Au.sfx('select'); fecharDialogo(); r(o.id); }
// diálogos esperam a animação do dado grande (teste de atributo) antes de abrir o texto
export function dialogo(nome, linhas, opts = {}) { return dadosOcupado() ? aguardarDados().then(() => dialogoImpl(nome, linhas, opts)) : dialogoImpl(nome, linhas, opts); }
export function dialogoEscolha(o) { return dadosOcupado() ? aguardarDados().then(() => dialogoEscolhaImpl(o)) : dialogoEscolhaImpl(o); }
export function dialogoNavegar(dir) { if (!dlg || !dlg.ops) return false; const n = dlg.ops.length; let c = dlg.cur; for (let k = 0; k < n; k++) { c = (c + (dir === 'baixo' ? 1 : -1) + n) % n; if (!dlg.ops[c].off) break; } dlg.cur = c; marcaCursor(); Au.sfx('select'); return true; }
function fecharDialogo() { if (dlg) clearInterval(dlg.h); dlg = null; const r = $('#dialogo'); r.classList.add('oculto'); r.classList.remove('cena', 'com-opcoes', 'f-heroi'); r.onclick = null; $('#dialogo .dialogo-opcoes').innerHTML = ''; poeCena(null); }
function mostrarLinha() {
  const d = dlg; if (!d) return;
  const t = $('.dialogo-txt'); let txt = d.linhas[d.i]; let q = 'npc'; if (txt.startsWith('» ')) { q = 'heroi'; txt = txt.slice(2); } else if (txt.startsWith('* ')) { q = 'narra'; txt = txt.slice(2); }
  d.txtAtual = txt; $('.dialogo-nome').textContent = q === 'heroi' ? heroiNome() : q === 'narra' ? '' : d.nome; $('.dialogo-nome').style.display = q === 'narra' ? 'none' : ''; t.classList.toggle('narra', q === 'narra'); falante(q);
  let n = 0; d.cheio = false; t.textContent = ''; clearInterval(d.h);
  d.h = setInterval(() => {
    if (dlg !== d) { clearInterval(d.h); return; }          // diálogo fechado/trocado enquanto digitava
    n += 2; t.textContent = txt.slice(0, n); if (n % 4 === 0) Au.sfx('select');
    if (n >= txt.length) { clearInterval(d.h); d.cheio = true; t.textContent = txt; }
  }, 22);
}
export function dialogoAvancar() {
  if (!dlg) return; if (!dlg.cheio) { clearInterval(dlg.h); $('.dialogo-txt').textContent = dlg.txtAtual; dlg.cheio = true; return; }
  if (dlg.escolha) { escolher(dlg.cur); return; }
  dlg.i++; if (dlg.i >= dlg.linhas.length) { const r = dlg.res; fecharDialogo(); r(); return; } Au.sfx('select'); mostrarLinha();
}
