import { estado } from '../estado.js';
import { DOM } from '../ui/dom.js';
import { escapeHTML } from '../ui/utils.js';
import {
  formatarMoeda,
  calcularSaldoPoupanca,
  calcularTotais,
  calcularMovimentoPoupancaMesAtual,
} from '../calculos.js';
import { salvarDados } from '../persistencia.js';
import { renderizarGraficoGuardado } from './graficos.js';

export function registrarMovimentoPoupanca() {
  const tipo = DOM.tipoPoupanca.value;
  const valor = parseFloat(DOM.valorPoupanca.value);
  const descricao = DOM.descPoupanca.value.trim();

  if (isNaN(valor) || valor <= 0) {
    alert('Digite um valor válido, maior que zero.');
    return;
  }

  if (tipo === 'retirada' && valor > calcularSaldoPoupanca(estado.poupanca)) {
    alert('Você não pode retirar mais do que tem guardado.');
    return;
  }

  estado.poupanca.push({
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    tipo: tipo,
    valor: valor,
    descricao: descricao || (tipo === 'deposito' ? 'Depósito' : 'Retirada'),
    data: new Date().toISOString(),
  });

  salvarDados();
  renderizarPoupanca();
  DOM.formPoupanca.reset();
}

export function removerMovimentoPoupanca(id) {
  estado.poupanca = estado.poupanca.filter((mov) => mov.id !== id);
  salvarDados();
  renderizarPoupanca();
}

export function atualizarSaldoLivre() {
  const { saldoRestante } = calcularTotais(estado);
  const movimentoMes = calcularMovimentoPoupancaMesAtual(estado.poupanca);

  if (movimentoMes === 0) {
    DOM.resumoItemLivre.classList.add('hidden');
    DOM.resumoDivisorLivre.classList.add('hidden');
    return;
  }

  const saldoLivre = saldoRestante - movimentoMes;
  DOM.resSaldoLivre.textContent = formatarMoeda(saldoLivre);
  DOM.resSaldoLivre.className =
    saldoLivre >= 0 ? 'text-success' : 'text-danger';
  DOM.resumoItemLivre.classList.remove('hidden');
  DOM.resumoDivisorLivre.classList.remove('hidden');
}

export function renderizarPoupanca() {
  DOM.poupancaSaldo.textContent = formatarMoeda(
    calcularSaldoPoupanca(estado.poupanca),
  );
  atualizarSaldoLivre();
  renderizarGraficoGuardado();

  DOM.listaPoupanca.innerHTML = '';

  if (estado.poupanca.length === 0) {
    DOM.listaPoupanca.innerHTML =
      '<li class="poupanca-vazio">Nenhum movimento registrado ainda.</li>';
    return;
  }

  [...estado.poupanca].reverse().forEach((mov) => {
    const ehDeposito = mov.tipo === 'deposito';
    const icone = ehDeposito ? '⬆️' : '⬇️';
    const sinal = ehDeposito ? '+' : '−';

    const li = document.createElement('li');
    li.className = `poupanca-item ${mov.tipo}`;
    li.innerHTML = `
      <div class="poupanca-item-icone">${icone}</div>
      <span class="poupanca-item-info">${escapeHTML(mov.descricao)}</span>
      <span class="poupanca-item-valor">${sinal} ${formatarMoeda(mov.valor)}</span>
      <button class="btn-remover-poupanca" title="Remover" aria-label="Remover movimento ${escapeHTML(mov.descricao)}">&times;</button>
    `;
    li.querySelector('.btn-remover-poupanca').addEventListener('click', () =>
      removerMovimentoPoupanca(mov.id),
    );
    DOM.listaPoupanca.appendChild(li);
  });
}
