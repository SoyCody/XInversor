import ConfigModal from "./ConfigModal.jsx";

// Aviso genérico para cualquier acción restringida a clientes bloqueados
// (nueva inversión, editar perfil, cambiar contraseña, avatar, wallet,
// solicitudes de retiro, etc.). Un solo botón: no hay nada que
// confirmar, solo cerrar el aviso.
const BlockedActionModal = ({
  onClose,
  title = "Cuenta bloqueada",
  message = "Tu cuenta está bloqueada y no puedes realizar esta acción mientras el bloqueo esté activo. Si crees que se trata de un error, comunícate con soporte.",
}) => {
  return (
    <ConfigModal title={title} subtitle="Acción no disponible" onClose={onClose}>
      <div className="config-modal__form">
        <p className="config-modal__text">{message}</p>

        <div className="config-modal__actions">
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </ConfigModal>
  );
};

export default BlockedActionModal;
