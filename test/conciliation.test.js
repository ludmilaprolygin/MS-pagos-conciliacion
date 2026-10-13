import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConciliation, isInconsistent } from '../src/conciliation.js';

const order = { id: 'ORD001', total: 100 };

test('marca consistente un pago aprobado por el total exacto', () => {
  const result = buildConciliation(order, [{ id: 'PAG001', monto: 100, estado: 'aprobado' }]);
  assert.equal(result.consistente, true);
  assert.equal(result.diferencia, 0);
});

test('marca inconsistencia cuando el pago está pendiente o rechazado', () => {
  const result = buildConciliation(order, [{ id: 'PAG001', monto: 100, estado: 'pendiente' }]);
  assert.equal(isInconsistent(result), true);
  assert.deepEqual(result.inconsistencias, ['pago_pendiente_o_rechazado']);
});

test('marca inconsistencia cuando el monto no coincide', () => {
  const result = buildConciliation(order, [{ id: 'PAG001', monto: 90, estado: 'aprobado' }]);
  assert.deepEqual(result.inconsistencias, ['diferencia_de_monto']);
  assert.equal(result.diferencia, -10);
});