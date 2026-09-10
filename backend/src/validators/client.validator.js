import Joi from 'joi';

// La wallet de bitcoins: solo se guarda como texto. No se valida contra
// la red, solo que tenga forma razonable de dirección (letras y números,
// largo típico de una dirección BTC legacy/segwit/taproot).
const walletSchema = Joi.object({
  wallet: Joi.string()
    .trim()
    .min(20)
    .max(120)
    .pattern(/^[a-zA-Z0-9]+$/)
    .required()
    .messages({
      'string.empty': 'La wallet es obligatoria',
      'string.min': 'La wallet no parece válida',
      'string.max': 'La wallet no parece válida',
      'string.pattern.base': 'La wallet solo puede contener letras y números',
      'any.required': 'La wallet es obligatoria'
    })
});

export { walletSchema };
