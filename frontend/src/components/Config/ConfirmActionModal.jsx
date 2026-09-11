import ConfigModal from "./ConfigModal.jsx";

// Diálogo de confirmación genérico con el estilo de los modales de la
// sección (cabecera amarilla + botón gris/azul centrados).
// Lo usan: eliminar la cuenta propia, bloquear/desbloquear un cliente,
// ascender a administrador, y el aviso de "registra tu wallet" del inicio.
const ConfirmActionModal = ({
  title,
  subtitle,
  message,
  cancelLabel = "Descartar",
  confirmLabel = "Confirmar",
  confirmingLabel = "Procesando...",
  isBusy = false,
  error,
  onClose,
  onConfirm,
}) => {
  return (
    <ConfigModal
      title={title}
      subtitle={subtitle}
      onClose={isBusy ? undefined : onClose}
    >
      <div className="config-modal__form">
        <p className="config-modal__text">{message}</p>

        {error && <p className="config-modal__error">{error}</p>}

        <div className="config-modal__actions">
          <button
            type="button"
            className="btn btn--muted"
            onClick={onClose}
            disabled={isBusy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </ConfigModal>
  );
};

export default ConfirmActionModal;
