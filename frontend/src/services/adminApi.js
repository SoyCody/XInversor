import { apiFetch } from "./httpClient";

// Ya no se pasa { auth: true }: la cookie va sola en cada request
// gracias a credentials: "include" en httpClient.
export function getAdminDashboard() {
  return apiFetch("/admin/dashboard");
}

export function getMeAdmin() {
  return apiFetch("/admin/me");
};

// tipo: "ALL" | "CLIENT" | "ADMIN" | "BLOCKED" | "DELETED"
// La lista se sirve de 20 en 20; `page` es 1-based.
export function obtenerPersonas(tipo = "ALL", page = 1) {
  return apiFetch(
    `/admin/users?tipo=${encodeURIComponent(tipo)}&page=${encodeURIComponent(page)}`
  );
};

export function obtenerClientes() {
  return obtenerPersonas("CLIENT");
};

export function obtenerAdministradores() {
  return obtenerPersonas("ADMIN");
};

export function obtenerBloqueados() {
  return obtenerPersonas("BLOCKED");
};

export function obtenerBorrados () {
  return obtenerPersonas("DELETED");
};

// tipo: "ALL" | "PENDIENTE" | "EN_PROGRESO" | "RETIRADO" filtra las
// inversiones del cliente que vienen en la respuesta; `page` es 1-based.
export function verCliente (id, tipo = "ALL", page = 1) {
  return apiFetch(
    `/admin/watch/user/${id}?tipo=${encodeURIComponent(tipo)}&page=${encodeURIComponent(page)}`
  );
};

export function promoteToAdmin(id) {
  return apiFetch(`/admin/promote/${id}`, { method: "PUT" });
};
 
export function blockClient(id) {
  return apiFetch(`/admin/block/${id}`, { method: "PUT" });
};