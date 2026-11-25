// Hora do mundo: o relógio real do aparelho (o dia do jogo acompanha o seu). Dá para pré-visualizar outra hora só nesta sessão.
let forcada = null;
export const forcarHora = (h) => { acel = false; forcada = h == null || Number.isNaN(+h) ? null : ((+h % 24) + 24) % 24; };
export const horaForcada = () => forcada;
export function horaAtual() { if (forcada != null) return forcada; const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }
export function faseDe(h) {
  if (h < 5) return 'Madrugada'; if (h < 6.8) return 'Amanhecer'; if (h < 11) return 'Manhã'; if (h < 14) return 'Meio-dia'; if (h < 17) return 'Tarde'; if (h < 19) return 'Entardecer'; if (h < 21) return 'Anoitecer'; return 'Noite';
}
// Dia acelerado (só pré-visualização): 24 h passam em ~1 minuto, para ver as sombras girarem
let acel = false;
export const diaAcelerado = () => acel;
export function acelerar(on) { acel = !!on; if (acel && forcada == null) forcada = horaAtual(); }
export function passoRelogio(dt) { if (acel && forcada != null) forcada = (forcada + dt * 0.4) % 24; }
