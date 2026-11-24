// Conteúdo de jogo: exercícios pontuáveis, aeróbicos, estudo, missões, eventos, conquistas.
import { ITENS } from './srd.js';

export const TIERS = ['Novato', 'Aprendiz', 'Soldado', 'Veterano', 'Campeão', 'Elite', 'Mestre', 'Grão-Mestre', 'Lenda', 'Mítico'];
export const TIER_COR = ['#8a8a96', '#a0785a', '#c0c8d0', '#6fcf7f', '#4aa8ff', '#b57bff', '#ff9f40', '#ff5c6c', '#ffd23f', '#ff6bd6'];
export const RARIDADES = ['comum', 'incomum', 'raro', 'épico', 'lendário'];
export const RAR_COR = { comum: '#b8b8c4', incomum: '#6fcf7f', raro: '#4aa8ff', 'épico': '#b57bff', 'lendário': '#ffb52e' };

const mul = (a, k) => a.map((x) => +(x * k).toFixed(3));
// Limiares de e1RM / peso corporal para os tiers 2..10 (masculino); feminino aplica fator
const mk = (id, nome, grupo, attr, emoji, dica, M, fSup) => ({ id, nome, grupo, attr, emoji, dica, M, F: mul(M, fSup) });
export const LIFTS = {
  supino: mk('supino', 'Supino', 'supino', 'FOR', '🏋️', 'Carga total da barra (ou soma dos halteres).', [.5, .75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5], .65),
  terra: mk('terra', 'Levantamento terra', 'terra', 'FOR', '⛓️', 'Carga total da barra.', [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3.1], .75),
  agachamento: mk('agachamento', 'Agachamento', 'agachamento', 'CON', '🦵', 'Carga total da barra.', [.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.8], .75),
  barra_fixa: mk('barra_fixa', 'Barra fixa', 'barra', 'DES', '🤸', 'Carga extra em kg (0 se só o peso do corpo). O peso corporal entra no cálculo.', [.8, 1, 1.15, 1.3, 1.45, 1.6, 1.75, 1.9, 2.1], .8),
  puxada: mk('puxada', 'Puxada (polia)', 'barra', 'DES', '🔽', 'Carga da polia em kg.', [.5, .7, .9, 1.05, 1.2, 1.35, 1.5, 1.7, 1.9], .65),
  remada: mk('remada', 'Remada', 'remada', 'DES', '🚣', 'Barra curvada, Pendlay, T ou máquina. Carga total.', [.4, .55, .7, .85, 1, 1.15, 1.3, 1.5, 1.7], .65),
  lateral: mk('lateral', 'Desenvolvimento lateral', 'ombros', 'CAR', '💪', 'Elevação lateral: kg por halter (por mão).', [.06, .09, .12, .16, .2, .24, .28, .32, .36], .7),
  desenv: mk('desenv', 'Desenvolvimento (press)', 'ombros', 'CAR', '🙌', 'Press de ombros: carga total.', [.35, .5, .65, .8, .95, 1.1, 1.25, 1.4, 1.55], .65),
};
// Cards exibidos na Arena (uma variante por grupo)
export const GRUPOS_TREINO = [
  { id: 'supino', nome: 'Supino', emoji: '🏋️', variantes: ['supino'] },
  { id: 'terra', nome: 'Levantamento terra', emoji: '⛓️', variantes: ['terra'] },
  { id: 'agachamento', nome: 'Agachamento', emoji: '🦵', variantes: ['agachamento'] },
  { id: 'barra', nome: 'Barra / Puxada', emoji: '🤸', variantes: ['barra_fixa', 'puxada'] },
  { id: 'remada', nome: 'Remada', emoji: '🚣', variantes: ['remada'] },
  { id: 'ombros', nome: 'Desenvolvimento lateral', emoji: '💪', variantes: ['lateral', 'desenv'] },
];
export const ATR_FONTE = {
  FOR: 'Supino + Terra', DES: 'Barra/Puxada + Remada', CON: 'Agachamento + Aeróbico',
  INT: 'Horas de estudo', SAB: 'Constância (dias ativos)', CAR: 'Ombros (Desenv. lateral)',
};

