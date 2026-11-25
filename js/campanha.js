// Campanha expandida: "A Maldição da Inércia" — adaptação livre, com nomes e texto originais, da estrutura clássica de gótico-vampírico
// (vale selado pela névoa, senhor trágico preso num ciclo, leitura de cartas que revela relíquias e aliados, vilas e masmorras com dramas próprios).
// Aqui o "vampirismo" é a Inércia: quem se rende ao descanso eterno para de se mover. As missões pedem esforço REAL (séries, aeróbico, estudo,
// refeições) além de masmorras. Sem dependência do DOM; o store injeta as funções de recompensa.
import { ouroMissao } from './economia.js';

// ---------- mundo ----------
export const LOCAIS = {
  forjaluz: { nome: 'Forjaluz', txt: 'A última vila com fogo. Casas baixas, uma forja que teima em estalar e um poste onde se penduram as séries do dia.' },
  nevoa: { nome: 'A Névoa Parada', txt: 'Uma parede cinza que cerca o Vale. Quem entra nela anda em círculos até sentar — e quem senta não levanta.' },
  casa: { nome: 'A Casa do Repouso', txt: 'O porão da forja era, séculos atrás, uma casa de repouso. Alguns hóspedes nunca foram embora.' },
  marcha: { nome: 'Marcha-Lenta', txt: 'Cidade murada governada pelo Prefeito Gaudêncio, que proíbe pressa, suor e má notícia: "Aqui só há festa."' },
  moinho: { nome: 'O Moinho dos Doces Sonhos', txt: 'Três vovós vendem bolinhos de descanso. Quem come dois já não quer sair do sofá.' },
  fortaleza: { nome: 'Fortaleza Dracoprata', txt: 'Sede da extinta Ordem da Chama Prateada. Seus cavaleiros ainda patrulham, sem poder descansar.' },
  alvorada: { nome: 'Alvorada', txt: 'Vilarejo cercado por muros e uma abadia onde a Dra. Marcovia tenta curar o mundo — e erra a dose.' },
  garganta: { nome: 'A Garganta do Vento', txt: 'Passagem de montanha para fora do Vale. A ponte quebrou; só se atravessa subindo.' },
  brejo: { nome: 'O Brejo de Berez', txt: 'Vila afogada. Os mortos esperam em pé, com a água na cintura, alguém que lhes devolva o nome.' },
  vinhedo: { nome: 'O Vinhedo do Brinde Eterno', txt: 'Vinhas que dão um vinho tão bom que ninguém quer largar o copo.' },
  templo: { nome: 'O Templo Âmbar', txt: 'Um templo preso em resina dourada. Em cada altar, uma Dádiva: poder sem esforço, a preço de Inércia.' },
  colina: { nome: 'A Colina do Círculo Cinzento', txt: 'Druidas que acreditam que o mundo deveria parar de crescer.' },
  trono: { nome: 'O Trono Imóvel', txt: 'Salão onde o Rei de pedra espera por quem ainda tenha coragem de levantar de manhã.' },
};

export const PERSONAGENS = {
  brasa: { nome: 'Mestra Brasa', papel: 'Ferreira de Forjaluz' }, ferrao: { nome: 'Mestre Ferrão', papel: 'Mestre da Arena de Ferro' }, aurora: { nome: 'Irmã Aurora', papel: 'Sacerdotisa do Templo' },
  eruvim: { nome: 'Eruvim', papel: 'Sábio da Biblioteca' }, lucia: { nome: 'Capitã Lúcia', papel: 'Capitã da guarda' },
  ilara: { nome: 'Ilara Venn', papel: 'Corredora; a Inércia a persegue há gerações' }, safira: { nome: 'Dona Safira Pardal', papel: 'Leitora do Baralho do Hábito' },
  gaudencio: { nome: 'Prefeito Gaudêncio', papel: 'Governante de Marcha-Lenta' }, marcovia: { nome: 'Dra. Marcovia Alba', papel: 'Médica da Abadia de Alvorada' },
  hornfel: { nome: 'General Aldric Hornfel', papel: 'Último comandante da Chama Prateada' }, rictus: { nome: 'Mestre Rictus', papel: 'Mascate que caça mortos' },
  caliope: { nome: 'Calíope Vento-Norte', papel: 'Jovem caçadora de Inércia' }, vovo: { nome: 'Mãe Açúcar', papel: 'A mais velha das Vovós do Doce' },
  nhor: { nome: 'Nhor-Kaal', papel: 'Rei da Inércia' }, kaal: { nome: 'Kaal', papel: 'O irmão que Nhor não perdoou' }, aelis: { nome: 'Aélis', papel: 'A corredora que Nhor amou' },
};

