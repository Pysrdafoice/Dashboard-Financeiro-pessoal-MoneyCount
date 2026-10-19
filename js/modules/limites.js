import { estado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import { escapeHTML } from '../ui/utils.js';
import { formatarMoeda } from '../calculos.js';
import { salvarDados } from '../persistencia.js';
import { abrirModalCategoria, obterCategoriaAtualModal } from './modal.js';
import { obterContextoVisivel } from './meses.js';

export function definirLimite() {
  const categoria = DOM.catLimite.value;
  const valor = parseFloat(DOM.valorLimite.value);

  if (!categoria) {
    alert('Selecione uma categoria.');
    return false;
  }
  if (isNaN(valor) || valor <= 0) {
    alert('Digite um limite válido, maior que zero.');
    return false;
  }

  const tinhaLimite = Object.prototype.hasOwnProperty.call(
    estado.limites,
    categoria,
  );
  const limiteAnterior = estado.limites[categoria];
  estado.limites[categoria] = valor;
  if (!salvarDados()) {
    if (tinhaLimite) estado.limites[categoria] = limiteAnterior;
    else delete estado.limites[categoria];
    return false;
  }
  renderizarListaLimites();
  DOM.formLimite.reset();
  return true;
}

export function removerLimite(categoria) {
  const limiteAnterior = estado.limites[categoria];
  delete estado.limites[categoria];
  if (!salvarDados()) {
    estado.limites[categoria] = limiteAnterior;
    return false;
  }
  renderizarListaLimites();

  if (obterCategoriaAtualModal() === categoria) {
    abrirModalCategoria(categoria);
  }
  return true;
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
    const gastoAtual = obterContextoVisivel().gastos
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
