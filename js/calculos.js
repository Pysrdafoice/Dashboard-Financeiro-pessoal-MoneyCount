export function calcularTotais(estado) {
  const totalGastos = estado.gastos.reduce((acc, curr) => acc + curr.valor, 0);
  const totalGanhosExtras = estado.ganhos.reduce(
    (acc, curr) => acc + curr.valor,
    0,
  );
  const rendaTotal = estado.salario + totalGanhosExtras;
  const saldoRestante = rendaTotal - totalGastos;
  return { totalGastos, totalGanhosExtras, rendaTotal, saldoRestante };
}

export function calcularSaldoPoupanca(poupanca) {
  return poupanca.reduce((acc, mov) => {
    return mov.tipo === 'retirada' ? acc - mov.valor : acc + mov.valor;
  }, 0);
}

export function calcularMovimentoPoupancaDoMes(poupanca, mesIndex, ano) {
  return poupanca.reduce((acc, mov) => {
    const dataMov = new Date(mov.data);
    const mesmoMes =
      dataMov.getMonth() === mesIndex && dataMov.getFullYear() === ano;
    if (!mesmoMes) return acc;
    return mov.tipo === 'retirada' ? acc - mov.valor : acc + mov.valor;
  }, 0);
}

export function calcularMovimentoPoupancaMesAtual(
  poupanca,
  dataReferencia = new Date(),
) {
  return calcularMovimentoPoupancaDoMes(
    poupanca,
    dataReferencia.getMonth(),
    dataReferencia.getFullYear(),
  );
}

export function formatarDataISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function parseMesChave(mesStr) {
  const [mes, ano] = mesStr.split('/').map(Number);
  return { mesIndex: mes - 1, ano, ordem: ano * 12 + mes };
}

export function calcularGuardadoAjustado(
  poupanca,
  mesIndex,
  ano,
  renda,
  totalGastos,
) {
  const movimentoMes = calcularMovimentoPoupancaDoMes(poupanca, mesIndex, ano);
  const saldoRestante = renda - totalGastos;
  const saldoLivre = saldoRestante - movimentoMes;

  const guardadoAjustado =
    saldoLivre < 0 ? movimentoMes - Math.abs(saldoLivre) : movimentoMes;

  return { movimentoMes, saldoLivre, guardadoAjustado };
}

export function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function calcularVariacaoPercentual(atual, anterior) {
  if (anterior === undefined || anterior === null || anterior === 0) {
    return null;
  }
  return ((atual - anterior) / anterior) * 100;
}

export function filtrarGastosAposFechamento(gastos) {
  const novosGastos = [];

  gastos.forEach((gasto) => {
    if (gasto.tipo === 'fixo') {
      novosGastos.push({ ...gasto });
      return;
    }

    if (gasto.tipo === 'parcelado') {
      const parcelasRestantes = (gasto.parcelasRestantes || 1) - 1;
      if (parcelasRestantes > 0) {
        novosGastos.push({ ...gasto, parcelasRestantes });
      }
      return;
    }
  });

  return novosGastos;
}

export function filtrarGanhosAposFechamento(ganhos) {
  return ganhos.filter((ganho) => ganho.tipo === 'fixo');
}

export function registrarAtividadeStreak(streak, dataReferencia = new Date()) {
  const hoje = formatarDataISO(dataReferencia);
  if (streak.ultimaData === hoje) return streak;

  const ontem = formatarDataISO(new Date(dataReferencia.getTime() - 86400000));
  streak.dias = streak.ultimaData === ontem ? streak.dias + 1 : 1;
  streak.ultimaData = hoje;
  streak.melhorStreak = Math.max(streak.melhorStreak, streak.dias);
  return streak;
}

export function calcularExibicaoStreak(streak, dataReferencia = new Date()) {
  if (!streak.ultimaData) return { dias: 0, ativo: false };
  const hoje = formatarDataISO(dataReferencia);
  const ontem = formatarDataISO(new Date(dataReferencia.getTime() - 86400000));
  const streakValido =
    streak.ultimaData === hoje || streak.ultimaData === ontem;
  return { dias: streakValido ? streak.dias : 0, ativo: streakValido };
}

export function gerarFraseEmocional(estado, dataReferencia = new Date()) {
  if (
    estado.gastos.length === 0 &&
    estado.ganhos.length === 0 &&
    estado.historico.length === 0 &&
    estado.poupanca.length === 0
  ) {
    return 'Bem-vindo(a)! Comece registrando seu primeiro gasto — leva só alguns segundos. 🚀';
  }

  const { totalGastos } = calcularTotais(estado);
  const mesAnterior = estado.historico[estado.historico.length - 1];
  const variacaoGastos = mesAnterior
    ? calcularVariacaoPercentual(totalGastos, mesAnterior.totalGastos)
    : null;
  const guardadoMes = calcularMovimentoPoupancaMesAtual(
    estado.poupanca,
    dataReferencia,
  );

  if (variacaoGastos !== null && variacaoGastos < -3) {
    return `Você gastou ${Math.abs(variacaoGastos).toFixed(0)}% a menos que o mês passado. Continue assim! 💪`;
  }
  if (guardadoMes > 0) {
    return `Você já guardou ${formatarMoeda(guardadoMes)} este mês. Cada real conta! 🐷`;
  }
  if (variacaoGastos !== null && variacaoGastos > 15) {
    return `Seus gastos subiram ${variacaoGastos.toFixed(0)}% em relação ao mês passado — vale revisar as categorias.`;
  }
  if (variacaoGastos !== null) {
    return 'Seus gastos estão praticamente estáveis em relação ao mês passado.';
  }
  return 'Continue registrando seus gastos para acompanhar sua evolução financeira.';
}
