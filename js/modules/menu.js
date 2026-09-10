import { DOM } from '../ui/dom.js';
import { obterSlideAtual } from './carrossel.js';
import { redimensionarGraficoDoSlide } from './graficos.js';

export function abrirMenu() {
  DOM.menuOverlay.classList.remove('hidden');
}

export function fecharMenu() {
  DOM.menuOverlay.classList.add('hidden');
}

export function inicializarSecoesColapsaveis() {
  document.querySelectorAll('.colapsavel').forEach((secao) => {
    const botao = secao.querySelector('.btn-colapsar');
    if (!botao) return;
    botao.addEventListener('click', () => {
      const colapsado = secao.classList.toggle('colapsado');
      botao.setAttribute('aria-expanded', String(!colapsado));

      if (!colapsado && secao.classList.contains('carrossel-card')) {
        requestAnimationFrame(() =>
          redimensionarGraficoDoSlide(obterSlideAtual()),
        );
      }
    });
  });
}
