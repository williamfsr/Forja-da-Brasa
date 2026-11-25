// Relações entre o herói e os moradores: afinidade (−10…12), romance (0…15), namoro (10), casamento (15), traição, grosseria,
// inimizade (barra própria) e as consequências na história (o Rei da Inércia percebe os laços e as feridas).
import * as St from './store.js';
import * as R from './rules.js';
import { NPCS } from './story.js';
import { NPC_PERFIL } from './personalidade.js';
import { ITENS } from './srd.js';
import * as Au from './audio.js';

import { Dados } from './dados.js';
const ATR_ROT = { FOR: 'Força', DES: 'Destreza', CON: 'Constituição', INT: 'Inteligência', SAB: 'Sabedoria', CAR: 'Carisma' };
const S = () => St.S; const rnd = (n) => Math.floor(Math.random() * n); const pick = (a) => a[rnd(a.length)];
export const rel = (id) => (S().npcs[id] ||= { afin: 0, ultimo: null });

// ---- quem é quem ----
const M = ['ferrao', 'eruvim', 'quinzinho', 'gaudencio', 'hornfel', 'rictus', 'padre', 'brindival', 'barqueiro', 'mordomo', 'guarda', 'aldeao1', 'aldeao4', 'menino', 'sentinela', 'afogado1', 'afogado3', 'andarilho1', 'andarilho3'];
export const sexoDe = (id) => (M.includes(id) ? 'M' : 'F');
export const ROMANCEAVEIS = new Set(['brasa', 'ferrao', 'aurora', 'eruvim', 'tavi', 'lucia', 'quinzinho', 'alquimista', 'ilara', 'ordalia', 'gaudencio', 'marcovia', 'hornfel', 'rictus', 'caliope', 'estalajadeira', 'brindival', 'barqueiro', 'safira']);
// crianças, a Safira (nunca vira inimiga) e figuras que não têm laços comuns
export const IMUNES = new Set(['menino', 'aldeao2', 'safira', 'mordomo', 'sentinela', 'guarda', 'afogado1', 'afogado2', 'afogado3']);
const nomeDe = (id) => ((NPCS[id] || {}).nome || 'Alguém'); const curto = (id) => nomeDe(id).replace(/^(Mestra|Mestre|Dona|Irmã|Frei|Dra\.|Capitã|Prefeito|General|Sr\.|Seu)\s+/, '').split(' ')[0];
export function interessa(id) {
  const h = S().heroi, it = h.interesse || 'oposto', sx = sexoDe(id);
  if (it === 'ninguem') return false; if (it === 'todos') return true; if (it === 'homens') return sx === 'M'; if (it === 'mulheres') return sx === 'F';
  return h.sexo === 'M' ? sx === 'F' : h.sexo === 'F' ? sx === 'M' : true;
}
export const parceiro = () => S().historia.par || null;
export const ehInimigo = (id) => (rel(id).ini | 0) > 0;
export const estaPerdido = (id) => !!rel(id).perdido;
// a Safira só se abre ao romance depois da vitória sobre o Rei e da conversa de parabéns
export const romanceLiberado = (id) => ROMANCEAVEIS.has(id) && (id !== 'safira' || (S().historia.flags.rei_derrotado && S().historia.flags.safira_parabens));
export const podeRomance = (id) => romanceLiberado(id) && interessa(id) && !ehInimigo(id) && !estaPerdido(id) && rel(id).afin >= 5;

const di = (G, nome, ret, linhas) => G.ui.dialogo(nome, Array.isArray(linhas) ? linhas : [linhas], { retrato: ret });
const mod = (a) => (R.derivar(S()).M || {})[a] || 0;
function teste(atr, dc) { const r = 1 + rnd(20), m = mod(atr), t = r + m; Dados.teste20(r, { mod: m, dc, rot: ATR_ROT[atr] || atr, ok: r === 20 || (r !== 1 && t >= dc) }); return { r, t, ok: r === 20 || (r !== 1 && t >= dc), nat20: r === 20, nat1: r === 1, txt: `* d20 ${r}${m >= 0 ? '+' : ''}${m} = ${t} contra CD ${dc} — ${r === 20 ? 'crítico!' : r === 1 ? 'desastre!' : t >= dc ? 'sucesso' : 'falha'}` }; }
const tmpDe = (id) => ((NPC_PERFIL[id] || {}).tmp || 'honrado');
const CALOR = new Set(['honrado', 'covarde', 'zombeteiro', 'ganancioso']);
const AJ_DC = { frio: 3, fanatico: 3, honrado: 2, arrogante: 1, agressivo: 1, ganancioso: 0, covarde: -1, zombeteiro: -1 };

