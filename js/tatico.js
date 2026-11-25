// Motor de combate TÁTICO por turnos no mapa (regras do D&D 5e / SRD): iniciativa, movimento em grade, ataques de oportunidade,
// flanco, linha de visão, magias em área (círculo, cone, linha, corrente), aliados, conversão por persuasão/magia. Sem DOM.
import { MAGIAS, ITENS, rolar, d20 } from './srd.js';
import { derivar } from './rules.js';
import { RACAS } from './cosmeticos.js';
import { TEMPERAMENTOS, linhasConversa } from './personalidade.js';

const msg = (txt, snd) => ({ t: 'msg', txt, snd });
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const eucl2 = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2;
const K = (x, y) => x * 1000 + y;
const ATR_IDX = { FOR: 0, DES: 1, CON: 2, INT: 3, SAB: 4, CAR: 5 };
const saveDe = (u, atr) => { if (u.heroi) return 0; const b = u.saveBonus ?? (1 + Math.floor((u.cr || 0) / 2)); const i = ATR_IDX[atr]; return u.f && i !== undefined ? Math.max(b, Math.floor((u.f[i] - 10) / 2)) : b; };
export const ehDistAtq = (a) => /arco|besta|dardo|rajada|raio|cuspe|arremess|disparo|espinho|bola|magia/i.test(a.n || '');
const VEL = { rato: 6, morcego: 8, limo: 3, goblin: 6, humano: 6, esqueleto: 6, zumbi: 4, lobo: 8, aranha: 6, bruto: 6, fantasma: 6, gargula: 7, dragao: 8, golem: 4, rei: 5, serpe: 6, vampiro: 7 };
const FIGURA = { fisico: 'fis' };
void FIGURA;
const hpMaxEf = (u) => Math.max(1, u.hpMax - (u.hpMaxMod || 0));

// ---------- geometria ----------
export function criarGrade(w, h, solidoFn) { return { w, h, solido: (x, y) => x < 0 || y < 0 || x >= w || y >= h || !!(solidoFn && solidoFn(x, y)) }; }
function linhaTiles(x0, y0, x1, y1) { const out = []; let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy, x = x0, y = y0; for (let i = 0; i < 80; i++) { out.push([x, y]); if (x === x1 && y === y1) break; const e2 = 2 * err; if (e2 > -dy) { err -= dy; x += sx; } if (e2 < dx) { err += dx; y += sy; } } return out; }
export function temLOS(B, a, b) { const t = linhaTiles(a.x, a.y, b.x, b.y); for (let i = 1; i < t.length - 1; i++) if (B.g.solido(t[i][0], t[i][1])) return false; return true; }
export const unidadeEm = (B, x, y) => B.un.find((u) => u.vivo && !u.saiu && u.x === x && u.y === y) || null;
export const vivos = (B, eq) => B.un.filter((u) => u.vivo && !u.saiu && (!eq || u.eq === eq));
export const inimigosDe = (B, u) => B.un.filter((x) => x.vivo && !x.saiu && x.eq !== u.eq);
export const aliadosDe = (B, u) => B.un.filter((x) => x.vivo && !x.saiu && x.eq === u.eq && x !== u);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
// Dijkstra 8 direções (diagonal custa 1; não corta quina de parede; passa por aliados, não por inimigos)
export function alcance(B, u, max) {
  const dist = new Map(), prev = new Map(); const q = [[u.x, u.y, 0]]; dist.set(K(u.x, u.y), 0);
  for (let i = 0; i < q.length; i++) { const [x, y, d] = q[i]; if (d >= max) continue;
    for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (B.g.solido(nx, ny)) continue; if (dx && dy && (B.g.solido(x + dx, y) || B.g.solido(x, y + dy))) continue; const o = unidadeEm(B, nx, ny); if (o && o.eq !== u.eq) continue; const k = K(nx, ny); if (dist.has(k)) continue; dist.set(k, d + 1); prev.set(k, K(x, y)); q.push([nx, ny, d + 1]); } }
  return { dist, prev };
}
export function caminhoAte(R, u, x, y) { const out = []; let k = K(x, y); if (!R.dist.has(k)) return null; while (k !== K(u.x, u.y)) { out.push([Math.floor(k / 1000), k % 1000]); k = R.prev.get(k); } return out.reverse(); }
export function tilesDeMov(B, u) { const R = alcance(B, u, u.movRest); const out = []; for (const [k, d] of R.dist) { if (d === 0) continue; const x = Math.floor(k / 1000), y = k % 1000; if (unidadeEm(B, x, y)) continue; out.push({ x, y, d }); } return { tiles: out, R }; }

// Escala por tamanho do grupo (PV e dano de cada monstro): mantém o perigo total do encontro parecido com o de 1x1.
export const FATOR_GRUPO = 1.1;
export function escalaGrupo(n) { if (n <= 1) return { hp: 1, dm: 1 }; const x = Math.min(1, Math.sqrt(2 / (n * (n + 1))) * FATOR_GRUPO); return { hp: x, dm: x }; }
// ---------- criação ----------
function unidadeMonstro(m, eq, id, pos, rng) {
  const atq = (m.atq || []).map((a) => ({ ...a, alc: a.r || a.alc || (ehDistAtq(a) ? 7 : 1) }));
  return { id, eq, heroi: false, nome: m.n || m.nome, hp: m.hp, hpMax: m.hpMax || m.hp, ca: m.ca, cr: m.cr || 0, atq, esp: JSON.parse(JSON.stringify(m.esp || {})), res: m.res || [], imu: m.imu || [], vul: m.vul || [], f: m.f || null, tags: m.tags || [], spr: m.spr, pal: m.pal || {}, ap: m.ap || null, mon: m.id, tok: m.tok || null, tam: m.tam || null, chefe: !!m.chefe, dm: m.dm || 1,
    vel: m.vel || VEL[m.spr] || 6, x: pos.x, y: pos.y, ini: (rng ? Math.floor((m.cr || 0) / 3) : 0), conds: {}, vivo: true, saiu: false, rodada: 0, sopro: true, saveBonus: m.saveBonus,
    racional: !!m.racional, arq: m.arq || null, frase: m.frase || null, atitude: 0, paciencia: 3, tmp: m.tmp || 'neutro', dc: m.dcSocial || 0, ouro: m.ouro || 0, recrutavel: !!m.recrutavel, mono: m, acoes: 1, bonus: 1, reacao: 1, movRest: 0, desengajou: false };
}
function unidadeHeroi(s, pos, rng, tem) {
  const D = derivar(s), h = s.heroi, rec = JSON.parse(JSON.stringify(s.recursos)); const raca = RACAS[(h.ap && h.ap.raca) || 'humano'] || RACAS.humano;
  const ex = h.exaustao || 0; let vel = (raca.vel || 6) + (h.cls === 'barbaro' && h.nivel >= 5 ? 1 : 0); if (ex >= 2) vel = Math.max(2, Math.floor(vel / 2));
  const u = { id: 'h', eq: 'j', heroi: true, nome: h.nome, cls: h.cls, L: h.nivel, hp: Math.min(h.hp ?? D.hpMax, D.hpMax), hpMax: D.hpMax, hpMaxMod: 0, ca: D.ca, caBase: D.ca, prof: D.prof, M: D.M, A: D.A,
    arma: D.arma, ataques: D.ataques, critMin: D.critMin, modAtq: D.modAtq, modDano: D.modDano, cd: D.cd, atqMagia: D.atqMagia, modConj: D.modConj, conj: D.conj,
    ini: D.ini - (h.sono ? 2 : 0), slots: rec.slots, cont: rec.cont, insp: h.insp || 0, exaust: ex, regen: D.regen, resFogo: D.resFogo || !!raca.resFogo, conds: {}, letargia: 0,
    acoes: 1, bonus: 1, reacao: 1, esq: false, primeiro: true, implacavel: 0, raca, raçaId: (h.ap && h.ap.raca) || 'humano', ap: h.ap || null, vel, movRest: 0, x: pos.x, y: pos.y, vivo: true, saiu: false, atq: [], esp: {}, tags: ['heroi'], cr: 0, desengajou: false, sopro: true, fugiu: false, racialUsado: false };
  void rng; void tem; return u;
}
// inimigos: lista de monstros (de criarMonstro). opts.pos: { heroi:{x,y}, ini:[{x,y}...], aliados:[{x,y}...] }
export function novaBatalha(s, inimigos, g, opts = {}) {
  const rng = opts.rng || Math.random; const pos = opts.pos || {};
  const B = { rng, s, g, un: [], rodada: 1, fim: null, i: 0, ordem: [], inv: (s.inv || []).map((x) => ({ ...x })), usados: [], baixas: [], chefe: false, surpresa: !!opts.surpresa, ev: [], falou: new Set() };
  const hp = pos.heroi || { x: 2, y: 4 }; const h = unidadeHeroi(s, hp, rng); B.h = h; B.un.push(h);
  (opts.aliados || []).forEach((a, i) => { const p = (pos.aliados || [])[i] || livreProximo(B, hp.x, hp.y, 3); const u = unidadeMonstro(a, 'j', 'a' + i, p, rng); u.ini = 2; u.aliadoFixo = true; u.saveBonus = a.saveBonus ?? (2 + Math.floor((s.heroi.nivel || 1) / 3)); B.un.push(u); });
  inimigos.forEach((m, i) => { const p = (pos.ini || [])[i] || livreProximo(B, hp.x + 6, hp.y, 5); const u = unidadeMonstro(m, 'm', 'm' + i, p, rng); if (m.chefe) B.chefe = true; if (B.surpresa) u.conds.surpreso = true; B.un.push(u); });
  const evs = [];
  for (const u of B.un) u.rolagem = d20(rng) + u.ini + (u.heroi && u.exaust >= 2 ? -99 : 0) + (u.heroi && !B.surpresa ? 0 : 0);
  B.ordem = [...B.un].sort((a, b) => b.rolagem - a.rolagem || (b.ini - a.ini)).map((u) => u.id);
  if (B.surpresa) evs.push(msg('Você pegou o inimigo de surpresa!'));
  evs.push({ t: 'ordem', ordem: [...B.ordem] });
  if (!opts.adiar) avancar(B, evs);
  return { B, ev: evs };
}
export function comecarCombate(B) { const evs = []; avancar(B, evs); return evs; }
function livreProximo(B, x, y, raio) { for (let r = 0; r <= raio; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const nx = x + dx, ny = y + dy; if (!B.g.solido(nx, ny) && !unidadeEm(B, nx, ny)) return { x: nx, y: ny }; } return { x, y }; }
export const porId = (B, id) => B.un.find((u) => u.id === id) || null;
export const ativo = (B) => porId(B, B.ordem[B.i]);

