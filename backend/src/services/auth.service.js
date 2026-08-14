import bcrypt from 'bcryptjs';
import userRepository from '../repositories/user.repository.js';

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
        link: `user-${Date.now()}`
      }
    }
  };

  // ==============================
  // CREAR USUARIO
  // ==============================
  const newUser = await userRepository.createUser(userData);

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

export {
  registerClient,
  logClient,
  EmailAlreadyExistsError,
  EmailDoesntExistError,
  InvalidPasswordError
};