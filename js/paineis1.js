// Painéis da vida real: Arena de Ferro, Trilha, Biblioteca, Taverna e Quadro de Missões.
import * as St from './store.js';
import * as R from './rules.js';
import { CLASSES } from './srd.js';
import { recursosMax, recursosComFator } from './srd.js';
import { LIFTS, GRUPOS_TREINO, AERO, INTENSIDADES, ESTUDO_TIPOS, ESTUDO_CATS, TIERS, TIER_COR, ATR_FONTE } from './conteudo.js';
import { registrar, rerender, esc, fmt, val, valNum, toast, pct, $ } from './uibase.js';
import { S, tierTag, escada, barra, multXpAprox, xpPrev, mmss, recursosHtml } from './uiutil.js';
import * as Au from './audio.js';

// ======================= ARENA DE FERRO =======================
const arenaVar = {}; let arenaMsg = '';
function sugestoes(vid, e1) {
  const L = LIFTS[vid], peso = S().heroi.peso, need = e1 * 1.006, out = [];
  for (const r of [3, 5, 8]) { const ef = need / (1 + Math.min(r, 12) / 30); const c = vid === 'barra_fixa' ? ef - peso : ef; if (c > 0) out.push(`${r} reps com ${fmt(Math.ceil(c * 2) / 2, 1)} kg`); else if (vid === 'barra_fixa') out.push(`${r} reps sem carga extra (mais reps)`); }
  return out.slice(0, 3).join(' · ') || 'Mais repetições que da última vez';
}
function cartaoGrupo(g) {
  const s = S(), vid = arenaVar[g.id] || g.variantes[0], L = LIFTS[vid], t = s.treino[vid], e1 = t ? t.best.e1 : 0, D = St.dia();
  const inf = e1 ? R.infoTier(vid, e1, s.heroi.sexo, s.heroi.peso) : null; const melhor = R.melhorDoGrupo(s, g.id);
  const abas = g.variantes.length > 1 ? `<div class="abas">${g.variantes.map((v) => `<button class="${v === vid ? 'sel' : ''}" data-act="variante" data-g="${g.id}" data-v="${v}">${esc(LIFTS[v].nome)}</button>`).join('')}</div>` : '';
  let corpo;
  if (!inf) corpo = `<p class="suave">Sem registro. A primeira série define sua <b>linha de base</b> (+60 XP). Use uma carga com que faça de 3 a 8 repetições.</p>`;
  else {
    const lo = inf.tier === 0 ? 0 : inf.thr[inf.tier - 1], hi = inf.prox;
    corpo = `<p class="peq">Melhor: <b>${fmt(t.best.w, 1)} kg × ${t.best.r}</b> · e1RM <b class="gold">${fmt(e1, 1)} kg</b> ${t.best.data ? `<span class="suave">(${t.best.data.slice(8)}/${t.best.data.slice(5, 7)})</span>` : ''}</p>${escada(inf.tier)}
      ${hi ? `${barra(e1 - lo, hi - lo)}<p class="peq suave">Próximo rank: ${tierTag(inf.tier + 1)} em <b>${fmt(hi, 1)} kg</b> (faltam ${fmt(hi - e1, 1)} kg de e1RM)</p>` : '<p class="peq gold">Rank máximo! Você é Mítico neste exercício.</p>'}
      <p class="peq suave">Para bater PR: e1RM acima de ${fmt(e1, 1)} → ${esc(sugestoes(vid, e1))}</p>`;
  }
  return `<div class="card"><h4><span>${L.emoji} ${esc(g.nome)}</span>${melhor ? tierTag(melhor.inf.tier) : '<span class="tag" style="background:#555">sem rank</span>'}</h4>${abas}<p class="peq suave">${esc(L.dica)}</p>${corpo}
    <div class="linha"><div><label class="campo" for="ar-c-${vid}">${vid === 'barra_fixa' ? 'Carga extra (kg)' : 'Carga (kg)'}</label><input id="ar-c-${vid}" type="number" inputmode="decimal" step="0.5" min="0" placeholder="${vid === 'barra_fixa' ? '0' : 'kg'}"></div>
    <div><label class="campo" for="ar-r-${vid}">Repetições</label><input id="ar-r-${vid}" type="number" inputmode="numeric" min="1" max="40" placeholder="reps"></div></div>
    <button class="btn pri bloco" data-act="serie" data-lift="${vid}">Registrar série ${D.liftSets[vid] ? `(${D.liftSets[vid]} hoje)` : ''}</button></div>`;
}
function descreverSerie(res, nome) {
  const l = [];
  if (res.baseline) l.push(`<b>Linha de base definida</b> para ${esc(nome)}: e1RM ${fmt(res.e1, 1)} kg (+${res.base} XP).`);
  if (res.aquec) l.push('Série de aquecimento (abaixo de 50% do seu melhor): sem XP base.'); else if (res.limite) l.push('Limite de 6 séries pontuáveis por exercício hoje: sem XP base.');
  else if (res.base && !res.baseline) l.push(`+${res.base} XP base (quanto mais perto do seu melhor, mais XP).`);
  if (res.pr) l.push(`<b class="gold">NOVO PR!</b> e1RM ${fmt(res.pr.de, 1)} → ${fmt(res.pr.para, 1)} kg (+${fmt(res.pr.delta, 1)}) · +${res.prXp} XP.`);
  if (res.tierUp) l.push(`<b class="gold">RANK UP:</b> ${esc(TIERS[res.tierUp.de])} → ${esc(TIERS[res.tierUp.para])}!`);
  if (res.tocha) l.push('🕯️ +1 Tocha por volume de treino!');
  return `<div class="dica">${l.join('<br>')}</div>`;
}
registrar('arena', {
  titulo: 'Arena de Ferro',
  render() {
    const s = S(), D = St.dia(); const extras = s.extras.slice().sort((a, b) => b.melhor - a.melhor);
    return `${arenaMsg}<p class="suave">Mestre Ferrão: só contam <b>Supino, Terra, Agachamento, Barra/Puxada, Remada e Desenvolvimento lateral</b>. PR = e1RM (Epley) acima do seu melhor. O rank sobe com a carga relativa ao seu peso (${fmt(s.heroi.peso, 1)} kg).</p>
    <div class="card"><div class="linha"><span>Hoje: <b>${D.series}</b> série(s) pontuável(is) · <b class="gold">${D.xp} XP</b> no dia</span>${D.treinoFim ? '<span class="tag" style="background:#6fcf7f">treino finalizado</span>' : ''}</div>
    <button class="btn ok bloco" data-act="finalizar" ${D.treinoFim || D.series < 3 ? 'disabled' : ''}>Finalizar treino ${D.series < 3 ? '(mín. 3 séries)' : '(+bônus e baú)'}</button>
    ${St.podeDesfazer() ? '<button class="btn peq bloco" data-act="desfazer">↩ Desfazer última ação</button>' : ''}</div>
    ${GRUPOS_TREINO.map(cartaoGrupo).join('')}
    <h3>Outros exercícios</h3><p class="suave peq">Não pontuam de verdade (+2 XP por série, até 10 por dia): servem para registrar o resto do treino.</p>
    <div class="card"><label class="campo" for="ex-n">Exercício</label><input id="ex-n" placeholder="Ex.: Rosca direta" maxlength="40"><div class="linha"><div><label class="campo" for="ex-c">Carga (kg)</label><input id="ex-c" type="number" inputmode="decimal" step="0.5"></div><div><label class="campo" for="ex-r">Reps</label><input id="ex-r" type="number" inputmode="numeric"></div></div><button class="btn bloco" data-act="extra">Adicionar série extra</button></div>
    ${extras.map((e) => `<div class="lista-item"><div class="nome">${esc(e.nome)}<small>${e.sets} série(s) · último ${e.ultimo ? fmt(e.ultimo.w, 1) + ' kg × ' + e.ultimo.r : '-'}</small></div><button class="btn peq ruim" data-act="delextra" data-id="${e.id}">✕</button></div>`).join('')}`;
  },
  acoes: {
    variante: (el) => { arenaVar[el.dataset.g] = el.dataset.v; rerender(); },
    serie: (el) => {
      const vid = el.dataset.lift; const c = valNum('ar-c-' + vid), r = valNum('ar-r-' + vid); const res = St.registrarSerie(vid, isNaN(c) ? 0 : c, r);
      if (res.erro) return toast(res.erro); Au.sfx(res.pr ? 'pr' : 'coin'); Au.vibrar(25); arenaMsg = descreverSerie(res, LIFTS[vid].nome); rerender(); $('#painel-corpo').scrollTop = 0;
    },
    finalizar: () => { const r = St.finalizarTreino(); if (r.erro) return toast(r.erro); arenaMsg = `<div class="dica"><b>Treino finalizado!</b> +${r.xp} XP e um baú de recompensa.</div>`; rerender(); $('#painel-corpo').scrollTop = 0; },
    desfazer: () => { St.desfazer(); arenaMsg = '<div class="aviso">Última ação desfeita.</div>'; rerender(); },
    extra: () => { const r = St.registrarSerieExtra(val('ex-n'), valNum('ex-c') || 0, valNum('ex-r') || 0); if (r.erro) return toast(r.erro); arenaMsg = `<div class="dica">Série extra registrada${r.xp ? ` (+${r.xp} XP)` : ' (limite diário de XP extra atingido)'}.</div>`; rerender(); },
    delextra: (el) => { St.removerExtra(el.dataset.id); rerender(); },
  },
});

