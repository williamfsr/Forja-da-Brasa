// Painéis do mundo aberto: viagem rápida (casa, vila e lugares já visitados) e o mapa-múndi do Vale.
import * as St from './store.js';
import { registrar, fecharPainel, esc, $ } from './uibase.js';
import { G } from './game.js';
import { DESTINOS_VIAGEM, LUG, obterMapa } from './world.js';
import { prepararExterno } from './render.js';
import { CAPITULOS } from './story.js';
import * as Camp from './campanha.js';
import { QLUG } from './historia2.js';

registrar('viagem', {
  titulo: 'Viagem rápida',
  render() {
    const vis = G.visitados(); const emMasmorra = G.modo === 'masmorra';
    const ok = (d) => !d.visto || vis[d.visto]; const card = (d) => `<button class="card btn-card" data-act="ir" data-id="${d.id}" ${emMasmorra ? 'disabled' : ''} style="text-align:left;width:100%;color:var(--texto);background:var(--fundo3)"><h4><span>${d.icone} ${esc(d.nome)}</span></h4><p class="peq suave">${esc(d.desc)}</p></button>`;
    const livres = DESTINOS_VIAGEM.filter(ok), faltam = DESTINOS_VIAGEM.length - livres.length;
    return `<p class="suave">O Marco das Viagens guarda a lembrança de cada lugar que você já pisou. Tocar nele leva você para lá sem custo — a Névoa não segura quem conhece o caminho.</p>${emMasmorra ? '<p class="verm">Não dá para viajar de dentro de uma masmorra.</p>' : ''}${livres.map(card).join('')}${faltam ? `<p class="suave peq" style="text-align:center">🔒 ${faltam} lugar(es) por descobrir — ande até lá uma vez para poder voltar num piscar de olhos.</p>` : ''}<button class="btn bloco" data-act="mapa">🗺️ Abrir o mapa do Vale</button>`;
  },
  acoes: { ir: async (el) => { fecharPainel(); await G.viajar(el.dataset.id); }, mapa: () => G.ui.painel('mapa') },
});

registrar('mapa', {
  titulo: 'Mapa do Vale da Inércia',
  render() { return `<p class="suave peq">A Névoa Parada cerca tudo. As regiões escuras ainda não estão ao seu alcance: avance nos capítulos para clareá-las.</p><canvas id="mapa-cv" style="width:100%;border-radius:8px;border:2px solid var(--borda,#3a3250);background:#05030a"></canvas><div class="linha" style="gap:6px;flex-wrap:wrap;margin:6px 0 12px;font-size:11px"><span class="chip" style="font-size:11px;flex:none"><b style="color:#ff5a6e">●</b> você</span><span class="chip" style="font-size:11px;flex:none"><b style="color:#ffd84a">★</b> missão principal</span><span class="chip" style="font-size:11px;flex:none"><b style="color:#ffd84a">!</b> secundária</span><span class="chip" style="font-size:11px;flex:none"><b>1–15</b> capítulos</span><span class="chip" style="font-size:11px;flex:none"><b style="color:#b9a6ff">∞</b> catacumbas</span></div><div id="mapa-lista"></div>`; },
  aoAbrir() {
    const cv = $('#mapa-cv'); if (!cv) return; const m = obterMapa('vale'); const A = prepararExterno(m); const W = 640, H = Math.round(W * m.h / m.w); cv.width = W; cv.height = H; const x = cv.getContext('2d'); x.imageSmoothingEnabled = true;
    x.drawImage(A.canvas, 0, 0, W, H); const k = W / m.w; const s = St.S; const ativo = St.capituloDisponivel() || 20; const lim = ativo + 1.2;
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) { const r = m.reg[j * m.w + i]; if (r > lim) { x.fillStyle = `rgba(10,8,22,${Math.min(0.88, 0.55 + (r - lim) * 0.05)})`; x.fillRect(i * k, j * k, k + 0.6, k + 0.6); } }
    x.textAlign = 'center'; x.font = 'bold 11px system-ui,sans-serif'; const vis = G.visitados();
    const txt = (t, px, py, cor = '#fff') => { x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,.85)'; x.strokeText(t, px, py); x.fillStyle = cor; x.fillText(t, px, py); };
    for (const t of m.rotulos) { const r = m.reg[Math.min(m.h - 1, Math.max(0, Math.round(t.y + 5))) * m.w + Math.round(t.x)] || 0; if (r > lim) continue; txt(t.t, (t.x + 0.5) * k, t.y * k + 8, '#ffe9a8'); }
    for (const e of m.extra) { if (e.cata) { txt('∞', (e.x + 0.5) * k, (e.y + 0.5) * k + 4, '#c8b6ff'); continue; } const feito = s.historia.limpos.includes(e.n); txt(String(e.n), (e.x + 0.5) * k, (e.y + 0.5) * k + 4, feito ? '#7dffa0' : e.n === ativo ? '#6af0ff' : '#d0d0e0'); }
    for (const q of Camp.ativas(s)) for (const kk of QLUG[q.id] || []) { const l = LUG[kk]; if (!l) continue; txt(q.tipo === 'principal' ? '★' : '!', (l.x + 0.5) * k, (l.y - 1.2) * k, q.tipo === 'principal' ? '#ffd23f' : '#7dd8ff'); }
    const id0 = (G.mapa || 'vila').split('/')[0]; let px = null, py = null; if (G.mp && G.mp.tipo === 'regiao') { px = G.P.x; py = G.P.y; } else if (LUG[id0]) { px = LUG[id0].x; py = LUG[id0].y; } else if (id0 === 'vila') { px = LUG.vila.x; py = LUG.vila.y; }
    if (px != null) { x.fillStyle = '#ff5c6c'; x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.arc((px + 0.5) * k, (py + 0.5) * k, 6, 0, 7); x.fill(); x.stroke(); }
    const lista = $('#mapa-lista'); if (lista) lista.innerHTML = `<h3>Missões ativas</h3>${Camp.ativas(s).map((q) => `<p class="peq">${q.tipo === 'principal' ? '★' : '!'} <b>${esc(q.titulo)}</b> — ${esc((QLUG[q.id] || []).map((kk) => (LUG[kk] || {}).nome).filter(Boolean).join(' / ') || 'no Vale')}</p>`).join('') || '<p class="peq suave">Nenhuma missão ativa.</p>'}<h3>Capítulo ${ativo}</h3><p class="peq">${esc(CAPITULOS[ativo - 1] ? CAPITULOS[ativo - 1].titulo + ' — ' + CAPITULOS[ativo - 1].local : 'Tudo concluído')}</p><p class="peq suave">Lugares visitados: ${Object.keys(vis).length}.</p>`;
  },
});
