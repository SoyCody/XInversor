import { PrismaClient } from '../generated/prisma/client.ts';

// Instancia única de Prisma para toda la app (un solo pool de conexiones).
// El dev script usa `node --watch`, que reinicia el proceso entero, así
// que no hace falta el típico guard con globalThis para hot-reload de
// módulos; si algún día se corre bajo un runner que sí recarga módulos en
// caliente, agregar ese guard aquí.
const prisma = new PrismaClient();

export default prisma;