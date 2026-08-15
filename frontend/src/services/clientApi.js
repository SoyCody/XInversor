import { apiFetch } from "./httpClient";

export function getClientDashboard() {
  return apiFetch("/client/dashboard");
}