export const AERO = [
  { id: 'caminhada', nome: 'Caminhada', mult: 0.8, emoji: '🚶' }, { id: 'corrida', nome: 'Corrida', mult: 1.6, emoji: '🏃' },
  { id: 'bicicleta', nome: 'Bicicleta', mult: 1.3, emoji: '🚴' }, { id: 'natacao', nome: 'Natação', mult: 1.8, emoji: '🏊' },
  { id: 'hiit', nome: 'HIIT', mult: 2.0, emoji: '⚡' }, { id: 'corda', nome: 'Pular corda', mult: 1.9, emoji: '🪢' },
  { id: 'remo', nome: 'Remo', mult: 1.7, emoji: '🛶' }, { id: 'eliptico', nome: 'Elíptico', mult: 1.1, emoji: '🌀' },
  { id: 'esporte', nome: 'Esporte coletivo', mult: 1.4, emoji: '⚽' }, { id: 'danca', nome: 'Dança', mult: 1.2, emoji: '💃' },
  { id: 'trilha', nome: 'Trilha', mult: 1.5, emoji: '🥾' }, { id: 'luta', nome: 'Luta (Muay Thai, Jiu-Jitsu…)', mult: 1.9, emoji: '🥊' },
  { id: 'escada', nome: 'Escada / StairMaster', mult: 1.7, emoji: '🪜' }, { id: 'outro', nome: 'Outro aeróbico', mult: 1.0, emoji: '❤️' },
];
export const INTENSIDADES = [{ id: 'leve', nome: 'Leve', f: 0.8 }, { id: 'moderado', nome: 'Moderado', f: 1 }, { id: 'intenso', nome: 'Intenso', f: 1.3 }];

export const ESTUDO_TIPOS = [
  { id: 'foco', nome: 'Estudo focado', mult: 1.0, emoji: '📖' }, { id: 'questoes', nome: 'Resolução de questões', mult: 1.3, emoji: '✍️' },
  { id: 'revisao', nome: 'Revisão ativa / flashcards', mult: 1.15, emoji: '🗂️' }, { id: 'aula', nome: 'Aula / vídeo', mult: 0.8, emoji: '🎓' },
  { id: 'simulado', nome: 'Simulado / prova', mult: 1.7, emoji: '📝' }, { id: 'pratica', nome: 'Prática / caso clínico', mult: 1.1, emoji: '🩺' },
];
export const ESTUDO_CATS = [{ id: 'faculdade', nome: 'Faculdade' }, { id: 'residencia', nome: 'Residência' }, { id: 'concurso', nome: 'Concurso' }, { id: 'outro', nome: 'Outro' }];

export const ALVO_PADRAO = { aeroLimiar: [60, 120], estudoLimiar: 240 };

// ---------- Missões diárias ----------
// pilar: corpo | mente | alma. prog(s, D, q) lê as estatísticas do dia (D)
export const MISSOES = [
  { id: 'series', pilar: 'corpo', vals: [4, 6, 8], txt: (n) => `Registre ${n} séries pontuáveis na Arena de Ferro`, xp: (n) => 40 + n * 8, ouro: (n) => 8 + n * 2, prog: (s, D) => D.series },
  { id: 'lift', pilar: 'corpo', vals: ['supino', 'terra', 'agachamento', 'barra', 'remada', 'ombros'], alvo: 3, txt: (a, s, N) => `Faça 3 séries de ${N[a]}`, xp: () => 70, ouro: () => 12, prog: (s, D, q) => D.grupoSets[q.arg] || 0 },
  { id: 'cardio', pilar: 'corpo', vals: [20, 30, 40], txt: (n) => `Faça ${n} min de aeróbico`, xp: (n) => 30 + n * 2, ouro: (n) => 6 + Math.floor(n / 4), prog: (s, D) => D.cardio },
  { id: 'pr', pilar: 'corpo', vals: [1], raro: true, txt: () => 'Bata um PR em qualquer exercício pontuável', xp: () => 200, ouro: () => 40, prog: (s, D) => D.prs },
  { id: 'estudo', pilar: 'mente', vals: [45, 60, 90], txt: (n) => `Estude ${n} min`, xp: (n) => 30 + n, ouro: (n) => 6 + Math.floor(n / 6), prog: (s, D) => D.estudo },
  { id: 'questoes', pilar: 'mente', vals: [30], txt: (n) => `Resolva questões por ${n} min`, xp: () => 85, ouro: () => 14, prog: (s, D) => D.questoes },
  { id: 'pomo', pilar: 'mente', vals: [2], txt: (n) => `Complete ${n} Pomodoros de foco`, xp: () => 80, ouro: () => 12, prog: (s, D) => D.pomos },
  { id: 'refeicoes', pilar: 'alma', vals: [3], txt: (n) => `Registre ${n} refeições no livro da Taverna`, xp: () => 45, ouro: () => 8, prog: (s, D) => D.comida.length },
  { id: 'meta_kcal', pilar: 'alma', vals: [1], fim: true, txt: () => 'Termine o dia dentro da meta de kcal (±10%)', xp: () => 110, ouro: () => 20, prog: (s, D, q, ctx) => (ctx && ctx.faixa === 'banquete' ? 1 : 0) },
  { id: 'habito', pilar: 'alma', vals: [1], needHab: true, txt: () => 'Cumpra um hábito pessoal', xp: () => 55, ouro: () => 10, prog: (s, D) => Object.values(D.hab || {}).filter(Boolean).length },
];

