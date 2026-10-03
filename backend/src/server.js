import './loadEnv.js';
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

// Todo error de arranque o inesperado va a stderr (console.error): en
// cPanel/Passenger es lo que termina en los logs de la app. Se registran
// antes de nada para no perder errores tempranos.
process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Promesa rechazada sin manejar:', reason);
  process.exit(1);
});

const isProd = process.env.NODE_ENV === 'production';

// ¿Node se inició con --disable-wasm-trap-handler? En el hosting (límite de
// memoria virtual de 4 GB) hace falta para que cualquier WebAssembly (tsx,
// el cliente de Prisma) pueda cargarse. Solo se puede dar al INICIAR el
// proceso (NODE_OPTIONS o argumento de node), por eso aquí solo se informa.
const wasmFlagActivo = `${process.env.NODE_OPTIONS ?? ''} ${process.execArgv.join(' ')}`
  .includes('--disable-wasm-trap-handler');

// Sin estas variables la app arrancaría "bien" y fallaría recién en la
// primera petición, con un error poco claro. Mejor avisar y parar acá.
const faltantes = ['DATABASE_URL', 'JWT_SECRET'].filter((k) => !process.env[k]);
if (faltantes.length > 0) {
  console.error(
    `Faltan variables de entorno obligatorias: ${faltantes.join(', ')}. ` +
    'Revisar el archivo .env junto a app.js (ver src/loadEnv.js).'
  );
  process.exit(1);
}

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

// En producción casi siempre hay un proxy/balanceador delante (el de la
// plataforma de hosting, nginx, Cloudflare...) que termina el TLS y
// reenvía por HTTP interno. Sin "trust proxy", req.ip resuelve a la IP
// del proxy para TODAS las conexiones, no a la del cliente real -- los
// límites de intentos por IP (ver rateLimit.middleware.js) dejan de
// distinguir usuarios y terminan compartiendo un único cupo entre todos
// (un usuario agota el límite y bloquea a los demás). express-rate-limit
// además marca esto por consola (ValidationError
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR) al detectar X-Forwarded-For sin
// "trust proxy" configurado -- no rechaza la petición, pero es la pista
// de que falta este ajuste. TRUST_PROXY permite subir cuántos saltos de
// proxy confiar si hay más de uno encadenado (por defecto, 1); en
// desarrollo no hay proxy, así que esto no aplica.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
}

// Orígenes del frontend permitidos (FRONTEND_URL, separados por coma si
// hay más de uno). El navegador envía el origen sin barra final
// (https://fxinversors.com), así que se normaliza: un "https://x.com/" en
// el .env nunca coincidiría y bloquearía TODAS las peticiones. En
// producción no hay valor por defecto: si falta, no se permite ningún
// origen externo.
const allowedOrigins = (process.env.FRONTEND_URL || (isProd ? '' : 'http://localhost:5173'))
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

if (isProd && allowedOrigins.length === 0) {
  console.error('FRONTEND_URL no está definida: CORS rechazará todas las peticiones del navegador.');
}
if (isProd && allowedOrigins.some((o) => !o.startsWith('https://'))) {
  console.error(`FRONTEND_URL debería ser https:// en producción (actual: ${allowedOrigins.join(', ')}).`);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Límite explícito del body JSON: ningún endpoint necesita payloads
// grandes (el avatar va por multipart, no por aquí). Frena payloads
// abusivos antes de tocar los controllers.
app.use(express.json({ limit: '32kb' }));

// Diagnóstico de despliegue: abrir https://<api>/health en el navegador.
// 200 = la app corre Y llegó a la base de datos; 503 = la app corre pero
// la BD no responde (p. ej. el hosting bloquea el puerto 5432). Solo
// devuelve un código genérico, nunca el mensaje de error (podría incluir
// el host de la BD); el detalle completo queda en el log. Se puede borrar
// cuando ya no haga falta.
app.get('/health', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), 10_000).unref();
      }),
    ]);
    res.json({ status: 'ok', db: 'ok', wasmTrapHandlerDisabled: wasmFlagActivo });
  } catch (err) {
    console.error('[health] falló la consulta a la BD:', err?.code ?? err?.name, err?.message);
    res.status(503).json({
      status: 'error', db: 'error', code: err?.code ?? 'UNKNOWN', wasmTrapHandlerDisabled: wasmFlagActivo,
    });
  }
});

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

// Bajo Passenger (cPanel) es él quien decide dónde escucha la app: ignora
// el puerto que se le pase a listen() y usa su propio socket, así que
// PORT solo importa en local.
const server = app.listen(PORT, () => {
  console.log(`Servidor backend escuchando (puerto ${PORT}, NODE_ENV=${process.env.NODE_ENV || 'sin definir'})`);
  console.log(`Node ${process.version} | --disable-wasm-trap-handler: ${wasmFlagActivo ? 'ACTIVO' : 'NO activo'}`);
  iniciarTareasProgramadas();
});

server.on('error', (err) => {
  console.error('Error del servidor HTTP:', err);
  process.exit(1);
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