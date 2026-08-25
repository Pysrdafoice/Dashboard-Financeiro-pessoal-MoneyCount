/**
 * estado.js — a única fonte de verdade do FuelCount.
 *
 * `estado` é um objeto mutável exportado por referência: todo módulo que
 * importar `estado` daqui enxerga sempre a versão mais atual, porque
 * ninguém tem uma cópia — todos apontam pro mesmo objeto na memória.
 *
 * Isso é diferente de exportar uma função `getEstado()`: com objeto
 * mutável, `estado.gastos.push(x)` em qualquer módulo já reflete em todos
 * os outros sem precisar de nenhum mecanismo de sincronização.
 */
export let estado = {
  salario: 0,
  gastos: [],
  ganhos: [], // [{ id, descricao, categoria, valor, tipo: 'pontual'|'fixo' }]
  historico: [],
  limites: {}, // { 'Categoria': valorLimiteMensal }
  poupanca: [], // [{ id, tipo: 'deposito'|'retirada', valor, descricao, data }]
  streak: { dias: 0, melhorStreak: 0, ultimaData: null }, // ultimaData: 'YYYY-MM-DD'
};

/**
 * Substitui o estado inteiro por um novo objeto (usado por carregarDados()
 * e importarBackup(), que precisam trocar tudo de uma vez, não só um campo).
 * Só existe porque `export let` não permite reatribuição de fora do módulo
 * — só o próprio módulo pode fazer `estado = novoValor`.
 */
export function substituirEstado(novoEstado) {
  estado = novoEstado;
}

/**
 * Estado inicial "vazio" — usado tanto como ponto de partida de um app novo
 * quanto como fallback de segurança quando os dados salvos estão corrompidos.
 */
export function estadoVazio() {
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
 * Recebe um objeto qualquer (vindo do localStorage ou de um arquivo de
 * backup importado) e devolve um estado válido, preenchendo com valores
 * padrão qualquer campo ausente ou de tipo errado. Extraída aqui porque
 * carregarDados() e importarBackup() precisavam exatamente da mesma
 * validação — antes essa lógica estava copiada e colada nos dois lugares.
 */
export function normalizarEstado(bruto) {
  const vazio = estadoVazio();
  if (!bruto || typeof bruto !== 'object') return vazio;

  return {
    salario: typeof bruto.salario === 'number' ? bruto.salario : vazio.salario,
    gastos: Array.isArray(bruto.gastos) ? bruto.gastos : vazio.gastos,
    ganhos: Array.isArray(bruto.ganhos) ? bruto.ganhos : vazio.ganhos,
    historico: Array.isArray(bruto.historico) ? bruto.historico : vazio.historico,
    limites: bruto.limites && typeof bruto.limites === 'object' ? bruto.limites : vazio.limites,
    poupanca: Array.isArray(bruto.poupanca) ? bruto.poupanca : vazio.poupanca,
    streak: bruto.streak && typeof bruto.streak === 'object' ? bruto.streak : vazio.streak,
  };
}