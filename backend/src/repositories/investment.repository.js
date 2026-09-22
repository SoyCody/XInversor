import prisma from '../db.js';

// Cuenta las inversiones activas del cliente y, si hay cupo, crea la
// nueva -- las dos cosas dentro de la misma transacción, con el Client
// bloqueado (SELECT ... FOR UPDATE). Antes el conteo (en el servicio) y
// el create (acá) eran dos pasos sueltos: dos POST /investment/new en
// paralelo del mismo cliente podían pasar los dos el chequeo de cupo y
// dejarlo con una inversión activa de más. Con el lock, la segunda
// transacción concurrente espera a que la primera termine y vuelve a
// contar ya con la inversión que esa primera acaba de insertar.
const crearInversionSiHayCupo = async ({ clientId, maxActivas, estadosActivos, data }) => {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Client" WHERE id = ${clientId} FOR UPDATE`;

    const inversiones = await tx.inversion.findMany({
      where: { clientId },
      select: {
        estados: { orderBy: { createdAt: 'desc' }, take: 1, select: { estado: true } }
      }
    });
    const activas = inversiones.filter((inv) =>
      estadosActivos.includes(inv.estados[0]?.estado ?? 'PENDIENTE')
    ).length;

    if (activas >= maxActivas) {
      return { limitReached: true };
    }

    // Todo paquete nace PENDIENTE: es una solicitud a la espera de que
    // un admin la revise (ver approveInvestment/rejectInvestment en el
    // servicio). Si se aprueba pasa a EN_ESPERA y ahí arranca el período
    // de bloqueo de 15 días; recién entonces el job la pasa a
    // EN_PROGRESO, que es cuando se habilitan los retiros.
    const inversion = await tx.inversion.create({
      data: {
        ...data,
        estados: { create: { estado: 'PENDIENTE' } }
      }
    });

    return { inversion };
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
// de estados (más reciente primero), datos del cliente dueño (wallet,
// email y userId -- los tres solo los usa getInvestmentAdmin, para
// mostrar "Detalles del cliente" y enlazar a "Ver cliente" desde el panel
// de administración) y todas sus solicitudes de retiro.
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
      client: {
        select: {
          wallet: true,
          userId: true,
          user: { select: { email: true } }
        }
      },
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

// Trae TODAS las solicitudes (no solo las pendientes) porque el servicio
// necesita dos cosas distintas de ellas: si ya hay una sin resolver
// (`pendiente`) y cuánto ya se retiró en total (`estado === 'ACEPTADA'`,
// sumado en el servicio) para saber cuánto de `intereses` sigue
// disponible -- ver createApplication().
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
        select: { estado: true, montoRetiro: true, pendiente: true }
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
// (misma forma que investmentRepository.list(), pero por solicitud) y
// para las notificaciones del admin ("retiros por revisar" -- de ahí
// `createdAt`, que ese listado no necesitaba).
const getSolicitudesPendientes = async () => {
  return prisma.solicitud.findMany({
    where: { estado: 'PENDIENTE' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      montoRetiro: true,
      inversionId: true,
      createdAt: true,
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

// Historial de aprobaciones/rechazos de PAQUETES de un cliente (Estado,
// no el estado actual de la inversión): un paquete aprobado sigue
// "habiendo sido aprobado" aunque después pase a EN_PROGRESO o incluso
// RETIRADO, así que no alcanza con mirar el estado actual -- hay que
// recorrer el historial completo. Alimenta las notificaciones del cliente
// (ver notification.service.js).
const getPaquetesResueltos = (clientId) => {
  return prisma.estado.findMany({
    where: {
      estado: { in: ['EN_ESPERA', 'RECHAZADO'] },
      inversion: { clientId }
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      estado: true,
      createdAt: true,
      inversion: { select: { id: true, monto: true } }
    }
  });
};

// Retiros ya resueltos (aceptados o rechazados) de un cliente: mismo
// razonamiento que arriba, pero sobre Solicitud, que sí guarda el estado
// final directo en la fila (no hace falta un historial aparte). Alimenta
// las notificaciones del cliente.
const getRetirosResueltos = (clientId) => {
  return prisma.solicitud.findMany({
    where: {
      estado: { in: ['ACEPTADA', 'RECHAZADA'] },
      inversion: { clientId }
    },
    orderBy: { resueltaEn: 'desc' },
    select: {
      id: true,
      estado: true,
      resueltaEn: true,
      montoRetiro: true,
      inversionId: true
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

// Inversiones que todavía cambian solas con el paso del tiempo: EN_ESPERA
// (cuentan días para pasar a EN_PROGRESO) y EN_PROGRESO (generan
// intereses día hábil a día hábil y pueden vencer -- ver incrementarDias
// en el servicio). Hoy trae TODAS (las demás -- PENDIENTE, RECHAZADO,
// RETIRADO -- se descartan en memoria). Con el `estadoActual`
// denormalizado, filtrar acá:
//   where: { estadoActual: { in: ['EN_ESPERA', 'EN_PROGRESO'] } }
// `estados[0].createdAt` es la fecha en la que entró a la fase actual: el
// servicio la usa como ancla tanto para `dias` (EN_ESPERA) como para los
// intereses y el vencimiento a los 10 meses (EN_PROGRESO), en vez de
// `inversion.createdAt`.
const getInversionesActivas = async () => {
  return prisma.inversion.findMany({
    select: {
      id: true,
      monto: true,
      porcentajeInteres: true,
      intereses: true,
      total: true,
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

// Actualiza campos de una inversión y, si corresponde, agrega un nuevo
// Estado en la misma transacción para que el dato y el cambio de estado
// nunca queden desincronizados. La usa incrementarDias (en el servicio)
// tanto para EN_ESPERA -> EN_PROGRESO (`{ dias }` + habilita) como para
// EN_PROGRESO -> RETIRADO por vencimiento (`{ intereses, total }` + vence).
const actualizarInversion = async (inversionId, data, nuevoEstado) => {
  const ops = [
    prisma.inversion.update({
      where: { id: inversionId },
      data
    })
  ];

  if (nuevoEstado) {
    ops.push(
      prisma.estado.create({
        data: { inversionId, estado: nuevoEstado }
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

// Solo hace falta saber si la solicitud existe: aprobar/rechazar no
// tocan la inversión (ver approve()/reject() en el servicio -- los
// intereses/total los recalcula únicamente incrementarDias), así que no
// hay nada más de la solicitud ni de su inversión que leer de antemano.
const getSolicitudParaResolver = async (applicationId) => {
  return prisma.solicitud.findUnique({
    where: { id: applicationId },
    select: { id: true }
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
// Aprobar y rechazar son, a nivel de datos, la misma operación (solo
// cambia el `estado` de destino): ninguna de las dos toca la inversión
// -- el capital (`monto`) nunca se mueve y los intereses/total los
// recalcula únicamente incrementarDias, según el tiempo transcurrido, no
// aprobar un retiro.
const resolverSolicitud = async (applicationId, estado, adminId) => {
  const { count } = await prisma.solicitud.updateMany({
    where: { id: applicationId, estado: 'PENDIENTE' },
    data: { estado, pendiente: null, resueltaEn: new Date(), adminId }
  });

  return count > 0 ? { id: applicationId, estado } : null;
};

// Aprobar/rechazar un paquete PENDIENTE y retirar una inversión EN_PROGRESO
// (ver approveInvestment/rejectInvestment/retire en el servicio) leían el
// estado actual y, en un paso aparte, agregaban la fila de Estado -- sin
// nada que serialice a dos requests concurrentes sobre la MISMA inversión
// (a diferencia de resolverSolicitud, que sí usa un updateMany con guarda).
// Dos clicks casi simultáneos (p. ej. "Aprobar" y "Rechazar" desde dos
// pestañas del panel) podían pasar los dos la validación y dejar dos filas
// de Estado contradictorias.
//
// `SELECT ... FOR UPDATE` toma el lock de fila de la Inversion dentro de
// la transacción: si dos requests llegan a la vez, la segunda queda
// bloqueada hasta que la primera confirme (o revierta), y cuando por fin
// lee ya ve el Estado que la primera acaba de insertar -- así `validar`
// SIEMPRE decide sobre el estado más reciente, nunca sobre uno que otra
// transacción está a punto de dejar obsoleto.
//
// `validar(inversion)` devuelve un mensaje si la transición no es válida
// (p. ej. "ya fue revisada") o `null`/`undefined` si puede seguir. Se
// reutiliza para las tres transiciones porque cada una valida algo
// distinto (approve/reject exigen PENDIENTE; retire exige EN_PROGRESO y
// sin solicitudes pendientes) sobre la misma lectura bloqueada.
const transicionAtomica = async (investmentId, estadoSiguiente, validar) => {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw`SELECT id FROM "Inversion" WHERE id = ${investmentId} FOR UPDATE`;
    if (locked.length === 0) {
      return { notFound: true };
    }

    const inversion = await tx.inversion.findUnique({
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

    const motivo = validar(inversion);
    if (motivo) {
      return { conflict: true, motivo };
    }

    await tx.estado.create({ data: { inversionId: investmentId, estado: estadoSiguiente } });
    return { ok: true };
  });
};

export default {
  crearInversionSiHayCupo,
  getIdByUser,
  list,
  myList,
  getInversionParaSolicitud,
  crearSolicitud,
  countSolicitudesPendientes,
  getSolicitudesPendientes,
  getPaquetesResueltos,
  getRetirosResueltos,
  ultimosRetirosAprobados,
  getInversionesActivas,
  actualizarInversion,
  getInvestment,
  getTotales,
  getConfiguracion,
  setPorcentajeInteres,
  getSolicitudParaResolver,
  getAdminIdByUser,
  resolverSolicitud,
  transicionAtomica
};
