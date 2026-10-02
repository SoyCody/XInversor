import { register } from 'tsx/esm/api';
register();
import('./src/server.js').catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
