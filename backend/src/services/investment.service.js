import investmentRepository from '../repositories/investment.repository.js';
import { registrarAuditoria, AUDIT_ACTIONS, AUDIT_TABLES } from './auditorias.service.js';
import { parsePage, buildMeta, paginateArray } from '../utils/pagination.js';
import { MESES_ES, mesesDelAnhoHastaHoy } from '../utils/meses.js';

const INTERES_RATE_DEFAULT = 0.1;

const DIAS_PARA_HABILITAR = 15;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const fail = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const tieneWallet = (wallet) =>
  typeof wallet === 'string' && wallet.trim().length > 0;

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
  // inversiones activas (PENDIENTE o EN_PROGRESO) al mismo tiempo.
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

  // OJO: aritmética en punto flotante sobre dinero. montoNum * tasa puede
  // dar 0.30000000000000004 y se guarda en Decimal(18,8). Para importes
  // grandes o si la tasa deja de ser "redonda", conviene calcular
  // intereses/total con Prisma.Decimal (o strings) y no con Number.
  const tasa = await getPorcentajeInteres();
  const intereses = montoNum * tasa;
  const total = montoNum + intereses;

  // dias arranca en 0: es el contador que habilita los retiros
  // (mínimo 15 días); la inversión no tiene fecha de fin.
  const inversion = await investmentRepository.registerInvestment({
    clientId: client.id,
    monto: montoNum,
    intereses,
    dias: 0,
    total
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
  'EN_PROGRESO',
  'RETIRADO'
];

const DEFAULT_ESTADO = 'PENDIENTE';

// Límite de inversiones activas simultáneas por cliente. Cuenta las que
// están PENDIENTE o EN_PROGRESO; las RETIRADO ya no ocupan cupo.
const MAX_INVERSIONES_ACTIVAS = 5;
const ESTADOS_ACTIVOS = ['PENDIENTE', 'EN_PROGRESO'];

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
  const [rows, retirosPendientes] = await Promise.all([
    investmentRepository.list(),
    investmentRepository.countSolicitudesPendientes()
  ]);

  // Se aplana el cliente a su nombre y el estado actual a un string;
  // el filtro por tipo se aplica sobre ese estado actual.
  const todas = rows.map(({ client, estados, ...rest }) => ({
    ...rest,
    cliente: `${client.user.firstName} ${client.user.lastName}`,
    estado: estados[0]?.estado ?? DEFAULT_ESTADO
  }));
  const inversiones = todas.filter((inversion) => key === 'ALL' || inversion.estado === key);

  return {
    tipo: key,
    ...buildMeta(inversiones.length, page),
    // Tarjetas y gráficos del panel de administración: siempre sobre
    // TODAS las inversiones (sin importar el filtro `tipo` elegido para
    // la tabla), por eso se calculan sobre `todas` y no sobre `inversiones`.
    ...resumenAdminInversiones(todas, retirosPendientes),
    inversiones: paginateArray(inversiones, page)
  };
};

