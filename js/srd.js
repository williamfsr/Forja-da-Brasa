import { MONSTROS_SRD } from './dados/monstros_srd.js';
import { aplicarPrecos } from './economia.js';
import { ITENS_SRD } from './dados/itens_srd.js';
// Dados de regras baseados no SRD 5.1 (CC-BY-4.0, Wizards of the Coast) com a terminologia pt-BR
// do módulo "Translation: Português (Brasil) [D&D 5E](SRD)". Valores adaptados para o jogo solo.

export const ATRIBUTOS = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
export const ATR_NOME = { FOR: 'Força', DES: 'Destreza', CON: 'Constituição', INT: 'Inteligência', SAB: 'Sabedoria', CAR: 'Carisma' };

// ---------- Tabelas de espaços de magia (SRD) ----------
export const SLOTS_CHEIO = [
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
];
export const SLOTS_MEIO = [
  [], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2],
  [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2],
];

// ---------- Classes jogáveis ----------
// arm: 0 nenhuma, 1 leve, 2 média, 3 pesada | atr: atributo de conjuração
export const CLASSES = {
  guerreiro: {
    id: 'guerreiro', nome: 'Guerreiro', dado: 10, prim: 'FOR', sec: 'CON', emoji: '⚔️', arm: 3, escudo: true, conj: null,
    cores: { t: '#b8352e', T: '#7a1f1a', h: '#5a3a1e' },
    resumo: 'Mestre de armas. Mais ataques por turno e Surtos de Ação. Fica forte com Supino e Terra.',
    recurso: 'Surtos de Ação e Retomar o Fôlego',
    inicio: { arma: 'espadaLonga', armadura: 'cotaMalha', escudo: 'escudo' },
    feats: [[1, 'Retomar o Fôlego', 'Ação bônus: cura 1d10 + nível.'], [2, 'Surto de Ação', 'Faça um conjunto extra de ataques no mesmo turno.'],
      [3, 'Campeão: Crítico Aprimorado', 'Crítico com 19–20 no d20.'], [5, 'Ataque Extra', '2 ataques por ação.'], [9, 'Indomável', 'Repete uma salvaguarda falha.'],
      [11, 'Ataque Extra (2)', '3 ataques por ação.'], [15, 'Crítico Superior', 'Crítico com 18–20.'], [17, 'Surto de Ação (2 usos)', 'Dois Surtos por dia.'], [20, 'Ataque Extra (3)', '4 ataques por ação.']],
  },
  barbaro: {
    id: 'barbaro', nome: 'Bárbaro', dado: 12, prim: 'FOR', sec: 'CON', emoji: '🪓', arm: 2, escudo: true, conj: null,
    cores: { t: '#a8561f', T: '#6b3410', h: '#2b1a10' },
    resumo: 'Fúria bruta: dano extra e resistência a golpes. Aguenta muito. Cresce com Força e Constituição.',
    recurso: 'Usos de Fúria',
    inicio: { arma: 'machadoGrande', armadura: 'couro', escudo: null },
    feats: [[1, 'Fúria', 'Ação bônus: +dano e resistência a dano físico.'], [1, 'Defesa sem Armadura', 'Sem armadura: CA 10 + DES + CON.'], [2, 'Ataque Descuidado', 'Vantagem nos ataques; inimigos também.'],
      [3, 'Berserker: Frenesi', 'Em Fúria, um ataque extra por turno.'], [5, 'Ataque Extra', '2 ataques por ação.'], [9, 'Crítico Brutal', 'Dados extras nos críticos.'], [11, 'Fúria Implacável', 'Ao cair a 0 PV na Fúria, teste de CON para ficar em pé.'],
      [15, 'Fúria Persistente', 'A Fúria só termina quando você quiser.'], [20, 'Campeão Primitivo', 'FOR e CON +4.']],
  },
  ladino: {
    id: 'ladino', nome: 'Ladino', dado: 8, prim: 'DES', sec: 'CON', emoji: '🗡️', arm: 1, escudo: false, conj: null,
    cores: { t: '#3a3f4a', T: '#1f2229', h: '#c9a24a' },
    resumo: 'Golpes furtivos devastadores. Depende de Destreza: Barra/Puxada e Remada.',
    recurso: 'Ação Ardilosa (Ardis)',
    inicio: { arma: 'rapieira', armadura: 'couro', escudo: null },
    feats: [[1, 'Ataque Furtivo', 'Dano extra (nível/2 × d6) com vantagem ou na surpresa.'], [2, 'Ação Ardilosa', 'Ação bônus: esconder-se e ganhar vantagem (usa Ardis).'], [5, 'Esquiva Sobrenatural', 'Reduz à metade o primeiro golpe de cada rodada.'],
      [7, 'Evasão', 'Salvaguarda de DES bem-sucedida: sem dano.'], [9, 'Ladrão: Supremo Furtivo', 'Primeiro ataque do combate sempre é furtivo.'], [14, 'Sentido Cego', 'Inimigos nunca têm vantagem sobre você ao agir.'],
      [18, 'Elusivo', 'Nenhum ataque tem vantagem contra você.'], [20, 'Golpe de Sorte', 'Transforma um erro em acerto, 1× por dia.']],
  },
  mago: {
    id: 'mago', nome: 'Mago', dado: 6, prim: 'INT', sec: 'CON', emoji: '🔮', arm: 0, escudo: false, conj: 'INT',
    cores: { t: '#3a5fb8', T: '#223a78', h: '#d8d8e8' },
    resumo: 'Conjurador arcano. Poder vem de Inteligência: horas de estudo. Espaços de magia dependem da alimentação.',
    recurso: 'Espaços de Magia',
    inicio: { arma: 'cajado', armadura: null, escudo: null },
    feats: [[1, 'Conjuração', 'Truques à vontade; magias gastam espaços.'], [1, 'Armadura Arcana', 'Sem armadura: CA = 13 + DES.'], [1, 'Recuperação Arcana', 'Recupera espaços (soma ≤ metade do nível) 1×/dia em combate.'], [2, 'Escola de Evocação', 'Magias de dano em área; salvaguarda bem-sucedida poupa metade.'],
      [6, 'Truque Potente', 'Truques que erram ainda causam metade do dano.'], [10, 'Evocação Potencializada', 'Soma INT ao dano de magias de evocação.'], [14, 'Sobrecarga', 'Máximo de dano em uma magia 1×/dia.'], [20, 'Assinatura Mágica', 'Mísseis/Bola de Fogo sem custo 1×/dia.']],
  },
  clerigo: {
    id: 'clerigo', nome: 'Clérigo', dado: 8, prim: 'SAB', sec: 'CON', emoji: '✨', arm: 2, escudo: true, conj: 'SAB',
    cores: { t: '#e8e0c8', T: '#a89c6a', h: '#8a5a2a' },
    resumo: 'Cura e dano sagrado. Poder vem de Sabedoria: constância (dias ativos e disciplina).',
    recurso: 'Espaços de Magia e Canalizar Divindade',
    inicio: { arma: 'maca', armadura: 'camisaoMalha', escudo: 'escudo' },
    feats: [[1, 'Conjuração', 'Truques à vontade; magias gastam espaços.'], [1, 'Discípulo da Vida', 'Curas rendem +2 + nível da magia.'], [2, 'Canalizar Divindade', 'Expulsar Mortos-Vivos e Preservar a Vida.'],
      [5, 'Destruir Mortos-Vivos', 'Mortos-vivos fracos são destruídos ao expulsar.'], [8, 'Golpes Divinos', 'Armas causam +1d8 radiante.'], [17, 'Cura Suprema', 'Dados de cura saem no máximo.']],
  },
  paladino: {
    id: 'paladino', nome: 'Paladino', dado: 10, prim: 'FOR', sec: 'CAR', emoji: '🛡️', arm: 3, escudo: true, conj: 'CAR',
    cores: { t: '#d8b43a', T: '#8a6d12', h: '#4a2e18' },
    resumo: 'Guerreiro sagrado. Cura pelas Mãos e Destruição Divina. Beneficia-se de Força e Ombros (Carisma).',
    recurso: 'Espaços de Magia, Cura pelas Mãos',
    inicio: { arma: 'espadaLonga', armadura: 'camisaoMalha', escudo: 'escudo' },
    feats: [[1, 'Cura pelas Mãos', 'Reserva de 5 × nível de PV curados.'], [2, 'Destruição Divina', 'Gaste um espaço: +2d8 radiante por acerto.'], [2, 'Estilo de Luta: Duelismo', '+2 de dano com arma em uma mão.'],
      [3, 'Saúde Divina', 'Imune a veneno comum.'], [5, 'Ataque Extra', '2 ataques por ação.'], [6, 'Aura de Proteção', 'Soma CAR às suas salvaguardas.'], [11, 'Destruição Divina Aprimorada', '+1d8 radiante em todo acerto.'], [14, 'Toque Purificador', 'Remove 1 nível de Exaustão em combate.']],
  },
};