// ---------- Eventos aleatórios do dia ----------
export const EVENTOS = [
  { id: 'forja_ardente', tipo: 'buff', icone: '🔥', nome: 'Forja Ardente', txt: 'As brasas estão vivas hoje: treino rende +25% de XP e PR vale o dobro.', mod: { treinoXp: 1.25, prXp: 2 } },
  { id: 'fonte_arcana', tipo: 'buff', icone: '🔮', nome: 'Fonte Arcana', txt: 'A biblioteca brilha. Estudo rende +50% de XP hoje.', mod: { estudoXp: 1.5 } },
  { id: 'vento_favor', tipo: 'buff', icone: '🌬️', nome: 'Vento a Favor', txt: 'Um vento empurra suas costas. Aeróbico rende +50% de XP hoje.', mod: { aeroXp: 1.5 } },
  { id: 'mercador', tipo: 'buff', icone: '🎪', nome: 'Caravana do Quinzinho', txt: 'Preços da loja com 25% de desconto e estoque raro hoje.', mod: { loja: 0.75 } },
  { id: 'banquete_real', tipo: 'buff', icone: '🍖', nome: 'Hospitalidade da Taverna', txt: 'Dona Tavi aceita uma margem maior: ±15% da meta vale como Banquete hoje.', mod: { tolera: 0.15 } },
  { id: 'eclipse', tipo: 'buff', ruim: true, icone: '🌑', nome: 'Eclipse da Inércia', txt: 'O sol some. XP geral −15%, mas baús saem com +3 no d20. Risco e recompensa.', mod: { xp: 0.85, lootBonus: 3 } },
  { id: 'emboscada', tipo: 'desafio', icone: '🗡️', nome: 'Emboscada de Goblins', txt: 'Goblins cercam a vila! Faça 20 min de aeróbico hoje para repeli-los.', meta: { tipo: 'cardio', alvo: 20 }, ok: { loot: 3, moral: 3 }, falha: { tochas: -1, inercia: 1, moral: -3 } },
  { id: 'cerco', tipo: 'desafio', icone: '📜', nome: 'Cerco dos Livros', txt: 'Um espírito inquieto na biblioteca exige 60 min de estudo hoje.', meta: { tipo: 'estudo', alvo: 60 }, ok: { loot: 3, xp: 80 }, falha: { inercia: 1 } },
  { id: 'forja_tarefa', tipo: 'desafio', icone: '⚒️', nome: 'Encomenda da Forja', txt: 'Mestre Ferrão precisa de 6 séries pontuáveis até a noite.', meta: { tipo: 'series', alvo: 6 }, ok: { loot: 2, ouro: 40 }, falha: { moral: -3, inercia: 1 } },
  { id: 'caravana', tipo: 'desafio', icone: '🥘', nome: 'Caravana Faminta', txt: 'Alimente a caravana: registre 3 refeições no livro da Taverna.', meta: { tipo: 'refeicoes', alvo: 3 }, ok: { loot: 2, ouro: 30 }, falha: { moral: -2 } },
  { id: 'viajante', tipo: 'escolha', icone: '🧳', nome: 'Viajante Cansado', txt: 'Um viajante pede 25 de ouro para chegar à próxima vila.',
    opcoes: [{ t: 'Ajudar (−25 ouro)', ef: { ouro: -25, moral: 5, loot: 2 }, r: 'Ele agradece e deixa algo na sua mochila.' }, { t: 'Ignorar', ef: { inercia: 1 }, r: 'Ele segue só. Você sente um peso.' }] },
  { id: 'altar', tipo: 'escolha', icone: '⛩️', nome: 'Altar da Brasa', txt: 'Um altar antigo aceita uma oferenda de uma Tocha em troca de uma bênção.',
    opcoes: [{ t: 'Oferecer 1 Tocha', ef: { tochas: -1, xp: 120, inercia: -1 }, r: 'A brasa do altar brilha e você sente a energia subir.' }, { t: 'Passar reto', ef: {}, r: 'O altar fica em silêncio.' }] },
  { id: 'encapuzado', tipo: 'escolha', icone: '🕵️', nome: 'O Encapuzado', txt: 'Um estranho oferece 200 XP agora, mas a Inércia vai se aproximar.',
    opcoes: [{ t: 'Aceitar o trato', ef: { xp: 200, inercia: 2, moral: -3 }, r: 'Ele sorri de um jeito que lembra o Rei.' }, { t: 'Recusar', ef: { moral: 3 }, r: 'Ele some entre as sombras.' }] },
  { id: 'bau_trancado', tipo: 'escolha', icone: '🧰', nome: 'Baú Trancado', txt: 'Um baú pesado. A chave custa 50 de ouro; o conteúdo é incerto.',
    opcoes: [{ t: 'Pagar 50 e abrir', ef: { ouro: -50, loot: 4 }, r: 'A fechadura cede.' }, { t: 'Deixar de lado', ef: {}, r: 'Você segue seu caminho.' }] },
];

