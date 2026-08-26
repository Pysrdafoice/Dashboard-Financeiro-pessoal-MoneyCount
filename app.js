/**
 * app.js — orquestrador do FuelCount. Único arquivo que:
 *  1) sabe a ordem de inicialização do app;
 *  2) liga cada formulário/botão à função certa;
 *  3) decide QUANDO redesenhar a tela inteira (atualizarInterface).
 *
 * Os módulos de domínio (gastos, ganhos, poupança...) não chamam
 * atualizarInterface() sozinhos — isso é o que evita as dependências
 * circulares explicadas nos comentários de gastos.js/backup.js.
 */
import { estado } from './js/estado.js';
import { salvarDados, carregarDados } from './js/persistencia.js';
import { DOM } from './js/ui/dom.js';
import {
  calcularTotais,
  formatarMoeda,
  filtrarGastosAposFechamento,
  filtrarGanhosAposFechamento,
} from './js/calculos.js';

import { adicionarGasto, renderizarExtrato } from './js/modules/gastos.js';
import {
  adicionarGanho,
  renderizarExtratoGanhos,
} from './js/modules/ganhos.js';
import { definirLimite, renderizarListaLimites } from './js/modules/limites.js';
import {
  registrarMovimentoPoupanca,
  renderizarPoupanca,
} from './js/modules/poupanca.js';
import {
  renderizarBannerEmocional,
  mostrarAlertaStreak,
} from './js/modules/streak.js';
import {
  renderizarGraficoPizza,
  renderizarGraficoLinha,
  renderizarGraficoGuardado,
} from './js/modules/graficos.js';
import { fecharModal } from './js/modules/modal.js';
import { inicializarCarrossel } from './js/modules/carrosel.js';
import { aplicarTemaSalvo, alternarTema } from './js/modules/tema.js';
import {
  abrirMenu,
  fecharMenu,
  inicializarSecoesColapsaveis,
} from './js/modules/menu.js';
import {
  exportarBackup,
  importarBackup,
  exportarCsv,
} from './js/modules/backup.js';

/** Redesenha tudo que depende do estado atual. Chamada após qualquer ação que muda dados. */
function atualizarInterface() {
  // Só resincroniza o campo se ele não estiver em foco (evita apagar o
  // "." ou a "," que o usuário está digitando — ver detalhe no commit
  // original do bug em atualizarInterface()).
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

/** Fecha o mês: salva o histórico e aplica a retenção de Fixos/Parcelados (regras puras em calculos.js). */
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
  mostrarAlertaStreak();
  registrarServiceWorker();

  DOM.btnTema.addEventListener('click', alternarTema);

  DOM.inputSalario.addEventListener('input', (e) => {
    const valor = parseFloat(e.target.value);
    estado.salario = !isNaN(valor) && valor >= 0 ? valor : 0;
    salvarDados();
    atualizarInterface();
  });

  // adicionarGasto()/adicionarGanho() retornam false se a validação falhar
  // — nesse caso não redesenhamos a tela nem soamos como se tivesse dado certo.
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

  // Ver comentário completo no HTML/módulo original: não usamos `required`
  // nativo em parcelasGasto porque ele fica oculto quando o tipo não é
  // "parcelado", e o navegador não valida campo invisível.
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
