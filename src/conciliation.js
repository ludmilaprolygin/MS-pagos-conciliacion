export function buildConciliation(order, payments) {
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.monto || 0), 0);
  const paymentStatuses = payments.map((payment) => String(payment.estado || '').toLowerCase());
  const hasInvalidStatus = paymentStatuses.some((status) => ['pendiente', 'rechazado', 'rechazada'].includes(status));
  const amountMatches = totalPaid === Number(order.total);

  return {
    ordenId: order.id,
    totalOrden: Number(order.total),
    montoPagado: totalPaid,
    diferencia: totalPaid - Number(order.total),
    pagos: payments,
    consistente: payments.length > 0 && amountMatches && !hasInvalidStatus,
    inconsistencias: [
      ...(payments.length === 0 ? ['sin_pago'] : []),
      ...(hasInvalidStatus ? ['pago_pendiente_o_rechazado'] : []),
      ...(!amountMatches ? ['diferencia_de_monto'] : [])
    ]
  };
}

export function isInconsistent(result) {
  return !result.consistente;
}