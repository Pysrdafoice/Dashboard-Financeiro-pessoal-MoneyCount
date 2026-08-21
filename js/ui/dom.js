// ============================================================================
// SELETORES DOM
// Arquivo: js/ui/dom.js
// Responsabilidade: Todos os seletores DOM (60+ elementos) com IDs validados
// contra o HTML original
// ============================================================================

// ---- Formulário de Salário ----
const inputSalario = document.getElementById('input-salario');

// ---- Formulário de Gastos ----
const formGasto = document.getElementById('form-gasto');
const descGasto = document.getElementById('desc-gasto');
const valorGasto = document.getElementById('valor-gasto');
const catGasto = document.getElementById('cat-gasto');
const tipoGasto = document.getElementById('tipo-gasto');
const parcelasGasto = document.getElementById('parcelas-gasto');

// ---- Formulário de Ganhos ----
const formGanho = document.getElementById('form-ganho');
const descGanho = document.getElementById('desc-ganho');
const valorGanho = document.getElementById('valor-ganho');
const catGanho = document.getElementById('cat-ganho');
const tipoGanho = document.getElementById('tipo-ganho');
const listaGanhos = document.getElementById('lista-ganhos');

// ---- Extrato de Transações ----
const listaTransacoes = document.getElementById('lista-transacoes');

// ---- Banner Emocional (Streak) ----
const streakBadge = document.getElementById('streak-badge');
const streakNumero = document.getElementById('streak-numero');
const fraseEmocional = document.getElementById('frase-emocional');

// ---- Formulário de Poupança ----
const formPoupanca = document.getElementById('form-poupanca');
const tipoPoupanca = document.getElementById('tipo-poupanca');
const valorPoupanca = document.getElementById('valor-poupanca');
const descPoupanca = document.getElementById('desc-poupanca');
const poupancaSaldo = document.getElementById('poupanca-saldo');
const listaPoupanca = document.getElementById('lista-poupanca');

// ---- Card de Resumo (Renda, Gastos, Saldo) ----
const resRenda = document.getElementById('res-renda');
const resGastos = document.getElementById('res-gastos');
const resSaldo = document.getElementById('res-saldo');
const resSaldoLivre = document.getElementById('res-saldo-livre');
const btnFecharMes = document.getElementById('btn-fechar-mes');

// ---- Formulário de Limites por Categoria ----
const formLimite = document.getElementById('form-limite');
const catLimite = document.getElementById('cat-limite');
const valorLimite = document.getElementById('valor-limite');
const listaLimites = document.getElementById('lista-limites');

// ---- Modal de Detalhamento por Categoria ----
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

// ---- Funcionalidades de Exportar/Backup ----
const btnExportarBackup = document.getElementById('btn-exportar-backup');
const btnImportarBackup = document.getElementById('btn-importar-backup');
const inputImportarBackup = document.getElementById('input-importar-backup');
const btnExportarCsv = document.getElementById('btn-exportar-csv');
const backupStatus = document.getElementById('backup-status');

// ---- Tema Claro/Escuro ----
const btnTema = document.getElementById('btn-tema');

// ---- Menu Hambúrguer (Gaveta Lateral) ----
const btnMenu = document.getElementById('btn-menu');
const btnFecharMenu = document.getElementById('btn-fechar-menu');
const menuOverlay = document.getElementById('menu-overlay');

// ---- Carrossel de Gráficos ----
const carrosselPrev = document.getElementById('carrossel-prev');
const carrosselNext = document.getElementById('carrossel-next');
const carrosselDots = document.getElementById('carrossel-dots');
const carrosselTitulo = document.getElementById('carrossel-titulo');
const carrosselVariacao = document.getElementById('carrossel-variacao');
const carrosselSlides = document.querySelectorAll('.carrossel-slide');
const legendaPizza = document.getElementById('legenda-pizza');

// ---- Canvas dos Gráficos (Chart.js) ----
// Seletores acessados via document.getElementById() no código de renderização
const canvasPieChart = () => document.getElementById('pieChart');
const canvasLineChart = () => document.getElementById('lineChart');
const canvasGuardadoChart = () => document.getElementById('guardadoChart');
const canvasDetalheChart = () => document.getElementById('detalheChart');

// ---- Elementos Dinâmicos (selecionados via querySelector) ----
const getCardResumo = () => document.getElementById('card-resumo');
const getResumoItemLivre = () => document.getElementById('resumo-item-livre');
const getResumoDivisorLivre = () =>
  document.getElementById('resumo-divisor-livre');
const getCarrosselViewport = () =>
  document.querySelector('.carrossel-viewport');
const getHistoricoChartWrap = () =>
  document.querySelector('#guardadoChart').closest('.historico-chart-wrap');
