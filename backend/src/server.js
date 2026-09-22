import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import usersRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import clientRoutes from './routes/client.routes.js';
import cookieParser from 'cookie-parser';
import auditRoutes from './routes/audit.routes.js';
import investmentRoutes from './routes/investment.routes.js';
import { iniciarTareasProgramadas } from './jobs/scheduler.js';
import prisma from './db.js';

const app = express();
// Cabeceras de seguridad estándar (X-Content-Type-Options, X-Frame-Options,
// Strict-Transport-Security, Referrer-Policy...) y desactiva X-Powered-By,
// que hasta ahora delataba el stack (Express) en cada respuesta. Va antes
// de todo lo demás para que aplique a cualquier respuesta, incluidas las
// de error.
//
// crossOriginResourcePolicy se afloja a "cross-origin": el default
// "same-origin" de helmet bloqueaba que el frontend (otro puerto/origen,
// ver CORS más abajo) cargara el avatar (<img src="http://.../avatar">) --
// el navegador lo descartaba en silencio, sin llegar siquiera a disparar
// onError. Esta API es cross-origin a propósito (SPA en un origen, API en
// otro), así que las respuestas necesitan poder consumirse desde ahí.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cookieParser());
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Límite explícito del body JSON: ningún endpoint necesita payloads
// grandes (el avatar va por multipart, no por aquí). Frena payloads
// abusivos antes de tocar los controllers.
app.use(express.json({ limit: '32kb' }));

app.use('/users', usersRoutes);
app.use('/admin', adminRoutes);
app.use('/client', clientRoutes);
app.use('/audits', auditRoutes);
app.use('/investment', investmentRoutes);

// 404 en JSON para rutas no registradas (por defecto Express devuelve HTML).
app.use((req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado' });
});

// Manejador de errores centralizado: red de seguridad para errores
// sincrónicos en middlewares (p. ej. express.json con body inválido ->
// SyntaxError) y cualquier next(err). Los controllers hoy atrapan su
// propio error; migrarlos a next(err) permitiría borrar ~15 bloques
// try/catch repetidos y unificar el formato de error acá.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload demasiado grande' });
  }
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const server = app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
  iniciarTareasProgramadas();
});

// Apagado ordenado: deja de aceptar conexiones y cierra el pool de Prisma
// para no dejar conexiones colgadas en Postgres al desplegar/reiniciar.
const shutdown = (signal) => {
  console.log(`${signal} recibido, cerrando servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Si algo se cuelga, forzar la salida.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));