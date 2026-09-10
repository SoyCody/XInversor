import clientRepository from '../repositories/client.repository.js';
import { registrarAuditoria, AUDIT_ACTIONS, AUDIT_TABLES } from './auditorias.service.js';


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

// La wallet ya viene saneada por Joi (trim). Se registra en auditoría
// porque es un dato sensible de la cuenta (destino de los retiros).
const updateWallet = async (userId, wallet) => {
  const updated = await clientRepository.updateWallet(userId, wallet);

  await registrarAuditoria({
    userId,
    action: AUDIT_ACTIONS.UPDATE,
    tableName: AUDIT_TABLES.CLIENT,
    targetId: userId
  });

  return { wallet: updated.wallet };
};



export {
  readDashboard,
  getMe,
  updateWallet
};
