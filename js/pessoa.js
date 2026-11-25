// Gerador de personagens em camadas (32 bits): corpo, raça, rosto, cabelo, barba, roupas, armaduras por classe, capa e acessórios.
import { Pix, rampa, mistura, escurece, clareia, ajusta, clamp, cv } from './gfx.js';
import { RACAS, KITS, CORES_CLASSE, ANCESTRAIS } from './cosmeticos.js';

const W = 32, H = 48, CX = 16, BASE = 45;
const FACES = [
  [6, 8, 10, 10, 10, 10, 10, 10, 9, 8, 6, 4],       // oval
  [6, 9, 11, 12, 12, 12, 12, 12, 11, 10, 8, 5],     // redondo
  [8, 10, 11, 11, 11, 11, 11, 11, 11, 10, 10, 8],   // quadrado
  [6, 8, 9, 9, 9, 9, 9, 9, 8, 8, 7, 5],             // alongado
  [6, 9, 11, 11, 11, 10, 10, 9, 8, 7, 5, 3],        // anguloso
  [7, 10, 11, 11, 10, 10, 9, 8, 7, 6, 4, 3],        // coração
];
// definição dos cabelos: topo (volume), franja, lat/nuca (comprimento), extras
const CAB = [
  { topo: 0 }, { topo: 1, rente: 1 }, { topo: 2, franja: 1 }, { topo: 2, franja: 4 }, { topo: 3, franja: 1, quiff: 1 }, { topo: 3, espetos: 1 }, { topo: 1, moicano: 1 },
  { topo: 3, franja: 1, lat: 5, nuca: 5, onda: 1 }, { topo: 2, franja: 2, lat: 7, nuca: 7 }, { topo: 3, franja: 3, lat: 6, nuca: 4 }, { topo: 2, franja: 4, lat: 14, nuca: 16 },
  { topo: 3, franja: 1, lat: 14, nuca: 16, onda: 1 }, { topo: 2, franja: 1, rabo: 'baixo' }, { topo: 2, franja: 0, rabo: 'alto' }, { topo: 2, franja: 0, coque: 1 },
  { topo: 2, franja: 4, lat: 10, tranca2: 1 }, { topo: 2, franja: 1, trancaLado: 1, lat: 4 }, { topo: 2, franja: 4, nuca: 14, trancaLonga: 1 }, { topo: 4, afro: 1 },
  { topo: 2, franja: 0, dreads: 1 }, { topo: 3, franja: 1, undercut: 1 }, { topo: 2, franja: 0, nordico: 1 }, { topo: 0, tonsura: 1, lat: 3, nuca: 3 }, { topo: 3, franja: 0, cachos: 1, lat: 6, nuca: 6 },
];

// ---------- geometria do corpo ----------
function geo(ap, vis) {
  const R = RACAS[ap.raca] || RACAS.humano; let h = clamp((ap.altura | 0) + R.alt, -7, 4); if (vis.crianca) h -= 3;
  const LL = clamp(10 + Math.round(h * 0.9), 5, 14), TH = clamp(10 + (h >= 2 ? 1 : 0) + (h <= -4 ? -1 : 0), 8, 12), HH = 13 + (R.cab || 0) + (vis.crianca ? 1 : 0);
  let TW = clamp([10, 12, 14][ap.corpo | 0] + R.larg - (vis.crianca ? 2 : 0), 8, 18); TW -= TW % 2;
  const hipY = BASE - LL, shY = hipY - TH, headTop = shY - HH + 1;
  const faceT = FACES[ap.rosto | 0] || FACES[0]; const faces = []; for (let i = 0; i < HH; i++) faces.push(faceT[Math.round(i * 11 / (HH - 1))] + 1 + ((R.cab || 0) > 0 && i > 2 ? 1 : 0) + (ap.raca === 'meioorc' && i > 6 ? 1 : 0));
  const eyeY = headTop + HH - 7, mouthY = headTop + HH - 3;
  return { R, LL, TH, HH, TW, hipY, shY, headTop, faces, eyeY, mouthY, tl: CX - TW / 2, tr: CX + TW / 2 - 1, legW: TW >= 14 ? 5 : TW <= 9 ? 3 : 4 };
}

// ---------- utilidades de forma ----------
const tecido = (p, x, y, w, h, c) => { const R = rampa(c); p.rect(x, y, w, h, R); for (let j = 0; j < h; j++) { p.set(x, y + j, R.h); p.set(x + w - 1, y + j, R.s); if (w > 3) p.set(x + w - 2, y + j, R.s); } for (let i = 0; i < w; i++) { p.set(x + i, y, R.h); p.set(x + i, y + h - 1, R.s); } for (let k = 3; k < w - 2; k += 4) for (let j = 1; j < h - 1; j++) p.set(x + k, y + j, R.s); return p; };
const metal = (p, x, y, w, h, c) => { const R = rampa(c); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const nx = w > 1 ? (i / (w - 1)) * 2 - 1 : 0; let t = R.b; if (nx < -0.45) t = R.h; if (nx > 0.45) t = R.s; if (nx > 0.8) t = R.s2; if (j === 0) t = R.h2; if (j === h - 1 && h > 2) t = R.s; if (nx < -0.8 && j > 0) t = R.h2; p.set(x + i, y + j, t); } return p; };
const malha = (p, x, y, w, h, c) => { const R = rampa(c); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = (i + j) % 2 === 0; let t = k ? R.b : R.s; if (i === 0) t = k ? R.h2 : R.h; if (i >= w - 2) t = k ? R.s : R.s2; if (j === 0) t = R.h; p.set(x + i, y + j, t); } return p; };
const escamas = (p, x, y, w, h, c) => { const R = rampa(c); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const o = (j % 3 === 0) ? 0 : 1; const ii = (i + o * 2) % 4; let t = ii === 0 ? R.s : ii === 1 ? R.h : R.b; if (j % 3 === 2) t = R.s; if (i >= w - 2) t = R.s; p.set(x + i, y + j, t); } return p; };
const couro = (p, x, y, w, h, c) => { const R = rampa(c); p.rect(x, y, w, h, R); for (let j = 0; j < h; j++) { p.set(x, y + j, R.h); p.set(x + w - 1, y + j, R.s); if (w > 3) p.set(x + w - 2, y + j, R.s); } for (let i = 0; i < w; i++) { p.set(x + i, y, R.h); p.set(x + i, y + h - 1, R.s2); } for (let k = 2; k < w - 1; k += 3) for (let j = 2; j < h - 1; j += 2) p.set(x + k, y + j, R.s); return p; };
const pele = (p, x, y, w, h, c) => { const R = rampa(c); p.rect(x, y, w, h, R); for (let j = 0; j < h; j++) { p.set(x, y + j, R.h); p.set(x + w - 1, y + j, R.s); } for (let i = 0; i < w; i++) { p.set(x + i, y + h - 1, R.s); } return p; };
const pelo = (p, x, y, w, h, c) => { const R = rampa(c); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = (i * 3 + j * 5) % 7; p.set(x + i, y + j, k < 2 ? R.h2 : k < 5 ? R.b : R.s); } for (let i = 0; i < w; i += 2) p.set(x + i, y + h - 1, R.s2); return p; };
const MATERIAL = { tecido, couro, malha, escamas, placa: metal, pele: couro };