// ---------- Recursos diários por classe/nível ----------
export function recursosMax(clsId, L) {
  const c = CLASSES[clsId];
  const r = { slots: [], cont: {} };
  if (clsId === 'mago' || clsId === 'clerigo') r.slots = [...SLOTS_CHEIO[L - 1]];
  if (clsId === 'paladino') r.slots = [...SLOTS_MEIO[L - 1]];
  if (clsId === 'guerreiro') r.cont = { folego: 2, surto: L >= 17 ? 2 : L >= 2 ? 1 : 0, indomavel: L >= 17 ? 3 : L >= 13 ? 2 : L >= 9 ? 1 : 0 };
  if (clsId === 'barbaro') r.cont = { furia: [2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 99][L - 1] };
  if (clsId === 'ladino') r.cont = { ardil: 3 + L, sorte: L >= 20 ? 1 : 0 };
  if (clsId === 'mago') r.cont = { recup: 1, assinatura: L >= 20 ? 1 : 0 };
  if (clsId === 'clerigo') r.cont = { canal: L >= 18 ? 3 : L >= 6 ? 2 : L >= 2 ? 1 : 0 };
  if (clsId === 'paladino') r.cont = { maos: 5 * L, canal: L >= 3 ? 1 : 0 };
  return r;
}
// aplica fator de restauração (nutrição) a um máximo
export function recursosComFator(max, f) {
  const slots = max.slots.map((n, i) => (i === 0 && n > 0 && f >= 0.5 ? Math.max(1, Math.floor(n * f)) : Math.floor(n * f)));
  const cont = {};
  for (const [k, v] of Object.entries(max.cont)) {
    cont[k] = v >= 99 ? 99 : k === 'maos' ? Math.floor(v * f) : v > 0 && f >= 0.5 ? Math.max(1, Math.floor(v * f)) : Math.floor(v * f);
  }
  return { slots, cont };
}

// ---------- Dados ----------
export function rolar(expr, rng = Math.random, crit = false) {
  // aceita "2d6+1d4+3"; crit dobra os dados
  let total = 0; const partes = [];
  const re = /([+-]?)\s*(\d+)(?:d(\d+))?/g; let m;
  while ((m = re.exec(expr))) {
    const sinal = m[1] === '-' ? -1 : 1;
    if (m[3]) {
      const n = parseInt(m[2]) * (crit ? 2 : 1), f = parseInt(m[3]);
      for (let i = 0; i < n; i++) { const v = 1 + Math.floor(rng() * f); total += sinal * v; partes.push(v); }
    } else total += sinal * parseInt(m[2]);
  }
  return { total, partes };
}
export const d20 = (rng = Math.random) => 1 + Math.floor(rng() * 20);
export const media = (expr) => { let t = 0; const re = /([+-]?)\s*(\d+)(?:d(\d+))?/g; let m; while ((m = re.exec(expr))) { const s = m[1] === '-' ? -1 : 1; t += s * (m[3] ? parseInt(m[2]) * (parseInt(m[3]) + 1) / 2 : parseInt(m[2])); } return t; };

