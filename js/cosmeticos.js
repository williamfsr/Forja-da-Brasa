// Dados de personalização do herói: raças do SRD, formas de rosto, cabelos, barbas, olhos, marcas, roupas, acessórios e paletas.
// Tudo é combinável: centenas de opções de estilo × cores livres = milhões de heróis diferentes.
export const HUM = ['#fbe0cb', '#f3cba5', '#e5b184', '#cf9867', '#b27a4e', '#8f5b36', '#6b4125', '#4a2b19'];
export const RACAS = {
  humano: { nome: 'Humano', emoji: '🧑', desc: 'Versáteis e ambiciosos. +1 em todos os atributos.', bonus: { FOR: 1, DES: 1, CON: 1, INT: 1, SAB: 1, CAR: 1 }, vel: 6, alt: 0, larg: 0, cab: 0, orelha: 'redonda', pele: HUM, tracos: ['Versátil: +1 em todos os atributos'] },
  elfo: { nome: 'Elfo', emoji: '🧝', desc: 'Graciosos e atentos. +2 DES, visão no escuro e vantagem contra encantos.', bonus: { DES: 2 }, vel: 6, alt: 1, larg: -2, cab: 0, orelha: 'longa', pele: ['#f7e6e0', '#f0d8c8', '#e5c3a0', '#c9a273', '#a98458', '#d8e0ee', '#7a7a9c', '#585878'], tracos: ['Visão no Escuro: +1 de alcance de visão nas masmorras', 'Ancestral Feérico: vantagem contra encantos e medo'], visao: 1, vantEnc: true },
  meioelfo: { nome: 'Meio-elfo', emoji: '🧝‍♂️', desc: 'O melhor de dois mundos. +2 CAR, +1 DES e CON, persuasivo.', bonus: { CAR: 2, DES: 1, CON: 1 }, vel: 6, alt: 0, larg: -1, cab: 0, orelha: 'pontuda', pele: HUM, tracos: ['Ancestral Feérico: vantagem contra encantos e medo', 'Versatilidade Social: +2 em Persuadir'], vantEnc: true, persuadir: 2 },
  anao: { nome: 'Anão', emoji: '🧔', desc: 'Resistentes como a montanha. +2 CON, resistência a veneno, passo curto.', bonus: { CON: 2 }, vel: 5, alt: -2, larg: 3, cab: 0, orelha: 'redonda', pele: ['#f3cba5', '#e5b184', '#e0a090', '#cf9867', '#b27a4e', '#8f5b36', '#6b4125', '#d8b8a0'], tracos: ['Resistência Anã: metade do dano de veneno', 'Visão no Escuro: +1 de alcance de visão nas masmorras', 'Deslocamento 5'], visao: 1, resVeneno: true },
  halfling: { nome: 'Halfling', emoji: '🧒', desc: 'Pequenos e sortudos. +2 DES, Sortudo e Corajoso.', bonus: { DES: 2 }, vel: 5, alt: -4, larg: -1, cab: 2, orelha: 'pequena', pele: ['#fbe0cb', '#f3cba5', '#e5b184', '#cf9867', '#b27a4e', '#8f5b36', '#6b4125', '#4a2b19'], tracos: ['Sortudo: repete 1 natural em ataques e salvaguardas', 'Corajoso: vantagem contra medo', 'Deslocamento 5'], sortudo: true, vantMedo: true },
  gnomo: { nome: 'Gnomo', emoji: '🧙', desc: 'Curiosos e brilhantes. +2 INT e esperteza contra magia.', bonus: { INT: 2 }, vel: 5, alt: -4, larg: -1, cab: 2, orelha: 'pontuda', pele: ['#f7e6e0', '#f3cba5', '#e5b184', '#d8a07a', '#b27a4e', '#a8c8a0', '#8fb0d8', '#c0a8d8'], tracos: ['Esperteza Gnômica: vantagem em salvaguardas contra magias', 'Visão no Escuro: +1 de alcance de visão nas masmorras', 'Deslocamento 5'], visao: 1, vantMagia: true },
  meioorc: { nome: 'Meio-orc', emoji: '👹', desc: 'Fortes e implacáveis. +2 FOR, +1 CON, Resistência Implacável.', bonus: { FOR: 2, CON: 1 }, vel: 6, alt: 1, larg: 3, cab: 0, orelha: 'pontuda', pele: ['#8fae6c', '#7d9c5c', '#6a8a4c', '#97a07a', '#a9a58a', '#7e8a72', '#b5a58a', '#8a7a68'], tracos: ['Resistência Implacável: 1×/dia cai a 1 PV em vez de 0', 'Ataques Selvagens: crítico causa um dado extra de arma', 'Intimidação: +2 em Intimidar'], implacavel: true, selvagem: true, intimidar: 2, presas: true },
  draconato: { nome: 'Draconato', emoji: '🐲', desc: 'Sangue de dragão. +2 FOR, +1 CAR, Sopro e resistência elemental.', bonus: { FOR: 2, CAR: 1 }, vel: 6, alt: 1, larg: 1, cab: 0, orelha: 'nenhuma', pele: ['#c0392b', '#2f6bd1', '#3f9a4b', '#cfe4ee', '#3a3a48', '#d8a82a', '#b7c3cf', '#b8643a'], tracos: ['Sopro Ancestral: cone 1×/dia (2d6 → 5d6)', 'Resistência ao elemento do seu sangue'], sopro: true, escamas: true, focinho: true },
  tiefling: { nome: 'Tiefling', emoji: '😈', desc: 'Marcados pelo Abismo. +2 CAR, +1 INT, resistência a fogo e presença intimidante.', bonus: { CAR: 2, INT: 1 }, vel: 6, alt: 0, larg: -1, cab: 0, orelha: 'pontuda', pele: ['#c44a4a', '#a83a62', '#8e4aa8', '#5f6fc9', '#4a8fc9', '#c9a0a0', '#e0b8a0', '#7a3a58'], tracos: ['Resistência Infernal: metade do dano de fogo', 'Visão no Escuro: +1 de alcance de visão nas masmorras', 'Presença Infernal: +2 em Intimidar'], visao: 1, resFogo: true, intimidar: 2, chifres: true, cauda: true },
};
export const ORDEM_RACAS = ['humano', 'elfo', 'meioelfo', 'anao', 'halfling', 'gnomo', 'meioorc', 'draconato', 'tiefling'];
export const ANCESTRAIS = { fogo: { nome: 'Vermelho (fogo)', cor: '#c0392b', dano: 'fogo' }, raio: { nome: 'Azul (raio)', cor: '#2f6bd1', dano: 'elétrico' }, veneno: { nome: 'Verde (veneno)', cor: '#3f9a4b', dano: 'veneno' }, gelo: { nome: 'Branco (gelo)', cor: '#cfe4ee', dano: 'gelo' }, acido: { nome: 'Negro (ácido)', cor: '#3a3a48', dano: 'ácido' } };

