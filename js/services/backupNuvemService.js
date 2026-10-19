/**
 * services/backupNuvemService.js — envia/baixa o estado inteiro como um
 * bloco JSON na tabela `backups_usuario` (supabase/schema.sql).
 *
 * Sincronização é sempre manual — cada função aqui só roda quando o
 * usuário clica no botão correspondente no menu, nunca automaticamente.
 * Isso evita exatamente o tipo de conflito que discutimos (duas edições
 * simultâneas em dispositivos diferentes brigando por prioridade).
 */
import { obterSupabase, supabaseConfigurado } from '../config/supabase.js';
import { estado } from '../estado.js';
import { substituirEstado, normalizarEstado } from '../estado.js';
import { salvarDados } from '../persistencia.js';

/** Sobrescreve o backup na nuvem com o estado local atual. */
export async function enviarParaNuvem(userId) {
  if (!supabaseConfigurado) throw new Error('Supabase não configurado.');

  const supabase = await obterSupabase();

  const { error } = await supabase
    .from('backups_usuario')
    .upsert({ user_id: userId, dados: estado });

  if (error) throw error;
}

/**
 * Substitui o estado local pelo que está salvo na nuvem.
 * @returns {Promise<boolean>} true se havia backup salvo; false se essa
 *   conta nunca sincronizou antes (nesse caso, nada foi alterado localmente).
 */
export async function baixarDaNuvem(userId) {
  if (!supabaseConfigurado) throw new Error('Supabase não configurado.');

  const supabase = await obterSupabase();

  const { data, error } = await supabase
    .from('backups_usuario')
    .select('dados')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;

  const estadoAnterior = JSON.parse(JSON.stringify(estado));
  substituirEstado(normalizarEstado(data.dados));
  if (!salvarDados()) {
    substituirEstado(estadoAnterior);
    throw new Error(
      'Os dados da nuvem não puderam ser salvos neste navegador; os dados locais anteriores foram mantidos.',
    );
  }
  return true;
}
