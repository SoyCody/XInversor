import { useState } from "react";
import { registerUser } from "../services/authApi";

const initialData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function useRegisterForm({ onSuccess }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialData);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const reset = () => {
    setData(initialData);
    setStep(1);
    setError("");
  };

  const goToStepTwo = () => {
    if (!data.firstName.trim() || !data.lastName.trim() || !data.email.trim()) {
      setError("Completa todos los campos antes de continuar.");
      return;
    }
    setError("");
    setStep(2);
  };

  const goToStepThree = () => {
    if (!data.password || !data.confirmPassword) {
      setError("Completa ambos campos de contraseña.");
      return;
    }
    if (data.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (data.password !== data.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError("");
    setStep(3);
  };

  const goBack = () => {
    setError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await registerUser(data);
      reset();
      onSuccess?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    step,
    setStep,
    data,
    error,
    isSubmitting,
    handleChange,
    goToStepTwo,
    goToStepThree,
    goBack,
    submit,
  };
}