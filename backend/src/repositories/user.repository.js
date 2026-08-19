import prisma from '../db.js';

const ACTIVE_STATE = 'ACTIVO';

// Toda interacción directa con Prisma vive aquí.
const findByEmail = (email, state = ACTIVE_STATE) => {
  return prisma.user.findFirst({
    where: { email, state }
  });
};

const createUser = (userData) => {
  return prisma.user.create({
    data: userData,
    include: { client: true }
  });
};

const findById = (id, state = ACTIVE_STATE) => {
  return prisma.user.findFirst({ where: { id, state } });
};

const updateUser = (userData) => {
  const { id, ...data } = userData;
  return prisma.user.update({
    where: { id },
    data,
    include: { client: true }
  });
};

const changePassword = (userData, state = ACTIVE_STATE) => {
  const { id, passwordHash } = userData;
  return prisma.user.updateMany({
    where: { id, state },
    data: { passwordHash }
  });
};

const findActiveById = (id) => findById(id, ACTIVE_STATE);

const deleteUser = (id)=> {
  return prisma.user.update({
    where: { id },
    data: { state: "BORRADO" }
  });
};

export default { 
  findById, 
  findActiveById,
  updateUser, 
  findByEmail, 
  createUser, 
  updateUser,
  changePassword,
  deleteUser
};