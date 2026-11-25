// Controlador da batalha tática: desenha unidades e áreas sobre o mapa real, trata toques, toca os eventos do motor com animação,
// abre o diálogo antes da luta (persuasão, intimidação, suborno, magia) e monta a barra de ações.
import * as T from './tatico.js';
import { ITENS, MAGIAS } from './srd.js';
import * as St from './store.js';
import * as Rn from './render.js';
import { texto, flash } from './gfx.js';
import * as Ef from './efeitos.js';
import { retrato } from './pessoa.js';
import { spriteMonstro } from './monstros.js';
import * as UI from './uibase.js';
import * as Au from './audio.js';

const TS = Rn.TS;
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const esc = UI.esc;
const COR_DANO = { fogo: '#ff8a30', gelo: '#9ae4ff', 'elétrico': '#ffee5a', 'ácido': '#9cff4a', veneno: '#8ad45a', 'necrótico': '#a35ad8', radiante: '#fff4b0', 'força': '#c89aff', 'psíquico': '#ff8ad8', trovão: '#c0d0ff', cura: '#7dffa0', arcano: '#c89aff', fis: '#ffffff' };
const corDe = (t) => COR_DANO[t] || '#c89aff';
export const Bt = { bt: null };
const NOMES_CONT = { folego: 'Fôlego', surto: 'Surto', furia: 'Fúria', ardil: 'Ardil', sorte: 'Sorte', recup: 'Recup.', canal: 'Canal', maos: 'Mãos' };
const dirDe = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'dir' : 'esq') : (dy > 0 ? 'baixo' : 'cima'));
const $ = (s) => document.querySelector(s);

// ---------- visual de cada unidade ----------
function criarV(u) { return { x: u.x, y: u.y, a: 1, fl: 0, flCor: '#fff', hp: u.hp, dir: u.heroi ? 'dir' : 'esq', pose: 'idle', lunge: null, mov: null, bob: Math.random() * 6, poseT: 0 }; }
function spriteUn(u) { return spriteMonstro(u.spr, u.pal || {}, u.mon || 'x', u.tags || [], u.ap || null); }
// token vista superior da unidade (herói e humanos por camadas; monstros pelo webp); null enquanto carrega
function visInimigo(u) { return { cls: (u.ca || 12) >= 15 ? 'guerreiro' : 'ladino', cat: (u.ca || 12) >= 15 ? 'media' : 'leve', capaC: '#4a3a2a', escudo: (u.ca || 12) >= 16, elmo: false }; }
function tokenUn(bt, u) {
  if (u.heroi) return Rn.tokenHeroiDe(bt.s);
  if (u.ap) return Rn.tokenPessoaDe(u.ap, visInimigo(u), (u.ca || 12) >= 15 ? 'espadaLonga' : 'adaga');
  return Rn.tokenMonstroDe(u);
}
function spriteH(bt, u) { const d = u.v.dir === 'dir' ? 'esq' : u.v.dir; return Rn.spriteHeroi(bt.s, d, u.v.pose === 'idle' && u.v.mov ? (Math.floor(u.v.mov.t * 3) % 2 ? 'andar1' : 'andar2') : u.v.pose); }
function retratoDe(u) {
  if (u.ap) return retrato(u.ap, { cls: 'ladino' }, 4);
  const tkm = !u.ap && Rn.tokenMonstroDe(u); if (tkm) { const c = document.createElement('canvas'); c.width = 96; c.height = 96; const x = c.getContext('2d'); x.fillStyle = 'rgba(20,16,28,.5)'; x.fillRect(0, 0, 96, 96); x.imageSmoothingQuality = 'high'; x.drawImage(tkm.t, 4, 4, 88, 88); return c; }
  const sp = spriteUn(u); const c = document.createElement('canvas'); c.width = 96; c.height = 96; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; const k = Math.min(88 / sp.width, 88 / sp.height); const w = Math.round(sp.width * k), h = Math.round(sp.height * k); x.fillStyle = 'rgba(20,16,28,.5)'; x.fillRect(0, 0, 96, 96); x.drawImage(sp, Math.round((96 - w) / 2), 96 - h - 4, w, h); return c;
}

// ---------- API: inicia e devolve uma promessa com o resultado ----------
export async function iniciar(o) {
  const { s, inimigos, grade, pos, aliados = [], surpresa = false, tema = 'porao', mw, mh } = o;
  const { B } = T.novaBatalha(s, inimigos, grade, { pos, aliados, surpresa, adiar: true });
  Ef.precarregar();
  const bt = { s, B, o, mw, mh, tema, t: 0, modo: 'normal', magia: null, item: null, sel: null, confirma: null, ocupado: true, rapido: false, auto: false, fim: false, esperas: [], fx: [], flut: [], baloes: [], log: [], menu: 'raiz', mov: null, foco: { x: pos.heroi.x, y: pos.heroi.y }, livre: false, ativoId: null, resolver: null, pan: null, aviso: '', moveu: false };
  Bt.bt = bt; window.__bt = bt;
  for (const u of B.un) u.v = criarV(u);
  Rn.VW.sujo = true; document.body.classList.add('em-batalha'); $('#bt').classList.remove('oculto'); ligarEntrada(bt); montarOrdem(bt); montarMenu(bt);
  const fim = new Promise((r) => { bt.resolver = r; });
  rodarInicio(bt).catch((e) => console.error(e));
  return fim;
}
async function rodarInicio(bt) {
  const B = bt.B; const hostis = B.un.filter((u) => u.eq === 'm');
  await esp(bt, 0.2);
  // frases de abertura
  const falantes = hostis.filter((u) => u.frase).sort((a, b) => cheb(a, B.h) - cheb(b, B.h)).slice(0, 3);
  if (B.surpresa) { log(bt, 'Você pegou o inimigo de surpresa!'); }
  const chefe = hostis.find((u) => u.chefe);
  if (chefe && chefe.frase) { bt.foco = { x: chefe.x, y: chefe.y }; await esp(bt, 0.4); await UI.dialogo(chefe.nome, [chefe.frase], { retrato: retratoDe(chefe) }); }
  else if (falantes.length) { for (const u of falantes.slice(0, 2)) { bt.baloes.push({ id: u.id, txt: u.frase, t: 0, dur: 2.5 }); bt.foco = { x: (B.h.x + u.x) / 2, y: (B.h.y + u.y) / 2 }; await esp(bt, 2.0); } }
  bt.baloes.length = 0; bt.foco = { x: B.h.x, y: B.h.y };
  // conversa antes da luta: o mais forte dos racionais fala por todos
  const lider = hostis.filter((u) => u.racional && u.vivo && !u.saiu).sort((a, b) => b.cr - a.cr)[0] || hostis.filter((u) => (u.tags || []).includes('fera') && u.vivo)[0];
  if (lider && !B.fim) { await parley(bt, lider, { livre: true }); }
  if (B.fim) return terminar(bt);
  const evs = T.comecarCombate(B); await tocar(bt, evs); if (B.fim) return terminar(bt); devolver(bt);
}
function devolver(bt) { bt.ocupado = false; bt.rapido = false; bt.modo = 'normal'; bt.magia = null; bt.item = null; bt.menu = 'raiz'; bt.confirma = null; bt.sel = null; if (bt.B.h.vivo) recalcMov(bt); montarMenu(bt); montarOrdem(bt); if (bt.auto && !bt.fim) setTimeout(() => autoTurno(bt), 250); }
export function fimBatalha() { const bt = Bt.bt; if (!bt) return; ligarEntrada(bt, true); document.body.classList.remove('em-batalha'); $('#bt').classList.add('oculto'); $('#bt-menu').innerHTML = ''; $('#bt-ordem').innerHTML = ''; Rn.VW.sujo = true; Bt.bt = null; window.__bt = null; }

