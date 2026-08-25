/**
 * categorias.js — cores e ícones por categoria, compartilhados entre
 * vários domínios (Gastos, Ganhos, Gráficos, Modal de Detalhamento).
 *
 * Existe como módulo próprio porque, sem ele, cada um desses domínios
 * precisaria manter sua própria cópia do mapa de cores — e é exatamente
 * esse tipo de duplicação que causa bug de "mudei a cor aqui mas esqueci
 * de mudar ali".
 */

// Paleta alinhada à identidade visual: verde petróleo, âmbar e tons neutros elegantes
export const CORES_CATEGORIA = {
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

export const COR_PADRAO = '#cbd5e1';

const ICONES_GASTO = {
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

const ICONES_GANHO = {
  Freelance: '💻',
  Vendas: '🛍️',
  'Cashback/Reembolso': '💳',
  Rendimentos: '📈',
  Presente: '🎁',
  Outros: '➕',
};

export function pegarIconeCategoria(categoria) {
  return ICONES_GASTO[categoria] || '🧾';
}

export function pegarIconeCategoriaGanho(categoria) {
  return ICONES_GANHO[categoria] || '💰';
}