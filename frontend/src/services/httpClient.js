// URL base del backend: ÚNICA fuente para todas las llamadas (incluido el
// avatar, ver authApi.js). Sale de VITE_API_URL, que Vite fija al construir
// (npm run build lee .env.production). localhost solo existe como valor de
// DESARROLLO: import.meta.env.DEV es false en el build, así que Vite elimina
// esa rama y la cadena "localhost" no llega a dist. Si en producción faltara
// la variable, se falla con un mensaje claro en vez de llamar a localhost.
const rawApiUrl =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:3001" : "");

if (!rawApiUrl) {
  throw new Error("Falta VITE_API_URL: defínela en frontend/.env.production antes de ejecutar npm run build.");
}

const API_URL = rawApiUrl.replace(/\/+$/, ""); // sin barra final

// Ya no arma el header Authorization a mano: con credentials: "include",
// el navegador manda la cookie httpOnly automáticamente en cada
// petición (y el backend la vuelve a mandar cuando setea/limpia).
export async function apiFetch(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Ocurrió un error al conectar con el servidor.");
  }

  return data;
}

// Para subir archivos (FormData): no se setea Content-Type a mano,
// el navegador arma el boundary del multipart automáticamente.
export async function apiFetchFormData(path, { method = "POST", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Ocurrió un error al conectar con el servidor.");
  }

  return data;
}

export { API_URL };