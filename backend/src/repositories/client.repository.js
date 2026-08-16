import prisma from '../db.js';

const getLink = async (userId) => {
  return prisma.client.findUnique({
    where: { userId },
    select: { link: true },
  });
};

const getMe = async (userId) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      client: true,
    },
  });
};
export default { getLink, getMe };