// Editor de aparência do herói: raça, corpo, rosto, cabelo, barba, roupa, armadura e cores, com prévia ao vivo em 32 bits.
import { RACAS, ORDEM_RACAS, ANCESTRAIS, CORPOS, ALTURAS, ROSTOS, OLHOS, SOBRANCELHAS, BOCAS, NARIZES, CABELOS, BARBAS, MARCAS, ROUPAS, ACESSORIOS, ESTILOS_ARM, CHIFRES, CAPAS_FORMA, CORES_CABELO, CORES_OLHOS, CORES, KITS, apPadrao, sortearAp, combinacoes, normalizarAp } from './cosmeticos.js';
import { spritePessoa, retrato } from './pessoa.js';
import { tokenPessoa, ARMA_CLASSE } from './tokens.js';

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ABAS = [['raca', 'Raça'], ['corpo', 'Corpo'], ['rosto', 'Rosto'], ['cabelo', 'Cabelo'], ['barba', 'Barba'], ['roupa', 'Roupa'], ['arm', 'Armadura']];
const CAT_NOME = { leve: 'Leve', media: 'Média', pesada: 'Pesada', veste: 'Vestes' };
const NOME_TIPO = { tecido: 'Tecido', couro: 'Couro', pele: 'Peles', malha: 'Malha', escamas: 'Escamas', placa: 'Placas' };
const NOME_ELMO = { nenhum: 'sem elmo', aberto: 'elmo aberto', fechado: 'elmo fechado', crista: 'elmo com crista', chifres: 'elmo com chifres', capuz: 'capuz', chapeu: 'chapéu', coroa: 'coroa' };

export function expoente() { return Math.floor(Math.log10(combinacoes())); }

