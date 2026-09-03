import { apiFetch } from "./httpClient";

// tipo: "ALL" | "PENDIENTE" | "EN_PROGRESO" | "RETIRADO"
// La lista se sirve de 20 en 20; `page` es 1-based.
export function listInversiones(tipo = "ALL", page = 1) {
  return apiFetch(
    `/investment/list?tipo=${encodeURIComponent(tipo)}&page=${encodeURIComponent(page)}`
  );
}

// Inversiones del cliente autenticado.
export function misInversiones(tipo = "ALL", page = 1) {
  return apiFetch(
    `/investment/my?tipo=${encodeURIComponent(tipo)}&page=${encodeURIComponent(page)}`
  );
}

export function crearInversion(monto) {
  return apiFetch("/investment/new", { method: "POST", body: { monto } });
}

// Detalle completo de una inversión propia (montos, historial de estados,
// solicitudes de retiro).
export function verInversion(inversionId) {
  return apiFetch(`/investment/${encodeURIComponent(inversionId)}/watch`);
}

export function crearSolicitud(inversionId, montoRetiro) {
  return apiFetch(`/investment/${encodeURIComponent(inversionId)}/application`, {
    method: "POST",
    body: { montoRetiro },
  });
}