import prisma from '../db.js';

const ACTIVE_STATE = 'ACTIVO';

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

const obtenerClientes = (state = ACTIVE_STATE) => {
  return prisma.user.findMany({
    where: { role: 'CLIENT', state },
    select: { 
      id: true,
      firstName: true, 
      lastName: true
    }
  });
};

const verCliente = (id, state = ACTIVE_STATE) => {
  return prisma.user.findFirst({
    where: { id, state, role: 'CLIENT' },
    select : {
      firstName: true,
      lastName: true,
      email : true,
      createdAt : true,
      apdatedAt : true,
      avatarUpdatedAt : true,
      client: { select: { blocked: true } }
    }
  });
};

const promoteToAdmin = (id) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: { role: 'ADMIN' }
    });

    // El Client del usuario NO se toca aquí: así conserva su link
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
  obtenerClientes,
  verCliente,
  promoteToAdmin,
  block
};