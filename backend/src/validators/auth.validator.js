import Joi from 'joi';

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

const loginSchema = Joi.object({
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
})

export { registerSchema, loginSchema };