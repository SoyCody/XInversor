// Diagnóstico para el servidor: ¿puede ESTE entorno ejecutar WebAssembly?
// Se prueba por etapas para saber QUÉ falla. Lo llama deploy/cpanel-deploy.sh
// y deja el resultado en el log.
//
//   node scripts/check-runtime.js                                  (variante A)
//   NODE_OPTIONS=--disable-wasm-trap-handler node scripts/check-runtime.js   (B)
//
// OJO: se ejecuta con `node` a secas, SIN `--import tsx`. tsx también usa
// WebAssembly; si lo cargáramos de entrada, un fallo de memoria lo taparía
// todo y no sabríamos en qué etapa ocurre. Aquí se registra después.
//
// Códigos de salida: 0 = todo bien
//   5 = falla al cargar tsx (su lexer es WebAssembly)
//   2 = falla el WebAssembly más simple (límite de memoria virtual)
//   4 = no se pudo crear el cliente de Prisma (DATABASE_URL ausente/inválida)
//   6 = falla el WebAssembly del cliente de Prisma (query compiler)
//   3 = el WebAssembly carga pero la base de datos no responde
// Nunca imprime variables de entorno ni la URL de la base de datos.
import '../src/loadEnv.js';

const limpiar = (msg) =>
  (String(msg).split('\n').map((l) => l.trim()).find(Boolean) ?? '').replace(/\w+:\/\/\S+/g, '<url>').slice(0, 240);
const esWasm = (err) => /webassembly|wasm|out of memory/i.test(`${err?.name} ${err?.message}`);

console.log(`[check] Node ${process.version}, NODE_OPTIONS=${process.env.NODE_OPTIONS || '(vacío)'}`);

// IMPORTANTE (probado en Linux con ulimit -v 4 GB): el ORDEN importa. tsx
// arranca un hilo auxiliar (otro "isolate" de V8) al registrarse; si antes ya
// existe una instancia de WebAssembly, ya no queda memoria virtual para ese
// hilo y Node muere con "Failed to reserve virtual memory for CodeRange". La
// app real (app.js) registra tsx primero y Prisma carga su WebAssembly después,
// así que aquí se hace igual.

// Etapa 1: tsx (necesario para cargar el cliente de Prisma, que es .ts).
let tsxOk = true;
try {
  const { register } = await import('tsx/esm/api');
  register();
  console.log('[check] 1) tsx: OK');
} catch (err) {
  tsxOk = false;
  console.log(`[check] 1) tsx: FALLA${esWasm(err) ? ' (WebAssembly)' : ''} -> ${limpiar(err.message)}`);
}

// Etapa 2: WebAssembly mínimo (1 página de memoria). V8 reserva una zona
// grande de memoria virtual por instancia; con ulimit -v bajo no puede
// (salvo con --disable-wasm-trap-handler).
const wasmMinimo = new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 5, 3, 1, 0, 1]);
try {
  new WebAssembly.Instance(new WebAssembly.Module(wasmMinimo));
  console.log('[check] 2) WebAssembly mínimo: OK');
} catch (err) {
  console.log(`[check] 2) WebAssembly mínimo: FALLA -> ${limpiar(err.message)}`);
  process.exit(2);
}
if (!tsxOk) process.exit(5);

// Etapa 3: crear el PrismaClient (importa src/db.js: lee DATABASE_URL).
let prisma;
try {
  ({ default: prisma } = await import('../src/db.js'));
  console.log('[check] 3) PrismaClient creado: OK');
} catch (err) {
  console.log(`[check] 3) PrismaClient: FALLA -> ${limpiar(err.message)} (revisa DATABASE_URL en .env)`);
  process.exit(4);
}

// Etapa 4: primera consulta. Aquí se instancia el WebAssembly del query
// compiler de Prisma y luego se habla con la base de datos.
try {
  await Promise.race([
    prisma.$queryRaw`SELECT 1`,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout de 20 s')), 20_000)),
  ]);
  console.log('[check] 4) Consulta SELECT 1: OK (WebAssembly de Prisma carga y la BD responde)');
  await prisma.$disconnect();
  process.exit(0);
} catch (err) {
  if (esWasm(err)) {
    console.log(`[check] 4) Consulta: FALLA EL WEBASSEMBLY DE PRISMA -> ${limpiar(err.message)}`);
    process.exit(6);
  }
  console.log(`[check] 4) Consulta: el WebAssembly cargó bien, pero la BD falló (${err.code ?? err.name}) -> ${limpiar(err.message)}`);
  process.exit(3);
}