export const CORPOS = ['Delgado', 'Médio', 'Robusto'];
export const ALTURAS = ['Muito baixo', 'Baixo', 'Meio baixo', 'Médio', 'Meio alto', 'Alto', 'Muito alto'];
export const ROSTOS = ['Oval', 'Redondo', 'Quadrado', 'Alongado', 'Anguloso', 'Coração'];
export const OLHOS = ['Amendoado', 'Redondo', 'Estreito', 'Grande', 'Caído', 'Feroz'];
export const SOBRANCELHAS = ['Retas', 'Arqueadas', 'Grossas', 'Franzidas', 'Finas'];
export const BOCAS = ['Neutra', 'Sorriso', 'Séria', 'Pequena'];
export const NARIZES = ['Reto', 'Arrebitado', 'Largo', 'Adunco'];
export const CABELOS = ['Careca', 'Raspado', 'Curto', 'Curto repartido', 'Topete', 'Espetado', 'Moicano', 'Médio ondulado', 'Chanel', 'Franja longa', 'Longo liso', 'Longo ondulado', 'Rabo de cavalo', 'Rabo alto', 'Coque', 'Duas tranças', 'Trança lateral', 'Trança longa', 'Black power', 'Dreads', 'Undercut', 'Guerreiro nórdico', 'Tonsura', 'Cacheado'];
export const BARBAS = ['Sem barba', 'Barba por fazer', 'Bigode', 'Cavanhaque', 'Barba curta', 'Barba cheia', 'Barba longa', 'Barba trançada', 'Bigode e cavanhaque', 'Costeletas', 'Barba de mago', 'Barba bifurcada'];
export const MARCAS = ['Nenhuma', 'Cicatriz no olho', 'Cicatriz na bochecha', 'Sardas', 'Pintura de guerra', 'Tatuagem tribal', 'Olheiras', 'Pinta', 'Rugas', 'Rubor'];
export const ROUPAS = ['Túnica simples', 'Camisa e colete', 'Regata', 'Gibão com cintas', 'Túnica longa', 'Roupão', 'Casaco', 'Casaco com capuz'];
export const ACESSORIOS = ['Nenhum', 'Faixa na testa', 'Bandana', 'Brincos', 'Óculos de aviador', 'Coroa de louros', 'Tiara', 'Chapéu de viajante', 'Lenço no pescoço', 'Monóculo'];
export const ESTILOS_ARM = ['Clássico', 'Ornamentado', 'Veterano'];
export const CHIFRES = ['Curvos', 'Retos', 'Carneiro', 'Pequenos'];
export const CAPAS_FORMA = ['Sem capa', 'Capa curta', 'Capa longa'];

