// Estado da Aplicação
let estado = {
  salario: 0,
  gastos: [],
  historico: [],
  limites: {}, // { 'Categoria': valorLimiteMensal }
  poupanca: [], // [{ id, tipo: 'deposito'|'retirada', valor, descricao, data }]
};

// Mapa de cores fixo por categoria (mantém consistência visual mês a mês)
// Paleta alinhada à identidade visual: verde petróleo, âmbar e tons neutros elegantes
const CORES_CATEGORIA = {
  Moradia: '#0f766e', // Verde petróleo (cor de marca)
  Alimentação: '#059669', // Verde esmeralda
  Transporte: '#0891b2', // Azul petróleo claro
  Lazer: '#f59e0b', // Âmbar (accent)
  Saúde: '#e11d48', // Rosa-vermelho (mesma família do "danger")
  Estética: '#c026d3', // Magenta suave
  Assinaturas: '#65a30d', // Verde oliva
  Investimentos: '#115e59', // Verde petróleo escuro
  Educação: '#7c6f95', // Roxo acinzentado, elegante e discreto
  Outros: '#94a3b8', // Cinza neutro
};
const COR_PADRAO = '#cbd5e1';

// Instâncias dos Gráficos
let pieChartInstance = null;
let lineChartInstance = null;
let detalheChartInstance = null;

// Elementos do DOM
const inputSalario = document.getElementById('input-salario');
const formGasto = document.getElementById('form-gasto');
const descGasto = document.getElementById('desc-gasto');
const valorGasto = document.getElementById('valor-gasto');
const catGasto = document.getElementById('cat-gasto');
const tipoGasto = document.getElementById('tipo-gasto');
const parcelasGasto = document.getElementById('parcelas-gasto');
const listaTransacoes = document.getElementById('lista-transacoes');

// Elementos de Poupança / Guardado
const formPoupanca = document.getElementById('form-poupanca');
const tipoPoupanca = document.getElementById('tipo-poupanca');
const valorPoupanca = document.getElementById('valor-poupanca');
const descPoupanca = document.getElementById('desc-poupanca');
const poupancaSaldo = document.getElementById('poupanca-saldo');
const listaPoupanca = document.getElementById('lista-poupanca');

const resRenda = document.getElementById('res-renda');
const resGastos = document.getElementById('res-gastos');
const resSaldo = document.getElementById('res-saldo');
const btnFecharMes = document.getElementById('btn-fechar-mes');

// Elementos de Limites por Categoria
const formLimite = document.getElementById('form-limite');
const catLimite = document.getElementById('cat-limite');
const valorLimite = document.getElementById('valor-limite');
const listaLimites = document.getElementById('lista-limites');

// Elementos do Modal de Detalhamento
const modalOverlay = document.getElementById('modal-overlay');
const modalTitulo = document.getElementById('modal-titulo');
const modalTotal = document.getElementById('modal-total');
const modalPercentual = document.getElementById('modal-percentual');
const modalFechar = document.getElementById('modal-fechar');
const modalListaItens = document.getElementById('modal-lista-itens');
const modalLimiteWrap = document.getElementById('modal-limite-wrap');
const modalLimiteTexto = document.getElementById('modal-limite-texto');
const modalLimitePercentual = document.getElementById(
  'modal-limite-percentual',
);
const modalLimiteBarra = document.getElementById('modal-limite-barra');
const modalLimiteAviso = document.getElementById('modal-limite-aviso');

// Elementos de Exportar/Backup
const btnExportarBackup = document.getElementById('btn-exportar-backup');
const btnImportarBackup = document.getElementById('btn-importar-backup');
const inputImportarBackup = document.getElementById('input-importar-backup');
const btnExportarCsv = document.getElementById('btn-exportar-csv');
const backupStatus = document.getElementById('backup-status');

// Elemento do botão de tema
const btnTema = document.getElementById('btn-tema');

// Elementos do Menu Hambúrguer (gaveta lateral)
const btnMenu = document.getElementById('btn-menu');
const btnFecharMenu = document.getElementById('btn-fechar-menu');
const menuOverlay = document.getElementById('menu-overlay');

// Elementos do Carrossel de Gráficos
const carrosselPrev = document.getElementById('carrossel-prev');
const carrosselNext = document.getElementById('carrossel-next');
const carrosselDots = document.getElementById('carrossel-dots');
const carrosselTitulo = document.getElementById('carrossel-titulo');
const carrosselVariacao = document.getElementById('carrossel-variacao');
const carrosselSlides = document.querySelectorAll('.carrossel-slide');
const legendaPizza = document.getElementById('legenda-pizza');

