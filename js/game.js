// Motor do jogo 2D em 32 bits: vila, Vale, masmorras procedurais e batalhas táticas por turnos sobre o próprio mapa.
import { Dados } from './dados.js';
import { rolar } from './srd.js';
import { CLASSES, ITENS, MONSTROS } from './srd.js';
import { CAPITULOS, NPCS } from './story.js';
import * as St from './store.js';
import { nReliquias, ativas as questsAtivas, progressoQuest } from './campanha.js';
import * as R from './rules.js';
import * as Tt from './tatico.js';
import { gerarMasmorra, visiveis, T } from './dungeon.js';
import { obterMapa, solidoEm, bausDoDia, DESTINOS_VIAGEM } from './world.js';
import './pessoas.js';
import { interagirObjeto } from './interacoes.js';
import * as Au from './audio.js';
import * as Rn from './render.js';
import * as Ba from './batalha.js';
import { spriteObjeto } from './arte.js';
import { retrato, spritePessoa } from './pessoa.js';
import { spriteMonstro } from './monstros.js';
import { NPC_PERFIL } from './personalidade.js';
import { conversar, visitaPendente, visitaDoRei, sonho, dadiva, teo } from './conversa.js';
import { QLUG } from './historia2.js';
import { LUG } from './mundo.js';
import { apPadrao } from './cosmeticos.js';
import { criarGrupo, tamanhoGrupo, comPerfil } from './encontros.js';
import { texto } from './gfx.js';
import { passoVida, ambiente, Vida, vidaAtual } from './vida.js';
import * as Luz from './luz.js';
import * as Clima from './clima.js';
import { FESTA_LISTA, festaVerificar, festaAtiva, introPendente, introFesta, festaNpcs, conversarFesta, desenharFesta, confete } from './festa.js';
import { safiraNaVila, posSafira, conversarSafira, instalar as instalarSafira } from './safira.js';
import { parceiro } from './romance.js';

const TS = Rn.TS;
const DIRV = { cima: [0, -1], baixo: [0, 1], esq: [-1, 0], dir: [1, 0] };
const TEMAS_CATA = ['porao', 'caverna', 'cripta', 'floresta', 'mina', 'pantano', 'torre', 'cemiterio', 'afundada', 'forja', 'abismo', 'trono'];
const S = () => St.S;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (n) => Math.floor(Math.random() * n);
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

export const G = { modo: 'titulo', ui: null, ocupado: false, D: null, mapa: null };
let insetN = 0, festaT = 0, visitaT = 0, canvas, ultimoT = 0, tempo = 0, stepCool = 6, mapa, npcs = [], D = null, cenaBat = 'vale';
const NOME_PAINEL = { forja: 'Forja da Brasa', arena: 'Arena de Ferro', templo: 'Templo', biblioteca: 'Biblioteca', taverna: 'Taverna', alquimista: 'Alquimia', mercador: 'Empório', trilha: 'Pavilhão da Trilha' };
const P = { x: 14, y: 26, dir: 'baixo', mov: null, passo: 0 };
G.P = P; G.npcsAtuais = () => npcs; G.falar = (n) => falarComNpc(n);
const fade = { a: 0, alvo: 0, res: null };
const pilha = []; let pedidoA = false, pedidoB = false;
const flut = []; // textos flutuantes de exploração

// ---------- inicialização ----------
export function iniciarJogo(cv) {
  canvas = cv; Rn.iniciarVista(canvas); instalarEntrada();
  trocarMapaSemFade('vila', null); G.modo = 'titulo'; requestAnimationFrame(loop);
  const salvar = () => { try { salvarRun(); if (St.S) St.salvar(); } catch (e) { /* ignorado */ } };
  window.addEventListener('pagehide', salvar); document.addEventListener('visibilitychange', () => { if (document.hidden) salvar(); else G.verificarDia(); });
  setInterval(() => G.verificarDia(), 30000);
}
G.verificarDia = () => {
  if (!St.S || !['vila', 'vale'].includes(G.modo) || G.ocupado) return;
  if (St.S.diario.data !== St.hoje()) { St.virarDia(); St.S.diario.baus = null; }
};
G.comecar = async (novo) => {
  Au.destravar(); G.ocupado = false;
  if (!novo && S().run) { const ok = await G.ui.confirmar('Masmorra em andamento', 'Você estava explorando uma masmorra. Retomar de onde parou?', 'Retomar', 'Sair para a vila'); if (ok) return retomarRun(); abandonarRun(false); }
  if (St.S.diario.data !== St.hoje()) { St.virarDia(); St.S.diario.baus = null; } trocarMapaSemFade('vila', null); G.modo = 'vila'; Au.tocarMusica('vila'); G.ui.hud();
};
G.irVila = () => comFade(() => { trocarMapaSemFade('vila', obterMapa('vila').retornoPortal); Au.tocarMusica('vila'); });
// viagem rápida (marcos, menu): casa, praça da vila e lugares já visitados
G.viajar = async (id) => {
  if (G.modo === 'masmorra' || G.modo === 'batalha' || G.modo === 'titulo') { G.ui.toast('Não dá para viajar agora.'); return false; }
  const d = DESTINOS_VIAGEM.find((x) => x.id === id); if (!d) return false;
  await comFade(async () => { trocarMapaSemFade(d.mapa, d.pos); Au.tocarMusica(G.modo === 'vale' ? 'mundo' : 'vila'); }); G.ui.hud(); return true;
};
G.NOME_PAINEL = NOME_PAINEL; G.dadiva = () => dadiva(G); G.teo = () => teo(G); G.sonho = () => sonho(G);
G.retratoDe = (id) => { const pf = NPC_PERFIL[id]; return pf ? retrato(pf.ap, { nivel: 6, capaC: '#8a2a1a', capaC2: '#5a1a10', ...pf.vis }, 4) : null; };
instalarSafira(G);
G.retratoNhor = () => { const ap = Object.assign(apPadrao('paladino', 'humano'), { pele: '#d8d0e0', cabeloCor: '#d9d9de', cabelo: 3, olhosCor: '#9aa8b8', marca: 6, roupa1: '#2a2a38', roupa2: '#14141c', sobr: 3, boca: 2, arm1: '#2a2a38', arm2: '#8a8aa0', elmo: false, capa: 2 }); return retrato(ap, { cls: 'paladino', cat: 'pesada', ornam: 5, nivel: 20, capaC: '#3a3a4a', capaC2: '#14141c' }, 4); };
G.visitados = () => ((S().mundo ||= { visitados: {} }).visitados);

// ---------- entrada ----------
function instalarEntrada() {
  const mapaTeclas = { ArrowUp: 'cima', ArrowDown: 'baixo', ArrowLeft: 'esq', ArrowRight: 'dir', w: 'cima', s: 'baixo', a: 'esq', d: 'dir', W: 'cima', S: 'baixo', A: 'esq', D: 'dir' };
  const emCampo = () => { const t = document.activeElement && document.activeElement.tagName; return t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA'; };
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key;
    if (emCampo()) { if (k === 'Escape') { document.activeElement.blur(); } return; }
    const d = mapaTeclas[k];
    if (d && G.ui.dialogoAberto() && (d === 'cima' || d === 'baixo') && G.ui.dialogoNavegar(d)) { e.preventDefault(); return; }
    if (d) { if (!pilha.includes(d)) pilha.push(d); if (!G.ui.modalAberto()) e.preventDefault(); return; }
    if (k === 'Enter' || k === ' ' || k === 'z' || k === 'Z') { if (!G.ui.modalAberto() || G.ui.dialogoAberto()) { pedidoA = true; e.preventDefault(); } }
    else if (k === 'x' || k === 'X' || k === 'Escape' || k === 'Backspace') { pedidoB = true; }
    else if (k === 'm' || k === 'M' || k === 'Tab') { pedidoB = false; if (!G.ui.modalAberto() && G.modo !== 'batalha') G.ui.painel('menu'); e.preventDefault(); }
  });
  document.addEventListener('keyup', (e) => { const d = mapaTeclas[e.key]; if (d) { const i = pilha.indexOf(d); if (i >= 0) pilha.splice(i, 1); } });
  window.addEventListener('blur', () => { pilha.length = 0; });
  const bind = (el, down, up) => {
    const solta = (e) => { e.preventDefault(); up(); el.classList.remove('ativo'); };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } el.classList.add('ativo'); Au.destravar(); down(); });
    el.addEventListener('pointerup', solta); el.addEventListener('pointercancel', solta); el.addEventListener('lostpointercapture', () => { up(); el.classList.remove('ativo'); });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  };
  document.querySelectorAll('[data-dir]').forEach((el) => { const d = el.dataset.dir; bind(el, () => { if (G.ui.dialogoAberto() && (d === 'cima' || d === 'baixo')) { G.ui.dialogoNavegar(d); return; } if (!pilha.includes(d)) pilha.push(d); }, () => { const i = pilha.indexOf(d); if (i >= 0) pilha.splice(i, 1); }); });
  const A = document.getElementById('btn-a'), B = document.getElementById('btn-b'), M = document.getElementById('btn-menu');
  if (A) bind(A, () => { if (!G.ui.modalAberto() || G.ui.dialogoAberto()) pedidoA = true; }, () => {});
  if (B) bind(B, () => { pedidoB = true; }, () => {});
  // desktop: botão esquerdo do mouse = A (sobre o mapa), direito = B (em qualquer lugar fora de campos de texto)
  const tela = document.getElementById('tela');
  if (tela) tela.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 0 || G.modo === 'batalha' || G.modo === 'titulo') return; Au.destravar(); if (!G.ui.modalAberto() || G.ui.dialogoAberto()) pedidoA = true; });
  document.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 2 || emCampo() || G.modo === 'titulo') return; if (e.target.closest && e.target.closest('#titulo')) return; Au.destravar(); pedidoB = true; });
  document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('input, textarea, select')) return; e.preventDefault(); });
  if (M) M.addEventListener('click', () => { Au.destravar(); if (G.modo !== 'batalha' && G.modo !== 'titulo' && !G.ui.modalAberto()) G.ui.painel('menu'); });
}

