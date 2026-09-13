import { useState } from "react";
import { crearInversion } from "../../../services/investmentApi";
import ConfigModal from "../../Config/ConfigModal.jsx";

// Mismo modal que "Editar información básica" / "Cambiar contraseña"
// (ConfigModal), en vez de reemplazar toda la pantalla por el formulario.
const NuevaInversionModal = ({ onClose, onSuccess }) => {
  const [monto, setMonto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const montoNum = Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError("Ingresa un monto válido mayor a 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const inversion = await crearInversion(montoNum);
      onSuccess?.(inversion);
    } catch (err) {
      setError(err.message); // apiFetch ya extrae data.error/message en el throw
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfigModal
      title="Nueva inversión"
      subtitle="Se crea con un período de bloqueo de 15 días"
      onClose={onClose}
    >
      <form className="config-modal__form" onSubmit={handleSubmit}>
        {error && <p className="config-modal__error">{error}</p>}

        <div className="config-modal__field">
          <label htmlFor="nueva-inversion-monto">Monto a invertir (USD)</label>
          <input
            id="nueva-inversion-monto"
            type="number"
            name="monto"
            min="1"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Ej. 100"
          />
        </div>

        <div className="config-modal__actions">
          <button
            type="button"
            className="btn btn--muted"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear inversión"}
          </button>
        </div>
      </form>
    </ConfigModal>
  );
};

export default NuevaInversionModal;
