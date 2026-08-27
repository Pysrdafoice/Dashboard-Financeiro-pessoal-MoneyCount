/**
 * modules/graficos.js — os três gráficos principais do carrossel:
 * Distribuição por Categoria (doughnut), Evolução Histórica (barras) e
 * Evolução do Guardado (linhas). Também guarda as instâncias do Chart.js
 * (só este módulo sabe que elas existem — quem precisa mexer nelas usa
 * as funções exportadas, nunca a variável direto).
 */
import { estado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import { escapeHTML, corTextoGrafico, corGradeGrafico } from '../ui/utils.js';
import {
  calcularTotais,
  calcularGuardadoAjustado,
  calcularVariacaoPercentual,
  parseMesChave,
  formatarMoeda,
} from '../calculos.js';
import { CORES_CATEGORIA, COR_PADRAO } from './categorias.js';
import { abrirModalCategoria } from './modal.js';

let pieChartInstance = null;
let lineChartInstance = null;
let guardadoChartInstance = null;

export function renderizarGraficoPizza() {
  const ctx = DOM.canvasPizza.getContext('2d');

  const categorias = {};
  estado.gastos.forEach((g) => {
    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.valor;
  });

  const labels = Object.keys(categorias);
  const data = Object.values(categorias);
  const { totalGastos } = calcularTotais(estado);

  const cores = labels.length
    ? labels.map((l) => CORES_CATEGORIA[l] || COR_PADRAO)
    : ['#e2e8f0'];

  const chartData = {
    labels: labels.length ? labels : ['Sem dados'],
    datasets: [
      {
        data: data.length ? data : [1],
        backgroundColor: cores,
        borderWidth: 0,
      },
    ],
  };

  renderizarLegendaPizza(labels, cores, data, totalGastos);

  if (pieChartInstance) {
    pieChartInstance.data.labels = chartData.labels;
    pieChartInstance.data.datasets = chartData.datasets;
    pieChartInstance.update();
    return;
  }

  // Plugin simples para desenhar o total gasto no centro do doughnut
  // (indicador compacto — evita depender só da legenda pra ver o total)
  const centroTextoPlugin = {
    id: 'centroTexto',
    afterDraw: (chart) => {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const centroX = (chartArea.left + chartArea.right) / 2;
      const centroY = (chartArea.top + chartArea.bottom) / 2;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = corTextoGrafico();
      ctx.font = '700 16px Inter, sans-serif';
      ctx.fillText(
        formatarMoeda(calcularTotais(estado).totalGastos),
        centroX,
        centroY - 5,
      );

      ctx.font = '400 11px Inter, sans-serif';
      ctx.fillStyle = document.body.classList.contains('dark-mode')
        ? '#94a3b8'
        : '#64748b';
      ctx.fillText('gasto total', centroX, centroY + 14);
      ctx.restore();
    },
  };

  pieChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: chartData,
    plugins: [centroTextoPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false }, // legenda customizada em HTML abaixo do gráfico
      },
      // Clique numa fatia abre o detalhamento da categoria
      onClick: (evt, elements) => {
        if (!elements.length) return;
        const index = elements[0].index;
        const categoriaClicada = pieChartInstance.data.labels[index];
        if (categoriaClicada && categoriaClicada !== 'Sem dados') {
          abrirModalCategoria(categoriaClicada);
        }
      },
      onHover: (evt, elements) => {
        evt.native.target.style.cursor = elements.length
          ? 'pointer'
          : 'default';
      },
    },
  });
}

