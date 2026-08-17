import { apiFetch } from "./httpClient";

// Ya no hay nada que guardar en localStorage: el backend setea
// la cookie httpOnly directamente en la respuesta de fetch.
export function registerUser({ firstName, lastName, email, password }) {
  return apiFetch("/users/register", {
    method: "POST",
    body: { firstName, lastName, email, password },
  });
}

export function loginUser({ email, password }) {
  return apiFetch("/users/login", {
    method: "POST",
    body: { email, password },
  });
};

export function logoutUser() {
  return apiFetch("/users/logout", { method: "POST" });
};

export function updateMe(payload) {
  // payload: { firstName?, lastName?, email? }
  // El ID viene del token en el backend
  return apiFetch("/users/edit", {
    method: "PUT",
    body: payload,
  });
};

export function changePassword(data) {
  // "data" será el objeto { password: "..." } que mandamos desde el componente
  return apiFetch("/users/change/password", {
    method: "PUT",
    body: data 
  });
}