export const CORES_CABELO = ['#0e0b10', '#241812', '#3b2616', '#5a3a22', '#7a5230', '#a06b36', '#c18a3d', '#dcb35a', '#efd58a', '#f4ead0', '#d9d9de', '#9a9aa8', '#666675', '#8a2a1a', '#b5442a', '#d86a2a', '#ff5a8a', '#c04ad0', '#5a4ad8', '#2a8ad8', '#28b0a0', '#3aa84a', '#e8e8ff', '#ffb080'];
export const CORES_OLHOS = ['#2a1a12', '#5a3a1e', '#8a5a2a', '#b08a3a', '#3a6a3a', '#5a9a4a', '#2a7a8a', '#4a8ad8', '#2a4aa8', '#6a6a8a', '#9aa8b8', '#a84a8a', '#d82a2a', '#e8c02a', '#e8e8f0', '#18e0b0'];
export const CORES = ['#b8352e', '#7a1f1a', '#d9772a', '#d8b43a', '#e6d35a', '#8ac43a', '#3a8a4a', '#1f5a30', '#2aa08a', '#3ac0d8', '#4a8ad8', '#3a5fb8', '#223a78', '#7a3aa8', '#c04a9a', '#e87aa8', '#7a5230', '#b89a6a', '#e8e0c8', '#f2f2f2', '#8a8a96', '#4a4a56', '#2a2a34', '#16141c',
  '#9aa0b0', '#c0c6d4', '#b0743a', '#e0b83a', '#dfe6ee', '#3a3a48', '#c46a3a', '#9ad8e8'];

