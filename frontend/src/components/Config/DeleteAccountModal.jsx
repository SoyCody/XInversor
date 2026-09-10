import ConfigModal from "./ConfigModal.jsx";

// Confirmación para eliminar la propia cuenta desde Configuración
// (cliente o admin). Mismo estilo que el resto de modales de la sección.
const DeleteAccountModal = ({ onClose, onConfirm, isDeleting, error }) => {
  return (
    <ConfigModal
      title="Eliminar cuenta"
      subtitle="Confirmación de eliminación"
      onClose={isDeleting ? undefined : onClose}
    >
      <div className="config-modal__form">
        <p className="config-modal__text">
          ¿Estás seguro de eliminar tu cuenta? Asegúrate de eliminar todos tus
          procesos dentro de la plataforma.
        </p>

        {error && <p className="config-modal__error">{error}</p>}

        <div className="config-modal__actions">
          <button
            type="button"
            className="config-modal__btn config-modal__btn--ghost"
            onClick={onClose}
            disabled={isDeleting}
          >
            Descartar
          </button>
          <button
            type="button"
            className="config-modal__btn config-modal__btn--primary"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </ConfigModal>
  );
};

export default DeleteAccountModal;
