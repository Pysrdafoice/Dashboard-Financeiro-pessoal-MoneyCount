// ============================================================================
// PERSISTÊNCIA DE DADOS
// Arquivo: js/persistencia.js
// Responsabilidade: Único lugar que toca localStorage (salvar/carregar estado)
// ============================================================================

/**
 * Salva o estado atual no localStorage.
 * Trata erros de quota ou permissões gracefully.
 */
function salvarDados() {
  try {
    localStorage.setItem('orcamento_estado', JSON.stringify(estado));
  } catch (e) {
    console.error('Não foi possível salvar os dados no localStorage.', e);
  }
}

/**
 * Carrega os dados do localStorage e popula o estado global.
 * Se os dados estiverem corrompidos, inicia com um estado vazio e registra o erro.
 */
function carregarDados() {
  try {
    const salvo = localStorage.getItem('orcamento_estado');
    if (salvo) {
      const parsed = JSON.parse(salvo);
      // Usa substituirEstado() para validação e tipagem adequada
      substituirEstado(parsed);
    }
  } catch (e) {
    console.error('Dados corrompidos no localStorage, iniciando do zero.', e);
    estado = estadoVazio();
  }
}

/**
 * Salva a preferência de tema (claro/escuro) no localStorage.
 */
function salvarTemaPreferencia(tema) {
  try {
    localStorage.setItem('fuelcount_tema', tema);
  } catch (e) {
    console.error('Não foi possível salvar a preferência de tema.', e);
  }
}

/**
 * Carrega a preferência de tema do localStorage.
 * Padrão: 'claro'
 */
function carregarTemaPreferencia() {
  try {
    return localStorage.getItem('fuelcount_tema') || 'claro';
  } catch (e) {
    console.error('Não foi possível ler a preferência de tema.', e);
    return 'claro';
  }
}
