// Monta grupos de monstros (1 a 3) já escalados para o combate tático e com personalidade, frase de abertura e aparência própria.
import * as R from './rules.js';
import { aplicarPerfil } from './personalidade.js';
import { escalaGrupo } from './tatico.js';

// tamanho do grupo: níveis baixos pegam grupos menores
export function tamanhoGrupo(rng, nivel = 1, andar = 1) {
  const w = nivel <= 2 && andar <= 2 ? [0.62, 0.38, 0] : nivel <= 5 ? [0.45, 0.38, 0.17] : [0.38, 0.37, 0.25];
  const r = rng(); return r < w[0] ? 1 : r < w[0] + w[1] ? 2 : 3;
}
// escala: [esc, dm] do capítulo ou do nível; aj: ajuste de classe (dano); bonus: multiplicador extra de PV (andar)
export function criarGrupo({ pool, n = 1, escala, aj = 1, inercia = 0, ciclo = 1, rng = Math.random, bonus = 1 }) {
  const [eh, ed] = escala; const g = escalaGrupo(n); const base = pool[Math.floor(rng() * pool.length)]; const ids = [base];
  for (let i = 1; i < n; i++) ids.push(rng() < 0.6 ? base : pool[Math.floor(rng() * pool.length)]);
  return ids.map((id) => aplicarPerfil(R.criarMonstro(id, { inercia, ciclo, esc: eh * bonus * g.hp, ov: { dm: ed * Math.sqrt(aj) * g.dm } }), rng));
}
// monstro único (chefes): só aplica a personalidade
export const comPerfil = (m, rng = Math.random) => aplicarPerfil(m, rng);
