// Campanha "A Longa Noite da Inércia" — níveis 1 a 20.
// Cada capítulo libera ao atingir o nível correspondente (XP vem da vida real); a masmorra do capítulo
// é o desafio do jogo. As decisões mexem em Moral da Vila, Maré da Inércia, ouro, itens e marcadores.

export const ATOS = [
  { n: 1, nome: 'Ato I — Brasas', niveis: '1–4', titulo: 'Portador da Brasa' },
  { n: 2, nome: 'Ato II — A Estrada de Ferro', niveis: '5–8', titulo: 'Caminhante de Ferro' },
  { n: 3, nome: 'Ato III — As Terras Mortas', niveis: '9–12', titulo: 'Quebrador de Correntes' },
  { n: 4, nome: 'Ato IV — O Abismo Cinzento', niveis: '13–16', titulo: 'Senhor da Brasa' },
  { n: 5, nome: 'Ato V — O Trono Imóvel', niveis: '17–20', titulo: 'Flagelo da Inércia' },
];

export const PROLOGO = [
  'Há muito tempo, a Forja Primeva acendeu o primeiro fogo do mundo — e quem se movia ao redor dele nunca envelhecia por dentro.',
  'Então veio Nhor-Kaal, o Rei da Inércia. Onde ele passa, as pessoas sentam e não se levantam mais. Os dias se repetem. As forjas esfriam.',
  'Em Forjaluz, a última brasa da Forja Primeva resiste, fraca. Ela só queima quando alguém se esforça de verdade. Esse alguém é você.',
  'Cada série levantada, cada minuto de corrida, cada hora de estudo e cada refeição bem medida alimenta a Brasa. O que você faz lá fora é a magia daqui.',
];

