import adminRepository from '../repositories/admin.repository.js';
import userRepository from '../repositories/user.repository.js';
import { registrarAuditoria, AUDIT_ACTIONS, AUDIT_TABLES } from './auditorias.service.js';
import { parsePage, buildMeta } from '../utils/pagination.js';

// Error de dominio: se traduce a un código de estado en el controller.
class UserNotFoundError extends Error {
  constructor() {
    super('Usuario no encontrado');
    this.name = 'UserNotFoundError';
    this.statusCode = 404;
  }
}

class AlreadyAdminError extends Error {
  constructor() {
    super('Este usuario ya es administrador');
    this.name = 'AlreadyAdminError';
    this.statusCode = 409;
  }
}

const readDashboard = async () => {
  const [totalUsers, totalAdmins, totalClients, recentUsers] = await Promise.all([
    adminRepository.countAll(),
    adminRepository.countByRole('ADMIN'),
    adminRepository.countByRole('CLIENT'),
    adminRepository.findRecent(10)
  ]);

  return {
    totalUsers,
    totalAdmins,
    totalClients,
    recentUsers
  };
};

// Tipos aceptados; cualquier otro valor cae en 'ALL'.
const PERSONA_TIPOS = ['ALL', 'CLIENT', 'ADMIN', 'BLOCKED', 'DELETED'];

const obtenerPersonas = async (tipo = 'ALL', rawPage) => {
  const key = PERSONA_TIPOS.includes(String(tipo).toUpperCase())
    ? String(tipo).toUpperCase()
    : 'ALL';

  const page = parsePage(rawPage);
  const { rows, total } = await adminRepository.obtenerPersona(key, page);

  // Se aplana client.blocked para que el frontend reciba una lista
  // homogénea; los usuarios sin perfil Client quedan como blocked: false.
  const users = rows.map(({ client, ...rest }) => ({
    ...rest,
    blocked: client?.blocked ?? false
  }));

  return {
    tipo: key,
    ...buildMeta(total, page),
    users
  };
};

const verCliente = async (id) => {
  const cliente = await adminRepository.verCliente(id);
  if (!cliente) {
    return { cliente: null };
  }

  const { client, ...rest } = cliente;
  return { cliente: { ...rest, blocked: client?.blocked ?? false } };
};

const promoteToAdmin = async (id, actingAdminUserId) => {
  const user = await userRepository.findActiveById(id);
  if (!user) {
    throw new UserNotFoundError();
  }

  if (user.role === 'ADMIN') {
    throw new AlreadyAdminError();
  }

  const updatedUser = await adminRepository.promoteToAdmin(id);

  await registrarAuditoria({
    userId: actingAdminUserId,
    action: AUDIT_ACTIONS.ROLE_CHANGE,
    tableName: AUDIT_TABLES.USER,
    targetId: id
  });

  const { passwordHash, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

const blockClient = async (id, actingAdminUserId) => {
  const user = await userRepository.findActiveById(id);
  if (!user || user.role !== 'CLIENT') {
    throw new UserNotFoundError();
  }

  const client = await adminRepository.block(id);
  if (!client) {
    throw new UserNotFoundError();
  }

  await registrarAuditoria({
    userId: actingAdminUserId,
    action: AUDIT_ACTIONS.UPDATE,
    tableName: AUDIT_TABLES.CLIENT,
    targetId: id
  });

  return client;
};

export {
  readDashboard,
  obtenerPersonas,
  verCliente,
  promoteToAdmin,
  UserNotFoundError,
  AlreadyAdminError,
  blockClient
};