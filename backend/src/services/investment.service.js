import investmentRepository from '../repositories/investment.repository.js';
import { registrarAuditoria, AUDIT_ACTIONS, AUDIT_TABLES } from './auditorias.service.js';
import { parsePage, buildMeta, paginateArray } from '../utils/pagination.js';
import { MESES_ES, mesesDelAnhoHastaHoy } from '../utils/meses.js';

const INTERES_RATE_DEFAULT = 0.1;

const DIAS_PARA_HABILITAR = 15;
// Tiempo de vida máximo de una inversión EN_PROGRESO: cumplidos estos
// meses desde que empezó a generar intereses, se marca RETIRADO sola
// (ver incrementarDias), sin que nadie tenga que pedir un retiro.
const MESES_VIDA_MAXIMA = 10;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const fail = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const tieneWallet = (wallet) =>
  typeof wallet === 'string' && wallet.trim().length > 0;

// Date#getDay(): 0 = domingo ... 6 = sábado. Los retiros solo se pueden
// solicitar en día hábil (lunes a viernes); usa la hora del servidor,
// igual que el resto del módulo (ver incrementarDias/resumenAdminInversiones).
const esDiaHabil = (fecha = new Date()) => {
  const dia = fecha.getDay();
  return dia >= 1 && dia <= 5;
};

// Mensaje compartido por las dos acciones que exigen que la inversión
// esté EN_PROGRESO (pedir un retiro, terminarla a mano): explica por qué
// no se puede según el estado en el que esté en vez de un genérico
// "no se puede". Reutilizado por createApplication() y retire().
const mensajeNoEnProgreso = (estado) => {
  switch (estado) {
    case 'RETIRADO':
      return 'La inversión ya fue retirada';
    case 'RECHAZADO':
      return 'La inversión fue rechazada por un administrador';
    case 'PENDIENTE':
      return 'La inversión todavía está pendiente de revisión del administrador';
    case 'EN_ESPERA':
      return 'La inversión todavía está en el período de bloqueo de 15 días';
    default:
      return 'La inversión no está en progreso';
  }
};

const newInvestment = async (userId, { monto }) => {
  const client = await investmentRepository.getIdByUser(userId);

  if (!client) {
    // fail() adjunta statusCode; con `new Error` plano el controller caía
    // siempre a 500 aunque el problema fuese de la request.
    throw fail(404, 'El usuario no tiene un perfil de cliente');
  }

  if (!tieneWallet(client.wallet)) {
    throw fail(409, 'Necesitas registrar tu wallet antes de poder invertir');
  }

  // la ruta ya valida `monto` con Joi
  // (createInvestmentSchema), esto cubre llamadas internas al servicio.
  const montoNum = Number(monto);

  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    throw fail(400, 'El monto debe ser un número mayor a 0');
  }

  // Un cliente no puede acumular más de MAX_INVERSIONES_ACTIVAS
  // inversiones activas (PENDIENTE, EN_ESPERA o EN_PROGRESO) al mismo
  // tiempo.
  //
  // Race condition conocida: dos POST /investment/new en paralelo pueden
  // pasar los dos este chequeo y dejar al cliente con activas+1. Si el
  // límite tiene que ser estricto, hay que contarlo y crear la inversión
  // dentro de una misma transacción con SELECT ... FOR UPDATE sobre el
  // Client, o un índice/constraint que lo garantice.
  //
  // Perf: myList trae TODAS las inversiones del cliente para contar. Con
  // el denormalizado de estado (ver investment.repository.js) esto sería
  // un simple prisma.inversion.count({ where: { clientId, estadoActual: { in: [...] } } }).
  const inversiones = await investmentRepository.myList(client.id);
  const activas = inversiones.filter((inv) =>
    ESTADOS_ACTIVOS.includes(inv.estados[0]?.estado ?? DEFAULT_ESTADO)
  ).length;

  if (activas >= MAX_INVERSIONES_ACTIVAS) {
    throw fail(
      409,
      `No puedes tener más de ${MAX_INVERSIONES_ACTIVAS} inversiones activas al mismo tiempo`
    );
  }

  // El monto es la base sobre la que se generan intereses A TRAVÉS DEL
  // TIEMPO (día hábil a día hábil, ver incrementarDias), no de una sola
  // vez acá: al crearse todavía no generó nada, así que arranca en 0 y
  // `total` es solo el capital. El porcentaje vigente en este momento
  // queda congelado en `porcentajeInteres` -- si el admin lo cambia
  // después, solo afecta a las inversiones que se creen desde ahí, no
  // reescribe esta.
  const porcentajeInteres = await getPorcentajeInteres();

  // dias arranca en 0: mientras esté PENDIENTE/EN_ESPERA cuenta el
  // período de bloqueo de 15 días; la inversión no tiene fecha de fin
  // fija más allá del vencimiento a los MESES_VIDA_MAXIMA meses (ver
  // incrementarDias).
  const inversion = await investmentRepository.registerInvestment({
    clientId: client.id,
    monto: montoNum,
    porcentajeInteres,
    intereses: 0,
    dias: 0,
    total: montoNum
  });

  await registrarAuditoria({
    userId,
    action: AUDIT_ACTIONS.CREATE,
    tableName: AUDIT_TABLES.INVERSION,
    targetId: inversion.id
  });

  return inversion;
};