// ---------- peças do corpo ----------
function pernas(p, g, view, frame, cor, bota, saia) {
  const { hipY, LL, legW } = g; const bR = rampa(bota), pR = rampa(cor);
  const alt = (fr, lado) => (fr === 0 ? 0 : (fr === 1) === (lado === 0) ? 2 : 0); // perna levantada
  if (view === 's') {
    const frente = frame === 0 ? 0 : frame === 1 ? -3 : 3, tras = -frente;
    for (const [dx, dim] of [[tras, true], [frente, false]]) {
      const x = CX - 2 + dx, lift = frame !== 0 && ((dx < 0) === (frame === 1)) ? 0 : (frame !== 0 ? 2 : 0);
      const h = LL - (frame !== 0 && dx * (frame === 1 ? 1 : -1) > 0 ? 0 : 0) - lift; const c = dim ? pR.s : pR.b;
      p.rect(x, hipY, legW, h - 3, dim ? { ...pR, b: pR.s, h: pR.b, s: pR.s2 } : pR, 'c');
      const by = hipY + h - 4 > hipY ? hipY + h - 4 : hipY; p.rect(x - 1, by, legW + 2, 4, dim ? { ...bR, b: bR.s, h: bR.b } : bR, 'cv'); p.rect(x - 2, by + 3, legW + 3, 1, bR.s2); void c;
    }
    return;
  }
  for (let lado = 0; lado < 2; lado++) {
    const x = lado === 0 ? CX - legW - 0 : CX + 0, a = alt(frame, lado), h = LL - a; const px = view === 'b' ? x : x;
    p.rect(px, hipY, legW, h - 4 + 0, pR, 'c'); p.rect(px - (lado === 0 ? 1 : 0), hipY + h - 4, legW + 1, 4, bR, 'cv'); p.rect(px - (lado === 0 ? 1 : 0), hipY + h - 1, legW + 1, 1, bR.s2);
    if (view === 'f') { p.set(px + (lado === 0 ? 1 : legW - 2), hipY + h - 3, bR.h2); }
  }
  void saia;
}
function bracos(p, g, view, frame, manga, pelec, opc = {}) {
  const { shY, TH, tl, tr } = g; const len = TH - 2 + (opc.cast ? 0 : 0); const mR = rampa(manga), sR = rampa(pelec);
  const sw = frame === 0 ? [0, 0] : frame === 1 ? [-1, 1] : [1, -1];
  if (view === 's') { const x = CX - 2 + (frame === 0 ? 0 : frame === 1 ? 2 : -2); p.rect(x, shY + 2, 4, len - 1, mR, 'cv'); p.rect(x, shY + len + 1, 4, 3, sR, 'c'); return; }
  const arms = [[tl - 3, 0], [tr + 1, 1]];
  for (const [x, lado] of arms) {
    const dy = opc.cast ? -(5) : opc.atq && lado === 0 ? -2 : sw[lado]; const y = shY + 1 + dy; const l = len - (opc.cast ? 3 : 0);
    if (opc.cast) { p.rect(x + (lado === 0 ? 1 : -1), y, 3, l, mR, 'cv'); p.rect(x + (lado === 0 ? 1 : -1), y - 2, 3, 3, sR, 'c'); }
    else { p.rect(x, y, 3, l, mR, 'cv'); p.rect(x, y + l, 3, 3, sR, 'c'); p.set(x + (lado === 0 ? 0 : 2), y + l + 2, sR.s); }
  }
}
function torsoBase(p, g, view, mat, cor, alt = 0) {
  const { shY, TH, tl, tr, TW } = g; const f = MATERIAL[mat] || tecido; const x = view === 's' ? CX - Math.round(TW * 0.32) : tl, w = view === 's' ? Math.round(TW * 0.64) : TW;
  f(p, x, shY, w, TH, cor);
  p.clr(x, shY); p.clr(x + w - 1, shY); void tr; void alt;
}

// ---------- cabeça ----------
function cabeca(p, g, ap, view, R) {
  const { HH, faces, headTop, eyeY } = g; const sk = rampa(ap.pele);
  const drag = ap.raca === 'draconato';
  for (let r = 0; r < HH; r++) {
    const w = faces[r]; const x0 = view === 's' ? CX - Math.round(w * 0.5) : CX - Math.floor(w / 2); const ww = view === 's' ? Math.round(w * 0.78) : w;
    for (let i = 0; i < ww; i++) {
      let t = sk.b; if (i === 0 && ww > 5) t = sk.h; if (i === ww - 1 && ww > 5) t = sk.s; if (i === ww - 2 && ww > 8) t = sk.s; if (r >= HH - 2) t = sk.s; if (r === 0 || (r === 1 && i > 1 && i < ww - 2)) t = sk.h;
      if (drag && ((i + r * 2) % 4 === 0)) t = i < ww / 2 ? sk.s : sk.s2; p.set(x0 + i, headTop + r, t);
    }
  }
  // pescoço
  p.rect(CX - 2, g.shY - 1, 4, 2, sk.s);
  // orelhas
  const ey = eyeY - 1, hw = faces[Math.round((eyeY - headTop))] || 10; const orelha = R.orelha;
  if (view === 'f' || view === 'b') {
    const lx = CX - Math.floor(hw / 2) - 1, rx = CX + Math.ceil(hw / 2);
    const pt = (x, y, dir) => {
      if (orelha === 'nenhuma') { if (drag) { p.rect(x + (dir < 0 ? -1 : 0), y - 1, 2, 4, sk.s2); p.set(x + (dir < 0 ? -1 : 1), y - 2, sk.s2); } return; }
      p.rect(x, y, 1, 3, sk.b); p.set(x, y + 1, sk.s);
      if (orelha === 'pontuda') { p.set(x + dir, y, sk.b); p.set(x + dir, y - 1, sk.h); p.set(x + dir * 2, y - 1, sk.b); p.set(x + dir * 3, y - 2, sk.h); }
      if (orelha === 'longa') { p.set(x + dir, y, sk.b); p.set(x + dir, y - 1, sk.h); p.set(x + dir * 2, y - 1, sk.b); p.set(x + dir * 3, y - 1, sk.b); p.set(x + dir * 4, y - 2, sk.h); p.set(x + dir * 2, y, sk.s); }
      if (orelha === 'pequena') { p.set(x + dir, y - 1, sk.b); }
    };
    pt(lx, ey, -1); pt(rx, ey, 1);
  } else if (orelha !== 'nenhuma') { // lado: orelha ao centro
    const x = CX + 1, y = ey; p.rect(x, y, 2, 3, sk.b); p.set(x + 1, y + 1, sk.s);
    if (orelha === 'pontuda') { p.set(x + 1, y - 1, sk.b); p.set(x + 2, y - 2, sk.h); }
    if (orelha === 'longa') { p.set(x + 1, y - 1, sk.b); p.set(x + 2, y - 2, sk.b); p.set(x + 3, y - 3, sk.h); p.set(x + 3, y - 2, sk.b); p.set(x + 2, y - 1, sk.h); }
    if (orelha === 'pequena') p.set(x + 1, y - 1, sk.b);
  }
}
function rosto(p, g, ap, view, R) {
  const { eyeY, mouthY, faces, headTop } = g; const sk = rampa(ap.pele); const hw = faces[eyeY - headTop] || 10;
  const sep = 1 + Math.round((hw - 9) / 3); const ox = view === 's' ? -3 : 0;
  const olhoCor = ap.olhosCor || '#5a3a1e'; const oR = rampa(olhoCor); const sobrCor = ap.cabeloCor || '#3b2616'; const brow = (ap.raca === 'draconato') ? null : sobrCor;
  const feroz = ap.olhos === 5, estilo = ap.olhos | 0; const sem = ap.raca === 'tiefling' && ['#e8e8f0', '#e8c02a', '#d82a2a', '#18e0b0'].includes(olhoCor); const drag = ap.raca === 'draconato';
  const OL = '#1c1420'; const branco = sem ? olhoCor : '#f4f0ee';
  const olho = (x, y, lado) => { // lado: -1 esquerdo, 1 direito (vista de frente)
    const out = lado; const w = estilo === 2 ? 3 : estilo === 3 ? 3 : estilo === 1 ? 2 : 3; const h = estilo === 3 ? 3 : estilo === 2 ? 1 : 2;
    if (estilo === 2) { p.set(x, y + 1, OL); p.set(x + 1, y + 1, oR.b); p.set(x + 2, y + 1, OL); return; }
    if (estilo === 1) { p.set(x, y, branco); p.set(x + 1, y, oR.b); p.set(x, y + 1, oR.s); p.set(x + 1, y + 1, oR.b); p.set(x + (out < 0 ? 0 : 1), y - 1, OL); p.set(x + (out < 0 ? 1 : 0), y - 1, OL); return; }
    if (estilo === 3) { p.set(x, y - 1, OL); p.set(x + 1, y - 1, OL); p.set(x + 2, y - 1, OL); p.set(x, y, branco); p.set(x + 1, y, oR.h); p.set(x + 2, y, branco); p.set(x, y + 1, branco); p.set(x + 1, y + 1, oR.b); p.set(x + 2, y + 1, oR.s); p.set(x + 1, y, '#ffffff'); p.set(x + 1, y + 1, oR.b); return; }
    // amendoado / caído / feroz: pálpebra + esclera + íris 2px
    const lid = mistura(ap.pele, OL, 0.6);
    p.set(x, y, lid); p.set(x + 1, y, lid); p.set(x + 2, y, lid);
    if (estilo === 0) p.set(x + (out < 0 ? 0 : 2), y - 1, lid); if (estilo === 4) p.set(x + (out < 0 ? 0 : 2), y + 1, lid);
    if (out < 0) { p.set(x, y + 1, branco); p.set(x + 1, y + 1, oR.b); p.set(x + 2, y + 1, oR.h); } else { p.set(x, y + 1, oR.h); p.set(x + 1, y + 1, oR.b); p.set(x + 2, y + 1, branco); }
    if (drag) { p.set(x + 1, y + 1, '#e8c02a'); } void w; void h;
  };
  if (view === 'f') {
    const lx = CX - sep - 3, rx = CX + sep + 0; olho(lx, eyeY, -1); olho(rx, eyeY, 1);
    if (drag) { p.set(lx + 1, eyeY + 1, '#1c1420'); p.set(rx + 1, eyeY + 1, '#1c1420'); }
    if (brow && ap.sobr !== undefined) { const bs = ap.sobr | 0; for (const [bx, lado] of [[lx, -1], [rx, 1]]) { const by = eyeY - (estilo === 3 ? 3 : 2);
      if (bs === 0) { p.rect(bx, by, 3, 1, brow); } else if (bs === 1) { p.set(bx, by + (lado < 0 ? 1 : 0), brow); p.set(bx + 1, by, brow); p.set(bx + 2, by + (lado < 0 ? 0 : 1), brow); } else if (bs === 2) { p.rect(bx, by, 3, 2, brow); } else if (bs === 3) { p.set(bx, by + (lado < 0 ? 0 : 1), brow); p.set(bx + 1, by + 0, brow); p.set(bx + 2, by + (lado < 0 ? 1 : 0), brow); p.set(bx + (lado < 0 ? 2 : 0), by + 1, brow); } else { p.rect(bx, by, 2, 1, brow); }
      if (feroz) p.set(bx + (lado < 0 ? 2 : 0), by + 1, brow); } }
    // nariz
    const n = ap.nariz | 0, ny = eyeY + 2; const sh = sk.s2;
    if (drag) { p.set(CX - 1, ny + 1, sh); p.set(CX, ny + 1, sh); }
    else if (n === 0) { p.set(CX, ny, sk.h); p.set(CX - 1, ny + 1, sh); p.set(CX, ny + 1, sk.s); } else if (n === 1) { p.set(CX - 1, ny + 1, sh); p.set(CX, ny + 1, sh); p.set(CX, ny, sk.h2); } else if (n === 2) { p.set(CX - 2, ny + 1, sh); p.set(CX - 1, ny + 1, sk.s); p.set(CX, ny + 1, sk.s); p.set(CX + 1, ny + 1, sh); p.set(CX, ny, sk.h); } else { p.set(CX, ny - 1, sk.s); p.set(CX, ny, sk.s); p.set(CX - 1, ny + 1, sh); p.set(CX, ny + 1, sh); }
    if (ap.raca === 'anao' || ap.raca === 'gnomo') { p.set(CX - 1, ny, sk.h); p.set(CX, ny, sk.h); p.set(CX - 1, ny + 1, sk.s); p.set(CX, ny + 1, sk.s); p.set(CX - 2, ny + 1, sh); p.set(CX + 1, ny + 1, sh); }
    if (drag) { const sn = rampa(mistura(ap.pele, '#f0e0b0', 0.4)); p.rect(CX - 3, ny - 1, 6, 4, sn, 'cv'); p.set(CX - 1, ny, sk.s2); p.set(CX, ny, sk.s2); }
    // boca
    const b = ap.boca | 0, mc = mistura(ap.pele, '#7a1e2a', 0.65), my = mouthY; if (drag) { p.rect(CX - 2, my, 4, 1, mc); } else if (b === 0) { p.rect(CX - 1, my, 2, 1, mc); } else if (b === 1) { p.rect(CX - 1, my, 2, 1, mc); p.set(CX - 2, my - 1, mc); p.set(CX + 1, my - 1, mc); } else if (b === 2) { p.rect(CX - 2, my, 4, 1, escurece(mc, 0.2)); } else { p.set(CX - 1, my, mc); p.set(CX, my, mc); }
    if (R.presas) { p.set(CX - 3, my - 1, '#f4f0e0'); p.set(CX + 2, my - 1, '#f4f0e0'); p.set(CX - 3, my, '#e8e0cc'); p.set(CX + 2, my, '#e8e0cc'); }
  } else if (view === 's') {
    const x = CX - 5 + (ap.rosto === 4 ? 0 : 0), by = eyeY - 2;
    olho(x + ox + 3, eyeY, -1); if (brow) { p.rect(x + 2 + 3 + ox, by, 3, 1, brow); }
    const ny = eyeY + 2; p.set(x + 3 + ox - 1, ny, sk.h); p.set(x + 3 + ox - 2, ny + 1, sk.s); p.set(x + 3 + ox - 1, ny + 1, sk.s2);
    if (ap.nariz === 3) p.set(x + ox + 1, ny, sk.s);
    const mc = mistura(ap.pele, '#7a1e2a', 0.65); p.rect(x + ox + 3, mouthY, 2, 1, mc);
    if (R.presas) { p.set(x + ox + 3, mouthY - 1, '#f4f0e0'); }
    if (drag) { const sn = rampa(mistura(ap.pele, '#f0e0b0', 0.4)); p.rect(x + ox - 1, eyeY + 1, 4, 4, sn, 'cv'); p.set(x + ox - 1, eyeY + 2, sk.s2); }
  }
}
function marcas(p, g, ap, view) {
  const m = ap.marca | 0; if (!m || view === 'b') return; const { eyeY, mouthY } = g; const sk = ap.pele; const sep = 1 + Math.round(((g.faces[eyeY - g.headTop] || 10) - 9) / 3);
  const lx = view === 's' ? CX - 5 : CX - sep - 3, rx = CX + sep; const cic = mistura(sk, '#e8707a', 0.55), cicE = mistura(sk, '#5a1a2a', 0.5);
  if (m === 1) { p.line(rx + 2, eyeY - 3, rx, eyeY + 3, cicE); p.line(rx + 3, eyeY - 3, rx + 1, eyeY + 3, cic); }
  else if (m === 2) { p.line(lx - 1, eyeY + 2, lx + 2, eyeY + 5, cicE); p.line(lx, eyeY + 2, lx + 3, eyeY + 5, cic); }
  else if (m === 3) { const d = escurece(sk, 0.22); for (const [x, y] of [[CX - 3, eyeY + 2], [CX - 1, eyeY + 3], [CX + 2, eyeY + 2], [CX - 4, eyeY + 3], [CX + 3, eyeY + 3], [CX + 1, eyeY + 2]]) p.set(view === 's' ? x - 3 : x, y, d); }
  else if (m === 4) { p.rect(lx - 1, eyeY + 2, 5, 1, '#c8302a'); p.rect(rx - 1, eyeY + 2, 5, 1, '#c8302a'); p.rect(lx - 1, eyeY + 4, 5, 1, '#f4f0e0'); p.rect(rx - 1, eyeY + 4, 5, 1, '#f4f0e0'); }
  else if (m === 5) { const c = '#2a3a8a'; p.line(CX - 1, g.headTop + 2, CX - 1, g.headTop + 4, c); p.line(CX, g.headTop + 2, CX, g.headTop + 4, c); p.set(CX - 2, g.headTop + 3, c); p.set(CX + 1, g.headTop + 3, c); p.line(rx + 2, eyeY + 2, rx + 3, eyeY + 5, c); p.set(rx + 1, eyeY + 4, c); }
  else if (m === 6) { const d = escurece(sk, 0.18); p.rect(lx, eyeY + 2, 3, 1, d); p.rect(rx, eyeY + 2, 3, 1, d); }
  else if (m === 7) { p.set(CX + 2, mouthY - 1, escurece(sk, 0.5)); }
  else if (m === 8) { const d = escurece(sk, 0.2); p.rect(CX - 3, g.headTop + 2, 6, 1, d); p.set(lx - 1, eyeY + 1, d); p.set(rx + 3, eyeY + 1, d); p.set(CX - 2, mouthY - 1, d); p.set(CX + 1, mouthY - 1, d); }
  else if (m === 9) { const c = mistura(sk, '#ff6a80', 0.4); p.rect(lx, eyeY + 3, 3, 2, c); p.rect(rx, eyeY + 3, 3, 2, c); }
}

