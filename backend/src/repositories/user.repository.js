import prisma from '../db.js';

const ACTIVE_STATE = 'ACTIVO';

// El avatar (Bytes) nunca debe viajar en las respuestas de "usuario":
// infla el JSON y filtra binario donde no corresponde. Se sirve aparte
// por su propio endpoint (ver getAvatar).
const findByEmail = (email, state = ACTIVE_STATE) => {
  return prisma.user.findFirst({
    where: { email, state },
    omit: { avatar: true }
  });
};

const createUser = (userData) => {
  return prisma.user.create({
    data: userData,
    include: { client: true },
    omit: { avatar: true }
  });
};

const findById = (id, state = ACTIVE_STATE) => {
  return prisma.user.findFirst({ where: { id, state }, omit: { avatar: true } });
};

const updateUser = (userData) => {
  const { id, ...data } = userData;
  return prisma.user.update({
    where: { id },
    data,
    include: { client: true },
    omit: { avatar: true }
  });
};

const updateAvatar = ({ id, avatar, avatarType }) => {
  return prisma.user.update({
    where: { id },
    data: { avatar, avatarType, avatarUpdatedAt: new Date() },
    select: { id: true, avatarUpdatedAt: true }
  });
};

const getAvatar = (id, state = ACTIVE_STATE) => {
  return prisma.user.findFirst({
    where: { id, state },
    select: { avatar: true, avatarType: true }
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
  deleteUser,
  updateAvatar,
  getAvatar
};