// Animações de combate: folhas de sprite (webp) derivadas do pacote JB2A (CC BY-NC-SA 4.0, https://www.jb2a.com — ver LICENSE).
// Cada folha tem n quadros em grade; "ponto" toca sobre um tile/alvo, "feixe" vai do conjurador ao alvo (esticado e girado), "golpe" é um corte sobre o alvo.
import { FX } from './dados/fx_dados.js';
const IMG = {};
export function pre(id) {
  const m = FX[id]; if (!m) return null; if (IMG[id]) return IMG[id];
  const im = new Image(); im.decoding = 'async'; im.src = `assets/fx/${id}.webp`; IMG[id] = im; return im;
}
export function precarregar() { for (const id of Object.keys(FX)) pre(id); }
const ok = (im) => im && im.complete && im.naturalWidth > 0;

// ---- escolha do efeito conforme o tipo de dano ----
const PONTO_DE = { fogo: 'fogo', gelo: 'gelo', 'elétrico': 'raio', trovão: 'trovao', radiante: 'radiante', 'necrótico': 'necrotico', 'força': 'forca', arcano: 'forca', energia: 'forca', 'psíquico': 'forca', veneno: 'veneno', 'ácido': 'veneno', cura: 'cura' };
const FEIXE_DE = { fogo: 'feixe_fogo', gelo: 'feixe_gelo', 'elétrico': 'feixe_raio', trovão: 'feixe_raio', radiante: 'feixe_sagrado', 'necrótico': 'feixe_arcano', 'força': 'feixe_arcano', arcano: 'feixe_arcano', 'psíquico': 'feixe_arcano', energia: 'feixe_missil', veneno: 'feixe_calor', 'ácido': 'feixe_calor' };
export const pontoDe = (tipo) => PONTO_DE[tipo] || null;
export const feixeDe = (tipo) => FEIXE_DE[tipo] || 'feixe_missil';
export function golpeFisico(tipo, arma, heroi) {
  const t = String(tipo || '').toLowerCase(), a = String((arma && (arma.dt || arma.tipoDano)) || '').toLowerCase();
  const k = t !== 'fis' && t ? t : a;
  if (k.includes('cort')) return heroi ? 'corte' : 'garra';
  if (k.includes('perf')) return 'estocada';
  return 'pancada';
}

// ---- instâncias (guardadas em bt.fx; o loop de batalha incrementa f.t) ----
export function ponto(bt, id, tx, ty, { tiles = 2, dur = 0.8, dx = 0, dy = 0 } = {}) {
  const m = FX[id]; if (!m) return; pre(id);
  bt.fx.push({ tipo: 'spr', modo: 'ponto', id, x: tx, y: ty, tiles, dur: Math.min(dur, Math.max(0.5, m.ms / 1000 * 0.6)), t: 0, dx, dy });
}
export function feixe(bt, id, x0, y0, x1, y1, dur = 0.38) {
  if (!FX[id]) return; pre(id); bt.fx.push({ tipo: 'spr', modo: 'feixe', id, x0, y0, x1, y1, dur, t: 0 });
}
export function desenhar(ctx, f, cam, TS) {
  const m = FX[f.id], im = IMG[f.id]; if (!m || !ok(im)) return;
  const k = Math.min(0.999, f.t / f.dur), q = Math.floor(k * m.n), c = q % m.cols, r = Math.floor(q / m.cols);
  const sx = c * m.w, sy = r * m.h;
  ctx.save(); ctx.imageSmoothingEnabled = true;
  if (f.modo === 'ponto') {
    const cx = (f.x + 0.5) * TS - cam.x + f.dx, cy = (f.y + 0.5) * TS - cam.y - 4 + f.dy, s = (f.tiles * TS) / m.w * (m.t === 'golpe' ? 1.3 : 1);
    ctx.drawImage(im, sx, sy, m.w, m.h, cx - m.w * s / 2, cy - m.h * s / 2, m.w * s, m.h * s);
  } else {
    const x0 = (f.x0 + 0.5) * TS - cam.x, y0 = (f.y0 + 0.5) * TS - cam.y - 2, x1 = (f.x1 + 0.5) * TS - cam.x, y1 = (f.y1 + 0.5) * TS - cam.y - 2;
    const dist = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0); const alt = m.w > 600 ? m.h * 1.2 : m.h * 0.55;
    ctx.translate(x0, y0); ctx.rotate(ang); ctx.drawImage(im, sx, sy, m.w, m.h, 0, -alt / 2, dist, alt);
  }
  ctx.restore();
}

// ---- receita de animação por magia: classifica as 283 magias por elemento (palavras do id/nome + tipo de dano) ----
const KW = [
  [/fogo|fire|flam|burn|ardente|chama|meteor|incend|hellish|solar|sol_|sun/, 'fogo'], [/gelo|ice|frost|cold|frio|freez|glaci|sleet|snow|cone_frio/, 'gelo'],
  [/relamp|lightning|shock|choque|bolt|raio_/, 'raio'], [/trov|thunder|shatter|gust|earthquake|terremoto|quake/, 'trovao'],
  [/radiant|sagrad|holy|divine|bless|bencao|smite|castigo|guid|spirit|sacred|dawn|beacon|heroism|aid|favor|word_of_rad/, 'radiante'],
  [/necro|vampir|chill|death|morte|dedo|bestow|curse|bane|fear|medo|undead|harm|eyebite|wither|animate_dead|vampiric/, 'necrotico'],
  [/veneno|poison|acid|acido|stink|nevoa|plague|contagion|cloud|web|grease/, 'veneno'],
  [/heal|cura|cure|regener|restor|revive|resurrect|raise|prayer|mending|false_life|lesser|greater_rest/, 'cura'],
  [/shield|armor|armadura|protect|aegis|ward|sanctuary|stoneskin|barrier|mirror|blur|invisib|forcecage|wall_of_force|resilient/, 'escudo'],
];
export function elemDe(id, sp, dano) {
  const k = String(id || '').toLowerCase(); if (sp && sp.tipo === 'cura') return 'cura';
  const d = PONTO_DE[dano || (sp && sp.dano)]; if (d && d !== 'forca' && sp && ['atq', 'salva', 'auto'].includes(sp.tipo)) return d;
  for (const [re, e] of KW) if (re.test(k)) return e;
  if (d) return d; return sp && sp.tipo === 'buff' ? 'escudo' : 'forca';
}
export const feixeDoElem = (el) => ({ fogo: 'feixe_fogo', gelo: 'feixe_gelo', raio: 'feixe_raio', trovao: 'feixe_raio', radiante: 'feixe_sagrado', necrotico: 'feixe_arcano', veneno: 'feixe_calor', cura: 'feixe_sagrado', escudo: 'feixe_sagrado', forca: 'feixe_arcano' }[el] || 'feixe_arcano');
export const impactoDoElem = (el, grande) => (el === 'fogo' && grande ? 'bola_fogo' : el === 'escudo' ? 'escudo' : el);
export const castDe = (conj, el, sp) => { const c = conj && conj.cls; if (sp && sp.tipo === 'cura') return 'cura_azul'; if (c === 'clerigo' || c === 'paladino') return 'radiante'; if (c === 'druida' || c === 'patrulheiro') return 'cura_azul'; if (c === 'bardo') return 'castigo'; return el === 'gelo' ? 'gelo' : 'forca'; };
