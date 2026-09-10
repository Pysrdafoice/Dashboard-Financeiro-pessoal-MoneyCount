import { DOM } from '../ui/dom.js';
import {
  redimensionarGraficoDoSlide,
  atualizarBadgeVariacao,
} from './graficos.js';

const TITULOS_SLIDES = [
  'Distribuição por Categoria',
  'Evolução Histórica',
  'Evolução do Guardado',
];
let slideAtual = 0;

export function obterSlideAtual() {
  return slideAtual;
}

export function inicializarCarrossel() {
  TITULOS_SLIDES.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carrossel-dot' + (i === 0 ? ' ativo' : '');
    dot.setAttribute('aria-label', `Ir para gráfico ${i + 1}`);
    dot.addEventListener('click', () => irParaSlide(i));
    DOM.carrosselDots.appendChild(dot);
  });

  DOM.carrosselPrev.addEventListener('click', () =>
    irParaSlide(slideAtual - 1),
  );
  DOM.carrosselNext.addEventListener('click', () =>
    irParaSlide(slideAtual + 1),
  );

  let touchStartX = 0;
  const viewport = document.querySelector('.carrossel-viewport');
  viewport.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true },
  );
  viewport.addEventListener(
    'touchend',
    (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diferenca = touchStartX - touchEndX;
      if (Math.abs(diferenca) > 40) {
        irParaSlide(slideAtual + (diferenca > 0 ? 1 : -1));
      }
    },
    { passive: true },
  );
}

export function irParaSlide(indice) {
  const total = TITULOS_SLIDES.length;
  slideAtual = (indice + total) % total;

  DOM.carrosselSlides.forEach((slide, i) => {
    slide.classList.toggle('ativo', i === slideAtual);
  });
  DOM.carrosselTitulo.textContent = TITULOS_SLIDES[slideAtual];
  [...DOM.carrosselDots.children].forEach((dot, i) => {
    dot.classList.toggle('ativo', i === slideAtual);
  });

  const ehSlideHistorico = slideAtual === 1;

  const btnColapsarCarrossel = document.querySelector(
    '.carrossel-card .btn-colapsar',
  );
  if (btnColapsarCarrossel) {
    btnColapsarCarrossel.classList.toggle('hidden', ehSlideHistorico);
  }

  atualizarBadgeVariacao(ehSlideHistorico);

  requestAnimationFrame(() => redimensionarGraficoDoSlide(slideAtual));
}
