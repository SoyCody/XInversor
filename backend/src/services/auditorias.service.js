import auditoriasRepository from '../repositories/auditorias.repository.js';
import { parsePage, buildMeta } from '../utils/pagination.js';

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  ROLE_CHANGE: 'ROLE_CHANGE'
};

export const AUDIT_TABLES = {
  USER: 'user',
  ROL: 'rol',
  INVERSION: 'inversion',
  CLIENT: 'cliente',
  SOLICITUD: 'solicitud'
};

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
