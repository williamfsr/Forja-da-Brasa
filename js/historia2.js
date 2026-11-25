// Dados narrativos: tudo adaptado ao Rei da Inércia (Nhor-Kaal) como "Maldição de Strahd" é a Strahd — o Vale inteiro gira em torno dele.
// Nada aqui copia texto do módulo: são paralelos originais (leitora de cartas, festival que nega o medo, visitas do vilão, templo de dádivas, caçadores de monstros...).
export const ATIT = { // como cada NPC trata forasteiros marcados: 'acolhe' | 'desconfia'
  brasa: 'acolhe', ferrao: 'acolhe', aurora: 'acolhe', eruvim: 'acolhe', tavi: 'acolhe', lucia: 'desconfia', quinzinho: 'acolhe', alquimista: 'acolhe', ilara: 'acolhe', ordalia: 'acolhe',
  gaudencio: 'desconfia', marcovia: 'desconfia', hornfel: 'desconfia', rictus: 'desconfia', caliope: 'acolhe', vovo: 'acolhe', estalajadeira: 'acolhe', padre: 'desconfia', brindival: 'acolhe',
  barqueiro: 'acolhe', druida: 'desconfia', mordomo: 'desconfia', guarda: 'desconfia', menino: 'acolhe', sentinela: 'desconfia',
};
export const RACA_L = { // [acolhe, desconfia]
  humano: ['Mais um rosto cansado como o meu. Bem-vindo ao Vale.', 'Humano... a Inércia adora os de vocês. Cansam sem perceber.'],
  elfo: ['Um elfo! Dizem que vocês lembram de tudo. Aqui isso é dom e maldição.', 'Elfos vivem tanto que a Inércia os espera com paciência. Cuidado.'],
  meioelfo: ['Entre dois mundos e inteiro no meu. Seja bem-vindo.', 'Sangue misturado... o Rei coleciona gente de entre-lugares. Fique atento.'],
  anao: ['Um anão! Ombros de quem carrega o próprio peso. Gosto disso.', 'Anões e teimosia: a Inércia também é teimosa. Vão se estranhar.'],
  halfling: ['Pequeno, mas passo firme. Os pequenos sempre chegam.', 'Pequeno demais para o Vale. A Névoa sobe até a cintura de vocês.'],
  gnomo: ['Gnomo! Olhos de quem quer entender tudo. Aqui há muito a entender.', 'Gnomos perguntam demais. O Rei adora perguntas: ele tem todo o tempo.'],
  meioorc: ['Ombros de quem não pede licença à preguiça. Boa.', 'Um meio-orc... o Rei já usou gente da sua cor contra nós. Mas olho o que você faz.'],
  draconato: ['Escamas e fôlego de fogo! A Brasa fica orgulhosa com gente assim.', 'Sopro de dragão... o Rei tem dragões mortos no salão. Não me leve a mal, só estou cauteloso.'],
  tiefling: ['Chifres e cara limpa. O Vale já viu coisa pior, e melhor. Seja bem-vindo.', 'Marcado pelo Abismo... o Emissário também veio de longe. Vou observar seus passos.'],
};
export const MARCA_L = { // por nome da marca
  'Cicatriz no olho': 'Essa cicatriz no olho... a Inércia fez isso? Ou foi alguém que você não deixou parar?', 'Cicatriz na bochecha': 'Cicatriz na bochecha: de quem não virou o rosto numa hora difícil.',
  Sardas: 'Sardas! O sol já lhe deu bom-dia mais vezes do que ao resto do Vale.', 'Pintura de guerra': 'Pintura de guerra... para quem você está avisando que vem?', 'Tatuagem tribal': 'Essa tatuagem tem história. Conte um dia.',
  Olheiras: 'Olheiras fundas. Treina de madrugada ou perdeu sono para a Inércia?', Pinta: 'Uma pintinha no lugar certo. Dizem que traz sorte nas cartas.', Rugas: 'Rugas de quem riu e de quem sofreu. As duas coisas treinam o rosto.', Rubor: 'Faces coradas! Sinal de sangue correndo. Aqui é coisa rara.',
};
export const ACESS_L = { 'Faixa na testa': 'Faixa na testa: de quem não deixa o suor entrar nos olhos. Gosto.', Bandana: 'Bandana bem amarrada. Quem se arruma para o dia já começou ganhando.', Brincos: 'Belos brincos. Uma vaidade que não faz mal a ninguém.', 'Óculos de aviador': 'Óculos de aviador! Para olhar a Névoa de cima?', 'Coroa de louros': 'Coroa de louros... não a tire. O Rei odeia as de verdade.', Tiara: 'Uma tiara! Parece que o Vale vai ter realeza de novo.', 'Chapéu de viajante': 'Chapéu de viajante: esses sempre voltam com histórias.', 'Lenço no pescoço': 'Lenço no pescoço. Cuidado com o vento da Garganta.', 'Monóculo': 'Monóculo? O senhor deve ter lido muito. Eruvim vai querer conversar.' };
export const CLASSE_L = {
  guerreiro: ['plantar os pés e erguer a guarda', 'Postura firme. Vejo que não é a primeira vez que você segura uma lâmina.'], barbaro: ['soltar um rugido curto que treme o chão', 'Esse rugido assusta até a Névoa. Mas poupe a garganta.'],
  mago: ['fazer uma faísca dançar entre os dedos', 'Bela faísca. Um mago... o Rei tem um fraco por quem estuda sem sair da cadeira. Não seja um deles.'], clerigo: ['fazer uma prece breve que aquece o ar', 'Calor de verdade. Faz tempo que o Vale não sente isso de uma prece.'],
  paladino: ['fincar a lâmina no chão e jurar em silêncio', 'Um juramento. Aqui, quem jura de verdade é raro, e perigoso para o Rei.'], ladino: ['sumir por um segundo atrás de uma sombra', 'Você sumiu! Cuidado: a Inércia esconde melhor, e não devolve.'],
  patrulheiro: ['apontar rastros que ninguém mais viu', 'Olho de rastreador. Aproveite: o Vale tem muito para rastrear.'], druida: ['encostar a mão no chão e fazer brotar um fio de grama', 'Grama! Em pleno Vale parado. Faça isso de novo, por favor.'], bardo: ['dedilhar uma melodia curta', 'Bela melodia. Se tiver rima, o Rei dorme de tédio, o que já é um começo.'],
  bruxo: ['murmurar um nome que não é seu', 'Esse nome... não repita aqui. Há quem escute pela Névoa.'], feiticeiro: ['deixar o cabelo arrepiar com uma centelha', 'Centelha no sangue. Não gaste tudo de uma vez: o Vale é longo.'], monge: ['respirar fundo e ficar imóvel como pedra viva', 'Imóvel... mas desperto. É a diferença que importa por aqui.'],
};
// Falas de missão: oferta (quando ativa pela 1ª vez), andamento e conclusão. Paralelos temáticos do módulo, com a Inércia no centro.
export const QFALAS = {
  p1: { ativa: ['A forja esfriou porque quem a alimentava parou de vir. Registre uma série na Arena e desça ao Porão: lá ficava a Casa do Repouso, onde Nhor era chamado de Constante.', 'Se achar um caderno queimado com a letra N, traga: é a primeira página que sobrou do Rei.'], feita: ['Você desceu e voltou. É mais do que fiz em anos. A Brasa respondeu ao seu passo.'] },
  p2: { ativa: ['Ninguém sai do Vale: quem tenta, volta sentado, sem saber como. A Névoa Parada obedece a alguém.', 'Faça aeróbico e olhe a Névoa enquanto corre. Ela recua quando a gente se move.'], feita: ['A Névoa recuou na sua frente. É a primeira prova de que ela tem dono... e que o dono teme movimento.'] },
  p3: { ativa: ['Ilara corre antes do amanhecer; a Inércia a persegue há gerações. Acompanhe-a até o Mosteiro. O Rei a observa de longe.', 'Se ouvir passos parados atrás de vocês, não olhe: corra.'], feita: ['Ilara chegou inteira. Ela diz que, ao seu lado, o medo de olhar para trás sumiu por alguns minutos.'] },
  p4: { ativa: ['Os Andarilhos acampam na estrada. Dona Ordália lê um baralho que mostra onde as relíquias do Vale dormem, mas só a quem já provou ser constante.', 'Volte a ela depois de me mostrar que consegue manter a rotina.'], feita: ['As cartas caíram. Três lugares, um aliado, e um rosto que você ainda não conhece: o do Rei.'] },
  p5: { ativa: ['A Lâmina do Meio-Dia só se deixa empunhar por quem aguenta o peso do Sol. Treine pesado e vá buscá-la.'], feita: ['A lâmina é sua. Ela brilha mais quando você acorda cedo.'] },
  p6: { ativa: ['O Símbolo do Alvorecer esquenta toda manhã em que o portador se levanta. Ele quer alguém que durma bem e acorde cedo.'], feita: ['O disco está morno na sua mão. Se esfriar, é o Vale avisando que você parou.'] },
  p7: { ativa: ['O Rei guarda um diário com os seus medos. Estude, estude muito: ler aquilo é a melhor arma contra ele.'], feita: ['Você leu o que ele escreveu. Agora ele não é só um monstro: é alguém que perdeu um irmão.'] },
  p8: { ativa: ['O baralho prometeu um aliado, mas ele só se junta a quem merece ser seguido.'], feita: ['Seu aliado chegou. Cuide dele: o Rei sabe usar os amigos dos outros contra eles.'] },
  p9: { ativa: ['Ilara foi levada à Corte dos Sussurros. O Rei quer que ela escolha de novo, como Aélis escolheu. Só você chega antes.'], feita: ['Ela escolheu correr. Mais uma vez. Dessa vez, com você ao lado.'] },
  p10: { ativa: ['No fim do Vale, o Rei espera sentado, sem pressa. Ele sabe que você vai chegar.'], feita: ['O Rei levantou. Pela primeira vez em muito tempo, ele levantou.'] },
  s1: { ativa: ['No Moinho dos Doces Sonhos, três vovós vendem bolinhos de descanso. Quem come dois nunca mais treina. Prove que dá para comer com moderação e voltar a se mexer.'], feita: ['Mãe Açúcar disse que você é a primeira visita que provou os bolinhos sem pedir o terceiro. Isso a incomodou. Isso foi bom.'] },
  s2: { ativa: ['Os cavaleiros prateados patrulham a Fortaleza sem poder descansar. Mostre a eles que honra é rotina, não castigo.'], feita: ['Alguns cavaleiros finalmente deitaram. Hornfel não, ainda. Mas ele olhou o chão por um instante.'] },
  s3: { ativa: ['A Dra. Marcovia acha que cura é eliminar o cansaço. Ela aplica doses em Alvorada que fazem todos parecerem saudáveis, e pararem de se mover. Mostre a ela o contrário.'], feita: ['Marcovia reviu a conta: o cansaço era o corpo pedindo cama certa, não corpo errado.'] },
  s4: { ativa: ['A ponte da Garganta do Vento caiu. A única forma de sair é subindo, puxando o próprio peso.'], feita: ['A parede cedeu a vinte séries. O vento parou de gritar e passou a sussurrar um elogio.'] },
  s5: { ativa: ['O vinho do Vinhedo é tão bom que ninguém para de brindar. Aprenda a beber água, dormir e levantar cedo.'], feita: ['Brindival jura que o vinho ficou mais doce quando alguém recusou o segundo cálice.'] },
  s6: { ativa: ['Em Berez, os mortos esperam em pé, com água até a cintura, por alguém que lhes diga os nomes. Eruvim tem uma lista. Estude para pronunciá-los.'], feita: ['A água baixou um palmo. Alguém lembrou deles. É só o que queriam.'] },
  s7: { ativa: ['Um mascate vende elixires para tudo. É um caçador de mortos que perdeu a esposa. Ele quer ver se você tem constância.'], feita: ['Rictus guardou o último frasco. "Você me lembra que perseguir é mais forte que lamentar."'] },
  s8: { ativa: ['No Templo Âmbar, cada altar oferece uma Dádiva: poder sem treino. Recusar todas é a prova do campeão.'], feita: ['Você saiu do Templo de mãos vazias e mais forte. Nhor escondeu o olhar.'] },
  s9: { ativa: ['Os recrutas arrastam os pés. A Capitã quer que alguém dê o exemplo na estrada.'], feita: ['Os recrutas pararam de arrastar. Alguém começou a marchar no mesmo ritmo que você.'] },
  s10: { ativa: ['Druidas que acreditam que o mundo deveria parar de crescer queimaram a horta da forja. Resolva isso sem fogo.'], feita: ['Pedra-Lenta aceitou replantar. "Crescer cansa, criança. Mas é a única coisa que não é morte."'] },
  s11: { ativa: ['Ilara guarda cartas que escreve para uma mulher que nunca conheceu. Ela quer que você as leia: reúna páginas do diário primeiro.'], feita: ['A última carta não tinha destinatário. Só dizia: "Eu corro por você, mesmo sem saber quem é."'] },
  s12: { ativa: ['Um menino da Casa Velha se recusa a sair da cama há semanas. Não sei se é Inércia ou tristeza. Vá devagar.'], feita: ['Teo levantou e foi ver o sol. A mãe dele chorou. Eu também.'] },
};
// Sonhos (visões de Nhor): um por página do Diário já lida, contados depois de dormir em casa
export const SONHOS_INTRO = ['* Você dorme. A Névoa afina. Uma voz, sua e não sua, sussurra à beira da cama.', '* Você está no Torneio do Solstício, mas de fora: é a visão de Nhor.'];
// Visitas do Rei: ele não aparece para lutar; aparece para ser ouvido (como um anfitrião que nunca vai embora)
export const VISITAS = [
  { nv: 1, txt: ['* O sino da forja toca sozinho. Na praça, um homem de rosto parado está sentado num banco que não existia.', 'Você chegou. Sente-se. Nada aqui exige pressa.', 'Eu fui como você, uma vez. Cheio de ideias. Sabe o que me falta? Nada. Nada me falta. É o que me falta.'], op: [
    { rot: 'Prefiro ficar de pé.', tom: 'Recusar', resp: ['Ficar de pé cansa. Você vai descobrir.', '* Ele some como poeira. Seus joelhos ficam firmes.'], ef: { moral: 3 } },
    { rot: 'Quem é você?', tom: 'Perguntar', resp: ['Um velho conhecido do solstício. Aqui me chamam de Rei.', '* Ele some. Fica um cheiro de ferro frio.'], ef: { lore: 'pg1' } },
    { rot: 'Sentar um pouco.', tom: 'Ceder', resp: ['Assim. Respire. Amanhã você faz o que não fez hoje.', '* Quando você levanta, o corpo pesa o dobro.'], ef: { inercia: 1, moral: -3 } }] },
  { nv: 3, txt: ['* No caminho, o vento para. Uma taça de água parada aparece sobre uma pedra.', 'Beba. Aquilo que você chama de "esforço" é só um mal-entendido do corpo.', 'Já ofereci essa taça a um jovem melhor do que você. Ele bebeu.'], op: [
    { rot: 'Derramar a água no chão.', tom: 'Recusar', resp: ['Impertinente. Eu gosto.', '* A grama onde a água cai fica verde por um instante.'], ef: { moral: 4 } },
    { rot: 'Quem foi esse jovem?', tom: 'Perguntar', resp: ['Eu. Antes de ter um nome com dois lados.', '* A taça se parte sem barulho.'], ef: { lore: 'pg5' } },
    { rot: 'Beber um gole.', tom: 'Ceder', resp: ['Hm. Você sente? Nenhuma dor. Nenhum motivo.', '* Você anda dez passos e esquece por quê.'], ef: { inercia: 1, moral: -4 } }] },
  { nv: 6, txt: ['* Pela primeira vez, ele está de pé. Atrás dele, um cavalo feito de névoa.', 'Gente da Corte me pergunta por que não destruo você. Respondo: "Ele é a visita mais interessante em séculos."', 'Você faz algo que ninguém faz: volta amanhã. Como se isso fosse fácil.'], op: [
    { rot: 'É fácil. É por isso que funciona.', tom: 'Retrucar', resp: ['Fácil... Que palavra obscena.', '* Ele vira o rosto. Uma sombra de riso passa.'], ef: { moral: 4 } },
    { rot: 'Você também podia voltar amanhã.', tom: 'Provocar', resp: ['...', '* Ele não diz nada. O cavalo recua dois passos.'], ef: { lore: 'pg14', moral: 2 } },
    { rot: 'Ficar em silêncio.', tom: 'Calar', resp: ['O silêncio é meu domínio. Obrigado.', '* O Vale parece mais cinza ao seu redor.'], ef: { inercia: 1 } }] },
  { nv: 9, txt: ['* Uma mulher que não é Ilara corre pela Névoa, em círculos. Nhor a observa de uma varanda que não existe.', 'Aélis. Toda vez que o Vale a devolve, eu esqueço o nome por um instante, e depois lembro. Isso dói mais do que lembrar sempre.', 'Se você a levar para fora, eu perco a única razão de continuar parado.'], op: [
    { rot: 'Eu a levo se ela quiser.', tom: 'Prometer', resp: ['"Se ela quiser." Sempre essa condição. Você é como Kaal.', '* A mulher some. Uma brisa quente passa por você.'], ef: { moral: 5, lore: 'pg10' } },
    { rot: 'Você a prende. Isso não é amor.', tom: 'Acusar', resp: ['Talvez. Mas é o que me sobrou.', '* O Vale estremece. Os cavaleiros prateados ouvem ao longe.'], ef: { moral: 2 } },
    { rot: 'Isso não me diz respeito.', tom: 'Esquivar', resp: ['Ótimo. Nada deve dizer.', '* A Névoa engrossa.'], ef: { inercia: 1, moral: -2 } }] },
  { nv: 12, txt: ['* No espelho da casa, seu reflexo está sentado. Você, de pé.', 'Eu sou o que você será se parar por uma semana. Eu sou razoável. Eu sou cômodo.', 'E o pior: eu sou compreensível.'], op: [
    { rot: 'Compreender não é concordar.', tom: 'Resistir', resp: ['Argumento limpo. Eu escrevi um parecido, uma vez.', '* O reflexo se levanta, hesitante, e acompanha você.'], ef: { moral: 5 } },
    { rot: 'Qual era o nome do seu irmão?', tom: 'Ferir', resp: ['Kaal.', '* A palavra fica no ar como uma pedra caindo num lago. O espelho trinca.'], ef: { lore: 'pg2', moral: 3 } },
    { rot: 'Talvez você tenha razão.', tom: 'Ceder', resp: ['Assim. Venha. Sente-se.', '* Você sente o chão puxar suas pernas.'], ef: { inercia: 2, moral: -6 } }] },
  { nv: 15, txt: ['* A Cidadela aparece no horizonte mesmo onde não deveria. Uma carta cai no seu pé: um baralho de rosto, Kaal.', 'Achei isso. Quase abri. Você abriria?', '* Na carta, a letra de Kaal: "Nhor, vou treinar até o Solstício e perder para você..."'], op: [
    { rot: 'Abra. Ele merece ser lido.', tom: 'Incentivar', resp: ['...', '* Nhor fecha a carta e a guarda no peito. Sem palavras.'], ef: { lore: 'pg18', moral: 6 } },
    { rot: 'Não adianta mais.', tom: 'Duvidar', resp: ['Sim. Não adianta. É o que digo todos os dias.', '* Ele se vai. O Vale pesa.'], ef: { inercia: 1 } },
    { rot: 'Eu a leio por você.', tom: 'Oferecer', resp: ['Não. Ainda não. Mas... obrigado.', '* É a primeira vez que ele agradece a alguém.'], ef: { moral: 4, lore: 'pg18' } }] },
];
// Dádivas do Templo Âmbar: poder sem esforço (preço: Inércia). Recusar todas é a vitória.
export const DADIVAS = [
  { id: 'a1', nome: 'Dádiva do Atalho', desc: '+3 Tochas agora', fala: 'Uma estátua de âmbar sussurra: "Sem mais cansaço. Tochas para sempre."', pega: { tochas: 3 } },
  { id: 'a2', nome: 'Dádiva do Ouro Fácil', desc: '+150 de ouro agora', fala: 'Uma poça dourada: "Nenhuma série precisa pagar por isso."', pega: { ouro: 150 } },
  { id: 'a3', nome: 'Dádiva da Pausa', desc: 'Cura total, sem descansar', fala: 'Um altar quente: "Durma sem dormir. Cure sem cuidar."', pega: { cura: true } },
];
// Teo (Casa Velha): a quest "O Menino Que Não Levantava"
export const TEO = {
  frio: ['* Teo está embaixo do cobertor. Só os olhos aparecem.', 'Hoje não. Amanhã eu levanto. Amanhã eu levanto. Amanhã eu levanto.', '(Teo parece repetir a frase há semanas.)'],
  quente: ['* Teo espia você. Você se movimentou hoje; ele nota o cheiro de ar de fora.', 'Você... correu? Eu também queria correr. É que a perna não vai.', 'Se eu levantar só até a janela... você fica comigo?'],
  fim: ['* Teo levanta devagar. Fica de pé. Vai até a janela. A luz bate no rosto dele.', 'É... claro lá fora. Eu tinha esquecido.', '(A Brasa da forja, ao longe, estala um pouco mais forte.)'],
};
// Tópicos de conversa por NPC: {id, rot (fala do herói), npc[], req?, ef?}. Eles apontam lugares do mapa, relações e a sombra do Rei.
export const TOPICOS = {
  brasa: [
    { id: 'forja', rot: 'Por que a forja esfriou?', npc: ['A Brasa que acendi nasceu de um primeiro fogo, o de Nhor. Ele ainda está nos tijolos. Quando Nhor parou, a forja esfriou: o fogo é filho do hábito, não da raiva.', 'Se quer vê-lo, desça ao Porão. Ali era a Casa do Repouso, onde os campeões dormiam.'] },
    { id: 'nhor', rot: 'Você conheceu Nhor?', npc: ['Fui aprendiz do pai dele. Nhor era o mais constante dos rapazes. Quando o irmão caiu... eu estava na pista. Não consegui impedir. Até hoje, martelo sem parar para não pensar nisso.'], req: (c) => c.cap >= 2 },
    { id: 'cond', rot: 'Como o Vale ficou assim?', npc: ['Primeiro a Névoa, depois o cansaço, depois os dias iguais. Quem fica muito tempo parado vira paisagem. O Rei não mata ninguém; ele espera. É pior.'] }],
  ferrao: [
    { id: 'treino', rot: 'Como o senhor treina?', npc: ['Pouco volume, todo dia, sem faltar. O Rei odeia constância: ela não faz barulho. Ganhei muitos torneios; só um me ensinou algo: o que Nhor perdeu.'] },
    { id: 'torneio', rot: 'Conte do Torneio do Solstício.', npc: ['Foi antes de mim. Dizem que Nhor ganhou sem suar. Dizem que o irmão caiu. Dizem que ninguém voltou a correr no mesmo solstício. Eu só sei que a Arena nunca mais coroou campeão.'], req: (c) => c.cap >= 3 }],
  aurora: [
    { id: 'templo', rot: 'O Templo ajuda contra o Rei?', npc: ['Rezamos para os que ainda vão e vêm. O Rei não teme orações; teme gente que volta amanhã. Nosso culto é a repetição: o sol que nasce de novo todo dia.'] },
    { id: 'menino', rot: 'Soube de um menino que não levanta.', npc: ['Teo, na Casa Velha. Eu rezo, ele chora, nada muda. Ele não está doente do corpo. Se puder, vá lá, mas não cobre nada dele.'], req: (c) => c.nivel >= 14 }],
  eruvim: [
    { id: 'diario', rot: 'O que diz o Diário de Nhor?', npc: ['Cada página é um dia que ele não quis esquecer. Leio e fico com pena: o Rei é um garoto com medo de perder para o próprio irmão.', 'Se juntar páginas, o Vale começa a mudar. A névoa responde à verdade.'] },
    { id: 'afogados', rot: 'Há uma lista de mortos em Berez?', npc: ['Há. Em Berez os mortos ficam em pé na água até alguém dizer o nome. Eu tenho a lista. Estude, aprenda a pronunciar e leia para eles.'], req: (c) => c.nivel >= 5 }],
  tavi: [
    { id: 'rumor', rot: 'Alguma novidade pelo Vale?', npc: ['Marcha-Lenta ao norte faz festa todo dia. Dizem que é para esquecer a Névoa. Mais ao leste, o Moinho vende bolinhos que ninguém devia comer dois. Na Garganta, a ponte caiu e os viajantes ficaram presos.'] }],
  lucia: [
    { id: 'nevoa', rot: 'O que a guarda sabe da Névoa?', npc: ['Sabemos que ela sobe quando alguém desiste e recua quando alguém corre. Tenho uma teoria: quem a controla é alguém que precisa que todos parem. Alguém que parou há muito tempo.'] },
    { id: 'rotas', rot: 'Quais são as rotas seguras?', npc: ['A estrada do sul leva aos Andarilhos. Para o norte, Marcha-Lenta, e depois Alvorada. A leste, a Fortaleza, e a oeste o Brejo. Não saia da estrada depois do pôr do sol.'] }],
  quinzinho: [{ id: 'vender', rot: 'O que o senhor vende de diferente?', npc: ['Poções, óleos, tochas. E um conselho: ouro não compra cansaço de volta.'] }],
  alquimista: [{ id: 'elixir', rot: 'Existe um elixir contra a Inércia?', npc: ['Existe. Chama-se amanhã. Receita: durma, coma, mexa-se. Não é lucrativa, mas funciona.'] }],
  ilara: [
    { id: 'corre', rot: 'Por que você corre antes do sol?', npc: ['Porque depois dele a Inércia me alcança. Ela é lenta, mas constante. Eu preciso ser mais constante que ela.'] },
    { id: 'quem', rot: 'Quem você pensa que é?', npc: ['Não sei. Sonho com um rio, com um irmão e com um penhasco. Acordo suada e correndo, sem saber para onde. É como se eu estivesse atrasada para algo que ainda vai acontecer.'], req: (c) => c.cap >= 3 },
    { id: 'rei', rot: 'O Rei te quer, não é?', npc: ['Ele me olha como quem olha uma pintura que perdeu. Mas eu não sou o quadro de ninguém.'], req: (c) => c.cap >= 6 }],
  ordalia: [
    { id: 'cartas', rot: 'O baralho mostra o Rei?', npc: ['Sempre. Em todas as leituras há uma carta sentada. Nunca é a mesma, mas é sempre a que não se move.', 'O baralho não mostra o futuro. Mostra o que você já sabe e finge ignorar.'] },
    { id: 'andarilhos', rot: 'Os Andarilhos fogem do Rei?', npc: ['Fingimos que ele não nos vê passar. É o único jeito de continuar andando.'] }],
  gaudencio: [
    { id: 'festa', rot: 'Por que a festa nunca acaba?', npc: ['Porque quando acaba, alguém lembra do medo. Eu prefiro lembrar de dançar! Tudo vai ficar bem! Tudo vai ficar bem!', '* A voz dele falha na última palavra.'] },
    { id: 'verdade', rot: 'A Névoa não some por dançar.', tom: 'Persuasão', teste: { atr: 'CAR', dc: 13 }, ok: ['Ahn... você é teimoso. Escute: eu vejo a Névoa subir à noite, e a cada noite ela sobe um degrau. A festa é só para não contar os degraus.', 'Eu perdi o filho para ela. Não diga a ninguém.'], falha: ['Chega! Não vamos estragar o ânimo da cidade!'], ef: { lore: 'pg9' }, req: (c) => c.cap >= 4 }],
  marcovia: [
    { id: 'cura', rot: 'Seus remédios funcionam?', npc: ['Funcionam demais. As pessoas ficam sem dor, sem cansaço, e param de se mexer. Eu achei que era sucesso. Hoje desconfio que fiz um hospital de estátuas.'] }],
  hornfel: [
    { id: 'chama', rot: 'O senhor serviu à Chama Prateada?', npc: ['Servi. Perdi. Jurei não dormir até o Rei cair, e ele ainda está de pé. Meus cavaleiros ficam de pé também, sem poder deitar. É a ironia do meu juramento.'] },
    { id: 'nhor', rot: 'O que o senhor acha de Nhor?', npc: ['Eu o desprezo e o compreendo. Compreender é o pior castigo: não posso odiar com a cabeça limpa.'], req: (c) => c.cap >= 7 }],
  rictus: [
    { id: 'esposa', rot: 'Por que o senhor caça mortos?', npc: ['Minha esposa morreu e não descansou. Passei vinte anos vendendo elixires para ocultar a procura. Quando você encara a Inércia de perto, ela é só alguém que desistiu de vez.'] }],
  caliope: [
    { id: 'rapida', rot: 'Você é mesmo tão rápida?', npc: ['Mais do que ele pensa. A Inércia me persegue há dois anos e ainda não encostou. Treino de manhã, treino à noite. Se ela me pegar, vou estar suando.'] }],
  vovo: [{ id: 'bolinho', rot: 'Seus bolinhos são seguros?', npc: ['Um é uma delícia. Dois... dois já é outro assunto. Eu avisei! Não vou dizer a você o que acontece com quem come três.'] }],
  estalajadeira: [{ id: 'hora', rot: 'Que horas são aqui?', npc: ['Sempre tarde. A Estalagem Meia-Noite parou o relógio há muito. Eu prefiro assim: quem chega tarde sempre tem desculpa, e eu sempre tenho um quarto.'] }],
  padre: [{ id: 'descanso', rot: 'O descanso é sagrado, não é?', npc: ['É. O excesso dele também é sagrado, se você não pensar muito. Eu penso muito, e por isso tenho insônia.'] }],
  brindival: [{ id: 'vinho', rot: 'O vinho é bom mesmo?', npc: ['O melhor do Vale! E o pior também, porque ninguém para. Brinde! Mas só se for água.'] }],
  barqueiro: [{ id: 'agua', rot: 'Por que a água sobe?', npc: ['Sobe quando alguém desiste. Hoje está pela cintura. Eu só levo gente de um lado a outro; não tenho culpa.'] }],
  druida: [{ id: 'mundo', rot: 'O que a Ordem do Círculo Cinzento quer?', npc: ['O mundo cresce demais. Nós ensinamos a pedra a não crescer. Se você me mostrar que crescer é bom, deixo você ver o círculo.'] }],
  mordomo: [{ id: 'rei', rot: 'Quando posso ver o Rei?', npc: ['O Rei não recebe. O Rei aguarda. É uma diferença sutil. Ele já sabe que você veio. Prefere que você chegue por conta própria.'] }],
  guarda: [{ id: 'passar', rot: 'Posso passar?', npc: ['Passe devagar. Por favor. Aqui ninguém corre. Quem corre, o Rei nota.'] }],
  sentinela: [{ id: 'pedra', rot: 'O que você guarda?', npc: ['Tempo. O Rei o coleciona e eu o vigio. Você se move demais. Isso me inquieta.'] }],
  menino: [{ id: 'oi', rot: 'Oi, Teo.', npc: ['...oi.', '(Teo olha o teto. Parece esperar por alguém que o faça levantar.)'] }],
};
// Onde cada missão acontece no Vale (chaves de LUG em mundo.js): o mapa, o diário e os pins usam isto
export const QLUG = { p1: ['vila'], p2: ['vila'], p3: ['vila', 'alvorada'], p4: ['andarilhos'], p5: ['andarilhos'], p6: ['alvorada'], p7: ['vila'], p8: ['andarilhos'], p9: ['cidadela'], p10: ['cidadela'],
  s1: ['moinho'], s2: ['fortaleza'], s3: ['alvorada'], s4: ['garganta'], s5: ['vinhedo'], s6: ['brejo'], s7: ['vila'], s8: ['ambar'], s9: ['marcha'], s10: ['colina'], s11: ['vila'], s12: ['vila'] };
