// Mensaje exacto que manda el middleware `isnBlocked` del backend
// (auth.middleware.js) en cualquier ruta restringida para clientes
// bloqueados. Se compara tal cual para decidir si un error de la API
// debe mostrarse con el modal de "cuenta bloqueada" en vez del típico
// texto de error en línea.
export const BLOCKED_ERROR_MESSAGE = "Acceso denegado: cuenta bloqueada";

export const isBlockedError = (message) => message === BLOCKED_ERROR_MESSAGE;
