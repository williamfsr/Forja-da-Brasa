// Painel de Relações: afinidade, romance, inimizade e interesse romântico dos moradores.
import * as St from './store.js';
import { registrar, esc, rerender } from './uibase.js';
import { S, barra } from './uiutil.js';
import { listaRelacoes } from './romance.js';

const INTERESSES = [['oposto', 'Sexo oposto ao do herói'], ['mulheres', 'Mulheres'], ['homens', 'Homens'], ['todos', 'Todos'], ['ninguem', 'Ninguém']];
const dec = (n) => (n >= 12 ? 'Confidente' : n >= 8 ? 'Amigo' : n >= 5 ? 'Próximo' : n >= 2 ? 'Conhecido' : n > -5 ? 'Neutro' : 'Hostil');

function linha(r) {
  const af = Math.max(-10, Math.min(12, r.afin)); const afPct = ((af + 10) / 22) * 100;
  const selo = r.par === 'casado' ? '💍 Cônjuge' : r.par === 'namoro' ? '💞 Namoro' : r.perdido ? '🌫️ Levado pela Névoa' : r.ini > 0 ? '⚔️ Inimizade' : r.romanceavel && r.afin >= 5 ? '💘 Aberto ao romance' : '';
  return `<div class="card"><h4><span>${esc(r.nome)}${r.papel ? ` <small class="suave">${esc(r.papel)}</small>` : ''}</span><small>${selo}</small></h4>
    <div class="peq">Afinidade: <b>${r.afin > 0 ? '+' : ''}${r.afin}</b> · ${dec(r.afin)}</div>
    <div class="prog ${r.afin < 0 ? 'ruim' : ''}"><i style="width:${afPct.toFixed(1)}%"></i></div>
    ${r.rom > 0 ? `<div class="peq">💗 Romance: <b>${r.rom}/15</b> <small class="suave">(10 = namoro · 15 = casamento)</small></div>${barra(r.rom, 15, 'rom')}` : ''}
    ${r.ini > 0 ? `<div class="peq verm">🔥 Inimizade: <b>${r.ini}/10</b></div>${barra(r.ini, 10, 'ruim')}` : ''}
    ${r.imune ? '<div class="peq suave">Não se envolve com ninguém.</div>' : ''}</div>`;
}

registrar('coracoes', {
  titulo: 'Relações',
  render() {
    const s = S(); const H = s.historia; const L = listaRelacoes(); const par = H.par;
    const nomeDe = (id) => (L.find((x) => x.id === id) || { nome: id }).nome;
    const cab = par ? `<div class="card"><h4><span>${par.tipo === 'casado' ? '💍 Casado(a) com' : '💞 Namorando'} ${esc(nomeDe(par.id))}</span></h4><p class="peq suave">Flertar com outra pessoa termina tudo, zera a afinidade e abre uma inimizade. A história vai lembrar.</p></div>` : '';
    const inim = L.filter((x) => x.ini > 0 || x.perdido);
    const sel = `<div class="card"><h4><span>Interesse romântico</span></h4><select id="interesse" data-on="interesse">${INTERESSES.map(([v, n]) => `<option value="${v}" ${(s.heroi.interesse || 'oposto') === v ? 'selected' : ''}>${n}</option>`).join('')}</select><p class="peq suave">Define quem aparece com a opção "Romance…" depois do nível 5 de afinidade. O padrão é o sexo oposto ao do seu personagem.</p></div>`;
    const ajuda = `<p class="peq suave">Afinidade vai de −10 a 12. Com 5 ou mais, quem for do seu interesse abre o romance (barra de 15: namoro no 10, casamento no 15). Chegando a −5 nasce uma inimizade. Flertar com dois ao mesmo tempo custa caro.</p>`;
    const corpo = L.length ? L.map(linha).join('') : '<p class="suave">Fale com os moradores para começar a criar laços.</p>';
    return `${cab}${ajuda}${sel}${inim.length ? `<h3>Tensões</h3>${inim.map(linha).join('')}` : ''}<h3>Moradores</h3>${corpo}`;
  },
  ao: { interesse: (el) => { S().heroi.interesse = el.value; St.salvar(); rerender(); } },
});
