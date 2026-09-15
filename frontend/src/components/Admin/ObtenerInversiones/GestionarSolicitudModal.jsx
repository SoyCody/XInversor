import ConfigModal from "../../Config/ConfigModal.jsx";

// Primer paso al gestionar una solicitud de retiro pendiente: elegir si
// se aprueba o se rechaza (mismo modal base que bloquear cliente /
// eliminar cuenta, pero con dos acciones en vez de un solo Confirmar).
// Rechazar se aplica directo desde acá; aprobar no -- ese paso solo
// avisa al padre (VerInversionAdmin), que abre un segundo modal de
// confirmación antes de llamar al backend.
const GestionarSolicitudModal = ({
  monto,
  isBusy = false,
  error,
  onClose,
  onReject,
  onApprove,
}) => {
  return (
    <ConfigModal
      title="Gestionar solicitud de retiro"
      subtitle="Aprobar o rechazar"
      onClose={isBusy ? undefined : onClose}
    >
      <div className="config-modal__form">
        <p className="config-modal__text">
          Solicitud de retiro por {monto}. Elige si la apruebas o la rechazas.
        </p>

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
