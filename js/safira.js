// Safira: clériga de cabelo e roupas roxos que só aparece em Forjaluz às quintas-feiras.
// Antes do Rei cair, vende Selos da Aurora (atalhos caros contra a Inércia) e conta a própria história em quatro quintas, sem afinidade.
// Depois de comprar e ouvir a crítica, fica "trancada" até a vitória sobre o Rei. Aí vem a conversa de parabéns, o romance se abre e ela passa a vender cura e PV máximos.
import * as St from './store.js';
import * as R from './rules.js';
import { NPCS } from './story.js';
import { NPC_PERFIL } from './personalidade.js';
import { ITENS } from './srd.js';
import { mulberry32, hashStr } from './rules.js';
import { sortearAp } from './cosmeticos.js';
import { ouroPorDia } from './economia.js';
import { TOPICOS } from './historia2.js';
import { rel } from './romance.js';
import { conversar } from './conversa.js';
import * as Au from './audio.js';

const S = () => St.S; const rnd = (n) => Math.floor(Math.random() * n);
NPCS.safira = { nome: 'Safira', papel: 'Clériga das quintas-feiras', falas: ['Só passo às quintas. A Névoa afina um pouco nesse dia.', 'Cada sino é um dia emprestado. Os juros são seus.', 'Se um dia você não precisar de mim, melhor para nós dois.'] };
NPC_PERFIL.safira = { raca: 'humano', tmp: 'frio', vis: { cls: 'clerigo', cat: 'veste', ornam: 2 },
  ap: Object.assign(sortearAp(mulberry32(hashStr('safira-roxa')), 'clerigo', 'humano'), { corpo: 0, altura: 0, cabelo: 10, cabeloCor: '#8f3df0', barba: 0, marca: 7, acess: 6, roupa: 5, roupa1: '#7a2ad0', roupa2: '#d9b3ff', arm1: '#7a2ad0', arm2: '#d9b3ff', capa: 1, olhosCor: '#c58cff' }),
  gosta: 'Cabelo e túnica da cor de ametista. Sorri só quando acha que ninguém está olhando.',
  afin: ['Eu cresci contando sinos. Você cresceu contando séries. Acho que somos parecidos.', 'Todo domingo eu rezo por quem eu vendi um atalho na quinta. É um péssimo negócio emocional.', 'Se um dia eu parar de viajar, quero uma casa com uma torre de sinos. Sem preço.'] };

// ---- presença: só às quintas, só em Forjaluz ----
export const ehQuinta = () => R.diaSemana(St.hoje()) === 4;
export const safiraNaVila = () => !!S() && ehQuinta();
export const posSafira = { x: 23, y: 17 };

// ---- itens ----
const preco = (m) => Math.max(120, Math.round(ouroPorDia(Math.min(20, Math.max(1, S().heroi.nivel))) * m / 5) * 5);
ITENS.sino = { id: 'sino', nome: 'Sino da Aurora', tipo: 'consumivel', selo: 1, preco: 0, raro: 'raro', nvLoja: 99, desc: 'Ao tocar, a Névoa recua por 1 dia: a Maré efetiva vira 0/10. O valor real da Maré não muda.' };
ITENS.sino3 = { id: 'sino3', nome: 'Sino da Aurora Maior', tipo: 'consumivel', selo: 3, preco: 0, raro: 'épico', nvLoja: 99, desc: 'A Névoa recua por 3 dias. O valor real da Maré não muda.' };
ITENS.elixirAlvorecer = { id: 'elixirAlvorecer', nome: 'Elixir do Alvorecer', tipo: 'consumivel', cura: '8d4+8', preco: 0, raro: 'raro', nvLoja: 99, desc: 'Cura 8d4+8 PV.' };
ITENS.bencaoCura = { id: 'bencaoCura', nome: 'Bênção de Cura de Safira', tipo: 'consumivel', curaPerm: 2, preco: 0, raro: 'raro', nvLoja: 99, desc: 'Permanente: toda cura de poção rende +2 PV.' };
ITENS.tonicoVida = { id: 'tonicoVida', nome: 'Tônico da Vitalidade', tipo: 'consumivel', pvMax: 5, preco: 0, raro: 'raro', nvLoja: 99, desc: 'Permanente: +5 PV máximos.' };
ITENS.medalhaoSafira = { id: 'medalhaoSafira', nome: 'Medalhão de Safira', tipo: 'acessorio', pvBonus: 12, preco: 0, raro: 'épico', nvLoja: 99, desc: '+12 PV máximos enquanto equipado.' };

// ---- conversas (uma por quinta; nenhuma rende afinidade) ----
const CONV = [
  ['* Uma mulher de cabelo e túnica roxos arruma, sobre um pano, pequenos sinos de bronze. Um deles toca sozinho quando você chega.', 'Quinta-feira. A única em que a Névoa afina o bastante para eu atravessar a estrada sem tropeçar nela.', 'Meu nome é Safira. Clériga, ou o que sobrou de uma. Vendo Selos da Aurora: sinos que silenciam a Inércia por um dia.', 'São caros, sim. A Ordem acabou, e eu como, como todo mundo.', '* (Ela não pede nada. Só observa você, medindo.)'],
  ['Você voltou. Pouca gente volta ao mesmo lugar duas vezes sem comprar nada.', 'A Ordem do Alvorecer fundiu estes sinos há trinta anos. Cada um guarda um amanhecer inteiro. Tocá-lo é pegar um dia emprestado.', 'Emprestado, escute bem. Os juros chegam depois: dia seguinte, o mundo parece mais cinza, porque você lembra de como era.', 'Por isso só vendo às quintas. Ninguém deveria ter um domingo sem cor por minha causa.', '* Os sinos tilintam baixinho, como se concordassem.'],
  ['Eu tive uma irmã mais velha. Ametista. Cantava no coro da Ordem antes de a Névoa chegar.', 'Quando a Inércia veio, ela se sentou ao lado da lareira e não levantou mais. Aceitou uma Dádiva do Rei: poder sem suor.', 'Hoje é uma estátua de pedra roxa num templo que ninguém visita. Eu a visito.', 'É por isso que vendo atalhos, e é por isso que os odeio. Os dois sentimentos moram juntos, em paz.', 'Não precisa dizer nada.'],
  ['Última conversa. Eu faço assim: quatro quintas, quatro verdades, e depois o negócio.', 'Todos os meus fregueses acabam comprando. Alguns por desespero, outros por pressa. Poucos, por curiosidade. Nenhum, por força.', 'Tenho um Sino da Aurora aqui que cobre um dia inteiro. Quero que você o compre. Preciso ver o que você faz com ele.'],
];
const CRITICA = ['* O sino muda de mão. Por um instante, o som é o único barulho da praça.', 'Pronto.', 'Sabe o que eu vejo quando alguém paga tanto para silenciar a Inércia por um dia? Alguém que não acredita que consegue lidar com ela sozinho.', 'A Brasa que você carrega é mais forte do que o meu bronze. Mas você veio até aqui para comprar o meu.', 'Eu vendo. Não vou fingir que isso é força.', 'Volto toda quinta. Mas não tenho mais nada para você, nem sino, nem conversa, até o dia em que o Rei cair. Aí a gente fala de coisas melhores.'];
const TRAVA = ['* Safira organiza os sinos sem erguer os olhos. Você sabe que ela percebeu que você chegou.', 'Hoje não. Quando o Rei cair, venha.', '* Ela toca um sino apagado e o guarda no bolso.', 'Quinta-feira de novo. Mesma praça, mesmos sinos, mesma resposta.', 'Treine. Não é conselho, é o contrário de um produto.'];
const PARABENS = ['* Safira ergue os olhos assim que você chega. Os sinos todos tocam ao mesmo tempo, sem vento.', 'Você... conseguiu. Eu senti o Vale respirar de manhã. Pensei que fosse engano.', 'Eu vendia atalhos porque achava que ninguém venceria sozinho. Você provou o contrário na minha frente.', 'Peço desculpa pelo que eu disse. A Brasa sempre foi sua. Eu só não sabia onde ela morava.', 'Não vendo mais sinos. Os que sobraram vão virar bronze para a Torre de Alvorada. Trouxe outras coisas: curas, tônicos, bênçãos de vida.', '* Ela hesita, e a voz sai mais baixa.', 'E... se não for demais, eu queria conhecer você sem o Rei no meio. Devagar. Com chá.'];

