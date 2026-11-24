// Motor de combate por turnos com regras do D&D 5e (SRD). Sem DOM: o jogo apenas exibe os eventos.
import { CLASSES, MAGIAS, ITENS, rolar, d20 } from './srd.js';
import { derivar, modAtr } from './rules.js';

const saveMon = (m) => 1 + Math.floor(m.cr / 2);
const nomeSlot = (n) => `${n}º círculo`;

export function novaBatalha(s, mon, rng = Math.random, opts = {}) {
  const D = derivar(s), h = s.heroi, rec = JSON.parse(JSON.stringify(s.recursos));
  const H = {
    nome: h.nome, cls: h.cls, L: h.nivel, hp: Math.min(h.hp ?? D.hpMax, D.hpMax), hpMax: D.hpMax, hpMaxMod: 0, ca: D.ca, prof: D.prof, M: D.M, A: D.A,
    arma: D.arma, ataques: D.ataques, critMin: D.critMin, modAtq: D.modAtq, modDano: D.modDano, cd: D.cd, atqMagia: D.atqMagia, modConj: D.modConj, conj: D.conj,
    ini: D.ini - (h.sono ? 2 : 0), slots: rec.slots, cont: rec.cont, insp: h.insp || 0, exaust: h.exaustao || 0, regen: D.regen, resFogo: D.resFogo,
    conds: {}, letargia: 0, acoes: 1, bonus: 1, esq: false, primeiro: true, implacavel: 0, caBase: D.ca,
  };
  const inv = (s.inv || []).map((x) => ({ ...x }));
  const B = { rng, s, h: H, m: mon, rodada: 1, fim: null, ev: [], inv, usados: [], turno: 'heroi', chefe: !!mon.chefe, surpresa: !!opts.surpresa };
  B.m.sopro = true;
  const evs = [];
  evs.push(msg(`${mon.n} aparece!`, 'start'));
  const ih = d20(rng) + H.ini + (H.exaust >= 2 ? -99 : 0), im = d20(rng) + Math.floor(mon.cr / 3);
  if (B.surpresa) { evs.push(msg('Você pegou o inimigo de surpresa!')); }
  else if (im > ih) { evs.push(msg(`${mon.n} age primeiro!`)); turnoMonstro(B, evs); }
  else evs.push(msg('Você age primeiro!'));
  iniciaTurnoHeroi(B, evs);
  return { B, ev: evs };
}
const msg = (txt, snd) => ({ t: 'msg', txt, snd });
const hpMaxEf = (H) => Math.max(1, H.hpMax - H.hpMaxMod);

// ---------- utilidades de d20 ----------
function jogaD20(B, vant, desv) {
  const r1 = d20(B.rng); if (vant && !desv) return Math.max(r1, d20(B.rng)); if (desv && !vant) return Math.min(r1, d20(B.rng)); return r1;
}
function danoHeroi(B, n, tipo, evs, crit) {
  const m = B.m; n = Math.max(0, Math.round(n)); m.hp -= n; if (m.conds.dormindo) { m.conds.dormindo = false; evs.push(msg(`${m.n} acorda!`)); }
  if (tipo === 'fogo' || tipo === 'ácido') m.queimou = true;
  evs.push({ t: 'dano', alvo: 'm', n, crit, tipo }); return n;
}
function checaMorte(B, evs) {
  if (B.m.hp <= 0 && !B.fim) { B.m.hp = 0; B.fim = 'vitoria'; evs.push(msg(`${B.m.n} foi derrotado!`, 'win')); }
  return !!B.fim;
}
function danoNoHeroi(B, n, tipo, evs) {
  const H = B.h; n = Math.max(0, Math.round(n));
  if (H.conds.furia && (tipo === 'fis' || !tipo)) n = Math.floor(n / 2);
  if (tipo === 'fogo' && H.resFogo) n = Math.floor(n / 2);
  H.hp -= n; evs.push({ t: 'dano', alvo: 'h', n, tipo });
  if (H.hp <= 0) {
    if (H.conds.furia && H.L >= 11) {
      const dc = 10 + 5 * H.implacavel; const r = d20(B.rng) + H.M.CON; H.implacavel++;
      if (r >= dc) { H.hp = H.L * 2; evs.push(msg('Fúria Implacável! Você se recusa a cair.', 'heal')); return n; }
    }
    H.hp = 0; B.fim = 'derrota'; evs.push(msg('Você caiu...', 'lose'));
  }
  return n;
}
const hpAtual = (B) => B.h.hp;