// ---- afinidade, inimizade ----
export function mudarAfin(G, id, d) {
  const r = rel(id); const antes = r.afin; r.afin = Math.max(-10, Math.min(12, r.afin + d));
  if (!IMUNES.has(id) && antes > -5 && r.afin <= -5 && !(r.ini > 0)) iniciarInimizade(G, id, 1);
  St.salvar(); return r.afin;
}
export function iniciarInimizade(G, id, n = 1) {
  const r = rel(id), H = S().historia; r.ini = Math.max(r.ini | 0, n); r.afin = Math.min(r.afin, -5); r.rom = 0; if (H.par && H.par.id === id) H.par = null;
  const v = (H.vistos.rom ||= {}); v.inimigos = (v.inimigos | 0) + 1; St.salvar(); Au.sfx('hurt');
  if (G && G.ui) G.ui.toast(`⚔️ ${nomeDe(id)} agora é seu inimigo. Barra de inimizade ${r.ini}/10.`, 4200);
}
const ESCARRO = {
  honrado: ['Você manchou o que havia entre nós. Não espere meu perdão tão cedo.', 'Palavra quebrada pesa mais que armadura.'], covarde: ['Fique longe de mim. Por favor. Ou... eu chamo a guarda!', 'Eu confiei em você...'],
  zombeteiro: ['Haha. Não, não tem graça nenhuma. Some.', 'Eu ri demais da última vez. Hoje, não.'], ganancioso: ['Você me custou mais do que qualquer dívida. Quero distância.', 'Negócio desfeito. Para sempre.'],
  frio: ['Anotado. E esquecido. Passe bem.', 'Não tenho nada a lhe dizer.'], arrogante: ['Você ousou. Eu me lembrarei.', 'Retire-se da minha vista.'], agressivo: ['Me dá um motivo pra não te arrebentar.', 'Vá embora antes que eu perca a paciência!'], fanatico: ['O Rei viu o que você fez. Ele nunca esquece.', 'Você está só.'],
};
const escarro = (id) => pick(ESCARRO[tmpDe(id)] || ESCARRO.honrado);

