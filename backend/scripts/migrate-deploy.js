// Aplica las migraciones pendientes (`prisma migrate deploy`) contra la
// base de producción (Neon) DESDE TU PC, usando la conexión DIRECTA.
//
//   npm run migrate:deploy
//
// Por qué existe: la CLI de Prisma (v6) toma la URL del schema.prisma
// (env DATABASE_URL). En producción DATABASE_URL es la URL "pooled" de
// Neon (la que usa la app), pero las migraciones necesitan la URL directa
// (sin "-pooler"). Este script lee DIRECT_URL de backend/.env, la pone
// como DATABASE_URL SOLO para este proceso y lanza prisma. No modifica
// ningún archivo.
import './../src/loadEnv.js';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const direct = process.env.DIRECT_URL;

if (!direct) {
  console.error(
    'Falta DIRECT_URL en backend/.env.\n' +
    'Es la URL de Neon SIN "-pooler" en el host (Neon > Connect > desactivar "Connection pooling").'
  );
  process.exit(1);
}

let url;
try {
  url = new URL(direct);
} catch {
  console.error('DIRECT_URL no es una URL válida (¿caracteres especiales sin codificar en la contraseña?).');
  process.exit(1);
}

const esLocal = ['localhost', '127.0.0.1'].includes(url.hostname);

if (url.hostname.includes('-pooler')) {
  console.error(
    `DIRECT_URL apunta al pooler (${url.hostname}). Las migraciones necesitan la conexión directa:\n` +
    'quita "-pooler" del host.'
  );
  process.exit(1);
}
if (!esLocal && !['require', 'verify-full', 'verify-ca'].includes(url.searchParams.get('sslmode'))) {
  console.error('DIRECT_URL debe llevar ?sslmode=require para conectar por SSL.');
  process.exit(1);
}

// Solo se muestra host y base (nunca usuario ni contraseña).
console.log(`Aplicando migraciones en ${url.hostname}${url.pathname} ...`);

const prismaCli = createRequire(import.meta.url).resolve('prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: direct },
});

process.exit(result.status ?? 1);
