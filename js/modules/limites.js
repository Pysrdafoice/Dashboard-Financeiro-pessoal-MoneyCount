import { estado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import { escapeHTML } from '../ui/utils.js';
import { formatarMoeda } from '../calculos.js';
import { salvarDados } from '../persistencia.js';
import { abrirModalCategoria, obterCategoriaAtualModal } from './modal.js';

export function definirLimite() {
  const categoria = DOM.catLimite.value;
  const valor = parseFloat(DOM.valorLimite.value);

  if (!categoria) {
    alert('Selecione uma categoria.');
    return;
  }
  if (isNaN(valor) || valor <= 0) {
    alert('Digite um limite válido, maior que zero.');
    return;
  }

  estado.limites[categoria] = valor;
  salvarDados();
  renderizarListaLimites();
  DOM.formLimite.reset();
}

export function removerLimite(categoria) {
  delete estado.limites[categoria];
  salvarDados();
  renderizarListaLimites();

  if (obterCategoriaAtualModal() === categoria) {
    abrirModalCategoria(categoria);
  }
}

export function renderizarListaLimites() {
  DOM.listaLimites.innerHTML = '';

  const categorias = Object.keys(estado.limites);
  if (categorias.length === 0) {
    DOM.listaLimites.innerHTML = `<li class="limite-vazio">Nenhum limite definido ainda.</li>`;
    return;
  }

  categorias.forEach((categoria) => {
    const limite = estado.limites[categoria];
    const gastoAtual = estado.gastos
      .filter((g) => g.categoria === categoria)
      .reduce((acc, g) => acc + g.valor, 0);
    const percentual = Math.min((gastoAtual / limite) * 100, 999);

    const percClasse =
      percentual >= 100
        ? 'limite-estourou'
        : percentual >= 70
          ? 'limite-atencao'
          : '';

    const li = document.createElement('li');
    li.className = `item-limite ${percClasse}`.trim();
    li.innerHTML = `
            <span class="item-limite-nome">${escapeHTML(categoria)}</span>
            <span class="item-limite-valores">${formatarMoeda(gastoAtual)} / ${formatarMoeda(limite)}</span>
            <button class="btn-remover-limite" title="Remover limite" aria-label="Remover limite de ${escapeHTML(categoria)}">&times;</button>
        `;
    li.querySelector('.btn-remover-limite').addEventListener('click', () =>
      removerLimite(categoria),
    );
    DOM.listaLimites.appendChild(li);
  });
}