// Constrói a legenda em grid (HTML), clicável para abrir o detalhamento da categoria
function renderizarLegendaPizza(labels, cores, data, totalGastos) {
  DOM.legendaPizza.innerHTML = '';

  if (labels.length === 0) {
    DOM.legendaPizza.innerHTML = `<p class="limite-vazio">Adicione gastos para ver a distribuição.</p>`;
    return;
  }

  labels.forEach((categoria, i) => {
    const valor = data[i];
    const percentual =
      totalGastos > 0 ? ((valor / totalGastos) * 100).toFixed(0) : 0;

    const item = document.createElement('div');
    item.className = 'legenda-item';
    item.innerHTML = `
      <span class="legenda-swatch" style="background-color: ${cores[i]};"></span>
      <span class="legenda-texto">${escapeHTML(categoria)}</span>
      <span class="legenda-valor">${percentual}%</span>
    `;
    item.addEventListener('click', () => abrirModalCategoria(categoria));
    DOM.legendaPizza.appendChild(item);
  });
}

export function renderizarGraficoLinha() {
  const ctx = DOM.canvasLinha.getContext('2d');

  const labels = estado.historico.map((h) => h.mes);
  // h.rendaTotal é o campo novo (salário + ganhos extras); h.salario cobre
  // meses fechados antes dessa mudança, que só guardavam o salário puro.
  const dadosRenda = estado.historico.map((h) =>
    h.rendaTotal !== undefined ? h.rendaTotal : h.salario,
  );
  const dadosGastos = estado.historico.map((h) => h.totalGastos);

  const chartData = {
    labels: labels.length ? labels : ['Mês Atual (Pendente)'],
    datasets: [
      {
        label: 'Renda Total',
        data: labels.length ? dadosRenda : [calcularTotais(estado).rendaTotal],
        backgroundColor: '#0f766e',
        borderRadius: 4,
      },
      {
        label: 'Gastos Totais',
        data: labels.length
          ? dadosGastos
          : [calcularTotais(estado).totalGastos],
        backgroundColor: '#e11d48',
        borderRadius: 4,
      },
    ],
  };

  if (lineChartInstance) {
    lineChartInstance.data.labels = chartData.labels;
    lineChartInstance.data.datasets = chartData.datasets;
    lineChartInstance.update();
    return;
  }

  lineChartInstance = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: corTextoGrafico(),
            boxWidth: 12,
            font: { size: 11 },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: corTextoGrafico(), font: { size: 11 } },
          grid: { display: false },
        },
        y: {
          ticks: { color: corTextoGrafico(), font: { size: 11 } },
          grid: { color: corGradeGrafico() },
        },
      },
    },
  });
}

/**
 * Gráfico de linhas: quanto foi guardado por mês (linha cheia) vs. o
 * valor ajustado (linha tracejada), que é penalizado nos meses em que o
 * Saldo Livre p/ Gastar ficou negativo. A ideia é dar um retrato visual
 * de "estou realmente evoluindo financeiramente, ou só empurrando o
 * problema pra depois?" — guardar dinheiro estando no vermelho não deveria
 * parecer progresso.
 */
