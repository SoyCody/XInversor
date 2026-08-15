import prisma from '../db.js';

const getLink = async (userId) => {
  return prisma.client.findUnique({
    where: { userId },
    select: { link: true },
  });
};

export default { getLink };