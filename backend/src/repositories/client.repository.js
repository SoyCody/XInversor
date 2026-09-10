import prisma from '../db.js';

const getLink = async (userId) => {
  return prisma.client.findUnique({
    where: { userId },
    select: { link: true },
  });
};

const getBlocked = async (userId) => {
  return prisma.client.findUnique({
    where: { userId },
    select: { blocked: true },
  });
};

const getMe = async (userId) => {
  return prisma.user.findFirst({
    where: {
      id: userId,
      state: 'ACTIVO',
    },
    include: {
      client: true,
    },
    omit: { avatar: true },
  });
};

// Falla con P2025 si el usuario no tiene perfil de Client (p. ej. un
// admin puro); el controller lo traduce a 404.
const updateWallet = async (userId, wallet) => {
  return prisma.client.update({
    where: { userId },
    data: { wallet },
    select: { wallet: true },
  });
};

export default {
  getLink,
  getBlocked,
  getMe,
  updateWallet,
};