# pagos-conciliacion

Microservicio que compara los pagos del servicio configurado en `PAGOS_URL` con el total de una orden de `ORDENES_URL`.

## Ejecutar

```bash
npm test
npm start
```

La base local es `http://localhost:3000`. Las URLs de los servicios upstream están en `.env` y el formato se puede copiar desde `.env.example`.

## Endpoints

```text
GET /conciliacion/{ordenId}
GET /conciliacion/inconsistencias
```

La primera ruta devuelve `404` si el servicio remoto no encuentra la orden o el pago, y `502` si no puede comunicarse con los servicios remotos.

Para desplegarlo, se debe crear un servicio separado para este repositorio. Las URLs `ms-pagos-5qjo.onrender.com` y `orders-ms.onrender.com` son dependencias, no la URL de este microservicio.