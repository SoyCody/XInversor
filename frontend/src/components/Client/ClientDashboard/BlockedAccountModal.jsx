import ConfigModal from "../../Config/ConfigModal.jsx";

// Se muestra siempre que un cliente bloqueado entra a su cuenta (inicio).
// Solo informa: sigue pudiendo consultar su información, pero no operar
// mientras el bloqueo esté activo.
const BlockedAccountModal = ({ onClose }) => {
  return (
    <ConfigModal title="Cuenta bloqueada" subtitle="Acceso restringido" onClose={onClose}>
      <div className="config-modal__form">
        <p className="config-modal__text">
          Un administrador ha bloqueado tu cuenta. Puedes seguir consultando tu
          información, pero no podrás crear inversiones, solicitar retiros ni
          editar tus datos mientras el bloqueo esté activo. Si crees que se
          trata de un error, comunícate con soporte.
        </p>

        <div className="config-modal__actions">
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </ConfigModal>
  );
};

export default BlockedAccountModal;
