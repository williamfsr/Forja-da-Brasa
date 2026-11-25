// Dados animados: cada rolagem aparece rodando na tela.
// Em combate: pequeno, no canto direito. Em diálogo, testes e fora de combate: grande, no centro, no estilo do baú.
import { HOOK } from './srd.js';
import * as Au from './audio.js';

const FORMAS = {
  4: { poly: '50,6 94,88 6,88', linhas: ['50,6 50,62', '6,88 50,62', '94,88 50,62'], tx: 50, ty: 72 },
  6: { rect: true, linhas: [], tx: 50, ty: 58 },
  8: { poly: '50,3 95,50 50,97 5,50', linhas: ['5,50 95,50'], tx: 50, ty: 59 },
  10: { poly: '50,3 94,40 50,97 6,40', linhas: ['50,3 50,40', '6,40 50,40', '94,40 50,40', '50,40 50,97'], tx: 50, ty: 66 },
  12: { poly: '50,3 96,37 79,92 21,92 4,37', linhas: ['50,3 50,28', '96,37 72,45', '79,92 66,62', '21,92 34,62', '4,37 28,45', '28,45 50,28 72,45 66,62 34,62 28,45'], tx: 50, ty: 58 },
  20: { poly: '50,4 92,27 92,73 50,96 8,73 8,27', linhas: ['50,4 50,28', '92,27 72,62', '92,73 72,62', '50,96 72,62', '50,96 28,62', '8,73 28,62', '8,27 28,62', '8,27 50,28', '92,27 50,28', '50,28 72,62 28,62 50,28'], tx: 50, ty: 59 },
};
const forma = (f) => FORMAS[f] || FORMAS[f > 12 ? 20 : f > 8 ? 10 : f > 6 ? 8 : f > 4 ? 6 : 4];
function svgDado(f, v, estilo) {
  const F = forma(f); const fill = estilo.fill, line = estilo.linha, txt = estilo.txt; const tam = String(v).length > 2 ? 24 : String(v).length > 1 ? 30 : 36;
  const corpo = F.rect ? `<rect x="10" y="10" width="80" height="80" rx="14" fill="${fill}" stroke="#14101c" stroke-width="5"/>` : `<polygon points="${F.poly}" fill="${fill}" stroke="#14101c" stroke-width="5" stroke-linejoin="round"/>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${corpo}${F.linhas.map((l) => `<polyline points="${l}" fill="none" stroke="${line}" stroke-width="2" stroke-linejoin="round" opacity=".55"/>`).join('')}<text x="${F.tx}" y="${F.ty}" text-anchor="middle" dominant-baseline="middle" font-size="${tam}" font-weight="900" font-family="ui-monospace,Menlo,Consolas,monospace" fill="${txt}">${v}</text></svg>`;
}
function estiloDe(d, grupo) {
  if (d.f === 20 && d.v === 20) return { fill: '#ffb020', linha: '#fff4c0', txt: '#14101c', cls: 'crit' };
  if (d.f === 20 && d.v === 1) return { fill: '#8a8a96', linha: '#3a3a46', txt: '#ff4a5c', cls: 'falha' };
  if (d.f === 20) return { fill: '#ffd23f', linha: '#8a6a10', txt: '#14101c', cls: '' };
  if (grupo && grupo.cura) return { fill: '#6fcf7f', linha: '#1a6a2a', txt: '#0a2a12', cls: '' };
  return { fill: '#ff8a5a', linha: '#8a2a10', txt: '#2a0a04', cls: '' };
}

let raiz = null, fila = [], buf = [], tocando = false, rapido = false, agendado = false;
function garantir() { if (raiz) return raiz; raiz = document.createElement('div'); raiz.id = 'dados'; raiz.className = 'oculto'; raiz.setAttribute('aria-hidden', 'true'); document.body.append(raiz); return raiz; }
const emBatalha = () => document.body.classList.contains('em-batalha');
const dialogoAberto = () => { const d = document.getElementById('dialogo'); return !!d && !d.classList.contains('oculto'); };

