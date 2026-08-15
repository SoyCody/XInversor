import clientRepository from '../repositories/client.repository.js';

const readDashboard = async (userId) => {
  const client = await clientRepository.getLink(userId);

  return {
    link: client?.link ?? null,
  };
};

export { readDashboard };
