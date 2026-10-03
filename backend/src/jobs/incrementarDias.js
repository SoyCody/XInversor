// Entrada de línea de comandos para el job diario que envejece las
// inversiones (columna `dias` + paso a EN_PROGRESO a los 15 días).
//
// Uso puntual / cron del sistema (Task Scheduler de Windows, crontab, etc.):
//   npm run job:dias
//   node --disable-wasm-trap-handler --import tsx src/jobs/incrementarDias.js
//
// En cPanel (Cron Jobs), con rutas absolutas y el flag de WebAssembly:
//   cd /home/fxinvers45/fxinversor-api && NODE_OPTIONS=--disable-wasm-trap-handler /opt/cpanel/ea-nodejs20/bin/node --import tsx src/jobs/incrementarDias.js >> /home/fxinvers45/cron-dias.log 2>&1
//
// La app además lo corre sola cada medianoche (ver src/jobs/scheduler.js),
// así que este script es sobre todo para entornos donde el proceso no
// queda vivo o para forzar una corrida manual.
import '../loadEnv.js';
import prisma from '../db.js';
import investmentService from '../services/investment.service.js';

investmentService
  .incrementarDias()
  .then((resumen) => {
    console.log('[incrementarDias]', resumen);
  })
  .catch((error) => {
    console.error('[incrementarDias] error:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
