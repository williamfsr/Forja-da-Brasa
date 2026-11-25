// Minigames opcionais da Festa da Brasa. Cada jogo abre num popup, é rápido (10–15 s) e devolve de 0 a 3 estrelas.
import { popup, esc } from './uibase.js';
import * as Au from './audio.js';

const cx = () => document.querySelector('#popup .popup-caixa');
const sh = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function fim(c, titulo, est, txt) {
  Au.sfx(est ? 'win' : 'miss');
  c.innerHTML = `<h2>${esc(titulo)}</h2><p style="font-size:34px;text-align:center;letter-spacing:6px;color:#ffd23f">${'★'.repeat(est)}<span style="color:#555">${'★'.repeat(3 - est)}</span></p><p>${txt}</p><button class="btn pri bloco" data-res="${est}">Continuar</button>`;
}
const cab = (t, sub) => `<h2>${esc(t)}</h2><p class="peq suave">${sub}</p>`;
const btnGrande = 'width:100%;padding:18px 0;font-size:20px;margin-top:8px';

// 1) Queda de braço com o Mestre Ferrão: aperte o mais rápido que puder
function braco(res) {
  const c = cx(); c.innerHTML = cab('💪 Queda de braço', 'Aperte FORÇA (ou Espaço) sem parar. Ferrão empurra de volta. Ganhe antes de 9 segundos.') + '<div style="height:20px;background:#2a1a1a;border:2px solid #000;margin:8px 0"><div id="mg-b" style="height:100%;width:50%;background:linear-gradient(90deg,#ff6a2a,#ffd23f)"></div></div><div id="mg-t" class="peq suave" style="text-align:center">9,0 s</div><button class="btn pri" id="mg-tap" style="' + btnGrande + '">💪 FORÇA!</button>';
  let v = 50, t0 = Date.now(), vivo = true; const barra = c.querySelector('#mg-b'), tt = c.querySelector('#mg-t');
  const tap = () => { if (vivo) { v = Math.min(100, v + 5); Au.sfx('select'); } };
  const kd = (e) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); tap(); } };
  c.querySelector('#mg-tap').addEventListener('pointerdown', (e) => { e.preventDefault(); tap(); }); document.addEventListener('keydown', kd);
  const fimJogo = (est, txt) => { vivo = false; clearInterval(iv); document.removeEventListener('keydown', kd); fim(c, est ? 'Você venceu!' : 'Ferrão venceu', est, txt); };
  const iv = setInterval(() => { const s = (Date.now() - t0) / 1000; v = Math.max(0, v - 2.4); barra.style.width = v + '%'; tt.textContent = Math.max(0, 9 - s).toFixed(1).replace('.', ',') + ' s';
    if (v >= 100) fimJogo(s < 4.5 ? 3 : s < 7 ? 2 : 1, `Em ${s.toFixed(1).replace('.', ',')} s. Ferrão resmunga: "Hmpf. Nada mal."`); else if (s >= 9) fimJogo(0, 'Ferrão ri: "Treina mais braço, herói!"'); }, 100);
  res.fecha = () => { vivo = false; clearInterval(iv); document.removeEventListener('keydown', kd); };
}
// 2) Tiro ao alvo do Quinzinho: toque nos alvos antes que sumam
function alvo(res) {
  const c = cx(); c.innerHTML = cab('🎯 Tiro ao alvo', 'Toque nos alvos antes que sumam. 12 segundos.') + '<div id="mg-a" style="position:relative;height:210px;background:#1a2a1a;border:2px solid #000;overflow:hidden"></div><div id="mg-p" class="peq" style="text-align:center;margin-top:6px">Acertos: 0</div>';
  const area = c.querySelector('#mg-a'), pl = c.querySelector('#mg-p'); let acertos = 0, vivo = true; const t0 = Date.now();
  const sp = () => { if (!vivo) return; const b = document.createElement('button'); b.textContent = '🎯'; b.style.cssText = `position:absolute;left:${6 + Math.random() * 78}%;top:${4 + Math.random() * 72}%;font-size:30px;background:none;border:none;padding:0;cursor:pointer`;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); acertos++; Au.sfx('hit'); pl.textContent = 'Acertos: ' + acertos; b.remove(); }); area.append(b); setTimeout(() => b.remove(), 950); };
  const iv = setInterval(() => { if (Date.now() - t0 >= 12000) { vivo = false; clearInterval(iv); fim(c, `${acertos} acertos`, acertos >= 9 ? 3 : acertos >= 6 ? 2 : acertos >= 3 ? 1 : 0, 'Quinzinho conta as moedas do prêmio... e do prejuízo.'); } else sp(); }, 640);
  res.fecha = () => { vivo = false; clearInterval(iv); };
}
// 3) Culinária da Tavi: memorize a ordem dos ingredientes
function culinaria(res) {
  const E = ['🍖', '🥕', '🧅', '🌶️', '🍄', '🧄']; const c = cx(); let rodada = 0, vivo = true; const tam = [3, 4, 5]; let seq = [], pos = 0, timer = null;
  const rod = () => {
    seq = Array.from({ length: tam[rodada] }, () => pick(E)); pos = 0; c.innerHTML = cab('🍲 Receita da Tavi', `Rodada ${rodada + 1}/3: memorize a ordem dos ingredientes.`) + '<div id="mg-s" style="font-size:54px;text-align:center;height:76px;margin:10px 0"></div><div id="mg-g" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;opacity:.35;pointer-events:none"></div>';
    const g = c.querySelector('#mg-g'); E.forEach((e) => { const b = document.createElement('button'); b.className = 'btn'; b.style.fontSize = '32px'; b.textContent = e; b.addEventListener('click', () => esc1(e)); g.append(b); });
    let i = 0; const show = c.querySelector('#mg-s'); timer = setInterval(() => { if (!vivo) return clearInterval(timer); if (i < seq.length) { show.textContent = seq[i++]; Au.sfx('select'); } else { clearInterval(timer); show.textContent = '?'; g.style.opacity = 1; g.style.pointerEvents = 'auto'; } }, 750);
  };
  const esc1 = (e) => { if (e !== seq[pos]) { Au.sfx('miss'); vivo = false; fim(c, 'Receita errada', rodada, 'A panela borbulhou. Tavi suspira: "Quase!"'); return; } Au.sfx('coin'); pos++;
    if (pos >= seq.length) { rodada++; if (rodada >= 3) { vivo = false; fim(c, 'Banquete perfeito!', 3, 'Tavi prova, fecha os olhos e some três segundos no sabor.'); } else { vivo = false; setTimeout(() => { vivo = true; rod(); }, 500); } } };
  rod(); res.fecha = () => { vivo = false; clearInterval(timer); };
}
// 4) Quiz da Eruvim
const QS = [
  ['Quantas kcal tem 1 g de proteína?', ['4 kcal', '2 kcal', '7 kcal', '9 kcal'], 0], ['Qual macronutriente fornece 9 kcal por grama?', ['Gordura', 'Carboidrato', 'Proteína', 'Fibra'], 0],
  ['“Sobrecarga progressiva” no treino significa…', ['aumentar a exigência aos poucos', 'treinar sempre com a mesma carga', 'treinar só até a falha todo dia', 'pular o aquecimento'], 0],
  ['Fazer testes de memória em vez de só reler o conteúdo chama-se…', ['recuperação ativa', 'leitura dinâmica', 'sublinhado', 'decoreba'], 0], ['Espaçar as revisões em vários dias ajuda porque…', ['fortalece a memória de longo prazo', 'gasta menos tempo no total', 'evita o sono', 'dispensa o descanso'], 0],
  ['Mínimo semanal de atividade aeróbica moderada para adultos (OMS)?', ['150 minutos', '30 minutos', '600 minutos', '15 minutos'], 0], ['Um dos papéis do sono na recuperação do treino é…', ['favorecer a recuperação muscular e consolidar a memória', 'queimar a gordura da refeição', 'substituir a hidratação', 'dispensar o descanso entre séries'], 0],
  ['No D&D 5e, qual o bônus de proficiência no nível 1?', ['+2', '+1', '+3', '+4'], 0], ['Quem é o Rei da Inércia nesta história?', ['Nhor-Kaal', 'Ferrão', 'Gaudêncio', 'Hornfel'], 0], ['Qual dos exercícios abaixo é aeróbico?', ['corrida leve contínua', 'supino reto', 'agachamento com barra', 'rosca direta'], 0],
];
function quiz(res) {
  const c = cx(); const perg = sh(QS).slice(0, 3); let i = 0, ac = 0, vivo = true;
  const mostra = () => {
    const [q, ops] = perg[i]; const emb = sh(ops.map((t, k) => ({ t, ok: k === 0 })));
    c.innerHTML = cab('📚 Quiz da Eruvim', `Pergunta ${i + 1}/3`) + `<p><b>${esc(q)}</b></p>` + emb.map((o, k) => `<button class="btn bloco" data-k="${k}" style="margin:5px 0">${esc(o.t)}</button>`).join('');
    c.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { if (!vivo) return; vivo = false; const o = emb[+b.dataset.k]; if (o.ok) { ac++; b.style.background = '#2a8a3a'; Au.sfx('coin'); } else { b.style.background = '#a02a2a'; Au.sfx('miss'); c.querySelectorAll('[data-k]').forEach((x) => { if (emb[+x.dataset.k].ok) x.style.background = '#2a8a3a'; }); }
      setTimeout(() => { i++; if (i >= 3) fim(c, `${ac}/3 certas`, ac, ac === 3 ? 'Eruvim aplaude com a xícara fria.' : 'Eruvim anota: "Revisar esse tema."'); else { vivo = true; mostra(); } }, 900); }));
  };
  mostra(); res.fecha = () => { vivo = false; };
}
// 5) Dança com a Irmã Aurora: toque na almofada que acender
function danca(res) {
  const c = cx(); const cores = ['#e0482a', '#3a9ae0', '#3ac06a', '#e0c030']; c.innerHTML = cab('💃 Dança no ritmo', 'Toque na almofada que acender, 10 vezes.') + '<div id="mg-d" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0"></div><div id="mg-p" class="peq" style="text-align:center">Acertos: 0</div>';
  const g = c.querySelector('#mg-d'), pl = c.querySelector('#mg-p'); let cur = -1, hits = 0, n = 0, vivo = true, ok = false;
  const pads = cores.map((cor, k) => { const b = document.createElement('button'); b.style.cssText = `height:84px;border:3px solid #000;background:${cor};opacity:.28;border-radius:10px`; b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!vivo || cur < 0 || ok) return; if (k === cur) { hits++; ok = true; b.style.opacity = 1; Au.sfx('coin'); pl.textContent = 'Acertos: ' + hits; } else Au.sfx('miss'); }); g.append(b); return b; });
  const iv = setInterval(() => { if (!vivo) return; pads.forEach((p) => { p.style.opacity = .28; }); if (n >= 10) { vivo = false; clearInterval(iv); fim(c, `${hits} acertos`, hits >= 8 ? 3 : hits >= 6 ? 2 : hits >= 4 ? 1 : 0, 'A irmã gira, ri e quase derruba a vela do altar.'); return; } n++; ok = false; cur = Math.floor(Math.random() * 4); pads[cur].style.opacity = 1; Au.sfx('select'); }, 800);
  res.fecha = () => { vivo = false; clearInterval(iv); };
}
const JOGOS = { braco, alvo, culinaria, quiz, danca };
export async function jogar(tipo) {
  const res = {}; const r = await popup('<div id="mg-raiz"></div>', { classe: 'mini', aoMostrar: () => JOGOS[tipo](res) });
  if (res.fecha) res.fecha(); return +r || 0;
}
export const TITULOS = { braco: 'Queda de braço', alvo: 'Tiro ao alvo', culinaria: 'Receita da Tavi', quiz: 'Quiz da Eruvim', danca: 'Dança no ritmo' };
