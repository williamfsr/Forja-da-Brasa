// Aba "Hábitos" do menu: aderir a hábitos (catálogo ou personalizado) e retirar os que não servem mais. Cada hábito dá XP uma vez por dia.
import * as St from './store.js';
import { registrar, esc, rerender, val, valNum, toast, confirmar } from './uibase.js';
import { S } from './uiutil.js';
import * as Au from './audio.js';

const CATS = { corpo: ['💪', 'Corpo'], mente: ['🧠', 'Mente'], alma: ['🕯️', 'Alma'], rotina: ['🗓️', 'Rotina'] };
const CATALOGO = [
  ['corpo', '💧', 'Beber 2 L de água', 15, 'Garrafa por perto o dia inteiro.'], ['corpo', '🚶', 'Caminhar 6 mil passos', 20, 'Plantão também conta.'], ['corpo', '🧘', 'Alongar 10 minutos', 15, 'Pescoço, ombros e lombar.'],
  ['corpo', '😴', 'Dormir 7 horas ou mais', 25, 'O PV máximo do dia seguinte agradece.'], ['corpo', '🥗', 'Comer frutas ou verduras', 15, 'Três porções, mais ou menos.'], ['corpo', '🦷', 'Escovar e passar fio dental', 10, 'Todo dia, sem desculpa.'],
  ['corpo', '☀️', 'Sol da manhã por 10 minutos', 10, 'Regula o sono e o humor.'], ['corpo', '💊', 'Vitaminas e remédios em dia', 10, 'O que for do seu tratamento.'], ['corpo', '🚫', 'Sem álcool hoje', 20, 'Um dia de cada vez.'], ['corpo', '🍬', 'Sem açúcar nem refrigerante', 20, 'Hoje a Brasa não queima doce.'],
  ['mente', '📖', 'Ler 10 páginas', 20, 'Qualquer livro que não seja de prova.'], ['mente', '🧠', 'Revisar cartões de estudo', 25, 'Repetição espaçada vale ouro.'], ['mente', '📝', 'Resumir um caso ou tema', 25, 'Cinco linhas já bastam.'], ['mente', '🔇', 'Foco profundo por 25 minutos', 20, 'Celular longe, um bloco só.'],
  ['mente', '📵', 'Sem celular antes de dormir', 15, '30 minutos de tela apagada.'], ['mente', '🌐', 'Estudar inglês por 15 minutos', 15, 'Série, podcast ou artigo.'],
  ['alma', '🙏', 'Gratidão: 3 coisas boas', 10, 'Anote antes de dormir.'], ['alma', '🧘‍♂️', 'Meditar 5 minutos', 15, 'Só respirar também vale.'], ['alma', '📔', 'Escrever no diário', 10, 'Duas linhas do dia.'], ['alma', '🎶', 'Tempo para um hobby', 15, 'Vinte minutos de algo seu.'], ['alma', '📞', 'Falar com alguém querido', 15, 'Ligação, áudio ou café.'], ['alma', '🌳', 'Tempo ao ar livre', 15, 'Nem que seja no quarteirão.'],
  ['rotina', '🛏️', 'Arrumar a cama', 10, 'A primeira vitória do dia.'], ['rotina', '🗓️', 'Planejar o dia', 10, 'Três prioridades.'], ['rotina', '🎒', 'Preparar a mochila / plantão', 10, 'Deixe pronta na véspera.'], ['rotina', '💰', 'Registrar os gastos', 10, 'Cinco minutos de planilha.'], ['rotina', '🧹', 'Arrumar a casa por 10 minutos', 10, 'Um cômodo só.'], ['rotina', '🍱', 'Preparar a marmita', 15, 'Come-se melhor e gasta-se menos.'],
];
let filtro = 'todos', nova = { cat: 'corpo' };
const nomeIgual = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
const tem = (nome) => S().habitos.some((h) => nomeIgual(h.nome, nome));

registrar('habitos', {
  titulo: 'Hábitos',
  render() {
    const s = S(), D = St.dia(); const L = s.habitos; const feitos = L.filter((h) => D.hab[h.id]).length; const usado = D.xpHab || 0;
    const lista = L.map((h) => {
      const feito = !!D.hab[h.id]; const seq = St.sequenciaHabito(h.id); const c = CATS[h.cat] || null;
      return `<div class="card"><div class="linha"><span class="fixo" style="font-size:24px">${esc(h.emoji || (c ? c[0] : '⭐'))}</span><div><b>${esc(h.nome)}</b>${feito ? ' <b class="gold">✔</b>' : ''}<div class="peq suave">+${h.xp} XP por dia${c ? ' · ' + c[1] : ''}${seq > 1 ? ` · <b class="gold">🔥 ${seq} dias seguidos</b>` : seq === 1 ? ' · 1 dia' : ''}</div></div></div>
        <div class="linha" style="gap:6px;margin-top:6px"><button class="btn peq ${feito ? 'ok' : 'pri'}" data-act="cumprir" data-id="${h.id}" ${feito ? 'disabled' : ''} style="flex:1">${feito ? '✔ Feito hoje' : '○ Marcar como feito'}</button><button class="btn peq ruim" data-act="retirar" data-id="${h.id}">Retirar</button></div></div>`;
    }).join('');
    const filtros = ['todos', ...Object.keys(CATS)].map((k) => `<button class="bt-chip ${filtro === k ? 'sel' : ''}" data-act="filtro" data-k="${k}" style="padding:4px 9px;margin:0 4px 4px 0;border:2px solid #000;background:${filtro === k ? 'var(--brasa)' : 'var(--fundo3)'};color:${filtro === k ? '#000' : 'var(--texto)'};font-weight:800;font-size:11px">${k === 'todos' ? 'Todos' : CATS[k][0] + ' ' + CATS[k][1]}</button>`).join('');
    const cat = CATALOGO.map((c, i) => ({ c, i })).filter(({ c }) => filtro === 'todos' || c[0] === filtro).map(({ c, i }) => {
      const ja = tem(c[2]);
      return `<div class="lista-item"><span style="font-size:22px;flex:none">${c[1]}</span><div class="nome">${esc(c[2])}<small>+${c[3]} XP · ${esc(c[4])}</small></div><button class="btn peq ${ja ? '' : 'pri'}" data-act="aderir" data-i="${i}" ${ja ? 'disabled' : ''}>${ja ? '✔ Adotado' : 'Aderir'}</button></div>`;
    }).join('');
    return `<p class="suave">Hábitos são rituais pequenos que você repete todo dia. Cada um rende XP <b>uma vez por dia</b> e conta como atividade (mantém a sequência e baixa a Maré da Inércia). Adira ao que faz sentido e retire o que deixou de servir.</p>
    <div class="card"><h4><span>🌱 Hoje: <b class="gold">${feitos}/${L.length}</b> hábitos</span><span class="peq suave">XP de hábitos ${usado}/${St.HAB_CAP_XP}</span></h4><div class="prog"><i style="width:${L.length ? (feitos / L.length) * 100 : 0}%"></i></div><p class="peq suave">Passou de ${St.HAB_CAP_XP} XP por dia em hábitos? Eles continuam valendo como atividade, só deixam de dar XP extra.</p></div>
    <h3>Meus hábitos</h3>${lista || '<p class="suave">Nenhum hábito ainda. Escolha um abaixo para começar: um só já muda a semana.</p>'}
    <h3>Aderir a um hábito</h3><div style="margin-bottom:6px">${filtros}</div><div>${cat}</div>
    <h3>Criar o seu</h3><div class="card"><label class="campo" for="hb2-n">Nome do hábito</label><input id="hb2-n" maxlength="40" placeholder="Ex.: Treinar o plantão de memória">
    <div class="linha" style="margin-top:6px"><div><label class="campo" for="hb2-c">Categoria</label><select id="hb2-c">${Object.entries(CATS).map(([k, v]) => `<option value="${k}" ${nova.cat === k ? 'selected' : ''}>${v[0]} ${v[1]}</option>`).join('')}</select></div><div class="fixo" style="width:84px"><label class="campo" for="hb2-x">XP</label><input id="hb2-x" type="number" inputmode="numeric" value="20" min="5" max="60"></div></div>
    <button class="btn pri bloco" data-act="criar" style="margin-top:8px">Adicionar hábito</button></div>`;
  },
  acoes: {
    filtro: (el) => { filtro = el.dataset.k; rerender(); },
    aderir: (el) => { const c = CATALOGO[+el.dataset.i]; if (!c || tem(c[2])) return; St.addHabito(c[2], c[3], { emoji: c[1], cat: c[0] }); Au.sfx('confirm'); toast(`Você aderiu a: ${c[2]}`); rerender(); },
    cumprir: (el) => { const r = St.cumprirHabito(el.dataset.id); if (r) { Au.sfx('coin'); toast(r.xp > 0 ? `Hábito cumprido! +${r.xp} XP` : 'Hábito cumprido! (teto diário de XP de hábitos atingido)'); } rerender(); },
    retirar: async (el) => { const h = S().habitos.find((x) => x.id === el.dataset.id); if (!h) return; const ok = await confirmar('Retirar hábito?', `"${h.nome}" sai da sua lista. O histórico de dias já cumpridos continua valendo.`, 'Retirar', 'Manter'); if (ok) { St.delHabito(h.id); toast('Hábito retirado.'); rerender(); } },
    criar: () => { const n = val('hb2-n').trim(); if (!n) return toast('Dê um nome ao hábito.'); if (tem(n)) return toast('Você já tem um hábito com esse nome.'); const c = val('hb2-c') || 'corpo'; nova.cat = c; St.addHabito(n, valNum('hb2-x') || 20, { cat: c, emoji: CATS[c][0] }); Au.sfx('confirm'); toast('Hábito adicionado.'); rerender(); const e = document.getElementById('hb2-n'); if (e) e.value = ''; },
  },
});
