import assert from 'node:assert/strict';
import test from 'node:test';

const eventos = [];
globalThis.window = {
  dispatchEvent(evento) {
    eventos.push(evento);
    return true;
  },
};
globalThis.localStorage = {
  setItem() {},
};
if (!globalThis.CustomEvent) {
  globalThis.CustomEvent = class extends Event {
    constructor(tipo, opciones = {}) {
      super(tipo);
      this.detail = opciones.detail;
    }
  };
}

const { salvarDados } = await import('./persistencia.js');

test('salvarDados retorna true quando localStorage grava com sucesso', () => {
  assert.equal(salvarDados(), true);
  assert.equal(eventos.at(-1).type, 'fuelcount:persistencia-ok');
});

test('salvarDados retorna false e emite erro se localStorage falhar', () => {
  const originalError = console.error;
  console.error = () => {};
  globalThis.localStorage.setItem = () => {
    throw new Error('QuotaExceededError');
  };

  try {
    assert.equal(salvarDados(), false);
    assert.equal(eventos.at(-1).type, 'fuelcount:persistencia-erro');
    assert.equal(eventos.at(-1).detail.permanente, false);
  } finally {
    console.error = originalError;
  }
});