// ---- tópicos depois do Rei ----
TOPICOS.safira = [
  { id: 'ametista', rot: 'Ainda visita a sua irmã?', tom: 'Passado', req: (c) => c.flags.rei_derrotado, npc: ['Visito. Desde que o Rei caiu, a pedra roxa já não é tão fria.', 'Os médicos de Alvorada dizem que as estátuas voltam, devagar. Eu levo um sino. Ela vai reconhecer o som.'] },
  { id: 'sinos', rot: 'O que vai fazer com os sinos?', tom: 'Futuro', req: (c) => c.flags.rei_derrotado, npc: ['Derreter. Fazer um sino só, grande, para a Torre. Para marcar a hora de levantar. Cada dia, sem preço.'] },
];

// ---- compra ----
async function comprar(G, ret, nome, id, valor) {
  const s = S(); if (s.heroi.ouro < valor) { await G.ui.dialogo(nome, ['* Você não tem ouro suficiente.', `Custa ${valor}. Volte quando tiver. Eu estarei aqui, quintas.`], { retrato: ret }); return false; }
  s.heroi.ouro -= valor; St.invAdd(id, 1); Au.sfx('coin'); St.salvar(); G.ui.hud(); G.ui.toast(`${ITENS[id].nome} comprado (−${valor} ouro). Use na Mochila.`); return true;
}
async function lojaSelos(G, ret, nome) {
  const r = rel('safira'); const p1 = preco(30), p3 = preco(70);
  for (;;) {
    const op = await G.ui.dialogoEscolha({ nome, retrato: ret, texto: 'Selos da Aurora. O preço é sério, o alívio é curto.', opcoes: [
      { id: 'sino', rot: `Sino da Aurora (${p1} ouro).`, tom: '1 dia', sub: 'a Maré efetiva vira 0/10 por 1 dia', off: S().heroi.ouro < p1 },
      { id: 'sino3', rot: `Sino da Aurora Maior (${p3} ouro).`, tom: '3 dias', sub: 'a Maré efetiva vira 0/10 por 3 dias', off: S().heroi.ouro < p3 }, { id: 'volta', rot: 'Voltar.' }] });
    if (op === 'volta') return; const ok = await comprar(G, ret, nome, op, op === 'sino' ? p1 : p3); if (ok) { r.comprou = (r.comprou | 0) + 1; St.salvar(); }
  }
}
const LIM = { bencaoCura: 5, tonicoVida: 6, medalhaoSafira: 1 };
async function lojaCura(G, ret, nome) {
  const r = rel('safira'); r.comp = r.comp || {};
  for (;;) {
    const L = [['elixirAlvorecer', 'Elixir do Alvorecer', preco(10), 'cura 8d4+8 PV'], ['bencaoCura', 'Bênção de Cura', preco(25), 'permanente: curas de poção +2 PV'], ['tonicoVida', 'Tônico da Vitalidade', preco(30) + 100 * (r.comp.tonicoVida | 0), 'permanente: +5 PV máx.'], ['medalhaoSafira', 'Medalhão de Safira', preco(60), 'acessório: +12 PV máx.']];
    const ops = L.map(([id, n, p, d]) => { const lim = LIM[id]; const feito = lim && (r.comp[id] | 0) >= lim; return { id, rot: `${n} (${p} ouro).`, tom: feito ? 'esgotado' : '', sub: feito ? `limite de ${lim} atingido` : d, off: feito || S().heroi.ouro < p }; });
    const op = await G.ui.dialogoEscolha({ nome, retrato: ret, texto: 'Cura e vida. Sem pressa, sem sino.', opcoes: [...ops, { id: 'volta', rot: 'Voltar.' }] });
    if (op === 'volta') return; const item = L.find((x) => x[0] === op); const ok = await comprar(G, ret, nome, op, item[2]); if (ok) { r.comp[op] = (r.comp[op] | 0) + 1; St.salvar(); }
  }
}

