import { apiFetch } from "./httpClient";

// tipo: "ALL" | "EN_PROGRESO" | "ACEPTADO" | "RECHAZADO" | "RETIRADO"
export function listInversiones(tipo = "ALL") {
  return apiFetch(`/investment/list?tipo=${encodeURIComponent(tipo)}`);
}

// Inversiones del cliente autenticado.
export function misInversiones(tipo = "ALL") {
  return apiFetch(`/investment/my?tipo=${encodeURIComponent(tipo)}`);
}

export function crearInversion(monto) {
  return apiFetch("/investment/new", { method: "POST", body: { monto } });
}
