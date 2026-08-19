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
      apdatedAt : true
    }
  });
};

export default { 
  countAll, 
  countByRole, 
  findRecent, 
  obtenerClientes, 
  verCliente 
};