const TITULOS_SLIDES = ['Distribuição por Categoria', 'Evolução Histórica'];
let slideAtual = 0;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  aplicarTemaSalvo();
  carregarDados();
  atualizarInterface();
  inicializarCarrossel();

  btnTema.addEventListener('click', alternarTema);

  inputSalario.addEventListener('input', (e) => {
    const valor = parseFloat(e.target.value);
    estado.salario = !isNaN(valor) && valor >= 0 ? valor : 0;
    salvarDados();
    atualizarInterface();
  });

  formGasto.addEventListener('submit', (e) => {
    e.preventDefault();
    adicionarGasto();
  });

  formPoupanca.addEventListener('submit', (e) => {
    e.preventDefault();
    registrarMovimentoPoupanca();
  });

  tipoGasto.addEventListener('change', () => {
    // A visibilidade é o único controle necessário aqui — a validação de
    // preenchimento já é feita manualmente dentro de adicionarGasto().
    // Propositalmente NÃO usamos o atributo `required` nativo neste campo:
    // como ele fica escondido (display:none) quando o tipo não é "parcelado",
    // o HTML5 tentaria focar um campo invisível ao validar o formulário,
    // o que o navegador recusa e gera o erro
    // "An invalid form control with name='' is not focusable.".
    parcelasGasto.classList.toggle('hidden', tipoGasto.value !== 'parcelado');
  });

  btnFecharMes.addEventListener('click', fecharMes);

  formLimite.addEventListener('submit', (e) => {
    e.preventDefault();
    definirLimite();
  });

  modalFechar.addEventListener('click', fecharModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) fecharModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharModal();
      fecharMenu();
    }
  });

  btnExportarBackup.addEventListener('click', exportarBackup);
  btnImportarBackup.addEventListener('click', () => inputImportarBackup.click());
  inputImportarBackup.addEventListener('change', importarBackup);
  btnExportarCsv.addEventListener('click', exportarCsv);

  btnMenu.addEventListener('click', abrirMenu);
  btnFecharMenu.addEventListener('click', fecharMenu);
  menuOverlay.addEventListener('click', (e) => {
    if (e.target === menuOverlay) fecharMenu();
  });

  inicializarSecoesColapsaveis();
});

// ---- Menu Hambúrguer (gaveta lateral) ----
function abrirMenu() {
  menuOverlay.classList.remove('hidden');
}

function fecharMenu() {
  menuOverlay.classList.add('hidden');
}

// ---- Seções Recolhíveis (Configuração, Extrato, Gráficos) ----
function inicializarSecoesColapsaveis() {
  document.querySelectorAll('.colapsavel').forEach((secao) => {
    const botao = secao.querySelector('.btn-colapsar');
    if (!botao) return;
    botao.addEventListener('click', () => {
      const colapsado = secao.classList.toggle('colapsado');
      botao.setAttribute('aria-expanded', String(!colapsado));

      // Ao reabrir a seção do carrossel, o Chart.js precisa recalcular o
      // tamanho do canvas visível (mesma lógica usada na troca de slides)
      if (!colapsado && secao.classList.contains('carrossel-card')) {
        requestAnimationFrame(() => {
          if (slideAtual === 0 && pieChartInstance) pieChartInstance.resize();
          if (slideAtual === 1 && lineChartInstance) lineChartInstance.resize();
        });
      }
    });
  });
}

// Funções de Lógica e Manipulação de Dados
function adicionarGasto() {
  const valor = parseFloat(valorGasto.value);
  const descricao = descGasto.value.trim();
  const tipo = tipoGasto.value; // 'pontual' | 'fixo' | 'parcelado'

  if (!descricao) {
    alert('Digite uma descrição para o gasto.');
    return;
  }
  if (isNaN(valor) || valor <= 0) {
    alert('Digite um valor válido, maior que zero.');
    return;
  }
  if (!catGasto.value) {
    alert('Selecione uma categoria.');
    return;
  }

  const novoGasto = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    descricao: descricao,
    categoria: catGasto.value,
    valor: valor,
    tipo: tipo,
  };

  // Gastos parcelados carregam quantas parcelas ainda restam (incluindo a atual).
  // Esse contador é decrementado a cada "Fechar Mês" até chegar a zero.
  if (tipo === 'parcelado') {
    const parcelas = parseInt(parcelasGasto.value, 10);
    if (isNaN(parcelas) || parcelas < 2) {
      alert('Informe o número total de parcelas (mínimo 2).');
      return;
    }
    novoGasto.parcelasRestantes = parcelas;
    novoGasto.parcelasTotal = parcelas;
  }

  estado.gastos.push(novoGasto);
  salvarDados();
  atualizarInterface();
  formGasto.reset();
  parcelasGasto.classList.add('hidden');
}

