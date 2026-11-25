// Zoom da câmera: roda do mouse (ou Ctrl + roda / pinça do touchpad), pinça com dois dedos no celular/tablet e teclas + − 0.
// O valor fica salvo neste aparelho (não no save) e vale para o mapa, as masmorras e o combate.
import { VW, ZOOM } from './render.js';

const CHAVE = 'forja.zoom';
const limita = (v) => Math.max(ZOOM.min, Math.min(ZOOM.max, v));
let tagT = null;
function aviso() {
  let t = document.getElementById('zoomtag');
  if (!t) { t = document.createElement('div'); t.id = 'zoomtag'; (document.getElementById('jogo') || document.body).append(t); }
  t.textContent = `🔍 ${Math.round(ZOOM.f * 100)}%`; t.classList.add('on'); clearTimeout(tagT); tagT = setTimeout(() => t.classList.remove('on'), 1100);
}
export function definirZoom(f, mostrar = true) {
  const novo = Math.round(limita(f) * 1000) / 1000; if (novo === ZOOM.f) return; ZOOM.f = novo; VW.sujo = true;
  try { localStorage.setItem(CHAVE, String(novo)); } catch (e) { /* ok */ }
  if (mostrar) aviso();
}
export const zoomAtual = () => ZOOM.f;
export function instalarZoom() {
  try { const v = parseFloat(localStorage.getItem(CHAVE)); if (v > 0) ZOOM.f = limita(v); } catch (e) { /* ok */ }
  const tela = document.getElementById('tela'); if (!tela) return;
  // roda do mouse: cada "clique" ≈ 10%; Ctrl+roda e pinça do touchpad chegam como wheel com ctrlKey
  tela.addEventListener('wheel', (e) => {
    e.preventDefault(); const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; const k = e.ctrlKey ? 0.01 : 0.001;
    definirZoom(ZOOM.f * Math.exp(-dy * k));
  }, { passive: false });
  // pinça: dois ponteiros de toque sobre o mapa
  const ptr = new Map(); let d0 = 0, f0 = 1;
  const dist = () => { const [a, b] = [...ptr.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
  tela.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptr.size === 2) { d0 = dist(); f0 = ZOOM.f; } });
  tela.addEventListener('pointermove', (e) => { if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptr.size === 2) { e.preventDefault(); definirZoom(f0 * (dist() / d0)); } });
  const fim = (e) => { ptr.delete(e.pointerId); if (ptr.size === 2) { d0 = dist(); f0 = ZOOM.f; } };
  tela.addEventListener('pointerup', fim); tela.addEventListener('pointercancel', fim); tela.addEventListener('pointerleave', fim);
  // Safari/iOS manda gesturechange além dos ponteiros: ignora o zoom nativo da página
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault());
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return; const t = document.activeElement && document.activeElement.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    if (document.getElementById('painel') && !document.getElementById('painel').classList.contains('oculto')) return;
    if (e.key === '+' || e.key === '=') definirZoom(ZOOM.f * 1.12); else if (e.key === '-' || e.key === '_') definirZoom(ZOOM.f / 1.12); else if (e.key === '0') definirZoom(1);
  });
  // toque duplo no mapa (com o mouse): volta ao zoom padrão
  tela.addEventListener('dblclick', () => definirZoom(1));
}