// ---------- laço principal ----------
function loop(t) {
  const dt = Math.min(0.05, (t - ultimoT) / 1000 || 0); ultimoT = t; tempo += dt;
  try { atualizar(dt); desenhar(); } catch (e) { console.error(e); }
  requestAnimationFrame(loop);
}
function atualizar(dt) {
  if (fade.a !== fade.alvo) { const v = dt * 4.2; fade.a = fade.a < fade.alvo ? Math.min(fade.alvo, fade.a + v) : Math.max(fade.alvo, fade.a - v); if (fade.a === fade.alvo && fade.res) { const r = fade.res; fade.res = null; r(); } }
  for (let i = flut.length - 1; i >= 0; i--) { flut[i].t += dt * 0.9; if (flut[i].t > 1.15) flut.splice(i, 1); }
  Rn.PART.passo(dt);
  { const foraC = G.modo !== 'masmorra' && !(G.modo === 'batalha' && cenaBat === 'masmorra') && !(mapa && mapa.interior); Clima.passo(dt, St.S, foraC); Luz.passo(dt, St.S); }
  if (St.S && G.modo !== 'masmorra' && !(G.modo === 'batalha' && cenaBat === 'masmorra') && G.modo !== 'titulo') { const [px, py] = posJogador(); passoVida(dt, St.S, px * TS + 16, py * TS + 16, G.ui && G.ui.toast); if (!Vida.onda || true) ambiente(dt, Rn.PART, Rn.cam, Rn.VW, vidaAtual()); }
  if (G.modo === 'batalha') { Ba.atualizar(dt); sincronizarVisaoBatalha(); consumirPedidos(); return; }
  if (G.modo === 'titulo') { atualizarNpcs(dt); consumirPedidos(); return; }
  festaT += dt; if (festaT > 1.5 && St.S && G.modo !== 'titulo') { festaT = 0; const ev = festaVerificar(); const livreF = !G.ocupado && !P.mov && (G.modo === 'vila' || G.modo === 'vale') && !(mapa && mapa.interior) && !G.ui.modalAberto() && !fade.alvo;
    if (ev === 'fim') { G.ui.toast('A festa acabou. A Névoa espreita de novo: não pare agora.', 5200); if (mapa && G.mapa === 'vila') npcs = npcsDoMapa('vila'); }
    if (livreF && introPendente()) introFesta(G).then(() => { if (mapa && G.mapa === 'vila') npcs = npcsDoMapa('vila'); }); }
  if (festaAtiva() && G.mapa === 'vila' && (G.modo === 'vila' || G.modo === 'batalha')) confete(dt, Rn.PART, Rn.cam, Rn.VW);
  visitaT += dt; if (visitaT > 4 && !G.ocupado && !P.mov && (G.modo === 'vila' || G.modo === 'vale') && !(mapa && mapa.interior) && !G.ui.modalAberto() && !fade.alvo && St.S) { visitaT = 0; if (visitaPendente()) visitaDoRei(G); }
  if (P.mov) { P.mov.t += dt / P.mov.dur; if (P.mov.t >= 1) { P.x = P.mov.x1; P.y = P.mov.y1; P.mov = null; P.passo++; chegou(); } }
  atualizarNpcs(dt); if (D) atualizarMonstrosAnim(dt);
  const livre = !G.ocupado && !G.ui.modalAberto() && fade.a < 0.2;
  if (livre && !P.mov && pilha.length) iniciarMov(pilha[pilha.length - 1]);
  if (pedidoA) { pedidoA = false; if (livre && !P.mov) interagir(); else if (G.ui.dialogoAberto()) G.ui.dialogoAvancar(); }
  if (pedidoB) { pedidoB = false; if (G.ui.modalAberto()) G.ui.fechar(); else if (livre && !P.mov && G.modo !== 'titulo') G.ui.painel('menu'); }
}
function consumirPedidos() {
  if (pedidoA) { pedidoA = false; if (G.ui.dialogoAberto()) G.ui.dialogoAvancar(); else Ba.teclaA(); }
  if (pedidoB) { pedidoB = false; if (G.ui.modalAberto()) G.ui.fechar(); else Ba.teclaB(); }
}
function fadeTo(v) { fade.alvo = v; if (fade.a === v) return Promise.resolve(); return new Promise((r) => { fade.res = r; }); }
async function comFade(fn) { G.ocupado = true; await fadeTo(1); try { await fn(); } finally { await fadeTo(0); G.ocupado = false; } }

// ---------- mapas fixos (região, vilas e interiores) ----------
const musicaDe = (m) => (m.tipo === 'regiao' ? 'mundo' : 'vila');
function trocarMapaSemFade(id, pos) {
  if (id.includes('/')) obterMapa(id.split('/')[0]); // garante a fábrica do interior
  mapa = obterMapa(id); G.mapa = id; G.mp = mapa; const p = pos || mapa.spawn || { x: 1, y: 1 };
  P.x = p.x; P.y = p.y; P.mov = null; P.dir = 'baixo'; D = null; G.D = null; flut.length = 0; pilha.length = 0;
  npcs = npcsDoMapa(id);
  G.modo = mapa.tipo === 'regiao' ? 'vale' : (G.modo === 'titulo' ? 'titulo' : 'vila');
  if (St.S) { G.visitados()[id.split('/')[0]] = true; if (mapa.tipo === 'regiao') garantirBausDoDia(); }
  Rn.PART.limpar && Rn.PART.limpar();
}
// população do mapa: a base, mais quem só aparece em certos dias (Safira às quintas), a festa na praça e o par que mora com o herói
const FESTA_IDS = new Set(FESTA_LISTA);
const criarNpc = (n) => ({ ...n, home: { x: n.x, y: n.y }, dir: 'baixo', mov: null, t: 1 + Math.random() * 3, passo: 0 });
function npcsDoMapa(id) {
  let base = mapa.npcs.slice(); const livre = (x, y) => x > 0 && y > 0 && x < mapa.w - 1 && y < mapa.h - 1 && !solidoEm(mapa, x, y) && !mapa.gat[y * mapa.w + x];
  if (St.S && id === 'vila') {
    if (festaAtiva()) { const ids = new Set(); const fest = festaNpcs(livre); fest.forEach((f) => ids.add(f.id)); base = base.filter((n) => !ids.has(n.id)).concat(fest); }
    if (safiraNaVila()) base.push({ id: 'safira', x: posSafira.x, y: posSafira.y, fixo: true });
  }
  if (St.S && festaAtiva() && id.startsWith('vila/')) base = base.filter((n) => !FESTA_IDS.has(n.id));
  const par = St.S && parceiro(); if (par && par.tipo === 'casado' && id === 'vila/casa') base.push({ id: par.id, x: 9, y: 3, fixo: true });
  return base.map(criarNpc);
}
function garantirBausDoDia() { const s = S(); if (!s.diario.baus) s.diario.baus = bausDoDia(mapa, s.diario.data, s.criado, St.capituloDisponivel() || 20); }
async function trocarMapa(para, pos) {
  await comFade(async () => { trocarMapaSemFade(para, pos); Au.tocarMusica(musicaDe(mapa)); G.ui.hud(); });
}
function npcEm(x, y) { return npcs.find((n) => (n.x === x && n.y === y) || (n.mov && n.mov.x1 === x && n.mov.y1 === y)); }
function baus() { return mapa && mapa.tipo === 'regiao' && S() && S().diario.baus ? S().diario.baus : []; }
function bauEm(x, y) { return baus().find((b) => b.x === x && b.y === y); }

