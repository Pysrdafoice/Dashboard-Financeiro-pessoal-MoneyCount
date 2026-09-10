export let estado = {
  salario: 0,
  gastos: [],
  ganhos: [],
  historico: [],
  limites: {},
  poupanca: [],
  streak: { dias: 0, melhorStreak: 0, ultimaData: null },
};

export function substituirEstado(novoEstado) {
  estado = novoEstado;
}

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

export function normalizarEstado(bruto) {
  const vazio = estadoVazio();
  if (!bruto || typeof bruto !== 'object') return vazio;

  return {
    salario: typeof bruto.salario === 'number' ? bruto.salario : vazio.salario,
    gastos: Array.isArray(bruto.gastos) ? bruto.gastos : vazio.gastos,
    ganhos: Array.isArray(bruto.ganhos) ? bruto.ganhos : vazio.ganhos,
    historico: Array.isArray(bruto.historico)
      ? bruto.historico
      : vazio.historico,
    limites:
      bruto.limites && typeof bruto.limites === 'object'
        ? bruto.limites
        : vazio.limites,
    poupanca: Array.isArray(bruto.poupanca) ? bruto.poupanca : vazio.poupanca,
    streak:
      bruto.streak && typeof bruto.streak === 'object'
        ? bruto.streak
        : vazio.streak,
  };
}