export function renderizarGraficoGuardado() {
  const ctx = DOM.canvasGuardado.getContext('2d');

  // Meses já fechados no histórico, ordenados cronologicamente
  const mesesFechados = [...estado.historico].sort(
    (a, b) => parseMesChave(a.mes).ordem - parseMesChave(b.mes).ordem,
  );

  const pontos = mesesFechados.map((h) => {
    const { mesIndex, ano } = parseMesChave(h.mes);
    const rendaDoMes = h.rendaTotal !== undefined ? h.rendaTotal : h.salario;
    const { movimentoMes, guardadoAjustado } = calcularGuardadoAjustado(
      estado.poupanca,
      mesIndex,
      ano,
      rendaDoMes,
      h.totalGastos,
    );
    return { label: h.mes, bruto: movimentoMes, ajustado: guardadoAjustado };
  });

  // Acrescenta o mês corrente (ainda não fechado) como último ponto,
  // usando os totais ao vivo — mesma lógica usada no card de Resumo
  const agora = new Date();
  const { totalGastos, rendaTotal } = calcularTotais(estado);
  const { movimentoMes: brutoAtual, guardadoAjustado: ajustadoAtual } =
    calcularGuardadoAjustado(
      estado.poupanca,
      agora.getMonth(),
      agora.getFullYear(),
      rendaTotal,
      totalGastos,
    );
  pontos.push({
    label: `${agora.getMonth() + 1}/${agora.getFullYear()} (atual)`,
    bruto: brutoAtual,
    ajustado: ajustadoAtual,
  });

  const labels = pontos.map((p) => p.label);
  const dadosBrutos = pontos.map((p) => p.bruto);
  const dadosAjustados = pontos.map((p) => p.ajustado);

  const larguraMinima = Math.max(320, labels.length * 110);
  DOM.canvasGuardado.closest('.historico-chart-wrap').style.minWidth =
    `${larguraMinima}px`;

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Guardado no mês',
        data: dadosBrutos,
        borderColor: '#0f766e',
        backgroundColor: '#0f766e',
        tension: 0.25,
        borderWidth: 2,
      },
      {
        label: 'Guardado ajustado',
        data: dadosAjustados,
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b',
        borderDash: [6, 4],
        tension: 0.25,
        borderWidth: 2,
      },
    ],
  };

  if (guardadoChartInstance) {
    guardadoChartInstance.data.labels = chartData.labels;
    guardadoChartInstance.data.datasets = chartData.datasets;
    guardadoChartInstance.update();
    return;
  }

  guardadoChartInstance = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: corTextoGrafico(),
            boxWidth: 12,
            font: { size: 11 },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: corTextoGrafico(), font: { size: 11 } },
          grid: { display: false },
        },
        y: {
          ticks: {
            color: corTextoGrafico(),
            font: { size: 11 },
            callback: (value) => formatarMoeda(value),
          },
          grid: { color: corGradeGrafico() },
        },
      },
    },
  });
}

export function atualizarBadgeVariacao(visivel) {
  if (!visivel || estado.historico.length === 0) {
    DOM.carrosselVariacao.classList.add('hidden');
    return;
  }

  const { totalGastos } = calcularTotais(estado);
  const mesAnterior = estado.historico[estado.historico.length - 1];
  const variacao = calcularVariacaoPercentual(
    totalGastos,
    mesAnterior.totalGastos,
  );

  if (variacao === null) {
    DOM.carrosselVariacao.classList.add('hidden');
    return;
  }

  const sinal = variacao > 0 ? '+' : '';
  DOM.carrosselVariacao.textContent = `${sinal}${variacao.toFixed(1)}% vs. mês anterior`;
  DOM.carrosselVariacao.classList.remove(
    'hidden',
    'variacao-positiva',
    'variacao-negativa',
  );
  DOM.carrosselVariacao.classList.add(
    variacao > 0 ? 'variacao-positiva' : 'variacao-negativa',
  );
}

/**
 * Redimensiona só o gráfico do slide indicado. O Chart.js não mede
 * canvas com display:none, então sempre que um slide (ou a seção
 * colapsável que o contém) volta a ficar visível, é preciso forçar esse
 * recálculo — daí esta função ser compartilhada entre carrossel.js
 * (troca de slide) e menu.js (reabrir uma seção colapsada).
 */
export function redimensionarGraficoDoSlide(indiceSlide) {
  if (indiceSlide === 0 && pieChartInstance) pieChartInstance.resize();
  if (indiceSlide === 1 && lineChartInstance) lineChartInstance.resize();
  if (indiceSlide === 2 && guardadoChartInstance)
    guardadoChartInstance.resize();
}

/** Usado por tema.js: destrói as 3 instâncias pra forçar recriação com as cores do novo tema. */
export function destruirGraficosPrincipais() {
  if (pieChartInstance) {
    pieChartInstance.destroy();
    pieChartInstance = null;
  }
  if (lineChartInstance) {
    lineChartInstance.destroy();
    lineChartInstance = null;
  }
  if (guardadoChartInstance) {
    guardadoChartInstance.destroy();
    guardadoChartInstance = null;
  }
}
