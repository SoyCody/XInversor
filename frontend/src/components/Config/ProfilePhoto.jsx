import { useRef, useState } from "react";
import {
  uploadAvatar,
  getAvatarUrl,
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_SIZE_BYTES,
} from "../../services/authApi.js";
import BlockedActionModal from "./BlockedActionModal.jsx";

// Foto de perfil + selector de archivo + botón "Cambiar foto".
// Compartido por la configuración del cliente y la del administrador.
// `blocked` solo lo manda la config del cliente (un admin nunca lo está).
// El aviso de éxito no se muestra aquí: se avisa al padre (`onSuccess`)
// para que lo muestre con el banner debajo del header.
const ProfilePhoto = ({ user, roleLabel, onUpdated, onSuccess, blocked = false }) => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [broken, setBroken] = useState(false);
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);

  const handleChange = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setError(null);

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

    if (blocked) {
      setBlockedModalOpen(true);
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      await uploadAvatar(file);
      setFile(null);
      setBroken(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUpdated?.();
      onSuccess?.("Foto de perfil actualizada");
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

      {blockedModalOpen && (
        <BlockedActionModal
          message="Tu cuenta está bloqueada: no puedes cambiar tu foto de perfil mientras el bloqueo esté activo."
          onClose={() => setBlockedModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfilePhoto;
