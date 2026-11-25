// O Vale da Inércia visto de cima: Forjaluz, vilas muradas, acampamento, brejo, cidadela e a região inteira (estradas, lago, montanhas, masmorras).
// Inspirado na geografia clássica do gótico-vampírico (vale selado, castelo no penhasco ao norte, vilas ao longo da estrada, bruxaria ao sul),
// mas com nomes, lugares e história próprios: tudo gira em torno do Rei da Inércia.
import { mulberry32 } from './rules.js';
import { CAPITULOS } from './story.js';
import { novoMapa, poe, ret, gat, ler, contorno, linha, npc, pred, caminho, espalha, registrar, registrarInteriores } from './locais.js';
import { SOLIDOS } from './tiles.js';

const I = (m, x, y) => y * m.w + x;

// ---------- lugares da região (x,y = porta/portão; quem sai de dentro volta para x,y+1) ----------
export const LUG = {
  vila: { x: 52, y: 68, nome: 'Forjaluz', n: 0 }, andarilhos: { x: 68, y: 66, nome: 'Andarilhos', n: 4 }, marcha: { x: 26, y: 46, nome: 'Marcha-Lenta', n: 7 },
  alvorada: { x: 14, y: 22, nome: 'Alvorada', n: 9 }, brejo: { x: 12, y: 66, nome: 'Brejo de Berez', n: 6 }, cidadela: { x: 56, y: 15, nome: 'Cidadela do Trono Imóvel', n: 16 },
  moinho: { x: 60, y: 52, nome: 'Moinho dos Doces Sonhos', n: 5 }, fortaleza: { x: 30, y: 15, nome: 'Fortaleza Dracoprata', n: 8 }, vinhedo: { x: 84, y: 72, nome: 'Vinhedo do Brinde Eterno', n: 10 },
  ambar: { x: 97, y: 10, nome: 'Templo Âmbar', n: 10 }, colina: { x: 50, y: 38, nome: 'Colina do Círculo Cinzento', n: 4 }, garganta: { x: 10, y: 38, nome: 'Garganta do Vento', n: 6 },
};
// capítulos com entrada própria no mapa-múndi (os demais ficam dentro das vilas e da cidadela)
export const CAPS = { 2: { x: 36, y: 72 }, 4: { x: 74, y: 58 }, 5: { x: 44, y: 54 }, 7: { x: 92, y: 60 }, 10: { x: 93, y: 41 }, 11: { x: 32, y: 30 }, 12: { x: 26, y: 64 }, 13: { x: 6, y: 32 }, 14: { x: 95, y: 26 }, 15: { x: 80, y: 14 } };
export const CATAS_MUNDO = [
  { x: 42, y: 62, tema: 'caverna', nome: 'Gruta dos Ecos' }, { x: 78, y: 46, tema: 'cripta', nome: 'Ruínas do Pedágio Velho' }, { x: 20, y: 54, tema: 'porao', nome: 'Sumidouro do Eremita' },
  { x: 64, y: 32, tema: 'mina', nome: 'Mina Abandonada' }, { x: 42, y: 22, tema: 'cripta', nome: 'Cripta do Peregrino' }, { x: 86, y: 50, tema: 'floresta', nome: 'Toca do Bosque Torto' }, { x: 70, y: 20, tema: 'torre', nome: 'Torre Caída' },
];
const SAIDA = (id) => ({ x: LUG[id].x, y: LUG[id].y + 1 });
const portao = (m, x, y, id, rot) => { gat(m, x, y, { tipo: 'mapa', para: 'vale', pos: SAIDA(id), passa: true, rot }); };

function aldeoes(m, lista) { for (const [id, x, y, raio] of lista) npc(m, id, x, y, { raio: raio || 3 }); }
function bordaArvores(m, t = 'arvore') { contorno(m, t, 1); }
function flores(m, seed, p = 0.06) { const r = mulberry32(seed); for (let i = 0; i < m.g.length; i++) if (m.g[i] === 'grama' && r() < p) m.g[i] = 'flor'; }
function arvores(m, lista, t = 'arvore') { for (const [x, y] of lista) if (ler(m, x, y) === 'grama' || ler(m, x, y) === 'flor') poe(m, x, y, t); }
function saidaSul(m, x0, id, rot) { const y = m.h - 1; for (let x = x0; x < x0 + 2; x++) { poe(m, x, y, 'terra'); poe(m, x, y - 1, 'caminho'); portao(m, x, y, id, rot); } m.spawn = { x: x0, y: y - 2 }; }
function cata(m, x, y, tema, rot) { poe(m, x, y, 'caverna'); gat(m, x, y, { tipo: 'cata', tema, rot }); m.extra.push({ n: '∞', x, y, cata: true }); (m.capPos ||= new Set()).add(I(m, x, y)); }
function capaEm(m, n, x, y, rot, spr = 'caverna') { poe(m, x, y, spr === 'saida' ? 'saida' : 'caverna'); gat(m, x, y, { tipo: 'cap', n, rot: rot || CAPITULOS[n - 1].local }); m.extra.push({ n, x, y, spr }); (m.capPos ||= new Set()).add(I(m, x, y)); }