// ---------- cabelo ----------
const FR_S = [1, 2, 3, 6, 2];
function cabelo(p, g, ap, view, def, camada) {
  if (!def || ap.raca === 'draconato') return;
  const cor = ap.cabeloCor || '#3b2616', hr = rampa(cor);
  const { headTop, HH, faces } = g; const fwr = (r) => faces[clamp(r - headTop, 0, HH - 1)] || 10;
  const hw = fwr(headTop + 5), half = hw / 2, vol = def.topo | 0, fr = def.franja | 0, nuca = def.nuca | 0, lat = def.lat | 0;
  const chin = headTop + HH - 1, nape = headTop + HH - 4, yMax = g.hipY - 2;
  const careca = vol === 0 && !def.tonsura && !lat && !nuca; if (careca) return;
  if (camada === 'tras') {
    if (nuca && view !== 's') { const yb = Math.min(yMax, headTop + 4 + nuca); const w = hw + 3 + (def.onda ? 2 : 0); for (let y = headTop + 3; y <= yb; y++) { const ww = w - (y > yb - 2 ? 2 : 0) - (y === yb ? 2 : 0); const x0 = CX - Math.floor(ww / 2); pelo(p, x0, y, ww, 1, cor); p.set(x0, y, hr.h); p.set(x0 + ww - 1, y, hr.s2); } }
    if (nuca && view === 's') { const yb = Math.min(yMax, headTop + 4 + nuca); for (let y = headTop + 3; y <= yb; y++) { const ww = 6 - (y > yb - 2 ? 2 : 0); pelo(p, CX - 1, y, ww, 1, cor); p.set(CX + ww - 2, y, hr.s2); } }
    if (def.trancaLonga) { for (let k = 0; k < 14; k++) { const y = headTop + 8 + k; const x = (view === 's' ? CX + 3 : CX - 1) + Math.round(Math.sin(k * 0.8)); p.rect(x, y, 3, 1, k % 3 === 2 ? hr.s2 : k % 2 ? hr.s : hr.b); } p.rect(view === 's' ? CX + 3 : CX - 1, headTop + 22, 3, 1, '#c8a040'); }
    if (def.rabo && view !== 'f') { const alto = def.rabo === 'alto'; const y0 = alto ? headTop - 1 : headTop + 5; const x0 = view === 's' ? CX + 3 : CX - 1; for (let k = 0; k < 10; k++) p.rect(x0 + (view === 's' ? Math.round(k * 0.4) : 0), y0 + k, 3 - (k > 6 ? 1 : 0), 1, k % 3 === 2 ? hr.s : k % 2 ? hr.b : hr.h); p.set(x0 + 1, y0 + 1, '#c8302a'); }
    if (def.rabo && view === 'f') { const alto = def.rabo === 'alto'; p.rect(CX - 1, alto ? headTop - 3 : headTop + 6, 3, alto ? 3 : 8, hr.s); }
    if (def.dreads) { for (let k = -5; k <= 5; k += 2) { const y1 = headTop + 7 + ((k * 3) & 3); for (let y = headTop + 3; y <= y1 + 4; y++) p.set(CX + k + (view === 's' ? 1 : 0), y, y % 3 === 0 ? hr.s2 : hr.b); } }
    return;
  }
  const topY = headTop - (vol >= 4 ? 4 : vol >= 3 ? 2 : vol >= 2 ? 1 : 0) - (def.afro ? 3 : 0) - (def.cachos ? 1 : 0);
  const mulher = false; void mulher;
  if (def.tonsura) { const fy = headTop + 2; for (let y = fy; y < headTop + 8; y++) { if (view === 'b') { pelo(p, CX - Math.floor(hw / 2) - 1, y, hw + 2, 1, cor); continue; } if (view === 's') { pelo(p, CX - 1, y, 4, 1, cor); continue; } pelo(p, CX - Math.floor(hw / 2) - 1, y, 2, 1, cor); pelo(p, CX + Math.ceil(hw / 2) - 1, y, 2, 1, cor); } return; }
  if (def.moicano) { const x0 = view === 's' ? CX - 3 : CX - 1; for (let y = headTop - 4; y < headTop + 6; y++) { pelo(p, x0, y, 3, 1, cor); } p.rect(x0 + 1, headTop - 5, 1, 1, hr.h2); p.set(x0, headTop - 4, hr.h); if (view !== 'f') p.rect(CX - Math.floor(hw / 2), headTop + 3, hw, 2, hr.s); return; }
  const sideEnd = def.undercut || def.nordico ? headTop + 3 : lat ? headTop + 5 + Math.min(lat, 12) : def.rente ? headTop + 3 : headTop + 6;
  const bulge = def.afro ? 3 : def.cachos ? 1 : 0;
  for (let y = topY; y <= chin; y++) {
    const w = fwr(Math.max(y, headTop)); let L, R;
    if (view === 's') { const wr = Math.round(w * 0.78), x0 = CX - Math.round(w * 0.5); L = x0 - 0; R = x0 + wr + 0; if (y < headTop) { const t = (headTop - y) / (headTop - topY + 1), sh = Math.round((1 - Math.sqrt(1 - t * t)) * 3.2); L += sh; R -= Math.round(sh * 0.6); } L -= bulge; R += bulge; }
    else { L = CX - Math.floor(w / 2) - 1; R = CX + Math.ceil(w / 2); if (y < headTop) { const t = (headTop - y) / (headTop - topY + 1), sh = Math.round((1 - Math.sqrt(1 - t * t)) * (half + 1.2)); L += sh; R -= sh; } L -= bulge; R += bulge; }
    for (let x = L; x <= R; x++) {
      let edge;
      if (view === 'b') edge = nape + (nuca ? Math.min(nuca, 3) : 0);
      else if (view === 's') { const f = x - L, b = R - x; if (f <= 3 && y >= headTop) edge = headTop + FR_S[fr]; else if (b <= 3) edge = nape + 1 + (nuca ? Math.min(nuca, 3) : 0); else edge = lat ? sideEnd : headTop + 4; }
      else { const dx = x - CX + 0.5, u = dx / (half + 1); if (Math.abs(dx) >= w / 2 - 1.2 && y >= headTop) edge = sideEnd; else if (fr === 0) edge = headTop + 2 + (Math.abs(u) > 0.6 ? 1 : 0); else if (fr === 1) edge = headTop + 2 + Math.round(2.6 * clamp((0.9 - u) / 1.8, 0, 1)); else if (fr === 2) edge = headTop + 3 + ((x & 1) ? 1 : 0); else if (fr === 3) edge = u < -0.05 ? headTop + 7 : headTop + 3; else edge = headTop + 2 + Math.round(2.6 * Math.min(1, Math.abs(u) * 1.4)); }
      if (y > edge) continue;
      const dxn = (x - (L + R) / 2) / ((R - L) / 2 + 0.01); let t = hr.b;
      if (y <= topY + 1 || (dxn < -0.3 && y <= headTop + 1)) t = hr.h; else if ((x * 2 + y * 3) % 7 === 0 && y < edge) t = hr.h;
      if (dxn > 0.72 || y >= edge) t = hr.s; if (y === topY && Math.abs(dxn) < 0.4) t = hr.h2;
      p.set(x, y, def.undercut && y > headTop + 1 && (view === 'f' && Math.abs(x - CX + 0.5) >= half - 1.5) ? ajusta(cor, { l: -0.12 }) : t);
    }
  }
  if (view === 'f') {
    if (def.quiff) { p.ell(CX - 1, headTop - 1, 5, 2.6, hr); p.ell(CX - 2, headTop - 2, 3, 1.6, hr); }
    if (def.lat) { const ln = Math.min(def.lat, 12); for (let y = headTop + 6; y < headTop + 5 + ln; y++) { pelo(p, CX - Math.floor(hw / 2) - 2, y, 2, 1, cor); pelo(p, CX + Math.ceil(hw / 2), y, 2, 1, cor); } }
    if (def.tranca2) { for (const s of [-1, 1]) for (let k = 0; k < 11; k++) { const x = CX + s * (Math.floor(hw / 2) + 1) + (s < 0 ? -1 : 0) + Math.round(Math.sin(k * 0.9) * 0.7); p.rect(x, headTop + 6 + k, 2, 1, k % 3 === 2 ? hr.s2 : k % 2 ? hr.s : hr.b); } p.set(CX - Math.floor(hw / 2) - 2, headTop + 17, '#c8a040'); p.set(CX + Math.ceil(hw / 2) + 1, headTop + 17, '#c8a040'); }
    if (def.trancaLado || def.nordico) { for (let k = 0; k < 12; k++) { const x = CX - Math.floor(hw / 2) - 2 + Math.round(Math.sin(k * 0.9)); p.rect(x, headTop + 4 + k, 2, 1, k % 3 === 2 ? hr.s2 : k % 2 ? hr.s : hr.b); } p.rect(CX - Math.floor(hw / 2) - 2, headTop + 16, 2, 1, '#c8a040'); }
  } else if (view === 's') {
    if (def.tranca2 || def.trancaLado || def.nordico) { for (let k = 0; k < 11; k++) p.rect(CX + 1 + Math.round(Math.sin(k) * 0.6), headTop + 5 + k, 2, 1, k % 2 ? hr.s : hr.b); }
  }
  if (def.espetos) { for (let k = -4; k <= 4; k += 2) { const hh = 3 + (k % 4 === 0 ? 1 : 0), cxs = view === 's' ? CX - 2 : CX; p.poly([[cxs + k - 1, headTop + 1], [cxs + k + (k < 0 ? -1 : 1) * 0.4, headTop - hh], [cxs + k + 1, headTop + 1]], hr, 'g'); } }
  if (def.cachos) { for (const [x, y] of [[-5, 2], [-3, -1], [0, -2], [3, -1], [5, 2], [-6, 5], [6, 5]]) p.ell((view === 's' ? CX - 2 : CX) + x, headTop + y + 1, 2.4, 2.4, hr); }
  if (def.coque) { const y = headTop - 4; const x = view === 's' ? CX + 1 : CX; p.ell(x, y + 1.5, 3.3, 3, hr); p.set(x - 1, y, hr.h2); p.rect(x - 2, y + 4, 5, 1, hr.s2); }
  if (def.rabo && view === 'f') p.rect(CX - 2, headTop - 1, 5, 1, hr.s);
}
function barba(p, g, ap, view) {
  const b = ap.barba | 0; if (!b || view === 'b' || ap.raca === 'draconato') return; const { faces, headTop, HH, mouthY, eyeY } = g; const cor = ap.barbaCor || ap.cabeloCor || '#3b2616'; const hr = rampa(cor);
  const chin = headTop + HH - 1; const fw = (r) => faces[clamp(r - headTop, 0, HH - 1)] || 8; const stub = mistura(ap.pele, cor, 0.5);
  const preenche = (y0, y1, extra, cola = 0) => { for (let y = y0; y <= y1; y++) { const w = (y <= chin ? fw(y) : Math.max(2, fw(chin) - (y - chin) * (cola || 1))) + extra; const x0 = view === 's' ? CX - 5 : CX - Math.floor(w / 2); const ww = view === 's' ? Math.max(2, Math.round(w * 0.55)) : w; pelo(p, x0, y, ww, 1, cor); if (ww > 2) p.set(x0, y, hr.h); } };
  const bigode = (y) => { if (view === 's') { p.rect(CX - 6, y, 4, 1, hr.b); p.rect(CX - 6, y + 1, 2, 1, hr.s); } else { p.rect(CX - 4, y, 3, 1, hr.b); p.rect(CX + 1, y, 3, 1, hr.b); p.set(CX - 5, y + 1, hr.s); p.set(CX + 4, y + 1, hr.s); p.rect(CX - 1, y, 2, 1, hr.h); } };
  const ym = mouthY - 1;
  if (b === 1) { for (let y = eyeY + 3; y <= chin; y++) { const w = fw(y); const x0 = view === 's' ? CX - 5 : CX - Math.floor(w / 2); const ww = view === 's' ? Math.round(w * 0.55) : w; for (let i = 0; i < ww; i++) if ((i + y) % 2 === 0 && !(y < mouthY - 1 && i > 2 && i < ww - 3)) p.set(x0 + i, y, stub); } }
  else if (b === 2) bigode(ym);
  else if (b === 3) { bigode(ym); for (let y = mouthY + 1; y <= chin + 2; y++) { const w = y > chin ? 3 : 4; pelo(p, (view === 's' ? CX - 5 : CX - Math.floor(w / 2)), y, w, 1, cor); } }
  else if (b === 4) { preenche(mouthY - 3, chin + 1, 0, 1); p.rect(CX - 1, mouthY, 2, 1, mistura(ap.pele, '#7a1e2a', 0.55)); bigode(ym); }
  else if (b === 5) { preenche(eyeY + 2, chin + 3, 0, 2); p.rect(CX - 1, mouthY, 2, 1, '#6a1a24'); bigode(ym); }
  else if (b === 6) { preenche(eyeY + 2, chin + 8, 0, 1); p.rect(CX - 1, mouthY, 2, 1, '#6a1a24'); bigode(ym); }
  else if (b === 7) { preenche(eyeY + 2, chin + 1, 0, 1); p.rect(CX - 1, mouthY, 2, 1, '#6a1a24'); bigode(ym); for (const s of [-2, 1]) for (let k = 0; k < 9; k++) p.rect(CX + s + (view === 's' ? -2 : 0), chin + 2 + k, 2, 1, k % 3 === 2 ? hr.s2 : k % 2 ? hr.s : hr.b); p.rect(CX - 2 + (view === 's' ? -2 : 0), chin + 9, 2, 1, '#d8b43a'); p.rect(CX + 1 + (view === 's' ? -2 : 0), chin + 9, 2, 1, '#d8b43a'); }
  else if (b === 8) { bigode(ym); preenche(mouthY + 1, chin + 3, -3, 1); }
  else if (b === 9) { for (let y = eyeY; y <= mouthY + 1; y++) { const w = fw(y); if (view === 's') { pelo(p, CX - 1, y, 3, 1, cor); } else { pelo(p, CX - Math.floor(w / 2), y, 2, 1, cor); pelo(p, CX + Math.ceil(w / 2) - 2, y, 2, 1, cor); } } bigode(ym); }
  else if (b === 10) { preenche(eyeY + 2, chin + 11, 0, 1); p.rect(CX - 1, mouthY, 2, 1, '#6a1a24'); bigode(ym); }
  else if (b === 11) { preenche(eyeY + 2, chin + 1, 0, 1); p.rect(CX - 1, mouthY, 2, 1, '#6a1a24'); bigode(ym); for (const s of [-1, 1]) for (let k = 0; k < 6; k++) pelo(p, CX + s * (2 + (k > 3 ? 1 : 0)) - (s < 0 ? 1 : 0) + (view === 's' ? -2 : 0), chin + 2 + k, 2, 1, cor); }
}

