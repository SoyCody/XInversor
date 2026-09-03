import investmentRepository from '../repositories/investment.repository.js';
import { registrarAuditoria, AUDIT_ACTIONS, AUDIT_TABLES } from './auditorias.service.js';
import { parsePage, buildMeta, paginateArray } from '../utils/pagination.js';

const INTERES_RATE = 0.1;

const DIAS_PARA_HABILITAR = 15;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const fail = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const newInvestment = async (userId, { monto }) => {
  const client = await investmentRepository.getIdByUser(userId);

  if (!client) {
    throw new Error('El usuario no tiene un perfil de cliente');
  }

  const montoNum = Number(monto);

  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    throw new Error('El monto debe ser un número mayor a 0');
  }

  // Un cliente no puede acumular más de MAX_INVERSIONES_ACTIVAS
  // inversiones activas (PENDIENTE o EN_PROGRESO) al mismo tiempo.
  const inversiones = await investmentRepository.myList(client.id);
  const activas = inversiones.filter((inv) =>
    ESTADOS_ACTIVOS.includes(inv.estados[0]?.estado ?? DEFAULT_ESTADO)
  ).length;

  if (activas >= MAX_INVERSIONES_ACTIVAS) {
    throw fail(
      409,
      `No puedes tener más de ${MAX_INVERSIONES_ACTIVAS} inversiones activas al mismo tiempo`
    );
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
  'PENDIENTE',
  'EN_PROGRESO',
  'RETIRADO'
];

const DEFAULT_ESTADO = 'PENDIENTE';

// Límite de inversiones activas simultáneas por cliente. Cuenta las que
// están PENDIENTE o EN_PROGRESO; las RETIRADO ya no ocupan cupo.
const MAX_INVERSIONES_ACTIVAS = 5;
const ESTADOS_ACTIVOS = ['PENDIENTE', 'EN_PROGRESO'];

const list = async (tipo = 'ALL', rawPage) => {
  const key = INVERSION_TIPOS.includes(String(tipo).toUpperCase())
    ? String(tipo).toUpperCase()
    : 'ALL';

  const page = parsePage(rawPage);
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
    ...buildMeta(inversiones.length, page),
    inversiones: paginateArray(inversiones, page)
  };
};

// Listado paginado de las inversiones de un cliente con el filtro por
// estado aplicado en memoria (el estado vive en una relación). Lo usan
// tanto "mis inversiones" (cliente) como el detalle del admin.
const listInversionesCliente = async (clientId, tipo = 'ALL', rawPage) => {
  const key = INVERSION_TIPOS.includes(String(tipo).toUpperCase())
    ? String(tipo).toUpperCase()
    : 'ALL';

  const page = parsePage(rawPage);

  const rows = await investmentRepository.myList(clientId);

  const todas = rows.map(({ estados, ...rest }) => ({
    ...rest,
    estado: estados[0]?.estado ?? DEFAULT_ESTADO
  }));

  const inversiones = todas.filter(
    (inversion) => key === 'ALL' || inversion.estado === key
  );

  return {
    tipo: key,
    ...buildMeta(inversiones.length, page),
    // Cupo de inversiones activas: sirve para que el frontend deshabilite
    // "Nueva inversión" antes de llegar al límite.
    activas: todas.filter((i) => ESTADOS_ACTIVOS.includes(i.estado)).length,
    limiteActivas: MAX_INVERSIONES_ACTIVAS,
    inversiones: paginateArray(inversiones, page)
  };
};

const myList = async (userId, tipo = 'ALL', rawPage) => {
  // req.user.id es el id del User; las inversiones cuelgan del Client.
  const client = await investmentRepository.getIdByUser(userId);

  if (!client) {
    throw new Error('El usuario no tiene un perfil de cliente');
  }

  return listInversionesCliente(client.id, tipo, rawPage);
};

const getInvestment = async (userId, inversionId) => {
  if (!Number.isInteger(inversionId) || inversionId <= 0) {
    throw fail(400, 'Inversión inválida');
  }

  const client = await investmentRepository.getIdByUser(userId);
  if (!client) {
    throw fail(404, 'El usuario no tiene un perfil de cliente');
  }

  const inversion = await investmentRepository.getInvestment(inversionId);
  if (!inversion) {
    throw fail(404, 'La inversión no existe');
  }

  // Un cliente solo puede ver el detalle de sus propias inversiones.
  if (inversion.clientId !== client.id) {
    throw fail(403, 'Esta inversión no te pertenece');
  }

  const estadoActual = inversion.estados[0]?.estado ?? DEFAULT_ESTADO;

  return {
    inversion: {
      id: inversion.id,
      monto: inversion.monto,
      intereses: inversion.intereses,
      total: inversion.total,
      dias: inversion.dias,
      createdAt: inversion.createdAt,
      estado: estadoActual,
      // Días que faltan para que se habiliten los retiros (0 si ya se pueden).
      diasParaHabilitar:
        estadoActual === 'PENDIENTE'
          ? Math.max(0, DIAS_PARA_HABILITAR - inversion.dias)
          : 0,
      // Puede pedir retiro si está EN_PROGRESO y no tiene solicitud sin resolver.
      puedeSolicitarRetiro:
        estadoActual === 'EN_PROGRESO' &&
        !inversion.solicitudes.some((s) => s.estado === 'PENDIENTE'),
      historialEstados: inversion.estados.map((e) => ({
        estado: e.estado,
        fecha: e.createdAt
      })),
      solicitudes: inversion.solicitudes
    }
  };
};