// ================= FORJALUZ (a vila inicial) =================
registrar('vila', () => {
  const m = novoMapa('vila', 'Forjaluz', 36, 32, 'grama', 'vila'); flores(m, 777, 0.07);
  for (let y = 1; y < 32; y++) { poe(m, 17, y, 'terra'); poe(m, 18, y, 'terra'); }
  ret(m, 11, 12, 14, 9, 'praca');
  const lojas = [
    ['templo', 'Templo do Alvorecer', 9, 3, 6, 5, 'telhadoAz'], ['casa', 'Sua casa', 27, 4, 5, 4, 'telhado'], ['biblioteca', 'Biblioteca', 2, 9, 6, 4, 'telhadoAz'], ['arena', 'Arena de Ferro', 2, 15, 6, 4, 'telhado'],
    ['forja', 'Forja da Brasa', 2, 21, 6, 4, 'telhadoMr'], ['trilha', 'Pavilhão da Trilha', 2, 26, 6, 4, 'telhadoVd'], ['taverna', 'Taverna da Tavi', 28, 11, 6, 4, 'telhadoVd'], ['alquimista', 'Alquimia', 28, 17, 5, 4, 'telhadoRx'],
    ['mercador', 'Empório', 28, 23, 5, 4, 'telhadoOc'], ['guarda', 'Quartel da Guarda', 21, 25, 5, 4, 'telhadoCz'],
  ];
  for (const [d, nome, x, y, w, h, tel] of lojas) { const b = pred(m, { x, y, w, h, tel, nome, dest: d }); const alvo = b.frente.x < 17 ? 16 : 19; caminho(m, b.frente.x, b.frente.y, alvo, b.frente.y, 'caminho'); }
  const b1 = pred(m, { x: 9, y: 24, w: 4, h: 3, tel: 'telhadoMr', nome: 'Casa do Menino', dest: 'casa_menino' }); caminho(m, b1.frente.x, b1.frente.y, 16, b1.frente.y, 'caminho');
  const b2 = pred(m, { x: 12, y: 27, w: 4, h: 3, tel: 'telhado', nome: 'Casa Velha', dest: 'casa_aldeia#2' }); caminho(m, b2.frente.x, b2.frente.y, 16, b2.frente.y, 'caminho');
  bordaArvores(m); poe(m, 17, 0, 'terra'); poe(m, 18, 0, 'terra');
  // portal das catacumbas ao norte
  ret(m, 15, 1, 6, 2, 'praca'); poe(m, 15, 1, 'braseiro'); poe(m, 20, 1, 'braseiro'); poe(m, 17, 1, 'saida'); poe(m, 18, 1, 'saida');
  for (const x of [17, 18]) gat(m, x, 1, { tipo: 'painel', id: 'portal', rot: 'Portal das Masmorras' });
  // praça
  poe(m, 17, 16, 'braseiro'); poe(m, 13, 13, 'placa'); gat(m, 13, 13, { tipo: 'painel', id: 'missoes', rot: 'Quadro de Missões' });
  poe(m, 22, 13, 'placa'); gat(m, 22, 13, { tipo: 'painel', id: 'livro', rot: 'Livro da Aventura' }); poe(m, 13, 19, 'poco'); poe(m, 22, 19, 'barril'); poe(m, 12, 19, 'barril');
  // marco da viagem rápida
  poe(m, 21, 16, 'placa'); gat(m, 21, 16, { tipo: 'painel', id: 'viagem', rot: 'Marco das Viagens' });
  // horta queimada e lago
  for (let y = 19; y <= 22; y++) for (let x = 20; x <= 25; x++) poe(m, x, y, (x + y) % 5 === 0 ? 'flor' : 'agua'); for (let x = 20; x <= 25; x++) poe(m, x, 18, 'cerca');
  arvores(m, [[8, 8], [8, 14], [10, 30], [15, 22], [20, 29], [26, 30], [24, 2], [32, 2], [33, 29], [7, 31], [12, 9], [26, 10]]);
  poe(m, 9, 12, 'barril'); poe(m, 9, 13, 'barril'); poe(m, 8, 19, 'bigorna'); poe(m, 8, 20, 'barril');
  saidaSul(m, 17, 'vila', 'Estrada do Vale'); m.retornoPortal = { x: 17, y: 3 }; m.casa = { x: 29, y: 8 };
  aldeoes(m, [['aldeao1', 14, 15, 4], ['aldeao2', 21, 15, 4]]); npc(m, 'lucia', 16, 29, { fixo: true });
  registrarInteriores(m); return m;
});