// ---------- elmo, capuz, chapéu, chifres e acessórios ----------
function capuzGeo(g, view) { const hw = g.faces[Math.min(g.HH - 1, 4)] || 10; return view === 's' ? [CX - 1, g.headTop + 4, hw / 2 + 2.2, 7.4] : [CX, g.headTop + 4, hw / 2 + 2.6, 7.4]; }
function capuzTras(p, g, ap, view) { const R = rampa(ap.arm1 || '#9aa0b0'); const [hx, hy, hrx, hry] = capuzGeo(g, view); p.ell(hx, hy, hrx, hry, R); p.rect(CX - Math.floor(g.TW / 2) - 1, g.shY - 2, g.TW + 2, 4, R, 'cv'); }
function topo(p, g, ap, view, kit, vis) {
  const { headTop, faces, HH, eyeY } = g; const hw = faces[Math.min(HH - 1, 4)] || 10; const a1 = rampa(ap.arm1 || '#9aa0b0'), a2 = rampa(ap.arm2 || '#d8b43a');
  const elmo = kit ? kit.elmo : 'nenhum'; const x0 = CX - Math.floor(hw / 2) - 1, w = hw + 2; const cx = view === 's' ? CX + 1 : CX; void x0; void w;
  const metalOK = vis.elmo || ap.elmo;
  if (elmo === 'capuz') { const [hx, hy, hrx, hry] = capuzGeo(g, view); const t = new Pix(W, H); t.ell(hx, hy, hrx, hry, a1); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = t.get(x, y); if (v && (view === 'b' || y <= headTop + 2)) p.set(x, y, v); } if (view === 'f') { p.rect(CX - Math.floor(hw / 2) - 1, headTop + 3, hw + 2, 1, a1.s2); } }
  else if (elmo === 'chapeu') { const R = a1; p.ell(cx, headTop + 1, hw / 2 + 5, 2.4, R); p.poly([[cx - hw / 2 - 1, headTop], [cx + 1, headTop - 12], [cx + hw / 2 + 2, headTop]], R, 'g'); p.set(cx + 3, headTop - 9, R.s); p.rect(cx - hw / 2 - 1, headTop - 1, hw + 4, 2, a2); p.set(cx - 1, headTop - 5, '#fff2a0'); p.set(cx + 2, headTop - 3, '#fff2a0'); p.ell(cx, headTop + 1.3, hw / 2 + 5, 1.2, R.s); }
  else if (elmo === 'coroa') { p.rect(CX - Math.floor(hw / 2), headTop + 1, hw, 2, a2, 'v'); for (const dx of [-3, 0, 3]) { p.set(CX + dx, headTop, a2.h2); p.set(CX + dx, headTop - 1, a2.b); } p.set(CX, headTop + 1, '#ff4a6a'); }
  else if (metalOK && (elmo === 'aberto' || elmo === 'fechado' || elmo === 'crista' || elmo === 'chifres')) {
    const M = a1; const hx0 = CX - Math.floor(hw / 2) - 1, hww = hw + 2;
    p.ell(cx, headTop + 3, hw / 2 + 1.5, 5.2, M); p.rect(hx0, headTop + 3, hww, 3, M, 'cv');
    if (view === 'f') { if (elmo === 'fechado') { p.rect(hx0, headTop + 5, hww, HH - 5, M, 'cv'); p.rect(CX - 3, eyeY - 1, 6, 1, '#16141c'); p.rect(CX - 3, eyeY + 1, 6, 1, '#16141c'); p.rect(CX - 1, eyeY + 2, 2, 3, '#16141c'); p.rect(CX - 1, headTop + 3, 2, 1, a2.h); } else { p.rect(CX - 1, headTop + 3, 2, 6, M, 'c'); p.rect(hx0, headTop + 5, 2, 5, M, 'c'); p.rect(hx0 + hww - 2, headTop + 5, 2, 5, M, 'c'); } }
    else if (view === 'b') p.rect(hx0, headTop + 3, hww, HH - 3, M, 'cv');
    else p.rect(CX - 1, headTop + 3, 6, HH - 4, M, 'cv');
    p.rect(hx0, headTop + 2, hww, 1, a2.h);
    if (elmo === 'crista') { for (let k = 0; k < 7; k++) p.rect(cx - 1 + (k > 4 ? 1 : 0) * (view === 's' ? 1 : 0), headTop - 4 + Math.round(Math.sin(k / 2) * 0.5), 3, 1, a2.s); for (let k = 0; k < 6; k++) p.rect(cx - 1, headTop - 4 + k, 3, 1, k % 2 ? a2.b : a2.h); p.rect(cx - 1, headTop - 5, 3, 1, a2.h2); }
    if (elmo === 'chifres') { for (const s of [-1, 1]) { if (view === 's' && s > 0) continue; for (let k = 0; k < 7; k++) { const x = cx + s * (Math.floor(hw / 2) + 1 + Math.round(k * 0.7)); p.rect(x, headTop + 2 - k, 2, 1, k > 4 ? '#e8e0cc' : '#d8d0b0'); } p.set(cx + s * (Math.floor(hw / 2) + 5), headTop - 5, '#fffaf0'); } }
  }
  else if (elmo === 'chifres' && !metalOK && vis.cls === 'barbaro') { /* sem elmo */ }
  // chifres tiefling e escamas
  if (g.R.chifres && !(elmo === 'capuz' || elmo === 'chapeu' || (metalOK && elmo !== 'nenhum' && elmo !== 'coroa'))) {
    const hc = rampa(mistura(ap.chifreCor || '#3a2a30', ap.pele, 0.15)); const est = ap.chifre | 0;
    for (const s of [-1, 1]) { if (view === 's' && s > 0) continue; const bx = cx + s * (Math.floor(hw / 2) - 1); const len = est === 3 ? 4 : 8;
      for (let k = 0; k < len; k++) { let dx, dy; if (est === 0) { dx = k * 0.8 + (k > 5 ? 0 : 0); dy = -k + (k > 4 ? 1 : 0); } else if (est === 1) { dx = k * 0.5; dy = -k; } else if (est === 2) { dx = Math.sin(k / 2) * 3 + k * 0.4; dy = -k * 0.6 + Math.cos(k / 2) * 0; } else { dx = k * 0.7; dy = -k * 0.9; }
        const x = bx + s * Math.round(dx), y = headTop + 1 + Math.round(dy); p.rect(x - (s > 0 ? 0 : 1), y, 2, 1, k > len - 3 ? hc.h2 : k % 2 ? hc.b : hc.h); }
    }
  }
  if (g.R.focinho === true && false) void a2;
}
function acessorio(p, g, ap, view) {
  const a = ap.acess | 0; if (!a) return; const { headTop, faces, HH, eyeY } = g; const hw = faces[Math.min(HH - 1, 4)] || 10; const x0 = CX - Math.floor(hw / 2) - 1; const cor = rampa(ap.roupa1 || '#b8352e');
  if (a === 1) { p.rect(x0, headTop + 2, hw + 2, 2, cor); if (view !== 'b') p.set(x0 + hw + 2, headTop + 3, cor.s); else p.rect(CX + 1, headTop + 3, 2, 4, cor.s); }
  else if (a === 2) { p.rect(x0, headTop + 1, hw + 2, 3, cor); p.rect(CX + 2, headTop + 3, 3, 3, cor.s); p.set(CX + 5, headTop + 5, cor.s2); }
  else if (a === 3) { if (view !== 'b') for (const x of [CX - Math.floor(hw / 2) - 1, CX + Math.ceil(hw / 2)]) { p.set(x, eyeY + 2, '#ffd23f'); p.set(x, eyeY + 3, '#fff2a0'); } }
  else if (a === 4) { if (view === 'f') { p.rect(x0, headTop + 2, hw + 2, 1, '#6a4a2a'); p.rect(CX - 5, eyeY - 1, 4, 3, '#2a3a4a'); p.rect(CX + 1, eyeY - 1, 4, 3, '#2a3a4a'); p.rect(CX - 4, eyeY, 2, 1, '#8ad8f0'); p.rect(CX + 2, eyeY, 2, 1, '#8ad8f0'); p.rect(CX - 1, eyeY, 2, 1, '#c8a040'); } else if (view === 's') { p.rect(CX - 6, eyeY - 1, 4, 3, '#2a3a4a'); p.rect(CX - 5, eyeY, 2, 1, '#8ad8f0'); p.rect(CX - 2, headTop + 2, 8, 1, '#6a4a2a'); } else p.rect(x0, headTop + 2, hw + 2, 1, '#6a4a2a'); }
  else if (a === 5) { const f = rampa('#5aa83a'); for (let k = 0; k < hw / 2 + 1; k++) { p.set(CX - 1 - k, headTop + 2 + Math.floor(k / 3), k % 2 ? f.b : f.h); p.set(CX + k, headTop + 2 + Math.floor(k / 3), k % 2 ? f.b : f.h); } p.set(CX - 1, headTop + 2, '#ffd23f'); }
  else if (a === 6) { p.rect(x0 + 1, headTop + 2, hw, 1, '#e0b83a'); p.set(CX, headTop + 3, '#6af0ff'); p.set(CX, headTop + 2, '#e0b83a'); }
  else if (a === 7) { const c = rampa('#7a5230'); p.ell(CX, headTop + 1, hw / 2 + 4, 2.2, c); p.ell(CX, headTop - 1, hw / 2 + 1, 3.4, c); p.rect(CX - Math.floor(hw / 2) - 1, headTop, hw + 2, 1, '#c8302a'); p.set(CX + hw / 2, headTop - 3, '#e8e0cc'); p.set(CX + hw / 2 + 1, headTop - 4, '#e8e0cc'); }
  else if (a === 8) { p.rect(CX - 3, g.shY, 6, 2, cor); p.poly([[CX - 1, g.shY + 2], [CX + 1, g.shY + 2], [CX, g.shY + 5]], cor); }
  else if (a === 9) { if (view === 'f') { p.rect(CX + 2, eyeY - 1, 4, 4, '#c8a040'); p.rect(CX + 3, eyeY, 2, 2, '#8ad8f0'); p.line(CX + 4, eyeY + 4, CX + 5, eyeY + 10, '#c8a040'); } }
}

// ---------- roupas e armaduras ----------
function categoriaArmadura(vis) { return vis.cat || null; }
function kitDe(ap, vis) {
  const cls = vis.cls || 'guerreiro'; const cat = vis.cat || (cls === 'mago' ? 'veste' : (cls === 'clerigo' ? 'veste' : null)); if (!cat) return null;
  const k = KITS[cls]; const lista = k && (k[cat] || k.veste || k.leve || k.media || k.pesada); if (!lista) return null; return lista[(ap.estilo | 0) % lista.length];
}
function desenharRoupa(p, g, ap, view, frame, vis, pose) {
  const kit = kitDe(ap, vis); const { shY, TH, tl, tr, TW, hipY } = g; const sk = ap.pele; const bota = '#4a3020';
  const c1 = ap.roupa1 || '#b8352e', c2 = ap.roupa2 || '#5a3a22'; const o = ap.arm1 || '#9aa0b0', o2 = ap.arm2 || '#d8b43a'; const orn = vis.ornam || 0;
  const cast = pose === 'cast', atq = pose === 'atq';
  if (!kit) { // roupa civil
    const e = ap.roupa | 0; const mangaCor = e === 2 ? sk : (e === 1 ? c2 : c1);
    const longa = e === 4 || e === 5 || e === 6 || e === 7;
    pernas(p, g, view, frame, e === 5 ? c1 : mistura(c2, '#2a2230', 0.35), mistura(c2, '#2a1a10', 0.5), false);
    if (view !== 's') bracos(p, g, view, frame, mangaCor, sk, { cast, atq });
    if (e === 5) { tecido(p, view === 's' ? CX - 4 : tl, shY, view === 's' ? 8 : TW, TH + g.LL - 4, c1); p.rect(view === 's' ? CX - 4 : tl, hipY - 3, view === 's' ? 8 : TW, 2, c2); }
    else { torsoBase(p, g, view, 'tecido', c1); p.rect(view === 's' ? CX - Math.round(TW * 0.32) : tl, hipY - 3, view === 's' ? Math.round(TW * 0.64) : TW, 1, '#5a3a22'); if (view === 'f') p.set(CX, hipY - 3, '#e0c040'); }
    if (e === 1 && view === 'f') { tecido(p, tl, shY, 3, TH, c1); tecido(p, tr - 2, shY, 3, TH, c1); p.rect(CX - 1, shY, 2, 4, c2); }
    if (e === 3 && view === 'f') { p.line(tl, shY + 1, tr, hipY - 3, rampa(c2).s2); p.line(tr, shY + 1, tl, hipY - 3, rampa(c2).s2); }
    if (e === 6) { tecido(p, view === 's' ? CX - 3 : tl - 0, hipY - 3, view === 's' ? 6 : TW, 5, c1); if (view === 'f') { p.rect(CX - 1, shY, 2, TH, c2); p.set(tl + 1, shY, rampa(c1).h2); p.set(tr - 1, shY, rampa(c1).h2); } }
    if (e === 4) { tecido(p, view === 's' ? CX - 3 : tl, hipY - 3, view === 's' ? 6 : TW, 7, c1); if (view === 'f') p.rect(CX - 1, hipY + 1, 2, 3, rampa(c1).s2); }
    if (e === 7) { const R = rampa(c1); p.rect(tl - 1, shY - 2, TW + 2, 3, R, 'cv'); if (view === 'f') p.rect(CX - 2, shY, 4, 1, R.s2); }
    if (e === 0 && view === 'f') { p.rect(CX - 2, shY, 4, 1, rampa(c1).s2); }
    if (e === 2) { /* regata: ombros nus */ if (view === 'f') { p.rect(tl, shY, 2, 3, sk); p.rect(tr - 1, shY, 2, 3, sk); } }
    return;
  }
  // ---- armadura do kit ----
  const mat = kit.tipo; const f = MATERIAL[mat] || tecido; const tabardo = kit.saia === 'tabardo';
  const botaC = mat === 'placa' ? '#5a5a66' : mat === 'tecido' ? c2 : '#4a3020';
  const calca = mat === 'tecido' ? c1 : mat === 'placa' || mat === 'malha' ? mistura(o, '#1a1822', 0.35) : mistura(o, '#2a1a10', 0.3);
  pernas(p, g, view, frame, calca, botaC, false);
  // mangas/braços
  const manga = mat === 'tecido' ? c1 : (mat === 'placa' ? o : mat === 'pele' ? mistura(o, '#3a2a1a', 0.2) : o);
  if (view !== 's') { bracos(p, g, view, frame, mat === 'malha' || mat === 'escamas' ? mistura(o, '#1a1822', 0.2) : manga, mat === 'placa' ? mistura(o, '#c0c6d4', 0.1) : sk, { cast, atq });
    if (mat === 'placa' || mat === 'couro' || mat === 'pele') { const arm2 = rampa(mat === 'placa' ? o : o2); for (const [x, y] of [[tl - 3, shY + TH - 5], [tr + 1, shY + TH - 5]]) { p.rect(x, y + (cast ? -5 : 0), 3, 4, arm2, 'cv'); p.set(x + 1, y + (cast ? -5 : 0), arm2.h2); } } }
  // saia / manto de tecido até as pernas
  const sai = kit.saia; const saiaY = hipY - 2;
  if (sai === 'longa') { const w = view === 's' ? 9 : TW + 2; f(p, view === 's' ? CX - 4 : tl - 1, saiaY, w, Math.min(g.LL - 1, 9), mat === 'tecido' || tabardo ? c1 : o); if (view === 'f') p.rect(CX, saiaY + 2, 1, 7, rampa(c1).s2); }
  else if (sai === 'curta') { const w = view === 's' ? 8 : TW + 2; f(p, view === 's' ? CX - 4 : tl - 1, saiaY, w, 4, mat === 'placa' || mat === 'malha' || mat === 'escamas' ? o : mat === 'pele' ? mistura(o, '#c8c0b0', 0.5) : o2); }
  // peitoral
  const corTorso = mat === 'tecido' ? c1 : mat === 'pele' ? mistura(o, '#2a1a10', 0.15) : o;
  torsoBase(p, g, view, mat, corTorso);
  if (tabardo) { const TC = rampa(c1); const x = view === 's' ? CX - 3 : CX - 4; const ww = view === 's' ? 6 : 8; p.rect(x, shY + 1, ww, TH + 7, TC, 'cv'); p.rect(x, shY + TH + 7, ww, 1, rampa(o2).b); if (view === 'f') { for (let k = 0; k < 2; k++) p.set(x + 1 + k * (ww - 3), shY + TH + 8, TC.s); } }
  const R2 = rampa(o2), R1 = rampa(o);
  if (view === 'f' || view === 'b') {
    const pk = kit.peito;
    if (view === 'f') {
      if (pk === 'cintas') { p.line(tl, shY + 1, tr, shY + TH - 2, mat === 'placa' ? R2.b : '#3a2616'); p.line(tl + 1, shY + 1, tr, shY + TH - 3, mat === 'placa' ? R2.h : '#5a3a22'); p.rect(tl, hipY - 3, TW, 2, '#3a2616'); p.rect(CX - 1, hipY - 3, 2, 2, '#e0c040'); }
      else if (pk === 'cruz') { p.rect(CX - 1, shY + 2, 2, 7, R2.b); p.rect(CX - 3, shY + 4, 6, 2, R2.b); p.set(CX - 1, shY + 2, R2.h2); }
      else if (pk === 'sol') { p.ell(CX, shY + 5, 3, 3, R2); p.set(CX, shY + 4, R2.h2); for (const [dx, dy] of [[0, -4], [0, 4], [-4, 0], [4, 0], [-3, -3], [3, -3], [3, 3], [-3, 3]]) p.set(CX + dx, shY + 5 + dy, R2.h); p.rect(tl, hipY - 3, TW, 2, R2.s); }
      else if (pk === 'runas') { for (const [x, y] of [[CX - 3, shY + 3], [CX + 2, shY + 3], [CX - 1, shY + 6], [CX, shY + 8], [CX - 3, shY + 8], [CX + 2, shY + 8]]) { p.set(x, y, R2.h2); p.set(x, y + 1, R2.h); } }
      else { p.rect(tl, hipY - 3, TW, 2, mat === 'tecido' ? R2.b : '#4a3020'); p.rect(CX - 1, hipY - 3, 2, 2, R2.h); if (mat === 'placa') { p.rect(CX - 1, shY + 1, 2, TH - 4, R1.h); p.rect(CX - 3, shY + 2, 6, 1, R1.h2); } }
      if (mat === 'pele') { for (let i = 0; i < TW; i += 1) { p.set(tl + i, shY + (i % 2), '#e8e0d0'); p.set(tl + i, shY + 1 + (i % 3 === 0 ? 1 : 0), '#c8c0b0'); } }
      if (mat === 'tecido' && !tabardo) { p.rect(tl, hipY - 3, TW, 2, R2.b); p.rect(CX - 1, shY, 2, 3, R2.s); }
      if (mat === 'couro' && kit.elmo === 'capuz') p.rect(tl, shY, TW, 2, R1.s2);
    } else { // costas
      if (mat === 'tecido') p.rect(tl, hipY - 3, TW, 2, R2.b); else p.rect(tl, hipY - 3, TW, 2, '#3a2616');
      if (kit.peito === 'cruz' || kit.peito === 'sol') { p.rect(CX - 1, shY + 3, 2, 5, R2.b); }
    }
  }
  // ombreiras
  const om = kit.ombro; if (om && om !== 'nenhum' && view !== 's') {
    for (const [x, s] of [[tl - 3, -1], [tr - 1, 1]]) {
      const mc = mat === 'placa' || mat === 'malha' || mat === 'escamas' ? o : mat === 'pele' ? '#e8e0d0' : o2; const MR = rampa(mc);
      if (om === 'redondo') { p.ell(x + 2.5, shY + 2, 3.1, 2.4, MR); p.rect(x, shY + 3, 5, 1, MR.s); if (mat === 'pele') for (let k = 0; k < 5; k++) p.set(x + k, shY + 4, (k % 2 ? '#c8c0b0' : '#e8e0d0')); }
      else if (om === 'pontudo') { p.ell(x + 2.5, shY + 2, 3.6, 2.4, MR); p.poly([[x + (s < 0 ? 0 : 5), shY + 2], [x + (s < 0 ? -1 : 6), shY - 3], [x + (s < 0 ? 3 : 2), shY]], MR, 'g'); }
      else if (om === 'chifre') { p.ell(x + 2.5, shY + 2, 3.6, 2.6, rampa('#e8e0d0')); for (let k = 0; k < 6; k++) p.rect(x + (s < 0 ? 1 - Math.round(k * 0.5) : 2 + Math.round(k * 0.5)), shY - k, 2, 1, k > 3 ? '#fffaf0' : '#d8d0b0'); }
    }
  } else if (om && om !== 'nenhum' && view === 's') { const MR = rampa(mat === 'pele' ? '#e8e0d0' : o); p.ell(CX, shY + 2, 3.2, 2.6, MR); if (om === 'pontudo') p.poly([[CX - 1, shY + 1], [CX + 1, shY - 3], [CX + 2, shY + 1]], MR, 'g'); if (om === 'chifre') for (let k = 0; k < 5; k++) p.rect(CX + Math.round(k * 0.5), shY - k, 2, 1, '#d8d0b0'); }
  // ornamento por nível (0..5): debrum dourado, rebites e brilho
  if (orn >= 1 && view !== 's') { p.rect(tl, shY + 1, TW, 1, R2.h); }
  if (orn >= 2 && view === 'f') { for (const x of [tl + 1, tr - 1]) p.set(x, shY + 3, R2.h2); p.rect(tl, hipY - 1, TW, 1, R2.b); }
  if (orn >= 3 && view === 'f') { p.set(CX, shY + 1, '#6af0ff'); p.set(CX - 1, shY + 1, R2.h2); p.set(CX + 1, shY + 1, R2.h2); }
  if (orn >= 4 && view !== 's') { p.rect(tl - 3, shY + 1, 3, 1, R2.h2); p.rect(tr + 1, shY + 1, 3, 1, R2.h2); }
  // cinto
  if (view === 'f' && mat !== 'tecido' && !kit.peito.includes('cintas')) { /* já tem cinto */ }
}
function capaCorpo(p, cx, y0, comp, wbase, flare, R, R2, topoCor) {
  for (let k = 0; k < comp; k++) { const w = wbase + 2 * Math.round(k * flare / comp), x0 = cx - Math.floor(w / 2);
    for (let i = 0; i < w; i++) { let t = R.b; if (i < 2) t = R.h; else if (i >= w - 2) t = R.s; if (i === 0 || i === w - 1) t = R.s2; if ((i + 2) % 4 === 0 && k > 2) t = R.s; if ((i + 1) % 8 === 0) t = R.h; if (k === comp - 1) t = R.s2; if (k < 2) t = topoCor; p.set(x0 + i, y0 + k, t); } }
}
function capa(p, g, ap, vis, view, frame) {
  const forma = ap.capa | 0; if (!forma || !vis.capaC) return; const R = rampa(vis.capaC), R2 = rampa(vis.capaC2 || vis.capaC); const { shY, hipY, TW, LL } = g; const comp = forma === 1 ? (hipY - shY + 5) : (hipY - shY + LL - 2);
  if (view === 'f') { capaCorpo(p, CX, shY, comp, TW + 4, 2, R, R2, R2.b); }
  else if (view === 'b') { capaCorpo(p, CX, shY - 1, comp + 1, TW + 2, 3, R, R2, R2.b); }
  else { const w = 7; const sw = frame === 0 ? 0 : 1; for (let k = 0; k < comp; k++) { const off = k > comp / 2 ? sw : 0; for (let i = 0; i < w; i++) { let t = i < 2 ? R.h : i >= w - 2 ? R.s : R.b; if (i === w - 1) t = R.s2; if (k === comp - 1) t = R.s2; if (k < 2) t = R2.b; p.set(CX + 1 + i + off + Math.floor(k / 6), shY + 1 + k, t); } } }
}
function fixador(p, g, ap, vis, view) { if ((ap.capa | 0) && vis.capaC && view === 'f') { p.rect(CX - 3, g.shY, 6, 1, rampa(vis.capaC2 || vis.capaC).h); p.set(CX - 1, g.shY + 1, '#ffd23f'); p.set(CX, g.shY + 1, '#ffd23f'); } }
function cauda(p, g, ap, view, frame) {
  const R = g.R; if (!R.cauda && !(ap.raca === 'draconato')) return; const c = rampa(ap.pele); const y0 = g.hipY - 1; const sw = frame === 0 ? 0 : frame === 1 ? 1 : -1;
  if (view === 's') { for (let k = 0; k < 11; k++) { const x = CX + 3 + k, y = y0 + 3 - Math.round(Math.sin(k / 3) * 3) + sw; p.rect(x, y, 2, 2 - (k > 8 ? 1 : 0), k % 2 ? c.b : c.s); } if (R.cauda) p.poly([[CX + 13, y0 - 1], [CX + 15, y0 + 3], [CX + 12, y0 + 4]], c, 'g'); }
  else if (view === 'f') { for (let k = 0; k < 8; k++) { const x = CX + 5 + Math.round(Math.sin(k / 2) * 2.5), y = y0 + 3 + k; p.rect(x, y, 2, 1, k % 2 ? c.b : c.s); } if (R.cauda) p.poly([[CX + 5, y0 + 12], [CX + 9, y0 + 12], [CX + 7, y0 + 9]], c, 'f'); }
  else { for (let k = 0; k < 9; k++) { const x = CX - 1 + Math.round(Math.sin(k / 2) * 3), y = y0 + 2 + k; p.rect(x, y, 3, 1, k % 2 ? c.b : c.s); } if (R.cauda) p.poly([[CX - 3, y0 + 12], [CX + 3, y0 + 12], [CX, y0 + 8]], c, 'f'); }
}
function escudo(p, g, ap, vis, view, frame) {
  if (!vis.escudo) return; const c1 = rampa(ap.arm2 || '#d8b43a'), c0 = rampa(ap.arm1 || '#9aa0b0'); const { shY, tr, tl, TH } = g;
  if (view === 'f') { const x = tr + 1, y = shY + 3; p.ell(x + 2, y + 5, 4.6, 6, c0); p.rect(x - 2, y, 9, 1, c0.h); p.ell(x + 2, y + 5, 3, 4, c1); p.ell(x + 2, y + 5, 1.4, 1.8, c0); p.set(x + 1, y + 3, c1.h2); }
  else if (view === 's') { const x = CX - 6 + (frame === 1 ? 1 : 0), y = shY + 3; p.ell(x + 1, y + 5, 2.6, 6, c0); p.ell(x + 1, y + 5, 1.2, 4, c1); void TH; }
  else { p.ell(CX, shY + 6, 4, 5, c0); p.ell(CX, shY + 6, 2, 3, c1); void tl; }
}

