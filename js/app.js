import { estado } from './estado.js';
import { salvarDados, carregarDados } from './persistencia.js';
import { DOM } from './ui/dom.js';
import {
  calcularTotais,
  formatarMoeda,
  filtrarGastosAposFechamento,
  filtrarGanhosAposFechamento,
} from './calculos.js';

import { adicionarGasto, renderizarExtrato } from './modules/gastos.js';
import { adicionarGanho, renderizarExtratoGanhos } from './modules/ganhos.js';
import { definirLimite, renderizarListaLimites } from './modules/limites.js';
import {
  registrarMovimentoPoupanca,
  renderizarPoupanca,
} from './modules/poupanca.js';
import {
  renderizarBannerEmocional,
  mostrarAlertaStreak,
} from './modules/streak.js';
import {
  renderizarGraficoPizza,
  renderizarGraficoLinha,
  renderizarGraficoGuardado,
} from './modules/graficos.js';
import { fecharModal } from './modules/modal.js';
import { inicializarCarrossel } from './modules/carrossel.js';
import { aplicarTemaSalvo, alternarTema } from './modules/tema.js';
import {
  abrirMenu,
  fecharMenu,
  inicializarSecoesColapsaveis,
} from './modules/menu.js';
import {
  exportarBackup,
  importarBackup,
  exportarCsv,
} from './modules/backup.js';
import {
  verificarPrimeiraVisita,
  inicializarOnboarding,
} from './modules/onboarding.js';

function atualizarInterface() {
  if (document.activeElement !== DOM.inputSalario) {
    DOM.inputSalario.value = estado.salario ? estado.salario : '';
  }

  const { totalGastos, rendaTotal, saldoRestante } = calcularTotais(estado);
  DOM.resRenda.textContent = formatarMoeda(rendaTotal);
  DOM.resGastos.textContent = formatarMoeda(totalGastos);
  DOM.resSaldo.textContent = formatarMoeda(saldoRestante);
  DOM.resSaldo.className = saldoRestante >= 0 ? 'text-success' : 'text-danger';
  DOM.cardResumo.classList.toggle('card-alerta', saldoRestante < 0);

  renderizarExtrato();
  renderizarExtratoGanhos();
  renderizarGraficoPizza();
  renderizarGraficoLinha();
  renderizarGraficoGuardado();
  renderizarListaLimites();
  renderizarPoupanca();
  renderizarBannerEmocional();
}

function fecharMes() {
  const { totalGastos, totalGanhosExtras, rendaTotal } = calcularTotais(estado);
  const dataAtual = new Date();
  const nomeMes = `${dataAtual.getMonth() + 1}/${dataAtual.getFullYear()}`;

  estado.historico = estado.historico.filter((h) => h.mes !== nomeMes);
  estado.historico.push({
    mes: nomeMes,
    salario: estado.salario,
    totalGanhosExtras,
    rendaTotal,
    totalGastos,
  });

  estado.gastos = filtrarGastosAposFechamento(estado.gastos);
  estado.ganhos = filtrarGanhosAposFechamento(estado.ganhos);

  salvarDados();
  atualizarInterface();
  alert(
    'Mês fechado! Gastos e ganhos fixos, além de parcelas ativas, já estão prontos para o novo mês.',
  );
}

function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./service-worker.js').catch((erro) => {
    console.error('Não foi possível registrar o Service Worker.', erro);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  aplicarTemaSalvo();
  carregarDados();
  atualizarInterface();
  inicializarCarrossel();
  inicializarSecoesColapsaveis();
  inicializarOnboarding();

  const ehPrimeiraVisita = verificarPrimeiraVisita();
  if (!ehPrimeiraVisita) {
    mostrarAlertaStreak();
  }
  registrarServiceWorker();

  DOM.btnTema.addEventListener('click', alternarTema);

  DOM.inputSalario.addEventListener('input', (e) => {
    const valor = parseFloat(e.target.value);
    estado.salario = !isNaN(valor) && valor >= 0 ? valor : 0;
    salvarDados();
    atualizarInterface();
  });

  DOM.formGasto.addEventListener('submit', (e) => {
    e.preventDefault();
    if (adicionarGasto()) atualizarInterface();
  });

  DOM.formGanho.addEventListener('submit', (e) => {
    e.preventDefault();
    if (adicionarGanho()) atualizarInterface();
  });

  DOM.formPoupanca.addEventListener('submit', (e) => {
    e.preventDefault();
    registrarMovimentoPoupanca();
  });

  DOM.tipoGasto.addEventListener('change', () => {
    DOM.parcelasGasto.classList.toggle(
      'hidden',
      DOM.tipoGasto.value !== 'parcelado',
    );
  });

  DOM.btnFecharMes.addEventListener('click', fecharMes);

  DOM.formLimite.addEventListener('submit', (e) => {
    e.preventDefault();
    definirLimite();
  });

  DOM.modalFechar.addEventListener('click', fecharModal);
  DOM.modalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.modalOverlay) fecharModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharModal();
      fecharMenu();
    }
  });

  DOM.btnExportarBackup.addEventListener('click', exportarBackup);
  DOM.btnImportarBackup.addEventListener('click', () =>
    DOM.inputImportarBackup.click(),
  );
  DOM.inputImportarBackup.addEventListener('change', async (e) => {
    if (await importarBackup(e)) atualizarInterface();
  });
  DOM.btnExportarCsv.addEventListener('click', exportarCsv);

  DOM.btnMenu.addEventListener('click', abrirMenu);
  DOM.btnFecharMenu.addEventListener('click', fecharMenu);
  DOM.menuOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.menuOverlay) fecharMenu();
  });
});
