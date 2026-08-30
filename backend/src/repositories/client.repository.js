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

export default {
  getLink,
  getBlocked,
  getMe,
};