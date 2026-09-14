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
    // `wallet` puede ser null: se usa para exigir que el cliente la tenga
    // configurada antes de dejarlo invertir.
    select: { id: true, wallet: true }
  });
};

// Trae la tabla `inversion` entera (sin skip/take). El servicio filtra y
// pagina en memoria porque el "estado actual" vive en la relación
// `estados`. Optimización de fondo: agregar una columna
// `estadoActual EstadoInversion @default(PENDIENTE)` en Inversion,
// escribirla en la misma transacción que crea cada Estado, e indexar
// [estadoActual, createdAt]. Con eso este método pasa a where + skip/take
// + count y deja de escalar con el tamaño de la tabla.
const list = async () => {
  return prisma.inversion.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      clientId: true,
      monto: true,
      dias: true,
      intereses: true,
      createdAt: true,
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
      total: true,
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

// OJO: aquí "pendiente" = campo booleano Solicitud.pendiente, mientras que
// en getInvestment/puedeSolicitarRetiro "pendiente" = Solicitud.estado ===
// 'PENDIENTE'. Son dos fuentes de verdad para el mismo concepto; si al
// implementar la resolución de solicitudes una se actualiza y la otra no,
// los dos endpoints van a discrepar. Conviene quedarse con una sola
// (probablemente el enum `estado`, y derivar el índice único de ahí).
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

// Para las tarjetas "Retiros pendientes" / "Últimos retiros aprobados"
// del panel de administración.
const countSolicitudesPendientes = () => {
  return prisma.solicitud.count({ where: { estado: 'PENDIENTE' } });
};

const ultimosRetirosAprobados = (take = 5) => {
  return prisma.solicitud.findMany({
    where: { estado: 'ACEPTADA' },
    orderBy: { resueltaEn: 'desc' },
    take,
    select: { id: true, montoRetiro: true, resueltaEn: true }
  });
};

// Inversiones que todavía "envejecen": las retiradas quedan congeladas.
// Hoy trae TODAS (incluidas las RETIRADO, que se descartan en memoria).
// Con el `estadoActual` denormalizado, filtrar acá:
//   where: { estadoActual: { in: ['PENDIENTE', 'EN_PROGRESO'] } }
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

// Resumen para el dashboard del cliente: capital invertido (suma de
// `monto`) y total acumulado en intereses (suma de `intereses`), sobre
// TODAS las inversiones del cliente sin importar el estado. Se agrega en
// la base de datos con SUM -- no trae filas a memoria.
const getTotales = async (clientId) => {
  const { _sum } = await prisma.inversion.aggregate({
    where: { clientId },
    _sum: { monto: true, intereses: true }
  });

  // _sum.* viene null (no 0) cuando el cliente todavía no tiene inversiones.
  return {
    totalInvertido: _sum.monto ?? 0,
    totalAcumulado: _sum.intereses ?? 0
  };
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
  countSolicitudesPendientes,
  ultimosRetirosAprobados,
  getInversionesActivas,
  avanzarInversion,
  getInvestment,
  getTotales
};
