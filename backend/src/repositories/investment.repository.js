import prisma from '../db.js';

const registerInvestment = async (data) => {
  return prisma.inversion.create({
    // Toda inversión nace PENDIENTE: durante los primeros días está
    // bloqueada y recién al cumplir el mínimo (15 días) el job la pasa
    // a EN_PROGRESO, que es cuando se habilitan los retiros.
    data: {
      ...data,
      estados: { create: { estado: 'PENDIENTE' } }
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

const myList = async (clientId) => {
  return prisma.inversion.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      monto: true,
      dias: true,
      intereses: true,
      // Solo el estado actual (el último registrado).
      estados: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { estado: true }
      }
    }
  });
};

// Detalle completo de una inversión: montos, contador de días, historial
// de estados (más reciente primero) y todas sus solicitudes de retiro.
const getInvestment = async (inversionId) => {
  return prisma.inversion.findUnique({
    where: { id: inversionId },
    select: {
      id: true,
      clientId: true,
      monto: true,
      intereses: true,
      total: true,
      dias: true,
      createdAt: true,
      estados: {
        orderBy: { createdAt: 'desc' },
        select: { estado: true, createdAt: true }
      },
      solicitudes: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          montoRetiro: true,
          estado: true,
          createdAt: true,
          resueltaEn: true
        }
      }
    }
  });
};

const getInversionParaSolicitud = async (inversionId) => {
  return prisma.inversion.findUnique({
    where: { id: inversionId },
    select: {
      id: true,
      clientId: true,
      total: true,
      estados: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { estado: true }
      },
      solicitudes: {
        where: { pendiente: true },
        select: { id: true }
      }
    }
  });
};

const crearSolicitud = async (inversionId, montoRetiro) => {
  return prisma.solicitud.create({
    data: { inversionId, montoRetiro }
  });
};

// Inversiones que todavía "envejecen": las retiradas quedan congeladas.
const getInversionesActivas = async () => {
  return prisma.inversion.findMany({
    select: {
      id: true,
      dias: true,
      createdAt: true,
      estados: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { estado: true }
      }
    }
  });
};

// Fija `dias` y, si corresponde, registra el paso a EN_PROGRESO en la
// misma transacción para que nunca queden desincronizados.
const avanzarInversion = async (inversionId, { dias, habilitar }) => {
  const ops = [
    prisma.inversion.update({
      where: { id: inversionId },
      data: { dias }
    })
  ];

  if (habilitar) {
    ops.push(
      prisma.estado.create({
        data: { inversionId, estado: 'EN_PROGRESO' }
      })
    );
  }

  return prisma.$transaction(ops);
};

export default {
  registerInvestment,
  getIdByUser,
  list,
  myList,
  getInversionParaSolicitud,
  crearSolicitud,
  getInversionesActivas,
  avanzarInversion,
  getInvestment
};
