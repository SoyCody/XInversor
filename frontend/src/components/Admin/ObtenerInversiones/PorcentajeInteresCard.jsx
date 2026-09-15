import { useState } from "react";
import { actualizarPorcentajeInteres } from "../../../services/investmentApi.js";
import ConfirmActionModal from "../../Config/ConfirmActionModal.jsx";
import "../../Config/config.css";

// Porcentaje de intereses aplicado a las inversiones nuevas (ver
// investment.service.js#newInvestment). Mismo patrón visual que
// WalletCard (título + subtítulo + fila input/botón) y misma
// confirmación que bloquear un cliente o eliminar la cuenta: el cambio
// no se aplica hasta confirmar en el modal. El aviso de éxito no se
// muestra aquí: se avisa al padre (`onSuccess`) para que lo muestre con
// el banner debajo del header.
const PorcentajeInteresCard = ({ onSuccess }) => {
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const trimmed = value.trim();

  const handleGuardarClick = () => {
    setError(null);

    const numero = Number(trimmed);
    if (!trimmed || !Number.isFinite(numero) || numero <= 0 || numero > 1) {
      setError("Ingresa un porcentaje válido, mayor a 0 y menor o igual a 1 (ej: 0.10)");
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await actualizarPorcentajeInteres(Number(trimmed));
      setIsConfirmOpen(false);
      setValue("");
      onSuccess?.("Porcentaje de intereses actualizado");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="cfg-billetera admin-section-gap">
      <h2>Porcentaje para intereses</h2>
      <p className="cfg-subtitle">Valor de porcentaje de generación de intereses</p>

      <div className="cfg-wallet-row">
        <div className="cfg-wallet-input cfg-percent-input">
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ej: 0.10"
            autoComplete="off"
          />
        </div>

        <button
          type="button"
          className="btn btn--primary"
          onClick={handleGuardarClick}
        >
          Guardar
        </button>
      </div>

      {error && !isConfirmOpen && <p className="cfg-error">{error}</p>}

      {isConfirmOpen && (
        <ConfirmActionModal
          title="Cambiar porcentaje de intereses"
          subtitle="Confirmación de cambio"
          message={`¿Estás seguro de cambiar el porcentaje de generación de intereses a ${trimmed}? Se aplicará a las inversiones nuevas.`}
          confirmingLabel="Guardando..."
          isBusy={isSaving}
          error={error}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </section>
  );
};

export default PorcentajeInteresCard;
