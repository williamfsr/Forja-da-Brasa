// Diário pessoal: a parte "vida real" do jogo (treino, aeróbico, estudo, dieta, hábitos e o quadro do dia).
// Aparência de caderno de couro com marca-páginas; trocar de tópico vira a página com animação 3D.
import * as St from './store.js';
import { DICAS } from './story.js';
import { hashStr } from './rules.js';
import { registrar, abrirPainel, painelDef, painelId, rerender, esc, fmt, pct, $ } from './uibase.js';
import { barra } from './uiutil.js';
import * as Au from './audio.js';
import * as Rn from './render.js';
import { retrato } from './pessoa.js';
import './paineis1.js';
import './habitos.js';

const S = () => St.S;
const ID = 'pessoal';
const PAGS = [
  ['hoje', '📅', 'Hoje', '#8a3a2a', 'missoes', 'Quadro do dia'],
  ['treino', '🏋️', 'Treino', '#a8742a', 'arena', 'Arena de Ferro'],
  ['aero', '🏃', 'Aeróbico', '#2f6a8a', 'trilha', 'Trilha'],
  ['estudo', '📚', 'Estudo', '#6a4a8a', 'biblioteca', 'Biblioteca'],
  ['dieta', '🍖', 'Taverna', '#3a7a4a', 'taverna', 'Alimentação'],
  ['habitos', '🌱', 'Hábitos', '#5a7a2a', 'habitos', 'Rituais diários'],
];
let pg = 'hoje'; let zerar = false; let virando = false; const usados = new WeakSet();
const idx = (k) => Math.max(0, PAGS.findIndex((p) => p[0] === k));
const embutido = () => painelDef(PAGS[idx(pg)][4]) || {};
const semMovimento = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

// ---------- página da esquerda (só no computador/tablet largo): resumo do dia ----------
function esquerda() {
  const s = S(), D = St.dia(), d = St.der(); const [Y, M, Dd] = St.hoje().split('-').map(Number); const dt = new Date(Y, M - 1, Dd);
  const sem = dt.toLocaleDateString('pt-BR', { weekday: 'long' }), data = dt.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  let ret = ''; try { const c = retrato(Rn.apDe(s), Rn.visDe(s), 3); ret = `<img class="dr-ret" alt="" src="${c.toDataURL()}" width="${c.width}" height="${c.height}">`; } catch (e) { /* sem retrato */ }
  const corpo = D.series > 0 || D.cardio > 0, mente = D.estudo > 0, alma = D.comida.length > 0 || Object.keys(D.hab).length > 0; const q = s.sequencia;
  const linha = (em, nome, v, ok) => `<li class="${ok ? 'ok' : ''}"><span>${ok ? '✔' : '○'} ${em} ${nome}</span><b>${v}</b></li>`;
  const dica = DICAS[hashStr(St.hoje()) % DICAS.length];
  return `<div class="dr-esq-in"><div class="dr-data"><b>${esc(sem)}</b><span>${esc(data)}</span></div>
    <div class="dr-quem">${ret}<div><h3>${esc(s.heroi.nome)}</h3><p class="peq suave">Sequência 🔥 <b>${q.atual}</b> dia(s) · recorde ${q.melhor}</p></div></div>
    <ul class="dr-dia">${linha('🏋️', 'Treino', `${D.series} série(s)`, D.series > 0)}${linha('🏃', 'Aeróbico', `${fmt(D.cardio)} min`, D.cardio > 0)}${linha('📚', 'Estudo', `${fmt(D.estudo)} min`, D.estudo > 0)}${linha('🍖', 'Comida', `${fmt(D.kcal)} / ${fmt(s.heroi.kcalAlvo)} kcal`, D.comida.length > 0)}${linha('🌱', 'Hábitos', `${Object.keys(D.hab).length}/${s.habitos.length}`, Object.keys(D.hab).length > 0)}</ul>
    ${barra(Math.min(D.kcal, s.heroi.kcalAlvo), s.heroi.kcalAlvo)}
    <div class="dr-trip"><span class="${corpo ? 'ok' : ''}">Corpo</span><span class="${mente ? 'ok' : ''}">Mente</span><span class="${alma ? 'ok' : ''}">Alma</span></div>
    <p class="peq suave dr-trip-t">${D.triplice ? '✨ Tríplice Coroa conquistada hoje!' : 'Faça algo de Corpo, Mente e Alma hoje para a Tríplice Coroa.'}</p>
    <div class="dr-nums"><div><b>${fmt(D.xp)}</b><small>XP hoje</small></div><div><b>${s.historia.inercia}/10</b><small>Maré da Inércia</small></div><div><b>${d.hpMax}</b><small>PV máx.</small></div></div>
    <blockquote class="dr-dica">${esc(String(dica).replace(/^Dica:\s*/, ''))}</blockquote><button class="btn bloco" data-act="dr-menu">📜 Abrir o menu do herói</button></div>`;
}
function marcas() {
  const bt = ([k, em, nome, cor]) => `<button class="dr-marca ${pg === k ? 'sel' : ''}" style="--cor:${cor}" data-act="dr-pg" data-k="${k}" aria-label="${nome}"><span class="em">${em}</span><span class="lb">${nome}</span></button>`;
  return PAGS.map(bt).join('') + '<button class="dr-marca" style="--cor:#7a3a1a" data-act="dr-menu" aria-label="Menu do herói"><span class="em">📜</span><span class="lb">Menu</span></button>';
}
function pagina() {
  const i = idx(pg); const def = embutido();
  return `<header class="dr-cab"><h2>${PAGS[i][1]} ${esc(PAGS[i][2])}<small>${esc(PAGS[i][5])}</small></h2><button class="dr-fecha" data-act="fechar" aria-label="Fechar o diário">✕</button></header>
    <nav class="dr-marcas-m">${marcas()}</nav><div class="dr-conteudo">${def.render ? def.render() : ''}</div>
    <footer class="dr-rod"><button class="btn peq" data-act="dr-ant" ${i === 0 ? 'disabled' : ''}>‹ Anterior</button><span>página ${i + 1} de ${PAGS.length}</span><button class="btn peq" data-act="dr-prox" ${i === PAGS.length - 1 ? 'disabled' : ''}>Próxima ›</button></footer>`;
}