// ---------- d20 e dano ----------
function jogaD20(B, vant, desv, sorte) { let r = d20(B.rng); if (sorte && r === 1) r = d20(B.rng); if (vant && !desv) return Math.max(r, d20(B.rng)); if (desv && !vant) return Math.min(r, d20(B.rng)); return r; }
function resistir(u, n, tipo, fonte) {
  if (u.heroi) { if (u.conds.furia && (tipo === 'fis' || !tipo)) n = Math.floor(n / 2); if (tipo === 'fogo' && u.resFogo) n = Math.floor(n / 2); if ((tipo === 'veneno') && u.raca && u.raca.resVeneno) n = Math.floor(n / 2); }
  else { const t = tipo || 'fis'; const magico = !!(fonte && fonte.arma && fonte.arma.mag > 0 && t === 'fis');
    if (!magico) { if (u.imu && u.imu.includes(t)) return 0; if (u.res && u.res.includes(t)) n = Math.floor(n / 2); }
    if (u.vul && u.vul.includes(t)) n *= 2; }
  return n;
}
function dano(B, u, n, tipo, evs, crit, fonte) {
  n = Math.max(0, Math.round(resistir(u, n, tipo, fonte))); if (u.conds.dormindo) { u.conds.dormindo = false; evs.push({ t: 'cond', id: u.id, cond: 'dormindo', on: false }); evs.push(msg(`${u.nome} acorda!`)); }
  if (u.conds.pacificado && fonte && fonte.eq !== u.eq) { u.conds.pacificado = 0; }
  if (u.conds.convertidoTmp && fonte && fonte.eq !== u.eq && fonte.heroi) { /* quebra o encanto */ u.eq = 'm'; u.conds.convertidoTmp = 0; evs.push(msg(`${u.nome} se livra do encanto!`)); }
  u.hp -= n; if (tipo === 'fogo' || tipo === 'ácido') u.queimou = true; evs.push({ t: 'dano', id: u.id, n, tipo, crit: !!crit, de: fonte ? fonte.id : null });
  if (u.hp <= 0 && !u.heroi && u.esp && u.esp.fortitude && tipo !== 'radiante' && !crit && !u.fortUsou) { const con = Math.floor(((u.f ? u.f[2] : 10) - 10) / 2); if (d20(B.rng) + con >= 5 + n) { u.fortUsou = true; u.hp = 1; evs.push(msg(`${u.nome} se recusa a cair!`)); } }
  if (u.hp <= 0) morrer(B, u, evs, fonte);
  return n;
}
function morrer(B, u, evs, fonte) {
  if (u.heroi) {
    if (u.conds.furia && u.L >= 11) { const dc = 10 + 5 * u.implacavel; const r = d20(B.rng) + u.M.CON; u.implacavel++; if (r >= dc) { u.hp = u.L * 2; evs.push(msg('Fúria Implacável! Você se recusa a cair.', 'heal')); return; } }
    if (u.raca && u.raca.implacavel && !u.racialUsado) { u.racialUsado = true; u.hp = 1; evs.push(msg('Resistência Implacável! Você fica de pé com 1 PV.', 'heal')); return; }
    u.hp = 0; u.vivo = false; B.fim = 'derrota'; evs.push({ t: 'morte', id: u.id }); evs.push(msg('Você caiu...', 'lose')); return;
  }
  u.hp = 0; u.vivo = false; evs.push({ t: 'morte', id: u.id }); if (u.eq === 'm') { B.baixas.push({ id: u.id, nome: u.nome, mon: u.mono, como: 'morto', u }); evs.push(msg(`${u.nome} foi derrotado!`, 'win')); } else evs.push(msg(`${u.nome} desabou!`));
  void fonte; checaFim(B, evs);
}
function checaFim(B, evs) { if (B.fim) return true; if (!B.h.vivo) { B.fim = 'derrota'; return true; } if (B.h.fugiu) { B.fim = 'fuga'; return true; } if (!vivos(B, 'm').length) { B.fim = B.baixas.some((b) => b.como === 'morto') || !B.baixas.length ? 'vitoria' : 'vitoria'; evs.push({ t: 'fimcombate', res: 'vitoria' }); return true; } return false; }
function cura(B, u, n, evs) { n = Math.max(0, Math.min(hpMaxEf(u) - u.hp, n)); u.hp += n; evs.push({ t: 'cura', id: u.id, n }); return n; }

// ---------- vantagem, flanco ----------
function flanqueado(B, a, alvo) { const ox = alvo.x * 2 - a.x, oy = alvo.y * 2 - a.y; const o = unidadeEm(B, ox, oy); return !!(o && o.eq === a.eq && o !== a && !o.conds.dormindo && !o.conds.paralisado); }
const incapaz = (u) => !!(u.conds.dormindo || u.conds.paralisado);
function vantDesv(B, a, alvo, dist, extra = {}) {
  let vant = !!extra.vant, desv = !!extra.desv; if (incapaz(alvo)) vant = true; if (a.conds.amedrontado) desv = true; if (alvo.conds.esquivando) desv = true; if (a.conds.lento) desv = true; if (a.conds.cego) desv = true;
  if (dist > 1 && inimigosDe(B, a).some((e) => cheb(e, a) <= 1 && !incapaz(e))) desv = true;
  if (dist <= 1 && flanqueado(B, a, alvo)) vant = true;
  if (a.mono && (a.spr === 'lobo' || (a.esp && a.esp.bando)) && aliadosDe(B, a).some((x) => cheb(x, alvo) <= 1 && x.eq === a.eq)) vant = true;
  if (a.heroi && (a.conds.vant || a.conds.descuidado)) vant = true; if (alvo.heroi && alvo.conds.descuidado) vant = true; if (a.heroi && a.exaust >= 3) desv = true;
  return { vant, desv };
}

// ---------- ataque do herói ----------
export function alcanceArma(u) { return u.arma && u.arma.dist ? 7 : u.arma && u.arma.alc ? 2 : 1; }
function ataqueHeroi(B, u, alvo, evs, op = {}) {
  const L = u.L, cls = u.cls; let n = u.ataques + (u.conds.furia && cls === 'barbaro' && L >= 3 ? 1 : 0); let smiteUsado = false; const sorte = !!(u.raca && u.raca.sortudo);
  let cur = alvo; evs.push({ t: 'atq', de: u.id, para: alvo.id, tipo: u.arma && u.arma.dist ? 'dist' : 'melee', arma: u.arma && u.arma.nome });
  for (let i = 0; i < n && !B.fim; i++) {
    if (!cur || !cur.vivo || cur.saiu) { const prox = inimigosDe(B, u).filter((e) => cheb(e, u) <= alcanceArma(u) && (alcanceArma(u) === 1 || temLOS(B, u, e))).sort((a, b) => a.hp - b.hp)[0]; if (!prox) break; cur = prox; evs.push({ t: 'atq', de: u.id, para: cur.id, tipo: 'melee' }); }
    const d = cheb(u, cur); const { vant, desv } = vantDesv(B, u, cur, d);
    const r = jogaD20(B, vant, desv, sorte); const bencao = u.conds.bencao ? rolar('1d4', B.rng).total : 0; let total = r + u.modAtq + bencao - u.letargia;
    if (op.sorte && total < cur.ca && u.cont.sorte > 0 && r !== 1) { u.cont.sorte--; total = 99; evs.push(msg('Golpe de Sorte!')); }
    const crit = (r >= u.critMin && r !== 1) || (incapaz(cur) && d <= 1 && total >= cur.ca); const acerta = r !== 1 && (crit || total >= cur.ca);
    if (!acerta) { evs.push({ t: 'erro', id: cur.id, de: u.id, rolagem: r, total }); continue; }
    const dado = u.arma.dado; let tot = rolar(dado, B.rng, crit).total + u.modDano; let extra = '';
    if (u.arma.extra) tot += rolar(u.arma.extra.dado, B.rng, crit).total;
    if (u.arma.contra && (cur.tags || []).includes(u.arma.contra.tp)) tot += rolar(u.arma.contra.dado, B.rng, crit).total;
    if (u.arma.vicioso && crit) tot += rolar('2d6', B.rng).total;
    if (crit && u.raca && u.raca.selvagem) tot += rolar(dado, B.rng).total;
    if (u.conds.furia) tot += L >= 16 ? 4 : L >= 9 ? 3 : 2;
    if (cls === 'barbaro' && crit && L >= 9) { const k = L >= 17 ? 3 : L >= 13 ? 2 : 1; tot += rolar(`${k}${dado.replace(/^\d+/, '')}`, B.rng).total; }
    if (cls === 'paladino' && !u.arma.duas && !u.arma.dist) tot += 2;
    if (u.conds.favor) tot += rolar('1d4', B.rng, crit).total;
    if (cls === 'clerigo' && L >= 8) tot += rolar('1d8', B.rng, crit).total;
    if (cls === 'ladino' && !u.furtivoUsado) { const aliadoPerto = aliadosDe(B, u).some((x) => cheb(x, cur) <= 1 && !incapaz(x)); if ((vant && !desv) || aliadoPerto || (u.primeiro && (B.surpresa && L >= 1))) { u.furtivoUsado = true; tot += rolar(`${Math.ceil(L / 2)}d6`, B.rng, crit).total; extra = ' (Ataque Furtivo!)'; } }
    if (cls === 'paladino') { if (op.smite > 0 && !smiteUsado && u.slots[op.smite - 1] > 0) { u.slots[op.smite - 1]--; smiteUsado = true; tot += rolar(`${Math.min(5, 1 + op.smite)}d8`, B.rng, true).total; extra = ' (Destruição Divina!)'; } if (L >= 11) tot += rolar('1d8', B.rng, crit).total; }
    evs.push(msg(`Você acerta${crit ? ' um CRÍTICO' : ''}${extra}!`, crit ? 'crit' : 'hit')); dano(B, cur, tot, 'fis', evs, crit, u);
  }
  u.conds.vant = false; u.conds.guiado = false; u.primeiro = false;
}
// ---------- ataque de monstro/aliado ----------
function ataqueUnidade(B, u, a, alvo, evs, op = {}) {
  const d = cheb(u, alvo); const { vant, desv } = vantDesv(B, u, alvo, d, { desv: op.desv }); const r = jogaD20(B, vant, desv); const crit = r === 20; const total = r + a.b + (u.conds.bencao ? 2 : 0);
  evs.push({ t: 'atq', de: u.id, para: alvo.id, tipo: d > 1 ? 'dist' : 'melee', arma: a.n });
  if (r !== 1 && (crit || total >= alvo.ca)) {
    let dn = Math.round(rolar(a.d, B.rng, crit).total * (u.dm || 1)); if (u.conds.irritado) dn += 2;
    if (alvo.heroi && alvo.cls === 'ladino' && alvo.L >= 5 && !alvo.esq && alvo.reacao > 0) { alvo.esq = true; alvo.reacao--; dn = Math.floor(dn / 2); }
    dano(B, alvo, dn, a.t || 'fis', evs, crit, u); evs.push(msg(`${u.nome} acerta com ${a.n}${crit ? ' (CRÍTICO)' : ''}.`, u.eq === 'm' ? 'hurt' : 'hit'));
    if (alvo.vivo && alvo.heroi && !B.fim) { const esp = u.esp || {};
      if (esp.veneno && !(alvo.cls === 'paladino' && alvo.L >= 3)) { const rs = d20(B.rng) + alvo.M.CON + (alvo.raca && alvo.raca.resVeneno ? 2 : 0); const dv = rolar(esp.veneno.d, B.rng).total; dano(B, alvo, rs >= esp.veneno.dc ? Math.floor(dv / 2) : dv, 'veneno', evs, false, u); }
      if (!B.fim && esp.envenena && !(alvo.cls === 'paladino' && alvo.L >= 3)) { const rs = d20(B.rng) + alvo.M.CON; if (rs < esp.envenena.dc) { alvo.letargia = Math.min(5, alvo.letargia + 1); evs.push(msg('O veneno turva sua mira (−1 em ataques).')); } }
      if (!B.fim && esp.derruba && !alvo.derrubado) { const rs = d20(B.rng) + Math.max(alvo.M.FOR, alvo.M.DES); if (rs < esp.derruba.dc) { alvo.derrubado = true; evs.push(msg('Você é derrubado! Levantar custa metade do movimento.')); } }
      if (!B.fim && esp.agarra && !alvo.preso) { const rs = d20(B.rng) + Math.max(alvo.M.FOR, alvo.M.DES); if (rs < esp.agarra.dc) { alvo.preso = esp.agarra.dc; evs.push(msg('Você está agarrado! Escape para poder se mover.')); } }
      if (!B.fim && esp.paralisa) { const rs = d20(B.rng) + alvo.M.CON; if (rs < esp.paralisa.dc) { alvo.perdeTurno = true; evs.push(msg('Você fica paralisado!')); } }
      if (!B.fim && esp.drena && a.t === 'necrótico') { const red = Math.floor(dn / 3); alvo.hpMaxMod = Math.min(alvo.hpMax - 1, (alvo.hpMaxMod || 0) + red); if (alvo.hp > hpMaxEf(alvo)) alvo.hp = hpMaxEf(alvo); if (red) evs.push(msg(`Seu PV máximo cai ${red} neste combate.`)); } }
  } else evs.push({ t: 'erro', id: alvo.id, de: u.id, rolagem: r, total, nome: a.n });
}