// ---------- início do turno do herói ----------
function iniciaTurnoHeroi(B, evs) {
  const H = B.h, m = B.m; H.acoes = 1; H.bonus = 1; H.conds.descuidadoAtivo = false; H.furtivoUsado = false;
  if (H.regen && H.hp < hpMaxEf(H)) { const n = Math.min(H.regen, hpMaxEf(H) - H.hp); H.hp += n; evs.push({ t: 'cura', n }); }
  if (H.conds.armaEsp && !B.fim) {
    const r = d20(B.rng); if (r + H.atqMagia >= m.ca || r === 20) { const d = rolar(`1d8+${H.modConj}`, B.rng, r === 20).total; evs.push(msg('A Arma Espiritual golpeia!', 'hit')); danoHeroi(B, d, 'força', evs, r === 20); }
    else evs.push(msg('A Arma Espiritual erra.', 'miss'));
    checaMorte(B, evs);
  }
  if (H.perdeTurno && !B.fim) { H.perdeTurno = false; evs.push(msg('Você está paralisado e perde o turno!')); H.acoes = 0; B.turno = 'monstro'; turnoMonstro(B, evs); fimRodada(B, evs); if (!B.fim) iniciaTurnoHeroi(B, evs); }
}

// ---------- ataque com arma ----------
function ataqueArma(B, evs, op = {}) {
  const H = B.h, m = B.m; const L = H.L, cls = H.cls;
  let n = H.ataques + (H.conds.furia && cls === 'barbaro' && L >= 3 ? 1 : 0);
  let smiteNv = op.smite || 0, smiteUsado = false;
  for (let i = 0; i < n && !B.fim; i++) {
    const vant = H.conds.vant || H.conds.descuidado || m.conds.dormindo, desv = H.exaust >= 3 || !!m.conds.esquiva;
    let r = jogaD20(B, vant, desv); const bencao = H.conds.bencao ? rolar('1d4', B.rng).total : 0;
    let total = r + H.modAtq + bencao - H.letargia - (m.conds.lento ? 0 : 0);
    if (op.sorte && total < m.ca && H.cont.sorte > 0 && r !== 1) { H.cont.sorte--; total = 99; evs.push(msg('Golpe de Sorte!')); }
    const crit = (r >= H.critMin && r !== 1) || (m.conds.dormindo && total >= m.ca);
    const acerta = r !== 1 && (crit || total >= m.ca);
    if (!acerta) { evs.push({ t: 'erro', alvo: 'm', rolagem: r, total }); continue; }
    // dano
    const dado = H.arma.dado; const dmgExpr = (H.arma.duas && H.cls === 'guerreiro' ? dado : dado); let tot = 0;
    const base = rolar(dmgExpr, B.rng, crit); tot += base.total + H.modDano;
    let extra = '';
    if (H.arma.extra) { tot += rolar(H.arma.extra.dado, B.rng, crit).total; }
    if (H.conds.furia) tot += H.L >= 16 ? 4 : H.L >= 9 ? 3 : 2;
    if (cls === 'barbaro' && crit && L >= 9) { const k = L >= 17 ? 3 : L >= 13 ? 2 : 1; tot += rolar(`${k}${dado.replace(/^\d+/, '')}`, B.rng).total; }
    if (cls === 'paladino' && !H.arma.duas && !H.arma.dist) tot += 2; // Duelismo
    if (H.conds.favor) tot += rolar('1d4', B.rng, crit).total;
    if (cls === 'clerigo' && L >= 8) tot += rolar('1d8', B.rng, crit).total;
    if (cls === 'ladino' && !H.furtivoUsado && (vant || (H.primeiro && (B.surpresa || L >= 9)))) { H.furtivoUsado = true; const d = Math.ceil(L / 2); tot += rolar(`${d}d6`, B.rng, crit).total; extra = ' (Ataque Furtivo!)'; }
    if (cls === 'paladino') {
      if (smiteNv > 0 && !smiteUsado && H.slots[smiteNv - 1] > 0) { H.slots[smiteNv - 1]--; smiteUsado = true; const d = Math.min(5, 1 + smiteNv); tot += rolar(`${d}d8`, B.rng, true).total; extra = ' (Destruição Divina!)'; }
      if (L >= 11) tot += rolar('1d8', B.rng, crit).total;
    }
    evs.push(msg(`Você acerta${crit ? ' um CRÍTICO' : ''}${extra}!`, crit ? 'crit' : 'hit'));
    danoHeroi(B, tot, 'fis', evs, crit);
    if (checaMorte(B, evs)) break;
  }
  H.conds.vant = false; H.conds.guiado = false; H.primeiro = false;
}

