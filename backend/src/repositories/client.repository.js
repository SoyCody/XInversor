import prisma from '../db.js';

const getLink = async (userId) => {
  return prisma.client.findUnique({
    where: { userId },
    select: { link: true },
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
  });
};
export default { getLink, getMe };