function removerGasto(id) {
  estado.gastos = estado.gastos.filter((g) => g.id !== id);
  salvarDados();
  atualizarInterface();

  // Se o modal de detalhamento estiver aberto, atualiza ou fecha se a categoria ficou vazia
  if (!modalOverlay.classList.contains('hidden') && categoriaAtualModal) {
    const restantes = estado.gastos.filter(
      (g) => g.categoria === categoriaAtualModal,
    );
    if (restantes.length === 0) {
      fecharModal();
    } else {
      abrirModalCategoria(categoriaAtualModal);
    }
  }
}

function calcularTotais() {
  const totalGastos = estado.gastos.reduce((acc, curr) => acc + curr.valor, 0);
  const saldoRestante = estado.salario - totalGastos;
  return { totalGastos, saldoRestante };
}

function atualizarInterface() {
  inputSalario.value = estado.salario ? estado.salario : '';
  const { totalGastos, saldoRestante } = calcularTotais();

  resRenda.textContent = formatarMoeda(estado.salario);
  resGastos.textContent = formatarMoeda(totalGastos);
  resSaldo.textContent = formatarMoeda(saldoRestante);

  resSaldo.className = saldoRestante >= 0 ? 'text-success' : 'text-danger';

  const cardSaldo = resSaldo.closest('.resumo-card');
  if (cardSaldo) {
    cardSaldo.classList.toggle('card-alerta', saldoRestante < 0);
  }

  renderizarExtrato();
  renderizarGraficoPizza();
  renderizarGraficoLinha();
  renderizarListaLimites();
  renderizarPoupanca();
}

// ---- Limites por Categoria ----

function definirLimite() {
  const categoria = catLimite.value;
  const valor = parseFloat(valorLimite.value);

  if (!categoria) {
    alert('Selecione uma categoria.');
    return;
  }
  if (isNaN(valor) || valor <= 0) {
    alert('Digite um limite válido, maior que zero.');
    return;
  }

  estado.limites[categoria] = valor;
  salvarDados();
  renderizarListaLimites();
  formLimite.reset();
}

function removerLimite(categoria) {
  delete estado.limites[categoria];
  salvarDados();
  renderizarListaLimites();

  // Atualiza o modal se estiver aberto na mesma categoria
  if (categoriaAtualModal === categoria) {
    abrirModalCategoria(categoria);
  }
}

function renderizarListaLimites() {
  listaLimites.innerHTML = '';

  const categorias = Object.keys(estado.limites);
  if (categorias.length === 0) {
    listaLimites.innerHTML = `<li class="limite-vazio">Nenhum limite definido ainda.</li>`;
    return;
  }

  categorias.forEach((categoria) => {
    const limite = estado.limites[categoria];
    const gastoAtual = estado.gastos
      .filter((g) => g.categoria === categoria)
      .reduce((acc, g) => acc + g.valor, 0);
    const percentual = Math.min((gastoAtual / limite) * 100, 999);

    const percClasse =
      percentual >= 100
        ? 'limite-estourou'
        : percentual >= 70
          ? 'limite-atencao'
          : '';

    const li = document.createElement('li');
    li.className = `item-limite ${percClasse}`.trim();
    li.innerHTML = `
            <span class="item-limite-nome">${escapeHTML(categoria)}</span>
            <span class="item-limite-valores">${formatarMoeda(gastoAtual)} / ${formatarMoeda(limite)}</span>
            <button class="btn-remover-limite" title="Remover limite" aria-label="Remover limite de ${escapeHTML(categoria)}">&times;</button>
        `;
    li.querySelector('.btn-remover-limite').addEventListener('click', () =>
      removerLimite(categoria),
    );
    listaLimites.appendChild(li);
  });
}

// ---- Poupança / Guardado (valor controlado manualmente pelo usuário) ----

function calcularSaldoPoupanca() {
  return estado.poupanca.reduce((acc, mov) => {
    return mov.tipo === 'retirada' ? acc - mov.valor : acc + mov.valor;
  }, 0);
}

