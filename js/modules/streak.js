import { estado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import { calcularExibicaoStreak, gerarFraseEmocional } from '../calculos.js';

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