// ---- menu "Romance…" ----
export async function menuRomance(G, id, ret, nome) {
  const s = S(), H = s.historia, r = rel(id), hoje = St.hoje(); const D = St.dia() || {}; const ativo = !!(D.series > 0 || D.cardio > 0 || D.estudo > 0);
  const custoPres = 20 + 6 * s.heroi.nivel; const custoCas = 200 + 40 * s.heroi.nivel; r.rom = r.rom | 0;
  for (;;) {
    const par = H.par; const eu = par && par.id === id; const ops = [];
    ops.push({ id: 'flertar', rot: 'Flertar.', tom: 'Charme', sub: r.flerteDia === hoje ? 'já tentou hoje' : (par && !eu ? `Você está com ${curto(par.id)}: isso acaba com o namoro` : 'CD de Carisma · 1 por dia'), off: r.flerteDia === hoje });
    ops.push({ id: 'presente', rot: `Dar um presente (${custoPres} ouro).`, tom: 'Gesto', sub: r.presenteDia === hoje ? 'já deu hoje' : 'Romance +1 · 1 por dia', off: r.presenteDia === hoje || s.heroi.ouro < custoPres });
    ops.push({ id: 'treino', rot: 'Convidar para treinar juntos.', tom: 'Rotina', sub: !ativo ? 'registre uma atividade hoje primeiro' : r.treinoDia === hoje ? 'já treinaram hoje' : 'Romance +2 · Afinidade +1', off: !ativo || r.treinoDia === hoje });
    if (!par && r.rom >= 10) ops.push({ id: 'namoro', rot: 'Pedir em namoro.', tom: 'Declaração' });
    if (eu && par.tipo === 'namoro' && r.rom >= 15) ops.push({ id: 'casar', rot: `Pedir em casamento (${custoCas} ouro).`, tom: 'Aliança', off: s.heroi.ouro < custoCas, sub: s.heroi.ouro < custoCas ? 'ouro insuficiente' : 'festa e aliança' });
    if (eu) ops.push({ id: 'terminar', rot: par.tipo === 'casado' ? 'Pedir o divórcio.' : 'Terminar o namoro.', tom: 'Ruptura' });
    ops.push({ id: 'volta', rot: 'Voltar.' });
    const estado = eu ? (par.tipo === 'casado' ? '💍 Casados' : '💞 Namorando') : 'Romance';
    const op = await G.ui.dialogoEscolha({ nome, retrato: ret, texto: `${estado} · Romance ${r.rom}/15 ♥ · Afinidade ${r.afin}`, opcoes: ops });
    if (op === 'volta') return;
    if (op === 'flertar') { if (!(await confirmarOutro(G, id, ret, nome))) continue; await flertar(G, id, ret, nome); }
    else if (op === 'presente') { if (!(await confirmarOutro(G, id, ret, nome))) continue; s.heroi.ouro -= custoPres; r.presenteDia = hoje; r.rom = Math.min(15, r.rom + 1); Au.sfx('coin'); await di(G, nome, ret, ['* Você entrega um pequeno presente, embrulhado com cuidado.', pick(CALOR.has(tmpDe(id)) ? ['Para mim? Não precisava... mas fico feliz.', 'Você lembrou do que eu gosto. Isso significa muito.'] : ['Hm. Pensou em mim. Anotado.', 'É... apropriado. Obrigado.']), `* Romance ${r.rom}/15 ♥`]); G.ui.hud(); }
    else if (op === 'treino') { if (!(await confirmarOutro(G, id, ret, nome))) continue; r.treinoDia = hoje; r.rom = Math.min(15, r.rom + 2); mudarAfin(G, id, 1); Au.sfx('confirm'); await di(G, nome, ret, ['» Quer treinar comigo hoje?', '* Vocês treinam lado a lado. Ninguém fala muito: não precisa.', `* Romance ${r.rom}/15 ♥ · Afinidade ${r.afin}`]); }
    else if (op === 'namoro') await pedirNamoro(G, id, ret, nome);
    else if (op === 'casar') await casar(G, id, ret, nome, custoCas);
    else if (op === 'terminar') await terminar(G, id, ret, nome);
    St.salvar();
  }
}
async function flertar(G, id, ret, nome) {
  const r = rel(id), hoje = St.hoje(); r.flerteDia = hoje; r.rom = r.rom | 0; const dc = 11 + (AJ_DC[tmpDe(id)] || 0) - Math.max(0, r.afin - 5); const t = teste('CAR', dc); const calor = CALOR.has(tmpDe(id));
  const ok = calor ? ['Você tem um jeito de dizer as coisas... Eu gosto disso.', 'Fiquei sem graça, mas não vou fingir que não gostei.', 'Se continuar assim, vou acabar me acostumando.'] : ['Direto. Eu respeito.', 'Hm. Você me surpreende. Pouca gente consegue.', 'Não vou negar. Há algo em você.'];
  const no = calor ? ['Ah... é que... ainda estou me acostumando. Dá um tempo?', 'Você é gentil, mas hoje não estou no clima.'] : ['Não. Hoje não.', 'Tente com menos esforço e mais verdade.'];
  if (t.nat1) { mudarAfin(G, id, -1); await di(G, nome, ret, ['» (Você tenta flertar...)', t.txt, 'Isso foi... constrangedor.', `* Afinidade ${r.afin}`]); return; }
  if (t.ok) { const ganho = t.nat20 ? 2 : 1; r.rom = Math.min(15, r.rom + ganho); Au.sfx('heal'); await di(G, nome, ret, ['» (Você tenta flertar...)', t.txt, pick(ok), `* Romance ${r.rom}/15 ♥${ganho > 1 ? ' (+2)' : ''}`]); if (r.rom === 10 && !S().historia.par) G.ui.toast(`💞 O romance com ${nomeDe(id)} chegou a 10: já dá para pedir em namoro.`, 4200); }
  else await di(G, nome, ret, ['» (Você tenta flertar...)', t.txt, pick(no)]);
}
// flertar com outra pessoa tem preço: quem já tinha o seu coração (ou o começo dele) sente
async function confirmarOutro(G, id, ret, nome) {
  const s = S(), H = s.historia; const par = H.par; const outros = Object.entries(s.npcs).filter(([k, v]) => k !== id && (v.rom | 0) > 0 && !v.perdido).map(([k]) => k);
  if (par && par.id === id) return true; // flertar com quem já é seu par não tem penalidade
  const alvo = par && par.id !== id ? par.id : outros[0]; if (!alvo) return true;
  const eh = par && par.id === alvo; const aviso = eh ? `Isso vai acabar com o seu ${par.tipo === 'casado' ? 'casamento' : 'namoro'} com ${nomeDe(alvo)}, que vai se voltar contra você.` : `${nomeDe(alvo)} vai saber. A afinidade e o romance dele(a) com você se perdem.`;
  const op = await G.ui.dialogoEscolha({ nome, retrato: ret, texto: aviso + ' Continuar?', opcoes: [{ id: 's', rot: 'Continuar mesmo assim.', tom: 'Risco' }, { id: 'n', rot: 'Deixa pra lá.' }] });
  if (op !== 's') return false; await trairA(G, alvo); return true;
}
export async function trairA(G, alvo) {
  const s = S(), H = s.historia, r = rel(alvo), eh = H.par && H.par.id === alvo; const v = (H.vistos.rom ||= {}); v.traicoes = (v.traicoes | 0) + 1; const ret = (G.retratoDe && G.retratoDe(alvo)) || null;
  if (eh) {
    const casado = H.par.tipo === 'casado'; H.par = null; r.afin = -Math.max(5, Math.abs(r.afin)); r.rom = 0; iniciarInimizade(G, alvo, casado ? 4 : 3);
    H.moral = Math.max(0, H.moral - 5); H.inercia = Math.min(10, H.inercia + 1);
    await di(G, nomeDe(alvo), ret, ['* A notícia chega antes de você.', `» (${curto(alvo)} sabe de tudo.)`, escarro(alvo), '* Moral −5 · Maré +1. A afinidade virou do avesso e uma barra de inimizade começou.']);
  } else {
    r.afin = Math.max(-4, r.afin - 3); r.rom = 0; H.moral = Math.max(0, H.moral - 1); mudarAfin(G, alvo, 0);
    await di(G, nomeDe(alvo), ret, ['* O boato corre pelo Vale.', `* ${nomeDe(alvo)} se afasta: o romance se perdeu e a afinidade caiu (${r.afin}).`]);
  }
  St.salvar(); G.ui.hud();
}
async function pedirNamoro(G, id, ret, nome) {
  const s = S(), H = s.historia, r = rel(id); H.par = { id, tipo: 'namoro', desde: St.hoje() }; H.moral = Math.min(100, H.moral + 5); s.heroi.insp = Math.min(3, (s.heroi.insp || 0) + 1); Au.sfx('pr');
  await di(G, nome, ret, ['» Eu queria te perguntar uma coisa. Você... aceita ficar comigo?', '* O silêncio dura um segundo longo demais.', pick(['Eu estava esperando você perguntar. Sim.', 'Sim. Sim, claro que sim.', 'Eu aceito. Mas vou cobrar: treinar junto, todo dia que der.']), `* 💞 Você e ${nomeDe(id)} estão namorando. Moral +5 · +1 Inspiração.`, '* Dica: o romance sobe até 15 para o casamento. Cuidado com quem você flerta: o Vale tem boca.']);
  G.ui.hud(); r.rom = Math.max(10, r.rom);
}
async function casar(G, id, ret, nome, custo) {
  const s = S(), H = s.historia, r = rel(id); s.heroi.ouro -= custo; H.par = { ...H.par, tipo: 'casado', desde: St.hoje() }; r.rom = 15; H.moral = Math.min(100, H.moral + 8); H.flags.casado = true; St.invAdd('alianca', 1); Au.sfx('win');
  await di(G, nome, ret, ['» Eu não sei fazer discursos. Mas fica comigo?', '* A taverna toda aplaude. Tavi chora no avental. Mestre Ferrão finge que é poeira.', 'Sim. Todos os dias que o Vale me deixar.', `* 💍 Você e ${nomeDe(id)} se casaram. Moral +8 · Aliança de Brasa (+8 PV máx. quando equipada).`, '* A partir de agora, essa pessoa mora na sua casa, e a Inércia vai ter de passar por ela primeiro.']);
  G.ui.hud();
}
async function terminar(G, id, ret, nome) {
  const op = await G.ui.dialogoEscolha({ nome, retrato: ret, texto: 'Isso vai doer nos dois. Tem certeza?', opcoes: [{ id: 's', rot: 'Sim. Acabou.', tom: 'Ruptura' }, { id: 'n', rot: 'Não. Esqueça o que eu disse.' }] }); if (op !== 's') return;
  const s = S(), H = s.historia, r = rel(id); H.par = null; r.rom = 0; r.afin = Math.max(-4, r.afin - 3); H.moral = Math.max(0, H.moral - 3); H.inercia = Math.min(10, H.inercia + 1);
  await di(G, nome, ret, ['» Eu acho que a gente precisa parar por aqui.', '* O rosto não muda, mas os olhos já foram para longe.', 'Entendo. Eu... vou ficar bem. Passe bem.', '* Moral −3 · Maré +1. Afinidade ' + r.afin + '.']); mudarAfin(G, id, 0); G.ui.hud();
}

