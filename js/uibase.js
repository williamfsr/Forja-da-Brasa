// Infraestrutura da interface: painéis, diálogos, popups e avisos (DOM).
import * as Au from './audio.js';

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
export const painelAberto = () => !!atual;
export const painelId = () => (atual ? atual.id : null);
export function abrirPainel(id, args) {
  const def = regs[id]; if (!def) { toast('Painel indisponível.'); return; }
  atual = { id, def, args }; $('#painel').classList.remove('oculto'); $('#painel-titulo').textContent = typeof def.titulo === 'function' ? def.titulo(args) : def.titulo;
  const c = $('#painel-corpo'); c.innerHTML = def.render(args); c.scrollTop = 0; if (def.aoAbrir) def.aoAbrir(args); Au.sfx('confirm');
}
export function rerender() {
  if (!atual) return; const c = $('#painel-corpo'); const topo = c.scrollTop; const vals = {}; const foco = document.activeElement && document.activeElement.id;
  c.querySelectorAll('input[id],select[id],textarea[id]').forEach((el) => { if (el.dataset.reset === undefined) vals[el.id] = el.type === 'checkbox' ? el.checked : el.value; });
  c.innerHTML = atual.def.render(atual.args);
  for (const [id, v] of Object.entries(vals)) { const el = document.getElementById(id); if (el) { if (el.type === 'checkbox') el.checked = v; else el.value = v; } }
  c.scrollTop = topo; if (foco) { const f = document.getElementById(foco); if (f && f.tagName !== 'SELECT') f.focus({ preventScroll: true }); }
  if (atual.def.aoAbrir) atual.def.aoAbrir(atual.args, true);
}
export function fecharPainel() { if (!atual) return; const d = atual.def; atual = null; $('#painel').classList.add('oculto'); if (d.aoFechar) d.aoFechar(); Au.sfx('back'); }
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

// ---------- diálogos (caixa de texto estilo RPG) ----------
let dlg = null;
export const dialogoAberto = () => !!dlg;
export function dialogo(nome, linhas) {
  return new Promise((res) => {
    dlg = { nome, linhas: linhas.slice(), i: 0, res, cheio: false, h: null }; $('#dialogo').classList.remove('oculto'); $('.dialogo-nome').textContent = nome; mostrarLinha();
    $('#dialogo').onclick = () => dialogoAvancar();
  });
}
function mostrarLinha() {
  const t = $('.dialogo-txt'); const txt = dlg.linhas[dlg.i]; let n = 0; dlg.cheio = false; t.textContent = ''; clearInterval(dlg.h);
  dlg.h = setInterval(() => { n += 2; t.textContent = txt.slice(0, n); if (n % 4 === 0) Au.sfx('select'); if (n >= txt.length) { clearInterval(dlg.h); dlg.cheio = true; t.textContent = txt; } }, 22);
}
export function dialogoAvancar() {
  if (!dlg) return; if (!dlg.cheio) { clearInterval(dlg.h); $('.dialogo-txt').textContent = dlg.linhas[dlg.i]; dlg.cheio = true; return; }
  dlg.i++; if (dlg.i >= dlg.linhas.length) { const r = dlg.res; dlg = null; $('#dialogo').classList.add('oculto'); $('#dialogo').onclick = null; r(); return; } Au.sfx('select'); mostrarLinha();
}
