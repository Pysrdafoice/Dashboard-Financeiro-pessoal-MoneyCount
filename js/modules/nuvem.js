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
import {
  entrarComEmail,
  cadastrarComEmail,
  solicitarRecuperacaoSenha,
  atualizarSenha,
  sair,
  obterSessaoAtual,
  aoMudarAutenticacao,
} from '../services/authservice.js';
import { enviarParaNuvem, baixarDaNuvem } from '../services/backupNuvemService.js';

let timerStatusNuvem = null;
let timerStatusLogin = null;
let recuperacaoEmAndamento = false;

function mostrarStatusNuvem(mensagem, ehErro = false) {
  DOM.nuvemStatus.textContent = mensagem;
  DOM.nuvemStatus.classList.remove('hidden', 'erro');
  if (ehErro) DOM.nuvemStatus.classList.add('erro');

  clearTimeout(timerStatusNuvem);
  timerStatusNuvem = setTimeout(() => DOM.nuvemStatus.classList.add('hidden'), 5000);
}

function mostrarStatusLogin(mensagem, ehErro = false) {
  DOM.loginStatus.textContent = mensagem;
  DOM.loginStatus.classList.remove('hidden', 'erro');
  if (ehErro) DOM.loginStatus.classList.add('erro');

  clearTimeout(timerStatusLogin);
  timerStatusLogin = setTimeout(() => DOM.loginStatus.classList.add('hidden'), 8000);
}

function lerCredenciais() {
  return { email: DOM.loginEmail.value.trim(), senha: DOM.loginSenha.value };
}

function bloquearFormLogin(bloquear) {
  DOM.formLogin.querySelectorAll('input, button').forEach((el) => { el.disabled = bloquear; });
}

async function aoEntrar(evento) {
  evento.preventDefault();
  const { email, senha } = lerCredenciais();

  bloquearFormLogin(true);
  const resultado = await entrarComEmail(email, senha);
  bloquearFormLogin(false);

  if (!resultado.ok) {
    mostrarStatusLogin(resultado.erro, true);
    return;
  }
  DOM.loginSenha.value = '';
  DOM.loginStatus.classList.add('hidden');
}

async function aoCadastrar() {
  const { email, senha } = lerCredenciais();

  bloquearFormLogin(true);
  const resultado = await cadastrarComEmail(email, senha);
  bloquearFormLogin(false);

  if (!resultado.ok) {
    mostrarStatusLogin(resultado.erro, true);
    return;
  }
  DOM.loginSenha.value = '';
  if (resultado.precisaConfirmarEmail) {
    mostrarStatusLogin('Conta criada! Verifique seu e-mail para confirmar.');
  } else {
    mostrarStatusLogin('Conta criada com sucesso!');
  }
}

async function aoSolicitarRecuperacao() {
  const { email } = lerCredenciais();
  bloquearFormLogin(true);
  const resultado = await solicitarRecuperacaoSenha(email);
  bloquearFormLogin(false);

  if (!resultado.ok) {
    mostrarStatusLogin(resultado.erro, true);
    return;
  }
  mostrarStatusLogin('Se a conta existir, enviaremos um link para redefinir sua senha.');
}

async function aoAtualizarSenha(evento) {
  evento.preventDefault();
  const senha = DOM.novaSenha.value;
  if (senha !== DOM.confirmarNovaSenha.value) {
    mostrarStatusLogin('As senhas informadas não são iguais.', true);
    return;
  }

  const botao = DOM.formNovaSenha.querySelector('button[type="submit"]');
  botao.disabled = true;
  const resultado = await atualizarSenha(senha);
  botao.disabled = false;
  if (!resultado.ok) {
    mostrarStatusLogin(resultado.erro, true);
    return;
  }

  recuperacaoEmAndamento = false;
  DOM.novaSenha.value = '';
  DOM.confirmarNovaSenha.value = '';
  DOM.recuperacaoSenha.classList.add('hidden');
  mostrarStatusLogin('Senha atualizada com sucesso.');
  atualizarTelaDeConta(await obterSessaoAtual());
}

async function cancelarRecuperacao() {
  const saiu = !supabaseConfigurado || await sair();
  if (!saiu) {
    mostrarStatusLogin('Não foi possível encerrar a redefinição agora. Tente novamente.', true);
    return;
  }
  recuperacaoEmAndamento = false;
  DOM.recuperacaoSenha.classList.add('hidden');
  DOM.formLogin.classList.remove('hidden');
  DOM.btnCadastrar.classList.remove('hidden');
  atualizarTelaDeConta(null);
}

function atualizarTelaDeConta(session, evento) {
  if (evento === 'PASSWORD_RECOVERY') recuperacaoEmAndamento = true;
  if (recuperacaoEmAndamento) {
    DOM.nuvemDeslogado.classList.remove('hidden');
    DOM.nuvemLogado.classList.add('hidden');
    DOM.formLogin.classList.add('hidden');
    DOM.btnCadastrar.classList.add('hidden');
    DOM.recuperacaoSenha.classList.remove('hidden');
    DOM.formNovaSenha.classList.remove('hidden');
    return;
  }

  const logado = Boolean(session);
  DOM.nuvemDeslogado.classList.toggle('hidden', logado);
  DOM.nuvemLogado.classList.toggle('hidden', !logado);
  if (logado) {
    DOM.nuvemEmailUsuario.textContent = `Conectado(a) como ${session.user.email}`;
  }
}

export function inicializarNuvem() {
  DOM.formLogin.addEventListener('submit', aoEntrar);
  DOM.btnCadastrar.addEventListener('click', aoCadastrar);
  DOM.btnRecuperarSenha.addEventListener('click', aoSolicitarRecuperacao);
  DOM.formNovaSenha.addEventListener('submit', aoAtualizarSenha);
  DOM.btnCancelarRecuperacao.addEventListener('click', cancelarRecuperacao);

  if (/(?:^|[&#])type=recovery(?:&|$)/.test(location.hash)) {
    recuperacaoEmAndamento = true;
    atualizarTelaDeConta(null);
  }

  DOM.btnSairNuvem.addEventListener('click', async () => {
    if (await sair()) {
      atualizarTelaDeConta(null);
    } else {
      mostrarStatusNuvem('Não foi possível sair da conta. Tente novamente.', true);
    }
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