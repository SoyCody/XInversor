// Carga el .env buscándolo junto al proyecto (backend/.env), NO en el
// "directorio de trabajo actual". `import 'dotenv/config'` usa
// process.cwd(), y Passenger (cPanel) puede arrancar la app desde otra
// carpeta, con lo que el .env no se encontraría y la app arrancaría sin
// DATABASE_URL ni JWT_SECRET.
//
// Debe importarse PRIMERO en cada punto de entrada: varios módulos leen
// process.env al cargarse (p. ej. auth.middleware.js), así que las
// variables tienen que existir antes de importarlos.
//
// dotenv no pisa variables que ya existan en el entorno, así que lo que
// defina el hosting (p. ej. en Application Manager) tiene prioridad.
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
