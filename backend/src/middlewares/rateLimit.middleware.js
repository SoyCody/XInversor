import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde.' }
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registros desde esta IP. Intenta de nuevo más tarde.' }
});

// Confirmar un código de verificación (registro o cambio de contraseña):
// límite propio y más estricto que el de registro/login, porque acá el
// ataque es adivinar un código de pocos dígitos a fuerza bruta contra el
// mismo verificationId. Se combina con el límite de intentos que ya lleva
// cada fila en la BD (ver verification.service.js#MAX_ATTEMPTS), que
// invalida el código entero al agotarse -- esto de acá frena además a
// quien va probando con varios verificationId distintos desde la misma IP.
export const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo más tarde.' }
});
