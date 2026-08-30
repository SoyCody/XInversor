import investmentRepository from '../repositories/investment.repository.js';
import { registrarAuditoria, AUDIT_ACTIONS, AUDIT_TABLES } from './auditorias.service.js';

const INTERES_RATE = 0.1;

const newInvestment = async (userId, { monto }) => {
  const client = await investmentRepository.getIdByUser(userId);

  if (!client) {
    throw new Error('El usuario no tiene un perfil de cliente');
  }

  const montoNum = Number(monto);

  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    throw new Error('El monto debe ser un número mayor a 0');
  }

  const intereses = montoNum * INTERES_RATE;
  const total = montoNum + intereses;

  // dias arranca en 0: es el contador que habilita los retiros
  // (mínimo 15 días); la inversión no tiene fecha de fin.
  const inversion = await investmentRepository.registerInvestment({
    clientId: client.id,
    monto: montoNum,
    intereses,
    dias: 0,
    total
  });

  await registrarAuditoria({
    userId,
    action: AUDIT_ACTIONS.CREATE,
    tableName: AUDIT_TABLES.INVERSION,
    targetId: inversion.id
  });

  return inversion;
};

// Tipos aceptados en ?tipo=...; cualquier otro valor cae en 'ALL'.
const INVERSION_TIPOS = [
  'ALL',
  'EN_PROGRESO',
  'ACEPTADO',
  'RECHAZADO',
  'RETIRADO'
];

const DEFAULT_ESTADO = 'EN_PROGRESO';

const list = async (tipo = 'ALL') => {
  const key = INVERSION_TIPOS.includes(String(tipo).toUpperCase())
    ? String(tipo).toUpperCase()
    : 'ALL';

  const rows = await investmentRepository.list();

  // Se aplana el cliente a su nombre y el estado actual a un string;
  // el filtro por tipo se aplica sobre ese estado actual.
  const inversiones = rows
    .map(({ client, estados, ...rest }) => ({
      ...rest,
      cliente: `${client.user.firstName} ${client.user.lastName}`,
      estado: estados[0]?.estado ?? DEFAULT_ESTADO
    }))
    .filter((inversion) => key === 'ALL' || inversion.estado === key);

  return {
    tipo: key,
    total: inversiones.length,
    inversiones
  };
};

export default {
    newInvestment,
    list
}