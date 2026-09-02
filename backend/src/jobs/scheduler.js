import investmentService from '../services/investment.service.js';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const ejecutarIncrementoDias = async () => {
  try {
    const resumen = await investmentService.incrementarDias();
    console.log('[scheduler] incrementarDias', resumen);
  } catch (error) {
    // Un fallo del job no debe tumbar el servidor: se reintenta en la
    // próxima corrida (y como es idempotente, no se pierde nada).
    console.error('[scheduler] incrementarDias falló:', error);
  }
};

// Programa el job para la próxima medianoche local y luego cada 24 h.
// También lo corre al arrancar: como `incrementarDias` es idempotente,
// esto pone al día cualquier medianoche perdida por reinicios/caídas.
export const iniciarTareasProgramadas = () => {
  ejecutarIncrementoDias();

  const ahora = new Date();
  const proximaMedianoche = new Date(ahora);
  // 00:00:05 para no competir con el cambio de día exacto.
  proximaMedianoche.setHours(24, 0, 5, 0);

  const msHastaMedianoche = proximaMedianoche.getTime() - ahora.getTime();

  setTimeout(() => {
    ejecutarIncrementoDias();
    setInterval(ejecutarIncrementoDias, MS_POR_DIA).unref();
  }, msHastaMedianoche).unref();
};
