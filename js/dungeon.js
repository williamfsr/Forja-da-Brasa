// Gerador procedural de masmorras (salas + corredores), determinístico por semente.
import { mulberry32, escolhe, criarMonstro, poolCatacumbas, ouroDoMonstro, escalaNivel } from './rules.js';
import { criarGrupo, tamanhoGrupo, comPerfil } from './encontros.js';

export const T = { PAREDE: 0, CHAO: 1, DESCE: 2, SOBE: 3, SAIDA: 4, BOSS_PORTAL: 5 };

export function gerarMasmorra({ seed, andar = 1, final = false, tema = 'porao', pool = [], nivel = 1, chefe = null, inercia = 0, ciclo = 1, ajuste = 1, escala = null, explorador = false, w = 38, h = 30 }) {
  const rng = mulberry32(seed >>> 0);
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const tiles = new Uint8Array(w * h); const salas = [];
  const idx = (x, y) => y * w + x;
  const alvo = final ? 8 : ri(8, 12);
  for (let tent = 0; tent < 200 && salas.length < alvo; tent++) {
    const rw = ri(4, 9), rh = ri(4, 7), x = ri(1, w - rw - 2), y = ri(1, h - rh - 2);
    if (salas.some((r) => x < r.x + r.w + 2 && x + rw + 2 > r.x && y < r.y + r.h + 2 && y + rh + 2 > r.y)) continue;
    salas.push({ x, y, w: rw, h: rh, cx: x + (rw >> 1), cy: y + (rh >> 1) });
  }
  if (salas.length < 3) { salas.push({ x: 2, y: 2, w: 6, h: 5, cx: 5, cy: 4 }, { x: 14, y: 12, w: 6, h: 5, cx: 17, cy: 14 }, { x: 24, y: 4, w: 6, h: 5, cx: 27, cy: 6 }); }
  for (const r of salas) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) tiles[idx(x, y)] = T.CHAO;
  // corredores: conecta cada sala à próxima (ordenadas por x) e algumas extras
  const ord = [...salas].sort((a, b) => a.cx - b.cx);
  const corredor = (a, b) => {
    let x = a.cx, y = a.cy; const horizPrimeiro = rng() < 0.5;
    const passoX = () => { while (x !== b.cx) { tiles[idx(x, y)] = T.CHAO; x += Math.sign(b.cx - x); } };
    const passoY = () => { while (y !== b.cy) { tiles[idx(x, y)] = T.CHAO; y += Math.sign(b.cy - y); } };
    if (horizPrimeiro) { passoX(); passoY(); } else { passoY(); passoX(); }
    tiles[idx(x, y)] = T.CHAO;
  };
  for (let i = 0; i < ord.length - 1; i++) corredor(ord[i], ord[i + 1]);
  for (let k = 0; k < 2; k++) corredor(escolhe(rng, salas), escolhe(rng, salas));
  // início = sala mais à esquerda; fim = mais distante (BFS)
  const ini = ord[0]; const start = { x: ini.cx, y: ini.cy };
  const dist = new Int32Array(w * h).fill(-1); const fila = [idx(start.x, start.y)]; dist[fila[0]] = 0;
  for (let q = 0; q < fila.length; q++) { const c = fila[q], cx = c % w, cy = (c / w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const n = idx(nx, ny); if (tiles[n] && dist[n] < 0) { dist[n] = dist[c] + 1; fila.push(n); } } }
  let fimSala = salas[0], best = -1; for (const r of salas) { const d = dist[idx(r.cx, r.cy)]; if (r !== ini && d > best) { best = d; fimSala = r; } }
  tiles[idx(start.x, start.y)] = T.SOBE;
  const ents = []; const ocupado = new Set([idx(start.x, start.y)]);
  const livre = (r) => { for (let t = 0; t < 30; t++) { const x = ri(r.x, r.x + r.w - 1), y = ri(r.y, r.y + r.h - 1); const i = idx(x, y); if (!ocupado.has(i) && tiles[i] === T.CHAO) { ocupado.add(i); return { x, y }; } } return null; };
  if (final) {
    tiles[idx(fimSala.cx, fimSala.cy)] = T.CHAO; ocupado.add(idx(fimSala.cx, fimSala.cy));
    const mon = comPerfil(criarMonstro(chefe.base, { chefe: true, ov: { ...(chefe.ov || {}), dm: (chefe.dm || 1) * ajuste }, nome: chefe.nome, esc: chefe.esc, inercia, ciclo }), rng);
    ents.push({ tipo: 'chefe', x: fimSala.cx, y: fimSala.cy, mon, spr: mon.spr, pal: mon.pal });
  } else {
    tiles[idx(fimSala.cx, fimSala.cy)] = T.DESCE; ocupado.add(idx(fimSala.cx, fimSala.cy));
  }
  const nPacks = Math.min(8, 3 + Math.ceil(andar / 2) + (inercia >= 7 ? 1 : 0) + ri(0, 1));
  const pl = pool.length ? pool : poolCatacumbas(nivel, andar, tema, explorador); const esc = escala || escalaNivel(nivel);
  const vizinho = (p) => { for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [0, 2]]) { const x = p.x + dx, y = p.y + dy; const i = idx(x, y); if (x > 0 && y > 0 && x < w - 1 && y < h - 1 && !ocupado.has(i) && tiles[i] === T.CHAO) { ocupado.add(i); return { x, y }; } } return null; };
  for (let k = 0; k < nPacks; k++) {
    const sala = escolhe(rng, salas.filter((r) => r !== ini)); const p = livre(sala); if (!p) continue;
    const n = tamanhoGrupo(rng, nivel, andar); const gm = criarGrupo({ pool: pl, n, escala: esc, aj: ajuste, inercia, ciclo, rng, bonus: 1 + andar * 0.04 });
    gm.forEach((mon, j) => { const q = j === 0 ? p : vizinho(p); if (!q) return; ents.push({ tipo: 'monstro', x: q.x, y: q.y, mon, spr: mon.spr, pal: mon.pal, ap: mon.ap || null, acordado: false, vivo: true, ouro: ouroDoMonstro(mon, rng), g: k + 1 }); });
  }
  const nBau = ri(1, 3); for (let i = 0; i < nBau; i++) { const p = livre(escolhe(rng, salas)); if (p) ents.push({ tipo: 'bau', x: p.x, y: p.y, aberto: false, forca: Math.floor(andar / 2) }); }
  const nArm = ri(0, 3); for (let i = 0; i < nArm; i++) { const p = livre(escolhe(rng, salas)); if (p) ents.push({ tipo: 'armadilha', x: p.x, y: p.y, ativa: true, oculta: true }); }
  if (rng() < 0.4) { const p = livre(escolhe(rng, salas)); if (p) ents.push({ tipo: 'santuario', x: p.x, y: p.y, usado: false }); }
  if (rng() < 0.25 && !final) { const p = livre(escolhe(rng, salas)); if (p) ents.push({ tipo: 'tocha_cx', x: p.x, y: p.y, usado: false }); }
  return { w, h, tiles, salas, start, ents, andar, final, tema, explorado: new Uint8Array(w * h) };
}

// campo de visão simples (raio circular com checagem de linha)
export function visiveis(d, px, py, raio) {
  const vis = new Set();
  const solido = (x, y) => x < 0 || y < 0 || x >= d.w || y >= d.h || d.tiles[y * d.w + x] === T.PAREDE;
  for (let y = py - raio; y <= py + raio; y++) for (let x = px - raio; x <= px + raio; x++) {
    if (x < 0 || y < 0 || x >= d.w || y >= d.h) continue; const dx = x - px, dy = y - py; if (dx * dx + dy * dy > raio * raio + 1) continue;
    // Bresenham
    let x0 = px, y0 = py, ok = true; const sx = Math.sign(x - x0), sy = Math.sign(y - y0), adx = Math.abs(x - x0), ady = Math.abs(y - y0); let err = adx - ady;
    while (!(x0 === x && y0 === y)) { if ((x0 !== px || y0 !== py) && solido(x0, y0)) { ok = false; break; } const e2 = 2 * err; if (e2 > -ady) { err -= ady; x0 += sx; } if (e2 < adx) { err += adx; y0 += sy; } }
    if (ok) vis.add(y * d.w + x);
  }
  return vis;
}