// ======================= TRILHA (AERÓBICO) =======================
let trilhaMsg = '';
function prevCardio() {
  const s = S(), D = St.dia(); const at = AERO.find((a) => a.id === val('tr-at')) || AERO[0], it = INTENSIDADES.find((i) => i.id === val('tr-in')) || INTENSIDADES[1]; const min = Math.round(valNum('tr-min')) || 0;
  const xp = Math.round(xpPrev(D.cardio, min, [60, 120], at.mult * it.f) * multXpAprox('aeroXp'));
  return min > 0 ? `≈ <b class="gold">${xp} XP</b> (${esc(at.nome)} ×${at.mult} · ${esc(it.nome)})` : 'Informe os minutos para ver o XP estimado.';
}
registrar('trilha', {
  titulo: 'Trilha — Aeróbico',
  render() {
    const s = S(), D = St.dia(); const t = s.timers.cardio; const sem = [];
    for (let i = 6; i >= 0; i--) { const d = R.addDias(St.hoje(), -i); const x = s.dias[d]; sem.push({ d, m: x ? x.cardio : 0 }); } const max = Math.max(30, ...sem.map((x) => x.m));
    return `${trilhaMsg}<p class="suave">Aeróbico é por <b>minuto</b>, com multiplicador por atividade. Os primeiros 60 min do dia rendem 100%, até 120 min 60% e depois 25% (descanso também é treino).</p>
    <div class="card"><label class="campo" for="tr-at">Atividade</label><select id="tr-at" data-on="prev">${AERO.map((a) => `<option value="${a.id}">${a.emoji} ${esc(a.nome)} — ×${a.mult}</option>`).join('')}</select>
    <div class="linha"><div><label class="campo" for="tr-min">Minutos</label><input id="tr-min" type="number" inputmode="numeric" min="1" max="600" data-on="prev" placeholder="min"></div><div><label class="campo" for="tr-in">Intensidade</label><select id="tr-in" data-on="prev">${INTENSIDADES.map((i) => `<option value="${i.id}" ${i.id === 'moderado' ? 'selected' : ''}>${i.nome} (×${i.f})</option>`).join('')}</select></div></div>
    <p id="tr-prev" class="peq">${prevCardio()}</p><button class="btn pri bloco" data-act="reg">Registrar aeróbico</button></div>
    <div class="card"><h4><span>⏱️ Cronômetro</span></h4>${t ? `<div class="timer" id="tr-cron">${mmss(Date.now() - t.t0)}</div><button class="btn ok bloco" data-act="parar">Parar e usar o tempo</button><button class="btn peq bloco" data-act="cancelar">Cancelar</button>` : '<p class="peq suave">Inicie ao começar a atividade e pare ao final: os minutos são preenchidos para você.</p><button class="btn bloco" data-act="iniciar">Iniciar cronômetro</button>'}</div>
    <h3>Hoje</h3><div class="card"><p><b>${D.cardio} min</b> de aeróbico · <b class="gold">🕯️ +1 Tocha</b> aos 20 min e aos 60 min.</p>${barra(Math.min(D.cardio, 60), 60, 'azul')}<p class="peq suave">20 min ${D.toch.cardio >= 1 ? '✔' : '○'} · 60 min ${D.toch.cardio >= 2 ? '✔' : '○'} · sessões de 15+ min dão um baú.</p></div>
    <h3>Últimos 7 dias</h3><div class="card"><div style="display:flex;gap:5px;align-items:flex-end;height:80px">${sem.map((x) => `<div style="flex:1;text-align:center;font-size:9px"><div style="height:${Math.max(2, (x.m / max) * 60)}px;background:var(--azul);border:1px solid #000"></div>${x.m}<br>${x.d.slice(8)}</div>`).join('')}</div></div>`;
  },
  ao: { prev: () => { const p = $('#tr-prev'); if (p) p.innerHTML = prevCardio(); } },
  acoes: {
    reg: () => {
      const r = St.registrarCardio(val('tr-at'), valNum('tr-min'), val('tr-in')); if (r.erro) return toast(r.erro); Au.sfx('coin'); Au.vibrar(25);
      trilhaMsg = `<div class="dica"><b>${esc(r.at.nome)}</b>: +${r.xp} XP${r.tocha ? ` · 🕯️ +${r.tocha} Tocha` : ''}${r.bau ? ' · baú recebido!' : ''}</div>`; rerender(); $('#painel-corpo').scrollTop = 0;
    },
    iniciar: () => { S().timers.cardio = { t0: Date.now() }; St.salvar(); rerender(); },
    cancelar: () => { delete S().timers.cardio; St.salvar(); rerender(); },
    parar: () => { const t = S().timers.cardio; if (!t) return; const min = Math.max(1, Math.round((Date.now() - t.t0) / 60000)); delete S().timers.cardio; St.salvar(); rerender(); const el = document.getElementById('tr-min'); if (el) el.value = min; const p = $('#tr-prev'); if (p) p.innerHTML = prevCardio(); },
  },
  aoAbrir: () => {}, aoFechar: () => { trilhaMsg = ''; },
});