// ---------- movimento ----------
function provocar(B, u, de, para, evs) {
  if (u.desengajou || u.conds.dormindo) return; for (const e of inimigosDe(B, u)) { if (B.fim || !u.vivo) return; if (e.reacao <= 0 || incapaz(e) || e.conds.perde || e.conds.amedrontado || e.conds.pacificado) continue; if (cheb(e, de) > 1 || cheb(e, para) <= 1) continue; if (e.heroi) { if (!e.arma || e.arma.dist) continue; e.reacao--; evs.push(msg('Ataque de oportunidade!')); const sv = e.ataques; e.ataques = 1; ataqueHeroi(B, e, u, evs); e.ataques = sv; continue; } const a = e.atq.find((x) => x.alc === 1); if (!a) continue; e.reacao--; evs.push(msg(`${e.nome}: ataque de oportunidade!`)); ataqueUnidade(B, e, a, u, evs); }
}
export function mover(B, u, x, y, evs = []) {
  if (B.fim || !u.vivo) return evs; const R = alcance(B, u, u.movRest); const cam = caminhoAte(R, u, x, y); if (!cam || !cam.length || unidadeEm(B, x, y)) return evs;
  const passos = []; let atual = [u.x, u.y];
  for (const [nx, ny] of cam) { provocar(B, u, { x: atual[0], y: atual[1] }, { x: nx, y: ny }, evs); if (!u.vivo || B.fim) break; if (u.conds.paralisado) break; u.x = nx; u.y = ny; u.movRest--; passos.push([nx, ny]); atual = [nx, ny]; }
  if (passos.length) evs.splice(evs.length, 0, { t: 'mov', id: u.id, caminho: passos });
  return evs;
}
// movimento que a UI pede: reordena eventos (mov antes dos ataques de oportunidade para animar na ordem certa)
export function moverHeroi(B, x, y) { const u = B.h, evs = []; if (ativo(B) !== u) return evs; const R = alcance(B, u, u.movRest); const cam = caminhoAte(R, u, x, y); if (!cam) return evs; const passos = []; let atual = { x: u.x, y: u.y };
  for (const [nx, ny] of cam) { const ant = []; provocar(B, u, atual, { x: nx, y: ny }, ant); if (passos.length === 0 || true) { /* animação simples: mov parcial antes do evento */ } if (!u.vivo) { evs.push(...ant); break; } u.x = nx; u.y = ny; u.movRest--; evs.push({ t: 'mov', id: u.id, caminho: [[nx, ny]] }); evs.push(...ant); passos.push([nx, ny]); atual = { x: nx, y: ny }; if (B.fim) break; }
  return evs; }

// ---------- áreas ----------
export const GEO = {
  raio_fogo: { f: 'ponto', alc: 8 }, raio_gelo: { f: 'ponto', alc: 8 }, chama_sagrada: { f: 'ponto', alc: 8 }, misseis: { f: 'ponto', alc: 8 }, maos_flam: { f: 'cone', len: 3 }, sono: { f: 'circulo', alc: 6, raio: 2 },
  raio_ardente: { f: 'ponto', alc: 8 }, flecha_acida: { f: 'ponto', alc: 8 }, bola_fogo: { f: 'circulo', alc: 8, raio: 2 }, relampago: { f: 'linha', len: 8 }, tempestade_glacial: { f: 'circulo', alc: 8, raio: 2 },
  malogro: { f: 'ponto', alc: 7 }, cone_frio: { f: 'cone', len: 5 }, nevoa_mortal: { f: 'circulo', alc: 8, raio: 2 }, corrente: { f: 'cadeia', alc: 8, saltos: 3 }, desintegrar: { f: 'ponto', alc: 8 }, dedo_morte: { f: 'ponto', alc: 7 },
  explosao_solar: { f: 'circulo', alc: 8, raio: 3 }, chuva_meteoros: { f: 'circulo', alc: 9, raio: 3 }, palavra_matar: { f: 'ponto', alc: 7 },
  curar: { f: 'aliado', alc: 1 }, palavra_cur: { f: 'aliado', alc: 5 }, raio_guia: { f: 'ponto', alc: 8 }, bencao: { f: 'aliados', alc: 5, max: 3 }, infligir: { f: 'ponto', alc: 1 }, favor: { f: 'self' }, arma_esp: { f: 'self' }, guardioes: { f: 'self' },
  coluna_chamas: { f: 'circulo', alc: 8, raio: 1 }, cura_massa: { f: 'aliados', alc: 6, max: 6 }, cura_completa: { f: 'aliado', alc: 1 }, raio_solar: { f: 'linha', len: 8 }, tempestade_fogo: { f: 'circulo', alc: 9, raio: 3 }, cura_total: { f: 'aliados', alc: 8, max: 8 },
  encantar: { f: 'ponto', alc: 6 }, acalmar: { f: 'circulo', alc: 6, raio: 2 }, medo: { f: 'cone', len: 4 }, dominar: { f: 'ponto', alc: 6 },
};
export const geoDe = (id) => GEO[id] || { f: 'ponto', alc: 8 };
function tilesCirculo(B, cx, cy, R) { const out = []; for (let y = Math.floor(cy - R - 1); y <= Math.ceil(cy + R + 1); y++) for (let x = Math.floor(cx - R - 1); x <= Math.ceil(cx + R + 1); x++) if (!B.g.solido(x, y) && eucl2(x, y, cx, cy) <= (R + 0.5) ** 2) out.push([x, y]); return out; }
function tilesCone(B, u, tx, ty, len) { const vx = tx - u.x, vy = ty - u.y, vl = Math.hypot(vx, vy) || 1; const out = []; for (let y = u.y - len; y <= u.y + len; y++) for (let x = u.x - len; x <= u.x + len; x++) { if (x === u.x && y === u.y) continue; if (B.g.solido(x, y)) continue; const dx = x - u.x, dy = y - u.y, dl = Math.hypot(dx, dy); if (dl > len + 0.35) continue; if ((dx * vx + dy * vy) / (dl * vl) < 0.7) continue; if (!temLOS(B, u, { x, y })) continue; out.push([x, y]); } return out; }
function tilesLinha(B, u, tx, ty, len) { const vx = tx - u.x, vy = ty - u.y, vl = Math.hypot(vx, vy) || 1; const fx = Math.round(u.x + (vx / vl) * len), fy = Math.round(u.y + (vy / vl) * len); const t = linhaTiles(u.x, u.y, fx, fy); const out = []; for (let i = 1; i < t.length; i++) { if (B.g.solido(t[i][0], t[i][1])) break; out.push(t[i]); } return out; }
// área afetada por uma magia mirada em (tx,ty): tiles e unidades
export function areaMagia(B, u, id, tx, ty) {
  const g = geoDe(id); let tiles = [], unid = [];
  if (g.f === 'circulo') { tiles = tilesCirculo(B, tx, ty, g.raio); }
  else if (g.f === 'cone') tiles = tilesCone(B, u, tx, ty, g.len);
  else if (g.f === 'linha') tiles = tilesLinha(B, u, tx, ty, g.len);
  else if (g.f === 'ponto' || g.f === 'aliado') tiles = [[tx, ty]];
  else if (g.f === 'cadeia') { const alvo = unidadeEm(B, tx, ty); tiles = [[tx, ty]]; if (alvo) { const vis = new Set([alvo.id]); let cur = alvo; for (let i = 0; i < g.saltos; i++) { const prox = inimigosDe(B, u).filter((e) => !vis.has(e.id) && cheb(e, cur) <= 4).sort((a, b) => cheb(a, cur) - cheb(b, cur))[0]; if (!prox) break; vis.add(prox.id); tiles.push([prox.x, prox.y]); cur = prox; } } }
  else if (g.f === 'aliados' || g.f === 'self') tiles = [];
  const set = new Set(tiles.map(([x, y]) => K(x, y))); unid = B.un.filter((x) => x.vivo && !x.saiu && set.has(K(x.x, x.y)) && x !== u);
  if (g.f === 'aliados') unid = [u, ...aliadosDe(B, u)].filter((x) => cheb(x, u) <= g.alc).sort((a, b) => a.hp / hpMaxEf(a) - b.hp / hpMaxEf(b)).slice(0, g.max);
  if (g.f === 'self') unid = [u];
  return { tiles, unidades: unid, geo: g };
}
export function mirasValidas(B, u, id) { // tiles onde se pode mirar a magia
  const g = geoDe(id), out = []; if (g.f === 'self' || g.f === 'aliados') return [{ x: u.x, y: u.y }];
  for (let y = u.y - (g.alc || g.len || 8); y <= u.y + (g.alc || g.len || 8); y++) for (let x = u.x - (g.alc || g.len || 8); x <= u.x + (g.alc || g.len || 8); x++) {
    if (B.g.solido(x, y)) continue; const d = Math.max(Math.abs(x - u.x), Math.abs(y - u.y)); if (g.f === 'cone' || g.f === 'linha') { if (d === 0 || d > (g.len || 8)) continue; out.push({ x, y }); continue; }
    if (d > (g.alc || 8)) continue; if (g.f === 'circulo') { if (temLOS(B, u, { x, y }) || d <= 1) out.push({ x, y }); continue; }
    const o = unidadeEm(B, x, y); if (!o) continue; if (g.f === 'aliado') { if (o.eq === u.eq) out.push({ x, y }); continue; }
    if (o.eq !== u.eq && temLOS(B, u, o)) out.push({ x, y });
  } return out;
}