// ================= MARCHA-LENTA (cidade murada, festa obrigatória) =================
registrar('marcha', () => {
  const m = novoMapa('marcha', 'Marcha-Lenta', 40, 34, 'grama', 'vila'); flores(m, 1301, 0.05);
  for (let y = 9; y < 34; y++) { poe(m, 19, y, 'caminho'); poe(m, 20, y, 'caminho'); } ret(m, 12, 16, 16, 9, 'praca');
  const b1 = pred(m, { x: 14, y: 3, w: 11, h: 6, tel: 'telhadoRx', nome: 'Mansão do Prefeito', dest: 'prefeitura' }); caminho(m, b1.frente.x, b1.frente.y, 19, b1.frente.y, 'caminho');
  const b2 = pred(m, { x: 4, y: 12, w: 7, h: 5, tel: 'telhadoCz', nome: 'Estalagem Meia-Noite', dest: 'estalagem' }); caminho(m, b2.frente.x, b2.frente.y, 18, b2.frente.y, 'caminho');
  const b3 = pred(m, { x: 29, y: 11, w: 7, h: 6, tel: 'telhadoPr', nome: 'Igreja do Descanso', dest: 'igreja' }); caminho(m, b3.frente.x, b3.frente.y, 21, b3.frente.y, 'caminho');
  for (const [x, y, n] of [[4, 21, 1], [31, 21, 2], [4, 27, 3], [31, 27, 4]]) { const b = pred(m, { x, y, w: 5, h: 4, tel: n % 2 ? 'telhadoMr' : 'telhado', nome: 'Casa', dest: `casa_aldeia#${n}`, rot: false }); caminho(m, b.frente.x, b.frente.y, b.frente.x < 19 ? 18 : 21, b.frente.y, 'caminho'); }
  // muralha, torres e portão
  const x0 = 0, y0 = 0, x1 = 39, y1 = 33; for (let x = x0; x <= x1; x++) { poe(m, x, y0, 'muro'); poe(m, x, y1, 'muro'); } for (let y = y0; y <= y1; y++) { poe(m, x0, y, 'muro'); poe(m, x1, y, 'muro'); }
  for (const [x, y] of [[0, 0], [39, 0], [0, 33], [39, 33], [19, 0], [20, 0]]) poe(m, x, y, 'torreT'); poe(m, 19, 33, 'caminho'); poe(m, 20, 33, 'caminho'); portao(m, 19, 33, 'marcha', 'Portão de Marcha-Lenta'); portao(m, 20, 33, 'marcha', 'Portão de Marcha-Lenta'); m.spawn = { x: 19, y: 31 };
  // praça de festa
  poe(m, 16, 19, 'poco'); for (const [x, y] of [[13, 17], [26, 17], [13, 23], [26, 23]]) poe(m, x, y, 'tenda'); for (const [x, y] of [[16, 17], [23, 17], [16, 23], [23, 23]]) poe(m, x, y, 'braseiro');
  poe(m, 22, 19, 'placa'); gat(m, 22, 19, { tipo: 'obj', id: 'edital_prefeito', rot: 'Edital do Prefeito' }); poe(m, 18, 12, 'placa'); gat(m, 18, 12, { tipo: 'painel', id: 'missoes', rot: 'Quadro de Missões' });
  poe(m, 21, 29, 'placa'); gat(m, 21, 29, { tipo: 'painel', id: 'viagem', rot: 'Marco das Viagens' });
  cata(m, 37, 14, 'cripta', 'Cripta da Igreja'); poe(m, 36, 18, 'rocha'); poe(m, 38, 18, 'rocha'); poe(m, 37, 17, 'cerca'); poe(m, 35, 19, 'cerca');
  arvores(m, [[8, 9], [12, 11], [30, 8], [33, 7], [6, 19], [34, 19], [8, 31], [34, 31], [24, 30], [14, 30], [11, 6], [28, 8]]);
  aldeoes(m, [['guarda', 18, 31, 0], ['aldeao1', 17, 20, 3], ['aldeao2', 23, 21, 3], ['aldeao3', 20, 14, 3], ['aldeao4', 15, 26, 3]]); m.npcs.find((n) => n.id === 'guarda').fixo = true;
  registrarInteriores(m); return m;
});

// ================= ALVORADA (abadia murada, a doutora que erra a dose) =================
registrar('alvorada', () => {
  const m = novoMapa('alvorada', 'Alvorada', 34, 30, 'grama', 'vila'); flores(m, 2208, 0.05);
  for (let y = 10; y < 30; y++) { poe(m, 16, y, 'caminho'); poe(m, 17, y, 'caminho'); } ret(m, 12, 15, 10, 6, 'praca');
  const ab = pred(m, { x: 11, y: 3, w: 11, h: 7, tel: 'telhadoCz', nome: 'Abadia de Alvorada', dest: 'abadia', porta: 16 }); caminho(m, 16, ab.frente.y, 16, 15, 'caminho');
  for (const [x, y, n] of [[3, 12, 1], [26, 12, 2], [3, 20, 3], [26, 20, 4]]) { const b = pred(m, { x, y, w: 5, h: 4, tel: n % 2 ? 'telhadoMr' : 'telhadoVd', nome: 'Casa', dest: `casa_aldeia#${n}`, rot: false }); caminho(m, b.frente.x, b.frente.y, b.frente.x < 16 ? 15 : 18, b.frente.y, 'caminho'); }
  for (let x = 0; x < 34; x++) { poe(m, x, 0, 'muro'); poe(m, x, 29, 'muro'); } for (let y = 0; y < 30; y++) { poe(m, 0, y, 'muro'); poe(m, 33, y, 'muro'); }
  for (const [x, y] of [[0, 0], [33, 0], [0, 29], [33, 29]]) poe(m, x, y, 'torreT'); for (const x of [16, 17]) { poe(m, x, 29, 'caminho'); portao(m, x, 29, 'alvorada', 'Portão de Alvorada'); } m.spawn = { x: 16, y: 27 };
  // represa e lavoura
  ret(m, 26, 4, 5, 5, 'agua'); poe(m, 28, 6, 'ponte'); for (let x = 25; x <= 31; x++) poe(m, x, 9, 'cerca'); for (let y = 24; y <= 27; y++) for (let x = 4; x <= 10; x++) poe(m, x, y, y % 2 ? 'terra' : 'grama'); for (let x = 3; x <= 11; x++) poe(m, x, 23, 'cerca');
  poe(m, 14, 17, 'poco'); poe(m, 19, 17, 'braseiro'); poe(m, 15, 12, 'placa'); gat(m, 15, 12, { tipo: 'painel', id: 'missoes', rot: 'Quadro de Missões' }); poe(m, 19, 26, 'placa'); gat(m, 19, 26, { tipo: 'painel', id: 'viagem', rot: 'Marco das Viagens' });
  cata(m, 30, 14, 'cripta', 'Catacumbas da Abadia'); arvores(m, [[8, 8], [24, 24], [29, 25], [13, 26], [20, 25], [3, 8], [30, 20]], 'pinheiro');
  aldeoes(m, [['aldeao1', 14, 18, 3], ['aldeao2', 19, 20, 3], ['aldeao3', 12, 25, 2]]); registrarInteriores(m); return m;
});

