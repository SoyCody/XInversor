import { apiFetch } from "./httpClient";

export function getClientDashboard() {
  return apiFetch("/client/dashboard");
};

export function getMeClient() {
  return apiFetch("/client/me");
};

// Cambia el ID de la billetera de bitcoins del cliente autenticado.
export function updateWallet(wallet) {
  return apiFetch("/client/wallet", { method: "PUT", body: { wallet } });
};

// Inversión con el mayor monto del cliente autenticado (o null si todavía
// no tiene ninguna): alimenta el acceso directo del sidebar a "Detalles
// de la inversión".
export function getHighestInvestment() {
  return apiFetch("/client/highest/investment");
};