// ---------- magias do herói ----------
export function magiasDoHeroi(B) {
  const H = B.h, out = [], maxNv = H.slots.length;
  for (const [id, m] of Object.entries(MAGIAS)) {
    if (!m.cls.includes(H.cls)) continue; if (H.cls === 'paladino' && !['curar', 'bencao', 'favor'].includes(id)) continue;
    if (m.nv === 0) { out.push({ id, ...m, circulos: [0], geo: geoDe(id) }); continue; }
    const circulos = []; for (let n = m.nv; n <= maxNv; n++) if (H.slots[n - 1] > 0) circulos.push(n);
    if (m.nv <= maxNv) out.push({ id, ...m, circulos, conhecida: true, geo: geoDe(id) });
  }
  return out;
}
function dadosEscalados(m, nv, L) {
  let expr = m.dado; if (m.nv === 0) { const k = 1 + (L >= 5) + (L >= 11) + (L >= 17); return expr.replace(/^(\d+)d/, (a, n) => `${parseInt(n) * k}d`); }
  if (m.up && nv > m.nv) { const [n, f] = m.up.split('d'); expr += `+${parseInt(n) * (nv - m.nv)}d${f}`; } return expr;
}
const ehRacionalAlvo = (u) => u.racional || (u.tags || []).includes('humanoide');
function salvar(B, alvo, dc, atr, evs, op = {}) { // retorna true se passou
  let r = d20(B.rng); if (alvo.heroi) { const vant = (op.magico && alvo.raca && alvo.raca.vantMagia) || (op.medo && alvo.raca && alvo.raca.vantMedo) || (op.enc && alvo.raca && alvo.raca.vantEnc); if (vant) r = Math.max(r, d20(B.rng)); r += (alvo.M ? alvo.M[atr] : 0) + (alvo.conds.bencao ? 2 : 0); } else { if (op.magico && alvo.esp && alvo.esp.resMag) r = Math.max(r, d20(B.rng)); r += saveDe(alvo, atr) + (alvo.conds.bencao ? 2 : 0); } let ok = r >= dc; if (!ok && !alvo.heroi && alvo.esp && alvo.esp.resLend > 0) { alvo.esp.resLend--; ok = true; evs.push(msg(`${alvo.nome} usa Resistência Lendária!`, 'spell')); } return ok;
}
export function conjurar(B, u, id, nv, tx, ty, evs = []) {
  const sp = MAGIAS[id]; nv = nv || sp.nv; const geo = geoDe(id); if (B.fim) return evs;
  if (sp.nv > 0) { if (!(u.slots[nv - 1] > 0)) { evs.push(msg('Sem espaços de magia desse círculo!')); return evs; } u.slots[nv - 1]--; }
  const area = areaMagia(B, u, id, tx, ty); const bonusAv = u.cls === 'mago' && u.L >= 10 && ['salva', 'atq', 'auto'].includes(sp.tipo) && sp.nv > 0 ? u.M.INT : 0;
  evs.push(msg(`Você conjura ${sp.nome}${sp.nv > 0 ? ` (${nv}º círculo)` : ''}!`, 'spell')); evs.push({ t: 'aoe', de: u.id, forma: geo.f, tiles: area.tiles, dano: sp.dano || (sp.tipo === 'cura' ? 'cura' : 'arcano'), alvo: [tx, ty], tx, ty });
  const inim = area.unidades.filter((x) => x.eq !== u.eq), todos = area.unidades;
  if (sp.tipo === 'atq') { const alvo = unidadeEm(B, tx, ty); if (!alvo) return evs; const raios = sp.raios ? sp.raios + (nv - sp.nv) : 1; evs.push({ t: 'atq', de: u.id, para: alvo.id, tipo: 'magia', dano: sp.dano });
    for (let i = 0; i < raios && !B.fim && alvo.vivo; i++) { const { vant, desv } = vantDesv(B, u, alvo, cheb(u, alvo), { vant: u.conds.vant }); const r = jogaD20(B, vant, desv || u.exaust >= 3); const tot = r + u.atqMagia + (u.conds.bencao ? rolar('1d4', B.rng).total : 0) - u.letargia; const crit = r === 20;
      if (r !== 1 && (crit || tot >= alvo.ca)) { const d = rolar(dadosEscalados(sp, nv, u.L), B.rng, crit).total + bonusAv; dano(B, alvo, d, sp.dano, evs, crit, u); }
      else { evs.push({ t: 'erro', id: alvo.id, de: u.id, rolagem: r, total: tot }); if (sp.nv === 0 && u.cls === 'mago' && u.L >= 6 && r !== 1) dano(B, alvo, Math.floor(rolar(dadosEscalados(sp, nv, u.L), B.rng).total / 2), sp.dano, evs, false, u); } }
    if (sp.efeito === 'lento' && alvo.vivo) { alvo.conds.lento = true; evs.push({ t: 'cond', id: alvo.id, cond: 'lento', on: true }); } u.conds.vant = sp.efeito === 'guiado'; }
  else if (sp.tipo === 'salva') { const prim = unidadeEm(B, tx, ty); const lista = geo.f === 'ponto' ? (prim ? [prim] : []) : (geo.f === 'cadeia' ? area.tiles.map(([x, y]) => unidadeEm(B, x, y)).filter(Boolean) : inim);
    const alvos = geo.f === 'circulo' || geo.f === 'cone' || geo.f === 'linha' ? todos : lista; const rol = rolar(dadosEscalados(sp, nv, u.L), B.rng).total + bonusAv;
    for (const a of alvos) { if (!a.vivo) continue; const passou = salvar(B, a, u.cd, sp.atr, evs); if (!passou) dano(B, a, rol, sp.dano, evs, false, u); else if (sp.metade) dano(B, a, Math.floor(rol / 2), sp.dano, evs, false, u); else evs.push(msg(`${a.nome} resiste à magia!`)); if (B.fim) break; } }
  else if (sp.tipo === 'auto') { const alvo = unidadeEm(B, tx, ty); if (!alvo) return evs; const n = sp.dardos + (nv - sp.nv); let tot = 0; for (let i = 0; i < n; i++) tot += rolar(sp.dado, B.rng).total; dano(B, alvo, tot + bonusAv, sp.dano, evs, false, u); }
  else if (sp.tipo === 'cura') { const mult = (txt) => (txt.includes('d') ? rolar(dadosEscalados(sp, nv, u.L), B.rng).total + u.modConj : parseInt(txt)); const bonusCl = u.cls === 'clerigo' ? 2 + nv : 0;
    const alvos = geo.f === 'aliados' ? area.unidades : [unidadeEm(B, tx, ty) || u]; for (const a of alvos) cura(B, a, Math.max(1, mult(sp.dado) + bonusCl), evs); }
  else if (sp.tipo === 'sono') { let pool = rolar(dadosEscalados(sp, nv, u.L), B.rng).total; const alvos = area.unidades.filter((x) => !x.chefe).sort((a, b) => a.hp - b.hp); let dormiu = 0; for (const a of alvos) { if (a.hp <= pool) { pool -= a.hp; a.conds.dormindo = true; dormiu++; evs.push({ t: 'cond', id: a.id, cond: 'dormindo', on: true }); evs.push(msg(`${a.nome} adormece!`)); } } if (!dormiu) evs.push(msg('Ninguém adormece.')); }
  else if (sp.tipo === 'buff') { const k = sp.buff; for (const a of (geo.f === 'aliados' ? area.unidades : [u])) { a.conds[k] = true; evs.push({ t: 'cond', id: a.id, cond: k, on: true }); } evs.push(msg(`${sp.nome} ativo até o fim do combate.`, 'spell')); }
  else if (sp.tipo === 'matar') { const alvo = unidadeEm(B, tx, ty); if (alvo) { if (alvo.hp <= sp.limite) { alvo.hp = 1; dano(B, alvo, 999, 'necrótico', evs, false, u); } else evs.push(msg(`${alvo.nome} aguenta a palavra de poder!`)); } }
  else if (sp.tipo === 'encanto') { const alvo = unidadeEm(B, tx, ty); if (alvo) magiaEncanto(B, u, alvo, id, evs); }
  else if (sp.tipo === 'acalmar') { for (const a of area.unidades) { if (a.chefe && a.cr > u.L + 2) { evs.push(msg(`${a.nome} ignora a calma.`)); continue; } if (salvar(B, a, u.cd, 'CAR', evs, { magico: true })) { evs.push(msg(`${a.nome} resiste à calma.`)); continue; } a.conds.pacificado = 3; a.atitude = Math.max(a.atitude, 35); evs.push({ t: 'cond', id: a.id, cond: 'pacificado', on: true }); evs.push(msg(`${a.nome} se acalma e baixa as armas.`)); } }
  else if (sp.tipo === 'medo') { for (const a of inim) { if (!a.vivo) continue; if (salvar(B, a, u.cd, 'SAB', evs, { magico: true })) { evs.push(msg(`${a.nome} resiste ao medo.`)); continue; } a.conds.amedrontado = 3; evs.push({ t: 'cond', id: a.id, cond: 'amedrontado', on: true }); evs.push(msg(`${a.nome} foge aterrorizado!`)); } }
  return evs;
}
function magiaEncanto(B, u, alvo, id, evs) {
  const ehPessoa = (alvo.tags || []).includes('humanoide') || alvo.racional; if (!ehPessoa) { evs.push(msg(`${alvo.nome} não é afetado por magias de encanto.`)); return; }
  if (alvo.chefe) { evs.push(msg(`${alvo.nome} é poderoso demais para ser encantado!`)); return; }
  const dom = id === 'dominar'; if (!dom && alvo.hp > 60 + u.L * 5) { evs.push(msg(`${alvo.nome} tem vontade forte demais.`)); return; }
  if (salvar(B, alvo, u.cd, 'SAB', evs, { magico: true })) { evs.push(msg(`${alvo.nome} resiste ao encanto e ${alvo.racional ? 'fica furioso' : 'rosna'}!`)); alvo.conds.irritado = true; return; }
  converter(B, alvo, evs, dom ? 'dominado' : 'encantado'); alvo.conds.convertidoTmp = dom ? 0 : 1; alvo.recrutavel = alvo.racional && dom; }
