/**
 * ui/utils.js — pequenos utilitários compartilhados que tocam o DOM, mas
 * não pertencem a nenhum domínio específico (gastos, ganhos, poupança...).
 *
 * corTextoGrafico()/corGradeGrafico() moraram aqui de propósito, e não em
 * tema.js: graficos.js precisa delas pra saber a cor certa ao desenhar, e
 * tema.js precisa poder recriar os gráficos ao trocar de tema. Se essas
 * duas funções estivessem em tema.js, graficos.js importaria de tema.js
 * E tema.js importaria de graficos.js — uma dependência circular, que ES
 * Modules não resolve de forma segura. Ficando num módulo neutro, os dois
 * lados importam de utils.js sem nenhum dos dois depender do outro.
 */

/** Escapa HTML para evitar XSS ao inserir texto do usuário via innerHTML. */
export function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function corTextoGrafico() {
  return document.body.classList.contains('dark-mode') ? '#f8fafc' : '#0f172a';
}

export function corGradeGrafico() {
  return document.body.classList.contains('dark-mode') ? '#1e293b' : '#e2e8f0';
}