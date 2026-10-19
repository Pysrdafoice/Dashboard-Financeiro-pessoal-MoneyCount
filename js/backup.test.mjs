import assert from 'node:assert/strict';
import test from 'node:test';
import { estado, estadoVazio, substituirEstado } from './estado.js';

const elementos = new Map();
globalThis.document = {
  getElementById: (id) => {
    if (!elementos.has(id)) {
      elementos.set(id, {
        classList: {
          add() {},
          remove() {},
        },
        value: '',
      });
    }
    return elementos.get(id);
  },
  querySelectorAll: () => [],
};

const { escaparCampoCsv, importarBackup, validarBackup } = await import(
  './modules/backup.js'
);

const backupCompleto = {
  salario: 1500,
  gastos: [],
  ganhos: [],
  historico: [],
  limites: {},
  poupanca: [],
};

test('validarBackup aceita o formato completo e backups antigos sem campos novos', () => {
  assert.equal(validarBackup(backupCompleto), true);
  assert.equal(
    validarBackup({
      salario: 1500,
      gastos: [{ descricao: 'Despesa antiga', valor: 25, categoria: 'Casa' }],
      ganhos: [],
      historico: [{ mes: '2/2025', salario: 1500, totalGastos: 25 }],
    }),
    true,
  );
});

test('validarBackup rejeita objetos sem estrutura financeira suficiente', () => {
  assert.equal(validarBackup({}), false);
  assert.equal(validarBackup({ salario: 1500 }), false);
  assert.equal(validarBackup(null), false);
  assert.equal(validarBackup([]), false);
});

test('validarBackup valida transações, datas, tipo e parcelas', () => {
  const backup = (gasto) => ({
    gastos: [gasto],
    ganhos: [],
  });

  assert.equal(validarBackup(backup({ valor: 0 })), true);
  assert.equal(validarBackup(backup({ valor: -1 })), false);
  assert.equal(validarBackup(backup({ valor: '10' })), false);
  assert.equal(validarBackup(backup({ valor: 10, data: '2025-02-29' })), false);
  assert.equal(validarBackup(backup({ valor: 10, data: '2024-02-29' })), true);
  assert.equal(validarBackup(backup({ valor: 10, tipo: 'desconhecido' })), false);
  assert.equal(
    validarBackup(
      backup({
        valor: 10,
        tipo: 'parcelado',
        parcelasTotal: 4,
        parcelasRestantes: 5,
      }),
    ),
    false,
  );
  assert.equal(
    validarBackup(
      backup({
        valor: 10,
        tipo: 'parcelado',
        parcelasTotal: 4,
        parcelasRestantes: 3,
      }),
    ),
    true,
  );
});

test('validarBackup rejeita estrutura inválida de histórico, limites e poupança', () => {
  assert.equal(validarBackup({ historico: [{}] }), false);
  assert.equal(validarBackup({ limites: { Moradia: '100' } }), false);
  assert.equal(validarBackup({ poupanca: [{}] }), false);
  assert.equal(
    validarBackup({
      historico: [
        {
          mes: '2/2025',
          salario: 1000,
          totalGastos: 50,
        },
      ],
    }),
    true,
  );
});

test('escaparCampoCsv neutraliza fórmulas e preserva escape CSV', () => {
  assert.equal(escaparCampoCsv('=1+1'), "'=1+1");
  assert.equal(escaparCampoCsv('+cmd'), "'+cmd");
  assert.equal(escaparCampoCsv('-cmd'), "'-cmd");
  assert.equal(escaparCampoCsv('@SUM(A1)'), "'@SUM(A1)");
  assert.equal(escaparCampoCsv('=1;2'), '"\'=1;2"');
  assert.equal(escaparCampoCsv('linha\n"2"'), '"linha\n""2"""');
});

test('importarBackup reverte o estado e reporta erro se não conseguir persistir', async () => {
  const estadoOriginal = { ...estadoVazio(), salario: 800 };
  substituirEstado(estadoOriginal);

  const setTimeoutOriginal = globalThis.setTimeout;
  const localStorageOriginal = globalThis.localStorage;
  const windowOriginal = globalThis.window;
  const confirmOriginal = globalThis.confirm;
  const fileReaderOriginal = globalThis.FileReader;
  const consoleErrorOriginal = console.error;
  globalThis.setTimeout = () => 1;
  globalThis.localStorage = {
    setItem() {
      throw new Error('QuotaExceededError');
    },
  };
  globalThis.window = { dispatchEvent() {} };
  globalThis.confirm = () => true;
  console.error = () => {};
  globalThis.FileReader = class {
    readAsText() {
      this.onload({
        target: {
          result: JSON.stringify({
            salario: 2500,
            gastos: [],
          }),
        },
      });
    }
  };

  try {
    const resultado = await importarBackup({
      target: { files: [{}] },
    });
    assert.equal(resultado, false);
    assert.equal(estado.salario, 800);
    assert.match(
      elementos.get('backup-status').textContent,
      /dados anteriores foram mantidos/,
    );
  } finally {
    globalThis.setTimeout = setTimeoutOriginal;
    globalThis.localStorage = localStorageOriginal;
    globalThis.window = windowOriginal;
    globalThis.confirm = confirmOriginal;
    globalThis.FileReader = fileReaderOriginal;
    console.error = consoleErrorOriginal;
  }
});