// ---------- animação de virar a página ----------
function limpaClone(c) { c.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id')); c.querySelectorAll('[for]').forEach((e) => e.removeAttribute('for')); c.querySelectorAll('[data-act],[data-on]').forEach((e) => { e.removeAttribute('data-act'); e.removeAttribute('data-on'); }); c.setAttribute('aria-hidden', 'true'); c.inert = true; return c; }
function caixaVira(real) {
  const livro = real.parentElement; const b = document.createElement('div'); b.className = 'dr-vira-box'; b.style.cssText = `left:${real.offsetLeft}px;top:${real.offsetTop}px;width:${real.offsetWidth}px;height:${real.offsetHeight}px`; livro.append(b); return b;
}
function folha(conteudoClone, box) {
  const f = document.createElement('div'); f.className = 'dr-vira'; const fr = document.createElement('div'); fr.className = 'face frente'; const ve = document.createElement('div'); ve.className = 'face verso'; const so = document.createElement('div'); so.className = 'sombra';
  fr.append(conteudoClone); fr.append(so.cloneNode()); ve.append(so); f.append(fr, ve); box.append(f); return f;
}
function virar(novo) {
  if (novo === pg || virando) return; const dir = idx(novo) > idx(pg) ? 1 : -1; const real0 = $('.dr-dir'); const antiga = embutido();
  const clone = real0 ? limpaClone(real0.cloneNode(true)) : null; const rol = real0 && real0.querySelector('.dr-conteudo'); const topo = rol ? rol.scrollTop : 0;
  if (antiga.aoFechar) antiga.aoFechar();
  pg = novo; zerar = true; rerender();
  const real = $('.dr-dir'); if (!real || !clone || semMovimento()) { Au.sfx('livro'); return; }
  virando = true; Au.sfx('folha');
  const box = caixaVira(real); const cc = clone.querySelector('.dr-conteudo'); const ms = 780; const ease = 'cubic-bezier(.45,.05,.3,1)'; let f;
  if (dir > 0) {
    f = folha(clone, box); if (cc) cc.scrollTop = topo;
    const a = f.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], { duration: ms, easing: ease, fill: 'forwards' });
    f.querySelectorAll('.sombra').forEach((s) => s.animate([{ opacity: 0 }, { opacity: 0.55, offset: 0.45 }, { opacity: 0 }], { duration: ms, easing: 'linear' }));
    box.animate([{ opacity: 1 }, { opacity: 1, offset: 0.9 }, { opacity: 0 }], { duration: ms + 80, fill: 'forwards' });
    a.onfinish = () => { box.remove(); virando = false; };
  } else {
    const sob = document.createElement('div'); sob.className = 'dr-sob'; sob.append(clone); box.append(sob); if (cc) cc.scrollTop = topo;
    const nova = limpaClone(real.cloneNode(true)); f = folha(nova, box); const nc = nova.querySelector('.dr-conteudo'); if (nc) nc.scrollTop = 0;
    const a = f.animate([{ transform: 'rotateY(-180deg)' }, { transform: 'rotateY(0deg)' }], { duration: ms, easing: ease, fill: 'forwards' });
    f.querySelectorAll('.sombra').forEach((s) => s.animate([{ opacity: 0 }, { opacity: 0.55, offset: 0.55 }, { opacity: 0 }], { duration: ms, easing: 'linear' }));
    a.onfinish = () => { box.remove(); virando = false; };
  }
  setTimeout(() => { virando = false; if (box.isConnected) box.remove(); }, ms + 400);
}
const vai = (d) => { const i = idx(pg) + d; if (i >= 0 && i < PAGS.length) virar(PAGS[i][0]); };

