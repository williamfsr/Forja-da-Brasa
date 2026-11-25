// Interface: HUD, popups de recompensa, introdução/fim de capítulos, tela de título e criação de personagem.
import * as St from './store.js';
import * as R from './rules.js';
import { CLASSES, ITENS } from './srd.js';
import { LIFTS, TIERS, TIER_COR, RAR_COR } from './conteudo.js';
import { CAPITULOS, ATOS, PROLOGO, FINAIS } from './story.js';
import * as B from './uibase.js';
import { $, esc, fmt, val, valNum, toast, popup, popupAtualizar, registrar, abrirPainel, fecharPainel, rerender, confirmar } from './uibase.js';
import { S, tierTag, descItem, nomeItem } from './uiutil.js';
import './paineis1.js';
import './paineis2.js';
import { G } from './game.js';
import * as Au from './audio.js';
import { montarEditor } from './criador.js';
import { apPadrao, CORES_CLASSE } from './cosmeticos.js';

// ======================= HUD =======================
const mini = (v, max, cls) => `<span class="mini ${cls}">${Array.from({ length: max }, (_, i) => `<b class="${i < v ? 'on' : ''}"></b>`).join('')}</span>`;
export function hud() {
  const s = St.S; const el = $('#hud'); if (!s) { el.innerHTML = ''; return; }
  const d = St.der(), pn = R.progressoNivel(s.heroi.xp), H = s.historia, h = s.heroi, cls = CLASSES[h.cls];
  const xpTxt = pn.lendario ? `LENDÁRIO ${pn.rank}` : `${fmt(pn.atual)}/${fmt(pn.falta)} XP`;
  el.innerHTML = `<div class="l1"><span class="nv">NV ${h.nivel}</span><span class="id">${cls.emoji} ${esc(h.nome)}</span><div class="barra xp"><i style="width:${(pn.pct * 100).toFixed(1)}%"></i><span>${xpTxt}</span></div><span class="chip" title="Ouro">🪙 ${fmt(h.ouro)}</span><span class="chip" title="Tochas">🕯️ ${h.tochas}</span></div>
  <div class="l2"><div class="barra hp"><i style="width:${Math.max(0, Math.min(100, (h.hp / d.hpMax) * 100)).toFixed(1)}%;background:${h.hp / d.hpMax > 0.5 ? 'var(--ok)' : h.hp / d.hpMax > 0.25 ? '#e6d35a' : 'var(--ruim)'}"></i><span>PV ${Math.max(0, h.hp)}/${d.hpMax}</span></div><span class="chip" title="Sequência de dias">🔥 ${s.sequencia.atual}</span>${h.exaustao ? `<span class="chip ruim" title="Exaustão">😩 ${h.exaustao}</span>` : ''}${h.sono ? '<span class="chip ruim" title="Sonolência">💤</span>' : ''}${h.insp ? `<span class="chip ok" title="Inspiração">✨ ${h.insp}</span>` : ''}<span class="chip" title="Maré da Inércia (menor é melhor)">🌑${mini(H.inercia, 10, 'inercia')}</span><span class="chip" title="Moral da vila">🏘️${mini(Math.round(H.moral / 10), 10, 'moral')}</span></div>`;
}