// ---------- história de Nhor-Kaal (páginas do Diário, reveladas aos poucos) ----------
export const PAGINAS = [
  { id: 'pg1', t: 'Eu fui o primeiro a acender a Brasa', txt: 'Nasci filho de ferreiros e aprendi cedo que o fogo obedece a quem o alimenta. Aos dezesseis, ninguém no Vale levantava mais peso que eu. Eu era chamado de Nhor, o Constante. Foi o melhor que fui.' },
  { id: 'pg2', t: 'Kaal', txt: 'Meu irmão mais novo nunca treinou por medo. Treinava porque gostava. Ria quando falhava, e na semana seguinte estava melhor. Eu o admirava e, mais fundo, ardia por dentro: eu precisava ter medo para continuar, e ele não.' },
  { id: 'pg3', t: 'Aélis', txt: 'Aélis corria na beira do rio ao amanhecer, todo dia, chovesse ou não. Eu a vi uma vez e passei um ano acordando mais cedo para cruzar com ela. Ela sorria para nós dois, mas olhava para Kaal um segundo a mais.' },
  { id: 'pg4', t: 'O Torneio do Solstício', txt: 'Todo ano a Forja coroa um Campeão. Eu havia vencido seis vezes. No sétimo ano, Kaal chegou à final. Senti o chão sumir. Eu não suportava perder para quem não sofria como eu.' },
  { id: 'pg5', t: 'O Emissário', txt: 'Na véspera, um homem de rosto parado me ofereceu uma taça: "A Água Parada tira o cansaço, o medo e a dor. Você nunca mais vai querer descansar." Bebi. Era o primeiro atalho. Nunca me ocorreu perguntar o que ele cobraria no fim.' },
  { id: 'pg6', t: 'A última prova', txt: 'Venci sem suar. Kaal caiu na quarta volta, o coração falhando de tanto esforço — esforço que eu o obriguei a fazer ao não parar de empurrá-lo. Quando o virei de bruços, já estava frio. Aélis gritou meu nome como se fosse uma acusação.' },
  { id: 'pg7', t: 'O Penhasco', txt: 'Ela correu até a pedra mais alta do Vale e se jogou antes que eu a alcançasse. Eu estava sem cansaço, sem dor, sem lágrima. Só uma pergunta: como se faz para voltar atrás? O Emissário respondeu: "Não se faz. Se fica."' },
  { id: 'pg8', t: 'O Pacto', txt: 'Pedi o que qualquer um pediria: tempo. Que aquele dia não passasse. Que Aélis voltasse. O Emissário concordou: nada passa, e tudo que passa por ti vira cinza. Meu nome virou Nhor-Kaal: levo meu irmão no nome para lembrar do que fiz.' },
  { id: 'pg9', t: 'A Névoa', txt: 'Para que ninguém me visse parado, o Vale foi cercado. A Névoa Parada não deixa ninguém sair e deixa todo mundo cansado. A Brasa que acendi antes do pacto continua a queimar na vila que fundei, e eu, de longe, a odeio e a protejo na mesma medida.' },
  { id: 'pg10', t: 'Primeiro retorno', txt: 'Ela voltou: outro rosto, outro nome, a mesma corrida de manhã. Eu a servi, cortejei, ameacei, implorei. Ela fugiu de novo. Compreendi que Aélis não volta para ser salva; volta para escolher. E eu sempre a fiz escolher mal.' },
  { id: 'pg11', t: 'Os que me seguem', txt: 'Reuni os que se cansaram da vida. Chamo isso de Corte dos Sussurros: ali ninguém exige nada de ninguém. Quem entra, senta. Quem senta, fica. Chamam de paz. Eu sei que é o contrário do que busquei, e não paro.' },
  { id: 'pg12', t: 'A Ordem da Chama Prateada', txt: 'Houve cavaleiros que juraram me parar. Eu os derrotei de pé, sem erguer a voz. Hornfel ainda ronda os corredores, sem poder deitar. Ele me despreza com razão. É a única pessoa a quem eu devia um pedido de desculpas e não consigo imaginar como seria.' },
  { id: 'pg13', t: 'O Templo Âmbar', txt: 'Guardo em âmbar os presentes que o Emissário distribui: poder sem esforço. Ninguém os recusa. Quem os recusa sai mais forte. Já vi isso acontecer uma vez, e fiquei tão aterrorizado que fechei o templo.' },
  { id: 'pg14', t: 'Uma pergunta', txt: 'Será que Kaal teria vencido sem a Água Parada? Será que eu teria perdido para um irmão melhor, e vivido? Perdi essa pergunta para sempre. Ela é o centro do meu salão, onde o trono está.' },
  { id: 'pg15', t: 'O Chamado do Pesadelo', txt: 'Toda noite sonho o mesmo dia: o gelo de seu rosto. Acordo e repito o dia. Descobri que repetir é o único jeito de não sair daquele solstício.' },
  { id: 'pg16', t: 'Ilara', txt: 'A nova Aélis é teimosa. Corre no escuro, sem lanterna, de olhos fechados. Percebi: ela não foge de mim. Ela corre para algo. Tenho medo de descobrir o quê.' },
  { id: 'pg17', t: 'O que eu temo', txt: 'Temo quem se levanta amanhã sem precisar de motivo. Temo a constância sem glória. É a única coisa que nunca consegui ter. É a única coisa que me destruiria.' },
  { id: 'pg18', t: 'Carta de Kaal', txt: 'Achei, num baú, uma carta que nunca li: "Nhor, vou treinar até o Solstício e perder para você. Quero ver seu rosto quando vencer, e depois jantar juntos como antes." Fechei o baú. Nunca mais o abri. Hoje o abri.' },
  { id: 'pg19', t: 'A última brasa', txt: 'Se alguém ler isto, a última coisa a saber é que a Brasa não precisa de glória. Precisa de gente que volte amanhã. Fui forte demais para entender isso. Sejam fracos, mas voltem.' },
  { id: 'pg20', t: 'Epílogo de Nhor', txt: 'Quem ler isto já me venceu, ou desistiu antes. Se me venceu, saiba: eu quis ser vencido por alguém que não dependa de atalhos. Se desistiu, tente de novo amanhã. O Vale espera. Eu espero. Levante.' },
];