// linhas podem ser string ou { se: 'flag', t: 'texto' } (aparece só se o marcador existir)
export const CAPITULOS = [
  {
    n: 1, ato: 1, titulo: 'A Brasa que Resta', local: 'Porão da Forja', tema: 'porao', andares: 2, pool: ['rato', 'kobold', 'esqueleto'],
    boss: { base: 'rato', nome: 'Dente-de-Ferro, o Rato Alfa', ov: { hp: 30, ca: 13, atq: [{ n: 'Mordida', b: 4, d: '1d6+2', t: 'fis' }] }, esc: 1, dm: 1.1 },
    intro: ['Você chega a Forjaluz com a poeira da estrada e um fio de esperança. A grande forja da vila está apagada, e Mestra Brasa, a anã ferreira, mal levanta os olhos.',
      '— Os foles estão lá embaixo, no porão — diz ela. — Mas algo começou a roer tudo. Se eu descer, não volto. Se você descer, talvez a vila ainda tenha um amanhã.'],
    vitoria: ['Dente-de-Ferro cai com um guincho. Entre ossos e ferrugem, um fole antigo ainda brilha, morno como um coração.'],
    decisao: {
      txt: 'O fole antigo é raro. Mestra Brasa pode usá-lo para reacender a forja da vila, ou você pode vender o fole a um colecionador por um bom preço.',
      opcoes: [
        { t: 'Entregar à Mestra Brasa', r: 'A forja ruge de novo. Vizinhos saem de casa para ver as faíscas. Mestra Brasa guarda um martelo para você.', ef: { moral: 10, inercia: -1, flag: 'forja_acesa' } },
        { t: 'Vender o fole (+60 ouro)', r: 'O ouro tilinta, mas a forja continua fria. Quem passa na rua não olha nos seus olhos.', ef: { ouro: 60, moral: -6, inercia: 1, flag: 'fole_vendido' } },
      ],
    },
    recompensa: { ouro: 40, item: 'pocao1' },
  },
  {
    n: 2, ato: 1, titulo: 'Rastros na Neblina', local: 'Cavernas dos Goblins', tema: 'caverna', andares: 2, pool: ['goblin', 'kobold', 'morcego', 'lobo'],
    boss: { base: 'bugurso', nome: 'Gruk, Capitão Goblin', ov: { hp: 42 }, esc: 1, dm: 0.63 },
    intro: [{ se: 'forja_acesa', t: 'Com a forja acesa, a vila voltou a produzir. É por isso que os goblins vieram.' },
      'Carroças de suprimentos somem na neblina da manhã. Capitã Lúcia, da guarda, aponta pegadas pequenas que levam a uma caverna escura.',
      '— Eles têm um capitão novo. Gruk. Ele fala com a Inércia, e a Inércia responde.'],
    vitoria: ['Gruk tomba em meio às caixas roubadas. Um jovem goblin escoteiro, mãos amarradas, olha para você sem fugir.'],
    decisao: {
      txt: 'O goblin escoteiro oferece um mapa dos túneis em troca da vida. Capitã Lúcia diria que goblins não merecem confiança.',
      opcoes: [
        { t: 'Poupar e aceitar o mapa', r: 'O escoteiro desaparece na neblina. Mais tarde, você encontra marcas de giz mostrando onde há tesouros.', ef: { moral: 4, flag: 'goblin_aliado', ouro: 20 } },
        { t: 'Entregar à guarda', r: 'A guarda prende o escoteiro. A vila se sente mais segura, mas ninguém mais confia em acordos com goblins.', ef: { moral: 8, flag: 'goblin_preso' } },
      ],
    },
    recompensa: { ouro: 60, item: 'pocao1' },
  },
  {
    n: 3, ato: 1, titulo: 'A Biblioteca Esquecida', local: 'Cripta da Biblioteca', tema: 'cripta', andares: 2, pool: ['esqueleto', 'zumbi', 'rato', 'cultista'],
    boss: { base: 'carnical', nome: 'O Bibliotecário Faminto', ov: { hp: 62, ca: 13 }, esc: 1, dm: 1.19 },
    intro: ['Eruvim, o sábio de barba branca, perdeu o acesso ao subsolo da biblioteca. Algo lá embaixo ainda folheia os livros à noite.',
      '— Cada hora de estudo sua alimenta uma vela da biblioteca — explica ele. — Quem estuda mantém a Inércia longe do conhecimento. Quem esquece, vira parte das estantes.'],
    vitoria: ['O Bibliotecário se desfaz em poeira de pergaminho. Sobre a mesa, um tomo de capa negra sussurra seu nome.'],
    decisao: {
      txt: 'O tomo negro promete sabedoria proibida, mas respira devagar, como se estivesse vivo.',
      opcoes: [
        { t: 'Queimar o tomo', r: 'As chamas gritam. Eruvim agradece em silêncio; a biblioteca respira aliviada.', ef: { moral: 6, inercia: -1, flag: 'tomo_queimado' } },
        { t: 'Ler o tomo', r: 'As páginas ensinam o Sono e algo mais. Você sai com uma sensação fria no peito.', ef: { inercia: 1, item: 'pergCura', flag: 'tomo_lido', ouro: 30 } },
      ],
    },
    recompensa: { ouro: 70, item: 'restaura' },
  },
  {
    n: 4, ato: 1, titulo: 'O Lobo da Estrada', local: 'Bosque das Presas', tema: 'floresta', andares: 3, pool: ['lobo', 'aranhaLobo', 'goblin', 'loboAtroz'],
    boss: { base: 'loboAtroz', nome: 'Presa-Cinza, o Alfa', ov: { hp: 68 }, esc: 1, dm: 1.25 },
    intro: ['Viajantes foram devorados no bosque. Os rastros se repetem, como se um mesmo lobo corresse em círculos. Capitã Lúcia murmura:',
      '— Ele não caça por fome. Algo apagou a vontade dele de parar.', 'Esta é a última prova antes de a vila lhe entregar a primeira Brasa.'],
    vitoria: ['Presa-Cinza arqueja, vencido. Nos olhos dele, uma centelha de lucidez. Ele não ataca mais.'],
    decisao: {
      txt: 'O alfa está ferido e confuso. A vila quer o couro dele; Mestra Brasa disse que o couro faria uma armadura fina.',
      opcoes: [
        { t: 'Domar o lobo', r: 'Presa-Cinza lambe sua mão e some na mata. Algumas noites depois, você o ouve uivar guardando a estrada.', ef: { moral: 8, inercia: -1, flag: 'lobo_aliado' } },
        { t: 'Abater e levar o couro', r: 'Mestra Brasa trabalha o couro numa armadura leve e elegante. A mata fica em silêncio demais.', ef: { item: 'couro_lobo', moral: -3, flag: 'lobo_abatido' } },
      ],
    },
    recompensa: { ouro: 100, item: 'pocao2' }, brasa: 'Brasa da Constância',
  },
  {
    n: 5, ato: 2, titulo: 'O Pedágio dos Corvos', local: 'Torre do Pedágio', tema: 'torre', andares: 3, pool: ['bandido', 'goblin', 'orc', 'hobgoblin', 'cultista'],
    boss: { base: 'capitaoBandido', nome: 'Capitão Corvo', ov: { hp: 90 }, esc: 1, dm: 1.35 },
    intro: [{ se: 'lobo_aliado', t: 'Ao longe, o uivo de Presa-Cinza acompanha seus passos.' }, 'A Estrada de Ferro liga Forjaluz ao resto do mundo, mas os Corvos tomaram a torre do pedágio e cobram em sangue e ouro.',
      'Você sente o novo poder do Ataque Extra no corpo: dois golpes onde antes só cabia um.'],
    vitoria: ['O Capitão Corvo larga a espada. Atrás dele, uma cela com viajantes cansados e um baú pesado de ouro.'],
    decisao: {
      txt: 'Os prisioneiros imploram por liberdade. O baú pesa e promete um mês inteiro de descanso sem treinar.',
      opcoes: [
        { t: 'Libertar os prisioneiros', r: 'A estrada se enche de agradecimentos. Mercadores prometem preços melhores em Forjaluz.', ef: { moral: 12, inercia: -1, flag: 'estrada_livre' } },
        { t: 'Ficar com o ouro (+150)', r: 'O baú é seu. Ao sair, você sente que a Inércia anda um pouco mais perto.', ef: { ouro: 150, moral: -8, inercia: 2, flag: 'saque_corvo' } },
      ],
    },
    recompensa: { ouro: 120, item: 'anelProt' },
  },
  {
    n: 6, ato: 2, titulo: 'Pântano Silente', local: 'Pântano Silente', tema: 'pantano', andares: 3, pool: ['aranha', 'zumbi', 'limoCinza', 'harpia', 'geleiaOcre'],
    boss: { base: 'basilisco', nome: 'Olhos-de-Pedra', ov: { hp: 95 }, esc: 1, dm: 1.42 },
    intro: ['O pântano está silencioso demais: nem sapos, nem insetos. Estátuas de viajantes dão as boas-vindas, bocas abertas em gritos que nunca saíram.',
      'Um velho do Povo-Lagarto pede ajuda: algo de olhar petrificante contaminou a água sagrada deles.'],
    vitoria: ['O basilisco se desfaz em lodo. A água começa a clarear, devagar.'],
    decisao: {
      txt: 'Purificar a água do Povo-Lagarto custa 80 de ouro em ervas raras. Ou você segue viagem — a missão está cumprida.',
      opcoes: [
        { t: 'Pagar 80 ouro e purificar', r: 'O Povo-Lagarto canta. Em troca, deixam antitoxinas e uma promessa de proteger a estrada.', ef: { ouro: -80, moral: 10, inercia: -1, flag: 'lagartos_aliados', item: 'pocao2' } },
        { t: 'Seguir viagem', r: 'O velho acena com tristeza. A água ainda leva dias para ficar limpa.', ef: { moral: -2 } },
      ],
    },
    recompensa: { ouro: 140, item: 'pergCura' },
  },
  {
    n: 7, ato: 2, titulo: 'Minas de Ferrugem', local: 'Minas de Ferrugem', tema: 'mina', andares: 3, pool: ['ogro', 'cuboGel', 'geleiaOcre', 'aranha', 'gigColina'],
    boss: { base: 'ettin', nome: 'Bram, o Ettin Duplo', ov: { hp: 130 }, esc: 1, dm: 0.81 },
    intro: ['As minas anãs estão cobertas de ferrugem viva. O ferro apodrece sozinho, como se o próprio tempo desistisse dele.',
      '— Bram tem duas cabeças e nenhuma delas sabe contar — brinca Mestra Brasa. — Mas ele guarda o minério que preciso para a forja.'],
    vitoria: ['As duas cabeças de Bram discutem até o fim. O minério brilha sob a poeira.'],
    decisao: {
      txt: 'Reabrir as minas dá trabalho a vários aldeões, mas atrai a atenção da Inércia. Selá-las é seguro, porém mantém o minério preso.',
      opcoes: [
        { t: 'Reabrir as minas', r: 'Picaretas voltam a soar. Forjaluz respira trabalho e esperança.', ef: { moral: 12, inercia: 1, flag: 'minas_abertas', ouro: 80 } },
        { t: 'Selar as minas', r: 'A entrada é lacrada com pedra benta. O vale fica mais seguro, e mais pobre.', ef: { moral: -2, inercia: -2, flag: 'minas_seladas' } },
      ],
    },
    recompensa: { ouro: 160, item: 'manoplas' },
  },
  {
    n: 8, ato: 2, titulo: 'A Estalagem do Meio da Noite', local: 'Estalagem Meia-Noite', tema: 'cripta', andares: 3, pool: ['esqueleto', 'carnical', 'cultista', 'morcego', 'inumano'],
    boss: { base: 'criaVamp', nome: 'Lady Noctis, Cria da Noite', ov: { hp: 118 }, esc: 1.55, dm: 1.6 },
    intro: ['Ninguém que dorme na Estalagem Meia-Noite acorda de manhã. Dona Tavi diz que ouviu a história de um viajante que fugiu gritando "ela só me deixou sentar".',
      'Você entra com a alma firme. Quem se mexe resiste. Quem para, fica.'],
    vitoria: ['Lady Noctis se desfaz em névoa. A estalagem, vazia, estala como se respirasse aliviada.'],
    decisao: {
      txt: 'O dono da estalagem estava enfeitiçado e implora para que você queime tudo. Os quartos, porém, ainda rendem ouro.',
      opcoes: [
        { t: 'Queimar a estalagem', r: 'As chamas se erguem, limpas. O dono chora e, depois, ri. Está livre.', ef: { moral: 8, inercia: -2, flag: 'estalagem_queimada' } },
        { t: 'Reabrir como hospedaria (+120)', r: 'O ouro entra rápido. Mas as paredes parecem sussurrar à noite.', ef: { ouro: 120, inercia: 1, moral: -3, flag: 'estalagem_aberta' } },
      ],
    },
    recompensa: { ouro: 180, item: 'mantoProt' }, brasa: 'Brasa da Perseverança',
  },
  {
    n: 9, ato: 3, titulo: 'O Mercado dos Vazios', local: 'Mercado dos Vazios', tema: 'abismo', andares: 3, pool: ['gargula', 'fantasma', 'aparicao', 'cultista', 'caoInfernal'],
    boss: { base: 'aparicao', nome: 'A Vendedora Sem Rosto', ov: { hp: 150 }, esc: 1, dm: 1.57 },
    intro: ['Nas Terras Mortas existe um mercado onde tudo pode ser comprado, menos tempo. Os vendedores não têm rosto e aceitam como pagamento "um pouco do seu amanhã".',
      'O Mercado dos Vazios apareceu perto de Forjaluz. Capitã Lúcia sabe que isso é um mau sinal.'],
    vitoria: ['A Vendedora se dissolve em fumaça fria, deixando uma bolsa de moedas sem brilho.'],
    decisao: {
      txt: 'Uma relíquia amaldiçoada, um amuleto frio, repousa na banca da Vendedora. Ela promete força, mas cobra em "amanhãs".',
      opcoes: [
        { t: 'Recusar a relíquia', r: 'Você deixa o amuleto no chão e sente o peso sair de seus ombros.', ef: { moral: 6, inercia: -1, flag: 'recusou_amuleto' } },
        { t: 'Levar a relíquia (+Braceletes)', r: 'O amuleto se aquece ao toque. É poderoso e é familiar demais.', ef: { item: 'braceletes', inercia: 2, flag: 'amuleto_frio' } },
      ],
    },
    recompensa: { ouro: 220, item: 'pocao3' },
  },
  {
    n: 10, ato: 3, titulo: 'A Torre do Mago Cinzento', local: 'Torre do Mago Cinzento', tema: 'torre', andares: 4, pool: ['gargula', 'cultista', 'manticora', 'mago', 'morcego'],
    boss: { base: 'mago', nome: 'Orvald, o Mago Cinzento', ov: { hp: 175, ca: 16 }, esc: 1, dm: 1.49 },
    intro: ['Orvald foi mestre da biblioteca antes de Eruvim. Estudou tanto que esqueceu de viver, e a Inércia o encontrou sentado, ainda lendo.',
      { se: 'tomo_lido', t: 'O tomo negro, na sua mochila, vibra. Ele reconhece este lugar.' }],
    vitoria: ['Orvald sorri, finalmente em paz. Seu cajado cai e rola até seus pés.'],
    decisao: {
      txt: 'O cajado do mago guarda poder de sobra, mas foi forjado com a vontade dele. Destruí-lo liberta o que restou de Orvald.',
      opcoes: [
        { t: 'Destruir o cajado', r: 'Uma luz clara sobe da torre. Orvald agradece e some.', ef: { moral: 10, inercia: -2, flag: 'orvald_livre' } },
        { t: 'Levar o cajado', r: 'O cajado vibra de contentamento. Há algo ansioso nele, como fome.', ef: { item: 'cajado_poder', inercia: 2, flag: 'cajado_orvald' } },
      ],
    },
    recompensa: { ouro: 260, item: 'tiara' },
  },
  {
    n: 11, ato: 3, titulo: 'Cemitério dos Gigantes', local: 'Cemitério dos Gigantes', tema: 'cemiterio', andares: 4, pool: ['zumbi', 'inumano', 'ogro', 'gigColina', 'fantasma', 'mumia'],
    boss: { base: 'gigPedra', nome: 'Gorm, Gigante dos Túmulos', ov: { hp: 200 }, esc: 1, dm: 1.02 },
    intro: ['Antigas guerras deixaram gigantes enterrados em montes do tamanho de colinas. Alguns se levantaram, mas nenhum parece vivo.',
      '— Gorm não está morto, está parado — diz Irmã Aurora, do templo. — E parado é pior.'],
    vitoria: ['O corpo de Gorm se desfaz em seixos. Entre eles, um cálice dourado ainda cheio de uma água estranhamente viva.'],
    decisao: {
      txt: 'A água do cálice cura qualquer mal, mas pertence ao templo. Irmã Aurora pede que você a devolva.',
      opcoes: [
        { t: 'Devolver ao templo', r: 'Irmã Aurora derrama a água sobre os doentes de Forjaluz. Muitos se levantam pela primeira vez em meses.', ef: { moral: 14, inercia: -2, flag: 'calice_templo' } },
        { t: 'Guardar a água', r: 'Você bebe um gole. Sente-se invencível. Por um instante, você esquece de agradecer.', ef: { item: 'pocao4', moral: -6, inercia: 1, flag: 'calice_guardado' } },
      ],
    },
    recompensa: { ouro: 300, item: 'botasVel' },
  },
  {
    n: 12, ato: 3, titulo: 'A Dama de Pedra', local: 'Charco da Dama', tema: 'pantano', andares: 4, pool: ['harpia', 'basilisco', 'aranha', 'troll', 'zumbi'],
    boss: { base: 'medusa', nome: 'A Dama de Pedra', ov: { hp: 220 }, esc: 0.62, dm: 0.45 },
    intro: ['No coração do pântano de cinzas vive uma dama que, dizem, foi uma poeta. Agora cada verso que lê vira estátua.',
      'Mestra Brasa lhe entrega um espelho polido: — Um escudo que reflete. Use antes de olhar.'],
    vitoria: ['A Dama de Pedra vê o próprio reflexo e lembra de quem foi. Ela sorri uma última vez.'],
    decisao: {
      txt: 'Entre as estátuas, você reconhece rostos de viajantes. Devolver a cor a todos custa 200 de ouro em remédios do templo.',
      opcoes: [
        { t: 'Restaurar as estátuas (200 ouro)', r: 'Um a um, os viajantes voltam à vida, confusos e agradecidos. Forjaluz ganha novos moradores.', ef: { ouro: -200, moral: 18, inercia: -2, flag: 'estatuas_restauradas' } },
        { t: 'Deixá-las em paz', r: 'Você deixa flores e segue. Algumas coisas, você pensa, são maiores que uma única jornada.', ef: { moral: 2 } },
      ],
    },
    recompensa: { ouro: 340, item: 'pocao3' }, brasa: 'Brasa da Vontade',
  },
  {
    n: 13, ato: 4, titulo: 'A Descida', local: 'A Descida', tema: 'abismo', andares: 4, pool: ['troll', 'minotauro', 'caoInfernal', 'gargula', 'manticora'],
    boss: { base: 'quimera', nome: 'A Quimera do Abismo', ov: { hp: 250 }, esc: 1, dm: 1.35 },
    intro: ['O Abismo Cinzento é uma ferida no mundo, onde a luz diminui a cada passo. Aqui embaixo, a Inércia tem cheiro: poeira, tédio e velas apagadas.',
      'Cada tocha que você carrega é um ato de rebeldia.'],
    vitoria: ['A Quimera rosna em três vozes e se cala. Das paredes escorre uma água escura que não reflete nada.'],
    decisao: {
      txt: 'Uma voz fraca chama do fundo: um aprendiz perdido. Ajudá-lo vai custar tempo e luz.',
      opcoes: [
        { t: 'Resgatar o aprendiz', r: 'O aprendiz, chorando, entrega um mapa para os níveis profundos.', ef: { moral: 8, inercia: -1, flag: 'aprendiz_salvo', ouro: 40 } },
        { t: 'Seguir adiante', r: 'A voz se cala atrás de você. Você tenta não pensar nisso.', ef: { inercia: 1, moral: -4 } },
      ],
    },
    recompensa: { ouro: 400, item: 'pocao3' },
  },
  {
    n: 14, ato: 4, titulo: 'A Cidade Afundada', local: 'Cidade Afundada', tema: 'afundada', andares: 4, pool: ['elemAgua', 'cuboGel', 'harpia', 'medusa', 'serpe'],
    boss: { base: 'elemAgua', nome: 'A Maré Cinzenta', ov: { hp: 280 }, esc: 1.64, dm: 1.6 },
    intro: ['Há mil anos, uma cidade inteira ficou parada por um instante e a água a engoliu. Ainda há luzes lá embaixo, como lembranças.',
      'A Maré Cinzenta não ataca: ela acaricia, adormece, afoga.'],
    vitoria: ['A Maré recua. Torres emergem, cobertas de algas, silenciosas como catedrais.'],
    decisao: {
      txt: 'No salão central, um trono de coral guarda um tesouro. Quem se senta no trono ouve a voz do mar e esquece o relógio.',
      opcoes: [
        { t: 'Recusar o trono', r: 'Você pega apenas o que cabe na mochila e segue de pé. O mar respeita sua decisão.', ef: { moral: 6, inercia: -1, ouro: 150 } },
        { t: 'Sentar por um instante', r: 'O instante dura uma hora. Você sai com mais ouro e menos vontade.', ef: { ouro: 400, inercia: 3, moral: -4 } },
      ],
    },
    recompensa: { ouro: 440, item: 'amuletoSaude' },
  },
  {
    n: 15, ato: 4, titulo: 'A Forja Roubada', local: 'Forja Roubada', tema: 'forja', andares: 4, pool: ['gigFogo', 'caoInfernal', 'golemArgila', 'troll', 'dragaoJovem'],
    boss: { base: 'gigFogo', nome: 'Valdrak, o Gigante Ladrão', ov: { hp: 300 }, esc: 1, dm: 0.88 },
    intro: ['Alguém roubou a bigorna da Forja Primeva. As faíscas, que antes alimentavam o vale, agora aquecem apenas as botas do ladrão: Valdrak, gigante do fogo.',
      { se: 'forja_acesa', t: 'A forja da vila, que você acendeu no começo, tremula de preocupação.' }],
    vitoria: ['Valdrak tomba. A bigorna, intacta, soa como um sino ao ser tocada. Uma única nota que atravessa o vale.'],
    decisao: {
      txt: 'A bigorna pode retornar à vila ou ser forjada em uma arma pessoal sua, porém o vale ficará sem fogo de reserva.',
      opcoes: [
        { t: 'Devolver à Forja Primeva', r: 'A bigorna acende o vale. Forjaluz vira o lugar mais quente do mundo.', ef: { moral: 16, inercia: -3, flag: 'bigorna_devolvida' } },
        { t: 'Forjar sua arma pessoal', r: 'Mestra Brasa trabalha por três dias e três noites. A lâmina que nasce canta baixinho.', ef: { item: 'lamina_brasa', moral: -4, inercia: 1, flag: 'lamina_brasa' } },
      ],
    },
    recompensa: { ouro: 500, item: 'anelRegen' },
  },
  {
    n: 16, ato: 4, titulo: 'A Corte dos Sussurros', local: 'Corte dos Sussurros', tema: 'trono', andares: 5, pool: ['gargula', 'vampiro', 'dragaoJovem', 'gigGelo', 'aparicao', 'fantasma'],
    boss: { base: 'dragaoJovem', nome: 'Cinzarrubra, o Dragão Jovem', ov: { hp: 330 }, esc: 1, dm: 0.83 },
    intro: ['Antes do trono, existe a corte: mil cortesãos de pedra sussurrando elogios ao Rei, rindo baixinho, convidando você a se sentar.',
      'Cinzarrubra, dragão jovem, é o guardião da corte. Ele não quer a morte de ninguém, só que ninguém se levante.'],
    vitoria: ['O dragão cai com um suspiro de brasa e fumaça. Os cortesãos de pedra se calam, um a um.'],
    decisao: {
      txt: 'Uma fenda no chão leva a um atalho até o trono. Mas atravessá-la custa um pedaço da sua Brasa: as próximas batalhas serão mais duras.',
      opcoes: [
        { t: 'Pegar o caminho longo', r: 'Você escolhe a escadaria infinita. Cada degrau é uma série; cada pausa, uma respiração.', ef: { moral: 6, inercia: -1, flag: 'caminho_longo' } },
        { t: 'Atravessar a fenda', r: 'Você chega mais rápido, mas a fenda sussurra nomes. O seu está entre eles.', ef: { inercia: 2, ouro: 200, flag: 'fenda' } },
      ],
    },
    recompensa: { ouro: 600, item: 'escama_dragao' }, brasa: 'Brasa da Alma',
  },
  {
    n: 17, ato: 5, titulo: 'Os Portões do Trono', local: 'Portões do Trono', tema: 'trono', andares: 5, pool: ['gigNuvens', 'golemPedra', 'gargula', 'gigFogo', 'vampiro'],
    boss: { base: 'golemPedra', nome: 'A Sentinela Imóvel', ov: { hp: 340 }, esc: 1.27, dm: 1.6 },
    intro: ['Os portões do Trono Imóvel são feitos de uma pedra tão antiga que parece lembrar a primeira pessoa que se sentou por cansaço.',
      'Todos os aliados que você fez ao longo da jornada se reúnem por um instante em sua memória, e depois sobem a escadaria.'],
    vitoria: ['A Sentinela se parte ao meio. O portão se abre com um som que o vale inteiro ouve.'],
    decisao: {
      txt: 'Antes de entrar, você pode descansar por uma noite junto aos aliados, ou seguir direto, em sua melhor forma.',
      opcoes: [
        { t: 'Descansar com os aliados', r: 'Mestra Brasa canta. Eruvim conta histórias. Você dorme profundamente.', ef: { moral: 10, inercia: -2, flag: 'ceia_aliados' } },
        { t: 'Entrar imediatamente', r: 'A pressa tem seu preço: o vento frio atinge seus ossos.', ef: { inercia: 1, ouro: 100 } },
      ],
    },
    recompensa: { ouro: 700, item: 'pocao4' },
  },
  {
    n: 18, ato: 5, titulo: 'O Conde Vazio', local: 'Salão do Conde Vazio', tema: 'trono', andares: 5, pool: ['vampiro', 'fantasma', 'aparicao', 'gargula', 'gigGelo'],
    boss: { base: 'vampiro', nome: 'O Conde Vazio', ov: { hp: 330 }, esc: 1.45, dm: 1.6 },
    intro: ['O Conde Vazio foi um herói do passado, que parou por um instante de descanso e nunca mais se levantou. Agora oferece o mesmo a todos.',
      '— Sente-se — ele diz, com voz de seda. — Você trabalhou tanto. Quem poderia culpá-lo?'],
    vitoria: ['O Conde se desfaz em cinzas quentes. Ele sorri com os olhos, finalmente em pé.'],
    decisao: {
      txt: 'Entre as cinzas, o anel que prendia o Conde ao Rei. Você pode quebrá-lo ou carregá-lo como lembrete.',
      opcoes: [
        { t: 'Quebrar o anel', r: 'O anel racha. A corrente que prendia os mortos da corte se parte também.', ef: { moral: 12, inercia: -3, flag: 'anel_quebrado' } },
        { t: 'Guardar como lembrete', r: 'O anel é frio. Você nunca o usa, mas o carrega.', ef: { moral: 2, ouro: 150, flag: 'anel_guardado' } },
      ],
    },
    recompensa: { ouro: 800, item: 'mantoElfico' },
  },
  {
    n: 19, ato: 5, titulo: 'Ignivarra, o Último Dragão', local: 'Câmara dos Dragões Mortos', tema: 'trono', andares: 5, pool: ['dragaoJovem', 'gigFogo', 'golemPedra', 'vampiro', 'gigNuvens'],
    boss: { base: 'dragaoAdulto', nome: 'Ignivarra, o Último Dragão', ov: { hp: 420 }, esc: 1, dm: 0.67 },
    intro: ['Entre ossos de dragões mortos, uma única criatura ainda respira. Ignivarra viu a Inércia chegar e decidiu resistir sozinha, por séculos.',
      '— Sua brasa é fraca — ruge ela. — Mas nunca vi uma tão teimosa. Mostre-me que não é só barulho.'],
    vitoria: ['Ignivarra pousa, exausta e orgulhosa. Dos olhos dela sai uma lágrima de fogo.'],
    decisao: {
      txt: 'Ignivarra oferece sua última centelha: com ela, sua Brasa arde por muito tempo. Mas ela se apagará.',
      opcoes: [
        { t: 'Aceitar a centelha', r: 'Seu corpo vibra. A centelha de Ignivarra se junta à Brasa. A dragoa dorme com um sorriso.', ef: { moral: 8, inercia: -3, flag: 'centelha_dragao' } },
        { t: 'Recusar e honrar', r: 'Você deita a mão na testa dela. — Descanse. Eu termino isto. — Ela fecha os olhos, em paz.', ef: { moral: 14, inercia: -1, flag: 'dragao_honrada', item: 'lamina_solar' } },
      ],
    },
    recompensa: { ouro: 1000, item: 'pocao4' },
  },
  {
    n: 20, ato: 5, titulo: 'O Trono Imóvel', local: 'Trono Imóvel', tema: 'trono', andares: 5, pool: ['vampiro', 'gigNuvens', 'golemPedra', 'dragaoJovem', 'aparicao'],
    boss: { base: 'reiInercia', nome: 'Nhor-Kaal, Rei da Inércia', ov: {}, esc: 1, dm: 0.49 },
    intro: ['Você sobe os degraus. Cada passo é uma série, cada respiração, uma corrida, cada pensamento, um capítulo estudado. O Trono Imóvel espera.',
      '— Sente-se — diz Nhor-Kaal, e a palavra pesa como mil cobertores. — O mundo já é cansativo demais. Pare. Descanse. Fique.',
      { se: 'ceia_aliados', t: 'Em sua mente, as vozes dos aliados cantam: Mestra Brasa, Eruvim, Irmã Aurora, Dona Tavi, Capitã Lúcia.' },
      'Você respira fundo. Segura a espada. E se levanta ainda mais.'],
    vitoria: ['Nhor-Kaal cai do trono. A coroa de gelo rola e se parte. Pela primeira vez em mil anos, o vento se move.'],
    decisao: {
      txt: 'O trono vazio ainda existe. Você pode destruí-lo ou deixá-lo como lembrança.',
      opcoes: [
        { t: 'Destruir o Trono Imóvel', r: 'O trono se parte. A poeira vira faíscas que sobem pelo vale.', ef: { moral: 20, inercia: -10, flag: 'trono_destruido' } },
        { t: 'Deixar de pé, vazio', r: 'Um trono vazio é um aviso. Você o deixa para quem vier depois.', ef: { moral: 10, inercia: -6, flag: 'trono_vazio' } },
      ],
    },
    recompensa: { ouro: 2000, item: 'maca_disrupcao' }, brasa: 'Brasa Eterna',
  },
];

