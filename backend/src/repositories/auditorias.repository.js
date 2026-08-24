import prisma from '../db.js';

const createAudit = ({ userId, action, tableName, targetId }) => {
  return prisma.audit.create({
    data: { userId, action, tableName, targetId }
  });
};

const all = () => {
  return prisma.audit.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          role: true
        }
      }
    }
  });
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
