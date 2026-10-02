import { PrismaClient } from '../generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';

// Con engineType = "client" (ver schema.prisma) Prisma ya no trae su motor
// nativo: las consultas van por el driver `pg` a través de este adaptador.
//
// Los parámetros connection_limit y connect_timeout de DATABASE_URL eran
// cosas del motor nativo; `pg` no los entiende, así que se leen aquí y se
// traducen a opciones del pool (y se quitan de la URL).
if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en el entorno (.env junto a app.js).');
}
const url = new URL(process.env.DATABASE_URL);
const connectionLimit = Number(url.searchParams.get('connection_limit'));
const connectTimeoutSeg = Number(url.searchParams.get('connect_timeout'));
url.searchParams.delete('connection_limit');
url.searchParams.delete('connect_timeout');

const adapter = new PrismaPg({
  connectionString: url.toString(),
  max: connectionLimit > 0 ? connectionLimit : 5,
  // Margen para que Neon "despierte" tras estar inactivo (10 s por defecto).
  connectionTimeoutMillis: (connectTimeoutSeg > 0 ? connectTimeoutSeg : 10) * 1000,
});

// Instancia única de Prisma para toda la app (un solo pool de conexiones).
// El dev script usa `node --watch`, que reinicia el proceso entero, así
// que no hace falta el típico guard con globalThis para hot-reload de
// módulos; si algún día se corre bajo un runner que sí recarga módulos en
// caliente, agregar ese guard aquí.
const prisma = new PrismaClient({ adapter });

export default prisma;
