import { estado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import { escapeHTML } from '../ui/utils.js';
import { formatarMoeda, registrarAtividadeStreak } from '../calculos.js';
import { pegarIconeCategoriaGanho } from './categorias.js';
import { salvarDados } from '../persistencia.js';

export function adicionarGanho() {
  const valor = parseFloat(DOM.valorGanho.value);
  const descricao = DOM.descGanho.value.trim();
  const tipo = DOM.tipoGanho.value;

  if (!descricao) {
    alert('Digite uma descrição para o ganho.');
    return false;
  }
  if (isNaN(valor) || valor <= 0) {
    alert('Digite um valor válido, maior que zero.');
    return false;
  }
  if (!DOM.catGanho.value) {
    alert('Selecione uma categoria.');
    return false;
  }

  estado.ganhos.push({
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    descricao: descricao,
    categoria: DOM.catGanho.value,
    valor: valor,
    tipo: tipo,
  });

  registrarAtividadeStreak(estado.streak);
  salvarDados();
  DOM.formGanho.reset();
  return true;
}

export function removerGanho(id) {
  estado.ganhos = estado.ganhos.filter((g) => g.id !== id);
  salvarDados();
}

export function renderizarExtratoGanhos(atualizarInterface) {
  DOM.listaGanhos.innerHTML = '';

  if (estado.ganhos.length === 0) {
    DOM.listaGanhos.innerHTML = `
      <div class="transacao-vazio">Nenhum ganho cadastrado.</div>
    `;
    return;
  }

  estado.ganhos.forEach((ganho) => {
    const card = document.createElement('article');
    const icone = pegarIconeCategoriaGanho(ganho.categoria);
    const selo =
      ganho.tipo === 'fixo'
        ? ' <span class="selo-tipo selo-fixo">Fixo</span>'
        : '';
    card.className = 'transacao-card transacao-card--ganho';
    card.innerHTML = `
      <div class="transacao-card__icon" aria-hidden="true">${icone}</div>
      <div class="transacao-card__info">
        <strong>${escapeHTML(ganho.descricao)}${selo}</strong>
        <span>${escapeHTML(ganho.categoria)}</span>
      </div>
      <div class="transacao-card__valor">
        <strong>+ ${formatarMoeda(ganho.valor)}</strong>
        <button class="btn-secondary btn-remover-transacao" title="Excluir ganho" aria-label="Excluir ganho de ${escapeHTML(ganho.descricao)}">Excluir</button>
      </div>
    `;

    card
      .querySelector('.btn-remover-transacao')
      .addEventListener('click', () => {
        removerGanho(ganho.id);
        atualizarInterface();
      });

    DOM.listaGanhos.appendChild(card);
  });
}