function registrarMovimentoPoupanca() {
  const tipo = tipoPoupanca.value; // 'deposito' | 'retirada'
  const valor = parseFloat(valorPoupanca.value);
  const descricao = descPoupanca.value.trim();

  if (isNaN(valor) || valor <= 0) {
    alert('Digite um valor válido, maior que zero.');
    return;
  }

  // Evita que uma retirada deixe o saldo guardado negativo
  if (tipo === 'retirada' && valor > calcularSaldoPoupanca()) {
    alert('Você não pode retirar mais do que tem guardado.');
    return;
  }

  estado.poupanca.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    tipo: tipo,
    valor: valor,
    descricao: descricao || (tipo === 'deposito' ? 'Depósito' : 'Retirada'),
    data: new Date().toISOString(),
  });

  salvarDados();
  renderizarPoupanca();
  formPoupanca.reset();
}

function removerMovimentoPoupanca(id) {
  estado.poupanca = estado.poupanca.filter((mov) => mov.id !== id);
  salvarDados();
  renderizarPoupanca();
}

function renderizarPoupanca() {
  poupancaSaldo.textContent = formatarMoeda(calcularSaldoPoupanca());

  listaPoupanca.innerHTML = '';

  if (estado.poupanca.length === 0) {
    listaPoupanca.innerHTML = `<li class="poupanca-vazio">Nenhum movimento registrado ainda.</li>`;
    return;
  }

  // Mais recentes primeiro
  [...estado.poupanca].reverse().forEach((mov) => {
    const ehDeposito = mov.tipo === 'deposito';
    const icone = ehDeposito ? '⬆️' : '⬇️';
    const sinal = ehDeposito ? '+' : '−';

    const li = document.createElement('li');
    li.className = `poupanca-item ${mov.tipo}`;
    li.innerHTML = `
      <div class="poupanca-item-icone">${icone}</div>
      <span class="poupanca-item-info">${escapeHTML(mov.descricao)}</span>
      <span class="poupanca-item-valor">${sinal} ${formatarMoeda(mov.valor)}</span>
      <button class="btn-remover-poupanca" title="Remover" aria-label="Remover movimento ${escapeHTML(mov.descricao)}">&times;</button>
    `;
    li.querySelector('.btn-remover-poupanca').addEventListener('click', () =>
      removerMovimentoPoupanca(mov.id),
    );
    listaPoupanca.appendChild(li);
  });
}

// Escapa HTML para evitar XSS ao inserir texto do usuário via innerHTML
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderizarExtrato() {
  listaTransacoes.innerHTML = '';

  if (estado.gastos.length === 0) {
    listaTransacoes.innerHTML = `
      <div class="transacao-vazio">Nenhum gasto cadastrado.</div>
    `;
    return;
  }

  estado.gastos.forEach((gasto) => {
    const card = document.createElement('article');
    const icone = pegarIconeCategoria(gasto.categoria);
    const selo = pegarSeloTipoGasto(gasto);
    card.className = 'transacao-card';
    card.innerHTML = `
      <div class="transacao-card__icon" aria-hidden="true">${icone}</div>
      <div class="transacao-card__info">
        <strong>${escapeHTML(gasto.descricao)}${selo}</strong>
        <span>${escapeHTML(gasto.categoria)}</span>
      </div>
      <div class="transacao-card__valor">
        <strong>${formatarMoeda(gasto.valor)}</strong>
        <button class="btn-secondary btn-remover-transacao" title="Excluir gasto" aria-label="Excluir gasto de ${escapeHTML(gasto.descricao)}">Excluir</button>
      </div>
    `;

    card.querySelector('.btn-remover-transacao').addEventListener('click', () => {
      removerGasto(gasto.id);
    });

    listaTransacoes.appendChild(card);
  });
}

function pegarIconeCategoria(categoria) {
  const icones = {
    Moradia: '🏠',
    Alimentação: '🛒',
    Transporte: '🚗',
    Lazer: '🎉',
    Saúde: '🩺',
    Estética: '✨',
    Assinaturas: '📺',
    Investimentos: '📈',
    Educação: '🎓',
    Outros: '💼',
  };

  return icones[categoria] || '🧾';
}

// Selo visual ao lado da descrição: indica gastos Fixos ou Parcelados
// (gastos Pontuais não recebem selo, pois são o comportamento padrão)
function pegarSeloTipoGasto(gasto) {
  if (gasto.tipo === 'fixo') {
    return ' <span class="selo-tipo selo-fixo">Fixo</span>';
  }
  if (gasto.tipo === 'parcelado') {
    return ` <span class="selo-tipo selo-parcelado">${gasto.parcelasRestantes}/${gasto.parcelasTotal}</span>`;
  }
  return '';
}

