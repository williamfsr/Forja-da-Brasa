// Calibra cada criatura do SRD (fator k aplicado a PV e dano) para que ela fique tão perigosa quanto o resto do jogo.
// Uso: node tools/tunesrd.mjs  -> escreve js/dados/ajuste_srd.js
globalThis.__SEM_AJUSTE = true;
const R = await import('../js/rules.js');
const { MONSTROS } = await import('../js/srd.js');
const { lutarT } = await import('./simtat.mjs');
import fs from 'fs';
const classes = ['guerreiro', 'mago', 'clerigo', 'ladino'];
const lista = Object.values(MONSTROS).filter((m) => m.srd && !m.inv && m.tp !== 'custom' && m.cr >= 0.125);
const grade = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.12, 1.25, 1.4, 1.6, 1.85, 2.2];
const aj = {};
for (const m of lista) {
  const L = Math.max(1, Math.min(20, Math.ceil((m.cr - 0.4) / 0.62) + 1)); const n = m.cr < 2 ? 2 : 1; const alvoHp = m.cr > 12.8 ? 0.55 : 0.4;
  const [e0, d0] = R.escalaNivel(L); let melhor = null;
  for (const k of grade) {
    let w = 0, h = 0; for (const c of classes) { const r = lutarT(c, L, [m.id], n, 6, null, { esc: e0 * k, dm: d0 * k }); w += r.win; h += r.hp; }
    w /= 4; h /= 4; const custo = Math.abs(h - alvoHp) + 2 * Math.max(0, 0.88 - w);
    if (!melhor || custo < melhor.custo) melhor = { k, custo, w, h };
    if (h > alvoHp + 0.18) break; // k maior = mais difícil; já passou do alvo
  }
  aj[m.id] = melhor.k;
}
const arr = Object.entries(aj).filter(([, k]) => Math.abs(k - 1) > 0.04);
fs.writeFileSync('js/dados/ajuste_srd.js', '// Gerado por tools/tunesrd.mjs: fator (PV e dano) por criatura do SRD, calibrado por simulação.\nexport const AJUSTE_SRD = ' + JSON.stringify(Object.fromEntries(arr.map(([k, v]) => [k.replace(/^s_/, ''), v]))) + ';\n');
console.log('ajustados', arr.length, 'de', lista.length);