// ---------- montagem completa ----------
function desenhar(ap, vis, dir, pose) {
  const p = new Pix(W, H); const view = dir === 'baixo' ? 'f' : dir === 'cima' ? 'b' : 's'; const g = geo(ap, vis);
  const frame = pose === 'andar1' ? 1 : pose === 'andar2' ? 2 : 0; const R = g.R; const def = CAB[ap.cabelo | 0] || CAB[0]; const kit = kitDe(ap, vis);
  const drag = ap.raca === 'draconato';
  // cauda e capa (atrás)
  cauda(p, g, ap, view === 'f' ? 'b' : view === 'b' ? 'f' : 's', frame); if (view !== 'f' || true) { if (view !== 'f') {} }
  if (view !== 'b') capa(p, g, ap, vis, view === 's' ? 's' : 'f', frame);
  cabelo(p, g, ap, view, def, 'tras');
  // corpo + roupa (inclui pernas e braços)
  desenharRoupa(p, g, ap, view, frame, vis, pose);
  if (view === 'b') capa(p, g, ap, vis, 'b', frame);
  if (drag) { /* escamas do pescoço */ }
  fixador(p, g, ap, vis, view);
  escudo(p, g, ap, vis, view, frame);
  // cabeça
  if (kit && kit.elmo === 'capuz' && view !== 'b') capuzTras(p, g, ap, view);
  cabeca(p, g, ap, view, R);
  if (view !== 'b') { rosto(p, g, ap, view, R); marcas(p, g, ap, view); }
  const cabeloVisivel = !(kit && (kit.elmo === 'capuz' || ((vis.elmo || ap.elmo) && ['fechado', 'aberto', 'crista', 'chifres'].includes(kit.elmo))));
  if (cabeloVisivel) { const kitChap = kit && kit.elmo === 'chapeu'; cabelo(p, g, ap, view, kitChap ? { ...def, topo: Math.min(def.topo, 2), espetos: 0, quiff: 0, coque: 0 } : def, 'frente'); }
  barba(p, g, ap, view);
  topo(p, g, ap, view, kit, vis); acessorio(p, g, ap, view);
  if (drag) { const sk = rampa(ap.pele); p.poly([[CX - 3, g.headTop + 1], [CX, g.headTop - 4], [CX + 3, g.headTop + 1]], sk, 'g'); if (view !== 's') { for (const s of [-1, 1]) p.poly([[CX + s * 5, g.headTop + 3], [CX + s * 8, g.headTop - 1], [CX + s * 6, g.headTop + 6]], rampa(mistura(ap.pele, '#fff0c0', 0.25)), 'g'); } }
  // sombra de alívio e contorno
  p.contorno(0.68);
  // brilho de itens mágicos
  return p;
}
const cache = new Map();
export function spritePessoa(ap, vis = {}, dir = 'baixo', pose = 'idle') {
  const k = JSON.stringify([ap, vis, dir, pose]); let c = cache.get(k); if (c) return c; if (cache.size > 600) cache.clear();
  const pix = desenhar(ap, vis, dir, pose); c = pix.canvas(); cache.set(k, c); return c;
}
export function limparCachePessoa() { cache.clear(); }
// Ponto da mão (para desenhar a arma) em coordenadas do sprite
export function maoDe(ap, vis, dir) {
  const g = geo(ap, vis); const y = g.shY + g.TH + 1;
  if (dir === 'baixo') return { x: g.tl - 2, y, lado: -1 }; if (dir === 'cima') return { x: g.tr + 2, y, lado: 1 }; return { x: CX - 3, y, lado: -1 };
}
export function alturaTopo(ap, vis = {}) { return geo(ap, vis).headTop; }
// Retrato (busto) ampliado
export function retrato(ap, vis = {}, esc = 3) {
  const g = geo(ap, vis); const src = spritePessoa(ap, vis, 'baixo', 'idle'); const t = Math.max(0, g.headTop - 7); const hh = 28; const c = cv(32 * esc, hh * esc); const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, t, 32, hh, 0, 0, 32 * esc, hh * esc); return c;
}
// Aparência/visual derivados do estado do jogo
export function visualDe(s, itens, capas) {
  const cls = s.heroi.cls; const arm = itens[s.equip.armadura]; const esc = itens[s.equip.escudo];
  const cat = arm ? arm.cat : (cls === 'mago' || cls === 'clerigo' ? 'veste' : null);
  const capa = capas[s.heroi.capa] || capas.padrao; const L = s.heroi.nivel;
  let orn = 0; if (arm) orn = clamp(Math.round((arm.base - 11) / 2) + (arm.mag || 0), 0, 5); else orn = clamp(Math.floor((L - 1) / 4), 0, 5);
  return { cls, cat, mag: arm ? arm.mag || 0 : 0, ornam: orn, nivel: L, escudo: !!esc, capaC: capa.c, capaC2: capa.C, elmo: !!s.heroi.ap && !!s.heroi.ap.elmo, relic: arm && arm.resFogo ? 'dragao' : arm && arm.id === 'couro_lobo' ? 'lobo' : null };
}
void escurece; void clareia; void ajusta; void CORES_CLASSE; void ANCESTRAIS; void categoriaArmadura; void pele; void pelo;
