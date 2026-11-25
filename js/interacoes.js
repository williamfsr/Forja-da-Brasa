// Móveis e objetos tocáveis do mundo: cada um diz algo sobre o lugar, o Rei da Inércia ou a rotina de treino — e alguns fazem coisas de verdade.
import * as St from './store.js';
import { PAGINAS } from './campanha.js';

// [nome, ...linhas] ou { nome, linhas, act }
const T = (nome, ...linhas) => ({ nome, linhas });
export const OBJ = {
  // --- casa do herói ---
  espelho: { nome: 'Espelho', act: 'espelho', linhas: ['O reflexo devolve o olhar sem pressa. Dá para mudar quase tudo o que ele mostra.'] },
  bau_casa: { nome: 'Baú da casa', act: 'bau', linhas: ['Sua mochila e tudo o que a Brasa já lhe deu.'] },
  estante: { nome: 'Estante', act: 'estante', linhas: ['Lombadas gastas. Entre elas, um caderno com a letra N, meio queimado.'] },
  mesa_casa: { nome: 'Mesa de trabalho', act: 'diario', linhas: ['Papéis de missão e uma vela. Aqui se planeja o dia.'] },
  cama_casa: { nome: 'Cama', act: 'descansar', linhas: ['O colchão chama pelo nome. Mas só o corpo que se mexeu merece o descanso.'] },
  planta: T('Planta', 'Uma planta teimosa. Cresceu mesmo sem sol. Faz bem lembrar que dá.'),
  vaso: T('Vaso', 'Um vaso com terra seca e um broto verde que ninguém plantou.'),
  mesa: T('Mesa', 'Uma mesa de madeira com marcas de facas e de cotovelos.'),
  fogao: T('Fogão a lenha', 'As brasas ainda estalam. Fogo aceso é sinal de alguém que voltou hoje.'),
  // --- templo / igreja ---
  estatua_templo: T('Estátua da Aurora', 'Uma mulher de pedra com o braço erguido, como quem acende uma tocha. A inscrição: «Levante-se. De novo.»'),
  banco_templo: T('Banco', 'Madeira dura, de propósito. Ninguém dorme aqui.'),
  altar_descanso: T('Altar do Descanso', 'Um altar sem velas. Em volta, almofadas muito macias. Algo aqui é mais convidativo do que deveria.'),
  estatua_descanso: T('Estátua do Santo do Descanso', 'Um santo deitado, com o rosto sereno. Quem o esculpiu esqueceu de lhe dar pés.'),
  banco_igreja: T('Banco da igreja', 'Almofadado. Do lado, uma frase riscada: «Reze de pé».'),
  // --- biblioteca ---
  mesa_estudo: T('Mesa de estudo', 'Cadernos abertos, canetas secas, uma xícara fria. A prova é o dragão; a rotina, a espada.'),
  // --- arena ---
  toneis: T('Barris', 'Barris de água e de suor. Cheiram igual.'),
  saco_treino: T('Saco de pancada', 'Remendado, duro, honesto. Bater nele cansa e não pergunta por quê.'),
  banco_arena: T('Banco de supino', 'O couro tem a forma de milhares de costas. Hoje poderia ter a sua.'),
  saco: T('Saco', 'Um saco de grãos. Ou de areia. Depende de quem treina.'),
  // --- forja ---
  bigorna_forja: T('Bigorna', 'Quente ainda. Cada marca no aço é um dia em que alguém voltou.'),
  armas_forja: T('Armas em exposição', 'Espadas e machados em ordem. A Mestra Brasa diz que armas boas não fazem herói.'),
  // --- trilha ---
  banco_trilha: T('Banco da trilha', 'Um banco à beira do caminho. Meia hora aqui rende uma boa corrida depois.'),
  // --- taverna ---
  mesa_taverna: T('Mesa da taverna', 'Rastros de caldo e de risada. Alguém deixou uma anotação: «Comer bem é treinar também».'),
  lareira: T('Lareira', 'Um fogo gordo e feliz. Não é a Brasa, mas é parente.'),
  // --- alquimia ---
  caldeirao: T('Caldeirão', 'Algo verde borbulha. Zélia jura que é um chá. Você duvida com carinho.'),
  // --- empório ---
  quadro: T('Quadro', 'Uma pintura da vila quando ainda havia mais gente na praça.'),
  // --- guarda ---
  mapa_guarda: { nome: 'Mapa do Vale', act: 'mapa', linhas: ['Alfinetes vermelhos marcam onde a Capitã perdeu gente para a Maré.'] },
  armas_guarda: T('Armas da guarda', 'Lanças alinhadas. Algumas nunca foram usadas; a Capitã prefere assim.'),
  // --- estalagem ---
  balcao_estalagem: T('Balcão', 'Há um livro de hóspedes. A última data é «sempre tarde».'),
  cama_estalagem: T('Cama da estalagem', 'Fria, arrumada, muito convidativa. Dona Cora avisa: durma de botas.'),
  // --- prefeitura ---
  trono_prefeito: T('Cadeira do Prefeito', 'Uma poltrona de veludo roxo com um bordado: «Descanse». O encosto tem as marcas de quem nunca saiu dali.'),
  estatua_prefeito: T('Estátua do Prefeito', 'O Prefeito Gaudêncio, de bronze, sorrindo. Com todos os dentes e nenhum olho.'),
  quadro_prefeito: T('Retrato', 'O Prefeito aos vinte anos, magro, suado e feliz. Alguém pintou por cima uma versão mais calma.'),
  mesa_festa: T('Mesa de festa', 'Bolos, vinho e flores. Tudo intocado: a festa é obrigatória, comer não.'),
  edital_prefeito: T('Edital do Prefeito', 'Proibido: pressa, suor e má notícia. Obrigatório: sorriso, festa e descanso. Assinado: Gaudêncio.'),
  // --- abadia ---
  prontuario: T('Prontuário da Abadia', 'Páginas de doses escritas à mão. As datas das últimas anotações param todas no mesmo dia. A letra da doutora treme.'),
  estante_abadia: T('Estante da Abadia', 'Tratados de medicina, ervas e um livro fino: «O que o cansaço está dizendo».'),
  leito: T('Leito de enfermaria', 'Lençóis limpos. O paciente ao lado dorme há tanto tempo que os cabelos cresceram sobre o travesseiro.'),
  // --- fortaleza ---
  mapa_ordem: { nome: 'Mapa da Ordem', act: 'mapa', linhas: ['O mapa de uma ordem extinta: cada fortaleza tem um X. Quase todos foram cortados com raiva.'] },
  armas_ordem: T('Armas prateadas', 'Espadas de prata opaca. Já foram luz; agora são lembrança.'),
  estatua_ordem: T('Estátua de cavaleiro', 'Um cavaleiro prateado de joelhos. Alguém gravou no pedestal: «Jamais deitar».'),
  // --- andarilhos ---
  baralho: { nome: 'Baralho do Hábito', act: 'baralho', linhas: ['Cartas embaralhadas por mãos calejadas. Cada uma mostra um dia que você ainda não viveu.'] },
  caldeirao_vazio: T('Caldeirão frio', 'Dentro, um líquido imóvel e cinza. Sem cheiro. Sem som. Sem sentido.'),
  // --- moinho ---
  tacho_doce: T('Tacho de caramelo', 'Mexe, mexe, nunca acaba. O cheiro adocica o juízo.'),
  fogao_doce: T('Fogão de bolinhos', 'Dezenas de bolinhos redondos esperam, quentes. Dois é mais do que a vontade aguenta.'),
  mesa_doce: T('Mesa de bolinhos', 'Cadeiras fundas, almofadas, cobertores. É difícil não querer sentar.'),
  // --- vinhedo ---
  balcao_vinho: T('Balcão de provas', 'Taças cheias, nenhuma vazia. O vinho nunca acaba. Nem a vontade.'),
  barris_vinho: T('Barris de vinho', 'Cheios até a tampa. Por dentro, algo ainda se mexe devagar.'),
  mesa_vinho: T('Mesa do brinde', 'Dezenas de copos erguidos, parados. Há quarenta anos.'),
  // --- âmbar ---
  altar_ambar: { nome: 'Altar de Âmbar', act: 'ambar', linhas: ['Um bloco de resina dourada guarda uma Dádiva: poder sem esforço, a preço de Inércia.'] },
  // --- cidadela ---
  trono_vazio: T('Cadeira vazia', 'Uma cadeira de pedra ao fundo. O Rei não está nela. Está sentado no coração do lugar, onde ninguém o vê.'),
  estatua_cidadela: T('Estátua do salão', 'O rosto foi apagado a martelo. Quem ordenou isso odiava o que via.'),
  // --- aldeia / teo ---
  cama_aldeia: T('Cama', 'Cobertas ainda mornas. O morador saiu há pouco, ou nunca saiu.'),
  bau_aldeia: T('Baú', 'Trancado. Alguém guarda ali algo que não pretende vender.'),
  cama_teo: { nome: 'Cama de Teo', act: 'teo', linhas: ['O colchão tem o formato de um corpo que não se levanta há semanas.'] },
  // --- mundo ---
  placa_colina: T('Placa da Colina', 'Colina do Círculo Cinzento. Abaixo, em letras menores: «Aqui o mundo parou de crescer. Peça licença às pedras».'),
  placa_garganta: T('Placa da Garganta', 'Garganta do Vento: a ponte caiu, o ar é cortante, o penhasco é alto. Só se atravessa subindo.'),
  marco_estrada: T('Marco de estrada', 'Uma pedra gasta com setas e nomes. Todas as setas apontam para algum lugar que ainda dá para chegar a pé.'),
};