// ================= BREJO DE BEREZ (vila afogada) =================
registrar('brejo', () => {
  const m = novoMapa('brejo', 'Brejo de Berez', 32, 28, 'pantano', 'vila'); const r = mulberry32(3301);
  for (let y = 1; y < 27; y++) for (let x = 1; x < 31; x++) { const v = r(); if (v < 0.28) poe(m, x, y, 'agua'); else if (v < 0.34) poe(m, x, y, 'grama'); }
  for (let y = 3; y < 28; y++) { for (const x of [15, 16]) poe(m, x, y, 'ponte'); } for (let x = 5; x < 28; x++) { poe(m, x, 14, 'ponte'); poe(m, x, 15, 'ponte'); }
  for (const [x, y, w, h] of [[4, 8, 5, 4], [22, 8, 5, 4], [4, 17, 5, 4], [22, 17, 5, 4]]) { ret(m, x - 1, y - 1, w + 2, h + 2, 'pantano'); const b = pred(m, { x, y, w, h, tel: 'telhadoMr', nome: 'Casa afogada', dest: `casa_aldeia#${x}${y}`, rot: false, ruina: true }); for (let xx = Math.min(b.frente.x, 15); xx <= Math.max(b.frente.x, 15); xx++) poe(m, xx, b.frente.y < 14 ? 14 : 15, 'ponte'); const yy = b.frente.y; if (yy < 14) for (let k = yy; k <= 14; k++) poe(m, b.frente.x, k, 'ponte'); else for (let k = 15; k <= yy; k++) poe(m, b.frente.x, k, 'ponte'); }
  contorno(m, 'arvore', 1); for (const x of [15, 16]) { poe(m, x, 27, 'ponte'); poe(m, x, 26, 'ponte'); portao(m, x, 27, 'brejo', 'Saída do Brejo'); } m.spawn = { x: 15, y: 25 };
  // portal do Pântano Silente e embarcadouro
  ret(m, 13, 1, 6, 3, 'pantano'); capaEm(m, 6, 15, 2, 'Pântano Silente'); poe(m, 14, 2, 'braseiro'); poe(m, 17, 2, 'braseiro'); poe(m, 18, 16, 'placa'); gat(m, 18, 16, { tipo: 'painel', id: 'viagem', rot: 'Marco das Viagens' });
  for (const [x, y] of [[11, 5], [20, 6], [10, 13], [24, 24], [8, 25], [27, 5]]) { poe(m, x, y, 'arvore'); } for (const [x, y] of [[9, 4], [23, 5], [11, 22], [20, 22]]) poe(m, x, y, 'rocha');
  // afogados em pé nas ilhotas
  for (const [x, y] of [[12, 18], [19, 12], [13, 8]]) { ret(m, x - 1, y - 1, 3, 3, 'pantano'); poe(m, x, y, 'pantano'); }
  npc(m, 'barqueiro', 17, 14, { raio: 1 }); npc(m, 'afogado1', 12, 18, { fixo: true }); npc(m, 'afogado2', 19, 12, { fixo: true }); npc(m, 'afogado3', 13, 8, { fixo: true }); npc(m, 'aldeao1', 14, 20, { raio: 1 });
  registrarInteriores(m); return m;
});

// ================= ACAMPAMENTO DOS ANDARILHOS =================
registrar('andarilhos', () => {
  const m = novoMapa('andarilhos', 'Acampamento dos Andarilhos', 28, 22, 'grama', 'vila'); flores(m, 4402, 0.08);
  ret(m, 8, 6, 12, 10, 'terra'); poe(m, 13, 10, 'braseiro'); poe(m, 14, 10, 'braseiro'); poe(m, 12, 12, 'barril'); poe(m, 15, 12, 'barril');
  const s = pred(m, { x: 11, y: 3, w: 5, h: 4, tel: 'telhadoRx', nome: 'Tenda de Dona Ordália', dest: 'tenda_ordalia' }); caminho(m, s.frente.x, s.frente.y, 13, 9, 'terra');
  const v = pred(m, { x: 20, y: 12, w: 5, h: 4, tel: 'telhadoPr', nome: 'Mercado dos Vazios', dest: 'tenda_vazia' }); caminho(m, v.frente.x, v.frente.y, 17, v.frente.y, 'terra');
  for (const [x, y] of [[3, 6], [3, 12], [6, 17]]) pred(m, { x, y, w: 4, h: 3, tel: 'telhadoMr', nome: 'Carroça', dest: null, rot: false }); poe(m, 7, 8, 'tenda'); poe(m, 22, 7, 'tenda'); poe(m, 6, 14, 'tenda');
  contorno(m, 'pinheiro', 1); for (const x of [13, 14]) { poe(m, x, 21, 'terra'); poe(m, x, 20, 'terra'); portao(m, x, 21, 'andarilhos', 'Estrada'); } m.spawn = { x: 13, y: 19 }; caminho(m, 13, 19, 13, 16, 'terra'); caminho(m, 14, 19, 14, 16, 'terra');
  arvores(m, [[2, 3], [24, 3], [25, 18], [2, 19], [18, 3], [21, 19]], 'pinheiro'); poe(m, 15, 18, 'placa'); gat(m, 15, 18, { tipo: 'painel', id: 'viagem', rot: 'Marco das Viagens' });
  aldeoes(m, [['andarilho1', 10, 11, 2], ['andarilho2', 17, 9, 2], ['andarilho3', 11, 15, 2]]); registrarInteriores(m); return m;
});

