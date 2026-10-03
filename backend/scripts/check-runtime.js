// Diagnóstico para el servidor: ¿puede ESTE entorno ejecutar el WebAssembly
// que usa el cliente de Prisma (engineType = "client") y hacer una consulta?
// Lo llama deploy/cpanel-deploy.sh al final y deja el resultado en el log.
//
//   node --import tsx scripts/check-runtime.js
//
// Códigos de salida: 0 = todo bien, 2 = falla el WebAssembly (memoria),
// 3 = el WebAssembly carga pero la base de datos no responde,
// 4 = no se pudo crear el cliente (DATABASE_URL ausente o inválida).
// Nunca imprime variables de entorno ni la URL de la base de datos.
import '../src/loadEnv.js';

const limpiar = (msg) =>
  (String(msg).split('\n').map((l) => l.trim()).find(Boolean) ?? '').replace(/\w+:\/\/\S+/g, '<url>').slice(0, 240);

console.log(`[check] Node ${process.version}, NODE_OPTIONS=${process.env.NODE_OPTIONS || '(vacío)'}`);

// 1) WebAssembly mínimo: un módulo de 1 página de memoria. Es exactamente la
// operación que falló con "Cannot allocate Wasm memory for new instance":
// V8 reserva una zona grande de memoria virtual para cada instancia, y un
// hosting con límite de memoria virtual (ulimit -v) puede negársela.
const wasmMinimo = new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 5, 3, 1, 0, 1]);
try {
  new WebAssembly.Instance(new WebAssembly.Module(wasmMinimo));
  console.log('[check] WebAssembly mínimo: OK');
} catch (err) {
  console.log(`[check] WebAssembly mínimo: FALLA -> ${limpiar(err.message)}`);
  process.exit(2);
}

// 2) Crear el PrismaClient (importa src/db.js: lee DATABASE_URL, crea el pool).
let prisma;
try {
  ({ default: prisma } = await import('../src/db.js'));
} catch (err) {
  console.log(`[check] No se pudo crear el PrismaClient (revisa DATABASE_URL en .env): ${limpiar(err.message)}`);
  process.exit(4);
}

// 3) Primera consulta: aquí se compila/instancia el WebAssembly del query
// compiler y luego se habla con la base de datos.
try {
  await Promise.race([
    prisma.$queryRaw`SELECT 1`,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout de 20 s')), 20_000)),
  ]);
  console.log('[check] PrismaClient + consulta SELECT 1: OK (el WebAssembly del cliente carga y la BD responde)');
  await prisma.$disconnect();
  process.exit(0);
} catch (err) {
  const esWasm = /webassembly|wasm|out of memory/i.test(`${err.name} ${err.message}`);
  if (esWasm) {
    console.log(`[check] PrismaClient: FALLA EL WEBASSEMBLY DEL CLIENTE -> ${limpiar(err.message)}`);
    process.exit(2);
  }
  console.log(
    `[check] PrismaClient: el WebAssembly cargó bien, pero la consulta falló ` +
    `(${err.code ?? err.name}) -> ${limpiar(err.message)}`
  );
  process.exit(3);
}