// Tipos aceptados en ?tipo=...; cualquier otro valor cae en 'ALL'.
const INVERSION_TIPOS = [
  'ALL',
  'PENDIENTE',
  'EN_ESPERA',
  'EN_PROGRESO',
  'RECHAZADO',
  'RETIRADO'
];

const DEFAULT_ESTADO = 'PENDIENTE';

// Límite de inversiones activas simultáneas por cliente. Cuenta las que
// todavía pueden llegar a EN_PROGRESO (PENDIENTE, esperando que el admin
// la revise; EN_ESPERA, ya aprobada y contando los 15 días) o ya están
// EN_PROGRESO; RECHAZADO y RETIRADO son estados terminales y no ocupan cupo.
const MAX_INVERSIONES_ACTIVAS = 5;
const ESTADOS_ACTIVOS = ['PENDIENTE', 'EN_ESPERA', 'EN_PROGRESO'];

const list = async (tipo = 'ALL', rawPage) => {
  const key = INVERSION_TIPOS.includes(String(tipo).toUpperCase())
    ? String(tipo).toUpperCase()
    : 'ALL';

  const page = parsePage(rawPage);
  // ATENCIÓN (escala): esto trae la tabla `inversion` COMPLETA en cada
  // request de este listado de admin, la mapea y la pagina en memoria,
  // solo porque el estado actual vive en la relación `estados` y no se
  // puede filtrar/paginar directo en SQL. Con "medio flujo" y crecimiento
  // esto se vuelve el primer cuello de botella del panel de admin.
  // Solución recomendada: denormalizar `estadoActual` (EstadoInversion) en
  // la tabla Inversion, mantenerlo en la misma transacción que crea el
  // Estado, y aquí pasar a where + skip/take + count reales.
  const [rows, solicitudesPendientesRaw] = await Promise.all([
    investmentRepository.list(),
    investmentRepository.getSolicitudesPendientes()
  ]);

  // Se aplana el cliente a su nombre y el estado actual a un string;
  // el filtro por tipo se aplica sobre ese estado actual.
  const todas = rows.map(({ client, estados, ...rest }) => ({
    ...rest,
    cliente: `${client.user.firstName} ${client.user.lastName}`,
    estado: estados[0]?.estado ?? DEFAULT_ESTADO
  }));
  const inversiones = todas.filter((inversion) => key === 'ALL' || inversion.estado === key);

  // Misma forma que `inversiones` (cliente aplanado a nombre), pero una
  // fila por solicitud sin resolver en vez de por inversión: alimenta la
  // sección "Retiros pendientes" de abajo, cuyo botón "Detalles" navega
  // a la inversión dueña de la solicitud (inversionId).
  const solicitudesPendientes = solicitudesPendientesRaw.map((s) => ({
    id: s.id,
    inversionId: s.inversionId,
    cliente: `${s.inversion.client.user.firstName} ${s.inversion.client.user.lastName}`,
    intereses: s.inversion.intereses,
    montoRetiro: s.montoRetiro
  }));

  return {
    tipo: key,
    ...buildMeta(inversiones.length, page),
    // Tarjetas y gráficos del panel de administración: siempre sobre
    // TODAS las inversiones (sin importar el filtro `tipo` elegido para
    // la tabla), por eso se calculan sobre `todas` y no sobre `inversiones`.
    ...resumenAdminInversiones(todas),
    inversiones: paginateArray(inversiones, page),
    solicitudesPendientes
  };
};

// Cuántas inversiones de una lista ya aplanada (con `estado` como string)
// están en un estado dado. Reutilizado por resumenAdminInversiones() y
// resumenInversiones() en vez de repetir el mismo `.filter(...).length`
// por cada estado.
const contarPorEstado = (inversiones, estado) =>
  inversiones.filter((inversion) => inversion.estado === estado).length;