// ================= CIDADELA DO TRONO IMÓVEL (o castelo no penhasco) =================
registrar('cidadela', () => {
  const m = novoMapa('cidadela', 'Cidadela do Trono Imóvel', 48, 40, 'neve', 'vila');
  const r = mulberry32(5501); for (let i = 0; i < m.g.length; i++) if (r() < 0.03) m.g[i] = 'rocha';
  contorno(m, 'pinheiro', 2); ret(m, 5, 11, 38, 25, 'praca');
  // muralha externa com torres e portão
  for (let x = 4; x <= 43; x++) { poe(m, x, 10, 'muro'); poe(m, x, 36, 'muro'); } for (let y = 10; y <= 36; y++) { poe(m, 4, y, 'muro'); poe(m, 43, y, 'muro'); }
  for (const [x, y] of [[4, 10], [43, 10], [4, 36], [43, 36], [23, 36], [24, 36]]) poe(m, x, y, 'torreT'); poe(m, 21, 36, 'muro'); poe(m, 26, 36, 'muro');
  for (let x = 21; x <= 26; x++) { if (x < 23 || x > 24) continue; }
  // estrada de acesso e ponte sobre o fosso
  ret(m, 20, 37, 8, 2, 'neve'); for (let y = 37; y < 40; y++) { poe(m, 23, y, 'caminho'); poe(m, 24, y, 'caminho'); } poe(m, 22, 36, 'torreT'); poe(m, 25, 36, 'torreT'); poe(m, 23, 36, 'caminho'); poe(m, 24, 36, 'caminho');
  // região de saída (sul)
  for (const x of [23, 24]) { poe(m, x, 39, 'caminho'); portao(m, x, 39, 'cidadela', 'Estrada da Cidadela'); } m.spawn = { x: 23, y: 37 };
  // portões do trono (cap. 17)
  for (let y = 29; y <= 35; y++) { poe(m, 23, y, 'caminho'); poe(m, 24, y, 'caminho'); } capaEm(m, 17, 23, 31, 'Portões do Trono', 'saida'); poe(m, 22, 31, 'braseiro'); poe(m, 25, 31, 'braseiro');
  // fortaleza principal (salão do mordomo, Conde Vazio, dragões mortos, trono)
  const k = pred(m, { x: 16, y: 12, w: 16, h: 9, tel: 'telhadoPr', nome: 'Cidadela', dest: 'mordomo' }); for (let y = k.frente.y; y <= 31; y++) { poe(m, 23, y, 'caminho'); poe(m, 24, y, 'caminho'); } poe(m, 16, 12, 'torreT'); poe(m, 31, 12, 'torreT'); poe(m, 16, 20, 'torreT'); poe(m, 31, 20, 'torreT');
  // corte dos sussurros (cap. 16): jardim de pedra
  ret(m, 7, 22, 11, 11, 'grama'); for (let i = 0; i < 20; i++) { const x = 8 + Math.floor(r() * 9), y = 23 + Math.floor(r() * 9); if (ler(m, x, y) === 'grama') poe(m, x, y, r() < 0.5 ? 'rocha' : 'pinheiro'); } poe(m, 12, 27, 'poco'); capaEm(m, 16, 12, 24, 'Corte dos Sussurros', 'saida'); caminho(m, 12, 25, 23, 25, 'caminho'); poe(m, 11, 24, 'braseiro'); poe(m, 13, 24, 'braseiro');
  // pátio leste e masmorra do fosso (aleatória)
  for (const [x, y] of [[37, 14], [38, 22], [36, 32], [8, 14]]) poe(m, x, y, 'barril'); cata(m, 40, 26, 'cripta', 'Masmorra do Fosso'); poe(m, 40, 22, 'cerca'); poe(m, 40, 30, 'cerca'); poe(m, 38, 33, 'placa'); gat(m, 38, 33, { tipo: 'painel', id: 'viagem', rot: 'Marco das Viagens' });
  npc(m, 'sentinela', 22, 33, { fixo: true }); npc(m, 'sentinela', 25, 33, { fixo: true });
  registrarInteriores(m); return m;
});

