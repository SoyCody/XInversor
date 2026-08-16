import prisma from '../db.js';

// Toda interacción directa con Prisma vive aquí.
const findByEmail = (email) => {
  return prisma.user.findUnique({ where: { email } });
};

const createUser = (userData) => {
  return prisma.user.create({
    data: userData,
    include: { client: true }
  });
};

const findById = (id) => {
  return prisma.user.findUnique({ where: { id } });
};

const updateUser = (userData) => {
  const { id, ...data } = userData;
  return prisma.user.update({
    where: { id },
    data,
    include: { client: true }
  });
};

export default { 
  findById, 
  updateUser, 
  findByEmail, 
  createUser, 
  updateUser  
};