// "Montos" = la suma sobre TODAS las inversiones (no un promedio ni el
// valor de una sola). `capitalPorMes`/`inversionesPorMes` siguen el mismo
// criterio que `admin.service.js#clientesPorMes`: arrancan en enero y se
// alargan mes a mes según avanza el año, en vez de una ventana móvil.
const resumenAdminInversiones = (todas) => {
  const ahora = new Date();
  const anho = ahora.getFullYear();

  const capitalPorMesMap = new Map();
  const cantidadPorMesMap = new Map();
  for (const inversion of todas) {
    const fecha = new Date(inversion.createdAt);
    if (fecha.getFullYear() !== anho) continue;
    const mes = fecha.getMonth();
    capitalPorMesMap.set(mes, (capitalPorMesMap.get(mes) ?? 0) + Number(inversion.monto));
    cantidadPorMesMap.set(mes, (cantidadPorMesMap.get(mes) ?? 0) + 1);
  }

  const meses = mesesDelAnhoHastaHoy(ahora);

  return {
    // Nombre distinto de `total` (que `buildMeta` ya usa para el conteo
    // filtrado/paginado de la tabla): este es el conteo global, sin
    // importar el filtro `tipo` elegido, para la tarjeta "Total".
    totalInversiones: todas.length,
    totalIntereses: todas.reduce((sum, inversion) => sum + Number(inversion.intereses), 0),
    pendientes: contarPorEstado(todas, 'PENDIENTE'),
    enEspera: contarPorEstado(todas, 'EN_ESPERA'),
    enProgreso: contarPorEstado(todas, 'EN_PROGRESO'),
    rechazadas: contarPorEstado(todas, 'RECHAZADO'),
    retiradas: contarPorEstado(todas, 'RETIRADO'),
    capitalPorMes: meses.map((mes) => ({ mes: MESES_ES[mes], monto: capitalPorMesMap.get(mes) ?? 0 })),
    inversionesPorMes: meses.map((mes) => ({ mes: MESES_ES[mes], cantidad: cantidadPorMesMap.get(mes) ?? 0 }))
  };
};

// Listado paginado de las inversiones de un cliente con el filtro por
// estado aplicado en memoria (el estado vive en una relación). Lo usan
// tanto "mis inversiones" (cliente) como el detalle del admin.
const listInversionesCliente = async (clientId, tipo = 'ALL', rawPage) => {
  const key = INVERSION_TIPOS.includes(String(tipo).toUpperCase())
    ? String(tipo).toUpperCase()
    : 'ALL';

  const page = parsePage(rawPage);

  const rows = await investmentRepository.myList(clientId);

  const todas = rows.map(({ estados, ...rest }) => ({
    ...rest,
    estado: estados[0]?.estado ?? DEFAULT_ESTADO
  }));

  const inversiones = todas.filter(
    (inversion) => key === 'ALL' || inversion.estado === key
  );

  return {
    tipo: key,
    ...buildMeta(inversiones.length, page),
    // Cupo de inversiones activas: sirve para que el frontend deshabilite
    // "Nueva inversión" antes de llegar al límite.
    activas: todas.filter((i) => ESTADOS_ACTIVOS.includes(i.estado)).length,
    limiteActivas: MAX_INVERSIONES_ACTIVAS,
    inversiones: paginateArray(inversiones, page)
  };
};

const myList = async (userId, tipo = 'ALL', rawPage) => {
  // req.user.id es el id del User; las inversiones cuelgan del Client.
  const client = await investmentRepository.getIdByUser(userId);

  if (!client) {
    throw new Error('El usuario no tiene un perfil de cliente');
  }

  return listInversionesCliente(client.id, tipo, rawPage);
};

// NOTA: `dias`, `diasParaHabilitar`, `intereses` y `total` salen de
// columnas persistidas que solo se refrescan a medianoche (job
// incrementarDias). Entre corridas el valor puede estar hasta ~24h
// desactualizado -- en particular, los intereses de una inversión
// EN_PROGRESO no suben en tiempo real, solo cuando corre el job. Si el
// frontend necesita exactitud, recalcular con
// diasHabilesTranscurridos(inicioEnProgreso) * monto * porcentajeInteres
// en vez de leer inversion.intereses directo.
//
// Compartido entre getInvestment (cliente, sobre las suyas) y
// getInvestmentAdmin (administrador, sobre cualquiera): la única
// diferencia entre ambos es quién puede pedir el detalle, no la forma
// de la respuesta.
const buildInvestmentDetail = (inversion) => {
  const estadoActual = inversion.estados[0]?.estado ?? DEFAULT_ESTADO;

  return {
    inversion: {
      id: inversion.id,
      monto: inversion.monto,
      intereses: inversion.intereses,
      total: inversion.total,
      dias: inversion.dias,
      createdAt: inversion.createdAt,
      estado: estadoActual,
      // Días que faltan para que se habiliten los retiros (0 si ya se
      // pueden o si ni siquiera arrancó el período de espera). Solo
      // EN_ESPERA cuenta días: PENDIENTE todavía espera la revisión del
      // admin, no hay contador corriendo.
      diasParaHabilitar:
        estadoActual === 'EN_ESPERA'
          ? Math.max(0, DIAS_PARA_HABILITAR - inversion.dias)
          : 0,
      // Puede pedir retiro si está EN_PROGRESO y no tiene solicitud sin resolver.
      puedeSolicitarRetiro:
        estadoActual === 'EN_PROGRESO' &&
        !inversion.solicitudes.some((s) => s.estado === 'PENDIENTE'),
      historialEstados: inversion.estados.map((e) => ({
        estado: e.estado,
        fecha: e.createdAt
      })),
      solicitudes: inversion.solicitudes
    }
  };
};

