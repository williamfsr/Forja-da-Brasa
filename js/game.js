// Motor do jogo 2D: vila, Vale, masmorras procedurais e combate por turnos, tudo em canvas 240×176 (8 bits).
import { criarAtlas, tileCanvas, spriteHeroi, spriteNpc, NPC_PAL, spriteMonstro, textoPixel } from './sprites.js';
import { CLASSES, ITENS, MONSTROS } from './srd.js';
import { CAPITULOS, NPCS } from './story.js';
import * as St from './store.js';
import * as R from './rules.js';
import { novaBatalha, acoesHeroi, podeAgir, agir, magiasDoHeroi, iaEscolher, passarTurno } from './combat.js';
import { gerarMasmorra, visiveis, T } from './dungeon.js';
import { criarVila, criarVale, solidoEm, bausDoDia, PREDIOS } from './world.js';
import * as Au from './audio.js';

let VW = 240, VH = 176; const TS = 16; // VW/VH mudam conforme a tela (vista do mapa) e voltam a 240×176 na batalha
const DIRV = { cima: [0, -1], baixo: [0, 1], esq: [-1, 0], dir: [1, 0] };
const OPOSTA = { cima: 'baixo', baixo: 'cima', esq: 'dir', dir: 'esq' };
const TEMAS_CATA = ['porao', 'caverna', 'cripta', 'floresta', 'mina', 'pantano', 'torre', 'cemiterio', 'afundada', 'forja', 'abismo', 'trono'];
const S = () => St.S;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (n) => Math.floor(Math.random() * n);

export const G = { modo: 'titulo', ui: null, ocupado: false, bt: null, D: null, mapa: null };
let canvas, ctx, ultimoT = 0, tempo = 0, vila, vale, mapa, npcs = [], stepCool = 6;
const P = { x: 14, y: 26, dir: 'baixo', mov: null, passo: 0 };
G.P = P; // exposto para testes automatizados
const cam = { x: 0, y: 0 };
const fade = { a: 0, alvo: 0, res: null };
const pilha = []; let pedidoA = false, pedidoB = false;
let D = null; // estado da masmorra atual
const flutuantes = []; // textos flutuantes no mapa

// ---------- inicialização ----------
export function iniciarJogo(cv) {
  canvas = cv; ctx = canvas.getContext('2d'); canvas.width = VW; canvas.height = VH; ctx.imageSmoothingEnabled = false; vistaSujo = true;
  try { new ResizeObserver(() => { vistaSujo = true; }).observe(canvas.parentElement.parentElement); } catch (e) { window.addEventListener('resize', () => { vistaSujo = true; }); }
  window.addEventListener('orientationchange', () => { vistaSujo = true; });
  criarAtlas(); vila = criarVila(); vale = criarVale(); G.vila = vila; G.vale = vale; instalarEntrada(); montarBatalhaDom();
  trocarMapaSemFade('vila', vila.spawn); G.modo = 'titulo'; requestAnimationFrame(loop);
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
  if (St.S.diario.data !== St.hoje()) { St.virarDia(); St.S.diario.baus = null; } trocarMapaSemFade('vila', vila.spawn); G.modo = 'vila'; Au.tocarMusica('vila'); G.ui.hud();
};
G.irVila = () => comFade(() => { trocarMapaSemFade('vila', vila.retornoPortal); G.modo = 'vila'; Au.tocarMusica('vila'); });

// ---------- entrada ----------
function instalarEntrada() {
  const mapaTeclas = { ArrowUp: 'cima', ArrowDown: 'baixo', ArrowLeft: 'esq', ArrowRight: 'dir', w: 'cima', s: 'baixo', a: 'esq', d: 'dir', W: 'cima', S: 'baixo', A: 'esq', D: 'dir' };
  const emCampo = () => { const t = document.activeElement && document.activeElement.tagName; return t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA'; };
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key;
    if (emCampo()) { if (k === 'Escape') { document.activeElement.blur(); } return; }
    const d = mapaTeclas[k];
    if (d) { if (!pilha.includes(d)) pilha.push(d); if (!G.ui.modalAberto()) e.preventDefault(); return; }
    if (k === 'Enter' || k === ' ' || k === 'z' || k === 'Z') { if (!G.ui.modalAberto() || G.ui.dialogoAberto()) { pedidoA = true; e.preventDefault(); } }
    else if (k === 'x' || k === 'X' || k === 'Escape' || k === 'Backspace') { pedidoB = true; }
    else if (k === 'm' || k === 'M' || k === 'Tab') { pedidoB = false; if (!G.ui.modalAberto() && G.modo !== 'batalha') G.ui.painel('menu'); e.preventDefault(); }
  });
  document.addEventListener('keyup', (e) => { const d = mapaTeclas[e.key]; if (d) { const i = pilha.indexOf(d); if (i >= 0) pilha.splice(i, 1); } });
  window.addEventListener('blur', () => { pilha.length = 0; });
  // controles na tela
  const bind = (el, down, up) => {
    const solta = (e) => { e.preventDefault(); up(); el.classList.remove('ativo'); };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } el.classList.add('ativo'); Au.destravar(); down(); });
    el.addEventListener('pointerup', solta); el.addEventListener('pointercancel', solta); el.addEventListener('lostpointercapture', () => { up(); el.classList.remove('ativo'); });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  };
  document.querySelectorAll('[data-dir]').forEach((el) => { const d = el.dataset.dir; bind(el, () => { if (!pilha.includes(d)) pilha.push(d); }, () => { const i = pilha.indexOf(d); if (i >= 0) pilha.splice(i, 1); }); });
  const A = document.getElementById('btn-a'), B = document.getElementById('btn-b'), M = document.getElementById('btn-menu');
  if (A) bind(A, () => { if (!G.ui.modalAberto() || G.ui.dialogoAberto()) pedidoA = true; }, () => {});
  if (B) bind(B, () => { pedidoB = true; }, () => {});
  if (M) M.addEventListener('click', () => { Au.destravar(); if (G.modo !== 'batalha' && G.modo !== 'titulo' && !G.ui.modalAberto()) G.ui.painel('menu'); });
}

// ---------- laço principal ----------
function loop(t) {
  const dt = Math.min(0.05, (t - ultimoT) / 1000 || 0); ultimoT = t; tempo += dt;
  try { atualizar(dt); desenhar(); } catch (e) { console.error(e); }
  requestAnimationFrame(loop);
}
function atualizar(dt) {
  // transição
  if (fade.a !== fade.alvo) { const v = dt * 4.2; fade.a = fade.a < fade.alvo ? Math.min(fade.alvo, fade.a + v) : Math.max(fade.alvo, fade.a - v); if (fade.a === fade.alvo && fade.res) { const r = fade.res; fade.res = null; r(); } }
  for (let i = flutuantes.length - 1; i >= 0; i--) { flutuantes[i].t += dt; if (flutuantes[i].t > 1.1) flutuantes.splice(i, 1); }
  if (G.modo === 'batalha') { atualizarBatalha(dt); consumirPedidos(); return; }
  if (G.modo === 'titulo') { cam.x = 15 * TS - VW / 2 + Math.sin(tempo * 0.2) * 30; cam.y = 12 * TS - VH / 2; atualizarNpcs(dt); consumirPedidos(); return; }
  if (P.mov) { P.mov.t += dt / P.mov.dur; if (P.mov.t >= 1) { P.x = P.mov.x1; P.y = P.mov.y1; P.mov = null; P.passo++; chegou(); } }
  atualizarNpcs(dt); if (D) atualizarMonstrosAnim(dt);
  const livre = !G.ocupado && !G.ui.modalAberto() && fade.a < 0.2;
  if (livre && !P.mov && pilha.length) iniciarMov(pilha[pilha.length - 1]);
  if (pedidoA) { pedidoA = false; if (livre && !P.mov) interagir(); else if (G.ui.dialogoAberto()) G.ui.dialogoAvancar(); }
  if (pedidoB) { pedidoB = false; if (G.ui.modalAberto()) G.ui.fechar(); else if (livre && !P.mov && (G.modo === 'masmorra')) G.ui.painel('menu'); }
}
function consumirPedidos() {
  if (pedidoA) { pedidoA = false; if (G.ui.dialogoAberto()) G.ui.dialogoAvancar(); else if (G.modo === 'batalha') btA(); }
  if (pedidoB) { pedidoB = false; if (G.ui.modalAberto()) G.ui.fechar(); else if (G.modo === 'batalha') btB(); }
}
function fadeTo(v) { fade.alvo = v; if (fade.a === v) return Promise.resolve(); return new Promise((r) => { fade.res = r; }); }
async function comFade(fn) { G.ocupado = true; await fadeTo(1); try { await fn(); } finally { await fadeTo(0); G.ocupado = false; } }

// ---------- mapas fixos (vila e vale) ----------
function trocarMapaSemFade(qual, pos) {
  mapa = qual === 'vila' ? vila : vale; G.mapa = qual; P.x = pos.x; P.y = pos.y; P.mov = null; P.dir = 'baixo'; D = null; G.D = null;
  npcs = qual === 'vila' ? vila.npcs.map((n) => ({ ...n, home: { x: n.x, y: n.y }, dir: 'baixo', mov: null, t: 1 + Math.random() * 3, passo: 0 })) : [];
  if (qual === 'vale' && St.S) garantirBausDoDia();
}
function garantirBausDoDia() { const s = S(); if (!s.diario.baus) s.diario.baus = bausDoDia(vale, s.diario.data, s.criado, St.capituloDisponivel() || 20); }
async function trocarMapa(para, pos) {
  await comFade(async () => {
    if (para === 'vale') { trocarMapaSemFade('vale', pos || vale.spawn); G.modo = 'vale'; Au.tocarMusica('mundo'); }
    else { trocarMapaSemFade('vila', pos || vila.spawn); G.modo = 'vila'; Au.tocarMusica('vila'); }
  });
}
const livreMapa = (x, y) => !solidoEm(mapa, x, y);
function npcEm(x, y) { return npcs.find((n) => (n.x === x && n.y === y) || (n.mov && n.mov.x1 === x && n.mov.y1 === y)); }
function baus() { return G.mapa === 'vale' && S() && S().diario.baus ? S().diario.baus : []; }
function bauEm(x, y) { return baus().find((b) => b.x === x && b.y === y); }

function iniciarMov(d) {
  P.dir = d; const [dx, dy] = DIRV[d], nx = P.x + dx, ny = P.y + dy;
  if (G.modo === 'masmorra') return movMasmorra(d, nx, ny);
  const g = mapa.gat[ny * mapa.w + nx];
  if (g && !g.passa) { pilha.length = 0; acionar(g); return; }
  const b = bauEm(nx, ny); if (b) { pilha.length = 0; abrirBauDoVale(b); return; }
  if (solidoEm(mapa, nx, ny) || npcEm(nx, ny)) return;
  P.mov = { x0: P.x, y0: P.y, x1: nx, y1: ny, t: 0, dur: 0.17 };
}
function chegou() {
  if (G.modo === 'masmorra') return chegouMasmorra();
  const g = mapa.gat[P.y * mapa.w + P.x];
  if (g && g.passa) { pilha.length = 0; acionar(g); return; }
  if (G.mapa === 'vale') {
    const i = P.y * vale.w + P.x;
    if (vale.enc[i] && --stepCool <= 0 && Math.random() < 0.08) { stepCool = 7; encontroDoVale(i); }
  }
}
function interagir() {
  if (G.modo === 'masmorra') return interagirMasmorra();
  const [dx, dy] = DIRV[P.dir], tx = P.x + dx, ty = P.y + dy;
  const n = npcEm(tx, ty); if (n) return falarComNpc(n);
  const g = mapa.gat[ty * mapa.w + tx]; if (g) return acionar(g);
  const b = bauEm(tx, ty); if (b) return abrirBauDoVale(b);
}
async function acionar(g) {
  Au.sfx(g.tipo === 'painel' ? 'porta' : 'select');
  if (g.tipo === 'painel') G.ui.painel(g.id);
  else if (g.tipo === 'mapa') { if (g.para === 'vale') await trocarMapa('vale'); else await trocarMapa('vila', { x: 14, y: 26 }); }
  else if (g.tipo === 'cap') G.ui.tentarCapitulo(g.n);
}
async function abrirBauDoVale(b) {
  if (b.aberto) { G.ui.toast('Baú vazio. Novos baús surgem a cada amanhecer.'); return; }
  b.aberto = true; Au.sfx('chest'); const L = S().heroi.nivel; St.darBau(1 + Math.floor(L / 6), 'vale'); St.salvar();
}
async function falarComNpc(n) {
  const def = NPCS[n.id]; if (!def) return; G.ocupado = true;
  const dx = P.x - n.x, dy = P.y - n.y; n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'dir' : 'esq') : (dy > 0 ? 'baixo' : 'cima'); n.mov = null;
  const linhas = [def.falas[rnd(def.falas.length)]]; const ctxL = falaContextual(n.id); if (ctxL) linhas.push(ctxL);
  Au.sfx('select'); await G.ui.dialogo(def.nome + (def.papel ? ` · ${def.papel}` : ''), linhas, n.id); G.ocupado = false;
  if (n.painel) G.ui.painel(n.painel);
}
function falaContextual(id) {
  const s = S(), Dd = St.dia(), h = s.historia;
  switch (id) {
    case 'lucia': return `Maré da Inércia: ${h.inercia}/10 — ${h.inercia >= 7 ? 'perigosa!' : h.inercia >= 4 ? 'fique atento.' : 'sob controle.'}`;
    case 'ferrao': return Dd.series ? `Hoje: ${Dd.series} série(s) e ${Dd.prs} PR(s). ${Dd.series >= 6 ? 'Isso é treino!' : 'Dá para mais.'}` : 'Hoje ainda não vi você suar aqui.';
    case 'eruvim': return Dd.estudo ? `${Dd.estudo} min de estudo hoje.` : 'Nenhuma página virada hoje...';
    case 'tavi': { const f = St.faixaDeHoje(); return `Sua mesa hoje: ${f.nome}.`; }
    case 'aurora': return s.heroi.exaustao ? `Você carrega Exaustão ${s.heroi.exaustao}. Coma, durma, descanse.` : 'Seu corpo parece em paz.';
    case 'brasa': return s.sequencia.atual ? `Sequência de ${s.sequencia.atual} dia(s). A Brasa agradece.` : 'Acenda a sequência hoje. Um treino basta.';
    case 'quinzinho': return `Você tem ${s.heroi.ouro} de ouro. Olhe a vitrine!`;
    default: return null;
  }
}

// ---------- NPCs ----------
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

