import { useState } from "react";
import { crearInversion } from "../../../services/investmentApi";
import ConfigModal from "../../Config/ConfigModal.jsx";
import ConfirmActionModal from "../../Config/ConfirmActionModal.jsx";
import "./NuevoPaqueteModal.css";

import fx500 from "../../../assets/packages/fx-500.png";
import fx1000 from "../../../assets/packages/fx-1000.png";
import fx2000 from "../../../assets/packages/fx-2000.png";
import fx3000 from "../../../assets/packages/fx-3000.png";
import fx4000 from "../../../assets/packages/fx-4000.png";
import fx5000 from "../../../assets/packages/fx-5000.png";
import fx6000 from "../../../assets/packages/fx-6000.png";
import fx7000 from "../../../assets/packages/fx-7000.png";
import fx8000 from "../../../assets/packages/fx-8000.png";
import fx9000 from "../../../assets/packages/fx-9000.png";

// El monto de cada paquete ya se maneja en BTC (antes era USD).
const PAQUETES = [
  { monto: 500, icon: fx500 },
  { monto: 1000, icon: fx1000 },
  { monto: 2000, icon: fx2000 },
  { monto: 3000, icon: fx3000 },
  { monto: 4000, icon: fx4000 },
  { monto: 5000, icon: fx5000 },
  { monto: 6000, icon: fx6000 },
  { monto: 7000, icon: fx7000 },
  { monto: 8000, icon: fx8000 },
  { monto: 9000, icon: fx9000 },
];

// Mismo modal que "Editar información básica" / "Cambiar contraseña"
// (ConfigModal), con la variante ancha para la grilla de paquetes.
// Flujo de dos pasos: elegir el paquete y confirmar la selección
// (ConfirmActionModal), igual que aprobar un retiro o terminar una
// inversión desde el panel de administración.
const NuevoPaqueteModal = ({ onClose, onSuccess }) => {
  const [seleccionado, setSeleccionado] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirmar = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const inversion = await crearInversion(seleccionado.monto);
      onSuccess?.(inversion);
    } catch (err) {
      setError(err.message); // apiFetch ya extrae data.error/message en el throw
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmando) {
    return (
      <ConfirmActionModal
        title="Confirmar paquete"
        subtitle="Confirmación de la solicitud"
        message={`¿Confirmas la selección del paquete FX - ${seleccionado.monto} (${seleccionado.monto} BTC)? El administrador deberá aprobar o rechazar la solicitud.`}
        confirmingLabel="Enviando..."
        isBusy={isSubmitting}
        error={error}
        onClose={() => {
          if (isSubmitting) return;
          setConfirmando(false);
        }}
        onConfirm={handleConfirmar}
      />
    );
  }

  return (
    <ConfigModal
      title="Nuevo paquete"
      subtitle="Elige cuánto invertir"
      onClose={onClose}
      className="config-modal--wide"
    >
      <div className="config-modal__form">
        <p className="config-modal__text">
          Elige el paquete que desees invertir, el administrador aprobará o
          rechazará tu solicitud.
        </p>

        <div className="package-grid">
          {PAQUETES.map((paquete) => (
            <button
              key={paquete.monto}
              type="button"
              className={`package-option ${
                seleccionado?.monto === paquete.monto ? "is-selected" : ""
              }`}
              onClick={() => setSeleccionado(paquete)}
            >
              <img src={paquete.icon} alt={`Paquete FX - ${paquete.monto}`} />
            </button>
          ))}
        </div>

        <div className="config-modal__actions">
          <button type="button" className="btn btn--muted" onClick={onClose}>
            Descartar
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!seleccionado}
            onClick={() => setConfirmando(true)}
          >
            Confirmar
          </button>
        </div>
      </div>
    </ConfigModal>
  );
};

export default NuevoPaqueteModal;