const getInvestment = async (userId, inversionId) => {
  if (!Number.isInteger(inversionId) || inversionId <= 0) {
    throw fail(400, 'Inversión inválida');
  }

  const client = await investmentRepository.getIdByUser(userId);
  if (!client) {
    throw fail(404, 'El usuario no tiene un perfil de cliente');
  }

  const inversion = await investmentRepository.getInvestment(inversionId);
  if (!inversion) {
    throw fail(404, 'La inversión no existe');
  }

  // Un cliente solo puede ver el detalle de sus propias inversiones.
  if (inversion.clientId !== client.id) {
    throw fail(403, 'Esta inversión no te pertenece');
  }

  return buildInvestmentDetail(inversion);
};

// Detalle de cualquier inversión para el panel de administración: a
// diferencia de getInvestment, no exige ser el dueño (el acceso ya lo
// resuelve la ruta con isAdmin) y además expone la wallet del cliente
// dueño (el admin la necesita para verificar/enviar pagos) y su userId
// (para el botón "Ver cliente", que enlaza a /admin/clientes/:id -- esa
// ruta toma el id de User, no el de Client).
const getInvestmentAdmin = async (inversionId) => {
  if (!Number.isInteger(inversionId) || inversionId <= 0) {
    throw fail(400, 'Inversión inválida');
  }

  const inversion = await investmentRepository.getInvestment(inversionId);
  if (!inversion) {
    throw fail(404, 'La inversión no existe');
  }

  const detalle = buildInvestmentDetail(inversion);
  detalle.inversion.walletCliente = inversion.client?.wallet ?? null;
  detalle.inversion.clienteUserId = inversion.client?.userId ?? null;
  return detalle;
};

const createApplication = async (userId, inversionId, montoRetiro) => {
  if (!Number.isInteger(inversionId) || inversionId <= 0) {
    throw fail(400, 'Inversión inválida');
  }

  const montoNum = Number(montoRetiro);
  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    throw fail(400, 'El monto a retirar debe ser un número mayor a 0');
  }

  if (!esDiaHabil()) {
    throw fail(409, 'Los retiros solo se pueden solicitar en días laborables (lunes a viernes)');
  }

  const client = await investmentRepository.getIdByUser(userId);
  if (!client) {
    throw fail(404, 'El usuario no tiene un perfil de cliente');
  }

  const inversion = await investmentRepository.getInversionParaSolicitud(inversionId);
  if (!inversion) {
    throw fail(404, 'La inversión no existe');
  }

  // La solicitud solo la puede pedir el dueño de la inversión.
  if (inversion.clientId !== client.id) {
    throw fail(403, 'Esta inversión no te pertenece');
  }

  const estadoActual = inversion.estados[0]?.estado ?? DEFAULT_ESTADO;
  if (estadoActual !== 'EN_PROGRESO') {
    throw fail(409, mensajeNoEnProgreso(estadoActual));
  }

  // Regla del modelo: una sola solicitud sin resolver por inversión.
  if (inversion.solicitudes.some((s) => s.pendiente)) {
    throw fail(409, 'Ya existe una solicitud de retiro pendiente para esta inversión');
  }

  // Un retiro sale solo de los intereses generados: el capital invertido
  // (monto) no se toca, y aprobar un retiro tampoco baja `intereses` (lo
  // escribe únicamente incrementarDias, según los días hábiles
  // transcurridos -- ver approve()). Lo disponible para pedir es, entonces,
  // el total de intereses generados hasta ahora menos lo que ya se aceptó
  // en solicitudes anteriores.
  const yaRetirado = inversion.solicitudes
    .filter((s) => s.estado === 'ACEPTADA')
    .reduce((sum, s) => sum + Number(s.montoRetiro), 0);
  const disponible = Number(inversion.intereses) - yaRetirado;

  if (montoNum > disponible) {
    throw fail(422, 'El monto solicitado supera los intereses disponibles de la inversión');
  }

  let solicitud;
  try {
    solicitud = await investmentRepository.crearSolicitud(inversionId, montoNum);
  } catch (error) {
    // Carrera contra el índice único [inversionId, pendiente]: otra
    // solicitud entró primero entre la validación y el insert.
    if (error?.code === 'P2002') {
      throw fail(409, 'Ya existe una solicitud de retiro pendiente para esta inversión');
    }
    throw error;
  }

  await registrarAuditoria({
    userId,
    action: AUDIT_ACTIONS.CREATE,
    tableName: AUDIT_TABLES.SOLICITUD,
    targetId: solicitud.id
  });

  return solicitud;
};

