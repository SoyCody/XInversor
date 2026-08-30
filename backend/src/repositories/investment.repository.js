import prisma from '../db.js';

const registerInvestment = async (data) => {
  return prisma.inversion.create({
    // Toda inversión nace con un estado EN_PROGRESO: así el listado
    // por tipos siempre tiene un estado actual con el que filtrar.
    data: {
      ...data,
      estados: { create: { estado: 'EN_PROGRESO' } }
    }
  });
};

const getIdByUser = async (userId) => {
  return prisma.client.findUnique({
    where: { userId },
    select: { id: true }
  });
};

const list = async () => {
  return prisma.inversion.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      monto: true,
      dias: true,
      intereses: true,
      client: {
        select: {
          user: { select: { firstName: true, lastName: true } }
        }
      },
      // Solo el estado actual (el último registrado).
      estados: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { estado: true }
      }
    }
  });
};

export default {
    registerInvestment,
    getIdByUser,
    list
}