// ---------- encontros no Vale ----------
async function encontroDoVale(i) {
  const s = S(); const reg = vale.reg[i]; const ativo = St.capituloDisponivel() || 20; const capN = Math.max(1, Math.min(reg, ativo));
  const cap = CAPITULOS[capN - 1]; const pool = R.poolDoCapitulo(cap); const id = pool[rnd(pool.length)];
  const [eh, ed] = R.escalaNivel(s.heroi.nivel); const mon = R.criarMonstro(id, { esc: eh, ov: { dm: ed }, inercia: s.historia.inercia, ciclo: s.historia.ciclo, ajuste: R.AJUSTE_CLASSE[s.heroi.cls] || 1 });
  pilha.length = 0; G.ocupado = true; Au.sfx('tocha'); await flashTela(); G.ocupado = false;
  iniciarBatalha(mon, { origem: 'vale', tema: cap.tema });
}
async function flashTela() { for (let k = 0; k < 3; k++) { fade.a = 0.9; await espera(70); fade.a = 0; fade.alvo = 0; await espera(60); } }

// ======================= MASMORRA =======================
const rand32 = () => (Math.random() * 4294967296) >>> 0;
G.entrarMasmorra = async ({ tipo, cap = 1 }) => {
  const s = S(); if (s.run) { G.ui.toast('Você já está em uma masmorra.'); return false; }
  if (!St.tochaDisponivel()) { G.ui.toast(s.heroi.exaustao >= 5 ? 'Exausto demais para entrar. Descanse e coma.' : 'Sem Tochas! Treine, estude ou cumpra missões para ganhar mais.'); return false; }
  St.gastarTocha(); const andar = tipo === 'historia' ? Math.min(s.historia.checkpoint[cap] || 1, CAPITULOS[cap - 1].andares) : 1;
  s.run = { tipo, cap, andar, seedBase: rand32(), ouroGanho: 0, itensGanhos: [], origem: G.mapa, d: null };
  await comFade(async () => { G.modo = 'masmorra'; carregarAndar(null); });
  if (tipo === 'historia') { s.historia.checkpoint[cap] = andar; }
  Au.tocarMusica('masmorra'); St.salvar(); G.ui.hud(); return true;
};
function retomarRun() {
  const s = S(), r = s.run; return comFade(async () => { G.modo = 'masmorra'; carregarAndar(r.d); Au.tocarMusica('masmorra'); G.ui.hud(); });
}
function chefeCatacumbas(andar, nivel) {
  const pool = R.poolCatacumbas(nivel, andar + 8).sort((a, b) => MONSTROS[b].cr - MONSTROS[a].cr); const id = pool[0]; const [eh, ed] = R.escalaNivel(nivel);
  return { base: id, nome: `Guardião: ${MONSTROS[id].n}`, ov: {}, esc: eh * 2.2, dm: ed * 1.15 };
}
function carregarAndar(salvo) {
  const s = S(), r = s.run; const cap = r.tipo === 'historia' ? CAPITULOS[r.cap - 1] : null;
  const final = cap ? r.andar === cap.andares : r.andar % 5 === 0; const tema = cap ? cap.tema : TEMAS_CATA[(r.andar - 1) % TEMAS_CATA.length];
  const nivel = cap ? cap.n : s.heroi.nivel; const chefe = final ? (cap ? cap.boss : chefeCatacumbas(r.andar, nivel)) : null;
  const seed = R.hashStr(`${r.tipo}:${r.cap}:${r.andar}:${r.seedBase}:${s.historia.ciclo}`);
  const d = gerarMasmorra({ seed, andar: r.andar, final, tema, pool: cap ? R.poolDoCapitulo(cap) : [], nivel, chefe, inercia: s.historia.inercia, ciclo: s.historia.ciclo, ajuste: R.AJUSTE_CLASSE[s.heroi.cls] || 1 });
  d.ents.forEach((e, i) => { e.i = i; e.px = e.x; e.py = e.y; if (e.tipo === 'chefe') { e.vivo = true; e.acordado = false; } });
  D = { d, cap, final, tema, vis: new Set(), raio: 6, ultimoPasso: 0 }; G.D = D;
  P.x = d.start.x; P.y = d.start.y; P.mov = null; P.dir = 'baixo';
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
  const s = S(); const ex = s.heroi.exaustao || 0; D.raio = 6 - (ex >= 2 ? 1 : 0) - (ex >= 4 ? 1 : 0); const d = D.d;
  D.vis = visiveis(d, P.x, P.y, D.raio); for (const i of D.vis) d.explorado[i] = 1;
  const pass = 10 + (R.derivar(s).M.SAB || 0), dc = 12 + Math.floor(d.andar / 3);
  for (const e of d.ents) if (e.tipo === 'armadilha' && e.oculta && e.ativa && Math.abs(e.x - P.x) <= 1 && Math.abs(e.y - P.y) <= 1 && pass >= dc) { e.oculta = false; flutuar(e.x, e.y, 'ARMADILHA!', '#ff9f40'); }
}
const entEm = (x, y) => D.d.ents.find((e) => e.x === x && e.y === y && e.vivo !== false && !(e.tipo === 'armadilha' && !e.ativa));
function piso(x, y) { const d = D.d; return x >= 0 && y >= 0 && x < d.w && y < d.h && d.tiles[y * d.w + x] !== T.PAREDE; }
function movMasmorra(dir, nx, ny) {
  const e = entEm(nx, ny);
  if (e) {
    pilha.length = 0;
    if (e.tipo === 'monstro' || e.tipo === 'chefe') { if (e.cooldown > 0) return; return iniciarBatalha(e.mon, { origem: 'masmorra', ent: e, surpresa: !e.acordado, tema: D.tema }); }
    if (e.tipo === 'bau') return abrirBauMasmorra(e); if (e.tipo === 'santuario') return usarSantuario(e); if (e.tipo === 'tocha_cx') return pegarTocha(e);
    if (e.tipo === 'armadilha') { if (!e.oculta) { G.ui.toast('Armadilha à frente! Aperte A para tentar desarmar.'); return; } }
  }
  if (!piso(nx, ny)) return;
  P.mov = { x0: P.x, y0: P.y, x1: nx, y1: ny, t: 0, dur: 0.15 };
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
    if (!e.acordado) { if (vis && dist <= 4 && Math.random() < 0.6) { e.acordado = true; flutuar(e.x, e.y, '!', '#ffd23f'); Au.sfx('select'); } else continue; }
    if (dist > 11) { e.acordado = false; continue; }
    if (e.tipo === 'chefe') { if (dist <= 1 && !contato) contato = e; continue; } // chefes esperam em seu salão
    if (dist <= 1) { if (!contato && !(e.cooldown > 0)) contato = e; continue; }
    const ax = Math.sign(P.x - e.x), ay = Math.sign(P.y - e.y); const tent = Math.abs(P.x - e.x) >= Math.abs(P.y - e.y) ? [[ax, 0], [0, ay], [0, -ay], [-ax, 0]] : [[0, ay], [ax, 0], [ax, 0], [0, -ay]];
    for (const [dx, dy] of tent) { if (!dx && !dy) continue; const nx = e.x + dx, ny = e.y + dy; if (d.tiles[ny * d.w + nx] === T.CHAO && !entEm(nx, ny) && !(nx === P.x && ny === P.y)) { e.x = nx; e.y = ny; break; } }
    if (Math.abs(e.x - P.x) + Math.abs(e.y - P.y) <= 1 && !contato && !(e.cooldown > 0)) contato = e;
  }
  if (contato) { pilha.length = 0; iniciarBatalha(contato.mon, { origem: 'masmorra', ent: contato, surpresa: false, tema: D.tema }); }
}
function atualizarMonstrosAnim(dt) { for (const e of D.d.ents) { if (e.px === undefined) continue; const k = Math.min(1, dt * 12); e.px += (e.x - e.px) * k; e.py += (e.y - e.py) * k; } }
function interagirMasmorra() {
  const [dx, dy] = DIRV[P.dir], tx = P.x + dx, ty = P.y + dy; const e = D.d.ents.find((q) => q.x === tx && q.y === ty && q.tipo === 'armadilha' && q.ativa && !q.oculta);
  if (e) { const M = R.derivar(S()).M; const r = Math.floor(Math.random() * 20) + 1 + (M.DES || 0); if (r >= 12) { e.ativa = false; Au.sfx('select'); const o = 3 + D.d.andar * 2; St.ganhoDaMasmorra(o); flutuar(tx, ty, `DESARMADA +${o}`, '#6fcf7f'); } else { flutuar(tx, ty, 'FALHOU!', '#ff5c6c'); dispararArmadilha(e); } return; }
  const q = D.d.ents.find((z) => z.x === tx && z.y === ty && z.vivo !== false); if (q) movMasmorra(P.dir, tx, ty);
}
function dispararArmadilha(e) {
  e.ativa = false; e.oculta = false; Au.sfx('armadilha'); Au.vibrar(60); const s = S(), der = R.derivar(s); const andar = D.d.andar;
  const dados = 1 + Math.floor(s.heroi.nivel / 3) + Math.floor(andar / 4); let dano = 0; for (let k = 0; k < dados; k++) dano += 1 + rnd(6);
  const dc = 11 + Math.floor(andar / 3), r = 1 + rnd(20) + (der.M.DES || 0); if (r >= dc) dano = Math.floor(dano / 2);
  s.heroi.hp = Math.max(1, s.heroi.hp - dano); flutuar(P.x, P.y, `-${dano}`, '#ff5c6c'); G.ui.toast(r >= dc ? `Você se esquiva em parte da armadilha! (−${dano} PV)` : `Armadilha! (−${dano} PV)`); St.salvar(); G.ui.hud();
}
function abrirBauMasmorra(e) {
  if (e.aberto) return; e.aberto = true; Au.sfx('chest'); const forca = (e.forca || 0) + Math.floor(S().heroi.nivel / 5); const r = St.darBau(forca, 'masmorra'); if (S().run) { S().run.ouroGanho += r.ouro; S().run.itensGanhos.push(...r.itens); } salvarRun(); St.salvar();
}
function usarSantuario(e) {
  if (e.usado) { G.ui.toast('O santuário já concedeu sua bênção.'); return; } e.usado = true; const s = S(); const m = St.der().hpMax; const cura = m - s.heroi.hp; s.heroi.hp = m;
  Au.sfx('heal'); flutuar(P.x, P.y, `+${cura} PV`, '#6fcf7f'); G.ui.toast('Um santuário antigo restaura todo o seu vigor.'); salvarRun(); St.salvar(); G.ui.hud();
}
function pegarTocha(e) { if (e.usado) return; e.usado = true; const s = S(); s.heroi.tochas = Math.min(15, s.heroi.tochas + 1); Au.sfx('tocha'); G.ui.toast('Você encontrou uma Tocha sobressalente! (+1)'); salvarRun(); St.salvar(); G.ui.hud(); }
async function descer() {
  const s = S(), r = s.run; const cap = D.cap;
  if (!St.tochaDisponivel()) { G.ui.toast('Sem Tochas para descer. A escuridão é densa demais. Volte quando tiver treinado.'); return; }
  St.gastarTocha(); St.andarConcluido(r.andar, false); r.andar++; if (r.tipo === 'historia') s.historia.checkpoint[r.cap] = r.andar; else s.catacumbas.melhor = Math.max(s.catacumbas.melhor, r.andar);
  Au.sfx('escada'); await comFade(async () => { carregarAndar(null); }); salvarRun(); St.salvar();
  flutuar(P.x, P.y, `ANDAR ${r.andar}`, '#6af0ff'); G.ui.hud();
}
async function pedirSaida() {
  const ok = await G.ui.confirmar('Sair da masmorra?', 'Você volta para a superfície. O progresso do capítulo (andar atual) fica salvo. Cada retorno custa 1 Tocha.', 'Sair', 'Ficar');
  if (ok) sairMasmorra(); else { /* ficar: empurra um passo para dentro */ }
}
async function sairMasmorra(motivo = 'saiu') {
  const s = S(), r = s.run; const origem = r ? r.origem : 'vila'; const cap = r && r.tipo === 'historia' ? r.cap : null; s.run = null; D = null; G.D = null; St.salvar();
  await comFade(async () => {
    if (origem === 'vale') { const e = vale.extra[(cap || 1) - 1]; trocarMapaSemFade('vale', { x: e.x, y: e.y + 1 }); G.modo = 'vale'; Au.tocarMusica('mundo'); }
    else { trocarMapaSemFade('vila', vila.retornoPortal); G.modo = 'vila'; Au.tocarMusica('vila'); }
  });
  G.ui.hud(); G.ui.drenar();
}
function abandonarRun() { const s = S(); s.run = null; D = null; G.D = null; St.salvar(); }
G.sair = sairMasmorra;

