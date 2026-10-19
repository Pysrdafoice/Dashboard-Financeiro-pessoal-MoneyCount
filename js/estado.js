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

function mesHistoricoValido(mes) {
  if (typeof mes !== 'string') return false;
  const correspondencia = /^(\d{1,2})\/(\d{4})$/.exec(mes);
  if (!correspondencia) return false;
  const numeroMes = Number(correspondencia[1]);
  return numeroMes >= 1 && numeroMes <= 12;
}

function dataISOValida(data) {
  if (typeof data !== 'string') return false;
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!correspondencia) return false;
  const ano = Number(correspondencia[1]);
  const mes = Number(correspondencia[2]);
  const dia = Number(correspondencia[3]);
  if (mes < 1 || mes > 12) return false;
  const bissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
  const diasPorMes = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return dia >= 1 && dia <= diasPorMes[mes - 1];
}

function normalizarTransacoes(itens) {
  if (!Array.isArray(itens)) return [];
  return itens
    .filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        Number.isFinite(item.valor) &&
        item.valor >= 0,
    )
    .map((item, indice) => ({
      ...item,
      id:
        typeof item.id === 'string' && item.id
          ? item.id
          : `restaurado-${Date.now()}-${indice}`,
      descricao:
        typeof item.descricao === 'string' ? item.descricao : 'Sem descrição',
      categoria: typeof item.categoria === 'string' ? item.categoria : 'Outros',
      data: dataISOValida(item.data) ? item.data : undefined,
    }));
}

function normalizarHistorico(historico) {
  if (!Array.isArray(historico)) return [];
  return historico
    .filter(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        !Array.isArray(entry) &&
        mesHistoricoValido(entry.mes),
    )
    .map((entry) => {
      const salario = Number.isFinite(entry.salario) ? entry.salario : 0;
      const totalGanhosExtras = Number.isFinite(entry.totalGanhosExtras)
        ? entry.totalGanhosExtras
        : 0;
      const gastos = Array.isArray(entry.gastos)
        ? normalizarTransacoes(entry.gastos)
        : null;
      const ganhos = Array.isArray(entry.ganhos)
        ? normalizarTransacoes(entry.ganhos)
        : null;

      return {
        ...entry,
        salario,
        totalGanhosExtras,
        rendaTotal: Number.isFinite(entry.rendaTotal)
          ? entry.rendaTotal
          : salario + totalGanhosExtras,
        totalGastos: Number.isFinite(entry.totalGastos)
          ? entry.totalGastos
          : gastos
            ? gastos.reduce((total, item) => total + item.valor, 0)
            : 0,
        ...(gastos ? { gastos } : {}),
        ...(ganhos ? { ganhos } : {}),
      };
    });
}

export function normalizarEstado(bruto) {
  const vazio = estadoVazio();
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return vazio;

  const limites =
    bruto.limites && typeof bruto.limites === 'object' && !Array.isArray(bruto.limites)
      ? Object.fromEntries(
          Object.entries(bruto.limites).filter(
            ([, valor]) => Number.isFinite(valor) && valor > 0,
          ),
        )
      : vazio.limites;

  const poupanca = Array.isArray(bruto.poupanca)
    ? bruto.poupanca.filter(
        (movimento) =>
          movimento &&
          typeof movimento === 'object' &&
          !Array.isArray(movimento) &&
          ['deposito', 'retirada'].includes(movimento.tipo) &&
          Number.isFinite(movimento.valor) &&
          movimento.valor > 0,
      )
    : vazio.poupanca;

  const streak =
    bruto.streak && typeof bruto.streak === 'object' && !Array.isArray(bruto.streak)
      ? {
          dias:
            Number.isFinite(bruto.streak.dias) && bruto.streak.dias >= 0
              ? bruto.streak.dias
              : vazio.streak.dias,
          melhorStreak:
            Number.isFinite(bruto.streak.melhorStreak) &&
            bruto.streak.melhorStreak >= 0
              ? bruto.streak.melhorStreak
              : vazio.streak.melhorStreak,
          ultimaData:
            typeof bruto.streak.ultimaData === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(bruto.streak.ultimaData)
              ? bruto.streak.ultimaData
              : null,
        }
      : vazio.streak;

  return {
    salario:
      Number.isFinite(bruto.salario) && bruto.salario >= 0
        ? bruto.salario
        : vazio.salario,
    gastos: normalizarTransacoes(bruto.gastos),
    ganhos: normalizarTransacoes(bruto.ganhos),
    historico: normalizarHistorico(bruto.historico),
    limites,
    poupanca,
    streak,
  };
}
