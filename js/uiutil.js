// Pequenos geradores de HTML reutilizados pelos painéis.
import * as St from './store.js';
import { ITENS } from './srd.js';
import { MAESTRIAS, maestriaDe } from './maestrias.js';
import { TIERS, TIER_COR, RAR_COR } from './conteudo.js';
import { esc, fmt, pct } from './uibase.js';

export const S = () => St.S;
export const tierTag = (t) => `<span class="tag" style="background:${TIER_COR[t]}">${esc(TIERS[t])}</span>`;
export const escada = (tier) => `<div style="display:flex;gap:2px;margin:4px 0">${TIERS.map((n, i) => `<div title="${esc(n)}" style="flex:1;height:7px;border:1px solid #000;background:${i <= tier ? TIER_COR[i] : '#0a0812'}"></div>`).join('')}</div>`;
export const barra = (a, b, cls = '') => `<div class="prog ${cls}"><i style="width:${pct(a, b).toFixed(1)}%"></i></div>`;
// ícone por categoria do item (arte procedural própria, assets/ic/items/*.webp); `ic` vem do SRD importado, os itens-base usam o mapa por id
const IC_CATS = new Set(['espada', 'adaga', 'machado', 'martelo', 'maca', 'lanca', 'arco', 'funda', 'dardo', 'chicote', 'foice', 'cajado', 'bastao', 'varinha', 'flecha', 'escudo', 'armadura_leve', 'armadura_media', 'armadura_pesada', 'elmo', 'coroa', 'luvas', 'botas', 'capa', 'cinto', 'roupa', 'mochila', 'bolsa', 'saco', 'pocao', 'pergaminho', 'livro', 'chave', 'corda', 'tocha', 'lampiao', 'tenda', 'ferramenta', 'musica', 'gema', 'anel', 'amuleto', 'simbolo', 'sino', 'espelho', 'comida', 'veneno', 'padrao']);
const IC_ID = { cajado: 'cajado', adaga: 'adaga', maca: 'maca', cimitarra: 'espada', espadaCurta: 'espada', machadinha: 'machado', rapieira: 'espada', machadoBatalha: 'machado', martelo: 'martelo', espadaLonga: 'espada', arcoCurto: 'arco', arcoLongo: 'arco', espadaGrande: 'espada', machadoGrande: 'machado', lamina_brasa: 'espada', lamina_solar: 'espada', cajado_poder: 'cajado', maca_disrupcao: 'maca',
  couro: 'armadura_leve', couroBatido: 'armadura_leve', couro_lobo: 'armadura_leve', camisaoMalha: 'armadura_media', escamas: 'armadura_media', meiaPlaca: 'armadura_media', escama_dragao: 'armadura_media', cotaMalha: 'armadura_pesada', talas: 'armadura_pesada', placas: 'armadura_pesada', escudo: 'escudo',
  anelProt: 'anel', mantoProt: 'capa', braceletes: 'luvas', manoplas: 'luvas', amuletoSaude: 'amuleto', tiara: 'coroa', periapto: 'amuleto', coroaCarisma: 'coroa', botasVel: 'botas', mantoElfico: 'capa', anelRegen: 'anel',
  pocao1: 'pocao', pocao2: 'pocao', pocao3: 'pocao', pocao4: 'pocao', restaura: 'pocao', fogoAlq: 'pocao', pergBola: 'pergaminho', pergCura: 'pergaminho', poFuga: 'bolsa', escudoSeq: 'amuleto', amuletoCura: 'amuleto', simbolo_alvorecer: 'simbolo', diario_nhor: 'livro' };
const IC_PADRAO = { arma: 'espada', armadura: 'armadura_media', escudo: 'escudo', acessorio: 'anel', consumivel: 'pocao', comida: 'comida', tesouro: 'saco' };
export const catIcone = (it) => { if (!it) return 'padrao'; if (it.ic && IC_CATS.has(it.ic)) return it.ic; const base = String(it.id || '').replace(/_\d+$/, ''); return IC_ID[it.id] || IC_ID[base] || IC_PADRAO[it.tipo] || 'padrao'; };
export const icoItem = (it) => `<img class="ico-item" alt="" loading="lazy" src="assets/ic/items/${catIcone(it)}.webp" style="--rar:${RAR_COR[it && it.raro] || '#cfcfe0'}">`;
export const raridadeTag = (r) => `<span class="tag" style="background:${RAR_COR[r] || '#aaa'}">${esc(r)}</span>`;
export function descItem(it) {
  if (!it) return '';
  if (it.tipo === 'arma') return `${it.dado}${it.mag ? ` +${it.mag}` : ''}${it.duas ? ' · duas mãos' : ''}${it.dist ? ' · distância' : ''}${it.acu ? ' · acuidade' : ''}${it.extra ? ` · +${it.extra.dado} ${it.extra.dano}` : ''}${maestriaDe(it) ? ` · Maestria: ${MAESTRIAS[maestriaDe(it)].nome}` : ''}${it.desc ? ' · ' + it.desc : ''}`;
  if (it.tipo === 'armadura') return `CA ${it.base + (it.mag || 0)}${it.dexMax === 0 ? '' : it.dexMax >= 90 || it.dexMax == null ? ' + DES' : ` + DES (máx. ${it.dexMax})`} · ${it.cat}${it.desc ? ' · ' + it.desc : ''}`;
  if (it.tipo === 'escudo') return `+${(it.ca || 0) + (it.mag || 0)} CA`;
  return it.desc || '';
}
export const nomeItem = (id) => (ITENS[id] ? ITENS[id].nome : id);
export function multXpAprox(chave) {
  const s = St.S; const e = St.eventoAtual(); const ev = e && e.mod && e.estado.feito !== 'falhou' ? (e.mod.xp || 1) * (e.mod[chave] || 1) : 1;
  return St.multSequencia() * (s.sequencia.voltaBonus > 0 ? 1.25 : 1) * ev;
}
export function xpPrev(jaFeito, min, lim, f) { let xp = 0; for (let i = 0; i < min; i++) { const t = jaFeito + i; xp += t < lim[0] ? 1 : t < lim[1] ? 0.6 : 0.25; } return xp * f; }
export const mmss = (ms) => { const t = Math.max(0, Math.round(ms / 1000)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
export const NOMES_RECURSO = { folego: 'Retomar o Fôlego', surto: 'Surto de Ação', indomavel: 'Indomável', furia: 'Fúria', ardil: 'Ardil', sorte: 'Golpe de Sorte', recup: 'Recuperação Arcana', assinatura: 'Assinatura', canal: 'Canalizar Divindade', maos: 'Mãos Curativas (PV)' };
export function recursosHtml(rec, max) {
  const p = []; rec.slots.forEach((v, i) => { if ((max.slots[i] || 0) > 0) p.push(`<span class="chip">${i + 1}º círculo ${v}/${max.slots[i]}</span>`); });
  for (const [k, v] of Object.entries(rec.cont)) if ((max.cont[k] || 0) > 0) p.push(`<span class="chip">${esc(NOMES_RECURSO[k] || k)} ${v >= 99 ? '∞' : v + '/' + (max.cont[k] >= 99 ? '∞' : max.cont[k])}</span>`);
  return p.length ? `<div class="linha" style="gap:5px">${p.join('')}</div>` : '<span class="suave">Nenhum recurso de classe ainda.</span>';
}
export { fmt };
