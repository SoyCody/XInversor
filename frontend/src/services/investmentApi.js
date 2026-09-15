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

// Resumen agregado (totales + desglose por estado) del cliente
// autenticado: alimenta las tarjetas y la barra de "Mis inversiones".
export function resumenInversiones() {
  return apiFetch("/investment/summary");
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

// Detalle de una inversión para el administrador: cualquier inversión,
// no solo las del cliente autenticado (a diferencia de verInversion).
export function verInversionAdmin(inversionId) {
  return apiFetch(`/investment/admin/${encodeURIComponent(inversionId)}/watch`);
}

// Porcentaje de intereses aplicado a las inversiones nuevas (0.10 = 10%).
export function actualizarPorcentajeInteres(porcentaje) {
  return apiFetch("/investment/percent/edit", {
    method: "PUT",
    body: { porcentaje },
  });
}

// Aprobar/rechazar una solicitud de retiro pendiente (panel de administración).
export function aprobarSolicitud(applicationId) {
  return apiFetch(`/investment/${encodeURIComponent(applicationId)}/approve`, {
    method: "PUT",
  });
}

export function rechazarSolicitud(applicationId) {
  return apiFetch(`/investment/${encodeURIComponent(applicationId)}/reject`, {
    method: "PUT",
  });
}