// ---------- magias ----------
export function magiasDoHeroi(B) {
  const H = B.h; const out = [];
  const maxNv = H.slots.length;
  for (const [id, m] of Object.entries(MAGIAS)) {
    if (!m.cls.includes(H.cls)) continue;
    if (m.nv === 0) { out.push({ id, ...m, circulos: [0] }); continue; }
    const circulos = []; for (let n = m.nv; n <= maxNv; n++) if (H.slots[n - 1] > 0) circulos.push(n);
    const minNv = H.cls === 'paladino' ? 1 : 1; // paladino: lista limitada
    if (H.cls === 'paladino' && !['curar', 'bencao', 'favor'].includes(id)) continue;
    out.push({ id, ...m, circulos, conhecida: m.nv <= maxNv });
  }
  return out.filter((m) => m.nv === 0 || m.conhecida);
}
function dadosEscalados(m, nv, L) {
  let expr = m.dado;
  if (m.nv === 0) { const k = 1 + (L >= 5) + (L >= 11) + (L >= 17); expr = expr.replace(/^(\d+)d/, (a, n) => `${parseInt(n) * k}d`); return expr; }
  if (m.up && nv > m.nv) { const [n, f] = m.up.split('d'); expr += `+${parseInt(n) * (nv - m.nv)}d${f}`; }
  return expr;
}
export function conjurar(B, id, nv, evs) {
  const H = B.h, m = B.m, sp = MAGIAS[id]; nv = nv || sp.nv;
  if (sp.nv > 0) { if (!(H.slots[nv - 1] > 0)) { evs.push(msg('Sem espaços de magia desse círculo!')); return false; } H.slots[nv - 1]--; }
  evs.push(msg(`Você conjura ${sp.nome}${sp.nv > 0 ? ` (${nomeSlot(nv)})` : ''}!`, 'spell'));
  const bonusAv = H.cls === 'mago' && H.L >= 10 && ['salva', 'atq', 'auto'].includes(sp.tipo) && sp.nv > 0 ? H.M.INT : 0;
  if (sp.tipo === 'atq') {
    const raios = sp.raios ? sp.raios + (nv - sp.nv) : 1;
    for (let i = 0; i < raios && !B.fim; i++) {
      const vant = H.conds.vant || m.conds.dormindo, desv = H.exaust >= 3; const r = jogaD20(B, vant, desv);
      const tot = r + H.atqMagia + (H.conds.bencao ? rolar('1d4', B.rng).total : 0) - H.letargia; const crit = r === 20;
      if (r !== 1 && (crit || tot >= m.ca)) {
        const d = rolar(dadosEscalados(sp, nv, H.L), B.rng, crit).total + bonusAv; danoHeroi(B, d, sp.dano, evs, crit); checaMorte(B, evs);
      } else {
        evs.push({ t: 'erro', alvo: 'm', rolagem: r, total: tot });
        if (sp.nv === 0 && H.cls === 'mago' && H.L >= 6 && r !== 1) { const d = Math.floor(rolar(dadosEscalados(sp, nv, H.L), B.rng).total / 2); danoHeroi(B, d, sp.dano, evs, false); checaMorte(B, evs); }
      }
    }
    if (sp.efeito === 'lento') m.conds.lento = true;
    H.conds.vant = sp.efeito === 'guiado';
  } else if (sp.tipo === 'salva') {
    const r = d20(B.rng) + saveMon(m); const passou = r >= H.cd;
    let d = rolar(dadosEscalados(sp, nv, H.L), B.rng).total + bonusAv;
    if (!passou) danoHeroi(B, d, sp.dano, evs); else if (sp.metade) { evs.push(msg(`${m.n} resiste parcialmente.`)); danoHeroi(B, Math.floor(d / 2), sp.dano, evs); } else evs.push(msg(`${m.n} resiste à magia!`));
    checaMorte(B, evs);
  } else if (sp.tipo === 'auto') {
    const n = sp.dardos + (nv - sp.nv); let tot = 0; for (let i = 0; i < n; i++) tot += rolar(sp.dado, B.rng).total;
    danoHeroi(B, tot + bonusAv, sp.dano, evs); checaMorte(B, evs);
  } else if (sp.tipo === 'cura') {
    let n = sp.dado.includes('d') ? rolar(dadosEscalados(sp, nv, H.L), B.rng).total + H.modConj : parseInt(sp.dado);
    if (H.cls === 'clerigo') { n += 2 + nv; if (H.L >= 17 && sp.dado.includes('d')) { const mm = dadosEscalados(sp, nv, H.L).match(/(\d+)d(\d+)/g) || []; n = mm.reduce((a, t) => { const [x, f] = t.split('d').map(Number); return a + x * f; }, 0) + H.modConj + 2 + nv; } }
    n = Math.max(1, n); const antes = H.hp; H.hp = Math.min(hpMaxEf(H), H.hp + n); evs.push({ t: 'cura', n: H.hp - antes });
  } else if (sp.tipo === 'sono') {
    const tot = rolar(dadosEscalados(sp, nv, H.L), B.rng).total;
    if (m.chefe) evs.push(msg(`${m.n} é poderoso demais para dormir!`));
    else if (m.hp <= tot) { m.conds.dormindo = true; evs.push(msg(`${m.n} adormece! (${tot} PV de sono)`)); }
    else evs.push(msg(`${m.n} resiste ao sono (${tot} contra ${m.hp} PV).`));
  } else if (sp.tipo === 'buff') {
    const k = sp.buff; H.conds[k] = true;
    if (k === 'armadura') { H.ca = Math.max(H.ca, 13 + H.M.DES); }
    evs.push(msg(`${sp.nome} ativo até o fim do combate.`, 'spell'));
  } else if (sp.tipo === 'matar') {
    if (m.hp <= sp.limite) { m.hp = 0; evs.push(msg('A palavra de poder cala o inimigo.')); checaMorte(B, evs); } else evs.push(msg(`${m.n} aguenta a palavra de poder!`));
  }
  return true;
}

