// Fachada dos mapas: terrenos sólidos, registro de mapas (mundo.js) e baús do dia.
import { mulberry32, hashStr } from './rules.js';
import './mundo.js';
export { SOLIDOS, solidoEm } from './tiles.js';
export { obterMapa, limparMapas, temMapa } from './locais.js';
export { LUG, DESTINOS_VIAGEM } from './mundo.js';
export function bausDoDia(m, data, criado, maxReg) {
  const r = mulberry32(hashStr(`${data}:${criado}`)); const out = []; let t = 0;
  while (out.length < 3 && t++ < 400) { const x = 2 + Math.floor(r() * (m.w - 4)), y = 2 + Math.floor(r() * (m.h - 4)); const i = y * m.w + x; if (m.alc[i] && m.enc[i] && m.reg[i] <= maxReg + 1 && m.reg[i] > 0 && !out.some((b) => b.x === x && b.y === y)) out.push({ x, y, aberto: false }); }
  return out;
}
