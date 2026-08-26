/**
 * modules/menu.js — a gaveta lateral (menu hambúrguer) e o comportamento
 * de recolher/expandir seções (⌄).
 */
import { DOM } from '../ui/dom.js';
import { obterSlideAtual } from './carrosel.js';
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

      // Ao reabrir a seção do carrossel, o Chart.js precisa recalcular o
      // tamanho do canvas visível (mesma lógica usada na troca de slides
      // em carrossel.js — daí compartilharem redimensionarGraficoDoSlide).
      if (!colapsado && secao.classList.contains('carrossel-card')) {
        requestAnimationFrame(() => redimensionarGraficoDoSlide(obterSlideAtual()));
      }
    });
  });
}