// ---- entrada: chamada por falarComNpc quando o NPC é a Safira ----
export async function conversarSafira(G, n, def, pf, ret, nome) {
  const s = S(), H = s.historia, r = rel('safira'), hoje = St.hoje(); r.viu = true; const di = (l) => G.ui.dialogo(nome, l, { retrato: ret });
  r.conv = r.conv | 0;
  // depois do Rei
  if (H.flags.rei_derrotado) {
    if (!H.flags.safira_parabens) { await di(PARABENS); H.flags.safira_parabens = true; r.parabens = hoje; St.salvar(); G.ui.toast('💜 Safira agora vende curas e vida máxima. O romance com ela também está aberto (afinidade 5 para flertar).', 5200); }
    await conversar(G, n, def, pf, ret, nome, null); return false;
  }
  // trancada até o Rei cair
  if (r.trava) { r.travaN = (r.travaN | 0) + 1; await di(r.travaN % 2 ? TRAVA.slice(0, 3) : TRAVA.slice(3)); return false; }
  if (!r.abriu) { r.abriu = true; }
  for (;;) {
    const pend = r.conv < 4; const jaHoje = r.convDia === hoje;
    const op = await G.ui.dialogoEscolha({ nome, retrato: ret, texto: r.conv ? 'Mais alguma coisa?' : 'Procurando alguma coisa?', opcoes: [
      { id: 'conversar', rot: pend ? `Conversar com ela (${r.conv}/4).` : 'Conversar.', tom: 'Sem afinidade', sub: jaHoje ? 'uma conversa por quinta-feira' : '', off: jaHoje || !pend },
      { id: 'loja', rot: 'Ver os Selos da Aurora.', tom: 'Serviço' }, { id: 'sair', rot: 'Até a próxima quinta.' }] });
    if (op === 'sair') return false;
    if (op === 'loja') { await lojaSelos(G, ret, nome); continue; }
    // conversa da vez
    await di(CONV[r.conv]); r.convDia = hoje;
    if (r.conv < 3) { r.conv++; St.salvar(); continue; }
    // quarta conversa: a compra encerra o arco
    if (!(r.comprou > 0)) {
      const p1 = preco(30); const o2 = await G.ui.dialogoEscolha({ nome, retrato: ret, texto: `Leve o Sino da Aurora (${p1} ouro).`, opcoes: [{ id: 'comprar', rot: `Comprar o Sino da Aurora (${p1} ouro).`, tom: 'Decisão', off: s.heroi.ouro < p1, sub: s.heroi.ouro < p1 ? 'ouro insuficiente' : '' }, { id: 'nao', rot: 'Agora não.' }] });
      if (o2 !== 'comprar') { await di(['Tudo bem. A conversa só termina quando você decidir. Quinta que vem eu repito a última parte.', '* (A última conversa fica pendente.)']); St.salvar(); return false; }
      const ok = await comprar(G, ret, nome, 'sino', p1); if (!ok) { St.salvar(); return false; } r.comprou = 1;
    }
    r.conv = 4; await di(CRITICA); r.trava = true; St.salvar(); G.ui.toast('Safira não tem mais nada para você até o Rei da Inércia cair.', 4800); return false;
  }
}
export function instalar(G) { G.lojaSafira = lojaCura; G.safira = conversarSafira; }
export { lojaCura };
