import jwt from 'jsonwebtoken';

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
  sameSite: 'strict', // no se envía en peticiones iniciadas desde otros sitios
  path: '/',
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Genera el token y lo manda como cookie httpOnly en la respuesta.
// Se llama desde el controller justo antes de responder en
// register/login.
const setAuthCookie = (res, user) => {
  const token = generateToken(user);
  res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge: JWT_MAX_AGE_MS });
};

// Middleware para proteger rutas privadas.
// Ya NO lee el header Authorization: lee la cookie httpOnly,
// que el navegador manda solo si la petición usa credentials: 'include'.
const verifyToken = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  }
  next();
};

export { generateToken, setAuthCookie, verifyToken, isAdmin };