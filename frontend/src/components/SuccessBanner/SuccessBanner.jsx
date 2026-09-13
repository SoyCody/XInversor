import salirIcon from "../../assets/salir.png";
import "./SuccessBanner.css";

// Aviso de "acción completada" que aparece debajo del header, con un
// mismo estilo en toda la app (antes cada pantalla mostraba su propio
// texto verde suelto). Se cierra con el ícono de la esquina.
const SuccessBanner = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="success-banner-wrap">
      <div className="success-banner" role="status">
        <p>{message}</p>
        <button
          type="button"
          className="success-banner__close"
          onClick={onClose}
          aria-label="Cerrar aviso"
        >
          <img src={salirIcon} alt="" />
        </button>
      </div>
    </div>
  );
};

export default SuccessBanner;
