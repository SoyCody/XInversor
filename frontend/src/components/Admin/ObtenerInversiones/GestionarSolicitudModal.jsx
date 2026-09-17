import ConfigModal from "../../Config/ConfigModal.jsx";

// Primer paso al gestionar una solicitud pendiente: elegir si se aprueba
// o se rechaza (mismo modal base que bloquear cliente / eliminar cuenta,
// pero con dos acciones en vez de un solo Confirmar). Rechazar se aplica
// directo desde acá; aprobar no -- ese paso solo avisa al padre
// (VerInversionAdmin), que abre un segundo modal de confirmación antes de
// llamar al backend. Genérico a propósito: lo usan tanto una solicitud
// de retiro (monto + intereses de una inversión EN_PROGRESO) como un
// paquete recién creado (monto de una inversión PENDIENTE) -- el padre
// decide el texto, este modal solo pone el layout y las dos acciones.
const GestionarSolicitudModal = ({
  title = "Gestionar solicitud de retiro",
  subtitle = "Aprobar o rechazar",
  message,
  isBusy = false,
  error,
  onClose,
  onReject,
  onApprove,
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
            onClick={onReject}
            disabled={isBusy}
          >
            {isBusy ? "Procesando..." : "Rechazar"}
          </button>
          <button
            type="button"
            className="btn btn--muted"
            onClick={onClose}
            disabled={isBusy}
          >
            Volver
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onApprove}
            disabled={isBusy}
          >
            Aprobar
          </button>
        </div>
      </div>
    </ConfigModal>
  );
};

export default GestionarSolicitudModal;