// ---------- ações do herói ----------
export function acoesHeroi(B) {
  const H = B.h; const a = []; const m = B.m;
  const add = (id, rot, desc, extra = {}) => a.push({ id, rot, desc, ...extra });
  add('atacar', 'Atacar', `${H.ataques > 1 ? H.ataques + ' ataques' : '1 ataque'} com ${H.arma.nome}`, { acao: true });
  if (H.cls === 'paladino') for (let n = 1; n <= H.slots.length; n++) if (H.slots[n - 1] > 0) add('smite' + n, `Destruição Divina ${n}º`, `Ataque + ${Math.min(5, 1 + n)}d8 radiante (1 espaço de ${n}º)`, { acao: true, arg: n });
  if (H.cls === 'guerreiro') { if (H.cont.folego > 0) add('folego', 'Retomar o Fôlego', `Bônus: cura 1d10+${H.L} (${H.cont.folego} usos)`, { bonus: true }); if (H.cont.surto > 0) add('surto', 'Surto de Ação', `Ganha uma ação extra (${H.cont.surto} usos)`, { livre: true }); }
  if (H.cls === 'barbaro') { if (!H.conds.furia && H.cont.furia > 0) add('furia', 'Fúria', `Bônus: +dano e resistência física (${H.cont.furia >= 99 ? '∞' : H.cont.furia} usos)`, { bonus: true }); if (H.L >= 2 && !H.conds.descuidado) add('descuidado', 'Ataque Descuidado', 'Vantagem nos ataques; inimigos também têm', { livre: true }); }
  if (H.cls === 'ladino' && H.cont.ardil > 0) add('ardil', 'Ação Ardilosa', `Bônus: esconder-se → vantagem (${H.cont.ardil} Ardis)`, { bonus: true });
  if (H.cls === 'ladino' && H.cont.sorte > 0) add('sorte', 'Golpe de Sorte', 'Seu próximo erro vira acerto', { livre: true });
  if (H.cls === 'mago' && H.cont.recup > 0) add('recup', 'Recuperação Arcana', 'Recupera espaços de magia', { acao: true });
  if (H.cls === 'clerigo' && H.cont.canal > 0) { if (m.tags && m.tags.includes('morto')) add('expulsar', 'Expulsar Mortos-Vivos', `Canalizar Divindade (${H.cont.canal})`, { acao: true }); add('preservar', 'Preservar a Vida', `Canalizar: cura ${5 * H.L} PV (${H.cont.canal})`, { acao: true }); }
  if (H.cls === 'paladino') { if (H.cont.maos > 0) add('maos', 'Cura pelas Mãos', `Cura até 25 PV (reserva: ${H.cont.maos})`, { acao: true }); if (H.cont.canal > 0 && H.L >= 3) add('sagrada', 'Arma Sagrada', `+${Math.max(1, H.M.CAR)} nos ataques no combate`, { bonus: true }); }
  if (H.insp > 0) add('insp', 'Inspiração', `Vantagem no próximo ataque (${H.insp})`, { livre: true });
  add('esquivar', 'Esquivar', 'Inimigo ataca com desvantagem até o seu próximo turno', { acao: true });
  add('fugir', 'Fugir', B.chefe ? 'Impossível fugir de chefes!' : 'Tentar escapar da luta', { acao: true, off: B.chefe });
  return a;
}
export function podeAgir(B, a) { const H = B.h; if (a.off) return false; if (a.acao && H.acoes <= 0) return false; if (a.bonus && H.bonus <= 0) return false; return true; }

