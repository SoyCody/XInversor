import { useState } from "react";
import { loginUser } from "../services/authApi";

export function useLogin({ onSuccess }) {
  const [data, setData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await loginUser(data);
      setData({ email: "", password: "" });
      onSuccess?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { data, error, isSubmitting, handleChange, submit };
}