// ======================= BIBLIOTECA (ESTUDO) =======================
let bibMsg = '';
function prevEstudo() {
  const D = St.dia(); const tp = ESTUDO_TIPOS.find((t) => t.id === val('bi-tp')) || ESTUDO_TIPOS[0]; const min = Math.round(valNum('bi-min')) || 0; const s = S();
  const prova = s.provas.some((p) => { const d = R.difDias(St.hoje(), p.data); return d >= 0 && d <= 14; }) ? 1.1 : 1;
  const xp = Math.round(xpPrev(D.estudo, min, [240, 480], tp.mult * prova) * multXpAprox('estudoXp')); return min > 0 ? `≈ <b class="gold">${xp} XP</b> (${esc(tp.nome)} ×${tp.mult}${prova > 1 ? ' · prova próxima ×1,1' : ''})` : 'Informe os minutos para ver o XP estimado.';
}
registrar('biblioteca', {
  titulo: 'Biblioteca — Estudo',
  render() {
    const s = S(), D = St.dia(), po = s.timers.pomo; const hoje = St.hoje();
    return `${bibMsg}<p class="suave">Estude para a faculdade, a residência ou concursos. Tipos ativos (questões, revisão, simulado) rendem mais que apenas assistir. Primeiras 4 h do dia: 100%, até 8 h: 60%, depois 25%.</p>
    <div class="card"><h4><span>🍅 Pomodoro</span></h4>${po ? `<div class="timer" id="po-cron">${mmss(po.fim - Date.now())}</div><p class="peq suave">${esc(ESTUDO_TIPOS.find((t) => t.id === po.tipo).nome)} · ${po.min} min — ao zerar, o estudo é registrado com +20 XP de bônus.</p><button class="btn bloco ruim" data-act="pomoCancel">Cancelar</button>` :
      `<div class="linha"><div><label class="campo" for="po-min">Foco</label><select id="po-min"><option value="25">25 min</option><option value="35">35 min</option><option value="50">50 min</option><option value="1">1 min (teste)</option></select></div></div><button class="btn pri bloco" data-act="pomoStart">Iniciar Pomodoro com os dados abaixo</button>`}</div>
    <div class="card"><label class="campo" for="bi-tp">Tipo de estudo</label><select id="bi-tp" data-on="prev">${ESTUDO_TIPOS.map((t) => `<option value="${t.id}">${t.emoji} ${esc(t.nome)} — ×${t.mult}</option>`).join('')}</select>
    <div class="linha"><div><label class="campo" for="bi-cat">Para quê?</label><select id="bi-cat">${ESTUDO_CATS.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select></div><div><label class="campo" for="bi-min">Minutos</label><input id="bi-min" type="number" inputmode="numeric" min="1" max="720" data-on="prev" placeholder="min"></div></div>
    <label class="campo" for="bi-nota">Assunto (opcional)</label><input id="bi-nota" maxlength="60" placeholder="Ex.: Arritmias — questões de ECG"><p id="bi-prev" class="peq">${prevEstudo()}</p>
    <button class="btn pri bloco" data-act="reg">Registrar estudo</button></div>
    <h3>Hoje</h3><div class="card"><p><b>${D.estudo} min</b> estudados · ${D.pomos} pomodoro(s) · 🕯️ +1 Tocha aos 45 min e aos 120 min.</p>${barra(Math.min(D.estudo, 120), 120, 'azul')}<p class="peq suave">45 min ${D.toch.estudo >= 1 ? '✔' : '○'} · 120 min ${D.toch.estudo >= 2 ? '✔' : '○'} · Atributo Inteligência: ${fmt(s.stats.estudoMin / 60, 1)} h no total.</p></div>
    <h3>Provas e concursos</h3><p class="peq suave">Com uma prova a até 14 dias, todo estudo rende +10% de XP.</p>
    ${s.provas.map((p) => { const d = R.difDias(hoje, p.data); return `<div class="lista-item"><div class="nome">${esc(p.nome)}<small>${p.data.split('-').reverse().join('/')} · ${d > 0 ? `faltam ${d} dia(s)` : d === 0 ? 'É HOJE!' : `${-d} dia(s) atrás`}</small></div><button class="btn peq ruim" data-act="delprova" data-id="${p.id}">✕</button></div>`; }).join('') || '<p class="suave">Nenhuma prova cadastrada.</p>'}
    <div class="card"><div class="linha"><div><label class="campo" for="pv-n">Nome</label><input id="pv-n" maxlength="40" placeholder="Ex.: Prova de residência"></div><div><label class="campo" for="pv-d">Data</label><input id="pv-d" type="date"></div></div><button class="btn bloco" data-act="addprova">Adicionar prova</button></div>`;
  },
  ao: { prev: () => { const p = $('#bi-prev'); if (p) p.innerHTML = prevEstudo(); } },
  acoes: {
    reg: () => { const r = St.registrarEstudo(val('bi-tp'), val('bi-cat'), valNum('bi-min'), val('bi-nota')); if (r.erro) return toast(r.erro); Au.sfx('coin'); Au.vibrar(25); bibMsg = `<div class="dica"><b>${esc(r.tp.nome)}</b>: +${r.xp} XP${r.tocha ? ` · 🕯️ +${r.tocha} Tocha` : ''}${r.bau ? ' · baú recebido!' : ''}</div>`; const n = document.getElementById('bi-nota'); if (n) n.value = ''; rerender(); $('#painel-corpo').scrollTop = 0; },
    pomoStart: () => { const min = parseInt(val('po-min')) || 25; S().timers.pomo = { fim: Date.now() + min * 60000, min, tipo: val('bi-tp') || 'foco', cat: val('bi-cat') || 'faculdade' }; St.salvar(); Au.sfx('confirm'); rerender(); },
    pomoCancel: () => { delete S().timers.pomo; St.salvar(); rerender(); },
    addprova: () => { const n = val('pv-n').trim(), d = val('pv-d'); if (!n || !d) return toast('Informe nome e data.'); St.addProva(n, d); rerender(); },
    delprova: (el) => { St.delProva(el.dataset.id); rerender(); },
  },
  aoFechar: () => { bibMsg = ''; },
});

