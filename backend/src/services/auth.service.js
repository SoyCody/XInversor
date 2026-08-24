import bcrypt from 'bcryptjs';
import userRepository from '../repositories/user.repository.js';
import { registrarAuditoria, AUDIT_ACTIONS, AUDIT_TABLES } from './auditorias.service.js';

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
    this.name = 'EmailDoesntExistError'; // <- te faltaba la "r" al final
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
  // ==============================
  // COMPROBAR CORREO
  // ==============================
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new EmailAlreadyExistsError();
  }

  // ==============================
  // HASH DE CONTRASEÑA
  // ==============================
  const passwordHash = await bcrypt.hash(password, 12);
  const userData = {
    firstName,
    lastName,
    email,
    passwordHash,
    role: 'CLIENT',
    client: {
      create: {
        // Aquí posteriormente colocaremos
        // la generación definitiva del link.
        link: `https://accounts.binance.bh/en-BH/register?ref=XZV234DGDGD2&registerChannel=&return_to=aHR0cHM6Ly93d3cuYmluYW5jZS5iaC9lbi1CSC92aXAtaW5zdGl0dXRpb25hbC1zZXJ2aWNlcz9yZWY9WkhIRlNZSU0%3D`
      }
    }
  };

  // ==============================
  // CREAR USUARIO
  // ==============================
  const newUser = await userRepository.createUser(userData);

  await registrarAuditoria({
    userId: newUser.id,
    action: AUDIT_ACTIONS.CREATE,
    tableName: AUDIT_TABLES.USER,
    targetId: newUser.id
  });

  // No devolver el hash
  const { passwordHash: _passwordHash, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

const logClient = async ({ email, password }) => {
  // ==============================
  // COMPROBAR QUE EL USUARIO EXISTE
  // ==============================
  const existingUser = await userRepository.findByEmail(email);
  if (!existingUser) {
    throw new EmailDoesntExistError();
  }

  // ==============================
  // COMPARAR CONTRASEÑA
  // ==============================
  const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);
  if (!isPasswordValid) {
    throw new InvalidPasswordError();
  }

  // No devolver el hash
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
  const passwordHash = await bcrypt.hash(password, 12);
  const userData = { id, passwordHash }; 
  
  const updatePassword = await userRepository.changePassword(userData);
  return updatePassword;
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
  EmailAlreadyExistsError,
  EmailDoesntExistError,
  InvalidPasswordError,
  UserNotFoundError
};