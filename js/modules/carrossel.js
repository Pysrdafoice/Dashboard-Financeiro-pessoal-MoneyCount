/**
 * modules/carrossel.js — a navegação entre os 3 slides de gráficos
 * (setas, dots, swipe no mobile). A troca visual em si é feita com
 * display:none/block (não transform), de propósito — veja o comentário
 * dentro de irParaSlide() para o porquê.
 */
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

  // Suporte a swipe (arrastar o dedo) no mobile
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
  slideAtual = (indice + total) % total; // navegação circular

  DOM.carrosselSlides.forEach((slide, i) => {
    slide.classList.toggle('ativo', i === slideAtual);
  });
  DOM.carrosselTitulo.textContent = TITULOS_SLIDES[slideAtual];
  [...DOM.carrosselDots.children].forEach((dot, i) => {
    dot.classList.toggle('ativo', i === slideAtual);
  });

  const ehSlideHistorico = slideAtual === 1;

  // Requisito: o botão de minimizar não deve existir para a Evolução
  // Histórica. Como Pizza e Histórico dividem o mesmo card (carrossel),
  // a seta é escondida somente enquanto o slide de Histórico está ativo,
  // e volta a aparecer normalmente no slide de Distribuição.
  const btnColapsarCarrossel = document.querySelector(
    '.carrossel-card .btn-colapsar',
  );
  if (btnColapsarCarrossel) {
    btnColapsarCarrossel.classList.toggle('hidden', ehSlideHistorico);
  }

  atualizarBadgeVariacao(ehSlideHistorico);

  // Passo crucial: o Chart.js não mede canvas com display:none. Ao tornar
  // o slide visível de novo, é preciso forçar o recálculo do tamanho —
  // essa é a causa-raiz do bug de gráfico "quebrado" no carrossel antigo.
  requestAnimationFrame(() => redimensionarGraficoDoSlide(slideAtual));
}
