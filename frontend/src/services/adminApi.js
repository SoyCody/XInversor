import { apiFetch } from "./httpClient";

// Ya no se pasa { auth: true }: la cookie va sola en cada request
// gracias a credentials: "include" en httpClient.
export function getAdminDashboard() {
  return apiFetch("/admin/dashboard");
}

export function getMeAdmin() {
  return apiFetch("/admin/me");
};

export function obtenerClientes() {
  return apiFetch("/admin/users");
};