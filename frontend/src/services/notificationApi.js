import { apiFetch } from "./httpClient";

// Notificaciones del cliente autenticado: aprobaciones/rechazos de sus
// paquetes y retiros.
export function getRecentClientNotifications() {
  return apiFetch("/client/notifications/recent");
}

export function getClientNotifications(page = 1) {
  return apiFetch(`/client/notifications?page=${encodeURIComponent(page)}`);
}

// Notificaciones del admin: paquetes y retiros nuevos por revisar.
export function getRecentAdminNotifications() {
  return apiFetch("/admin/notifications/recent");
}

export function getAdminNotifications(page = 1) {
  return apiFetch(`/admin/notifications?page=${encodeURIComponent(page)}`);
}