// Cores iniciais de armadura por classe (o jogador troca livremente)
export const CORES_CLASSE = {
  guerreiro: { roupa1: '#b8352e', roupa2: '#5a3a22', arm1: '#9aa0b0', arm2: '#b8352e' },
  barbaro: { roupa1: '#a8561f', roupa2: '#5a3a22', arm1: '#7a5230', arm2: '#c0c6d4' },
  ladino: { roupa1: '#3a3f4a', roupa2: '#1f5a30', arm1: '#2a2a34', arm2: '#7a5230' },
  mago: { roupa1: '#3a5fb8', roupa2: '#d8b43a', arm1: '#3a5fb8', arm2: '#d8b43a' },
  clerigo: { roupa1: '#e8e0c8', roupa2: '#a89c6a', arm1: '#e8e0c8', arm2: '#d8b43a' },
  paladino: { roupa1: '#d8b43a', roupa2: '#8a6d12', arm1: '#c0c6d4', arm2: '#d8b43a' },
};
// Armaduras: kits por classe e categoria (leve, média, pesada, veste). 3 estilos cada, com 5 níveis de ornamento.
// tipo: tecido/couro/pele/malha/escamas/placa · ombro: nenhum/redondo/pontudo/chifre/capuz · peito: liso/cintas/cruz/sol/runas ·
// saia: nenhuma/curta/longa/tabardo · elmo: nenhum/aberto/fechado/crista/chifres/capuz/chapeu/coroa
export const KITS = {
  guerreiro: {
    leve: [{ tipo: 'couro', ombro: 'redondo', peito: 'cintas', saia: 'curta', elmo: 'nenhum' }, { tipo: 'couro', ombro: 'pontudo', peito: 'liso', saia: 'curta', elmo: 'aberto' }, { tipo: 'couro', ombro: 'nenhum', peito: 'cintas', saia: 'longa', elmo: 'capuz' }],
    media: [{ tipo: 'malha', ombro: 'redondo', peito: 'liso', saia: 'curta', elmo: 'aberto' }, { tipo: 'malha', ombro: 'pontudo', peito: 'cintas', saia: 'longa', elmo: 'crista' }, { tipo: 'escamas', ombro: 'redondo', peito: 'liso', saia: 'curta', elmo: 'nenhum' }],
    pesada: [{ tipo: 'placa', ombro: 'redondo', peito: 'liso', saia: 'curta', elmo: 'fechado' }, { tipo: 'placa', ombro: 'pontudo', peito: 'sol', saia: 'longa', elmo: 'crista' }, { tipo: 'placa', ombro: 'redondo', peito: 'cintas', saia: 'nenhuma', elmo: 'aberto' }],
  },
  barbaro: {
    leve: [{ tipo: 'pele', ombro: 'redondo', peito: 'cintas', saia: 'curta', elmo: 'nenhum' }, { tipo: 'pele', ombro: 'chifre', peito: 'liso', saia: 'curta', elmo: 'chifres' }, { tipo: 'couro', ombro: 'nenhum', peito: 'cintas', saia: 'curta', elmo: 'nenhum' }],
    media: [{ tipo: 'pele', ombro: 'chifre', peito: 'cintas', saia: 'longa', elmo: 'chifres' }, { tipo: 'escamas', ombro: 'pontudo', peito: 'runas', saia: 'curta', elmo: 'nenhum' }, { tipo: 'pele', ombro: 'redondo', peito: 'liso', saia: 'curta', elmo: 'aberto' }],
  },
  ladino: {
    leve: [{ tipo: 'couro', ombro: 'nenhum', peito: 'cintas', saia: 'longa', elmo: 'capuz' }, { tipo: 'couro', ombro: 'redondo', peito: 'liso', saia: 'curta', elmo: 'nenhum' }, { tipo: 'couro', ombro: 'nenhum', peito: 'cruz', saia: 'curta', elmo: 'capuz' }],
  },
  mago: {
    veste: [{ tipo: 'tecido', ombro: 'nenhum', peito: 'liso', saia: 'longa', elmo: 'chapeu' }, { tipo: 'tecido', ombro: 'nenhum', peito: 'runas', saia: 'longa', elmo: 'capuz' }, { tipo: 'tecido', ombro: 'redondo', peito: 'sol', saia: 'longa', elmo: 'coroa' }],
  },
  clerigo: {
    veste: [{ tipo: 'tecido', ombro: 'nenhum', peito: 'sol', saia: 'longa', elmo: 'nenhum' }, { tipo: 'tecido', ombro: 'nenhum', peito: 'cruz', saia: 'longa', elmo: 'capuz' }, { tipo: 'tecido', ombro: 'redondo', peito: 'liso', saia: 'tabardo', elmo: 'coroa' }],
    leve: [{ tipo: 'couro', ombro: 'redondo', peito: 'sol', saia: 'tabardo', elmo: 'nenhum' }, { tipo: 'couro', ombro: 'nenhum', peito: 'cruz', saia: 'longa', elmo: 'capuz' }, { tipo: 'couro', ombro: 'redondo', peito: 'liso', saia: 'curta', elmo: 'coroa' }],
    media: [{ tipo: 'malha', ombro: 'redondo', peito: 'sol', saia: 'tabardo', elmo: 'aberto' }, { tipo: 'escamas', ombro: 'redondo', peito: 'cruz', saia: 'tabardo', elmo: 'nenhum' }, { tipo: 'malha', ombro: 'pontudo', peito: 'sol', saia: 'longa', elmo: 'coroa' }],
  },
  paladino: {
    leve: [{ tipo: 'couro', ombro: 'redondo', peito: 'sol', saia: 'tabardo', elmo: 'nenhum' }, { tipo: 'couro', ombro: 'pontudo', peito: 'liso', saia: 'tabardo', elmo: 'aberto' }, { tipo: 'couro', ombro: 'redondo', peito: 'cruz', saia: 'curta', elmo: 'coroa' }],
    media: [{ tipo: 'escamas', ombro: 'redondo', peito: 'sol', saia: 'tabardo', elmo: 'aberto' }, { tipo: 'malha', ombro: 'pontudo', peito: 'sol', saia: 'tabardo', elmo: 'crista' }, { tipo: 'escamas', ombro: 'redondo', peito: 'cruz', saia: 'curta', elmo: 'nenhum' }],
    pesada: [{ tipo: 'placa', ombro: 'redondo', peito: 'sol', saia: 'tabardo', elmo: 'fechado' }, { tipo: 'placa', ombro: 'pontudo', peito: 'sol', saia: 'tabardo', elmo: 'crista' }, { tipo: 'placa', ombro: 'redondo', peito: 'cruz', saia: 'longa', elmo: 'coroa' }],
  },
};

