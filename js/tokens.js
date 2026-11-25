// Tokens em vista superior (estilo dnd5e): herói e NPCs são montados por camadas webp (cores da personalização aplicadas por
// multiplicação); monstros usam um token pré-pintado por criatura. Sem animação de andar: o token só gira para onde olha.
// Se alguma imagem ainda não carregou (ou falhou), as funções devolvem null e o jogo usa o sprite antigo como reserva.
import { RACAS, KITS } from './cosmeticos.js';
import { MONSTROS } from './srd.js';

const BASE = 'assets/tokens/';
const IMG = new Map();
function carregar(caminho) {
  let e = IMG.get(caminho);
  if (!e) { const img = new Image(); e = { img, ok: false, erro: false }; img.onload = () => { e.ok = true; }; img.onerror = () => { e.erro = true; }; img.decoding = 'async'; img.src = caminho; IMG.set(caminho, e); }
  return e;
}
const cv = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---------- pré-carga ----------
export function precarregarHeroi() {
  const n = ['braco', 'capa_curta', 'capa_longa', 'escudo_1', 'escudo_2', 'escudo_3', 'presas', 'cabeca_dragao', 'orelha_longa', 'orelha_pequena', 'orelha_pontuda', 'orelha_redonda'];
  for (let i = 0; i < 6; i++) n.push('cabeca_' + i); for (let i = 0; i < 4; i++) n.push('chifre_' + i); for (let i = 1; i < 24; i++) n.push('cabelo_' + i); for (let i = 1; i < 12; i++) n.push('barba_' + i); for (let i = 1; i < 10; i++) n.push('acess_' + i);
  for (const k of [1, 2]) { for (let i = 0; i < 8; i++) n.push(`roupa_${i}_${k}`); for (const t of ['couro', 'escamas', 'malha', 'placa']) n.push(`peito_${t}_${k}`); for (const o of ['capuz', 'chifre', 'pontudo', 'redondo']) n.push(`ombro_${o}_${k}`); for (const e of ['aberto', 'capuz', 'chapeu', 'chifres', 'coroa', 'crista', 'fechado']) n.push(`elmo_${e}_${k}`); }
  for (const a of ['adaga', 'arcoCurto', 'arcoLongo', 'cajado', 'cimitarra', 'espadaCurta', 'espadaGrande', 'espadaLonga', 'maca', 'machadinha', 'machadoBatalha', 'machadoGrande', 'martelo', 'rapieira']) n.push('arma_' + a);
  for (const x of n) carregar(`${BASE}heroi/${x}.webp`);
}