// ---------- Baralho do Hábito: leitura que decide onde estão as relíquias e o aliado ----------
export const SITIOS = {
  5: { nome: 'Torre do Pedágio', dica: 'Onde corvos cobram de quem passa, sobe a escada: lá o brilho espera.' },
  7: { nome: 'Minas de Ferrugem', dica: 'No ventre que sangra ferrugem, o duplo guarda o que ilumina.' },
  8: { nome: 'Estalagem Meia-Noite', dica: 'Uma casa onde sempre é tarde; no fim do corredor, um quarto fechado.' },
  9: { nome: 'Mercado dos Vazios', dica: 'Na banca sem dono, entre coisas frias, algo ainda quente.' },
  10: { nome: 'Torre do Mago Cinzento', dica: 'Alto lugar de vidro e cinza: o mago guarda o que não entende.' },
  11: { nome: 'Cemitério dos Gigantes', dica: 'Entre túmulos maiores que homens, o menor guarda a chave.' },
  12: { nome: 'Charco da Dama', dica: 'A dama de pedra segura aquilo que ela mesma perdeu.' },
  14: { nome: 'Cidade Afundada', dica: 'Sob a maré, no salão do trono de coral.' },
  15: { nome: 'Forja Roubada', dica: 'Onde o fogo foi roubado repousa o que o primeiro fogo fez.' },
};
export const RELIQUIAS = {
  sol: { nome: 'Lâmina Solar', item: 'lamina_solar', carta: 'O Sol do Meio-Dia', txt: 'Uma espada de luz que só queima mortos-vivos e sonolentos. Nhor a forjou antes do pacto, e a esqueceu.' },
  simbolo: { nome: 'Símbolo do Alvorecer', item: 'simbolo_alvorecer', carta: 'A Aurora', txt: 'Um disco de cobre que esquenta a cada manhã em que o portador se levanta. Protege e regenera.' },
  diario: { nome: 'Diário de Nhor', item: 'diario_nhor', carta: 'O Espelho', txt: 'O caderno do Rei. Mostra o que ele teme. O Rei fica mais fraco diante de quem o leu.' },
};
export const ALIADOS = {
  caliope: { nome: 'Calíope Vento-Norte', carta: 'A Corredora', cls: 'ladino', raca: 'meioelfo', mon: 's_scout', frase: 'Corro mais rápido do que ele pensa.', dica: 'Uma jovem que caça o que não se mexe espera num lugar que nunca dorme.' },
  rictus: { nome: 'Mestre Rictus', carta: 'O Mascate', cls: 'mago', raca: 'humano', mon: 's_mage', frase: 'Tenho um elixir para tudo, menos para o medo.', dica: 'Entre frascos e mentiras, um velho sabe mais do que vende.' },
  aurora: { nome: 'Irmã Aurora', carta: 'A Sacerdotisa', cls: 'clerigo', raca: 'meioelfo', mon: 's_priest', frase: 'Eu rezo; vocês batalhem. Eu cuido de quem cair.', dica: 'Uma voz de cura aguarda onde o descanso foi proibido.' },
  lucia: { nome: 'Capitã Lúcia', carta: 'A Guarda', cls: 'guerreiro', raca: 'humano', mon: 's_knight', frase: 'Quem fica na retaguarda também entra na história.', dica: 'Uma espada leal espera num lugar que já foi fortaleza.' },
  hornfel: { nome: 'General Aldric Hornfel', carta: 'O Revenante', cls: 'paladino', raca: 'anao', mon: 's_veteran', frase: 'Eu não durmo há quinhentos anos. Hoje, descanso depois dele.', dica: 'Um cavaleiro sem sono vigia o que ele mesmo deixou cair.' },
};
// leitura determinística (muda a cada ciclo): 3 relíquias + 1 aliado em sítios distintos, só em capítulos ainda não vencidos, em ordem crescente
export function lerBaralho(S, rng) {
  const todos = Object.keys(SITIOS).map(Number); let livres = todos.filter((n) => !S.historia.limpos.includes(n));
  if (livres.length < 4) livres = livres.concat(todos.filter((n) => !livres.includes(n)).slice(-(4 - livres.length)));
  const a = livres.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  const e = a.slice(0, 4).sort((x, y) => x - y); const al = Object.keys(ALIADOS)[Math.floor(rng() * 5)];
  return { ciclo: S.historia.ciclo, sol: e[0], simbolo: e[1], diario: e[2], aliado: al, aliadoCap: e[3] };
}