// ---------- espera por tempo (afetada pelo modo rápido) ----------
function esp(bt, s) { return new Promise((r) => { bt.esperas.push({ t: s, r }); }); }
export function atualizar(dt) {
  const bt = Bt.bt; if (!bt) return; const k = bt.rapido ? 4 : 1; const d = dt * k; bt.t += dt;
  for (let i = bt.esperas.length - 1; i >= 0; i--) { const e = bt.esperas[i]; e.t -= d; if (e.t <= 0) { bt.esperas.splice(i, 1); e.r(); } }
  for (const u of bt.B.un) { const v = u.v; if (!v) continue; v.fl = Math.max(0, v.fl - dt); if (v.poseT > 0) { v.poseT -= d; if (v.poseT <= 0) v.pose = 'idle'; }
    if (v.mov) { const m = v.mov; m.t += d / m.dur; const q = Math.min(1, m.t); v.x = m.x0 + (m.x1 - m.x0) * q; v.y = m.y0 + (m.y1 - m.y0) * q; if (q >= 1) { v.x = m.x1; v.y = m.y1; const r = m.r; v.mov = null; r(); } }
    if (v.lunge) { v.lunge.t += d / v.lunge.dur; if (v.lunge.t >= 1) v.lunge = null; }
    if (v.sai) { v.a = Math.max(0, v.a - d * 2.2); if (v.a <= 0) v.sai = false; } }
  for (const f of bt.fx) f.t += d; bt.fx = bt.fx.filter((f) => f.t < f.dur);
  for (const f of bt.flut) f.t += d * 0.9; bt.flut = bt.flut.filter((f) => f.t < 1.15);
  for (const b of bt.baloes) b.t += dt; Rn.PART.passo(d);
  // câmera: segue o foco, a menos que o jogador esteja arrastando
  const ati = bt.B.un.find((u) => u.id === bt.ativoId);
  if (!bt.livre) { const alvo = ati && ati.v ? ati.v : bt.B.h.v; if (!bt.ocupado || !ati || ati.heroi) bt.foco = { x: bt.B.h.v.x, y: bt.B.h.v.y }; else bt.foco = { x: alvo.x, y: alvo.y }; }
}
export function teclaA() { const bt = Bt.bt; if (bt && (bt.ocupado || bt.fim)) { if (bt.fim) concluir(bt); else bt.rapido = true; } }
export function teclaB() { const bt = Bt.bt; if (bt && !bt.ocupado && !bt.fim) { bt.menu = 'raiz'; bt.modo = 'normal'; bt.magia = null; bt.prevArea = null; bt.confirma = null; bt.sel = null; montarMenu(bt); } }
export const camLivre = () => !!(Bt.bt && Bt.bt.livre);
export const camFoco = () => (Bt.bt ? Bt.bt.foco : null);

// ---------- log ----------
function log(bt, txt) { bt.log.push(txt); if (bt.log.length > 3) bt.log.shift(); const el = $('#bt-log'); if (el) el.innerHTML = bt.log.map((l, i) => `<div class="${i === bt.log.length - 1 ? 'novo' : ''}">${esc(l)}</div>`).join(''); }
function pip(on) { return `<b class="pip ${on ? 'on' : ''}"></b>`; }