export const FINAIS = {
  otimo: { nome: 'Final: A Brasa Eterna', txt: ['Forjaluz está viva. Crianças correm pelo vale. A forja ruge dia e noite, e ninguém mais senta por medo.',
    'Você não é lembrado como o herói que venceu o Rei — é lembrado como alguém que se levantou todos os dias. É o maior feito.', 'Fim da Longa Noite. Início do Ciclo Seguinte.'] },
  bom: { nome: 'Final: A Brasa Solitária', txt: ['O Rei caiu, e o vale respira. Mas a vila lembra das escolhas difíceis que você fez pelo caminho.',
    'A Brasa vive. Você sabe que ela depende de você, todo dia, para continuar acesa.', 'Fim da Longa Noite. Início do Ciclo Seguinte.'] },
  cinza: { nome: 'Final: Cinzas Quentes', txt: ['O Rei foi derrotado, mas muitos pagaram o preço. A vila é pequena, silenciosa e cautelosa.',
    'Ainda há tempo de reacender cada fogueira. Um dia de cada vez.', 'Fim da Longa Noite. Início do Ciclo Seguinte.'] },
};

export function finalPorMoral(moral, inercia) {
  if (moral >= 60 && inercia <= 4) return 'otimo';
  if (moral >= 30) return 'bom';
  return 'cinza';
}

