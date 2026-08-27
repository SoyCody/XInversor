import { Client } from 'pg';
import auditoriasRepository from '../repositories/auditorias.repository.js';

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
  CLIENT: 'cliente'
};

export const registrarAuditoria = ({ userId, action, tableName, targetId }) => {
  return auditoriasRepository.createAudit({ userId, action, tableName, targetId });
};

export const auditorias = async () => {
  const registros = await auditoriasRepository.all();

  const auditorias = registros.map(({ id, user, action, tableName }) => ({
    id,
    nombre: `${user.firstName} ${user.lastName}`,
    rol: user.role,
    accion: action,
    tabla: tableName
  }));

  return {
    totalAuditorias: auditorias.length,
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
