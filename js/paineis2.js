// Painéis: Menu, Casa (ficha, equipamento, conquistas, config), Livro da Aventura, lojas, Templo, Portal e Ajuda.
import * as St from './store.js';
import * as R from './rules.js';
import { CLASSES, ITENS, ATRIBUTOS, ATR_NOME } from './srd.js';
import { GRUPOS_TREINO, ATR_FONTE, CONQUISTAS, CAPAS, TIERS } from './conteudo.js';
import { CAPITULOS, ATOS, PROLOGO, FINAIS } from './story.js';
import { registrar, abrirPainel, fecharPainel, rerender, esc, fmt, val, valNum, toast, pct, confirmar, $, $$, popup } from './uibase.js';
import { S, tierTag, escada, barra, descItem, nomeItem, raridadeTag, icoItem, recursosHtml } from './uiutil.js';
import { G } from './game.js';
import * as Au from './audio.js';
import { montarEditor } from './criador.js';
import * as Camp from './campanha.js';
import { QLUG } from './historia2.js';
import { LUG } from './world.js';
import * as Luz from './luz.js';
import * as Clima from './clima.js';
import { horaForcada, forcarHora, acelerar, diaAcelerado } from './relogio.js';
import { htmlFicha, acoesFicha, definirAba as fichaAba } from './ficha.js';

