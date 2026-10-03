// Punto de arranque para Passenger (cPanel): exige un archivo app.js en la raíz.
// Registra tsx (para poder cargar el cliente de Prisma, que es TypeScript) y
// después arranca src/server.js.
//
// Los imports van dentro de la función a propósito: tsx usa WebAssembly al
// cargarse, y en este hosting (límite de memoria virtual de 4 GB) eso falla
// si Node no se inició con --disable-wasm-trap-handler. Con un import
// estático ese error saldría sin explicación; así se captura y se explica.
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FLAG = '--disable-wasm-trap-handler';

const explicar = (err) => {
  const texto = `${err?.name ?? ''} ${err?.message ?? ''}`;
  if (/webassembly|wasm|out of memory/i.test(texto)) {
    return (
      'ERROR DE WEBASSEMBLY al iniciar: el hosting limita la memoria virtual y Node no puede ' +
      `reservar la que pide WebAssembly. Solución: definir NODE_OPTIONS=${FLAG} ` +
      '(Application Manager > Environment variables) y reiniciar la app.'
    );
  }
  return 'Error fatal del servidor (arranque o ejecución).';
};

const fallar = (err) => {
  const detalle = (err?.stack ?? String(err)).replace(/\w+:\/\/\S+/g, '<url>');
  const mensaje = `[${new Date().toISOString()}] ${explicar(err)}\n${detalle}\n`;
  console.error(mensaje);
  // Copia en un archivo junto a la app: en cPanel no siempre es fácil ver el
  // log de Passenger, pero sí abrir un archivo con el Administrador de archivos.
  try {
    appendFileSync(fileURLToPath(new URL('./startup-error.log', import.meta.url)), mensaje);
  } catch {
    // Si no se puede escribir el archivo, ya quedó en stderr.
  }
  process.exit(1);
};

// tsx lanza su carga de WebAssembly en una promesa interna que ningún try/catch
// de este archivo puede atrapar: si falla, llega como "promesa rechazada sin
// manejar". Estos dos manejadores garantizan que cualquier error fatal pase
// por fallar() (mensaje claro + stderr + archivo).
process.on('uncaughtException', fallar);
process.on('unhandledRejection', fallar);

// Sin top-level await a propósito: Passenger puede cargar este archivo con
// require(), y require() rechaza los módulos ESM que usan await al nivel raíz.
(async () => {
  const { register } = await import('tsx/esm/api');
  register();
  await import('./src/server.js');
})().catch(fallar);
