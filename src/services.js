import { config } from './config.js';
import { buildConciliation } from './conciliation.js';

async function getJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Servicio remoto respondió ${response.status}: ${url}`);
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
  const payments = await getAllItems(config.pagosUrl);
  const orderIds = [...new Set(payments.map((payment) => payment.ordenId).filter(Boolean))];
  const results = await Promise.all(orderIds.map((orderId) => conciliateOrder(orderId)));
  return results.filter((result) => result.inconsistencias.length > 0);
}