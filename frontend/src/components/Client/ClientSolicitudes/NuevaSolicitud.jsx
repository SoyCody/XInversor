import { useState } from "react";
import { crearSolicitud } from "../../../services/investmentApi";
import "../../Auth/EditProfileForm.css";

const NuevaSolicitudForm = ({ inversionId, disponible, onCancel, onSuccess }) => {
  const [montoRetiro, setMonto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const montoNum = Number(montoRetiro);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError("Ingresa un monto válido mayor a 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const solicitud = await crearSolicitud(inversionId, montoNum);
      onSuccess?.(solicitud);
    } catch (err) {
      setError(err.message); // apiFetch ya extrae data.error/message en el throw
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="edit-profile-form" onSubmit={handleSubmit}>
      <h2>Nueva solicitud de retiro</h2>

      {error && <p className="edit-profile-error">{error}</p>}

      <label>
        Monto a retirar (BTC)
        <input
          type="number"
          name="montoRetiro"
          min="0"
          step="0.00000001"
          value={montoRetiro}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Ej. 0.05"
        />
      </label>

      {disponible != null && (
        <p style={{ color: "#9a9a9a", fontSize: "0.85rem", margin: "4px 0 0" }}>
          Disponible: {disponible}
        </p>
      )}

      <div className="edit-profile-actions">
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Solicitar"}
        </button>
      </div>
    </form>
  );
};

export default NuevaSolicitudForm;
