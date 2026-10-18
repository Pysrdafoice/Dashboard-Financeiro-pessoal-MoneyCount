import { estado, substituirEstado, normalizarEstado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import { salvarDados } from '../persistencia.js';
import { obterContextoVisivel } from './meses.js';

let timerStatusBackup = null;

function ehTransacoesValidas(transacoes) {
  return Array.isArray(transacoes) && transacoes.every((item) =>
    item &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    Number.isFinite(item.valor) &&
    item.valor > 0,
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
        (campo) => entry[campo] === undefined || Number.isFinite(entry[campo]),
      )
    ) return false;
    if (entry.gastos !== undefined && !ehTransacoesValidas(entry.gastos)) return false;
    if (entry.ganhos !== undefined && !ehTransacoesValidas(entry.ganhos)) return false;
    return true;
  });
}

function ehBackupValido(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return false;
  const camposConhecidos = [
    'salario',
    'gastos',
    'ganhos',
    'historico',
    'limites',
    'poupanca',
    'streak',
  ];
  if (!camposConhecidos.some((campo) => Object.prototype.hasOwnProperty.call(dados, campo))) {
    return false;
  }
  if (dados.salario !== undefined && !Number.isFinite(dados.salario)) return false;
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
  if (dados.poupanca !== undefined && !Array.isArray(dados.poupanca)) return false;
  if (
    dados.streak !== undefined &&
    (!dados.streak || typeof dados.streak !== 'object' || Array.isArray(dados.streak))
  ) return false;
  return true;
}

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

        substituirEstado(normalizarEstado(dados));
        salvarDados();
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

  const escapeCsv = (valor) => {
    const texto = String(valor);
    if (/[;",\r\n]/.test(texto)) {
      return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
  };

  const cabecalho = ['Tipo', 'Descrição', 'Categoria', 'Data', 'Valor (R$)'];
  const linhas = [
    ...gastos.map((g) => [
      'Despesa',
      escapeCsv(g.descricao),
      escapeCsv(g.categoria),
      escapeCsv(g.data || ''),
      g.valor.toFixed(2).replace('.', ','),
    ]),
    ...ganhos.map((g) => [
      'Receita',
      escapeCsv(g.descricao),
      escapeCsv(g.categoria),
      escapeCsv(g.data || ''),
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
