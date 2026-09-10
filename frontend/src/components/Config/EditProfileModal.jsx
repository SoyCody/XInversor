import { useState } from "react";
import { updateMe } from "../../services/authApi";
import ConfigModal from "./ConfigModal.jsx";

// Editar información básica (nombres, apellidos, correo). La foto se
// cambia desde la propia pantalla de Configuración, no aquí.
const EditProfileModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Solo mandamos al backend los campos que realmente cambiaron.
  const getChangedFields = () => {
    const changed = {};
    if (formData.firstName !== user.firstName) changed.firstName = formData.firstName;
    if (formData.lastName !== user.lastName) changed.lastName = formData.lastName;
    if (formData.email !== user.email) changed.email = formData.email;
    return changed;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const changedFields = getChangedFields();
    if (Object.keys(changedFields).length === 0) {
      setError("No hiciste ningún cambio");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await updateMe(changedFields);
      onSuccess?.(updatedUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfigModal
      title="Editar información básica"
      subtitle="Tu cambio será registrado en un instante"
      onClose={onClose}
    >
      <form className="config-modal__form" onSubmit={handleSubmit}>
        {error && <p className="config-modal__error">{error}</p>}

        <div className="config-modal__field">
          <label htmlFor="cfg-edit-firstName">Nombres</label>
          <input
            id="cfg-edit-firstName"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
        </div>

        <div className="config-modal__field">
          <label htmlFor="cfg-edit-lastName">Apellidos</label>
          <input
            id="cfg-edit-lastName"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>

        <div className="config-modal__field">
          <label htmlFor="cfg-edit-email">Correo electrónico</label>
          <input
            id="cfg-edit-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="config-modal__actions">
          <button
            type="button"
            className="config-modal__btn config-modal__btn--ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Descartar
          </button>
          <button
            type="submit"
            className="config-modal__btn config-modal__btn--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </form>
    </ConfigModal>
  );
};

export default EditProfileModal;