// host: elemento onde o editor é montado. est: { ap, cls, cat, orn, aba, aoMudar(ap) }. Devolve funções de controle.
export function montarEditor(host, est) {
  est.ap = normalizarAp(est.ap, est.cls); est.aba = est.aba || 'raca'; if (est.orn === undefined) est.orn = 2;
  const cats = () => Object.keys(KITS[est.cls] || {}); if (est.cat === undefined) est.cat = cats()[0] || null; if (est.cat && !cats().includes(est.cat)) est.cat = cats()[0] || null;
  host.innerHTML = `<div class="ed-prev"><canvas class="ed-cv" width="330" height="160" aria-label="Prévia do herói"></canvas><div class="ed-acoes"><button class="btn peq" data-e="sorteio">🎲 Sortear tudo</button><button class="btn peq" data-e="sorteioVis">🎲 Só o visual</button><button class="btn peq" data-e="padrao">↺ Padrão</button></div><div class="ed-info" id="ed-info"></div></div><div class="abas ed-abas" id="ed-abas"></div><div id="ed-corpo"></div>`;
  const cv = host.querySelector('.ed-cv'); const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
  const vis = () => ({ cls: est.cls, cat: est.cat, mag: 0, ornam: est.orn, nivel: 1 + est.orn * 4, escudo: false, capaC: '#8a2a1a', capaC2: '#5a1a10', elmo: !!est.ap.elmo });
  const sp = (d, p = 'idle') => spritePessoa(est.ap, vis(), d === 'dir' ? 'esq' : d, p);
  function prev() {
    cx.clearRect(0, 0, cv.width, cv.height); const g = cx.createRadialGradient(60, 90, 10, 60, 90, 130); g.addColorStop(0, '#3a3060'); g.addColorStop(1, '#16112a'); cx.fillStyle = g; cx.fillRect(0, 0, cv.width, cv.height);
    cx.fillStyle = 'rgba(0,0,0,.35)'; cx.beginPath(); cx.ellipse(54, 150, 34, 7, 0, 0, 7); cx.fill();
    cx.imageSmoothingEnabled = false; cx.drawImage(sp('baixo'), 6, 8, 96, 144); // 3x
    const peq = [['esq', 'idle', 112], ['cima', 'idle', 180], ['esq', 'atq', 248]]; for (const [d, p, x] of peq) cx.drawImage(sp(d, p), x, 4, 64, 96);
    const ret = retrato(est.ap, vis(), 2); cx.drawImage(ret, 112, 100); cx.fillStyle = '#fff'; cx.font = '10px ui-monospace, monospace'; cx.textBaseline = 'top';
    const R = RACAS[est.ap.raca]; cx.fillText(R.nome.toUpperCase(), 184, 106); cx.fillStyle = '#a79fc4'; cx.fillText(`${CORPOS[est.ap.corpo]} · ${ALTURAS[Math.max(0, Math.min(6, est.ap.altura + 3))]}`, 184, 122); cx.fillText(`${CABELOS[est.ap.cabelo]}`, 184, 136);
    const tkp = tokenPessoa(est.ap, { ...vis(), escudo: false }, ARMA_CLASSE[est.cls]); if (tkp) { cx.save(); cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high'; cx.fillStyle = 'rgba(0,0,0,.28)'; cx.beginPath(); cx.arc(296, 130, 29, 0, 7); cx.fill(); cx.drawImage(tkp, 266, 100, 60, 60); cx.restore(); } else if (host.isConnected) setTimeout(prev, 200);
    const inf = host.querySelector('#ed-info'); if (inf) inf.textContent = `Mais de 10^${expoente()} combinações de estilo × cores livres`;
  }
  const mudou = () => { prev(); if (est.aoMudar) est.aoMudar(est.ap); };
  const chips = (rot, k, lista, { deslocar = 0, cols = 3 } = {}) => `<h3>${esc(rot)}</h3><div class="ed-chips c${cols}">${lista.map((n, i) => `<button class="chip-ed ${est.ap[k] === i + deslocar ? 'sel' : ''}" data-e="v" data-k="${k}" data-v="${i + deslocar}">${esc(n)}</button>`).join('')}</div>`;
  const cores = (rot, k, lista, { igual = false } = {}) => { const atual = est.ap[k]; const tem = lista.map((c) => c.toLowerCase()).includes(String(atual).toLowerCase());
    return `<h3>${esc(rot)}</h3><div class="ed-cores">${igual ? `<button class="sw sw-igual ${atual == null ? 'sel' : ''}" data-e="cor" data-k="${k}" data-v="" title="Igual ao cabelo">⟲</button>` : ''}${lista.map((c) => `<button class="sw ${String(atual).toLowerCase() === c.toLowerCase() ? 'sel' : ''}" style="background:${c}" data-e="cor" data-k="${k}" data-v="${c}" aria-label="${c}"></button>`).join('')}<label class="sw sw-livre ${!tem && atual ? 'sel' : ''}" title="Cor personalizada" ${!tem && atual ? `style="background:${atual}"` : ''}><span>＋</span><input type="color" data-e="corLivre" data-k="${k}" value="${/^#[0-9a-f]{6}$/i.test(atual || '') ? atual : '#808080'}"></label></div>`; };
  function abaRaca() {
    const a = est.ap, R = RACAS[a.raca]; const bonus = Object.entries(R.bonus).map(([k, v]) => `+${v} ${k}`).join(' ');
    let h = `<div class="ed-racas">${ORDEM_RACAS.map((id) => `<button class="raca-ed ${a.raca === id ? 'sel' : ''}" data-e="raca" data-v="${id}"><span>${RACAS[id].emoji}</span>${esc(RACAS[id].nome)}</button>`).join('')}</div>`;
    h += `<div class="card"><h4><span>${R.emoji} ${esc(R.nome)}</span><span class="tag" style="background:#ffd23f">${esc(bonus)}</span></h4><p class="peq">${esc(R.desc)}</p><ul class="peq suave ed-tracos">${R.tracos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
    if (a.raca === 'draconato') h += `<h3>Linhagem do dragão</h3><div class="ed-chips c2">${Object.entries(ANCESTRAIS).map(([id, v]) => `<button class="chip-ed ${a.anc === id ? 'sel' : ''}" data-e="anc" data-v="${id}"><i class="bolinha" style="background:${v.cor}"></i>${esc(v.nome)}</button>`).join('')}</div><p class="peq suave">Seu sopro e sua resistência seguem esta linhagem.</p>`;
    if (R.chifres) h += chips('Chifres', 'chifre', CHIFRES, { cols: 4 });
    h += cores('Cor da pele / escamas', 'pele', R.pele);
    return h;
  }
  function abaCorpo() { const a = est.ap; return chips('Constituição', 'corpo', CORPOS) + `<h3>Altura: ${ALTURAS[Math.max(0, Math.min(6, a.altura + 3))]}</h3><input type="range" min="-3" max="3" step="1" value="${a.altura}" data-e="altura" class="ed-range"><p class="peq suave">A altura muda as proporções do sprite. Raças pequenas já nascem mais baixas.</p>` + cores('Tom de pele', 'pele', RACAS[a.raca].pele); }
  function abaRosto() { return chips('Formato do rosto', 'rosto', ROSTOS) + chips('Olhos', 'olhos', OLHOS) + cores('Cor dos olhos', 'olhosCor', CORES_OLHOS) + chips('Sobrancelhas', 'sobr', SOBRANCELHAS) + chips('Nariz', 'nariz', NARIZES, { cols: 4 }) + chips('Boca', 'boca', BOCAS, { cols: 4 }) + chips('Marcas e cicatrizes', 'marca', MARCAS); }
  function abaCabelo() { return chips('Estilo de cabelo', 'cabelo', CABELOS) + cores('Cor do cabelo', 'cabeloCor', CORES_CABELO); }
  function abaBarba() { return chips('Barba e bigode', 'barba', BARBAS) + cores('Cor da barba', 'barbaCor', CORES_CABELO, { igual: true }); }
  function abaRoupa() { return chips('Roupa de baixo', 'roupa', ROUPAS) + cores('Cor principal', 'roupa1', CORES) + cores('Cor secundária', 'roupa2', CORES) + chips('Acessório', 'acess', ACESSORIOS) + chips('Capa', 'capa', CAPAS_FORMA, { cols: 3 }); }
  function abaArm() {
    const a = est.ap; const lista = cats(); const kit = est.cat ? (KITS[est.cls][est.cat] || [])[a.estilo | 0] : null;
    let h = `<p class="peq suave">Cada classe tem armaduras próprias. O que aparece no jogo depende da armadura equipada; aqui você escolhe o estilo e as cores e vê uma prévia de cada categoria.</p><h3>Prévia da categoria</h3><div class="ed-chips c4"><button class="chip-ed ${!est.cat ? 'sel' : ''}" data-e="cat" data-v="">Sem armadura</button>${lista.map((c) => `<button class="chip-ed ${est.cat === c ? 'sel' : ''}" data-e="cat" data-v="${c}">${CAT_NOME[c] || c}</button>`).join('')}</div>`;
    h += `<h3>Ornamento (cresce com nível e armadura)</h3><div class="ed-chips c6">${[0, 1, 2, 3, 4, 5].map((n) => `<button class="chip-ed ${est.orn === n ? 'sel' : ''}" data-e="orn" data-v="${n}">${n}</button>`).join('')}</div>`;
    h += chips('Estilo da armadura', 'estilo', ESTILOS_ARM, { cols: 3 });
    if (kit) h += `<div class="card"><p class="peq"><b>${NOME_TIPO[kit.tipo] || kit.tipo}</b> · ombreiras ${esc(kit.ombro)} · peitoral ${esc(kit.peito)} · saia ${esc(kit.saia)} · ${esc(NOME_ELMO[kit.elmo] || kit.elmo)}</p></div>`;
    h += `<div class="linha" style="margin-top:6px"><label class="ed-check"><input type="checkbox" data-e="elmo" ${a.elmo ? 'checked' : ''}> Mostrar elmo / capuz quando a armadura tiver</label></div>`;
    h += cores('Cor da armadura', 'arm1', CORES) + cores('Cor dos detalhes', 'arm2', CORES);
    return h;
  }
  const FAB = { raca: abaRaca, corpo: abaCorpo, rosto: abaRosto, cabelo: abaCabelo, barba: abaBarba, roupa: abaRoupa, arm: abaArm };
  function desenharAbas() { host.querySelector('#ed-abas').innerHTML = ABAS.map(([k, n]) => `<button class="${est.aba === k ? 'sel' : ''}" data-e="aba" data-v="${k}">${n}</button>`).join(''); }
  function corpo(manterRolagem = true) { const el = host.querySelector('#ed-corpo'); const topo = el.parentElement ? el.parentElement.scrollTop : 0; el.innerHTML = FAB[est.aba](); void manterRolagem; void topo; }
  function tudo() { desenharAbas(); corpo(); prev(); }
  const raca = (id) => { const R = RACAS[id]; if (!R) return; est.ap.raca = id; if (!R.pele.map((c) => c.toLowerCase()).includes(String(est.ap.pele).toLowerCase())) est.ap.pele = R.pele[Math.min(2, R.pele.length - 1)]; if (id === 'draconato') est.ap.pele = ANCESTRAIS[est.ap.anc || 'fogo'].cor; if (id === 'halfling' || id === 'gnomo') est.ap.altura = Math.min(est.ap.altura, 0); };
  host.onclick = (e) => {
    const b = e.target.closest('[data-e]'); if (!b || b.tagName === 'INPUT') return; const t = b.dataset.e; const v = b.dataset.v;
    if (t === 'aba') { est.aba = v; desenharAbas(); corpo(); return; }
    if (t === 'v') { est.ap[b.dataset.k] = +v; if (b.dataset.k === 'estilo' || b.dataset.k === 'capa') { /* mantém */ } }
    else if (t === 'cor') { est.ap[b.dataset.k] = v === '' ? null : v; }
    else if (t === 'raca') { raca(v); }
    else if (t === 'anc') { est.ap.anc = v; est.ap.pele = ANCESTRAIS[v].cor; }
    else if (t === 'cat') { est.cat = v || null; }
    else if (t === 'orn') { est.orn = +v; }
    else if (t === 'sorteio') { const a = sortearAp(Math.random, est.cls, null); Object.assign(est.ap, a); }
    else if (t === 'sorteioVis') { const a = sortearAp(Math.random, est.cls, est.ap.raca); Object.assign(est.ap, a); }
    else if (t === 'padrao') { est.ap = apPadrao(est.cls, est.ap.raca); }
    else return;
    corpo(); mudou();
  };
  host.oninput = (e) => {
    const el = e.target; const t = el.dataset && el.dataset.e; if (!t) return;
    if (t === 'corLivre') { est.ap[el.dataset.k] = el.value; const lab = el.closest('.sw-livre'); if (lab) { lab.style.background = el.value; lab.classList.add('sel'); } host.querySelectorAll(`.sw.sel[data-k="${el.dataset.k}"]`).forEach((x) => x.classList.remove('sel')); mudou(); }
    else if (t === 'altura') { est.ap.altura = +el.value; const h3 = el.previousElementSibling; if (h3) h3.textContent = `Altura: ${ALTURAS[est.ap.altura + 3]}`; mudou(); }
    else if (t === 'elmo') { est.ap.elmo = el.checked; mudou(); }
  };
  tudo();
  return { atualizar: tudo, definirClasse(cls) { est.cls = cls; const l = Object.keys(KITS[cls] || {}); est.cat = l[0] || null; tudo(); } };
}
export { apPadrao, sortearAp, normalizarAp };
