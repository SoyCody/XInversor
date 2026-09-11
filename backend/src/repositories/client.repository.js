import prisma from '../db.js';

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
  getMe,
  updateWallet,
};