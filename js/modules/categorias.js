export const CORES_CATEGORIA = {
  Moradia: '#0f766e',
  Alimentação: '#059669',
  Transporte: '#0891b2',
  Lazer: '#f59e0b',
  Saúde: '#e11d48',
  Estética: '#c026d3',
  Assinaturas: '#65a30d',
  Investimentos: '#115e59',
  Educação: '#7c6f95',
  Outros: '#94a3b8',
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
