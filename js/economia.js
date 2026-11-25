// Economia do jogo, calibrada para ficar perto das regras do D&D 5e (SRD): preços em peças de ouro (po)
// e riqueza total por nível parecida com as tabelas de tesouro do DMG. Moeda interna: 1 ouro = 1 po.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Riqueza acumulada esperada (em po) ao ficar no nível L, incluindo equipamento.
export const RIQUEZA = (L) => 60 + 90 * Math.pow(L, 1.9);
// O jogador sobe de nível pelo treino real (XP só de treino, estudo, aeróbico e alimentação): ~1 nível por semana.
export const DIAS_POR_NIVEL = 7;
export const ouroPorDia = (L) => (RIQUEZA(clamp(L, 1, 20) + 1) - RIQUEZA(clamp(L, 1, 20))) / DIAS_POR_NIVEL;
export const PARTE = { missoes: 0.19, baus: 0.19, monstros: 0.115 }; // o resto vem de capítulos, eventos e vendas

// Preços de mercado do SRD 5.1 (po) para os itens-base do jogo.
export const PRECO_SRD = {
  cajado: 1, adaga: 2, maca: 5, cimitarra: 25, espadaCurta: 10, machadinha: 5, rapieira: 25, machadoBatalha: 10, martelo: 15,
  espadaLonga: 15, arcoCurto: 25, arcoLongo: 50, espadaGrande: 50, machadoGrande: 30,
  couro: 10, couroBatido: 45, camisaoMalha: 50, escamas: 50, meiaPlaca: 750, cotaMalha: 75, talas: 200, placas: 1500, escudo: 10,
};
const MAGICO = [0, 1000, 4000, 16000];                         // acréscimo de um item +1/+2/+3 (faixa do DMG)
const POR_RARIDADE = { comum: 100, incomum: 500, raro: 5000, 'épico': 25000, 'lendário': 100000 };
const PRECO_RAR = { comum: 100, incomum: 400, raro: 3500, 'épico': 18000, 'lendário': 0 }; // itens mágicos do SRD (faixas do DMG, comprimidas para a riqueza do jogo)
export function aplicarPrecos(ITENS) {
  for (const it of Object.values(ITENS)) {
    if (it.srd) {
      const m2 = /_(\d)$/.exec(it.id); const k = m2 ? +m2[1] : 0;
      if (it.tipo !== 'tesouro' && (it.raro !== 'comum' || it.mag)) { it.preco = it.raro === 'lendário' ? 0 : k ? 1000 * k * k : PRECO_RAR[it.raro] + (it.tipo === 'armadura' ? Math.round(Math.pow(it.base || 0, 3) / 2) : 0); it.magico = true; if (it.raro === 'lendário') it.nvLoja = 99; }
      else if (it.tipo === 'tesouro' && it.raro !== 'comum') { it.preco = it.raro === 'lendário' ? 3000 : PRECO_RAR[it.raro] * 0.5; it.magico = true; }
      else it.magico = false; continue;
    }
    const m = /^(.+)_(\d)$/.exec(it.id);
    if (['arma', 'armadura', 'escudo'].includes(it.tipo)) {
      const base = m ? m[1] : it.id; const k = m ? +m[2] : 0;
      if (PRECO_SRD[base] !== undefined) it.preco = PRECO_SRD[base] + MAGICO[k];
    } else if (it.tipo === 'acessorio') it.preco = POR_RARIDADE[it.raro] || it.preco;
    it.magico = (m && +m[2] > 0) || it.tipo === 'acessorio' || !!it.mag;
  }
}
// Valor de venda (referência sem comerciante): o herói só vende a comerciantes, que pagam bem menos do que cobram.
export const precoVenda = (it) => Math.max(1, Math.round((it.preco || 2) * (it.magico ? 0.15 : 0.3)));

// ---------- Comerciantes: afinidade de negociação, preços e caixa diário ----------
// Cada loja é de um NPC; a afinidade (−10…12) vira um nível de negociação 0…5 que baixa o que ele cobra e sobe o que ele paga.
export const COMERCIANTES = {
  forja:      { npc: 'brasa',     nome: 'Mestra Brasa',     titulo: 'Forja de Mestra Brasa', chave: 'ferreiro',   mod: 1,    aceita: ['arma', 'armadura', 'escudo'], pagaK: 1,   caixaK: 1,   emoji: '⚒️' },
  alquimista: { npc: 'alquimista', nome: 'Zélia',            titulo: 'Alquimia de Zélia',     chave: 'alquimista', mod: 1,    aceita: ['consumivel', 'comida'],       pagaK: 1,   caixaK: 0.8, emoji: '⚗️' },
  mercador:   { npc: 'quinzinho', nome: 'Quinzinho',        titulo: 'Empório do Quinzinho',  chave: 'mercador',   mod: 1.15, aceita: ['arma', 'armadura', 'escudo', 'acessorio', 'consumivel', 'comida', 'tesouro'], pagaK: 0.9, caixaK: 1.6, emoji: '🎪' },
};
export const NOMES_NEG = ['Hostil', 'Neutro', 'Conhecido', 'Próximo', 'Amigo', 'Confidente'];
export const nivelNegociacao = (afin) => (afin <= -5 ? 0 : afin < 2 ? 1 : afin < 5 ? 2 : afin < 8 ? 3 : afin < 12 ? 4 : 5);
const MOD_COMPRA = [1.25, 1, 0.97, 0.94, 0.9, 0.85];     // multiplica o que o comerciante cobra
const PCT_VENDA = [0.2, 0.3, 0.33, 0.36, 0.4, 0.45];     // fração do preço-base que ele paga (sempre abaixo do que cobra)
export const modCompra = (nivel) => MOD_COMPRA[Math.max(0, Math.min(5, nivel))];
export function vendaLoja(it, loja, nivel) {
  const c = COMERCIANTES[loja]; if (!c || !it || !(it.preco > 0)) return 0; if (!c.aceita.includes(it.tipo)) return 0;
  return Math.max(1, Math.round(it.preco * PCT_VENDA[Math.max(0, Math.min(5, nivel))] * c.pagaK * (it.magico ? 0.5 : 1)));
}
// Caixa diário: quanto o comerciante aguenta pagar por dia (cresce com o nível do herói e com a afinidade).
export const caixaMax = (loja, nivelHeroi, nivelNeg) => Math.round((50 + 38 * Math.pow(Math.max(1, nivelHeroi), 1.25)) * COMERCIANTES[loja].caixaK * (1 + 0.06 * nivelNeg));

// ---------- Fontes de ouro ----------
export const ouroMissao = (L, f = 1) => Math.max(1, Math.round(PARTE.missoes * ouroPorDia(L) / 4 * f));
export function ouroBau(L, rar, rng) { return Math.max(2, Math.round(PARTE.baus * ouroPorDia(L) / 2.6 * (1 + rar * 0.9) / 1.8 * (0.7 + rng() * 0.6))); }
export function ouroMonstro(m, rng) { const base = 0.55 + 0.22 * Math.pow(m.cr || 0.125, 1.4); const v = base * 0.77 * (0.6 + rng() * 0.9) * (m.chefe ? 5 : 1); return Math.floor(v) + (rng() < v - Math.floor(v) ? 1 : 0); }
// Informação para o relatório de balanço (tools/simouro.mjs)
export const alvoDiario = (L) => ouroPorDia(L);
