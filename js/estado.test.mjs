import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizarEstado } from './estado.js';

test('normalizarEstado conserva dados antigos e remove lançamentos inválidos', () => {
  const estado = normalizarEstado({
    salario: 1200,
    gastos: [
      { descricao: 'Antigo sem data', categoria: 'Moradia', valor: 100 },
      { descricao: 'Valor inválido', valor: '100' },
      { descricao: 'Valor negativo', valor: -1 },
    ],
    ganhos: [{ descricao: 'Extra antigo', valor: 0 }],
    historico: [
      { mes: '1/2025', salario: 1200, totalGastos: 100 },
      {},
    ],
  });

  assert.equal(estado.salario, 1200);
  assert.equal(estado.gastos.length, 1);
  assert.equal(estado.gastos[0].descricao, 'Antigo sem data');
  assert.equal(estado.gastos[0].data, undefined);
  assert.equal(typeof estado.gastos[0].id, 'string');
  assert.equal(estado.ganhos.length, 1);
  assert.equal(estado.ganhos[0].valor, 0);
  assert.deepEqual(estado.historico, [
    {
      mes: '1/2025',
      salario: 1200,
      totalGastos: 100,
      totalGanhosExtras: 0,
      rendaTotal: 1200,
    },
  ]);
});

test('normalizarEstado descarta data ISO inválida e itens incompatíveis', () => {
  const estado = normalizarEstado({
    gastos: [
      { descricao: 'Data impossível', valor: 10, data: '2025-02-29' },
      { descricao: 'Data correta', valor: 20, data: '2024-02-29' },
    ],
  });

  assert.equal(estado.gastos.length, 2);
  assert.equal(estado.gastos[0].data, undefined);
  assert.equal(estado.gastos[1].data, '2024-02-29');
});