// ================= O VALE (região) =================
function valor(ix, iy, seed) { return mulberry32((ix * 73856093) ^ (iy * 19349663) ^ seed)(); }
function ruido(x, y, seed) { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0; const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); const a = valor(x0, y0, seed), b = valor(x0 + 1, y0, seed), c = valor(x0, y0 + 1, seed), d = valor(x0 + 1, y0 + 1, seed); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; }
const fbm = (x, y, seed) => ruido(x, y, seed) * 0.6 + ruido(x * 2.1, y * 2.1, seed + 7) * 0.28 + ruido(x * 4.3, y * 4.3, seed + 13) * 0.12;
const BIOMAS = {
  porao: { g: 'grama', o: 'arvore', w: 'agua' }, caverna: { g: 'terra', o: 'montanha', w: 'agua' }, cripta: { g: 'terra', o: 'rocha', w: 'agua' }, floresta: { g: 'grama', o: 'pinheiro', w: 'agua' },
  torre: { g: 'grama', o: 'montanha', w: 'agua' }, pantano: { g: 'pantano', o: 'arvore', w: 'agua' }, mina: { g: 'terra', o: 'montanha', w: 'agua' }, abismo: { g: 'nuvem', o: 'rocha', w: 'lava' },
  cemiterio: { g: 'terra', o: 'rocha', w: 'agua' }, afundada: { g: 'areia', o: 'rocha', w: 'agua' }, forja: { g: 'terra', o: 'montanha', w: 'lava' }, trono: { g: 'neve', o: 'pinheiro', w: 'agua' },
};
const W = 104, H = 80;
// pontos de influência: [x, y, capítulo que desfaz a névoa, bioma]
const FOCOS = () => {
  const f = [[LUG.vila.x, LUG.vila.y, 0, 'porao'], [LUG.andarilhos.x, LUG.andarilhos.y, 4, 'floresta'], [LUG.colina.x, LUG.colina.y, 4, 'floresta'], [LUG.moinho.x, LUG.moinho.y, 5, 'porao'], [LUG.marcha.x, LUG.marcha.y, 7, 'porao'],
    [LUG.alvorada.x, LUG.alvorada.y, 9, 'trono'], [LUG.brejo.x, LUG.brejo.y, 6, 'pantano'], [LUG.fortaleza.x, LUG.fortaleza.y, 8, 'torre'], [LUG.vinhedo.x, LUG.vinhedo.y, 10, 'porao'], [LUG.ambar.x, LUG.ambar.y, 10, 'forja'], [LUG.garganta.x, LUG.garganta.y, 6, 'caverna'],
    [LUG.cidadela.x, LUG.cidadela.y, 16, 'trono'], [56, 6, 18, 'trono']];
  for (const [n, p] of Object.entries(CAPS)) f.push([p.x, p.y, +n, CAPITULOS[n - 1].tema]); return f;
};
function cidadezinha(m, cx, cy, casas, tel = 'telhado') { // pequeno aglomerado de telhados acima do portão
  for (const [dx, dy, w, h] of casas) { m.predios.push({ x: cx + dx, y: cy + dy, w, h, tel, nome: null, id: null }); ret(m, cx + dx, cy + dy, w, h, tel); }
}
registrar('vale', () => {
  const m = novoMapa('vale', 'O Vale da Inércia', W, H, 'grama', 'regiao'); const seed = 20250101; m.reg = new Uint8Array(W * H); m.enc = new Uint8Array(W * H);
  const focos = FOCOS();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const wx = x + (fbm(x * 0.07, y * 0.07, seed + 51) - 0.5) * 12, wy = y + (fbm(x * 0.07 + 9, y * 0.07 + 4, seed + 52) - 0.5) * 12; let b = 0, bd = 1e9; for (let i = 0; i < focos.length; i++) { const dx = wx - focos[i][0], dy = wy - focos[i][1], d = dx * dx + dy * dy; if (d < bd) { bd = d; b = i; } }
    m.reg[I(m, x, y)] = focos[b][2]; const B = BIOMAS[focos[b][3]] || BIOMAS.porao; const n = fbm(x * 0.1, y * 0.1, seed); let t = B.g;
    if (n < 0.28) t = B.w; else if (n > 0.7) t = B.o; else if (B.g === 'grama' && valor(x, y, seed + 3) < 0.05) t = 'flor'; else if (B.g !== 'grama' && valor(x, y, seed + 5) < 0.04) t = 'rocha'; poe(m, x, y, t);
  }
  // lago do leste (ilha da torre do mago e cidade afundada) e charco do sudoeste
  for (let y = 18; y < 46; y++) for (let x = 82; x < 102; x++) { const d = Math.hypot((x - 92) / 10, (y - 32) / 14); if (d < 1 - ruido(x * 0.3, y * 0.3, seed + 31) * 0.25) poe(m, x, y, 'agua'); }
  for (const [cx, cy, rr] of [[93, 41, 2.6], [95, 26, 2.8]]) for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) if (Math.hypot(x - cx, y - cy) < rr) poe(m, x, y, 'grama');
  // moldura de montanhas (a Névoa Parada fica além)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const e = Math.min(x, y, W - 1 - x, H - 1 - y); const lim = 2 + ruido(x * 0.15, y * 0.15, seed + 77) * 4; if (e < lim) poe(m, x, y, 'montanha'); }
  // estradas
  const r = mulberry32(seed + 99);
  const estrada = (a, b) => { let x = a[0], y = a[1], g = 0; while ((x !== b[0] || y !== b[1]) && g++ < 1200) { const t = m.g[I(m, x, y)]; poe(m, x, y, (t === 'agua' || t === 'lava') ? 'ponte' : 'estrada'); const dx = b[0] - x, dy = b[1] - y; let sx = 0, sy = 0;
    if (Math.abs(dx) + Math.abs(dy) > 6 && r() < 0.22) { if (r() < 0.5) sx = r() < 0.5 ? 1 : -1; else sy = r() < 0.5 ? 1 : -1; } else if ((Math.abs(dx) >= Math.abs(dy) && r() < 0.8) || dy === 0) sx = Math.sign(dx); else sy = Math.sign(dy);
    x = Math.max(1, Math.min(W - 2, x + sx)); y = Math.max(1, Math.min(H - 2, y + sy)); } poe(m, b[0], b[1], 'estrada'); };
  const E = (a, b) => estrada([a.x, a.y + 1], [b.x, b.y + 1]);
  const L = LUG, C = CAPS;
  E(L.vila, L.andarilhos); E(L.vila, C[2]); E(L.vila, L.moinho); E(L.moinho, C[5]); E(C[5], L.marcha); E(L.marcha, C[12]); E(C[12], L.brejo); E(L.marcha, C[11]); E(L.marcha, L.alvorada); E(L.alvorada, L.fortaleza); E(L.fortaleza, L.cidadela);
  E(L.marcha, L.garganta); E(L.garganta, C[13]); E(L.moinho, L.colina); E(L.moinho, C[4]); E(C[4], C[7]); E(C[7], L.vinhedo); E(C[4], C[10]); E(C[10], C[14]); E(C[14], C[15]); E(C[15], L.cidadela); E(C[15], L.ambar);
  E({ x: L.colina.x, y: L.colina.y }, L.cidadela);
  // clareiras
  const limpa = (px, py, rr, t) => { for (let y = py - rr; y <= py + rr; y++) for (let x = px - rr; x <= px + rr; x++) { const c = m.g[I(m, x, y)]; if (c !== 'estrada' && c !== 'ponte') poe(m, x, y, t); } };
  for (const [fx, fy, , bio] of focos) limpa(fx, fy, 3, (BIOMAS[bio] || BIOMAS.porao).g);
  // --- Forjaluz, andarilhos, vilas murada e outros lugares ---
  const portaoDe = (id, rot, tipo = 'vila') => { const p = L[id]; poe(m, p.x, p.y, 'estrada'); gat(m, p.x, p.y, { tipo: 'mapa', para: tipo === 'vila' ? id : tipo, passa: true, rot }); };
  const rot = (id, dy = -6) => { const p = L[id]; m.rotulos.push({ x: p.x, y: p.y + dy, t: p.nome, reg: true }); };
  cidadezinha(m, L.vila.x - 6, L.vila.y - 6, [[0, 0, 4, 3], [5, 1, 4, 3], [9, 0, 4, 3], [2, 4, 3, 2], [8, 4, 3, 2]]); portaoDe('vila', 'Forjaluz'); rot('vila');
  cidadezinha(m, L.andarilhos.x - 3, L.andarilhos.y - 4, [[0, 0, 3, 2], [4, 1, 3, 2]], 'telhadoMr'); portaoDe('andarilhos', 'Acampamento dos Andarilhos'); poe(m, L.andarilhos.x - 2, L.andarilhos.y, 'tenda'); poe(m, L.andarilhos.x + 2, L.andarilhos.y, 'braseiro'); rot('andarilhos', -5);
  const muralha = (id, w, h, tel, casas) => { const p = L[id], x0 = p.x - (w >> 1), y0 = p.y - h + 1; for (let x = x0; x < x0 + w; x++) { poe(m, x, y0, 'muro'); poe(m, x, p.y, 'muro'); } for (let y = y0; y <= p.y; y++) { poe(m, x0, y, 'muro'); poe(m, x0 + w - 1, y, 'muro'); } for (const [x, y] of [[x0, y0], [x0 + w - 1, y0], [x0, p.y], [x0 + w - 1, p.y]]) poe(m, x, y, 'torreT'); ret(m, x0 + 1, y0 + 1, w - 2, h - 2, 'praca'); cidadezinha(m, x0 + 2, y0 + 2, casas, tel); poe(m, p.x, p.y, 'estrada'); portaoDe(id, p.nome); rot(id, -h - 0.6); };
  muralha('marcha', 13, 9, 'telhadoRx', [[0, 0, 4, 3], [5, 0, 4, 3], [0, 4, 3, 2], [6, 4, 3, 2]]); muralha('alvorada', 11, 8, 'telhadoCz', [[0, 0, 7, 3], [0, 4, 3, 2], [5, 4, 3, 2]]);
  // brejo: ilha de casas no charco
  limpa(L.brejo.x, L.brejo.y, 3, 'pantano'); cidadezinha(m, L.brejo.x - 4, L.brejo.y - 5, [[0, 0, 3, 2], [5, 1, 3, 2]], 'telhadoMr'); portaoDe('brejo', 'Brejo de Berez'); rot('brejo', -6);
  // moinho, fortaleza, vinhedo, âmbar: prédios com interior próprio
  const lug = (id, w, h, tel, dest, nome, ruina = false) => { const p = L[id]; const x = p.x - (w >> 1), y = p.y - h + 1; for (let yy = y; yy <= p.y; yy++) for (let xx = x; xx < x + w; xx++) poe(m, xx, yy, tel); m.predios.push({ x, y, w, h, tel, nome: null, id: `vale/${dest}`, ruina, porta: { x: p.x, y: p.y }, frente: { x: p.x, y: p.y + 1 } }); poe(m, p.x, p.y, 'porta'); gat(m, p.x, p.y, { tipo: 'mapa', para: `vale/${dest}`, passa: true, rot: nome }); rot(id, -h - 0.6); };
  lug('moinho', 3, 3, 'telhadoMr', 'moinho', 'Moinho dos Doces Sonhos'); lug('fortaleza', 9, 5, 'telhadoCz', 'fortaleza', 'Fortaleza Dracoprata', true); lug('vinhedo', 6, 4, 'telhadoRx', 'casarao', 'Vinhedo do Brinde Eterno'); lug('ambar', 5, 4, 'telhadoOc', 'ambar', 'Templo Âmbar');
  for (const [id, w] of [['fortaleza', 9]]) { const p = L[id]; for (const [dx, dy] of [[-w >> 1, -5], [(w >> 1), -5], [-w >> 1, 0], [w >> 1, 0]]) poe(m, p.x + dx, p.y + dy + 0, 'torreT'); }
  // vinhas ao redor do vinhedo, árvores do moinho
  for (let i = 0; i < 18; i++) { const x = L.vinhedo.x - 9 + (i % 9), y = L.vinhedo.y - 7 + Math.floor(i / 9) * 2; if (m.g[I(m, x, y)] !== 'estrada') poe(m, x, y, 'cerca'); }
  // colina do círculo cinzento: pedras em círculo
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI * 2) / 8; poe(m, Math.round(L.colina.x + Math.cos(a) * 3), Math.round(L.colina.y - 2 + Math.sin(a) * 3), 'rocha'); } poe(m, L.colina.x, L.colina.y - 2, 'braseiro'); poe(m, L.colina.x, L.colina.y, 'placa'); gat(m, L.colina.x, L.colina.y, { tipo: 'obj', id: 'placa_colina', rot: 'Colina do Círculo Cinzento' }); rot('colina', -5);
  poe(m, L.garganta.x, L.garganta.y, 'placa'); gat(m, L.garganta.x, L.garganta.y, { tipo: 'obj', id: 'placa_garganta', rot: 'Garganta do Vento' }); rot('garganta', -2);
  // cidadela no penhasco: muralhas, torres, portão — a entrada leva ao mapa interno
  { const p = L.cidadela; const x0 = p.x - 8, y0 = p.y - 10; for (let y = y0; y <= p.y; y++) for (let x = x0; x <= p.x + 8; x++) { const e = (x === x0 || x === p.x + 8 || y === y0 || y === p.y); poe(m, x, y, e ? 'muro' : 'praca'); } for (const [x, y] of [[x0, y0], [p.x + 8, y0], [x0, p.y], [p.x + 8, p.y], [p.x - 1, p.y], [p.x + 1, p.y]]) poe(m, x, y, 'torreT');
    m.predios.push({ x: p.x - 5, y: y0 + 2, w: 11, h: 6, tel: 'telhadoPr', nome: null, id: null }); ret(m, p.x - 5, y0 + 2, 11, 6, 'telhadoPr'); poe(m, p.x, p.y, 'estrada'); portaoDe('cidadela', 'Cidadela do Trono Imóvel', 'cidadela'); rot('cidadela', -11); }
  // capítulos com entrada no mapa
  for (const [n, p] of Object.entries(C)) { poe(m, p.x, p.y, 'estrada'); capaEm(m, +n, p.x, p.y - 1, CAPITULOS[n - 1].local); poe(m, p.x, p.y, 'estrada'); m.rotulos.push({ x: p.x, y: p.y - 2.2, t: CAPITULOS[n - 1].local, reg: true }); }
  for (const c of CATAS_MUNDO) { poe(m, c.x, c.y + 1, 'estrada'); cata(m, c.x, c.y, c.tema, c.nome); poe(m, c.x - 1, c.y + 1, 'terra'); poe(m, c.x + 1, c.y + 1, 'terra'); }
  // enfeites: árvores pequenas e pedras em torno das estradas não bloqueiam; marcos de estrada
  const marcos = [[44, 64], [56, 60], [38, 52], [48, 46], [70, 62], [24, 38], [64, 44], [48, 28], [38, 36]]; for (const [x, y] of marcos) if (m.g[I(m, x, y)] === 'estrada' || m.g[I(m, x, y + 1)] === 'estrada') { poe(m, x, y, 'placa'); gat(m, x, y, { tipo: 'obj', id: 'marco_estrada', rot: 'Marco de estrada' }); }
  m.spawn = { x: L.vila.x, y: L.vila.y + 1 }; m.vilaPos = { x: L.vila.x, y: L.vila.y };
  // alcançáveis (BFS)
  m.alc = new Uint8Array(W * H); const q = [I(m, m.spawn.x, m.spawn.y)]; m.alc[q[0]] = 1; const livre = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !SOLIDOS.has(m.g[I(m, x, y)]);
  for (let k = 0; k < q.length; k++) { const c = q[k], cx = c % W, cy = (c / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (livre(nx, ny) && !m.alc[I(m, nx, ny)]) { m.alc[I(m, nx, ny)] = 1; q.push(I(m, nx, ny)); } } }
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const t = m.g[I(m, x, y)]; if (!['grama', 'flor', 'pantano', 'neve', 'areia', 'terra', 'nuvem'].includes(t) || !m.alc[I(m, x, y)]) continue; let perto = false; for (const k of Object.keys(L)) if (Math.abs(x - L[k].x) + Math.abs(y - L[k].y) < 9) { perto = true; break; } if (!perto) m.enc[I(m, x, y)] = 1; }
  // viajantes pelas estradas
  m.npcs.push({ id: 'rictus', x: 49, y: 62, raio: 3 }, { id: 'caliope', x: 30, y: 44, raio: 3 }, { id: 'druida', x: L.colina.x + 1, y: L.colina.y - 4, fixo: true }, { id: 'andarilho1', x: 66, y: 62, raio: 3 });
  registrarInteriores(m); m.interiorIds = m.predios.filter((b) => b.id).map((b) => b.id); return m;
});

