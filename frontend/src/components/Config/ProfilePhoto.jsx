import { useRef, useState } from "react";
import {
  uploadAvatar,
  getAvatarUrl,
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_SIZE_BYTES,
} from "../../services/authApi.js";

// Foto de perfil + selector de archivo + botón "Cambiar foto".
// Compartido por la configuración del cliente y la del administrador.
const ProfilePhoto = ({ user, roleLabel, onUpdated }) => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [broken, setBroken] = useState(false);

  const handleChange = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setError(null);
    setSuccess(false);

    if (!ALLOWED_AVATAR_TYPES.includes(picked.type)) {
      setError("Formato no permitido. Solo se aceptan imágenes PNG, JPG o WEBP");
      e.target.value = "";
      return;
    }
    if (picked.size > MAX_AVATAR_SIZE_BYTES) {
      setError("La imagen no debe superar los 2MB");
      e.target.value = "";
      return;
    }

    setFile(picked);
  };

  const handleUpload = async () => {
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      await uploadAvatar(file);
      setFile(null);
      setSuccess(true);
      setBroken(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUpdated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="cfg-foto">
      <div className="cfg-foto-circle">
        <span
          className={`role-badge role-badge--${(user?.role ?? "client").toLowerCase()}`}
        >
          {roleLabel}
        </span>

        {broken || !user?.id ? (
          <div className="cfg-foto-ph" />
        ) : (
          <img
            src={getAvatarUrl(user.id, user.avatarUpdatedAt)}
            alt="Foto de perfil"
            onError={() => setBroken(true)}
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        className="cfg-file-native"
        type="file"
        accept={ALLOWED_AVATAR_TYPES.join(",")}
        onChange={handleChange}
      />
      <div className="cfg-filepicker">
        <button
          type="button"
          className="cfg-filepicker__btn"
          onClick={() => fileInputRef.current?.click()}
        >
          Seleccionar archivo
        </button>
        <span className="cfg-filepicker__divider" aria-hidden="true" />
        <span className="cfg-filepicker__status" title={file?.name}>
          {file?.name ?? "Ningún archivo seleccionado"}
        </span>
      </div>

      <button
        type="button"
        className="btn btn--primary"
        onClick={handleUpload}
        disabled={!file || isUploading}
      >
        {isUploading ? "Subiendo..." : "Cambiar foto"}
      </button>

      {error && <p className="cfg-error">{error}</p>}
      {success && !error && (
        <p className="cfg-success">Foto de perfil actualizada</p>
      )}
    </div>
  );
};

export default ProfilePhoto;