export function apPadrao(cls = 'guerreiro', raca = 'humano') {
  const R = RACAS[raca] || RACAS.humano; const cc = CORES_CLASSE[cls] || CORES_CLASSE.guerreiro;
  return {
    raca, corpo: 1, altura: 0, rosto: 0, olhos: 0, olhosCor: '#5a3a1e', sobr: 1, boca: 0, nariz: 0, pele: R.pele[2], cabelo: 2, cabeloCor: '#3b2616', barba: 0, barbaCor: null, marca: 0,
    roupa: 0, roupa1: cc.roupa1, roupa2: cc.roupa2, estilo: 0, arm1: cc.arm1, arm2: cc.arm2, capa: 1, acess: 0, chifre: 0, anc: 'fogo', elmo: false,
  };
}
const pick = (rng, a) => a[Math.floor(rng() * a.length)];
export function sortearAp(rng, cls = 'guerreiro', raca = null) {
  const r = raca || pick(rng, ORDEM_RACAS); const R = RACAS[r]; const ap = apPadrao(cls, r); const cc = CORES_CLASSE[cls];
  ap.corpo = Math.floor(rng() * 3); ap.altura = Math.floor(rng() * 7) - 3; ap.rosto = Math.floor(rng() * ROSTOS.length); ap.olhos = Math.floor(rng() * OLHOS.length); ap.olhosCor = pick(rng, CORES_OLHOS);
  ap.sobr = Math.floor(rng() * SOBRANCELHAS.length); ap.boca = Math.floor(rng() * BOCAS.length); ap.nariz = Math.floor(rng() * NARIZES.length);
  ap.pele = pick(rng, R.pele); ap.cabelo = Math.floor(rng() * CABELOS.length); ap.cabeloCor = pick(rng, CORES_CABELO.slice(0, rng() < 0.85 ? 16 : CORES_CABELO.length));
  ap.barba = rng() < 0.4 ? Math.floor(rng() * BARBAS.length) : 0; ap.marca = rng() < 0.35 ? Math.floor(rng() * MARCAS.length) : 0; ap.roupa = Math.floor(rng() * ROUPAS.length);
  ap.roupa1 = pick(rng, CORES.slice(0, 24)); ap.roupa2 = pick(rng, CORES.slice(0, 24)); ap.arm1 = rng() < 0.6 ? cc.arm1 : pick(rng, CORES); ap.arm2 = rng() < 0.6 ? cc.arm2 : pick(rng, CORES);
  ap.estilo = Math.floor(rng() * 3); ap.capa = Math.floor(rng() * 3); ap.acess = rng() < 0.4 ? Math.floor(rng() * ACESSORIOS.length) : 0; ap.chifre = Math.floor(rng() * CHIFRES.length);
  if (r === 'draconato') { ap.anc = pick(rng, Object.keys(ANCESTRAIS)); ap.pele = ANCESTRAIS[ap.anc].cor; }
  return ap;
}
// Quantas combinações de estilo existem (sem contar as cores livres)
export function combinacoes() {
  const n = [ORDEM_RACAS.length, CORPOS.length, ALTURAS.length, ROSTOS.length, OLHOS.length, SOBRANCELHAS.length, BOCAS.length, NARIZES.length, CABELOS.length, BARBAS.length, MARCAS.length, ROUPAS.length, ACESSORIOS.length, ESTILOS_ARM.length, CAPAS_FORMA.length, 8, CORES_CABELO.length, CORES_OLHOS.length, CORES.length, CORES.length];
  return n.reduce((a, b) => a * b, 1);
}
// Normaliza aparência vinda de saves antigos ou editada à mão
export function normalizarAp(ap, cls) {
  const base = apPadrao(cls, ap && RACAS[ap.raca] ? ap.raca : 'humano'); const o = { ...base, ...(ap || {}) };
  if (!RACAS[o.raca]) o.raca = 'humano'; return o;
}
