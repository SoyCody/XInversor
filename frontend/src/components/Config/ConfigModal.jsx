import { useEffect } from "react";
import "./ConfigModal.css";

// Contenedor del modal de configuración: overlay + tarjeta con cabecera
// amarilla (título + subtítulo) y un cuerpo blanco. El contenido (el
// formulario y sus botones) lo pone quien lo usa. El fondo que se ve por
// detrás es el que estuviera en pantalla al abrirlo.
const ConfigModal = ({ title, subtitle, onClose, children }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="config-modal-overlay" onMouseDown={onClose}>
      <div
        className="config-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="config-modal__header">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </header>

        <div className="config-modal__body">{children}</div>
      </div>
    </div>
  );
};

export default ConfigModal;
