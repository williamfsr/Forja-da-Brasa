// Áudio 8-bit sintetizado em tempo real (WebAudio). Sem arquivos externos.
let ctx = null, mestre = null, ligado = true, musOn = false, faixaAtual = null, timerMus = null, passo = 0;

function iniciar() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  try { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ctx = new A(); mestre = ctx.createGain(); mestre.gain.value = 0.18; mestre.connect(ctx.destination); } catch (e) { ctx = null; }
  return ctx;
}
export function destravar() { iniciar(); }
export function configurar({ som, musica }) { ligado = som !== false; musOn = !!musica; if (!musOn) pararMusica(); else if (faixaAtual) tocarMusica(faixaAtual, true); }

function nota(freq, t0, dur, tipo = 'square', vol = 0.5, slide = 0, destino = null) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = tipo; o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(destino || mestre); o.start(t0); o.stop(t0 + dur + 0.02);
}
function ruido(t0, dur, vol = 0.4, hp = 800) {
  if (!ctx) return; const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ctx.createBufferSource(); s.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const g = ctx.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(mestre); s.start(t0);
}
function rumor(t0, dur, vol = 0.8, lp = 380) { // trovão: ruído grave que ribomba e some
  if (!ctx) return; const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); let u = 0;
  for (let i = 0; i < n; i++) { u = u * 0.965 + (Math.random() * 2 - 1) * 0.035; const k = i / n; d[i] = u * 22 * Math.pow(1 - k, 1.5) * (0.65 + 0.35 * Math.sin(i / ctx.sampleRate * 17)); }
  const s = ctx.createBufferSource(); s.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(lp, t0); f.frequency.exponentialRampToValueAtTime(90, t0 + dur); const g = ctx.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(mestre); s.start(t0);
}
let chuvaNo = null; // chuva contínua (ruído filtrado), volume segue a intensidade do clima
export function chuvaSom(n) {
  if (!ctx) return; if (!ligado) n = 0; if (!chuvaNo) { if (n < 0.03) return;
    const len = ctx.sampleRate * 2, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0); let u = 0; for (let i = 0; i < len; i++) { u = u * 0.7 + (Math.random() * 2 - 1) * 0.3; d[i] = u; }
    const src = ctx.createBufferSource(); src.buffer = b; src.loop = true; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400; const g = ctx.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(mestre); src.start(); chuvaNo = { src, g }; }
  chuvaNo.g.gain.setTargetAtTime(Math.min(1, n) * 0.2, ctx.currentTime, 0.8);
}
const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
const SONS = {
  select: (t) => nota(N(84), t, 0.04, 'square', 0.25),
  confirm: (t) => { nota(N(76), t, 0.06, 'square', 0.3); nota(N(83), t + 0.06, 0.08, 'square', 0.3); },
  back: (t) => nota(N(67), t, 0.07, 'square', 0.25),
  passo: (t) => ruido(t, 0.03, 0.05, 2500),
  hit: (t) => { ruido(t, 0.09, 0.5, 600); nota(180, t, 0.09, 'sawtooth', 0.3, -100); },
  crit: (t) => { ruido(t, 0.16, 0.6, 400); nota(N(60), t, 0.12, 'sawtooth', 0.4, -150); nota(N(72), t + 0.07, 0.14, 'square', 0.35); },
  miss: (t) => nota(N(55), t, 0.14, 'triangle', 0.3, -80),
  hurt: (t) => { ruido(t, 0.14, 0.5, 300); nota(110, t, 0.18, 'square', 0.3, -60); },
  heal: (t) => [72, 76, 79, 84].forEach((n, i) => nota(N(n), t + i * 0.06, 0.1, 'triangle', 0.35)),
  spell: (t) => { [76, 79, 83, 88, 91].forEach((n, i) => nota(N(n), t + i * 0.04, 0.09, 'square', 0.2)); nota(N(52), t, 0.3, 'sawtooth', 0.15); },
  win: (t) => [72, 72, 72, 76, 79, 84].forEach((n, i) => nota(N(n), t + i * 0.1, i === 5 ? 0.35 : 0.09, 'square', 0.3)),
  lose: (t) => [64, 62, 60, 55].forEach((n, i) => nota(N(n), t + i * 0.2, 0.25, 'triangle', 0.4)),
  flee: (t) => { for (let i = 0; i < 6; i++) nota(N(60 + i), t + i * 0.04, 0.05, 'square', 0.2); },
  coin: (t) => { nota(N(83), t, 0.05, 'square', 0.25); nota(N(88), t + 0.05, 0.14, 'square', 0.25); },
  chest: (t) => [67, 71, 74, 79, 83, 86].forEach((n, i) => nota(N(n), t + i * 0.07, 0.14, 'square', 0.3)),
  rolar: (t) => nota(N(70 + Math.floor(Math.random() * 12)), t, 0.03, 'square', 0.18),
  nivel: (t) => [60, 64, 67, 72, 64, 67, 72, 76, 79, 84].forEach((n, i) => nota(N(n), t + i * 0.08, i > 8 ? 0.5 : 0.1, 'square', 0.28)),
  pr: (t) => { [67, 72, 76, 79, 84].forEach((n, i) => nota(N(n), t + i * 0.07, 0.1, 'square', 0.3)); nota(N(36), t, 0.5, 'sawtooth', 0.25); },
  escada: (t) => [72, 69, 65, 62, 57].forEach((n, i) => nota(N(n), t + i * 0.07, 0.08, 'triangle', 0.3)),
  armadilha: (t) => { ruido(t, 0.2, 0.5, 1500); nota(N(48), t, 0.2, 'square', 0.3, -100); },
  porta: (t) => { nota(N(55), t, 0.08, 'square', 0.25); nota(N(62), t + 0.08, 0.1, 'square', 0.25); },
  tocha: (t) => { ruido(t, 0.25, 0.25, 3000); },
  trovao: (t) => rumor(t, 2.6, 0.9, 420),
  folha: (t) => { ruido(t, 0.16, 0.3, 2400); ruido(t + 0.11, 0.2, 0.24, 3400); ruido(t + 0.26, 0.12, 0.16, 1800); },
  livro: (t) => { ruido(t, 0.12, 0.35, 450); ruido(t + 0.1, 0.18, 0.25, 2200); },
  inercia: (t) => [48, 47, 46, 44].forEach((n, i) => nota(N(n), t + i * 0.18, 0.3, 'sawtooth', 0.25)),
};
export function sfx(nome) { if (!ligado || !iniciar()) return; const f = SONS[nome]; if (f) f(ctx.currentTime + 0.01); }

