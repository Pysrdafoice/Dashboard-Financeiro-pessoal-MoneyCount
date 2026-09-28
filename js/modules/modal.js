import { estado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import { obterContextoVisivel } from './meses.js';
import { escapeHTML, corTextoGrafico, corGradeGrafico } from '../ui/utils.js';
import { calcularTotais, formatarMoeda } from '../calculos.js';
import { CORES_CATEGORIA, COR_PADRAO } from './categorias.js';

let categoriaAtualModal = null;
let detalheChartInstance = null;

export function obterCategoriaAtualModal() {
  return categoriaAtualModal;
}

export function abrirModalCategoria(categoria) {
  categoriaAtualModal = categoria;

  // O modal detalha o mês em visualização (mesma fonte da pizza que o abriu).
  const contexto = obterContextoVisivel();
  const itensCategoria = contexto.gastos
    .filter((g) => g.categoria === categoria)
    .sort((a, b) => b.valor - a.valor);

  const totalCategoria = itensCategoria.reduce((acc, g) => acc + g.valor, 0);
  const { totalGastos } = calcularTotais(contexto);
  const percentual =
    totalGastos > 0 ? ((totalCategoria / totalGastos) * 100).toFixed(1) : '0.0';

  DOM.modalTitulo.textContent = categoria;
  DOM.modalTotal.textContent = formatarMoeda(totalCategoria);
  DOM.modalPercentual.textContent = `(${percentual}% dos gastos totais)`;

  const limite = estado.limites[categoria];
  if (limite && limite > 0) {
    const percLimite = (totalCategoria / limite) * 100;
    const percLimiteExibido = Math.min(percLimite, 999);

    DOM.modalLimiteWrap.classList.remove('hidden');
    DOM.modalLimiteTexto.textContent = `Limite: ${formatarMoeda(limite)}`;
    DOM.modalLimitePercentual.textContent = `${percLimiteExibido.toFixed(0)}%`;
    DOM.modalLimiteBarra.style.width = `${Math.min(percLimite, 100)}%`;

    DOM.modalLimiteBarra.classList.remove(
      'barra-ok',
      'barra-atencao',
      'barra-estourou',
    );
    if (percLimite >= 100) {
      DOM.modalLimiteBarra.classList.add('barra-estourou');
    } else if (percLimite >= 70) {
      DOM.modalLimiteBarra.classList.add('barra-atencao');
    } else {
      DOM.modalLimiteBarra.classList.add('barra-ok');
    }

    if (percLimite >= 100) {
      DOM.modalLimiteAviso.textContent = `Você ultrapassou o limite em ${formatarMoeda(totalCategoria - limite)}.`;
      DOM.modalLimiteAviso.classList.remove('hidden');
    } else if (percLimite >= 70) {
      DOM.modalLimiteAviso.textContent = `Atenção: você já usou ${percLimite.toFixed(0)}% do limite desta categoria.`;
      DOM.modalLimiteAviso.classList.remove('hidden');
    } else {
      DOM.modalLimiteAviso.classList.add('hidden');
    }
  } else {
    DOM.modalLimiteWrap.classList.add('hidden');
  }

  DOM.modalListaItens.innerHTML = '';
  itensCategoria.forEach((g) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${escapeHTML(g.descricao)}</span><strong>${formatarMoeda(g.valor)}</strong>`;
    DOM.modalListaItens.appendChild(li);
  });

  DOM.modalOverlay.classList.remove('hidden');
  renderizarGraficoDetalhe(itensCategoria, categoria);
}

export function fecharModal() {
  DOM.modalOverlay.classList.add('hidden');
  categoriaAtualModal = null;
}

function renderizarGraficoDetalhe(itens, categoria) {
  const ctx = DOM.canvasDetalhe.getContext('2d');

  const labels = itens.map((g) => g.descricao);
  const data = itens.map((g) => g.valor);
  const cor = CORES_CATEGORIA[categoria] || COR_PADRAO;

  const chartData = {
    labels: labels.length ? labels : ['Sem gastos'],
    datasets: [
      {
        label: 'Valor gasto',
        data: data.length ? data : [0],
        backgroundColor: cor,
      },
    ],
  };

  if (detalheChartInstance) {
    detalheChartInstance.destroy();
  }

  detalheChartInstance = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: {
            color: corTextoGrafico(),
            callback: (value) => formatarMoeda(value),
          },
          grid: { color: corGradeGrafico() },
        },
        y: {
          ticks: { color: corTextoGrafico() },
          grid: { color: corGradeGrafico() },
        },
      },
    },
  });
}

export function destruirGraficoModal() {
  if (detalheChartInstance) {
    detalheChartInstance.destroy();
    detalheChartInstance = null;
  }
}

export function recriarGraficoModalSeAberto() {
  if (!DOM.modalOverlay.classList.contains('hidden') && categoriaAtualModal) {
    const itensCategoria = obterContextoVisivel()
      .gastos.filter((g) => g.categoria === categoriaAtualModal)
      .sort((a, b) => b.valor - a.valor);
    renderizarGraficoDetalhe(itensCategoria, categoriaAtualModal);
  }
}
