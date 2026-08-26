/**
 * modules/backup.js — exportar/importar backup em JSON, e exportar o
 * extrato em CSV.
 *
 * importarBackup() é assíncrono (usa FileReader) e devolve uma Promise
 * que resolve `true`/`false`. Por quê: se essa função chamasse
 * atualizarInterface() diretamente ao terminar, precisaria importar de
 * app.js — e app.js precisa importar backup.js pra ligar o botão. Mesma
 * dependência circular que resolvemos em gastos.js/ganhos.js, só que
 * aqui com um Promise no lugar de um retorno síncrono, porque o resultado
 * só existe depois que o arquivo termina de ser lido.
 */
import { estado, substituirEstado, normalizarEstado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import { salvarDados } from '../persistencia.js';

let timerStatusBackup = null;

function mostrarStatusBackup(mensagem, ehErro = false) {
  DOM.backupStatus.textContent = mensagem;
  DOM.backupStatus.classList.remove('hidden', 'erro');
  if (ehErro) DOM.backupStatus.classList.add('erro');

  // Some sozinho depois de alguns segundos, sem precisar de clique
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
    baixarArquivo(conteudo, `fuelcount-backup-${dataAtual}.json`, 'application/json');
    mostrarStatusBackup('Backup exportado com sucesso!');
  } catch (e) {
    console.error('Erro ao exportar backup.', e);
    mostrarStatusBackup('Não foi possível gerar o backup.', true);
  }
}

/**
 * @returns {Promise<boolean>} true se o backup foi restaurado com sucesso
 *   (quem chamar deve redesenhar a tela nesse caso); false se falhou ou
 *   se o usuário cancelou a confirmação.
 */
export function importarBackup(e) {
  const arquivo = e.target.files[0];
  if (!arquivo) return Promise.resolve(false);

  return new Promise((resolve) => {
    const leitor = new FileReader();
    leitor.onload = (evento) => {
      try {
        const dados = JSON.parse(evento.target.result);

        // Validação básica da estrutura antes de sobrescrever os dados atuais
        // (isso é diferente de normalizarEstado: aqui a intenção é rejeitar
        // um JSON qualquer ANTES de incomodar o usuário com a confirmação —
        // normalizarEstado só entra depois, pra preencher o que faltar)
        const valido =
          dados &&
          typeof dados === 'object' &&
          (dados.salario === undefined || typeof dados.salario === 'number') &&
          (dados.gastos === undefined || Array.isArray(dados.gastos)) &&
          (dados.historico === undefined || Array.isArray(dados.historico));

        if (!valido) {
          mostrarStatusBackup('Arquivo inválido: não parece ser um backup do FuelCount.', true);
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
        mostrarStatusBackup('Não foi possível ler esse arquivo. Verifique se é um JSON válido.', true);
        resolve(false);
      } finally {
        DOM.inputImportarBackup.value = ''; // permite selecionar o mesmo arquivo de novo, se precisar
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

  // Escapa campos que contenham vírgula, aspas ou quebra de linha, seguindo o padrão CSV
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

  // BOM (\uFEFF) garante acentuação correta ao abrir no Excel
  const conteudoCsv = '\uFEFF' + [cabecalho, ...linhas].map((linha) => linha.join(';')).join('\n');

  const dataAtual = new Date().toISOString().slice(0, 10);
  baixarArquivo(conteudoCsv, `fuelcount-extrato-${dataAtual}.csv`, 'text/csv;charset=utf-8;');
  mostrarStatusBackup('Extrato exportado em CSV!');
}