function converter(B, alvo, evs, como = 'convertido') { alvo.eq = 'j'; alvo.conds.convertido = true; alvo.aliadoFixo = true; alvo.conds.amedrontado = 0; alvo.conds.pacificado = 0; evs.push({ t: 'conv', id: alvo.id }); evs.push(msg(`${alvo.nome} agora luta ao seu lado!`, 'spell')); B.baixas.push({ id: alvo.id, nome: alvo.nome, mon: alvo.mono, como, u: alvo }); checaFim(B, evs); }

// ---------- habilidades de classe / ações ----------
export function acoesHeroi(B) {
  const H = B.h, a = []; const add = (id, rot, desc, extra = {}) => a.push({ id, rot, desc, ...extra });
  add('atacar', 'Atacar', `${H.ataques > 1 ? H.ataques + ' ataques' : '1 ataque'} com ${H.arma.nome} (alcance ${alcanceArma(H)})`, { acao: true, alvo: 'inimigo', alc: alcanceArma(H) });
  if (H.cls === 'paladino') for (let n = 1; n <= H.slots.length; n++) if (H.slots[n - 1] > 0) add('smite' + n, `Destruição Divina ${n}º`, `Ataque + ${Math.min(5, 1 + n)}d8 radiante`, { acao: true, arg: n, alvo: 'inimigo', alc: 1 });
  if (H.cls === 'guerreiro') { if (H.cont.folego > 0) add('folego', 'Retomar o Fôlego', `Bônus: cura 1d10+${H.L} (${H.cont.folego})`, { bonus: true }); if (H.cont.surto > 0) add('surto', 'Surto de Ação', `Ação extra (${H.cont.surto})`, { livre: true }); }
  if (H.cls === 'barbaro') { if (!H.conds.furia && H.cont.furia > 0) add('furia', 'Fúria', `Bônus: +dano e resistência física (${H.cont.furia >= 99 ? '∞' : H.cont.furia})`, { bonus: true }); if (H.L >= 2 && !H.conds.descuidado) add('descuidado', 'Ataque Descuidado', 'Vantagem nos ataques; inimigos também têm', { livre: true }); }
  if (H.cls === 'ladino' && H.cont.ardil > 0) add('ardil', 'Ação Ardilosa', `Bônus: esconde-se (vantagem) e se solta sem ataques de oportunidade (${H.cont.ardil})`, { bonus: true });
  if (H.cls === 'ladino' && H.cont.sorte > 0) add('sorte', 'Golpe de Sorte', 'Seu próximo erro vira acerto', { livre: true });
  if (H.cls === 'mago' && H.cont.recup > 0) add('recup', 'Recuperação Arcana', 'Recupera espaços de magia', { acao: true });
  if (H.cls === 'clerigo' && H.cont.canal > 0) { if (vivos(B, 'm').some((e) => (e.tags || []).includes('morto'))) add('expulsar', 'Expulsar Mortos-Vivos', `Canalizar Divindade (${H.cont.canal})`, { acao: true }); add('preservar', 'Preservar a Vida', `Canalizar: cura ${5 * H.L} PV entre aliados (${H.cont.canal})`, { acao: true }); }
  if (H.cls === 'paladino') { if (H.cont.maos > 0) add('maos', 'Cura pelas Mãos', `Toque: cura até 25 PV (reserva ${H.cont.maos})`, { acao: true, alvo: 'aliado', alc: 1 }); if (H.cont.canal > 0 && H.L >= 3) add('sagrada', 'Arma Sagrada', `+${Math.max(1, H.M.CAR)} nos ataques`, { bonus: true }); }
  if (H.raca && H.raca.sopro && H.sopro) add('sopro', 'Sopro Dracônico', `Cone de ${(ANC_NOME(H))}: ${2 + Math.floor((H.L - 1) / 5)}d6`, { acao: true, alvo: 'cone' });
  if (H.insp > 0) add('insp', 'Inspiração', `Vantagem no próximo ataque (${H.insp})`, { livre: true });
  add('correr', 'Correr', 'Dobra o movimento deste turno', { acao: true });
  add('desengajar', 'Desengajar', 'Move-se sem provocar ataques de oportunidade', { acao: true });
  add('esquivar', 'Esquivar', 'Inimigos atacam com desvantagem até o seu próximo turno', { acao: true });
  add('fugir', 'Fugir', B.chefe ? 'Impossível fugir de chefes!' : 'Tentar escapar da luta', { acao: true, off: B.chefe });
  return a;
}
const ANC_NOME = (H) => (H.ap && H.ap.anc ? H.ap.anc : 'fogo');
export function podeAgir(B, a) { const H = B.h; if (a.off) return false; if (a.acao && H.acoes <= 0) return false; if (a.bonus && H.bonus <= 0) return false; return true; }
export function alvosAtaque(B, u = B.h, alc = alcanceArma(u)) { return inimigosDe(B, u).filter((e) => cheb(e, u) <= alc && (alc <= 1 || temLOS(B, u, e))); }

function recMaxSlots(B, nv) { return (B.s && B.s.recursosMax && B.s.recursosMax.slots[nv - 1]) || B.h.slots[nv - 1]; }
// executa um comando do jogador
export function agir(B, cmd) {
  const H = B.h, evs = []; if (B.fim || ativo(B) !== H) return evs; const id = cmd.id;
  const gasta = (t) => { if (t === 'acao') H.acoes--; else H.bonus--; };
  const alvo = cmd.alvo ? porId(B, cmd.alvo) : null;
  if (id === 'atacar' || (id && id.startsWith('smite'))) {
    if (H.acoes <= 0 || !alvo || !alvo.vivo || alvo.eq === 'j') return evs; if (cheb(H, alvo) > alcanceArma(H) || (alcanceArma(H) > 1 && !temLOS(B, H, alvo))) { evs.push(msg('Fora de alcance.')); return evs; }
    gasta('acao'); ataqueHeroi(B, H, alvo, evs, { smite: id.startsWith('smite') ? parseInt(id.slice(5)) : 0, sorte: H.conds.sortePronta }); H.conds.sortePronta = false;
  } else if (id === 'magia') {
    const sp = MAGIAS[cmd.magia]; if (!sp) return evs; if (sp.bonus) { if (H.bonus <= 0) return evs; gasta('bonus'); } else { if (H.acoes <= 0) return evs; gasta('acao'); } conjurar(B, H, cmd.magia, cmd.nv, cmd.x, cmd.y, evs);
  } else if (id === 'item') { if (H.acoes <= 0) return evs; if (usarItem(B, H, cmd.idx, alvo, evs, cmd)) gasta('acao'); }
  else if (id === 'folego') { if (H.bonus <= 0 || H.cont.folego <= 0) return evs; gasta('bonus'); H.cont.folego--; evs.push(msg('Você retoma o fôlego!', 'heal')); cura(B, H, rolar('1d10', B.rng).total + H.L, evs); }
  else if (id === 'surto') { if (H.cont.surto <= 0) return evs; H.cont.surto--; H.acoes += 1; evs.push(msg('Surto de Ação! Você ganha uma ação extra.', 'spell')); }
  else if (id === 'furia') { if (H.bonus <= 0 || H.cont.furia <= 0) return evs; gasta('bonus'); if (H.cont.furia < 99) H.cont.furia--; H.conds.furia = true; evs.push({ t: 'cond', id: 'h', cond: 'furia', on: true }); evs.push(msg('FÚRIA! Seu sangue ferve.', 'crit')); }
  else if (id === 'descuidado') { H.conds.descuidado = true; evs.push(msg('Ataque Descuidado: vantagem, mas você se expõe.')); }
  else if (id === 'ardil') { if (H.bonus <= 0 || H.cont.ardil <= 0) return evs; gasta('bonus'); H.cont.ardil--; H.conds.vant = true; H.desengajou = true; evs.push(msg('Você some nas sombras: vantagem e sem ataques de oportunidade.')); }
  else if (id === 'sorte') { H.conds.sortePronta = true; evs.push(msg('Golpe de Sorte preparado.')); }
  else if (id === 'insp') { if (H.insp <= 0) return evs; H.insp--; H.conds.vant = true; evs.push(msg('Inspiração! Vantagem no próximo ataque.', 'spell')); }
  else if (id === 'recup') { if (H.acoes <= 0 || H.cont.recup <= 0) return evs; gasta('acao'); H.cont.recup--; let orc = Math.ceil(H.L / 2); const rest = [];
    for (let n = Math.min(5, H.slots.length); n >= 1; n--) { const max = recMaxSlots(B, n); while (orc >= n && H.slots[n - 1] < max) { H.slots[n - 1]++; orc -= n; rest.push(n); } } evs.push(msg(rest.length ? `Recuperação Arcana: ${rest.map((n) => n + 'º').join(', ')}.` : 'Nada a recuperar.', 'spell')); }
  else if (id === 'expulsar') { if (H.acoes <= 0) return evs; gasta('acao'); H.cont.canal--; for (const e of vivos(B, 'm').filter((x) => (x.tags || []).includes('morto') && cheb(x, H) <= 6)) { const passou = salvar(B, e, H.cd, 'SAB', evs, { magico: true }); if (passou) { evs.push(msg(`${e.nome} resiste à luz sagrada.`)); continue; }
      const dest = H.L >= 17 ? 4 : H.L >= 14 ? 3 : H.L >= 11 ? 2 : H.L >= 8 ? 1 : H.L >= 5 ? 0.5 : -1; if (e.cr <= dest) { e.hp = 1; dano(B, e, 999, 'radiante', evs, false, H); evs.push(msg(`${e.nome} é destruído pela luz!`, 'crit')); } else { e.conds.amedrontado = 2; evs.push({ t: 'cond', id: e.id, cond: 'amedrontado', on: true }); evs.push(msg(`${e.nome} foge aterrorizado!`)); } } }
  else if (id === 'preservar') { if (H.acoes <= 0) return evs; gasta('acao'); H.cont.canal--; let pool = 5 * H.L; evs.push(msg('Preservar a Vida!', 'heal')); for (const a of [H, ...aliadosDe(B, H)].filter((x) => cheb(x, H) <= 3).sort((a, b) => a.hp / hpMaxEf(a) - b.hp / hpMaxEf(b))) { const metade = Math.floor(hpMaxEf(a) / 2); const quer = Math.max(0, Math.min(pool, metade - a.hp)); if (quer > 0) { cura(B, a, quer, evs); pool -= quer; } } }
  else if (id === 'maos') { if (H.acoes <= 0 || H.cont.maos <= 0) return evs; const a = alvo && alvo.eq === 'j' ? alvo : H; if (cheb(a, H) > 1) return evs; gasta('acao'); const n = Math.min(H.cont.maos, 25, hpMaxEf(a) - a.hp); H.cont.maos -= n; evs.push(msg('Cura pelas Mãos!', 'heal')); cura(B, a, n, evs); }
  else if (id === 'sagrada') { if (H.bonus <= 0) return evs; gasta('bonus'); H.cont.canal--; H.modAtq += Math.max(1, H.M.CAR); evs.push(msg('Arma Sagrada brilha!', 'spell')); }
  else if (id === 'sopro') { if (H.acoes <= 0 || !H.sopro) return evs; gasta('acao'); H.sopro = false; const anc = ANCESTRAIS_DANO[ANC_NOME(H)] || 'fogo'; const area = { tiles: tilesCone(B, H, cmd.x, cmd.y, 3) }; const set = new Set(area.tiles.map(([x, y]) => K(x, y))); evs.push(msg('Sopro Dracônico!', 'spell')); evs.push({ t: 'aoe', de: 'h', forma: 'cone', tiles: area.tiles, dano: anc, tx: cmd.x, ty: cmd.y });
    const rol = rolar(`${2 + Math.floor((H.L - 1) / 5)}d6`, B.rng).total; for (const a of B.un.filter((x) => x.vivo && !x.saiu && x !== H && set.has(K(x.x, x.y)))) { const passou = salvar(B, a, 8 + H.prof + H.M.CON, 'DES', evs); dano(B, a, passou ? Math.floor(rol / 2) : rol, anc, evs, false, H); } }
  else if (id === 'correr') { if (H.acoes <= 0) return evs; gasta('acao'); H.movRest += H.vel; evs.push(msg('Você corre!')); }
  else if (id === 'desengajar') { if (H.acoes <= 0) return evs; gasta('acao'); H.desengajou = true; evs.push(msg('Você se desengaja: sem ataques de oportunidade.')); }
  else if (id === 'esquivar') { if (H.acoes <= 0) return evs; gasta('acao'); H.conds.esquivando = true; evs.push(msg('Você assume uma postura defensiva.')); }
  else if (id === 'fugir') { if (H.acoes <= 0 || B.chefe) return evs; gasta('acao'); const mx = Math.max(...vivos(B, 'm').map((e) => e.cr)); const dc = 10 + Math.floor(mx / 2) + (H.exaust >= 2 ? 4 : 0) + (vivos(B, 'm').filter((e) => cheb(e, H) <= 1).length > 1 ? 2 : 0); const r = jogaD20(B, false, H.exaust >= 1) + H.M.DES;
    if (r >= dc) { H.fugiu = true; B.fim = 'fuga'; evs.push(msg('Você escapa!', 'flee')); } else evs.push(msg('Você não consegue escapar!')); }
  checaFim(B, evs); return evs;
}
const ANCESTRAIS_DANO = { fogo: 'fogo', raio: 'elétrico', veneno: 'veneno', gelo: 'gelo', acido: 'ácido' };
function usarItem(B, u, idx, alvo, evs) {
  const slot = B.inv[idx]; if (!slot || slot.n <= 0) return false; const it = ITENS[slot.id]; if (!it || it.tipo !== 'consumivel') return false;
  if (it.cura) { const a = alvo && alvo.eq === 'j' && cheb(alvo, u) <= 1 ? alvo : u; evs.push(msg(`Você usa ${it.nome}.`, 'heal')); cura(B, a, rolar(it.cura, B.rng).total, evs); }
  else if (it.dano) { if (!alvo || cheb(alvo, u) > 6) { evs.push(msg('Escolha um alvo a até 6 casas.')); return false; } if (it.alvoTp && !it.alvoTp.some((t) => (alvo.tags || []).includes(t) || alvo.tp === t)) { evs.push(msg('Isso só faz efeito em mortos-vivos e ínferos.')); return false; } evs.push(msg(`Você arremessa ${it.nome}!`, 'hit')); evs.push({ t: 'atq', de: u.id, para: alvo.id, tipo: 'dist' }); const rol = rolar(it.dano, B.rng).total; const R = tilesCirculo(B, alvo.x, alvo.y, 1); const set = new Set(R.map(([x, y]) => K(x, y))); evs.push({ t: 'aoe', de: u.id, forma: 'circulo', tiles: R, dano: it.danoTipo || 'fogo', tx: alvo.x, ty: alvo.y }); for (const a of B.un.filter((x) => x.vivo && !x.saiu && set.has(K(x.x, x.y)) && x !== u)) dano(B, a, a === alvo ? rol : Math.floor(rol / 2), it.danoTipo, evs, false, u); }
  else if (it.magia) { const t = alvo || u; u.slots[it.nvMagia - 1] = (u.slots[it.nvMagia - 1] || 0) + 1; conjurar(B, u, it.magia, it.nvMagia, t.x, t.y, evs); }
  else if (it.fuga) { if (B.chefe) evs.push(msg('O chefe ignora a fumaça!')); else { u.fugiu = true; B.fim = 'fuga'; evs.push(msg('Você some em uma nuvem de pó.', 'flee')); } }
  else if (it.insp) { u.insp++; evs.push(msg('Você sente a inspiração fluindo.')); }
  else { evs.push(msg('Isso não pode ser usado em combate.')); return false; }
  slot.n--; B.usados.push(slot.id); return true;
}

