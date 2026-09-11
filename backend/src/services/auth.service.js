import bcrypt from 'bcryptjs';
import userRepository from '../repositories/user.repository.js';
import { registrarAuditoria, AUDIT_ACTIONS, AUDIT_TABLES } from './auditorias.service.js';
import { getDefaultAvatar } from '../utils/defaultAvatar.js';

// Error de dominio: se traduce a un 409 en el controller.
class EmailAlreadyExistsError extends Error {
  constructor() {
    super('Ya existe una cuenta con este correo electrónico');
    this.name = 'EmailAlreadyExistsError';
    this.statusCode = 409;
  }
}

class EmailDoesntExistError extends Error {
  constructor() {
    super('Credenciales inválidas');
    this.name = 'EmailDoesntExistError';
    this.statusCode = 404;
  }
}

class UserNotFoundError extends Error {
  constructor() {
    super('Usuario no encontrado');
    this.name = 'UserNotFoundError';
    this.statusCode = 404;
  }
}

// Nueva: contraseña incorrecta. StatusCode 401, no 400/404,
// porque las credenciales están bien formadas pero no coinciden.
class InvalidPasswordError extends Error {
  constructor() {
    super('Contraseña incorrecta');
    this.name = 'InvalidPasswordError';
    this.statusCode = 401;
  }
}

const registerClient = async ({ firstName, lastName, email, password }) => {

  // findByEmail filtra state=ACTIVO, pero User.email es @unique global (sin
  // filtro de state). Si el email pertenece a una cuenta BORRADA, este
  // check pasa y luego el create revienta con P2002 -> el controller
  // responde 409 "ya existe una cuenta" sin que el usuario entienda por
  // qué. Decidir producto: ¿se permite reusar el email de una cuenta
  // borrada? Si sí, hay que reactivar esa fila en vez de crear otra.
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new EmailAlreadyExistsError();
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { buffer: defaultAvatar, mimeType: defaultAvatarType } = getDefaultAvatar();
  const userData = {
    firstName,
    lastName,
    email,
    passwordHash,
    role: 'CLIENT',
    avatar: defaultAvatar,
    avatarType: defaultAvatarType,
    avatarUpdatedAt: new Date(),
    client: {
      create: {}
    }
  };

  const newUser = await userRepository.createUser(userData);

  await registrarAuditoria({
    userId: newUser.id,
    action: AUDIT_ACTIONS.CREATE,
    tableName: AUDIT_TABLES.USER,
    targetId: newUser.id
  });

  const { passwordHash: _passwordHash, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

const logClient = async ({ email, password }) => {
  const existingUser = await userRepository.findByEmail(email);
  if (!existingUser) {
    // User enumeration: este camino lanza 404 y no ejecuta bcrypt.compare,
    // mientras que "password incorrecta" lanza 401 y sí lo ejecuta. Un
    // atacante distingue "email existe" de "no existe" por el status y por
    // el tiempo de respuesta. Endurecimiento: mismo status (401) y mismo
    // mensaje en ambos casos, y correr un bcrypt.compare contra un hash
    // dummy cuando el email no existe para igualar la latencia.
    throw new EmailDoesntExistError();
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);
  if (!isPasswordValid) {
    throw new InvalidPasswordError();
  }

  const { passwordHash: _passwordHash, ...userWithoutPassword } = existingUser;
  return userWithoutPassword;
};

const updateClient = async (id, { firstName, lastName, email }) => {
  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new UserNotFoundError(); 
  }

  // Solo validar el email si realmente está cambiando
  if (email && email !== existingUser.email) {
    const emailOwner = await userRepository.findByEmail(email);
    if (emailOwner) {
      throw new EmailAlreadyExistsError();
    }
  }

  // Solo mandamos al repo los campos que vinieron en el body
  const userData = {
    id,
    ...(firstName !== undefined && { firstName }),
    ...(lastName !== undefined && { lastName }),
    ...(email !== undefined && { email }),
  };

  // updateSchema no exige .min(1): un PUT /users/edit con body {} pasa la
  // validación, hace un UPDATE sin cambios y aun así escribe una fila de
  // auditoría. Conviene rechazar el body vacío en el schema (o salir
  // temprano si no hay campos que actualizar).
  const updatedUser = await userRepository.updateUser(userData);

  await registrarAuditoria({
    userId: id,
    action: AUDIT_ACTIONS.UPDATE,
    tableName: AUDIT_TABLES.USER,
    targetId: id
  });

  const { passwordHash: _passwordHash, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

const changePassword = async (id, { password }) => {
  // SEGURIDAD: no se pide ni se verifica la contraseña actual. Con una
  // sesión válida (cookie) cualquiera puede cambiarla. Sumado a que no hay
  // protección CSRF explícita y sameSite es 'lax', el riesgo sube.
  // Además no se invalidan las demás sesiones: los JWT ya emitidos siguen
  // válidos hasta expirar (no hay tokenVersion ni lista de revocación).
  // Recomendado: exigir `currentPassword`, compararla con bcrypt, y
  // bumpear un `tokenVersion` en User que verifyToken chequee.
  const passwordHash = await bcrypt.hash(password, 12);
  const userData = { id, passwordHash };

  // changePassword usa updateMany -> devuelve { count }. Si count === 0
  // (usuario inexistente/borrado) no se entera nadie; hoy isActive lo
  // previene, pero conviene tratar count===0 como 404.
  const updatePassword = await userRepository.changePassword(userData);
  return updatePassword;
};

const updateAvatar = async (id, file) => {
  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new UserNotFoundError();
  }

  const updated = await userRepository.updateAvatar({
    id,
    avatar: file.buffer,
    avatarType: file.mimetype
  });

  await registrarAuditoria({
    userId: id,
    action: AUDIT_ACTIONS.UPDATE,
    tableName: AUDIT_TABLES.USER,
    targetId: id
  });

  return { avatarUpdatedAt: updated.avatarUpdatedAt };
};

const getAvatar = async (id) => {
  return userRepository.getAvatar(id);
};

const deleteUser =  async (id) =>{
  const deleted = await userRepository.deleteUser(id);

  await registrarAuditoria({
    userId: id,
    action: AUDIT_ACTIONS.DELETE,
    tableName: AUDIT_TABLES.USER,
    targetId: id
  });

  return deleted;
}

export {
  registerClient,
  logClient,
  updateClient,
  changePassword,
  deleteUser,
  updateAvatar,
  getAvatar,
  EmailAlreadyExistsError,
  EmailDoesntExistError,
  InvalidPasswordError,
  UserNotFoundError
};