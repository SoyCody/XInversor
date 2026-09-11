import { useState } from "react";
import { changePassword } from "../../services/authApi.js";
import ConfigModal from "./ConfigModal.jsx";

// Cambiar la contraseña de la cuenta autenticada (cliente o admin).
const ChangePasswordModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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
      await changePassword({ password: formData.password });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (done) {
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

  return (
    <ConfigModal
      title="Cambiar contraseña"
      subtitle="Tu cambio será registrado en un instante"
      onClose={onClose}
    >
      <form className="config-modal__form" onSubmit={handleSubmit}>
        {error && <p className="config-modal__error">{error}</p>}

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
            {isSubmitting ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </form>
    </ConfigModal>
  );
};

export default ChangePasswordModal;