// Ações especiais, ligadas à interface pelo jogo
export async function interagirObjeto(id, G, ctx = {}) {
  const o = OBJ[id]; if (!o) { await G.ui.dialogo('Você observa', ['Nada de especial.']); return; }
  const s = St.S;
  if (o.act === 'descansar') {
    await G.ui.dialogo(o.nome, o.linhas);
    const ok = await G.ui.confirmar('Descansar um pouco?', 'Recupera todos os seus PV. Recursos de descanso (magias e habilidades) só voltam no amanhecer, com a alimentação do dia anterior.', 'Descansar', 'Agora não');
    if (ok) { St.descansarEmCasa(); G.ui.hud(); G.ui.toast('Você descansa. PV restaurados.'); if (G.sonho) await G.sonho(); }
    return;
  }
  if (o.act === 'espelho') { await G.ui.dialogo(o.nome, o.linhas); G.ui.painel('casa', { aba: 'ap' }); return; }
  if (o.act === 'bau') { G.ui.painel('casa', { aba: 'equip' }); return; }
  if (o.act === 'estante') {
    const n = (s.campanha && s.campanha.lore || []).length; await G.ui.dialogo(o.nome, [...o.linhas, n ? `Você já recuperou ${n} página(s) do Diário de Nhor.` : 'Ainda nenhuma página do Diário. Elas aparecem quando você avança.']);
    G.ui.painel('menu', { aba: 'glos', sub: 'lore' }); return;
  }
  if (o.act === 'diario') { await G.ui.dialogo(o.nome, o.linhas); G.ui.painel('menu', { aba: 'missoes' }); return; }
  if (o.act === 'baralho') { await G.ui.dialogo(o.nome, o.linhas); G.ui.painel('menu', { aba: 'glos', sub: 'lore' }); return; }
  if (o.act === 'mapa') { await G.ui.dialogo(o.nome, o.linhas); G.ui.painel('menu', { aba: 'mapa' }); return; }
  if (o.act === 'ambar' && G.dadiva) { await G.dadiva(); return; }
  if (o.act === 'teo' && G.teo) { await G.ui.dialogo(o.nome, o.linhas); await G.teo(); return; }
  await G.ui.dialogo(o.nome, o.linhas);
  void ctx; void PAGINAS;
}