function iniciarMov(d) {
  P.dir = d; const [dx, dy] = DIRV[d], nx = P.x + dx, ny = P.y + dy;
  if (G.modo === 'masmorra') return movMasmorra(d, nx, ny);
  const g = mapa.gat[ny * mapa.w + nx];
  if (g && !g.passa && !mapa.interior && g.tipo !== 'obj') { pilha.length = 0; acionar(g); return; }
  const b = bauEm(nx, ny); if (b) { pilha.length = 0; abrirBauDoVale(b); return; }
  if (solidoEm(mapa, nx, ny) || npcEm(nx, ny)) return;
  P.mov = { x0: P.x, y0: P.y, x1: nx, y1: ny, t: 0, dur: 0.17 };
}
function chegou() {
  if (G.modo === 'masmorra') return chegouMasmorra();
  const g = mapa.gat[P.y * mapa.w + P.x];
  if (g && g.passa) { pilha.length = 0; acionar(g); return; }
  if (mapa.tipo === 'regiao') { const i = P.y * mapa.w + P.x; if (mapa.enc[i] && --stepCool <= 0 && Math.random() < 0.08) { stepCool = 7; encontroDoVale(i); } }
}
function interagir() {
  if (G.modo === 'masmorra') return interagirMasmorra();
  const [dx, dy] = DIRV[P.dir], tx = P.x + dx, ty = P.y + dy;
  const n = npcEm(tx, ty); if (n) return falarComNpc(n);
  const g = mapa.gat[ty * mapa.w + tx]; if (g) return acionar(g);
  const b = bauEm(tx, ty); if (b) return abrirBauDoVale(b);
  // balcão: o morador logo atrás da bancada atende
  const n2 = npcEm(tx + dx, ty + dy); if (n2 && n2.painel && solidoEm(mapa, tx, ty)) return falarComNpc(n2);
}
async function acionar(g) {
  Au.sfx(g.tipo === 'painel' ? 'porta' : g.tipo === 'mapa' ? 'passo' : 'select');
  if (g.tipo === 'painel') G.ui.painel(g.id);
  else if (g.tipo === 'mapa') await trocarMapa(g.para, g.pos || null);
  else if (g.tipo === 'cap') G.ui.tentarCapitulo(g.n);
  else if (g.tipo === 'cata') await entrarCata(g);
  else if (g.tipo === 'obj') await G.interagirObjeto(g.id, g);
}
G.irMapa = (id, pos) => trocarMapa(id, pos || null);
G.interagirObjeto = (id, g) => interagirObjeto(id, G, { g });
async function entrarCata(g) {
  const s = S(); if (s.run) { G.ui.toast('Você já está em uma masmorra.'); return; }
  const ok = await G.ui.confirmar(g.rot || 'Catacumbas', `Uma entrada para masmorras sem fim, gerada de novo a cada visita. Cada andar custa 1 Tocha (você tem ${s.heroi.tochas}). O saque vem das criaturas, baús e armadilhas — e a Maré da Inércia se importa com quem não treina.`, 'Descer', 'Ficar');
  if (ok) await G.entrarMasmorra({ tipo: 'cata', tema: g.tema });
}
async function abrirBauDoVale(b) {
  if (b.aberto) { G.ui.toast('Baú vazio. Novos baús surgem a cada amanhecer.'); return; }
  b.aberto = true; Au.sfx('chest'); const L = S().heroi.nivel; St.darBau(1 + Math.floor(L / 6), 'vale'); St.salvar();
}

// ---------- NPCs: retrato, personalidade e afinidade ----------
const npcVis = (pf) => ({ nivel: 6, capaC: '#8a2a1a', capaC2: '#5a1a10', ...pf.vis });
function spriteNpc(n) { const pf = NPC_PERFIL[n.id]; if (!pf) return null; const d = n.dir === 'dir' ? 'esq' : n.dir; return spritePessoa(pf.ap, npcVis(pf), d, n.mov ? (n.passo % 2 ? 'andar1' : 'andar2') : 'idle'); }
async function falarComNpc(n) {
  const def = NPCS[n.id]; if (!def) return; G.ocupado = true; const pf = NPC_PERFIL[n.id];
  const dx = P.x - n.x, dy = P.y - n.y; n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'dir' : 'esq') : (dy > 0 ? 'baixo' : 'cima'); n.mov = null;
  const ret = pf ? retrato(pf.ap, npcVis(pf), 4) : null; const nome = def.nome + (def.papel ? ` · ${def.papel}` : '');
  Au.sfx('select'); let abrir = false;
  const normal = () => conversar(G, n, def, pf, ret, nome, falaContextual(n.id));
  try { abrir = n.id === 'safira' ? await conversarSafira(G, n, def, pf, ret, nome) : (n.festa && festaAtiva()) ? await conversarFesta(G, n, def, pf, ret, nome, normal) : await normal(); } finally { G.ocupado = false; }
  if (abrir) G.ui.painel(n.painel);
}
function falaContextual(id) {
  const s = S(), Dd = St.dia(), h = s.historia;
  switch (id) {
    case 'lucia': { const mi = St.inerciaEf(s); return `Maré da Inércia: ${mi}/10 — ${mi >= 7 ? 'perigosa!' : mi >= 4 ? 'fique atento.' : 'sob controle.'}`; }
    case 'ferrao': return Dd.series ? `Hoje: ${Dd.series} série(s) e ${Dd.prs} PR(s). ${Dd.series >= 6 ? 'Isso é treino!' : 'Dá para mais.'}` : 'Hoje ainda não vi você suar aqui.';
    case 'eruvim': return Dd.estudo ? `${Dd.estudo} min de estudo hoje.` : 'Nenhuma página virada hoje...';
    case 'tavi': { const f = St.faixaDeHoje(); return `Sua mesa hoje: ${f.nome}.`; }
    case 'aurora': return s.heroi.exaustao ? `Você carrega Exaustão ${s.heroi.exaustao}. Coma, durma, descanse.` : 'Seu corpo parece em paz.';
    case 'brasa': return s.sequencia.atual ? `Sequência de ${s.sequencia.atual} dia(s). A Brasa agradece.` : 'Acenda a sequência hoje. Um treino basta.';
    case 'quinzinho': return `Você tem ${s.heroi.ouro} de ouro. Olhe a vitrine!`;
    default: return null;
  }
}
function atualizarNpcs(dt) {
  for (const n of npcs) {
    if (n.mov) { n.mov.t += dt / 0.4; if (n.mov.t >= 1) { n.x = n.mov.x1; n.y = n.mov.y1; n.mov = null; n.passo++; } continue; }
    if (n.fixo || G.ocupado) continue; n.t -= dt; if (n.t > 0) continue; n.t = 1.2 + Math.random() * 3;
    const d = ['cima', 'baixo', 'esq', 'dir'][rnd(4)], [dx, dy] = DIRV[d]; const nx = n.x + dx, ny = n.y + dy; n.dir = d;
    if (Math.abs(nx - n.home.x) + Math.abs(ny - n.home.y) > (n.raio || 2)) continue;
    if (solidoEm(mapa, nx, ny) || mapa.gat[ny * mapa.w + nx] || npcEm(nx, ny) || (P.x === nx && P.y === ny) || (P.mov && P.mov.x1 === nx && P.mov.y1 === ny)) continue;
    n.mov = { x1: nx, y1: ny, t: 0 };
  }
}

