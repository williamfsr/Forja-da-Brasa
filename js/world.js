// Mapas fixos: a vila de Forjaluz (feita à mão em código) e o Vale (mundo aberto gerado com semente fixa).
import { mulberry32, hashStr } from './rules.js';
import { CAPITULOS } from './story.js';

export const SOLIDOS = new Set(['arvore', 'pinheiro', 'montanha', 'agua', 'lava', 'rocha', 'telhado', 'telhadoAz', 'telhadoVd', 'parede', 'paredeLisa', 'cerca', 'braseiro', 'poco', 'barril', 'bigorna', 'tenda', 'porta', 'placa', 'caverna', 'cavernaLiv', 'casinha', 'saida']);

function mapaVazio(w, h, base) { return { w, h, g: new Array(w * h).fill(base), gat: {}, extra: [] }; }
const I = (m, x, y) => y * m.w + x;
const poe = (m, x, y, t) => { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.g[I(m, x, y)] = t; };
const gatilho = (m, x, y, g) => { m.gat[I(m, x, y)] = g; };

// ---------- Vila ----------
export const PREDIOS = [
  { id: 'templo', nome: 'Templo', x: 8, y: 3, w: 5, tel: 'telhadoAz' }, { id: 'casa', nome: 'Casa', x: 17, y: 3, w: 5, tel: 'telhado' },
  { id: 'biblioteca', nome: 'Biblioteca', x: 2, y: 7, w: 5, tel: 'telhadoAz' }, { id: 'arena', nome: 'Arena de Ferro', x: 2, y: 12, w: 5, tel: 'telhado' },
  { id: 'forja', nome: 'Forja', x: 2, y: 17, w: 5, tel: 'telhado' }, { id: 'trilha', nome: 'Trilha', x: 2, y: 22, w: 5, tel: 'telhadoVd' },
  { id: 'taverna', nome: 'Taverna', x: 23, y: 7, w: 5, tel: 'telhadoVd' }, { id: 'alquimista', nome: 'Alquimista', x: 23, y: 12, w: 5, tel: 'telhadoAz' },
  { id: 'mercador', nome: 'Mercador', x: 23, y: 17, w: 5, tel: 'telhadoVd' },
];
export function criarVila() {
  const m = mapaVazio(30, 28, 'grama'); m.nome = 'Forjaluz'; const r = mulberry32(777);
  for (let i = 0; i < m.g.length; i++) { const v = r(); if (v < 0.07) m.g[i] = 'flor'; }
  // estrada principal e praça
  for (let y = 2; y < 28; y++) { poe(m, 14, y, 'terra'); poe(m, 15, y, 'terra'); }
  for (let y = 9; y <= 18; y++) for (let x = 9; x <= 20; x++) poe(m, x, y, 'praca');
  // prédios
  for (const p of PREDIOS) {
    const cx = p.x + (p.w >> 1);
    for (let x = p.x; x < p.x + p.w; x++) { poe(m, x, p.y, p.tel); poe(m, x, p.y + 1, p.tel); poe(m, x, p.y + 2, (x - p.x) % 4 === 0 ? 'parede' : 'paredeLisa'); }
    poe(m, cx, p.y + 2, 'porta'); gatilho(m, cx, p.y + 2, { tipo: 'painel', id: p.id, rot: p.nome });
    p.porta = { x: cx, y: p.y + 2 }; p.frente = { x: cx, y: p.y + 3 };
    // caminho da porta até a estrada
    const alvo = cx < 14 ? 13 : 16; for (let x = Math.min(cx, alvo); x <= Math.max(cx, alvo); x++) if (m.g[I(m, x, p.y + 3)] !== 'praca') poe(m, x, p.y + 3, 'terra');
  }
  // bordas de árvores (com saídas ao sul e portal ao norte)
  for (let x = 0; x < m.w; x++) { poe(m, x, 0, 'arvore'); poe(m, x, m.h - 1, 'arvore'); }
  for (let y = 0; y < m.h; y++) { poe(m, 0, y, 'arvore'); poe(m, m.w - 1, y, 'arvore'); }
  poe(m, 14, 0, 'arvore'); poe(m, 15, 0, 'arvore'); poe(m, 14, 27, 'terra'); poe(m, 15, 27, 'terra');
  gatilho(m, 14, 27, { tipo: 'mapa', para: 'vale', passa: true }); gatilho(m, 15, 27, { tipo: 'mapa', para: 'vale', passa: true });
  // portal da masmorra ao norte
  for (let x = 12; x <= 17; x++) poe(m, x, 1, 'praca'); poe(m, 13, 1, 'braseiro'); poe(m, 16, 1, 'braseiro');
  poe(m, 14, 1, 'saida'); poe(m, 15, 1, 'saida'); gatilho(m, 14, 1, { tipo: 'painel', id: 'portal', rot: 'Portal das Masmorras' }); gatilho(m, 15, 1, { tipo: 'painel', id: 'portal', rot: 'Portal das Masmorras' });
  // praça: braseiro central, quadro, livro, poço
  poe(m, 14, 13, 'braseiro');
  poe(m, 11, 10, 'placa'); gatilho(m, 11, 10, { tipo: 'painel', id: 'missoes', rot: 'Quadro de Missões' });
  poe(m, 18, 10, 'placa'); gatilho(m, 18, 10, { tipo: 'painel', id: 'livro', rot: 'Livro da Aventura' });
  poe(m, 11, 17, 'poco'); poe(m, 18, 17, 'barril');
  // decoração
  for (const [x, y] of [[8, 10], [8, 11], [21, 10], [22, 22], [9, 20], [20, 24]]) poe(m, x, y, 'barril');
  poe(m, 7, 19, 'bigorna'); poe(m, 8, 19, 'bigorna');
  for (let y = 21; y <= 25; y++) for (let x = 22; x <= 27; x++) poe(m, x, y, (x + y) % 7 === 0 && x > 22 ? 'flor' : 'agua');
  for (let x = 22; x <= 27; x++) poe(m, x, 20, 'cerca');
  for (const [x, y] of [[9, 3], [10, 8], [21, 2], [8, 26], [12, 22], [18, 22], [10, 24], [19, 26], [6, 27], [3, 26]]) poe(m, x, y, 'arvore');
  for (let x = 16; x <= 21; x++) poe(m, x, 7, 'cerca'); poe(m, 16, 7, 'cerca');
  m.spawn = { x: 14, y: 26 }; m.retornoPortal = { x: 14, y: 3 };
  m.npcs = [
    { id: 'brasa', x: 13, y: 13, fixo: true, painel: 'forja' }, { id: 'ferrao', x: 6, y: 15, raio: 2, painel: 'arena' }, { id: 'aurora', x: 12, y: 6, raio: 2, painel: 'templo' },
    { id: 'eruvim', x: 7, y: 10, raio: 2, painel: 'biblioteca' }, { id: 'tavi', x: 22, y: 10, raio: 2, painel: 'taverna' }, { id: 'lucia', x: 13, y: 26, fixo: true },
    { id: 'quinzinho', x: 22, y: 19, raio: 2, painel: 'mercador' }, { id: 'alquimista', x: 22, y: 15, raio: 2, painel: 'alquimista' },
    { id: 'aldeao1', x: 11, y: 14, raio: 4 }, { id: 'aldeao2', x: 17, y: 15, raio: 4 },
  ];
  return m;
}

