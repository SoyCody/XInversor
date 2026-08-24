import { apiFetch } from "./httpClient";

export function obtenerAuditorias() {
  return apiFetch("/audits/all");
};

export function verAuditoria(id) {
  return apiFetch(`/audits/${id}`);
};
