import Joi from 'joi';
import { CODE_LENGTH } from '../services/verification.service.js';

// ==============================
// VALIDACIONES - Registro de usuario
// ==============================
const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'El nombre es obligatorio',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'any.required': 'El nombre es obligatorio'
  }),
  lastName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'El apellido es obligatorio',
    'string.min': 'El apellido debe tener al menos 2 caracteres',
    'any.required': 'El apellido es obligatorio'
  }),
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'El correo electrónico es obligatorio',
    'string.email': 'El correo electrónico no es válido',
    'any.required': 'El correo electrónico es obligatorio'
  }),
  password: Joi.string().min(8).required().messages({
    'string.empty': 'La contraseña es obligatoria',
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'any.required': 'La contraseña es obligatoria'
  })
});

// ==============================
// VALIDACIONES - Login
// ==============================
// A propósito NO repite las reglas de "al menos 8 caracteres":
// eso es una regla de qué contraseñas se pueden CREAR, no de
// login. Si alguien tiene una cuenta vieja con password de 6
// caracteres (por ejemplo, creada antes de subir el mínimo),
// un min(8) aquí le bloquearía el login con un error de
// "formato inválido" en vez de dejar que sea el bcrypt.compare
// el que diga "contraseña incorrecta". Aquí solo se valida que
// el campo exista y tenga forma de string no vacío.
const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'El correo electrónico es obligatorio',
    'string.email': 'El correo electrónico no es válido',
    'any.required': 'El correo electrónico es obligatorio'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'La contraseña es obligatoria',
    'any.required': 'La contraseña es obligatoria'
  })
});

const updateSchema= Joi.object({
  firstName: Joi.string().trim().min(2).max(50).messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres'
  }),
  lastName: Joi.string().trim().min(2).max(50).messages({
    'string.min': 'El apellido debe tener al menos 2 caracteres'
  }),
  email: Joi.string().trim().lowercase().email().messages({
    'string.email': 'El correo electrónico no es válido'
  })
});

const passwordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'La contraseña actual es obligatoria',
    'any.required': 'La contraseña actual es obligatoria'
  }),
  password: Joi.string().required().min(8).messages({
    'string.min': 'La contraseña debe tener minimo 8 caracteres',
    'string.empty': 'La contraseña es obligatoria',
    'any.required': 'La contraseña es obligatoria'
  })
});

// ==============================
// VALIDACIONES - Confirmar código de verificación
// ==============================
// Comparte forma entre /register/confirm y /change/password/confirm: un
// id de la verificación pendiente (ver verification.service.js) + el
// código de CODE_LENGTH dígitos que llegó al correo.
const confirmCodeSchema = Joi.object({
  verificationId: Joi.string().trim().required().messages({
    'string.empty': 'Falta el identificador de la verificación',
    'any.required': 'Falta el identificador de la verificación'
  }),
  code: Joi.string().trim().length(CODE_LENGTH).pattern(/^\d+$/).required().messages({
    'string.empty': 'El código es obligatorio',
    'string.length': `El código debe tener ${CODE_LENGTH} dígitos`,
    'string.pattern.base': `El código debe tener ${CODE_LENGTH} dígitos`,
    'any.required': 'El código es obligatorio'
  })
});

export { registerSchema, loginSchema, updateSchema, passwordSchema, confirmCodeSchema };