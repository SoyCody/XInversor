import prisma from '../db.js';

const create = ({ purpose, email, codeHash, payload, expiresAt }) => {
  return prisma.verificationCode.create({
    data: { purpose, email, codeHash, payload, expiresAt }
  });
};

const findById = (id) => {
  return prisma.verificationCode.findUnique({ where: { id } });
};

// Antes de crear un código nuevo para el mismo correo + propósito, se
// borran los pendientes anteriores: evita que queden varios códigos
// "vivos" a la vez para la misma verificación (el usuario solo debe
// poder usar el último que se le mandó) y de paso sirve como "reenviar
// código" -- pedirlo de nuevo invalida el anterior.
const deleteByEmailAndPurpose = (email, purpose) => {
  return prisma.verificationCode.deleteMany({ where: { email, purpose } });
};

const incrementAttempts = (id) => {
  return prisma.verificationCode.update({
    where: { id },
    data: { attempts: { increment: 1 } }
  });
};

const deleteById = (id) => {
  return prisma.verificationCode.delete({ where: { id } });
};

// Housekeeping oportunista: se llama de paso al crear un código nuevo, no
// por un cron aparte. Los códigos vencidos no son un problema de
// seguridad (ya no sirven), solo basura que conviene no acumular.
const deleteExpired = () => {
  return prisma.verificationCode.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });
};

export default {
  create,
  findById,
  deleteByEmailAndPurpose,
  incrementAttempts,
  deleteById,
  deleteExpired
};
