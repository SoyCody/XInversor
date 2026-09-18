import prisma from '../db.js';
import { toPrismaRange } from '../utils/pagination.js';

const ACTIVE_STATE = 'ACTIVO';
const DELETED_STATE = 'BORRADO';

// Filtros disponibles para obtenerPersona(tipo).
const PERSONA_FILTERS = {
  ALL:     { state: ACTIVE_STATE },
  CLIENT:  { role: 'CLIENT', state: ACTIVE_STATE },
  ADMIN:   { role: 'ADMIN', state: ACTIVE_STATE },
  BLOCKED: { role: 'CLIENT', state: ACTIVE_STATE, client: { is: { blocked: true } } },
  DELETED: { state: DELETED_STATE }
};

const countAll = (state = ACTIVE_STATE) => prisma.user.count({
  where: { state }
});

const countByRole = (role, state = ACTIVE_STATE) => prisma.user.count({
  where: { role, state }
});

const findRecent = (take = 10, state = ACTIVE_STATE) => {
  return prisma.user.findMany({
    take,
    orderBy: { createdAt: 'desc' },
    where: { state },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      createdAt: true
    }
  });
};

// "Últimos clientes registrados" del panel de administración: a
// diferencia de findRecent, solo trae clientes (no admins).
const findRecentClients = (take = 5, state = ACTIVE_STATE) => {
  return prisma.user.findMany({
    take,
    orderBy: { createdAt: 'desc' },
    where: { role: 'CLIENT', state },
    select: { id: true, firstName: true, lastName: true, createdAt: true }
  });
};

// Altas y bajas de clientes desde `desde`, para el gráfico de tendencia
// mensual del panel de administración. Se traen las fechas crudas (sin
// agrupar por mes acá) porque agrupar por mes en SQL con Prisma requiere
// $queryRaw; con el volumen de un panel de admin alcanza con agrupar en
// memoria en el service.
const clientesCreadosDesde = (desde) => {
  return prisma.user.findMany({
    where: { role: 'CLIENT', createdAt: { gte: desde } },
    select: { createdAt: true }
  });
};

// Un cliente "borrado" es un soft-delete (User.state pasa a BORRADO); se
// registra como auditoría DELETE/user con userId = targetId (el usuario
// se borra a sí mismo, ver auth.service.js#deleteUser), así que basta con
// filtrar por el rol del propio actor de la auditoría.
const clientesBorradosDesde = (desde) => {
  return prisma.audit.findMany({
    where: {
      action: 'DELETE',
      tableName: 'user',
      createdAt: { gte: desde },
      user: { role: 'CLIENT' }
    },
    select: { createdAt: true }
  });
};

// Devuelve la página pedida (de 20 en 20) junto con el total real, para
// que el frontend pueda pintar el paginador.
const obtenerPersona = async (tipo = 'ALL', page = 1) => {
  const where = PERSONA_FILTERS[tipo] ?? PERSONA_FILTERS.ALL;

  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...toPrismaRange(page),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        client: { select: { blocked: true } }
      }
    }),
    prisma.user.count({ where })
  ]);

  return { rows, total };
};

// Detalle completo de cualquier usuario (CLIENT o ADMIN, activo o
// con la cuenta eliminada): es lo que consume "Ver detalles".
const verCliente = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select : {
      firstName: true,
      lastName: true,
      email : true,
      role : true,
      state : true,
      createdAt : true,
      apdatedAt : true,
      avatarUpdatedAt : true,
      // `wallet` vive en Client, no en User (ver schema.prisma); seleccionarlo
      // acá arriba tira un PrismaClientValidationError.
      client: { select: { blocked: true, wallet: true } }
    }
  });
};

const promoteToAdmin = (id) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: { role: 'ADMIN' }
    });

    // El Client del usuario NO se toca aquí: así conserva su wallet
    // e historial aunque ahora también sea admin.
    // upsert por si el usuario ya tuvo un perfil Admin antes
    // (por ejemplo, fue degradado y vuelve a ascender).
    await tx.admin.upsert({
      where: { userId: id },
      update: {},
      create: { userId: id }
    });

    return user;
  });
};

const block = (id) => {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.findUnique({ where: { userId: id } });
    if (!client) {
      return null;
    }

    return tx.client.update({
      where: { userId: id },
      data: { blocked: !client.blocked },
      select: { id: true, userId: true, blocked: true }
    });
  });
};

export default {
  countAll,
  countByRole,
  findRecent,
  findRecentClients,
  clientesCreadosDesde,
  clientesBorradosDesde,
  obtenerPersona,
  verCliente,
  promoteToAdmin,
  block
};