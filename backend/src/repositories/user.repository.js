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

export default { findByEmail, createUser };