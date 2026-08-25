/**
 * modules/streak.js — a parte de UI do streak e do banner emocional
 * (o cálculo em si mora em calculos.js, testável; aqui só o que toca
 * DOM e o `alert()` nativo).
 */
import { estado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import { calcularExibicaoStreak, gerarFraseEmocional } from '../calculos.js';

/**
 * Alerta exibido uma única vez ao abrir o app, mostrando a sequência
 * mesmo quando está zerada (diferente do badge no banner, que some
 * quando não há sequência ativa, pra não soar como cobrança).
 */
export function mostrarAlertaStreak() {
  const { dias, ativo } = calcularExibicaoStreak(estado.streak);
  const diasExibidos = ativo ? dias : 0;
  alert(`🔥 ${diasExibidos} dia(s) seguido(s) anotando gastos`);
}

export function renderizarBannerEmocional() {
  const { dias, ativo } = calcularExibicaoStreak(estado.streak);
  DOM.streakBadge.classList.toggle('hidden', !(ativo && dias > 0));
  if (ativo && dias > 0) {
    DOM.streakNumero.textContent = dias;
  }
  DOM.fraseEmocional.textContent = gerarFraseEmocional(estado);
}