// ======================= BATALHA TÁTICA NO MAPA =======================
function aliadosParaBatalha(s) {
  const L = s.heroi.nivel; const [eh, ed] = R.escalaNivel(L);
  return (s.companheiros || []).map((c) => { const m = R.criarMonstro(c.mon, { esc: Math.max(0.6, eh * 0.9), ov: { dm: ed * 0.7 } }); m.n = c.nome; m.ap = c.ap || m.ap; m.spr = c.spr || m.spr; m.pal = c.pal || m.pal; m.frase = c.frase; return m; });
}
function posicoesExterior(grade, hx, hy, n) {
  const livre = (x, y) => !grade.solido(x, y) && !(x === hx && y === hy); const cand = [];
  for (let d = 5; d <= 7 && !cand.length; d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue; const x = hx + dx, y = hy + dy; if (livre(x, y) && Tt.temLOS({ g: grade }, { x: hx, y: hy }, { x, y })) cand.push({ x, y }); }
  if (!cand.length) for (let d = 3; d <= 8 && !cand.length; d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue; if (livre(hx + dx, hy + dy)) cand.push({ x: hx + dx, y: hy + dy }); }
  const base = cand.length ? cand[rnd(cand.length)] : { x: hx + 3, y: hy }; const out = [base]; const usados = new Set([`${base.x},${base.y}`]);
  for (let i = 1; i < n; i++) { let achou = null; for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [0, 2], [-2, 0], [0, -2]]) { const x = base.x + dx, y = base.y + dy; if (livre(x, y) && !usados.has(`${x},${y}`)) { achou = { x, y }; break; } } const p = achou || { x: base.x + i, y: base.y }; usados.add(`${p.x},${p.y}`); out.push(p); }
  return out;
}
// nos dois primeiros capítulos a Maré alta não endurece os monstros além de 6 (o Vale começa devastado, mas o herói também)
const inerciaMon = (s) => Math.min(St.inerciaEf(s), s.historia.cap <= 2 ? 6 : 10);
const idxId = (id) => parseInt(String(id).slice(1), 10);
// inicia uma batalha tática sobre o mapa atual
async function lutar({ inimigos, pos = null, origem, tema, surpresa = false, ents = null }) {
  pilha.length = 0; Au.sfx('tocha'); const s = S(); const dentro = origem === 'masmorra'; for (const m of inimigos) St.avistar(m); const mw = dentro ? D.d.w : mapa.w, mh = dentro ? D.d.h : mapa.h; const chefe = inimigos.some((m) => m.chefe);
  const emPack = new Set(ents || []); const solidoMundo = dentro
    ? (x, y) => { const d = D.d; if (d.tiles[y * d.w + x] === T.PAREDE) return true; const e = d.ents.find((q) => q.x === x && q.y === y && q.vivo !== false && q.tipo !== 'armadilha' && !(q.tipo === 'tocha_cx' && q.usado) && !emPack.has(q)); return !!e && e.tipo !== 'monstro' ? true : !!e; }
    : (x, y) => solidoEm(mapa, x, y) || !!bauEm(x, y) || !!npcEm(x, y);
  const grade = Tt.criarGrade(mw, mh, solidoMundo); const heroiPos = { x: P.x, y: P.y };
  const iniPos = pos || (dentro ? ents.map((e) => ({ x: e.x, y: e.y })) : posicoesExterior(grade, P.x, P.y, inimigos.length));
  cenaBat = dentro ? 'masmorra' : 'vale'; G.anterior = G.modo; G.modo = 'batalha'; Au.tocarMusica(chefe ? 'chefe' : 'batalha');
  const premiar = async (B) => premiarBatalha(B, { inimigos, ents, origem, dentro });
  const visivel = dentro ? (x, y) => D.vis.has(y * D.d.w + x) : null;
  const res = await Ba.iniciar({ s, inimigos, grade, pos: { heroi: heroiPos, ini: iniPos }, aliados: aliadosParaBatalha(s), surpresa, tema, mw, mh, visivel, premiar });
  await encerrarBatalha(res, { inimigos, ents, origem, dentro });
}
function premiarBatalha(B, c) {
  const s = S(); const { inimigos, ents, dentro } = c; const partes = []; St.salvarBatalha(B);
  const porId = new Map(); for (const b of B.baixas) porId.set(b.id, b); const baixas = [...porId.values()].filter((b) => b.id.startsWith('m'));
  if (B.fim === 'vitoria') {
    let ouro = 0, mortos = 0, rendidos = 0;
    for (const b of baixas) { const i = idxId(b.id); const mon = inimigos[i]; const ent = ents ? ents[i] : null; const base = ent && ent.ouro ? ent.ouro : R.ouroDoMonstro(mon, Math.random);
      if (b.como === 'morto') { ouro += base; mortos++; St.abateRegistrado(mon); } else if (b.como === 'rendeu') { ouro += Math.round(base * 0.6); rendidos++; } else if (['fugiu', 'subornado'].includes(b.como)) { /* sem saque */ }
      if (ent) { ent.vivo = false; ent.cooldown = 0; } }
    if (dentro) { if (ouro) { St.ganhoDaMasmorra(ouro); partes.push(`+${ouro} ouro`); } if (!inimigos.some((m) => m.chefe) && mortos && Math.random() < 0.1 * Math.min(2, mortos)) { St.invAdd('pocao1'); if (s.run) s.run.itensGanhos.push('pocao1'); partes.push('Poção de Cura'); } const cura = Math.round(St.der().hpMax * 0.15); s.heroi.hp = Math.min(St.der().hpMax, s.heroi.hp + cura); partes.push(`+${cura} PV`); }
    else { s.diario.enc = (s.diario.enc || 0) + 1; if (s.diario.enc <= 12) { if (ouro) { St.ganharOuro(ouro); partes.push(`+${ouro} ouro`); } } else partes.push('(sem ouro: limite diário)'); if (mortos && Math.random() < 0.08) { St.invAdd('pocao1'); partes.push('Poção de Cura'); } }
    if (rendidos) partes.push(`${rendidos} se rendeu(ram)`); const pac = baixas.filter((b) => ['convertido', 'domado', 'dominado'].includes(b.como)).length; if (pac) partes.push(`${pac} aliado(s) conquistado(s)`);
    if (B.subornou) partes.push(`−${B.subornou} ouro (suborno)`);
  } else if (B.fim === 'derrota') partes.push(dentro ? 'O saque da expedição se perde.' : 'Você é resgatado e levado à vila.');
  else { partes.push('Os inimigos ficam por perto...'); if (ents) for (const e of ents) if (e.vivo !== false) e.cooldown = 4; }
  St.salvar(); G.ui.hud(); return partes.join(' · ');
}
async function encerrarBatalha(res, c) {
  const B = res.B, s = S(); const fim = res.fim; G.ocupado = true; const origem = c.origem;
  if (fim === 'derrota') {
    const perdido = s.run ? s.run.ouroGanho : 0; St.derrotaNaMasmorra(); if (perdido) St.ganharOuro(-perdido); D = null; G.D = null;
    await fadeTo(1); trocarMapaSemFade('vila', obterMapa('vila').retornoPortal); G.modo = 'vila'; Au.tocarMusica('vila'); s.heroi.hp = Math.max(s.heroi.hp, Math.floor(St.der().hpMax * 0.25)); St.salvar(); await fadeTo(0); G.ocupado = false;
    G.ui.toast(perdido ? `Você acorda na vila. Perdeu ${perdido} de ouro da expedição.` : 'Você acorda na vila, ferido, mas vivo.'); G.ui.hud(); G.ui.drenar(); return;
  }
  P.x = B.h.x; P.y = B.h.y; P.mov = null; G.modo = G.anterior; if (D) { atualizarVisao(); }
  // aliados que tombaram saem do grupo; novos recrutas pedem confirmação
  const caidos = []; for (const u of B.un) if (u.id.startsWith('a') && !u.vivo) caidos.push(idxId(u.id)); if (caidos.length) { s.companheiros = s.companheiros.filter((_, i) => !caidos.includes(i)); G.ui.toast('Um companheiro tombou na batalha.'); }
  for (const u of res.aliados) if (u.recrutavel && u.conds.convertido && u.id.startsWith('m')) {
    if (s.companheiros.length >= 2) { await G.ui.dialogo(u.nome, ['Eu iria com você, mas seu grupo já está cheio. Boa sorte!'], { retrato: null }); continue; }
    const ok = await G.ui.confirmar(`${u.nome} quer se juntar a você`, `"${u.frase ? 'Você me convenceu. Posso ajudar na luta.' : 'Vou com você.'}" Aceitar como companheiro? (até 2; lutam ao seu lado nas batalhas)`, 'Aceitar', 'Recusar');
    if (ok) s.companheiros.push({ mon: u.mon, nome: u.nome, ap: u.ap, spr: u.spr, pal: u.pal, tags: u.tags, frase: u.frase, tmp: u.tmp });
  }
  G.ocupado = false; Au.tocarMusica(G.modo === 'masmorra' ? 'masmorra' : 'mundo');
  if (G.modo === 'masmorra') { salvarRun(); St.salvar(); if (fim === 'vitoria') await aposVitoria(c); }
  void origem; G.ui.hud(); G.ui.drenar();
}
function sincronizarVisaoBatalha() { if (!D || cenaBat !== 'masmorra') return; const bt = Ba.Bt.bt; if (!bt || !bt.B.h.v) return; const x = Math.round(bt.B.h.v.x), y = Math.round(bt.B.h.v.y); if (x !== P.x || y !== P.y) { P.x = x; P.y = y; atualizarVisao(); } }

// ---------- encontros no Vale ----------
async function encontroDoVale(i) {
  const s = S(); const reg = mapa.reg[i]; const ativo = St.capituloDisponivel() || 20; const capN = Math.max(1, Math.min(reg, ativo));
  const cap = CAPITULOS[capN - 1]; const pool = R.poolDoCapitulo(cap); const n = tamanhoGrupo(Math.random, s.heroi.nivel, 3);
  const inimigos = criarGrupo({ pool, n, escala: cap.comuns, aj: R.AJUSTE_CLASSE[s.heroi.cls] || 1, inercia: inerciaMon(s), ciclo: s.historia.ciclo });
  pilha.length = 0; G.ocupado = true; Au.sfx('tocha'); await flashTela(); G.ocupado = false;
  await lutar({ inimigos, origem: 'vale', tema: cap.tema, surpresa: Math.random() < 0.1 });
}
async function flashTela() { for (let k = 0; k < 3; k++) { fade.a = 0.9; await espera(70); fade.a = 0; fade.alvo = 0; await espera(60); } }

