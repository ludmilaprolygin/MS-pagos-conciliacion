export function buildConciliation(order, payments) {
  const completedStatuses = ['aprobado', 'completado', 'confirmado'];
  const totalOrder = Number(order.total);
  const completedPayments = payments.filter((payment) => completedStatuses.includes(String(payment.estado || '').toLowerCase()));
  const totalPaid = completedPayments.reduce((sum, payment) => sum + Number(payment.monto || 0), 0);
  const paymentStatuses = payments.map((payment) => String(payment.estado || '').toLowerCase());
  const hasRejectedOrPending = paymentStatuses.some((status) => ['pendiente', 'rechazado', 'rechazada'].includes(status));
  const amountMatches = totalPaid === totalOrder;

  return {
    ordenId: order.id,
    pagadoTotal: totalPaid,
    totalOrden: totalOrder,
    estado: amountMatches && !hasRejectedOrPending ? 'conciliado' : 'sin_conciliar',
    diferencia: totalPaid - totalOrder,
    detalles: payments.map((payment) => ({
      pagoId: payment.id,
      monto: Number(payment.monto || 0),
      estado: payment.estado,
      fecha: payment.fecha
    }))
  };
}

export function isInconsistent(result) {
  return result.estado !== 'conciliado';
}

export function toInconsistency(result) {
  const rejected = result.detalles.find((payment) => ['rechazado', 'rechazada'].includes(String(payment.estado || '').toLowerCase()));
  const pending = result.detalles.find((payment) => String(payment.estado || '').toLowerCase() === 'pendiente');
  const payment = rejected || pending;
  const state = payment?.estado || (result.pagadoTotal === 0 ? 'pendiente' : 'parcial');
  const type = rejected ? 'pago_rechazado' : result.pagadoTotal === 0 ? 'sin_pagar' : 'pago_incompleto';

  return {
    ordenId: result.ordenId,
    estado: state,
    monto: result.totalOrden,
    pagado: result.pagadoTotal,
    diferencia: result.diferencia,
    tipo: type
  };
}