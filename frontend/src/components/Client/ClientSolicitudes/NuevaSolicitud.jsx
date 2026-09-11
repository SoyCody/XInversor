import { useState } from "react";
import { crearSolicitud } from "../../../services/investmentApi";

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
    <form className="section-form" onSubmit={handleSubmit}>
      <h2>Nueva solicitud de retiro</h2>

      {error && <p className="form-error">{error}</p>}

      <div className="field">
        <label htmlFor="nueva-solicitud-monto">Monto a retirar (BTC)</label>
        <input
          id="nueva-solicitud-monto"
          type="number"
          name="montoRetiro"
          min="0"
          step="0.00000001"
          value={montoRetiro}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Ej. 0.05"
        />
      </div>

      {disponible != null && (
        <p className="form-meta">Disponible: {disponible}</p>
      )}

      <div className="form-actions section-actions">
        <button
          type="button"
          className="btn btn--muted"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Solicitar"}
        </button>
      </div>
    </form>
  );
};

export default NuevaSolicitudForm;
