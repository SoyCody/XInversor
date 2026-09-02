import Joi from 'joi';

const createApplicationSchema = Joi.object({
  montoRetiro: Joi.number().positive().precision(8).required().messages({
    'number.base': 'El monto a retirar debe ser un número',
    'number.positive': 'El monto a retirar debe ser mayor a 0',
    'any.required': 'El monto a retirar es obligatorio'
  })
});

export { createApplicationSchema };