// ======================= CASA =======================
let casaAba = 'ficha'; let casaMsg = ''; let edCasa = null; const usadosCasa = new WeakSet();
const EXAUSTAO = ['Sem exaustão.', 'Fugir fica mais difícil.', 'Você age depois dos inimigos e fugir é bem mais difícil.', 'Desvantagem em todos os seus ataques.', 'Seus PV máximos caem pela metade.', 'Exausto demais: sem Tochas, você não consegue entrar em masmorras.'];
function abaConfig() {
  const s = S(), h = s.heroi; const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return `${casaMsg}<h3>Perfil</h3><div class="card"><label class="campo" for="cf-nome">Nome</label><input id="cf-nome" value="${esc(h.nome)}" maxlength="20" data-reset>
  <div class="linha"><div><label class="campo" for="cf-peso">Peso (kg)</label><input id="cf-peso" type="number" inputmode="decimal" step="0.1" value="${h.peso}" data-reset></div><div><label class="campo" for="cf-alt">Altura (cm)</label><input id="cf-alt" type="number" inputmode="numeric" value="${h.altura}" data-reset></div><div><label class="campo" for="cf-ida">Idade</label><input id="cf-ida" type="number" inputmode="numeric" value="${h.idade}" data-reset></div></div>
  <label class="campo" for="cf-sexo">Tabela de ranks de força</label><select id="cf-sexo" data-reset><option value="M" ${h.sexo === 'M' ? 'selected' : ''}>Masculina</option><option value="F" ${h.sexo === 'F' ? 'selected' : ''}>Feminina</option><option value="N" ${h.sexo === 'N' ? 'selected' : ''}>Média das duas</option></select>
  <p class="peq suave">O peso corporal define os ranks de força (carga ÷ peso). Atualize quando mudar.</p><button class="btn pri bloco" data-act="salvarPerfil">Salvar perfil</button></div>
  <h3>Meta de calorias</h3><div class="card"><p class="peq">Meta atual: <b class="gold">${fmt(h.kcalAlvo)} kcal</b>/dia</p><label class="campo" for="cf-ativ">Nível de atividade</label><select id="cf-ativ" data-on="tdee" data-reset>${R.FATORES_ATIV.map(([n, f]) => `<option value="${f}">${esc(n)}</option>`).join('')}</select>
  <label class="campo" for="cf-obj">Objetivo</label><select id="cf-obj" data-on="tdee" data-reset><option value="1">Manter peso</option><option value="0.85">Perder gordura (−15%)</option><option value="1.1">Ganhar massa (+10%)</option></select>
  <p class="peq" id="cf-tdee"></p><label class="campo" for="cf-kcal">Meta de kcal</label><input id="cf-kcal" type="number" inputmode="numeric" value="${h.kcalAlvo}" data-reset><button class="btn bloco" data-act="salvarKcal">Usar esta meta</button><p class="peq suave">Estimativa de Mifflin-St Jeor. É um jogo, não orientação médica.</p></div>
  <h3>Dias de descanso planejado</h3><div class="card"><p class="peq suave">Esses dias da semana não quebram a sequência nem sobem a Maré da Inércia.</p><div class="linha" style="gap:5px">${dias.map((n, i) => `<button class="btn peq fixo ${(s.cfg.descanso || []).includes(i) ? 'pri' : ''}" data-act="dia" data-i="${i}">${n}</button>`).join('')}</div></div>
  <h3>Som e vibração</h3><div class="card"><div class="linha" style="gap:6px"><button class="btn peq ${s.cfg.som ? 'pri' : ''}" data-act="tog" data-k="som">Efeitos ${s.cfg.som ? 'ON' : 'OFF'}</button><button class="btn peq ${s.cfg.musica ? 'pri' : ''}" data-act="tog" data-k="musica">Música ${s.cfg.musica ? 'ON' : 'OFF'}</button><button class="btn peq ${s.cfg.vibra ? 'pri' : ''}" data-act="tog" data-k="vibra">Vibração ${s.cfg.vibra ? 'ON' : 'OFF'}</button></div></div>
  <h3>Backup</h3><div class="card"><p class="peq suave">Seu progresso fica salvo neste aparelho. Exporte de vez em quando para não perder nada.</p><button class="btn bloco" data-act="exportar">⬇ Baixar backup (.json)</button><button class="btn bloco" data-act="copiar">📋 Copiar backup</button><label class="campo" for="cf-imp">Importar backup</label><input id="cf-imp" type="file" accept=".json,application/json" data-on="importar" data-reset><button class="btn ruim bloco" data-act="zerar">Apagar tudo e recomeçar</button></div>
  <h3>Sobre</h3><div class="card peq"><p><b>Forja da Brasa</b> · aventura 32 bits que transforma treino, aeróbico, estudo e alimentação em progresso de D&amp;D 5e (nível 1–20).</p><p class="suave">Contém material do <b>System Reference Document 5.1</b> da Wizards of the Coast LLC (dnd.wizards.com/resources/systems-reference-document), licenciado sob Creative Commons Attribution 4.0 (CC-BY-4.0). Textos em português adaptados da tradução comunitária dnd5e-pt-br. Código sob licença MIT. Este app é recreativo e não substitui orientação médica ou nutricional.</p></div>`;
}
function tdeeTxt() {
  const h = S().heroi; const f = parseFloat(val('cf-ativ')) || 1.2, o = parseFloat(val('cf-obj')) || 1; const base = R.tmb(h.sexo, valNum('cf-peso') || h.peso, valNum('cf-alt') || h.altura, valNum('cf-ida') || h.idade);
  const total = Math.round(base * f * o / 10) * 10; return `Metabolismo basal ≈ ${fmt(base)} kcal · gasto total ≈ ${fmt(Math.round(base * f))} kcal · sugestão: <b class="gold">${fmt(total)} kcal</b> <button class="btn peq fixo" data-act="aplicarTdee" data-v="${total}">usar</button>`;
}
export const acoesConfig = {
    salvarPerfil: () => { const h = S().heroi; h.nome = val('cf-nome').trim().slice(0, 20) || h.nome; h.peso = Math.max(30, Math.min(300, valNum('cf-peso') || h.peso)); h.altura = Math.max(100, Math.min(250, valNum('cf-alt') || h.altura)); h.idade = Math.max(14, Math.min(100, valNum('cf-ida') || h.idade)); h.sexo = val('cf-sexo'); St.salvar(); St.bus.emit('mudou'); S().stats.tiers = R.tiersPorGrupo(S()); toast('Perfil salvo. Os ranks foram recalculados.'); rerender(); },
    aplicarTdee: (el) => { document.getElementById('cf-kcal').value = el.dataset.v; },
    salvarKcal: () => { const k = Math.round(valNum('cf-kcal')); if (!k || k < 800 || k > 6000) return toast('Informe uma meta entre 800 e 6000 kcal.'); S().heroi.kcalAlvo = k; St.salvar(); toast(k < 1400 ? `Meta salva: ${k} kcal. Atenção: é uma meta baixa; procure orientação profissional.` : `Meta salva: ${k} kcal.`, 4500); rerender(); },
    dia: (el) => { const i = +el.dataset.i; const d = S().cfg.descanso || []; S().cfg.descanso = d.includes(i) ? d.filter((x) => x !== i) : [...d, i]; St.salvar(); rerender(); },
    tog: (el) => { const k = el.dataset.k; S().cfg[k] = !S().cfg[k]; St.salvar(); Au.configurar(S().cfg); if (k === 'musica' && S().cfg.musica) Au.tocarMusica(G.modo === 'masmorra' ? 'masmorra' : G.modo === 'vale' ? 'mundo' : 'vila', true); rerender(); },
    exportar: () => { const b = new Blob([St.exportar()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `forja-da-brasa-${St.hoje()}.json`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Backup baixado.'); },
    copiar: async () => { try { await navigator.clipboard.writeText(St.exportar()); toast('Backup copiado para a área de transferência.'); } catch (e) { toast('Não foi possível copiar. Use o download.'); } },
    zerar: async () => { const ok = await confirmar('Apagar tudo?', 'Isso apaga seu herói e todo o progresso deste aparelho. Exporte um backup antes se quiser guardar.', 'Apagar', 'Cancelar'); if (!ok) return; St.zerar(); location.reload(); },
};
export const aoConfig = {
  tdee: () => { const el = $('#cf-tdee'); if (el) el.innerHTML = tdeeTxt(); },
  importar: (el) => { const f = el.files && el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { St.importar(String(r.result)); toast('Backup importado!'); setTimeout(() => location.reload(), 600); } catch (e) { toast('Arquivo inválido.'); } }; r.readAsText(f); },
};
export const htmlConfig = () => abaConfig();
export const posConfig = () => { const el = $('#cf-tdee'); if (el) el.innerHTML = tdeeTxt(); };
registrar('casa', {
  titulo: 'Casa do Herói',
  render(a) {
    if (a && a.aba && !usadosCasa.has(a)) { usadosCasa.add(a); casaAba = a.aba === 'equip' || a.aba === 'conq' ? 'ficha' : a.aba; if (a.aba === 'equip') fichaAba('equip'); if (a.aba === 'conq') fichaAba('conq'); }
    const abas = [['ficha', 'Ficha'], ['ap', 'Aparência'], ['config', 'Config']];
    return `<div class="abas">${abas.map(([k, n]) => `<button class="${casaAba === k ? 'sel' : ''}" data-act="aba" data-k="${k}">${n}</button>`).join('')}</div>${casaAba === 'ficha' ? htmlFicha() : casaAba === 'ap' ? '<div id="ed-host"></div><p class="peq suave">As mudanças são salvas automaticamente. Raça e cosméticos não alteram a classe, mas a raça concede bônus de atributo.</p>' : abaConfig()}`;
  },
  aoAbrir: () => { posConfig(); const h = $('#ed-host'); if (h) { const hh = S().heroi; let t = null; edCasa = { ap: hh.ap, cls: hh.cls, aba: edCasa ? edCasa.aba : 'raca', aoMudar: (ap) => { hh.ap = ap; clearTimeout(t); t = setTimeout(() => { St.salvar(); St.bus.emit('mudou'); }, 400); } }; montarEditor(h, edCasa); } },
  ao: { ...aoConfig },
  acoes: { ...acoesFicha, ...acoesConfig, aba: (el) => { casaAba = el.dataset.k; casaMsg = ''; rerender(); $('#painel-corpo').scrollTop = 0; } },
});

// ======================= LIVRO DA AVENTURA =======================
const linhasCap = (cap, flags) => cap.intro.filter((l) => typeof l === 'string' || flags[l.se]).map((l) => (typeof l === 'string' ? l : l.t));

const HORAS_PREV = [['auto', 'Agora', null], ['acel', '⏩ Dia acelerado', 'acel'], ['am', '🌅 Amanhecer', 6.2], ['md', '☀️ Meio-dia', 12.5], ['en', '🌇 Entardecer', 17.6], ['no', '🌙 Noite', 22]];
const TEMPOS_PREV = [['auto', 'Automático', null], ['limpo', '☀️ Limpo', 'limpo'], ['chuva', '🌧️ Chuva', 'chuva'], ['tempestade', '⛈️ Tempestade', 'tempestade'], ['nebdensa', '🌫️ Neblina', 'nebdensa']];
function ceuCard() {
  const I = St.inerciaEf(S()); const d = Luz.descricao(); const hf = horaForcada(), tf = Clima.Clima.forcado; const chip = (a, id, nome, on) => `<button class="btn peq ${on ? 'pri' : ''}" data-act="${a}" data-id="${id}" style="margin:0 4px 4px 0">${nome}</button>`;
  const tom = I >= 9 ? 'A luz é doentia e as sombras se esticam: a Inércia sufoca o Vale.' : I >= 7 ? 'O céu fecha, a luz esfria e a tempestade ronda.' : I >= 5 ? 'Nuvens, garoa e neblina: o Vale começa a ficar cinza.' : I >= 3 ? 'O céu oscila entre aberto e nublado.' : 'Céu aberto e luz dourada: a Brasa está forte.';
  return `<div class="card"><h4><span>🌦️ Céu do Vale</span><b>${esc(d.fase)} · ${esc(Clima.nomeClima())}</b></h4><p class="peq suave">${tom}</p><p class="peq">Luz de ${d.astro === 'lua' ? 'lua' : 'sol'}, contraste <b>${d.contraste}</b>, sombras <b>${d.sombras}</b>. A hora segue o relógio do seu aparelho; o tempo muda com a Inércia (${I}/10).</p>
  <p class="peq suave" style="margin-top:6px">Pré-visualizar (só nesta sessão, não altera o jogo):</p><div>${HORAS_PREV.map(([k, n, h]) => chip('previa-hora', k, n, h === null ? hf == null : h === 'acel' ? diaAcelerado() : !diaAcelerado() && hf != null && Math.abs(hf - h) < 0.01)).join('')}</div><div>${TEMPOS_PREV.map(([k, n, t]) => chip('previa-tempo', k, n, t === null ? !tf : tf === t)).join('')}</div></div>`;
}
registrar('livro', {
  titulo: 'Livro da Aventura',
  render() {
    const s = S(), H = s.historia; const ativo = St.capituloDisponivel(); const fim = H.final;
    const meter = (v, max, cls) => `<div class="prog ${cls}"><i style="width:${pct(v, max)}%"></i></div>`;
    return `<div class="card"><h4><span>🏘️ Moral da Vila</span><b>${H.moral}/100</b></h4>${meter(H.moral, 100, 'azul')}<p class="peq suave">Sobe com decisões generosas e dias perfeitos. Moral alta baixa os preços das lojas e define o final.</p>
    <h4><span>🌑 Maré da Inércia</span><b>${H.inercia}/10</b></h4>${meter(H.inercia, 10, '')}<p class="peq suave">O Vale começa devastado (9/10). A primeira atividade do dia, a Tríplice Coroa e o dia perfeito baixam a Maré; cada dia parado a faz subir. Em 7+ os monstros ganham força; em 10 o Rei acorda furioso. ${H.inercia >= 7 ? '<b class="verm">Cuidado!</b>' : ''}${H.selo && St.hoje() <= H.selo.ate ? `<br><b>🔔 Selo da Aurora ativo até ${esc(H.selo.ate.split('-').reverse().join('/'))}: o mundo respira como se fosse 0/10 (o valor real continua ${H.inercia}).</b>` : ''}${H.inercia === 0 ? '<br><b>✨ 0/10! Mas o Rei ainda espera. Se você parar, a Névoa volta.</b>' : ''}</p></div>
    ${ceuCard()}
    ${fim ? `<div class="card" style="border-color:var(--ouro)"><h4><span>${esc(FINAIS[fim].nome)}</span></h4>${FINAIS[fim].txt.map((t) => `<p>${esc(t)}</p>`).join('')}<button class="btn pri bloco" data-act="ciclo">⏳ Laço do Tempo: recomeçar (+12% de dificuldade)</button><button class="btn bloco" data-act="explorador">🗝️ ${s.campanha.modo === 'explorador' ? 'Modo Explorador ativo' : 'Virar Explorador de Catacumbas'}</button></div>` : ''}
    <button class="btn bloco" data-act="prologo">📜 Reler o prólogo</button>
    <h3>Capítulo atual</h3>${ativo ? (() => { const c = CAPITULOS[ativo - 1]; return `<div class="card" style="border-color:var(--brasa)"><h4><span>Cap. ${c.n} — ${esc(c.titulo)}</span></h4><p class="peq suave">${esc(ATOS[c.ato - 1].nome)} · ${esc(c.local)} · ${c.andares} andares${H.checkpoint[c.n] ? ` · checkpoint: andar ${H.checkpoint[c.n]}` : ''}</p>${linhasCap(c, H.flags).map((t) => `<p class="peq">${esc(t)}</p>`).join('')}<p class="peq suave">Chefe: <b>${esc(c.boss.nome)}</b>. ${G.modo === 'vila' ? 'Use o Portal ao norte ou abra o Mapa do Vale.' : 'Abra o Mapa do Vale e siga a entrada marcada com ❗.'}</p></div>`; })() : fim ? '<p class="suave">Todos os capítulos foram concluídos.</p>' : `<p class="suave">Nenhum capítulo disponível agora: suba de nível com a vida real!</p>`}
    <h3>Capítulos</h3>${CAPITULOS.map((c) => { const feito = H.limpos.includes(c.n), lock = c.n > s.heroi.nivel; const dec = H.decisoes[c.n]; return `<div class="lista-item" style="opacity:${lock ? 0.45 : 1}"><span class="fixo">${feito ? '✅' : lock ? '🔒' : c.n === ativo ? '➤' : '○'}</span><div class="nome"><b>${c.n}. ${esc(c.titulo)}</b><small>${esc(c.local)} · nível ${c.n}${feito && dec != null ? ` · escolha: ${esc(c.decisao.opcoes[dec].t)}` : ''}</small></div></div>`; }).join('')}`;
  },
  acoes: {
    prologo: async () => { fecharPainel(); await G.ui.dialogo('Prólogo', PROLOGO); },
    ciclo: async () => { const ok = await confirmar('Laço do Tempo?', 'Os capítulos e as missões recomeçam, com monstros 12% mais fortes. Você mantém nível, itens e ouro.', 'Voltar no tempo', 'Cancelar'); if (ok) { St.novoCiclo(); rerender(); } },
    'previa-hora': (el) => { const o = HORAS_PREV.find((x) => x[0] === el.dataset.id); if (o && o[2] === 'acel') acelerar(true); else forcarHora(o ? o[2] : null); rerender(); },
    'previa-tempo': (el) => { const o = TEMPOS_PREV.find((x) => x[0] === el.dataset.id); Clima.forcarClima(o ? o[2] : null); rerender(); },
    explorador: () => { St.escolherModoFinal('explorador'); toast('Catacumbas infinitas com todo o bestiário. Você pode voltar à campanha a qualquer momento.'); rerender(); },
  },
});

// ======================= TEMPLO =======================
registrar('templo', {
  titulo: 'Templo da Irmã Aurora',
  render() {
    const s = S(), d = St.der(), e = s.heroi.exaustao; const custo = 40 * s.heroi.nivel;
    return `<p class="suave">Aurora cuida dos feridos e dos exaustos. Para dissolver a exaustão de verdade, coma na meta (banquete) — ou pague o rito.</p>
    <div class="card"><h4><span>✨ Bênção da Aurora</span><span class="tag" style="background:var(--ok)">grátis</span></h4><p class="peq">Restaura todos os seus PV (${s.heroi.hp}/${d.hpMax}).</p><button class="btn ok bloco" data-act="cura" ${s.heroi.hp >= d.hpMax ? 'disabled' : ''}>Receber bênção</button></div>
    <div class="card"><h4><span>🕯️ Rito de Restauração</span><span class="tag" style="background:var(--ouro)">${fmt(custo)} 🪙</span></h4><p class="peq">Remove 1 nível de Exaustão (você tem ${e}).</p><button class="btn pri bloco" data-act="rito" ${e && s.heroi.ouro >= custo ? '' : 'disabled'}>Pagar o rito</button></div>
    <h3>Níveis de exaustão</h3><div class="card">${EXAUSTAO.slice(1).map((t, i) => `<div class="lista-item"><b class="fixo">${i + 1}</b><div class="nome ${e === i + 1 ? 'gold' : ''}">${esc(t)}</div></div>`).join('')}</div>`;
  },
  acoes: {
    cura: () => { const r = St.templo('cura'); if (r.erro) return toast(r.erro); Au.sfx('heal'); toast('Você se sente renovado.'); rerender(); },
    rito: () => { const r = St.templo('exaustao'); if (r.erro) return toast(r.erro); Au.sfx('heal'); toast('A exaustão se dissipa.'); rerender(); },
  },
});

// ======================= PORTAL =======================
registrar('portal', {
  titulo: 'Portal das Masmorras',
  render() {
    const s = S(), H = s.historia; const ativo = St.capituloDisponivel(); const t = s.heroi.tochas; const ex = s.heroi.exaustao;
    return `<p class="suave">Cada andar custa <b>1 🕯️ Tocha</b>. Tochas vêm da vida real: treino, aeróbico, estudo, dia perfeito, banquetes e baús. Você tem <b class="gold">${t}</b>.</p>${ex >= 5 ? '<div class="aviso">Exausto demais para entrar. Coma bem, descanse ou procure a Irmã Aurora.</div>' : ex >= 3 ? '<div class="aviso">Exaustão alta: desvantagem nos ataques. Considere curar antes.</div>' : ''}
    <div class="card" style="border-color:var(--brasa)"><h4><span>📖 História</span>${ativo ? `<span class="tag" style="background:var(--brasa)">Cap. ${ativo}</span>` : ''}</h4>${ativo ? (() => { const c = CAPITULOS[ativo - 1]; return `<p><b>${esc(c.titulo)}</b> — ${esc(c.local)}</p><p class="peq suave">${c.andares} andares · chefe: ${esc(c.boss.nome)}${H.checkpoint[ativo] ? ` · retoma no andar ${H.checkpoint[ativo]}` : ''}</p><button class="btn pri bloco" data-act="cap" data-n="${ativo}">Iniciar capítulo ${ativo}</button>`; })() : '<p class="peq suave">Sem capítulo disponível. Suba de nível para liberar o próximo!</p>'}</div>
    <div class="card"><h4><span>♾️ Catacumbas Sem Fim</span><span class="tag" style="background:var(--roxo)">recorde andar ${s.catacumbas.melhor}</span></h4><p class="peq">Andares infinitos gerados na hora. A cada 5 andares, um guardião. Ótimo para saque e ouro.</p><button class="btn bloco" data-act="cata">Entrar nas Catacumbas</button></div>
    <p class="peq suave">Ao ser derrotado você perde o ouro saqueado na expedição e acorda na vila com 25% dos PV. O progresso de capítulo é mantido.</p>`;
  },
  acoes: {
    cap: (el) => { fecharPainel(); G.ui.tentarCapitulo(+el.dataset.n); },
    cata: async () => { fecharPainel(); await G.entrarMasmorra({ tipo: 'cata' }); },
  },
});

// ======================= AJUDA =======================
registrar('ajuda', {
  titulo: 'Como jogar',
  render() {
    return `<div class="card"><h4>🔥 A ideia</h4><p class="peq">Sua vida real é a magia deste jogo. Tudo o que você faz fora da tela alimenta a Brasa: vira XP, ouro, Tochas e poder. O jogo (vila, masmorras, combates) é onde você gasta esse poder.</p></div>
    <div class="card"><h4>🏋️ Treino</h4><p class="peq">Só seis exercícios pontuam: <b>supino, terra, agachamento, barra/puxada, remada e desenvolvimento lateral</b>. Cada série vale XP; <b>bater PR</b> (e1RM maior que seu melhor) vale muito mais, dá baú e sobe seu <b>rank</b> (Novato → Mítico), calculado pela carga ÷ seu peso.</p></div>
    <div class="card"><h4>🏃 Aeróbico e 📚 Estudo</h4><p class="peq">Valem por minuto, com multiplicador por atividade ou tipo de estudo. As primeiras horas do dia rendem 100%; depois o retorno diminui (descansar também é treinar). Marcos de tempo dão Tochas.</p></div>
    <div class="card"><h4>🍖 Comida</h4><p class="peq">Anote suas kcal. Comer perto da meta (±10%) é um <b>Banquete</b>: recursos 100%, Inspiração e −1 Exaustão. Comer de menos ou demais reduz seus recursos de descanso (espaços de magia, Surtos, Fúria…) e pode causar exaustão ou sonolência.</p></div>
    <div class="card"><h4>🕯️ Tochas e 🌑 Inércia</h4><p class="peq">Cada andar de masmorra custa 1 Tocha (só se ganha na vida real). Dias sem atividade sobem a Maré da Inércia, que fortalece os monstros. Missões e dias perfeitos a fazem recuar. Sua <b>sequência</b> aumenta o XP; dias de descanso planejados não a quebram.</p></div>
    <div class="card"><h4>🎮 Controles</h4><p class="peq">Direcional para andar, <b>A</b> para falar/abrir, <b>B</b> para voltar, <b>MENU</b> para o menu de pausa. No PC: setas ou WASD, Z/Enter = A, X/Esc = B, M = menu. <b>Zoom:</b> roda do mouse ou pinça no celular (teclas + − e 0 também funcionam).</p></div>
    <div class="card"><h4>📜 Menu de pausa e 📔 Diário</h4><p class="peq">O <b>Menu</b> é um papiro com marcadores: <b>Mapa</b> (e minimapa) com as missões rastreadas, <b>Missões</b> (principais ★ e secundárias ◆), <b>Pessoas</b> (história de cada um e o que você já viveu com ele), <b>Glossário</b> (monstros, itens, lugares e lore que você encontrou), <b>Herói</b> (ficha em slots), <b>Crônica</b> e <b>Sistema</b>. Treino, Aeróbico, Estudo, Dieta e Hábitos ficam no <b>Diário pessoal</b>, um caderno de couro com marcadores — a página vira com animação (arraste, ou use ← →).</p></div>
    <div class="card"><h4>🛒 Lojas</h4><p class="peq">Cada comerciante mostra seus itens em slots; toque num slot para ver a descrição e então <b>Comprar</b> ou <b>Voltar</b>. A <b>afinidade para negociação</b> (acima dele) melhora os preços. Você só vende itens a comerciantes — eles pagam menos do que cobram e têm um <b>caixa diário</b> limitado.</p></div>
    <div class="card"><h4>⚔️ Combate tático</h4><p class="peq">Os combates acontecem no próprio mapa, por turnos (iniciativa no topo). No seu turno: toque numa casa <b>azul</b> para mover (toque de novo para confirmar), toque num inimigo para atacar, ou use a <b>barra de ações</b>: ataques, habilidades de classe, ações padrão, magias (por círculo) e itens aparecem sozinhos em slots, já organizados — abas filtram, passe o mouse (ou toque num slot) para ver a descrição, e as teclas <b>1–9</b> usam os primeiros slots (F encerra o turno). Magias em área mostram o alcance antes de lançar, e atingem aliados também. <b>Falar</b> abre a conversa com inimigos racionais e feras: persuadir, intimidar, subornar, domar, ou usar magias como Enfeitiçar Pessoa. Arraste o mapa para olhar ao redor.</p></div>
    <div class="card"><h4>🧙 Personalização</h4><p class="peq">Em <b>Menu → Herói → Aparência</b> você muda raça, rosto, cabelo, barba, roupas, armadura e cores quando quiser. Converse com os moradores da vila uma vez por dia para ganhar afinidade e recompensas.</p></div>
    <p class="peq suave">Dica de ouro: o melhor jeito de jogar é treinar, estudar e comer bem de verdade. O jogo recompensa quem volta amanhã.</p>`;
  },
});
