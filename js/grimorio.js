// Grimório: o livro completo de magias da classe (SRD 5.1) e o uso delas FORA de combate —
// cura, magias de apoio que valem na próxima luta, e efeitos de exploração (luz, detecção, presságios…). Magias não dão XP.
import * as St from './store.js';
import { MAGIAS, ITENS, rolar } from './srd.js';
import { registrar, esc, toast, rerender, fecharPainel } from './uibase.js';
import { S } from './uiutil.js';
import { G } from './game.js';

const CURTAS = ['tmp1', 'contra', 'uso1', 'acoes', 'smite', 'quebra']; // efeitos que só fazem sentido no meio da luta
export function nivelMax(s = S()) { return (s.recursosMax && s.recursosMax.slots ? s.recursosMax.slots.length : 0); }
export function listaDaClasse(s = S()) { const cls = s.heroi.cls, mx = nivelMax(s); return Object.entries(MAGIAS).filter(([, m]) => m.cls.includes(cls) && m.nv <= mx).map(([id, m]) => ({ id, ...m })).sort((a, b) => a.nv - b.nv || a.nome.localeCompare(b.nome, 'pt')); }
// como a magia pode ser usada fora de combate: { modo, motivo? } ou null
export function usoFora(sp) {
  if (sp.ex === 'flavor') return { modo: 'flavor', ok: sp.nv === 0, motivo: sp.nv ? 'sem efeito mecânico' : '' };
  if (sp.ex || sp.tipo === 'util') return { modo: 'ex', ok: true };
  if (sp.tipo === 'cura') return { modo: 'cura', ok: true };
  if (sp.tipo === 'buff') { const ef = sp.ef || {}; if (CURTAS.some((k) => ef[k])) return null; return { modo: 'apoio', ok: true }; }
  if (sp.tipo === 'desejo') return { modo: 'ex', ok: true };
  return null;
}
const rolaTxt = (txt, B) => (String(txt).includes('d') ? rolar(String(txt), Math.random).total : parseInt(txt) || 0); void rolaTxt;
function curar(s, d, n) { const hp = s.heroi.hp ?? d.hpMax; const novo = Math.min(d.hpMax, hp + Math.max(1, n)); s.heroi.hp = novo; return novo - hp; }
function fracaoCura(s, d, frac) { const hp = s.heroi.hp ?? d.hpMax; const falta = d.hpMax - hp; return curar(s, d, Math.ceil(falta * frac)); }