// ---------- painel ----------
const proprias = {
  'dr-pg': (el) => virar(el.dataset.k),
  'dr-prox': () => vai(1), 'dr-ant': () => vai(-1),
  'dr-menu': () => abrirPainel('menu'),
};
const via = (campo) => new Proxy({}, { get: (_, k) => (campo === 'acoes' && proprias[k]) || (embutido()[campo] || {})[k], has: (_, k) => !!((campo === 'acoes' && proprias[k]) || (embutido()[campo] || {})[k]) });
registrar(ID, {
  titulo: 'Diário',
  classe: 'diario',
  rolagem: '.dr-conteudo',
  render(a) {
    if (a && !usados.has(a)) { usados.add(a); if (a.pg) pg = PAGS.some((p) => p[0] === a.pg) ? a.pg : 'hoje'; if (a.painel) { const i = PAGS.findIndex((p) => p[4] === a.painel); if (i >= 0) pg = PAGS[i][0]; } }
    return `<div class="dr" data-pg="${pg}"><div class="dr-livro"><i class="dr-canto c1"></i><i class="dr-canto c2"></i><i class="dr-canto c3"></i><i class="dr-canto c4"></i>
      <div class="dr-paginas"><section class="dr-esq">${esquerda()}</section><section class="dr-dir">${pagina()}</section></div></div><nav class="dr-marcas">${marcas()}</nav></div>`;
  },
  aoAbrir(a, de) {
    if (zerar) { const c = $('.dr-conteudo'); if (c) c.scrollTop = 0; zerar = false; }
    const e = embutido(); if (e.aoAbrir) e.aoAbrir(a, de); if (!de) Au.sfx('livro');
  },
  aoFechar() { const e = embutido(); if (e.aoFechar) e.aoFechar(); },
  ao: via('ao'),
  acoes: via('acoes'),
});
// setas e deslize lateral viram a página
document.addEventListener('keydown', (e) => {
  if (painelId() !== ID || /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) return;
  if (e.key === 'ArrowRight') { vai(1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { vai(-1); e.preventDefault(); }
});
let toque = null;
document.addEventListener('pointerdown', (e) => { if (painelId() !== ID || !e.target.closest('.dr-dir') || e.target.closest('input,select,textarea,button,a,canvas')) { toque = null; return; } toque = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
document.addEventListener('pointerup', (e) => { if (!toque || painelId() !== ID) return; const dx = e.clientX - toque.x, dy = e.clientY - toque.y; const dt = Date.now() - toque.t; toque = null; if (Math.abs(dx) > 90 && Math.abs(dy) < 50 && dt < 700) vai(dx < 0 ? 1 : -1); }, true);
void pct;
