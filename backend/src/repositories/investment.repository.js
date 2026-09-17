import prisma from '../db.js';

const registerInvestment = async (data) => {
  return prisma.inversion.create({
    // Todo paquete nace PENDIENTE: es una solicitud a la espera de que
    // un admin la revise (ver approveInvestment/rejectInvestment en el
    // servicio). Si se aprueba pasa a EN_ESPERA y ahí arranca el período
    // de bloqueo de 15 días; recién entonces el job la pasa a
    // EN_PROGRESO, que es cuando se habilitan los retiros.
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
      intereses: true,
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

// Para la tarjeta "Retiros pendientes" del dashboard de administración
// (resumenAdmin) y "Últimos retiros aprobados".
const countSolicitudesPendientes = () => {
  return prisma.solicitud.count({ where: { estado: 'PENDIENTE' } });
};

// Detalle de cada solicitud sin resolver, para la sección "Retiros
// pendientes" del listado de Inversiones del panel de administración
// (misma forma que investmentRepository.list(), pero por solicitud).
const getSolicitudesPendientes = async () => {
  return prisma.solicitud.findMany({
    where: { estado: 'PENDIENTE' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      montoRetiro: true,
      inversionId: true,
      inversion: {
        select: {
          intereses: true,
          client: {
            select: {
              user: { select: { firstName: true, lastName: true } }
            }
          }
        }
      }
    }
  });
};

const ultimosRetirosAprobados = (take = 5) => {
  return prisma.solicitud.findMany({
    where: { estado: 'ACEPTADA' },
    orderBy: { resueltaEn: 'desc' },
    take,
    select: { id: true, montoRetiro: true, resueltaEn: true }
  });
};

// Inversiones que todavía "envejecen": solo las EN_ESPERA (las demás
// quedan congeladas o ni siquiera arrancaron a contar). Hoy trae TODAS
// (las que no son EN_ESPERA se descartan en memoria, en incrementarDias).
// Con el `estadoActual` denormalizado, filtrar acá:
//   where: { estadoActual: 'EN_ESPERA' }
// `estados[0].createdAt` es la fecha en la que entró a EN_ESPERA: el
// servicio la usa para calcular `dias` (el período de bloqueo arranca en
// la aprobación, no en `inversion.createdAt`).
const getInversionesActivas = async () => {
  return prisma.inversion.findMany({
    select: {
      id: true,
      dias: true,
      estados: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { estado: true, createdAt: true }
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

// Fila única (id = 1) con el porcentaje de intereses vigente. `upsert`
// porque la fila puede no existir todavía (antes de la primera edición
// desde el panel de administración).
const getConfiguracion = async () => {
  return prisma.configuracion.findUnique({ where: { id: 1 } });
};

const setPorcentajeInteres = async (porcentaje) => {
  return prisma.configuracion.upsert({
    where: { id: 1 },
    create: { id: 1, porcentajeInteres: porcentaje },
    update: { porcentajeInteres: porcentaje }
  });
};

// Datos mínimos para resolver (aprobar/rechazar) una solicitud: el
// estado actual (para no resolver dos veces la misma), a qué inversión
// pertenece, y el monto e intereses/capital de esa inversión (para,
// si se aprueba, restar el retiro de los intereses -- ver approve() en
// el servicio).
const getSolicitudParaResolver = async (applicationId) => {
  return prisma.solicitud.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      inversionId: true,
      estado: true,
      montoRetiro: true,
      inversion: { select: { monto: true, intereses: true } }
    }
  });
};

// El admin que resuelve una solicitud puede no tener fila en Admin
// (no debería pasar detrás de isAdmin, pero adminId es opcional en el
// modelo, así que si no existe simplemente se guarda sin admin asociado).
const getAdminIdByUser = async (userId) => {
  return prisma.admin.findUnique({
    where: { userId },
    select: { id: true }
  });
};

// `updateMany` con `estado: 'PENDIENTE'` en el where (en vez de un
// simple `update` por id) para que, si dos requests llegan a la vez
// sobre la misma solicitud, solo la primera la resuelva: la segunda ve
// count 0 y el servicio la trata como "ya resuelta" en vez de pisarla.
// Aprobar además resta el retiro de los intereses de la inversión en la
// misma transacción (el capital invertido, `monto`, nunca se toca); si
// eso deja los intereses en 0, la inversión pasa a RETIRADO -- ya se
// pagó todo el interés generado y no queda de dónde retirar más.
const aprobarSolicitud = async (applicationId, inversionId, { intereses, total, marcarRetirado }, adminId) => {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.solicitud.updateMany({
      where: { id: applicationId, estado: 'PENDIENTE' },
      data: { estado: 'ACEPTADA', pendiente: null, resueltaEn: new Date(), adminId }
    });

    if (count === 0) return null;

    await tx.inversion.update({
      where: { id: inversionId },
      data: { intereses, total }
    });

    if (marcarRetirado) {
      await tx.estado.create({ data: { inversionId, estado: 'RETIRADO' } });
    }

    return { id: applicationId, estado: 'ACEPTADA' };
  });
};

const rechazarSolicitud = async (applicationId, adminId) => {
  const { count } = await prisma.solicitud.updateMany({
    where: { id: applicationId, estado: 'PENDIENTE' },
    data: { estado: 'RECHAZADA', pendiente: null, resueltaEn: new Date(), adminId }
  });

  return count > 0 ? { id: applicationId, estado: 'RECHAZADA' } : null;
};

// Datos mínimos para decidir sobre el estado de una inversión: el estado
// actual (para saber desde dónde se puede pasar -- EN_PROGRESO para
// retirar, PENDIENTE para aprobar/rechazar el paquete) y si tiene una
// solicitud sin resolver (solo aplica a retirar: no se puede cerrar una
// inversión con un retiro pendiente colgando). Comparte lectura entre
// retire(), approveInvestment() y rejectInvestment() en el servicio.
const getInversionParaCambiarEstado = async (investmentId) => {
  return prisma.inversion.findUnique({
    where: { id: investmentId },
    select: {
      id: true,
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

// Toda transición de estado de una inversión (aprobar/rechazar el
// paquete, pasar a EN_PROGRESO -- ver avanzarInversion --, retirarla) es,
// sin excepción, agregar una fila nueva a Estado: no hay una columna
// mutable "estadoActual" que bloquear. Dos requests simultáneas sobre la
// misma inversión podrían agregar dos filas iguales seguidas; no rompe
// nada (el último estado sigue siendo el mismo) pero ensucia el
// historial. Aceptable por ahora.
const cambiarEstadoInversion = async (investmentId, estado) => {
  return prisma.estado.create({
    data: { inversionId: investmentId, estado }
  });
};

export default {
  registerInvestment,
  getIdByUser,
  list,
  myList,
  getInversionParaSolicitud,
  crearSolicitud,
  countSolicitudesPendientes,
  getSolicitudesPendientes,
  ultimosRetirosAprobados,
  getInversionesActivas,
  avanzarInversion,
  getInvestment,
  getTotales,
  getConfiguracion,
  setPorcentajeInteres,
  getSolicitudParaResolver,
  getAdminIdByUser,
  aprobarSolicitud,
  rechazarSolicitud,
  getInversionParaCambiarEstado,
  cambiarEstadoInversion
};
