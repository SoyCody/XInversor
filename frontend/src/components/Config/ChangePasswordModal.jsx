import { useState } from "react";
import { changePassword, confirmPasswordChange } from "../../services/authApi.js";
import ConfigModal from "./ConfigModal.jsx";

// Cambiar la contraseña de la cuenta autenticada (cliente o admin), en
// dos pasos: 1) valida la contraseña actual y dispara un código de 4
// dígitos al correo ya registrado (ver authApi.js#changePassword); 2) el
// cambio recién se aplica al confirmar ese código
// (authApi.js#confirmPasswordChange). Nada cambia hasta ese paso 2.
const ChangePasswordModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [code, setCode] = useState("");
  // "form" (pedir contraseñas) -> "code" (pedir el código) -> "done"
  const [stage, setStage] = useState("form");
  const [verificationId, setVerificationId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [resendMessage, setResendMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value.replace(/\D/g, "").slice(0, 4));
  };

  const requestCode = async () => {
    const result = await changePassword({
      currentPassword: formData.currentPassword,
      password: formData.password,
    });
    setVerificationId(result.verificationId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.currentPassword) {
      setError("La contraseña actual es obligatoria");
      return;
    }
    if (!formData.password) {
      setError("La contraseña es obligatoria");
      return;
    }
    if (formData.password.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestCode();
      setStage("code");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCode = async (e) => {
    e.preventDefault();
    setError(null);

    if (code.length !== 4) {
      setError("Ingresa el código de 4 dígitos que te enviamos.");
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordChange({ verificationId, code });
      setStage("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setResendMessage("");
    setIsSubmitting(true);
    try {
      await requestCode();
      setCode("");
      setResendMessage("Te enviamos un nuevo código.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stage === "done") {
    return (
      <ConfigModal
        title="Cambiar contraseña"
        subtitle="Tu cambio fue registrado"
        onClose={onClose}
      >
        <div className="config-modal__form">
          <p className="config-modal__success">Tu contraseña fue actualizada.</p>
          <div className="config-modal__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={onClose}
            >
              Listo
            </button>
          </div>
        </div>
      </ConfigModal>
    );
  }

  if (stage === "code") {
    return (
      <ConfigModal
        title="Cambiar contraseña"
        subtitle="Verifica tu correo para confirmar el cambio"
        onClose={onClose}
      >
        <form className="config-modal__form" onSubmit={handleConfirmCode}>
          <p className="config-modal__text">
            Te enviamos un código de 4 dígitos a tu correo. Ingrésalo para
            confirmar el cambio de contraseña.
          </p>

          {error && <p className="config-modal__error">{error}</p>}
          {resendMessage && !error && (
            <p className="config-modal__success">{resendMessage}</p>
          )}

          <div className="config-modal__field">
            <label htmlFor="cfg-pwd-code">Código de verificación</label>
            <input
              id="cfg-pwd-code"
              className="config-modal__code-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              placeholder="0000"
              value={code}
              onChange={handleCodeChange}
            />
          </div>

          <button
            type="button"
            className="config-modal__link-btn"
            onClick={handleResendCode}
            disabled={isSubmitting}
          >
            ¿No te llegó el código? Reenviar
          </button>

          <div className="config-modal__actions">
            <button
              type="button"
              className="btn btn--muted"
              onClick={() => setStage("form")}
              disabled={isSubmitting}
            >
              Atrás
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verificando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </ConfigModal>
    );
  }

  return (
    <ConfigModal
      title="Cambiar contraseña"
      subtitle="Te enviaremos un código para confirmarlo"
      onClose={onClose}
    >
      <form className="config-modal__form" onSubmit={handleSubmit}>
        {error && <p className="config-modal__error">{error}</p>}

        <div className="config-modal__field">
          <label htmlFor="cfg-pwd-current">Contraseña actual</label>
          <input
            id="cfg-pwd-current"
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="Tu contraseña actual"
            autoComplete="current-password"
          />
        </div>

        <div className="config-modal__field">
          <label htmlFor="cfg-pwd-new">Nueva contraseña</label>
          <input
            id="cfg-pwd-new"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />
        </div>

        <div className="config-modal__field">
          <label htmlFor="cfg-pwd-confirm">Confirmar nueva contraseña</label>
          <input
            id="cfg-pwd-confirm"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Repite la contraseña"
            autoComplete="new-password"
          />
        </div>

        <div className="config-modal__actions">
          <button
            type="button"
            className="btn btn--muted"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Descartar
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando código..." : "Continuar"}
          </button>
        </div>
      </form>
    </ConfigModal>
  );
};

export default ChangePasswordModal;
