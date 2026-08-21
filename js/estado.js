// ============================================================================
// ESTADO DA APLICAÇÃO
// Arquivo: js/estado.js
// Responsabilidade: Objeto estado (fonte única de verdade) + funções de
// transformação do estado
// ============================================================================

/**
 * Objeto estado — fonte única de verdade da aplicação.
 * Mantém sincronizado com localStorage via salvarDados() e carregarDados().
 */
let estado = {
  salario: 0,
  gastos: [],
  ganhos: [], // [{ id, descricao, categoria, valor, tipo: 'pontual'|'fixo' }]
  historico: [],
  limites: {}, // { 'Categoria': valorLimiteMensal }
  poupanca: [], // [{ id, tipo: 'deposito'|'retirada', valor, descricao, data }]
  streak: { dias: 0, melhorStreak: 0, ultimaData: null }, // ultimaData: 'YYYY-MM-DD'
};

/**
 * Estado vazio — retorna um objeto estado limpo (usado em reset).
 */
function estadoVazio() {
  return {
    salario: 0,
    gastos: [],
    ganhos: [],
    historico: [],
    limites: {},
    poupanca: [],
    streak: { dias: 0, melhorStreak: 0, ultimaData: null },
  };
}

/**
 * Substitui o estado global por um novo objeto (normalmente após carregar do localStorage
 * ou restaurar um backup). Valida tipos básicos.
 */
function substituirEstado(novoEstado) {
  if (!novoEstado || typeof novoEstado !== 'object') {
    console.error('Estado inválido fornecido a substituirEstado()');
    return;
  }

  estado = {
    salario: typeof novoEstado.salario === 'number' ? novoEstado.salario : 0,
    gastos: Array.isArray(novoEstado.gastos) ? novoEstado.gastos : [],
    ganhos: Array.isArray(novoEstado.ganhos) ? novoEstado.ganhos : [],
    historico: Array.isArray(novoEstado.historico) ? novoEstado.historico : [],
    limites:
      novoEstado.limites && typeof novoEstado.limites === 'object'
        ? novoEstado.limites
        : {},
    poupanca: Array.isArray(novoEstado.poupanca) ? novoEstado.poupanca : [],
    streak:
      novoEstado.streak && typeof novoEstado.streak === 'object'
        ? novoEstado.streak
        : { dias: 0, melhorStreak: 0, ultimaData: null },
  };
}

/**
 * Normaliza o estado para garantir que todos os campos obrigatórios existam
 * e tenham o tipo correto. Útil após carregar dados potencialmente corrompidos.
 */
function normalizarEstado() {
  if (!estado) {
    estado = estadoVazio();
    return;
  }

  if (typeof estado.salario !== 'number' || state.salario < 0) {
    estado.salario = 0;
  }

  if (!Array.isArray(estado.gastos)) {
    estado.gastos = [];
  }

  if (!Array.isArray(estado.ganhos)) {
    estado.ganhos = [];
  }

  if (!Array.isArray(estado.historico)) {
    estado.historico = [];
  }

  if (!estado.limites || typeof estado.limites !== 'object') {
    estado.limites = {};
  }

  if (!Array.isArray(estado.poupanca)) {
    estado.poupanca = [];
  }

  if (!estado.streak || typeof estado.streak !== 'object') {
    estado.streak = { dias: 0, melhorStreak: 0, ultimaData: null };
  }
}

// ============================================================================
// CORES POR CATEGORIA
// Paleta alinhada à identidade visual: verde petróleo, âmbar e tons neutros elegantes
// ============================================================================

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