// ---------- conversa: persuasão, intimidação, suborno, doma ----------
const falaDe = (u, tipo, B) => msg(`${u.nome}: "${linhasConversa(u.tmp, tipo, B.rng)}"`);
export const custoSuborno = (a) => { const T = TEMPERAMENTOS[a.tmp] || { sub: 1 }; return Math.max(10, Math.round((15 + (a.cr || 0) * 30) * (T.sub || 1))); };
export function opcoesConversa(B, alvo) {
  const H = B.h; const mod = H.M.CAR + H.prof; const out = []; if (!alvo || !alvo.vivo) return out;
  const racial = (k) => (H.raca && H.raca[k] ? 2 : 0); const T = TEMPERAMENTOS[alvo.tmp] || TEMPERAMENTOS.agressivo;
  const ferido = alvo.hp / alvo.hpMax; const base = 10 + Math.floor(alvo.cr / 2) + (alvo.dc || 0) + (alvo.chefe ? 5 : 0);
  if (alvo.racional) {
    out.push({ id: 'persuadir', rot: 'Persuadir', desc: alvo.chefe ? 'Chefes não se rendem, mas podem hesitar' : 'Apele ao bom senso e ao interesse dele', mod: mod + racial('persuadir'), dc: base - Math.floor((alvo.atitude || 0) / 25) });
    out.push({ id: 'intimidar', rot: 'Intimidar', desc: 'Mostre que o melhor é ir embora', mod: Math.max(H.M.CAR, H.M.FOR) + H.prof + racial('intimidar'), dc: Math.ceil(8 + alvo.cr + (ferido > 0.6 ? 3 : ferido < 0.35 ? -3 : 0) + T.susto + (alvo.chefe ? 4 : 0)) });
    const aceita = !alvo.chefe && T.sub > 0; out.push({ id: 'subornar', rot: 'Subornar', desc: aceita ? `Pagar ${custoSuborno(alvo)} PO para que ele vá embora` : 'Ele não se vende', mod: 99, dc: aceita ? 0 : 99, custo: custoSuborno(alvo) });
  }
  if ((alvo.tags || []).includes('fera') && !alvo.racional) out.push({ id: 'domar', rot: 'Domar', desc: 'Acalme a fera e ganhe um companheiro', mod: H.M.SAB + H.prof, dc: Math.ceil(11 + alvo.cr * 2 - (ferido < 0.5 ? 2 : 0)) });
  return out;
}
export function conversar(B, alvo, opcId, op2 = {}) {
  const H = B.h, evs = []; const livre = !!op2.livre; if ((!livre && H.acoes <= 0) || !alvo || !alvo.vivo || B.fim) return { evs, res: 'nada' };
  if (!livre && cheb(H, alvo) > 6) { evs.push(msg('Chegue mais perto para conversar.')); return { evs, res: 'nada' }; }
  const op = opcoesConversa(B, alvo).find((o) => o.id === opcId); if (!op) return { evs, res: 'nada' };
  if (!livre) H.acoes--; let res = 'falhou';
  if (opcId === 'subornar') {
    if (op.dc >= 99) { evs.push(falaDe(alvo, 'suborno', B)); alvo.conds.irritado = true; res = 'falhou'; }
    else if ((B.s.heroi.ouro || 0) < op.custo) { evs.push(msg('Você não tem ouro suficiente.')); if (!livre) H.acoes++; return { evs, res: 'nada' }; }
    else { B.s.heroi.ouro -= op.custo; B.subornou = (B.subornou || 0) + op.custo; evs.push(falaDe(alvo, 'suborno', B)); sair(B, alvo, 'subornado', evs); res = 'saiu'; }
  } else {
    const r = d20(B.rng); const tot = r + op.mod; const crit = r === 20; const ok = crit || (r !== 1 && tot >= op.dc);
    evs.push({ t: 'teste', alvo: alvo.id, rolagem: r, total: tot, dc: op.dc, ok, tipo: opcId });
    if (ok) {
      if (opcId === 'persuadir') {
        if (alvo.chefe) { alvo.conds.pacificado = 2; res = 'abalado'; evs.push(falaDe(alvo, 'ok', B)); evs.push(msg(`${alvo.nome} hesita... mas não vai abandonar o posto.`)); }
        else { alvo.atitude += 40 + Math.max(0, tot - op.dc) * 3 + (crit ? 25 : 0); evs.push(falaDe(alvo, 'ok', B));
          if (alvo.atitude >= 100 && alvo.recrutavel) { converter(B, alvo, evs, 'convertido'); res = 'convertido'; }
          else if (alvo.atitude >= 60) { sair(B, alvo, 'rendeu', evs); res = 'rendeu'; evs.push(msg(`${alvo.nome} baixa as armas e se rende.`)); }
          else { alvo.conds.pacificado = 2; res = 'abalado'; evs.push(msg(`${alvo.nome} hesita e abaixa a guarda...`)); } }
      } else if (opcId === 'intimidar') {
        if (alvo.tmp === 'fanatico' || alvo.chefe) { alvo.conds.amedrontado = 2; res = 'abalado'; evs.push(falaDe(alvo, 'medo', B)); evs.push(msg(`${alvo.nome} treme, mas segue lutando!`)); }
        else { evs.push(falaDe(alvo, 'medo', B)); sair(B, alvo, 'fugiu', evs); res = 'fugiu'; evs.push(msg(`${alvo.nome} larga tudo e foge!`)); }
      } else if (opcId === 'domar') { converter(B, alvo, evs, 'domado'); alvo.recrutavel = true; res = 'domado'; }
    } else { alvo.paciencia--; alvo.conds.irritado = true; res = 'falhou'; evs.push(falaDe(alvo, opcId === 'intimidar' ? 'desacato' : 'no', B)); if (opcId === 'intimidar') alvo.atitude = Math.max(0, alvo.atitude - 20); if (opcId === 'domar') evs.push(msg('A fera se irrita com a tentativa.')); }
  }
  checaFim(B, evs); return { evs, res };
}
function sair(B, u, como, evs) { u.saiu = true; B.baixas.push({ id: u.id, nome: u.nome, mon: u.mono, como, u }); evs.push({ t: 'sai', id: u.id, como }); }

