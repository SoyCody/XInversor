import prisma from '../db.js';
import { toPrismaRange } from '../utils/pagination.js';

const createAudit = ({ userId, action, tableName, targetId }) => {
  return prisma.audit.create({
    data: { userId, action, tableName, targetId }
  });
};

const all = async (page = 1) => {
  const [rows, total] = await prisma.$transaction([
    prisma.audit.findMany({
      orderBy: { createdAt: 'desc' },
      ...toPrismaRange(page),
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    }),
    prisma.audit.count()
  ]);

  return { rows, total };
};

const findById = (id) => {
  return prisma.audit.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          role: true,
          email: true
        }
      }
    }
  });
};

// Busca en bloque las auditorías CREATE de un conjunto de paquetes o
// solicitudes nuevas, para que las notificaciones del admin puedan
// enlazar a "Ver auditoría" sin pedirla una por una (ver
// notification.service.js). `tableName` + `action` + `targetId` ubica una
// fila única porque cada paquete o solicitud solo se crea una vez.
const findByTargets = (tableName, action, targetIds) => {
  if (targetIds.length === 0) return Promise.resolve([]);

  return prisma.audit.findMany({
    where: { tableName, action, targetId: { in: targetIds } },
    select: { id: true, targetId: true }
  });
};

export default { createAudit, all, findById, findByTargets };
