// ============================================================================
// FUNÇÕES UTILITÁRIAS DE UI
// Arquivo: js/ui/utils.js
// Responsabilidade: Funções auxiliares de segurança e renderização de temas
// ============================================================================

/**
 * Escapa HTML para evitar XSS ao inserir texto do usuário via innerHTML.
 * Utiliza a estratégia de criar um elemento temporário e usar textContent.
 * @param {string} str - Texto a ser escapado
 * @returns {string} HTML escapado e seguro
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Retorna a cor de texto dos gráficos conforme o tema atual.
 * - Tema claro: preto/cinza escuro
 * - Tema escuro: branco/cinza claro
 * @returns {string} Cor em formato hex
 */
function corTextoGrafico() {
  return document.body.classList.contains('dark-mode') ? '#f8fafc' : '#0f172a';
}

/**
 * Retorna a cor da grade dos gráficos conforme o tema atual.
 * - Tema claro: cinza bem claro
 * - Tema escuro: cinza escuro
 * @returns {string} Cor em formato hex
 */
function corGradeGrafico() {
  return document.body.classList.contains('dark-mode') ? '#1e293b' : '#e2e8f0';
}

/**
 * Formata um número como moeda brasileira (R$).
 * @param {number} valor - Valor a formatar
 * @returns {string} String formatada como "R$ 1.234,56"
 */
function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