// ---------- turnos ----------
function iniciaTurno(B, u, evs) {
  u.acoes = 1; u.bonus = 1; u.reacao = 1; u.movRest = Math.max(1, (u.vel || 6) - (u.conds.lento ? Math.floor(u.vel / 2) : 0)); if (u.heroi) { if (u.derrubado) { u.derrubado = false; u.movRest = Math.max(1, Math.floor(u.movRest / 2)); } if (u.preso) { const rs = d20(B.rng) + Math.max(u.M.FOR, u.M.DES); if (rs >= u.preso) { u.preso = 0; evs.push(msg('Você se desvencilha!')); } else { u.movRest = 0; evs.push(msg('Você continua agarrado.')); } } } u.desengajou = false; u.furtivoUsado = false; u.conds.descuidadoAtivo = false; u.esq = false;
  if (u.heroi) { if (u.regen && u.hp < hpMaxEf(u)) cura(B, u, Math.min(u.regen, hpMaxEf(u) - u.hp), evs); u.conds.esquivando = false; if (u.conds.descuidado) u.conds.descuidado = false;
    if (u.conds.armaEsp && !B.fim) { const alvo = inimigosDe(B, u).filter((e) => cheb(e, u) <= 6 && temLOS(B, u, e)).sort((a, b) => cheb(a, u) - cheb(b, u))[0]; if (alvo) { const r = d20(B.rng); if (r + u.atqMagia >= alvo.ca || r === 20) { evs.push(msg('A Arma Espiritual golpeia!', 'hit')); dano(B, alvo, rolar(`1d8+${u.modConj}`, B.rng, r === 20).total, 'força', evs, r === 20, u); } else evs.push(msg('A Arma Espiritual erra.', 'miss')); } } }
  else { u.conds.esquivando = false; for (const k of ['pacificado', 'amedrontado']) if (u.conds[k] > 0) { u.conds[k]--; if (!u.conds[k]) evs.push({ t: 'cond', id: u.id, cond: k, on: false }); } }
}
// avança a ordem de iniciativa até o próximo turno do herói (ou fim do combate)
export function avancar(B, evs = []) {
  let guard = 0;
  while (!B.fim && guard++ < 400) {
    const u = ativo(B); if (!u) { B.i = 0; continue; } if (!u.vivo || u.saiu) { passaVez(B); continue; }
    if (u.heroi && B.turnoIniciado === u.id + ':' + B.rodada) return evs; // já é a vez dele (aguardando comandos)
    B.turnoIniciado = u.id + ':' + B.rodada; evs.push({ t: 'turno', id: u.id, rodada: B.rodada }); iniciaTurno(B, u, evs);
    if (B.fim) break;
    if (u.heroi) { if (u.perdeTurno) { u.perdeTurno = false; evs.push(msg('Você está paralisado e perde o turno!')); u.acoes = 0; u.movRest = 0; passaVez(B); continue; } return evs; }
    turnoIA(B, u, evs); if (B.fim) break; passaVez(B);
  }
  return evs;
}
function passaVez(B) { B.i++; if (B.i >= B.ordem.length) { B.i = 0; B.rodada++; for (const u of B.un) if (u.vivo && u.eq === 'm' && u.esp && u.esp.sopro && !u.sopro && !(u.tags || []).includes('humanoide') && B.rng() < 0.33) u.sopro = true; } B.turnoIniciado = null; }
export function fimTurno(B) { const evs = []; if (B.fim || ativo(B) !== B.h) return evs; passaVez(B); avancar(B, evs); return evs; }

// ---------- IA de monstros e aliados ----------
function pontuaAlvo(B, u, e) { let s = -cheb(u, e) * 2; if (e.heroi) s += 2; s += (1 - e.hp / hpMaxEf(e)) * 3; if (incapaz(e)) s += 1; return s; }
function turnoIA(B, u, evs) {
  const esp = u.esp || {};
  if (u.conds.surpreso) { u.conds.surpreso = false; evs.push(msg(`${u.nome} foi pego de surpresa.`)); return; }
  if (u.conds.dormindo) { evs.push(msg(`${u.nome} dorme.`)); return; }
  if (u.conds.perde > 0) { u.conds.perde--; evs.push(msg(`${u.nome} perde o turno.`)); return; }
  u.rodada++;
  if (esp.regen && u.hp < u.hpMax && !u.queimou) { const n = Math.min(esp.regen, u.hpMax - u.hp); u.hp += n; evs.push({ t: 'cura', id: u.id, n }); } u.queimou = false;
  const H = B.h;
  if (u.eq === 'm') {
    if (H.conds.guardioes && cheb(H, u) <= 2) { const d = rolar('3d8', B.rng).total; const passou = salvar(B, u, H.cd, 'SAB', evs, {}); dano(B, u, passou ? Math.floor(d / 2) : d, 'radiante', evs, false, H); evs.push(msg('Guardiões Espirituais ferem o inimigo.')); if (!u.vivo) return; }
    if (esp.presenca && u.rodada === 1 && !H.medoUsado) { H.medoUsado = true; if (!salvar(B, H, esp.presenca.dc, 'SAB', evs, { medo: true })) { H.letargia = Math.min(5, H.letargia + 2); evs.push(msg(`A presença de ${u.nome} paralisa sua coragem (−2 em ataques).`, 'spell')); } }
    if (esp.letargia && cheb(H, u) <= 6) { const r = d20(B.rng) + H.M.CON + (H.conds.bencao ? 2 : 0); if (r < esp.letargia.dc) { H.letargia = Math.min(5, H.letargia + 1); evs.push(msg('A Aura de Letargia pesa em seus músculos (−1 em ataques).')); } }
    if (esp.inercia && u.rodada % esp.inercia.cada === 0 && cheb(H, u) <= 8) { const r = d20(B.rng) + H.M.CON; if (r < esp.inercia.dc) { H.perdeTurno = true; evs.push(msg('INÉRCIA! O tempo congela ao seu redor...', 'spell')); } else evs.push(msg('Você resiste à Inércia!')); }
    if (esp.olhar && cheb(H, u) <= 7 && temLOS(B, u, H)) { const r = d20(B.rng) + H.M.CON; if (r < esp.olhar.dc) { H.perdeTurno = true; evs.push(msg('O olhar petrifica seus músculos!')); } }
    if (u.conds.pacificado > 0) { evs.push(msg(`${u.nome} hesita e não ataca.`)); return; }
  }
  // fuga por covardia / medo
  const frac = u.hp / hpMaxEf(u);
  if (u.conds.amedrontado > 0 || (u.eq === 'm' && u.racional && (u.arq === 'covarde' || u.tmp === 'covarde') && frac < 0.3 && !u.chefe)) { fugirDe(B, u, evs); return; }
  const alvos = inimigosDe(B, u); if (!alvos.length) return;
  // sopro / magia em área
  if (esp.sopro && u.sopro && B.rng() < 0.6) { if (sopro(B, u, alvos, evs)) { u.sopro = false; return; } }
  const dist = u.atq.length && u.atq.every((a) => a.alc > 1);
  const alc = dist ? Math.max(...u.atq.map((a) => a.alc)) : 1;
  // escolhe alvo
  let alvo = alvos.slice().sort((a, b) => pontuaAlvo(B, u, b) - pontuaAlvo(B, u, a))[0]; if (u.eq === 'm' && u.rodada === 1 && B.rng() < 0.5) alvo = H;
  const cadaAtq = () => u.atq.filter((a) => cheb(u, alvo) <= a.alc && (a.alc === 1 || temLOS(B, u, alvo)));
  // mover
  if (cadaAtq().length === 0) irAte(B, u, alvo, alc, dist, evs);
  if (!alvo.vivo) return;
  let ataques = cadaAtq(); if (!ataques.length && u.movRest <= 0) { /* sem alcance */ }
  if (!ataques.length) { // tenta corrida
    irAte(B, u, alvo, alc, dist, evs, true); ataques = cadaAtq();
  }
  for (const a of ataques) { if (B.fim || !alvo.vivo || !u.vivo) break; ataqueUnidade(B, u, a, alvo, evs); }
  // arqueiro que está colado se afasta se sobra movimento
  void dist;
}
function irAte(B, u, alvo, alc, dist, evs, corrida = false) {
  if (corrida) u.movRest += u.vel; const R = alcance(B, u, u.movRest); let melhor = null, bs = -1e9;
  const emAlc = (x, y) => cheb({ x, y }, alvo) <= alc && (alc <= 1 || temLOS(B, { x, y }, alvo));
  for (const [k, d] of R.dist) { const x = Math.floor(k / 1000), y = k % 1000; if (d > 0 && unidadeEm(B, x, y)) continue; let s = 0;
    if (emAlc(x, y)) { s += 50 - d * 0.5; if (dist) { const dd = cheb({ x, y }, alvo); s += Math.min(dd, 5) * 1.5; const adj = inimigosDe(B, u).filter((e) => cheb(e, { x, y }) <= 1).length; s -= adj * 6; } else { const flanco = aliadosDe(B, u).some((a) => cheb(a, alvo) <= 1); s += flanco ? 2 : 0; } }
    else s = -cheb({ x, y }, alvo) * 2 - d * 0.1;
    if (s > bs) { bs = s; melhor = [x, y]; } }
  if (!melhor || (melhor[0] === u.x && melhor[1] === u.y)) return;
  const cam = caminhoAte(R, u, melhor[0], melhor[1]); if (!cam) return; const passos = [];
  for (const [nx, ny] of cam) { provocar(B, u, { x: u.x, y: u.y }, { x: nx, y: ny }, evs); if (!u.vivo || B.fim) break; u.x = nx; u.y = ny; u.movRest--; passos.push([nx, ny]); }
  if (passos.length) evs.push({ t: 'mov', id: u.id, caminho: passos });
}
function fugirDe(B, u, evs) {
  const R = alcance(B, u, u.movRest + (u.vel || 6)); const ini = inimigosDe(B, u); let melhor = null, bs = -1;
  for (const [k, d] of R.dist) { const x = Math.floor(k / 1000), y = k % 1000; if (d > 0 && unidadeEm(B, x, y)) continue; const s = Math.min(...ini.map((e) => cheb(e, { x, y }))); if (s > bs) { bs = s; melhor = [x, y]; } }
  if (melhor && (melhor[0] !== u.x || melhor[1] !== u.y)) { const cam = caminhoAte(R, u, melhor[0], melhor[1]); if (cam) { u.x = melhor[0]; u.y = melhor[1]; evs.push({ t: 'mov', id: u.id, caminho: cam }); } }
  if (u.eq === 'm' && u.conds.amedrontado <= 0 && bs >= 7) { u.saiu = true; B.baixas.push({ id: u.id, nome: u.nome, mon: u.mono, como: 'fugiu', u }); evs.push({ t: 'sai', id: u.id, como: 'fugiu' }); evs.push(msg(`${u.nome} foge da luta!`)); checaFim(B, evs); }
  else evs.push(msg(`${u.nome} recua com medo.`));
}
function sopro(B, u, alvos, evs) {
  const sp = u.esp.sopro; const alvo = alvos.slice().sort((a, b) => pontuaAlvo(B, u, b) - pontuaAlvo(B, u, a))[0]; const forma = sp.forma || (/bola/i.test(sp.n) ? 'bola' : 'cone'); const bola = forma === 'bola'; const len = sp.tam ? Math.min(6, Math.max(3, Math.round(sp.tam * 0.7))) : (u.cr >= 10 ? 5 : 4); const raio = sp.tam ? Math.max(1, Math.round(sp.tam / 2)) : 2;
  let area; if (bola) { if (cheb(u, alvo) > 8) return false; area = { tiles: tilesCirculo(B, alvo.x, alvo.y, raio), tx: alvo.x, ty: alvo.y }; } else if (forma === 'linha') { if (cheb(u, alvo) > len + 1) return false; area = { tiles: tilesLinha(B, u, alvo.x, alvo.y, len), tx: alvo.x, ty: alvo.y }; } else { if (cheb(u, alvo) > len + 1) return false; area = { tiles: tilesCone(B, u, alvo.x, alvo.y, len), tx: alvo.x, ty: alvo.y }; }
  const set = new Set(area.tiles.map(([x, y]) => K(x, y))); const atingidos = B.un.filter((x) => x.vivo && !x.saiu && x !== u && set.has(K(x.x, x.y))); if (!atingidos.some((x) => x.eq !== u.eq)) return false;
  evs.push(msg(`${u.nome} usa ${sp.n}!`, 'spell')); evs.push({ t: 'aoe', de: u.id, forma: bola ? 'circulo' : forma === 'linha' ? 'linha' : 'cone', tiles: area.tiles, dano: sp.t, tx: area.tx, ty: area.ty });
  const rol = Math.round(rolar(sp.d, B.rng).total * (u.dm || 1));
  for (const a of atingidos) { if (a.eq === u.eq) continue; const evasao = a.heroi && a.cls === 'ladino' && a.L >= 7 && sp.atr === 'DES'; const passou = salvar(B, a, sp.dc, sp.atr, evs, { magico: bola }); dano(B, a, evasao ? (passou ? 0 : Math.floor(rol / 2)) : passou ? (sp.meio === false ? 0 : Math.floor(rol / 2)) : rol, sp.t, evs, false, u); if (B.fim) break; }
  return true;
}

