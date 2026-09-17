import auditoriasRepository from '../repositories/auditorias.repository.js';
import { parsePage, buildMeta } from '../utils/pagination.js';

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  ROLE_CHANGE: 'ROLE_CHANGE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  RETIRAR: 'RETIRAR'
};

export const AUDIT_TABLES = {
  USER: 'user',
  ROL: 'rol',
  INVERSION: 'inversion',
  CLIENT: 'cliente',
  SOLICITUD: 'solicitud',
  CONFIGURACION: 'configuracion'
};

// CONSISTENCIA: hoy los servicios hacen `await mutación` y luego
// `await registrarAuditoria(...)` como dos operaciones sueltas. Si la
// mutación funciona y la auditoría falla, el controller responde 500 y el
// cliente cree que la operación no se hizo, cuando sí quedó aplicada (p.
// ej. promoteToAdmin, blockClient, updateWallet, newInvestment).
// Dos caminos, según cuán crítica sea la auditoría:
//  - Crítica: envolver mutación + createAudit en un mismo prisma.$transaction.
//  - No crítica: hacerla best-effort (try/catch + log) para que nunca
//    tumbe la operación principal.
export const registrarAuditoria = ({ userId, action, tableName, targetId }) => {
  return auditoriasRepository.createAudit({ userId, action, tableName, targetId });
};

export const auditorias = async (rawPage) => {
  const page = parsePage(rawPage);
  const { rows, total } = await auditoriasRepository.all(page);

  const auditorias = rows.map(({ id, user, action, tableName }) => ({
    id,
    nombre: `${user.firstName} ${user.lastName}`,
    rol: user.role,
    accion: action,
    tabla: tableName
  }));

  const meta = buildMeta(total, page);

  return {
    totalAuditorias: meta.total,
    ...meta,
    auditorias
  };
};

export const verAuditoria = async (id) => {
  const registro = await auditoriasRepository.findById(id);

  if (!registro) {
    return { auditoria: null };
  }

  const { user, action, tableName, targetId, createdAt } = registro;

  return {
    auditoria: {
      nombre: `${user.firstName} ${user.lastName}`,
      rol: user.role,
      correo: user.email,
      accion: action,
      tabla: tableName,
      targetId,
      createdAt
    }
  };
};