// ======================= POPUPS =======================
const CONF = '<div class="confete">✦ ✧ ✦ ✧ ✦</div>';
const btnOk = (t = 'Continuar') => `<button class="btn pri bloco" data-res="1">${esc(t)}</button>`;
let drenando = false;
export async function drenar() {
  if (drenando || !St.S) return; drenando = true;
  try { while (St.fila.length && G.modo !== 'batalha' && !G.ocupado) { const p = St.fila.shift(); await itemPopup(p); } } finally { drenando = false; }
}
async function itemPopup(p) {
  const s = St.S;
  if (p.tipo === 'nivel') {
    Au.sfx('nivel'); Au.vibrar(120); const novos = p.novos.map(([n, nome, desc]) => `<div class="item-linha"><b class="gold">${esc(nome)}</b><br><span class="suave">${esc(desc)}</span></div>`).join('');
    return popup(`${CONF}<h2>NÍVEL ${p.para}!</h2><div class="grande">🆙</div><p>PV máximo <b>${p.hp}</b>. Seus recursos foram restaurados.</p>${novos ? `<h3 style="color:var(--brasa)">Novas habilidades</h3>${novos}` : ''}${p.cap ? `<p style="margin-top:10px"><b class="gold">Capítulo ${p.cap.n} liberado:</b><br>${esc(p.cap.titulo)}</p>` : ''}${btnOk()}`);
  }
  if (p.tipo === 'pr') { Au.sfx('pr'); Au.vibrar(100); return popup(`${CONF}<h2>NOVO PR!</h2><div class="grande">${LIFTS[p.liftId].emoji}</div><p><b>${esc(LIFTS[p.liftId].nome)}</b></p><p>e1RM <span class="verm">${fmt(p.pr.de, 1)}</span> → <b class="gold">${fmt(p.pr.para, 1)} kg</b> (+${fmt(p.pr.delta, 1)})</p><p class="suave">${fmt(p.pr.w, 1)} kg × ${p.pr.r}</p><p>${tierTag(p.tier)}</p><p class="suave peq">Um baú foi aberto como recompensa.</p>${btnOk('Forte!')}`); }
  if (p.tipo === 'tier') { Au.sfx('nivel'); Au.vibrar(150); return popup(`${CONF}<h2 style="color:${TIER_COR[p.para]}">RANK UP!</h2><div class="grande">🏅</div><p><b>${esc(LIFTS[p.liftId].nome)}</b></p><p>${tierTag(p.de)} → ${tierTag(p.para)}</p><p class="peq suave">Um baú lendário-tier foi aberto.</p>${btnOk('Incrível!')}`); }
  if (p.tipo === 'bau') return popupBau(p);
  if (p.tipo === 'texto') { Au.sfx('pr'); return popup(`<h2 style="color:${p.cor || 'var(--ouro)'}">${esc(p.titulo)}</h2><p style="white-space:pre-line;text-align:left">${esc(p.txt)}</p>${btnOk('OK')}`); }
  if (p.tipo === 'missao') { Au.sfx('coin'); return popup(`<h2>MISSÃO CUMPRIDA!</h2><div class="grande">📜</div><p><b>${esc(p.q.txt)}</b></p><p class="gold">+${p.xp} XP · +${p.q.ouro} 🪙</p>${btnOk('Boa!')}`); }
  if (p.tipo === 'conquista') { Au.sfx('pr'); const c = p.c; return popup(`${CONF}<h2>CONQUISTA!</h2><div class="grande">🏆</div><p><b>${esc(c.nome)}</b></p><p class="suave">${esc(c.desc)}</p><p class="gold">${c.rec.ouro ? `+${c.rec.ouro} 🪙 ` : ''}${c.rec.xp ? `+${c.rec.xp} XP` : ''}</p>${btnOk('Ótimo')}`); }
  if (p.tipo === 'amanhecer') return popupAmanhecer(p.rel);
}
async function popupBau(p) {
  const r = p.r; let t = null;
  const rolando = `<h2>BAÚ!</h2><div class="d20" id="d20x">?</div><p class="suave">Rolando d20 + ${r.forca + r.bonus}…</p>`;
  const cor = RAR_COR[r.rarNome] || '#fff'; const itens = r.itens.map((id) => { const it = ITENS[id]; return `<div class="item-linha"><b style="color:${RAR_COR[it.raro]}">${esc(it.nome)}</b> <span class="suave">· ${esc(it.raro)}</span><br><span class="peq suave">${esc(descItem(it))}</span></div>`; }).join('');
  const final = `<h2>BAÚ!</h2><div class="d20 pronto" style="${r.d20 === 20 ? 'background:#ff9f40' : r.d20 === 1 ? 'background:#8a8a96' : ''}">${r.d20}</div><p class="peq suave">d20 ${r.d20} + ${r.forca} (baú) + ${r.bonus} (sequência/sorte) = <b>${r.total}</b></p><p><span class="rar" style="background:${cor}">${esc(r.rarNome.toUpperCase())}</span></p>${r.d20 === 20 ? '<p class="gold">CRÍTICO! Raridade máxima!</p>' : r.d20 === 1 ? '<p class="verm">Falha crítica: raridade reduzida.</p>' : ''}<p class="gold">+${r.ouro} 🪙</p>${itens}${r.tocha ? '<p class="gold">🕯️ +1 Tocha!</p>' : ''}${btnOk('Pegar tudo!')}`;
  const pr = popup(rolando, { aoMostrar: () => { let n = 0; t = setInterval(() => { const e = document.getElementById('d20x'); if (e) e.textContent = 1 + Math.floor(Math.random() * 20); Au.sfx('rolar'); if (++n >= 11) { clearInterval(t); Au.sfx(r.rar >= 3 ? 'pr' : 'chest'); Au.vibrar(r.rar >= 3 ? 120 : 40); popupAtualizar(final); } }, 100); } });
  await pr; clearInterval(t);
}
async function popupAmanhecer(rel) {
  const s = St.S; const f = rel.faixa; const ult = rel.dias[rel.dias.length - 1]; const parados = rel.dias.filter((d) => !d.ativ && !d.rest).length; const dt = rel.novo.split('-').reverse().slice(0, 2).join('/');
  Au.sfx('tocha');
  const max = s.recursosMax; const linhasRec = []; max.slots.forEach((v, i) => { if (v) linhasRec.push(`${i + 1}º círculo ${s.recursos.slots[i]}/${v}`); }); for (const [k, v] of Object.entries(max.cont)) if (v && v < 99) linhasRec.push(`${k} ${s.recursos.cont[k]}/${v}`);
  const msgInercia = parados > 0 ? `<p class="verm">Você ficou ${parados} dia(s) sem atividade: a Maré da Inércia subiu.</p>` : '';
  return popup(`<h2>☀️ AMANHECER · ${dt}</h2><p class="suave">Ontem: ${ult.feitas}/${ult.total} missões · ${fmt(ult.xp)} XP${ult.ativ ? '' : ' · sem atividade'}</p>${msgInercia}
    <div class="item-linha" style="border-color:${f.cor}"><b style="color:${f.cor}">${esc(f.nome)}</b><br><span class="peq">${esc(f.desc)}</span><br><span class="peq suave">Seus recursos voltaram a ${Math.round(f.f * 100)}%${linhasRec.length ? ': ' + esc(linhasRec.join(' · ')) : ''}.</span></div>
    <p class="peq">😩 Exaustão: <b>${rel.exaustao}</b> · 🌑 Inércia: <b>${rel.inercia}/10</b> · 🏘️ Moral: <b>${rel.moral}</b> · 🕯️ Tochas: <b>${s.heroi.tochas}</b></p><p class="suave peq">Novas missões e um novo evento esperam no Quadro de Missões. Os baús do Vale renasceram.</p>${btnOk('Vamos lá!')}`);
}