// Renderização de Gráficos com Chart.js
function renderizarGraficoPizza() {
  const ctx = document.getElementById('pieChart').getContext('2d');

  const categorias = {};
  estado.gastos.forEach((g) => {
    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.valor;
  });

  const labels = Object.keys(categorias);
  const data = Object.values(categorias);
  const { totalGastos } = calcularTotais();

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
      ctx.fillText(formatarMoeda(calcularTotais().totalGastos), centroX, centroY - 5);

      ctx.font = '400 11px Inter, sans-serif';
      ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#94a3b8' : '#64748b';
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
  legendaPizza.innerHTML = '';

  if (labels.length === 0) {
    legendaPizza.innerHTML = `<p class="limite-vazio">Adicione gastos para ver a distribuição.</p>`;
    return;
  }

  labels.forEach((categoria, i) => {
    const valor = data[i];
    const percentual = totalGastos > 0 ? ((valor / totalGastos) * 100).toFixed(0) : 0;

    const item = document.createElement('div');
    item.className = 'legenda-item';
    item.innerHTML = `
      <span class="legenda-swatch" style="background-color: ${cores[i]};"></span>
      <span class="legenda-texto">${escapeHTML(categoria)}</span>
      <span class="legenda-valor">${percentual}%</span>
    `;
    item.addEventListener('click', () => abrirModalCategoria(categoria));
    legendaPizza.appendChild(item);
  });
}

