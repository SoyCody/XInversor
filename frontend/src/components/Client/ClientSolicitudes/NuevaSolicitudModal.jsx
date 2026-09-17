import { useState } from "react";
import { crearSolicitud } from "../../../services/investmentApi";
import ConfigModal from "../../Config/ConfigModal.jsx";

// Domingo (0) o sábado (6): el backend rechaza la solicitud igual, esto
// solo evita que el cliente la intente y se encuentre con el error recién
// al enviar.
const esFinDeSemana = () => [0, 6].includes(new Date().getDay());

// Mismo modal que "Editar información básica" / "Cambiar contraseña"
// (ConfigModal), en vez de un formulario inline propio.
const NuevaSolicitudModal = ({ inversionId, disponible, onClose, onSuccess }) => {
  const [montoRetiro, setMonto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const finDeSemana = esFinDeSemana();

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
    <ConfigModal
      title="Nueva solicitud de retiro"
      subtitle="Un administrador revisará tu solicitud"
      onClose={onClose}
    >
      <form className="config-modal__form" onSubmit={handleSubmit}>
        {finDeSemana && (
          <p className="config-modal__warning">
            No se pueden solicitar retiros los fines de semana. Podrás enviarla el próximo día hábil.
          </p>
        )}

        {error && <p className="config-modal__error">{error}</p>}

        <div className="config-modal__field">
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
          <p className="config-modal__text">Disponible: {disponible}</p>
        )}

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
            {isSubmitting ? "Enviando..." : "Solicitar"}
          </button>
        </div>
      </form>
    </ConfigModal>
  );
};

export default NuevaSolicitudModal;
