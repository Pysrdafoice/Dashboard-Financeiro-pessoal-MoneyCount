import { estado, substituirEstado, normalizarEstado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import { salvarDados } from '../persistencia.js';

let timerStatusBackup = null;

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

        const valido =
          dados &&
          typeof dados === 'object' &&
          (dados.salario === undefined || typeof dados.salario === 'number') &&
          (dados.gastos === undefined || Array.isArray(dados.gastos)) &&
          (dados.historico === undefined || Array.isArray(dados.historico));

        if (!valido) {
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
    leitor.readAsText(arquivo);
  });
}

export function exportarCsv() {
  if (estado.gastos.length === 0) {
    mostrarStatusBackup('Não há gastos para exportar.', true);
    return;
  }

  const escapeCsv = (valor) => {
    const texto = String(valor);
    if (/[",\n]/.test(texto)) {
      return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
  };

  const cabecalho = ['Descrição', 'Categoria', 'Valor (R$)'];
  const linhas = estado.gastos.map((g) => [
    escapeCsv(g.descricao),
    escapeCsv(g.categoria),
    g.valor.toFixed(2).replace('.', ','),
  ]);

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
