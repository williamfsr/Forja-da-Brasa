// Personalidades: frases de abertura dos inimigos, temperamento, quem é racional (aceita conversa/persuasão/magia) e perfis dos NPCs da vila.
import { mulberry32, hashStr } from './rules.js';
import { sortearAp } from './cosmeticos.js';
import { MONSTROS } from './srd.js';

const pick = (rng, a) => a[Math.floor(rng() * a.length)];

// ---------- temperamentos: modificam a conversa ----------
// dc: ajuste na CD de Persuadir; susto: ajuste na CD de Intimidar; sub: multiplicador do suborno (0 = não aceita)
export const TEMPERAMENTOS = {
  agressivo: { nome: 'Agressivo', dc: 1, susto: 0, sub: 1, ok: ['Hmpf... talvez você tenha razão.', 'Tá, tá. Fale rápido.'], no: ['Cansei de papo! Vai pro chão!', 'Conversa fiada!'], medo: ['Eu... eu não ia mesmo lutar hoje!', 'Maldito! Isso não acabou!'], desacato: ['Ninguém me intimida!'], suborno: ['Ouro? Hm... passe pra cá.'] },
  covarde: { nome: 'Covarde', dc: -3, susto: -4, sub: 0.6, ok: ['Eu só queria sobreviver, juro!', 'Tudo bem, tudo bem, sem briga!'], no: ['Mentira! Você vai me matar!', 'Não me engane!'], medo: ['Aaah! Piedade!', 'Eu já estou indo!'], desacato: ['Não... não vem!'], suborno: ['Sim, sim! Pego e sumo!'] },
  honrado: { nome: 'Honrado', dc: 2, susto: 4, sub: 0, ok: ['Suas palavras têm peso. Eu ouço.', 'Um adversário digno merece ser ouvido.'], no: ['Honra não se negocia com palavras vazias.', 'Então que as lâminas falem.'], medo: ['Você não me assusta.', 'Prefiro a morte à desonra.'], desacato: ['Ofensa tola.'], suborno: ['Eu não me vendo.'] },
  ganancioso: { nome: 'Ganancioso', dc: -1, susto: 1, sub: 0.55, ok: ['Hm. Você fala bonito... e tem bolsa cheia?', 'Se houver lucro nisso, eu topo.'], no: ['Papo não paga as contas.', 'Sem ouro, sem acordo!'], medo: ['Mas que prejuízo! Estou fora!', 'Não vale a pena morrer por isso!'], desacato: ['Preço errado, amigo.'], suborno: ['Ahhh, agora conversamos!', 'Negócio fechado.'] },
  fanatico: { nome: 'Fanático', dc: 4, susto: 6, sub: 0, ok: ['Você... fala como alguém que viu a luz.', 'Talvez o Mestre se engane sobre você.'], no: ['Blasfêmia! O Rei da Inércia vai te silenciar!', 'Nada me desvia da minha fé!'], medo: ['Eu não temo a morte!', 'A Inércia me protege!'], desacato: ['Herege!'], suborno: ['Ouro é pó. Minha fé não.'] },
  zombeteiro: { nome: 'Zombeteiro', dc: 0, susto: 1, sub: 1, ok: ['Hehe, você tem lábia. Gosto disso.', 'Ok, ok, você me divertiu.'], no: ['Ha! Boa tentativa, bobão.', 'Tá, mas conta outra.'], medo: ['Ei, calma, era só brincadeira!', 'Piada ruim essa, eu me retiro!'], desacato: ['Uuuh, que medo.'], suborno: ['Hum, boa piada... aceito.'] },
  arrogante: { nome: 'Arrogante', dc: 3, susto: 2, sub: 1.6, ok: ['Você ousa me impressionar... Continue.', 'Hm. Raro alguém ter coragem de falar comigo assim.'], no: ['Insolente! Sabe com quem fala?', 'Você me cansa, verme.'], medo: ['Isto é... inesperado.', 'Recuo, por ora. Só por ora!'], desacato: ['Patético.'], suborno: ['Se insiste em me honrar...'] },
  frio: { nome: 'Frio', dc: 2, susto: 3, sub: 0, ok: ['Seus argumentos são... razoáveis.', 'Calculo que lutar não compensa.'], no: ['Irrelevante.', 'Sua voz é só ruído.'], medo: ['Retirada tática.', 'Isto é ineficiente. Recuo.'], desacato: ['Inútil.'], suborno: ['Ouro não me move.'] },
  bestial: { nome: 'Bestial', dc: 0, susto: 0, sub: 0, ok: ['*grunhe e baixa a cabeça*'], no: ['*rosna furioso*'], medo: ['*guincha e foge*'], desacato: ['*rosna*'], suborno: ['*ignora o ouro*'] },
};