// ======================= MASMORRA =======================
const rand32 = () => (Math.random() * 4294967296) >>> 0;
G.entrarMasmorra = async ({ tipo, cap = 1, tema = null }) => {
  const s = S(); if (s.run) { G.ui.toast('Você já está em uma masmorra.'); return false; }
  if (!St.tochaDisponivel()) { G.ui.toast(s.heroi.exaustao >= 5 ? 'Exausto demais para entrar. Descanse e coma.' : 'Sem Tochas! Treine, estude ou cumpra missões para ganhar mais.'); return false; }
  St.gastarTocha(); const andar = tipo === 'historia' ? Math.min(s.historia.checkpoint[cap] || 1, CAPITULOS[cap - 1].andares) : 1;
  s.run = { tipo, cap, andar, tema, seedBase: rand32(), ouroGanho: 0, itensGanhos: [], origem: G.mapa, opos: { x: P.x, y: P.y }, d: null };
  await comFade(async () => { G.modo = 'masmorra'; carregarAndar(null); });
  if (tipo === 'historia') { s.historia.checkpoint[cap] = andar; }
  Au.tocarMusica('masmorra'); St.salvar(); G.ui.hud(); return true;
};
function retomarRun() { const s = S(), r = s.run; return comFade(async () => { G.modo = 'masmorra'; carregarAndar(r.d); Au.tocarMusica('masmorra'); G.ui.hud(); }); }
function chefeCatacumbas(andar, nivel, explorador = false) {
  const pool = R.poolCatacumbas(nivel, andar + 8, null, explorador).sort((a, b) => MONSTROS[b].cr - MONSTROS[a].cr); const id = pool[0]; const [eh, ed] = R.escalaNivel(nivel);
  return { base: id, nome: `Guardião: ${MONSTROS[id].n}`, ov: {}, esc: explorador ? eh * 1.2 : eh * 2.2, dm: explorador ? ed * 0.9 : ed * 1.15 };
}
function carregarAndar(salvo) {
  const s = S(), r = s.run; const cap = r.tipo === 'historia' ? CAPITULOS[r.cap - 1] : null;
  const final = cap ? r.andar === cap.andares : r.andar % 5 === 0; const tema = cap ? cap.tema : (r.tema || TEMAS_CATA[(r.andar - 1) % TEMAS_CATA.length]);
  const nivel = cap ? cap.n : s.heroi.nivel; const explorador = !cap && s.campanha && s.campanha.modo === 'explorador'; let chefe = final ? (cap ? cap.boss : chefeCatacumbas(r.andar, nivel, explorador)) : null;
  if (chefe && cap && cap.n === 20) { const nr = nReliquias(s); if (nr) chefe = { ...chefe, esc: chefe.esc * (1 - 0.08 * nr), dm: chefe.dm * (1 - 0.04 * nr) }; }
  const seed = R.hashStr(`${r.tipo}:${r.cap}:${r.andar}:${r.seedBase}:${s.historia.ciclo}`);
  const d = gerarMasmorra({ seed, andar: r.andar, final, tema, pool: cap ? R.poolDoCapitulo(cap) : [], nivel, chefe, inercia: inerciaMon(s), ciclo: s.historia.ciclo, ajuste: R.AJUSTE_CLASSE[s.heroi.cls] || 1, escala: cap ? cap.comuns : null, explorador });
  d.ents.forEach((e, i) => { e.i = i; e.px = e.x; e.py = e.y; if (e.tipo === 'chefe') { e.vivo = true; e.acordado = false; } });
  const ra = Rn.apDe(s); const visaoRaca = (ra && ra.raca && ['elfo', 'anao', 'gnomo', 'meioelfo', 'meioorc', 'tiefling', 'draconato'].includes(ra.raca)) ? 1 : 0;
  D = { d, cap, final, tema, seed, vis: new Set(), raio: 6 + visaoRaca, bonusVisao: visaoRaca, ultimoPasso: 0 }; G.D = D;
  P.x = d.start.x; P.y = d.start.y; P.mov = null; P.dir = 'baixo'; Rn.prepararMasmorra(d, tema, T, seed % 9973);
  if (salvo) {
    for (const i of salvo.mortos || []) if (d.ents[i]) d.ents[i].vivo = false; for (const i of salvo.abertos || []) if (d.ents[i]) d.ents[i].aberto = true;
    for (const i of salvo.usados || []) if (d.ents[i]) d.ents[i].usado = true; for (const i of salvo.desarmadas || []) if (d.ents[i]) { d.ents[i].ativa = false; d.ents[i].oculta = false; }
    if (salvo.expl) for (let i = 0; i < salvo.expl.length && i < d.explorado.length; i++) d.explorado[i] = salvo.expl[i] === '1' ? 1 : 0;
    if (salvo.pos) { P.x = salvo.pos.x; P.y = salvo.pos.y; } if (salvo.escadaAberta) { const b = d.ents.find((e) => e.tipo === 'chefe'); if (b) d.tiles[b.y * d.w + b.x] = T.DESCE; }
  }
  atualizarVisao(); G.ui.hud();
}
function salvarRun() {
  const r = St.S && St.S.run; if (!r || !D) return; const d = D.d; const ents = d.ents;
  const idxs = (f) => ents.map((e, i) => (f(e) ? i : -1)).filter((i) => i >= 0);
  r.d = { pos: { x: P.x, y: P.y }, mortos: idxs((e) => (e.tipo === 'monstro' || e.tipo === 'chefe') && e.vivo === false), abertos: idxs((e) => e.tipo === 'bau' && e.aberto), usados: idxs((e) => (e.tipo === 'santuario' || e.tipo === 'tocha_cx') && e.usado), desarmadas: idxs((e) => e.tipo === 'armadilha' && !e.ativa), expl: Array.from(d.explorado).join(''), escadaAberta: !!D.escadaAberta };
}
function atualizarVisao() {
  const s = S(); const ex = s.heroi.exaustao || 0; D.raio = 6 + (D.bonusVisao || 0) + (D.luzMagica || 0) - (ex >= 2 ? 1 : 0) - (ex >= 4 ? 1 : 0); const d = D.d;
  D.vis = visiveis(d, P.x, P.y, D.raio); for (const i of D.vis) d.explorado[i] = 1;
  const pass = 10 + (R.derivar(s).M.SAB || 0), dc = 12 + Math.floor(d.andar / 3);
  for (const e of d.ents) if (e.tipo === 'armadilha' && e.oculta && e.ativa && Math.abs(e.x - P.x) <= 1 && Math.abs(e.y - P.y) <= 1 && pass >= dc) { e.oculta = false; Rn.flutuar(flut, e.x, e.y - 0.4, 'ARMADILHA!', '#ff9f40'); }
}
const entEm = (x, y) => D.d.ents.find((e) => e.x === x && e.y === y && e.vivo !== false && !(e.tipo === 'armadilha' && !e.ativa));
function piso(x, y) { const d = D.d; return x >= 0 && y >= 0 && x < d.w && y < d.h && d.tiles[y * d.w + x] !== T.PAREDE; }
function movMasmorra(dir, nx, ny) {
  const e = entEm(nx, ny);
  if (e) {
    pilha.length = 0;
    if (e.tipo === 'monstro' || e.tipo === 'chefe') { if (e.cooldown > 0) return; return batalhaMasmorra(e, !e.acordado); }
    if (e.tipo === 'bau') return abrirBauMasmorra(e); if (e.tipo === 'santuario') return usarSantuario(e); if (e.tipo === 'tocha_cx') return pegarTocha(e);
    if (e.tipo === 'armadilha') { if (!e.oculta) { G.ui.toast('Armadilha à frente! Aperte A para tentar desarmar.'); return; } }
  }
  if (!piso(nx, ny)) return;
  P.mov = { x0: P.x, y0: P.y, x1: nx, y1: ny, t: 0, dur: 0.15 };
}
function batalhaMasmorra(e, surpresa) {
  const d = D.d; const pack = e.tipo === 'chefe' ? [e] : d.ents.filter((q) => q.tipo === 'monstro' && q.vivo !== false && q.g === e.g && cheb(q, e) <= 10);
  if (!pack.includes(e)) pack.unshift(e); pack.forEach((q) => { q.acordado = true; });
  return lutar({ inimigos: pack.map((q) => q.mon), pos: pack.map((q) => ({ x: q.x, y: q.y })), origem: 'masmorra', tema: D.tema, surpresa, ents: pack });
}
function chegouMasmorra() {
  const d = D.d, i = P.y * d.w + P.x, t = d.tiles[i]; Au.sfx('passo');
  const tr = d.ents.find((e) => e.tipo === 'armadilha' && e.ativa && e.x === P.x && e.y === P.y);
  atualizarVisao();
  if (tr) { dispararArmadilha(tr); }
  if (t === T.DESCE) { pilha.length = 0; return descer(); }
  if (t === T.SOBE) { pilha.length = 0; return pedirSaida(); }
  D.ultimoPasso++; moverMonstros();
}
function moverMonstros() {
  const d = D.d; let contato = null;
  for (const e of d.ents) {
    if ((e.tipo !== 'monstro' && e.tipo !== 'chefe') || e.vivo === false) continue; if (e.cooldown > 0) e.cooldown--;
    const dist = Math.abs(e.x - P.x) + Math.abs(e.y - P.y); const vis = D.vis.has(e.y * d.w + e.x);
    if (!e.acordado) { if (vis && dist <= 4 && Math.random() < 0.6) { e.acordado = true; Rn.flutuar(flut, e.x, e.y - 0.8, '!', '#ffd23f'); Au.sfx('select'); if (e.g) d.ents.forEach((q) => { if (q.g === e.g && q.vivo !== false) q.acordado = true; }); } else continue; }
    if (dist > 12) { e.acordado = false; continue; }
    if (e.tipo === 'chefe') { if (dist <= 4 && vis && !contato) contato = e; continue; }
    if (dist <= 2) { if (!contato && !(e.cooldown > 0)) contato = e; continue; }
    const ax = Math.sign(P.x - e.x), ay = Math.sign(P.y - e.y); const tent = Math.abs(P.x - e.x) >= Math.abs(P.y - e.y) ? [[ax, 0], [0, ay], [0, -ay], [-ax, 0]] : [[0, ay], [ax, 0], [ax, 0], [0, -ay]];
    for (const [dx, dy] of tent) { if (!dx && !dy) continue; const nx = e.x + dx, ny = e.y + dy; if (d.tiles[ny * d.w + nx] === T.CHAO && !entEm(nx, ny) && !(nx === P.x && ny === P.y)) { e.x = nx; e.y = ny; break; } }
    if (Math.abs(e.x - P.x) + Math.abs(e.y - P.y) <= 2 && !contato && !(e.cooldown > 0)) contato = e;
  }
  if (contato) { pilha.length = 0; batalhaMasmorra(contato, false); }
}
function atualizarMonstrosAnim(dt) { for (const e of D.d.ents) { if (e.px === undefined) continue; const k = Math.min(1, dt * 12); e.px += (e.x - e.px) * k; e.py += (e.y - e.py) * k; } }
function interagirMasmorra() {
  const [dx, dy] = DIRV[P.dir], tx = P.x + dx, ty = P.y + dy; const e = D.d.ents.find((q) => q.x === tx && q.y === ty && q.tipo === 'armadilha' && q.ativa && !q.oculta);
  if (e) { const M = R.derivar(S()).M; const nat = Math.floor(Math.random() * 20) + 1; const r = nat + (M.DES || 0); Dados.teste20(nat, { mod: M.DES || 0, dc: 12, rot: 'Destreza (desarmar)', ok: r >= 12 }); if (r >= 12) { e.ativa = false; Au.sfx('select'); const o = 3 + D.d.andar * 2; St.ganhoDaMasmorra(o); Rn.flutuar(flut, tx, ty - 0.4, `DESARMADA +${o}`, '#6fcf7f'); } else { Rn.flutuar(flut, tx, ty - 0.4, 'FALHOU!', '#ff5c6c'); dispararArmadilha(e); } return; }
  const q = D.d.ents.find((z) => z.x === tx && z.y === ty && z.vivo !== false); if (q) movMasmorra(P.dir, tx, ty);
}
function dispararArmadilha(e) {
  e.ativa = false; e.oculta = false; Au.sfx('armadilha'); Au.vibrar(60); const s = S(), der = R.derivar(s); const andar = D.d.andar;
  const dados = 1 + Math.floor(s.heroi.nivel / 3) + Math.floor(andar / 4); let dano = rolar(`${dados}d6`).total;
  const dc = 11 + Math.floor(andar / 3), nat = 1 + rnd(20), r = nat + (der.M.DES || 0); Dados.teste20(nat, { mod: der.M.DES || 0, dc, rot: 'Destreza (esquivar)', ok: r >= dc }); if (r >= dc) dano = Math.floor(dano / 2);
  s.heroi.hp = Math.max(1, s.heroi.hp - dano); Rn.flutuar(flut, P.x, P.y - 0.6, `-${dano}`, '#ff5c6c'); G.ui.toast(r >= dc ? `Você se esquiva em parte da armadilha! (−${dano} PV)` : `Armadilha! (−${dano} PV)`); St.salvar(); G.ui.hud();
}
function abrirBauMasmorra(e) {
  if (e.aberto) return; e.aberto = true; Au.sfx('chest'); const forca = (e.forca || 0) + Math.floor(S().heroi.nivel / 5); const r = St.darBau(forca, 'masmorra'); if (S().run) { S().run.ouroGanho += r.ouro; S().run.itensGanhos.push(...r.itens); } salvarRun(); St.salvar();
}
function usarSantuario(e) {
  if (e.usado) { G.ui.toast('O santuário já concedeu sua bênção.'); return; } e.usado = true; const s = S(); const m = St.der().hpMax; const cura = m - s.heroi.hp; s.heroi.hp = m;
  Au.sfx('heal'); Rn.flutuar(flut, P.x, P.y - 0.6, `+${cura} PV`, '#6fcf7f'); Rn.PART.emitir(P.x * TS + 16, P.y * TS + 20, 16, { cor: ['#7dffa0', '#fff'], vel: 26, vida: 0.9, sobe: 40, tam: 2 }); G.ui.toast('Um santuário antigo restaura todo o seu vigor.'); salvarRun(); St.salvar(); G.ui.hud();
}
function pegarTocha(e) { if (e.usado) return; e.usado = true; const s = S(); s.heroi.tochas = Math.min(15, s.heroi.tochas + 1); Au.sfx('tocha'); G.ui.toast('Você encontrou uma Tocha sobressalente! (+1)'); salvarRun(); St.salvar(); G.ui.hud(); }
async function descer() {
  const s = S(), r = s.run;
  if (!St.tochaDisponivel()) { G.ui.toast('Sem Tochas para descer. A escuridão é densa demais. Volte quando tiver treinado.'); return; }
  St.gastarTocha(); St.andarConcluido(r.andar, false); r.andar++; if (r.tipo === 'historia') s.historia.checkpoint[r.cap] = r.andar; else s.catacumbas.melhor = Math.max(s.catacumbas.melhor, r.andar);
  Au.sfx('escada'); await comFade(async () => { carregarAndar(null); }); salvarRun(); St.salvar();
  Rn.flutuar(flut, P.x, P.y - 0.8, `ANDAR ${r.andar}`, '#6af0ff'); G.ui.hud();
}
async function pedirSaida() {
  const ok = await G.ui.confirmar('Sair da masmorra?', 'Você volta para a superfície. O progresso do capítulo (andar atual) fica salvo. Cada retorno custa 1 Tocha.', 'Sair', 'Ficar');
  if (ok) sairMasmorra();
}
async function sairMasmorra() {
  const s = S(), r = s.run; const origem = r ? r.origem : 'vila'; const cap = r && r.tipo === 'historia' ? r.cap : null; s.run = null; D = null; G.D = null; St.salvar();
  await comFade(async () => {
    const opos = r && r.opos; let idm = origem, pos = opos || null;
    if (!opos) { if (origem === 'vale') { const v = obterMapa('vale'); const e = v.extra.find((q) => q.n === (cap || 1)) || v.extra[0]; pos = { x: e.x, y: e.y + 1 }; } else { idm = 'vila'; pos = obterMapa('vila').retornoPortal; } }
    try { trocarMapaSemFade(idm, pos); } catch (e) { trocarMapaSemFade('vila', obterMapa('vila').retornoPortal); }
    G.modo = mapa.tipo === 'regiao' ? 'vale' : 'vila'; Au.tocarMusica(musicaDe(mapa));
  });
  G.ui.hud(); G.ui.drenar();
}
function abandonarRun() { const s = S(); s.run = null; D = null; G.D = null; St.salvar(); }
G.sair = sairMasmorra;
// ---------- efeitos de exploração das magias (Grimório) ----------
const REVELA = { revela_mon: ['monstro', 'chefe'], revela_bau: ['bau', 'santuario', 'tocha_cx'], revela_arm: ['armadilha'], revela_tudo: ['monstro', 'chefe', 'bau', 'santuario', 'tocha_cx', 'armadilha'] };
G.efeitoExploracao = (ex, v) => {
  const dentro = !!(D && G.modo === 'masmorra'); const s = S(); const so = { erro: 'Só faz efeito dentro de uma masmorra.' };
  if (REVELA[ex]) { if (!dentro) return so; const d = D.d; const raio = v || 8; let n = 0;
    for (const e of d.ents) { if (e.vivo === false || !REVELA[ex].includes(e.tipo)) continue; if (Math.max(Math.abs(e.x - P.x), Math.abs(e.y - P.y)) > raio) continue; if (e.tipo === 'armadilha') e.oculta = false; e.revelado = true;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = e.x + dx, y = e.y + dy; if (x >= 0 && y >= 0 && x < d.w && y < d.h) d.explorado[y * d.w + x] = 1; } n++; }
    return { msg: n ? `Você percebe ${n} presença(s) ou objeto(s) em ${raio} casas — marcados no mapa.` : `Nada por perto (raio ${raio}).` }; }
  if (ex === 'luz') { if (!dentro) return so; D.luzMagica = Math.max(D.luzMagica || 0, v || 1); atualizarVisao(); return { msg: `Luz mágica: sua visão aumenta ${D.luzMagica} casa(s) neste andar.` }; }
  if (ex === 'knock') { if (!dentro) return so; const e = D.d.ents.filter((q) => q.tipo === 'bau' && !q.aberto && q.vivo !== false && Math.max(Math.abs(q.x - P.x), Math.abs(q.y - P.y)) <= 6).sort((a, b) => Math.abs(a.x - P.x) + Math.abs(a.y - P.y) - (Math.abs(b.x - P.x) + Math.abs(b.y - P.y)))[0]; if (!e) return { erro: 'Nenhum baú fechado a até 6 casas.' }; abrirBauMasmorra(e); return { msg: 'O baú se abre sozinho — o butim já está na sua mochila.' }; }
  if (ex === 'viajar') { if (!dentro) return so; return { msg: 'O ar se dobra e você sai da masmorra.', acao: 'sair' }; }
  if (ex === 'dica') {
    if (dentro) { const d = D.d; const vivos = d.ents.filter((e) => (e.tipo === 'monstro' || e.tipo === 'chefe') && e.vivo !== false); const baus = d.ents.filter((e) => e.tipo === 'bau' && !e.aberto).length; const arm = d.ents.filter((e) => e.tipo === 'armadilha' && e.ativa).length; let esc = ''; for (let i = 0; i < d.tiles.length; i++) if (d.tiles[i] === T.DESCE) { const x = i % d.w, y = Math.floor(i / d.w); esc = ` A escada para baixo fica ${y < P.y - 2 ? 'ao norte' : y > P.y + 2 ? 'ao sul' : ''}${x < P.x - 2 ? ' a oeste' : x > P.x + 2 ? ' a leste' : ''} (${Math.abs(x - P.x) + Math.abs(y - P.y)} passos).`.replace('  ', ' '); break; }
      return { msg: `Presságio: restam ${vivos.length} criatura(s)${vivos.some((e) => e.tipo === 'chefe') ? ' (um Guardião entre elas)' : ''}, ${baus} baú(s) fechado(s) e ${arm} armadilha(s) neste andar.${esc}` }; }
    const q = questsAtivas(s)[0]; const pr = q && progressoQuest(s, q); return { msg: q ? `Os presságios apontam: «${q.titulo}» — ${pr ? pr.txt : q.resumo}` : 'Os presságios estão calmos: nenhuma missão pede pressa agora.' };
  }
  return { erro: 'Esse efeito ainda não tem uso aqui.' };
};
G.lutarTeste = (ids, n) => { const s = S(); const [eh, ed] = R.escalaNivel(s.heroi.nivel); const ini = ids.map((id) => R.criarMonstro(id, { esc: eh, ov: { dm: ed } })); return lutar({ inimigos: ini.map((m) => comPerfil(m, Math.random)), origem: 'vale', tema: 'floresta' }); };
G.encontro = (i) => encontroDoVale(i == null ? mapa.enc.findIndex((v) => v) : i);
async function aposVitoria(c) {
  const e = c.ents && c.ents.find((q) => q.tipo === 'chefe'); if (!e) return; const d = D.d;
  if (D.cap) {
    G.ocupado = true; const cap = D.cap; const escolha = await G.ui.fimCapitulo(cap.n); St.concluirCapitulo(cap.n, escolha); G.ocupado = false;
    if (cap.n === 20) { await G.ui.fimDeJogo(); }
    sairMasmorra();
  } else {
    D.escadaAberta = true; d.tiles[e.y * d.w + e.x] = T.DESCE; D.d.arte = null; Rn.prepararMasmorra(d, D.tema, T, D.seed % 9973); St.darBau(6, 'chefe'); G.ui.toast('O guardião cai. Uma escada se abre onde ele estava.'); const s = S(); s.catacumbas.melhor = Math.max(s.catacumbas.melhor, s.run.andar); salvarRun(); St.salvar();
  }
}

