import http from 'node:http';
import { config } from './config.js';
import { conciliateOrder, findInconsistencies, RemoteServiceError } from './services.js';

function sendJson(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  try {
    if (request.method === 'GET' && url.pathname === '/conciliacion/inconsistencias') {
      const items = await findInconsistencies();
      return sendJson(response, 200, items);
    }
    const match = url.pathname.match(/^\/conciliacion\/([^/]+)$/);
    if (request.method === 'GET' && match) {
      return sendJson(response, 200, await conciliateOrder(decodeURIComponent(match[1])));
    }
    sendJson(response, 404, { error: 'Ruta no encontrada' });
  } catch (error) {
    const status = error instanceof RemoteServiceError && error.status === 404 ? 404 : 502;
    sendJson(response, status, { error: status === 404 ? 'Orden o pago no existe' : 'No se pudo conectar a los servicios remotos' });
  }
});

server.listen(config.port, () => {
  console.log(`MS conciliacion escuchando en http://localhost:${config.port}`);
});