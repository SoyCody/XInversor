import * as authService from '../services/auth.service.js';
import { generateToken } from '../middlewares/auth.middleware.js';

const register = async (req, res) => {
  try {
    const user = await authService.registerClient(req.body);

    // Único cambio respecto al comportamiento original:
    // ahora se genera y devuelve un token JWT junto al usuario.
    const token = generateToken(user);

    res.status(201).json({
      ...user,
      token
    });
  } catch (error) {
    if (error instanceof authService.EmailAlreadyExistsError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    // Si dos registros llegan casi al mismo tiempo con el
    // mismo correo, la comprobación previa puede no alcanzar
    // a detectarlo: Prisma lanza P2002 por la restricción
    // única de la base de datos.
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Ya existe una cuenta con este correo electrónico'
      });
    }

    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

const login = async (req, res) => {
  try {
    const user = await authService.logClient(req.body);
    const token = generateToken(user);

    res.status(200).json({
      ...user,
      token
    });
  } catch (error) {
    if (error instanceof authService.EmailDoesntExistError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error instanceof authService.InvalidPasswordError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export default { register, login };