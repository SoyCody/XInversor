import investmentRepository from '../repositories/investment.repository.js';
import auditoriasRepository from '../repositories/auditorias.repository.js';
import { AUDIT_ACTIONS, AUDIT_TABLES } from './auditorias.service.js';
import { parsePage, buildMeta, paginateArray } from '../utils/pagination.js';

// Notificaciones derivadas: no hay una tabla propia (ni falta que hace).
// Todo lo que un cliente/admin necesita saber ya vive en Estado, Solicitud
// y Audit -- acá solo se combina, se ordena por fecha y se pagina, igual
// que el resto del módulo de inversiones hace con listados que no se
// pueden filtrar directo en SQL.
const NOTIFICACIONES_RECIENTES = 5;

// Historial de paquetes aprobados/rechazados de un cliente + historial de
// retiros aceptados/rechazados: juntos son "todo lo que un cliente
// necesita saber sobre decisiones ya tomadas en sus inversiones" (ver el
// pedido del feature). Un paquete aprobado sigue siendo una notificación
// válida aunque después haya pasado a EN_PROGRESO o RETIRADO, así que se
// arma desde el HISTORIAL (getPaquetesResueltos/getRetirosResueltos), no
// desde el estado actual.
const notificacionesDeCliente = async (clientId) => {
  const [paquetes, retiros] = await Promise.all([
    investmentRepository.getPaquetesResueltos(clientId),
    investmentRepository.getRetirosResueltos(clientId)
  ]);

  const dePaquetes = paquetes.map((e) => ({
    id: `paquete-${e.id}`,
    tipo: e.estado === 'EN_ESPERA' ? 'PAQUETE_APROBADO' : 'PAQUETE_RECHAZADO',
    fecha: e.createdAt,
    inversionId: e.inversion.id,
    monto: e.inversion.monto,
    montoRetiro: null,
    cliente: null,
    auditoriaId: null
  }));

  const deRetiros = retiros.map((s) => ({
    id: `retiro-${s.id}`,
    tipo: s.estado === 'ACEPTADA' ? 'RETIRO_APROBADO' : 'RETIRO_RECHAZADO',
    fecha: s.resueltaEn,
    inversionId: s.inversionId,
    monto: null,
    montoRetiro: s.montoRetiro,
    cliente: null,
    auditoriaId: null
  }));

  return [...dePaquetes, ...deRetiros].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
};

// Paquetes y retiros PENDIENTE de cualquier cliente: lo único que le
// interesa al admin ("nuevas inversiones o retiros por revisar, nada
// más" -- ver el pedido del feature). A diferencia de las notificaciones
// del cliente, estas SÍ son sobre el estado actual: una vez que el admin
// aprueba/rechaza, deja de estar "por revisar" y desaparece de acá (para
// eso ya queda el historial de esa decisión como notificación del
// cliente).
const notificacionesDeAdmin = async () => {
  const [inversiones, retiros] = await Promise.all([
    investmentRepository.list(),
    investmentRepository.getSolicitudesPendientes()
  ]);

  const paquetesNuevos = inversiones.filter(
    (inv) => (inv.estados[0]?.estado ?? 'PENDIENTE') === 'PENDIENTE'
  );

  const [auditoriasPaquetes, auditoriasRetiros] = await Promise.all([
    auditoriasRepository.findByTargets(
      AUDIT_TABLES.INVERSION,
      AUDIT_ACTIONS.CREATE,
      paquetesNuevos.map((inv) => inv.id)
    ),
    auditoriasRepository.findByTargets(
      AUDIT_TABLES.SOLICITUD,
      AUDIT_ACTIONS.CREATE,
      retiros.map((s) => s.id)
    )
  ]);

  const auditoriaDePaquete = new Map(auditoriasPaquetes.map((a) => [a.targetId, a.id]));
  const auditoriaDeRetiro = new Map(auditoriasRetiros.map((a) => [a.targetId, a.id]));

  const dePaquetes = paquetesNuevos.map((inv) => ({
    id: `paquete-${inv.id}`,
    tipo: 'PAQUETE_NUEVO',
    fecha: inv.createdAt,
    inversionId: inv.id,
    monto: inv.monto,
    montoRetiro: null,
    cliente: `${inv.client.user.firstName} ${inv.client.user.lastName}`,
    auditoriaId: auditoriaDePaquete.get(inv.id) ?? null
  }));

  const deRetiros = retiros.map((s) => ({
    id: `retiro-${s.id}`,
    tipo: 'RETIRO_NUEVO',
    fecha: s.createdAt,
    inversionId: s.inversionId,
    monto: null,
    montoRetiro: s.montoRetiro,
    cliente: `${s.inversion.client.user.firstName} ${s.inversion.client.user.lastName}`,
    auditoriaId: auditoriaDeRetiro.get(s.id) ?? null
  }));

  return [...dePaquetes, ...deRetiros].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
};

const recientesCliente = async (userId) => {
  const client = await investmentRepository.getIdByUser(userId);
  if (!client) return [];

  const todas = await notificacionesDeCliente(client.id);
  return todas.slice(0, NOTIFICACIONES_RECIENTES);
};

const listarCliente = async (userId, rawPage) => {
  const page = parsePage(rawPage);
  const client = await investmentRepository.getIdByUser(userId);

  if (!client) {
    return { ...buildMeta(0, page), notificaciones: [] };
  }

  const todas = await notificacionesDeCliente(client.id);
  return { ...buildMeta(todas.length, page), notificaciones: paginateArray(todas, page) };
};

const recientesAdmin = async () => {
  const todas = await notificacionesDeAdmin();
  return todas.slice(0, NOTIFICACIONES_RECIENTES);
};

const listarAdmin = async (rawPage) => {
  const page = parsePage(rawPage);
  const todas = await notificacionesDeAdmin();
  return { ...buildMeta(todas.length, page), notificaciones: paginateArray(todas, page) };
};

export default {
  recientesCliente,
  listarCliente,
  recientesAdmin,
  listarAdmin
};
