// Las notificaciones son derivadas (no hay tabla propia, ver
// notification.service.js en el backend), así que "leída" tampoco vive en
// el servidor: se guarda en localStorage, por usuario, la fecha hasta la
// que ya vio todo. Lo que sea más nuevo que eso cuenta como pendiente.
const STORAGE_KEY_PREFIX = "xinversor_notif_last_seen_";

const storageKey = (userId) => `${STORAGE_KEY_PREFIX}${userId}`;

export const getLastSeen = (userId) => {
  if (!userId) return 0;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? Number(raw) : 0;
  } catch {
    // localStorage bloqueado (modo privado, permisos, etc.): tratar todo
    // como no visto es lo más seguro, no lo contrario.
    return 0;
  }
};

// Marca como vistas todas las notificaciones hasta ahora mismo: se llama
// al abrir el desplegable del header o al entrar al apartado completo de
// Notificaciones -- las dos formas de "verlas".
export const markAllSeen = (userId) => {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(userId), String(Date.now()));
  } catch {
    // No es crítico: en el peor caso el contador de pendientes no baja.
  }
};

export const countUnseen = (notificaciones, userId) => {
  const lastSeen = getLastSeen(userId);
  return notificaciones.filter((n) => new Date(n.fecha).getTime() > lastSeen).length;
};