// ---------- efeitos de mapa ----------
function flutuar(x, y, txt, cor = '#fff') { flutuantes.push({ x, y, txt, cor, t: 0 }); }

// ======================= BATALHA =======================
const BT = {}; // refs DOM
function montarBatalhaDom() {
  const q = (id) => document.getElementById(id);
  BT.box = q('bt'); BT.m = q('bt-m'); BT.h = q('bt-h'); BT.log = q('bt-log'); BT.menu = q('bt-menu');
}
function iniciarBatalha(mon, opc) {
  pilha.length = 0; Au.sfx('tocha'); const s = S();
  const { B, ev } = novaBatalha(s, mon, Math.random, { surpresa: !!opc.surpresa });
  const bgt = opc.tema || 'porao';
  G.bt = { B, opc, filaBg: bgt, menu: 'raiz', ocupado: true, rapido: false, hpM: mon.hp, hpH: B.h.hp, flashM: 0, flashH: 0, shakeM: 0, shakeH: 0, nums: [], fim: false, aviso: '' };
  G.anterior = G.modo; G.modo = 'batalha'; document.body.classList.add('em-batalha'); BT.box.classList.remove('oculto');
  Au.tocarMusica(mon.chefe ? 'chefe' : 'batalha'); BT.log.textContent = ''; atualizarCaixasBatalha(); tocarEventos(ev, true);
}
function eventoSnd(snd) { return ({ hit: 'hit', crit: 'crit', miss: 'miss', hurt: 'hurt', heal: 'heal', spell: 'spell', win: 'win', lose: 'lose', flee: 'flee', start: 'tocha' })[snd]; }
async function tocarEventos(evs, inicio = false) {
  const bt = G.bt; const B = bt.B; bt.ocupado = true; montarMenu(); const w = (ms) => espera(bt.rapido ? ms * 0.25 : ms);
  for (const e of evs) {
    if (e.t === 'msg') { logBt(e.txt); const sn = eventoSnd(e.snd); if (sn && e.snd !== 'win' && e.snd !== 'lose') Au.sfx(sn); await w(e.snd === 'start' ? 650 : 560); }
    else if (e.t === 'dano') {
      if (e.alvo === 'm') { bt.hpM = Math.max(0, bt.hpM - e.n); bt.flashM = 0.25; bt.shakeM = 0.3; bt.nums.push({ x: 175, y: 38, txt: String(e.n), cor: e.crit ? '#ffd23f' : '#fff', t: 0, g: e.crit ? 3 : 2 }); if (e.n > 0 && !e.crit) Au.sfx('hit'); }
      else { bt.hpH = Math.max(0, bt.hpH - e.n); bt.flashH = 0.25; bt.shakeH = 0.3; bt.nums.push({ x: 55, y: 92, txt: String(e.n), cor: '#ff5c6c', t: 0, g: 2 }); Au.sfx('hurt'); Au.vibrar(40); }
      atualizarCaixasBatalha(); await w(420);
    } else if (e.t === 'cura') { bt.hpH = Math.min(B.h.hpMax, bt.hpH + e.n); bt.nums.push({ x: 55, y: 92, txt: '+' + e.n, cor: '#6fcf7f', t: 0, g: 2 }); atualizarCaixasBatalha(); await w(380); }
    else if (e.t === 'erro') { const quem = e.alvo === 'm' ? 'Você erra' : `${B.m.n} erra`; logBt(`${quem}! (d20 ${e.rolagem} → ${e.total})`); Au.sfx('miss'); bt.nums.push({ x: e.alvo === 'm' ? 175 : 55, y: e.alvo === 'm' ? 38 : 92, txt: 'ERROU', cor: '#b8b8c4', t: 0, g: 1 }); await w(420); }
  }
  bt.hpM = B.m.hp; bt.hpH = B.h.hp; atualizarCaixasBatalha(); bt.rapido = false;
  if (B.fim) return fimBatalha();
  bt.ocupado = false; bt.menu = 'raiz'; montarMenu();
}
function logBt(txt) { BT.log.textContent = txt; }
function atualizarCaixasBatalha() {
  const bt = G.bt; if (!bt) return; const B = bt.B, m = B.m, H = B.h;
  const pct = (a, b) => Math.max(0, Math.min(100, (a / b) * 100));
  const cor = (p) => (p > 50 ? '#6fcf7f' : p > 22 ? '#e6d35a' : '#ff5c6c');
  const pm = pct(bt.hpM, m.hpMax), ph = pct(bt.hpH, H.hpMax);
  BT.m.innerHTML = `<b>${esc(m.n)}</b><span class="bt-nv">ND ${m.cr < 1 ? (m.cr === 0.125 ? '1/8' : m.cr === 0.25 ? '1/4' : '1/2') : m.cr}</span><div class="bt-barra"><i style="width:${pm}%;background:${cor(pm)}"></i></div><small>${Math.ceil(bt.hpM)}/${m.hpMax} PV · CA ${m.ca}</small>`;
  BT.h.innerHTML = `<b>${esc(H.nome)}</b><span class="bt-nv">Nv ${H.L}</span><div class="bt-barra"><i style="width:${ph}%;background:${cor(ph)}"></i></div><small>${Math.ceil(bt.hpH)}/${H.hpMax} PV · CA ${H.ca}</small><small class="rec">${recursosTxt(H)}</small>`;
}
const NOMES_CONT = { folego: 'Fôlego', surto: 'Surto', furia: 'Fúria', ardil: 'Ardil', sorte: 'Sorte', recup: 'Recup.', canal: 'Canal', maos: 'Mãos' };
function recursosTxt(H) {
  const p = []; H.slots.forEach((v, i) => { if (v > 0 || (St.S.recursosMax.slots[i] || 0) > 0) p.push(`${i + 1}º:${v}`); });
  for (const [k, v] of Object.entries(H.cont)) if (NOMES_CONT[k] && v > 0) p.push(`${NOMES_CONT[k]}:${v >= 99 ? '∞' : v}`);
  if (H.exaust) p.push(`Exaustão ${H.exaust}`); if (H.insp) p.push(`Insp.${H.insp}`); if (H.conds.furia) p.push('FÚRIA');
  return esc(p.join(' · '));
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function botao(rot, sub, fn, { off = false, cls = '' } = {}) {
  const b = document.createElement('button'); b.className = 'bt-btn ' + cls; b.disabled = !!off; b.innerHTML = `<span>${esc(rot)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}`;
  b.addEventListener('click', () => { Au.destravar(); Au.sfx('select'); fn(); }); return b;
}
function montarMenu() {
  const bt = G.bt; if (!bt) return; const menu = BT.menu; menu.innerHTML = ''; const B = bt.B, H = B.h;
  if (bt.ocupado) { const b = botao('…', 'toque para acelerar', () => { bt.rapido = true; }, { cls: 'bt-larga' }); menu.append(b); return; }
  if (bt.fim) { menu.append(botao('Continuar', bt.aviso || '', () => encerrarBatalha(), { cls: 'bt-larga bt-ok' })); return; }
  const agirE = async (id, arg) => { if (bt.ocupado) return; bt.menu = 'raiz'; const evs = agir(B, id, arg); if (!evs.length) { logBt('Ação indisponível.'); montarMenu(); return; } St.salvarBatalha(B); await tocarEventos(evs); };
  const acs = acoesHeroi(B); const infoTurno = `Ação ${H.acoes > 0 ? '●' : '○'}  Bônus ${H.bonus > 0 ? '●' : '○'}`;
  if (bt.menu === 'raiz') {
    logBt(`${infoTurno} — o que fazer?`);
    const mags = magiasDoHeroi(B).filter((m) => m.nv === 0 || m.circulos.length); const itens = B.inv.map((x, i) => ({ x, i })).filter(({ x }) => x.n > 0 && ITENS[x.id] && ITENS[x.id].tipo === 'consumivel');
    menu.append(botao('Atacar', `${H.arma.nome} · ${H.ataques > 1 ? H.ataques + ' ataques' : '1 ataque'}`, () => agirE('atacar'), { off: H.acoes <= 0 }));
    if (mags.length) menu.append(botao('Magia', `${mags.length} opções`, () => { bt.menu = 'magia'; montarMenu(); }));
    menu.append(botao('Habilidades', 'classe e ações', () => { bt.menu = 'hab'; montarMenu(); }));
    menu.append(botao('Itens', itens.length ? `${itens.length} tipos` : 'vazio', () => { bt.menu = 'item'; montarMenu(); }, { off: !itens.length || H.acoes <= 0 }));
    menu.append(botao('Auto ⚡', 'ação sugerida', () => { const e = iaEscolher(B); if (e) agirE(e.id, e.arg); else agirE('esquivar'); }, { cls: 'bt-auto' }));
    const fugir = acs.find((a) => a.id === 'fugir'); menu.append(botao('Fugir', fugir.off ? 'chefes bloqueiam a fuga' : 'tentar escapar', () => agirE('fugir'), { off: fugir.off || H.acoes <= 0 }));
    if (H.acoes > 0 && H.bonus >= 0) menu.append(botao('Passar turno', 'encerrar', () => { const evs = passarTurno(B); St.salvarBatalha(B); tocarEventos(evs); }, { cls: 'bt-pequena' }));
    return;
  }
  menu.append(botao('‹ Voltar', '', () => { bt.menu = 'raiz'; montarMenu(); }, { cls: 'bt-voltar' }));
  if (bt.menu === 'magia') {
    logBt('Escolha uma magia.');
    for (const sp of magiasDoHeroi(B)) {
      const cir = sp.nv === 0 ? [0] : sp.circulos; for (const nv of cir) {
        const off = sp.bonus ? H.bonus <= 0 : H.acoes <= 0;
        menu.append(botao(`${sp.nome}${nv ? ` ${nv}º` : ''}`, sp.desc || '', () => agirE('magia', { id: sp.id, nv: nv || sp.nv }), { off }));
      }
    }
  } else if (bt.menu === 'hab') {
    logBt('Habilidades e ações.');
    for (const a of acs) { if (a.id === 'atacar' || a.id === 'fugir') continue; menu.append(botao(a.rot, a.desc, () => agirE(a.id, a.arg), { off: !podeAgir(B, a) })); }
  } else if (bt.menu === 'item') {
    logBt('Escolha um item.');
    B.inv.forEach((x, i) => { if (x.n > 0 && ITENS[x.id] && ITENS[x.id].tipo === 'consumivel') menu.append(botao(`${ITENS[x.id].nome} ×${x.n}`, ITENS[x.id].desc || '', () => agirE('item', i), { off: H.acoes <= 0 })); });
  }
}
function btA() { const bt = G.bt; if (bt && bt.ocupado) bt.rapido = true; else if (bt && bt.fim) encerrarBatalha(); }
function btB() { const bt = G.bt; if (bt && !bt.ocupado && bt.menu !== 'raiz') { bt.menu = 'raiz'; montarMenu(); } }

async function fimBatalha() {
  const bt = G.bt, B = bt.B, m = B.m, opc = bt.opc, s = S(); bt.fim = true; bt.ocupado = false; St.salvarBatalha(B);
  if (B.fim === 'vitoria') {
    Au.sfx('win'); let txt = 'Vitória!'; const partes = [];
    if (opc.origem === 'masmorra') {
      const e = opc.ent; const ouro = e.ouro || R.ouroDoMonstro(m, Math.random); St.ganhoDaMasmorra(ouro); partes.push(`+${ouro} ouro`);
      if (!m.chefe && Math.random() < 0.1) { St.invAdd('pocao1'); s.run.itensGanhos.push('pocao1'); partes.push('Poção de Cura'); }
      const cura = Math.round(St.der().hpMax * 0.15); s.heroi.hp = Math.min(St.der().hpMax, s.heroi.hp + cura); partes.push(`+${cura} PV`);
      e.vivo = false; St.abateRegistrado(m);
    } else {
      s.diario.enc = (s.diario.enc || 0) + 1; if (s.diario.enc <= 12) { const o = R.ouroDoMonstro(m, Math.random); St.ganharOuro(o); partes.push(`+${o} ouro`); } else partes.push('(sem ouro: limite diário)'); if (Math.random() < 0.08) { St.invAdd('pocao1'); partes.push('Poção de Cura'); } St.abateRegistrado(m);
    }
    bt.aviso = partes.join(' · '); logBt(`${txt} ${bt.aviso}`);
  } else if (B.fim === 'derrota') { Au.sfx('lose'); logBt('Você caiu...'); bt.aviso = opc.origem === 'masmorra' ? 'O saque da expedição se perde.' : 'Você é resgatado e levado à vila.'; }
  else { logBt('Você escapou!'); bt.aviso = ''; if (opc.ent) opc.ent.cooldown = 4; }
  St.salvar(); G.ui.hud(); montarMenu();
}
async function encerrarBatalha() {
  const bt = G.bt; if (!bt) return; const B = bt.B, opc = bt.opc, s = S(); const fim = B.fim; G.bt = null; G.ocupado = true;
  BT.box.classList.add('oculto'); document.body.classList.remove('em-batalha'); BT.menu.innerHTML = '';
  if (fim === 'derrota') {
    const perdido = s.run ? s.run.ouroGanho : 0; St.derrotaNaMasmorra(); if (perdido) St.ganharOuro(-perdido); D = null; G.D = null;
    await fadeTo(1); trocarMapaSemFade('vila', vila.retornoPortal); G.modo = 'vila'; Au.tocarMusica('vila'); s.heroi.hp = Math.max(s.heroi.hp, Math.floor(St.der().hpMax * 0.25)); St.salvar(); await fadeTo(0); G.ocupado = false;
    G.ui.toast(perdido ? `Você acorda na vila. Perdeu ${perdido} de ouro da expedição.` : 'Você acorda na vila, ferido, mas vivo.'); G.ui.hud(); G.ui.drenar(); return;
  }
  G.modo = G.anterior; G.ocupado = false; Au.tocarMusica(G.modo === 'masmorra' ? 'masmorra' : 'mundo');
  if (G.modo === 'masmorra') { salvarRun(); St.salvar(); if (fim === 'vitoria') await aposVitoria(opc); }
  G.ui.hud(); G.ui.drenar();
}
async function aposVitoria(opc) {
  const e = opc.ent; if (!e) return; const d = D.d;
  if (e.tipo === 'chefe') {
    if (D.cap) {
      G.ocupado = true; const cap = D.cap; const escolha = await G.ui.fimCapitulo(cap.n); St.concluirCapitulo(cap.n, escolha); G.ocupado = false;
      if (cap.n === 20) { await G.ui.fimDeJogo(); }
      sairMasmorra('vitoria');
    } else {
      D.escadaAberta = true; d.tiles[e.y * d.w + e.x] = T.DESCE; St.darBau(6, 'chefe'); G.ui.toast('O guardião cai. Uma escada se abre onde ele estava.'); const s = S(); s.catacumbas.melhor = Math.max(s.catacumbas.melhor, s.run.andar); salvarRun(); St.salvar();
    }
  }
}
function atualizarBatalha(dt) {
  const bt = G.bt; if (!bt) return; bt.flashM = Math.max(0, bt.flashM - dt); bt.flashH = Math.max(0, bt.flashH - dt); bt.shakeM = Math.max(0, bt.shakeM - dt); bt.shakeH = Math.max(0, bt.shakeH - dt);
  for (let i = bt.nums.length - 1; i >= 0; i--) { bt.nums[i].t += dt; if (bt.nums[i].t > 1) bt.nums.splice(i, 1); }
}

// ======================= DESENHO =======================
// A vista se adapta à tela: no celular em pé mostra menos colunas e mais linhas (tiles grandes e a área toda usada);
// na batalha volta ao quadro fixo 240×176 onde os sprites foram desenhados.
let vistaSujo = true, vistaBat = null, vistaChave = '';
function aplicarVista() {
  const vista = canvas.parentElement, jogo = vista.parentElement; const w = jogo.clientWidth, h = jogo.clientHeight; if (!w || !h) return;
  let vw = 240, vh = 176;
  if (!vistaBat) { const alvo = w < 520 ? 34 : 48; const cols = Math.max(9, Math.min(15, Math.round(w / alvo))); const tile = w / cols; const rows = Math.max(7, Math.min(17, Math.floor(h / tile))); vw = cols * TS; vh = rows * TS; }
  const chave = `${vw}x${vh}@${w}x${h}`; if (chave === vistaChave) return; vistaChave = chave;
  const esc = Math.min(w / vw, h / vh); VW = vw; VH = vh; canvas.width = vw; canvas.height = vh; ctx.imageSmoothingEnabled = false;
  vista.style.width = Math.floor(vw * esc) + 'px'; vista.style.height = Math.floor(vh * esc) + 'px';
}
function desenhar() {
  const bat = G.modo === 'batalha'; if (vistaSujo || bat !== vistaBat) { vistaBat = bat; vistaSujo = false; aplicarVista(); }
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
  if (G.modo === 'batalha') desenharBatalha();
  else if (G.modo === 'masmorra' && D) desenharMasmorra();
  else desenharMapa();
  if (fade.a > 0.001) { ctx.fillStyle = `rgba(0,0,0,${fade.a})`; ctx.fillRect(0, 0, VW, VH); }
}
function atualizarCamera(mw, mh) {
  const pxf = P.mov ? P.x + (P.mov.x1 - P.x) * P.mov.t : P.x, pyf = P.mov ? P.y + (P.mov.y1 - P.y) * P.mov.t : P.y;
  const cx = pxf * TS + TS / 2 - VW / 2, cy = pyf * TS + TS / 2 - VH / 2;
  cam.x = mw * TS <= VW ? Math.round((mw * TS - VW) / 2) : Math.max(0, Math.min(mw * TS - VW, cx)); cam.y = mh * TS <= VH ? Math.round((mh * TS - VH) / 2) : Math.max(0, Math.min(mh * TS - VH, cy));
  return [pxf, pyf];
}
function spriteJogador(dir, andando) {
  const s = St.S; const cls = s ? s.heroi.cls : 'guerreiro'; const sp = spriteHeroi(cls, s ? s.heroi.capa : 'padrao', CLASSES[cls].cores); return sp[dir][andando ? (P.passo + Math.floor(P.mov ? P.mov.t * 2 : 0)) % 2 : 0];
}
function frameAnim() { return Math.floor(tempo * 2.2) % 2; }
function desenharMapa() {
  const m = mapa; const titulo = G.modo === 'titulo'; let pxf = P.x, pyf = P.y;
  if (!titulo) [pxf, pyf] = atualizarCamera(m.w, m.h); else { cam.x = Math.max(0, Math.min(m.w * TS - VW, cam.x)); cam.y = Math.max(0, Math.min(m.h * TS - VH, cam.y)); }
  const x0 = Math.max(0, Math.floor(cam.x / TS)), y0 = Math.max(0, Math.floor(cam.y / TS)), x1 = Math.min(m.w - 1, Math.ceil((cam.x + VW) / TS)), y1 = Math.min(m.h - 1, Math.ceil((cam.y + VH) / TS));
  const f = frameAnim();
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const id = m.g[y * m.w + x]; const c = tileCanvas(id, f); if (c) ctx.drawImage(c, Math.round(x * TS - cam.x), Math.round(y * TS - cam.y)); }
  const ox = (x) => Math.round(x * TS - cam.x), oy = (y) => Math.round(y * TS - cam.y);
  // rótulos dos prédios
  if (G.mapa === 'vila') for (const p of PREDIOS) { const cxp = ox(p.x + p.w / 2) , cyp = oy(p.y) - 7; if (cxp > -40 && cxp < VW + 40 && cyp > -8 && cyp < VH) textoPixel(ctx, p.nome, cxp, cyp, '#fff', '#14101c', 'centro'); }
  // entidades ordenadas por y
  const ents = [];
  for (const n of npcs) { const nx = n.mov ? n.x + (n.mov.x1 - n.x) * n.mov.t : n.x, ny = n.mov ? n.y + (n.mov.y1 - n.y) * n.mov.t : n.y; ents.push({ y: ny, d: () => { const sp = spriteNpc(n.id, NPC_PAL[n.id] || {}); ctx.drawImage(sp[n.mov ? n.passo % 2 : 0], ox(nx), oy(ny) - 2); } }); }
  for (const b of baus()) ents.push({ y: b.y, d: () => { const c = tileCanvas(b.aberto ? 'bauA' : 'bauF'); ctx.drawImage(c, ox(b.x), oy(b.y)); if (!b.aberto) textoPixel(ctx, '!', ox(b.x) + 7, oy(b.y) - 6 + Math.round(Math.sin(tempo * 5) * 1.5), '#ffd23f', '#14101c'); } });
  if (!titulo) ents.push({ y: pyf + 0.01, d: () => { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(ox(pxf) + 3, oy(pyf) + 13, 10, 2); ctx.drawImage(spriteJogador(P.dir, !!P.mov), ox(pxf), oy(pyf) - 2); } });
  ents.sort((a, b) => a.y - b.y).forEach((e) => e.d());
  // marcadores do Vale: capítulo ativo e fog
  if (G.mapa === 'vale' && St.S) {
    const ativo = St.capituloDisponivel(); for (const e of vale.extra) { const lim = e.n; const cx = ox(e.x), cy = oy(e.y); if (cx < -16 || cx > VW || cy < -16 || cy > VH) continue; const c = tileCanvas(e.n === ativo ? 'cavernaLiv' : 'caverna', f); ctx.drawImage(c, cx, cy); if (e.n === ativo) textoPixel(ctx, '!', cx + 7, cy - 7 + Math.round(Math.sin(tempo * 5) * 2), '#6af0ff', '#14101c'); else textoPixel(ctx, String(e.n), cx + 8, cy + 1, St.S.historia.limpos.includes(e.n) ? '#6fcf7f' : '#8a8a96', '#14101c', 'centro'); }
    const lim = Math.max(ativo || 20, 1) + 1.2; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const r = vale.reg[y * vale.w + x]; if (r > lim) { ctx.fillStyle = `rgba(10,8,18,${Math.min(0.88, 0.55 + (r - lim) * 0.05)})`; ctx.fillRect(Math.round(x * TS - cam.x), Math.round(y * TS - cam.y), TS, TS); } }
  }
  // iluminação por hora
  const h = new Date().getHours() + new Date().getMinutes() / 60; let tint = null;
  if (h >= 20 || h < 5) tint = 'rgba(12,16,70,0.38)'; else if (h >= 18) tint = 'rgba(255,120,40,0.16)'; else if (h < 7) tint = 'rgba(255,170,90,0.10)';
  if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, VW, VH); }
  desenharFlutuantes(ox, oy);
}
function desenharFlutuantes(ox, oy) {
  for (const f of flutuantes) { const px = ox(f.x) + 8, py = oy(f.y) - 6 - f.t * 12; ctx.globalAlpha = Math.min(1, 2 - f.t * 1.8); textoPixel(ctx, f.txt, px, Math.round(py), f.cor, '#14101c', 'centro'); ctx.globalAlpha = 1; }
}
function desenharMasmorra() {
  const d = D.d, s = S(); const [pxf, pyf] = atualizarCamera(d.w, d.h); const f = frameAnim();
  const x0 = Math.max(0, Math.floor(cam.x / TS)), y0 = Math.max(0, Math.floor(cam.y / TS)), x1 = Math.min(d.w - 1, Math.ceil((cam.x + VW) / TS)), y1 = Math.min(d.h - 1, Math.ceil((cam.y + VH) / TS));
  const ox = (x) => Math.round(x * TS - cam.x), oy = (y) => Math.round(y * TS - cam.y); const r2 = D.raio * D.raio;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * d.w + x; if (!d.explorado[i]) continue; const t = d.tiles[i]; let c;
    if (t === T.PAREDE) c = tileCanvas('parede_' + D.tema); else if (t === T.DESCE) c = tileCanvas('desce'); else if (t === T.SOBE) c = tileCanvas('sobe'); else if (t === T.SAIDA) c = tileCanvas('saida', f); else c = tileCanvas('piso_' + D.tema);
    ctx.drawImage(c, ox(x), oy(y));
    if (!D.vis.has(i)) { ctx.fillStyle = 'rgba(6,4,14,0.62)'; ctx.fillRect(ox(x), oy(y), TS, TS); }
    else { const dd = (x - P.x) * (x - P.x) + (y - P.y) * (y - P.y); const a = Math.max(0, (dd / r2 - 0.35) * 0.7); if (a > 0.02) { ctx.fillStyle = `rgba(6,4,14,${a.toFixed(2)})`; ctx.fillRect(ox(x), oy(y), TS, TS); } }
  }
  const lista = [];
  for (const e of d.ents) {
    if (e.vivo === false) continue; const i = e.y * d.w + e.x; const vis = D.vis.has(i);
    if (e.tipo === 'monstro' || e.tipo === 'chefe') { if (!vis) continue; lista.push({ y: e.py, d: () => { const sp = spriteMonstro(e.spr, e.pal || {}); const bob = Math.round(Math.sin(tempo * 3 + e.x) * 1); const gx = ox(e.px), gy = oy(e.py) + bob; if (e.tipo === 'chefe') { ctx.fillStyle = 'rgba(255,60,60,0.25)'; ctx.fillRect(gx - 1, gy - 1, 18, 18); } ctx.drawImage(sp, gx, gy); if (e.acordado) textoPixel(ctx, '!', gx + 7, gy - 7, '#ffd23f', '#14101c'); else textoPixel(ctx, 'Z', gx + 12, gy - 4 + Math.round(Math.sin(tempo * 2)), '#8ab0ff', '#14101c'); } }); }
    else if (!d.explorado[i]) continue;
    else if (e.tipo === 'bau') lista.push({ y: e.y, d: () => ctx.drawImage(tileCanvas(e.aberto ? 'bauA' : 'bauF'), ox(e.x), oy(e.y)) });
    else if (e.tipo === 'santuario') lista.push({ y: e.y, d: () => { ctx.globalAlpha = e.usado ? 0.5 : 1; ctx.drawImage(tileCanvas('santuario', f), ox(e.x), oy(e.y)); ctx.globalAlpha = 1; } });
    else if (e.tipo === 'tocha_cx') { if (!e.usado) lista.push({ y: e.y, d: () => ctx.drawImage(tileCanvas('tochaCx', f), ox(e.x), oy(e.y)) }); }
    else if (e.tipo === 'armadilha') { if (e.ativa && !e.oculta) lista.push({ y: e.y - 0.5, d: () => ctx.drawImage(tileCanvas('armadilha'), ox(e.x), oy(e.y)) }); }
  }
  lista.push({ y: pyf + 0.01, d: () => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(ox(pxf) + 3, oy(pyf) + 13, 10, 2); ctx.drawImage(spriteJogador(P.dir, !!P.mov), ox(pxf), oy(pyf) - 2); } });
  lista.sort((a, b) => a.y - b.y).forEach((e) => e.d());
  desenharFlutuantes(ox, oy);
  // minimapa
  const mw = d.w, mh = d.h, mx = VW - mw - 3, my = 3; ctx.fillStyle = 'rgba(6,4,14,0.65)'; ctx.fillRect(mx - 1, my - 1, mw + 2, mh + 2);
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const i = y * mw + x; if (!d.explorado[i]) continue; const t = d.tiles[i]; ctx.fillStyle = t === T.PAREDE ? '#3a3250' : t === T.DESCE ? '#6af0ff' : t === T.SOBE ? '#6fcf7f' : '#8a84a8'; ctx.fillRect(mx + x, my + y, 1, 1); }
  for (const e of d.ents) { if (e.vivo === false) continue; const i = e.y * mw + e.x; if ((e.tipo === 'chefe') && d.explorado[i]) { ctx.fillStyle = '#ff5c6c'; ctx.fillRect(mx + e.x - 1, my + e.y - 1, 3, 3); } else if (e.tipo === 'bau' && !e.aberto && d.explorado[i]) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(mx + e.x, my + e.y, 1, 1); } }
  ctx.fillStyle = Math.floor(tempo * 3) % 2 ? '#ffd23f' : '#fff'; ctx.fillRect(mx + P.x - 1, my + P.y - 1, 3, 3);
  const r = s.run; textoPixel(ctx, r.tipo === 'historia' ? `${D.cap.local}  ${r.andar}/${D.cap.andares}` : `CATACUMBAS  ANDAR ${r.andar}`, 4, 4, '#fff', '#14101c');
  textoPixel(ctx, `TOCHAS ${s.heroi.tochas}`, 4, 11, '#ffb52e', '#14101c');
}
function desenharBatalha() {
  const bt = G.bt; if (!bt) return; const B = bt.B, m = B.m; const dentro = bt.opc.origem === 'masmorra'; const tema = bt.filaBg;
  // fundo
  const pisoId = dentro ? 'piso_' + tema : (['porao', 'floresta', 'torre', 'pantano', 'trono', 'caverna', 'mina', 'abismo', 'cripta', 'cemiterio', 'afundada', 'forja'].includes(tema) ? 'piso_' + tema : 'grama');
  const parId = 'parede_' + tema; const paredeC = tileCanvas(parId), pisoC = tileCanvas(pisoId) || tileCanvas('grama');
  for (let y = 0; y < 6; y++) for (let x = 0; x < 15; x++) { if (paredeC) ctx.drawImage(paredeC, x * TS, y * TS); }
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, VW, 96);
  for (let y = 6; y < 11; y++) for (let x = 0; x < 15; x++) ctx.drawImage(pisoC, x * TS, y * TS);
  const g = ctx.createLinearGradient(0, 80, 0, VH); g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 80, VW, 96);
  // plataformas
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(168, 90, 42, 8, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(56, 140, 46, 9, 0, 0, 7); ctx.fill();
  // monstro
  const escala = m.chefe ? 5 : 4, sp = spriteMonstro(m.spr, m.pal || {}); const mw = 16 * escala; const bob = Math.sin(tempo * 2.5) * 1.5; const sx = bt.shakeM > 0 ? (Math.random() - 0.5) * 6 : 0;
  const morreu = B.fim === 'vitoria'; const alfa = morreu ? Math.max(0, 1 - (bt.hpM <= 0 ? 0.5 : 0)) : 1;
  ctx.save(); ctx.globalAlpha = morreu ? 0.35 : 1; ctx.translate(168 - mw / 2 + sx, 90 - mw + bob + 4);
  if (bt.flashM > 0) { const fc = flashCanvas(sp); ctx.drawImage(fc, 0, 0, mw, mw); } else ctx.drawImage(sp, 0, 0, mw, mw); ctx.restore();
  // herói (de costas)
  const s = St.S; const cls = s.heroi.cls; const hs = spriteHeroi(cls, s.heroi.capa, CLASSES[cls].cores).cima[Math.floor(tempo * 2) % 2]; const hx = bt.shakeH > 0 ? (Math.random() - 0.5) * 6 : 0; const hm = 16 * 5;
  ctx.save(); if (B.fim === 'derrota') ctx.globalAlpha = 0.4; ctx.translate(56 - hm / 2 + hx, 140 - hm + 6 + Math.sin(tempo * 2) * 1); if (bt.flashH > 0) ctx.drawImage(flashCanvas(hs, '#ff5c6c'), 0, 0, hm, hm); else ctx.drawImage(hs, 0, 0, hm, hm); ctx.restore();
  // números flutuantes
  for (const n of bt.nums) { ctx.save(); ctx.translate(n.x, n.y - n.t * 22); ctx.scale(n.g, n.g); ctx.globalAlpha = Math.min(1, 2.2 - n.t * 2); textoPixel(ctx, n.txt, 0, 0, n.cor, '#14101c', 'centro'); ctx.restore(); }
  if (B.chefe) textoPixel(ctx, 'CHEFE', 168, 4, '#ff5c6c', '#14101c', 'centro');
}
const fcCache = new WeakMap();
function flashCanvas(src, cor = '#ffffff') { const k = cor; let m = fcCache.get(src); if (!m) { m = {}; fcCache.set(src, m); } if (m[k]) return m[k]; const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = cor; x.fillRect(0, 0, c.width, c.height); m[k] = c; return c; }
