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