// ---- menu "Ser grosseiro…" ----
const REACAO = { honrado: 'Isso está abaixo de você.', covarde: 'Ai... por que você fez isso?', zombeteiro: 'Hehe... essa pegou.', ganancioso: 'Vai sair caro, isso.', frio: 'Registrado.', arrogante: 'Impertinente.', agressivo: 'Quer apanhar?', fanatico: 'Blasfêmia.' };
export async function menuRude(G, id, ret, nome) {
  const s = S(); const op = await G.ui.dialogoEscolha({ nome, retrato: ret, texto: 'Você realmente quer fazer isso?', opcoes: [
    { id: 'zombar', rot: 'Zombar do trabalho dele(a).', tom: 'Afinidade −1' }, { id: 'ameacar', rot: 'Ameaçar sem motivo.', tom: 'Afinidade −2' }, { id: 'furtar', rot: 'Passar a mão em algo (furto).', tom: 'Risco: −1 ou −4' }, { id: 'volta', rot: 'Esquece. Foi mal.' }] });
  if (op === 'volta') return; const rea = REACAO[tmpDe(id)] || REACAO.honrado; const r = rel(id);
  if (op === 'zombar') { await di(G, nome, ret, ['» Esse trabalho aí? Qualquer um faz melhor.', rea]); mudarAfin(G, id, -1); }
  else if (op === 'ameacar') { s.historia.moral = Math.max(0, s.historia.moral - 1); await di(G, nome, ret, ['» Cuidado com o que fala perto de mim.', rea]); mudarAfin(G, id, -2); }
  else { const t = teste('DES', 12); if (t.ok) { const g = 15 + 3 * s.heroi.nivel; St.ganharOuro(g); Au.sfx('coin'); await di(G, nome, ret, ['* Você aproveita uma distração...', t.txt, `* +${g} ouro. Ninguém viu. Hoje.`]); mudarAfin(G, id, -1); } else { await di(G, nome, ret, ['* Você tenta pegar algo...', t.txt, 'Ei! Eu vi isso!', rea]); mudarAfin(G, id, -4); } }
  r.rude = (r.rude | 0) + 1; await di(G, nome, ret, [`* Afinidade ${r.afin}${r.afin <= -3 ? ' (cuidado: em −5 nasce uma inimizade)' : ''}.`]); G.ui.hud();
  if (ehInimigo(id)) await di(G, nome, ret, [escarro(id)]);
}