export function agir(B, id, arg) {
  const H = B.h, m = B.m; const evs = []; let fimTurno = false;
  if (B.fim) return evs;
  const gasta = (tipo) => { if (tipo === 'acao') { H.acoes--; } else if (tipo === 'bonus') { H.bonus--; } };
  if (id === 'atacar' || id.startsWith('smite')) {
    if (H.acoes <= 0) return evs; gasta('acao'); ataqueArma(B, evs, { smite: id.startsWith('smite') ? parseInt(id.slice(5)) : 0, sorte: H.conds.sortePronta }); H.conds.sortePronta = false;
  } else if (id === 'magia') {
    const sp = MAGIAS[arg.id]; if (sp.bonus) { if (H.bonus <= 0) return evs; gasta('bonus'); conjurar(B, arg.id, arg.nv, evs); }
    else { if (H.acoes <= 0) return evs; gasta('acao'); conjurar(B, arg.id, arg.nv, evs); }
  } else if (id === 'item') {
    if (H.acoes <= 0) return evs; const ok = usarItem(B, arg, evs); if (!ok) return evs; gasta('acao');
  } else if (id === 'folego') { if (H.bonus <= 0 || H.cont.folego <= 0) return evs; gasta('bonus'); H.cont.folego--; const n = rolar('1d10', B.rng).total + H.L; const a = H.hp; H.hp = Math.min(hpMaxEf(H), H.hp + n); evs.push(msg('Você retoma o fôlego!', 'heal')); evs.push({ t: 'cura', n: H.hp - a }); }
  else if (id === 'surto') { if (H.cont.surto <= 0) return evs; H.cont.surto--; H.acoes += 1; evs.push(msg('Surto de Ação! Você ganha uma ação extra.', 'spell')); }
  else if (id === 'furia') { if (H.bonus <= 0 || H.cont.furia <= 0) return evs; gasta('bonus'); if (H.cont.furia < 99) H.cont.furia--; H.conds.furia = true; evs.push(msg('FÚRIA! Seu sangue ferve.', 'crit')); }
  else if (id === 'descuidado') { H.conds.descuidado = true; evs.push(msg('Ataque Descuidado: vantagem, mas você se expõe.')); }
  else if (id === 'ardil') { if (H.bonus <= 0 || H.cont.ardil <= 0) return evs; gasta('bonus'); H.cont.ardil--; H.conds.vant = true; evs.push(msg('Você some nas sombras e ganha vantagem.')); }
  else if (id === 'sorte') { H.conds.sortePronta = true; evs.push(msg('Golpe de Sorte preparado.')); }
  else if (id === 'insp') { if (H.insp <= 0) return evs; H.insp--; H.conds.vant = true; evs.push(msg('Inspiração! Vantagem no próximo ataque.', 'spell')); }
  else if (id === 'recup') {
    if (H.acoes <= 0 || H.cont.recup <= 0) return evs; gasta('acao'); H.cont.recup--; let orc = Math.ceil(H.L / 2); const rest = [];
    for (let n = Math.min(5, H.slots.length); n >= 1; n--) { const max = recMaxSlots(B, n); while (orc >= n && H.slots[n - 1] < max) { H.slots[n - 1]++; orc -= n; rest.push(n); } }
    evs.push(msg(rest.length ? `Recuperação Arcana: ${rest.map((n) => nomeSlot(n)).join(', ')}.` : 'Nada a recuperar.', 'spell'));
  } else if (id === 'expulsar') {
    if (H.acoes <= 0) return evs; gasta('acao'); H.cont.canal--; const r = d20(B.rng) + saveMon(m);
    if (r >= H.cd) evs.push(msg(`${m.n} resiste à luz sagrada.`));
    else { const dest = H.L >= 17 ? 4 : H.L >= 14 ? 3 : H.L >= 11 ? 2 : H.L >= 8 ? 1 : H.L >= 5 ? 0.5 : -1; if (m.cr <= dest) { m.hp = 0; evs.push(msg(`${m.n} é destruído pela luz!`, 'crit')); checaMorte(B, evs); } else { m.conds.perde = 2; evs.push(msg(`${m.n} foge aterrorizado por 2 turnos!`)); } }
  } else if (id === 'preservar') { if (H.acoes <= 0) return evs; gasta('acao'); H.cont.canal--; const a = H.hp; H.hp = Math.min(hpMaxEf(H), H.hp + 5 * H.L); evs.push(msg('Preservar a Vida!', 'heal')); evs.push({ t: 'cura', n: H.hp - a }); }
  else if (id === 'maos') { if (H.acoes <= 0 || H.cont.maos <= 0) return evs; gasta('acao'); const n = Math.min(H.cont.maos, 25, hpMaxEf(H) - H.hp); H.cont.maos -= n; H.hp += n; evs.push(msg('Cura pelas Mãos!', 'heal')); evs.push({ t: 'cura', n }); }
  else if (id === 'sagrada') { if (H.bonus <= 0) return evs; gasta('bonus'); H.cont.canal--; H.modAtq += Math.max(1, H.M.CAR); evs.push(msg('Arma Sagrada brilha!', 'spell')); }
  else if (id === 'esquivar') { if (H.acoes <= 0) return evs; gasta('acao'); H.conds.esquivando = true; evs.push(msg('Você assume uma postura defensiva.')); }
  else if (id === 'fugir') {
    if (H.acoes <= 0 || B.chefe) return evs; gasta('acao');
    const dc = 10 + Math.floor(m.cr / 2) + (H.exaust >= 2 ? 4 : 0); const r = jogaD20(B, false, H.exaust >= 1) + H.M.DES;
    if (r >= dc) { B.fim = 'fuga'; evs.push(msg('Você escapa!', 'flee')); } else evs.push(msg('Você não consegue escapar!'));
  }
  if (B.fim) return evs;
  // fim do turno se acabou a ação principal
  if (H.acoes <= 0) { turnoMonstro(B, evs); if (!B.fim) fimRodada(B, evs); if (!B.fim) iniciaTurnoHeroi(B, evs); }
  return evs;
}
export function passarTurno(B) { const evs = []; B.h.acoes = 0; turnoMonstro(B, evs); if (!B.fim) fimRodada(B, evs); if (!B.fim) iniciaTurnoHeroi(B, evs); return evs; }
function recMaxSlots(B, nv) { return (B.s && B.s.recursosMax && B.s.recursosMax.slots[nv - 1]) || B.h.slots[nv - 1]; }

