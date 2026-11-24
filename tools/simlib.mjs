// Utilidades de simulação compartilhadas.
import * as St from '../js/store.js';
import * as R from '../js/rules.js';
import { recursosMax } from '../js/srd.js';
import { simular } from '../js/combat.js';

export function setP(s, p) {
  for (const id of ['supino', 'terra', 'agachamento', 'barra_fixa', 'remada', 'lateral']) {
    const cont = p * 9, tier = Math.min(8, Math.floor(cont)), frac = cont - tier; const thr = R.limiares(id, s.heroi.sexo, s.heroi.peso);
    const lo = tier === 0 ? 0 : thr[tier - 1], hi = thr[tier]; const e1 = lo + frac * (hi - lo);
    s.treino[id] = { best: { e1, w: e1, r: 1, data: '2026-01-01' }, sets: 10 };
  }
  s.stats.cardioMin = -6000 * Math.log(1 - Math.min(0.99, p)); s.stats.estudoMin = -250 * 60 * Math.log(1 - Math.min(0.99, p)); s.stats.diasAtivos = -120 * Math.log(1 - Math.min(0.99, p));
}
export const GEAR = {
  guerreiro: (t) => ({ arma: ['espadaLonga', 'espadaLonga_1', 'espadaLonga_2', 'espadaLonga_3'][t], armadura: ['cotaMalha', 'talas_1', 'placas_1', 'placas_2'][t], escudo: ['escudo', 'escudo_1', 'escudo_2', 'escudo_3'][t] }),
  barbaro: (t) => ({ arma: ['machadoGrande', 'machadoGrande_1', 'machadoGrande_2', 'machadoGrande_3'][t], armadura: null, escudo: null }),
  ladino: (t) => ({ arma: ['rapieira', 'rapieira_1', 'rapieira_2', 'rapieira_3'][t], armadura: ['couroBatido', 'couroBatido_1', 'couroBatido_2', 'couroBatido_3'][t], escudo: null }),
  mago: (t) => ({ arma: ['cajado', 'cajado_1', 'cajado_2', 'cajado_3'][t], armadura: null, escudo: null }),
  clerigo: (t) => ({ arma: ['maca', 'maca_1', 'maca_2', 'maca_3'][t], armadura: ['escamas', 'escamas_1', 'meiaPlaca_1', 'meiaPlaca_2'][t], escudo: ['escudo', 'escudo_1', 'escudo_2', 'escudo_3'][t] }),
  paladino: (t) => ({ arma: ['espadaLonga', 'espadaLonga_1', 'espadaLonga_2', 'espadaLonga_3'][t], armadura: ['cotaMalha', 'talas_1', 'placas_1', 'placas_2'][t], escudo: ['escudo', 'escudo_1', 'escudo_2', 'escudo_3'][t] }),
};
export function heroiSim(cls, L, p) {
  const s = St.estadoInicial({ cls, sexo: 'M', peso: 80 }); St.setEstado(s); s.heroi.nivel = L; s.heroi.xp = R.xpParaNivel(L);
  setP(s, p ?? (0.05 + 0.45 * (L - 1) / 19)); const t = L >= 17 ? 3 : L >= 11 ? 2 : L >= 5 ? 1 : 0; const g = GEAR[cls](t);
  s.equip = { arma: g.arma, armadura: g.armadura, escudo: g.escudo, ac1: L >= 8 ? 'anelProt' : null, ac2: L >= 12 ? 'mantoProt' : null };
  s.recursosMax = recursosMax(cls, L); s.recursos = JSON.parse(JSON.stringify(s.recursosMax));
  const pot = L >= 15 ? 'pocao4' : L >= 9 ? 'pocao3' : L >= 4 ? 'pocao2' : 'pocao1'; s.inv = [{ id: pot, n: 2 }];
  s.heroi.hp = R.derivar(s).hpMax; return s;
}
export function lutar(cls, L, mon, n = 200, extra = {}) {
  let vit = 0, hpPerd = 0;
  for (let i = 0; i < n; i++) {
    const s = heroiSim(cls, L, extra.p); const m = R.criarMonstro(mon.id, mon.opts || {}); const rng = R.mulberry32(1000 + i);
    const B = simular(s, m, rng); if (B.fim === 'vitoria') vit++; hpPerd += (1 - Math.max(0, B.h.hp) / B.h.hpMax);
  }
  return { win: vit / n, hp: hpPerd / n };
}
export function criaBoss(cap) { const b = cap.boss; return { id: b.base, opts: { chefe: true, ov: { ...(b.ov || {}), dm: b.dm || 1 }, nome: b.nome, esc: b.esc } }; }

