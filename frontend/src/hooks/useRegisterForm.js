import { useState } from "react";
import { registerUser, confirmRegister } from "../services/authApi";

const initialData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

// El registro tiene un cuarto paso silencioso además de los 3 que muestra
// el indicador (Datos/Seguridad/Confirmar): al enviar el paso 3, el
// backend NO crea la cuenta todavía, solo manda un código de 4 dígitos
// al correo (ver services/authApi.js#registerUser). El step pasa a 4 y
// se pide ese código; recién al confirmarlo se crea la cuenta y se llama
// onSuccess (login automático vía cookie), igual que antes.
export function useRegisterForm({ onSuccess }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialData);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Solo viven mientras se espera el código (paso 4): se limpian en
  // reset() y al volver a editar los datos.
  const [verification, setVerification] = useState(null); // { verificationId, email }
  const [code, setCode] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleCodeChange = (e) => {
    // Solo dígitos, y como mucho 4 -- lo que de verdad valida es el
    // backend, esto es solo para que el campo no se llene de basura.
    setCode(e.target.value.replace(/\D/g, "").slice(0, 4));
    setError("");
  };

  const reset = () => {
    setData(initialData);
    setStep(1);
    setError("");
    setVerification(null);
    setCode("");
    setResendMessage("");
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
    // Desde el paso de código, "Atrás" vuelve a editar los datos (paso
    // 1): el error más probable ahí es un correo mal escrito, y no tiene
    // sentido un código para un correo que se va a cambiar.
    if (step === 4) {
      setVerification(null);
      setCode("");
      setResendMessage("");
      setStep(1);
      return;
    }
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Paso 3 -> pide el código (no crea la cuenta todavía).
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await registerUser(data);
      setVerification({ verificationId: result.verificationId, email: result.email });
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paso 4 -> confirma el código; recién acá se crea la cuenta.
  const confirmCode = async (e) => {
    e.preventDefault();
    setError("");
    if (code.length !== 4) {
      setError("Ingresa el código de 4 dígitos que te enviamos.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await confirmRegister({
        verificationId: verification.verificationId,
        code,
      });
      reset();
      onSuccess?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vuelve a pedir el registro con los mismos datos: el backend invalida
  // el código anterior y manda uno nuevo (ver
  // verification.service.js#createVerification), así que no hace falta
  // un endpoint aparte de "reenviar".
  const resendCode = async () => {
    setError("");
    setResendMessage("");
    setIsSubmitting(true);
    try {
      const result = await registerUser(data);
      setVerification({ verificationId: result.verificationId, email: result.email });
      setCode("");
      setResendMessage("Te enviamos un nuevo código.");
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
    verification,
    code,
    handleCodeChange,
    confirmCode,
    resendCode,
    resendMessage,
  };
}
