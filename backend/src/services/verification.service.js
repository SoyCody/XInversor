import bcrypt from 'bcryptjs';
import verificationRepository from '../repositories/verification.repository.js';
import { sendVerificationEmail } from '../utils/mailer.js';

const CODE_LENGTH = 4;
const CODE_MAX = 10 ** CODE_LENGTH;
const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5;
// Coste bajo a propósito (vs. 12 en las contraseñas, ver auth.service.js):
// un código de pocos dígitos ya tiene poquísima entropía, el hash acá
// solo evita que un volcado de la BD lo exponga en texto plano durante su
// ventana de 15 minutos, no que resista fuerza bruta offline.
const CODE_HASH_COST = 8;

class VerificationNotFoundError extends Error {
  constructor() {
    super('El código expiró o no es válido, solicita uno nuevo');
    this.name = 'VerificationNotFoundError';
    this.statusCode = 410;
  }
}

class InvalidCodeError extends Error {
  constructor() {
    super('El código ingresado es incorrecto');
    this.name = 'InvalidCodeError';
    this.statusCode = 400;
  }
}

class TooManyAttemptsError extends Error {
  constructor() {
    super('Superaste el número de intentos permitidos, solicita un código nuevo');
    this.name = 'TooManyAttemptsError';
    this.statusCode = 429;
  }
}

const generateCode = () => {
  // 0–(CODE_MAX-1) con padding: siempre CODE_LENGTH dígitos, incluidos
  // los que empiezan en 0 (si se generara con Math.random().toString()
  // se perdería el padding y el código mostrado en el correo no
  // coincidiría en longitud con lo que valida confirmAndConsume).
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % CODE_MAX;
  return String(n).padStart(CODE_LENGTH, '0');
};

// Crea y manda un código nuevo para (email, purpose). `payload` es lo que
// se aplica cuando el código se confirme (ver auth.service.js): ya debe
// venir con cualquier contraseña ya hasheada, nunca en texto plano.
const createVerification = async ({ purpose, email, payload }) => {
  await verificationRepository.deleteExpired();
  // Invalida cualquier código pendiente anterior para este mismo correo
  // y propósito (ver deleteByEmailAndPurpose): solo el último enviado
  // sirve, así "reenviar código" es simplemente llamar esto de nuevo.
  await verificationRepository.deleteByEmailAndPurpose(email, purpose);

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, CODE_HASH_COST);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  const verification = await verificationRepository.create({
    purpose,
    email,
    codeHash,
    payload,
    expiresAt,
  });

  // Se manda DESPUÉS de guardar en la BD: si Resend falla, el error sale
  // tal cual (EmailDeliveryError) y el controller lo traduce a 502 -- no
  // queda un código "fantasma" que el usuario nunca recibió, porque no
  // se guardó nada permanente aparte de esta fila (que expira sola).
  await sendVerificationEmail({ to: email, code, purpose });

  return { verificationId: verification.id, email, expiresAt };
};

// Valida el código contra el que se guardó para `verificationId` y
// devuelve el payload pendiente. Quien llama decide qué hacer con él
// (crear el usuario, aplicar la contraseña nueva...) y es responsable de
// borrar la fila cuando ya la usó -- ver confirmAndConsume más abajo,
// que es lo que casi siempre conviene en vez de llamar esto suelto.
const verifyCode = async ({ verificationId, code, purpose, email }) => {
  const verification = await verificationRepository.findById(verificationId);

  if (!verification || verification.purpose !== purpose) {
    throw new VerificationNotFoundError();
  }

  // Si el llamador conoce el correo esperado (p. ej. cambio de
  // contraseña, atado al usuario autenticado), se exige que coincida:
  // evita que alguien confirme el código de OTRA verificación con un
  // verificationId ajeno adivinado o filtrado.
  if (email && verification.email !== email) {
    throw new VerificationNotFoundError();
  }

  if (verification.expiresAt < new Date()) {
    await verificationRepository.deleteById(verification.id);
    throw new VerificationNotFoundError();
  }

  if (verification.attempts >= MAX_ATTEMPTS) {
    await verificationRepository.deleteById(verification.id);
    throw new TooManyAttemptsError();
  }

  const isValid = await bcrypt.compare(String(code), verification.codeHash);
  if (!isValid) {
    await verificationRepository.incrementAttempts(verification.id);
    throw new InvalidCodeError();
  }

  return verification;
};

// Camino normal: valida y, si el código es correcto, borra la fila de
// una vez (de un solo uso) y devuelve el payload guardado.
const confirmAndConsume = async ({ verificationId, code, purpose, email }) => {
  const verification = await verifyCode({ verificationId, code, purpose, email });
  await verificationRepository.deleteById(verification.id);
  return verification.payload;
};

export {
  CODE_LENGTH,
  createVerification,
  confirmAndConsume,
  VerificationNotFoundError,
  InvalidCodeError,
  TooManyAttemptsError,
};
