import fs from 'node:fs';

function readEnvFile() {
  const values = {};
  if (!fs.existsSync('.env')) return values;

  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !match[1].startsWith('#')) values[match[1]] = match[2];
  }
  return values;
}

const fileEnv = readEnvFile();
const env = (key, fallback) => process.env[key] ?? fileEnv[key] ?? fallback;

export const config = {
  port: Number(env('PORT', '3000')),
  pagosUrl: env('PAGOS_URL', 'https://ms-pagos-5qjo.onrender.com').replace(/\/$/, ''),
  ordenesUrl: env('ORDENES_URL', 'https://orders-ms.onrender.com').replace(/\/$/, ''),
  timeoutMs: Number(env('HTTP_TIMEOUT_MS', '10000'))
};