import { apiFetch } from "./httpClient";

export function getClientDashboard() {
  return apiFetch("/client/dashboard");
};

export function getMeClient() {
  return apiFetch("/client/me");
};