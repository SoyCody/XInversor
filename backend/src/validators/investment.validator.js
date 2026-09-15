import Joi from 'joi';

// Alta de inversión. Sin esto, POST /investment/new no validaba nada y un
// `monto` no numérico / negativo / gigante caía en un 500 de Prisma
// (overflow de Decimal(14,2)) en vez de en un 400 claro.
// El máximo = tope de la columna monto Decimal(14,2); no impone regla de
// negocio, solo evita el overflow.
const createInvestmentSchema = Joi.object({
  monto: Joi.number().positive().max(999999999999.99).precision(2).required().messages({
    'number.base': 'El monto debe ser un número',
    'number.positive': 'El monto debe ser mayor a 0',
    'number.max': 'El monto excede el máximo permitido',
    'any.required': 'El monto es obligatorio'
  })
});

const createApplicationSchema = Joi.object({
  montoRetiro: Joi.number().positive().precision(8).required().messages({
    'number.base': 'El monto a retirar debe ser un número',
    'number.positive': 'El monto a retirar debe ser mayor a 0',
    'any.required': 'El monto a retirar es obligatorio'
  })
});

// Cambio del porcentaje de intereses (panel de administración). Se
// guarda como fracción (0.10 = 10%): tope en 1 para no permitir un
// porcentaje absurdo por error de tipeo.
const updatePercentSchema = Joi.object({
  porcentaje: Joi.number().positive().max(1).precision(4).required().messages({
    'number.base': 'El porcentaje debe ser un número',
    'number.positive': 'El porcentaje debe ser mayor a 0',
    'number.max': 'El porcentaje no puede ser mayor a 1',
    'any.required': 'El porcentaje es obligatorio'
  })
});

export { createInvestmentSchema, createApplicationSchema, updatePercentSchema };