// ======================= CAPÍTULOS =======================
async function tentarCapitulo(n) {
  const s = St.S, cap = CAPITULOS[n - 1], H = s.historia;
  if (H.limpos.includes(n)) { toast('Esta masmorra já foi limpa. As Catacumbas Sem Fim têm mais saque.'); return; }
  if (n > s.heroi.nivel) { await G.ui.dialogo('Selo da Inércia', [`Uma barreira de poeira cinzenta bloqueia a entrada: "${cap.local}".`, `Ela só cede a quem tem nível ${n}. Treine, estude e coma bem — a Brasa vai crescer.`]); return; }
  const ativo = St.capituloDisponivel(); if (n !== ativo) { toast(`Conclua primeiro o capítulo ${ativo}.`); return; }
  const linhas = cap.intro.filter((l) => typeof l === 'string' || H.flags[l.se]).map((l) => (typeof l === 'string' ? l : l.t));
  const r = await popup(`<h2>${esc(ATOS[cap.ato - 1].nome)}</h2><p class="suave peq">Capítulo ${cap.n} · ${esc(cap.local)}</p><h2 style="font-size:17px;color:#fff">${esc(cap.titulo)}</h2>${linhas.map((t) => `<p style="text-align:left">${esc(t)}</p>`).join('')}<p class="peq suave">${cap.andares} andares · 1 🕯️ por andar · você tem ${s.heroi.tochas}${H.checkpoint[n] ? ` · retoma no andar ${H.checkpoint[n]}` : ''}</p><div class="linha"><button class="btn" data-res="0">Voltar</button><button class="btn pri" data-res="1">Entrar</button></div>`);
  if (r === '1') await G.entrarMasmorra({ tipo: 'historia', cap: n });
}
async function fimCapitulo(n) {
  const cap = CAPITULOS[n - 1]; Au.sfx('win'); Au.vibrar(150);
  await popup(`${CONF}<h2>${esc(cap.boss.nome)} caiu!</h2><div class="grande">⚔️</div>${cap.vitoria.map((t) => `<p style="text-align:left">${esc(t)}</p>`).join('')}${btnOk()}`);
  const r = await popup(`<h2>Uma escolha</h2><p style="text-align:left">${esc(cap.decisao.txt)}</p><div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">${cap.decisao.opcoes.map((o, i) => `<button class="btn" data-res="${i}">${esc(o.t)}</button>`).join('')}</div>`);
  const idx = +r; const op = cap.decisao.opcoes[idx]; const ef = op.ef || {}; const partes = [];
  if (ef.moral) partes.push(`Moral ${ef.moral > 0 ? '+' : ''}${ef.moral}`); if (ef.inercia) partes.push(`Inércia ${ef.inercia > 0 ? '+' : ''}${ef.inercia}`); if (ef.ouro) partes.push(`${ef.ouro > 0 ? '+' : ''}${ef.ouro} 🪙`); if (ef.tochas) partes.push(`${ef.tochas > 0 ? '+' : ''}${ef.tochas} 🕯️`); if (ef.xp) partes.push(`+${ef.xp} XP`); if (ef.item) partes.push(nomeItem(ef.item));
  const rc = cap.recompensa || {}; const rec = [rc.ouro ? `+${rc.ouro} 🪙` : '', rc.item ? nomeItem(rc.item) : ''].filter(Boolean).join(' · ');
  await popup(`<h2>${esc(op.t)}</h2><p style="text-align:left">${esc(op.r)}</p>${partes.length ? `<p class="gold">${esc(partes.join(' · '))}</p>` : ''}<p class="peq suave">Recompensa do capítulo: ${esc(rec || '—')}${cap.brasa ? ` · nova Brasa: ${esc(cap.brasa)}` : ''}</p>${btnOk()}`);
  return idx;
}
async function fimDeJogo() {
  const f = St.S.historia.final; const F = FINAIS[f]; if (!F) return; Au.sfx('nivel');
  await popup(`${CONF}<h2>${esc(F.nome)}</h2><div class="grande">🔥</div>${F.txt.map((t) => `<p style="text-align:left">${esc(t)}</p>`).join('')}<p class="peq suave">A Brasa nunca se apaga para quem volta amanhã.</p>${btnOk('Fim… ou começo')}`);
  const r = await popup(`<h2>E agora?</h2><p style="text-align:left">O Vale respira. Você pode escolher o que vem a seguir — e mudar de ideia quando quiser, pelo Livro da Aventura.</p><div style="display:flex;flex-direction:column;gap:8px;margin-top:10px"><button class="btn pri" data-res="loop">⏳ Laço do Tempo<br><small>Recomece a campanha do capítulo 1 (monstros +12%). Mantém nível, itens e ouro; as missões e a leitura do Baralho se refazem.</small></button><button class="btn" data-res="explorador">🗝️ Explorador de Catacumbas<br><small>Catacumbas infinitas com todo o bestiário (até ND 30), chefes cada 5 andares e baús melhores.</small></button><button class="btn" data-res="depois">Decidir depois</button></div>`);
  if (r === 'loop') St.novoCiclo(); else if (r === 'explorador') St.escolherModoFinal('explorador');
}

