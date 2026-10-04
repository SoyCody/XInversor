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

// Login: mismo status/mensaje tanto si el correo no existe como si la
// contraseña no coincide, para no filtrar cuál de las dos cosas pasó
// (ver logClient). Antes esto se resolvía con dos errores separados
// (EmailDoesntExistError 404 / InvalidPasswordError 401 -- reutilizada
// arriba para el chequeo de "contraseña actual" al cambiar de
// contraseña, un contexto donde sí importa distinguir).
class InvalidCredentialsError extends Error {
  constructor() {
    super('Credenciales inválidas');
    this.name = 'InvalidCredentialsError';
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

// Hash bcrypt de una contraseña que nadie tiene: se compara contra esto
// cuando el correo no existe, para que ese camino tarde lo mismo que el
// de "contraseña incorrecta" (que sí corre bcrypt.compare contra un hash
// real) y un atacante no pueda distinguir "el correo existe" de "no
// existe" por el tiempo de respuesta.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('xinversor-dummy-hash-para-igualar-timing', 12);

const logClient = async ({ email, password }) => {
  const existingUser = await userRepository.findByEmail(email);

  // Mismo status/mensaje (InvalidCredentialsError, 401) y mismo costo de
  // bcrypt tanto si el correo no existe como si la contraseña no
  // coincide: antes el correo inexistente cortaba en un 404 sin correr
  // bcrypt.compare, lo que filtraba qué caso era por status Y por tiempo.
  const hashToCompare = existingUser?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const isPasswordValid = await bcrypt.compare(password, hashToCompare);

  if (!existingUser || !isPasswordValid) {
    throw new InvalidCredentialsError();
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

const changePassword = async (id, { currentPassword, password }) => {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new UserNotFoundError();
  }

  // Exige la contraseña actual antes de aceptar la nueva: una sesión
  // robada (cookie filtrada, dispositivo desbloqueado) ya no alcanza por
  // sí sola para tomar la cuenta.
  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    throw new InvalidPasswordError();
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Incrementa tokenVersion en la misma escritura (ver
  // user.repository.js#changePassword): cualquier JWT ya emitido con la
  // versión anterior deja de ser válido al instante (verifyToken lo
  // rechaza), aunque no haya expirado. El controller reemite la cookie
  // de ESTA sesión con la versión nueva para no dejar deslogueado a quien
  // acaba de cambiar su propia contraseña.
  const updated = await userRepository.changePassword({ id, passwordHash });

  await registrarAuditoria({
    userId: id,
    action: AUDIT_ACTIONS.UPDATE,
    tableName: AUDIT_TABLES.USER,
    targetId: id
  });

  return updated;
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
  InvalidCredentialsError,
  InvalidPasswordError,
  UserNotFoundError
};