// ---------- IA do herói (botão Auto e simulação) ----------
function melhorCirculo(B, u, id) {
  const g = geoDe(id); let melhor = null, bs = 0;
  for (const m of mirasValidas(B, u, id)) { const a = areaMagia(B, u, id, m.x, m.y); let s = 0; for (const x of a.unidades) s += x.eq === u.eq ? -(x.heroi ? 6 : 3) : 1 + Math.min(1, x.hp / 30); if (s > bs) { bs = s; melhor = { x: m.x, y: m.y, s }; } }
  void g; return melhor;
}
export function iaHeroi(B) { // devolve a próxima ação (ou null para encerrar o turno)
  const H = B.h; if (H.acoes <= 0 && H.bonus <= 0) return null; const inim = vivos(B, 'm').filter((e) => !e.conds.pacificado || true); if (!inim.length) return null;
  const mags = magiasDoHeroi(B), acts = acoesHeroi(B).filter((a) => podeAgir(B, a)), ids = acts.map((a) => a.id);
  const alvoPerto = inim.slice().sort((a, b) => cheb(a, H) - cheb(b, H))[0]; const pot = B.inv.findIndex((x) => x.n > 0 && ITENS[x.id] && ITENS[x.id].cura);
  const hpf = H.hp / hpMaxEf(H);
  if (hpf < 0.35 && pot >= 0 && H.acoes > 0) return { id: 'item', idx: pot };
  if (hpf < 0.4 && ids.includes('folego')) return { id: 'folego' };
  if (hpf < 0.4 && ids.includes('maos')) return { id: 'maos', alvo: 'h' };
  if (ids.includes('furia') && cheb(alvoPerto, H) <= 8) return { id: 'furia' };
  if (ids.includes('ardil') && H.cls === 'ladino' && cheb(alvoPerto, H) <= H.movRest + 1) return { id: 'ardil' };
  if (H.acoes === 1 && ids.includes('surto') && alvoPerto.hp > 20) return { id: 'surto' };
  if (H.acoes <= 0) return null;
  if (H.cls === 'clerigo' || H.cls === 'mago') {
    if (H.cls === 'clerigo') { const fer = [H, ...aliadosDe(B, H)].filter((a) => a.hp < hpMaxEf(a) * 0.45).sort((a, b) => a.hp / hpMaxEf(a) - b.hp / hpMaxEf(b))[0]; if (fer) { const cur = mags.filter((x) => x.tipo === 'cura' && x.circulos.length && !x.bonus && x.geo.f === 'aliado').sort((a, b) => b.nv - a.nv)[0]; if (cur && cheb(fer, H) <= 1) return { id: 'magia', magia: cur.id, nv: cur.circulos[0], x: fer.x, y: fer.y }; } }
    if (H.cls === 'clerigo') { const g = mags.find((x) => x.id === 'guardioes' && x.circulos.length); if (g && !H.conds.guardioes && (alvoPerto.hp > 25 || B.chefe)) return { id: 'magia', magia: 'guardioes', nv: g.circulos[0], x: H.x, y: H.y }; const a = mags.find((x) => x.id === 'arma_esp' && x.circulos.length); if (a && !H.conds.armaEsp && H.bonus > 0 && (alvoPerto.hp > 25 || B.chefe)) return { id: 'magia', magia: 'arma_esp', nv: a.circulos[0], x: H.x, y: H.y }; }
    const dmg = mags.filter((x) => ['salva', 'atq', 'auto'].includes(x.tipo) && x.nv > 0 && x.circulos.length).sort((a, b) => b.nv - a.nv);
    for (const sp of dmg) { if (!(alvoPerto.hp > 18 || B.chefe || inim.length > 1)) break; if (sp.geo.f === 'circulo' || sp.geo.f === 'cone' || sp.geo.f === 'linha') { const m = melhorCirculo(B, H, sp.id); if (m && m.s >= 1.8) return { id: 'magia', magia: sp.id, nv: sp.circulos[0], x: m.x, y: m.y }; } else { const alvo = inim.filter((e) => cheb(e, H) <= sp.geo.alc && temLOS(B, H, e)).sort((a, b) => b.hp - a.hp)[0]; if (alvo) return { id: 'magia', magia: sp.id, nv: sp.circulos[0], x: alvo.x, y: alvo.y }; } }
    const can = mags.filter((x) => x.nv === 0 && ['atq', 'salva'].includes(x.tipo))[0]; if (can) { const alvo = inim.filter((e) => cheb(e, H) <= 8 && temLOS(B, H, e)).sort((a, b) => a.hp - b.hp)[0]; if (alvo) return { id: 'magia', magia: can.id, nv: 0, x: alvo.x, y: alvo.y }; }
  }
  if (H.cls === 'paladino') { const f = mags.find((x) => x.id === 'favor' && x.circulos.length); if (f && !H.conds.favor && B.chefe && H.bonus > 0) return { id: 'magia', magia: 'favor', nv: f.circulos[0], x: H.x, y: H.y }; }
  const alc = alcanceArma(H); const alvos = alvosAtaque(B, H, alc);
  if (alvos.length) { const alvo = alvos.sort((a, b) => a.hp - b.hp)[0]; const sm = acts.filter((a) => a.id.startsWith('smite')).pop(); if (H.cls === 'paladino' && sm && alvo.hp > 25) return { id: sm.id, alvo: alvo.id }; return { id: 'atacar', alvo: alvo.id }; }
  return { id: 'mover', alvo: alvoPerto.id };
}
export function aproximar(B, u, alvo, alc) { // move o herói em direção ao alvo até ficar ao alcance; devolve evs
  const R = alcance(B, u, u.movRest); let melhor = null, bs = 1e9;
  for (const [k, d] of R.dist) { const x = Math.floor(k / 1000), y = k % 1000; if (d > 0 && unidadeEm(B, x, y)) continue; const dd = cheb({ x, y }, alvo); const ok = dd <= alc && (alc <= 1 || temLOS(B, { x, y }, alvo)); const adj = inimigosDe(B, u).filter((e) => cheb(e, { x, y }) <= 1 && e !== alvo).length; const s = (ok ? 0 : 100) + dd * (alc > 1 ? -0.3 : 1) + d * 0.2 + adj * (alc > 1 ? 4 : 0.5) + (alc > 1 && dd < 3 ? 6 : 0); if (s < bs) { bs = s; melhor = [x, y]; } }
  if (!melhor || (melhor[0] === u.x && melhor[1] === u.y)) return []; return moverHeroi(B, melhor[0], melhor[1]);
}
export function turnoAutoHeroi(B, evs = []) {
  let guard = 0; const H = B.h;
  while (!B.fim && ativo(B) === H && guard++ < 16) {
    const a = iaHeroi(B); if (!a) break;
    if (a.id === 'mover') { const alvo = porId(B, a.alvo); const alc = alcanceArma(H); const antes = H.movRest; evs.push(...aproximar(B, H, alvo, alc)); if (H.movRest === antes) { if (H.acoes > 0 && H.cont && H.acoes === 1 && !H.dashed) { H.dashed = true; evs.push(...agir(B, { id: 'correr' })); evs.push(...aproximar(B, H, alvo, alc)); if (alvosAtaque(B, H, alc).length === 0) break; } else break; } continue; }
    if (a.id === 'atacar' || a.id.startsWith('smite')) { const alvo = porId(B, a.alvo); if (alcanceArma(H) > 1 && cheb(alvo, H) <= 1) { /* arqueiro colado: tenta recuar antes */ const R = alcance(B, H, H.movRest); let melhor = null, bs = -1; for (const [k] of R.dist) { const x = Math.floor(k / 1000), y = k % 1000; if (unidadeEm(B, x, y) && !(x === H.x && y === H.y)) continue; const s = Math.min(...inimigosDe(B, H).map((e) => cheb(e, { x, y }))); if (s > bs) { bs = s; melhor = [x, y]; } } if (melhor && bs >= 3 && !H.desengajou) { H.desengajou = true; evs.push(...moverHeroi(B, melhor[0], melhor[1])); } } }
    const r = agir(B, a); evs.push(...r); if (!r.length && (a.id !== 'atacar')) break;
  }
  H.dashed = false; return evs;
}
// ---------- simulação headless ----------
export function simular(s, inimigos, g, rng, opts = {}) {
  const { B } = novaBatalha(s, inimigos, g, { rng, ...opts }); let t = 0;
  while (!B.fim && t++ < 120) { if (ativo(B) !== B.h) { avancar(B, []); continue; } turnoAutoHeroi(B, []); if (!B.fim) fimTurno(B); }
  return B;
}