function usarItem(B, idx, evs) {
  const H = B.h; const slot = B.inv[idx]; if (!slot || slot.n <= 0) return false; const it = ITENS[slot.id];
  if (!it || it.tipo !== 'consumivel') return false;
  if (it.cura) { const n = rolar(it.cura, B.rng).total; const a = H.hp; H.hp = Math.min(hpMaxEf(H), H.hp + n); evs.push(msg(`Você usa ${it.nome}.`, 'heal')); evs.push({ t: 'cura', n: H.hp - a }); }
  else if (it.dano) { const n = rolar(it.dano, B.rng).total; evs.push(msg(`Você arremessa ${it.nome}!`, 'hit')); danoHeroi(B, n, it.danoTipo, evs); checaMorte(B, evs); }
  else if (it.magia) { const sp = MAGIAS[it.magia]; const save = H.slots[it.nvMagia - 1]; H.slots[it.nvMagia - 1] = (save || 0) + 1; conjurar(B, it.magia, it.nvMagia, evs); }
  else if (it.fuga) { if (B.chefe) { evs.push(msg('O chefe ignora a fumaça!')); } else { B.fim = 'fuga'; evs.push(msg('Você some em uma nuvem de pó.', 'flee')); } }
  else if (it.insp) { H.insp++; evs.push(msg('Você sente a inspiração fluindo.')); }
  else { evs.push(msg('Isso não pode ser usado em combate.')); return false; }
  slot.n--; B.usados.push(slot.id); return true;
}