// ---- conversa com inimigos e com quem foi levado pela Inércia ----
export async function modoInimigo(G, id, ret, nome) {
  const s = S(), r = rel(id), hoje = St.hoje();
  if (r.perdido) {
    await di(G, nome, ret, ['* O corpo está imóvel, de olhos abertos, sem ver nada. A Inércia o levou por causa de uma palavra sua.', '* Só alguém que mantém a Brasa acesa por dias seguidos pode chamar de volta.']);
    const forte = (s.sequencia.atual | 0) >= 7;
    const op = await G.ui.dialogoEscolha({ nome, retrato: ret, texto: '(O que você faz?)', opcoes: [{ id: 'chamar', rot: 'Chamá-lo(a) pelo nome, de pé.', tom: 'Sequência de 7 dias', off: !forte, sub: forte ? '' : `sua sequência: ${s.sequencia.atual | 0}/7` }, { id: 'sair', rot: 'Ir embora.' }] });
    if (op === 'chamar') { r.perdido = false; r.ini = 0; r.afin = 0; s.historia.moral = Math.min(100, s.historia.moral + 6); Au.sfx('win'); await di(G, nome, ret, ['» Acorda. Eu estou aqui. Eu errei.', '* Os olhos piscam. A cor volta ao rosto, devagar.', `${curto(id)}: "...eu estava tão cansado(a). Obrigado por voltar."`, '* A Inércia soltou. Afinidade zerada: recomeçar é a única forma.']); G.ui.hud(); }
    St.salvar(); return;
  }
  await di(G, nome, ret, [escarro(id), `* Inimizade ${r.ini}/10 (afinidade ${r.afin}).`]);
  for (;;) {
    const op = await G.ui.dialogoEscolha({ nome, retrato: ret, texto: '...', opcoes: [{ id: 'desculpa', rot: 'Pedir desculpas.', tom: 'Carisma', sub: r.desculpaDia === hoje ? 'já tentou hoje' : `CD ${12 + r.ini}`, off: r.desculpaDia === hoje }, { id: 'provocar', rot: 'Provocar de novo.', tom: 'Inimizade +1' }, { id: 'sair', rot: 'Ir embora.' }] });
    if (op === 'sair') break;
    if (op === 'provocar') { r.ini = Math.min(10, r.ini + 1); s.historia.moral = Math.max(0, s.historia.moral - 1); await di(G, nome, ret, ['» Ainda aqui? Que patético.', escarro(id), `* Inimizade ${r.ini}/10.`]); continue; }
    r.desculpaDia = hoje; const t = teste('CAR', 12 + r.ini);
    if (t.ok) { r.ini = Math.max(0, r.ini - 1); r.afin = Math.min(0, r.afin + 1); if (r.ini === 0) { r.afin = 0; Au.sfx('heal'); await di(G, nome, ret, ['» Eu errei. Não peço que esqueça. Só que me deixe tentar de novo.', t.txt, '...Certo. Uma chance. Só uma.', '* A inimizade acabou. Vocês recomeçam do zero.']); G.ui.hud(); break; } await di(G, nome, ret, ['» Eu errei, e sei disso.', t.txt, 'Hm. Eu ouvi. Não sei se acredito. Volte outro dia.', `* Inimizade ${r.ini}/10.`]); }
    else { if (t.nat1) r.ini = Math.min(10, r.ini + 1); await di(G, nome, ret, ['» Eu errei, e sei disso.', t.txt, 'Palavras. Só palavras.', `* Inimizade ${r.ini}/10.`]); }
    St.salvar();
  }
  St.salvar();
}
// o Rei oferece "calar" um inimigo: o preço é a própria alma do Vale
export function perderNpc(id) { const r = rel(id); r.perdido = true; r.rom = 0; if (S().historia.par && S().historia.par.id === id) S().historia.par = null; }