const diasTranscurridos = (createdAt) => {
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(diff / MS_POR_DIA));
};

// Días hábiles (lunes a viernes) transcurridos estrictamente después de
// `desde` y hasta `hasta` (hoy si no se pasa). Recorre día por día en vez
// de una fórmula cerrada por semana completa: con MESES_VIDA_MAXIMA de
// tope, una inversión vive como mucho unos pocos cientos de días, así que
// no vale la pena la complejidad extra. Reutiliza esDiaHabil(), la misma
// regla que ya usa createApplication() para bloquear retiros en fin de
// semana.
const diasHabilesTranscurridos = (desde, hasta = new Date()) => {
  const cursor = new Date(desde);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1); // exclusivo del día de inicio

  const fin = new Date(hasta);
  fin.setHours(0, 0, 0, 0);

  let dias = 0;
  while (cursor <= fin) {
    if (esDiaHabil(cursor)) dias += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
};

// Fecha límite de vida de una inversión: MESES_VIDA_MAXIMA meses después
// de que entró a EN_PROGRESO (cuando empezó a generar intereses).
// Cumplida, se marca RETIRADO aunque nadie haya pedido un retiro -- ver
// incrementarDias.
const fechaVencimiento = (inicioEnProgreso) => {
  const vencimiento = new Date(inicioEnProgreso);
  vencimiento.setMonth(vencimiento.getMonth() + MESES_VIDA_MAXIMA);
  return vencimiento;
};

// Job idempotente: se puede correr N veces el mismo día sin efectos
// secundarios -- recalcula `dias`/`intereses`/`total` a un valor absoluto
// a partir de la fecha en la que arrancó la fase actual, no los va
// incrementando a ciegas sobre lo que ya había.
//
// Dos fases, cada una con su propio contador:
//  - EN_ESPERA: cuenta días CORRIDOS desde que se aprobó el paquete
//    (`dias`) y, al llegar a DIAS_PARA_HABILITAR, pasa a EN_PROGRESO.
//  - EN_PROGRESO: recalcula los intereses generados según los días
//    HÁBILES transcurridos desde que arrancó esta fase (`monto *
//    porcentajeInteres * díasHábiles` -- el porcentaje que se congeló al
//    crear el paquete, no el vigente ahora) y, si ya pasó
//    MESES_VIDA_MAXIMA, la marca RETIRADO. El capital (`monto`) nunca se
//    toca, y aprobar un retiro tampoco baja `intereses`/`total` (ver
//    approve()) -- este es el único lugar que los escribe.
//
// PENDIENTE (esperando revisión del admin) y los estados terminales
// (RECHAZADO, RETIRADO) no envejecen ni generan intereses.
//
// Perf: recorre TODAS las inversiones activas y hace un $transaction por
// cada una que cambia (N+1 escrituras secuenciales). Con pocos miles va
// bien; ver la nota de escala en getInversionesActivas.
const incrementarDias = async () => {
  const inversiones = await investmentRepository.getInversionesActivas();

  let actualizadas = 0;
  let habilitadas = 0;
  let retiradasPorVencimiento = 0;

  for (const inversion of inversiones) {
    const estadoActual = inversion.estados[0]?.estado ?? DEFAULT_ESTADO;
    const inicioFase = inversion.estados[0]?.createdAt;

    if (estadoActual === 'EN_ESPERA') {
      const dias = diasTranscurridos(inicioFase);
      const habilitar = dias >= DIAS_PARA_HABILITAR;

      // Nada que hacer: mismo contador y sin cambio de estado.
      if (dias === inversion.dias && !habilitar) continue;

      await investmentRepository.actualizarInversion(
        inversion.id,
        { dias },
        habilitar ? 'EN_PROGRESO' : undefined
      );

      actualizadas += 1;
      if (habilitar) habilitadas += 1;
      continue;
    }

    if (estadoActual === 'EN_PROGRESO') {
      const diasHabiles = diasHabilesTranscurridos(inicioFase);
      const montoNum = Number(inversion.monto);
      const porcentaje = Number(inversion.porcentajeInteres);
      const intereses = montoNum * porcentaje * diasHabiles;
      const total = montoNum + intereses;
      const vencida = Date.now() >= fechaVencimiento(inicioFase).getTime();

      // Nada que hacer: mismos montos y sin cambio de estado.
      if (
        intereses === Number(inversion.intereses) &&
        total === Number(inversion.total) &&
        !vencida
      ) {
        continue;
      }

      await investmentRepository.actualizarInversion(
        inversion.id,
        { intereses, total },
        vencida ? 'RETIRADO' : undefined
      );

      actualizadas += 1;
      if (vencida) retiradasPorVencimiento += 1;
    }
  }

  return {
    revisadas: inversiones.length,
    actualizadas,
    habilitadas,
    retiradasPorVencimiento
  };
};

