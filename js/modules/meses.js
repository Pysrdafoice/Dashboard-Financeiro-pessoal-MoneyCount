/**
 * meses.js — navegação e edição de meses já fechados.
 *
 * Guarda qual mês está "em visualização": null significa o mês atual
 * (estado.gastos/estado.ganhos); uma chave "M/AAAA" significa um entry de
 * estado.historico. Os extratos, a pizza e o modal de categoria leem daqui
 * (obterContextoVisivel) em vez de irem direto no estado, então trocar o
 * mês no seletor redesenha tudo sem nenhum módulo saber da diferença.
 *
 * Este módulo só conhece estado/DOM/calculos — quem redesenha a tela após
 * mudar o mês é o orquestrador (app.js), como nos demais módulos.
 */
import { estado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import {
  parseMesChave,
  mesChaveDaData,
  formatarDataISO,
  ultimoDiaDoMes,
  entryHistoricoEditavel,
} from '../calculos.js';

let mesEmVisualizacao = null;

export function obterMesEmVisualizacao() {
  return mesEmVisualizacao;
}

/** Aceita a chave "M/AAAA" ou '' / null para voltar ao mês atual. */
export function definirMesEmVisualizacao(chave) {
  mesEmVisualizacao = chave ? chave : null;
}

export function encontrarEntryHistorico(mesChave) {
  return estado.historico.find((h) => h.mes === mesChave) || null;
}

/** Entry do historico em visualização, ou null quando é o mês atual (ou o mês sumiu do historico). */
export function obterEntryEmVisualizacao() {
  if (!mesEmVisualizacao) return null;
  const entry = encontrarEntryHistorico(mesEmVisualizacao);
  if (!entry) mesEmVisualizacao = null;
  return entry;
}

/**
 * Objeto no mesmo formato que calcularTotais() espera ({salario, gastos, ganhos}),
 * apontando para o mês atual ou para o mês fechado em visualização. Entries
 * antigos (sem itens guardados) aparecem vazios — os totais deles seguem
 * intactos nos gráficos de histórico.
 */
export function obterContextoVisivel() {
  const entry = obterEntryEmVisualizacao();
  if (!entry) return estado;
  return {
    salario: entry.salario || 0,
    gastos: Array.isArray(entry.gastos) ? entry.gastos : [],
    ganhos: Array.isArray(entry.ganhos) ? entry.ganhos : [],
  };
}

/**
 * Data que um lançamento recebe quando o campo fica vazio: hoje no mês atual;
 * num mês fechado, o último dia daquele mês (sem passar de hoje), para que
 * o item caia no mês certo ao ser roteado por data.
 */
export function dataPadraoLancamento(dataReferencia = new Date()) {
  const hoje = formatarDataISO(dataReferencia);
  const entry = obterEntryEmVisualizacao();
  if (!entry) return hoje;
  const ultimoDia = ultimoDiaDoMes(entry.mes);
  return ultimoDia < hoje ? ultimoDia : hoje;
}

/**
 * Decide para onde um gasto/ganho com determinada data vai:
 *  - se existe um mês fechado com essa chave, ele é o destino (mesmo que o
 *    seletor não esteja nele);
 *  - senão, o destino é o mês atual (retorna null).
 * Lança um erro legível quando o mês fechado não pode receber itens.
 */
export function resolverDestinoLancamento(dataISO) {
  const entry = encontrarEntryHistorico(mesChaveDaData(dataISO));
  if (!entry) return null;
  if (!entryHistoricoEditavel(entry)) {
    throw new Error(
      `O mês ${entry.mes} foi fechado antes do registro detalhado de itens e não pode receber novos lançamentos.`,
    );
  }
  return entry;
}

export function renderizarSeletorMes() {
  const ordenados = [...estado.historico].sort(
    (a, b) => parseMesChave(a.mes).ordem - parseMesChave(b.mes).ordem,
  );

  DOM.cardNavegarMes.classList.toggle('hidden', ordenados.length === 0);

  const atual = obterEntryEmVisualizacao();
  DOM.seletorMes.innerHTML = '';

  const opcaoAtual = document.createElement('option');
  opcaoAtual.value = '';
  opcaoAtual.textContent = '📍 Mês atual';
  DOM.seletorMes.appendChild(opcaoAtual);

  ordenados.forEach((h) => {
    const opcao = document.createElement('option');
    opcao.value = h.mes;
    opcao.textContent = entryHistoricoEditavel(h)
      ? `🔒 ${h.mes} (fechado)`
      : `🔒 ${h.mes} (fechado — só totais)`;
    DOM.seletorMes.appendChild(opcao);
  });

  DOM.seletorMes.value = atual ? atual.mes : '';
}

/** Badges "Mês 8/2026 (fechado)" nos títulos dos extratos e dos gráficos. */
export function renderizarBadgesMes() {
  const entry = obterEntryEmVisualizacao();
  const texto = entry ? `Mês ${entry.mes} (fechado)` : '';

  [DOM.badgeMesGastos, DOM.badgeMesGanhos, DOM.badgeMesGraficos].forEach(
    (badge) => {
      badge.textContent = texto;
      badge.classList.toggle('hidden', !entry);
    },
  );

  DOM.avisoMesFechado.classList.toggle('hidden', !entry);
  if (entry) {
    DOM.avisoMesFechado.textContent = entryHistoricoEditavel(entry)
      ? `Você está vendo o mês ${entry.mes}, já fechado. Adicionar ou excluir itens aqui recalcula os totais desse mês nos gráficos de histórico.`
      : `O mês ${entry.mes} foi fechado antes do registro detalhado — só os totais estão disponíveis e ele não pode ser editado.`;
  }
}
