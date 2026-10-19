import assert from 'node:assert/strict';
import test from 'node:test';
import { estadoVazio, normalizarEstado, substituirEstado } from './estado.js';
import { formatarDataISO } from './calculos.js';

globalThis.document = {
  getElementById: () => ({}),
  querySelectorAll: () => [],
};

const { resolverDestinoLancamento } = await import('./modules/meses.js');

test('resolverDestinoLancamento cancela retroativos sem histórico e preserva meses editáveis', () => {
  const hoje = new Date();
  const dataAtual = formatarDataISO(hoje);
  const dataMesAnterior = formatarDataISO(
    new Date(hoje.getFullYear(), hoje.getMonth() - 1, 15),
  );
  const estado = estadoVazio();
  substituirEstado(normalizarEstado(estado));

  assert.equal(resolverDestinoLancamento(dataAtual), null);
  assert.throws(
    () => resolverDestinoLancamento(dataMesAnterior),
    /Não há histórico disponível/,
  );

  const [ano, mes] = dataMesAnterior.split('-');
  const chaveMesAnterior = `${Number(mes)}/${ano}`;
  const entry = {
    mes: chaveMesAnterior,
    salario: 0,
    gastos: [],
    ganhos: [],
  };
  estado.historico.push(entry);
  substituirEstado(estado);
  assert.equal(resolverDestinoLancamento(dataMesAnterior), entry);
});
