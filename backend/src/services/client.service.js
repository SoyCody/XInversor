import clientRepository from '../repositories/client.repository.js';


const readDashboard = async (userId) => {
  const client = await clientRepository.getLink(userId);

  return {
    link: client?.link ?? null,
  };
};

const getMe = async (userId) => {
  const user = await clientRepository.getMe(userId);
  
  if (!user) return null;

  // Excluir la contraseña de la respuesta
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};



export { 
  readDashboard, 
  getMe
};
