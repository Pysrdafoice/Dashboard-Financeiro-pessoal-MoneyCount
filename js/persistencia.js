/**
 * persistencia.js — salvar e carregar o estado do localStorage.
 *
 * Isolado num módulo próprio porque é o único lugar do app que sabe que a
 * "gaveta" de armazenamento é o localStorage. Se um dia isso mudar (ex:
 * IndexedDB, ou sync com um backend), só este arquivo muda — nenhum outro
 * módulo faz `localStorage.getItem` diretamente.
 */
import { estado, substituirEstado, estadoVazio, normalizarEstado } from './estado.js';

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