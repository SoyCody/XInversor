import ConfirmActionModal from "./ConfirmActionModal.jsx";

// Confirmación para eliminar la propia cuenta desde Configuración
// (cliente o admin).
const DeleteAccountModal = ({ onClose, onConfirm, isDeleting, error }) => {
  return (
    <ConfirmActionModal
      title="Eliminar cuenta"
      subtitle="Confirmación de eliminación"
      message="¿Estás seguro de eliminar tu cuenta? Asegúrate de eliminar todos tus procesos dentro de la plataforma."
      confirmingLabel="Eliminando..."
      isBusy={isDeleting}
      error={error}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
};

export default DeleteAccountModal;
