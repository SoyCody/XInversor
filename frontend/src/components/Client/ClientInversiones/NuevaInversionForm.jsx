import { useState } from "react";
import { crearInversion } from "../../../services/investmentApi";
import "../../Auth/EditProfileForm.css";

const NuevaInversionForm = ({ onCancel, onSuccess }) => {
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
    <form className="edit-profile-form" onSubmit={handleSubmit}>
      <h2>Nueva inversión</h2>

      {error && <p className="edit-profile-error">{error}</p>}

      <label>
        Monto a invertir (USD)
        <input
          type="number"
          name="monto"
          min="1"
          step="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Ej. 100"
        />
      </label>

      <div className="edit-profile-actions">
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear inversión"}
        </button>
      </div>
    </form>
  );
};

export default NuevaInversionForm;