// "Montos" = la suma sobre TODAS las inversiones (no un promedio ni el
// valor de una sola). `capitalPorMes`/`inversionesPorMes` siguen el mismo
// criterio que `admin.service.js#clientesPorMes`: arrancan en enero y se
// alargan mes a mes según avanza el año, en vez de una ventana móvil.
const resumenAdminInversiones = (todas, retirosPendientes) => {
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
    pendientes: todas.filter((inversion) => inversion.estado === 'PENDIENTE').length,
    retirosPendientes,
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

// NOTA: `dias` y `diasParaHabilitar` salen del contador persistido, que
// solo se refresca a medianoche (job incrementarDias). Entre corridas el
// valor puede estar hasta ~24h desactualizado. Si el frontend necesita
// exactitud, usar diasTranscurridos(inversion.createdAt) en lugar de
// inversion.dias.
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
      // Días que faltan para que se habiliten los retiros (0 si ya se pueden).
      diasParaHabilitar:
        estadoActual === 'PENDIENTE'
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
// resuelve la ruta con isAdmin).
const getInvestmentAdmin = async (inversionId) => {
  if (!Number.isInteger(inversionId) || inversionId <= 0) {
    throw fail(400, 'Inversión inválida');
  }

  const inversion = await investmentRepository.getInvestment(inversionId);
  if (!inversion) {
    throw fail(404, 'La inversión no existe');
  }

  return buildInvestmentDetail(inversion);
};

const createApplication = async (userId, inversionId, montoRetiro) => {
  if (!Number.isInteger(inversionId) || inversionId <= 0) {
    throw fail(400, 'Inversión inválida');
  }

  const montoNum = Number(montoRetiro);
  if (!Number.isFinite(montoNum) || montoNum <= 0) {
    throw fail(400, 'El monto a retirar debe ser un número mayor a 0');
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

  const estadoActual = inversion.estados[0]?.estado ?? 'PENDIENTE';
  if (estadoActual === 'PENDIENTE') {
    throw fail(409, 'La inversión todavía está en el período de bloqueo de 15 días');
  }
  if (estadoActual === 'RETIRADO') {
    throw fail(409, 'La inversión ya fue retirada');
  }

  // Regla del modelo: una sola solicitud sin resolver por inversión.
  if (inversion.solicitudes.length > 0) {
    throw fail(409, 'Ya existe una solicitud de retiro pendiente para esta inversión');
  }

  // No se puede pedir más de lo que la inversión tiene disponible (BTC).
  if (montoNum > Number(inversion.total)) {
    throw fail(422, 'El monto solicitado supera el total disponible de la inversión');
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

// Job idempotente: se puede correr N veces el mismo día sin efectos
// secundarios (fija `dias` al valor calculado y solo agrega EN_PROGRESO
// si aún no está).
//
// Perf: recorre TODAS las inversiones y hace un $transaction por cada una
// que cambia (N+1 escrituras secuenciales). Con pocos miles va bien; si
// crece, conviene: (1) filtrar en SQL las que ya están RETIRADO,
// (2) agrupar los UPDATE de `dias` por valor con updateMany, y
// (3) createMany para los Estado nuevos. Como el estado transiciona solo
// hacia adelante, el paso a EN_PROGRESO también se podría derivar en
// lectura desde createdAt y dejar el job solo para el panel de admin.
const incrementarDias = async () => {
  const inversiones = await investmentRepository.getInversionesActivas();

  let actualizadas = 0;
  let habilitadas = 0;

  for (const inversion of inversiones) {
    const estadoActual = inversion.estados[0]?.estado ?? 'PENDIENTE';

    // Una inversión retirada ya no envejece.
    if (estadoActual === 'RETIRADO') continue;

    const dias = diasTranscurridos(inversion.createdAt);
    const habilitar =
      estadoActual === 'PENDIENTE' && dias >= DIAS_PARA_HABILITAR;

    // Nada que hacer: mismo contador y sin cambio de estado.
    if (dias === inversion.dias && !habilitar) continue;

    await investmentRepository.avanzarInversion(inversion.id, { dias, habilitar });

    if (dias !== inversion.dias) actualizadas += 1;
    if (habilitar) habilitadas += 1;
  }

  return {
    revisadas: inversiones.length,
    actualizadas,
    habilitadas
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
      enProgreso: 0,
      pendientes: 0,
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

  const estadoDe = (inv) => inv.estados[0]?.estado ?? DEFAULT_ESTADO;
  const enProgreso = inversiones.filter((inv) => estadoDe(inv) === 'EN_PROGRESO').length;
  const pendientes = inversiones.filter((inv) => estadoDe(inv) === 'PENDIENTE').length;
  const retiradas = inversiones.filter((inv) => estadoDe(inv) === 'RETIRADO').length;
  const disponibles = Math.max(0, MAX_INVERSIONES_ACTIVAS - (enProgreso + pendientes));

  return {
    ...totales,
    enProgreso,
    pendientes,
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
  updatePorcentaje
};
