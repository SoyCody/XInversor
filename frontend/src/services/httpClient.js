const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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