function efeito(s, sp, nv, ex, v) {
  const d = St.der(); s.prontos = s.prontos || {};
  switch (ex) {
    case 'social': s.prontos.social = Math.max(s.prontos.social || 0, v || 1); return { msg: `Você ganha +${v || 1} para persuadir e intimidar na próxima luta.` };
    case 'alarme': s.prontos.alarme = true; return { msg: 'O Alarme está armado: você começa a próxima luta alerta (+5 de iniciativa).' };
    case 'pronto_ward': s.prontos.ward = { f: v || 0.3 }; return { msg: 'A salvaguarda está pronta: quando você cair na próxima luta, volta de pé.' };
    case 'banquete': { if ((s.heroi.hp ?? d.hpMax) >= d.hpMax && !(v === 2 && s.heroi.exaustao)) return { erro: 'Você não precisa de um banquete agora.' }; const n = v === 2 ? fracaoCura(s, d, 1) : curar(s, d, Math.ceil(d.hpMax * 0.25)); let t = `Você se refaz: +${n} PV.`; if (v === 2 && s.heroi.exaustao) { s.heroi.exaustao--; t += ' A exaustão diminui em 1.'; } return { msg: t }; }
    case 'descanso': { if ((s.heroi.hp ?? d.hpMax) >= d.hpMax) return { erro: 'Você já está com PV cheios.' }; const n = fracaoCura(s, d, v || 0.5); return { msg: `Um abrigo seguro: +${n} PV.` }; }
    case 'restaura': { if (!s.heroi.exaustao) return { erro: 'Não há nada a restaurar.' }; s.heroi.exaustao--; return { msg: 'A exaustão diminui em 1 nível.' }; }
    case 'identifica': { const m = s.inv.filter((i) => ITENS[i.id] && ['incomum', 'raro', 'lendario', 'lendário'].includes(ITENS[i.id].raro)).map((i) => ITENS[i.id].nome); return { msg: m.length ? `Itens de poder na mochila: ${m.join(', ')}.` : 'Nada de mágico na mochila.' }; }
    case 'desejo': { s.heroi.hp = d.hpMax; s.heroi.exaustao = 0; const max = s.recursosMax.slots; s.recursos.slots = s.recursos.slots.map((x, i) => (i < 8 ? max[i] : x)); return { msg: 'O Desejo refaz seu corpo: PV cheios, sem exaustão e espaços de magia até o 8º círculo restaurados.' }; }
    case 'flavor': return { msg: sp.txt || 'A magia faz efeito, discretamente.' };
    default: { const r = G.efeitoExploracao(ex, v); if (r && r.acao === 'sair') r.depois = () => { fecharPainel(); G.sair(); }; return r || { erro: 'Nada acontece.' }; }
  }
}
// conjura fora de combate. Retorna { msg } ou { erro }
export function conjurarFora(id, nvEscolhido) {
  const s = S(), sp = MAGIAS[id]; const uso = sp && usoFora(sp); if (!uso || !uso.ok) return { erro: 'Essa magia só serve em combate.' };
  const nv = Math.max(nvEscolhido || sp.nv, sp.nv); const slots = s.recursos.slots;
  if (sp.nv > 0 && !(slots[nv - 1] > 0)) return { erro: 'Sem espaços de magia desse círculo.' };
  let r; const d = St.der();
  if (uso.modo === 'cura') {
    if ((s.heroi.hp ?? d.hpMax) >= d.hpMax) return { erro: 'Você já está com PV cheios.' };
    let n; if (sp.fixo) n = rolar(sp.dado, Math.random).total; else { let expr = sp.dado; if (sp.up && nv > sp.nv) { const [k, f] = sp.up.split('d'); expr += `+${parseInt(k) * (nv - sp.nv)}d${f}`; } n = (expr.includes('d') ? rolar(expr, Math.random).total + (d.modConj || 0) : parseInt(expr)) + (s.heroi.cls === 'clerigo' ? 2 + nv : 0); }
    r = { msg: `${sp.nome}: +${curar(s, d, n)} PV.` };
  } else if (uso.modo === 'apoio') {
    s.prontos = s.prontos || {}; const lst = s.prontos.buffs = (s.prontos.buffs || []).filter((b) => b.id !== id && !(sp.conc && MAGIAS[b.id] && MAGIAS[b.id].conc)); lst.push({ id, nv });
    r = { msg: `${sp.nome} preparado: entra em vigor no início da próxima luta${sp.conc ? ' (só uma magia de concentração por vez)' : ''}.` };
  } else {
    const exs = Array.isArray(sp.ex) ? sp.ex : [sp.ex || (sp.tipo === 'desejo' ? 'desejo' : null)]; const msgs = []; let depois = null;
    for (const ex of exs) { const q = efeito(s, sp, nv, ex, sp.v); if (q.erro) { if (!msgs.length) return q; continue; } msgs.push(q.msg); if (q.depois) depois = q.depois; }
    r = { msg: msgs.join(' '), depois };
  }
  if (sp.nv > 0) slots[nv - 1]--;
  St.salvar(); if (G.ui && G.ui.hud) G.ui.hud(); return r;
}

