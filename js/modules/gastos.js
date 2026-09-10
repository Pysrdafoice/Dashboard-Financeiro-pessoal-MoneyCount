import { estado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import { escapeHTML } from '../ui/utils.js';
import { formatarMoeda, registrarAtividadeStreak } from '../calculos.js';
import { pegarIconeCategoria } from './categorias.js';
import { salvarDados } from '../persistencia.js';
import {
  fecharModal,
  abrirModalCategoria,
  obterCategoriaAtualModal,
} from './modal.js';

export function adicionarGasto() {
  const valor = parseFloat(DOM.valorGasto.value);
  const descricao = DOM.descGasto.value.trim();
  const tipo = DOM.tipoGasto.value;

  if (!descricao) {
    alert('Digite uma descrição para o gasto.');
    return false;
  }
  if (isNaN(valor) || valor <= 0) {
    alert('Digite um valor válido, maior que zero.');
    return false;
  }
  if (!DOM.catGasto.value) {
    alert('Selecione uma categoria.');
    return false;
  }

  const novoGasto = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    descricao: descricao,
    categoria: DOM.catGasto.value,
    valor: valor,
    tipo: tipo,
  };

  if (tipo === 'parcelado') {
    const parcelas = parseInt(DOM.parcelasGasto.value, 10);
    if (isNaN(parcelas) || parcelas < 2) {
      alert('Informe o número total de parcelas (mínimo 2).');
      return false;
    }
    novoGasto.parcelasRestantes = parcelas;
    novoGasto.parcelasTotal = parcelas;
  }

  estado.gastos.push(novoGasto);
  registrarAtividadeStreak(estado.streak);
  salvarDados();
  DOM.formGasto.reset();
  DOM.parcelasGasto.classList.add('hidden');
  return true;
}

export function removerGasto(id) {
  estado.gastos = estado.gastos.filter((g) => g.id !== id);
  salvarDados();

  const categoriaAtualModal = obterCategoriaAtualModal();
  if (!DOM.modalOverlay.classList.contains('hidden') && categoriaAtualModal) {
    const restantes = estado.gastos.filter(
      (g) => g.categoria === categoriaAtualModal,
    );
    if (restantes.length === 0) {
      fecharModal();
    } else {
      abrirModalCategoria(categoriaAtualModal);
    }
  }
}

export function renderizarExtrato(atualizarInterface) {
  DOM.listaTransacoes.innerHTML = '';

  if (estado.gastos.length === 0) {
    DOM.listaTransacoes.innerHTML = `
      <div class="transacao-vazio">Nenhum gasto cadastrado.</div>
    `;
    return;
  }

  estado.gastos.forEach((gasto) => {
    const card = document.createElement('article');
    const icone = pegarIconeCategoria(gasto.categoria);
    const selo = pegarSeloTipoGasto(gasto);
    card.className = 'transacao-card';
    card.innerHTML = `
      <div class="transacao-card__icon" aria-hidden="true">${icone}</div>
      <div class="transacao-card__info">
        <strong>${escapeHTML(gasto.descricao)}${selo}</strong>
        <span>${escapeHTML(gasto.categoria)}</span>
      </div>
      <div class="transacao-card__valor">
        <strong>${formatarMoeda(gasto.valor)}</strong>
        <button class="btn-secondary btn-remover-transacao" title="Excluir gasto" aria-label="Excluir gasto de ${escapeHTML(gasto.descricao)}">Excluir</button>
      </div>
    `;

    card
      .querySelector('.btn-remover-transacao')
      .addEventListener('click', () => {
        removerGasto(gasto.id);
        atualizarInterface();
      });

    DOM.listaTransacoes.appendChild(card);
  });
}

function pegarSeloTipoGasto(gasto) {
  if (gasto.tipo === 'fixo') {
    return ' <span class="selo-tipo selo-fixo">Fixo</span>';
  }
  if (gasto.tipo === 'parcelado') {
    return ` <span class="selo-tipo selo-parcelado">${gasto.parcelasRestantes}/${gasto.parcelasTotal}</span>`;
  }
  return '';
}