// ---------- Magias (nomes pt-BR do SRD) ----------
// tipo: atq (jogada de ataque), salva, auto, cura, sono, buff, matar
export const MAGIAS = {
  raio_fogo: { nome: 'Raio de Fogo', nv: 0, tipo: 'atq', dado: '1d10', dano: 'fogo', cls: ['mago'], desc: 'Truque. Dano escala nos níveis 5, 11 e 17.' },
  raio_gelo: { nome: 'Raio de Gelo', nv: 0, tipo: 'atq', dado: '1d8', dano: 'gelo', cls: ['mago'], desc: 'Truque. Reduz a precisão do alvo.', efeito: 'lento' },
  chama_sagrada: { nome: 'Chama Sagrada', nv: 0, tipo: 'salva', atr: 'DES', dado: '1d8', dano: 'radiante', metade: false, cls: ['clerigo'], desc: 'Truque. Alvo evita com salvaguarda de DES.' },
  misseis: { nome: 'Mísseis Mágicos', nv: 1, tipo: 'auto', dardos: 3, dado: '1d4+1', dano: 'energia', cls: ['mago'], desc: '3 dardos que nunca erram (+1 por círculo).' },
  maos_flam: { nome: 'Mãos Flamejantes', nv: 1, tipo: 'salva', atr: 'DES', dado: '3d6', up: '1d6', dano: 'fogo', metade: true, cls: ['mago'], desc: 'Leque de chamas, DES para metade.' },
  sono: { nome: 'Sono', nv: 1, tipo: 'sono', dado: '5d8', up: '2d8', cls: ['mago'], desc: 'Dorme criaturas com PV atuais abaixo do total rolado.' },
  raio_ardente: { nome: 'Raio Ardente', nv: 2, tipo: 'atq', raios: 3, dado: '2d6', dano: 'fogo', cls: ['mago'], desc: '3 raios (+1 por círculo).' },
  flecha_acida: { nome: 'Flecha Ácida', nv: 2, tipo: 'atq', dado: '4d4', up: '1d4', dano: 'ácido', cls: ['mago'], desc: 'Ataque à distância ácido.' },
  bola_fogo: { nome: 'Bola de Fogo', nv: 3, tipo: 'salva', atr: 'DES', dado: '8d6', up: '1d6', dano: 'fogo', metade: true, cls: ['mago'], desc: 'Explosão de fogo.' },
  relampago: { nome: 'Relâmpago', nv: 3, tipo: 'salva', atr: 'DES', dado: '8d6', up: '1d6', dano: 'elétrico', metade: true, cls: ['mago'], desc: 'Linha de eletricidade.' },
  tempestade_glacial: { nome: 'Tempestade Glacial', nv: 4, tipo: 'salva', atr: 'DES', dado: '2d8+4d6', up: '1d8', dano: 'gelo', metade: true, cls: ['mago'], desc: 'Granizo e gelo.' },
  malogro: { nome: 'Malogro', nv: 4, tipo: 'salva', atr: 'CON', dado: '8d8', up: '1d8', dano: 'necrótico', metade: true, cls: ['mago'], desc: 'Drena a vitalidade do alvo.' },
  cone_frio: { nome: 'Cone de Frio', nv: 5, tipo: 'salva', atr: 'CON', dado: '8d8', up: '1d8', dano: 'gelo', metade: true, cls: ['mago'], desc: 'Rajada glacial.' },
  nevoa_mortal: { nome: 'Névoa Mortal', nv: 5, tipo: 'salva', atr: 'CON', dado: '5d8', up: '1d8', dano: 'veneno', metade: true, cls: ['mago'], desc: 'Nuvem venenosa.' },
  corrente: { nome: 'Corrente de Relâmpagos', nv: 6, tipo: 'salva', atr: 'DES', dado: '10d8', up: '1d8', dano: 'elétrico', metade: true, cls: ['mago'], desc: 'Arco elétrico devastador.' },
  desintegrar: { nome: 'Desintegrar', nv: 6, tipo: 'salva', atr: 'DES', dado: '10d6+40', up: '3d6', dano: 'energia', metade: false, cls: ['mago'], desc: 'Raio verde. Sucesso na salvaguarda anula.' },
  dedo_morte: { nome: 'Dedo da Morte', nv: 7, tipo: 'salva', atr: 'CON', dado: '7d8+30', dano: 'necrótico', metade: true, cls: ['mago'], desc: 'Dano necrótico massivo.' },
  explosao_solar: { nome: 'Explosão Solar', nv: 8, tipo: 'salva', atr: 'CON', dado: '12d6', dano: 'radiante', metade: true, cls: ['mago', 'clerigo'], desc: 'Luz solar abrasadora.' },
  chuva_meteoros: { nome: 'Chuva de Meteoros', nv: 9, tipo: 'salva', atr: 'DES', dado: '20d6+20d6', dano: 'fogo', metade: true, cls: ['mago'], desc: 'Esferas de fogo caem do céu.' },
  palavra_matar: { nome: 'Palavra de Poder: Matar', nv: 9, tipo: 'matar', limite: 100, cls: ['mago'], desc: 'Mata alvo com 100 PV ou menos.' },
  // Encantamento e diplomacia (usadas em combates com inimigos racionais)
  encantar: { nome: 'Enfeitiçar Pessoa', nv: 1, tipo: 'encanto', cls: ['mago'], desc: 'Um humanoide (SAB) passa a lutar ao seu lado até ser ferido por você. Falha o teste = ele só fica furioso.' },
  acalmar: { nome: 'Acalmar Emoções', nv: 2, tipo: 'acalmar', cls: ['clerigo'], desc: 'Área: quem falhar em CAR baixa as armas por 3 rodadas e fica mais aberto à conversa.' },
  medo: { nome: 'Medo', nv: 3, tipo: 'medo', cls: ['mago'], desc: 'Cone: quem falhar em SAB foge aterrorizado por 3 rodadas.' },
  dominar: { nome: 'Dominar Pessoa', nv: 5, tipo: 'encanto', cls: ['mago'], desc: 'Um humanoide (SAB) é dominado e vira seu companheiro permanente.' },
  // Clérigo / Paladino
  curar: { nome: 'Curar Ferimentos', nv: 1, tipo: 'cura', dado: '1d8', up: '1d8', cls: ['clerigo', 'paladino'], desc: 'Cura 1d8 + modificador.' },
  palavra_cur: { nome: 'Palavra Curativa', nv: 1, tipo: 'cura', dado: '1d4', up: '1d4', bonus: true, cls: ['clerigo'], desc: 'Ação bônus: cura 1d4 + modificador.' },
  raio_guia: { nome: 'Raio Guia', nv: 1, tipo: 'atq', dado: '4d6', up: '1d6', dano: 'radiante', cls: ['clerigo'], efeito: 'guiado', desc: 'Seu próximo ataque tem vantagem.' },
  bencao: { nome: 'Bênção', nv: 1, tipo: 'buff', buff: 'bencao', cls: ['clerigo', 'paladino'], desc: '+1d4 em ataques e salvaguardas no combate.' },
  infligir: { nome: 'Infligir Ferimentos', nv: 1, tipo: 'atq', dado: '3d10', up: '1d10', dano: 'necrótico', cls: ['clerigo'], desc: 'Toque necrótico.' },
  favor: { nome: 'Favor Divino', nv: 1, tipo: 'buff', buff: 'favor', bonus: true, cls: ['paladino'], desc: 'Ação bônus: armas causam +1d4 radiante no combate.' },
  arma_esp: { nome: 'Arma Espiritual', nv: 2, tipo: 'buff', buff: 'armaEsp', bonus: true, cls: ['clerigo'], desc: 'Uma arma espectral ataca todo turno.' },
  guardioes: { nome: 'Guardiões Espirituais', nv: 3, tipo: 'buff', buff: 'guardioes', cls: ['clerigo'], desc: 'Espíritos ferem o inimigo a cada rodada.' },
  coluna_chamas: { nome: 'Coluna de Chamas', nv: 5, tipo: 'salva', atr: 'DES', dado: '4d6+4d6', up: '1d6', dano: 'fogo', metade: true, cls: ['clerigo'], desc: 'Fogo divino.' },
  cura_massa: { nome: 'Curar Ferimentos em Massa', nv: 5, tipo: 'cura', dado: '3d8', up: '1d8', cls: ['clerigo'], desc: 'Cura potente.' },
  cura_completa: { nome: 'Cura Completa', nv: 6, tipo: 'cura', dado: '70', cls: ['clerigo'], desc: 'Cura 70 PV.' },
  raio_solar: { nome: 'Raio Solar', nv: 6, tipo: 'salva', atr: 'CON', dado: '6d8', dano: 'radiante', metade: true, cls: ['clerigo'], desc: 'Feixe de luz do sol.' },
  tempestade_fogo: { nome: 'Tempestade de Fogo', nv: 7, tipo: 'salva', atr: 'DES', dado: '7d10', dano: 'fogo', metade: true, cls: ['clerigo'], desc: 'Fogo caindo do céu.' },
  cura_total: { nome: 'Cura em Massa', nv: 9, tipo: 'cura', dado: '120', cls: ['clerigo'], desc: 'Cura 120 PV.' },
};

