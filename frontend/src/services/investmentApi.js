import { apiFetch } from "./httpClient";

// tipo: "ALL" | "PENDIENTE" | "EN_PROGRESO" | "RETIRADO"
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