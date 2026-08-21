import "./ConfirmAdministracion.css";

const ConfirmAdministrationModal = ({ onConfirm, onCancel, isPromoting }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Otorgar permisos a esta cuenta?</h2>
        <p>
          Esta acción es permanente y no se puede deshacer. Este nuevo administrador también
          podrá supervisar la plataforma.
        </p>

        <div className="modal-actions">
          <button className="cancel" onClick={onCancel} disabled={isPromoting}>
            Cancelar
          </button>
          <button className="modal-btn" onClick={onConfirm} disabled={isPromoting}>
            {isPromoting ? "Procesando..." : "Sí, asignar esta cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAdministrationModal;