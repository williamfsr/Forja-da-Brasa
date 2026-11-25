// Ponto de entrada: monta a interface, o motor do jogo e registra o service worker.
import { iniciarJogo } from './game.js';
import { instalarUi, montarTitulo } from './ui.js';
import { precarregarHeroi } from './tokens.js';

function iniciar() {
  precarregarHeroi();
  instalarUi();
  iniciarJogo(document.getElementById('tela'));
  montarTitulo();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* offline indisponível */ }); });
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
