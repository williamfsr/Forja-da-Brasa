// Efeitos de magias de apoio ("buffs") ativos numa unidade: u.bf = { <idDoBuff>: { ef:{...}, de, nv, sp } }.
// O motor soma/consulta os campos aqui (ca, atq, dano, salv, vantSalv, res, imuB, imuCond, desvContra, contraTags, vantAtq, vel, refl, ward…).
export const bfSoma = (u, k) => { let s = 0; if (u && u.bf) for (const b of Object.values(u.bf)) if (typeof b.ef[k] === 'number') s += b.ef[k]; return s; };
export const bfTem = (u, k) => !!(u && u.bf && Object.values(u.bf).some((b) => b.ef[k]));
export const bfLista = (u, k) => { const o = []; if (u && u.bf) for (const b of Object.values(u.bf)) if (Array.isArray(b.ef[k])) o.push(...b.ef[k]); return o; };
// condições negativas que "Dissipar Magia", "Restauração" e afins removem
export const CONDS_NEG = ['paralisado', 'cego', 'contido', 'atordoado', 'lento', 'amedrontado', 'maldito', 'enfraquecido', 'confuso', 'perde', 'silenciado', 'caido', 'pacificado', 'desacel', 'sap'];
export const CONDS_POS = ['escudo_fe', 'armadura_mago', 'acelerado', 'ajuda', 'heroismo', 'bencao', 'favor', 'guardioes', 'armaEsp'];
