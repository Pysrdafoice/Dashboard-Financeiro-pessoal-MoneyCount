/**
 * dom.js — único lugar do app que sabe os IDs/seletores do HTML.
 *
 * Toda referência a elemento da tela passa por aqui. Se um ID mudar no
 * index.html, o ajuste é numa linha só deste arquivo — nenhum outro módulo
 * precisa saber ou ser tocado.
 *
 * Importante: como esses `document.getElementById` rodam assim que este
 * módulo é importado, o `<script type="module">` no HTML precisa estar
 * depois do `<body>` (ou o app.js precisa esperar o DOM existir) — módulos
 * já se comportam como `defer` por padrão, então isso funciona colocando
 * a tag de script no fim do <body>, como já é o caso no index.html atual.
 */
export const DOM = {
  // Formulário: Adicionar Gasto
  formGasto: document.getElementById('form-gasto'),
  descGasto: document.getElementById('desc-gasto'),
  valorGasto: document.getElementById('valor-gasto'),
  catGasto: document.getElementById('cat-gasto'),
  tipoGasto: document.getElementById('tipo-gasto'),
  parcelasGasto: document.getElementById('parcelas-gasto'),

  // Formulário: Adicionar Ganho
  formGanho: document.getElementById('form-ganho'),
  descGanho: document.getElementById('desc-ganho'),
  valorGanho: document.getElementById('valor-ganho'),
  catGanho: document.getElementById('cat-ganho'),
  tipoGanho: document.getElementById('tipo-ganho'),

  // Configuração do Mês
  inputSalario: document.getElementById('input-salario'),

  // Resumo Financeiro
  cardResumo: document.getElementById('card-resumo'),
  resRenda: document.getElementById('res-renda'),
  resGastos: document.getElementById('res-gastos'),
  resSaldo: document.getElementById('res-saldo'),
  resSaldoLivre: document.getElementById('res-saldo-livre'),
  resumoItemLivre: document.getElementById('resumo-item-livre'),
  resumoDivisorLivre: document.getElementById('resumo-divisor-livre'),

  // Extratos
  listaTransacoes: document.getElementById('lista-transacoes'),
  listaGanhos: document.getElementById('lista-ganhos'),

  // Limites por Categoria
  formLimite: document.getElementById('form-limite'),
  catLimite: document.getElementById('cat-limite'),
  valorLimite: document.getElementById('valor-limite'),
  listaLimites: document.getElementById('lista-limites'),

  // Poupança / Guardado
  formPoupanca: document.getElementById('form-poupanca'),
  tipoPoupanca: document.getElementById('tipo-poupanca'),
  valorPoupanca: document.getElementById('valor-poupanca'),
  descPoupanca: document.getElementById('desc-poupanca'),
  poupancaSaldo: document.getElementById('poupanca-saldo'),
  listaPoupanca: document.getElementById('lista-poupanca'),

  // Banner Emocional (frase + streak)
  streakBadge: document.getElementById('streak-badge'),
  streakNumero: document.getElementById('streak-numero'),
  fraseEmocional: document.getElementById('frase-emocional'),

  // Botão de Fechar Mês
  btnFecharMes: document.getElementById('btn-fechar-mes'),

  // Tema Claro/Escuro
  btnTema: document.getElementById('btn-tema'),

  // Menu Hambúrguer
  btnMenu: document.getElementById('btn-menu'),
  btnFecharMenu: document.getElementById('btn-fechar-menu'),
  menuOverlay: document.getElementById('menu-overlay'),

  // Exportar / Backup
  btnExportarBackup: document.getElementById('btn-exportar-backup'),
  btnImportarBackup: document.getElementById('btn-importar-backup'),
  inputImportarBackup: document.getElementById('input-importar-backup'),
  btnExportarCsv: document.getElementById('btn-exportar-csv'),
  backupStatus: document.getElementById('backup-status'),

  // Carrossel de Gráficos
  carrosselSlides: document.querySelectorAll('.carrossel-slide'),
  carrosselPrev: document.getElementById('carrossel-prev'),
  carrosselNext: document.getElementById('carrossel-next'),
  carrosselDots: document.getElementById('carrossel-dots'),
  carrosselTitulo: document.getElementById('carrossel-titulo'),
  carrosselVariacao: document.getElementById('carrossel-variacao'),

  // Canvas dos Gráficos (Chart.js)
  canvasPizza: document.getElementById('pieChart'),
  canvasLinha: document.getElementById('lineChart'),
  canvasGuardado: document.getElementById('guardadoChart'),
  canvasDetalhe: document.getElementById('detalheChart'),
  legendaPizza: document.getElementById('legenda-pizza'),

  // Modal de Detalhamento por Categoria
  modalOverlay: document.getElementById('modal-overlay'),
  modalTitulo: document.getElementById('modal-titulo'),
  modalTotal: document.getElementById('modal-total'),
  modalPercentual: document.getElementById('modal-percentual'),
  modalFechar: document.getElementById('modal-fechar'),
  modalListaItens: document.getElementById('modal-lista-itens'),
  modalLimiteWrap: document.getElementById('modal-limite-wrap'),
  modalLimiteTexto: document.getElementById('modal-limite-texto'),
  modalLimitePercentual: document.getElementById('modal-limite-percentual'),
  modalLimiteBarra: document.getElementById('modal-limite-barra'),
  modalLimiteAviso: document.getElementById('modal-limite-aviso'),
};