// ======================= CRIAÇÃO DE PERSONAGEM =======================
let nvCls = 'guerreiro'; let nvEtapa = 1; let nvEst = null; let nvTocou = false;
function lerForm() {
  const nome = val('nv-nome').trim() || 'Herói'; const kcal = Math.round(valNum('nv-kcal')); const peso = valNum('nv-peso'), alt = valNum('nv-alt'), ida = valNum('nv-ida');
  if (!(peso >= 30 && peso <= 300) || !(alt >= 100 && alt <= 250) || !(ida >= 14 && ida <= 100)) { toast('Confira peso, altura e idade.'); return null; }
  if (!(kcal >= 800 && kcal <= 6000)) { toast('A meta de calorias deve ficar entre 800 e 6000.'); return null; }
  return { nome, cls: nvCls, sexo: val('nv-sexo'), peso, altura: alt, idade: ida, kcalAlvo: kcal };
}
registrar('novo', {
  titulo: 'Novo herói',
  render() {
    const cartoes = Object.values(CLASSES).map((c) => `<div class="card classe-card ${nvCls === c.id ? 'sel' : ''}" data-act="classe" data-id="${c.id}"><span class="em">${c.emoji}</span><div><b>${esc(c.nome)}</b> <span class="peq suave">d${c.dado} · ${c.prim}</span><div class="peq">${esc(c.resumo)}</div><div class="peq suave">Recurso: ${esc(c.recurso)}</div></div></div>`).join('');
    return `<div id="nv-e1" class="${nvEtapa === 1 ? '' : 'oculto'}"><label class="campo" for="nv-nome">Nome do herói</label><input id="nv-nome" maxlength="20" placeholder="Seu nome" value="${esc(val('nv-nome'))}">
    <h3>Classe</h3>${cartoes}
    <h3>Seu corpo (define ranks e calorias)</h3><div class="card"><div class="linha"><div><label class="campo" for="nv-peso">Peso (kg)</label><input id="nv-peso" type="number" inputmode="decimal" step="0.1" value="70" data-on="kcal"></div><div><label class="campo" for="nv-alt">Altura (cm)</label><input id="nv-alt" type="number" inputmode="numeric" value="170" data-on="kcal"></div><div><label class="campo" for="nv-ida">Idade</label><input id="nv-ida" type="number" inputmode="numeric" value="25" data-on="kcal"></div></div>
    <label class="campo" for="nv-sexo">Tabela de ranks de força</label><select id="nv-sexo" data-on="kcal"><option value="M">Masculina</option><option value="F">Feminina</option><option value="N">Média das duas</option></select>
    <label class="campo" for="nv-ativ">Atividade física</label><select id="nv-ativ" data-on="kcal">${R.FATORES_ATIV.map(([n, f]) => `<option value="${f}" ${f === 1.55 ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
    <label class="campo" for="nv-obj">Objetivo</label><select id="nv-obj" data-on="kcal"><option value="1">Manter peso</option><option value="0.85">Perder gordura (−15%)</option><option value="1.1">Ganhar massa (+10%)</option></select>
    <label class="campo" for="nv-kcal">Meta diária de kcal</label><input id="nv-kcal" type="number" inputmode="numeric" value="2200"><p class="peq suave" id="nv-dica"></p></div>
    <div class="aviso">Este jogo é recreativo. A meta de calorias é só uma estimativa (Mifflin-St Jeor) e <b>não é orientação médica ou nutricional</b>. Evite metas muito baixas e consulte um profissional.</div>
    <button class="btn pri bloco" data-act="etapa2">Próximo: aparência ▶</button></div>
    <div id="nv-e2" class="${nvEtapa === 2 ? '' : 'oculto'}"><div id="ed-host"></div><button class="btn bloco" data-act="etapa1">◀ Voltar (nome, classe e corpo)</button><button class="btn pri bloco" data-act="criar">Começar a aventura!</button></div>`;
  },
  aoAbrir: () => {
    calcKcal(); const h = $('#ed-host'); if (!h) return;
    if (!nvEst) { nvEst = { ap: apPadrao(nvCls), cls: nvCls, aoMudar: () => { nvTocou = true; } }; nvTocou = false; }
    nvEst.cls = nvCls; montarEditor(h, nvEst);
  },
  aoFechar: () => { nvEtapa = 1; nvEst = null; nvTocou = false; if (!St.S) $('#titulo').classList.remove('oculto'); },
  ao: { kcal: () => calcKcal() },
  acoes: {
    classe: (el) => { nvCls = el.dataset.id; if (nvEst) { nvEst.cls = nvCls; if (!nvTocou) { const cc = CORES_CLASSE[nvCls]; Object.assign(nvEst.ap, { roupa1: cc.roupa1, roupa2: cc.roupa2, arm1: cc.arm1, arm2: cc.arm2 }); } nvEst.cat = undefined; } rerender(); },
    etapa2: () => { if (!lerForm()) return; nvEtapa = 2; $('#nv-e1').classList.add('oculto'); $('#nv-e2').classList.remove('oculto'); $('#painel-corpo').scrollTop = 0; },
    etapa1: () => { nvEtapa = 1; $('#nv-e2').classList.add('oculto'); $('#nv-e1').classList.remove('oculto'); $('#painel-corpo').scrollTop = 0; },
    criar: async () => {
      const cfg = lerForm(); if (!cfg) return; cfg.ap = nvEst ? nvEst.ap : apPadrao(nvCls);
      St.novoJogo(cfg); Au.configurar(St.S.cfg); fecharPainel(); $('#titulo').classList.add('oculto'); hud();
      await G.comecar(true); await G.ui.dialogo('Prólogo', PROLOGO);
      await G.ui.dialogo('Mestra Brasa', ['Então você é o viajante que ouvi falar. Nossa Brasa mal queima...', 'Abra o MENU e registre algo real: uma série na Arena, uma caminhada na Trilha, uns minutos na Biblioteca ou uma refeição na Taverna.', 'Cada ação sua acende a Brasa. Quando o nível subir, a primeira caverna se abre no Vale. Boa sorte!']);
    },
  },
});
function calcKcal() {
  const f = parseFloat(val('nv-ativ')) || 1.55, o = parseFloat(val('nv-obj')) || 1; const base = R.tmb(val('nv-sexo') || 'M', valNum('nv-peso') || 70, valNum('nv-alt') || 170, valNum('nv-ida') || 25);
  const sug = Math.round(base * f * o / 10) * 10; const d = $('#nv-dica'); if (d) d.innerHTML = `Sugestão: <b class="gold">${fmt(sug)} kcal</b> (basal ${fmt(base)}) <button class="btn peq fixo" data-act="usarKcal" data-v="${sug}">usar</button>`;
  const k = document.getElementById('nv-kcal'); if (k && !k.dataset.tocou) k.value = sug;
}

// ======================= TÍTULO =======================
export function montarTitulo() {
  const tem = St.carregar(); const m = $('#titulo-menu'); m.innerHTML = '';
  const b = (rot, cls, fn) => { const e = document.createElement('button'); e.className = 'btn ' + cls; e.textContent = rot; e.addEventListener('click', () => { Au.destravar(); Au.sfx('confirm'); fn(); }); m.append(e); return e; };
  if (tem) b(`▶ Continuar — ${tem.heroi.nome} (nv ${tem.heroi.nivel})`, 'pri', async () => { Au.configurar(tem.cfg); $('#titulo').classList.add('oculto'); hud(); await G.comecar(false); });
  b(tem ? 'Novo jogo' : '▶ Começar', tem ? '' : 'pri', async () => { if (tem) { const ok = await confirmar('Novo jogo?', 'O herói salvo neste aparelho será substituído quando você criar o novo.', 'Continuar', 'Voltar'); if (!ok) return; St.zerar(); } $('#titulo').classList.add('oculto'); abrirPainel('novo'); });
  const dica = document.createElement('p'); dica.className = 'peq suave'; dica.textContent = 'Instale na tela inicial para jogar como app e offline.'; m.append(dica);
}

// ======================= RELÓGIOS =======================
function tick() {
  const s = St.S; if (!s) return; const po = s.timers && s.timers.pomo;
  if (po && Date.now() >= po.fim) { delete s.timers.pomo; const r = St.registrarEstudo(po.tipo, po.cat, po.min, 'Pomodoro', true); Au.sfx('nivel'); toast(r.erro ? r.erro : `🍅 Pomodoro concluído! +${r.xp} XP`, 5000); if (B.painelId() === 'biblioteca') rerender(); }
  const c = document.getElementById('tr-cron'); if (c && s.timers.cardio) c.textContent = mmssLocal(Date.now() - s.timers.cardio.t0);
  const p = document.getElementById('po-cron'); if (p && s.timers.pomo) p.textContent = mmssLocal(s.timers.pomo.fim - Date.now());
}
const mmssLocal = (ms) => { const t = Math.max(0, Math.round(ms / 1000)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

// ======================= LIGAÇÃO =======================
export function instalarUi() {
  B.ligarPainel();
  G.ui = {
    modalAberto: () => B.painelAberto() || B.dialogoAberto() || B.popupAberto() || !$('#titulo').classList.contains('oculto') || (St.S == null && G.modo === 'titulo'),
    dialogoAberto: B.dialogoAberto, dialogoAvancar: B.dialogoAvancar, fechar: () => { if (B.painelAberto()) fecharPainel(); }, painel: abrirPainel, toast, dialogo: B.dialogo, dialogoEscolha: B.dialogoEscolha,
    confirmar, tentarCapitulo, fimCapitulo, fimDeJogo, hud, drenar,
  };
  St.bus.on('mudou', hud); St.bus.on('popup', () => setTimeout(drenar, 30)); setInterval(drenar, 400); setInterval(tick, 1000);
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && B.popupAberto()) { const b = document.querySelector('#popup .btn.pri[data-res]') || document.querySelector('#popup [data-res]'); if (b) { e.preventDefault(); b.click(); } }
    else if ((e.key === 'Enter') && !$('#titulo').classList.contains('oculto') && !B.painelAberto() && !B.popupAberto()) { const b = document.querySelector('#titulo-menu .btn.pri'); if (b) b.click(); }
  });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-act="usarKcal"]'); if (b) { const k = document.getElementById('nv-kcal'); if (k) { k.value = b.dataset.v; k.dataset.tocou = ''; } } });
  document.addEventListener('input', (e) => { if (e.target && e.target.id === 'nv-kcal') e.target.dataset.tocou = '1'; });
}