// ---------- Vale (mundo aberto) ----------
const WAY = [[14, 50], [26, 54], [22, 44], [10, 38], [24, 32], [38, 40], [46, 50], [58, 52], [66, 44], [56, 34], [44, 28], [32, 22], [20, 18], [10, 10], [26, 8], [40, 12], [54, 16], [62, 8], [72, 14], [70, 26]];
const VILA_POS = [7, 53];
const BIOMAS = {
  porao: { g: 'grama', o: 'arvore', w: 'agua' }, caverna: { g: 'terra', o: 'montanha', w: 'agua' }, cripta: { g: 'terra', o: 'rocha', w: 'agua' }, floresta: { g: 'grama', o: 'pinheiro', w: 'agua' },
  torre: { g: 'grama', o: 'montanha', w: 'agua' }, pantano: { g: 'pantano', o: 'arvore', w: 'agua' }, mina: { g: 'terra', o: 'montanha', w: 'agua' }, abismo: { g: 'nuvem', o: 'rocha', w: 'lava' },
  cemiterio: { g: 'terra', o: 'rocha', w: 'agua' }, afundada: { g: 'areia', o: 'rocha', w: 'agua' }, forja: { g: 'terra', o: 'montanha', w: 'lava' }, trono: { g: 'neve', o: 'pinheiro', w: 'agua' },
};
function valor(ix, iy, seed) { return mulberry32((ix * 73856093) ^ (iy * 19349663) ^ seed)(); }
function ruido(x, y, seed) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0; const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = valor(x0, y0, seed), b = valor(x0 + 1, y0, seed), c = valor(x0, y0 + 1, seed), d = valor(x0 + 1, y0 + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
const fbm = (x, y, seed) => ruido(x, y, seed) * 0.6 + ruido(x * 2.1, y * 2.1, seed + 7) * 0.28 + ruido(x * 4.3, y * 4.3, seed + 13) * 0.12;

export function criarVale() {
  const W = 80, H = 60, m = mapaVazio(W, H, 'grama'); m.nome = 'O Vale'; const seed = 20250101;
  m.reg = new Uint8Array(W * H); m.enc = new Uint8Array(W * H); const pts = [VILA_POS, ...WAY];
  const reg = (x, y) => { let b = 0, bd = 1e9; for (let i = 0; i < pts.length; i++) { const dx = x - pts[i][0], dy = y - pts[i][1], d = dx * dx + dy * dy; if (d < bd) { bd = d; b = i; } } return b; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ri = reg(x, y); m.reg[I(m, x, y)] = ri; const tema = ri === 0 ? 'porao' : CAPITULOS[ri - 1].tema; const B = BIOMAS[tema] || BIOMAS.porao;
    const n = fbm(x * 0.1, y * 0.1, seed); let t = B.g;
    if (n < 0.3) t = B.w; else if (n > 0.69) t = B.o; else if (B.g === 'grama' && valor(x, y, seed + 3) < 0.05) t = 'flor'; else if (B.g !== 'grama' && valor(x, y, seed + 5) < 0.04) t = 'rocha';
    poe(m, x, y, t);
  }
  for (let x = 0; x < W; x++) { poe(m, x, 0, 'montanha'); poe(m, x, H - 1, 'montanha'); } for (let y = 0; y < H; y++) { poe(m, 0, y, 'montanha'); poe(m, W - 1, y, 'montanha'); }
  // estradas
  const r = mulberry32(seed + 99);
  const estrada = (a, b) => {
    let x = a[0], y = a[1]; let guarda = 0;
    while ((x !== b[0] || y !== b[1]) && guarda++ < 900) {
      const t = m.g[I(m, x, y)]; poe(m, x, y, (t === 'agua' || t === 'lava') ? 'ponte' : 'estrada');
      const dx = b[0] - x, dy = b[1] - y; let sx = 0, sy = 0;
      if (Math.abs(dx) + Math.abs(dy) > 4 && r() < 0.28) { if (r() < 0.5) sx = r() < 0.5 ? 1 : -1; else sy = r() < 0.5 ? 1 : -1; }
      else if (Math.abs(dx) >= Math.abs(dy) && r() < 0.8 || dy === 0) sx = Math.sign(dx); else sy = Math.sign(dy);
      x = Math.max(1, Math.min(W - 2, x + sx)); y = Math.max(1, Math.min(H - 2, y + sy));
    }
    poe(m, b[0], b[1], 'estrada');
  };
  for (let i = 0; i < pts.length - 1; i++) estrada(pts[i], pts[i + 1]);
  // clareiras nos pontos de interesse
  for (let i = 0; i < pts.length; i++) { const [px, py] = pts[i]; const tema = i === 0 ? 'porao' : CAPITULOS[i - 1].tema; const B = BIOMAS[tema] || BIOMAS.porao; for (let y = py - 2; y <= py + 2; y++) for (let x = px - 2; x <= px + 2; x++) { if (m.g[I(m, x, y)] !== 'estrada') poe(m, x, y, B.g); } }
  for (let i = 0; i < WAY.length; i++) { const [px, py] = WAY[i]; poe(m, px, py - 1, 'caverna'); gatilho(m, px, py - 1, { tipo: 'cap', n: i + 1, rot: CAPITULOS[i].local }); poe(m, px, py, 'estrada'); m.extra.push({ n: i + 1, x: px, y: py - 1 }); }
  poe(m, VILA_POS[0], VILA_POS[1] - 1, 'casinha'); gatilho(m, VILA_POS[0], VILA_POS[1] - 1, { tipo: 'mapa', para: 'vila', rot: 'Forjaluz' });
  m.spawn = { x: VILA_POS[0], y: VILA_POS[1] }; m.vilaPos = { x: VILA_POS[0], y: VILA_POS[1] - 1 };
  // alcançáveis a partir do spawn (BFS)
  m.alc = new Uint8Array(W * H); const q = [I(m, m.spawn.x, m.spawn.y)]; m.alc[q[0]] = 1;
  const livre = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !SOLIDOS.has(m.g[I(m, x, y)]);
  for (let k = 0; k < q.length; k++) { const c = q[k], cx = c % W, cy = (c / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (livre(nx, ny) && !m.alc[I(m, nx, ny)]) { m.alc[I(m, nx, ny)] = 1; q.push(I(m, nx, ny)); } } }
  // zonas de encontro: terreno não-estrada, longe da vila e das entradas
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const t = m.g[I(m, x, y)]; if (!['grama', 'flor', 'pantano', 'neve', 'areia', 'terra', 'nuvem'].includes(t)) continue; if (!m.alc[I(m, x, y)]) continue;
    const dv = Math.abs(x - VILA_POS[0]) + Math.abs(y - VILA_POS[1]); if (dv < 8) continue; m.enc[I(m, x, y)] = 1;
  }
  return m;
}
export function solidoEm(m, x, y) { if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true; return SOLIDOS.has(m.g[y * m.w + x]); }
export function bausDoDia(m, data, criado, maxReg) {
  const r = mulberry32(hashStr(`${data}:${criado}`)); const out = []; let t = 0;
  while (out.length < 3 && t++ < 400) { const x = 2 + Math.floor(r() * (m.w - 4)), y = 2 + Math.floor(r() * (m.h - 4)); const i = y * m.w + x; if (m.alc[i] && m.enc[i] && m.reg[i] <= maxReg + 1 && m.reg[i] > 0 && !out.some((b) => b.x === x && b.y === y)) out.push({ x, y, aberto: false }); }
  return out;
}