export const NPCS = {
  brasa: { nome: 'Mestra Brasa', papel: 'Ferreira', falas: ['A brasa só queima se você a alimentar. Volte amanhã, e no outro dia também.', 'Armas boas não fazem herói. Hábitos fazem.', 'Vá treinar. O aço precisa de mãos que suem.'] },
  ferrao: { nome: 'Mestre Ferrão', papel: 'Arena de Ferro', falas: ['Aqui só contam séries de verdade: supino, terra, agachamento, barra, remada e ombros.', 'O PR de hoje é o aquecimento de amanhã.', 'Não conte quilos. Conte semanas.'] },
  aurora: { nome: 'Irmã Aurora', papel: 'Templo', falas: ['Descanso é parte da jornada. Dormir bem também é um ato de coragem.', 'A Inércia odeia quem volta, mesmo cansado.', 'Cuide do corpo, ele é a casa da Brasa.'] },
  eruvim: { nome: 'Eruvim', papel: 'Biblioteca', falas: ['Um minuto de estudo, hoje, vale uma hora de pânico, amanhã.', 'Resolva questões. Leia depois. Repita no outro dia.', 'A prova é o dragão. A rotina é a espada.'] },
  tavi: { nome: 'Dona Tavi', papel: 'Taverna', falas: ['Comer de menos é tão perigoso quanto comer demais. Equilíbrio é bom na panela e na vida.', 'O herói que come bem rende o dia inteiro.', 'Quer um caldo? Anote antes no livro.'] },
  lucia: { nome: 'Capitã Lúcia', papel: 'Guarda', falas: ['A Inércia sobe devagar. Quem falta um dia, sente. Quem falta três, perde o chão.', 'Faça a missão do dia. Pequena que seja.', 'Vi lobos que não corriam. Vi homens que também não. Prefiro os lobos.'] },
  quinzinho: { nome: 'Quinzinho', papel: 'Mercador', falas: ['Hoje o preço está bom. Amanhã não prometo!', 'Item caro não vale nada se você não treina para usar.', 'Procuro o herói que sua o suficiente para pagar à vista.'] },
  alquimista: { nome: 'Zélia', papel: 'Alquimista', falas: ['Poções curam o corpo. Hábitos curam a vida.', 'Exaustão não se cura com poção. Se cura com comida e sono.', 'Quer um elixir? Pague primeiro, depois sofra.'] },
  aldeao1: { nome: 'Aldeão', papel: '', falas: ['Já tomou água hoje, herói?', 'Contam que o Rei não dorme. Só fica sentado.', 'A Maré da Inércia sobe quando ninguém se mexe.'] },
  aldeao2: { nome: 'Menina', papel: '', falas: ['Quando eu crescer, quero ser forte como você!', 'Meu pai disse que o treino é como regar uma planta.', 'Sua capa é bonita!'] },
};

export const DICAS = [
  'Dica: bater PR dá um baú. Aumentar o rank de um exercício dá um baú lendário.',
  'Dica: comer entre 90% e 110% da meta restaura tudo e ainda dá Inspiração.',
  'Dica: Tochas só vêm da vida real. Gaste com sabedoria.',
  'Dica: a Maré da Inércia sobe quando você falta. Missões do dia a fazem recuar.',
  'Dica: Magos dependem de estudo; Clérigos, de constância; Guerreiros, de Supino e Terra.',
  'Dica: um dia de descanso planejado não quebra a sequência.',
];
