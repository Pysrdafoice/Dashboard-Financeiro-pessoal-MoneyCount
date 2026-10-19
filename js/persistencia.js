import {
  estado,
  substituirEstado,
  estadoVazio,
  normalizarEstado,
} from './estado.js';

const CHAVE_LOCALSTORAGE = 'orcamento_estado';

export function salvarDados() {
  try {
    localStorage.setItem(CHAVE_LOCALSTORAGE, JSON.stringify(estado));
    window.dispatchEvent(new Event('fuelcount:persistencia-ok'));
    return true;
  } catch (e) {
    console.error('Não foi possível salvar os dados no localStorage.', e);
    window.dispatchEvent(
      new CustomEvent('fuelcount:persistencia-erro', {
        detail: {
          permanente: false,
          mensagem:
            'Não foi possível salvar no navegador. A alteração foi desfeita; tente novamente ou exporte um backup.',
        },
      }),
    );
    return false;
  }
}

export function carregarDados() {
  try {
    const salvo = localStorage.getItem(CHAVE_LOCALSTORAGE);
    if (salvo) {
      substituirEstado(normalizarEstado(JSON.parse(salvo)));
    }
  } catch (e) {
    console.error('Dados corrompidos no localStorage, iniciando do zero.', e);
    substituirEstado(estadoVazio());
    window.dispatchEvent(
      new CustomEvent('fuelcount:persistencia-erro', {
        detail: {
          permanente: true,
          mensagem:
            'Os dados locais não puderam ser lidos. O app iniciou vazio; restaure um backup antes de continuar.',
        },
      }),
    );
  }
}