// ---------- tocar eventos do motor ----------
async function tocar(bt, evs) {
  bt.ocupado = true; montarMenu(bt); const B = bt.B; const un = (id) => B.un.find((x) => x.id === id);
  for (const e of evs) {
    switch (e.t) {
      case 'ordem': montarOrdem(bt); break;
      case 'turno': { bt.ativoId = e.id; const u = un(e.id); if (u && u.heroi) { bt.livre = false; bt.foco = { x: u.v.x, y: u.v.y }; } montarOrdem(bt); if (u && !u.heroi) await esp(bt, 0.12); break; }
      case 'msg': { log(bt, e.txt); if (e.snd === 'spell') Au.sfx('spell'); else if (e.snd === 'heal') Au.sfx('heal'); else if (e.snd === 'flee') Au.sfx('flee'); if (e.snd === 'win') Au.sfx('win'); await esp(bt, e.snd ? 0.34 : 0.26); break; }
      case 'mov': { const u = un(e.id); if (!u) break; for (const [x, y] of e.caminho) { const v = u.v; v.dir = dirDe(x - v.x, y - v.y); await new Promise((r) => { v.mov = { x0: v.x, y0: v.y, x1: x, y1: y, t: 0, dur: u.heroi ? 0.11 : 0.13, r }; }); if (u.heroi) Au.sfx('passo'); } break; }
      case 'atq': { const u = un(e.de), alvo = un(e.para); if (!u || !alvo) break; u.v.dir = dirDe(alvo.v.x - u.v.x, alvo.v.y - u.v.y); const dx = Math.sign(alvo.v.x - u.v.x), dy = Math.sign(alvo.v.y - u.v.y);
        if (e.tipo === 'melee') { u.v.lunge = { dx, dy, t: 0, dur: 0.2 }; u.v.pose = 'atq'; u.v.poseT = 0.25; await esp(bt, 0.13); }
        else { u.v.pose = u.heroi && e.tipo === 'magia' ? 'cast' : 'atq'; u.v.poseT = 0.3; const cor = e.tipo === 'magia' ? corDe(e.dano) : '#e8e0c0'; Ef.feixe(bt, e.tipo === 'magia' ? Ef.feixeDe(e.dano) : 'feixe_flecha', u.v.x, u.v.y, alvo.v.x, alvo.v.y, e.tipo === 'magia' ? 0.4 : 0.3); await proj(bt, u.v, alvo.v, e.tipo === 'magia' ? 'rgba(0,0,0,0)' : cor, e.tipo === 'magia' ? 0.34 : 0.26); }
        break; }
      case 'dano': { const u = un(e.id); if (!u) break; const v = u.v; v.hp = Math.max(0, v.hp - e.n); v.fl = 0.22; v.flCor = u.heroi ? '#ff5c6c' : '#ffffff'; v.tremor = 0.2;
        Rn.flutuar(bt.flut, v.x, v.y - 0.6, String(e.n), e.crit ? '#ffd23f' : u.heroi ? '#ff7a8a' : '#ffffff', e.crit ? 12 : 9);
        Rn.PART.emitir(v.x * TS + 16, v.y * TS + 10, e.crit ? 14 : 7, { cor: [corDe(e.tipo), '#fff'], vel: 46, vida: 0.45, g: 90, tam: 2 }); if (!(bt.semHit > bt.t)) { const fonte = e.de ? un(e.de) : null; const fxId = Ef.pontoDe(e.tipo) || Ef.golpeFisico(e.tipo, fonte && fonte.arma, fonte && fonte.heroi); Ef.ponto(bt, fxId, v.x, v.y, { tiles: fxId === 'corte' || fxId === 'garra' ? 2.2 : 1.8, dur: 0.6 }); } Au.sfx(u.heroi ? 'hurt' : e.crit ? 'crit' : 'hit'); if (u.heroi) Au.vibrar(40); montarOrdem(bt); await esp(bt, 0.24); break; }
      case 'erro': { const u = un(e.id); if (!u) break; Rn.flutuar(bt.flut, u.v.x, u.v.y - 0.5, 'ERROU', '#c8c8d8', 8); Au.sfx('miss'); await esp(bt, 0.16); break; }
      case 'cura': { const u = un(e.id); if (!u) break; u.v.hp = Math.min(u.hpMax, u.v.hp + e.n); Rn.flutuar(bt.flut, u.v.x, u.v.y - 0.6, '+' + e.n, '#7dffa0', 9); Ef.ponto(bt, 'cura', u.v.x, u.v.y, { tiles: 2.4, dur: 0.9 }); Rn.PART.emitir(u.v.x * TS + 16, u.v.y * TS + 20, 10, { cor: ['#7dffa0', '#e8fff0'], vel: 24, vida: 0.7, sobe: 40, tam: 2 }); await esp(bt, 0.26); break; }
      case 'aoe': { const u = un(e.de); const cor = corDe(e.dano); if (u) { u.v.pose = 'cast'; u.v.poseT = 0.5; u.v.dir = dirDe(e.tx - u.v.x, e.ty - u.v.y); } bt.fx.push({ tipo: 'aoe', tiles: e.tiles, cor, t: 0, dur: 0.7, cx: e.tx, cy: e.ty, forma: e.forma }); Au.sfx('spell'); bt.semHit = bt.t + 1.4;
        { const xs = e.tiles.map((q) => q[0]), ys = e.tiles.map((q) => q[1]); const lado = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + 1.6; const id = e.dano === 'fogo' ? 'bola_fogo' : Ef.pontoDe(e.dano) === 'fogo' ? 'bola_fogo' : e.dano === 'cura' ? 'cura' : (Ef.pontoDe(e.dano) || 'forca'); Ef.ponto(bt, id, (Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, { tiles: Math.max(2.2, lado), dur: 1.0 }); }
        for (const [x, y] of e.tiles) Rn.PART.emitir(x * TS + 16, y * TS + 16, 3, { cor: [cor, '#fff'], vel: 34, vida: 0.55, sobe: 30, tam: 2 }); await esp(bt, 0.5); break; }
      case 'morte': { const u = un(e.id); if (!u) break; const v = u.v; v.sai = true; Rn.PART.emitir(v.x * TS + 16, v.y * TS + 18, 16, { cor: ['#fff', '#b8a8d8', u.heroi ? '#ff5c6c' : '#ffd23f'], vel: 50, vida: 0.7, sobe: 30, tam: 2 }); montarOrdem(bt); await esp(bt, 0.45); break; }
      case 'sai': { const u = un(e.id); if (!u) break; u.v.sai = true; Rn.flutuar(bt.flut, u.v.x, u.v.y - 0.6, e.como === 'fugiu' ? 'FUGIU!' : e.como === 'rendeu' ? 'RENDEU-SE' : e.como === 'subornado' ? 'FOI EMBORA' : 'SAIU', '#ffd23f', 8); montarOrdem(bt); await esp(bt, 0.4); break; }
      case 'conv': { const u = un(e.id); if (!u) break; Rn.flutuar(bt.flut, u.v.x, u.v.y - 0.8, '♥ ALIADO', '#ff8ad8', 9); Rn.PART.emitir(u.v.x * TS + 16, u.v.y * TS + 6, 14, { cor: ['#ff8ad8', '#ffd0ec'], vel: 22, vida: 0.9, sobe: 40, tam: 2 }); Au.sfx('heal'); montarOrdem(bt); await esp(bt, 0.5); break; }
      case 'cond': { const u = un(e.id); if (u && e.on) Rn.PART.emitir(u.v.x * TS + 16, u.v.y * TS + 6, 8, { cor: ['#fff', '#c89aff'], vel: 20, vida: 0.6, sobe: 30, tam: 2 }); break; }
      case 'teste': { const u = un(e.alvo); if (u) Rn.flutuar(bt.flut, u.v.x, u.v.y - 1.0, `d20 ${e.rolagem} → ${e.total} / CD ${e.dc} ${e.ok ? '✔' : '✘'}`, e.ok ? '#7dffa0' : '#ff7a8a', 8); Au.sfx('rolar'); await esp(bt, 0.7); break; }
      case 'fimcombate': break;
      default: break;
    }
    if (B.fim && e.t === 'fimcombate') break;
  }
  for (const u of B.un) { if (u.v) u.v.hp = Math.max(0, u.hp); }
  salvar(bt);
}
function salvar(bt) { try { St.salvarBatalha(bt.B); } catch (e) { /* ignorado */ } }
function proj(bt, a, b, cor, dur) {
  bt.fx.push({ tipo: 'proj', x0: a.x, y0: a.y, x1: b.x, y1: b.y, cor, t: 0, dur });
  return esp(bt, dur).then(() => { Rn.PART.emitir(b.x * TS + 16, b.y * TS + 14, 6, { cor: [cor, '#fff'], vel: 40, vida: 0.35, tam: 2 }); });
}

// ---------- comandos do jogador ----------
async function comando(bt, cmd) {
  if (bt.ocupado || bt.fim) return; const B = bt.B; const evs = T.agir(B, cmd); if (!evs.length) { UI.toast('Ação indisponível.'); return; }
  bt.modo = 'normal'; bt.magia = null; bt.item = null; bt.menu = 'raiz'; bt.confirma = null; bt.sel = null; await depois(bt, evs);
}
async function depois(bt, evs) {
  await tocar(bt, evs); if (bt.B.fim) return terminar(bt); devolver(bt);
}
async function fimTurno(bt) { if (bt.ocupado || bt.fim) return; bt.ocupado = true; bt.modo = 'normal'; bt.confirma = null; bt.sel = null; montarMenu(bt); const evs = T.fimTurno(bt.B); await depois(bt, evs); }
async function autoTurno(bt) {
  if (bt.ocupado || bt.fim || !bt.auto) return; bt.ocupado = true; montarMenu(bt); const evs = T.turnoAutoHeroi(bt.B, []);
  await tocar(bt, evs); if (bt.B.fim) return terminar(bt); if (!bt.auto) return devolver(bt);
  const ev2 = T.fimTurno(bt.B); await tocar(bt, ev2); if (bt.B.fim) return terminar(bt); devolver(bt);
}
async function mover(bt, x, y) {
  if (bt.ocupado || bt.fim) return; const evs = T.moverHeroi(bt.B, x, y); if (!evs.length) return; bt.confirma = null; bt.sel = null; bt.moveu = true; await depois(bt, evs);
}
async function atacarEm(bt, alvo, extra = {}) {
  if (bt.ocupado || bt.fim) return; const B = bt.B, H = B.h; const alc = T.alcanceArma(H); const evs = [];
  const noAlcance = () => cheb(H, alvo) <= alc && (alc <= 1 || T.temLOS(B, H, alvo));
  if (!noAlcance()) { if (H.movRest <= 0) { UI.toast('Fora de alcance. Sem movimento restante.'); return; } evs.push(...T.aproximar(B, H, alvo, alc)); if (B.fim) return depois(bt, evs); }
  if (noAlcance() && H.acoes > 0 && H.vivo) evs.push(...T.agir(B, { id: extra.id || 'atacar', alvo: alvo.id }));
  else if (!evs.length) { UI.toast(H.acoes <= 0 ? 'Sem ação restante.' : 'Não alcança esse alvo.'); return; }
  bt.modo = 'normal'; bt.confirma = null; bt.sel = null; bt.menu = 'raiz'; await depois(bt, evs);
}
function recalcMov(bt) { const H = bt.B.h; bt.mov = H.vivo && T.ativo(bt.B) === H ? T.tilesDeMov(bt.B, H) : null; }

// ---------- conversa (antes e durante a luta) ----------
const fmtMod = (n) => (n >= 0 ? '+' : '') + n;
async function parley(bt, alvo, { livre }) {
  const B = bt.B, H = B.h; let fala = alvo.frase || '...'; let rodadas = 0; const ret = retratoDe(alvo);
  while (rodadas++ < 6) {
    if (!alvo.vivo || alvo.saiu || alvo.eq !== 'm' || B.fim) return;
    bt.foco = { x: (H.x + alvo.x) / 2, y: (H.y + alvo.y) / 2 };
    const ops = T.opcoesConversa(B, alvo); const opcoes = [];
    for (const o of ops) { const sub = o.id === 'subornar' ? (o.dc >= 99 ? 'Ele não se vende' : `Pagar ${o.custo} PO (você tem ${B.s.heroi.ouro})`) : `${o.desc} · ${fmtMod(o.mod)} vs CD ${o.dc}`; opcoes.push({ id: o.id, rot: ({ persuadir: '🗣️ Persuadir', intimidar: '😠 Intimidar', subornar: '🪙 Subornar', domar: '🐾 Domar' })[o.id] || o.rot, sub, off: o.id === 'subornar' && (o.dc >= 99 || B.s.heroi.ouro < o.custo) }); }
    const alc = 6; for (const m of T.magiasDoHeroi(B)) { if (!['encanto', 'acalmar', 'medo'].includes(m.tipo) || !m.circulos.length) continue; const perto = cheb(H, alvo) <= alc + 1; opcoes.push({ id: 'mg:' + m.id, rot: `✨ ${m.nome} (${m.circulos[0]}º)`, sub: perto ? (m.desc || '') : 'Muito longe', off: !perto || (!livre && H.acoes <= 0) }); }
    opcoes.push({ id: 'lutar', rot: '⚔️ Lutar!', sub: livre ? 'Encerrar a conversa' : 'Voltar ao combate' });
    const ex = await UI.dialogoEscolha({ nome: alvo.nome + (alvo.tmp && alvo.racional ? ` · ${(({ agressivo: 'agressivo', covarde: 'covarde', honrado: 'honrado', ganancioso: 'ganancioso', fanatico: 'fanático', zombeteiro: 'zombeteiro', arrogante: 'arrogante', frio: 'frio', bestial: 'bestial' })[alvo.tmp]) || ''}` : ''), retrato: ret, texto: fala, opcoes });
    if (ex === 'lutar') return;
    let evs = []; let res = 'nada';
    if (ex.startsWith('mg:')) { const id = ex.slice(3); const m = T.magiasDoHeroi(B).find((q) => q.id === id); const nv = m.circulos[0]; if (livre) T.conjurar(B, H, id, nv, alvo.x, alvo.y, evs); else evs = T.agir(B, { id: 'magia', magia: id, nv, x: alvo.x, y: alvo.y }); res = alvo.eq !== 'm' || alvo.saiu ? 'ok' : alvo.conds.amedrontado ? 'medo' : 'falhou'; }
    else { const r = T.conversar(B, alvo, ex, { livre }); evs = r.evs; res = r.res; }
    bt.ocupado = true; await tocar(bt, evs); bt.ocupado = livre ? true : false;
    if (B.fim || !alvo.vivo || alvo.saiu || alvo.eq !== 'm') return;
    const linha = evs.filter((e) => e.t === 'msg' && e.txt.startsWith(alvo.nome + ': "')).pop(); fala = linha ? linha.txt.slice(alvo.nome.length + 2).replace(/^"|"$/g, '') : (res === 'abalado' ? '...' : fala);
    if (res === 'abalado' || alvo.paciencia <= 0) { if (alvo.paciencia <= 0) log(bt, `${alvo.nome} perdeu a paciência!`); return; }
    if (!livre) return; // em combate cada tentativa gasta a ação
  }
}

// ---------- fim ----------
async function terminar(bt) {
  if (bt.fim) return; bt.fim = true; bt.ocupado = true; const B = bt.B; salvar(bt); bt.aviso = bt.o.premiar ? await bt.o.premiar(B) : ''; montarMenu(bt);
  if (B.fim === 'vitoria') { Au.sfx('win'); bt.banner = { txt: 'VITÓRIA!', cor: '#ffd23f' }; } else if (B.fim === 'derrota') { Au.sfx('lose'); bt.banner = { txt: 'DERROTA...', cor: '#ff5c6c' }; } else bt.banner = { txt: 'VOCÊ ESCAPOU', cor: '#9ae4ff' };
}
function concluir(bt) { const r = { B: bt.B, fim: bt.B.fim, baixas: bt.B.baixas, aliados: bt.B.un.filter((u) => u.eq === 'j' && !u.heroi && u.vivo) }; const res = bt.resolver; fimBatalha(); res(r); }

// ======================= desenho =======================
export function desenharAntes(ctx) {
  const bt = Bt.bt; if (!bt || bt.fim) return; const B = bt.B, H = B.h; const p = Math.sin(bt.t * 6) * 0.5; const meu = !bt.ocupado && T.ativo(B) === H;
  const vis = (x, y) => !bt.o.visivel || bt.o.visivel(x, y);
  if (meu && bt.modo === 'normal' && bt.mov) for (const t of bt.mov.tiles) if (vis(t.x, t.y)) Rn.tileRect(ctx, t.x, t.y, 'rgba(90,170,255,0.20)', null);
  if (meu && bt.modo === 'normal' && bt.confirma && bt.confirma.tipo === 'mov') { for (const [x, y] of bt.confirma.caminho) Rn.tileRect(ctx, x, y, 'rgba(255,230,90,0.38)', null); const d = bt.confirma.caminho[bt.confirma.caminho.length - 1]; Rn.tileRect(ctx, d[0], d[1], 'rgba(255,230,90,0.25)', '#ffe55a', p); }
  if (meu && bt.modo === 'atacar') { const alc = T.alcanceArma(H); for (const e of T.inimigosDe(B, H)) if (vis(e.x, e.y) && cheb(e, H) <= alc && (alc <= 1 || T.temLOS(B, H, e))) Rn.tileRect(ctx, e.x, e.y, 'rgba(255,60,60,0.35)', '#ff5c6c', p); }
  if (meu && (bt.modo === 'magia' || bt.modo === 'item' || bt.modo === 'falar') && bt.miras) { for (const m of bt.miras) Rn.tileRect(ctx, m.x, m.y, 'rgba(255,220,120,0.16)', null); }
  if (bt.prevArea) { const cor = bt.prevArea.cura ? '124,255,160' : '255,110,60'; for (const [x, y] of bt.prevArea.tiles) Rn.tileRect(ctx, x, y, `rgba(${cor},0.38)`, `rgba(${cor},0.95)`, 0); for (const u of bt.prevArea.unidades) Rn.tileRect(ctx, u.x, u.y, 'rgba(0,0,0,0)', u.eq === H.eq ? '#ff8ad8' : '#ffffff', p); }
  if (bt.sel && bt.sel.vivo) Rn.tileRect(ctx, bt.sel.x, bt.sel.y, 'rgba(255,255,255,0.12)', '#ffffff', p);
  // anel do turno ativo
  const ati = B.un.find((u) => u.id === bt.ativoId); if (ati && ati.v && ati.vivo && !bt.fim) { const px = Math.round(ati.v.x * TS + 16 - Rn.cam.x), py = Math.round(ati.v.y * TS + 28 - Rn.cam.y); ctx.strokeStyle = ati.heroi ? '#6ad8ff' : ati.eq === 'j' ? '#7dffa0' : '#ff6a6a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(px, py, 13 + p, 6 + p / 2, 0, 0, 6.283); ctx.stroke(); }
}
export function itens() {
  const bt = Bt.bt; if (!bt) return []; const out = []; const vis = (x, y) => !bt.o.visivel || bt.o.visivel(Math.round(x), Math.round(y));
  for (const u of bt.B.un) { const v = u.v; if (!v || v.a <= 0.01) continue; if (!u.heroi && !vis(v.x, v.y)) continue; out.push({ y: (v.y + 1) * TS + (u.heroi ? 0.2 : 0), d: (ctx) => desenharUn(ctx, bt, u) }); }
  return out;
}
function desenharUn(ctx, bt, u) {
  const v = u.v; const bob = Math.sin(bt.t * 2.6 + v.bob) * 0.8; let ox = 0, oy = 0; if (v.lunge) { const k = Math.sin(v.lunge.t * Math.PI) * 6; ox = v.lunge.dx * k; oy = v.lunge.dy * k; } if (v.tremor > 0) { v.tremor -= 0.016; ox += (Math.random() - 0.5) * 3; }
  const tk = tokenUn(bt, u); if (!tk) Rn.sombraTile(ctx, v.x + ox / TS, v.y + oy / TS, u.chefe ? 15 : 10, u.chefe ? 5 : 4, 0.3 * v.a);
  const eqC = u.eq === 'j' ? 'rgba(106,216,255,0.9)' : 'rgba(255,90,90,0.55)'; void eqC;
  if (tk) { const f = v.fl > 0 ? flash(tk.t, v.flCor) : null; Rn.tokenEm(ctx, tk, v.x, v.y, v.dir, v, { alfa: v.a, flash: f, dx: ox, dy: oy }); }
  else if (u.heroi) { const spr = spriteH(bt, u); const f = v.fl > 0 ? flash(spr, v.flCor) : null; Rn.pessoaEm(ctx, spr, v.x, v.y + (v.mov ? 0 : bob / TS), v.dir, { alfa: v.a, flash: f, dx: ox, dy: oy }); }
  else { const spr = spriteUn(u); const f = v.fl > 0 ? flash(spr, v.flCor) : null; Rn.monstroEm(ctx, spr, v.x, v.y + bob / TS, { alfa: v.a, flash: f, dx: ox, dy: oy, espelha: v.dir === 'dir' }); }
  const h = tk ? 0 : u.heroi ? 44 : spriteUn(u).height; const frac = v.hp / (u.hpMax - (u.hpMaxMod || 0) || 1);
  if (v.a > 0.5) { Rn.barraHp(ctx, v.x, v.y, frac, { y: tk ? 16 - tk.px / 2 - 6 : u.heroi ? -15 : 33 - h - 6, largura: u.chefe ? 30 : 22, cor: u.eq === 'j' ? (frac > 0.3 ? '#6ad8ff' : '#ff5c6c') : null });
    const tags = []; const c = u.conds || {}; if (c.dormindo) tags.push(['Zz', '#8ab0ff']); if (c.amedrontado > 0) tags.push(['medo', '#c89aff']); if (c.pacificado > 0) tags.push(['calmo', '#7dffa0']); if (c.lento) tags.push(['lento', '#9ae4ff']); if (c.irritado) tags.push(['ira', '#ff7a5a']); if (c.furia) tags.push(['FÚRIA', '#ff7a5a']); if (c.dominado) tags.push(['♥', '#ff8ad8']);
    tags.slice(0, 2).forEach(([t, cor], i) => texto(ctx, t, Math.round(v.x * TS + 16 - Rn.cam.x), Math.round(v.y * TS - Rn.cam.y + (tk ? 16 - tk.px / 2 - 13 : u.heroi ? -22 : 33 - h - 13) - i * 7), { cor, tam: 6 })); }
}
export function desenharDepois(ctx) {
  const bt = Bt.bt; if (!bt) return;
  for (const f of bt.fx) {
    const k = f.t / f.dur;
    if (f.tipo === 'spr') { Ef.desenhar(ctx, f, Rn.cam, TS); continue; }
    if (f.tipo === 'aoe') { for (const [x, y] of f.tiles) { const px = x * TS - Rn.cam.x, py = y * TS - Rn.cam.y; ctx.globalAlpha = Math.max(0, (1 - k) * 0.32); ctx.fillStyle = f.cor; ctx.fillRect(px + 1, py + 1, TS - 2, TS - 2); ctx.globalAlpha = Math.max(0, (1 - k)); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(px + 1.5, py + 1.5, TS - 3, TS - 3); } ctx.globalAlpha = 1; }
    else if (f.tipo === 'proj') { const x = (f.x0 + (f.x1 - f.x0) * k) * TS + 16 - Rn.cam.x, y = (f.y0 + (f.y1 - f.y0) * k) * TS + 14 - Rn.cam.y - Math.sin(k * Math.PI) * 6; ctx.fillStyle = f.cor; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4); ctx.globalAlpha = 0.5; ctx.fillRect(Math.round(x - (f.x1 - f.x0) * 3) - 1, Math.round(y - (f.y1 - f.y0) * 3) - 1, 3, 3); ctx.globalAlpha = 1; }
  }
  Rn.PART.desenhar(ctx, Rn.cam.x, Rn.cam.y); Rn.desenharFlutuantes(ctx, bt.flut);
  for (const b of bt.baloes) { const u = bt.B.un.find((x) => x.id === b.id); if (u && u.vivo && u.v && b.t < b.dur) { ctx.globalAlpha = Math.min(1, (b.dur - b.t) * 2); Rn.balao(ctx, u.v.x, u.v.y - (spriteUn(u).height - 30) / TS, b.txt, { max: 20 }); ctx.globalAlpha = 1; } }
  if (bt.banner) { texto(ctx, bt.banner.txt, Rn.VW.w / 2, Rn.VW.h / 2 - 20, { cor: bt.banner.cor, tam: 20, borda: '#14101c' }); }
}

// ======================= entrada (toque) =======================
function ligarEntrada(bt, remover = false) {
  const c = Rn.VW.canvas; if (remover) { if (bt.h) { c.removeEventListener('pointerdown', bt.h.d); c.removeEventListener('pointermove', bt.h.m); c.removeEventListener('pointerup', bt.h.u); c.removeEventListener('pointercancel', bt.h.u); } return; }
  const d = (e) => { bt.pan = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, mov: false, id: e.pointerId }; try { c.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } };
  const m = (e) => { const p = bt.pan; if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; if (!p.mov && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 10) { p.mov = true; bt.livre = true; } if (p.mov) { const r = c.getBoundingClientRect(); Rn.cam.x = Math.round(Rn.cam.x - dx * Rn.VW.w / r.width); Rn.cam.y = Math.round(Rn.cam.y - dy * Rn.VW.h / r.height); Rn.cam.x = Math.max(0, Math.min(Math.max(0, bt.mw * TS - Rn.VW.w), Rn.cam.x)); Rn.cam.y = Math.max(0, Math.min(Math.max(0, bt.mh * TS - Rn.VW.h), Rn.cam.y)); p.x = e.clientX; p.y = e.clientY; } };
  const u = (e) => { const p = bt.pan; bt.pan = null; if (!p || p.mov || e.type === 'pointercancel') return; toque(bt, e.clientX, e.clientY); };
  bt.h = { d, m, u }; c.addEventListener('pointerdown', d); c.addEventListener('pointermove', m); c.addEventListener('pointerup', u); c.addEventListener('pointercancel', u);
}
function toque(bt, cx, cy) {
  if (bt.fim) return; if (bt.ocupado) { bt.rapido = true; return; }
  const B = bt.B, H = B.h; if (T.ativo(B) !== H) return; const { x, y } = Rn.telaParaTile(cx, cy); const vis = (px, py) => !bt.o.visivel || bt.o.visivel(px, py);
  const u = vis(x, y) ? T.unidadeEm(B, x, y) : null; Au.destravar();
  if (bt.modo === 'atacar') { if (u && u.eq === 'm') return atacarEm(bt, u, { id: bt.smite || 'atacar' }); bt.modo = 'normal'; bt.smite = null; montarMenu(bt); return; }
  if (bt.modo === 'falar') { if (u && u.eq === 'm' && (u.racional || (u.tags || []).includes('fera')) && cheb(H, u) <= 6) { bt.modo = 'normal'; bt.ocupado = true; montarMenu(bt); parley(bt, u, { livre: false }).then(() => { if (B.fim) return terminar(bt); devolver(bt); }); return; } if (u && u.eq === 'm') { UI.toast(u.racional ? 'Chegue mais perto (até 6 casas).' : 'Esse inimigo não quer conversa.'); return; } bt.modo = 'normal'; montarMenu(bt); return; }
  if (bt.modo === 'magia') return toqueMagia(bt, x, y, u);
  if (bt.modo === 'item') { if (u && cheb(H, u) <= 6) { const idx = bt.item; bt.modo = 'normal'; return comando(bt, { id: 'item', idx, alvo: u.id }); } bt.modo = 'normal'; montarMenu(bt); return; }
  // modo normal
  if (u && u !== H) {
    if (u.eq === 'm') { if (bt.confirma && bt.confirma.tipo === 'atq' && bt.confirma.id === u.id) return atacarEm(bt, u); bt.sel = u; bt.confirma = { tipo: 'atq', id: u.id }; bt.prevArea = null; montarMenu(bt); return; }
    bt.sel = u; bt.confirma = null; montarMenu(bt); return;
  }
  if (bt.mov) { const t = bt.mov.tiles.find((q) => q.x === x && q.y === y); if (t && !u) { if (bt.confirma && bt.confirma.tipo === 'mov' && bt.confirma.x === x && bt.confirma.y === y) return mover(bt, x, y); const cam = T.caminhoAte(bt.mov.R, H, x, y); if (cam) { bt.confirma = { tipo: 'mov', x, y, caminho: cam }; bt.sel = null; montarMenu(bt); } return; } }
  bt.confirma = null; bt.sel = null; montarMenu(bt);
}
function toqueMagia(bt, x, y, u) {
  const B = bt.B, H = B.h; const m = bt.magia; if (!m) return; const ok = bt.miras.some((q) => q.x === x && q.y === y);
  if (!ok) { bt.prevArea = null; bt.confirma = null; bt.modo = 'normal'; bt.magia = null; montarMenu(bt); return; }
  if (bt.confirma && bt.confirma.tipo === 'mg' && bt.confirma.x === x && bt.confirma.y === y) { const cmd = m.id === 'sopro' ? { id: 'sopro', x, y } : { id: 'magia', magia: m.id, nv: m.nv, x, y }; bt.prevArea = null; return comando(bt, cmd); }
  bt.confirma = { tipo: 'mg', x, y }; const a = m.id === 'sopro' ? { tiles: coneTiles(B, H, x, y, 3), unidades: [], geo: { f: 'cone' } } : T.areaMagia(B, H, m.id, x, y); bt.prevArea = { tiles: a.tiles, unidades: a.unidades, cura: MAGIAS[m.id] && MAGIAS[m.id].tipo === 'cura' }; void u; montarMenu(bt);
}
function coneTiles(B, u, tx, ty, len) { return T.areaMagia(B, u, 'maos_flam', tx, ty).tiles.filter(([x, y]) => Math.max(Math.abs(x - u.x), Math.abs(y - u.y)) <= len); }