export const DESTINOS_VIAGEM = [
  { id: 'casa', nome: 'Sua casa', icone: '🏠', mapa: 'vila/casa', pos: null, desc: 'Cama, espelho, baú e estante.', pre: 'vila' },
  { id: 'vila', nome: 'Praça de Forjaluz', icone: '🔥', mapa: 'vila', pos: { x: 17, y: 22 }, desc: 'A vila da Brasa: forja, arena, biblioteca e taverna.' },
  { id: 'andarilhos', nome: 'Acampamento dos Andarilhos', icone: '🃏', mapa: 'andarilhos', pos: null, desc: 'Dona Ordália e o Baralho do Hábito.', visto: 'andarilhos' },
  { id: 'marcha', nome: 'Marcha-Lenta', icone: '🏰', mapa: 'marcha', pos: null, desc: 'A cidade da festa obrigatória.', visto: 'marcha' },
  { id: 'alvorada', nome: 'Alvorada', icone: '⛪', mapa: 'alvorada', pos: null, desc: 'A abadia da Dra. Marcovia.', visto: 'alvorada' },
  { id: 'brejo', nome: 'Brejo de Berez', icone: '🌫️', mapa: 'brejo', pos: null, desc: 'A vila afogada e o barqueiro.', visto: 'brejo' },
  { id: 'cidadela', nome: 'Cidadela do Trono Imóvel', icone: '👑', mapa: 'cidadela', pos: null, desc: 'O castelo de Nhor-Kaal.', visto: 'cidadela' },
];
