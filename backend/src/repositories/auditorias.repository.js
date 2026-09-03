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

export default { createAudit, all, findById };