// ======================= TAVERNA (ALIMENTAÇÃO) =======================
let tavMsg = '';
const PRESETS = [['Café da manhã', 450], ['Almoço', 750], ['Lanche', 250], ['Jantar', 650], ['Shake de proteína', 200], ['Fruta', 90]];
function projecao(f) {
  const s = S(), max = recursosMax(s.heroi.cls, s.heroi.nivel), rec = recursosComFator(max, f.f); const ex = f.exaust || 0; const exTxt = ex > 0 ? `<b class="verm">+${ex} Exaustão</b>` : ex < 0 ? `<b class="verde">−1 Exaustão</b>` : 'Exaustão sem mudança';
  return `<div class="card" style="border-color:${f.cor}"><h4><span style="color:${f.cor}">${esc(f.nome)}</span><span class="peq">${Math.round(f.f * 100)}% dos recursos</span></h4><p class="peq">${esc(f.desc)}</p><p class="peq suave">Ao amanhecer (descanso longo): ${exTxt}${f.sono ? ' · <b class="verm">Sonolência (−2 iniciativa)</b>' : ''}${f.id === 'banquete' ? ' · <b class="verde">Inspiração + 1 Tocha</b>' : ''}</p>${recursosHtml(rec, max)}</div>`;
}
registrar('taverna', {
  titulo: 'Taverna — Alimentação',
  render() {
    const s = S(), D = St.dia(); const alvo = s.heroi.kcalAlvo, f = St.faixaDeHoje(); const esc150 = alvo * 1.5;
    const amanha = new Date(); amanha.setHours(24, 0, 0, 0); const falta = amanha - Date.now();
    return `${tavMsg}<p class="suave">Dona Tavi: comer de menos <b>e</b> demais cobra um preço. Anote tudo que comer; ao amanhecer, sua refeição define quanto de <b>${esc(CLASSES[s.heroi.cls].recurso)}</b> o descanso restaura.</p>
    <div class="card"><h4><span>Hoje: <b class="gold">${fmt(D.kcal)}</b> / ${fmt(alvo)} kcal</span><span class="peq suave">${D.comida.length} refeição(ões)</span></h4>
    <div class="kcal-barra"><div class="zona" style="left:${pct(alvo * 0.9, esc150)}%;width:${pct(alvo * 0.2, esc150)}%"></div><i style="width:${pct(D.kcal, esc150)}%;background:${f.cor}"></i><div class="alvo" style="left:${pct(alvo, esc150)}%"></div></div>
    <p class="peq suave">Zona verde = ±10% da meta (${fmt(alvo * 0.9)}–${fmt(alvo * 1.1)} kcal). Amanhecer em ${Math.floor(falta / 3600000)}h${String(Math.floor((falta % 3600000) / 60000)).padStart(2, '0')}.</p></div>
    <h3>Se o dia terminasse agora</h3>${projecao(f)}
    <h3>Anotar refeição</h3><div class="card"><div class="linha" style="gap:5px">${PRESETS.map(([n, k]) => `<button class="btn peq fixo" data-act="preset" data-n="${esc(n)}" data-k="${k}">${esc(n)}</button>`).join('')}</div>
    <label class="campo" for="tv-n">Descrição</label><input id="tv-n" maxlength="40" placeholder="Ex.: Arroz, feijão e frango"><label class="campo" for="tv-k">Calorias (kcal)</label><input id="tv-k" type="number" inputmode="numeric" min="1" max="6000" placeholder="kcal"><button class="btn pri bloco" data-act="add">Anotar (+8 XP nas 5 primeiras)</button></div>
    ${D.comida.map((c, i) => `<div class="lista-item"><div class="nome">${esc(c.n)}<small>${new Date(c.t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small></div><b>${fmt(c.k)} kcal</b><button class="btn peq ruim" data-act="del" data-i="${i}">✕</button></div>`).join('')}
    ${alvo < 1400 ? '<div class="aviso">A meta de calorias está baixa. Este app é um jogo, não aconselhamento médico: ajuste a meta com um profissional de saúde.</div>' : ''}
    <p class="peq suave">Sua meta pode ser recalculada em Menu → Sistema. O dia só é avaliado à meia-noite; você pode ajustar as refeições até lá.</p>`;
  },
  acoes: {
    preset: (el) => { document.getElementById('tv-n').value = el.dataset.n; document.getElementById('tv-k').value = el.dataset.k; },
    add: () => { const r = St.addComida(val('tv-n') || 'Refeição', valNum('tv-k')); if (r.erro) return toast(r.erro); Au.sfx('coin'); tavMsg = `<div class="dica">Refeição anotada${r.xp ? ` (+${r.xp} XP)` : ''}.</div>`; const a = document.getElementById('tv-n'), b = document.getElementById('tv-k'); if (a) a.value = ''; if (b) b.value = ''; rerender(); },
    del: (el) => { St.delComida(+el.dataset.i); tavMsg = ''; rerender(); },
  },
  aoFechar: () => { tavMsg = ''; },
});

// ======================= QUADRO DE MISSÕES =======================
const PILAR = { corpo: ['💪', '#ff9f40'], mente: ['📚', '#4aa8ff'], alma: ['🍖', '#6fcf7f'] };
function blocoEvento() {
  const e = St.eventoAtual(); if (!e) return ''; const st = e.estado; const D = St.dia(); let corpo = '';
  if (e.tipo === 'buff') corpo = `<p class="peq">Ativo o dia todo. Aproveite!</p>`;
  else if (e.tipo === 'desafio') {
    const m = e.meta; const v = m.tipo === 'cardio' ? D.cardio : m.tipo === 'estudo' ? D.estudo : m.tipo === 'series' ? D.series : D.comida.length; const un = { cardio: 'min de aeróbico', estudo: 'min de estudo', series: 'séries', refeicoes: 'refeições' }[m.tipo];
    corpo = `<p class="peq">Meta: <b>${m.alvo} ${un}</b> hoje. ${st.feito === 'ok' ? '<b class="verde">Vencido!</b>' : st.feito === 'falhou' ? '<b class="verm">Falhou.</b>' : ''}</p>${barra(Math.min(v, m.alvo), m.alvo, st.feito === 'ok' ? 'ok' : '')}<p class="peq suave">${fmtEf(e.ok, 'Se vencer')} · ${fmtEf(e.falha, 'Se falhar')}</p>`;
  } else if (e.tipo === 'escolha') {
    corpo = st.feito ? `<p class="peq"><b>Você escolheu:</b> ${esc(e.opcoes[st.escolha].t)}<br>${esc(st.resultado)}</p>` : `<div style="display:flex;flex-direction:column;gap:6px">${e.opcoes.map((o, i) => `<button class="btn" data-act="evento" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`;
  }
  return `<div class="card" style="border-color:var(--roxo)"><h4><span>${e.icone} ${esc(e.nome)}</span><span class="tag" style="background:var(--roxo)">${{ buff: 'bênção', desafio: 'desafio', escolha: 'encontro' }[e.tipo]}</span></h4><p>${esc(e.txt)}</p>${corpo}</div>`;
}
function fmtEf(ef, rot) { if (!ef) return ''; const p = []; if (ef.ouro) p.push(`${ef.ouro > 0 ? '+' : ''}${ef.ouro} ouro`); if (ef.xp) p.push(`+${ef.xp} XP`); if (ef.tochas) p.push(`${ef.tochas > 0 ? '+' : ''}${ef.tochas} Tocha`); if (ef.moral) p.push(`Moral ${ef.moral > 0 ? '+' : ''}${ef.moral}`); if (ef.inercia) p.push(`Inércia ${ef.inercia > 0 ? '+' : ''}${ef.inercia}`); if (ef.loot) p.push('baú'); return `${rot}: ${p.join(', ') || '—'}`; }
registrar('missoes', {
  titulo: 'Quadro de Missões',
  render() {
    const s = S(), D = St.dia(); const q = s.sequencia;
    return `<div class="card"><h4><span>🔥 Sequência: <b class="gold">${q.atual}</b> dia(s)</span><span class="peq suave">recorde ${q.melhor}</span></h4><p class="peq">XP ×${fmt(St.multSequencia(), 2)} · Escudos: ${q.escudos}${q.voltaBonus > 0 ? ` · <b class="verde">bônus de retorno (${q.voltaBonus}d)</b>` : ''}<br>Qualquer atividade (série, aeróbico, estudo, hábito) mantém a sequência. Dias de descanso planejados não a quebram (Menu → Sistema).</p></div>
    <h3>Evento do dia</h3>${blocoEvento()}
    <h3>Missões de hoje ${D.perfeito ? '<span class="tag" style="background:var(--ouro)">DIA PERFEITO</span>' : ''}</h3><p class="peq suave">Cumpra todas: +100 XP, 🕯️ +1 Tocha, −1 Maré da Inércia e um baú especial.</p>
    ${s.diario.missoes.map((m) => { const [em, cor] = PILAR[m.pilar] || ['⭐', '#fff']; return `<div class="card ${m.feito ? 'feito' : ''}" style="border-color:${m.feito ? 'var(--ok)' : cor}"><div class="linha"><span class="fixo" style="font-size:22px">${m.feito ? '✅' : em}</span><div><b>${esc(m.txt)}</b><div class="peq suave">+${m.xp} XP · +${m.ouro} ouro${m.fim ? ' · avaliada ao amanhecer' : ''}</div></div></div>${barra(m.prog || 0, m.alvo, m.feito ? 'ok' : '')}</div>`; }).join('')}
    <h3>Meus hábitos</h3><p class="peq suave">Rituais diários que dão XP uma vez por dia. Para aderir a novos (ou retirar), use o marca-páginas <b>🌱 Hábitos</b> deste diário.</p>
    ${s.habitos.map((h) => `<div class="lista-item"><button class="btn peq ${D.hab[h.id] ? 'ok' : ''}" data-act="habito" data-id="${h.id}" ${D.hab[h.id] ? 'disabled' : ''}>${D.hab[h.id] ? '✔' : '○'}</button><div class="nome ${D.hab[h.id] ? 'feito' : ''}">${esc(h.nome)}<small>+${h.xp} XP</small></div><button class="btn peq ruim" data-act="delhab" data-id="${h.id}">✕</button></div>`).join('') || '<p class="suave">Nenhum hábito ainda.</p>'}
    <div class="card"><div class="linha"><div><label class="campo" for="hb-n">Novo hábito</label><input id="hb-n" maxlength="40" placeholder="Ex.: Beber 2 L de água"></div><div class="fixo" style="width:80px"><label class="campo" for="hb-x">XP</label><input id="hb-x" type="number" inputmode="numeric" value="20" min="5" max="60"></div></div><button class="btn bloco" data-act="addhab">Adicionar hábito</button></div>`;
  },
  acoes: {
    evento: (el) => { const r = St.escolherEvento(+el.dataset.i); if (!r) return; if (r.erro) return toast(r.erro); toast(r.r, 4500); rerender(); },
    habito: (el) => { const r = St.cumprirHabito(el.dataset.id); if (r) { Au.sfx('coin'); toast(`Hábito cumprido! +${r.xp} XP`); } rerender(); },
    delhab: (el) => { St.delHabito(el.dataset.id); rerender(); },
    addhab: () => { const n = val('hb-n').trim(); if (!n) return toast('Dê um nome ao hábito.'); St.addHabito(n, valNum('hb-x') || 20); const e = document.getElementById('hb-n'); if (e) e.value = ''; rerender(); },
  },
});
export { ATR_FONTE };
