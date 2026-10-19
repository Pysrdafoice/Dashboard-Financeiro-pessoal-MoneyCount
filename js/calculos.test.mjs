import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calcularTotais,
  fecharMesEstado,
  filtrarGanhosAposFechamento,
  filtrarGastosAposFechamento,
  ehDataISOValida,
  recalcularTotaisDoMes,
} from './calculos.js';

test('fechamento de mês registra o histórico e aplica transições uma única vez', () => {
  const estado = {
    salario: 3200,
    gastos: [
      { id: 'unico', valor: 30, tipo: 'pontual' },
      { id: 'fixo', valor: 50, tipo: 'fixo' },
      {
        id: 'parcela',
        valor: 70,
        tipo: 'parcelado',
        parcelasRestantes: 3,
        parcelasTotal: 4,
      },
    ],
    ganhos: [
      { id: 'extra', valor: 100, tipo: 'pontual' },
      { id: 'recorrente', valor: 200, tipo: 'fixo' },
    ],
    historico: [],
  };

  assert.equal(fecharMesEstado(estado, '10/2026'), true);
  assert.equal(estado.historico.length, 1);
  assert.equal(estado.historico[0].totalGastos, 150);
  assert.equal(estado.historico[0].rendaTotal, 3500);
  assert.deepEqual(
    estado.gastos.map(({ id, parcelasRestantes }) => [id, parcelasRestantes]),
    [
      ['fixo', undefined],
      ['parcela', 2],
    ],
  );
  assert.deepEqual(estado.ganhos.map(({ id }) => id), ['recorrente']);

  assert.equal(fecharMesEstado(estado, '10/2026'), false);
  assert.equal(estado.historico.length, 1);
  assert.equal(estado.gastos[1].parcelasRestantes, 2);
});

test('filtrar lançamentos preserva fixos e decrementa parcelas sem mutar originais', () => {
  const gastos = [
    { tipo: 'pontual' },
    { tipo: 'fixo' },
    { tipo: 'parcelado', parcelasRestantes: 2, parcelasTotal: 2 },
    { tipo: 'parcelado', parcelasRestantes: 1, parcelasTotal: 2 },
  ];
  const filtrados = filtrarGastosAposFechamento(gastos);

  assert.deepEqual(filtrados, [
    { tipo: 'fixo' },
    { tipo: 'parcelado', parcelasRestantes: 1, parcelasTotal: 2 },
  ]);
  assert.equal(gastos[2].parcelasRestantes, 2);
  assert.deepEqual(
    filtrarGanhosAposFechamento([
      { tipo: 'pontual' },
      { tipo: 'fixo' },
    ]),
    [{ tipo: 'fixo' }],
  );
});

test('recalcularTotaisDoMes preserva os totais derivados das transações', () => {
  const entry = {
    mes: '9/2026',
    salario: 3000,
    gastos: [{ valor: 120 }, { valor: 80 }],
    ganhos: [{ valor: 250 }],
  };

  assert.equal(recalcularTotaisDoMes(entry), entry);
  assert.equal(entry.totalGastos, 200);
  assert.equal(entry.totalGanhosExtras, 250);
  assert.equal(entry.rendaTotal, 3250);
  assert.deepEqual(calcularTotais(entry), {
    totalGastos: 200,
    totalGanhosExtras: 250,
    rendaTotal: 3250,
    saldoRestante: 3050,
  });
});

test('validar data ISO rejeita datas impossíveis', () => {
  assert.equal(ehDataISOValida('2024-02-29'), true);
  assert.equal(ehDataISOValida('2025-02-29'), false);
  assert.equal(ehDataISOValida('2026-13-01'), false);
  assert.equal(ehDataISOValida('2026-01-00'), false);
});