// ---------- perfis dos monstros: [racional, temperamento, frases] ----------
const P = (rac, tmp, ...frases) => ({ rac, tmp, frases });
export const PERFIS = {
  rato: P(0, 'bestial', '*guincho agudo e dentes à mostra*', '*arranha o chão e te encara com olhos famintos*'),
  morcego: P(0, 'bestial', '*grito ultrassônico*', '*bate as asas e mergulha na sua direção*'),
  kobold: P(1, 'covarde', 'Ssssó queremos o brilhante! Dê o brilhante!', 'Chefe disse atacar! Chefe não está aqui. Hm... atacar?', 'Ohhh, grandão! Grandão traz comida?'),
  goblin: P(1, 'zombeteiro', 'Hihihi! Mais um tolo na nossa toca!', 'Bolsa! Bolsa! Entrega a bolsa e talvez a gente só morda um pouquinho!', 'Olha o tamanho dessa coisa de metal! Vai render uns trocados!'),
  bandido: P(1, 'ganancioso', 'A bolsa ou a vida, viajante. Eu não tenho o dia todo.', 'Passe o ouro e nenhum de nós sai ferido... talvez.', 'Hoje o pedágio subiu. Quanto você tem aí?'),
  cultista: P(1, 'fanatico', 'O Rei Imóvel sorri para você, herege. Venha repousar!', 'A Inércia nos chama... e você será o primeiro a ouvir seu canto.', 'Parar é a única paz verdadeira!'),
  esqueleto: P(0, 'frio', '*ossos rangendo e uma espada que se ergue sozinha*', '*a mandíbula estala em silêncio*'),
  zumbi: P(0, 'bestial', 'Uuuuuaaagh...', '*arrasta os pés em sua direção, gemendo*'),
  lobo: P(0, 'bestial', '*rosnado baixo, pelos eriçados*', '*uiva e cerca você devagar*'),
  aranhaLobo: P(0, 'bestial', '*chiado e passos rápidos de oito patas*', '*salta das sombras sem aviso*'),
  orc: P(1, 'agressivo', 'Cabeça dura, carne mole! Eu esmago!', 'Gronk quer luta! Gronk quer ouro! Gronk quer os dois!', 'Fraco demais pra Gronk, mas tudo bem, eu como assim mesmo!'),
  hobgoblin: P(1, 'honrado', 'Em fila, soldados. Este aqui é um oponente, não uma presa.', 'Disciplina vence bravura. Mostre-me a sua.', 'Que a legião faça seu trabalho!'),
  limoCinza: P(0, 'bestial', '*glub... glub...*', '*desliza lentamente, pingando ácido*'),
  bugurso: P(1, 'agressivo', 'Hrrr! Quem pisa no meu território vira almoço!', 'Pequenino! Vou usar você de martelo!'),
  aranha: P(0, 'bestial', '*clique-clique-clique de quelíceras*', '*desce do teto num fio de seda*'),
  carnical: P(0, 'bestial', 'Fome... tanta fome...', '*lambe os dentes e sibila*'),
  loboAtroz: P(0, 'bestial', '*rosnado grave que treme o chão*', '*enterra as garras na terra e abaixa o corpo para saltar*'),
  harpia: P(1, 'zombeteiro', 'Venha cá, queridinho... cante pra mim!', 'Que voz bonita... Será que grita bonito também?', 'Plumas e garras, doçura! Quem se importa?'),
  ogro: P(1, 'ganancioso', 'Ogro com fome! Você tem comida? Ou é a comida?', 'Hum? Coisa pequena pensar que pode bater no Ogro?', 'Ogro gosta de coisa brilhante. Brilhante ou carne, ogro aceita.'),
  cuboGel: P(0, 'bestial', '*blorp... um esqueleto flutua dentro dele*', '*treme e avança, transparente e silencioso*'),
  gargula: P(0, 'frio', '*os olhos de pedra se acendem*', '*as asas rangem e a estátua desce do pedestal*'),
  geleiaOcre: P(0, 'bestial', '*blorp*', '*escorre pela parede e cai no chão com um estalo úmido*'),
  capitaoBandido: P(1, 'arrogante', 'Ora, ora. Uma presa que se achou herói. Vamos terminar isto rápido.', 'Eu comando trinta lâminas nessas estradas. Você tem quantas?', 'Largue o ouro e eu esqueço que vi seu rosto.'),
  ursoCoruja: P(0, 'bestial', '*grito rouco, meio pio, meio rugido*', '*levanta-se nas patas traseiras, gigantesco*'),
  inumano: P(1, 'frio', 'Eu esqueci meu nome. Lembre-me do seu para que eu o grave na tumba.', 'Algo em mim ainda obedece ao dever. Perdoe-me.', 'A guarda eterna não permite visitas.'),
  minotauro: P(0, 'agressivo', '*bufa e raspa o chão com o casco*', '*mugido rouco que reverbera pelas paredes*'),
  basilisco: P(0, 'bestial', '*olhos amarelos fixos e sem piscar*', '*língua bifurcada sente o ar entre vocês*'),
  mumia: P(0, 'frio', '*sopra poeira e mortalha, murmurando em língua morta*', '*as ataduras se movem sozinhas*'),
  manticora: P(1, 'arrogante', 'Rá! Um bocado de carne nova para o meu ninho!', 'Você tem o cheiro dos que acham que vão voltar para casa.', 'Divirta-me, pequeno. Faz tempo que ninguém me diverte.'),
  caoInfernal: P(0, 'agressivo', '*lança um latido que cospe brasas*', '*a fumaça sai dos seus focinhos enquanto ele avança*'),
  ettin: P(1, 'agressivo', 'Cabeça Esquerda quer lutar! — Cabeça Direita quer comer! — Os dois querem você!', 'Eu falo com você! — Não, eu falo! — Ele é meu!'),
  fantasma: P(1, 'frio', 'Eu fui... alguém... antes da Maré. Você me lembra isso...', 'Estou tão cansado, viajante. Por que você não descansa também?', 'Você não deveria estar aqui. Ninguém deveria.'),
  troll: P(0, 'agressivo', '*rugido que sacode os dentes*', '*cheira o ar, baba e sorri*'),
  aparicao: P(0, 'frio', '*um frio terrível sobe pela espinha*', '*o ar fica pesado e as sombras se alongam*'),
  criaVamp: P(1, 'arrogante', 'Que aroma delicioso... a coragem tem cheiro, sabia?', 'Venha, mortal. Sua veia canta para mim.', 'Ah, uma refeição que anda sozinha. Que gentileza.'),
  gigColina: P(1, 'ganancioso', 'Uuuh, pequenino! Tem bode pra mim? Tem ouro?', 'Eu como cabra, eu como vaca. Humano, nunca provei! Hehehe!'),
  elemAgua: P(0, 'bestial', '*onda se ergue com um rugido borbulhante*', '*uma coluna de água toma a forma de um punho*'),
  serpe: P(0, 'bestial', '*sibilo longo, a cauda chicoteia o ar*', '*o ferrão pinga veneno*'),
  quimera: P(0, 'agressivo', '*três vozes rugem ao mesmo tempo*', '*a cabeça de leão ruge, a de bode berra, a de dragão assopra fumaça*'),
  medusa: P(1, 'arrogante', 'Que pena. Já estátuas me aborrecem. Mas você ainda fala...', 'Não olhe nos meus olhos, bonitinho. Ou olhe — o resultado é sempre o mesmo.', 'Há anos ninguém me visita. Que gentil... e que idiota.'),
  mago: P(1, 'arrogante', 'Interessante... um experimento que entrou sozinho no laboratório.', 'Orvald avisou: quem toca a pedra, sofre a pedra. Você tocou?', 'Eu estudei por trezentos anos. Você, quantos minutos?'),
  gigPedra: P(1, 'honrado', 'Pequeno viajante. A montanha escuta. A montanha decide.', 'A pedra é paciente. Você, não. Prove-me o contrário.'),
  gigGelo: P(1, 'agressivo', 'Congelar você será rápido. Rápido e divertido!', 'Meu machado ainda tem gosto de viking. Você tem gosto de quê?'),
  golemArgila: P(0, 'frio', '*estrondo de barro rachando enquanto se move*', '*glifos acendem-se em sua testa*'),
  gigFogo: P(1, 'arrogante', 'Que ousadia, entrar no fogo do meu mestre!', 'Eu forjei espadas com as sombras de mil heróis. Você será mais uma!'),
  gigNuvens: P(1, 'zombeteiro', 'Haha! Lá embaixo, pequeninos! Sabem o que é solidão?', 'Tão pequeno... tão corajoso... tão engraçado!'),
  dragaoJovem: P(1, 'arrogante', 'Um mortal ousa pisar no meu tesouro? Que apetite você me dá.', 'Já queimei aldeias com menos motivo que isto.', 'Ouro é o que me aquece. Você, em breve, também.'),
  golemPedra: P(0, 'frio', '*o chão treme a cada passo de pedra*', '*as runas pulsam com uma luz fria*'),
  vampiro: P(1, 'arrogante', 'Boa noite, herói. Eu esperava por você há três séculos.', 'Não tema... Será rápido. Ou lento. Depende da noite.', 'Que sangue vivo! Que suor honesto! Você me lembra o que perdi.'),
  dragaoAdulto: P(1, 'arrogante', 'Ignivarra ouve seu coração bater, mortal. Está rápido demais.', 'Eu vi impérios virarem cinzas. Você será nota de rodapé.'),
  reiInercia: P(0, 'frio', '...Descanse. Pare. Aceite...', '*o tempo parece engasgar quando ele abre os olhos*'),
};
const PERFIL_CHEFE = {
  'Dente-de-Ferro, o Rato Alfa': ['*guincha, e uma dúzia de ratos menores recuam*'],
  'Gruk, Capitão Goblin': ['Eu sou Gruk! Capitão! Gruk manda aqui! Ninguém manda em Gruk!'],
  'O Bibliotecário Faminto': ['*sussurra* Silêncio. Ou eu o devoro entre as linhas.'],
  'Presa-Cinza, o Alfa': ['*olha nos seus olhos por um longo instante e uiva*'],
  'Capitão Corvo': ['Você chegou longe, herói. Mas a estrada é minha, e meu preço é o último.'],
  'Olhos-de-Pedra': ['Que lindo... Mais uma estátua para o meu jardim.'],
  'Bram, o Ettin Duplo': ['— Fala comigo! — Não, comigo! — Calem a boca, os dois! Atacar!'],
};
const FRASES_GENERICAS_CHEFE = ['Chegou longe. Mas aqui acaba a sua estrada.', 'Estava esperando por você, herói. Só não pensei que viesse tão cedo.', 'A Brasa não vai te salvar aqui.'];