// ---- consequências na história: o Rei percebe seus laços ----
export function reiSabe() {
  const s = S(); if (!s) return null; const H = s.historia; if (H.cap < 3 || H.cap > 20) return null; const par = H.par;
  if (par && !H.flags.rei_sabe_par && (par.tipo === 'casado' || St.hoje() >= R.addDias(par.desde, 2))) {
    const n = nomeDe(par.id), c = curto(par.id); return { especial: true, flag: 'rei_sabe_par', nv: 0, txt: ['* O ar da casa esfria. A vela treme, e a sombra no canto não é de nenhum móvel.', `Você não dorme mais sozinho. ${n}... é calor demais para uma noite tão curta.`, 'Eu não ameaço. Eu só observo quem vocês são juntos: um precisa do outro para levantar. Quando um para, o outro pesa.'],
      op: [{ rot: `${c} não faz parte desta guerra.`, tom: 'Proteger', resp: ['* Nhor inclina a cabeça, quase gentil.', 'Todos fazem parte. Mas gosto de quem protege. Por isso... ainda.'], ef: { moral: 2 } }, { rot: 'Fique longe de quem eu amo.', tom: 'Firmeza', resp: ['Ou o quê, herói? Você corre hoje... e amanhã?', '* A sombra some. A promessa fica: ela vai voltar se você afrouxar a rotina.'], ef: { moral: 1, insp: 1 } }, { rot: '(Pensar: e se descansássemos juntos?)', tom: 'Tentação', resp: ['* O sussurro adocica o ar.', 'Dois corpos no mesmo colchão, a mesma pausa. É tão fácil...', '* Você acorda mais pesado.'], ef: { moral: -3, inercia: 1 } }] };
  }
  const e = Object.entries(s.npcs).find(([k, v]) => (v.ini | 0) > 0 && !v.perdido && !IMUNES.has(k) && !H.flags['rei_sabe_ini_' + k]);
  if (e) { const id = e[0], n = nomeDe(id), c = curto(id); return { especial: true, flag: 'rei_sabe_ini_' + id, nv: 0, txt: ['* A sombra escorre pelo chão e sobe pela parede, devagar.', `Você fez um inimigo no Vale: ${n}. Sinto o gosto do rancor daqui.`, 'Eu posso dar descanso a quem magoou você. Basta uma palavra. Sem briga, sem esforço.'],
    op: [{ rot: 'Não preciso da sua ajuda.', tom: 'Firmeza', resp: ['Orgulho. Bom. Orgulho levanta.', '* Ele some. A inimizade com ' + c + ' continua, mas sua.'], ef: { moral: 3 } }, { rot: 'Sim. Faça ele(a) calar.', tom: 'Atalho', resp: ['* Nhor estala os dedos. Do outro lado do Vale, um corpo se imobiliza.', 'Viu? Tão fácil. Descanse também.', `* ${n} foi levado pela Inércia. Para chamar de volta: 7 dias seguidos de sequência.`], ef: { moral: -8, inercia: 1, perde: id } }, { rot: 'Vou resolver sozinho. Pedindo desculpas.', tom: 'Compaixão', resp: ['Pedir desculpa cansa. Eu notei.', '* Ele se desfaz em fumaça, quase decepcionado.'], ef: { moral: 4, insp: 1 } }] }; }
  return null;
}
// beijo de bom dia: quem mora com você lhe dá o primeiro fôlego do dia
export async function bomDia(G, id, ret, nome) {
  const H = S().historia; if (!H.par || H.par.id !== id || H.par.tipo !== 'casado') return; const r = rel(id), hoje = St.hoje(); if (r.beijo === hoje) return; r.beijo = hoje;
  S().heroi.insp = Math.min(3, (S().heroi.insp || 0) + 1); H.moral = Math.min(100, H.moral + 1); Au.sfx('heal');
  await di(G, nome, ret, ['* Um beijo na testa, quente, antes de qualquer pergunta.', pick(['Já treinou hoje? Eu não vou perguntar de novo.', 'Vai lá. Eu fico esquentando a casa.', 'A Brasa está acesa. Vai lá acender o resto.']), '* +1 Inspiração · Moral +1.']); St.salvar();
}

// ---- cartão de relações (painel Corações) ----
export function listaRelacoes() {
  const s = S(); const H = s.historia; const out = [];
  for (const [id, r] of Object.entries(s.npcs)) { if (!NPCS[id] || !(r.viu || r.afin || r.rom || r.ini)) continue; out.push({ id, nome: nomeDe(id), papel: NPCS[id].papel || '', afin: r.afin | 0, rom: r.rom | 0, ini: r.ini | 0, perdido: !!r.perdido, par: H.par && H.par.id === id ? H.par.tipo : null, romanceavel: ROMANCEAVEIS.has(id) && interessa(id) && (id !== 'safira' || romanceLiberado(id)), imune: IMUNES.has(id) }); }
  return out.sort((a, b) => (b.par ? 1 : 0) - (a.par ? 1 : 0) || b.afin - a.afin);
}
// item: Aliança de Brasa
ITENS.alianca = { id: 'alianca', nome: 'Aliança de Brasa', tipo: 'acessorio', pvBonus: 8, preco: 0, raro: 'raro', nvLoja: 99, desc: '+8 PV máximos. Forjada com a brasa do seu casamento.' };
