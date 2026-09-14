// Compartido por las series mensuales del panel de administración
// (clientes registrados, capital invertido, inversiones creadas...).
export const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Índices de mes (0-11) desde enero hasta el mes actual: la base de
// cualquier serie que se reinicia cada 1 de enero y se va alargando mes
// a mes según avanza el año (en vez de una ventana móvil de N meses que
// cruzaría años arbitrariamente).
export const mesesDelAnhoHastaHoy = (ahora = new Date()) => {
  const meses = [];
  for (let mes = 0; mes <= ahora.getMonth(); mes++) {
    meses.push(mes);
  }
  return meses;
};
