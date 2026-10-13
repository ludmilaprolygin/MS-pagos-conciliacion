import { config } from './config.js';
import { buildConciliation, isInconsistent, toInconsistency } from './conciliation.js';

export class RemoteServiceError extends Error {
  constructor(status, url) {
    super(`Servicio remoto respondió ${status}: ${url}`);
    this.status = status;
  }
}

async function getJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new RemoteServiceError(response.status, url);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function getAllItems(baseUrl) {
  const items = [];
  const limit = 100;
  let offset = 0;

  while (true) {
    const page = await getJson(`${baseUrl}/items?limit=${limit}&offset=${offset}`);
    const pageItems = Array.isArray(page) ? page : page.items;
    if (!Array.isArray(pageItems)) throw new Error(`Respuesta inválida de ${baseUrl}/items`);
    items.push(...pageItems);
    if (pageItems.length < limit && items.length >= (page.total ?? items.length)) return items;
    offset += pageItems.length;
    if (pageItems.length === 0) return items;
  }
}

export async function getOrder(orderId) {
  return getJson(`${config.ordenesUrl}/items/${encodeURIComponent(orderId)}`);
}

export async function getPaymentsForOrder(orderId) {
  const response = await getJson(`${config.pagosUrl}/items?ordenId=${encodeURIComponent(orderId)}`);
  return Array.isArray(response) ? response : response.items;
}

export async function conciliateOrder(orderId) {
  const [order, payments] = await Promise.all([getOrder(orderId), getPaymentsForOrder(orderId)]);
  return buildConciliation(order, payments);
}

export async function findInconsistencies() {
  // Trae ambos listados paginados y concilia en memoria, en lugar de pedir cada orden por separado
  const [payments, orders] = await Promise.all([getAllItems(config.pagosUrl), getAllItems(config.ordenesUrl)]);
  const ordersById = new Map(orders.map((order) => [order.id, order]));
  const paymentsByOrder = new Map();
  for (const payment of payments) {
    if (!payment.ordenId) continue;
    if (!paymentsByOrder.has(payment.ordenId)) paymentsByOrder.set(payment.ordenId, []);
    paymentsByOrder.get(payment.ordenId).push(payment);
  }

  return [...paymentsByOrder]
    .filter(([orderId]) => ordersById.has(orderId))
    .map(([orderId, orderPayments]) => buildConciliation(ordersById.get(orderId), orderPayments))
    .filter(isInconsistent)
    .map(toInconsistency);
}