// ---------- turno do monstro ----------
function turnoMonstro(B, evs) {
  const H = B.h, m = B.m; if (B.fim) return;
  m.rodada++; const esp = m.esp || {};
  if (m.conds.dormindo) { evs.push(msg(`${m.n} dorme.`)); return; }
  if (m.conds.perde > 0) { m.conds.perde--; evs.push(msg(`${m.n} está atordoado e perde o turno.`)); return; }
  if (esp.regen && m.hp < m.hpMax && !m.queimou) { const n = Math.min(esp.regen, m.hpMax - m.hp); m.hp += n; evs.push(msg(`${m.n} regenera ${n} PV.`)); }
  m.queimou = false;
  if (H.conds.guardioes) { const r = d20(B.rng) + saveMon(m); const d = rolar('3d8', B.rng).total; danoHeroi(B, r >= H.cd ? Math.floor(d / 2) : d, 'radiante', evs); evs.push(msg('Guardiões Espirituais ferem o inimigo.')); if (checaMorte(B, evs)) return; }
  if (esp.letargia) { const r = d20(B.rng) + H.M.CON + (H.conds.bencao ? 2 : 0); if (r < esp.letargia.dc) { H.letargia = Math.min(5, H.letargia + 1); evs.push(msg('A Aura de Letargia pesa em seus músculos (−1 em ataques).')); } }
  if (esp.inercia && m.rodada % esp.inercia.cada === 0) { const r = d20(B.rng) + H.M.CON; if (r < esp.inercia.dc) { H.perdeTurno = true; evs.push(msg('INÉRCIA! O tempo congela ao seu redor...', 'spell')); } else evs.push(msg('Você resiste à Inércia!')); }
  if (esp.olhar) { const r = d20(B.rng) + H.M.CON; if (r < esp.olhar.dc) { H.perdeTurno = true; evs.push(msg('O olhar petrifica seus músculos!')); } }
  // sopro / magia
  if (esp.sopro && !m.sopro && d20(B.rng) >= 17) { m.sopro = true; }
  if (esp.sopro && m.sopro && B.rng() < 0.55) {
    m.sopro = false; evs.push(msg(`${m.n} usa ${esp.sopro.n}!`, 'spell'));
    const r = d20(B.rng) + H.M[esp.sopro.atr] + (H.conds.bencao ? 2 : 0); const d = Math.round(rolar(esp.sopro.d, B.rng).total * (m.dm || 1));
    const evasao = H.cls === 'ladino' && H.L >= 7 && esp.sopro.atr === 'DES';
    if (r >= esp.sopro.dc) danoNoHeroi(B, evasao ? 0 : Math.floor(d / 2), esp.sopro.t, evs); else danoNoHeroi(B, evasao ? Math.floor(d / 2) : d, esp.sopro.t, evs);
    return;
  }
  H.esq = false;
  for (const a of m.atq) {
    if (B.fim) break;
    const vant = H.conds.descuidado && H.conds.descuidadoAtivo !== false; let desv = H.conds.esquivando || !!m.conds.lento;
    let vantM = vant && !(H.cls === 'ladino' && H.L >= 18);
    const r = jogaD20(B, vantM, desv); const crit = r === 20;
    const total = r + a.b + 0; const ca = H.ca + (H.conds.esquivando ? 0 : 0);
    if (r !== 1 && (crit || total >= ca)) {
      let d = Math.round(rolar(a.d, B.rng, crit).total * (m.dm || 1));
      if (H.cls === 'ladino' && H.L >= 5 && !H.esq) { H.esq = true; d = Math.floor(d / 2); }
      danoNoHeroi(B, d, a.t, evs); evs.push(msg(`${m.n} acerta com ${a.n}${crit ? ' (CRÍTICO)' : ''}.`, 'hurt'));
      if (!B.fim) {
        if (esp.veneno && !(H.cls === 'paladino' && H.L >= 3)) { const rs = d20(B.rng) + H.M.CON; const dv = rolar(esp.veneno.d, B.rng).total; danoNoHeroi(B, rs >= esp.veneno.dc ? Math.floor(dv / 2) : dv, 'veneno', evs); }
        if (!B.fim && esp.paralisa) { const rs = d20(B.rng) + H.M.CON; if (rs < esp.paralisa.dc) { H.perdeTurno = true; evs.push(msg('Você fica paralisado!')); } }
        if (!B.fim && esp.drena && a.t === 'necrótico') { const red = Math.floor(d / 3); H.hpMaxMod = Math.min(H.hpMax - 1, H.hpMaxMod + red); if (H.hp > hpMaxEf(H)) H.hp = hpMaxEf(H); if (red) evs.push(msg(`Seu PV máximo cai ${red} neste combate.`)); }
      }
    } else evs.push({ t: 'erro', alvo: 'h', rolagem: r, total, nome: a.n });
  }
  H.conds.descuidadoAtivo = true;
}
function fimRodada(B, evs) {
  const H = B.h; B.rodada++; H.conds.esquivando = false; if (!H.conds.descuidado) {} else H.conds.descuidado = false;
  if (B.m.esp && B.m.esp.sopro && !B.m.sopro && B.rng() < 0.33) { B.m.sopro = true; }
}

