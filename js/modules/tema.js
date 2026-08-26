/**
 * modules/tema.js — alternar e persistir o tema claro/escuro.
 *
 * corTextoGrafico()/corGradeGrafico() NÃO moram aqui — ficam em
 * ui/utils.js, de propósito. Veja o comentário lá pra explicação
 * completa, mas em resumo: se estivessem aqui, graficos.js precisaria
 * importar de tema.js e tema.js precisaria importar de graficos.js pra
 * recriar os gráficos — uma dependência circular.
 */
import { DOM } from '../ui/dom.js';
import { destruirGraficosPrincipais, renderizarGraficoPizza, renderizarGraficoLinha, renderizarGraficoGuardado } from './graficos.js';
import { destruirGraficoModal, recriarGraficoModalSeAberto } from './modal.js';

const CHAVE_LOCALSTORAGE_TEMA = 'fuelcount_tema';

export function aplicarTemaSalvo() {
  let tema = 'claro';
  try {
    tema = localStorage.getItem(CHAVE_LOCALSTORAGE_TEMA) || 'claro';
  } catch (e) {
    console.error('Não foi possível ler a preferência de tema.', e);
  }
  definirTema(tema);
}

export function alternarTema() {
  const temaAtual = document.body.classList.contains('dark-mode') ? 'escuro' : 'claro';
  const novoTema = temaAtual === 'claro' ? 'escuro' : 'claro';
  definirTema(novoTema);

  try {
    localStorage.setItem(CHAVE_LOCALSTORAGE_TEMA, novoTema);
  } catch (e) {
    console.error('Não foi possível salvar a preferência de tema.', e);
  }

  recriarGraficosComTemaAtual();
}

function definirTema(tema) {
  if (tema === 'escuro') {
    document.body.classList.add('dark-mode');
    DOM.btnTema.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-mode');
    DOM.btnTema.textContent = '🌙';
  }
}

/** Destrói e recria todos os gráficos (principais + modal, se aberto) com as cores do novo tema. */
function recriarGraficosComTemaAtual() {
  destruirGraficosPrincipais();
  destruirGraficoModal();

  renderizarGraficoPizza();
  renderizarGraficoLinha();
  renderizarGraficoGuardado();
  recriarGraficoModalSeAberto();
}