// ---------- Conquistas ----------
const nivelTier = (s, g) => s._tiers ? s._tiers[g] || 0 : 0;
export const CONQUISTAS = [
  { id: 'primeira_serie', nome: 'Primeira Série', desc: 'Registre sua primeira série.', ok: (s) => s.stats.series >= 1, rec: { ouro: 20 } },
  { id: 'series_100', nome: 'Centurião de Ferro', desc: '100 séries registradas.', ok: (s) => s.stats.series >= 100, rec: { ouro: 100, xp: 100 } },
  { id: 'series_500', nome: 'Lenda da Arena', desc: '500 séries registradas.', ok: (s) => s.stats.series >= 500, rec: { ouro: 300, xp: 400 } },
  { id: 'primeiro_pr', nome: 'Quebra-Recordes', desc: 'Bata seu primeiro PR (depois do registro inicial).', ok: (s) => s.stats.prs >= 1, rec: { ouro: 40, xp: 60 } },
  { id: 'pr_10', nome: 'Máquina de PR', desc: '10 PRs batidos.', ok: (s) => s.stats.prs >= 10, rec: { ouro: 120, xp: 200 } },
  { id: 'pr_50', nome: 'Rompe-Limites', desc: '50 PRs batidos.', ok: (s) => s.stats.prs >= 50, rec: { ouro: 400, xp: 800 } },
  { id: 'tier_soldado', nome: 'Soldado', desc: 'Chegue ao tier Soldado em qualquer exercício.', ok: (s) => Math.max(0, ...Object.values(s._tiers || {})) >= 2, rec: { ouro: 60 } },
  { id: 'tier_campeao', nome: 'Campeão', desc: 'Chegue ao tier Campeão em qualquer exercício.', ok: (s) => Math.max(0, ...Object.values(s._tiers || {})) >= 4, rec: { ouro: 200, xp: 300 } },
  { id: 'tier_lenda', nome: 'Lenda Viva', desc: 'Chegue ao tier Lenda em qualquer exercício.', ok: (s) => Math.max(0, ...Object.values(s._tiers || {})) >= 8, rec: { ouro: 1000, xp: 2000 } },
  { id: 'seis_ranks', nome: 'Seis Pilares', desc: 'Tenha PR registrado nos 6 exercícios pontuáveis.', ok: (s) => ['supino', 'terra', 'agachamento', 'barra', 'remada', 'ombros'].every((g) => (s._tiers || {})[g] !== undefined), rec: { ouro: 150, xp: 250 } },
  { id: 'cardio_60', nome: 'Primeira Hora', desc: '60 min de aeróbico acumulados.', ok: (s) => s.stats.cardioMin >= 60, rec: { ouro: 20 } },
  { id: 'cardio_600', nome: 'Dez Horas de Vento', desc: '600 min de aeróbico acumulados.', ok: (s) => s.stats.cardioMin >= 600, rec: { ouro: 120, xp: 150 } },
  { id: 'cardio_3000', nome: 'Maratonista', desc: '3000 min de aeróbico acumulados.', ok: (s) => s.stats.cardioMin >= 3000, rec: { ouro: 500, xp: 700 } },
  { id: 'cardio_var', nome: 'Multiesportista', desc: 'Pratique 5 aeróbicos diferentes.', ok: (s) => Object.keys(s.stats.aeroTipos || {}).length >= 5, rec: { ouro: 80, xp: 100 } },
  { id: 'estudo_10h', nome: 'Aprendiz', desc: '10 horas de estudo.', ok: (s) => s.stats.estudoMin >= 600, rec: { ouro: 30 } },
  { id: 'estudo_100h', nome: 'Estudioso', desc: '100 horas de estudo.', ok: (s) => s.stats.estudoMin >= 6000, rec: { ouro: 200, xp: 300 } },
  { id: 'estudo_500h', nome: 'Erudito', desc: '500 horas de estudo.', ok: (s) => s.stats.estudoMin >= 30000, rec: { ouro: 800, xp: 1200 } },
  { id: 'pomo_25', nome: 'Foco Absoluto', desc: '25 Pomodoros completos.', ok: (s) => s.stats.pomos >= 25, rec: { ouro: 100, xp: 150 } },
  { id: 'seq_3', nome: 'Três Dias', desc: 'Sequência de 3 dias.', ok: (s) => s.sequencia.melhor >= 3, rec: { ouro: 25 } },
  { id: 'seq_7', nome: 'Semana de Fogo', desc: 'Sequência de 7 dias.', ok: (s) => s.sequencia.melhor >= 7, rec: { ouro: 80, xp: 120, cap: 'vermelha' } },
  { id: 'seq_30', nome: 'Mês de Ferro', desc: 'Sequência de 30 dias.', ok: (s) => s.sequencia.melhor >= 30, rec: { ouro: 400, xp: 600, cap: 'dourada' } },
  { id: 'seq_100', nome: 'Centena', desc: 'Sequência de 100 dias.', ok: (s) => s.sequencia.melhor >= 100, rec: { ouro: 1500, xp: 2500, cap: 'arcoiris' } },
  { id: 'nivel_5', nome: 'Nível 5', desc: 'Alcance o nível 5.', ok: (s) => s.heroi.nivel >= 5, rec: { ouro: 100, cap: 'azul' } },
  { id: 'nivel_10', nome: 'Nível 10', desc: 'Alcance o nível 10.', ok: (s) => s.heroi.nivel >= 10, rec: { ouro: 300, cap: 'roxa' } },
  { id: 'nivel_15', nome: 'Nível 15', desc: 'Alcance o nível 15.', ok: (s) => s.heroi.nivel >= 15, rec: { ouro: 700 } },
  { id: 'nivel_20', nome: 'Nível 20', desc: 'Alcance o nível 20.', ok: (s) => s.heroi.nivel >= 20, rec: { ouro: 2000, cap: 'estelar' } },
  { id: 'perfeito_1', nome: 'Dia Perfeito', desc: 'Complete as 3 missões do dia.', ok: (s) => s.stats.perfeitos >= 1, rec: { ouro: 40, xp: 60 } },
  { id: 'perfeito_10', nome: 'Dez Dias Perfeitos', desc: '10 dias perfeitos.', ok: (s) => s.stats.perfeitos >= 10, rec: { ouro: 300, xp: 400 } },
  { id: 'triplice', nome: 'Tríplice Coroa', desc: 'Faça Corpo, Mente e Alma no mesmo dia.', ok: (s) => s.stats.triplices >= 1, rec: { ouro: 60, xp: 100 } },
  { id: 'banquete_1', nome: 'Banquete de Herói', desc: 'Um dia de nutrição dentro da meta.', ok: (s) => s.stats.banquetes >= 1, rec: { ouro: 30 } },
  { id: 'banquete_14', nome: 'Mesa Equilibrada', desc: '14 dias de nutrição dentro da meta.', ok: (s) => s.stats.banquetes >= 14, rec: { ouro: 300, xp: 400 } },
  { id: 'cap_1', nome: 'Primeira Brasa', desc: 'Conclua o capítulo 1.', ok: (s) => s.historia.limpos.length >= 1, rec: { ouro: 50 } },
  { id: 'cap_5', nome: 'Caminhante de Ferro', desc: 'Conclua o capítulo 5.', ok: (s) => s.historia.limpos.length >= 5, rec: { ouro: 150 } },
  { id: 'cap_10', nome: 'Quebrador de Correntes', desc: 'Conclua o capítulo 10.', ok: (s) => s.historia.limpos.length >= 10, rec: { ouro: 400 } },
  { id: 'cap_20', nome: 'Flagelo da Inércia', desc: 'Conclua a campanha.', ok: (s) => s.historia.limpos.length >= 20, rec: { ouro: 3000, cap: 'estelar' } },
  { id: 'abate_100', nome: 'Caçador', desc: '100 inimigos derrotados.', ok: (s) => s.stats.abates >= 100, rec: { ouro: 120 } },
  { id: 'andar_10', nome: 'Descida Profunda', desc: 'Chegue ao andar 10 das Catacumbas.', ok: (s) => (s.catacumbas.melhor || 0) >= 10, rec: { ouro: 250, xp: 200 } },
  { id: 'volta', nome: 'Retorno do Herói', desc: 'Volte a treinar depois de 3+ dias parado.', ok: (s) => s.stats.voltas >= 1, rec: { ouro: 60, xp: 150 } },
  { id: 'ouro_5k', nome: 'Cofre Cheio', desc: 'Acumule 5.000 de ouro.', ok: (s) => s.stats.ouroTotal >= 5000, rec: { xp: 300 } },
];

export const CAPAS = {
  padrao: { nome: 'Padrão', c: '#8a3a3a', C: '#5a2020' }, vermelha: { nome: 'Vermelha de Fogo', c: '#e0302a', C: '#8a1410' },
  dourada: { nome: 'Dourada', c: '#f0c030', C: '#a07810' }, azul: { nome: 'Azul Real', c: '#3a6ae0', C: '#1a3a90' },
  roxa: { nome: 'Roxa Arcana', c: '#9a4ae0', C: '#5a1a90' }, arcoiris: { nome: 'Arco-íris', c: '#ff7ac0', C: '#7a2aa0' },
  estelar: { nome: 'Estelar', c: '#7af0e0', C: '#2a8a9a' },
};

export function itemNome(id) { const i = ITENS[id]; return i ? i.nome : id; }