// ---------- IA para simulação e para "Auto" ----------
export function iaEscolher(B) {
  const H = B.h, m = B.m; const acts = acoesHeroi(B).filter((a) => podeAgir(B, a));
  const ids = acts.map((a) => a.id);
  const pot = B.inv.findIndex((x) => x.n > 0 && ITENS[x.id] && ITENS[x.id].cura);
  if (H.hp < hpMaxEf(H) * 0.35 && pot >= 0 && H.acoes > 0) return { id: 'item', arg: pot };
  if (H.hp < hpMaxEf(H) * 0.4 && ids.includes('folego')) return { id: 'folego' };
  if (H.hp < hpMaxEf(H) * 0.4 && ids.includes('maos')) return { id: 'maos' };
  if (ids.includes('furia')) return { id: 'furia' };
  if (ids.includes('ardil') && H.cls === 'ladino') return { id: 'ardil' };
  if (H.acoes === 0 && ids.includes('surto')) return null;
  if (H.acoes === 1 && ids.includes('surto') && m.hp > 20) return { id: 'surto' };
  const mags = magiasDoHeroi(B);
  if (H.cls === 'clerigo') {
    const g = mags.find((x) => x.id === 'guardioes' && x.circulos.length); if (g && !H.conds.guardioes && (m.hp > 25 || m.chefe)) return { id: 'magia', arg: { id: 'guardioes', nv: g.circulos[0] } };
    const a = mags.find((x) => x.id === 'arma_esp' && x.circulos.length); if (a && !H.conds.armaEsp && (m.hp > 25 || m.chefe) && H.bonus > 0) return { id: 'magia', arg: { id: 'arma_esp', nv: a.circulos[0] } };
  }
  if (H.cls === 'paladino') { const f = mags.find((x) => x.id === 'favor' && x.circulos.length); if (f && !H.conds.favor && m.chefe && H.bonus > 0) return { id: 'magia', arg: { id: 'favor', nv: f.circulos[0] } }; }
  if (H.cls === 'mago' || H.cls === 'clerigo') {
    if (H.hp < hpMaxEf(H) * 0.45 && H.cls === 'clerigo') { const cura = mags.filter((x) => x.tipo === 'cura' && x.circulos.length && !x.bonus).sort((a, b) => b.nv - a.nv)[0]; if (cura) return { id: 'magia', arg: { id: cura.id, nv: cura.circulos[cura.circulos.length - 1] } }; }
    if (H.cls === 'clerigo' && !H.conds.bencao && ids.includes('magia') && false) {}
    const dmg = mags.filter((x) => ['salva', 'atq', 'auto'].includes(x.tipo) && x.nv > 0 && x.circulos.length).sort((a, b) => b.nv - a.nv);
    if (dmg.length && (m.hp > 20 || m.chefe)) { const sp = dmg[0]; return { id: 'magia', arg: { id: sp.id, nv: sp.circulos[0] } }; }
    const can = mags.filter((x) => x.nv === 0 && ['atq', 'salva'].includes(x.tipo))[0]; if (can) return { id: 'magia', arg: { id: can.id, nv: 0 } };
  }
  if (H.cls === 'paladino') { const sm = acts.filter((a) => a.id.startsWith('smite')).pop(); if (sm && (m.hp > 25)) return { id: sm.id }; }
  return { id: 'atacar' };
}
export function simular(s, mon, rng, maxTurnos = 60) {
  const { B } = novaBatalha(s, mon, rng); let t = 0;
  while (!B.fim && t++ < maxTurnos) {
    let guard = 0;
    while (!B.fim && B.h.acoes > 0 && guard++ < 6) {
      const bonusAcoes = acoesHeroi(B).filter((a) => podeAgir(B, a) && (a.bonus || a.livre));
      const esc = iaEscolher(B); if (!esc) break; agir(B, esc.id, esc.arg);
      if (B.h.acoes <= 0 || B.fim) break;
    }
    if (!B.fim && B.h.acoes > 0) passarTurno(B);
  }
  return B;
}
