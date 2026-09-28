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
    // O array vai inteiro, sem remontar cada entry: assim os campos
    // `gastos`/`ganhos` guardados ao fechar o mês (ver fecharMes em app.js)
    // sobrevivem ao carregar do localStorage e ao restaurar backup.
    historico: Array.isArray(bruto.historico)
      ? bruto.historico.filter((h) => h && typeof h === 'object')
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
