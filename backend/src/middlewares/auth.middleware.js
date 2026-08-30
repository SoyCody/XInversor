import jwt from 'jsonwebtoken';
import userRepository from '../repositories/user.repository.js';
import clientRepository from '../repositories/client.repository.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN_DAYS = Number(process.env.JWT_EXPIRES_IN_DAYS) || 1;
const JWT_EXPIRES_IN = `${JWT_EXPIRES_IN_DAYS}d`;
const JWT_MAX_AGE_MS = JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;

export const COOKIE_NAME = 'access_token';

// Estas mismas opciones se deben usar tanto al SETEAR la cookie
// (login/register) como al LIMPIARLA (logout). Si no coinciden
// exactamente (sobre todo "path"), el navegador no la reconoce
// como la misma cookie y clearCookie no borra nada.
export const COOKIE_OPTIONS = {
  httpOnly: true, // JS del navegador no puede leer ni tocar esta cookie
  secure: process.env.NODE_ENV === 'production', // solo por HTTPS en prod
  sameSite: 'lax', // permite cookies en la app local frontend/backend sin bloquear la sesión
  path: '/',
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, 
      email: user.email, 
      role: user.role, 
      state: user.state 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Genera el token y lo manda como cookie httpOnly en la respuesta.
// Se llama desde el controller justo antes de responder en
// register/login.
const setAuthCookie = (res, user) => {
  const token = generateToken(user);
  res.cookie(
    COOKIE_NAME, 
    token, 
    { ...COOKIE_OPTIONS, 
      maxAge: JWT_MAX_AGE_MS 
    });
};

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ 
        error: 'No autenticado' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userRepository.findActiveById(decoded.id);

    if (!user) {
      res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
      return res.status(401).json({
        error: 'La sesión ya no está activa'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      state: user.state
    };
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Token inválido o expirado' 
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Acceso solo para administradores' 
    });
  }
  next();
};

const isActive = (req, res, next) => {
  if (req.user?.state !== 'ACTIVO'){
    return res.status(403).json({
      error: 'Este usuario está borrado actualmente'
    });
  }
  next();
};

const isnBlocked = async (req, res, next) => {
  try {
    const client = await clientRepository.getBlocked(req.user.id);

    if (client?.blocked) {
      return res.status(403).json({
        error: 'Acceso denegado: cuenta bloqueada'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      error: 'No se pudo verificar el estado de la cuenta'
    });
  }
};

export {
  generateToken,
  setAuthCookie,
  verifyToken,
  isAdmin,
  isActive,
  isnBlocked
};