function renderizarGraficoLinha() {
  const ctx = document.getElementById('lineChart').getContext('2d');

  const labels = estado.historico.map((h) => h.mes);
  const dadosSalario = estado.historico.map((h) => h.salario);
  const dadosGastos = estado.historico.map((h) => h.totalGastos);

  const chartData = {
    labels: labels.length ? labels : ['Mês Atual (Pendente)'],
    datasets: [
      {
        label: 'Orçamento/Salário',
        data: labels.length ? dadosSalario : [estado.salario],
        backgroundColor: '#0f766e',
        borderRadius: 4,
      },
      {
        label: 'Gastos Totais',
        data: labels.length ? dadosGastos : [calcularTotais().totalGastos],
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
          labels: { color: corTextoGrafico(), boxWidth: 12, font: { size: 11 } },
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

// ---- Drill-down por Categoria (Modal) ----

let categoriaAtualModal = null;

function abrirModalCategoria(categoria) {
  categoriaAtualModal = categoria;

  const itensCategoria = estado.gastos
    .filter((g) => g.categoria === categoria)
    .sort((a, b) => b.valor - a.valor);

  const totalCategoria = itensCategoria.reduce((acc, g) => acc + g.valor, 0);
  const { totalGastos } = calcularTotais();
  const percentual =
    totalGastos > 0 ? ((totalCategoria / totalGastos) * 100).toFixed(1) : '0.0';

  modalTitulo.textContent = categoria;
  modalTotal.textContent = formatarMoeda(totalCategoria);
  modalPercentual.textContent = `(${percentual}% dos gastos totais)`;

  // Barra de progresso do limite (se houver limite definido para a categoria)
  const limite = estado.limites[categoria];
  if (limite && limite > 0) {
    const percLimite = (totalCategoria / limite) * 100;
    const percLimiteExibido = Math.min(percLimite, 999);

    modalLimiteWrap.classList.remove('hidden');
    modalLimiteTexto.textContent = `Limite: ${formatarMoeda(limite)}`;
    modalLimitePercentual.textContent = `${percLimiteExibido.toFixed(0)}%`;
    modalLimiteBarra.style.width = `${Math.min(percLimite, 100)}%`;

    // Cores: verde até 70%, amarelo até 100%, vermelho acima de 100%
    modalLimiteBarra.classList.remove(
      'barra-ok',
      'barra-atencao',
      'barra-estourou',
    );
    if (percLimite >= 100) {
      modalLimiteBarra.classList.add('barra-estourou');
    } else if (percLimite >= 70) {
      modalLimiteBarra.classList.add('barra-atencao');
    } else {
      modalLimiteBarra.classList.add('barra-ok');
    }

    if (percLimite >= 100) {
      modalLimiteAviso.textContent = `Você ultrapassou o limite em ${formatarMoeda(totalCategoria - limite)}.`;
      modalLimiteAviso.classList.remove('hidden');
    } else if (percLimite >= 70) {
      modalLimiteAviso.textContent = `Atenção: você já usou ${percLimite.toFixed(0)}% do limite desta categoria.`;
      modalLimiteAviso.classList.remove('hidden');
    } else {
      modalLimiteAviso.classList.add('hidden');
    }
  } else {
    modalLimiteWrap.classList.add('hidden');
  }

  // Lista de itens da categoria
  modalListaItens.innerHTML = '';
  itensCategoria.forEach((g) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${escapeHTML(g.descricao)}</span><strong>${formatarMoeda(g.valor)}</strong>`;
    modalListaItens.appendChild(li);
  });

  // Importante: o overlay precisa ficar visível ANTES de criar o gráfico.
  // Criar um gráfico do Chart.js num canvas ainda com display:none faz o
  // cálculo de tamanho vir como 0x0 (mesma causa-raiz do bug no carrossel).
  modalOverlay.classList.remove('hidden');
  renderizarGraficoDetalhe(itensCategoria, categoria);
}

function fecharModal() {
  modalOverlay.classList.add('hidden');
  categoriaAtualModal = null;
}

function renderizarGraficoDetalhe(itens, categoria) {
  const ctx = document.getElementById('detalheChart').getContext('2d');

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

function fecharMes() {
  const { totalGastos } = calcularTotais();
  const dataAtual = new Date();
  const nomeMes = `${dataAtual.getMonth() + 1}/${dataAtual.getFullYear()}`;

  // 1. Salva o mês encerrado no histórico (substitui se já existir um
  //    registro com o mesmo nome de mês, evitando duplicatas)
  estado.historico = estado.historico.filter((h) => h.mes !== nomeMes);
  estado.historico.push({
    mes: nomeMes,
    salario: estado.salario,
    totalGastos: totalGastos,
  });

  // 2. Monta a lista de gastos do NOVO mês:
  //    - Pontuais: descartados (é exatamente o que os torna "pontuais")
  //    - Fixos: mantidos como estão, repetem todo mês indefinidamente
  //    - Parcelados: mantidos com uma parcela a menos; somem quando zeram
  const novosGastos = [];

  estado.gastos.forEach((gasto) => {
    if (gasto.tipo === 'fixo') {
      novosGastos.push({ ...gasto });
      return;
    }

    if (gasto.tipo === 'parcelado') {
      const parcelasRestantes = (gasto.parcelasRestantes || 1) - 1;
      if (parcelasRestantes > 0) {
        novosGastos.push({ ...gasto, parcelasRestantes });
      }
      // Se chegou a 0, a parcela foi paga por completo e não volta pro próximo mês
      return;
    }

    // tipo === 'pontual' (ou ausente, por retrocompatibilidade): não retorna
  });

  estado.gastos = novosGastos;

  salvarDados();
  atualizarInterface();
  alert('Mês fechado! Gastos fixos e parcelas ativas já estão prontos para o novo mês.');
}

// Persistência local (LocalStorage) com tratamento de erro
function salvarDados() {
  try {
    localStorage.setItem('orcamento_estado', JSON.stringify(estado));
  } catch (e) {
    console.error('Não foi possível salvar os dados no localStorage.', e);
  }
}

function carregarDados() {
  try {
    const salvo = localStorage.getItem('orcamento_estado');
    if (salvo) {
      const parsed = JSON.parse(salvo);
      estado = {
        salario: typeof parsed.salario === 'number' ? parsed.salario : 0,
        gastos: Array.isArray(parsed.gastos) ? parsed.gastos : [],
        historico: Array.isArray(parsed.historico) ? parsed.historico : [],
        limites:
          parsed.limites && typeof parsed.limites === 'object'
            ? parsed.limites
            : {},
        poupanca: Array.isArray(parsed.poupanca) ? parsed.poupanca : [],
      };
    }
  } catch (e) {
    console.error('Dados corrompidos no localStorage, iniciando do zero.', e);
    estado = { salario: 0, gastos: [], historico: [], limites: {}, poupanca: [] };
  }
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---- Exportar / Backup de Dados ----

function mostrarStatusBackup(mensagem, ehErro = false) {
  backupStatus.textContent = mensagem;
  backupStatus.classList.remove('hidden', 'erro');
  if (ehErro) backupStatus.classList.add('erro');

  // Some sozinho depois de alguns segundos, sem precisar de clique
  clearTimeout(mostrarStatusBackup._timer);
  mostrarStatusBackup._timer = setTimeout(() => {
    backupStatus.classList.add('hidden');
  }, 5000);
}

function baixarArquivo(conteudo, nomeArquivo, tipoMime) {
  const blob = new Blob([conteudo], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportarBackup() {
  try {
    const dataAtual = new Date().toISOString().slice(0, 10);
    const conteudo = JSON.stringify(estado, null, 2);
    baixarArquivo(conteudo, `fuelcount-backup-${dataAtual}.json`, 'application/json');
    mostrarStatusBackup('Backup exportado com sucesso!');
  } catch (e) {
    console.error('Erro ao exportar backup.', e);
    mostrarStatusBackup('Não foi possível gerar o backup.', true);
  }
}

function importarBackup(e) {
  const arquivo = e.target.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();
  leitor.onload = (evento) => {
    try {
      const dados = JSON.parse(evento.target.result);

      // Validação básica da estrutura antes de sobrescrever os dados atuais
      const valido =
        dados &&
        typeof dados === 'object' &&
        (dados.salario === undefined || typeof dados.salario === 'number') &&
        (dados.gastos === undefined || Array.isArray(dados.gastos)) &&
        (dados.historico === undefined || Array.isArray(dados.historico));

      if (!valido) {
        mostrarStatusBackup('Arquivo inválido: não parece ser um backup do FuelCount.', true);
        return;
      }

      const confirmar = confirm(
        'Isso vai substituir todos os dados atuais pelo conteúdo do backup. Deseja continuar?',
      );
      if (!confirmar) return;

      estado = {
        salario: typeof dados.salario === 'number' ? dados.salario : 0,
        gastos: Array.isArray(dados.gastos) ? dados.gastos : [],
        historico: Array.isArray(dados.historico) ? dados.historico : [],
        limites: dados.limites && typeof dados.limites === 'object' ? dados.limites : {},
        poupanca: Array.isArray(dados.poupanca) ? dados.poupanca : [],
      };

      salvarDados();
      atualizarInterface();
      mostrarStatusBackup('Backup restaurado com sucesso!');
    } catch (err) {
      console.error('Erro ao importar backup.', err);
      mostrarStatusBackup('Não foi possível ler esse arquivo. Verifique se é um JSON válido.', true);
    } finally {
      inputImportarBackup.value = ''; // permite selecionar o mesmo arquivo de novo, se precisar
    }
  };
  leitor.readAsText(arquivo);
}

function exportarCsv() {
  if (estado.gastos.length === 0) {
    mostrarStatusBackup('Não há gastos para exportar.', true);
    return;
  }

  // Escapa campos que contenham vírgula, aspas ou quebra de linha, seguindo o padrão CSV
  const escapeCsv = (valor) => {
    const texto = String(valor);
    if (/[",\n]/.test(texto)) {
      return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
  };

  const cabecalho = ['Descrição', 'Categoria', 'Valor (R$)'];
  const linhas = estado.gastos.map((g) => [
    escapeCsv(g.descricao),
    escapeCsv(g.categoria),
    g.valor.toFixed(2).replace('.', ','),
  ]);

  // BOM (\uFEFF) garante acentuação correta ao abrir no Excel
  const conteudoCsv =
    '\uFEFF' + [cabecalho, ...linhas].map((linha) => linha.join(';')).join('\n');

  const dataAtual = new Date().toISOString().slice(0, 10);
  baixarArquivo(conteudoCsv, `fuelcount-extrato-${dataAtual}.csv`, 'text/csv;charset=utf-8;');
  mostrarStatusBackup('Extrato exportado em CSV!');
}

// ---- Carrossel de Gráficos (Pizza/Doughnut / Histórico) ----
function inicializarCarrossel() {
  TITULOS_SLIDES.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carrossel-dot' + (i === 0 ? ' ativo' : '');
    dot.setAttribute('aria-label', `Ir para gráfico ${i + 1}`);
    dot.addEventListener('click', () => irParaSlide(i));
    carrosselDots.appendChild(dot);
  });

  carrosselPrev.addEventListener('click', () => irParaSlide(slideAtual - 1));
  carrosselNext.addEventListener('click', () => irParaSlide(slideAtual + 1));

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

function irParaSlide(indice) {
  const total = TITULOS_SLIDES.length;
  slideAtual = (indice + total) % total; // navegação circular

  carrosselSlides.forEach((slide, i) => {
    slide.classList.toggle('ativo', i === slideAtual);
  });
  carrosselTitulo.textContent = TITULOS_SLIDES[slideAtual];
  [...carrosselDots.children].forEach((dot, i) => {
    dot.classList.toggle('ativo', i === slideAtual);
  });

  const ehSlideHistorico = slideAtual === 1;

  // Requisito: o botão de minimizar não deve existir para a Evolução
  // Histórica. Como Pizza e Histórico dividem o mesmo card (carrossel),
  // a seta é escondida somente enquanto o slide de Histórico está ativo,
  // e volta a aparecer normalmente no slide de Distribuição.
  const btnColapsarCarrossel = document.querySelector('.carrossel-card .btn-colapsar');
  if (btnColapsarCarrossel) {
    btnColapsarCarrossel.classList.toggle('hidden', ehSlideHistorico);
  }

  atualizarBadgeVariacao(ehSlideHistorico);

  // Passo crucial: o Chart.js não mede canvas com display:none. Ao tornar
  // o slide visível de novo, é preciso forçar o recálculo do tamanho —
  // essa é a causa-raiz do bug de gráfico "quebrado" no carrossel antigo.
  requestAnimationFrame(() => {
    if (slideAtual === 0 && pieChartInstance) pieChartInstance.resize();
    if (slideAtual === 1 && lineChartInstance) lineChartInstance.resize();
  });
}

// ---- Evolução Histórica: variação percentual vs. mês anterior ----

/**
 * Calcula a variação percentual entre o valor atual e o valor anterior.
 * Regra de negócio: se não houver valor anterior para comparar (undefined,
 * null ou 0 — divisão por zero não faz sentido aqui), retorna null.
 * @returns {number|null} variação em pontos percentuais, ou null se não houver base de comparação
 */
function calcularVariacaoPercentual(atual, anterior) {
  if (anterior === undefined || anterior === null || anterior === 0) {
    return null;
  }
  return ((atual - anterior) / anterior) * 100;
}

function atualizarBadgeVariacao(visivel) {
  if (!visivel || estado.historico.length === 0) {
    carrosselVariacao.classList.add('hidden');
    return;
  }

  const { totalGastos } = calcularTotais();
  const mesAnterior = estado.historico[estado.historico.length - 1];
  const variacao = calcularVariacaoPercentual(totalGastos, mesAnterior.totalGastos);

  if (variacao === null) {
    carrosselVariacao.classList.add('hidden');
    return;
  }

  const sinal = variacao > 0 ? '+' : '';
  carrosselVariacao.textContent = `${sinal}${variacao.toFixed(1)}% vs. mês anterior`;
  carrosselVariacao.classList.remove('hidden', 'variacao-positiva', 'variacao-negativa');
  carrosselVariacao.classList.add(variacao > 0 ? 'variacao-positiva' : 'variacao-negativa');
}

// ---- Tema Claro/Escuro ----

function aplicarTemaSalvo() {
  let tema = 'claro';
  try {
    tema = localStorage.getItem('fuelcount_tema') || 'claro';
  } catch (e) {
    console.error('Não foi possível ler a preferência de tema.', e);
  }
  definirTema(tema);
}

function alternarTema() {
  const temaAtual = document.body.classList.contains('dark-mode')
    ? 'escuro'
    : 'claro';
  const novoTema = temaAtual === 'claro' ? 'escuro' : 'claro';
  definirTema(novoTema);

  try {
    localStorage.setItem('fuelcount_tema', novoTema);
  } catch (e) {
    console.error('Não foi possível salvar a preferência de tema.', e);
  }

  // Recria os gráficos existentes para que texto/legenda usem a cor correta do novo tema
  recriarGraficosComTemaAtual();
}

function definirTema(tema) {
  if (tema === 'escuro') {
    document.body.classList.add('dark-mode');
    btnTema.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-mode');
    btnTema.textContent = '🌙';
  }
}

function corTextoGrafico() {
  return document.body.classList.contains('dark-mode') ? '#f8fafc' : '#0f172a';
}

function corGradeGrafico() {
  return document.body.classList.contains('dark-mode') ? '#1e293b' : '#e2e8f0';
}

function recriarGraficosComTemaAtual() {
  // Destrói as instâncias atuais para forçar recriação com as novas cores de texto/grade
  if (pieChartInstance) {
    pieChartInstance.destroy();
    pieChartInstance = null;
  }
  if (lineChartInstance) {
    lineChartInstance.destroy();
    lineChartInstance = null;
  }
  if (detalheChartInstance) {
    detalheChartInstance.destroy();
    detalheChartInstance = null;
  }

  renderizarGraficoPizza();
  renderizarGraficoLinha();

  // Se o modal de detalhamento estiver aberto, recria o gráfico dele também
  if (!modalOverlay.classList.contains('hidden') && categoriaAtualModal) {
    const itensCategoria = estado.gastos
      .filter((g) => g.categoria === categoriaAtualModal)
      .sort((a, b) => b.valor - a.valor);
    renderizarGraficoDetalhe(itensCategoria, categoriaAtualModal);
  }
}