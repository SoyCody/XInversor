import { useState } from "react";
import { updateWallet } from "../../services/clientApi.js";
import eyeIcon from "../../assets/eye.png";
import closedEyeIcon from "../../assets/closedEye.png";

// Muestra / edita el ID de la billetera de bitcoins. Compartido por la
// configuración del cliente y la del administrador (la wallet vive en el
// perfil de Client, que ambos tipos de cuenta tienen). El valor se
// enmascara como una contraseña y el ícono del ojo alterna la visibilidad.
const WalletCard = ({ initialWallet, onSaved }) => {
  const [value, setValue] = useState(initialWallet ?? "");
  const [visible, setVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const trimmed = value.trim();
  const sinCambios = trimmed === (initialWallet ?? "").trim();

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    if (!trimmed) {
      setError("Ingresa el ID de tu billetera");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateWallet(trimmed);
      setValue(res.wallet ?? trimmed);
      setSuccess(true);
      onSaved?.(res.wallet ?? trimmed);
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
          className="cfg-btn cfg-btn--primary"
          onClick={handleSave}
          disabled={isSaving || sinCambios || !trimmed}
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </button>

        <div className="cfg-wallet-input">
          <input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSuccess(false);
            }}
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
      {success && !error && <p className="cfg-success">Billetera actualizada</p>}
    </section>
  );
};

export default WalletCard;