// ---------- Música: sequenciador simples de 16 passos ----------
const FAIXAS = {
  vila: { bpm: 104, melo: [72, 0, 76, 0, 79, 0, 76, 0, 77, 0, 74, 0, 72, 0, 0, 0, 76, 0, 79, 0, 83, 0, 79, 0, 81, 0, 77, 0, 74, 0, 0, 0], baixo: [48, 0, 0, 0, 55, 0, 0, 0, 53, 0, 0, 0, 55, 0, 0, 0], tipoM: 'square', vol: 0.12 },
  mundo: { bpm: 116, melo: [67, 0, 71, 74, 0, 71, 67, 0, 69, 0, 72, 76, 0, 72, 69, 0], baixo: [43, 0, 43, 0, 50, 0, 50, 0, 45, 0, 45, 0, 52, 0, 52, 0], tipoM: 'square', vol: 0.1 },
  masmorra: { bpm: 84, melo: [57, 0, 0, 60, 0, 0, 57, 0, 0, 55, 0, 0, 53, 0, 0, 0], baixo: [33, 0, 0, 0, 0, 0, 0, 0, 36, 0, 0, 0, 0, 0, 0, 0], tipoM: 'triangle', vol: 0.18 },
  batalha: { bpm: 150, melo: [69, 69, 0, 72, 69, 0, 76, 0, 74, 74, 0, 72, 69, 0, 67, 0], baixo: [45, 0, 45, 45, 0, 45, 45, 0, 43, 0, 43, 43, 0, 43, 43, 0], tipoM: 'square', vol: 0.1 },
  chefe: { bpm: 160, melo: [64, 64, 0, 67, 64, 0, 71, 0, 70, 70, 0, 67, 64, 0, 62, 62], baixo: [40, 40, 0, 40, 40, 0, 40, 40, 38, 38, 0, 38, 38, 0, 38, 38], tipoM: 'sawtooth', vol: 0.08 },
};
export function tocarMusica(id, forcar = false) {
  faixaAtual = id; if (!musOn || !ligado) return; if (!iniciar()) return;
  if (timerMus && !forcar && timerMus.id === id) return;
  pararTimer(); const f = FAIXAS[id]; if (!f) return; passo = 0;
  const dur = 60 / f.bpm / 2; let prox = ctx.currentTime + 0.05;
  const tick = () => {
    while (prox < ctx.currentTime + 0.3) {
      const m = f.melo[passo % f.melo.length], b = f.baixo[passo % f.baixo.length];
      if (m) nota(N(m), prox, dur * 0.9, f.tipoM, f.vol); if (b) nota(N(b), prox, dur * 1.6, 'triangle', f.vol * 1.4);
      prox += dur; passo++;
    }
  };
  tick(); timerMus = { id, h: setInterval(tick, 120) };
}
function pararTimer() { if (timerMus) { clearInterval(timerMus.h); timerMus = null; } }
export function pararMusica() { pararTimer(); }
export function vibrar(ms = 30) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignorado */ } }
