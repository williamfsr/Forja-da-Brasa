// A Festa da Brasa: quando a Maré chega a 0/10, Mestra Brasa vem avisar (e lembrar que o Rei ainda existe). Forjaluz faz festa por 24 horas,
// com interações, minigames opcionais que rendem afinidade e, ao falar com todos, a Capa do Herói. Passado o dia, tudo volta ao normal.
import * as St from './store.js';
import { ehInimigo, estaPerdido, mudarAfin } from './romance.js';
import { jogar, TITULOS } from './minigames.js';
import * as Au from './audio.js';

const S = () => St.S;
export const FESTA_LISTA = ['brasa', 'ferrao', 'aurora', 'eruvim', 'tavi', 'lucia', 'quinzinho', 'alquimista', 'aldeao1', 'aldeao2', 'aldeao3', 'aldeao4'];
const POS = { brasa: [14, 14], ferrao: [15, 16], aurora: [20, 14], eruvim: [12, 16], tavi: [23, 15], lucia: [19, 17], quinzinho: [16, 13], alquimista: [22, 17], aldeao1: [14, 18], aldeao2: [21, 14], aldeao3: [24, 13], aldeao4: [12, 14] };
const MINI = { ferrao: 'braco', quinzinho: 'alvo', tavi: 'culinaria', eruvim: 'quiz', aurora: 'danca' };
const FALA = {
  brasa: ['A forja está de folga hoje. Primeira vez em dez anos, e eu nem sei o que fazer com as mãos.', 'Mas quando o Rei bater à porta de novo, elas sabem o caminho do martelo.'],
  ferrao: ['Não vou fingir que não estou orgulhoso.', 'Mas se amanhã você faltar ao treino, eu mesmo te busco em casa.'], aurora: ['Acendi uma vela para cada dia que você levantou.', 'Hoje o altar parece uma constelação.'],
  eruvim: ['Veja só: a Biblioteca cheia e ninguém lendo. Que maravilha de desordem.'], tavi: ['Caldo grátis hoje! Só não conte ao Quinzinho: ele me cobra a farinha.'],
  lucia: ['A guarda dobra o turno... de brindes. Capitã de festa, imagine.', 'Amanhã a ronda recomeça. A Névoa não tira feriado.'], quinzinho: ['Tudo pela metade do preço! Do preço de ontem, que já era o dobro.'],
  alquimista: ['Fiz um elixir que dá cor às bochechas. Efeito colateral: riso. Ninguém reclamou.'], aldeao1: ['Cinquenta anos de Vale, e é a primeira festa que não termina em velório.'],
  aldeao2: ['Eu pulei corda cinquenta vezes! De verdade! Agora foram cinquenta e uma!'], aldeao3: ['Meu marido saiu da varanda hoje. Veio até a praça e só ficou olhando as bandeirinhas. Já é um começo.'], aldeao4: ['Hoje o sorvete derrete e ninguém reclama. Quem diria que a Maré em zero era tão doce.'],
};
const INTRO = ['* Passos pesados de botas ferradas. Mestra Brasa atravessa o Vale inteiro até você, ofegante e sorrindo, o que nela é raro.', 'Você sentiu? A Névoa... recuou. Zero na Maré. Zero! Eu nem sabia que dava.', 'Parabéns, de coração. A vila inteira acordou só para dizer isso a você.', '* Ela fecha a mão em punho, e o sorriso encolhe.', 'Mas escute: isto não é o fim. O Rei da Inércia ainda está no Trono Imóvel, e a Névoa volta, devagar, para quem larga o hábito.', 'Se pararmos agora, tudo o que ficou colorido vai desbotar de novo. O esforço não pode parar aqui.', 'Por hoje, porém, a vila fez uma festa. Vá a Forjaluz. Fale com todos. Jogue. Deixe a gente agradecer.'];
const CAPA = ['* A praça silencia. Mestra Brasa abre caminho entre os moradores com um embrulho de pano grosso.', 'Cada um aqui costurou um ponto. Eu forjei o fecho. O Ferrão cortou o tecido, a Tavi tingiu na panela...', '* Ela abre o embrulho: uma capa cor de brasa, forrada de cinza escura.', 'É a Capa do Herói. Não protege de nada. Só lembra a todos quem acendeu a Brasa.', 'E amanhã a festa acaba, e a Névoa vai espiar de novo. Vista a capa e vá treinar.'];

// ---- estado ----
export const festaEstado = () => (S() && S().historia.festa) || null;
export const festaAtiva = () => { const f = festaEstado(); return !!f && !f.encerrada && Date.now() < f.fim; };
export function festaVerificar() {
  const s = S(); if (!s) return null; const H = s.historia, f = H.festa;
  if (f && !f.encerrada && Date.now() >= f.fim) { f.encerrada = true; H.flags.festa_feita = true; St.salvar(); return 'fim'; }
  if (!f && H.inercia === 0 && !H.flags.festa_feita) { H.festa = { ini: Date.now(), fim: Date.now() + 24 * 3600 * 1000, intro: false, feito: {}, mini: {}, capa: false }; St.salvar(); return 'novo'; }
  return null;
}
export const introPendente = () => { const f = festaEstado(); return !!f && !f.encerrada && !f.intro; };
const lista = () => FESTA_LISTA.filter((id) => !ehInimigo(id) && !estaPerdido(id));
export const progresso = () => { const f = festaEstado() || { feito: {} }; const l = lista(); return { feitos: l.filter((id) => f.feito[id]).length, total: l.length }; };

export async function introFesta(G) {
  const f = festaEstado(); if (!f || f.intro) return false; f.intro = true; const H = S().historia; H.moral = Math.min(100, H.moral + 10); S().heroi.insp = Math.min(3, (S().heroi.insp || 0) + 1); St.salvar(); G.ocupado = true;
  Au.sfx('nivel'); await G.ui.dialogo('Mestra Brasa · Ferreira', INTRO, { retrato: G.retratoDe ? G.retratoDe('brasa') : null });
  G.ui.toast('🎉 A Festa da Brasa começou em Forjaluz! Dura 24 h. Fale com todos e jogue.', 6000); G.ocupado = false; G.ui.hud(); return true;
}

// ---- moradores na praça (substituem a população normal da vila durante a festa) ----
export function festaNpcs(livre) {
  const ocupados = new Set(), out = [];
  for (const id of FESTA_LISTA) {
    let [x, y] = POS[id]; let achou = null;
    for (let d = 0; d <= 4 && !achou; d++) for (let dy = -d; dy <= d && !achou; dy++) for (let dx = -d; dx <= d && !achou; dx++) { const px = x + dx, py = y + dy; if (!ocupados.has(px + ',' + py) && livre(px, py)) achou = [px, py]; }
    if (!achou) continue; ocupados.add(achou[0] + ',' + achou[1]); out.push({ id, x: achou[0], y: achou[1], fixo: true, festa: true });
  }
  return out;
}

// ---- conversa de festa ----
export async function conversarFesta(G, n, def, pf, ret, nome, normal) {
  const s = S(), f = festaEstado(), id = n.id; const di = (l) => G.ui.dialogo(nome, l, { retrato: ret }); const mini = MINI[id];
  for (;;) {
    const pr = progresso(); const ja = !!f.feito[id];
    const ops = [{ id: 'curtir', rot: ja ? 'Brindar de novo.' : `Aproveitar a festa com ${def.nome}.`, tom: ja ? '✓' : 'Afinidade +1', sub: ja ? '' : `Festa ${pr.feitos}/${pr.total}` }];
    if (mini) ops.push({ id: 'mini', rot: `Jogar: ${TITULOS[mini]}.`, tom: f.mini[id] != null ? `${'★'.repeat(f.mini[id])}${'☆'.repeat(3 - f.mini[id])}` : 'Minigame', sub: f.mini[id] != null ? 'já jogou (a recompensa é só da primeira vez)' : 'opcional · rende afinidade' });
    ops.push({ id: 'normal', rot: 'Conversar normalmente.', tom: 'Conversa' }, { id: 'sair', rot: 'Voltar à festa.' });
    const op = await G.ui.dialogoEscolha({ nome, retrato: ret, texto: ja ? 'A festa continua! Precisa de mais alguma coisa?' : 'Que dia, hein?', opcoes: ops });
    if (op === 'sair') return false;
    if (op === 'normal') return await normal();
    if (op === 'curtir') {
      await di(FALA[id] || ['Que festa!']);
      if (!ja) { f.feito[id] = true; mudarAfin(G, id, 1); Au.sfx('coin'); const p2 = progresso(); G.ui.toast(`🎉 Festa: ${p2.feitos}/${p2.total} moradores.`); St.salvar();
        if (p2.feitos >= p2.total && !f.capa) { await entregarCapa(G); } }
    } else if (op === 'mini') {
      const est = await jogar(mini);
      if (f.mini[id] == null) { f.mini[id] = est; const g = est >= 3 ? 2 : est >= 1 ? 1 : 0; if (g) mudarAfin(G, id, g); const ouro = est * 12; if (ouro) St.ganharOuro(ouro); await di([est ? `* ${'★'.repeat(est)}: ${est >= 3 ? 'perfeito!' : 'muito bem!'}` : '* Não foi desta vez. Tente de novo na próxima festa!', g ? `* Afinidade +${g} · ${ouro} ouro de prêmio.` : '* Sem prêmio, mas valeu o riso.']); G.ui.hud(); } else await di(['* Você joga por diversão. Sem prêmio, só alegria.']);
      St.salvar();
    }
  }
}
async function entregarCapa(G) {
  const s = S(), f = festaEstado(); f.capa = true; if (!s.heroi.capas.includes('heroi')) s.heroi.capas.push('heroi'); s.heroi.capa = 'heroi'; s.historia.moral = Math.min(100, s.historia.moral + 5); Au.sfx('win'); St.salvar();
  await G.ui.dialogo('Mestra Brasa · Ferreira', CAPA, { retrato: G.retratoDe ? G.retratoDe('brasa') : null }); G.ui.toast('🧣 Capa do Herói recebida e equipada!', 5200); G.ui.hud();
}

// ---- decoração: bandeirolas e lanternas sobre a praça + confete ----
const COR = ['#e0482a', '#ffd23f', '#3ac06a', '#3a9ae0', '#c058e0', '#ff8a2a'];
export function desenharFesta(c, cam, TS, t) {
  const fio = (x0, y0, x1, y1, queda) => { const n = 28; let ant = null; for (let i = 0; i <= n; i++) { const u = i / n; const x = (x0 + (x1 - x0) * u) * TS - cam.x, y = (y0 + (y1 - y0) * u) * TS - cam.y + Math.sin(u * Math.PI) * queda + Math.sin(t * 2 + i) * 0.6; if (ant) { c.strokeStyle = '#3a2a1a'; c.lineWidth = 1; c.beginPath(); c.moveTo(ant[0], ant[1]); c.lineTo(x, y); c.stroke(); } if (i % 2 === 1 && i < n) { c.fillStyle = COR[i % COR.length]; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.lineTo(x, y + 9); c.closePath(); c.fill(); } ant = [x, y]; } };
  fio(11, 12.2, 24.5, 12.2, 14); fio(11, 17.9, 24.5, 17.9, 12); fio(11, 12.2, 11, 17.9, 9); fio(24.5, 12.2, 24.5, 17.9, 9);
  for (const [x, y] of [[11, 12.2], [24.5, 12.2], [11, 17.9], [24.5, 17.9], [17.5, 12.2]]) { const px = x * TS - cam.x, py = y * TS - cam.y + 2; const g = c.createRadialGradient(px, py, 1, px, py, 18); g.addColorStop(0, 'rgba(255,210,120,.7)'); g.addColorStop(1, 'rgba(255,160,60,0)'); c.fillStyle = g; c.fillRect(px - 18, py - 18, 36, 36); c.fillStyle = '#ff9a3a'; c.fillRect(px - 3, py - 4, 6, 8); c.fillStyle = '#ffe9a0'; c.fillRect(px - 1, py - 2, 2, 4); }
}
let acum = 0;
export function confete(dt, PART, cam, VW) {
  acum += dt; if (acum < 0.05) return; acum = 0;
  PART.emitir(cam.x + Math.random() * VW.w, cam.y - 4, 1, { cor: COR, vel: 10, ang: 1.9, abre: 0.9, vida: 4.2, tam: 1.6, sobe: -26 });
}
