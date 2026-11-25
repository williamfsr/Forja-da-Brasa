// Clima dinâmico: o céu segue a Inércia. Com pouca Inércia o dia é aberto e dourado; conforme ela sobe vêm nuvens, garoa, chuva, tempestade com raios e neblina.
// O sorteio é determinístico por dia e bloco de 3 horas (o mesmo céu para quem joga na mesma hora) e as transições são suaves.
import * as St from './store.js';
import { hash2, cv } from './gfx.js';
import * as Au from './audio.js';
import { horaAtual } from './relogio.js';

export const TIPOS = {
  limpo: { nome: 'Céu limpo', n: 0.06, c: 0, f: 0, t: 0, v: 0.15 },
  parcial: { nome: 'Poucas nuvens', n: 0.38, c: 0, f: 0, t: 0, v: 0.25 },
  nublado: { nome: 'Nublado', n: 0.82, c: 0, f: 0.05, t: 0, v: 0.3 },
  garoa: { nome: 'Garoa', n: 0.88, c: 0.3, f: 0.12, t: 0, v: 0.3 },
  chuva: { nome: 'Chuva', n: 0.95, c: 0.68, f: 0.1, t: 0, v: 0.5 },
  tempestade: { nome: 'Tempestade', n: 1, c: 1, f: 0.08, t: 1, v: 0.95 },
  neblina: { nome: 'Neblina', n: 0.45, c: 0, f: 0.6, t: 0, v: 0.1 },
  nebdensa: { nome: 'Neblina densa', n: 0.7, c: 0, f: 0.95, t: 0, v: 0.08 },
};
// pesos de cada tipo de tempo por nível de Inércia (interpolados entre as âncoras)
const ANC = [
  [0, { limpo: 70, parcial: 25, nublado: 5 }],
  [3, { limpo: 35, parcial: 30, nublado: 20, garoa: 8, neblina: 7 }],
  [5, { limpo: 8, parcial: 17, nublado: 30, garoa: 20, chuva: 15, neblina: 10 }],
  [7, { nublado: 18, garoa: 12, chuva: 30, tempestade: 15, neblina: 10, nebdensa: 15 }],
  [10, { chuva: 25, tempestade: 40, nebdensa: 35 }],
];
function pesos(I) {
  I = Math.max(0, Math.min(10, I)); let i = 0; while (i < ANC.length - 2 && I > ANC[i + 1][0]) i++; const [a0, A] = ANC[i], [a1, B] = ANC[i + 1]; const t = (I - a0) / (a1 - a0); const w = {};
  for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) w[k] = (A[k] || 0) * (1 - t) + (B[k] || 0) * t; return w;
}
export function escolherTipo(I, h, diaNum) {
  const w = pesos(I); if (h >= 5 && h < 9.5) { w.neblina = (w.neblina || 0) * 2.4; w.nebdensa = (w.nebdensa || 0) * 1.5; }
  const bloco = Math.floor(h / 3); let r = hash2(diaNum, bloco, 77); const soma = Object.values(w).reduce((a, b) => a + b, 0); r *= soma;
  for (const k of Object.keys(w)) { r -= w[k]; if (r < 0 && w[k] > 0) return k; } return 'limpo';
}
const diaNum = () => { const [y, m, d] = St.hoje().split('-').map(Number); return y * 372 + m * 31 + d; };

