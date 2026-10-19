import { estado, substituirEstado, normalizarEstado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import { salvarDados } from '../persistencia.js';
import { obterContextoVisivel } from './meses.js';
import { ehDataISOValida } from '../calculos.js';

let timerStatusBackup = null;

export function escaparCampoCsv(valor) {
  let texto = String(valor);
  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  if (/[;",\r\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

function ehTipoTransacaoValido(item) {
  if (
    item.tipo !== undefined &&
    !['pontual', 'fixo', 'parcelado'].includes(item.tipo)
  ) {
    return false;
  }

  const temParcelas =
    item.parcelasTotal !== undefined || item.parcelasRestantes !== undefined;
  if (item.tipo === 'parcelado' || temParcelas) {
    return (
      Number.isInteger(item.parcelasTotal) &&
      item.parcelasTotal >= 2 &&
      Number.isInteger(item.parcelasRestantes) &&
      item.parcelasRestantes >= 1 &&
      item.parcelasRestantes <= item.parcelasTotal
    );
  }
  return true;
}

function ehTransacoesValidas(transacoes) {
  return Array.isArray(transacoes) && transacoes.every((item) =>
    item &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    Number.isFinite(item.valor) &&
    item.valor >= 0 &&
    (item.data === undefined || ehDataISOValida(item.data)) &&
    ehTipoTransacaoValido(item) &&
    (item.descricao === undefined || typeof item.descricao === 'string') &&
    (item.categoria === undefined || typeof item.categoria === 'string'),
  );
}

function ehHistoricoValido(historico) {
  return historico.every((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
    if (typeof entry.mes !== 'string' || !/^\d{1,2}\/\d{4}$/.test(entry.mes)) return false;
    const mes = Number(entry.mes.split('/')[0]);
    if (mes < 1 || mes > 12) return false;
    if (
      !['salario', 'totalGanhosExtras', 'rendaTotal', 'totalGastos'].every(
        (campo) =>
          entry[campo] === undefined ||
          (Number.isFinite(entry[campo]) && entry[campo] >= 0),
      )
    ) return false;
    if (entry.gastos !== undefined && !ehTransacoesValidas(entry.gastos)) return false;
    if (entry.ganhos !== undefined && !ehTransacoesValidas(entry.ganhos)) return false;
    return true;
  });
}

function ehBackupValido(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return false;
  const camposDeDados = ['gastos', 'ganhos', 'historico', 'limites', 'poupanca'];
  if (!camposDeDados.some((campo) => Object.prototype.hasOwnProperty.call(dados, campo))) {
    return false;
  }
  if (
    dados.salario !== undefined &&
    (!Number.isFinite(dados.salario) || dados.salario < 0)
  ) return false;
  if (dados.gastos !== undefined && !ehTransacoesValidas(dados.gastos)) return false;
  if (dados.ganhos !== undefined && !ehTransacoesValidas(dados.ganhos)) return false;
  if (dados.historico !== undefined) {
    if (!Array.isArray(dados.historico) || !ehHistoricoValido(dados.historico)) return false;
  }
  if (
    dados.limites !== undefined &&
    (!dados.limites ||
      typeof dados.limites !== 'object' ||
      Array.isArray(dados.limites) ||
      Object.values(dados.limites).some((valor) => !Number.isFinite(valor) || valor <= 0))
  ) return false;
  if (
    dados.poupanca !== undefined &&
    (!Array.isArray(dados.poupanca) ||
      dados.poupanca.some(
        (movimento) =>
          !movimento ||
          typeof movimento !== 'object' ||
          Array.isArray(movimento) ||
          !['deposito', 'retirada'].includes(movimento.tipo) ||
          !Number.isFinite(movimento.valor) ||
          movimento.valor <= 0 ||
          (movimento.data !== undefined &&
            (typeof movimento.data !== 'string' ||
              !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(
                movimento.data,
              ) ||
              !Number.isFinite(Date.parse(movimento.data)))),
      ))
  ) return false;
  if (
    dados.streak !== undefined &&
    (!dados.streak ||
      typeof dados.streak !== 'object' ||
      Array.isArray(dados.streak) ||
      ['dias', 'melhorStreak'].some(
        (campo) =>
          dados.streak[campo] !== undefined &&
          (!Number.isFinite(dados.streak[campo]) || dados.streak[campo] < 0),
      ) ||
      (dados.streak.ultimaData !== undefined &&
        dados.streak.ultimaData !== null &&
        !ehDataISOValida(dados.streak.ultimaData)))
  ) return false;
  return true;
}

export { ehBackupValido as validarBackup };

function mostrarStatusBackup(mensagem, ehErro = false) {
  DOM.backupStatus.textContent = mensagem;
  DOM.backupStatus.classList.remove('hidden', 'erro');
  if (ehErro) DOM.backupStatus.classList.add('erro');

  clearTimeout(timerStatusBackup);
  timerStatusBackup = setTimeout(() => {
    DOM.backupStatus.classList.add('hidden');
  }, 5000);
}

function baixarArquivo(conteudo, nomeArquivo, tipoMime) {
  const blob = new Blob([conteudo], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportarBackup() {
  try {
    const dataAtual = new Date().toISOString().slice(0, 10);
    const conteudo = JSON.stringify(estado, null, 2);
    baixarArquivo(
      conteudo,
      `fuelcount-backup-${dataAtual}.json`,
      'application/json',
    );
    mostrarStatusBackup('Backup exportado com sucesso!');
  } catch (e) {
    console.error('Erro ao exportar backup.', e);
    mostrarStatusBackup('Não foi possível gerar o backup.', true);
  }
}

export function importarBackup(e) {
  const arquivo = e.target.files[0];
  if (!arquivo) return Promise.resolve(false);

  return new Promise((resolve) => {
    const leitor = new FileReader();
    leitor.onload = (evento) => {
      try {
        const dados = JSON.parse(evento.target.result);

        if (!ehBackupValido(dados)) {
          mostrarStatusBackup(
            'Arquivo inválido: não parece ser um backup do FuelCount.',
            true,
          );
          resolve(false);
          return;
        }

        const confirmar = confirm(
          'Isso vai substituir todos os dados atuais pelo conteúdo do backup. Deseja continuar?',
        );
        if (!confirmar) {
          resolve(false);
          return;
        }

        const estadoAnterior = JSON.parse(JSON.stringify(estado));
        substituirEstado(normalizarEstado(dados));
        if (!salvarDados()) {
          substituirEstado(estadoAnterior);
          mostrarStatusBackup(
            'Não foi possível salvar o backup neste navegador. Os dados anteriores foram mantidos.',
            true,
          );
          resolve(false);
          return;
        }
        mostrarStatusBackup('Backup restaurado com sucesso!');
        resolve(true);
      } catch (err) {
        console.error('Erro ao importar backup.', err);
        mostrarStatusBackup(
          'Não foi possível ler esse arquivo. Verifique se é um JSON válido.',
          true,
        );
        resolve(false);
      } finally {
        DOM.inputImportarBackup.value = '';
      }
    };
    leitor.onerror = () => {
      console.error('Erro ao ler o arquivo de backup.', leitor.error);
      mostrarStatusBackup('Não foi possível ler o arquivo de backup.', true);
      DOM.inputImportarBackup.value = '';
      resolve(false);
    };
    leitor.onabort = () => {
      mostrarStatusBackup('A leitura do backup foi cancelada.', true);
      DOM.inputImportarBackup.value = '';
      resolve(false);
    };
    try {
      leitor.readAsText(arquivo);
    } catch (erro) {
      console.error('Erro ao iniciar a leitura do backup.', erro);
      mostrarStatusBackup('Não foi possível ler o arquivo de backup.', true);
      DOM.inputImportarBackup.value = '';
      resolve(false);
    }
  });
}

export function exportarCsv() {
  const { gastos, ganhos } = obterContextoVisivel();
  if (gastos.length === 0 && ganhos.length === 0) {
    mostrarStatusBackup('Não há transações para exportar.', true);
    return;
  }

  const cabecalho = ['Tipo', 'Descrição', 'Categoria', 'Data', 'Valor (R$)'];
  const linhas = [
    ...gastos.map((g) => [
      'Despesa',
      escaparCampoCsv(g.descricao),
      escaparCampoCsv(g.categoria),
      escaparCampoCsv(g.data || ''),
      g.valor.toFixed(2).replace('.', ','),
    ]),
    ...ganhos.map((g) => [
      'Receita',
      escaparCampoCsv(g.descricao),
      escaparCampoCsv(g.categoria),
      escaparCampoCsv(g.data || ''),
      g.valor.toFixed(2).replace('.', ','),
    ]),
  ];

  const conteudoCsv =
    '\uFEFF' +
    [cabecalho, ...linhas].map((linha) => linha.join(';')).join('\n');

  const dataAtual = new Date().toISOString().slice(0, 10);
  baixarArquivo(
    conteudoCsv,
    `fuelcount-extrato-${dataAtual}.csv`,
    'text/csv;charset=utf-8;',
  );
  mostrarStatusBackup('Extrato exportado em CSV!');
}