// Inversiones de un cliente para la vista de administrador. Acepta los
// mismos filtros (?tipo=) y paginación (?page=) que "mis inversiones".
const inversionesCliente = async (userId, tipo = 'ALL', rawPage) => {
  const client = await investmentRepository.getIdByUser(userId);

  // Un usuario sin perfil de cliente (p. ej. un admin) no tiene inversiones.
  if (!client) {
    return {
      tipo: 'ALL',
      ...buildMeta(0, parsePage(rawPage)),
      activas: 0,
      limiteActivas: MAX_INVERSIONES_ACTIVAS,
      inversiones: []
    };
  }

  return listInversionesCliente(client.id, tipo, rawPage);
};

// Resumen para el dashboard/inicio y para "Mis inversiones" del cliente:
// capital invertido (suma de `monto`) y total acumulado (suma de
// `intereses`) de TODAS sus inversiones, sin filtrar por estado; el
// desglose por estado (en progreso / pendientes / retiradas); y el cupo
// de inversiones activas (en progreso + pendientes vs. disponibles) que
// alimenta la barra de progreso.
const resumenInversiones = async (userId) => {
  const client = await investmentRepository.getIdByUser(userId);

  // Un usuario sin perfil de cliente (p. ej. un admin puro) no tiene
  // inversiones que sumar ni cupo que mostrar.
  if (!client) {
    return {
      totalInvertido: 0,
      totalAcumulado: 0,
      pendientes: 0,
      enEspera: 0,
      enProgreso: 0,
      rechazadas: 0,
      retiradas: 0,
      disponibles: MAX_INVERSIONES_ACTIVAS,
      limiteActivas: MAX_INVERSIONES_ACTIVAS,
      tieneWallet: false
    };
  }

  const [totales, inversiones] = await Promise.all([
    investmentRepository.getTotales(client.id),
    investmentRepository.myList(client.id)
  ]);

  const todas = inversiones.map((inv) => ({ estado: inv.estados[0]?.estado ?? DEFAULT_ESTADO }));
  const pendientes = contarPorEstado(todas, 'PENDIENTE');
  const enEspera = contarPorEstado(todas, 'EN_ESPERA');
  const enProgreso = contarPorEstado(todas, 'EN_PROGRESO');
  const rechazadas = contarPorEstado(todas, 'RECHAZADO');
  const retiradas = contarPorEstado(todas, 'RETIRADO');
  const disponibles = Math.max(0, MAX_INVERSIONES_ACTIVAS - (pendientes + enEspera + enProgreso));

  return {
    ...totales,
    pendientes,
    enEspera,
    enProgreso,
    rechazadas,
    retiradas,
    disponibles,
    limiteActivas: MAX_INVERSIONES_ACTIVAS,
    // Aviso de bienvenida del inicio: mientras no tenga wallet no puede
    // invertir (ver newInvestment), así que el frontend usa esto para
    // seguir recordándoselo, sin importar cuándo se creó la cuenta.
    tieneWallet: tieneWallet(client.wallet)
  };
};

// Mediana de una lista de números ya ordenada ascendentemente.
const medianaOrdenada = (valores) => {
  if (valores.length === 0) return 0;
  const mitad = Math.floor(valores.length / 2);
  return valores.length % 2 === 0
    ? (valores[mitad - 1] + valores[mitad]) / 2
    : valores[mitad];
};

// Resumen de TODAS las inversiones para el panel de administración:
// capital invertido total, cuántas están en progreso, promedio/mediana
// de inversiones por cliente (solo sobre clientes con al menos una,
// para no diluir el número con cuentas que nunca invirtieron), y el
// estado de los retiros. Reutiliza `list()` (ya trae todas las
// inversiones con su estado actual) para no repetir el mismo N+1 que ya
// tiene el resto del módulo (ver nota en investment.repository.js#list).
const resumenAdmin = async () => {
  const [rows, retirosPendientes, ultimosRetiros] = await Promise.all([
    investmentRepository.list(),
    investmentRepository.countSolicitudesPendientes(),
    investmentRepository.ultimosRetirosAprobados(5)
  ]);

  const estadoDe = (inv) => inv.estados[0]?.estado ?? DEFAULT_ESTADO;
  const enProgreso = rows.filter((r) => estadoDe(r) === 'EN_PROGRESO').length;
  const capitalInvertido = rows.reduce((sum, r) => sum + Number(r.monto), 0);

  const inversionesPorCliente = new Map();
  for (const r of rows) {
    inversionesPorCliente.set(r.clientId, (inversionesPorCliente.get(r.clientId) ?? 0) + 1);
  }
  const conteos = [...inversionesPorCliente.values()].sort((a, b) => a - b);
  const promedioInversionesPorCliente = conteos.length
    ? conteos.reduce((a, b) => a + b, 0) / conteos.length
    : 0;

  return {
    capitalInvertido,
    enProgreso,
    promedioInversionesPorCliente,
    medianaInversionesPorCliente: medianaOrdenada(conteos),
    retirosPendientes,
    ultimosRetiros: ultimosRetiros.map((s) => ({
      id: s.id,
      monto: s.montoRetiro,
      resueltaEn: s.resueltaEn
    }))
  };
};

// Porcentaje vigente para calcular intereses de inversiones nuevas.
// Mientras nadie lo haya editado desde el panel de administración no
// existe fila en Configuracion, así que se usa INTERES_RATE_DEFAULT.
const getPorcentajeInteres = async () => {
  const config = await investmentRepository.getConfiguracion();
  return config ? Number(config.porcentajeInteres) : INTERES_RATE_DEFAULT;
};

// Edición del porcentaje de intereses desde el panel de administración.
// Se guarda como fracción (0.10 = 10%) y se registra en auditoría por
// tratarse de un parámetro que afecta a todas las inversiones futuras.
const updatePorcentaje = async (userId, porcentaje) => {
  const valor = Number(porcentaje);

  if (!Number.isFinite(valor) || valor <= 0 || valor > 1) {
    throw fail(400, 'El porcentaje debe ser un número mayor a 0 y menor o igual a 1');
  }

  const config = await investmentRepository.setPorcentajeInteres(valor);

  await registrarAuditoria({
    userId,
    action: AUDIT_ACTIONS.UPDATE,
    tableName: AUDIT_TABLES.CONFIGURACION,
    targetId: config.id
  });

  return { porcentajeInteres: Number(config.porcentajeInteres) };
};

// Valida el id y trae la solicitud si existe; approve/reject comparten
// esta lectura para poder distinguir "no existe" (404) de "ya fue
// resuelta" (409) antes de intentar escribir.
const buscarSolicitudOFallar = async (applicationId) => {
  const id = Number(applicationId);
  if (!Number.isInteger(id) || id <= 0) {
    throw fail(400, 'Solicitud inválida');
  }

  const solicitud = await investmentRepository.getSolicitudParaResolver(id);
  if (!solicitud) {
    throw fail(404, 'La solicitud no existe');
  }

  return solicitud;
};

// Aprobar/rechazar una solicitud de retiro no toca la inversión: el
// capital (`monto`) nunca se mueve y los intereses/total los recalcula
// únicamente incrementarDias, según los días hábiles transcurridos, no el
// resolver una solicitud. "Cuánto queda disponible" ya se descontó en
// createApplication (intereses generados menos lo ya aceptado), así que
// acá solo queda marcar la solicitud resuelta. Comparten toda la lógica
// -- solo cambia el estado de destino y qué acción queda en la auditoría
// -- igual que resolverPendiente() para aprobar/rechazar un paquete.
const resolverSolicitudPendiente = async (applicationId, userId, estado, auditAction) => {
  const solicitud = await buscarSolicitudOFallar(applicationId);

  const admin = await investmentRepository.getAdminIdByUser(userId);
  const resultado = await investmentRepository.resolverSolicitud(solicitud.id, estado, admin?.id ?? null);

  // updateMany solo afecta filas todavía PENDIENTE: si otra request ya
  // la resolvió entre la lectura de arriba y este punto, count viene 0.
  if (!resultado) {
    throw fail(409, 'Esta solicitud ya fue resuelta');
  }

  await registrarAuditoria({
    userId,
    action: auditAction,
    tableName: AUDIT_TABLES.SOLICITUD,
    targetId: solicitud.id
  });

  return resultado;
};

const approve = (applicationId, userId) =>
  resolverSolicitudPendiente(applicationId, userId, 'ACEPTADA', AUDIT_ACTIONS.APPROVE);

const reject = (applicationId, userId) =>
  resolverSolicitudPendiente(applicationId, userId, 'RECHAZADA', AUDIT_ACTIONS.REJECT);

// Valida el id y trae la inversión (o falla): comparte lectura entre
// retire(), approveInvestment() y rejectInvestment(), las tres acciones
// que dependen de leer el estado actual de una inversión antes de
// decidir si se puede cambiar.
const buscarInversionOFallar = async (investmentId) => {
  const id = Number(investmentId);
  if (!Number.isInteger(id) || id <= 0) {
    throw fail(400, 'Inversión inválida');
  }

  const investment = await investmentRepository.getInversionParaCambiarEstado(id);
  if (!investment) {
    throw fail(404, 'La inversión no existe');
  }

  return investment;
};

// Un admin puede terminar manualmente una inversión EN_PROGRESO en
// cualquier momento (sin esperar los MESES_VIDA_MAXIMA meses de
// vencimiento automático que hace incrementarDias). Al pasar a RETIRADO
// dos cosas se dan solas con el resto del código, sin lógica extra acá:
// el job incrementarDias ya se salta las RETIRADO (no siguen generando
// intereses), y createApplication ya exige EN_PROGRESO para pedir un
// retiro -- sigue viéndose en los listados y su detalle, pero no admite
// más acciones.
const retire = async (investmentId, userId) => {
  const investment = await buscarInversionOFallar(investmentId);

  const estadoActual = investment.estados[0]?.estado ?? DEFAULT_ESTADO;
  if (estadoActual !== 'EN_PROGRESO') {
    throw fail(409, mensajeNoEnProgreso(estadoActual));
  }

  // No dejar una solicitud sin resolver colgando de una inversión que
  // ya se cierra: el admin debe aprobarla/rechazarla primero.
  if (investment.solicitudes.length > 0) {
    throw fail(409, 'Esta inversión tiene una solicitud de retiro pendiente; resuélvela antes de retirarla');
  }

  await investmentRepository.cambiarEstadoInversion(investment.id, 'RETIRADO');

  await registrarAuditoria({
    userId,
    action: AUDIT_ACTIONS.RETIRAR,
    tableName: AUDIT_TABLES.INVERSION,
    targetId: investment.id
  });

  return { id: investment.id, estado: 'RETIRADO' };
};

// Todo paquete nuevo nace PENDIENTE: la única decisión que le queda al
// admin es aceptarlo (pasa a EN_ESPERA y ahí arranca el período de
// bloqueo de 15 días, ver incrementarDias) o rechazarlo (RECHAZADO,
// estado terminal donde ya no se puede hacer nada más que ver el
// detalle). Comparten toda la lógica -- solo cambia a qué estado se
// mueve y qué acción queda en la auditoría.
const resolverPendiente = async (investmentId, userId, estadoSiguiente, auditAction) => {
  const investment = await buscarInversionOFallar(investmentId);

  const estadoActual = investment.estados[0]?.estado ?? DEFAULT_ESTADO;
  if (estadoActual !== 'PENDIENTE') {
    throw fail(409, 'Esta inversión ya fue revisada por un administrador');
  }

  await investmentRepository.cambiarEstadoInversion(investment.id, estadoSiguiente);

  await registrarAuditoria({
    userId,
    action: auditAction,
    tableName: AUDIT_TABLES.INVERSION,
    targetId: investment.id
  });

  return { id: investment.id, estado: estadoSiguiente };
};

const approveInvestment = (investmentId, userId) =>
  resolverPendiente(investmentId, userId, 'EN_ESPERA', AUDIT_ACTIONS.APPROVE);

const rejectInvestment = (investmentId, userId) =>
  resolverPendiente(investmentId, userId, 'RECHAZADO', AUDIT_ACTIONS.REJECT);

export default {
  newInvestment,
  list,
  myList,
  createApplication,
  incrementarDias,
  getInvestment,
  getInvestmentAdmin,
  inversionesCliente,
  resumenInversiones,
  resumenAdmin,
  getPorcentajeInteres,
  updatePorcentaje,
  approve,
  reject,
  retire,
  approveInvestment,
  rejectInvestment
};