// ---------- quests ----------
// obj.k: series | aero | estudo | banquetes | perfeitos | prs | pomos | abates | masmorras | lift(+id) | capitulo | capRel(sol|simbolo|diario|aliado) | nivel | flag | quest | dias
// Os objetivos "relativos" contam a partir do início do passo; "capitulo", "nivel", "flag", "quest" são absolutos.
const Q = (o) => o;
export const QUESTS = [
  // ===== PRINCIPAIS =====
  Q({ id: 'p1', tipo: 'principal', ato: 1, nv: 1, titulo: 'O Que Resta de Nós', npc: 'brasa', req: {}, resumo: 'A forja de Forjaluz está fria. Algo roeu o porão: a antiga Casa do Repouso.',
    passos: [
      { txt: 'Registre sua primeira série na Arena de Ferro', obj: { k: 'series', n: 1 }, fala: 'Mestre Ferrão: "Uma série. A Brasa estalou. É assim que tudo começa."' },
      { txt: 'Desça ao Porão da Forja (Cap. 1)', obj: { k: 'capitulo', n: 1 }, fala: 'Entre os ossos da Casa do Repouso, você acha um caderno meio queimado com a letra N.' }],
    rec: { ouroK: 3, lore: ['pg1'], flag: 'casa_repouso' } }),
  Q({ id: 'p2', tipo: 'principal', ato: 1, nv: 2, titulo: 'A Neblina que Prende', npc: 'lucia', req: { quest: 'p1' }, resumo: 'Ninguém sai do Vale. Quem tenta, volta sentado. Capitã Lúcia quer entender por quê.',
    passos: [
      { txt: 'Faça 20 min de aeróbico e olhe a Névoa de perto', obj: { k: 'aero', n: 20 }, fala: 'Capitã Lúcia: "Você correu até a beira e voltou inteiro. Ninguém faz isso. Fique perto."' },
      { txt: 'Liberte as Cavernas dos Goblins (Cap. 2)', obj: { k: 'capitulo', n: 2 }, fala: 'Você acha um mapa antigo com uma frase riscada: "Quem sair do Vale precisa antes vencer o Rei."' }],
    rec: { ouroK: 3, lore: ['pg2'], moral: 3 } }),
  Q({ id: 'p3', tipo: 'principal', ato: 1, nv: 3, titulo: 'Corra com Ilara', npc: 'ilara', req: { quest: 'p2', nivel: 3 }, resumo: 'Ilara Venn corre sozinha antes do amanhecer, e a Inércia a persegue. Capitã Lúcia pede que você a acompanhe até o Mosteiro do Alvorecer.',
    passos: [
      { txt: 'Corra 30 min com Ilara (1ª etapa)', obj: { k: 'aero', n: 30 }, fala: 'Ilara: "Pensei que você ia desistir na primeira curva. Mais uma etapa."' },
      { txt: 'Corra mais 30 min (2ª etapa)', obj: { k: 'aero', n: 30 }, fala: 'Ilara: "Meu pai dizia que eu corria para algo. Hoje acho que corro de alguém."' },
      { txt: 'Chegue ao fim da trilha: vença a matilha do Cap. 3', obj: { k: 'capitulo', n: 3 }, fala: 'Ilara olha o céu: "Eu já morri aqui, não é? Eu sinto o cheiro da pedra do penhasco."' }],
    rec: { ouroK: 5, lore: ['pg3'], flag: 'ilara_amiga', moral: 4 } }),
  Q({ id: 'p4', tipo: 'principal', ato: 2, nv: 5, titulo: 'O Baralho do Hábito', npc: 'safira', req: { quest: 'p3', nivel: 5 }, resumo: 'Os Andarilhos acampam na estrada. Dona Safira lê um baralho que mostra onde as relíquias do Vale dormem — se você provar que já aprendeu a voltar todos os dias.',
    passos: [
      { txt: 'Complete 3 dias perfeitos (todas as missões do dia)', obj: { k: 'perfeitos', n: 3 }, fala: 'Dona Safira: "Só leio as cartas para quem volta. Sente-se."' },
      { txt: 'Estude 60 min para decifrar os símbolos do baralho', obj: { k: 'estudo', n: 60 }, fala: 'As cartas se alinham sozinhas. Você sente que o baralho já sabia.' }],
    rec: { ouroK: 6, lore: ['pg4'], leitura: true } }),
  Q({ id: 'p5', tipo: 'principal', ato: 2, nv: 6, titulo: 'A Lâmina do Meio-Dia', npc: 'safira', req: { leitura: true }, resumo: 'A leitura revelou onde a Lâmina Solar espera. Mas ela só se deixa empunhar por quem aguenta o peso do Sol.',
    passos: [
      { txt: 'Faça 30 séries pontuáveis para firmar o braço', obj: { k: 'series', n: 30 }, fala: 'Mestre Ferrão: "Trinta séries. Agora você segura a espada sem tremer."' },
      { txt: 'Recupere a Lâmina Solar no sítio revelado pela carta', obj: { k: 'capRel', rel: 'sol' }, fala: 'A espada acende ao tocar a luz do seu esforço.' }],
    rec: { ouroK: 8, reliquia: 'sol' } }),
  Q({ id: 'p6', tipo: 'principal', ato: 3, nv: 9, titulo: 'O Símbolo do Alvorecer', npc: 'aurora', req: { leitura: true, nivel: 9 }, resumo: 'Um disco de cobre que esquenta toda manhã em que o portador se levanta. Irmã Aurora diz que ele funciona melhor com quem dorme bem.',
    passos: [
      { txt: 'Complete 150 min de aeróbico ao amanhecer da vida real', obj: { k: 'aero', n: 150 }, fala: 'Irmã Aurora: "Você já sabe correr sem fugir. O Símbolo vai gostar disso."' },
      { txt: 'Recupere o Símbolo do Alvorecer no sítio revelado', obj: { k: 'capRel', rel: 'simbolo' }, fala: 'O disco esquenta na sua mão como pão tirado do forno.' }],
    rec: { ouroK: 10, reliquia: 'simbolo' } }),
  Q({ id: 'p7', tipo: 'principal', ato: 3, nv: 11, titulo: 'O Diário de Nhor', npc: 'eruvim', req: { leitura: true, nivel: 11 }, resumo: 'O Rei guarda um caderno com os seus medos. Eruvim jura que ler aquilo é a melhor arma contra ele.',
    passos: [
      { txt: 'Estude 240 min para estar à altura do que vai ler', obj: { k: 'estudo', n: 240 }, fala: 'Eruvim: "Você tem a cabeça para isso. Agora vá."' },
      { txt: 'Recupere o Diário de Nhor no sítio revelado', obj: { k: 'capRel', rel: 'diario' }, fala: 'A primeira página já diz seu nome. A segunda também.' }],
    rec: { ouroK: 12, reliquia: 'diario', lore: ['pg14'] } }),
  Q({ id: 'p8', tipo: 'principal', ato: 4, nv: 13, titulo: 'Quem Vai Ao Seu Lado', npc: 'safira', req: { leitura: true, nivel: 13 }, resumo: 'O baralho prometeu um aliado. Ele não aparece sozinho: precisa ver que você é alguém que merece ser seguido.',
    passos: [
      { txt: 'Bata 2 PRs (mostre que ainda evolui)', obj: { k: 'prs', n: 2 }, fala: 'Dona Safira: "Os fracos não trazem PR para casa. Você trouxe."' },
      { txt: 'Encontre o aliado no sítio da carta', obj: { k: 'capRel', rel: 'aliado' }, fala: 'O aliado estende a mão: "Chega de andar sozinho."' }],
    rec: { ouroK: 14, aliado: true } }),
  Q({ id: 'p9', tipo: 'principal', ato: 4, nv: 16, titulo: 'A Corte dos Sussurros', npc: 'ilara', req: { nivel: 16, quest: 'p3' }, resumo: 'Ilara foi levada. O Rei quer que ela escolha de novo. Só você pode chegar antes.',
    passos: [
      { txt: 'Complete 5 dias perfeitos para limpar a névoa do caminho', obj: { k: 'perfeitos', n: 5 }, fala: 'A Névoa se abre um palmo. Dá para ver a luz do trono.' },
      { txt: 'Atravesse a Corte dos Sussurros (Cap. 16)', obj: { k: 'capitulo', n: 16 }, fala: 'Ilara: "Eu escolhi. Vou lutar ao seu lado, não ao dele."' }],
    rec: { ouroK: 16, lore: ['pg16'], flag: 'ilara_escolheu' } }),
  Q({ id: 'p10', tipo: 'principal', ato: 5, nv: 20, titulo: 'O Trono Imóvel', npc: 'nhor', req: { nivel: 19 }, resumo: 'No fim do Vale, o Rei espera sentado, sem pressa. Ele sabe que você vai chegar. Só não sabe se você vai conseguir se levantar do chão uma última vez.',
    passos: [{ txt: 'Derrote Nhor-Kaal, o Rei da Inércia (Cap. 20)', obj: { k: 'capitulo', n: 20 }, fala: 'O trono racha. Do pó sobe uma voz: "Obrigado."' }],
    rec: { ouroK: 30, lore: ['pg20'], flag: 'rei_vencido' } }),

  // ===== SECUNDÁRIAS =====
  Q({ id: 's1', tipo: 'secundaria', ato: 2, nv: 5, titulo: 'O Moinho dos Doces Sonhos', npc: 'vovo', req: { nivel: 5 }, resumo: 'Três vovós vendem bolinhos de descanso a quem passa pela estrada. Quem come dois nunca mais treina. Capitã Lúcia pede que alguém prove que se pode comer bem e sair do sofá.',
    passos: [
      { txt: 'Termine 3 dias na meta de kcal (±10%)', obj: { k: 'banquetes', n: 3 }, fala: 'Mãe Açúcar: "Você come direito. Que decepção. Quem vai querer meus bolinhos?"' },
      { txt: 'Enfrente os chefes das catacumbas (1 masmorra)', obj: { k: 'masmorras', n: 1 }, fala: 'Os fornos do moinho esfriam. Sobre uma bancada, um livro de receitas de verdade.' }],
    rec: { ouroK: 6, item: 'i_restorative_ointment', moral: 4, lore: ['pg5'] } }),
  Q({ id: 's2', tipo: 'secundaria', ato: 3, nv: 8, titulo: 'A Ordem da Chama Prateada', npc: 'hornfel', req: { nivel: 8 }, resumo: 'Os cavaleiros prateados patrulham a Fortaleza sem poder descansar. O General Hornfel pede que alguém lembre que honra é rotina.',
    passos: [
      { txt: 'Faça 50 séries para honrar o juramento da Ordem', obj: { k: 'series', n: 50 }, fala: 'General Hornfel: "Cinquenta. Eles também faziam. Obrigado por lembrar."' },
      { txt: 'Passe pelo Cap. 8 (Estalagem Meia-Noite)', obj: { k: 'capitulo', n: 8 }, fala: 'Os cavaleiros deitam, finalmente, onde ficam os brasões.' }],
    rec: { ouroK: 8, item: 'i_arrow_catching_shield', lore: ['pg12'] } }),
  Q({ id: 's3', tipo: 'secundaria', ato: 3, nv: 9, titulo: 'A Doutora de Alvorada', npc: 'marcovia', req: { nivel: 9 }, resumo: 'A Dra. Marcovia acredita que "cura" é eliminar o cansaço. Aplica doses em Alvorada que fazem todos parecerem saudáveis — e pararem de se mexer. Peça a ela um segundo exame.',
    passos: [
      { txt: 'Estude 120 min de medicina com a doutora (de verdade)', obj: { k: 'estudo', n: 120 }, fala: 'Dra. Marcovia: "Não existe saúde sem fadiga. Eu esqueci isso. Sou médica há muito tempo."' },
      { txt: 'Liberte a Abadia (1 masmorra)', obj: { k: 'masmorras', n: 1 }, fala: 'As portas da ala de internação se abrem. Todos saem andando devagar, mas andando.' }],
    rec: { ouroK: 8, item: 'pocao3', moral: 6 } }),
  Q({ id: 's4', tipo: 'secundaria', ato: 2, nv: 6, titulo: 'A Garganta do Vento', npc: 'ferrao', req: { nivel: 6 }, resumo: 'A ponte caiu. A única forma de sair da Garganta é subindo, puxando o próprio peso.',
    passos: [{ txt: 'Faça 20 séries de barra/puxada', obj: { k: 'lift', id: 'barra', n: 20 }, fala: 'Você chega ao alto do penhasco. A Névoa lá embaixo parece um mar tranquilo.' }],
    rec: { ouroK: 6, item: 'i_boots_of_striding_and_springing' } }),
  Q({ id: 's5', tipo: 'secundaria', ato: 3, nv: 10, titulo: 'O Vinhedo do Brinde Eterno', npc: 'gaudencio', req: { nivel: 10 }, resumo: 'O vinho do vinhedo é tão bom que ninguém para de brindar. Aprenda a beber água, dormir e levantar cedo.',
    passos: [{ txt: 'Complete 3 dias perfeitos (nada de brindar além da meta)', obj: { k: 'perfeitos', n: 3 }, fala: 'Ao amanhecer, os vinhateiros acordam de ressaca e agradecem.' }],
    rec: { ouroK: 10, item: 'i_cloak_of_protection' } }),
  Q({ id: 's6', tipo: 'secundaria', ato: 2, nv: 6, titulo: 'Os Afogados de Berez', npc: 'eruvim', req: { nivel: 6 }, resumo: 'Em Berez, os mortos esperam em pé, com água até a cintura, por alguém que lhes diga os nomes. Eruvim tem uma lista.',
    passos: [
      { txt: 'Estude 60 min para decorar os nomes da lista', obj: { k: 'estudo', n: 60 }, fala: 'Eruvim: "Cada nome é uma vela. Vá."' },
      { txt: 'Percorra o Pântano Silente (Cap. 6)', obj: { k: 'capitulo', n: 6 }, fala: 'Você diz os nomes. A água desce um palmo a cada um.' }],
    rec: { ouroK: 7, item: 'i_ioun_stone_of_protection', lore: ['pg7'] } }),
  Q({ id: 's7', tipo: 'secundaria', ato: 4, nv: 13, titulo: 'O Caçador de Elixires', npc: 'rictus', req: { nivel: 13 }, resumo: 'Um mascate com lábia vende elixires para tudo. Na verdade, é um caçador de mortos que perdeu a esposa. Ele quer ver se você tem constância.',
    passos: [{ txt: 'Bata 1 PR para provar que ainda evolui', obj: { k: 'prs', n: 1 }, fala: 'Mestre Rictus tira o chapéu: "Constância e ousadia. Raro."' }],
    rec: { ouroK: 12, item: 'i_flask_of_holy_water', lore: ['pg15'] } }),
  Q({ id: 's8', tipo: 'secundaria', ato: 3, nv: 10, titulo: 'O Templo Âmbar', npc: 'safira', req: { nivel: 10 }, resumo: 'No Templo Âmbar, cada altar oferece uma Dádiva: poder sem treino. Dona Safira avisa: recusar todas é a prova do campeão.',
    passos: [{ txt: 'Resista aos atalhos: estude 200 min de verdade', obj: { k: 'estudo', n: 200 }, fala: 'Você deixa as Dádivas em pé no altar. O âmbar racha de leve.' }],
    rec: { ouroK: 10, item: 'i_ioun_stone_of_regeneration', lore: ['pg13'], insp: 1 } }),
  Q({ id: 's9', tipo: 'secundaria', ato: 2, nv: 7, titulo: 'Pés de Chumbo', npc: 'lucia', req: { nivel: 7 }, resumo: 'Os recrutas da guarda arrastam os pés. Capitã Lúcia quer que alguém dê o exemplo na estrada.',
    passos: [{ txt: 'Complete 120 min de aeróbico (qualquer modalidade)', obj: { k: 'aero', n: 120 }, fala: 'Os recrutas passam a imitar o seu ritmo. A guarda marcha em fila.' }],
    rec: { ouroK: 6, moral: 6, item: 'i_brooch_of_shielding' } }),
  Q({ id: 's10', tipo: 'secundaria', ato: 2, nv: 4, titulo: 'A Colina do Círculo Cinzento', npc: 'brasa', req: { nivel: 4 }, resumo: 'Druidas que acreditam que o mundo deveria parar de crescer queimaram a horta da forja. Mestra Brasa quer um acerto de contas.',
    passos: [
      { txt: 'Derrote 15 criaturas nas masmorras', obj: { k: 'abates', n: 15 }, fala: 'Os druidas recuam. Brotos verdes nascem entre as cinzas.' },
      { txt: 'Faça 20 séries pontuáveis (reerguer a horta)', obj: { k: 'series', n: 20 }, fala: 'Mestra Brasa chora de rir: "Quem diria. Fogo e horta."' }],
    rec: { ouroK: 4, item: 'i_belt_of_hill_giant_strength', moral: 4 } }),
  Q({ id: 's11', tipo: 'secundaria', ato: 4, nv: 14, titulo: 'Cartas para Aélis', npc: 'ilara', req: { nivel: 14, quest: 'p3' }, resumo: 'Ilara guarda cartas que escreve para uma mulher que nunca conheceu. Ela quer que você as leia.',
    passos: [{ txt: 'Junte 8 páginas do Diário de Nhor (por capítulos e missões)', obj: { k: 'paginas', n: 8 }, fala: 'Ilara: "Agora sei de quem eram as pernas que eu herdei."' }],
    rec: { ouroK: 8, lore: ['pg10'], item: 'i_cloak_of_displacement' } }),
  Q({ id: 's12', tipo: 'secundaria', ato: 5, nv: 17, titulo: 'O Menino Que Não Levantava', npc: 'aurora', req: { nivel: 17 }, resumo: 'Um menino de Forjaluz se recusa a sair da cama há semanas. Irmã Aurora não sabe se é Inércia ou tristeza — e pede cuidado com os dois.',
    passos: [{ txt: 'Fique ativo em 7 dias (qualquer atividade) e cuide dos seus', obj: { k: 'dias', n: 7 }, fala: 'O menino abre a porta. "Posso correr com você?"' }],
    rec: { ouroK: 14, moral: 10, lore: ['pg17'] } }),
];
export const QUEST_POR_ID = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