// ---------- Equipamento (nomes pt-BR do SRD) ----------
// arma: dado, acu (acuidade), dist (distância), duas (duas mãos), mag (+bônus)
const ARMAS_BASE = [
  ['cajado', 'Bastão', '1d6', 0, 0, 0, 5], ['adaga', 'Adaga', '1d4', 1, 0, 0, 20], ['maca', 'Maça', '1d6', 0, 0, 0, 30],
  ['cimitarra', 'Cimitarra', '1d6', 1, 0, 0, 60], ['espadaCurta', 'Espada Curta', '1d6', 1, 0, 0, 50], ['machadinha', 'Machadinha', '1d6', 0, 0, 0, 25],
  ['rapieira', 'Rapieira', '1d8', 1, 0, 0, 100], ['machadoBatalha', 'Machado de Batalha', '1d8', 0, 0, 0, 100], ['martelo', 'Martelo de Guerra', '1d8', 0, 0, 0, 120],
  ['espadaLonga', 'Espada Longa', '1d8', 0, 0, 0, 150], ['arcoCurto', 'Arco Curto', '1d6', 0, 1, 0, 120], ['arcoLongo', 'Arco Longo', '1d8', 0, 1, 1, 250],
  ['espadaGrande', 'Espada Grande', '2d6', 0, 0, 1, 450], ['machadoGrande', 'Machado Grande', '1d12', 0, 0, 1, 350],
];
const ARMADURAS_BASE = [
  ['couro', 'Armadura de Couro', 11, 99, 1, 30, 'leve'], ['couroBatido', 'Armadura de Couro Batido', 12, 99, 1, 80, 'leve'],
  ['camisaoMalha', 'Cota de Malha Parcial', 13, 2, 2, 110, 'media'], ['escamas', 'Lórica de Escamas', 14, 2, 2, 180, 'media'], ['meiaPlaca', 'Armadura de Placas Parcial', 15, 2, 2, 400, 'media'],
  ['cotaMalha', 'Cota de Malha', 16, 0, 3, 300, 'pesada'], ['talas', 'Cota de Talas', 17, 0, 3, 600, 'pesada'], ['placas', 'Armadura de Placas', 18, 0, 3, 1500, 'pesada'],
];
const MAGICO = { 1: ['+1', 4, 'incomum'], 2: ['+2', 14, 'raro'], 3: ['+3', 50, 'épico'] };

