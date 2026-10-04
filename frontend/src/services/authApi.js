import { apiFetch, apiFetchFormData, API_URL } from "./httpClient";

export const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB, igual que el backend

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

export function getCurrentUser() {
  return apiFetch("/client/me");
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
};

export function deleteAccount () {
  return apiFetch("/users/delete", { method: "PUT" });
};

export function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);
  return apiFetchFormData("/users/avatar", { method: "PUT", body: formData });
};

// updatedAt sirve como cache-busting: cambia la url cuando cambia la foto.
export function getAvatarUrl(userId, updatedAt) {
  if (!userId) return null;
  const base = `${API_URL}/users/${userId}/avatar`;
  return updatedAt ? `${base}?v=${new Date(updatedAt).getTime()}` : base;
};