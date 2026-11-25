// Lojas (Forja, Alquimia, Empório): vitrine em slots à esquerda, comerciante de frente à direita com o nível de afinidade
// de negociação acima dele. A descrição do item traz Comprar/Vender e Voltar. O herói só vende a comerciantes, que pagam
// menos do que cobram e têm um limite de dinheiro por dia (caixa).
import * as St from './store.js';
import * as R from './rules.js';
import { ITENS } from './srd.js';
import { RAR_COR } from './conteudo.js';
import { registrar, fecharPainel, rerender, esc, fmt, toast } from './uibase.js';
import { urlIcone, detalheItem, TIPO_NOME, EQUIPAVEL, ordenaInv } from './ficha.js';
import { COMERCIANTES, NOMES_NEG, modCompra, vendaLoja } from './economia.js';
import { NPC_PERFIL } from './personalidade.js';
import { imgPessoa } from './pausa.js';
import * as Au from './audio.js';

const S = () => St.S;
const FIL = [['tudo', 'Tudo', null], ['arma', 'Armas', ['arma']], ['armadura', 'Armaduras', ['armadura', 'escudo']], ['acessorio', 'Acessórios', ['acessorio']], ['uso', 'Consumíveis', ['consumivel', 'comida']], ['outros', 'Outros', ['tesouro']]];
const TEMA = { forja: ['#ff7a2a', 'rgba(255,122,42,.35)'], alquimista: ['#4adf9a', 'rgba(74,223,154,.30)'], mercador: ['#ffd23f', 'rgba(255,210,63,.30)'] };
const FALAS = {
  forja: { comprar: 'O aço fala por si. Escolha com calma.', vender: 'Mostre o que trouxe. Só pago por metal que preste.', ok: 'Fechado. Cuide bem dessa peça.', vendeu: 'Bom aço. Paguei o que ele vale.', nao: 'Isso eu não compro.' },
  alquimista: { comprar: 'Tudo fresquinho de hoje… quase.', vender: 'Frascos e comidas, só. Nada de armadura por aqui.', ok: 'Use com sabedoria. Ou sem, tanto faz.', vendeu: 'Ótimo. Vai direto pro caldeirão.', nao: 'Isso não é do meu ramo, querido.' },
  mercador: { comprar: 'Tudo aqui tem preço, e o meu é o melhor!', vender: 'Compro de tudo um pouco… mas pago pouco, hehe.', ok: 'Negócio fechado! Volte sempre.', vendeu: 'Ótimo negócio — pra nós dois.', nao: 'Nem eu quero isso, amigo.' },
};
const compacto = (n) => (n >= 100000 ? Math.round(n / 1000) + 'k' : n >= 10000 ? (n / 1000).toFixed(1).replace('.0', '').replace('.', ',') + 'k' : fmt(n));
const moralTxt = (m) => (m >= 70 ? '−10%' : m >= 40 ? 'normais' : m >= 20 ? '+10%' : '+25%');
const LIM = [-4, 2, 5, 8, 12];

