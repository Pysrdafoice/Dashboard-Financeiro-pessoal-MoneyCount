/**
 * calculos.js — funções puras de cálculo financeiro do FuelCount.
 *
 * "Puras" aqui significa: nenhuma função neste arquivo toca no DOM, no
 * localStorage ou em variáveis globais. Tudo que cada função precisa entra
 * por parâmetro, e tudo que ela produz sai pelo retorno. Isso é o que torna
 * possível testar cada uma isoladamente (veja calculos.test.js) e também o
 * que possibilita reaproveitar essa lógica fora do navegador, se um dia
 * fizer sentido (ex: um script de relatório rodando em Node).
 */

export function calcularTotais(estado) {
  const totalGastos = estado.gastos.reduce((acc, curr) => acc + curr.valor, 0);
  const totalGanhosExtras = estado.ganhos.reduce((acc, curr) => acc + curr.valor, 0);
  const rendaTotal = estado.salario + totalGanhosExtras;
  const saldoRestante = rendaTotal - totalGastos;
  return { totalGastos, totalGanhosExtras, rendaTotal, saldoRestante };
}

export function calcularSaldoPoupanca(poupanca) {
  return poupanca.reduce((acc, mov) => {
    return mov.tipo === 'retirada' ? acc - mov.valor : acc + mov.valor;
  }, 0);
}

/**
 * Movimento líquido de poupança (depósitos menos retiradas) dentro de um
 * mês/ano específico. Função genérica usada tanto pelo mês atual quanto
 * por qualquer mês já fechado no histórico.
 */
export function calcularMovimentoPoupancaDoMes(poupanca, mesIndex, ano) {
  return poupanca.reduce((acc, mov) => {
    const dataMov = new Date(mov.data);
    const mesmoMes = dataMov.getMonth() === mesIndex && dataMov.getFullYear() === ano;
    if (!mesmoMes) return acc;
    return mov.tipo === 'retirada' ? acc - mov.valor : acc + mov.valor;
  }, 0);
}

/**
 * Movimento líquido de poupança dentro do mês/ano atual (depósitos menos
 * retiradas). Usado só para calcular o "Saldo Livre" — de propósito NÃO
 * usa o saldo total acumulado, porque "Guardado" nunca zera ao Fechar o
 * Mês, enquanto "Saldo Restante" é sempre relativo ao mês corrente. Somar
 * o total histórico deixaria o Saldo Livre cada vez mais negativo com o
 * passar dos meses, mesmo sem nenhum gasto novo.
 */
export function calcularMovimentoPoupancaMesAtual(poupanca, dataReferencia = new Date()) {
  return calcularMovimentoPoupancaDoMes(poupanca, dataReferencia.getMonth(), dataReferencia.getFullYear());
}

export function formatarDataISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Converte "8/2026" em { mesIndex: 7, ano: 2026, ordem: 24319 } (ordem serve pra ordenar cronologicamente). */
export function parseMesChave(mesStr) {
  const [mes, ano] = mesStr.split('/').map(Number);
  return { mesIndex: mes - 1, ano, ordem: ano * 12 + mes };
}

/**
 * Calcula o valor "guardado ajustado" de um mês: o quanto foi guardado,
 * penalizado quando o Saldo Livre daquele mês ficou negativo. A ideia é
 * que guardar dinheiro enquanto se está no vermelho não deveria contar
 * como progresso real de educação financeira — o gráfico precisa refletir
 * isso, não só mostrar "quanto foi depositado".
 */
export function calcularGuardadoAjustado(poupanca, mesIndex, ano, renda, totalGastos) {
  const movimentoMes = calcularMovimentoPoupancaDoMes(poupanca, mesIndex, ano);
  const saldoRestante = renda - totalGastos;
  const saldoLivre = saldoRestante - movimentoMes;

  // Só penaliza quando o saldo livre é negativo; do contrário o valor
  // ajustado é igual ao valor bruto guardado naquele mês.
  const guardadoAjustado = saldoLivre < 0 ? movimentoMes - Math.abs(saldoLivre) : movimentoMes;

  return { movimentoMes, saldoLivre, guardadoAjustado };
}

export function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Calcula a variação percentual entre o valor atual e o valor anterior.
 * Regra de negócio: se não houver valor anterior para comparar (undefined,
 * null ou 0 — divisão por zero não faz sentido aqui), retorna null.
 * @returns {number|null} variação em pontos percentuais, ou null se não houver base de comparação
 */
export function calcularVariacaoPercentual(atual, anterior) {
  if (anterior === undefined || anterior === null || anterior === 0) {
    return null;
  }
  return ((atual - anterior) / anterior) * 100;
}

/**
 * Regra pura de retenção de Gastos usada ao Fechar o Mês: Pontuais somem,
 * Fixos continuam do jeito que estão, Parcelados perdem uma parcela e
 * somem quando o contador chega a zero.
 */
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
      // Se chegou a 0, a parcela foi paga por completo e não volta pro próximo mês
      return;
    }

    // tipo === 'pontual' (ou ausente, por retrocompatibilidade): não retorna
  });

  return novosGastos;
}

/**
 * Regra pura de retenção de Ganhos usada ao Fechar o Mês: Pontuais somem,
 * Fixos (ex: um freela recorrente) continuam.
 */
export function filtrarGanhosAposFechamento(ganhos) {
  return ganhos.filter((ganho) => ganho.tipo === 'fixo');
}

/**
 * Atualiza o streak (mutando o objeto recebido): soma 1 se a última
 * atividade foi ontem, reinicia pra 1 se foi antes disso, não faz nada se
 * já tiver contado hoje. Aceita `dataReferencia` pra ser testável sem
 * depender do relógio real do sistema.
 */
export function registrarAtividadeStreak(streak, dataReferencia = new Date()) {
  const hoje = formatarDataISO(dataReferencia);
  if (streak.ultimaData === hoje) return streak;

  const ontem = formatarDataISO(new Date(dataReferencia.getTime() - 86400000));
  streak.dias = streak.ultimaData === ontem ? streak.dias + 1 : 1;
  streak.ultimaData = hoje;
  streak.melhorStreak = Math.max(streak.melhorStreak, streak.dias);
  return streak;
}

/**
 * Determina se o streak ainda está "vivo" (última atividade foi hoje ou
 * ontem) e quantos dias mostrar. Streak quebrado exibe 0, mesmo que o
 * valor salvo em `streak.dias` seja maior — o dado só é "resetado de
 * verdade" na próxima vez que o usuário registrar uma atividade
 * (registrarAtividadeStreak), mas pra fins de exibição já tratamos como zero.
 */
export function calcularExibicaoStreak(streak, dataReferencia = new Date()) {
  if (!streak.ultimaData) return { dias: 0, ativo: false };
  const hoje = formatarDataISO(dataReferencia);
  const ontem = formatarDataISO(new Date(dataReferencia.getTime() - 86400000));
  const streakValido = streak.ultimaData === hoje || streak.ultimaData === ontem;
  return { dias: streakValido ? streak.dias : 0, ativo: streakValido };
}

/**
 * Escolhe a frase do banner emocional com base no contexto financeiro
 * atual. Prioridade: boas-vindas (app vazio) > queda de gastos > dinheiro
 * guardado no mês > alta de gastos > estável > genérica.
 */
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
  const guardadoMes = calcularMovimentoPoupancaMesAtual(estado.poupanca, dataReferencia);

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