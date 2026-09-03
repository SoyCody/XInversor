import { apiFetch } from "./httpClient";

// La lista se sirve de 20 en 20; `page` es 1-based.
export function obtenerAuditorias(page = 1) {
  return apiFetch(`/audits/all?page=${encodeURIComponent(page)}`);
};

export function verAuditoria(id) {
  return apiFetch(`/audits/${id}`);
};