export const FRASE_AMBIENTE = { bestial: 'o bicho não parece disposto a conversar.', morto: 'não há mais consciência ali.' };

// ---------- aparência: monstros humanoides têm rosto próprio ----------
const RACAS_HUM = ['humano', 'humano', 'meioorc', 'meioelfo', 'humano', 'anao', 'halfling', 'tiefling'];
export function aparenciaMonstro(id, rng) {
  const ap = sortearAp(rng, 'ladino', pick(rng, RACAS_HUM)); ap.capa = 0; ap.altura = Math.max(-2, Math.min(2, ap.altura)); return ap;
}
// Prepara os campos de personalidade de um monstro recém-criado (sem alterar atributos de combate)
export function aplicarPerfil(m, rng = Math.random) {
  const pf = PERFIS[m.id]; if (!pf) { m.racional = false; m.tmp = 'bestial'; m.frase = '*encara você com hostilidade*'; return m; }
  m.tmp = pf.tmp; m.racional = !!pf.rac; m.frase = pick(rng, pf.frases);
  if (m.chefe) { const f = PERFIL_CHEFE[m.n]; m.frase = f ? pick(rng, f) : (pf.rac ? m.frase : pick(rng, FRASES_GENERICAS_CHEFE)); if (!pf.rac && !PERFIL_CHEFE[m.n]) m.racional = false; }
  const T = TEMPERAMENTOS[m.tmp]; m.dcSocial = T ? T.dc : 0; m.recrutavel = m.racional && !m.chefe && m.cr <= 6 && m.tmp !== 'fanatico' && m.tmp !== 'frio';
  if (m.spr === 'humano') m.ap = aparenciaMonstro(m.id, mulberry32(hashStr(String(m.id) + Math.floor(rng() * 1e9))));
  // algumas almas dão só pistas de quem eram
  if (m.id === 'inumano' || m.id === 'fantasma') m.recrutavel = false;
  return m;
}
export const racionalDe = (id) => !!(PERFIS[id] && PERFIS[id].rac);
export function linhasConversa(tmp, tipo, rng = Math.random) { const T = TEMPERAMENTOS[tmp] || TEMPERAMENTOS.agressivo; return pick(rng, T[tipo] || T.ok); }