// ---------------------------------- painel ----------------------------------
let fNv = 'auto', fTipo = 'fora', ultima = '';
const TIPO_ROT = { cura: 'cura', apoio: 'apoio p/ a luta', ex: 'exploração', flavor: 'narrativa' };
function cartao(sp, s) {
  const uso = usoFora(sp); const slots = s.recursos.slots; const niveis = []; if (sp.nv > 0) for (let L = sp.nv; L <= slots.length && niveis.length < 4; L++) if (slots[L - 1] > 0) niveis.push(L);
  const ate = sp.tipo === 'cura' ? niveis : niveis.slice(0, 1);
  const tag = uso ? `<span class="chip">${esc(TIPO_ROT[uso.modo] || uso.modo)}</span>` : '<span class="chip off">só em combate</span>';
  let bt = '';
  if (uso && uso.ok) { if (sp.nv === 0) bt = `<button class="btn peq pri" data-act="conj" data-id="${sp.id}" data-nv="0">Conjurar (truque)</button>`; else if (ate.length) bt = ate.map((L) => `<button class="btn peq pri" data-act="conj" data-id="${sp.id}" data-nv="${L}">${L}º círculo (${slots[L - 1]})</button>`).join(''); else bt = '<span class="peq suave">Sem espaços de magia.</span>'; }
  else if (uso && uso.motivo) bt = `<span class="peq suave">${esc(uso.motivo)}</span>`;
  return `<div class="card"><h4><span>${esc(sp.nome)}</span>${tag}</h4><p class="peq suave">${esc(sp.desc || '')}</p>${bt ? `<div class="linha" style="gap:6px;flex-wrap:wrap">${bt}</div>` : ''}</div>`;
}
registrar('grimorio', {
  titulo: 'Grimório',
  render() {
    const s = S(); const lista = listaDaClasse(s); if (!lista.length) return '<p class="suave">Seu herói ainda não conjura magias. Conjuradores recebem espaços de magia ao subir de nível.</p>';
    const nvs = [...new Set(lista.map((m) => m.nv))]; if (fNv === 'auto') fNv = nvs.includes(1) ? 1 : nvs[0];
    const sl = s.recursos.slots.map((v, i) => ((s.recursosMax.slots[i] || 0) > 0 ? `<span class="chip">${i + 1}º: ${v}/${s.recursosMax.slots[i]}</span>` : '')).join('');
    const pr = s.prontos || {}; const prontos = [...(pr.buffs || []).map((b) => MAGIAS[b.id] && MAGIAS[b.id].nome), pr.ward ? 'Salvaguarda' : '', pr.alarme ? 'Alarme' : '', pr.social ? `Social +${pr.social}` : ''].filter(Boolean);
    const chipsN = ['todas', ...nvs].map((n) => `<button class="btn peq fixo ${fNv === n ? 'pri' : ''}" data-act="fnv" data-v="${n}">${n === 'todas' ? 'Todas' : n === 0 ? 'Truques' : n + 'º'}</button>`).join('');
    const chipsT = [['fora', 'Fora de combate'], ['luta', 'Só em combate'], ['todas', 'Todas']].map(([k, n]) => `<button class="btn peq fixo ${fTipo === k ? 'pri' : ''}" data-act="ftipo" data-v="${k}">${n}</button>`).join('');
    let vis = lista.filter((m) => (fNv === 'todas' || m.nv === fNv)); vis = vis.filter((m) => { const u = usoFora(m); return fTipo === 'todas' || (fTipo === 'fora' ? !!u : !u); });
    return `${ultima ? `<div class="card"><p class="peq">${esc(ultima)}</p></div>` : ''}<div class="card"><div class="linha" style="gap:6px;flex-wrap:wrap">${sl || '<span class="peq suave">Sem espaços de magia ainda.</span>'}</div><p class="peq suave">Os espaços voltam no amanhecer, conforme sua alimentação. Magias não dão XP: o XP vem só de treino, estudo, aeróbico e alimentação.</p>${prontos.length ? `<p class="peq">Prontas para a próxima luta: <b>${esc(prontos.join(', '))}</b></p>` : ''}</div>
      <div class="linha" style="gap:5px;flex-wrap:wrap">${chipsT}</div><div class="linha" style="gap:5px;flex-wrap:wrap;margin:6px 0">${chipsN}</div>
      <p class="peq suave">${vis.length} magia(s) — ${lista.length} no livro da classe (SRD 5.1).</p>${vis.map((m) => cartao(m, s)).join('') || '<p class="suave">Nenhuma magia neste filtro.</p>'}`;
  },
  acoes: {
    fnv: (el) => { fNv = el.dataset.v === 'todas' ? 'todas' : parseInt(el.dataset.v); rerender(); },
    ftipo: (el) => { fTipo = el.dataset.v; rerender(); },
    conj: async (el) => { const r = conjurarFora(el.dataset.id, parseInt(el.dataset.nv)); if (r.erro) { toast(r.erro); return; } ultima = r.msg; toast(r.msg); if (r.depois) { r.depois(); return; } rerender(); },
  },
});
