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