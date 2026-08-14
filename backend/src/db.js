import { PrismaClient } from '../generated/prisma/client.ts';

// Instancia única de Prisma para toda la app.
// Evita crear múltiples conexiones en entornos con hot-reload.
const prisma = new PrismaClient();

export default prisma;