export const ITENS = {};
for (const [id, nome, dado, acu, dist, duas, preco] of ARMAS_BASE) {
  ITENS[id] = { id, nome, tipo: 'arma', dado, acu: !!acu, dist: !!dist, duas: !!duas, mag: 0, preco, raro: 'comum', nvLoja: preco >= 300 ? 3 : preco >= 100 ? 2 : 1 };
  for (const k of [1, 2, 3]) {
    const [suf, mult, raro] = MAGICO[k];
    ITENS[id + '_' + k] = { id: id + '_' + k, nome: `${nome} ${suf}`, tipo: 'arma', dado, acu: !!acu, dist: !!dist, duas: !!duas, mag: k, preco: Math.max(60, preco) * mult, raro, nvLoja: k === 1 ? 5 : k === 2 ? 11 : 17 };
  }
}
for (const [id, nome, base, dexMax, arm, preco, cat] of ARMADURAS_BASE) {
  ITENS[id] = { id, nome, tipo: 'armadura', base, dexMax, arm, cat, mag: 0, preco, raro: 'comum', nvLoja: preco >= 300 ? 3 : preco >= 100 ? 2 : 1 };
  for (const k of [1, 2, 3]) {
    const [suf, mult, raro] = MAGICO[k];
    ITENS[id + '_' + k] = { id: id + '_' + k, nome: `${nome} ${suf}`, tipo: 'armadura', base, dexMax, arm, cat, mag: k, preco: Math.max(60, preco) * mult, raro, nvLoja: k === 1 ? 5 : k === 2 ? 11 : 17 };
  }
}
Object.assign(ITENS, {
  escudo: { id: 'escudo', nome: 'Escudo', tipo: 'escudo', ca: 2, mag: 0, preco: 40, raro: 'comum', nvLoja: 1 },
  escudo_1: { id: 'escudo_1', nome: 'Escudo +1', tipo: 'escudo', ca: 3, mag: 1, preco: 360, raro: 'incomum', nvLoja: 5 },
  escudo_2: { id: 'escudo_2', nome: 'Escudo +2', tipo: 'escudo', ca: 4, mag: 2, preco: 1400, raro: 'raro', nvLoja: 11 },
  escudo_3: { id: 'escudo_3', nome: 'Escudo +3', tipo: 'escudo', ca: 5, mag: 3, preco: 5000, raro: 'épico', nvLoja: 17 },
  // acessórios
  anelProt: { id: 'anelProt', nome: 'Anel de Proteção', tipo: 'acessorio', ca: 1, preco: 900, raro: 'raro', nvLoja: 8, desc: '+1 CA' },
  mantoProt: { id: 'mantoProt', nome: 'Manto de Proteção', tipo: 'acessorio', ca: 1, preco: 800, raro: 'incomum', nvLoja: 6, desc: '+1 CA' },
  braceletes: { id: 'braceletes', nome: 'Braceletes de Defesa', tipo: 'acessorio', ca: 2, semArmadura: true, preco: 1500, raro: 'raro', nvLoja: 9, desc: '+2 CA sem armadura' },
  manoplas: { id: 'manoplas', nome: 'Manoplas de Poder de Ogro', tipo: 'acessorio', minAtr: { FOR: 19 }, preco: 2200, raro: 'raro', nvLoja: 10, desc: 'FOR vira 19' },
  amuletoSaude: { id: 'amuletoSaude', nome: 'Amuleto da Saúde', tipo: 'acessorio', minAtr: { CON: 19 }, preco: 2200, raro: 'raro', nvLoja: 10, desc: 'CON vira 19' },
  tiara: { id: 'tiara', nome: 'Tiara do Intelecto', tipo: 'acessorio', minAtr: { INT: 19 }, preco: 2200, raro: 'raro', nvLoja: 10, desc: 'INT vira 19' },
  periapto: { id: 'periapto', nome: 'Periapto da Sabedoria', tipo: 'acessorio', minAtr: { SAB: 19 }, preco: 2200, raro: 'raro', nvLoja: 10, desc: 'SAB vira 19' },
  coroaCarisma: { id: 'coroaCarisma', nome: 'Diadema da Presença', tipo: 'acessorio', minAtr: { CAR: 19 }, preco: 2200, raro: 'raro', nvLoja: 10, desc: 'CAR vira 19' },
  botasVel: { id: 'botasVel', nome: 'Botas de Velocidade', tipo: 'acessorio', ini: 4, preco: 1200, raro: 'raro', nvLoja: 9, desc: '+4 iniciativa' },
  mantoElfico: { id: 'mantoElfico', nome: 'Manto do Povo Élfico', tipo: 'acessorio', ini: 2, ca: 1, preco: 1800, raro: 'épico', nvLoja: 12, desc: '+1 CA, +2 iniciativa' },
  anelRegen: { id: 'anelRegen', nome: 'Anel de Regeneração', tipo: 'acessorio', regen: 2, preco: 5000, raro: 'épico', nvLoja: 15, desc: 'Recupera 2 PV por rodada' },
  // relíquias de história
  lamina_brasa: { id: 'lamina_brasa', nome: 'Lâmina da Brasa', tipo: 'arma', dado: '1d8', acu: false, dist: false, duas: false, mag: 1, extra: { dado: '1d6', dano: 'fogo' }, preco: 0, raro: 'raro', nvLoja: 99, desc: 'Espada longa forjada na Forja Primeva.' },
  lamina_solar: { id: 'lamina_solar', nome: 'Lâmina Solar', tipo: 'arma', dado: '1d8', acu: true, dist: false, duas: false, mag: 2, extra: { dado: '1d8', dano: 'radiante' }, preco: 0, raro: 'lendário', nvLoja: 99, desc: 'Lâmina de luz do sol.' },
  simbolo_alvorecer: { id: 'simbolo_alvorecer', nome: 'Símbolo do Alvorecer', tipo: 'acessorio', ca: 1, ini: 1, regen: 2, preco: 0, raro: 'lendário', nvLoja: 99, ic: 'simbolo', desc: 'Disco de cobre que esquenta a cada manhã. +1 CA, +1 iniciativa, regenera 2 PV por rodada.' },
  diario_nhor: { id: 'diario_nhor', nome: 'Diário de Nhor', tipo: 'acessorio', ini: 3, bonusMagia: 1, preco: 0, raro: 'lendário', nvLoja: 99, ic: 'livro', desc: 'O caderno do Rei. +3 iniciativa, +1 CD/ataque de magia. Nhor-Kaal luta mais fraco diante de quem o leu.' },
  cajado_poder: { id: 'cajado_poder', nome: 'Cajado do Poder', tipo: 'arma', dado: '1d6', acu: false, dist: false, duas: false, mag: 2, bonusMagia: 2, preco: 0, raro: 'lendário', nvLoja: 99, desc: '+2 CD e ataque de magia.' },
  maca_disrupcao: { id: 'maca_disrupcao', nome: 'Maça da Disrupção', tipo: 'arma', dado: '1d6', acu: false, dist: false, duas: false, mag: 2, extra: { dado: '2d6', dano: 'radiante' }, bonusMagia: 1, preco: 0, raro: 'lendário', nvLoja: 99, desc: 'Brilha com a luz do dia.' },
  couro_lobo: { id: 'couro_lobo', nome: 'Couro do Lobo Cinzento', tipo: 'armadura', base: 12, dexMax: 99, arm: 1, cat: 'leve', mag: 1, preco: 0, raro: 'raro', nvLoja: 99, desc: 'Armadura de couro +1' },
  escama_dragao: { id: 'escama_dragao', nome: 'Lórica de Escamas de Dragão', tipo: 'armadura', base: 14, dexMax: 2, arm: 2, cat: 'media', mag: 2, resFogo: true, preco: 0, raro: 'lendário', nvLoja: 99, desc: 'Escamas +2, resistência a fogo.' },
  // consumíveis
  pocao1: { id: 'pocao1', nome: 'Poção de Cura', tipo: 'consumivel', cura: '2d4+2', preco: 50, raro: 'comum', nvLoja: 1, desc: 'Cura 2d4+2 PV.' },
  pocao2: { id: 'pocao2', nome: 'Poção de Cura Maior', tipo: 'consumivel', cura: '4d4+4', preco: 150, raro: 'incomum', nvLoja: 4, desc: 'Cura 4d4+4 PV.' },
  pocao3: { id: 'pocao3', nome: 'Poção de Cura Superior', tipo: 'consumivel', cura: '8d4+8', preco: 450, raro: 'raro', nvLoja: 9, desc: 'Cura 8d4+8 PV.' },
  pocao4: { id: 'pocao4', nome: 'Poção de Cura Suprema', tipo: 'consumivel', cura: '10d4+20', preco: 1350, raro: 'épico', nvLoja: 15, desc: 'Cura 10d4+20 PV.' },
  restaura: { id: 'restaura', nome: 'Poção de Restauração', tipo: 'consumivel', restaura: 1, preco: 220, raro: 'incomum', nvLoja: 2, desc: 'Remove 1 nível de Exaustão (fora da masmorra).' },
  fogoAlq: { id: 'fogoAlq', nome: 'Fogo de Alquimista', tipo: 'consumivel', dano: '3d6', danoTipo: 'fogo', preco: 60, raro: 'comum', nvLoja: 1, desc: 'Arremesso: 3d6 de fogo.' },
  pergBola: { id: 'pergBola', nome: 'Pergaminho: Bola de Fogo', tipo: 'consumivel', magia: 'bola_fogo', nvMagia: 3, preco: 400, raro: 'raro', nvLoja: 7, desc: 'Conjura Bola de Fogo (3º círculo).' },
  pergCura: { id: 'pergCura', nome: 'Pergaminho: Curar Ferimentos', tipo: 'consumivel', magia: 'curar', nvMagia: 2, preco: 120, raro: 'incomum', nvLoja: 3, desc: 'Conjura Curar Ferimentos (2º círculo).' },
  poFuga: { id: 'poFuga', nome: 'Pó de Fuga', tipo: 'consumivel', fuga: true, preco: 90, raro: 'comum', nvLoja: 2, desc: 'Fuga garantida (exceto chefes).' },
  escudoSeq: { id: 'escudoSeq', nome: 'Escudo de Sequência', tipo: 'consumivel', escudoSeq: true, preco: 300, raro: 'raro', nvLoja: 1, desc: 'Protege sua sequência de 1 dia perdido (usar fora da masmorra).' },
  amuletoCura: { id: 'amuletoCura', nome: 'Talismã de Inspiração', tipo: 'consumivel', insp: true, preco: 500, raro: 'raro', nvLoja: 3, desc: 'Concede Inspiração (vantagem em 1 ataque).' },
});

// ---------- Itens do SRD 5.1 (importados por tools/dados/importar_itens.py) ----------
const CAMPOS_ITEM = ['dado', 'dt', 'acu', 'dist', 'duas', 'vers', 'alc', 'thr', 'pesada', 'extra', 'contra', 'vicioso', 'cat', 'base', 'dexMax', 'arm', 'ca', 'forca', 'furtivo', 'cura', 'dano', 'danoTipo', 'alvoTp', 'ini', 'regen', 'minAtr', 'bonusMagia', 'nvMagia', 'magico'];
for (const r of ITENS_SRD) {
  if (ITENS[r.id]) continue; const it = { id: r.id, nome: r.n, en: r.en, tipo: r.tp, preco: r.p, raro: r.r, nvLoja: r.nv, peso: r.w, desc: r.d, ic: r.ic, srd: 1, mag: r.mag || 0 };
  for (const k of CAMPOS_ITEM) if (r[k] !== undefined) it[k] = r[k];
  if (it.tipo === 'arma') { it.acu = !!it.acu; it.dist = !!it.dist; it.duas = !!it.duas; }
  ITENS[r.id] = it;
}

// ---------- Monstros (SRD 5.1) ----------
// atq: [nome, bônus, dano, tipo]
const A = (n, b, d, t = 'fis') => ({ n, b, d, t });
export const MONSTROS = {
  rato: { n: 'Rato Gigante', cr: 0.125, hp: 7, ca: 12, spr: 'rato', atq: [A('Mordida', 4, '1d4+2')], tags: ['fera', 'porao', 'cripta'] },
  morcego: { n: 'Morcego Gigante', cr: 0.25, hp: 22, ca: 13, spr: 'morcego', atq: [A('Mordida', 4, '1d6+2')], tags: ['fera', 'caverna', 'cripta', 'torre'] },
  kobold: { n: 'Kobold', cr: 0.125, hp: 5, ca: 12, spr: 'goblin', pal: { g: '#c0502a', G: '#7a2a12' }, atq: [A('Adaga', 4, '1d4+2')], tags: ['humanoide', 'porao', 'caverna'] },
  goblin: { n: 'Goblin', cr: 0.25, hp: 7, ca: 15, spr: 'goblin', atq: [A('Cimitarra', 4, '1d6+2')], tags: ['humanoide', 'caverna', 'estrada'] },
  bandido: { n: 'Bandido', cr: 0.125, hp: 11, ca: 12, spr: 'humano', pal: { u: '#6a4a2a', U: '#3a2a18' }, atq: [A('Cimitarra', 3, '1d6+1')], tags: ['humanoide', 'estrada', 'torre'] },
  cultista: { n: 'Cultista', cr: 0.125, hp: 9, ca: 12, spr: 'humano', pal: { u: '#5a2a6a', U: '#2e1438' }, atq: [A('Cimitarra', 3, '1d6+1')], tags: ['humanoide', 'cripta', 'torre', 'abismo'] },
  esqueleto: { n: 'Esqueleto', cr: 0.25, hp: 13, ca: 13, spr: 'esqueleto', atq: [A('Espada Curta', 4, '1d6+2')], tags: ['morto', 'cripta', 'porao', 'cemiterio'] },
  zumbi: { n: 'Zumbi', cr: 0.25, hp: 22, ca: 8, spr: 'zumbi', atq: [A('Pancada', 3, '1d6+1')], tags: ['morto', 'cripta', 'cemiterio', 'pantano'] },
  lobo: { n: 'Lobo', cr: 0.25, hp: 11, ca: 13, spr: 'lobo', atq: [A('Mordida', 4, '2d4+2')], tags: ['fera', 'floresta', 'estrada', 'caverna'] },
  aranhaLobo: { n: 'Aranha-Lobo Gigante', cr: 0.25, hp: 11, ca: 13, spr: 'aranha', atq: [A('Mordida', 3, '1d6+1')], esp: { veneno: { dc: 11, d: '2d6' } }, tags: ['fera', 'caverna', 'floresta', 'pantano'] },
  orc: { n: 'Orc', cr: 0.5, hp: 15, ca: 13, spr: 'bruto', pal: { b: '#5a8a3a', B: '#37561f' }, atq: [A('Machado Grande', 5, '1d12+3')], tags: ['humanoide', 'estrada', 'caverna', 'torre'] },
  hobgoblin: { n: 'Hobgoblin', cr: 0.5, hp: 11, ca: 18, spr: 'goblin', pal: { g: '#b0502a', G: '#6a2a12' }, atq: [A('Espada Longa', 3, '1d8+1')], tags: ['humanoide', 'estrada', 'torre'] },
  limoCinza: { n: 'Limo Cinzento', cr: 0.5, hp: 22, ca: 8, spr: 'limo', pal: { l: '#7a8a8a', L: '#4a5a5a' }, atq: [A('Pseudópode', 3, '1d6+1', 'ácido')], tags: ['limo', 'porao', 'caverna', 'mina', 'pantano'] },
  bugurso: { n: 'Bugurso', cr: 1, hp: 27, ca: 16, spr: 'bruto', pal: { b: '#a0703a', B: '#5a3a1a' }, atq: [A('Maça-estrela', 4, '2d8+2')], tags: ['humanoide', 'caverna', 'estrada'] },
  aranha: { n: 'Aranha Gigante', cr: 1, hp: 26, ca: 14, spr: 'aranha', pal: { a: '#3a3a4a', A: '#1a1a24' }, atq: [A('Mordida', 5, '1d8+3')], esp: { veneno: { dc: 11, d: '2d8' } }, tags: ['fera', 'caverna', 'floresta', 'pantano', 'mina'] },
  carnical: { n: 'Carniçal', cr: 1, hp: 22, ca: 12, spr: 'zumbi', pal: { z: '#8a9a7a', Z: '#4a5a3a' }, atq: [A('Garras', 4, '2d4+2')], esp: { paralisa: { dc: 10 } }, tags: ['morto', 'cripta', 'cemiterio'] },
  loboAtroz: { n: 'Lobo Atroz', cr: 1, hp: 37, ca: 14, spr: 'lobo', pal: { f: '#5a5a66', F: '#2a2a34' }, atq: [A('Mordida', 5, '2d6+3')], tags: ['fera', 'floresta', 'estrada', 'caverna'] },
  harpia: { n: 'Harpia', cr: 1, hp: 38, ca: 11, spr: 'gargula', pal: { r: '#8a6a9a', R: '#4a3a5a' }, atq: [A('Garras', 3, '1d6+1'), A('Clava', 3, '1d4+1')], tags: ['monstro', 'pantano', 'torre'] },
  ogro: { n: 'Ogro', cr: 2, hp: 59, ca: 11, spr: 'bruto', pal: { b: '#b09a5a', B: '#6a5a2a' }, atq: [A('Clava Grande', 6, '2d8+4')], tags: ['gigante', 'mina', 'cemiterio', 'caverna'] },
  cuboGel: { n: 'Cubo Gelatinoso', cr: 2, hp: 84, ca: 6, spr: 'limo', pal: { l: '#7ac0d8', L: '#3a7a98' }, atq: [A('Pseudópode', 4, '3d6', 'ácido')], tags: ['limo', 'mina', 'cripta'] },
  gargula: { n: 'Gárgula', cr: 2, hp: 52, ca: 15, spr: 'gargula', atq: [A('Mordida', 4, '1d6+2'), A('Garras', 4, '1d6+2')], tags: ['monstro', 'torre', 'cripta', 'abismo'] },
  geleiaOcre: { n: 'Geleia Ocre', cr: 2, hp: 45, ca: 8, spr: 'limo', pal: { l: '#c09a3a', L: '#7a5a1a' }, atq: [A('Pseudópode', 4, '2d6+2', 'ácido')], tags: ['limo', 'mina', 'pantano', 'porao'] },
  capitaoBandido: { n: 'Bandido Capitão', cr: 2, hp: 65, ca: 15, spr: 'humano', pal: { u: '#8a2a2a', U: '#4a1414' }, atq: [A('Cimitarra', 5, '1d6+3'), A('Cimitarra', 5, '1d6+3'), A('Adaga', 5, '1d4+3')], tags: ['humanoide', 'estrada', 'torre'] },
  ursoCoruja: { n: 'Urso-coruja', cr: 3, hp: 59, ca: 13, spr: 'lobo', pal: { f: '#8a6a3a', F: '#4a3418' }, atq: [A('Bico', 7, '1d10+5'), A('Garras', 7, '2d8+5')], tags: ['fera', 'floresta', 'caverna'] },
  inumano: { n: 'Inumano', cr: 3, hp: 45, ca: 14, spr: 'esqueleto', pal: { e: '#a8a8c0', E: '#5a5a78' }, atq: [A('Espada Longa', 4, '1d8+2'), A('Espada Longa', 4, '1d8+2')], esp: { drena: true }, tags: ['morto', 'cripta', 'cemiterio'] },
  minotauro: { n: 'Minotauro', cr: 3, hp: 76, ca: 14, spr: 'bruto', pal: { b: '#7a4a2a', B: '#3a2010' }, atq: [A('Machado Grande', 6, '2d12+4')], tags: ['monstro', 'abismo', 'torre', 'mina'] },
  basilisco: { n: 'Basilisco', cr: 3, hp: 52, ca: 15, spr: 'serpe', pal: { s: '#5a7a4a', S: '#2e4a22' }, atq: [A('Mordida', 5, '2d6+3')], esp: { olhar: { dc: 12 } }, tags: ['monstro', 'pantano'] },
  mumia: { n: 'Múmia', cr: 3, hp: 58, ca: 11, spr: 'zumbi', pal: { z: '#d8cfa8', Z: '#8a8058' }, atq: [A('Punho Podre', 5, '2d6+3', 'necrótico')], tags: ['morto', 'cripta', 'cemiterio', 'deserto'] },
  mantícora: { n: 'Mantícora', cr: 3, hp: 68, ca: 14, spr: 'lobo', pal: { f: '#b0603a', F: '#6a2a14' }, atq: [A('Mordida', 5, '1d8+3'), A('Garras', 5, '1d6+3'), A('Garras', 5, '1d6+3')], tags: ['monstro', 'torre', 'abismo'] },
  caoInfernal: { n: 'Cão Infernal', cr: 3, hp: 45, ca: 15, spr: 'lobo', pal: { f: '#8a2a1a', F: '#3a0e08' }, atq: [A('Mordida', 5, '1d8+3'), A('Chamas', 5, '2d6', 'fogo')], esp: { sopro: { n: 'Sopro de Fogo', dc: 12, atr: 'DES', d: '6d6', t: 'fogo' } }, tags: ['infero', 'abismo', 'torre'] },
  ettin: { n: 'Ettin', cr: 4, hp: 85, ca: 12, spr: 'bruto', pal: { b: '#8a7a9a', B: '#4a3e5a' }, atq: [A('Machado de Batalha', 7, '2d8+5'), A('Maça-estrela', 7, '2d8+5')], tags: ['gigante', 'mina', 'cemiterio'] },
  fantasma: { n: 'Fantasma', cr: 4, hp: 45, ca: 11, spr: 'fantasma', atq: [A('Toque Enfraquecedor', 5, '4d6+3', 'necrótico')], tags: ['morto', 'cripta', 'cemiterio', 'abismo'] },
  troll: { n: 'Troll', cr: 5, hp: 84, ca: 15, spr: 'bruto', pal: { b: '#4a8a5a', B: '#1f4a2a' }, atq: [A('Mordida', 7, '1d6+4'), A('Garras', 7, '2d6+4'), A('Garras', 7, '2d6+4')], esp: { regen: 10 }, tags: ['gigante', 'caverna', 'abismo', 'pantano'] },
  aparicao: { n: 'Aparição', cr: 5, hp: 67, ca: 13, spr: 'fantasma', pal: { p: '#4a4a6a', P: '#1e1e34' }, atq: [A('Toque Drenador', 6, '4d8+3', 'necrótico')], esp: { drena: true }, tags: ['morto', 'cemiterio', 'abismo', 'cripta'] },
  criaVamp: { n: 'Cria Vampírica', cr: 5, hp: 82, ca: 15, spr: 'vampiro', atq: [A('Garras', 6, '2d4+3'), A('Mordida', 6, '1d6+3', 'necrótico')], esp: { drena: true }, tags: ['morto', 'cripta', 'torre', 'abismo'] },
  gigColina: { n: 'Gigante da Colina', cr: 5, hp: 105, ca: 13, spr: 'bruto', pal: { b: '#b08a6a', B: '#6a4a30' }, atq: [A('Clava Grande', 8, '3d8+5'), A('Clava Grande', 8, '3d8+5')], tags: ['gigante', 'cemiterio', 'mina'] },
  elemAgua: { n: 'Elemental da Água', cr: 5, hp: 114, ca: 14, spr: 'limo', pal: { l: '#3a7ad8', L: '#1a3a88' }, atq: [A('Pancada', 7, '2d8+4'), A('Pancada', 7, '2d8+4')], tags: ['elemental', 'afundada', 'pantano'] },
  serpe: { n: 'Serpe', cr: 6, hp: 110, ca: 13, spr: 'dragao', pal: { d: '#6a8a3a', D: '#34501a' }, atq: [A('Mordida', 7, '2d6+4'), A('Ferrão', 7, '2d6+4')], esp: { veneno: { dc: 15, d: '7d6' } }, tags: ['monstro', 'abismo', 'torre'] },
  quimera: { n: 'Quimera', cr: 6, hp: 114, ca: 14, spr: 'dragao', pal: { d: '#b06a3a', D: '#6a3414' }, atq: [A('Mordida', 7, '2d6+4'), A('Chifres', 7, '1d12+4'), A('Garras', 7, '2d6+4')], esp: { sopro: { n: 'Sopro de Fogo', dc: 15, atr: 'DES', d: '7d8', t: 'fogo' } }, tags: ['monstro', 'abismo', 'torre'] },
  medusa: { n: 'Medusa', cr: 6, hp: 127, ca: 15, spr: 'humano', pal: { u: '#4a8a5a', U: '#1f4a2a' }, atq: [A('Espada Curta', 5, '1d6+2'), A('Cabelo de Serpentes', 5, '1d4+2'), A('Arco Longo', 5, '1d8+2')], esp: { olhar: { dc: 14 }, veneno: { dc: 14, d: '4d6' } }, tags: ['monstro', 'afundada', 'pantano'] },
  mago: { n: 'Mago Cinzento', cr: 6, hp: 90, ca: 14, spr: 'humano', pal: { u: '#6a6a7a', U: '#34343e' }, atq: [A('Adaga', 5, '1d4+2')], esp: { sopro: { n: 'Bola de Fogo', dc: 14, atr: 'DES', d: '8d6', t: 'fogo' } }, tags: ['humanoide', 'torre'] },
  gigPedra: { n: 'Gigante da Pedra', cr: 7, hp: 126, ca: 17, spr: 'bruto', pal: { b: '#8a8a94', B: '#4a4a54' }, atq: [A('Clava Grande', 9, '3d8+6'), A('Clava Grande', 9, '3d8+6')], tags: ['gigante', 'mina', 'cemiterio'] },
  gigGelo: { n: 'Gigante do Gelo', cr: 8, hp: 138, ca: 15, spr: 'bruto', pal: { b: '#9ac0d8', B: '#4a7a98' }, atq: [A('Machado Grande', 9, '3d12+6'), A('Machado Grande', 9, '3d12+6')], tags: ['gigante', 'abismo'] },
  golemArgila: { n: 'Golem de Argila', cr: 9, hp: 133, ca: 14, spr: 'golem', pal: { g: '#b0804a', G: '#6a4a24' }, atq: [A('Pancada', 8, '2d10+5'), A('Pancada', 8, '2d10+5')], tags: ['constructo', 'mina', 'abismo'] },
  gigFogo: { n: 'Gigante do Fogo', cr: 9, hp: 162, ca: 18, spr: 'bruto', pal: { b: '#c0502a', B: '#701c0a' }, atq: [A('Espada Grande', 11, '6d6+7'), A('Espada Grande', 11, '6d6+7')], tags: ['gigante', 'abismo', 'forja'] },
  gigNuvens: { n: 'Gigante das Nuvens', cr: 9, hp: 200, ca: 14, spr: 'bruto', pal: { b: '#9a9ad8', B: '#4a4a98' }, atq: [A('Maça-estrela', 12, '3d8+8'), A('Maça-estrela', 12, '3d8+8')], tags: ['gigante', 'trono'] },
  dragaoJovem: { n: 'Dragão Vermelho Jovem', cr: 10, hp: 178, ca: 18, spr: 'dragao', pal: { d: '#c03a2a', D: '#701410' }, atq: [A('Mordida', 10, '2d10+6'), A('Garras', 10, '2d6+6'), A('Garras', 10, '2d6+6')], esp: { sopro: { n: 'Sopro de Fogo', dc: 17, atr: 'DES', d: '16d6', t: 'fogo' } }, tags: ['dragao', 'abismo', 'forja', 'trono'] },
  golemPedra: { n: 'Golem de Pedra', cr: 10, hp: 178, ca: 17, spr: 'golem', pal: { g: '#8a8a94', G: '#4a4a54' }, atq: [A('Pancada', 10, '3d8+6'), A('Pancada', 10, '3d8+6')], tags: ['constructo', 'trono', 'mina'] },
  vampiro: { n: 'Vampiro', cr: 13, hp: 144, ca: 16, spr: 'vampiro', pal: { v: '#6a1a3a', V: '#2e0a18' }, atq: [A('Garras', 9, '1d8+4'), A('Mordida', 9, '1d6+4', 'necrótico')], esp: { drena: true, regen: 20 }, tags: ['morto', 'trono', 'abismo'] },
  dragaoAdulto: { n: 'Dragão Vermelho Adulto', cr: 17, hp: 256, ca: 19, spr: 'dragao', pal: { d: '#d03a1a', D: '#6a1008' }, atq: [A('Mordida', 14, '2d10+8'), A('Garras', 14, '2d6+8'), A('Garras', 14, '2d6+8')], esp: { sopro: { n: 'Sopro de Fogo', dc: 21, atr: 'DES', d: '18d6', t: 'fogo' } }, tags: ['dragao', 'trono'] },
  reiInercia: { n: 'Nhor-Kaal, Rei da Inércia', cr: 21, hp: 330, ca: 19, spr: 'rei', atq: [A('Toque Gélido', 13, '4d8+6', 'necrótico'), A('Toque Gélido', 13, '4d8+6', 'necrótico'), A('Mão Imóvel', 13, '2d10+6', 'necrótico')], esp: { letargia: { dc: 18 }, inercia: { dc: 19, cada: 3 }, regen: 6 }, tags: ['morto', 'trono'], chefe: true },
};

