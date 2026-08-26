import { useRef, useState } from "react";
import {
  updateMe,
  uploadAvatar,
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_SIZE_BYTES,
} from "../../services/authApi";
import "./EditProfileForm.css";

const EditProfileForm = ({ user, onCancel, onSuccess, onAvatarUpdated }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarError, setAvatarError] = useState(null);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setAvatarSuccess(false);

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Formato no permitido. Solo se aceptan imágenes PNG, JPG o WEBP");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setAvatarError("La imagen no debe superar los 2MB");
      e.target.value = "";
      return;
    }

    setAvatarFile(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setAvatarError(null);
    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(avatarFile);
      // Se mantiene "avatarPreview": ya es la foto real guardada en el
      // servidor. El "user" del padre sigue siendo el de antes de subir
      // (useFetch no refresca solo), así que volver a currentAvatarUrl
      // aquí mostraría la foto vieja.
      setAvatarFile(null);
      setAvatarSuccess(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onAvatarUpdated?.();
    } catch (err) {
      setAvatarError(err.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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
      <h2>Foto de perfil</h2>

      <div className="edit-avatar-section">

        <div className="edit-avatar-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_AVATAR_TYPES.join(",")}
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={handleAvatarUpload}
            disabled={!avatarFile || isUploadingAvatar}
          >
            {isUploadingAvatar ? "Subiendo..." : "Cambiar foto"}
          </button>
        </div>
        {avatarError && <p className="edit-profile-error">{avatarError}</p>}
        {avatarSuccess && !avatarError && (
          <p className="edit-avatar-success">Foto de perfil actualizada</p>
        )}
      </div>

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