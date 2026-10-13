import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConciliation, isInconsistent, toInconsistency } from '../src/conciliation.js';

const order = { id: 'ORD001', total: 100 };

test('marca consistente un pago aprobado por el total exacto', () => {
  const result = buildConciliation(order, [{ id: 'PAG001', monto: 100, estado: 'aprobado' }]);
  assert.equal(result.estado, 'conciliado');
  assert.equal(result.pagadoTotal, 100);
  assert.equal(result.diferencia, 0);
});

test('marca inconsistencia cuando el pago está pendiente o rechazado', () => {
  const result = buildConciliation(order, [{ id: 'PAG001', monto: 100, estado: 'pendiente' }]);
  assert.equal(isInconsistent(result), true);
  assert.equal(result.pagadoTotal, 0);
  assert.deepEqual(toInconsistency(result), {
    ordenId: 'ORD001', estado: 'pendiente', monto: 100, pagado: 0, diferencia: -100, tipo: 'sin_pagar'
  });
});

test('marca inconsistencia cuando el monto no coincide', () => {
  const result = buildConciliation(order, [{ id: 'PAG001', monto: 90, estado: 'aprobado' }]);
  assert.equal(result.estado, 'sin_conciliar');
  assert.equal(result.diferencia, -10);
  assert.equal(toInconsistency(result).tipo, 'pago_incompleto');
});