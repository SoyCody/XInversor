import { useNavigate } from "react-router-dom";
import ConfirmActionModal from "../../Config/ConfirmActionModal.jsx";

// Aviso del inicio del cliente mientras no tenga la wallet registrada:
// sin ella no puede crear su primera inversión (el backend ya lo exige).
// "Luego" solo cierra el aviso -- como no persiste nada, vuelve a
// aparecer en la próxima visita si la wallet sigue sin registrarse.
// "Registrar" lleva a Configuración, donde está el campo de billetera.
const WelcomeWalletModal = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <ConfirmActionModal
      title="Bienvenido!!"
      subtitle="La mejor plataforma para tus inversiones."
      message="Para empezar con tu primera inversión deberás registrar el identificativo de tu billetera de criptomonedas."
      cancelLabel="Luego"
      confirmLabel="Registrar"
      onClose={onClose}
      onConfirm={() => navigate("/client/me")}
    />
  );
};

export default WelcomeWalletModal;
