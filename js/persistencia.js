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
  } catch (e) {
    console.error('Não foi possível salvar os dados no localStorage.', e);
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
  }
}
