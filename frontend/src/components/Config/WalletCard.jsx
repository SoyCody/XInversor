import { useState } from "react";
import { updateWallet } from "../../services/clientApi.js";
import eyeIcon from "../../assets/eye.png";
import closedEyeIcon from "../../assets/closedEye.png";
import BlockedActionModal from "./BlockedActionModal.jsx";

// Muestra / edita el ID de la billetera de bitcoins. Compartido por la
// configuración del cliente y la del administrador (la wallet vive en el
// perfil de Client, que ambos tipos de cuenta tienen). El valor se
// enmascara como una contraseña y el ícono del ojo alterna la visibilidad.
// `blocked` solo lo manda la config del cliente (un admin nunca lo está).
// El aviso de éxito no se muestra aquí: se avisa al padre (`onSuccess`)
// para que lo muestre con el banner debajo del header.
const WalletCard = ({ initialWallet, onSaved, onSuccess, blocked = false }) => {
  const [value, setValue] = useState(initialWallet ?? "");
  const [visible, setVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);

  const trimmed = value.trim();
  const sinCambios = trimmed === (initialWallet ?? "").trim();

  const handleSave = async () => {
    setError(null);

    if (blocked) {
      setBlockedModalOpen(true);
      return;
    }

    if (!trimmed) {
      setError("Ingresa el ID de tu billetera");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateWallet(trimmed);
      setValue(res.wallet ?? trimmed);
      onSaved?.(res.wallet ?? trimmed);
      onSuccess?.("Billetera actualizada");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="cfg-billetera">
      <h2>Billetera</h2>
      <p className="cfg-subtitle">ID de tu billetera de bitcoins</p>

      <div className="cfg-wallet-row">
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleSave}
          disabled={isSaving || sinCambios || !trimmed}
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </button>

        <div className="cfg-wallet-input">
          <input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Aún no registrada"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            className="cfg-eye"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar billetera" : "Mostrar billetera"}
          >
            <img src={visible ? closedEyeIcon : eyeIcon} alt="" />
          </button>
        </div>
      </div>

      {error && <p className="cfg-error">{error}</p>}

      {blockedModalOpen && (
        <BlockedActionModal
          message="Tu cuenta está bloqueada: no puedes actualizar tu billetera mientras el bloqueo esté activo."
          onClose={() => setBlockedModalOpen(false)}
        />
      )}
    </section>
  );
};

export default WalletCard;
