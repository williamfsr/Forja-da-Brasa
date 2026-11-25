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
// Valor de venda: metade nos itens comuns; itens mágicos valem pouco para o comprador comum.
export const precoVenda = (it) => Math.max(1, Math.round((it.preco || 2) * (it.magico ? 0.2 : 0.5)));

// ---------- Fontes de ouro ----------
export const ouroMissao = (L, f = 1) => Math.max(1, Math.round(PARTE.missoes * ouroPorDia(L) / 4 * f));
export function ouroBau(L, rar, rng) { return Math.max(2, Math.round(PARTE.baus * ouroPorDia(L) / 2.6 * (1 + rar * 0.9) / 1.8 * (0.7 + rng() * 0.6))); }
export function ouroMonstro(m, rng) { const base = 0.55 + 0.22 * Math.pow(m.cr || 0.125, 1.4); const v = base * 0.77 * (0.6 + rng() * 0.9) * (m.chefe ? 5 : 1); return Math.floor(v) + (rng() < v - Math.floor(v) ? 1 : 0); }
// Informação para o relatório de balanço (tools/simouro.mjs)
export const alvoDiario = (L) => ouroPorDia(L);