// ======================= DESENHO =======================
function desenhar() {
  const ctx = Rn.inicioFrame(); if (!Rn.VW.cw) return;
  if (G.modo === 'masmorra' || (G.modo === 'batalha' && cenaBat === 'masmorra')) { if (D) desenharMasmorra(ctx); } else desenharMapa(ctx);
  if (fade.a > 0.001) { ctx.fillStyle = `rgba(0,0,0,${fade.a})`; ctx.fillRect(0, 0, Rn.VW.w, Rn.VW.h); }
}
function posJogador() { return P.mov ? [P.x + (P.mov.x1 - P.x) * P.mov.t, P.y + (P.mov.y1 - P.y) * P.mov.t] : [P.x, P.y]; }
function camera(mw, mh) {
  if (G.modo === 'titulo') { Rn.cam.x = Math.round(Math.max(0, Math.min(mw * TS - Rn.VW.w, (mw / 2) * TS - Rn.VW.w / 2 + Math.sin(tempo * 0.2) * 30))); Rn.cam.y = Math.round(Math.max(0, Math.min(mh * TS - Rn.VW.h, 17 * TS - Rn.VW.h / 2))); return; }
  if ((insetN = (insetN + 1) % 8) === 0) Rn.medirInsets();
  if (G.modo === 'batalha') { if (Ba.camLivre()) return; const f = Ba.camFoco(); if (f) Rn.camPara(f.x, f.y, mw, mh, 0.16); return; }
  const [x, y] = posJogador(); Rn.camPara(x, y, mw, mh);
}
function itemJogador() {
  const s = S(); if (!s) return null; const [x, y] = posJogador();
  return { y: (y + 1) * TS + 0.3, d: (c) => { const tk = Rn.tokenHeroiDe(s); if (tk) { Rn.tokenEm(c, tk, x, y, P.dir, P); return; } const pose = P.mov ? ((P.passo + Math.floor(P.mov.t * 2)) % 2 ? 'andar1' : 'andar2') : 'idle'; const dir = P.dir; Rn.sombraTile(c, x, y, 9, 3.5, 0.3); Rn.pessoaEm(c, Rn.spriteHeroi(s, dir === 'dir' ? 'esq' : dir, pose), x, y, dir); } };
}
// pins de missão: "!" dourado sobre quem tem missão ativa (nas vilas) e sobre os lugares da missão (na região)
function pinsDeMissao() { const out = { npcs: new Set(), lugares: [] }; if (!St.S || !St.S.campanha) return out; for (const q of questsAtivas(St.S)) { out.npcs.add(q.npc); for (const k of QLUG[q.id] || []) { const l = LUG[k]; if (l) out.lugares.push({ x: l.x, y: l.y, p: q.tipo === 'principal' }); } } return out; }
function desenharMapa(ctx) {
  const m = mapa; camera(m.w, m.h); const itens = []; const pins = G.modo === 'titulo' ? { npcs: new Set(), lugares: [] } : pinsDeMissao(); const titulo = G.modo === 'titulo', bat = G.modo === 'batalha';
  for (const n of npcs) { const nx = n.mov ? n.x + (n.mov.x1 - n.x) * n.mov.t : n.x, ny = n.mov ? n.y + (n.mov.y1 - n.y) * n.mov.t : n.y; itens.push({ y: (ny + 1) * TS, d: (c) => { const pf = NPC_PERFIL[n.id]; const tkn = pf && Rn.tokenPessoaDe(pf.ap, npcVis(pf), pf.vis && pf.vis.cls === 'mago' ? 'cajado' : null); if (tkn) { Rn.tokenEm(c, tkn, nx, ny, n.dir, n); return; } const sp = spriteNpc(n); if (!sp) return; Rn.sombraTile(c, nx, ny, 9, 3.5, 0.28); Rn.pessoaEm(c, sp, nx, ny, n.dir); } }); }
  for (const n of npcs) if (pins.npcs.has(n.id)) { const nx = n.mov ? n.x + (n.mov.x1 - n.x) * n.mov.t : n.x, ny = n.mov ? n.y + (n.mov.y1 - n.y) * n.mov.t : n.y; itens.push({ y: (ny + 2) * TS, d: (c) => { const bob = Math.sin(tempo * 4 + n.x) * 2; texto(c, '!', Math.round(nx * TS + 16 - Rn.cam.x), Math.round(ny * TS - 12 - Rn.cam.y + bob), { cor: '#ffd23f', tam: 14 }); } }); }
  if (m.tipo === 'regiao') for (const l of pins.lugares) itens.push({ y: (l.y + 4) * TS, d: (c) => { const bob = Math.sin(tempo * 3 + l.x) * 2; texto(c, l.p ? '★' : '!', Math.round(l.x * TS + 16 - Rn.cam.x), Math.round((l.y - 2) * TS - Rn.cam.y + bob), { cor: l.p ? '#ffd23f' : '#7dd8ff', tam: 16 }); } });
  for (const b of baus()) itens.push({ y: (b.y + 1) * TS, d: (c) => { const img = spriteObjeto(b.aberto ? 'bauA' : 'bauF'); c.drawImage(img, Math.round(b.x * TS + 16 - img.width / 2 - Rn.cam.x), Math.round(b.y * TS + 16 - img.height / 2 - Rn.cam.y)); if (!b.aberto) texto(c, '!', Math.round(b.x * TS + 16 - Rn.cam.x), Math.round(b.y * TS - 6 - Rn.cam.y + Math.sin(tempo * 5) * 1.5), { cor: '#ffd23f', tam: 10 }); } });
  if (!titulo && !bat) { const j = itemJogador(); if (j) itens.push(j); }
  if (bat) itens.push(...Ba.itens());
  const opc = { tempo, itens, heroiTile: (!titulo && !bat) ? (() => { const [hx, hy] = posJogador(); return { x: hx, y: hy }; })() : null, antes: bat ? Ba.desenharAntes : null, depois: (c) => { if (St.S && G.mapa === 'vila' && festaAtiva()) desenharFesta(c, Rn.cam, TS, tempo); Rn.desenharFlutuantes(c, flut); Rn.PART.desenhar(c, Rn.cam.x, Rn.cam.y); if (bat) Ba.desenharDepois(c); }, vida: St.S ? { v: vidaAtual(), onda: Vida.onda } : null, batalha: bat };
  if (St.S && m.extra && m.extra.length) { const ativo = St.capituloDisponivel(); opc.caps = m.extra.map((e) => ({ n: e.n, x: e.x, y: e.y, spr: e.spr, cata: e.cata, ativo: !e.cata && e.n === ativo, limpo: !e.cata && St.S.historia.limpos.includes(e.n) })); }
  if (m.reg && St.S) { const ativo = St.capituloDisponivel(); opc.vale = { reg: m.reg, lim: Math.max(ativo || 20, 1) + 1.2 }; }
  Rn.desenharExterno(ctx, m, opc);
}
function desenharMasmorra(ctx) {
  const d = D.d, s = S(); const bat = G.modo === 'batalha'; camera(d.w, d.h); const itens = []; const [pxf, pyf] = bat ? [P.x, P.y] : posJogador();
  const sp = (e) => spriteMonstro(e.spr, e.pal || {}, e.mon.id || 'x', e.mon.tags || [], e.ap || null);
  for (const e of d.ents) {
    if (e.vivo === false) continue; const i = e.y * d.w + e.x; const vis = D.vis.has(i);
    if (e.tipo === 'monstro' || e.tipo === 'chefe') { if (!(vis || e.revelado) || (bat && D.emBatalha)) continue; if (bat) continue; itens.push({ y: (e.py + 1) * TS, d: (c) => { const tkm = e.ap ? Rn.tokenPessoaDe(e.ap, { cls: 'ladino', cat: 'leve', capaC: '#4a3a2a' }, 'adaga') : Rn.tokenMonstroDe(e.mon); if (tkm) { const ddx = pxf - e.px, ddy = pyf - e.py; Rn.tokenEm(c, tkm, e.px, e.py, Math.abs(ddx) >= Math.abs(ddy) ? (ddx > 0 ? 'dir' : 'esq') : (ddy > 0 ? 'baixo' : 'cima'), e); const cx2 = Math.round(e.px * TS + 16 - Rn.cam.x), cy2 = Math.round(e.py * TS + 16 - tkm.px / 2 - Rn.cam.y); if (e.acordado) texto(c, '!', cx2, cy2 - 4, { cor: '#ffd23f', tam: 10 }); else texto(c, 'Z', cx2 + 8, cy2 - 2 + Math.sin(tempo * 2) * 1.5, { cor: '#8ab0ff', tam: 8 }); return; } const spr = sp(e); const bob = Math.sin(tempo * 3 + e.x) * 0.6 / TS; Rn.sombraTile(c, e.px, e.py, e.tipo === 'chefe' ? 14 : 10, 4, 0.3); Rn.monstroEm(c, spr, e.px, e.py + bob); const cx = Math.round(e.px * TS + 16 - Rn.cam.x), cy = Math.round((e.py + 1) * TS + 1 - spr.height - Rn.cam.y); if (e.acordado) texto(c, '!', cx, cy - 4, { cor: '#ffd23f', tam: 10 }); else texto(c, 'Z', cx + 8, cy - 2 + Math.sin(tempo * 2) * 1.5, { cor: '#8ab0ff', tam: 8 }); } }); }
    else if (!d.explorado[i]) continue;
    else if (e.tipo === 'bau') itens.push({ y: (e.y + 1) * TS, d: (c) => { const img = spriteObjeto(e.aberto ? 'bauA' : 'bauF'); c.drawImage(img, Math.round(e.x * TS + 16 - img.width / 2 - Rn.cam.x), Math.round(e.y * TS + 16 - img.height / 2 - Rn.cam.y)); } });
    else if (e.tipo === 'santuario') itens.push({ y: (e.y + 1) * TS, d: (c) => { const img = spriteObjeto('santuario', 0, Math.floor(tempo * 2.2) % 2); c.globalAlpha = e.usado ? 0.5 : 1; c.drawImage(img, Math.round(e.x * TS + 16 - img.width / 2 - Rn.cam.x), Math.round(e.y * TS + 16 - img.height / 2 - Rn.cam.y)); c.globalAlpha = 1; } });
    else if (e.tipo === 'tocha_cx') { if (!e.usado) itens.push({ y: (e.y + 1) * TS, d: (c) => { const img = spriteObjeto('caixaTocha'); c.drawImage(img, Math.round(e.x * TS + 16 - img.width / 2 - Rn.cam.x), Math.round(e.y * TS + 16 - img.height / 2 - Rn.cam.y)); } }); }
    else if (e.tipo === 'armadilha') { if (e.ativa && !e.oculta) itens.push({ y: e.y * TS + 4, d: (c) => { const img = spriteObjeto('armadilha'); c.drawImage(img, Math.round(e.x * TS + 16 - img.width / 2 - Rn.cam.x), Math.round(e.y * TS + 16 - img.height / 2 - Rn.cam.y)); } }); }
  }
  if (!bat) { const j = itemJogador(); if (j) itens.push({ ...j, y: (pyf + 1) * TS + 0.3 }); } else itens.push(...Ba.itens());
  Rn.desenharMas(ctx, d, { tempo, itens, vis: D.vis, raio: D.raio, jogador: { x: pxf, y: pyf }, T, antes: bat ? Ba.desenharAntes : null, depois: (c) => { Rn.desenharFlutuantes(c, flut); Rn.PART.desenhar(c, Rn.cam.x, Rn.cam.y); if (bat) Ba.desenharDepois(c); }, topo: (c) => { if (!bat) minimapa(c, d, s); } });
}
const topoHud = () => Math.round(Rn.INSET.t * Rn.VW.h / (Rn.VW.ch || 1)); // o HUD é translúcido e sobreposto: a masmorra desenha abaixo dele
function hudMasmorra(c, s) { const r = s.run; if (!r) return; texto(c, r.tipo === 'historia' ? `${D.cap.local}  ${r.andar}/${D.cap.andares}` : `CATACUMBAS  ANDAR ${r.andar}`, 6, 8 + topoHud(), { cor: '#fff', tam: 8, alinha: 'left' }); }
function minimapa(c, d, s) {
  const k = 2, mw = d.w * k, mh = d.h * k, mx = Rn.VW.w - mw - 4, my = 4 + topoHud(); c.fillStyle = 'rgba(6,4,14,0.65)'; c.fillRect(mx - 1, my - 1, mw + 2, mh + 2);
  for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) { const i = y * d.w + x; if (!d.explorado[i]) continue; const t = d.tiles[i]; c.fillStyle = t === T.PAREDE ? '#3a3250' : t === T.DESCE ? '#6af0ff' : t === T.SOBE ? '#6fcf7f' : '#8a84a8'; c.fillRect(mx + x * k, my + y * k, k, k); }
  for (const e of d.ents) { if (e.vivo === false) continue; const i = e.y * d.w + e.x; if (e.tipo === 'chefe' && d.explorado[i]) { c.fillStyle = '#ff5c6c'; c.fillRect(mx + e.x * k - 1, my + e.y * k - 1, 4, 4); } else if (e.tipo === 'bau' && !e.aberto && d.explorado[i]) { c.fillStyle = '#ffd23f'; c.fillRect(mx + e.x * k, my + e.y * k, k, k); } }
  c.fillStyle = Math.floor(tempo * 3) % 2 ? '#ffd23f' : '#fff'; c.fillRect(mx + P.x * k - 1, my + P.y * k - 1, 4, 4); hudMasmorra(c, s); texto(c, `TOCHAS ${s.heroi.tochas}`, 6, 18 + topoHud(), { cor: '#ffb52e', tam: 8, alinha: 'left' });
}
