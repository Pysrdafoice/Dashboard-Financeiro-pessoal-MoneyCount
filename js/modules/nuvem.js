/**
 * modules/nuvem.js — a parte visual da Conta/Sincronização: alterna entre
 * o estado "deslogado" e "logado" no menu, e liga os botões aos serviços.
 *
 * Se o Supabase ainda não estiver configurado (config/supabase.js com
 * placeholders), o app continua funcionando 100% normal — essa seção só
 * mostra um aviso quando alguém tenta usar, em vez de quebrar em silêncio.
 */
import { DOM } from '../ui/dom.js';
import { supabaseConfigurado } from '../config/supabase.js';
import { entrarComProvedor, sair, obterSessaoAtual, aoMudarAutenticacao } from '../services/authservice.js';
import { enviarParaNuvem, baixarDaNuvem } from '../services/backupnuvemservice.js';

let timerStatusNuvem = null;

function mostrarStatusNuvem(mensagem, ehErro = false) {
  DOM.nuvemStatus.textContent = mensagem;
  DOM.nuvemStatus.classList.remove('hidden', 'erro');
  if (ehErro) DOM.nuvemStatus.classList.add('erro');

  clearTimeout(timerStatusNuvem);
  timerStatusNuvem = setTimeout(() => DOM.nuvemStatus.classList.add('hidden'), 5000);
}

function atualizarTelaDeConta(session) {
  const logado = Boolean(session);
  DOM.nuvemDeslogado.classList.toggle('hidden', logado);
  DOM.nuvemLogado.classList.toggle('hidden', !logado);
  if (logado) {
    DOM.nuvemEmailUsuario.textContent = `Conectado(a) como ${session.user.email}`;
  }
}

export function inicializarNuvem() {
  // TODO: troque 'google' pelo provedor que você ativar no painel do
  // Supabase (Authentication → Providers). Dá pra ter mais de um botão
  // aqui depois, um por provedor — a função aceita qualquer nome.
  DOM.btnEntrarNuvem.addEventListener('click', () => entrarComProvedor('google'));

  DOM.btnSairNuvem.addEventListener('click', async () => {
    await sair();
    atualizarTelaDeConta(null);
  });

  DOM.btnEnviarNuvem.addEventListener('click', async () => {
    try {
      const session = await obterSessaoAtual();
      await enviarParaNuvem(session.user.id);
      mostrarStatusNuvem('Dados enviados para a nuvem com sucesso!');
    } catch (e) {
      console.error('Erro ao enviar para a nuvem.', e);
      mostrarStatusNuvem('Não foi possível enviar. Tente novamente.', true);
    }
  });

  DOM.btnBaixarNuvem.addEventListener('click', async () => {
    const confirmar = confirm('Isso substitui os dados deste dispositivo pelos que estão salvos na nuvem. Continuar?');
    if (!confirmar) return;

    try {
      const session = await obterSessaoAtual();
      const encontrou = await baixarDaNuvem(session.user.id);
      mostrarStatusNuvem(
        encontrou ? 'Dados baixados da nuvem com sucesso!' : 'Você ainda não tem nenhum backup salvo na nuvem.',
        !encontrou,
      );
      if (encontrou) location.reload(); // garante que toda a tela reflita os dados novos
    } catch (e) {
      console.error('Erro ao baixar da nuvem.', e);
      mostrarStatusNuvem('Não foi possível baixar. Tente novamente.', true);
    }
  });

  if (!supabaseConfigurado) return; // sem chaves ainda: fica só no estado "deslogado", sem quebrar nada

  obterSessaoAtual().then(atualizarTelaDeConta);
  aoMudarAutenticacao(atualizarTelaDeConta);
}