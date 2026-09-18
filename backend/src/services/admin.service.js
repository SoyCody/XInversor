import adminRepository from '../repositories/admin.repository.js';
import userRepository from '../repositories/user.repository.js';
import investmentService from './investment.service.js';
import { registrarAuditoria, AUDIT_ACTIONS, AUDIT_TABLES } from './auditorias.service.js';
import { parsePage, buildMeta } from '../utils/pagination.js';
import { MESES_ES, mesesDelAnhoHastaHoy } from '../utils/meses.js';

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

const contarPorMes = (fechas) => {
  const mapa = new Map();
  for (const { createdAt } of fechas) {
    const mes = new Date(createdAt).getMonth();
    mapa.set(mes, (mapa.get(mes) ?? 0) + 1);
  }
  return mapa;
};

// Serie mensual de clientes del año en curso: altas (nuevos registros)
// menos bajas (cuentas borradas) por mes, para que la línea suba con la
// captación y baje cuando predominan las bajas. Las bajas se identifican
// por la auditoría DELETE/user (ver
// admin.repository.js#clientesBorradosDesde).
//
// Arranca en enero y solo llega hasta el mes actual (no se rellenan los
// meses que todavía no pasaron): cada 1 de enero la serie vuelve a tener
// un solo punto y se va alargando mes a mes según avanza el año.
const clientesPorMes = async () => {
  const ahora = new Date();
  const desde = new Date(ahora.getFullYear(), 0, 1);

  const [creados, borrados] = await Promise.all([
    adminRepository.clientesCreadosDesde(desde),
    adminRepository.clientesBorradosDesde(desde)
  ]);

  const altas = contarPorMes(creados);
  const bajas = contarPorMes(borrados);

  return mesesDelAnhoHastaHoy(ahora).map((mes) => ({
    mes: MESES_ES[mes],
    clientes: (altas.get(mes) ?? 0) - (bajas.get(mes) ?? 0)
  }));
};

const readDashboard = async () => {
  const [
    totalUsers,
    totalAdmins,
    totalClients,
    ultimosClientes,
    resumenInversiones,
    clientesPorMesSerie
  ] = await Promise.all([
    adminRepository.countAll(),
    adminRepository.countByRole('ADMIN'),
    adminRepository.countByRole('CLIENT'),
    adminRepository.findRecentClients(5),
    investmentService.resumenAdmin(),
    clientesPorMes()
  ]);

  return {
    totalUsers,
    totalAdmins,
    totalClients,
    ultimosClientes,
    clientesPorMes: clientesPorMesSerie,
    ...resumenInversiones
  };
};

// Tipos aceptados; cualquier otro valor cae en 'ALL'.
const PERSONA_TIPOS = ['ALL', 'CLIENT', 'ADMIN', 'BLOCKED', 'DELETED'];

const obtenerPersonas = async (tipo = 'ALL', rawPage) => {
  const key = PERSONA_TIPOS.includes(String(tipo).toUpperCase())
    ? String(tipo).toUpperCase()
    : 'ALL';

  const page = parsePage(rawPage);

  // Los conteos totales (para las tarjetas de la pantalla de Usuarios)
  // son siempre los mismos sin importar el filtro/página elegidos, así
  // que se piden aparte y en paralelo.
  const [{ rows, total }, totalUsers, totalAdmins, totalClients] = await Promise.all([
    adminRepository.obtenerPersona(key, page),
    adminRepository.countAll(),
    adminRepository.countByRole('ADMIN'),
    adminRepository.countByRole('CLIENT')
  ]);

  // Se aplana client.blocked para que el frontend reciba una lista
  // homogénea; los usuarios sin perfil Client quedan como blocked: false.
  const users = rows.map(({ client, ...rest }) => ({
    ...rest,
    blocked: client?.blocked ?? false
  }));

  return {
    tipo: key,
    ...buildMeta(total, page),
    totalUsers,
    totalAdmins,
    totalClients,
    users
  };
};

const verCliente = async (id) => {
  const cliente = await adminRepository.verCliente(id);
  if (!cliente) {
    return { cliente: null };
  }

  const { client, ...rest } = cliente;
  return { cliente: { ...rest, blocked: client?.blocked ?? false, wallet: client?.wallet ?? null } };
};

const promoteToAdmin = async (id, actingAdminUserId) => {
  const user = await userRepository.findActiveById(id);
  if (!user) {
    throw new UserNotFoundError();
  }

  if (user.role === 'ADMIN') {
    throw new AlreadyAdminError();
  }

  // TOCTOU menor: si el usuario se borra entre este check y el update,
  // adminRepository.promoteToAdmin lanza P2025 y el controller responde
  // 500. La verificación de existencia/rol podría moverse dentro de la
  // transacción del repo.
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
  // 3 lecturas para un toggle: findActiveById aquí + findUnique(client) y
  // update dentro de adminRepository.block. Se puede colapsar en una sola
  // transacción en el repo. Además block() lee `blocked` y escribe su
  // negación: dos requests simultáneos (doble click) pueden leer el mismo
  // valor y dejar el estado sin cambios o mal. Si importa, actualizar con
  // `data: { blocked: { set: ... } }` a un valor explícito recibido, no a
  // un toggle.
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