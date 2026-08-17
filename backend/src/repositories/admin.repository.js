import prisma from '../db.js';

const countAll = () => prisma.user.count();

const countByRole = (role) => prisma.user.count({ where: { role } });

const findRecent = (take = 10) => {
  return prisma.user.findMany({
    take,
    orderBy: { createdAt: 'desc' },
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

const obtenerClientes = () => {
  return prisma.user.findMany({
    where: { role: "CLIENT" },
    select: { 
      id: true,
      firstName: true, 
      lastName: true
    }
  });
};

const verCliente = (id) => {
  return prisma.user.findUnique({
    where : { id: id},
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