// Sombra projetada pela própria silhueta (sem moldura, sem disco): o token é só o personagem.
export function comSombraSilhueta(src, dx = 4, dy = 5, a = 0.32) {
  const w = src.width, h = src.height, o = cv(w, h), x = o.getContext('2d'); const s = cv(w, h), sc = s.getContext('2d');
  sc.drawImage(src, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = `rgba(8,5,16,${a})`; sc.fillRect(0, 0, w, h);
  x.drawImage(s, dx, dy); x.drawImage(src, 0, 0); return o;
}

// ---------- herói / NPC por camadas ----------
const tingir = (img, cor) => {
  const c = cv(128), x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'multiply'; x.fillStyle = cor; x.fillRect(0, 0, 128, 128);
  x.globalCompositeOperation = 'destination-in'; x.drawImage(img, 0, 0); return c;
};
function kitDe(ap, vis) {
  const cls = vis.cls || 'guerreiro'; const cat = vis.cat || (cls === 'mago' || cls === 'clerigo' ? 'veste' : null); if (!cat) return null;
  const k = KITS[cls]; const lista = k && (k[cat] || k.veste || k.leve || k.media || k.pesada); if (!lista) return null; return lista[(ap.estilo | 0) % lista.length];
}
// id de arma do jogo (inclui sufixo mágico _1.._3) → camada do token
const ARMA_TOK = { cajado: 'cajado', adaga: 'adaga', maca: 'maca', cimitarra: 'cimitarra', espadaCurta: 'espadaCurta', machadinha: 'machadinha', rapieira: 'rapieira', machadoBatalha: 'machadoBatalha', martelo: 'martelo', espadaLonga: 'espadaLonga', arcoCurto: 'arcoCurto', arcoLongo: 'arcoLongo', espadaGrande: 'espadaGrande', machadoGrande: 'machadoGrande' };
const ARMA_NOME = [[/montante|greatsword|espada grande/i, 'espadaGrande'], [/greataxe|machado grande/i, 'machadoGrande'], [/battleaxe|machado de batalha/i, 'machadoBatalha'], [/handaxe|machadinha/i, 'machadinha'], [/\baxe\b|machado/i, 'machadoBatalha'],
  [/warhammer|maul|martelo|hammer/i, 'martelo'], [/mace|maça|maca|clava|club|morning/i, 'maca'], [/quarterstaff|staff|cajado|bastão|bastao/i, 'cajado'], [/scimitar|cimitarra/i, 'cimitarra'], [/rapier|rapieira/i, 'rapieira'], [/dagger|adaga|dart|dardo/i, 'adaga'],
  [/shortsword|espada curta/i, 'espadaCurta'], [/longsword|espada longa|espada|sword/i, 'espadaLonga'], [/longbow|arco longo/i, 'arcoLongo'], [/bow|arco|crossbow|besta|sling|funda/i, 'arcoCurto'], [/spear|lança|lanca|javelin|pike|glaive|halberd/i, 'cajado']];
export const ARMA_CLASSE = { guerreiro: 'espadaLonga', barbaro: 'machadoGrande', ladino: 'rapieira', mago: 'cajado', clerigo: 'maca', paladino: 'espadaLonga' };
export function armaDeItem(it) {
  if (!it) return null; const id = String(it.id || '').replace(/_[123]$/, ''); if (ARMA_TOK[id]) return ARMA_TOK[id];
  const nome = `${it.id || ''} ${it.nome || ''} ${it.en || ''}`; for (const [re, a] of ARMA_NOME) if (re.test(nome)) return a; return 'espadaCurta';
}
function camadas(ap, vis, arma) {
  const R = RACAS[ap.raca] || RACAS.humano; const L = []; const kit = kitDe(ap, vis); const add = (n, cor, larg) => L.push([n, cor || null, !!larg]);
  
  if (ap.capa) add('capa_' + (ap.capa === 1 ? 'curta' : 'longa'), vis.capaC || '#7a1f1a', true);
  add('braco', ap.pele, true); const ro = (ap.roupa | 0) % 8; add(`roupa_${ro}_1`, ap.roupa1, true); add(`roupa_${ro}_2`, ap.roupa2, true);
  if (kit) {
    const pt = kit.tipo === 'pele' ? 'couro' : kit.tipo; if (pt !== 'tecido') { add(`peito_${pt}_1`, ap.arm1, true); add(`peito_${pt}_2`, ap.arm2, true); }
    if (kit.ombro && kit.ombro !== 'nenhum') { add(`ombro_${kit.ombro}_1`, ap.arm1, true); add(`ombro_${kit.ombro}_2`, kit.ombro === 'chifre' ? null : ap.arm2, true); }
  }
  if (vis.escudo) { add('escudo_1', ap.arm2); add('escudo_2', ap.arm1); add('escudo_3'); }
  if (arma) add('arma_' + arma);
  const orelha = R.orelha; if (orelha && orelha !== 'nenhuma') add('orelha_' + orelha, ap.pele);
  const drag = ap.raca === 'draconato'; add(drag ? 'cabeca_dragao' : `cabeca_${(ap.rosto | 0) % 6}`, ap.pele);
  if (ap.raca === 'meioorc') add('presas');
  const helm = !!(kit && kit.elmo && kit.elmo !== 'nenhum' && ap.elmo); const fechado = helm && ['fechado', 'crista', 'chifres', 'capuz'].includes(kit.elmo);
  if (!drag && ap.barba && !(helm && kit.elmo === 'fechado')) add(`barba_${ap.barba}`, ap.barbaCor || ap.cabeloCor);
  if (!drag && ap.cabelo && !fechado) add(`cabelo_${ap.cabelo}`, ap.cabeloCor);
  if (ap.raca === 'tiefling') add(`chifre_${(ap.chifre | 0) % 4}`);
  if (helm) { add(`elmo_${kit.elmo}_1`, ap.arm1); add(`elmo_${kit.elmo}_2`, ap.arm2); } else if (ap.acess) add(`acess_${ap.acess}`);
  return L;
}
const cacheHeroi = new Map();
// Devolve um canvas 128×128 (token voltado para cima) ou null se as camadas ainda estiverem carregando.
export function tokenPessoa(ap, vis = {}, arma = null) {
  if (!ap) return null; const lista = camadas(ap, vis, arma); const chave = JSON.stringify(lista) + '|' + (ap.corpo | 0) + '|' + (ap.raca);
  const hit = cacheHeroi.get(chave); if (hit) return hit;
  const es = lista.map(([n, cor, larg]) => [carregar(`${BASE}heroi/${n}.webp`), cor, larg]);
  if (es.some(([e]) => !e.ok && !e.erro)) return null;
  const corpo = cv(128), cx = corpo.getContext('2d'); const sx = 0.9 + (ap.corpo | 0) * 0.08 + ((RACAS[ap.raca] || {}).larg || 0) * 0.008;
  for (const [e, cor, larg] of es) {
    if (!e.ok) continue; let im = cor ? tingir(e.img, cor) : e.img;
    if (larg && sx !== 1) { const w = Math.round(128 * sx); cx.drawImage(im, (128 - w) / 2, 0, w, 128); } else cx.drawImage(im, 0, 0);
  }
  const out = comSombraSilhueta(corpo); if (cacheHeroi.size > 200) cacheHeroi.clear(); cacheHeroi.set(chave, out); return out;
}
// Token do herói jogável a partir do estado (usa a arma equipada).
export function tokenHeroi(s, ap, vis, itens) { return tokenPessoa(ap, vis, armaDeItem(itens[s.equip && s.equip.arma])); }
export function escalaPessoa(ap) { const R = RACAS[ap.raca] || RACAS.humano; return 1 + ((ap.altura | 0) + (R.alt || 0) * 0.5) * 0.028; }

// ---------- monstros ----------
const VELHO = { rato: 'giant_rat', morcego: 'bat', kobold: 'kobold', goblin: 'goblin', bandido: 'bandit', cultista: 'cultist', esqueleto: 'skeleton', zumbi: 'zombie', lobo: 'wolf', aranhaLobo: 'giant_wolf_spider', orc: 'orc', hobgoblin: 'hobgoblin', limoCinza: 'gray_ooze', bugurso: 'bugbear', aranha: 'giant_spider', carnical: 'ghoul', loboAtroz: 'dire_wolf', harpia: 'harpy', ogro: 'ogre', cuboGel: 'gelatinous_cube', gargula: 'gargoyle', geleiaOcre: 'ochre_jelly', capitaoBandido: 'bandit_captain', ursoCoruja: 'owlbear', inumano: 'skeleton', minotauro: 'minotaur', basilisco: 'basilisk', mumia: 'mummy', caoInfernal: 'hell_hound', ettin: 'ettin', fantasma: 'ghost', troll: 'troll', aparicao: 'specter', criaVamp: 'vampire_spawn', gigColina: 'hill_giant', elemAgua: 'water_elemental', serpe: 'wyvern', quimera: 'chimera', medusa: 'medusa', mago: 'mage', gigPedra: 'stone_giant', gigGelo: 'frost_giant', golemArgila: 'clay_golem', gigFogo: 'fire_giant', gigNuvens: 'cloud_giant', dragaoJovem: 'young_red_dragon', golemPedra: 'stone_golem', vampiro: 'vampire', dragaoAdulto: 'adult_red_dragon', manticora: 'manticore', reiInercia: 'rei_inercia' };
const PX = { min: 17, peq: 25, med: 32, grd: 44, enorme: 58, colossal: 76 };
const TAM_SPR = { rato: 'min', morcego: 'min', limo: 'med', goblin: 'peq', esqueleto: 'med', zumbi: 'med', lobo: 'med', aranha: 'med', bruto: 'grd', fantasma: 'med', gargula: 'med', dragao: 'enorme', golem: 'grd', rei: 'grd', serpe: 'med', vampiro: 'med' };
export const tamanhoPx = (tam) => PX[tam] || 32;
// tamanho D&D da criatura: do dado do monstro; para os antigos, do equivalente SRD ou do desenho
export function tamDe(m) { if (!m) return 'med'; if (m.tam) return m.tam; const id = idToken(m); const s = id && MONSTROS['s_' + id]; if (s && s.tam) return s.tam; return TAM_SPR[m.spr] || 'med'; }
export function idToken(m) { // m: unidade/monstro com { tok, mon|id }
  if (!m) return null; if (m.tok) return String(m.tok).replace(/^s_/, ''); const id = m.mon || m.id; if (!id) return null; if (/^s_/.test(id)) return id.slice(2); return VELHO[id] || null;
}
export function tokenMonstro(m) {
  const id = idToken(m); if (!id) return null; const e = carregar(`${BASE}mon/${id}.webp`); if (!e.ok) return null;
  if (!e.sombra) e.sombra = comSombraSilhueta(e.img); return e.sombra;
}
export function precarregarMonstros(ids) { for (const i of ids) carregar(`${BASE}mon/${String(i).replace(/^s_/, '')}.webp`); }

// ---------- desenho ----------
const ANG = { cima: 0, dir: Math.PI / 2, baixo: Math.PI, esq: -Math.PI / 2 };
// Suaviza a rotação guardando o ângulo no próprio objeto (u.v, jogador, npc…)
export function angDe(obj, dir) {
  const alvo = ANG[dir] === undefined ? 0 : ANG[dir]; if (obj._ang === undefined) { obj._ang = alvo; return alvo; }
  let d = alvo - obj._ang; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; obj._ang += d * 0.35; if (Math.abs(d) < 0.02) obj._ang = alvo; return obj._ang;
}
// ctx já tem a transformação do zoom; cam é { x, y }; (tx, ty) em tiles (centro do tile).
export function desenharToken(ctx, tok, cam, tx, ty, ang, px, { alfa = 1, flash = null, dx = 0, dy = 0 } = {}) {
  const cx = tx * 32 + 16 - cam.x + dx, cy = ty * 32 + 16 - cam.y + dy; const img = flash || tok;
  ctx.save(); ctx.globalAlpha = alfa; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.translate(Math.round(cx), Math.round(cy)); ctx.rotate(ang); ctx.drawImage(img, -px / 2, -px / 2, px, px); ctx.restore();
}