// ---- entrada: o gancho do motor de regras ----
function emitir(dados, info) {
  if (!dados || !dados.length) return; for (const d of dados) buf.push({ f: d.f, v: d.v });
  if (!agendado) { agendado = true; queueMicrotask(() => { agendado = false; descarregar(false); }); }
}
// descarrega o que foi rolado neste instante em um grupo; "grande" força a versão central (diálogo)
function descarregar(grande) {
  if (!buf.length) return; const dados = buf.splice(0); const g = { dados, grande: !!grande || (!emBatalha()) || dialogoAberto(), extra: null };
  if (g.grande === false && fila.length >= 3) fila.shift(); fila.push(g); if (!tocando) proximo();
}
// teste de atributo (diálogo): d20 + modificador contra CD — sempre grande, com legenda
export function teste20(v, { mod = 0, dc = null, rot = '', ok: okForcado = null } = {}) {
  descarregar(true); // o que já estava pendente sai antes
  const total = v + mod; const ok = okForcado != null ? okForcado : dc == null ? null : (v === 20 || (v !== 1 && total >= dc));
  const leg = `${rot ? rot + ' · ' : ''}d20 ${v}${mod ? (mod > 0 ? ' + ' + mod : ' − ' + Math.abs(mod)) : ''} = ${total}${dc != null ? ` · CD ${dc}` : ''}${ok === true ? (v === 20 ? ' · CRÍTICO!' : ' · SUCESSO') : ok === false ? (v === 1 ? ' · DESASTRE' : ' · FALHA') : ''}`;
  fila.push({ dados: [{ f: 20, v }], grande: true, extra: { leg, ok, v } }); if (!tocando) proximo();
}
export const ocupado = () => tocando || fila.length > 0 || buf.length > 0;
// o diálogo chama isto antes de abrir: se há dados rolando, espera a animação grande terminar
export function aguardar() {
  if (buf.length) descarregar(true); else for (const g of fila) g.grande = true;
  if (!tocando && !fila.length) return Promise.resolve(); return new Promise((res) => { esperando.push(res); });
}
const esperando = [];
function liberar() { if (!tocando && !fila.length) while (esperando.length) esperando.shift()(); }

function proximo() {
  const g = fila.shift(); if (!g) { tocando = false; liberar(); return; } tocando = true; rapido = false; const r = garantir();
  const grande = g.grande; const dados = g.dados; const MAX = grande ? 6 : 5; const mostrados = dados.slice(0, MAX); const resto = dados.length - mostrados.length;
  r.className = grande ? 'grande' : 'peq'; r.innerHTML = '';
  if (!grande) { const ins = document.getElementById('bt-menu'); const w = ins && ins.getBoundingClientRect(); const lado = w && w.width && w.width < innerWidth * 0.7 ? w.width : 0; const ord = document.getElementById('bt-ordem'); const topo = ord ? ord.getBoundingClientRect().bottom + 8 : 60; r.style.top = topo + 'px'; r.style.right = (lado + 10) + 'px'; } else { r.style.top = ''; r.style.right = ''; }
  const linha = document.createElement('div'); linha.className = 'dados-linha'; r.append(linha);
  const els = mostrados.map((d) => { const e = document.createElement('div'); const st = estiloDe(d, g); e.className = 'dado rolando ' + st.cls; e.dataset.f = d.f; e.innerHTML = svgDado(d.f, 1 + Math.floor(Math.random() * d.f), st); linha.append(e); return { e, d, st }; });
  if (resto > 0) { const m = document.createElement('div'); m.className = 'dados-mais'; m.textContent = `+${resto}`; linha.append(m); }
  const leg = document.createElement('div'); leg.className = 'dados-leg'; r.append(leg);
  const soma = dados.reduce((a, d) => a + d.v, 0); const unico = dados.length === 1; leg.textContent = g.extra && g.extra.leg ? '' : (unico ? `d${dados[0].f}` : `${dados.length} dados`);
  r.classList.remove('oculto'); r.style.opacity = '1'; const dur = grande ? 1050 : 620; const t0 = performance.now(); let n = 0;
  Au.sfx && Au.sfx('rolar');
  const iv = setInterval(() => { const dt = performance.now() - t0; if (dt < dur && !rapido) { for (const { e, d, st } of els) { e.innerHTML = svgDado(d.f, 1 + Math.floor(Math.random() * d.f), st); } if (++n % 5 === 0) Au.sfx && Au.sfx('rolar'); return; }
    clearInterval(iv); for (const { e, d, st } of els) { e.classList.remove('rolando'); e.classList.add('pronto'); e.innerHTML = svgDado(d.f, d.v, st); }
    const nat20 = dados.some((d) => d.f === 20 && d.v === 20), nat1 = unico && dados[0].f === 20 && dados[0].v === 1;
    if (g.extra && g.extra.leg) { leg.textContent = g.extra.leg; if (g.extra.ok === true) leg.classList.add('ok'); else if (g.extra.ok === false) leg.classList.add('ruim'); }
    else if (!unico) leg.textContent = `Σ ${soma}`;
    if (nat20) { r.classList.add('crit'); Au.sfx && Au.sfx('pr'); } else if (nat1) { r.classList.add('falha'); Au.sfx && Au.sfx('hit'); } else Au.sfx && Au.sfx('select');
    const fica = grande ? 900 : 650; setTimeout(() => { r.style.opacity = '0'; setTimeout(() => { if (!fila.length) { r.classList.add('oculto'); r.classList.remove('crit', 'falha'); } proximo(); }, 220); }, rapido ? 150 : fica);
    // quem espera (diálogo) volta um pouco antes do fim, para o texto aparecer com o dado ainda na tela
    setTimeout(() => { if (!fila.length) { while (esperando.length) esperando.shift()(); } }, rapido ? 100 : Math.min(500, fica - 150));
  }, 55);
}
document.addEventListener('pointerdown', () => { if (tocando) rapido = true; }, true);
HOOK.emit = emitir;
export const Dados = { teste20, aguardar, ocupado };
