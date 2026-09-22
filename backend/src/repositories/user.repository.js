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

// Contexto mínimo de autenticación: se ejecuta en CADA request autenticado
// (verifyToken), así que solo se piden las columnas que consumen los
// middlewares + `client.blocked`. Evita traer en cada request firstName,
// lastName, passwordHash, avatarType, etc. y le ahorra a `isnBlocked` una
// segunda consulta a la tabla Client.
const findAuthContextById = (id, state = ACTIVE_STATE) => {
  return prisma.user.findFirst({
    where: { id, state },
    select: {
      id: true,
      email: true,
      role: true,
      state: true,
      tokenVersion: true,
      client: { select: { blocked: true } }
    }
  });
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

// Incrementa tokenVersion en la misma escritura: es lo que hace que
// cambiar la contraseña invalide cualquier otro token ya emitido (ver
// verifyToken en auth.middleware.js). Se devuelven los campos que
// generateToken necesita para reemitir la cookie de la sesión actual
// (el controller la vuelve a setear con la versión nueva).
const changePassword = ({ id, passwordHash }) => {
  return prisma.user.update({
    where: { id },
    data: { passwordHash, tokenVersion: { increment: 1 } },
    select: { id: true, email: true, role: true, state: true, tokenVersion: true }
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
  findAuthContextById,
  updateUser,
  findByEmail,
  createUser,
  changePassword,
  deleteUser,
  updateAvatar,
  getAvatar
};