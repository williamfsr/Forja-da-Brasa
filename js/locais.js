// Mapas fixos em vista de cima: Forjaluz, vilas e castelo do Vale, e o interior de cada casa.
// Um prédio é um telhado visto de cima com uma porta; a porta leva ao mapa interior (piso, paredes, móveis e moradores que se pode tocar).
import { SOLIDOS } from './tiles.js';
import { mulberry32 } from './rules.js';
import './pessoas.js';

const I = (m, x, y) => y * m.w + x;
export function novoMapa(id, nome, w, h, base = 'grama', tipo = 'vila') { return { id, nome, w, h, g: new Array(w * h).fill(base), gat: {}, extra: [], predios: [], npcs: [], rotulos: [], tipo }; }
export const poe = (m, x, y, t) => { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.g[I(m, x, y)] = t; };
export const ret = (m, x, y, w, h, t) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) poe(m, x + i, y + j, t); };
export const gat = (m, x, y, g) => { m.gat[I(m, x, y)] = g; };
export const ler = (m, x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? null : m.g[I(m, x, y)]);
export const contorno = (m, t, esp = 1) => { for (let k = 0; k < esp; k++) { for (let x = 0; x < m.w; x++) { poe(m, x, k, t); poe(m, x, m.h - 1 - k, t); } for (let y = 0; y < m.h; y++) { poe(m, k, y, t); poe(m, m.w - 1 - k, y, t); } } };
export const linha = (m, x0, y0, x1, y1, t) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) poe(m, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), t); };
export function npc(m, id, x, y, o = {}) { m.npcs.push({ id, x, y, ...o }); }

// Prédio visto de cima. dest = id do mapa interior (ou null para prédio de enfeite).
export function pred(m, { x, y, w, h, tel = 'telhado', nome, dest = null, porta = null, ruina = false, rot = true }) {
  const full = dest ? `${m.id}/${dest}` : null; ret(m, x, y, w, h, tel); const b = { x, y, w, h, tel, nome, id: full, ruina };
  if (dest) { const px = porta == null ? x + (w >> 1) : porta, py = y + h - 1; poe(m, px, py, 'porta'); gat(m, px, py, { tipo: 'mapa', para: full, passa: true, rot: nome }); b.porta = { x: px, y: py }; b.frente = { x: px, y: py + 1 }; }
  m.predios.push(b); if (rot && nome) m.rotulos.push({ x: x + w / 2 - 0.5, y: y + 0.4, t: nome }); return b;
}
export function caminho(m, x0, y0, x1, y1, t = 'terra') { // L: horizontal, depois vertical
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) if (ler(m, x, y0) === 'grama' || ler(m, x, y0) === 'flor') poe(m, x, y0, t);
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) if (ler(m, x1, y) === 'grama' || ler(m, x1, y) === 'flor') poe(m, x1, y, t);
}
export function espalha(m, rng, t, n, ok = (c) => c === 'grama') { let k = 0, g = 0; while (k < n && g++ < n * 30) { const x = 1 + Math.floor(rng() * (m.w - 2)), y = 1 + Math.floor(rng() * (m.h - 2)); if (ok(ler(m, x, y)) && !m.gat[I(m, x, y)]) { poe(m, x, y, t); k++; } } }

// ---------- interiores ----------
const LEG = { '#': 'paredeI', '%': 'paredeP', w: 'janela', '.': 'piso', _: 'pisoPedra', m: 'pisoMarm', ':': 'pisoEscuro', ';': 'pisoTerra', ',': 'tapete', D: 'portaI',
  b: 'cama', T: 'mesa', c: 'cadeira', B: 'banco', S: 'estante', A: 'altar', F: 'lareira', K: 'fogao', L: 'balcao', X: 'bauF', E: 'espelho', P: 'planta', V: 'vaso', Q: 'caldeirao', H: 'bancada', M: 'mapa', O: 'livro', G: 'estatua', Y: 'pilar', R: 'armas', U: 'fornalha', N: 'bigorna', o: 'toneis', s: 'saco', f: 'fonte', t: 'trono', C: 'cripta', a: 'alcapao', z: 'colchao', I: 'tela' };