function vitrine(id, loja) {
  const c = COMERCIANTES[loja]; const cor = TEMA[loja] || TEMA.mercador;
  const novo = () => ({ modo: 'comprar', filtro: 'tudo', sel: null, fala: '' });
  let E = novo();
  const itensDe = () => {
    const s = S();
    if (E.modo === 'comprar') return R.estoqueLoja(s, c.chave, s.diario.data).filter((i) => ITENS[i]).map((i) => ({ id: i }));
    return s.inv.filter((i) => ITENS[i.id] && ITENS[i.id].preco > 0).map((i) => ({ id: i.id, n: i.n }));
  };
  const aceita = (it) => c.aceita.includes(it.tipo);
  const casa = (x, cx) => { // preço e disponibilidade de um slot
    const s = S(); const it = ITENS[x.id];
    if (E.modo === 'comprar') { const p = St.precoCompra(x.id, loja); const equip = EQUIPAVEL.includes(it.tipo); return { p, off: s.heroi.ouro < p || (equip && !St.podeEquipar(it)), motivo: s.heroi.ouro < p ? `Faltam ${fmt(p - s.heroi.ouro)} 🪙.` : equip && !St.podeEquipar(it) ? 'Sua classe não usa isso.' : '' }; }
    const p = St.precoVendaItem(x.id, loja); const ac = aceita(it);
    return { p, off: !ac || !(p > 0) || p > cx.resta, motivo: !ac ? `${c.nome} não compra ${(TIPO_NOME[it.tipo] || it.tipo).toLowerCase()}.` : !(p > 0) ? `${c.nome} não quer isso.` : p > cx.resta ? `O caixa de hoje não cobre isso (restam ${fmt(cx.resta)} 🪙).` : '' };
  };
  const slotLoja = (x, cx) => {
    const it = ITENS[x.id]; const k = casa(x, cx); const cor2 = RAR_COR[it.raro] || '#8a6a3a'; const sel = E.sel === x.id;
    return `<button class="sl vt-sl ${sel ? 'sel' : ''} ${k.off ? 'off' : ''}" data-act="v-sel" data-id="${esc(x.id)}" style="--rar:${cor2}" aria-label="${esc(it.nome)}, ${k.p > 0 ? k.p + ' de ouro' : ''}" title="${esc(it.nome)}"><img class="sl-ic" alt="" loading="lazy" src="${urlIcone(it)}">${x.n > 1 ? `<span class="qt">${x.n}</span>` : ''}<span class="sl-pr">${k.p > 0 ? compacto(k.p) + '🪙' : '—'}</span></button>`;
  };
  const detalhe = (cx, rel) => {
    const it = E.sel && ITENS[E.sel]; if (!it) return '';
    const s = S(); const x = itensDe().find((q) => q.id === E.sel); if (!x) { E.sel = null; return ''; }
    const k = casa(x, cx); const tem = St.invQtd(E.sel); let extra = ''; let btn = '';
    if (E.modo === 'comprar') {
      const base = R.precoItem(E.sel, s, c.mod); const d = Math.round((modCompra(rel.nivel) - 1) * 100);
      extra = `<p class="peq">Preço de tabela <b>${fmt(base)} 🪙</b> → ${esc(c.nome)} cobra <b class="gold">${fmt(k.p)} 🪙</b> <span class="suave">(${d === 0 ? 'sem desconto' : (d > 0 ? '+' : '−') + Math.abs(d) + '%'} · afinidade ${esc(rel.nome)})</span></p>${tem ? `<p class="peq suave">Você já tem ×${tem}.</p>` : ''}${k.motivo ? `<p class="peq vt-aviso">${esc(k.motivo)}</p>` : ''}`;
      btn = `<button class="btn peq pri" data-act="v-comprar" data-id="${esc(E.sel)}" ${k.off ? 'disabled' : ''}>Comprar — ${fmt(k.p)} 🪙</button>`;
    } else {
      extra = `<p class="peq">Valor de tabela <b>${fmt(it.preco)} 🪙</b> · ${esc(c.nome)} paga <b class="gold">${k.p > 0 ? fmt(k.p) : '—'} 🪙</b> <span class="suave">(${esc(rel.nome)})</span></p>${x.n > 1 ? `<p class="peq suave">Você tem ×${x.n}.</p>` : ''}${k.motivo ? `<p class="peq vt-aviso">${esc(k.motivo)}</p>` : ''}`;
      btn = `<button class="btn peq pri" data-act="v-vender" data-id="${esc(E.sel)}" ${k.off ? 'disabled' : ''}>Vender — ${k.p > 0 ? fmt(k.p) : '—'} 🪙</button>`;
    }
    return `<div class="vt-det">${detalheItem(E.sel, `${btn}<button class="btn peq" data-act="v-volta">Voltar</button>`, { extra, semValor: true })}</div>`;
  };

  registrar(id, {
    titulo: c.titulo, classe: 'vitrine', rolagem: '.vt-grade',
    render() {
      const s = S(); const rel = St.relComerciante(loja); const cx = St.caixaLoja(loja); const pf = NPC_PERFIL[c.npc]; const img = imgPessoa(c.npc, 4, false);
      const todos = itensDe(); const cont = (f) => todos.filter((x) => !f[2] || f[2].includes(ITENS[x.id].tipo)).length; const fils = FIL.filter((f) => f[0] === 'tudo' || cont(f) > 0);
      if (!fils.some((f) => f[0] === E.filtro)) E.filtro = 'tudo'; const fil = FIL.find((f) => f[0] === E.filtro);
      let lista = todos.filter((x) => !fil[2] || fil[2].includes(ITENS[x.id].tipo)).sort(ordenaInv);
      if (E.modo === 'vender') lista = lista.map((x) => ({ x, ac: aceita(ITENS[x.id]) })).sort((a, b) => (b.ac ? 1 : 0) - (a.ac ? 1 : 0)).map((o) => o.x);
      const casas = lista.map((x) => slotLoja(x, cx)); const total = Math.max(20, Math.ceil(casas.length / 5) * 5); while (casas.length < total) casas.push('<div class="sl vazio" aria-hidden="true"></div>');
      const det = detalhe(cx, rel); const fala = E.fala || (FALAS[loja] || FALAS.mercador)[E.modo];
      const pctC = cx.max > 0 ? Math.round((cx.resta / cx.max) * 100) : 0; const prox = rel.nivel >= 5 ? null : LIM[rel.nivel] - rel.afin;
      const cobra = Math.round((modCompra(rel.nivel) - 1) * 100); const ref = c.aceita[0]; const paga = Math.round((vendaLoja({ tipo: ref, preco: 100 }, loja, rel.nivel) || 0));
      const pips = [1, 2, 3, 4, 5].map((n) => `<i class="${rel.nivel >= n ? 'on' : ''}"></i>`).join('');
      return `<div class="vt ${det ? 'tem-det' : ''}" style="--tema:${cor[0]};--tema2:${cor[1]}">
        <section class="vt-esq"><header class="vt-cab"><h2>${c.emoji} ${esc(c.titulo)}<small>🪙 ${fmt(s.heroi.ouro)} · moral ${s.historia.moral} · preços ${moralTxt(s.historia.moral)}</small></h2><button class="vt-x" data-act="v-sair" aria-label="Sair da loja">✕</button></header>
          <div class="pp-sub vt-abas"><button class="${E.modo === 'comprar' ? 'sel' : ''}" data-act="v-modo" data-k="comprar">🛒 Comprar</button><button class="${E.modo === 'vender' ? 'sel' : ''}" data-act="v-modo" data-k="vender">💰 Vender</button></div>
          <div class="pp-sub vt-fil">${fils.map((f) => `<button class="${E.filtro === f[0] ? 'sel' : ''}" data-act="v-fil" data-k="${f[0]}">${f[1]} <span class="n">${cont(f)}</span></button>`).join('')}</div>
          ${E.modo === 'vender' ? `<p class="peq suave vt-dica">${esc(c.nome)} compra: ${c.aceita.map((t) => (TIPO_NOME[t] || t).toLowerCase() + 's').join(', ')}.</p>` : `<p class="peq suave vt-dica">O estoque muda todo dia. Toque num slot para ver o item.</p>`}
          <div class="vt-grade"><div class="sl-grade vt-slots">${casas.join('')}</div></div>
          ${det || `<div class="vt-det vazio"><button class="btn peq" data-act="v-volta">Voltar</button></div>`}</section>
        <aside class="vt-dir"><div class="vt-afin" title="Quanto mais amigo do comerciante, melhores os preços"><small>Afinidade para negociação</small><b>Nível ${rel.nivel} · ${esc(NOMES_NEG[rel.nivel])}</b><span class="vt-pips">${pips}</span>
            <em>Cobra ${cobra === 0 ? 'o preço normal' : (cobra > 0 ? '+' : '−') + Math.abs(cobra) + '%'} · paga ${paga}% do valor${prox != null && prox > 0 ? ` · faltam ${prox} de afinidade para o próximo nível` : rel.nivel >= 5 ? ' · nível máximo' : ''}</em></div>
          <div class="vt-palco">${img ? `<img class="vt-sprite" alt="${esc(c.nome)}" src="${img.url}" width="${img.w}" height="${img.h}">` : `<div class="vt-sprite vt-emoji">${c.emoji}</div>`}<div class="vt-balcao"></div></div>
          <div class="vt-nome"><b>${esc(c.nome)}</b><small>${esc(pf ? (pf.raca || '') : '')}</small></div>
          <div class="vt-fala">“${esc(fala)}”</div>
          <div class="vt-caixa"><div class="vt-cx-t"><span>Caixa do dia</span><b>${fmt(cx.resta)} / ${fmt(cx.max)} 🪙</b></div><div class="vt-cx-b"><i style="width:${pctC}%"></i></div><small>${E.modo === 'vender' ? 'Ele só paga até esse limite hoje.' : 'Cada compra sua devolve metade ao caixa.'} Renova todo dia.</small></div>
        </aside></div>`;
    },
    acoes: {
      'v-modo': (el) => { E.modo = el.dataset.k; E.sel = null; E.fala = ''; E.filtro = 'tudo'; Au.sfx('select'); rerender(); },
      'v-fil': (el) => { E.filtro = el.dataset.k; E.sel = null; Au.sfx('select'); rerender(); },
      'v-sel': (el) => { E.sel = E.sel === el.dataset.id ? null : el.dataset.id; Au.sfx('select'); rerender(); },
      'v-volta': () => { if (E.sel) { E.sel = null; E.fala = ''; Au.sfx('back'); rerender(); } else fecharPainel(); },
      'v-sair': () => fecharPainel(),
      'v-comprar': (el) => {
        const iid = el.dataset.id; const r = St.comprar(iid, loja); const F = FALAS[loja] || FALAS.mercador;
        if (r.erro) { E.fala = r.erro; toast(r.erro); rerender(); return; }
        Au.sfx('coin'); E.fala = F.ok; toast(`Comprado: ${ITENS[iid].nome} (−${fmt(r.p)} 🪙)`); rerender();
      },
      'v-vender': (el) => {
        const iid = el.dataset.id; const r = St.vender(iid, loja); const F = FALAS[loja] || FALAS.mercador;
        if (r.erro) { E.fala = r.caixa ? 'Hoje meu caixa não aguenta isso. Volte amanhã.' : F.nao; toast(r.erro); rerender(); return; }
        Au.sfx('coin'); E.fala = F.vendeu; toast(`Vendido por +${fmt(r.p)} 🪙`); if (!St.invQtd(iid)) E.sel = null; rerender();
      },
    },
    aoFechar: () => { E = novo(); },
  });
}
vitrine('forja', 'forja'); vitrine('alquimista', 'alquimista'); vitrine('mercador', 'mercador');