// ---------- NPCs da vila ----------
const mk = (cls, raca, seed, over) => { const ap = sortearAp(mulberry32(hashStr(seed)), cls, raca); return Object.assign(ap, over); };
export const NPC_PERFIL = {
  brasa: { raca: 'anao', tmp: 'honrado', vis: { cls: 'guerreiro', cat: 'leve', ornam: 1 }, ap: mk('guerreiro', 'anao', 'brasa', { corpo: 2, altura: -1, cabelo: 15, cabeloCor: '#8a2a1a', barba: 0, marca: 3, acess: 1, roupa: 3, roupa1: '#8a5a2a', roupa2: '#3a2a1a', capa: 0, arm1: '#6a4a2a', arm2: '#2a1a10' }),
    gosta: 'Fala pouco e martela muito. Respeita quem aparece todos os dias.', afin: ['A Brasa lembra de quem cuida dela. Eu também.', 'Meu avô dizia que o aço aprende com a paciência. Você aprende rápido.', 'Quando a Brasa estiver forte de novo, forjo algo só para você.'] },
  ferrao: { raca: 'humano', tmp: 'agressivo', vis: { cls: 'barbaro', cat: null }, ap: mk('barbaro', 'humano', 'ferrao', { corpo: 2, altura: 2, cabelo: 0, barba: 5, barbaCor: '#3b2616', marca: 1, acess: 0, roupa: 2, roupa1: '#a8561f', roupa2: '#5a3a22', capa: 0 }),
    gosta: 'Só pergunta uma coisa: "quanto você levantou hoje?"', afin: ['Já fui o mais forte de Forjaluz. Agora treino quem vai ser.', 'Seu supino melhorou. Eu notei. Não repita que eu notei.', 'Sabe por que não tenho cabelo? Cada fio foi uma série que não fiz. Brincadeira. Ou não.'] },
  aurora: { raca: 'meioelfo', tmp: 'covarde', vis: { cls: 'clerigo', cat: 'veste', ornam: 1 }, ap: mk('clerigo', 'meioelfo', 'aurora', { corpo: 0, cabelo: 10, cabeloCor: '#f4ead0', barba: 0, marca: 0, acess: 6, roupa: 5, roupa1: '#e8e0c8', roupa2: '#a89c6a', capa: 1 }),
    gosta: 'Ouve com atenção e responde com calma. Tem um olhar de quem já viu tudo cair.', afin: ['Algumas noites, ainda ouço a Inércia cantando. Mas agora tenho companhia.', 'O corpo cura devagar. A alma, mais devagar ainda. Não se apresse.', 'Posso te contar um segredo? Eu acendo uma vela por cada herói que volta.'] },
  eruvim: { raca: 'gnomo', tmp: 'zombeteiro', vis: { cls: 'mago', cat: 'veste', ornam: 1 }, ap: mk('mago', 'gnomo', 'eruvim', { corpo: 0, altura: -2, cabelo: 0, barba: 10, barbaCor: '#d9d9de', marca: 8, acess: 9, roupa: 4, roupa1: '#3a5fb8', roupa2: '#d8b43a', capa: 1 }),
    gosta: 'Tem sempre um livro aberto ao lado de uma xícara fria.', afin: ['Você sabia que a maior parte das provas de residência cai nos mesmos temas? Só ninguém quer ouvir.', 'Estudar é só apostar no futuro com horas em vez de ouro. Faça um bom investimento.', 'Dei trinta anos à Biblioteca. Ela me devolveu trinta mil histórias.'] },
  tavi: { raca: 'halfling', tmp: 'ganancioso', vis: { cls: 'ladino', cat: null }, ap: mk('ladino', 'halfling', 'tavi', { corpo: 2, altura: -1, cabelo: 14, cabeloCor: '#5a3a22', barba: 0, marca: 9, acess: 8, roupa: 1, roupa1: '#d9772a', roupa2: '#f4ead0', capa: 0 }),
    gosta: 'Cozinha com a alma e cobra com a razão.', afin: ['Segredo da casa: caldo é lembrança. Cada panela guarda alguém.', 'Não pago por herói magro nem por herói empanturrado. Pago por herói equilibrado!', 'Se algum dia eu me aposentar, deixo a receita pra você. Mas só a metade. O resto é segredo.'] },
  lucia: { raca: 'humano', tmp: 'honrado', vis: { cls: 'guerreiro', cat: 'pesada', ornam: 3, escudo: true }, ap: mk('guerreiro', 'humano', 'lucia', { corpo: 1, altura: 1, cabelo: 12, cabeloCor: '#241812', barba: 0, marca: 2, acess: 0, roupa: 6, capa: 2, estilo: 2, arm1: '#9aa0b0', arm2: '#b8352e' }),
    gosta: 'Aperta a mão como quem aperta um juramento.', afin: ['Perdi um esquadrão para a Maré. Desde então, não deixo nenhum de vocês ir sozinho.', 'Se um dia você cair lá embaixo, eu vou buscar. Não discuta.', 'O Rei da Inércia é só um nome. O que mata é a gente parar de lutar.'] },
  quinzinho: { raca: 'halfling', tmp: 'ganancioso', vis: { cls: 'ladino', cat: null }, ap: mk('ladino', 'halfling', 'quinzinho', { corpo: 0, altura: -2, cabelo: 3, cabeloCor: '#a06b36', barba: 2, barbaCor: '#a06b36', marca: 0, acess: 7, roupa: 6, roupa1: '#3a8a4a', roupa2: '#8a5a2a', capa: 0 }),
    gosta: 'Sorriso largo, mãos ágeis e uma memória infalível para preços.', afin: ['Não conte pra ninguém, mas gosto de você. Dou desconto... no próximo item. Talvez.', 'Já vendi uma espada para um dragão. Ele não pagou. Aprendi.', 'Negócio bom é aquele em que os dois saem se achando espertos.'] },
  alquimista: { raca: 'tiefling', tmp: 'zombeteiro', vis: { cls: 'mago', cat: 'veste', ornam: 0 }, ap: mk('mago', 'tiefling', 'alquimista', { corpo: 0, altura: 0, cabelo: 9, cabeloCor: '#9a9aa8', barba: 0, marca: 0, acess: 4, roupa: 7, roupa1: '#7a3aa8', roupa2: '#2aa08a', capa: 0, chifre: 2 }),
    gosta: 'Cheira a ervas, enxofre e perigo.', afin: ['Tenho um elixir que cura o medo de elixires. Quer provar?', 'Todo veneno é remédio na dose errada. Todo remédio é veneno na dose errada. Cuidado.', 'Você é um dos poucos que não faz careta quando provo minhas misturas. Isso me lisonjeia.'] },
  aldeao1: { raca: 'humano', tmp: 'zombeteiro', vis: { cls: 'ladino', cat: null }, ap: mk('ladino', 'humano', 'aldeao1', { corpo: 1, cabelo: 22, cabeloCor: '#9a9aa8', barba: 9, barbaCor: '#9a9aa8', marca: 8, acess: 0, roupa: 0, roupa1: '#8a6a3a', roupa2: '#5a3a22', capa: 0 }),
    gosta: 'Conhece todo mundo e fofoca com carinho.', afin: ['Já vi três heróis passarem por aqui. Você é o primeiro que volta.', 'Meu joelho avisa quando a Inércia sobe. É melhor que qualquer oráculo.'] },
  aldeao2: { raca: 'humano', tmp: 'covarde', vis: { cls: 'ladino', cat: null }, ap: mk('ladino', 'humano', 'aldeao2', { corpo: 0, altura: -3, cabelo: 15, cabeloCor: '#5a3a22', barba: 0, marca: 3, acess: 0, roupa: 0, roupa1: '#d8b43a', roupa2: '#c04a90', capa: 0 }),
    gosta: 'Olhos arregalados e uma coragem maior do que ela.', afin: ['Hoje eu treinei pular corda! Cinquenta pulos! Tá bom, vinte.', 'Quando eu crescer, quero ter uma capa bonita e salvar o povo. Tá certo?'] },
};
export const AFIN_RECOMPENSAS = { 3: { ouro: 40, txt: 'deixa uma bolsinha na sua mão: "Pra ajudar na jornada."' }, 6: { item: 'pocao2', txt: 'entrega uma poção: "Guarde para um dia ruim."' }, 10: { ouro: 160, txt: 'insiste em lhe dar uma pequena fortuna: "Você merece."' } };
export const retratoNpc = (id) => NPC_PERFIL[id] || null;
void MONSTROS;
