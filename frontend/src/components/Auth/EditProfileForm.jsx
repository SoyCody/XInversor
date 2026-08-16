import { useState } from "react";
import { updateMe } from "../../services/authApi";
import "./EditProfileForm.css";

const EditProfileForm = ({ user, onCancel, onSuccess }) => {
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

  // Solo mandamos al backend los campos que realmente cambiaron
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
            setError(err.message); // apiFetch ya extrae data.error en el throw
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
    <form className="edit-profile-form" onSubmit={handleSubmit}>
      <h2>Editar información básica</h2>

      {error && <p className="edit-profile-error">{error}</p>}

      <label>
        Nombre
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
        />
      </label>

      <label>
        Apellido
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
        />
      </label>

      <label>
        Correo electrónico
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
      </label>

      <div className="edit-profile-actions">
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm;