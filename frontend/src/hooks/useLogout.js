import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/authApi";

// Encapsula todo el logout aquí (no como prop desde afuera),
// para que cualquier componente que necesite un botón de
// "Cerrar sesión" (SideBar, un menú de usuario, etc.) solo
// llame a este hook y no tenga que gestionar su propio estado.
export function useLogout() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const logout = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await logoutUser();
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { logout, isSubmitting, error };
}