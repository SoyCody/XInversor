import "./ConfirmDeleteModal.css";

const ConfirmDeleteModal = ({ onConfirm, onCancel, isDeleting }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>¿Eliminar tu cuenta?</h2>
        <p>
          Esta acción es permanente y no se puede deshacer. Perderás acceso a
          tu cuenta y a toda tu información.
        </p>

        <div className="modal-actions">
          <button className="cancel" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </button>
          <button className="modal-btn" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Eliminando..." : "Sí, eliminar mi cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;