const ST = (id) => ({ tipo: 'painel', id });
const OB = (id) => ({ tipo: 'obj', id });
export const INTERIORES = {
  casa: { nome: 'Sua casa', luz: 'rgba(255,170,80,0.10)', tapete: '#3a5ab4', mapa: ['############', '#b.....E.S.#', '#......T...#', '#.X....T...#', '#..,,,,,...#', '#..,,,,,...#', '#P.........#', '#V........P#', '#####D######'], acts: { b: OB('cama_casa'), E: OB('espelho'), X: OB('bau_casa'), S: OB('estante'), T: OB('mesa_casa'), P: OB('planta'), V: OB('vaso') }, npcs: {} },
  templo: { nome: 'Templo do Alvorecer', luz: 'rgba(255,220,140,0.10)', tapete: '#7a3a8a', mapa: ['%%%%%%%%%%%%%', '%Y____A____Y%', '%_G___1___G_%', '%___________%', '%__,,,,,,,__%', '%__,,,,,,,__%', '%_B_______B_%', '%_B_______B_%', '%___________%', '%Y_________Y%', '%%%%%%D%%%%%%'], acts: { A: ST('templo'), G: OB('estatua_templo'), B: OB('banco_templo') }, npcs: { 1: { id: 'aurora', painel: 'templo', fixo: true } }, tema: 'pedra' },
  biblioteca: { nome: 'Biblioteca de Forjaluz', luz: 'rgba(255,190,100,0.08)', tapete: '#2a5a9a', mapa: ['#############', '#SSSSSSSSSSS#', '#S.........S#', '#S.TT.1.TT.S#', '#S.cc...cc.S#', '#S.........S#', '#S,,,,O,,,,S#', '#S.........C#', '#P.........P#', '######D######'], acts: { O: ST('biblioteca'), C: { tipo: 'cap', n: 3 }, S: OB('estante'), T: OB('mesa_estudo') }, npcs: { 1: { id: 'eruvim', painel: 'biblioteca', raio: 2 } } },
  arena: { nome: 'Arena de Ferro', luz: 'rgba(255,150,80,0.08)', tapete: '#7a2a2a', mapa: ['##############', '#R.R.R.R.R.R.#', '#............#', '#..,,,,,,,,..#', '#..,,,,,,,,..#', '#..,,,1,,,,..#', '#..,,,,,,,,..#', '#o..........s#', '#B..........B#', '######D#######'], acts: { R: ST('arena'), o: OB('toneis'), s: OB('saco_treino'), B: OB('banco_arena') }, npcs: { 1: { id: 'ferrao', painel: 'arena', raio: 2 } } },
  forja: { nome: 'Forja da Brasa', luz: 'rgba(255,120,40,0.14)', mapa: ['#############', '#UU.NN....RR#', '#...........#', '#.....1.....#', '#...........#', '#.LLL.......#', '#...........#', '#o.........a#', '#s.........s#', '######D######'], acts: { U: ST('forja'), L: ST('forja'), a: { tipo: 'cap', n: 1 }, N: OB('bigorna_forja'), R: OB('armas_forja'), o: OB('toneis'), s: OB('saco') }, npcs: { 1: { id: 'brasa', painel: 'forja', fixo: true } } },
  trilha: { nome: 'Pavilhão da Trilha', luz: 'rgba(160,230,160,0.06)', tapete: '#3a8a4a', mapa: ['#############', '#,,,,,,,,,,,#', '#,.........,#', '#,.M..1....,#', '#,.........,#', '#,,,,,,,,,,,#', '#B....P....B#', '#...........#', '######D######'], acts: { M: ST('trilha'), B: OB('banco_trilha') }, npcs: { 1: { id: 'ilara', painel: 'trilha', raio: 3 } } },
  taverna: { nome: 'Taverna da Tavi', luz: 'rgba(255,160,70,0.13)', mapa: ['##############', '#oo.FF.......#', '#.1..........#', '#.LLLLLL.....#', '#............#', '#..TT...TT...#', '#..cc...cc...#', '#............#', '#..TT...TT.s.#', '######D#######'], acts: { L: ST('taverna'), F: OB('lareira'), o: OB('toneis'), T: OB('mesa_taverna') }, npcs: { 1: { id: 'tavi', painel: 'taverna', fixo: true } } },
  alquimista: { nome: 'Alquimia de Zélia', luz: 'rgba(120,255,160,0.08)', mapa: ['############', '#SSS.QQ.SSS#', '#..........#', '#.HHHHHH...#', '#....1.....#', '#..........#', '#V........V#', '#..........#', '#####D######'], acts: { H: ST('alquimista'), Q: OB('caldeirao'), S: OB('estante') }, npcs: { 1: { id: 'alquimista', painel: 'alquimista', raio: 1 } } },
  mercador: { nome: 'Empório do Quinzinho', luz: 'rgba(255,200,90,0.10)', tapete: '#a83a3a', mapa: ['############', '#II.ss.oo.I#', '#..........#', '#.LLLLL....#', '#....1.....#', '#..........#', '#o........s#', '#..........#', '#####D######'], acts: { L: ST('mercador'), I: OB('quadro') }, npcs: { 1: { id: 'quinzinho', painel: 'mercador', fixo: true } } },
  guarda: { nome: 'Quartel da Guarda', luz: 'rgba(255,170,90,0.08)', mapa: ['############', '#RR.MMM.zz.#', '#..........#', '#....1.....#', '#..........#', '#.TT....TT.#', '#..........#', '#B........B#', '#####D######'], acts: { M: OB('mapa_guarda'), R: OB('armas_guarda') }, npcs: { 1: { id: 'lucia', fixo: true } } },
  estalagem: { nome: 'Estalagem Meia-Noite', luz: 'rgba(120,120,255,0.10)', tapete: '#3a3a6a', mapa: ['##############', '#FF.........a#', '#............#', '#.LLLLL......#', '#.1..........#', '#..TT....TT..#', '#..cc....cc..#', '#............#', '#b..........b#', '######D#######'], acts: { a: { tipo: 'cap', n: 8 }, L: OB('balcao_estalagem'), F: OB('lareira'), b: OB('cama_estalagem') }, npcs: { 1: { id: 'estalajadeira', fixo: true } } },
  prefeitura: { nome: 'Mansão do Prefeito', luz: 'rgba(255,200,100,0.10)', tapete: '#7a1f4a', mapa: ['###############', '#II..t..t..II.#', '#.............#', '#..,,,,,,,,,..#', '#..,,,,1,,,,..#', '#..,,,,,,,,,..#', '#.G.........G.#', '#P...TTTT....P#', '#.............#', '#######D#######'], acts: { t: OB('trono_prefeito'), G: OB('estatua_prefeito'), I: OB('quadro_prefeito'), T: OB('mesa_festa') }, npcs: { 1: { id: 'gaudencio', fixo: true } } },
  igreja: { nome: 'Igreja do Descanso', luz: 'rgba(200,200,255,0.10)', tapete: '#4a4a7a', mapa: ['%%%%%%%%%%%%%', '%Y____A____Y%', '%_G___1___G_%', '%___________%', '%__,,,,,,,__%', '%_B_,,,,,_B_%', '%_B_,,,,,_B_%', '%_B_______B_%', '%___________%', '%%%%%%D%%%%%%'], acts: { A: OB('altar_descanso'), G: OB('estatua_descanso'), B: OB('banco_igreja') }, npcs: { 1: { id: 'padre', fixo: true } }, tema: 'pedra' },
  abadia: { nome: 'Abadia de Alvorada', luz: 'rgba(230,240,255,0.10)', mapa: ['%%%%%%%%%%%%%%', '%zz_zz_zz_zz_%', '%____________%', '%_O__1_______%', '%____________%', '%zz_zz_zz____%', '%____________%', '%S__________S%', '%____________%', '%%%%%%D%%%%%%%'], acts: { O: OB('prontuario'), S: OB('estante_abadia'), z: OB('leito') }, npcs: { 1: { id: 'marcovia', fixo: true } }, tema: 'pedra' },
  casa_aldeia: { nome: 'Casa de aldeia', luz: 'rgba(255,170,80,0.10)', tapete: '#7a5a3a', mapa: ['##########', '#b.....K.#', '#......T.#', '#..,,,...#', '#..,,,.X.#', '#P.......#', '####D#####'], acts: { b: OB('cama_aldeia'), K: OB('fogao'), T: OB('mesa'), X: OB('bau_aldeia'), P: OB('planta') }, npcs: {} },
  casa_menino: { nome: 'Casa do Menino Teo', luz: 'rgba(255,170,80,0.08)', tapete: '#5a6a8a', mapa: ['##########', '#K.....1.#', '#......T.#', '#..,,,...#', '#..,,,b..#', '#P.......#', '####D#####'], acts: { b: OB('cama_teo'), K: OB('fogao'), T: OB('mesa'), P: OB('planta') }, npcs: { 1: { id: 'menino', fixo: true } } },
  tenda_safira: { nome: 'Tenda de Dona Safira', luz: 'rgba(200,120,255,0.12)', tapete: '#7a1f4a', mapa: ['###########', '#.........#', '#..,,,,,..#', '#..,,T,,..#', '#.,,1c,,..#', '#..,,,,,..#', '#P.......P#', '#####D#####'], acts: { T: OB('baralho') }, npcs: { 1: { id: 'safira', fixo: true } } },
  tenda_vazia: { nome: 'Mercado dos Vazios', luz: 'rgba(40,10,60,0.28)', tapete: '#2a1a3a', mapa: ['###########', '#:::::::::#', '#:Q:::::a:#', '#:::::::::#', '#::,,,,,::#', '#::,,,,,::#', '#:::::::::#', '#####D#####'], acts: { a: { tipo: 'cap', n: 9 }, Q: OB('caldeirao_vazio') }, npcs: {} },
  moinho: { nome: 'Moinho dos Doces Sonhos', luz: 'rgba(255,200,180,0.12)', tapete: '#e8b8c8', mapa: ['###########', '#KK.Q.ooss#', '#.........#', '#...1.....#', '#.TT..TT..#', '#.cc..cc..#', '#.........#', '#####D#####'], acts: { Q: OB('tacho_doce'), K: OB('fogao_doce'), T: OB('mesa_doce') }, npcs: { 1: { id: 'vovo', fixo: true } } },
  fortaleza: { nome: 'Salão da Chama Prateada', luz: 'rgba(160,180,255,0.12)', tapete: '#4a5a8a', mapa: ['%%%%%%%%%%%%%%', '%Y_RR__MM_RRY%', '%____________%', '%_G__,,,,__G_%', '%____,1,,____%', '%____,,,,____%', '%Y__________Y%', '%____________%', '%%%%%%D%%%%%%%'], acts: { M: OB('mapa_ordem'), R: OB('armas_ordem'), G: OB('estatua_ordem') }, npcs: { 1: { id: 'hornfel', fixo: true } }, tema: 'pedra' },
  casarao: { nome: 'Casarão do Brinde', luz: 'rgba(200,60,90,0.12)', tapete: '#7a1f4a', mapa: ['#############', '#oooo.....oo#', '#...........#', '#.LLLLL.....#', '#.1.........#', '#...TT..TT..#', '#...cc..cc..#', '#P.........P#', '######D######'], acts: { L: OB('balcao_vinho'), o: OB('barris_vinho'), T: OB('mesa_vinho') }, npcs: { 1: { id: 'brindival', fixo: true } } },
  ambar: { nome: 'Templo Âmbar', luz: 'rgba(255,190,60,0.22)', tapete: '#b08a30', mapa: ['%%%%%%%%%%%', '%A___A___A%', '%_________%', '%_,,,,,,,_%', '%_,,,,,,,_%', '%_________%', '%G_______G%', '%%%%%D%%%%%'], acts: { A: OB('altar_ambar') }, npcs: {}, tema: 'pedra' },
  mordomo: { nome: 'Salão de Entrada da Cidadela', luz: 'rgba(120,80,200,0.18)', tapete: '#2a2a4a', mapa: ['%%%%%%%%%%%%%%%', '%Y____tt_____Y%', '%_a_________C_%', '%_,,,,,,,,,,,_%', '%_,,,,,,,,,,,_%', '%_G_,,,1,,,_G_%', '%_,,,,,,,,,,,_%', '%Y___________Y%', '%%%%%%%D%%%%%%%'], acts: { t: { tipo: 'cap', n: 20 }, a: { tipo: 'cap', n: 18 }, C: { tipo: 'cap', n: 19 }, G: OB('estatua_cidadela') }, npcs: { 1: { id: 'mordomo', fixo: true } }, tema: 'pedra' },
};

export function criarInterior(id, def, orig, pos) {
  const rows = def.mapa; const h = rows.length, w = rows[0].length; const m = novoMapa(id, def.nome, w, h, 'piso', 'int'); m.interior = true; m.tapeteCor = def.tapete; m.tint = def.luz; m.tema = def.tema || 'madeira';
  for (let y = 0; y < h; y++) { if (rows[y].length !== w) throw new Error(`interior ${id}: linha ${y} com ${rows[y].length} colunas (esperado ${w})`);
    for (let x = 0; x < w; x++) { const c = rows[y][x]; if (/\d/.test(c)) { poe(m, x, y, 'piso'); const n = def.npcs[c]; if (n) m.npcs.push({ ...n, x, y, home: { x, y } }); continue; } const t = LEG[c]; if (!t) throw new Error(`interior ${id}: símbolo '${c}'`); poe(m, x, y, t);
      if (c === 'D') { gat(m, x, y, { tipo: 'mapa', para: orig, pos, passa: true, rot: 'Sair' }); m.spawn = { x, y: y - 1 }; } else if (def.acts[c]) { gat(m, x, y, def.acts[c]); if (def.acts[c].tipo === 'cap') { m.extra.push({ n: def.acts[c].n, x, y, spr: t }); (m.capPos ||= new Set()).add(I(m, x, y)); } } } }
  m.rotulos.push({ x: (w - 1) / 2, y: -0.2, t: def.nome, int: true }); return m;
}

// ---------- registro de mapas ----------
const FABRICAS = {}; const CACHE = {};
export const registrar = (id, fn) => { FABRICAS[id] = fn; delete CACHE[id]; };
export const obterMapa = (id) => { if (!CACHE[id]) { if (!FABRICAS[id]) throw new Error('mapa desconhecido: ' + id); CACHE[id] = FABRICAS[id](); CACHE[id].id = id; } return CACHE[id]; };
export const limparMapas = () => { for (const k of Object.keys(CACHE)) delete CACHE[k]; };
export const temMapa = (id) => !!FABRICAS[id];
// registra o interior de cada prédio de um mapa externo (id = "<mapa>/<tipo>[#n]")
export function registrarInteriores(m) {
  for (const b of m.predios) { if (!b.id) continue; const chave = b.id.slice(b.id.indexOf('/') + 1); const def = INTERIORES[chave.split('#')[0]]; if (!def) continue; const orig = m.id, pos = b.frente, id = b.id; registrar(id, () => criarInterior(id, def, orig, pos)); }
}
void SOLIDOS; void mulberry32;
