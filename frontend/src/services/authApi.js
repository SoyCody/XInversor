const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function registerUser({ firstName, lastName, email, password }) {
  const response = await fetch(`${API_URL}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstName, lastName, email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "No se pudo crear la cuenta.");
  }

  return data;
}

export async function loginUser({ email, password }) {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "No se pudo iniciar sesión.");
  }

  return data;
}