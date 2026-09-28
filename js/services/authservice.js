/**
 * services/authService.js — login, logout e sessão via Supabase Auth.
 *
 * Genérico quanto ao provedor: entrarComProvedor() recebe o nome como
 * parâmetro, então ativar Google/GitHub/etc. no painel do Supabase não
 * exige mudar nada aqui.
 */
import { obterSupabase, supabaseConfigurado } from '../config/supabase.js';

export async function entrarComProvedor(provider) {
  if (!supabaseConfigurado) {
    alert('A sincronização com a nuvem ainda não foi configurada neste app.');
    return;
  }

  try {
    const supabase = await obterSupabase();
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) throw error;
  } catch (erro) {
    console.error('Erro ao entrar:', erro);
    alert('Não foi possível entrar agora. Verifique sua conexão e tente novamente.');
  }
}

const SENHA_MINIMA = 6;

/**
 * Valida e-mail/senha antes de bater no Supabase.
 * @returns {string|null} mensagem de erro em pt-BR, ou null se estiver tudo certo.
 */
function validarCredenciais(email, senha) {
  if (!supabaseConfigurado) return 'A sincronização com a nuvem ainda não foi configurada neste app.';
  if (!email || !email.trim()) return 'Informe seu e-mail.';
  if (!senha || senha.length < SENHA_MINIMA) return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  return null;
}

function traduzirErroAuth(erro) {
  const msg = String(erro?.message || '').toLowerCase();
  if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'Este e-mail já tem uma conta. Tente entrar.';
  if (msg.includes('email') && msg.includes('invalid')) return 'E-mail inválido.';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
  if (msg.includes('failed to fetch') || msg.includes('network')) return 'Sem conexão. Verifique sua internet e tente novamente.';
  return 'Não foi possível concluir agora. Tente novamente.';
}

/**
 * Login com e-mail e senha.
 * @returns {Promise<{ ok: boolean, erro?: string }>}
 */
export async function entrarComEmail(email, senha) {
  const invalido = validarCredenciais(email, senha);
  if (invalido) return { ok: false, erro: invalido };

  try {
    const supabase = await obterSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) throw error;
    return { ok: true };
  } catch (erro) {
    console.error('Erro ao entrar com e-mail:', erro);
    return { ok: false, erro: traduzirErroAuth(erro) };
  }
}

/**
 * Cria conta com e-mail e senha.
 * @returns {Promise<{ ok: boolean, precisaConfirmarEmail?: boolean, erro?: string }>}
 *   `precisaConfirmarEmail` é true quando o projeto exige verificação de
 *   e-mail (o Supabase devolve session null nesse caso).
 */
export async function cadastrarComEmail(email, senha) {
  const invalido = validarCredenciais(email, senha);
  if (invalido) return { ok: false, erro: invalido };

  try {
    const supabase = await obterSupabase();
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: senha });
    if (error) throw error;
    return { ok: true, precisaConfirmarEmail: !data.session };
  } catch (erro) {
    console.error('Erro ao cadastrar com e-mail:', erro);
    return { ok: false, erro: traduzirErroAuth(erro) };
  }
}

export async function sair() {
  if (!supabaseConfigurado) return;
  try {
    const supabase = await obterSupabase();
    await supabase.auth.signOut();
  } catch (erro) {
    console.error('Erro ao sair:', erro);
  }
}

export async function obterSessaoAtual() {
  if (!supabaseConfigurado) return null;
  try {
    const supabase = await obterSupabase();
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (erro) {
    console.error('Erro ao obter sessão:', erro);
    return null;
  }
}

/** Chama `callback(session)` sempre que o estado de login muda. */
export async function aoMudarAutenticacao(callback) {
  if (!supabaseConfigurado) return;
  try {
    const supabase = await obterSupabase();
    supabase.auth.onAuthStateChange((_evento, session) => callback(session));
  } catch (erro) {
    console.error('Erro ao observar autenticação:', erro);
  }
}