// ======================= DOM: ordem e menu =======================
function montarOrdem(bt) {
  const el = $('#bt-ordem'); if (!el) return; const B = bt.B; const n = B.ordem.length; let h = '';
  for (let k = 0; k < n; k++) { const id = B.ordem[(B.i + k) % n]; const u = B.un.find((q) => q.id === id); if (!u || !u.vivo || u.saiu) continue; const cls = u.heroi ? 'her' : u.eq === 'j' ? 'ali' : 'ini'; const tag = u.heroi ? '★' : (u.nome || '?').replace(/^(Guardião|Capitão|Mestre)\s*/i, '').slice(0, 2).toUpperCase(); h += `<span class="ord ${cls} ${u.id === bt.ativoId ? 'at' : ''}" title="${esc(u.nome)}">${esc(tag)}<i style="width:${Math.max(0, Math.min(100, (u.hp / u.hpMax) * 100))}%"></i></span>`; }
  el.innerHTML = `<span class="rod">R${B.rodada}</span>${h}<button class="ord-centro" data-bt="centro" aria-label="Centralizar">⌖</button>`;
}
function recursosTxt(H) {
  const p = []; H.slots.forEach((v, i) => { const mx = (St.S.recursosMax.slots[i] || 0); if (mx > 0) p.push(`${i + 1}º:${v}`); });
  for (const [k, v] of Object.entries(H.cont)) if (NOMES_CONT[k] && v > 0) p.push(`${NOMES_CONT[k]}:${v >= 99 ? '∞' : v}`);
  if (H.exaust) p.push(`Exaustão ${H.exaust}`); if (H.insp) p.push(`Insp.${H.insp}`); return p.join(' · ');
}
function botao(rot, sub, fn, { off = false, cls = '' } = {}) { const b = document.createElement('button'); b.className = 'bt-btn ' + cls; b.disabled = !!off; b.innerHTML = `<span>${esc(rot)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}`; b.addEventListener('click', () => { Au.destravar(); Au.sfx('select'); fn(); }); return b; }
function infoSel(bt) {
  const u = bt.sel; if (!u) return ''; const fr = Math.max(0, Math.min(100, (u.hp / u.hpMax) * 100)); const conf = bt.confirma && bt.confirma.tipo === 'atq' && bt.confirma.id === u.id;
  const T2 = u.tmp && u.racional ? ` · ${esc(u.tmp)}` : ''; return `<div class="bt-info"><b>${esc(u.nome)}</b> <span class="suave">ND ${u.cr < 1 ? (u.cr === 0.125 ? '1/8' : u.cr === 0.25 ? '1/4' : '1/2') : u.cr} · CA ${u.ca}${T2}</span><div class="bt-barra"><i style="width:${fr}%;background:${fr > 50 ? '#6fcf7f' : fr > 22 ? '#e6d35a' : '#ff5c6c'}"></i></div><small>${Math.ceil(u.hp)}/${u.hpMax} PV${conf ? ' — toque de novo para atacar' : ''}</small></div>`;
}
function montarMenu(bt) {
  const menu = $('#bt-menu'); if (!menu) return; menu.innerHTML = ''; const B = bt.B, H = B.h;
  if (bt.fim) { const b = botao(B.fim === 'vitoria' ? 'Continuar' : B.fim === 'derrota' ? 'Voltar à vila' : 'Continuar', bt.aviso || '', () => concluir(bt), { cls: 'bt-larga bt-ok' }); menu.append(b); return; }
  if (bt.ocupado) { menu.append(botao('…', 'toque na tela para acelerar', () => { bt.rapido = true; }, { cls: 'bt-larga' })); return; }
  const status = document.createElement('div'); status.className = 'bt-status'; status.innerHTML = `<span><b>${esc(H.nome)}</b> PV ${Math.ceil(H.hp)}/${H.hpMax} · CA ${H.ca}</span><span class="pips">Ação ${pip(H.acoes > 0)} Bônus ${pip(H.bonus > 0)} Mov ${H.movRest}</span><small>${esc(recursosTxt(H))}</small>`; menu.append(status);
  if (bt.sel && bt.modo === 'normal') { const d = document.createElement('div'); d.className = 'bt-infobox'; d.innerHTML = infoSel(bt); menu.append(d); }
  if (bt.menu === 'raiz') {
    const mags = T.magiasDoHeroi(B).filter((m) => (m.nv === 0 || m.circulos.length)); const itens = B.inv.map((x, i) => ({ x, i })).filter(({ x }) => x.n > 0 && ITENS[x.id] && ITENS[x.id].tipo === 'consumivel');
    const dica = { normal: bt.confirma ? 'Toque de novo no mesmo ponto para confirmar.' : 'Toque no mapa: azul = onde você pode ir; toque num inimigo para atacar.', atacar: 'Toque num inimigo destacado em vermelho.', magia: 'Toque no alvo; toque de novo para lançar.', falar: 'Toque num inimigo para conversar.', item: 'Toque no alvo do item.' }[bt.modo]; const dd = document.createElement('div'); dd.className = 'bt-dica'; dd.textContent = dica; menu.append(dd);
    const g = document.createElement('div'); g.className = 'bt-grade'; menu.append(g);
    g.append(botao('Atacar', `${H.arma.nome}${H.ataques > 1 ? ' ×' + H.ataques : ''}`, () => { bt.modo = bt.modo === 'atacar' ? 'normal' : 'atacar'; bt.smite = null; bt.sel = null; bt.confirma = null; montarMenu(bt); }, { off: H.acoes <= 0, cls: bt.modo === 'atacar' ? 'sel' : '' }));
    g.append(botao('Magia', mags.length ? `${mags.length}` : '—', () => { bt.menu = 'magia'; montarMenu(bt); }, { off: !mags.length }));
    g.append(botao('Habil.', 'classe', () => { bt.menu = 'hab'; montarMenu(bt); }));
    g.append(botao('Itens', itens.length ? `${itens.length}` : '—', () => { bt.menu = 'item'; montarMenu(bt); }, { off: !itens.length || H.acoes <= 0 }));
    g.append(botao('Falar', 'persuadir', () => { bt.modo = bt.modo === 'falar' ? 'normal' : 'falar'; bt.miras = []; bt.confirma = null; montarMenu(bt); }, { off: H.acoes <= 0 || !T.inimigosDe(B, H).some((e) => e.racional || (e.tags || []).includes('fera')), cls: bt.modo === 'falar' ? 'sel' : '' }));
    g.append(botao(bt.auto ? 'Auto: ON' : 'Auto', 'ação sugerida', () => { bt.auto = !bt.auto; if (bt.auto) autoTurno(bt); else montarMenu(bt); }, { cls: 'bt-auto' }));
    g.append(botao('Fim do turno ▶', `Mov ${H.movRest}`, () => fimTurno(bt), { cls: 'bt-fim' }));
    return;
  }
  menu.append(botao('‹ Voltar', '', () => { bt.menu = 'raiz'; bt.modo = 'normal'; bt.magia = null; bt.prevArea = null; bt.confirma = null; montarMenu(bt); }, { cls: 'bt-voltar' }));
  const lista = document.createElement('div'); lista.className = 'bt-lista'; menu.append(lista);
  if (bt.menu === 'magia') {
    for (const sp of T.magiasDoHeroi(B)) { const cir = sp.nv === 0 ? [0] : sp.circulos; for (const nv of cir) {
      const off = sp.bonus ? H.bonus <= 0 : H.acoes <= 0; const geo = sp.geo; const sub = `${geo.f === 'circulo' ? `área r${geo.raio}` : geo.f === 'cone' ? `cone ${geo.len}` : geo.f === 'linha' ? `linha ${geo.len}` : geo.f === 'cadeia' ? 'corrente' : geo.f === 'self' ? 'pessoal' : geo.f === 'aliados' ? 'aliados' : `alcance ${geo.alc}`} · ${sp.desc || ''}`;
      lista.append(botao(`${sp.nome}${nv ? ` ${nv}º` : ''}`, sub, () => escolherMagia(bt, sp, nv || sp.nv), { off })); } }
  } else if (bt.menu === 'hab') {
    for (const a of T.acoesHeroi(B)) { if (a.id === 'atacar') continue; lista.append(botao(a.rot, a.desc, () => escolherHab(bt, a), { off: !T.podeAgir(B, a) })); }
  } else if (bt.menu === 'item') {
    B.inv.forEach((x, i) => { if (x.n > 0 && ITENS[x.id] && ITENS[x.id].tipo === 'consumivel') lista.append(botao(`${ITENS[x.id].nome} ×${x.n}`, ITENS[x.id].desc || '', () => escolherItem(bt, i), { off: H.acoes <= 0 })); });
  }
}
function escolherMagia(bt, sp, nv) {
  const B = bt.B, H = B.h; const f = sp.geo.f;
  if (f === 'self' || f === 'aliados') return comando(bt, { id: 'magia', magia: sp.id, nv, x: H.x, y: H.y });
  bt.magia = { id: sp.id, nv }; bt.modo = 'magia'; bt.menu = 'raiz'; bt.miras = T.mirasValidas(B, H, sp.id); bt.confirma = null; bt.prevArea = null; bt.sel = null; montarMenu(bt);
  if (!bt.miras.length) { UI.toast('Nenhum alvo ao alcance.'); bt.modo = 'normal'; montarMenu(bt); }
}
function escolherHab(bt, a) {
  const B = bt.B, H = B.h;
  if (a.id.startsWith('smite')) { bt.modo = 'atacar'; bt.smite = a.id; bt.menu = 'raiz'; montarMenu(bt); return; }
  if (a.id === 'sopro') { bt.magia = { id: 'sopro', nv: 0 }; bt.modo = 'magia'; bt.menu = 'raiz'; bt.miras = []; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if ((dx || dy) && !B.g.solido(H.x + dx, H.y + dy)) bt.miras.push({ x: H.x + dx, y: H.y + dy }); bt.confirma = null; montarMenu(bt); return; }
  if (a.id === 'maos') { const alvo = [H, ...T.aliadosDe(B, H)].filter((x) => cheb(x, H) <= 1).sort((p, q) => p.hp / p.hpMax - q.hp / q.hpMax)[0]; return comando(bt, { id: 'maos', alvo: alvo.id }); }
  if (a.id === 'fugir' && B.chefe) { UI.toast('Não dá para fugir de um chefe!'); return; }
  comando(bt, { id: a.id });
}
function escolherItem(bt, i) {
  const it = ITENS[bt.B.inv[i].id];
  if (it.dano) { bt.item = i; bt.modo = 'item'; bt.menu = 'raiz'; bt.miras = T.inimigosDe(bt.B, bt.B.h).filter((e) => cheb(e, bt.B.h) <= 6).map((e) => ({ x: e.x, y: e.y })); montarMenu(bt); return; }
  comando(bt, { id: 'item', idx: i });
}
// botão ⌖ da faixa de iniciativa
document.addEventListener('click', (e) => { const b = e.target.closest('[data-bt="centro"]'); if (b && Bt.bt) { Bt.bt.livre = false; } });
