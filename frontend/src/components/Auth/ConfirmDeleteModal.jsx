import "./ConfirmDeleteModal.css";

// Props con default = flujo original (borrar la propia cuenta desde
// Configuración). Se pasan otros textos para reusar el mismo diseño
// en otros flujos de eliminación (p. ej. un admin borrando un cliente).
const ConfirmDeleteModal = ({
  onConfirm,
  onCancel,
  isDeleting,
  title = "¿Eliminar tu cuenta?",
  message = "Esta acción es permanente y no se puede deshacer. Perderás acceso a tu cuenta y a toda tu información.",
  confirmLabel = "Sí, eliminar mi cuenta",
  confirmingLabel = "Eliminando...",
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>{title}</h2>
        <p>{message}</p>

        <div className="modal-actions">
          <button className="cancel" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </button>
          <button className="modal-btn" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;