const createApplication = async (userId, inversionId, montoRetiro) => {
  if (!Number.isInteger(inversionId) || inversionId <= 0) {
    throw fail(400, 'Inversión inválida');
  }

  const montoNum = Number(montoRetiro);
  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    throw fail(400, 'El monto a retirar debe ser un número mayor a 0');
  }

  const client = await investmentRepository.getIdByUser(userId);
  if (!client) {
    throw fail(404, 'El usuario no tiene un perfil de cliente');
  }

  const inversion = await investmentRepository.getInversionParaSolicitud(inversionId);
  if (!inversion) {
    throw fail(404, 'La inversión no existe');
  }

  // La solicitud solo la puede pedir el dueño de la inversión.
  if (inversion.clientId !== client.id) {
    throw fail(403, 'Esta inversión no te pertenece');
  }

  const estadoActual = inversion.estados[0]?.estado ?? 'PENDIENTE';
  if (estadoActual === 'PENDIENTE') {
    throw fail(409, 'La inversión todavía está en el período de bloqueo de 15 días');
  }
  if (estadoActual === 'RETIRADO') {
    throw fail(409, 'La inversión ya fue retirada');
  }

  // Regla del modelo: una sola solicitud sin resolver por inversión.
  if (inversion.solicitudes.length > 0) {
    throw fail(409, 'Ya existe una solicitud de retiro pendiente para esta inversión');
  }

  // No se puede pedir más de lo que la inversión tiene disponible (BTC).
  if (montoNum > Number(inversion.total)) {
    throw fail(422, 'El monto solicitado supera el total disponible de la inversión');
  }

  let solicitud;
  try {
    solicitud = await investmentRepository.crearSolicitud(inversionId, montoNum);
  } catch (error) {
    // Carrera contra el índice único [inversionId, pendiente]: otra
    // solicitud entró primero entre la validación y el insert.
    if (error?.code === 'P2002') {
      throw fail(409, 'Ya existe una solicitud de retiro pendiente para esta inversión');
    }
    throw error;
  }

  await registrarAuditoria({
    userId,
    action: AUDIT_ACTIONS.CREATE,
    tableName: AUDIT_TABLES.SOLICITUD,
    targetId: solicitud.id
  });

  return solicitud;
};

const diasTranscurridos = (createdAt) => {
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(diff / MS_POR_DIA));
};

const incrementarDias = async () => {
  const inversiones = await investmentRepository.getInversionesActivas();

  let actualizadas = 0;
  let habilitadas = 0;

  for (const inversion of inversiones) {
    const estadoActual = inversion.estados[0]?.estado ?? 'PENDIENTE';

    // Una inversión retirada ya no envejece.
    if (estadoActual === 'RETIRADO') continue;

    const dias = diasTranscurridos(inversion.createdAt);
    const habilitar =
      estadoActual === 'PENDIENTE' && dias >= DIAS_PARA_HABILITAR;

    // Nada que hacer: mismo contador y sin cambio de estado.
    if (dias === inversion.dias && !habilitar) continue;

    await investmentRepository.avanzarInversion(inversion.id, { dias, habilitar });

    if (dias !== inversion.dias) actualizadas += 1;
    if (habilitar) habilitadas += 1;
  }

  return {
    revisadas: inversiones.length,
    actualizadas,
    habilitadas
  };
};

// Inversiones de un cliente para la vista de administrador. Acepta los
// mismos filtros (?tipo=) y paginación (?page=) que "mis inversiones".
const inversionesCliente = async (userId, tipo = 'ALL', rawPage) => {
  const client = await investmentRepository.getIdByUser(userId);

  // Un usuario sin perfil de cliente (p. ej. un admin) no tiene inversiones.
  if (!client) {
    return {
      tipo: 'ALL',
      ...buildMeta(0, parsePage(rawPage)),
      activas: 0,
      limiteActivas: MAX_INVERSIONES_ACTIVAS,
      inversiones: []
    };
  }

  return listInversionesCliente(client.id, tipo, rawPage);
};

export default {
  newInvestment,
  list,
  myList,
  createApplication,
  incrementarDias,
  getInvestment,
  inversionesCliente
};