// ---------- Bestiário completo do SRD 5.1 (340 criaturas, importadas por tools/dados/importar_monstros.py) ----------
const SPR_NOME = [[/spider/, 'aranha'], [/\brat\b|rats/, 'rato'], [/\bbat\b|bats/, 'morcego'], [/wolf|dog|hound|jackal|hyena|worg|panther|lion|tiger|cat\b|bear/, 'lobo'], [/skeleton/, 'esqueleto'], [/zombie|ghoul|ghast|mummy|wight/, 'zumbi'],
  [/ghost|specter|wraith|shadow|banshee|spirit|poltergeist/, 'fantasma'], [/goblin|kobold|imp\b|quasit|gnome|halfling/, 'goblin'], [/snake|serpent|naga|basilisk|wyvern|lizard|crocodile|dinosaur/, 'serpe'], [/gargoyle/, 'gargula'],
  [/golem|animated|construct|guardian|homunculus|armor/, 'golem'], [/ooze|pudding|jelly|slime|cube|blob/, 'limo'], [/dragon|wyrmling|drake/, 'dragao'], [/vampire|lich|nightmare|balor|demon|devil|fiend|vrock|hezrou|nalfeshnee|marilith|glabrezu|succubus|incubus/, 'vampiro'],
  [/orc|ogre|troll|giant|bugbear|ettin|gnoll|minotaur|hobgoblin|yeti|oni|cyclops|owlbear|rhinoceros|elephant|mammoth|ape|gorilla/, 'bruto']];
const SPR_TIPO = { humanoide: 'humano', fera: 'lobo', dragao: 'dragao', morto: 'esqueleto', limo: 'limo', infero: 'vampiro', constructo: 'golem', gigante: 'bruto', monstro: 'bruto', elemental: 'fantasma', celestial: 'humano', feerico: 'humano', planta: 'bruto', aberracao: 'limo' };
for (const [id, m] of Object.entries(MONSTROS_SRD)) {
  if (MONSTROS[id]) continue;
  const en = (m.en || '').toLowerCase(); const hit = SPR_NOME.find(([re]) => re.test(en));
  MONSTROS[id] = { ...m, id, spr: hit ? hit[1] : (SPR_TIPO[m.tp] || 'humano'), tok: id, srd: 1 };
}
aplicarPrecos(ITENS);
// Corrige chave com acento (compatibilidade)
MONSTROS.manticora = MONSTROS['mantícora']; delete MONSTROS['mantícora'];
for (const [id, m] of Object.entries(MONSTROS)) m.id = id;