export const Clima = { cur: { nuvens: 0.06, chuva: 0, nevoa: 0, tempestade: 0, vento: 0.15 }, tipo: 'limpo', forcado: null, inercia: 2, dt: 0.016 };
let tempo = 0, raioT = 4, trovaoEm = -1, raio = null, somT = 0, calorT = 8; const gotas = [], splash = [], cinzas = [];
export const forcarClima = (t) => { Clima.forcado = t && TIPOS[t] ? t : null; };
export function snapClima() { const P = TIPOS[Clima.tipo]; Object.assign(Clima.cur, { nuvens: P.n, chuva: P.c, nevoa: P.f, tempestade: P.t, vento: P.v }); } // salta direto para o tempo atual (testes)
export function raioAgora() { raio = { t: 0, x: 0.3 + Math.random() * 0.4, sem: Math.random() * 999, dur: 0.6 }; } // testes
export const nomeClima = () => TIPOS[Clima.tipo].nome;
// chamado todo quadro. fora = o jogador está ao ar livre (não em interior nem masmorra)
export function passo(dt, s, fora = true) {
  tempo += dt; Clima.dt = Math.min(dt, 0.1); const I = s ? St.inerciaEf(s) : 2; Clima.inercia = I; const tm = Math.max(0, Math.min(1, (I - 3.5) / 6.5)); // tm: quão grave está o céu
  const tipo = Clima.forcado || escolherTipo(I, horaAtual(), diaNum()); Clima.tipo = tipo; const P = TIPOS[tipo]; const c = Clima.cur;
  const ond = 1 + 0.16 * Math.sin(tempo * 0.21 + I); const k = 1 - Math.exp(-dt / 5);
  c.nuvens += (P.n - c.nuvens) * k; c.chuva += (Math.min(1, P.c * (P.c > 0 ? ond : 1)) - c.chuva) * k; c.nevoa += (Math.max(P.f, 0.24 * tm) - c.nevoa) * k; c.tempestade += (P.t - c.tempestade) * k; c.vento += (P.v - c.vento) * k;
  if (fora && c.tempestade > 0.5) { raioT -= dt; if (raioT <= 0) { raio = { t: 0, x: 0.12 + Math.random() * 0.76, sem: Math.random() * 999, dur: 0.6 }; raioT = (2.6 + Math.random() * 7.5) / (0.5 + c.tempestade * 0.5) / (1 + tm * 0.9); trovaoEm = tempo + 0.25 + Math.random() * 1.7; } }
  // Inércia muito alta: clarões violeta distantes mesmo sem tempestade
  if (fora && tm > 0.7 && c.tempestade <= 0.5) { calorT -= dt; if (calorT <= 0) { raio = { t: 0, x: 0.5, sem: Math.random() * 999, dur: 0.5, fraco: true }; calorT = 5 + Math.random() * 9; if (Math.random() < 0.6) trovaoEm = tempo + 0.8 + Math.random() * 2; } }
  if (trovaoEm > 0 && tempo >= trovaoEm) { trovaoEm = -1; if (fora) Au.sfx('trovao'); }
  somT -= dt; if (somT <= 0) { somT = 0.5; try { Au.chuvaSom(fora ? Math.min(1, c.chuva * 1.1) : c.chuva * 0.25); } catch (e) { /* sem áudio */ } }
}
// ---------- texturas procedurais (uma vez) ----------
let TX = null, fogCv = null;
function ruidoTex(n, seed, ruidoCor, curva) {
  const c = cv(n, n), x = c.getContext('2d'), id = x.createImageData(n, n); const oct = [[3, 0.5], [6, 0.3], [12, 0.2]];
  const val = (ix, iy, p, s) => hash2(((ix % p) + p) % p, ((iy % p) + p) % p, seed + s); const sm = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) { let v = 0;
    for (let o = 0; o < oct.length; o++) { const [p, w] = oct[o]; const fx = (xx / n) * p, fy = (y / n) * p, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = sm(fx - x0), ty = sm(fy - y0);
      const a = val(x0, y0, p, o), b = val(x0 + 1, y0, p, o), cc = val(x0, y0 + 1, p, o), d = val(x0 + 1, y0 + 1, p, o); v += w * (a + (b - a) * tx + (cc - a) * ty + (a - b - cc + d) * tx * ty); }
    const al = Math.pow(Math.max(0, Math.min(1, (v - 0.36) * 2.3)), curva); const i = (y * n + xx) * 4; id.data[i] = ruidoCor[0]; id.data[i + 1] = ruidoCor[1]; id.data[i + 2] = ruidoCor[2]; id.data[i + 3] = Math.round(al * 255); }
  x.putImageData(id, 0, 0); return c;
}
function texturas() { if (!TX) TX = { nevoa: ruidoTex(128, 11, [232, 234, 242], 1.1), nuvem: ruidoTex(128, 23, [8, 12, 30], 1.4), nevoaEscura: ruidoTex(128, 11, [150, 130, 186], 1.1) }; return TX; }
function ladrilho(ctx, tex, esc, ox, oy, W, H, alfa) {
  const s = tex.width * esc; ox = ((ox % s) + s) % s; oy = ((oy % s) + s) % s; ctx.globalAlpha = alfa; ctx.imageSmoothingEnabled = true;
  for (let y = -oy; y < H; y += s) for (let x = -ox; x < W; x += s) ctx.drawImage(tex, x, y, s, s); ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false;
}
// ---------- desenho ----------
// V = {w,h}, cam = {x,y}; opc = {foco:{x,y} em px de tela, tenebra:0..1}
export function desenhar(ctx, V, cam, opc = {}) {
  const c = Clima.cur, W = V.w, H = V.h, T = opc.tenebra || 0, dt = Clima.dt; const tx = texturas(); ctx.save(); ctx.imageSmoothingEnabled = false;
  // sombras das nuvens passando pelo chão
  if (c.nuvens > 0.12) ladrilho(ctx, tx.nuvem, 6, cam.x * 1 - tempo * (3 + c.vento * 14), cam.y * 1 - tempo * 1.4, W, H, Math.min(0.34, c.nuvens * 0.3 + T * 0.06));
  // neblina: véu + duas camadas de ruído em velocidades diferentes, com uma clareira em volta do herói (quanto mais densa, menor)
  if (c.nevoa > 0.02) {
    const f = c.nevoa, fx = opc.foco ? opc.foco.x : W / 2, fy = opc.foco ? opc.foco.y : H / 2; const tex = T > 0.55 ? tx.nevoaEscura : tx.nevoa; const cor = T > 0.55 ? '150,134,176' : '214,218,228';
    if (!fogCv || fogCv.width !== W || fogCv.height !== H) fogCv = cv(W, H); const o = fogCv.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, W, H);
    o.fillStyle = `rgba(${cor},${(f * 0.2).toFixed(3)})`; o.fillRect(0, 0, W, H);
    ladrilho(o, tex, 2.6, cam.x * 0.35 + tempo * (4 + c.vento * 9), cam.y * 0.35 + tempo * 1.2, W, H, Math.min(0.62, f * 0.55));
    ladrilho(o, tex, 4.2, cam.x * 0.2 - tempo * (3 + c.vento * 6), cam.y * 0.2 + tempo * 0.8, W, H, Math.min(0.5, f * 0.42));
    const R = 32 * (6.2 - 3.2 * f), g = o.createRadialGradient(fx, fy, R * 0.12, fx, fy, R); g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(0.6, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); o.globalCompositeOperation = 'destination-out'; o.fillStyle = g; o.fillRect(0, 0, W, H); o.globalCompositeOperation = 'source-over';
    ctx.drawImage(fogCv, 0, 0);
  }
  // chuva: gotas em duas camadas (longe/perto), inclinadas pelo vento, e respingos no chão
  if (c.chuva > 0.02) {
    const alvo = Math.min(420, Math.round(c.chuva * (W * H) / 380)); const slant = 0.1 + c.vento * 0.32;
    while (gotas.length < alvo) gotas.push({ x: Math.random() * (W + 60) - 30, y: Math.random() * H, v: 230 + Math.random() * 110, n: Math.random() < 0.45 });
    while (gotas.length > alvo) gotas.pop();
    for (const g of gotas) { g.y += g.v * dt * (g.n ? 1.15 : 0.85); g.x -= g.v * dt * slant; if (g.y > H + 8 || g.x < -30) { g.y = -8 - Math.random() * 20; g.x = Math.random() * (W + 60) - 10; } }
    const col = T > 0.6 ? '178,164,216' : '202,216,242'; ctx.lineWidth = 1;
    for (const near of [false, true]) { ctx.strokeStyle = `rgba(${col},${near ? 0.55 : 0.28})`; ctx.beginPath(); const L = near ? 8 : 4.5; for (const g of gotas) if (g.n === near) { const x = Math.round(g.x), y = Math.round(g.y); ctx.moveTo(x, y); ctx.lineTo(x - L * slant, y + L); } ctx.stroke(); }
    if (Math.random() < c.chuva * 60 * dt) splash.push({ x: Math.random() * W, y: H * (0.2 + Math.random() * 0.8), t: 0 });
    ctx.fillStyle = `rgba(${col},0.6)`; for (let i = splash.length - 1; i >= 0; i--) { const sp = splash[i]; sp.t += dt; if (sp.t > 0.3) { splash.splice(i, 1); continue; } const r = 1 + Math.floor(sp.t * 8), x = Math.round(sp.x), y = Math.round(sp.y); ctx.globalAlpha = 1 - sp.t / 0.3; ctx.fillRect(x - r, y, 1, 1); ctx.fillRect(x + r, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); } ctx.globalAlpha = 1;
  } else { gotas.length = 0; splash.length = 0; }
  // Inércia alta: cinzas descendo devagar, sacudidas pelo vento
  if (T > 0.45) {
    const alvo = Math.round((T - 0.35) * (W * H) / 1500 * (1 - c.chuva * 0.8)); while (cinzas.length < alvo) cinzas.push({ x: Math.random() * W, y: Math.random() * H, v: 12 + Math.random() * 16, f: Math.random() * 6.28, g: Math.random() < 0.3 });
    while (cinzas.length > alvo) cinzas.pop(); ctx.fillStyle = 'rgba(196,184,206,0.55)';
    for (const a of cinzas) { a.y += a.v * dt; a.x += Math.sin(tempo * 1.3 + a.f) * 9 * dt - c.vento * 14 * dt; if (a.y > H + 3) { a.y = -3; a.x = Math.random() * W; } if (a.x < -3) a.x = W + 2; ctx.fillRect(Math.round(a.x), Math.round(a.y), a.g ? 2 : 1, a.g ? 2 : 1); }
  } else cinzas.length = 0;
  // raio: clarão no céu + risco irregular
  if (raio) {
    raio.t += dt; const t = raio.t; if (t > raio.dur) raio = null; else {
      const k = t < 0.05 ? t / 0.05 : t < 0.11 ? 1 - (t - 0.05) * 9 : t < 0.17 ? 0.46 + (t - 0.11) * 9 : Math.max(0, 1 - (t - 0.17) / 0.43);
      ctx.fillStyle = `rgba(${T > 0.6 ? '200,170,255' : '214,228,255'},${(Math.max(0, k) * (raio.fraco ? 0.2 : 0.5)).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
      if (t < 0.2 && !raio.fraco) { const pts = [[raio.x * W, -4]]; let x = raio.x * W, y = -4; const fim = H * (0.38 + hash2(1, 2, raio.sem | 0) * 0.3); let i = 0; while (y < fim) { y += 10 + hash2(i, 3, raio.sem | 0) * 16; x += (hash2(i, 4, raio.sem | 0) - 0.5) * 26; pts.push([x, y]); i++; }
        ctx.lineJoin = 'round'; for (const [lw, a, cc] of [[7, 0.18, '170,190,255'], [3, 0.5, '200,215,255'], [1, 0.95, '255,255,255']]) { ctx.lineWidth = lw; ctx.strokeStyle = `rgba(${cc},${a * (1 - t / 0.2)})`; ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); } }
    }
  }
  ctx.restore();
}
