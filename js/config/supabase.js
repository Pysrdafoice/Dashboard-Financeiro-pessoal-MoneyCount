/**
 * config/supabase.js — URL e chave pública do projeto Supabase.
 *
 * A anon key NÃO é um segredo — ela é feita pra ficar exposta no código do
 * navegador; quem protege os dados de verdade são as políticas de RLS em
 * supabase/schema.sql (cada usuário só enxerga a própria linha).
 *
 * IMPORTANTE — por que o import da biblioteca é dinâmico aqui:
 * Um `import` estático de CDN no topo do arquivo é executado assim que o
 * módulo é lido. Como módulos ES são "tudo ou nada", se esse import
 * falhasse (CDN fora do ar, ad-blocker, CSP bloqueando), o app.js INTEIRO
 * deixaria de executar e nenhum botão da página funcionaria. Carregando
 * sob demanda, uma falha na nuvem afeta só a nuvem.
 */

const SUPABASE_URL = 'https://lavgoyvlbbfbqidpzkgd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_hpnWpchL3CGuwYBkbv-Jgw_dNq8RqVu';

// ⚠️ LEMBRETE: ao trocar os valores acima pelos reais, atualize também o
// vercel.json — a diretiva `connect-src` do CSP hoje só permite 'self', o
// que bloquearia as chamadas. Adicione as duas origens, ex:
// "connect-src 'self' https://SEUPROJETO.supabase.co https://cdn.jsdelivr.net"

export const supabaseConfigurado =
  !SUPABASE_URL.startsWith('COLE_') && !SUPABASE_ANON_KEY.startsWith('COLE_');

let clientePromise = null;

/**
 * Carrega a biblioteca e cria o cliente na primeira chamada; nas seguintes
 * reaproveita a mesma instância (a Promise fica em cache).
 * @returns {Promise<object|null>} null se as chaves ainda não foram configuradas.
 */
export function obterSupabase() {
  if (!supabaseConfigurado) return Promise.resolve(null);

  if (!clientePromise) {
    clientePromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY))
      .catch((erro) => {
        console.error('Não foi possível carregar a biblioteca do Supabase.', erro);
        clientePromise = null; // permite nova tentativa num clique futuro
        throw erro;
      });
  }

  return clientePromise;
}