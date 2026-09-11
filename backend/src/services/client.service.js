import clientRepository from '../repositories/client.repository.js';
import investmentService from './investment.service.js';
import { registrarAuditoria, AUDIT_ACTIONS, AUDIT_TABLES } from './auditorias.service.js';


// El link de referido es único para todos los clientes: vive en
// CLIENT_REFERRAL_LINK, no en la base de datos. El resto (totales y cupo
// de inversiones activas) sí es por cliente: ver
// investmentService.resumenInversiones.
const readDashboard = async (userId) => {
  const resumen = await investmentService.resumenInversiones(userId);

  return {
    link: process.env.CLIENT_REFERRAL_LINK ?? null,
    ...resumen
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