// ---------- estado e motor ----------
export const novoEstado = () => ({ q: {}, lore: [], leitura: null, rel: {}, aliado: null, modo: 'campanha', loops: 0, explorador: { andar: 0 } });
const REL_ABS = { capitulo: 1, capRel: 1, nivel: 1, flag: 1, quest: 1, paginas: 1 };
const liftsTotais = (S) => { const t = {}; for (const v of Object.values(S.dias || {})) for (const [id, n] of Object.entries(v.liftSets || {})) t[id] = (t[id] || 0) + (typeof n === 'number' ? n : 0); return t; };
function snapBase(S) { const st = S.stats; return { series: st.series, aero: st.cardioMin, estudo: st.estudoMin, banquetes: st.banquetes, perfeitos: st.perfeitos, prs: st.prs, pomos: st.pomos, abates: st.abates, masmorras: st.masmorras, dias: st.diasAtivos, lifts: liftsTotais(S) }; }
export function medir(S, q, ip) {
  const p = q.passos[ip]; const o = p.obj; const est = S.campanha.q[q.id]; const base = est.base || {};
  const rel = (k, cur) => Math.max(0, cur - (base[k] || 0));
  switch (o.k) {
    case 'series': return [rel('series', S.stats.series), o.n]; case 'aero': return [rel('aero', S.stats.cardioMin), o.n]; case 'estudo': return [rel('estudo', S.stats.estudoMin), o.n];
    case 'banquetes': return [rel('banquetes', S.stats.banquetes), o.n]; case 'perfeitos': return [rel('perfeitos', S.stats.perfeitos), o.n]; case 'prs': return [rel('prs', S.stats.prs), o.n];
    case 'pomos': return [rel('pomos', S.stats.pomos), o.n]; case 'abates': return [rel('abates', S.stats.abates), o.n]; case 'masmorras': return [rel('masmorras', S.stats.masmorras), o.n];
    case 'dias': return [rel('dias', S.stats.diasAtivos), o.n];
    case 'lift': return [Math.max(0, (liftsTotais(S)[o.id] || 0) - ((base.lifts || {})[o.id] || 0)), o.n];
    case 'capitulo': return [S.historia.limpos.includes(o.n) ? 1 : 0, 1];
    case 'capRel': { const L = S.campanha.leitura; const n = L && (o.rel === 'aliado' ? L.aliadoCap : L[o.rel]); return [n && S.historia.limpos.includes(n) ? 1 : 0, 1]; }
    case 'nivel': return [S.heroi.nivel >= o.n ? 1 : 0, 1]; case 'flag': return [S.historia.flags[o.f] ? 1 : 0, 1]; case 'quest': return [S.campanha.q[o.id] && S.campanha.q[o.id].est === 'feita' ? 1 : 0, 1];
    case 'paginas': return [S.campanha.lore.length, o.n];
    default: return [0, 1];
  }
}
export function requisitos(S, q) {
  const r = q.req || {}; const C = S.campanha;
  if (r.nivel && S.heroi.nivel < r.nivel) return false; if (r.quest && !(C.q[r.quest] && C.q[r.quest].est === 'feita')) return false; if (r.leitura && !C.leitura) return false; if (r.flag && !S.historia.flags[r.flag]) return false;
  return true;
}
export function lerPagina(S, id) { const C = S.campanha; if (!C.lore.includes(id) && PAGINAS.find((p) => p.id === id)) { C.lore.push(id); return PAGINAS.find((p) => p.id === id); } return null; }
// Executa um passo do "relógio" da campanha: ativa quests liberadas, avança passos cumpridos e entrega recompensas. Retorna eventos para a UI.
export function avaliar(S, h) {
  const C = S.campanha; const ev = []; let mudou = true; let guarda = 0;
  while (mudou && guarda++ < 12) {
    mudou = false;
    for (const q of QUESTS) {
      let e = C.q[q.id];
      if (!e) { if (requisitos(S, q)) { C.q[q.id] = e = { est: 'ativa', passo: 0, base: snapBase(S), desde: S.inicio || '' }; ev.push({ t: 'nova', q }); mudou = true; } else continue; }
      if (e.est !== 'ativa') continue;
      const [a, n] = medir(S, q, e.passo);
      if (a >= n) {
        const p = q.passos[e.passo]; ev.push({ t: 'passo', q, passo: e.passo, fala: p.fala }); mudou = true;
        if (e.passo + 1 >= q.passos.length) { e.est = 'feita'; entregar(S, q, h, ev); ev.push({ t: 'fim', q }); } else { e.passo++; e.base = snapBase(S); }
      }
    }
  }
  return ev;
}
function entregar(S, q, h, ev) {
  const r = q.rec || {}; const C = S.campanha;
  if (r.ouroK) h.ganharOuro(ouroMissao(Math.max(q.nv, 1), r.ouroK));
  if (r.item) h.invAdd(r.item, 1);
  if (r.moral) S.historia.moral = Math.max(0, Math.min(100, S.historia.moral + r.moral));
  if (r.insp) S.heroi.insp = Math.min(3, (S.heroi.insp || 0) + r.insp);
  if (r.flag) S.historia.flags[r.flag] = true;
  for (const id of r.lore || []) { const p = lerPagina(S, id); if (p) ev.push({ t: 'lore', p }); }
  if (r.leitura && !C.leitura) { C.leitura = h.lerBaralho(); ev.push({ t: 'leitura', L: C.leitura }); }
  if (r.reliquia) { darReliquia(S, r.reliquia, h, ev); }
  if (r.aliado) { const a = C.leitura && ALIADOS[C.leitura.aliado]; if (a) { h.recrutar(C.leitura.aliado); ev.push({ t: 'aliado', a }); } }
}
export function darReliquia(S, id, h, ev) {
  const C = S.campanha; if (C.rel[id]) return; C.rel[id] = true; h.invAdd(RELIQUIAS[id].item, 1); ev.push({ t: 'reliquia', r: RELIQUIAS[id] });
}
// Marca o que o capítulo concluído revela (páginas do diário). Relíquias exigem a missão correspondente (ou se entregam já ao concluir, se a missão estiver ativa).
export function aoConcluirCapitulo(S, n, h) {
  const C = S.campanha; const ev = []; const pg = PAGINAS[Math.min(19, n - 1)]; if (pg && n % 2 === 0) { const p = lerPagina(S, pg.id); if (p) ev.push({ t: 'lore', p }); }
  if (n === 4 || n === 8 || n === 12) { const p = lerPagina(S, 'pg' + (n / 4 + 8)); if (p) ev.push({ t: 'lore', p }); }
  if (n === 18) { const p = lerPagina(S, 'pg18'); if (p) ev.push({ t: 'lore', p }); }
  if (n === 19) { const p = lerPagina(S, 'pg19'); if (p) ev.push({ t: 'lore', p }); }
  return ev;
}
// Quantas relíquias o herói tem (para enfraquecer o Rei no final).
export const nReliquias = (S) => Object.values(S.campanha.rel || {}).filter(Boolean).length;
// Resumo para a UI
export function ativas(S) { return QUESTS.filter((q) => S.campanha.q[q.id] && S.campanha.q[q.id].est === 'ativa'); }
export function feitas(S) { return QUESTS.filter((q) => S.campanha.q[q.id] && S.campanha.q[q.id].est === 'feita'); }
export function progressoQuest(S, q) { const e = S.campanha.q[q.id]; if (!e) return null; const ip = e.est === 'feita' ? q.passos.length - 1 : e.passo; const [a, n] = medir(S, q, ip); return { passo: ip, de: q.passos.length, a: Math.min(a, n), n, txt: q.passos[ip].txt }; }
